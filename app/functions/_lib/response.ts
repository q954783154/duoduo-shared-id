import type { AccountsPayload } from './accounts';

const CACHE_SECONDS = 60 * 30;
const STALE_CACHE_SECONDS = 60 * 60 * 24 * 7;

export const CACHE_TTL = CACHE_SECONDS;
export const STALE_CACHE_TTL = STALE_CACHE_SECONDS;

export function createJsonResponse(payload: AccountsPayload, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${CACHE_SECONDS}`,
    },
  });
}

export function createErrorResponse(message: string, status = 500): Response {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
}

export function createCacheRequest(url: URL): Request {
  return new Request(`${url.origin}/__cache/accounts`);
}

export function createStaleCacheRequest(url: URL): Request {
  return new Request(`${url.origin}/__cache/accounts-stale`);
}
