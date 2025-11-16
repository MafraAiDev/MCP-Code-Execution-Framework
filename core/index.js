/**
 * MCP Code Execution Framework - Core Index
 *
 * Orquestrador principal que integra todos os componentes
 *
 * @module core/index
 * @complexity HIGH
 * @architect Sonnet 4.5
 */

import PythonBridge from './python-bridge.js';
import MCPInterceptor from './mcp-interceptor.js';
import { DataFilter } from './data-filter.js';
import { PrivacyTokenizer } from './privacy-tokenizer.js';
import { EventEmitter } from 'events';
import SkillsManager from './skills-manager.js';
import { PythonShell } from 'python-shell';
import path from 'path';

export class MCPCodeExecutionFramework extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      autoEnforce: options.autoEnforce !== false, // Default: true
      pythonPath: options.pythonPath || process.env.PYTHON_PATH || 'python',
      enableDataFilter: options.enableDataFilter !== false, // Default: true
      enablePrivacyTokenizer: options.enablePrivacyTokenizer !== false, // Default: true
      // Skills options
      cacheSkills: options.cacheSkills !== false,
      validateOnLoad: options.validateOnLoad !== false,
      skillTimeoutMs: options.skillTimeoutMs || 30000,
      maxConcurrentSkills: options.maxConcurrentSkills || 3,
      skillCacheTTL: options.skillCacheTTL || 3600000,
      ...options
    };

    // Componentes principais
    this.pythonBridge = new PythonBridge(this);
    this.mcpInterceptor = new MCPInterceptor(this);
    this.dataFilter = new DataFilter(options.dataFilterOptions);
    this.privacyTokenizer = new PrivacyTokenizer(options.privacyOptions);

    // Skills Manager e Python Bridge para execução de skills
    this.skillsManager = new SkillsManager(this._createPythonBridge(), {
      cacheSkills: this.options.cacheSkills,
      validateOnLoad: this.options.validateOnLoad,
      timeoutMs: this.options.skillTimeoutMs,
      maxConcurrentSkills: this.options.maxConcurrentSkills,
      cacheTTL: this.options.skillCacheTTL
    });

    this.pythonBridge = null; // Será inicializado na primeira execução de skill

    // Estado
    this.initialized = false;
    this.stats = {
      executions: 0,
      tokensUsed: 0,
      tokensSaved: 0,
      mcpsLoaded: []
    };
  }

  /**
   * Inicializa o framework
   */
  async initialize() {
    if (this.initialized) {
      console.log('[Framework] Já inicializado');
      return;
    }

    console.log('[Framework] Inicializando MCP Code Execution Framework...');

    // 1. Inicia Python Bridge
    await this.pythonBridge.initialize();

    // 2. Ativa enforcement (se habilitado)
    if (this.options.autoEnforce) {
      this.mcpInterceptor.enforce();
    }

    this.initialized = true;
    console.log('[Framework] ✅ Framework inicializado com sucesso!');

    this.emit('initialized');
  }

  /**
   * Create Python bridge for skill execution
   * @private
   * @returns {Object} Python bridge interface
   */
  _createPythonBridge() {
    return {
      execute: async (skillName, params, timeout) => {
        // Ensure bridge is initialized
        if (!this.pythonBridge || !this.pythonBridge.isRunning) {
          await this._initializePythonBridge();
        }

        // Send execution request to Python
        const requestId = this._generateRequestId();
        const message = {
          action: 'execute',
          skill: skillName,
          params: params,
          timeout: timeout || 30,
          requestId: requestId
        };

        return await this._sendToPython(message, requestId);
      },

      getStats: async () => {
        if (!this.pythonBridge || !this.pythonBridge.isRunning) {
          return {
            total_executions: 0,
            successful: 0,
            failed: 0,
            total_time: 0
          };
        }

        const requestId = this._generateRequestId();
        const message = {
          action: 'stats',
          requestId: requestId
        };

        return await this._sendToPython(message, requestId);
      }
    };
  }

  /**
   * Initialize Python bridge subprocess
   * @private
   */
  async _initializePythonBridge() {
    if (this.pythonBridge && this.pythonBridge.isRunning) {
      return; // Already initialized
    }

    const bridgePath = path.join(__dirname, '..', 'servers', 'skills', 'bridge.py');

    this.pythonBridge = new PythonShell(bridgePath, {
      mode: 'json',
      pythonPath: 'python', // or 'python3'
      pythonOptions: ['-u'], // Unbuffered output
    });

    this.pythonBridge.isRunning = true;
    this.pythonBridge.pendingRequests = new Map();

    // Handle messages from Python
    this.pythonBridge.on('message', (message) => {
      this._handlePythonMessage(message);
    });

    // Handle errors
    this.pythonBridge.on('error', (err) => {
      console.error('Python bridge error:', err);
    });

    // Handle close
    this.pythonBridge.on('close', () => {
      this.pythonBridge.isRunning = false;
      console.log('Python bridge closed');
    });

    // Wait for ready signal
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Python bridge initialization timeout'));
      }, 5000);

      const readyHandler = (message) => {
        if (message.type === 'ready') {
          clearTimeout(timeout);
          this.pythonBridge.off('message', readyHandler);
          resolve();
        }
      };

      this.pythonBridge.on('message', readyHandler);
    });
  }

  /**
   * Send message to Python bridge and wait for response
   * @private
   * @param {Object} message - Message to send
   * @param {string} requestId - Request ID for response matching
   * @returns {Promise<Object>} Response from Python
   */
  async _sendToPython(message, requestId) {
    return new Promise((resolve, reject) => {
      // Store pending request
      this.pythonBridge.pendingRequests.set(requestId, { resolve, reject });

      // Send message
      try {
        this.pythonBridge.send(message);
      } catch (error) {
        // Remove from pending if send fails
        this.pythonBridge.pendingRequests.delete(requestId);
        reject(new Error(`Failed to send message to Python: ${error.message}`));
      }

      // Set timeout for response
      const timeout = setTimeout(() => {
        if (this.pythonBridge.pendingRequests.has(requestId)) {
          this.pythonBridge.pendingRequests.delete(requestId);
          reject(new Error('Python bridge response timeout'));
        }
      }, 30000); // 30 second timeout

      // Update the stored promise to include timeout cleanup
      const pending = this.pythonBridge.pendingRequests.get(requestId);
      if (pending) {
        pending.timeout = timeout;
      }
    });
  }

  /**
   * Handle messages from Python bridge
   * @private
   * @param {Object} message - Message from Python
   */
  _handlePythonMessage(message) {
    const requestId = message.requestId;

    if (!requestId) {
      console.warn('Received message without requestId:', message);
      return;
    }

    const pending = this.pythonBridge.pendingRequests.get(requestId);
    if (!pending) {
      console.warn('No pending request found for requestId:', requestId);
      return;
    }

    // Clear timeout
    if (pending.timeout) {
      clearTimeout(pending.timeout);
    }

    // Remove from pending
    this.pythonBridge.pendingRequests.delete(requestId);

    // Handle response
    if (message.success === false || message.error) {
      pending.reject(new Error(message.error || 'Unknown Python error'));
    } else {
      pending.resolve(message);
    }
  }

  /**
   * Generate unique request ID
   * @private
   * @returns {string} Request ID
   */
  _generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Executa código (auto-routing Python/JS)
   *
   * @param {string} code - Código a executar
   * @param {object} context - Contexto disponível
   * @returns {Promise<any>} Resultado da execução
   */
  async execute(code, context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    this.stats.executions++;

    try {
      // Auto-detecta linguagem
      const language = this._detectLanguage(code);

      console.log(`[Framework] Executando código ${language}...`);

      let result;

      if (language === 'python') {
        // Executa via Python Bridge
        result = await this.pythonBridge.execute(code, context);
      } else {
        // JavaScript - executa diretamente
        // Nota: Para produção, usar Sandbox (já implementado em IMPLEMENTACAO-COMPLETA.md)
        result = eval(code);
      }

      // Aplica Privacy Tokenizer primeiro (protege PII)
      if (this.options.enablePrivacyTokenizer && result) {
        if (this.privacyTokenizer.containsPII(result)) {
          result = this.privacyTokenizer.tokenize(result);
          const piiStats = this.privacyTokenizer.getStats();
          if (piiStats.totalDetected > 0) {
            console.log(`[PrivacyTokenizer] ${piiStats.totalDetected} PII detectados e protegidos`);
          }
        }
      }

      // Aplica Data Filter depois (otimiza tamanho)
      if (this.options.enableDataFilter && result && typeof result === 'object') {
        const originalSize = JSON.stringify(result).length;
        result = this.dataFilter.filter(result);
        const filteredSize = JSON.stringify(result).length;
        const saved = originalSize - filteredSize;

        if (saved > 0) {
          this.stats.tokensSaved += Math.floor(saved / 4); // ~4 chars per token
          console.log(`[DataFilter] Economizou ${saved} bytes (~${Math.floor(saved / 4)} tokens)`);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[Framework] ✅ Executado em ${duration}ms`);

      this.emit('executed', { code, result, duration });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Framework] ❌ Erro após ${duration}ms:`, error.message);

      this.emit('error', { code, error, duration });

      throw error;
    }
  }

  /**
   * Execute a Claude Skill
   *
   * @param {string} skillName - Name of the skill to execute
   * @param {Object} params - Parameters for the skill
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Skill execution result
   *
   * @example
   * const result = await executor.executeSkill('codebase-documenter', {
   *   path: '/path/to/project',
   *   outputFormat: 'markdown'
   * });
   */
  async executeSkill(skillName, params = {}, options = {}) {
    try {
      // Execute via SkillsManager
      const result = await this.skillsManager.executeSkill(skillName, params, options);

      return {
        success: true,
        skill: skillName,
        result: result.result,
        executionTime: result.execution_time,
        stats: result.stats
      };
    } catch (error) {
      return {
        success: false,
        skill: skillName,
        error: error.message,
        errorType: error.constructor.name
      };
    }
  }

  /**
   * List available skills
   *
   * @param {Object} filters - Optional filters (category, priority)
   * @returns {Promise<Array>} List of skills
   *
   * @example
   * const devSkills = await executor.listSkills({ category: 'development' });
   */
  async listSkills(filters = {}) {
    return await this.skillsManager.listSkills(filters);
  }

  /**
   * Get skill information
   *
   * @param {string} skillName - Name of the skill
   * @returns {Promise<Object>} Skill metadata
   */
  async getSkillInfo(skillName) {
    return await this.skillsManager.getSkillInfo(skillName);
  }

  /**
   * Get skills execution statistics
   *
   * @returns {Promise<Object>} Skills statistics
   */
  async getSkillsStats() {
    return this.skillsManager.getStats();
  }

  /**
   * Detecta linguagem do código
   */
  _detectLanguage(code) {
    const pythonKeywords = [
      'import ', 'from ', 'def ', 'async def', 'await ',
      'print(', 'class ', '__init__', 'self.', 'None', 'return '
    ];

    // Verifica keywords Python
    const hasPythonKeyword = pythonKeywords.some(kw => code.includes(kw));

    // Verifica comentários Python (#)
    const hasPythonComment = /^\s*#/m.test(code);

    // Se tem keyword ou comentário Python, é Python
    if (hasPythonKeyword || hasPythonComment) {
      return 'python';
    }

    return 'javascript';
  }

  /**
   * Importa módulo Python (helper)
   */
  async importPython(modulePath) {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.pythonBridge.import(modulePath);
  }

  /**
   * Avalia expressão Python (helper)
   */
  async evalPython(expression) {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.pythonBridge.eval(expression);
  }

  /**
   * Obtém estatísticas do framework
   */
  getStats() {
    return {
      ...this.stats,
      initialized: this.initialized,
      pythonBridge: this.pythonBridge.getStats(),
      mcpInterceptor: this.mcpInterceptor.getStats()
    };
  }

  /**
   * Gera relatório de uso
   */
  generateReport() {
    const stats = this.getStats();

    let report = '═══════════════════════════════════════════\n';
    report += '   MCP FRAMEWORK - RELATÓRIO\n';
    report += '═══════════════════════════════════════════\n\n';

    report += `Status: ${stats.initialized ? '✅ ATIVO' : '❌ INATIVO'}\n`;
    report += `Execuções: ${stats.executions}\n`;
    report += `MCPs Carregados: ${stats.mcpsLoaded.length}\n\n`;

    report += '─── Python Bridge ───\n';
    report += `Requisições: ${stats.pythonBridge.totalRequestsSent}\n`;
    report += `Pendentes: ${stats.pythonBridge.pendingRequests}\n`;
    report += `PID: ${stats.pythonBridge.processId || 'N/A'}\n\n`;

    report += '─── MCP Interceptor ───\n';
    report += `Enforcement: ${stats.mcpInterceptor.enforced ? '✅ ATIVO' : '❌ INATIVO'}\n`;
    report += `MCPs Protegidos: ${stats.mcpInterceptor.interceptedMCPs}\n`;
    report += `Tentativas Bloqueadas: ${stats.mcpInterceptor.totalAttempts}\n\n`;

    if (stats.mcpInterceptor.totalAttempts > 0) {
      report += '⚠️  ATENÇÃO: Tentativas de acesso direto detectadas!\n';
      report += 'Consulte: LEITURA-OBRIGATORIA.md\n\n';
    }

    report += '═══════════════════════════════════════════\n';

    return report;
  }

  /**
   * Finaliza framework e libera recursos
   */
  async cleanup() {
    console.log('[Framework] Finalizando...');

    // Shutdown skills manager
    if (this.skillsManager) {
      await this.skillsManager.unloadAllSkills();
    }

    // Shutdown Python bridge for skills
    if (this.pythonBridge && this.pythonBridge.isRunning) {
      const requestId = this._generateRequestId();
      try {
        await this._sendToPython({
          action: 'shutdown',
          requestId: requestId
        }, requestId);
      } catch (error) {
        console.warn('[Framework] Failed to send shutdown to Python bridge:', error.message);
      }

      this.pythonBridge.end();
    }

    // Cleanup original Python bridge
    await this.pythonBridge.cleanup();

    if (this.options.autoEnforce) {
      this.mcpInterceptor.disable();
    }

    this.initialized = false;

    console.log('[Framework] ✅ Finalizado');
    this.emit('cleanup');
  }
}

// Instância singleton (opcional)
let _instance = null;

export function getInstance(options) {
  if (!_instance) {
    _instance = new MCPCodeExecutionFramework(options);
  }
  return _instance;
}

// Export default
export default new MCPCodeExecutionFramework();
