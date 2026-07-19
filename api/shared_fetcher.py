#!/usr/bin/env python3
"""
共享账号抓取逻辑
开源版本只保留 ids.ailiao.eu 公开数据源。
"""

from __future__ import annotations

import json
import re
import ssl
import time
import urllib.error
import urllib.request
from datetime import datetime
from typing import Dict, Iterable, List, Optional, Set

ssl._create_default_https_context = ssl._create_unverified_context

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

CACHE_DURATION = 1800
AILIAO_ORIGIN = 'https://ids.ailiao.eu'
MAX_SHA_LINKS = 10

SCRIPT_SRC_REGEX = re.compile(
    r'<script[^>]+type=["\']module["\'][^>]+src=["\']([^"\']*assets/index-[^"\']+\.js)["\']',
    re.I,
)
URL_REGEX = re.compile(
    r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
)
AD_PATTERNS = [
    re.compile(r"const\s+ad\s*=\s*'([^']+)'", re.S),
    re.compile(r"var\s+ad\s*=\s*'([^']+)'", re.S),
    re.compile(r"ad\s*=\s*'([^']+)'", re.S),
    re.compile(r'const\s+ad\s*=\s*"([^"]+)"', re.S),
    re.compile(r'var\s+ad\s*=\s*"([^"]+)"', re.S),
]


class FetchAccountsError(RuntimeError):
    pass


def _fetch_text(url: str, timeout: int = 15, extra_headers: Optional[Dict[str, str]] = None) -> Optional[str]:
    headers = dict(HEADERS)
    if extra_headers:
        headers.update(extra_headers)

    request = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            charset = response.headers.get_content_charset() or 'utf-8'
            return response.read().decode(charset, errors='ignore')
    except (urllib.error.URLError, TimeoutError, ValueError):
        return None


def _resolve_main_js_url(origin: str) -> str:
    index_html = _fetch_text(f'{origin}/')
    if not index_html:
        raise FetchAccountsError(f'无法获取上游站点首页: {origin}')

    script_match = SCRIPT_SRC_REGEX.search(index_html)
    if not script_match:
        raise FetchAccountsError(f'未找到主文件入口: {origin}')

    return urllib.parse.urljoin(f'{origin}/', script_match.group(1))


def _normalize_status(status_value) -> bool:
    if isinstance(status_value, int):
      return status_value != 2

    if isinstance(status_value, str):
        return '异常' not in status_value

    return True


def _to_datetime(value) -> Optional[datetime]:
    if value in (None, '', 0, '0'):
        return None

    text = str(value).strip()
    if not text:
        return None

    if text.isdigit():
        timestamp = int(text)
        if timestamp > 10**12:
            timestamp = timestamp / 1000
        return datetime.fromtimestamp(timestamp)

    for pattern in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d'):
        try:
            return datetime.strptime(text, pattern)
        except ValueError:
            continue

    return None


def _format_time(value) -> str:
    if value in (None, '', 0, '0'):
        return '未知'

    parsed = _to_datetime(value)
    if not parsed:
        return str(value)

    diff = (datetime.now() - parsed).total_seconds()
    minutes = int(diff / 60)
    hours = int(diff / 3600)
    days = int(diff / 86400)

    if minutes < 1:
        return '刚刚'
    if minutes < 60:
        return f'{minutes}分钟前'
    if hours < 24:
        return f'{hours}小时前'
    if days < 30:
        return f'{days}天前'

    return parsed.strftime('%Y-%m-%d')


def _normalize_account(item, source: str):
    if not isinstance(item, dict):
        return None

    username = str(item.get('email') or item.get('username') or item.get('u') or '').strip()
    password = str(item.get('password') or item.get('p') or '').strip()

    if not username or username == '暂无可用账号' or not password:
        return None

    if not _normalize_status(item.get('status')):
        return None

    raw_time = item.get('time')
    if raw_time is None:
        raw_time = item.get('t')

    return {
        'id': f'{source}:{username}',
        'username': username,
        'password': password,
        'updateTime': _format_time(raw_time),
        'isAvailable': True,
    }


def _append_unique_accounts(target: List[dict], seen_usernames: Set[str], accounts: Iterable[dict]) -> None:
    for account in accounts:
        username = account.get('username')
        if not username or username in seen_usernames:
            continue

        seen_usernames.add(username)
        target.append(account)


def _extract_ad_data(html: str) -> Optional[str]:
    for pattern in AD_PATTERNS:
        match = pattern.search(html)
        if match and '[' in match.group(1):
            return match.group(1)
    return None


def _fetch_ailiao_accounts() -> List[dict]:
    main_js_url = _resolve_main_js_url(AILIAO_ORIGIN)
    js_content = _fetch_text(main_js_url)
    if not js_content:
        raise FetchAccountsError('无法获取 ailiao 主文件')

    sha_links = []
    seen_links = set()
    for link in URL_REGEX.findall(js_content):
        if 'sha' not in link or link in seen_links:
            continue
        seen_links.add(link)
        sha_links.append(link)
        if len(sha_links) >= MAX_SHA_LINKS:
            break

    if not sha_links:
        raise FetchAccountsError('未找到 ailiao SHA 数据源')

    accounts: List[dict] = []
    seen_usernames: Set[str] = set()

    for link in sha_links:
        content = _fetch_text(link, timeout=10)
        if not content:
            continue

        ad_data = _extract_ad_data(content)
        if not ad_data:
            continue

        try:
            parsed = json.loads(ad_data)
        except json.JSONDecodeError:
            continue

        if not isinstance(parsed, list):
            continue

        for item in parsed:
            normalized = _normalize_account(item, urllib.parse.urlparse(link).hostname or 'ids.ailiao.eu')
            if normalized:
                _append_unique_accounts(accounts, seen_usernames, [normalized])

    return accounts


def fetch_accounts_payload():
    merged_accounts: List[dict] = []
    seen_usernames: Set[str] = set()
    errors: List[str] = []

    try:
        _append_unique_accounts(merged_accounts, seen_usernames, _fetch_ailiao_accounts())
    except Exception as exc:
        errors.append(f'ids.ailiao.eu: {exc}')

    if not merged_accounts:
        raise FetchAccountsError(errors[0] if errors else '未获取到有效账号')

    return {
        'accounts': merged_accounts,
        'count': len(merged_accounts),
        'lastUpdate': int(time.time()),
    }
