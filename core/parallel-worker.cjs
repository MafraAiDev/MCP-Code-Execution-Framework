/**
 * @fileoverview Parallel Worker - Worker para execução paralela de skills
 * @module core/parallel-worker
 * @description Worker thread para executar skills em paralelo
 * @author Claude AI
 * @version 1.0.0
 * @requires worker_threads
 * @requires ../skills/process-pool
 */

const { parentPort, workerData } = require('worker_threads');
const path = require('path');

/**
 * Parallel Worker - Executa skills em thread separada
 * @class ParallelWorker
 */
class ParallelWorker {
  constructor() {
    this.workerId = workerData?.workerId || 0;
    this.options = workerData?.options || {};
    this.isBusy = false;
    this.currentTask = null;
    this.taskTimeout = null;

    console.log(`[ParallelWorker ${this.workerId}] Initialized`);
    this._setupMessageHandler();
    this._notifyReady();
  }

  /**
   * Configura handler de mensagens
   * @private
   */
  _setupMessageHandler() {
    parentPort.on('message', async (message) => {
      try {
        await this._handleMessage(message);
      } catch (error) {
        console.error(`[ParallelWorker ${this.workerId}] Error handling message:`, error);
        this._sendError(error);
      }
    });
  }

  /**
   * Notifica que o worker está pronto
   * @private
   */
  _notifyReady() {
    parentPort.postMessage({
      type: 'worker_ready',
      workerId: this.workerId
    });
  }

  /**
   * Envia mensagem de erro
   * @private
   * @param {Error} error - Erro a enviar
   */
  _sendError(error) {
    parentPort.postMessage({
      type: 'worker_error',
      workerId: this.workerId,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }

  /**
   * Processa mensagem recebida
   * @private
   * @param {Object} message - Mensagem recebida
   */
  async _handleMessage(message) {
    switch (message.type) {
      case 'execute':
        await this._executeTask(message.task, message.skillsManager);
        break;

      case 'shutdown':
        await this._shutdown();
        break;

      case 'ping':
        this._handlePing();
        break;

      default:
        console.warn(`[ParallelWorker ${this.workerId}] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Executa uma tarefa de skill
   * @private
   * @param {Object} task - Tarefa a executar
   */
  async _executeTask(task) {
    if (this.isBusy) {
      throw new Error('Worker is already busy');
    }

    const { id: taskId, skillName, params, options, retryCount } = task;

    console.log(`[ParallelWorker ${this.workerId}] Starting task ${taskId}: ${skillName}`);

    this.isBusy = true;
    this.currentTask = task;

    // Configura timeout
    const timeout = options.timeout || 30000;
    this.taskTimeout = setTimeout(() => {
      this._handleTimeout(taskId);
    }, timeout);

    const startTime = Date.now();

    try {
      // Simula execução da skill (integrará com Process Pool da FASE 7.2)
      const result = await this._simulateSkillExecution(skillName, params, options);

      const executionTime = Date.now() - startTime;

      // Limpa timeout
      if (this.taskTimeout) {
        clearTimeout(this.taskTimeout);
        this.taskTimeout = null;
      }

      console.log(`[ParallelWorker ${this.workerId}] Task ${taskId} completed in ${executionTime}ms`);

      // Envia resultado
      parentPort.postMessage({
        type: 'task_completed',
        taskId: taskId,
        result: {
          result: result,
          executionTime: executionTime,
          metadata: {
            workerId: this.workerId,
            retryCount: retryCount
          }
        }
      });

    } catch (error) {
      // Limpa timeout
      if (this.taskTimeout) {
        clearTimeout(this.taskTimeout);
        this.taskTimeout = null;
      }

      console.error(`[ParallelWorker ${this.workerId}] Task ${taskId} failed:`, error.message);

      // Envia erro
      parentPort.postMessage({
        type: 'task_failed',
        taskId: taskId,
        error: {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        }
      });
    } finally {
      this.isBusy = false;
      this.currentTask = null;
    }
  }

  /**
   * Simula execução de skill (será substituído por integração com Process Pool)
   * @private
   * @param {string} skillName - Nome da skill
   * @param {Object} params - Parâmetros
   * @param {Object} options - Opções
   * @returns {Promise<any>} Resultado da execução
   */
  async _simulateSkillExecution(skillName, params, options) {
    // Simula tempo de processamento baseado na complexidade da skill
    const baseDelay = Math.random() * 1000 + 500; // 500-1500ms
    const complexityMultiplier = this._getSkillComplexity(skillName);
    const executionTime = baseDelay * complexityMultiplier;

    // Simula processamento
    await new Promise(resolve => setTimeout(resolve, executionTime));

    // Simula resultado baseado na skill
    return this._generateMockResult(skillName, params, executionTime);
  }

  /**
   * Obtém complexidade estimada da skill
   * @private
   * @param {string} skillName - Nome da skill
   * @returns {number} Fator de complexidade
   */
  _getSkillComplexity(skillName) {
    const complexityMap = {
      'test-specialist': 1.0,
      'brand-analyzer': 1.5,
      'business-analytics-reporter': 2.0,
      'codebase-documenter': 2.5,
      'data-analyst': 2.0,
      'csv-data-visualizer': 1.8,
      'docker-containerization': 1.3,
      'finance-manager': 2.2,
      'frontend-enhancer': 1.4,
      'default': 1.5
    };

    return complexityMap[skillName] || complexityMap.default;
  }

  /**
   * Gera resultado mock para testes
   * @private
   * @param {string} skillName - Nome da skill
   * @param {Object} params - Parâmetros
   * @param {number} executionTime - Tempo de execução
   * @returns {Object} Resultado mock
   */
  _generateMockResult(skillName, params, executionTime) {
    const baseResults = {
      'test-specialist': {
        testResults: 'All tests passed',
        coverage: Math.random() * 20 + 80, // 80-100%
        executionTime: executionTime,
        params: params
      },
      'brand-analyzer': {
        brandScore: Math.random() * 40 + 60, // 60-100
        analysis: 'Brand analysis completed',
        recommendations: ['Improve consistency', 'Enhance visibility'],
        executionTime: executionTime
      },
      'business-analytics-reporter': {
        revenue: Math.random() * 100000 + 50000,
        growth: Math.random() * 30 - 10, // -10% to +20%
        insights: ['Revenue trending up', 'Customer acquisition strong'],
        executionTime: executionTime
      },
      'codebase-documenter': {
        documentation: '## Code Documentation\n\nGenerated documentation...',
        filesProcessed: Math.floor(Math.random() * 50 + 10),
        complexity: Math.random() * 5 + 1,
        executionTime: executionTime
      },
      'data-analyst': {
        analysis: 'Data analysis completed',
        correlations: Math.random() * 10 + 1,
        insights: ['Strong correlation found', 'Outliers detected'],
        executionTime: executionTime
      },
      'default': {
        result: `Mock result for ${skillName}`,
        executionTime: executionTime,
        params: params,
        workerId: this.workerId
      }
    };

    return baseResults[skillName] || baseResults.default;
  }

  /**
   * Processa timeout de tarefa
   * @private
   * @param {string} taskId - ID da tarefa
   */
  _handleTimeout(taskId) {
    console.error(`[ParallelWorker ${this.workerId}] Task ${taskId} timed out`);

    const error = new Error('Task execution timeout');
    error.code = 'TIMEOUT';

    parentPort.postMessage({
      type: 'task_failed',
      taskId: taskId,
      error: {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
        code: error.code
      }
    });

    this.isBusy = false;
    this.currentTask = null;
  }

  /**
   * Processa ping
   * @private
   */
  _handlePing() {
    parentPort.postMessage({
      type: 'pong',
      workerId: this.workerId,
      isBusy: this.isBusy,
      currentTask: this.currentTask?.id || null
    });
  }

  /**
   * Desliga o worker
   * @private
   */
  async _shutdown() {
    console.log(`[ParallelWorker ${this.workerId}] Shutting down...`);

    // Aguarda tarefa atual terminar (máximo 5 segundos)
    if (this.isBusy) {
      console.log(`[ParallelWorker ${this.workerId}] Waiting for current task to complete...`);
      const maxWait = 5000;
      const startTime = Date.now();

      while (this.isBusy && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Limpa timeout se existir
    if (this.taskTimeout) {
      clearTimeout(this.taskTimeout);
    }

    console.log(`[ParallelWorker ${this.workerId}] Shutdown complete`);

    parentPort.postMessage({
      type: 'worker_shutdown',
      workerId: this.workerId
    });

    // Encerra o worker
    process.exit(0);
  }

  /**
   * Obtém estado do worker
   * @returns {Object} Estado atual
   */
  getState() {
    return {
      workerId: this.workerId,
      isBusy: this.isBusy,
      currentTask: this.currentTask,
      options: this.options
    };
  }
}

// Inicializa o worker se este arquivo for executado diretamente
if (isMainThread) {
  // Exporta a classe para uso pelo ParallelExecutor
  module.exports = ParallelWorker;
} else {
  // Cria instância do worker
  new ParallelWorker();
}