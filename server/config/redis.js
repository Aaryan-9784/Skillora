const Redis  = require("ioredis");
const logger = require("../utils/logger");

let client = null;

const getRedis = () => {
  if (!client) {
    if (!process.env.REDIS_URL) {
      // Return a no-op cache when Redis is not configured
      return null;
    }
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    client.on("error", (err) => logger.warn(`Redis error: ${err.message}`));
    client.on("connect", () => logger.info("Redis connected"));
  }
  return client;
};

/**
 * Get a cached value. Returns null if Redis unavailable or key missing.
 */
const cacheGet = async (key) => {
  const r = getRedis();
  if (!r) return null;
  try {
    const val = await r.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
};

/**
 * Set a cached value with TTL in seconds.
 */
const cacheSet = async (key, value, ttlSeconds = 300) => {
  const r = getRedis();
  if (!r) return;
  try {
    await r.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* silent */ }
};

/**
 * Delete a cached key or pattern.
 */
const cacheDel = async (key) => {
  const r = getRedis();
  if (!r) return;
  try { await r.del(key); } catch { /* silent */ }
};

/**
 * Delete all keys matching a pattern (e.g. "dashboard:userId:*").
 */
const cacheDelPattern = async (pattern) => {
  const r = getRedis();
  if (!r) return;
  try {
    const keys = await r.keys(pattern);
    if (keys.length) await r.del(...keys);
  } catch { /* silent */ }
};

module.exports = { getRedis, cacheGet, cacheSet, cacheDel, cacheDelPattern };
