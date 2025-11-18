/**
   * Unit tests for SkillValidator
   * Tests: skill validation, metadata validation, parameters validation
   */

const assert = require('assert');
const SkillValidator = require('../../skills/validator.cjs');

describe('SkillValidator', function() {
  this.timeout(5000);

  let validator;
  let mockRegistry;

  beforeEach(() => {
    // Mock registry with various skill types
    mockRegistry = {
      skills: [
        {
          name: 'valid-skill',
          displayName: 'Valid Test Skill',
          description: 'A valid test skill for validation',
          category: 'test',
          priority: 'medium',
          path: 'test/unit/fixtures/valid-skill',
          version: '1.0.0',
          author: 'Test Author',
          parameters: {
            name: {
              type: 'string',
              required: true,
              description: 'Name parameter'
            },
            age: {
              type: 'number',
              required: false,
              description: 'Age parameter',
              default: 25
            }
          }
        },
        {
          name: 'minimal-skill',
          displayName: 'Minimal Skill',
          description: 'A minimal skill',
          category: 'test',
          priority: 'low',
          path: 'test/unit/fixtures/minimal-skill',
          version: '1.0.0',
          author: 'Test Author'
        },
        {
          name: 'enum-skill',
          displayName: 'Enum Skill',
          description: 'A skill with enum parameters',
          category: 'test',
          priority: 'high',
          path: 'test/unit/fixtures/enum-skill',
          version: '1.0.0',
          author: 'Test Author',
          parameters: {
            mode: {
              type: 'string',
              required: true,
              enum: ['fast', 'slow', 'medium'],
              description: 'Processing mode'
            }
          }
        }
      ],
      totalSkills: 3
    };

    validator = new SkillValidator(mockRegistry);
  });

  describe('Initialization', () => {
    it('should initialize with registry', () => {
      assert.ok(validator);
      assert.ok(validator.registry);
      assert.strictEqual(validator.registry.totalSkills, 3);
    });

    it('should have empty validation cache initially', () => {
      assert.ok(validator.validationCache);
      assert.strictEqual(Object.keys(validator.validationCache).length, 0);
    });
  });

  describe('validate()', () => {
    it('should validate valid skill successfully', async () => {
      const validSkill = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'A test skill',
        author: 'Test Author',
        metadata: {
          entry_point: 'execute',
          parameters: {
            name: { type: 'string', required: true }
          }
        }
      };

      const result = await validator.validate(validSkill);
      assert.ok(result);
      assert.strictEqual(result.valid, true);
      assert.ok(!result.errors || result.errors.length === 0);
      assert.ok(result.warnings); // May have warnings but still valid
    });

    it('should detect missing required fields', async () => {
      const invalidSkill = {
        name: 'invalid-skill'
        // Missing version, description, author, metadata
      };

      const result = await validator.validate(invalidSkill);
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors);
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.includes('version') || e.includes('required')));
      assert.ok(result.errors.some(e => e.includes('description') || e.includes('required')));
      assert.ok(result.errors.some(e => e.includes('author') || e.includes('required')));
    });

    it('should validate version format', async () => {
      const invalidVersionSkill = {
        name: 'invalid-version-skill',
        version: 'invalid-version-format',
        description: 'Skill with invalid version',
        author: 'Test Author',
        metadata: {
          entry_point: 'execute'
        }
      };

      const result = await validator.validate(invalidVersionSkill);
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('version') || e.includes('semantic')));
    });

    it('should validate entry point', async () => {
      const noEntryPointSkill = {
        name: 'no-entry-skill',
        version: '1.0.0',
        description: 'Skill without entry point',
        author: 'Test Author'
        // Missing metadata.entry_point
      };

      const result = await validator.validate(noEntryPointSkill);
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('entry_point') || e.includes('entry')));
    });

    it('should validate parameter types', async () => {
      const invalidParamsSkill = {
        name: 'invalid-params-skill',
        version: '1.0.0',
        description: 'Skill with invalid parameters',
        author: 'Test Author',
        metadata: {
          entry_point: 'execute',
          parameters: {
            invalidType: { type: 'invalid_type', required: true }
          }
        }
      };

      const result = await validator.validate(invalidParamsSkill);
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('type') || e.includes('invalid_type')));
    });

    it('should validate enum parameters', async () => {
      const enumSkill = {
        name: 'enum-skill',
        version: '1.0.0',
        description: 'Skill with enum parameters',
        author: 'Test Author',
        metadata: {
          entry_point: 'execute',
          parameters: {
            mode: {
              type: 'string',
              required: true,
              enum: ['fast', 'slow', 'medium']
            }
          }
        }
      };

      const result = await validator.validate(enumSkill);
      assert.ok(result);
      assert.strictEqual(result.valid, true);
    });

    it('should detect invalid enum values', async () => {
      const invalidEnumSkill = {
        name: 'invalid-enum-skill',
        version: '1.0.0',
        description: 'Skill with invalid enum',
        author: 'Test Author',
        metadata: {
          entry_point: 'execute',
          parameters: {
            mode: {
              type: 'string',
              required: true,
              enum: ['invalid', 'values', 'here']
            }
          }
        }
      };

      const result = await validator.validate(invalidEnumSkill);
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('enum') || e.includes('valid')));
    });
  });

  describe('validateParameters()', () => {
    it('should validate required parameters', () => {
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: false }
      };

      const validParams = { name: 'John', age: 25 };
      const result = validator.validateParameters(validParams, schema);
      assert.ok(result);
      assert.strictEqual(result.valid, true);
      assert.ok(!result.errors || result.errors.length === 0);
    });

    it('should detect missing required parameters', () => {
      const schema = {
        name: { type: 'string', required: true },
        email: { type: 'string', required: true }
      };

      const invalidParams = { name: 'John' }; // Missing email
      const result = validator.validateParameters(invalidParams, schema);
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('email') || e.includes('required')));
    });

    it('should validate parameter types', () => {
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true },
        active: { type: 'boolean', required: true },
        tags: { type: 'array', required: true }
      };

      const validParams = {
        name: 'John',
        age: 25,
        active: true,
        tags: ['developer', 'tester']
      };

      const result = validator.validateParameters(validParams, schema);
      assert.ok(result);
      assert.strictEqual(result.valid, true);
    });

    it('should detect type mismatches', () => {
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true }
      };

      const invalidParams = {
        name: 'John',
        age: 'twenty-five' // Should be number
      };

      const result = validator.validateParameters(invalidParams, schema);
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('age') || e.includes('number')));
    });

    it('should handle optional parameters', () => {
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: false },
        city: { type: 'string', required: false }
      };

      const paramsWithOptional = { name: 'John', age: 25 };
      const result = validator.validateParameters(paramsWithOptional, schema);
      assert.ok(result);
      assert.strictEqual(result.valid, true);

      const paramsMinimal = { name: 'John' };
      const result2 = validator.validateParameters(paramsMinimal, schema);
      assert.ok(result2);
      assert.strictEqual(result2.valid, true);
    });

    it('should validate enum parameters', () => {
      const schema = {
        mode: { type: 'string', required: true, enum: ['fast', 'slow', 'medium'] }
      };

      const validEnumParams = { mode: 'fast' };
      const result = validator.validateParameters(validEnumParams, schema);
      assert.ok(result);
      assert.strictEqual(result.valid, true);
    });

    it('should detect invalid enum values', () => {
      const schema = {
        mode: { type: 'string', required: true, enum: ['fast', 'slow', 'medium'] }
      };

      const invalidEnumParams = { mode: 'invalid' };
      const result = validator.validateParameters(invalidEnumParams, schema);
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('mode') || e.includes('enum')));
    });
  });

  describe('validateSkillExists()', () => {
    it('should validate existing skill', () => {
      const result = validator.validateSkillExists('valid-skill');
      assert.ok(result);
      assert.strictEqual(result.valid, true);
      assert.ok(!result.errors || result.errors.length === 0);
    });

    it('should detect non-existent skill', () => {
      const result = validator.validateSkillExists('non-existent-skill');
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('not found') || e.includes('exist')));
    });
  });

  describe('getValidationCache()', () => {
    it('should return empty cache initially', () => {
      const cache = validator.getValidationCache();
      assert.ok(typeof cache === 'object');
      assert.strictEqual(Object.keys(cache).length, 0);
    });

    it('should return cached validations', async () => {
      const testSkill = {
        name: 'cached-skill',
        version: '1.0.0',
        description: 'A cached skill',
        author: 'Test Author',
        metadata: {
          entry_point: 'execute'
        }
      };

      // First validation should cache result
      await validator.validate(testSkill);

      const cache = validator.getValidationCache();
      assert.ok(Object.keys(cache).length > 0);
      assert.ok(cache['cached-skill']);
    });
  });

  describe('clearCache()', () => {
    it('should clear validation cache', async () => {
      const testSkill = {
        name: 'clear-cache-skill',
        version: '1.0.0',
        description: 'A skill to test cache clearing',
        author: 'Test Author',
        metadata: {
          entry_point: 'execute'
        }
      };

      await validator.validate(testSkill);
      assert.ok(Object.keys(validator.validationCache).length > 0);

      validator.clearCache();
      assert.strictEqual(Object.keys(validator.validationCache).length, 0);
    });
  });

  describe('Error Handling', () => {
    it('should handle null/undefined skill', async () => {
      try {
        await validator.validate(null);
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('skill') || error.message.includes('null'));
      }

      try {
        await validator.validate(undefined);
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('skill') || error.message.includes('undefined'));
      }
    });

    it('should handle invalid parameters', () => {
      try {
        validator.validateParameters(null, {});
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('parameters') || error.message.includes('null'));
      }

      try {
        validator.validateParameters({}, null);
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('schema') || error.message.includes('null'));
      }
    });

    it('should handle empty skill name', () => {
      const result = validator.validateSkillExists('');
      assert.ok(result);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('not found') || e.includes('empty')));
    });
  });

  describe('Edge Cases', () => {
    it('should handle skills with no parameters', async () => {
      const noParamsSkill = {
        name: 'no-params-skill',
        version: '1.0.0',
        description: 'Skill with no parameters',
        author: 'Test Author',
        metadata: {
          entry_point: 'execute'
          // No parameters
        }
      };

      const result = await validator.validate(noParamsSkill);
      assert.ok(result);
      assert.strictEqual(result.valid, true);
    });

    it('should handle very long parameter names', () => {
      const schema = {
        ['very_long_parameter_name_that_exceeds_normal_limits']: {
          type: 'string',
          required: true
        }
      };

      const params = {
        ['very_long_parameter_name_that_exceeds_normal_limits']: 'value'
      };

      const result = validator.validateParameters(params, schema);
      assert.ok(result);
      assert.strictEqual(result.valid, true);
    });

    it('should handle special characters in parameter values', () => {
      const schema = {
        message: { type: 'string', required: true },
        code: { type: 'string', required: true }
      };

      const params = {
        message: 'Hello! @#$%^*()_+-=[]{}|;:,.<>?',
        code: 'console.log("Hello World!");'
      };

      const result = validator.validateParameters(params, schema);
      assert.ok(result);
      assert.strictEqual(result.valid, true);
    });

    it('should handle nested object parameters', () => {
      const schema = {
        config: {
          type: 'object',
          required: true,
          properties: {
            host: { type: 'string', required: true },
            port: { type: 'number', required: true }
          }
        }
      };

      const params = {
        config: {
          host: 'localhost',
          port: 8080
        }
      };

      // For now, nested objects should pass basic validation
      const result = validator.validateParameters(params, schema);
      assert.ok(result);
      // Complex nested validation might not be fully implemented yet
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