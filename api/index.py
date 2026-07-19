#!/usr/bin/env python3
"""
本地 HTTP API 服务
提供 /api/accounts 与 /api/refresh 给前端开发代理使用。
"""

import json
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

from shared_fetcher import CACHE_DURATION, fetch_accounts_payload

cached_payload = {
    'accounts': [],
    'count': 0,
    'lastUpdate': 0,
}


def refresh_cache(force: bool = False):
    global cached_payload

    is_expired = time.time() - cached_payload['lastUpdate'] > CACHE_DURATION
    if force or is_expired or not cached_payload['accounts']:
        cached_payload = fetch_accounts_payload()

    return cached_payload


class APIHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _send_json(self, payload, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        try:
            if self.path == '/api/accounts':
                self._send_json(refresh_cache())
                return

            if self.path == '/api/refresh':
                self._send_json(refresh_cache(force=True))
                return

            if self.path == '/':
                self._send_json({
                    'status': 'ok',
                    'message': '共享账号 API 服务运行中',
                    'endpoints': [
                        '/api/accounts - 获取账号列表',
                        '/api/refresh - 强制刷新账号数据',
                    ],
                })
                return

            self._send_json({'error': 'Not found'}, status=404)
        except Exception as exc:
            self._send_json({'error': str(exc)}, status=500)


def run_server(port=8080):
    refresh_cache(force=True)
    server = HTTPServer(('0.0.0.0', port), APIHandler)
    print(f'API 服务运行在端口 {port}')
    server.serve_forever()


if __name__ == '__main__':
    run_server()
