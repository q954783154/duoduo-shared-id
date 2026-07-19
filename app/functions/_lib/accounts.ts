export interface Account {
  id: string;
  source: string;
  country: string;
  username: string;
  password: string;
  status: number;
  statusText: string;
  status_text: string;
  time: string;
  msg: string;
  updateTime: string;
  isAvailable: boolean;
}

export interface AccountsPayload {
  accounts: Account[];
  count: number;
  lastUpdate: number;
}

interface SourceAccount {
  email?: string;
  username?: string;
  u?: string;
  password?: string;
  p?: string;
  status?: number | string;
  time?: string | number;
  t?: string | number;
  regionName?: string;
  country?: string;
}

const DEFAULT_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

const AILIAO_ORIGIN = 'https://ids.ailiao.eu';
const MAX_SHA_LINKS = 10;
const FETCH_TIMEOUT_MS = 8000;
const UPSTREAM_CACHE_TTL_SECONDS = 60 * 30;
const URL_REGEX =
  /http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/g;
const SCRIPT_SRC_REGEX = /src=["']([^"']*assets\/index-[^"']+\.js)["']/i;
const AD_PATTERNS = [
  /const\s+ad\s*=\s*'([^']+)'/s,
  /var\s+ad\s*=\s*'([^']+)'/s,
  /ad\s*=\s*'([^']+)'/s,
  /const\s+ad\s*=\s*"([^"]+)"/s,
  /var\s+ad\s*=\s*"([^"]+)"/s,
] as const;

function toDate(value: string | number): Date | null {
  if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
    const numericValue = Number(value);
    const timestamp = numericValue > 1e12 ? numericValue : numericValue * 1000;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.includes(' ') ? value.replace(' ', 'T') : value;
    const date = new Date(normalizedValue);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function formatTime(timeValue: string | number | undefined): string {
  if (timeValue === undefined || timeValue === null || timeValue === 0 || timeValue === '0') {
    return '未知';
  }

  const parsedDate = toDate(timeValue);
  if (!parsedDate) {
    return String(timeValue);
  }

  const now = new Date();
  const diff = now.getTime() - parsedDate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return '刚刚';
  }
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  if (hours < 24) {
    return `${hours}小时前`;
  }
  if (days < 30) {
    return `${days}天前`;
  }

  return new Intl.DateTimeFormat('zh-CN').format(parsedDate);
}

async function fetchText(url: string, init?: RequestInit): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('timeout'), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        ...DEFAULT_HEADERS,
        ...(init?.headers ?? {}),
      },
      cf: {
        cacheTtl: UPSTREAM_CACHE_TTL_SECONDS,
        cacheEverything: true,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveMainJsUrl(origin: string): Promise<string> {
  const indexHtml = await fetchText(`${origin}/`);

  if (!indexHtml) {
    throw new Error(`无法获取上游站点首页: ${origin}`);
  }

  const scriptMatch = indexHtml.match(SCRIPT_SRC_REGEX);
  if (!scriptMatch?.[1]) {
    throw new Error(`未找到主文件入口: ${origin}`);
  }

  return new URL(scriptMatch[1], `${origin}/`).toString();
}

function resolveStatus(statusValue: SourceAccount['status']): {
  status: number;
  statusText: string;
  isAvailable: boolean;
} {
  if (typeof statusValue === 'number') {
    const statusText = { 0: '等待检测', 1: '正常', 2: '异常' }[statusValue] ?? String(statusValue);
    return {
      status: statusValue,
      statusText,
      isAvailable: statusValue !== 2,
    };
  }

  if (typeof statusValue === 'string') {
    const status = statusValue.includes('正常') ? 1 : statusValue.includes('异常') ? 2 : 0;
    return {
      status,
      statusText: statusValue,
      isAvailable: status !== 2,
    };
  }

  return {
    status: 0,
    statusText: '等待检测',
    isAvailable: true,
  };
}

function normalizeAccount(item: SourceAccount, source: string): Account | null {
  const username = String(item.email ?? item.username ?? item.u ?? '').trim();
  const password = String(item.password ?? item.p ?? '').trim();

  if (!username || username === '暂无可用账号' || !password) {
    return null;
  }

  const { status, statusText, isAvailable } = resolveStatus(item.status);
  if (!isAvailable) {
    return null;
  }

  let rawTime = item.time ?? item.t ?? '';
  let msg = '';

  if (
    typeof rawTime === 'string' &&
    rawTime &&
    !/^\d{4}-\d{2}-\d{2}/.test(rawTime) &&
    !/^\d+$/.test(rawTime.trim())
  ) {
    msg = rawTime;
    rawTime = '';
  }

  const time = rawTime === '' ? '' : String(rawTime);
  const country = String(item.regionName ?? item.country ?? 'Unknown').trim() || 'Unknown';
  const updateTime = msg || formatTime(rawTime);

  return {
    id: `${source}:${username}`,
    source,
    country,
    username,
    password,
    status,
    statusText,
    status_text: statusText,
    time,
    msg,
    updateTime,
    isAvailable,
  };
}

function appendUniqueAccounts(target: Account[], seenUsernames: Set<string>, accounts: Account[]): void {
  for (const account of accounts) {
    if (!account.username || seenUsernames.has(account.username)) {
      continue;
    }

    seenUsernames.add(account.username);
    target.push(account);
  }
}

function extractAdData(html: string): string | null {
  for (const pattern of AD_PATTERNS) {
    const match = html.match(pattern);
    if (match?.[1] && match[1].includes('[')) {
      return match[1];
    }
  }

  return null;
}

async function fetchAiliaoAccounts(): Promise<Account[]> {
  const mainJsUrl = await resolveMainJsUrl(AILIAO_ORIGIN);
  const jsContent = await fetchText(mainJsUrl);

  if (!jsContent) {
    throw new Error('无法获取 ailiao 主文件');
  }

  const shaLinks = [...new Set((jsContent.match(URL_REGEX) ?? []).filter((link) => link.includes('sha')))].slice(
    0,
    MAX_SHA_LINKS,
  );

  if (shaLinks.length === 0) {
    throw new Error('未找到 ailiao SHA 数据源');
  }

  const accounts: Account[] = [];

  for (const link of shaLinks) {
    const content = await fetchText(link);
    if (!content || content.length < 1000) {
      continue;
    }

    const adData = extractAdData(content);
    if (!adData) {
      continue;
    }

    try {
      const parsed = JSON.parse(adData) as SourceAccount[];
      if (!Array.isArray(parsed)) {
        continue;
      }

      const source = `ailiao/${new URL(link).hostname}`;
      for (const item of parsed) {
        const account = normalizeAccount(item, source);
        if (account) {
          accounts.push(account);
        }
      }
    } catch {
      continue;
    }
  }

  return accounts;
}

export async function fetchAccountsPayload(): Promise<AccountsPayload> {
  const mergedAccounts: Account[] = [];
  const seenUsernames = new Set<string>();
  const errors: string[] = [];

  try {
    appendUniqueAccounts(mergedAccounts, seenUsernames, await fetchAiliaoAccounts());
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    errors.push(`ids.ailiao.eu: ${message}`);
  }

  if (mergedAccounts.length === 0) {
    throw new Error(errors[0] ?? '暂时没有获取到可用账号');
  }

  return {
    accounts: mergedAccounts,
    count: mergedAccounts.length,
    lastUpdate: Date.now(),
  };
}
