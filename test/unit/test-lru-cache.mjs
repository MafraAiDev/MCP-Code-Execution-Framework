/**
 * Unit Tests for LRU Cache
 * FASE 7.1 - Cache Avançado
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const LRUCache = require('../../core/cache/lru-cache.cjs');

console.log('═════════════════════════════════════════════════');
console.log('   LRU CACHE TESTS (FASE 7.1)');
console.log('═════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    failed++;
  }
}

// ============================================
// Test 1: Basic Set/Get Operations
// ============================================
test('Should set and get values correctly', () => {
  const cache = new LRUCache({ maxSize: 3 });

  cache.set('key1', 'value1');
  cache.set('key2', 'value2');
  cache.set('key3', 'value3');

  if (cache.get('key1') !== 'value1') throw new Error('Failed to get key1');
  if (cache.get('key2') !== 'value2') throw new Error('Failed to get key2');
  if (cache.get('key3') !== 'value3') throw new Error('Failed to get key3');
});

// ============================================
// Test 2: LRU Eviction Policy
// ============================================
test('Should evict least recently used item when at capacity', () => {
  const cache = new LRUCache({ maxSize: 3 });

  cache.set('key1', 'value1');
  cache.set('key2', 'value2');
  cache.set('key3', 'value3');

  // Access key1 to make it recently used
  cache.get('key1');

  // Add key4, should evict key2 (least recently used)
  cache.set('key4', 'value4');

  if (cache.get('key1') !== 'value1') throw new Error('key1 should still exist');
  if (cache.get('key2') !== null) throw new Error('key2 should be evicted');
  if (cache.get('key3') !== 'value3') throw new Error('key3 should still exist');
  if (cache.get('key4') !== 'value4') throw new Error('key4 should exist');
});

// ============================================
// Test 3: TTL Expiration
// ============================================
test('Should expire items after TTL', async () => {
  const cache = new LRUCache({ maxSize: 10, ttl: 100 }); // 100ms TTL

  cache.set('temp', 'value');

  // Should exist immediately
  if (cache.get('temp') !== 'value') throw new Error('Item should exist immediately');

  // Wait for TTL to expire
  await new Promise(resolve => setTimeout(resolve, 150));

  // Should be null after TTL
  if (cache.get('temp') !== null) throw new Error('Item should be expired after TTL');
});

// ============================================
// Test 4: Cache Metrics Tracking
// ============================================
test('Should track cache metrics correctly', () => {
  const cache = new LRUCache({ maxSize: 5 });

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);

  // 2 hits, 1 miss
  cache.get('a'); // hit
  cache.get('b'); // hit
  cache.get('nonexistent'); // miss

  const metrics = cache.getMetrics();

  if (metrics.hits !== 2) throw new Error(`Expected 2 hits, got ${metrics.hits}`);
  if (metrics.misses !== 1) throw new Error(`Expected 1 miss, got ${metrics.misses}`);
  if (parseFloat(metrics.hitRate) !== 66.67) {
    throw new Error(`Expected 66.67% hit rate, got ${metrics.hitRate}%`);
  }
});

// ============================================
// Test 5: Hit Rate Calculation
// ============================================
test('Should calculate hit rate correctly', () => {
  const cache = new LRUCache({ maxSize: 10 });

  cache.set('x', 1);

  // 4 hits, 1 miss = 80% hit rate
  cache.get('x'); // hit
  cache.get('x'); // hit
  cache.get('x'); // hit
  cache.get('x'); // hit
  cache.get('y'); // miss

  const hitRate = parseFloat(cache.getHitRate());

  if (hitRate !== 80.00) throw new Error(`Expected 80% hit rate, got ${hitRate}%`);
});

// ============================================
// Test 6: Has() Method
// ============================================
test('Should check existence without updating access order', () => {
  const cache = new LRUCache({ maxSize: 3 });

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);

  if (!cache.has('a')) throw new Error('Should have key a');
  if (!cache.has('b')) throw new Error('Should have key b');
  if (cache.has('nonexistent')) throw new Error('Should not have nonexistent key');

  // has() shouldn't affect eviction order
  cache.set('d', 4); // Should evict 'a' (first added)

  if (cache.has('a')) throw new Error('Key a should be evicted');
});

// ============================================
// Test 7: Delete Operation
// ============================================
test('Should delete items correctly', () => {
  const cache = new LRUCache({ maxSize: 5 });

  cache.set('x', 1);
  cache.set('y', 2);

  if (!cache.delete('x')) throw new Error('Delete should return true');
  if (cache.get('x') !== null) throw new Error('x should be deleted');
  if (cache.delete('nonexistent')) throw new Error('Delete nonexistent should return false');
});

// ============================================
// Test 8: Clear Cache
// ============================================
test('Should clear all items', () => {
  const cache = new LRUCache({ maxSize: 5 });

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);

  cache.clear();

  if (cache.size !== 0) throw new Error('Cache should be empty');
  if (cache.get('a') !== null) throw new Error('All items should be cleared');
});

// ============================================
// Test 9: Keys Method
// ============================================
test('Should return all cache keys', () => {
  const cache = new LRUCache({ maxSize: 5 });

  cache.set('key1', 'val1');
  cache.set('key2', 'val2');
  cache.set('key3', 'val3');

  const keys = cache.keys();

  if (keys.length !== 3) throw new Error(`Expected 3 keys, got ${keys.length}`);
  if (!keys.includes('key1')) throw new Error('Should include key1');
  if (!keys.includes('key2')) throw new Error('Should include key2');
  if (!keys.includes('key3')) throw new Error('Should include key3');
});

// ============================================
// Test 10: Update Existing Key
// ============================================
test('Should update value for existing key', () => {
  const cache = new LRUCache({ maxSize: 3 });

  cache.set('x', 'original');
  cache.set('x', 'updated');

  if (cache.get('x') !== 'updated') throw new Error('Value should be updated');
  if (cache.size !== 1) throw new Error('Size should remain 1');
});

// ============================================
// Test 11: Eviction Metrics
// ============================================
test('Should track evictions correctly', () => {
  const cache = new LRUCache({ maxSize: 2 });

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3); // Evicts 'a'
  cache.set('d', 4); // Evicts 'b'

  const metrics = cache.getMetrics();

  if (metrics.evictions !== 2) throw new Error(`Expected 2 evictions, got ${metrics.evictions}`);
});

// ============================================
// Test 12: Cleanup Expired Items
// ============================================
test('Should cleanup expired items manually', async () => {
  const cache = new LRUCache({ maxSize: 10, ttl: 50 });

  cache.set('temp1', 'value1');
  cache.set('temp2', 'value2');
  cache.set('temp3', 'value3');

  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 100));

  const removed = cache.cleanupExpired();

  if (removed !== 3) throw new Error(`Expected 3 items removed, got ${removed}`);
  if (cache.size !== 0) throw new Error('Cache should be empty after cleanup');
});

// ============================================
// Test 13: Warmup Cache
// ============================================
test('Should warmup cache with initial data', () => {
  const cache = new LRUCache({ maxSize: 10 });

  const initialData = {
    skill1: { name: 'skill1' },
    skill2: { name: 'skill2' },
    skill3: { name: 'skill3' }
  };

  const count = cache.warmup(initialData);

  if (count !== 3) throw new Error(`Expected 3 items added, got ${count}`);
  if (cache.get('skill1').name !== 'skill1') throw new Error('skill1 not warmed up correctly');
  if (cache.size !== 3) throw new Error('Cache size should be 3');
});

// ============================================
// Test 14: Get Stats
// ============================================
test('Should provide detailed statistics', () => {
  const cache = new LRUCache({ maxSize: 5 });

  cache.set('a', 1);
  cache.set('b', 2);
  cache.get('a'); // hit

  const stats = cache.getStats();

  if (!stats.metrics) throw new Error('Stats should include metrics');
  if (!stats.items) throw new Error('Stats should include items');
  if (!stats.performance) throw new Error('Stats should include performance');
  if (stats.items.total !== 2) throw new Error(`Expected 2 items, got ${stats.items.total}`);
});

// ============================================
// Test 15: Access Order Tracking
// ============================================
test('Should maintain proper access order', () => {
  const cache = new LRUCache({ maxSize: 3 });

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);

  // Access in order: c, a, b
  cache.get('c');
  cache.get('a');
  cache.get('b');

  // Add new item, should evict 'c' (accessed first)
  cache.set('d', 4);

  if (cache.get('c') !== null) throw new Error('c should be evicted');
  if (cache.get('a') !== 1) throw new Error('a should still exist');
  if (cache.get('b') !== 2) throw new Error('b should still exist');
  if (cache.get('d') !== 4) throw new Error('d should exist');
});

// ============================================
// Test 16: Large Cache Size
// ============================================
test('Should handle large cache sizes efficiently', () => {
  const cache = new LRUCache({ maxSize: 1000 });

  // Add 1000 items
  for (let i = 0; i < 1000; i++) {
    cache.set(`key${i}`, `value${i}`);
  }

  if (cache.size !== 1000) throw new Error(`Expected 1000 items, got ${cache.size}`);

  // Add one more, should evict first
  cache.set('key1000', 'value1000');

  if (cache.get('key0') !== null) throw new Error('key0 should be evicted');
  if (cache.get('key999') !== 'value999') throw new Error('key999 should exist');
  if (cache.size !== 1000) throw new Error('Size should remain 1000');
});

// ============================================
// Test 17: Hit Count Tracking
// ============================================
test('Should track individual item hit counts', () => {
  const cache = new LRUCache({ maxSize: 5 });

  cache.set('popular', 'value');

  // Access 5 times
  for (let i = 0; i < 5; i++) {
    cache.get('popular');
  }

  const stats = cache.getStats();
  const mostAccessed = stats.items.mostAccessed;

  if (mostAccessed.length === 0) throw new Error('Should have most accessed items');
  if (mostAccessed[0].key !== 'popular') throw new Error('popular should be most accessed');
  if (mostAccessed[0].hits !== 5) throw new Error(`Expected 5 hits, got ${mostAccessed[0].hits}`);
});

// ============================================
// RESULTS
// ============================================
console.log('\n═════════════════════════════════════════════════');
console.log('   TEST RESULTS');
console.log('═════════════════════════════════════════════════\n');

console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%\n`);

if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED! LRU Cache is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the errors above.\n');
  process.exit(1);
}
