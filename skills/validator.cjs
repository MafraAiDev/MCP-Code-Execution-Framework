/**
 * @fileoverview Skill Validator - Valida skills carregadas do MCP Framework
 * @module skills/validator
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * Validator responsável por validar skills carregadas
 */
class SkillValidator {
  /**
   * @param {Object} registry - Registry de skills
   */
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Valida uma skill carregada
   * @param {Object} skill - Skill carregada
   * @returns {Promise<Object>} Resultado da validação
   */
  async validate(skill) {
    const errors = [];
    const warnings = [];

    try {
      // Validação básica de estrutura
      if (!skill || typeof skill !== 'object') {
        errors.push('Skill must be an object');
        return { valid: false, errors, warnings };
      }

      // Validação de schema
      const schemaValidation = await this._validateSchema(skill);
      if (!schemaValidation.valid) {
        errors.push(...schemaValidation.errors);
      }

      // Validação de dependências
      const depsValidation = await this._validateDependencies(skill);
      if (!depsValidation.valid) {
        errors.push(...depsValidation.errors);
      }

      // Validação de arquivos
      const filesValidation = await this._validateFiles(skill);
      if (!filesValidation.valid) {
        errors.push(...filesValidation.errors);
      }
      warnings.push(...filesValidation.warnings);

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Valida schema da skill
   * @private
   */
  async _validateSchema(skill) {
    const errors = [];
    const requiredFields = ['name', 'path', 'module', 'metadata'];

    for (const field of requiredFields) {
      if (!skill[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validar metadata
    if (skill.metadata) {
      const metadataFields = ['name', 'description', 'category', 'version'];
      for (const field of metadataFields) {
        if (!skill.metadata[field]) {
          errors.push(`Missing metadata field: ${field}`);
        }
      }
    }

    // Validar módulo
    if (skill.module) {
      if (typeof skill.module !== 'object' && typeof skill.module !== 'function') {
        errors.push('Skill module must be an object or function');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Valida dependências da skill
   * @private
   */
  async _validateDependencies(skill) {
    const errors = [];

    if (!skill.metadata || !skill.metadata.dependencies) {
      return { valid: true, errors };
    }

    const dependencies = skill.metadata.dependencies;
    if (!Array.isArray(dependencies)) {
      errors.push('Dependencies must be an array');
      return { valid: false, errors };
    }

    for (const dep of dependencies) {
      if (typeof dep !== 'string') {
        errors.push(`Invalid dependency format: ${JSON.stringify(dep)}`);
        continue;
      }

      // Verificar dependências conhecidas
      if (dep === 'python-bridge') {
        // Python bridge é validado no runtime
        continue;
      }

      // Verificar se é um módulo Node.js válido
      try {
        require.resolve(dep);
      } catch {
        errors.push(`Unknown dependency: ${dep}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Valida arquivos da skill
   * @private
   */
  async _validateFiles(skill) {
    const errors = [];
    const warnings = [];

    try {
      const skillPath = skill.path;

      // Verificar se diretório existe
      try {
        const stats = await fs.stat(skillPath);
        if (!stats.isDirectory()) {
          errors.push(`Skill path '${skillPath}' is not a directory`);
          return { valid: false, errors, warnings };
        }
      } catch {
        errors.push(`Skill directory not found: ${skillPath}`);
        return { valid: false, errors, warnings };
      }

      // Verificar arquivos recomendados
      const recommendedFiles = [
        'SKILL.md',
        'package.json',
        'README.md'
      ];

      for (const file of recommendedFiles) {
        const filePath = path.join(skillPath, file);
        try {
          await fs.access(filePath);
        } catch {
          warnings.push(`Recommended file not found: ${file}`);
        }
      }

      // Verificar se entrypoint existe
      if (skill.metadata && skill.metadata.entrypoint) {
        const entryPath = path.join(skillPath, skill.metadata.entrypoint);
        try {
          await fs.access(entryPath);
        } catch {
          errors.push(`Entrypoint file not found: ${skill.metadata.entrypoint}`);
        }
      }

      // Verificar estrutura de diretórios
      const subdirs = ['test', 'docs', 'examples'];
      for (const subdir of subdirs) {
        const subdirPath = path.join(skillPath, subdir);
        try {
          await fs.stat(subdirPath);
        } catch {
          // Diretórios opcionais, apenas warning
          // warnings.push(`Optional directory not found: ${subdir}`);
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      errors.push(`File validation error: ${error.message}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Valida parâmetros de uma skill
   * @param {Object} params - Parâmetros a validar
   * @param {Object} parameterSchema - Schema de parâmetros
   * @returns {Object} Resultado da validação
   */
  validateParameters(params, parameterSchema) {
    const errors = [];

    if (!parameterSchema || typeof parameterSchema !== 'object') {
      return { valid: true, errors };
    }

    for (const [paramName, paramConfig] of Object.entries(parameterSchema)) {
      const value = params[paramName];

      // Verificar required
      if (paramConfig.required && (value === undefined || value === null)) {
        errors.push(`Required parameter '${paramName}' is missing`);
        continue;
      }

      // Se não é required e não foi fornecido, pular validação de tipo
      if (value === undefined || value === null) {
        continue;
      }

      // Verificar tipo
      if (paramConfig.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== paramConfig.type) {
          errors.push(`Parameter '${paramName}' must be of type ${paramConfig.type}, got ${actualType}`);
        }
      }

      // Verificar enum
      if (paramConfig.enum && Array.isArray(paramConfig.enum)) {
        if (!paramConfig.enum.includes(value)) {
          errors.push(`Parameter '${paramName}' must be one of: ${paramConfig.enum.join(', ')}`);
        }
      }

      // Verificar pattern (regex)
      if (paramConfig.pattern && typeof value === 'string') {
        const regex = new RegExp(paramConfig.pattern);
        if (!regex.test(value)) {
          errors.push(`Parameter '${paramName}' does not match required pattern`);
        }
      }

      // Verificar min/max para números
      if (paramConfig.type === 'number' && typeof value === 'number') {
        if (paramConfig.min !== undefined && value < paramConfig.min) {
          errors.push(`Parameter '${paramName}' must be at least ${paramConfig.min}`);
        }
        if (paramConfig.max !== undefined && value > paramConfig.max) {
          errors.push(`Parameter '${paramName}' must be at most ${paramConfig.max}`);
        }
      }

      // Verificar minLength/maxLength para strings
      if (paramConfig.type === 'string' && typeof value === 'string') {
        if (paramConfig.minLength !== undefined && value.length < paramConfig.minLength) {
          errors.push(`Parameter '${paramName}' must be at least ${paramConfig.minLength} characters long`);
        }
        if (paramConfig.maxLength !== undefined && value.length > paramConfig.maxLength) {
          errors.push(`Parameter '${paramName}' must be at most ${paramConfig.maxLength} characters long`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Valida se uma skill existe no registry
   * @param {string} skillName - Nome da skill
   * @returns {boolean} Se a skill existe
   */
  isValidSkill(skillName) {
    return this.registry.skills.some(s => s.name === skillName);
  }

  /**
   * Obtém schema de uma skill
   * @param {string} skillName - Nome da skill
   * @returns {Object|null} Schema da skill
   */
  getSkillSchema(skillName) {
    const skill = this.registry.skills.find(s => s.name === skillName);
    return skill ? skill.parameters : null;
  }

  /**
   * Obtém estatísticas do validator
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      totalSkills: this.registry.totalSkills
    };
  }
}

module.exports = SkillValidator;