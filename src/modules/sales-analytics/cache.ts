import "server-only";

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const salesAnalyticsCache = new Map<string, CacheEntry<unknown>>();

export async function withSalesAnalyticsCache<T>(
  cacheKey: string,
  loader: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const cached = salesAnalyticsCache.get(cacheKey) as CacheEntry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const value = await loader();
  salesAnalyticsCache.set(cacheKey, {
    value,
    expiresAt: now + ttlMs,
  });

  return value;
}

export function clearSalesAnalyticsCache() {
  salesAnalyticsCache.clear();
}
