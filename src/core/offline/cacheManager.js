import db from "./db.js";

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes default

/**
 * Set a cached value with a TTL.
 * @param {string} key - Cache key (usually endpoint path + params)
 * @param {*} data - Data to cache
 * @param {number} ttlMs - Time-to-live in milliseconds
 */
export async function setCache(key, data, ttlMs = DEFAULT_TTL_MS) {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  await db.cache.put({
    cacheKey: key,
    data,
    expiresAt,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Get a cached value. Returns null if not found or expired.
 * @param {string} key - Cache key
 * @returns {*} Cached data or null
 */
export async function getCache(key) {
  const entry = await db.cache.get(key);
  if (!entry) return null;
  if (new Date(entry.expiresAt) < new Date()) {
    await db.cache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Remove a specific cache entry.
 * @param {string} key - Cache key
 */
export async function invalidateCache(key) {
  await db.cache.delete(key);
}

/**
 * Remove all expired cache entries (eviction).
 */
export async function evictExpiredCache() {
  const now = new Date().toISOString();
  await db.cache.where("expiresAt").below(now).delete();
}

/**
 * Clear entire cache.
 */
export async function clearAllCache() {
  await db.cache.clear();
}
