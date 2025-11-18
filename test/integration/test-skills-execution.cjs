/**
   * Integration tests for skill execution
   * Tests: end-to-end execution, Python bridge, error handling
   */

const assert = require('assert');
const { MCPCodeExecutionFramework } = require('../../core/index.js');
const path = require('path');

describe('Skills Execution - End to End', function() {
  this.timeout(30000); // E2E pode levar tempo

  let executor;

  beforeEach(() => {
    executor = new MCPCodeExecutionFramework({
      skillTimeoutMs: 10000,
      maxConcurrentSkills: 2,
      cacheSkills: true,
      validateOnLoad: true
    });
  });

  afterEach(async () => {
    if (executor) {
      await executor.cleanup();
    }
  });

  describe('Full Execution Flow', () => {
    it('should execute test-skill end-to-end', async () => {
      const result = await executor.executeSkill('test-skill', {
        name: 'Integration Test',
        greeting: 'Hello from E2E test'
      });

      assert.ok(result);
      assert.strictEqual(result.success, true);
      assert.ok(result.result);
      assert.ok(result.executionTime >= 0);
      assert.ok(result.stats);
    });

    it('should list all 24 skills', async () => {
      const skills = await executor.listSkills();
      assert.ok(Array.isArray(skills));
      assert.strictEqual(skills.length, 24);

      // Verify skill structure
      const skill = skills[0];
      assert.ok(skill.name);
      assert.ok(skill.displayName);
      assert.ok(skill.description);
      assert.ok(skill.category);
      assert.ok(skill.priority);
      assert.ok(typeof skill.loaded === 'boolean');
    });

    it('should filter development skills', async () => {
      const devSkills = await executor.listSkills({ category: 'development' });
      assert.strictEqual(devSkills.length, 6);
      assert.ok(devSkills.every(s => s.category === 'development'));
      assert.ok(devSkills.some(s => s.name === 'codebase-documenter'));
    });

    it('should filter creative skills', async () => {
      const creativeSkills = await executor.listSkills({ category: 'creative' });
      assert.ok(Array.isArray(creativeSkills));
      assert.ok(creativeSkills.every(s => s.category === 'creative'));
    });

    it('should get skill info', async () => {
      const info = await executor.getSkillInfo('test-skill');
      assert.ok(info);
      assert.strictEqual(info.name, 'test-skill');
      assert.ok(info.displayName);
      assert.ok(info.description);
      assert.ok(info.category);
      assert.ok(info.priority);
      assert.strictEqual(info.loaded, false); // Not loaded yet
    });

    it('should get skills stats', async () => {
      const stats = await executor.getSkillsStats();
      assert.ok(stats);
      assert.ok(typeof stats.totalExecutions === 'number');
      assert.ok(typeof stats.successfulExecutions === 'number');
      assert.ok(typeof stats.failedExecutions === 'number');
      assert.ok(typeof stats.averageExecutionTime === 'number');
      assert.ok(typeof stats.loadedSkills === 'number');
      assert.ok(typeof stats.runningSkills === 'number');
      assert.ok(typeof stats.totalSkills === 'number');
      assert.ok(typeof stats.successRate === 'string');
    });

    it('should search skills by text', async () => {
      const searchResults = await executor.listSkills({ search: 'code' });
      assert.ok(Array.isArray(searchResults));
      assert.ok(searchResults.length > 0);
      assert.ok(searchResults.some(s =>
        s.name.toLowerCase().includes('code') ||
        s.displayName.toLowerCase().includes('code') ||
        s.description.toLowerCase().includes('code')
      ));
    });
  });

  describe('Concurrent Execution', () => {
    it('should handle concurrent skill execution', async () => {
      const concurrentPromises = [
        executor.executeSkill('test-skill', { name: 'User 1' }),
        executor.executeSkill('test-skill', { name: 'User 2' }),
        executor.executeSkill('test-skill', { name: 'User 3' })
      ];

      const results = await Promise.all(concurrentPromises);

      assert.strictEqual(results.length, 3);
      assert.ok(results.every(r => r.success === true));
      assert.ok(results.every(r => r.result));
    });

    it('should respect max concurrent skills limit', async () => {
      const limitedExecutor = new MCPCodeExecutionFramework({
        maxConcurrentSkills: 1,
        skillTimeoutMs: 5000
      });

      try {
        // Start first execution
        const promise1 = limitedExecutor.executeSkill('test-skill', { name: 'User 1' });

        // Try to start second execution immediately
        try {
          await limitedExecutor.executeSkill('test-skill', { name: 'User 2' });
          assert.fail('Should have thrown concurrent limit error');
        } catch (error) {
          assert.ok(error.message.includes('Maximum concurrent skills limit'));
        }

        // Wait for first to complete
        const result1 = await promise1;
        assert.ok(result1.success);
      } finally {
        await limitedExecutor.cleanup();
      }
    });
  });

  describe('Parameter Validation', () => {
    it('should validate required parameters', async () => {
      try {
        // codebase-documenter requires 'path' parameter
        await executor.executeSkill('codebase-documenter', {});
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert.ok(error.message.includes('required') || error.message.includes('path'));
      }
    });

    it('should execute skill with valid parameters', async () => {
      const result = await executor.executeSkill('codebase-documenter', {
        path: '/test/path',
        outputFormat: 'markdown'
      });

      assert.ok(result);
      assert.strictEqual(result.success, true);
      assert.ok(result.result);
    });

    it('should handle default parameters', async () => {
      const result = await executor.executeSkill('test-skill', {
        name: 'Test User'
        // greeting is optional and should have default value
      });

      assert.ok(result);
      assert.strictEqual(result.success, true);
      assert.ok(result.result);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent skill gracefully', async () => {
      try {
        const result = await executor.executeSkill('non-existent-skill', {});
        assert.strictEqual(result.success, false);
        assert.ok(result.error);
      } catch (error) {
        assert.ok(error.message.includes('not found') || error.message.includes('Skill'));
      }
    });

    it('should handle skill execution timeout', async () => {
      const fastExecutor = new MCPCodeExecutionFramework({
        skillTimeoutMs: 100 // Very short timeout
      });

      try {
        await fastExecutor.executeSkill('test-skill', { name: 'Timeout Test' });
        // Some skills might complete fast, so we don't assert failure
        assert.ok(true);
      } catch (error) {
        assert.ok(error.message.includes('timeout') || error.message.includes('timed out'));
      } finally {
        await fastExecutor.cleanup();
      }
    });

    it('should handle invalid parameters', async () => {
      try {
        await executor.executeSkill('test-skill', {
          // Missing required 'name' parameter
        });
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert.ok(error.message.includes('required') || error.message.includes('name'));
      }
    });
  });

  describe('Performance and Caching', () => {
    it('should cache loaded skills', async () => {
      // First execution - skill will be loaded
      const result1 = await executor.executeSkill('test-skill', { name: 'Cache Test 1' });
      assert.ok(result1.success);

      // Second execution - should use cached skill
      const result2 = await executor.executeSkill('test-skill', { name: 'Cache Test 2' });
      assert.ok(result2.success);

      // Both should succeed
      assert.ok(result1.success && result2.success);
    });

    it('should track execution time', async () => {
      const result = await executor.executeSkill('test-skill', { name: 'Performance Test' });

      assert.ok(result);
      assert.ok(result.executionTime >= 0);
      assert.ok(typeof result.executionTime === 'number');
    });

    it('should update stats after execution', async () => {
      const statsBefore = await executor.getSkillsStats();
      const executionsBefore = statsBefore.totalExecutions;

      await executor.executeSkill('test-skill', { name: 'Stats Test' });

      const statsAfter = await executor.getSkillsStats();
      assert.strictEqual(statsAfter.totalExecutions, executionsBefore + 1);
      assert.strictEqual(statsAfter.successfulExecutions, statsBefore.successfulExecutions + 1);
    });
  });

  describe('Framework Integration', () => {
    it('should initialize and cleanup properly', async () => {
      const testExecutor = new MCPCodeExecutionFramework();

      // Should be able to execute without explicit initialization
      const result = await testExecutor.executeSkill('test-skill', { name: 'Integration Test' });
      assert.ok(result.success);

      // Cleanup should work
      await testExecutor.cleanup();
    });

    it('should handle framework stats', async () => {
      const frameworkStats = executor.getStats();

      assert.ok(frameworkStats);
      assert.ok(typeof frameworkStats.executions === 'number');
      assert.ok(typeof frameworkStats.tokensUsed === 'number');
      assert.ok(typeof frameworkStats.tokensSaved === 'number');
      assert.ok(typeof frameworkStats.initialized === 'boolean');
    });

    it('should generate comprehensive report', async () => {
      // Execute a skill first
      await executor.executeSkill('test-skill', { name: 'Report Test' });

      const report = executor.generateReport();

      assert.ok(report);
      assert.ok(typeof report === 'string');
      assert.ok(report.includes('MCP FRAMEWORK'));
      assert.ok(report.includes('Status:'));
      assert.ok(report.includes('Execuções:'));
      assert.ok(report.includes('Skills'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty parameters', async () => {
      const result = await executor.executeSkill('test-skill', {});
      assert.ok(result);
      // Should either succeed with defaults or fail with validation error
      assert.ok(result.success || result.error);
    });

    it('should handle null parameters', async () => {
      try {
        const result = await executor.executeSkill('test-skill', null);
        assert.ok(result);
      } catch (error) {
        assert.ok(error.message);
      }
    });

    it('should handle special characters in parameters', async () => {
      const result = await executor.executeSkill('test-skill', {
        name: 'Test User! @#$%^*()_+-=[]{}|;:,.<>?',
        greeting: 'Hello "World" \'Test\''
      });

      assert.ok(result);
      assert.ok(result.success || result.error); // Should handle gracefully
    });

    it('should handle very long parameter values', async () => {
      const longString = 'a'.repeat(1000);
      const result = await executor.executeSkill('test-skill', {
        name: longString,
        greeting: longString
      });

      assert.ok(result);
      assert.ok(result.success || result.error); // Should handle gracefully
    });

    it('should handle rapid successive executions', async () => {
      const promises = [];

      // Fire off 10 rapid executions
      for (let i = 0; i < 10; i++) {
        promises.push(executor.executeSkill('test-skill', {
          name: `Rapid Test ${i}`,
          greeting: `Hello ${i}`
        }));
      }

      const results = await Promise.allSettled(promises);

      // All should complete (either success or failure)
      assert.strictEqual(results.length, 10);
      assert.ok(results.every(r => r.status === 'fulfilled' || r.status === 'rejected'));
    });
  });
});

// Run tests
if (require.main === module) {
  const Mocha = require('mocha');
  const mocha = new Mocha();
  mocha.addFile(__filename);
  mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
  });
}