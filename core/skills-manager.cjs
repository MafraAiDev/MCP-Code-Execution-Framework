/**
 * @fileoverview Skills Manager - Gerencia carregamento e execução de Claude Skills
 * @module core/skills-manager
 * @description Gerenciador centralizado de Skills do MCP Framework
 * Responsável por carregar, validar e executar skills Python via Python Bridge
 * @author Claude AI
 * @version 1.0.0
 * @requires path
 * @requires ../skills/loader
 * @requires ../skills/validator
 */

const path = require('path');
const SkillLoaderModule = require('../skills/loader.cjs');
const SkillValidatorModule = require('../skills/validator.cjs');
const LRUCache = require('./cache/lru-cache.cjs');

const SkillLoader = SkillLoaderModule;
const SkillValidator = SkillValidatorModule;

/**
 * Gerenciador centralizado de Skills do MCP Framework
 * @class SkillsManager
 * @description Responsável por carregar, validar e executar skills Python
 * Integra com Python Bridge para execução de skills em subprocessos isolados
 * @example
 * const skillsManager = new SkillsManager(pythonBridge, {
 *   cacheSkills: true,
 *   validateOnLoad: true,
 *   timeoutMs: 30000,
 *   maxConcurrentSkills: 3,
 *   cacheTTL: 3600000
 * });
 */
class SkillsManager {
  /**
   * Cria uma nova instância do SkillsManager
   * @param {Object} pythonBridge - Instância do Python Bridge para comunicação com Python
   * @param {Object} [options={}] - Opções de configuração
   * @param {boolean} [options.cacheSkills=true] - Habilita cache de skills carregadas
   * @param {boolean} [options.validateOnLoad=true] - Valida skills ao carregar
   * @param {number} [options.timeoutMs=30000] - Timeout de execução em milissegundos
   * @param {number} [options.maxConcurrentSkills=3] - Máximo de skills simultâneas
   * @param {number} [options.cacheTTL=3600000] - TTL do cache em milissegundos (1 hora)
   * @throws {Error} Lança erro se pythonBridge não for fornecido
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
      cacheTTL: options.cacheTTL || 3600000, // 1 hora em ms
      cacheMaxSize: options.cacheMaxSize || 50, // FASE 7.1: Max skills in cache
      ...options
    };

    // FASE 7.1: LRU Cache de skills carregadas (substitui Map simples)
    this.loadedSkills = new LRUCache({
      maxSize: this.options.cacheMaxSize,
      ttl: this.options.cacheTTL,
      trackMetrics: true
    });

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
      // Usar require.resolve para evitar problemas com __dirname em diferentes contextos
      const registryPath = require.resolve('../skills/registry.json');
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
   * Lista todas as skills disponíveis no registry
   * @async
   * @param {Object} [filters={}] - Filtros opcionais
   * @param {string} [filters.category] - Filtrar por categoria (ex: 'development', 'creative')
   * @param {string} [filters.priority] - Filtrar por prioridade (ex: 'high', 'medium', 'low')
   * @param {string} [filters.search] - Busca textual no nome, displayName e descrição
   * @returns {Promise<Array<Object>>} Lista de skills com informações básicas
   * @example
   * const skills = await skillsManager.listSkills({
   *   category: 'development',
   *   search: 'code'
   * });
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
      path: s.path,
      entrypoint: s.entrypoint,
      loaded: this.loadedSkills.has(s.name) // FASE 7.1: LRU Cache has()
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

    // FASE 7.1: LRU Cache get()
    const cachedSkill = this.loadedSkills.get(skillName);

    return {
      ...skill,
      loaded: this.loadedSkills.has(skillName),
      executionCount: cachedSkill?.executionCount || 0
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

    // FASE 7.1: Verificar se já está carregada (LRU cache hit)
    if (this.options.cacheSkills) {
      const cachedSkill = this.loadedSkills.get(skillName);
      if (cachedSkill) {
        return cachedSkill.metadata;
      }
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
      const pythonResult = await this.pythonBridge.execute(skillName, {
        skill_name: skillName,
        skill_path: skillInfo.path
      }, this.options.timeoutMs);

      if (!pythonResult.success) {
        throw new Error(`Python failed to load skill: ${pythonResult.error}`);
      }

      // FASE 7.1: Armazenar em LRU cache
      const metadata = {
        name: skillName,
        loadedAt: new Date().toISOString(),
        executionCount: 0,
        ...loadedSkill.metadata
      };

      if (this.options.cacheSkills) {
        this.loadedSkills.set(skillName, {
          metadata,
          pythonHandle: pythonResult.handle,
          loadedAt: Date.now(),
          executionCount: 0
        });

        // FASE 7.1: LRU cache gerencia expiração automaticamente via TTL
        // Não é mais necessário _cleanupExpiredSkills() manual
      }

      return metadata;
    } catch (error) {
      throw new Error(`Failed to load skill '${skillName}': ${error.message}`);
    }
  }

  /**
   * Executa uma skill com parâmetros específicos
   * @async
   * @param {string} skillName - Nome da skill a ser executada
   * @param {Object} [params={}] - Parâmetros de execução da skill
   * @param {Object} [options={}] - Opções de execução
   * @param {number} [options.timeoutMs] - Timeout em milissegundos (override do padrão)
   * @returns {Promise<Object>} Resultado da execução com sucesso, tempo e timestamp
   * @throws {Error} Lança erro se skill não existir, parâmetros forem inválidos ou execução falhar
   * @example
   * const result = await skillsManager.executeSkill('test-skill', {
   *   name: 'John Doe',
   *   greeting: 'Hello'
   * }, {
   *   timeoutMs: 15000
   * });
   * // Retorna: { success: true, skillName: 'test-skill', result: '...', executionTime: 123, timestamp: '...' }
   */
  async executeSkill(skillName, params = {}, options = {}) {
    const startTime = Date.now();

    try {
      await this._validateExecution(skillName);

      const skillCache = this.loadedSkills.get(skillName);
      const skillInfo = this.registry.skills.find(s => s.name === skillName);

      if (skillInfo.parameters) {
        this._validateParameters(params, skillInfo.parameters);
      }

      const executionId = `${skillName}-${Date.now()}`;
      this.runningSkills.set(executionId, { skillName, startTime, params });

      const result = await Promise.race([
        this.pythonBridge.execute(skillName, {
          ...params,
          _skill_name: skillName,
          _handle: skillCache.pythonHandle
        }, options.timeoutMs || this.options.timeoutMs),
        this._timeout(options.timeoutMs || this.options.timeoutMs, skillName)
      ]);

      return this._processResult(skillName, result, startTime, executionId);
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
   * FASE 7.1: Limpa skills expiradas do cache (agora usa LRU cleanupExpired)
   * @private
   */
  _cleanupExpiredSkills() {
    // LRU cache gerencia expiração automaticamente via TTL em get()
    // Mas podemos forçar cleanup completo se necessário
    return this.loadedSkills.cleanupExpired();
  }

  /**
   * Valida pré-requisitos para execução
   * @private
   */
  async _validateExecution(skillName) {
    if (!skillName) {
      throw new Error('Skill name is required');
    }

    if (this.runningSkills.size >= this.options.maxConcurrentSkills) {
      throw new Error(`Maximum concurrent skills limit reached (${this.options.maxConcurrentSkills})`);
    }

    if (!this.loadedSkills.has(skillName)) {
      await this.loadSkill(skillName);
    }
  }

  /**
   * Processa resultado da execução
   * @private
   */
  _processResult(skillName, result, startTime, executionId) {
    this.runningSkills.delete(executionId);

    const executionTime = Date.now() - startTime;
    this.stats.totalExecutions++;

    if (result.success) {
      this.stats.successfulExecutions++;
      const skillCache = this.loadedSkills.get(skillName);
      skillCache.executionCount++;

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

    try {
      // FASE 7.1: Remover do LRU cache
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
    // FASE 7.1: LRU cache keys()
    const skillNames = this.loadedSkills.keys();
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
   * Obtém estatísticas detalhadas de uso do SkillsManager
   * @returns {Object} Estatísticas completas de execução
   * @property {number} totalExecutions - Total de execuções realizadas
   * @property {number} successfulExecutions - Execuções bem-sucedidas
   * @property {number} failedExecutions - Execuções que falharam
   * @property {number} averageExecutionTime - Tempo médio de execução em ms
   * @property {number} loadedSkills - Número de skills carregadas no cache
   * @property {number} runningSkills - Skills em execução no momento
   * @property {number} totalSkills - Total de skills disponíveis no registry
   * @property {string} successRate - Taxa de sucesso em formato percentual
   * @property {Object} cache - FASE 7.1: Métricas do LRU cache
   * @example
   * const stats = skillsManager.getStats();
   * console.log(`Taxa de sucesso: ${stats.successRate}`); // "95.50%"
   * console.log(`Cache hit rate: ${stats.cache.hitRate}%`); // "85.50%"
   */
  getStats() {
    // FASE 7.1: Obter métricas do LRU cache
    const cacheMetrics = this.loadedSkills.getMetrics();

    return {
      ...this.stats,
      loadedSkills: this.loadedSkills.size,
      runningSkills: this.runningSkills.size,
      totalSkills: this.registry.totalSkills,
      successRate: this.stats.totalExecutions > 0
        ? (this.stats.successfulExecutions / this.stats.totalExecutions * 100).toFixed(2) + '%'
        : '0%',
      // FASE 7.1: Adicionar métricas do cache
      cache: {
        hitRate: cacheMetrics.hitRate,
        hits: cacheMetrics.hits,
        misses: cacheMetrics.misses,
        evictions: cacheMetrics.evictions,
        expirations: cacheMetrics.expirations,
        size: cacheMetrics.size,
        maxSize: cacheMetrics.maxSize,
        utilizationPercent: cacheMetrics.utilizationPercent
      }
    };
  }
}

module.exports = SkillsManager;