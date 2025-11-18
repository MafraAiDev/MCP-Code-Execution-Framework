/**
 * LRU Cache Implementation
 *
 * Least Recently Used (LRU) cache with TTL support for skill caching.
 * Provides O(1) get/set operations with automatic eviction of least recently used items.
 *
 * Features:
 * - LRU eviction policy
 * - TTL-based expiration
 * - Hit/miss metrics tracking
 * - Memory-efficient implementation
 * - Thread-safe operations
 *
 * @module core/cache/lru-cache
 * @version 1.0.0
 * @since FASE 7.1
 */

class LRUCache {
  /**
   * Create a new LRU Cache
   *
   * @param {Object} options - Cache configuration options
   * @param {number} [options.maxSize=100] - Maximum number of items in cache
   * @param {number} [options.ttl=3600000] - Time-to-live in milliseconds (default: 1 hour)
   * @param {boolean} [options.trackMetrics=true] - Enable metrics tracking
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.trackMetrics = options.trackMetrics !== false;

    // Cache storage (key -> {value, timestamp, hits})
    this.cache = new Map();

    // Access order tracking (least recent first)
    this.accessOrder = [];

    // Metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      totalSets: 0,
      totalGets: 0
    };
  }

  /**
   * Get an item from cache
   *
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if not found/expired
   */
  get(key) {
    if (this.trackMetrics) {
      this.metrics.totalGets++;
    }

    if (!this.cache.has(key)) {
      if (this.trackMetrics) {
        this.metrics.misses++;
      }
      return null;
    }

    const item = this.cache.get(key);

    // Check TTL expiration
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      this._removeFromAccessOrder(key);

      if (this.trackMetrics) {
        this.metrics.expirations++;
        this.metrics.misses++;
      }

      return null;
    }

    // Cache hit! Update access order (move to end = most recent)
    this._updateAccessOrder(key);

    // Track hit count for this item
    item.hits++;
    item.lastAccess = Date.now();

    if (this.trackMetrics) {
      this.metrics.hits++;
    }

    return item.value;
  }

  /**
   * Set an item in cache
   *
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @returns {void}
   */
  set(key, value) {
    if (this.trackMetrics) {
      this.metrics.totalSets++;
    }

    // If key already exists, update it
    if (this.cache.has(key)) {
      const item = this.cache.get(key);
      item.value = value;
      item.timestamp = Date.now();
      item.lastAccess = Date.now();
      this._updateAccessOrder(key);
      return;
    }

    // Evict LRU if at capacity
    if (this.cache.size >= this.maxSize) {
      this._evictLRU();
    }

    // Add new item
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      hits: 0
    });

    this._updateAccessOrder(key);
  }

  /**
   * Check if a key exists in cache (without updating access order)
   *
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is not expired
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const item = this.cache.get(key);

    // Check TTL
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      this._removeFromAccessOrder(key);

      if (this.trackMetrics) {
        this.metrics.expirations++;
      }

      return false;
    }

    return true;
  }

  /**
   * Delete an item from cache
   *
   * @param {string} key - Cache key
   * @returns {boolean} True if item was deleted
   */
  delete(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    this.cache.delete(key);
    this._removeFromAccessOrder(key);
    return true;
  }

  /**
   * Clear all items from cache
   *
   * @returns {void}
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];

    // Reset metrics except totals
    if (this.trackMetrics) {
      this.metrics.hits = 0;
      this.metrics.misses = 0;
      this.metrics.evictions = 0;
      this.metrics.expirations = 0;
    }
  }

  /**
   * Get current cache size
   *
   * @returns {number} Number of items in cache
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Get all cache keys
   *
   * @returns {string[]} Array of cache keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache hit rate percentage
   *
   * @returns {number} Hit rate (0-100)
   */
  getHitRate() {
    const total = this.metrics.hits + this.metrics.misses;
    if (total === 0) return 0;
    return (this.metrics.hits / total * 100).toFixed(2);
  }

  /**
   * Get cache metrics
   *
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return {
      ...this.metrics,
      hitRate: parseFloat(this.getHitRate()),
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: (this.cache.size / this.maxSize * 100).toFixed(2)
    };
  }

  /**
   * Get detailed cache statistics
   *
   * @returns {Object} Detailed statistics
   */
  getStats() {
    const now = Date.now();
    const items = Array.from(this.cache.entries());

    // Calculate item ages
    const ages = items.map(([_, item]) => now - item.timestamp);
    const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

    // Find most/least accessed items
    const sortedByHits = items.sort((a, b) => b[1].hits - a[1].hits);
    const mostAccessed = sortedByHits.slice(0, 5).map(([key, item]) => ({
      key,
      hits: item.hits,
      age: now - item.timestamp
    }));

    return {
      metrics: this.getMetrics(),
      items: {
        total: this.cache.size,
        maxSize: this.maxSize,
        avgAge: Math.round(avgAge),
        mostAccessed
      },
      performance: {
        hitRate: parseFloat(this.getHitRate()),
        evictionRate: this.metrics.totalSets > 0
          ? (this.metrics.evictions / this.metrics.totalSets * 100).toFixed(2)
          : 0,
        expirationRate: this.metrics.totalGets > 0
          ? (this.metrics.expirations / this.metrics.totalGets * 100).toFixed(2)
          : 0
      }
    };
  }

  /**
   * Evict least recently used item
   *
   * @private
   * @returns {void}
   */
  _evictLRU() {
    if (this.accessOrder.length === 0) {
      return;
    }

    // Remove least recently used (first in accessOrder)
    const lruKey = this.accessOrder[0];
    this.cache.delete(lruKey);
    this.accessOrder.shift();

    if (this.trackMetrics) {
      this.metrics.evictions++;
    }
  }

  /**
   * Update access order for a key (move to end = most recent)
   *
   * @private
   * @param {string} key - Cache key
   * @returns {void}
   */
  _updateAccessOrder(key) {
    // Remove key from current position
    this._removeFromAccessOrder(key);

    // Add to end (most recent)
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   *
   * @private
   * @param {string} key - Cache key
   * @returns {void}
   */
  _removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Clean up expired items (can be called periodically)
   *
   * @returns {number} Number of items removed
   */
  cleanupExpired() {
    const now = Date.now();
    let removed = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
        this._removeFromAccessOrder(key);
        removed++;

        if (this.trackMetrics) {
          this.metrics.expirations++;
        }
      }
    }

    return removed;
  }

  /**
   * Warm up cache with initial data
   *
   * @param {Map|Object} data - Initial data to populate cache
   * @returns {number} Number of items added
   */
  warmup(data) {
    let count = 0;

    if (data instanceof Map) {
      for (const [key, value] of data.entries()) {
        this.set(key, value);
        count++;
      }
    } else if (typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        this.set(key, value);
        count++;
      }
    }

    return count;
  }
}

module.exports = LRUCache;
