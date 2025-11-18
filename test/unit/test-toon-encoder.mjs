/**
 * FASE 9 - TOON Integration Tests
 * Validates TOON encoding/decoding and token optimization
 */

import assert from 'assert';
import ToonEncoder from '../../core/toon-encoder.js';

describe('ToonEncoder - FASE 9', function() {
  let encoder;

  beforeEach(() => {
    encoder = new ToonEncoder();
  });

  describe('Initialization', () => {
    it('should create encoder with default options', () => {
      assert.ok(encoder instanceof ToonEncoder);
      assert.strictEqual(encoder.options.enabled, true);
      assert.strictEqual(encoder.options.minSizeThreshold, 100);
      assert.strictEqual(encoder.options.trackMetrics, true);
    });

    it('should create encoder with custom options', () => {
      const customEncoder = new ToonEncoder({
        enabled: false,
        minSizeThreshold: 200,
        trackMetrics: false
      });

      assert.strictEqual(customEncoder.options.enabled, false);
      assert.strictEqual(customEncoder.options.minSizeThreshold, 200);
      assert.strictEqual(customEncoder.options.trackMetrics, false);
    });
  });

  describe('Encoding', () => {
    it('should encode array of objects to TOON format', () => {
      const data = [
        { id: 1, name: 'Alice', age: 30, city: 'NYC' },
        { id: 2, name: 'Bob', age: 25, city: 'LA' },
        { id: 3, name: 'Charlie', age: 35, city: 'SF' }
      ];

      const result = encoder.encode(data);

      assert.strictEqual(result.format, 'toon');
      assert.ok(result.encoded);
      assert.ok(result.originalTokens > 0);
      assert.ok(result.encodedTokens > 0);
      assert.ok(result.savingsAbsolute > 0);
      assert.ok(result.savingsPercent > 0);
    });

    it('should skip encoding for small data below threshold', () => {
      const smallData = { id: 1, name: 'Test' };

      const result = encoder.encode(smallData);

      assert.strictEqual(result.skipped, true);
      assert.ok(result.reason);
      assert.strictEqual(result.savingsPercent, 0);
    });

    it('should handle encoding errors gracefully with fallback', () => {
      // Test with circular reference (should cause encoding error)
      const circular = { a: 1 };
      circular.self = circular;

      const result = encoder.encode(circular);

      // Should fallback to JSON
      assert.strictEqual(result.fallback, true);
      assert.ok(result.error);
      assert.strictEqual(result.format, 'json');
    });

    it('should track metrics when enabled', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: true
      }));

      encoder.encode(data);

      const metrics = encoder.getMetrics();
      assert.strictEqual(metrics.totalEncodings, 1);
      assert.ok(metrics.totalTokensSaved > 0);
      assert.ok(metrics.averageSavingsPercent > 0);
    });

    it('should exclude specified fields', () => {
      const encoderWithExclusions = new ToonEncoder({
        excludeFields: ['password', 'ssn']
      });

      const data = [
        { id: 1, name: 'Alice', password: 'secret123', ssn: '123-45-6789' },
        { id: 2, name: 'Bob', password: 'pass456', ssn: '987-65-4321' }
      ];

      const result = encoderWithExclusions.encode(data);

      // Decode and verify excluded fields are not present
      const decoded = encoderWithExclusions.decode(result.encoded);
      assert.ok(!decoded[0].password);
      assert.ok(!decoded[0].ssn);
      assert.strictEqual(decoded[0].name, 'Alice');
    });
  });

  describe('Decoding', () => {
    it('should decode TOON format back to original data', () => {
      const original = [
        { id: 1, name: 'Alice', score: 95 },
        { id: 2, name: 'Bob', score: 87 },
        { id: 3, name: 'Charlie', score: 92 }
      ];

      const { encoded } = encoder.encode(original);
      const decoded = encoder.decode(encoded);

      assert.deepStrictEqual(decoded, original);
    });

    it('should handle JSON fallback on decode error', () => {
      const jsonData = JSON.stringify({ test: 'value' });

      const decoded = encoder.decode(jsonData);

      assert.deepStrictEqual(decoded, { test: 'value' });
    });

    it('should track decoding metrics', () => {
      const data = [{ id: 1, name: 'Test' }];
      const { encoded } = encoder.encode(data);

      encoder.decode(encoded);

      const metrics = encoder.getMetrics();
      assert.strictEqual(metrics.totalDecodings, 1);
    });
  });

  describe('Skill-Specific Methods', () => {
    it('should encode skill result with proper format', () => {
      const skillResult = {
        success: true,
        output: 'Skill executed successfully',
        data: Array.from({ length: 10 }, (_, i) => ({ item: i, value: i * 2 }))
      };

      const result = encoder.encodeSkillResult(skillResult);

      assert.ok(result.encoded);
      assert.ok(result.savingsPercent > 0);
    });

    it('should encode skills list with optimal format', () => {
      const skills = [
        { name: 'skill1', description: 'First skill', category: 'dev' },
        { name: 'skill2', description: 'Second skill', category: 'ops' },
        { name: 'skill3', description: 'Third skill', category: 'security' }
      ];

      const result = encoder.encodeSkillsList(skills);

      assert.strictEqual(result.format, 'toon');
      assert.ok(result.savingsAbsolute > 0);
    });

    it('should encode filtered data', () => {
      const filteredData = {
        users: Array.from({ length: 15 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          status: 'active'
        })),
        total: 15
      };

      const result = encoder.encodeFilteredData(filteredData);

      assert.ok(result.encoded);
      assert.ok(result.savingsPercent > 0);
    });
  });

  describe('Metrics and Statistics', () => {
    it('should provide comprehensive metrics', () => {
      const data = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        title: `Item ${i}`,
        description: `Description for item ${i}`
      }));

      // Encode multiple times
      encoder.encode(data);
      encoder.encode(data);
      encoder.encode(data);

      const metrics = encoder.getMetrics();

      assert.strictEqual(metrics.totalEncodings, 3);
      assert.ok(metrics.totalTokensSaved > 0);
      assert.ok(metrics.averageSavingsPercent > 0);
      assert.strictEqual(metrics.encodingErrors, 0);
      assert.ok(metrics.totalSavingsPercent);
      assert.ok(metrics.errorRate !== undefined);
    });

    it('should reset metrics correctly', () => {
      const data = [{ id: 1, name: 'Test', value: 100 }];

      encoder.encode(data);

      assert.ok(encoder.getMetrics().totalEncodings > 0);

      encoder.resetMetrics();

      const metrics = encoder.getMetrics();
      assert.strictEqual(metrics.totalEncodings, 0);
      assert.strictEqual(metrics.totalTokensSaved, 0);
      assert.strictEqual(metrics.averageSavingsPercent, 0);
    });
  });

  describe('Data Suitability', () => {
    it('should identify suitable data for TOON encoding', () => {
      const suitableData = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ];

      assert.strictEqual(encoder.isSuitableForToon(suitableData), true);
    });

    it('should reject unsuitable data', () => {
      const unsuitableData = 'simple string';

      assert.strictEqual(encoder.isSuitableForToon(unsuitableData), false);
    });

    it('should accept large objects', () => {
      const largeObject = {
        data: Array.from({ length: 50 }, (_, i) => i)
      };

      assert.strictEqual(encoder.isSuitableForToon(largeObject), true);
    });
  });

  describe('Batch Operations', () => {
    it('should batch encode multiple items', () => {
      const items = [
        [{ id: 1, name: 'Item1' }],
        [{ id: 2, name: 'Item2' }],
        [{ id: 3, name: 'Item3' }]
      ];

      const results = encoder.batchEncode(items);

      assert.strictEqual(results.length, 3);
      results.forEach(result => {
        assert.ok(result.encoded);
      });
    });

    it('should batch decode multiple items', () => {
      const items = [
        [{ id: 1, name: 'Item1' }],
        [{ id: 2, name: 'Item2' }]
      ];

      const encoded = encoder.batchEncode(items);
      const encodedStrings = encoded.map(r => r.encoded);

      const decoded = encoder.batchDecode(encodedStrings);

      assert.strictEqual(decoded.length, 2);
      assert.deepStrictEqual(decoded[0], items[0]);
      assert.deepStrictEqual(decoded[1], items[1]);
    });
  });

  describe('Token Estimation', () => {
    it('should estimate tokens correctly (4 chars per token)', () => {
      const text = 'a'.repeat(400); // 400 chars = ~100 tokens

      const estimatedTokens = encoder._estimateTokens(text);

      assert.strictEqual(estimatedTokens, 100);
    });

    it('should provide realistic token savings for typical data', () => {
      const typicalData = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: true,
        role: 'developer'
      }));

      const result = encoder.encode(typicalData);

      // TOON typically saves 30-60% tokens
      assert.ok(result.savingsPercent >= 20, 'Should save at least 20% tokens');
      assert.ok(result.savingsPercent <= 70, 'Should save at most 70% tokens');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      const result = encoder.encode([]);

      assert.strictEqual(result.skipped, true);
    });

    it('should handle empty objects', () => {
      const result = encoder.encode({});

      assert.strictEqual(result.skipped, true);
    });

    it('should handle nested data structures', () => {
      const nested = [
        {
          id: 1,
          user: { name: 'Alice', profile: { age: 30, city: 'NYC' } },
          orders: [{ orderId: 1, amount: 100 }, { orderId: 2, amount: 200 }]
        }
      ];

      const result = encoder.encode(nested);

      assert.ok(result.encoded);
      const decoded = encoder.decode(result.encoded);
      assert.deepStrictEqual(decoded, nested);
    });

    it('should handle special characters', () => {
      const data = [
        { text: 'Hello "World"', emoji: '🎉', special: '<>&' }
      ];

      const { encoded } = encoder.encode(data);
      const decoded = encoder.decode(encoded);

      assert.deepStrictEqual(decoded, data);
    });

    it('should handle disabled encoder', () => {
      const disabledEncoder = new ToonEncoder({ enabled: false });
      const data = [{ id: 1, name: 'Test' }];

      const result = disabledEncoder.encode(data);

      assert.strictEqual(result.skipped, true);
      assert.strictEqual(result.encoded, JSON.stringify(data));
    });
  });
});

console.log('✅ FASE 9 - TOON Tests loaded successfully');
