/**
 * Python Bridge - Comunicação Bidirecional JS ↔ Python
 *
 * Responsabilidades:
 * - Gerenciar processo Python persistente
 * - Executar código Python com contexto JS
 * - Permitir Python chamar funções JS (callbacks)
 * - Manter estado entre execuções
 *
 * @module core/python-bridge
 * @complexity HIGH
 * @architect Sonnet 4.5
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PythonBridge extends EventEmitter {
  constructor(framework) {
    super();

    this.framework = framework;
    this.pythonProcess = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.initialized = false;
    this.pythonPath = process.env.PYTHON_PATH || 'python';

    // Buffer para mensagens parciais
    this.messageBuffer = '';
  }

  /**
   * Inicializa processo Python persistente
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    const pythonServerPath = path.join(__dirname, 'python_server.py');

    console.log('[PythonBridge] Iniciando processo Python...');

    this.pythonProcess = spawn(this.pythonPath, [
      '-u',  // Unbuffered output
      pythonServerPath
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Processa saída (STDOUT)
    this.pythonProcess.stdout.on('data', (data) => {
      this._handleStdout(data);
    });

    // Processa erros (STDERR)
    this.pythonProcess.stderr.on('data', (data) => {
      console.error('[PythonBridge] Python STDERR:', data.toString());
    });

    // Trata término do processo
    this.pythonProcess.on('exit', (code) => {
      console.log(`[PythonBridge] Processo Python terminou com código ${code}`);
      this.initialized = false;

      // Rejeita todas as requisições pendentes
      for (const [, { reject }] of this.pendingRequests) {
        reject(new Error('Python process terminated'));
      }
      this.pendingRequests.clear();
    });

    // Aguarda confirmação de inicialização
    await this._waitForReady();

    this.initialized = true;
    console.log('[PythonBridge] Processo Python inicializado com sucesso');
  }

  /**
   * Aguarda mensagem de "ready" do Python
   */
  async _waitForReady() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Python initialization timeout'));
      }, 10000);

      const readyHandler = (message) => {
        if (message.type === 'ready') {
          clearTimeout(timeout);
          this.removeListener('message', readyHandler);
          resolve();
        }
      };

      this.on('message', readyHandler);
    });
  }

  /**
   * Processa saída do Python (STDOUT)
   */
  _handleStdout(data) {
    this.messageBuffer += data.toString();

    // Processa mensagens completas (delimitadas por \n)
    const lines = this.messageBuffer.split('\n');
    this.messageBuffer = lines.pop(); // Última linha (possivelmente incompleta)

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const message = JSON.parse(line);
        this._handleMessage(message);
      } catch (error) {
        console.error('[PythonBridge] Erro ao parsear mensagem:', line);
        console.error(error);
      }
    }
  }

  /**
   * Processa mensagem do Python
   */
  _handleMessage(message) {
    this.emit('message', message);

    if (message.type === 'response') {
      // Resposta para uma requisição execute()
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);

        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.result);
        }
      }
    } else if (message.type === 'js_call') {
      // Python está chamando uma função JS
      this._handleJSCall(message);
    } else if (message.type === 'log') {
      // Log do Python
      console.log(`[Python] ${message.message}`);
    }
  }

  /**
   * Trata chamada de função JS vinda do Python
   */
  async _handleJSCall(message) {
    const { callId, module, method, args } = message;

    try {
      // Obtém módulo do framework
      const moduleInstance = this.framework[module];
      if (!moduleInstance) {
        throw new Error(`Módulo JS não encontrado: ${module}`);
      }

      // Chama método
      const result = await moduleInstance[method](...args);

      // Retorna resultado para Python
      this._sendToPython({
        type: 'js_call_response',
        callId,
        result
      });
    } catch (error) {
      // Retorna erro para Python
      this._sendToPython({
        type: 'js_call_response',
        callId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Executa código Python
   *
   * @param {string} code - Código Python a executar
   * @param {object} context - Contexto disponível para o código
   * @returns {Promise<any>} Resultado da execução
   */
  async execute(code, context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const requestId = this.requestId++;

    // Prepara contexto com callbacks JS
    const enhancedContext = {
      ...context,
      // Metadados
      __meta: {
        requestId,
        timestamp: Date.now(),
        framework: 'mcp-code-execution'
      }
    };

    // Envia requisição para Python
    this._sendToPython({
      type: 'execute',
      id: requestId,
      code,
      context: enhancedContext
    });

    // Aguarda resposta
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      // Timeout de 5 minutos
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Python execution timeout (5 minutes)'));
        }
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Envia mensagem para Python
   */
  _sendToPython(message) {
    if (!this.pythonProcess || !this.initialized) {
      throw new Error('Python process not initialized');
    }

    const json = JSON.stringify(message) + '\n';
    this.pythonProcess.stdin.write(json);
  }

  /**
   * Avalia expressão Python (retorna valor)
   *
   * @param {string} expression - Expressão Python
   * @returns {Promise<any>} Valor da expressão
   */
  async eval(expression) {
    return this.execute(`return ${expression}`);
  }

  /**
   * Importa módulo Python
   *
   * @param {string} modulePath - Caminho do módulo (ex: 'servers.scraping.apify')
   * @returns {Promise<object>} Proxy para o módulo
   */
  async import(modulePath) {
    // Obtém lista de funções exportadas
    const exports = await this.execute(`
import ${modulePath}
import inspect

# Obtém todas as funções públicas
exports = []
for name, obj in inspect.getmembers(${modulePath}):
    if not name.startswith('_') and callable(obj):
        # Obtém signature
        sig = inspect.signature(obj)
        exports.append({
            'name': name,
            'params': list(sig.parameters.keys()),
            'doc': inspect.getdoc(obj)
        })

return exports
    `);

    // Cria proxy para chamar funções remotamente
    const proxy = {};
    for (const func of exports) {
      proxy[func.name] = async (...args) => {
        return this.execute(`
from ${modulePath} import ${func.name}
result = await ${func.name}(${args.map((_, i) => `args[${i}]`).join(', ')})
return result
        `, { args });
      };

      // Adiciona metadados
      proxy[func.name].__doc__ = func.doc;
      proxy[func.name].__params__ = func.params;
    }

    return proxy;
  }

  /**
   * Obtém estatísticas da bridge
   */
  getStats() {
    return {
      initialized: this.initialized,
      pendingRequests: this.pendingRequests.size,
      totalRequestsSent: this.requestId,
      processId: this.pythonProcess?.pid
    };
  }

  /**
   * Finaliza processo Python
   */
  async cleanup() {
    if (this.pythonProcess && this.initialized) {
      console.log('[PythonBridge] Finalizando processo Python...');

      // Envia sinal de término
      this._sendToPython({ type: 'shutdown' });

      // Aguarda término gracioso
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.pythonProcess.kill('SIGKILL');
          resolve();
        }, 5000);

        this.pythonProcess.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.initialized = false;
    }
  }
}

/**
 * Erro customizado para chamadas diretas de MCP
 */
export class MCPDirectCallError extends Error {
  constructor(mcpName) {
    super(
      `\n❌ MCP "${mcpName}" NÃO pode ser chamado diretamente!\n\n` +
      `✅ Use o framework:\n\n` +
      `import framework from './core/index.js';\n` +
      `await framework.initialize();\n\n` +
      `const result = await framework.execute(\`\n` +
      `  from servers.${mcpName} import *\n` +
      `  # Use as funções disponíveis\n` +
      `\`);\n\n` +
      `📚 Leia: DECISOES-ARQUITETURAIS.md\n`
    );
    this.name = 'MCPDirectCallError';
    this.mcpName = mcpName;
  }
}

export default PythonBridge;
