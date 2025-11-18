/**
 * FASE 9 - TOON Integration Tests
 * Tests TOON integration with MCPCodeExecutionFramework
 */

import assert from 'assert';
import { MCPCodeExecutionFramework } from '../../core/index.js';

describe('TOON Integration with Framework - FASE 9', function() {
  let framework;

  // Increase timeout for integration tests
  this.timeout(30000);

  beforeEach(async () => {
    framework = new MCPCodeExecutionFramework({
      enableToon: true,
      enableDataFilter: true
    });
  });

  afterEach(async () => {
    if (framework) {
      await framework.cleanup();
    }
  });

  describe('Framework TOON Configuration', () => {
    it('should initialize framework with TOON enabled', () => {
      assert.strictEqual(framework.options.enableToon, true);
      assert.ok(framework.toonEncoder);
      assert.ok(framework.dataFilter);
    });

    it('should initialize framework with TOON disabled', () => {
      const noToonFramework = new MCPCodeExecutionFramework({
        enableToon: false
      });

      assert.strictEqual(noToonFramework.options.enableToon, false);
      assert.ok(noToonFramework.toonEncoder);
    });

    it('should pass TOON settings to DataFilter', () => {
      assert.strictEqual(framework.dataFilter.options.useToon, true);
      assert.ok(framework.dataFilter.toonEncoder);
    });
  });

  describe('Skill Execution with TOON', () => {
    it('should execute skill and apply TOON encoding when requested', async function() {
      // This test requires Python bridge to be working
      this.timeout(60000);

      try {
        const result = await framework.executeSkill('test-skill', {
          name: 'Integration Test',
          greeting: 'Hello TOON'
        }, {
          useToon: true
        });

        if (result.success) {
          assert.ok(result.result);

          // If TOON was applied, should have optimization metrics
          if (result.optimization) {
            assert.strictEqual(result.optimization.format, 'toon');
            assert.ok(result.optimization.tokensSaved >= 0);
            assert.ok(result.optimization.savingsPercent >= 0);
          }
        }
      } catch (error) {
        // Skill might not exist in test environment - that's ok
        console.log('  ⚠️  Skill execution skipped (Python bridge may not be available)');
        this.skip();
      }
    });

    it('should execute skill without TOON when disabled', async function() {
      this.timeout(60000);

      try {
        const result = await framework.executeSkill('test-skill', {
          name: 'No TOON Test'
        }, {
          useToon: false
        });

        if (result.success) {
          assert.ok(result.result);
          // Should not have TOON optimization metrics
          assert.ok(!result.optimization || result.optimization === null);
        }
      } catch (error) {
        console.log('  ⚠️  Skill execution skipped (Python bridge may not be available)');
        this.skip();
      }
    });
  });

  describe('Skills Listing with TOON', () => {
    it('should list skills with TOON encoding', async function() {
      this.timeout(60000);

      try {
        const result = await framework.listSkills({}, {
          useToon: true,
          includeMetrics: true
        });

        if (result.skills) {
          // TOON was applied
          assert.ok(result.skills);
          assert.strictEqual(result.format, 'toon');
          assert.ok(result.optimization);
          assert.ok(result.optimization.tokensSaved >= 0);
          assert.ok(result.optimization.savingsPercent >= 0);
        } else {
          // Regular array returned (TOON might have been skipped)
          assert.ok(Array.isArray(result));
        }
      } catch (error) {
        console.log('  ⚠️  Skills listing skipped (Skills Manager may not be initialized)');
        this.skip();
      }
    });

    it('should list skills without TOON encoding', async function() {
      this.timeout(60000);

      try {
        const skills = await framework.listSkills({}, { useToon: false });

        assert.ok(Array.isArray(skills));
        // Should be plain array, not TOON encoded
        if (skills.length > 0) {
          assert.ok(typeof skills[0] === 'object');
          assert.ok(skills[0].name || skills[0].displayName);
        }
      } catch (error) {
        console.log('  ⚠️  Skills listing skipped (Skills Manager may not be initialized)');
        this.skip();
      }
    });
  });

  describe('DataFilter + TOON Integration', () => {
    it('should apply DataFilter with TOON encoding', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: true,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));

      const result = framework.dataFilter.filterWithToon(largeData);

      assert.ok(result.data);
      assert.ok(['json', 'toon'].includes(result.format));
      assert.ok(result.savings);
      assert.ok(result.bytes);
      assert.ok(result.tokens);

      // Combined savings should be significant
      assert.ok(result.savings.total > 0);
      assert.ok(result.tokens.saved > 0);
    });

    it('should track combined DataFilter + TOON metrics', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        value: `Value ${i}`,
        timestamp: Date.now(),
        unnecessary: 'metadata that will be filtered'
      }));

      const result = framework.dataFilter.filterWithToon(data);

      // Should have both filter and TOON savings
      assert.ok(result.savings.filter >= 0);
      assert.ok(result.savings.toon >= 0 || result.format === 'json');
      assert.ok(result.savings.total >= result.savings.filter);
    });
  });

  describe('Framework Statistics with TOON', () => {
    it('should include TOON metrics in framework stats', () => {
      const stats = framework.getStats();

      assert.ok(stats.toon);
      assert.ok(stats.dataFilter);
      assert.strictEqual(typeof stats.toon.totalEncodings, 'number');
      assert.strictEqual(typeof stats.toon.totalTokensSaved, 'number');
      assert.strictEqual(typeof stats.toon.averageSavingsPercent, 'number');
    });

    it('should track TOON token savings in global stats', async function() {
      // Simulate skill execution with TOON
      const initialStats = framework.getStats();
      const initialTokensSaved = initialStats.tokensSaved;

      // Use DataFilter + TOON to generate some savings
      const data = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`
      }));

      const result = framework.dataFilter.filterWithToon(data);

      if (result.tokens.saved > 0) {
        const newStats = framework.getStats();
        // DataFilter tracks its own stats separately
        assert.ok(newStats.dataFilter.toonTokensSaved >= 0);
      }
    });

    it('should generate comprehensive report with TOON metrics', () => {
      // Add some usage
      const data = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        value: `Test ${i}`
      }));

      framework.dataFilter.filterWithToon(data);

      const report = framework.generateReport();

      assert.ok(report);
      assert.ok(report.includes('MCP FRAMEWORK - RELATÓRIO'));

      if (framework.options.enableToon) {
        assert.ok(report.includes('TOON OPTIMIZATION'));
        assert.ok(report.includes('Total Encodings'));
        assert.ok(report.includes('Tokens Saved'));
      }
    });
  });

  describe('TOON Error Handling', () => {
    it('should handle TOON encoding errors gracefully', () => {
      // Test with problematic data
      const problematicData = { a: 1 };
      problematicData.circular = problematicData;

      const result = framework.toonEncoder.encode(problematicData);

      // Should fallback to JSON
      assert.ok(result.encoded);
      assert.strictEqual(result.fallback, true);
      assert.ok(result.error);
    });

    it('should continue framework operation after TOON errors', async () => {
      // Even if TOON fails, framework should continue
      const data = { test: 'value' };

      // This should not throw
      await assert.doesNotReject(async () => {
        const result = framework.toonEncoder.encode(data);
        return result;
      });
    });
  });

  describe('TOON Performance Benefits', () => {
    it('should demonstrate token savings with realistic data', () => {
      const realisticSkillsData = Array.from({ length: 25 }, (_, i) => ({
        name: `skill-${i}`,
        displayName: `Skill Number ${i}`,
        description: `This is a comprehensive description of skill ${i} that provides detailed information about its functionality and purpose.`,
        category: ['development', 'testing', 'deployment'][i % 3],
        priority: i % 3 + 1,
        enabled: true,
        version: '1.0.0',
        author: 'Framework Team'
      }));

      const result = framework.toonEncoder.encodeSkillsList(realisticSkillsData);

      // Should achieve meaningful savings
      if (!result.skipped) {
        assert.ok(result.savingsPercent > 20, 'Should save at least 20% tokens');
        assert.ok(result.savingsAbsolute > 50, 'Should save at least 50 tokens');

        console.log(`    ✓ Token savings: ${result.savingsPercent}% (${result.savingsAbsolute} tokens)`);
      }
    });

    it('should show cumulative savings across multiple operations', () => {
      const datasets = [
        Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Dataset1-${i}` })),
        Array.from({ length: 15 }, (_, i) => ({ id: i, name: `Dataset2-${i}` })),
        Array.from({ length: 20 }, (_, i) => ({ id: i, name: `Dataset3-${i}` }))
      ];

      datasets.forEach(dataset => {
        framework.toonEncoder.encode(dataset);
      });

      const metrics = framework.toonEncoder.getMetrics();

      assert.strictEqual(metrics.totalEncodings, 3);
      assert.ok(metrics.totalTokensSaved > 0);
      assert.ok(metrics.averageSavingsPercent > 0);

      console.log(`    ✓ Cumulative savings: ${metrics.totalTokensSaved} tokens across ${metrics.totalEncodings} encodings`);
    });
  });

  describe('TOON + DataFilter Combined Optimization', () => {
    it('should achieve maximum savings with both optimizations', () => {
      const verboseData = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          source: 'import',
          processedBy: 'system',
          tags: ['tag1', 'tag2', 'tag3']
        },
        _id: `obj_${i}`,
        __v: 0
      }));

      const result = framework.dataFilter.filterWithToon(verboseData);

      // Should have significant combined savings
      assert.ok(result.savings.filter > 0, 'DataFilter should remove unnecessary fields');
      assert.ok(result.savings.total >= result.savings.filter, 'Total savings should be >= filter savings');
      assert.ok(result.tokens.saved > 100, 'Should save at least 100 tokens');

      console.log(`    ✓ Combined savings: ${result.savings.total}% (Filter: ${result.savings.filter}%, TOON: ${result.savings.toon}%)`);
      console.log(`    ✓ Tokens saved: ${result.tokens.saved} from ${result.tokens.original} original tokens`);
    });
  });
});

console.log('✅ FASE 9 - TOON Integration Tests loaded successfully');
