const NodeCache = require('node-cache');

// Initialize in-memory cache with standard TTL of 60 seconds
const TTL = parseInt(process.env.CACHE_TTL, 10) || 60;
const cache = new NodeCache({ stdTTL: TTL, checkperiod: 120 });

// Hit / Miss statistics tracker (Supplementary Problem)
const stats = {
  hits: 0,
  misses: 0,
  invalidations: 0
};

const cacheService = {
  /**
   * Retrieve item from cache
   */
  get(key) {
    const value = cache.get(key);
    if (value !== undefined) {
      stats.hits++;
      return { found: true, data: value };
    }
    stats.misses++;
    return { found: false, data: null };
  },

  /**
   * Save item into cache with optional TTL
   */
  set(key, value, customTTL = TTL) {
    return cache.set(key, value, customTTL);
  },

  /**
   * Delete a specific key
   */
  del(key) {
    stats.invalidations++;
    return cache.del(key);
  },

  /**
   * Invalidate all cached data for a specific user
   * (all tasks collection key and any single task keys)
   */
  invalidateUserTasks(userId) {
    const keys = cache.keys();
    const userKeys = keys.filter(
      (k) => k.startsWith(`tasks_user_${userId}`) || k.startsWith(`task_${userId}_`)
    );
    if (userKeys.length > 0) {
      cache.del(userKeys);
      stats.invalidations += userKeys.length;
    }
    return userKeys;
  },

  /**
   * Get cache debug statistics (Supplementary Problem)
   */
  getStats() {
    const totalRequests = stats.hits + stats.misses;
    const hitRate = totalRequests > 0 ? ((stats.hits / totalRequests) * 100).toFixed(2) : 0;
    const nodeCacheStats = cache.getStats();

    return {
      hits: stats.hits,
      misses: stats.misses,
      invalidations: stats.invalidations,
      totalRequests,
      hitRatePercentage: `${hitRate}%`,
      currentKeyCount: cache.getStats().keys,
      cachedKeys: cache.keys(),
      ttlSeconds: TTL,
      nodeCacheInternals: nodeCacheStats
    };
  },

  /**
   * Reset stats and flush all keys
   */
  flush() {
    cache.flushAll();
    stats.hits = 0;
    stats.misses = 0;
    stats.invalidations = 0;
    return true;
  }
};

module.exports = cacheService;
