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

export class MCPCodeExecutionFramework extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      autoEnforce: options.autoEnforce !== false, // Default: true
      pythonPath: options.pythonPath || process.env.PYTHON_PATH || 'python',
      enableDataFilter: options.enableDataFilter !== false, // Default: true
      enablePrivacyTokenizer: options.enablePrivacyTokenizer !== false, // Default: true
      ...options
    };

    // Componentes principais
    this.pythonBridge = new PythonBridge(this);
    this.mcpInterceptor = new MCPInterceptor(this);
    this.dataFilter = new DataFilter(options.dataFilterOptions);
    this.privacyTokenizer = new PrivacyTokenizer(options.privacyOptions);

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
