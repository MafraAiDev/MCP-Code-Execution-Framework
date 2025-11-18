/**
   * Unit tests for SkillLoader
   * Tests: skill loading, validation, dependencies, error handling
   */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const SkillLoader = require('../../skills/loader.cjs');

describe('SkillLoader', function() {
  this.timeout(5000);

  let loader;
  let mockRegistry;

  beforeEach(() => {
    // Mock registry with test skills
    mockRegistry = {
      skills: [
        {
          name: 'test-skill',
          displayName: 'Test Skill',
          description: 'A test skill',
          category: 'test',
          priority: 'medium',
          path: 'test/unit/fixtures/test-skill',
          version: '1.0.0',
          author: 'Test Author',
          parameters: {
            name: {
              type: 'string',
              required: true,
              description: 'Name parameter'
            }
          }
        },
        {
          name: 'invalid-skill',
          displayName: 'Invalid Skill',
          description: 'An invalid skill',
          category: 'test',
          priority: 'low',
          path: 'test/unit/fixtures/invalid-skill',
          version: '1.0.0'
        }
      ],
      totalSkills: 2
    };

    loader = new SkillLoader(mockRegistry);
  });

  describe('Initialization', () => {
    it('should initialize with registry', () => {
      assert.ok(loader);
      assert.ok(loader.registry);
      assert.strictEqual(loader.registry.totalSkills, 2);
    });

    it('should have empty loaded cache initially', () => {
      assert.ok(loader.loadedSkills);
      assert.strictEqual(Object.keys(loader.loadedSkills).length, 0);
    });
  });

  describe('loadSkill()', () => {
    it('should load valid skill successfully', async () => {
      // Create a mock skill package
      const tempDir = path.join(__dirname, 'fixtures', 'test-skill');
      const indexPath = path.join(tempDir, 'index.py');

      // Ensure directory exists
      await fs.promises.mkdir(tempDir, { recursive: true }).catch(() => {});

      // Create mock skill file
      const mockSkillCode = `
def execute(name, **kwargs):
    return f"Hello {name}! This is a test skill result."

if __name__ == "__main__":
    print(execute("Test"))
`;
      await fs.promises.writeFile(indexPath, mockSkillCode);

      try {
        const result = await loader.loadSkill('test-skill');
        assert.ok(result);
        assert.ok(result.name);
        assert.ok(result.version);
        assert.ok(result.metadata);
        assert.ok(result.path);
      } finally {
        // Cleanup
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
    });

    it('should throw error for non-existent skill', async () => {
      try {
        await loader.loadSkill('non-existent-skill');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('not found') || error.message.includes('not found in registry'));
      }
    });

    it('should throw error for skill with missing path', async () => {
      const invalidRegistry = {
        skills: [
          {
            name: 'no-path-skill',
            displayName: 'No Path Skill',
            description: 'Skill without path',
            category: 'test',
            priority: 'medium'
            // Missing path property
          }
        ],
        totalSkills: 1
      };

      const invalidLoader = new SkillLoader(invalidRegistry);

      try {
        await invalidLoader.loadSkill('no-path-skill');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('path') || error.message.includes('Path'));
      }
    });

    it('should handle skills with different entry points', async () => {
      // Test with __init__.py instead of index.py
      const tempDir = path.join(__dirname, 'fixtures', 'init-skill');
      const initPath = path.join(tempDir, '__init__.py');

      await fs.promises.mkdir(tempDir, { recursive: true }).catch(() => {});

      const mockInitCode = `
def execute(**kwargs):
    return "Skill loaded via __init__.py"
`;
      await fs.promises.writeFile(initPath, mockInitCode);

      const initRegistry = {
        skills: [
          {
            name: 'init-skill',
            displayName: 'Init Skill',
            description: 'Skill with __init__.py',
            category: 'test',
            priority: 'medium',
            path: 'test/unit/fixtures/init-skill'
          }
        ],
        totalSkills: 1
      };

      const initLoader = new SkillLoader(initRegistry);

      try {
        const result = await initLoader.loadSkill('init-skill');
        assert.ok(result);
        assert.strictEqual(result.name, 'init-skill');
      } finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
    });
  });

  describe('validateSkill()', () => {
    it('should validate valid skill metadata', async () => {
      const validMetadata = {
        name: 'valid-skill',
        version: '1.0.0',
        description: 'A valid test skill',
        author: 'Test Author',
        entry_point: 'execute'
      };

      const result = await loader.validateSkill(validMetadata);
      assert.ok(result);
      assert.strictEqual(result.valid, true);
      assert.ok(!result.errors || result.errors.length === 0);
    });

    it('should detect missing required fields', async () => {
      const invalidMetadata = {
        name: 'invalid-skill'
        // Missing version, description, author, entry_point
      };

      const result = await loader.validateSkill(invalidMetadata);
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors);
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.includes('version') || e.includes('required')));
    });

    it('should validate version format', async () => {
      const invalidVersionMetadata = {
        name: 'invalid-version-skill',
        version: 'invalid-version',
        description: 'Skill with invalid version',
        author: 'Test Author',
        entry_point: 'execute'
      };

      const result = await loader.validateSkill(invalidVersionMetadata);
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('version') || e.includes('semantic')));
    });

    it('should validate entry point exists', async () => {
      const noEntryPointMetadata = {
        name: 'no-entry-skill',
        version: '1.0.0',
        description: 'Skill without entry point',
        author: 'Test Author'
        // Missing entry_point
      };

      const result = await loader.validateSkill(noEntryPointMetadata);
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('entry_point') || e.includes('entry')));
    });
  });

  describe('getLoadedSkills()', () => {
    it('should return empty array when no skills loaded', () => {
      const loaded = loader.getLoadedSkills();
      assert.ok(Array.isArray(loaded));
      assert.strictEqual(loaded.length, 0);
    });

    it('should return loaded skills', async () => {
      // Create and load a skill
      const tempDir = path.join(__dirname, 'fixtures', 'loaded-skill');
      const indexPath = path.join(tempDir, 'index.py');

      await fs.promises.mkdir(tempDir, { recursive: true }).catch(() => {});
      await fs.promises.writeFile(indexPath, 'def execute(**kwargs): return "loaded"');

      const loadedRegistry = {
        skills: [
          {
            name: 'loaded-skill',
            displayName: 'Loaded Skill',
            description: 'A loaded skill',
            category: 'test',
            priority: 'medium',
            path: 'test/unit/fixtures/loaded-skill'
          }
        ],
        totalSkills: 1
      };

      const loadedLoader = new SkillLoader(loadedRegistry);

      try {
        await loadedLoader.loadSkill('loaded-skill');

        const loaded = loadedLoader.getLoadedSkills();
        assert.ok(Array.isArray(loaded));
        assert.strictEqual(loaded.length, 1);
        assert.strictEqual(loaded[0], 'loaded-skill');
      } finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
    });
  });

  describe('clearCache()', () => {
    it('should clear loaded skills cache', async () => {
      // Load a skill first
      const tempDir = path.join(__dirname, 'fixtures', 'cache-skill');
      const indexPath = path.join(tempDir, 'index.py');

      await fs.promises.mkdir(tempDir, { recursive: true }).catch(() => {});
      await fs.promises.writeFile(indexPath, 'def execute(**kwargs): return "cached"');

      const cacheRegistry = {
        skills: [
          {
            name: 'cache-skill',
            displayName: 'Cache Skill',
            description: 'A cached skill',
            category: 'test',
            priority: 'medium',
            path: 'test/unit/fixtures/cache-skill'
          }
        ],
        totalSkills: 1
      };

      const cacheLoader = new SkillLoader(cacheRegistry);

      try {
        await cacheLoader.loadSkill('cache-skill');
        assert.ok(Object.keys(cacheLoader.loadedSkills).length > 0);

        cacheLoader.clearCache();
        assert.strictEqual(Object.keys(cacheLoader.loadedSkills).length, 0);
      } finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      const nonExistentRegistry = {
        skills: [
          {
            name: 'missing-skill',
            displayName: 'Missing Skill',
            description: 'Skill with missing files',
            category: 'test',
            priority: 'medium',
            path: 'test/unit/fixtures/non-existent-path'
          }
        ],
        totalSkills: 1
      };

      const missingLoader = new SkillLoader(nonExistentRegistry);

      try {
        await missingLoader.loadSkill('missing-skill');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('not found') || error.message.includes('ENOENT'));
      }
    });

    it('should handle invalid Python syntax', async () => {
      const tempDir = path.join(__dirname, 'fixtures', 'syntax-error-skill');
      const indexPath = path.join(tempDir, 'index.py');

      await fs.promises.mkdir(tempDir, { recursive: true }).catch(() => {});
      await fs.promises.writeFile(indexPath, 'invalid python syntax !!!');

      const syntaxRegistry = {
        skills: [
          {
            name: 'syntax-error-skill',
            displayName: 'Syntax Error Skill',
            description: 'Skill with syntax errors',
            category: 'test',
            priority: 'medium',
            path: 'test/unit/fixtures/syntax-error-skill'
          }
        ],
        totalSkills: 1
      };

      const syntaxLoader = new SkillLoader(syntaxRegistry);

      try {
        await syntaxLoader.loadSkill('syntax-error-skill');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('syntax') || error.message.includes('invalid'));
      } finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
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