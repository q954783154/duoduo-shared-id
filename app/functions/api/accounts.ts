import { fetchAccountsPayload } from '../_lib/accounts';
import {
  CACHE_TTL,
  STALE_CACHE_TTL,
  createCacheRequest,
  createErrorResponse,
  createJsonResponse,
  createStaleCacheRequest,
} from '../_lib/response';

export const onRequestGet: PagesFunction = async (context) => {
  const cache = caches.default;
  const url = new URL(context.request.url);
  const cacheKey = createCacheRequest(url);
  const staleCacheKey = createStaleCacheRequest(url);
  const cachedResponse = await cache.match(cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const payload = await fetchAccountsPayload();
    const response = createJsonResponse(payload);
    const freshCacheResponse = response.clone();
    freshCacheResponse.headers.set('cache-control', `public, max-age=${CACHE_TTL}`);
    const staleCacheResponse = response.clone();
    staleCacheResponse.headers.set('cache-control', `public, max-age=${STALE_CACHE_TTL}`);

    context.waitUntil(
      Promise.all([
        cache.put(cacheKey, freshCacheResponse),
        cache.put(staleCacheKey, staleCacheResponse),
      ]),
    );

    return response;
  } catch (error) {
    const staleResponse = await cache.match(staleCacheKey);
    if (staleResponse) {
      const fallbackResponse = new Response(staleResponse.body, staleResponse);
      fallbackResponse.headers.set('cache-control', 'no-store');
      fallbackResponse.headers.set('x-id-fallback', 'stale-cache');
      return fallbackResponse;
    }

    const message = error instanceof Error ? error.message : '获取账号失败';
    return createErrorResponse(message);
  }
};
