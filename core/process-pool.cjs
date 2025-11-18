/**
 * @fileoverview Python Process Pool - Gerencia pool de processos Python reutilizáveis
 * @module core/process-pool
 * @description Implementa pool de processos Python com reutilização, queue e health checks
 * @author Claude AI
 * @version 1.0.0
 * @requires child_process
 * @requires path
 * @requires events
 */

const { spawn } = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Gerencia pool de processos Python reutilizáveis
 * @class PythonProcessPool
 * @extends EventEmitter
 * @description Pool de processos Python com reutilização, fila e health checks automáticos
 * @example
 * const pool = new PythonProcessPool({ poolSize: 3, healthCheckInterval: 30000 });
 * await pool.initialize();
 * const result = await pool.execute('test-skill', { name: 'User' }, 30000);
 */
class PythonProcessPool extends EventEmitter {
  /**
   * Cria uma nova instância do PythonProcessPool
   * @param {Object} [options={}] - Opções de configuração
   * @param {number} [options.poolSize=3] - Número de processos no pool
   * @param {number} [options.healthCheckInterval=30000] - Intervalo de health check em ms
   * @param {number} [options.maxRestarts=3] - Máximo de restarts por processo
   * @param {number} [options.restartDelay=1000] - Delay entre restarts em ms
   * @param {string} [options.pythonPath='python'] - Caminho do executável Python
   * @param {string} [options.bridgePath] - Caminho do bridge.py (opcional)
   */
  constructor(options = {}) {
    super();

    this.options = {
      poolSize: options.poolSize || 3,
      healthCheckInterval: options.healthCheckInterval || 30000,
      maxRestarts: options.maxRestarts || 3,
      restartDelay: options.restartDelay || 1000,
      pythonPath: options.pythonPath || 'python',
      bridgePath: options.bridgePath || path.join(__dirname, '..', 'servers', 'skills', 'bridge.py'),
      ...options
    };

    // Pool de processos
    this.processes = [];
    this.available = [];
    this.busy = [];
    this.requestQueue = [];

    // Métricas
    this.stats = {
      totalRequests: 0,
      queuedRequests: 0,
      reuseCount: 0,
      spawnCount: 0,
      restartCount: 0,
      healthCheckFailures: 0,
      averageWaitTime: 0,
      averageExecutionTime: 0
    };

    // Health check
    this.healthCheckTimer = null;
    this.initialized = false;

    // Request ID
    this.requestId = 0;
  }

  /**
   * Inicializa o pool de processos
   * @async
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log(`[ProcessPool] Inicializando pool com ${this.options.poolSize} processos...`);

    // Spawn processos
    for (let i = 0; i < this.options.poolSize; i++) {
      const process = await this._spawnProcess(i);
      this.processes.push(process);
      this.available.push(process);
    }

    // Iniciar health checks
    this._startHealthChecks();

    this.initialized = true;
    this.emit('initialized');

    console.log('[ProcessPool] ✅ Pool inicializado com sucesso');
  }

  /**
   * Executa uma skill usando um processo do pool
   * @async
   * @param {string} skillName - Nome da skill
   * @param {Object} params - Parâmetros da execução
   * @param {number} [timeout=30000] - Timeout em ms
   * @returns {Promise<Object>} Resultado da execução
   */
  async execute(skillName, params, timeout = 30000) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    // Obter processo disponível
    const process = await this._getAvailableProcess();
    const waitTime = Date.now() - startTime;

    // Atualizar métricas de espera
    this._updateAverageWaitTime(waitTime);

    // Marcar como ocupado
    this.available = this.available.filter(p => p.id !== process.id);
    this.busy.push(process);

    try {
      // Executar skill
      const result = await process.execute(skillName, params, timeout);

      // Atualizar métricas de execução
      const executionTime = Date.now() - startTime - waitTime;
      this._updateAverageExecutionTime(executionTime);

      return result;
    } catch (error) {
      console.error(`[ProcessPool] Erro na execução da skill '${skillName}':`, error.message);
      throw error;
    } finally {
      // Retornar processo ao pool
      this.busy = this.busy.filter(p => p.id !== process.id);
      this.available.push(process);

      // Incrementar contador de reuso
      this.stats.reuseCount++;

      // Processar próxima requisição da fila
      this._processQueue();
    }
  }

  /**
   * Obtém um processo disponível ou aguarda na fila
   * @private
   * @async
   * @returns {Promise<Object>} Processo disponível
   */
  async _getAvailableProcess() {
    if (this.available.length > 0) {
      return this.available[0];
    }

    // Enfileirar requisição
    this.stats.queuedRequests++;

    return new Promise((resolve) => {
      this.requestQueue.push({
        resolve,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Processa próxima requisição da fila
   * @private
   */
  _processQueue() {
    if (this.requestQueue.length > 0 && this.available.length > 0) {
      const request = this.requestQueue.shift();
      const waitTime = Date.now() - request.timestamp;
      this._updateAverageWaitTime(waitTime);
      request.resolve(this.available[0]);
    }
  }

  /**
   * Cria um novo processo Python
   * @private
   * @async
   * @param {number} id - ID do processo
   * @returns {Promise<Object>} Processo spawnado
   */
  async _spawnProcess(id) {
    console.log(`[ProcessPool] Spawning process #${id}...`);

    const pythonProcess = spawn(this.options.pythonPath, [this.options.bridgePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    const processObj = {
      id,
      process: pythonProcess,
      isReady: false,
      restartCount: 0,
      totalExecutions: 0,
      startTime: Date.now()
    };

    // Aguardar ready signal
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Process #${id} initialization timeout`));
      }, 10000);

      const stdoutHandler = (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const message = JSON.parse(line.trim());
              if (message.type === 'ready') {
                clearTimeout(timeout);
                processObj.isReady = true;
                pythonProcess.stdout.off('data', stdoutHandler);
                resolve();
              }
            } catch (e) {
              // Ignorar linhas não-JSON
            }
          }
        }
      };

      pythonProcess.stdout.on('data', stdoutHandler);

      pythonProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to spawn process #${id}: ${err.message}`));
      });

      pythonProcess.on('exit', (code) => {
        clearTimeout(timeout);
        if (!processObj.isReady) {
          reject(new Error(`Process #${id} exited with code ${code} before ready`));
        }
      });
    });

    // Configurar handlers
    this._setupProcessHandlers(processObj);

    this.stats.spawnCount++;
    console.log(`[ProcessPool] ✅ Process #${id} spawned and ready`);

    return processObj;
  }

  /**
   * Configura handlers de mensagens e erros do processo
   * @private
   * @param {Object} processObj - Objeto do processo
   */
  _setupProcessHandlers(processObj) {
    const pythonProcess = processObj.process;

    // Mensagens stdout
    pythonProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line.trim());
            this.emit('message', { processId: processObj.id, message });
          } catch (e) {
            // Ignorar linhas não-JSON
          }
        }
      }
    });

    // Mensagens stderr
    pythonProcess.stderr.on('data', (data) => {
      console.error(`[ProcessPool] Process #${processObj.id} STDERR:`, data.toString());
      this.emit('error', { processId: processObj.id, error: data.toString() });
    });

    // Processo terminou
    pythonProcess.on('exit', (code) => {
      console.log(`[ProcessPool] Process #${processObj.id} exited with code ${code}`);

      // Remover de available/busy
      this.available = this.available.filter(p => p.id !== processObj.id);
      this.busy = this.busy.filter(p => p.id !== processObj.id);

      // Tenter restart se não foi shutdown intencional
      if (this.initialized && processObj.restartCount < this.options.maxRestarts) {
        console.log(`[ProcessPool] Restarting process #${processObj.id}...`);
        setTimeout(() => {
          this._restartProcess(processObj);
        }, this.options.restartDelay);
      }

      this.emit('exit', { processId: processObj.id, code });
    });
  }

  /**
   * Executa código em um processo específico
   * @private
   * @async
   * @param {Object} processObj - Objeto do processo
   * @param {string} skillName - Nome da skill
   * @param {Object} params - Parâmetros
   * @param {number} timeout - Timeout em ms
   * @returns {Promise<Object>} Resultado da execução
   */
  async _executeInProcess(processObj, skillName, params, timeout) {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeout}ms`));
      }, timeout);

      const messageHandler = (data) => {
        const { processId, message } = data;

        if (processId === processObj.id && message.requestId === requestId) {
          clearTimeout(timeoutHandle);

          if (message.type === 'result') {
            processObj.totalExecutions++;
            this.emit('executed', {
              processId: processObj.id,
              skillName,
              executionTime: message.executionTime
            });
            resolve(message);
          } else if (message.type === 'error') {
            reject(new Error(message.error));
          }

          this.off('message', messageHandler);
        }
      };

      this.on('message', messageHandler);

      // Enviar para o processo
      try {
        const message = {
          action: 'execute',
          skill: skillName,
          params,
          timeout: Math.ceil(timeout / 1000), // Converter para segundos
          requestId
        };

        processObj.process.stdin.write(JSON.stringify(message) + '\n');
      } catch (error) {
        clearTimeout(timeoutHandle);
        this.off('message', messageHandler);
        reject(new Error(`Failed to send message: ${error.message}`));
      }
    });
  }

  /**
   * Reinicia um processo que falhou
   * @private
   * @async
   * @param {Object} oldProcessObj - Objeto do processo antigo
   */
  async _restartProcess(oldProcessObj) {
    try {
      console.log(`[ProcessPool] Restarting process #${oldProcessObj.id}...`);

      const newProcess = await this._spawnProcess(oldProcessObj.id);

      // Substituir no array de processos
      const index = this.processes.findIndex(p => p.id === oldProcessObj.id);
      if (index !== -1) {
        this.processes[index] = newProcess;
      }

      // Adicionar a available
      this.available.push(newProcess);

      this.stats.restartCount++;
      console.log(`[ProcessPool] ✅ Process #${oldProcessObj.id} restarted`);

      // Processar fila
      this._processQueue();
    } catch (error) {
      console.error(`[ProcessPool] Failed to restart process #${oldProcessObj.id}:`, error.message);
    }
  }

  /**
   * Inicia health checks periódicos
   * @private
   */
  _startHealthChecks() {
    this.healthCheckTimer = setInterval(() => {
      this._performHealthChecks();
    }, this.options.healthCheckInterval);
  }

  /**
   * Executa health checks em todos os processos
   * @private
   */
  async _performHealthChecks() {
    for (const processObj of this.processes) {
      if (!processObj.isReady) continue;

      try {
        const requestId = `health_${Date.now()}_${processObj.id}`;

        const healthMessage = {
          action: 'ping',
          requestId
        };

        // Enviar ping
        processObj.process.stdin.write(JSON.stringify(healthMessage) + '\n');

        // Aguardar resposta com timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Health check timeout'));
          }, 5000);

          const handler = (data) => {
            const { processId, message } = data;

            if (processId === processObj.id && message.type === 'pong') {
              clearTimeout(timeout);
              this.off('message', handler);
              resolve();
            }
          };

          this.on('message', handler);
        });

      } catch (error) {
        console.error(`[ProcessPool] Health check failed for process #${processObj.id}:`, error.message);
        this.stats.healthCheckFailures++;

        // Matar processo para trigger restart
        if (!processObj.process.killed) {
          processObj.process.kill();
        }
      }
    }
  }

  /**
   * Atualiza tempo médio de espera
   * @private
   * @param {number} waitTime - Tempo de espera em ms
   */
  _updateAverageWaitTime(waitTime) {
    if (this.stats.averageWaitTime === 0) {
      this.stats.averageWaitTime = waitTime;
    } else {
      this.stats.averageWaitTime = (this.stats.averageWaitTime * 0.9) + (waitTime * 0.1);
    }
  }

  /**
   * Atualiza tempo médio de execução
   * @private
   * @param {number} executionTime - Tempo de execução em ms
   */
  _updateAverageExecutionTime(executionTime) {
    if (this.stats.averageExecutionTime === 0) {
      this.stats.averageExecutionTime = executionTime;
    } else {
      this.stats.averageExecutionTime = (this.stats.averageExecutionTime * 0.9) + (executionTime * 0.1);
    }
  }

  /**
   * Obtém estatísticas do pool
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.options.poolSize,
      available: this.available.length,
      busy: this.busy.length,
      queueLength: this.requestQueue.length,
      utilization: (this.busy.length / this.options.poolSize * 100).toFixed(2) + '%',
      reuseRate: this.stats.totalRequests > 0
        ? (this.stats.reuseCount / this.stats.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Limpa e finaliza o pool
   * @async
   * @returns {Promise<void>}
   */
  async cleanup() {
    console.log('[ProcessPool] Finalizando pool...');

    this.initialized = false;

    // Parar health checks
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Matar todos os processos
    for (const processObj of this.processes) {
      if (!processObj.process.killed) {
        processObj.process.kill();
      }
    }

    // Limpar arrays
    this.processes = [];
    this.available = [];
    this.busy = [];
    this.requestQueue = [];

    this.emit('shutdown');
    console.log('[ProcessPool] ✅ Pool finalizado');
  }
}

module.exports = PythonProcessPool;
