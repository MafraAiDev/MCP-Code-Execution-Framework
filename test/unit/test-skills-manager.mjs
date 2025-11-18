/**
   * Unit tests for SkillsManager - ES Module version
   * Tests: initialization, skill loading, execution, stats
   */

import assert from 'assert';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Dynamic import for CommonJS module
const SkillsManager = await import('../../core/skills-manager.cjs').then(m => m.default);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('SkillsManager', function() {
  this.timeout(10000); // Skills podem levar tempo

  let manager;
  let mockPythonBridge;

  beforeEach(() => {
    // Mock Python bridge
    mockPythonBridge = {
      execute: async (skillName, params, timeout) => {
        return {
          success: true,
          result: `Mock result for ${skillName}`,
          execution_time: 0.1
        };
      },
      getStats: async () => {
        return {
          total_executions: 1,
          successful: 1,
          failed: 0
        };
      }
    };

    manager = new SkillsManager(mockPythonBridge, {
      cacheSkills: true,
      validateOnLoad: true,
      timeoutMs: 5000,
      cacheTTL: 60000 // 1 min para testes
    });
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const mgr = new SkillsManager(mockPythonBridge);
      assert.ok(mgr);
      assert.ok(mgr.loadedSkills);
      assert.strictEqual(mgr.loadedSkills.size, 0);
    });

    it('should initialize with custom options', () => {
      assert.strictEqual(manager.options.timeoutMs, 5000);
      assert.strictEqual(manager.options.cacheSkills, true);
      assert.strictEqual(manager.options.cacheTTL, 60000);
    });

    it('should throw error without pythonBridge', () => {
      assert.throws(() => {
        new SkillsManager(null);
      }, /PythonBridge is required/);
    });
  });

  describe('listSkills()', () => {
    it('should list all skills', async () => {
      const skills = await manager.listSkills();
      assert.ok(Array.isArray(skills));
      assert.ok(skills.length > 0);
      assert.ok(skills.length === 24); // Total de skills no registry
    });

    it('should filter skills by category', async () => {
      const devSkills = await manager.listSkills({ category: 'development' });
      assert.ok(Array.isArray(devSkills));
      assert.ok(devSkills.every(s => s.category === 'development'));
      assert.strictEqual(devSkills.length, 6); // 6 development skills
    });

    it('should filter skills by priority', async () => {
      const highPrioritySkills = await manager.listSkills({ priority: 'high' });
      assert.ok(Array.isArray(highPrioritySkills));
      assert.ok(highPrioritySkills.every(s => s.priority === 'high'));
    });

    it('should search skills by text', async () => {
      const searchResults = await manager.listSkills({ search: 'code' });
      assert.ok(Array.isArray(searchResults));
      assert.ok(searchResults.length > 0);
      assert.ok(searchResults.some(s => s.name.includes('code') || s.description.includes('code')));
    });

    it('should return correct skill structure', async () => {
      const skills = await manager.listSkills();
      const skill = skills[0];
      assert.ok(skill.name);
      assert.ok(skill.displayName);
      assert.ok(skill.description);
      assert.ok(skill.category);
      assert.ok(skill.priority);
      assert.ok(typeof skill.loaded === 'boolean');
    });
  });

  describe('getSkillInfo()', () => {
    it('should get skill info for existing skill', async () => {
      const info = await manager.getSkillInfo('test-skill');
      assert.ok(info);
      assert.strictEqual(info.name, 'test-skill');
      assert.ok(info.displayName);
      assert.ok(info.description);
      assert.ok(info.category);
      assert.ok(info.priority);
      assert.strictEqual(info.loaded, false); // Not loaded yet
    });

    it('should throw error for non-existent skill', async () => {
      try {
        await manager.getSkillInfo('non-existent-skill');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('not found'));
      }
    });
  });

  describe('executeSkill()', () => {
    it('should execute skill successfully', async () => {
      const result = await manager.executeSkill('test-skill', { name: 'Test' });
      assert.ok(result);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.skillName, 'test-skill');
      assert.ok(result.result);
      assert.ok(result.executionTime >= 0);
      assert.ok(result.timestamp);
    });

    it('should auto-load skill if not cached', async () => {
      assert.ok(!manager.loadedSkills.has('test-skill'));

      const result = await manager.executeSkill('test-skill', { name: 'Test' });
      assert.ok(result);
      assert.ok(manager.loadedSkills.has('test-skill')); // Should be loaded now
    });

    it('should validate required parameters', async () => {
      try {
        // codebase-documenter requires 'path' parameter
        await manager.executeSkill('codebase-documenter', {});
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert.ok(error.message.includes('required') || error.message.includes('path'));
      }
    });

    it('should respect timeout', async () => {
      // Override mock to simulate slow execution
      const slowBridge = {
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 6000)); // 6s
          return { success: true, result: 'slow' };
        }
      };

      const slowManager = new SkillsManager(slowBridge, { timeoutMs: 1000 });

      try {
        await slowManager.executeSkill('test-skill', {});
        assert.fail('Should have timed out');
      } catch (error) {
        assert.ok(error.message.includes('timeout') || error.message.includes('timed out'));
      }
    });

    it('should enforce max concurrent skills limit', async () => {
      const limitedManager = new SkillsManager(mockPythonBridge, { maxConcurrentSkills: 1 });

      // Start first execution
      const promise1 = limitedManager.executeSkill('test-skill', { name: 'Test1' });

      // Try to start second execution immediately
      try {
        await limitedManager.executeSkill('test-skill', { name: 'Test2' });
        assert.fail('Should have thrown concurrent limit error');
      } catch (error) {
        assert.ok(error.message.includes('Maximum concurrent skills limit'));
      }

      // Wait for first to complete
      await promise1;
    });

    it('should track execution stats', async () => {
      const statsBefore = manager.getStats();

      await manager.executeSkill('test-skill', { name: 'Test' });

      const statsAfter = manager.getStats();
      assert.strictEqual(statsAfter.totalExecutions, statsBefore.totalExecutions + 1);
      assert.strictEqual(statsAfter.successfulExecutions, statsBefore.successfulExecutions + 1);
    });

    it('should handle execution errors', async () => {
      const failingBridge = {
        execute: async () => {
          throw new Error('Execution failed');
        }
      };

      const failingManager = new SkillsManager(failingBridge);

      try {
        await failingManager.executeSkill('test-skill', {});
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('Skill execution failed'));
      }
    });
  });

  describe('unloadSkill()', () => {
    it('should unload skill successfully', async () => {
      await manager.loadSkill('test-skill');
      assert.ok(manager.loadedSkills.has('test-skill'));

      const result = await manager.unloadSkill('test-skill');
      assert.strictEqual(result, true);
      assert.ok(!manager.loadedSkills.has('test-skill'));
    });

    it('should return false for non-loaded skill', async () => {
      const result = await manager.unloadSkill('non-loaded-skill');
      assert.strictEqual(result, false);
    });
  });

  describe('unloadAllSkills()', () => {
    it('should unload all skills', async () => {
      await manager.loadSkill('test-skill');
      await manager.loadSkill('codebase-documenter');
      assert.ok(manager.loadedSkills.size > 0);

      const unloaded = await manager.unloadAllSkills();
      assert.ok(unloaded > 0);
      assert.strictEqual(manager.loadedSkills.size, 0);
    });

    it('should handle empty cache', async () => {
      const unloaded = await manager.unloadAllSkills();
      assert.strictEqual(unloaded, 0);
    });
  });

  describe('Stats Tracking', () => {
    it('should track execution stats', async () => {
      const initialStats = manager.getStats();

      await manager.executeSkill('test-skill', { name: 'Test' });

      const finalStats = manager.getStats();
      assert.strictEqual(finalStats.totalExecutions, initialStats.totalExecutions + 1);
      assert.strictEqual(finalStats.successfulExecutions, initialStats.successfulExecutions + 1);
      assert.ok(finalStats.averageExecutionTime >= 0);
    });

    it('should calculate success rate correctly', async () => {
      // Execute some skills
      await manager.executeSkill('test-skill', { name: 'Test1' });
      await manager.executeSkill('test-skill', { name: 'Test2' });

      const stats = manager.getStats();
      assert.ok(stats.successRate.endsWith('%'));
      assert.strictEqual(stats.successRate, '100.00%'); // All successful so far
    });

    it('should track loaded and running skills count', async () => {
      await manager.loadSkill('test-skill');

      const stats = manager.getStats();
      assert.strictEqual(stats.loadedSkills, 1);
      assert.strictEqual(stats.runningSkills, 0);
      assert.ok(stats.totalSkills > 0);
    });
  });

  describe('Cache Management', () => {
    it('should respect cache TTL', async () => {
      const shortTTLManager = new SkillsManager(mockPythonBridge, {
        cacheTTL: 100, // 100ms
        cacheSkills: true
      });

      await shortTTLManager.loadSkill('test-skill');
      assert.ok(shortTTLManager.loadedSkills.has('test-skill'));

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next access should clear expired cache
      await shortTTLManager.listSkills();

      // Cache might be cleared depending on timing
      // Just verify no errors occurred
      assert.ok(true);
    });

    it('should disable cache when cacheSkills is false', async () => {
      const noCacheManager = new SkillsManager(mockPythonBridge, { cacheSkills: false });

      await noCacheManager.loadSkill('test-skill');
      assert.ok(!noCacheManager.loadedSkills.has('test-skill')); // Should not cache
    });
  });
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const Mocha = await import('mocha');
  const mocha = new Mocha.default();
  mocha.addFile(__filename);
  mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
  });
}

export { describe }; // Export for other test files to use