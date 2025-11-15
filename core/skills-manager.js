/**
 * @fileoverview Skills Manager - Gerencia carregamento e execução de Claude Skills
 * @module core/skills-manager
 */

const path = require('path');
const SkillLoader = require('../skills/loader');
const SkillValidator = require('../skills/validator');

/**
 * Gerenciador centralizado de Skills do MCP Framework
 * Responsável por carregar, validar e executar skills
 */
class SkillsManager {
  /**
   * @param {Object} pythonBridge - Instância do Python Bridge
   * @param {Object} options - Opções de configuração
   */
  constructor(pythonBridge, options = {}) {
    if (!pythonBridge) {
      throw new Error('PythonBridge is required for SkillsManager');
    }

    this.pythonBridge = pythonBridge;
    this.options = {
      cacheSkills: options.cacheSkills !== false,
      validateOnLoad: options.validateOnLoad !== false,
      timeoutMs: options.timeoutMs || 30000,
      maxConcurrentSkills: options.maxConcurrentSkills || 3,
      ...options
    };

    // Cache de skills carregadas
    this.loadedSkills = new Map();

    // Contador de execuções
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    };

    // Carrega registry
    this.registry = this._loadRegistry();

    // Inicializa loader e validator
    this.loader = new SkillLoader(this.registry);
    this.validator = new SkillValidator(this.registry);

    // Skills em execução
    this.runningSkills = new Map();
  }

  /**
   * Carrega registry de skills
   * @private
   * @returns {Object} Registry object
   */
  _loadRegistry() {
    try {
      const registryPath = path.join(__dirname, '../skills/registry.json');
      const registryData = require(registryPath);

      if (!registryData.skills || !Array.isArray(registryData.skills)) {
        throw new Error('Invalid registry format: missing skills array');
      }

      return registryData;
    } catch (error) {
      throw new Error(`Failed to load skills registry: ${error.message}`);
    }
  }

  /**
   * Lista todas as skills disponíveis
   * @param {Object} filters - Filtros opcionais (category, priority)
   * @returns {Promise<Array>} Lista de skills
   */
  async listSkills(filters = {}) {
    let skills = this.registry.skills;

    // Aplicar filtros
    if (filters.category) {
      skills = skills.filter(s => s.category === filters.category);
    }

    if (filters.priority) {
      skills = skills.filter(s => s.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      skills = skills.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.displayName.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower)
      );
    }

    return skills.map(s => ({
      name: s.name,
      displayName: s.displayName,
      description: s.description,
      category: s.category,
      priority: s.priority,
      loaded: this.loadedSkills.has(s.name)
    }));
  }

  /**
   * Obtém informações detalhadas de uma skill
   * @param {string} skillName - Nome da skill
   * @returns {Promise<Object>} Informações da skill
   */
  async getSkillInfo(skillName) {
    const skill = this.registry.skills.find(s => s.name === skillName);

    if (!skill) {
      throw new Error(`Skill '${skillName}' not found in registry`);
    }

    return {
      ...skill,
      loaded: this.loadedSkills.has(skillName),
      executionCount: this.loadedSkills.get(skillName)?.executionCount || 0
    };
  }

  /**
   * Carrega uma skill na memória
   * @param {string} skillName - Nome da skill a carregar
   * @returns {Promise<Object>} Metadados da skill carregada
   */
  async loadSkill(skillName) {
    // Validar nome da skill
    if (!skillName || typeof skillName !== 'string') {
      throw new Error('Skill name must be a non-empty string');
    }

    // Verificar se já está carregada (cache)
    if (this.options.cacheSkills && this.loadedSkills.has(skillName)) {
      return this.loadedSkills.get(skillName).metadata;
    }

    // Buscar skill no registry
    const skillInfo = this.registry.skills.find(s => s.name === skillName);
    if (!skillInfo) {
      throw new Error(`Skill '${skillName}' not found in registry`);
    }

    try {
      // Carregar skill via loader
      const loadedSkill = await this.loader.loadSkill(skillName);

      // Validar skill se habilitado
      if (this.options.validateOnLoad) {
        const validation = await this.validator.validate(loadedSkill);
        if (!validation.valid) {
          throw new Error(`Skill validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Comunicar com Python para carregar skill
      const pythonResult = await this.pythonBridge.execute('skills.executor', 'load_skill', {
        skill_name: skillName,
        skill_path: skillInfo.path
      });

      if (!pythonResult.success) {
        throw new Error(`Python failed to load skill: ${pythonResult.error}`);
      }

      // Armazenar em cache
      const metadata = {
        name: skillName,
        loadedAt: new Date().toISOString(),
        executionCount: 0,
        ...loadedSkill.metadata
      };

      if (this.options.cacheSkills) {
        this.loadedSkills.set(skillName, {
          metadata,
          pythonHandle: pythonResult.handle
        });
      }

      return metadata;
    } catch (error) {
      throw new Error(`Failed to load skill '${skillName}': ${error.message}`);
    }
  }

  /**
   * Executa uma skill com parâmetros
   * @param {string} skillName - Nome da skill
   * @param {Object} params - Parâmetros de execução
   * @param {Object} options - Opções de execução
   * @returns {Promise<Object>} Resultado da execução
   */
  async executeSkill(skillName, params = {}, options = {}) {
    const startTime = Date.now();

    try {
      // Validar parâmetros básicos
      if (!skillName) {
        throw new Error('Skill name is required');
      }

      // Verificar limite de skills simultâneas
      if (this.runningSkills.size >= this.options.maxConcurrentSkills) {
        throw new Error(`Maximum concurrent skills limit reached (${this.options.maxConcurrentSkills})`);
      }

      // Carregar skill se necessário
      if (!this.loadedSkills.has(skillName)) {
        await this.loadSkill(skillName);
      }

      const skillCache = this.loadedSkills.get(skillName);

      // Validar parâmetros contra schema
      const skillInfo = this.registry.skills.find(s => s.name === skillName);
      if (skillInfo.parameters) {
        this._validateParameters(params, skillInfo.parameters);
      }

      // Marcar skill como em execução
      const executionId = `${skillName}-${Date.now()}`;
      this.runningSkills.set(executionId, {
        skillName,
        startTime,
        params
      });

      // Executar via Python Bridge
      const result = await Promise.race([
        this.pythonBridge.execute('skills.executor', 'execute_skill', {
          skill_name: skillName,
          params,
          handle: skillCache.pythonHandle
        }),
        this._timeout(options.timeoutMs || this.options.timeoutMs, skillName)
      ]);

      // Remover de execução
      this.runningSkills.delete(executionId);

      // Atualizar estatísticas
      const executionTime = Date.now() - startTime;
      this.stats.totalExecutions++;

      if (result.success) {
        this.stats.successfulExecutions++;
        skillCache.executionCount++;

        // Atualizar média de tempo
        this.stats.averageExecutionTime =
          (this.stats.averageExecutionTime * (this.stats.totalExecutions - 1) + executionTime) /
          this.stats.totalExecutions;

        return {
          success: true,
          skillName,
          result: result.data,
          executionTime,
          timestamp: new Date().toISOString()
        };
      } else {
        this.stats.failedExecutions++;
        throw new Error(result.error || 'Skill execution failed');
      }
    } catch (error) {
      this.stats.failedExecutions++;
      throw new Error(`Skill execution failed for '${skillName}': ${error.message}`);
    }
  }

  /**
   * Valida parâmetros contra schema
   * @private
   */
  _validateParameters(params, schema) {
    for (const [paramName, paramSchema] of Object.entries(schema)) {
      const value = params[paramName];

      // Verificar required
      if (paramSchema.required && value === undefined) {
        throw new Error(`Required parameter '${paramName}' is missing`);
      }

      // Verificar tipo
      if (value !== undefined && paramSchema.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== paramSchema.type) {
          throw new Error(`Parameter '${paramName}' must be of type ${paramSchema.type}, got ${actualType}`);
        }
      }

      // Verificar enum
      if (value !== undefined && paramSchema.enum && !paramSchema.enum.includes(value)) {
        throw new Error(`Parameter '${paramName}' must be one of: ${paramSchema.enum.join(', ')}`);
      }
    }
  }

  /**
   * Timeout helper
   * @private
   */
  _timeout(ms, skillName) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Skill '${skillName}' execution timed out after ${ms}ms`)), ms)
    );
  }

  /**
   * Descarrega uma skill da memória
   * @param {string} skillName - Nome da skill
   * @returns {Promise<boolean>} Success status
   */
  async unloadSkill(skillName) {
    if (!this.loadedSkills.has(skillName)) {
      return false;
    }

    const skillCache = this.loadedSkills.get(skillName);

    try {
      // Notificar Python para liberar recursos
      await this.pythonBridge.execute('skills.executor', 'unload_skill', {
        skill_name: skillName,
        handle: skillCache.pythonHandle
      });

      // Remover do cache
      this.loadedSkills.delete(skillName);
      return true;
    } catch (error) {
      throw new Error(`Failed to unload skill '${skillName}': ${error.message}`);
    }
  }

  /**
   * Descarrega todas as skills
   * @returns {Promise<number>} Número de skills descarregadas
   */
  async unloadAllSkills() {
    const skillNames = Array.from(this.loadedSkills.keys());
    let unloaded = 0;

    for (const skillName of skillNames) {
      try {
        await this.unloadSkill(skillName);
        unloaded++;
      } catch (error) {
        console.error(`Failed to unload ${skillName}:`, error.message);
      }
    }

    return unloaded;
  }

  /**
   * Obtém estatísticas de uso
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      ...this.stats,
      loadedSkills: this.loadedSkills.size,
      runningSkills: this.runningSkills.size,
      totalSkills: this.registry.totalSkills,
      successRate: this.stats.totalExecutions > 0
        ? (this.stats.successfulExecutions / this.stats.totalExecutions * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

module.exports = SkillsManager;