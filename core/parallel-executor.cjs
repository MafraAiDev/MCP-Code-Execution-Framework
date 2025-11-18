/**
 * @fileoverview Parallel Executor - Sistema de execução paralela otimizada
 * @module core/parallel-executor
 * @description Executor paralelo com queue system, load balancing e controle de concorrência
 * @author Claude AI
 * @version 1.0.0
 * @requires events
 * @requires worker_threads
 * @requires os
 * @requires ../skills/process-pool
 */

const { EventEmitter } = require('events');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const path = require('path');

/**
 * @typedef {Object} ParallelTask
 * @property {string} id - ID único da tarefa
 * @property {string} skillName - Nome da skill a executar
 * @property {Object} params - Parâmetros da skill
 * @property {Object} options - Opções de execução
 * @property {number} priority - Prioridade (1-10, maior = mais prioritário)
 * @property {number} createdAt - Timestamp de criação
 * @property {number} maxRetries - Máximo de tentativas
 * @property {number} retryCount - Contador de tentativas
 * @property {Function} resolve - Função de resolução da promise
 * @property {Function} reject - Função de rejeição da promise
 */

/**
 * @typedef {Object} WorkerInfo
 * @property {number} id - ID do worker
 * @property {Worker} worker - Instância do Worker
 * @property {boolean} busy - Estado de ocupação
 * @property {number} tasksCompleted - Tarefas completadas
 * @property {number} tasksFailed - Tarefas falhadas
 * @property {number} load - Carga atual (0-1)
 * @property {number} lastTaskTime - Tempo da última tarefa
 */

/**
 * @typedef {Object} ParallelExecutorOptions
 * @property {number} maxWorkers - Número máximo de workers (default: 3)
 * @property {number} maxConcurrent - Máximo de execuções concorrentes (default: 3)
 * @property {number} queueSize - Tamanho máximo da fila (default: 100)
 * @property {number} taskTimeout - Timeout por tarefa em ms (default: 30000)
 * @property {number} retryAttempts - Tentativas de retry (default: 2)
 * @property {number} retryDelay - Delay entre retries em ms (default: 1000)
 * @property {boolean} loadBalancing - Habilitar load balancing (default: true)
 * @property {boolean} priorityScheduling - Habilitar prioridade (default: true)
 * @property {Function} loadBalancer - Função customizada de load balancing
 */

/**
 * @typedef {Object} ParallelExecutorStats
 * @property {number} totalTasks - Total de tarefas processadas
 * @property {number} completedTasks - Tarefas completadas com sucesso
 * @property {number} failedTasks - Tarefas falhadas
 * @property {number} queuedTasks - Tarefas na fila
 * @property {number} runningTasks - Tarefas em execução
 * @property {number} averageWaitTime - Tempo médio de espera
 * @property {number} averageExecutionTime - Tempo médio de execução
 * @property {number} throughput - Tarefas por segundo
 * @property {number} queueSize - Tamanho atual da fila
 * @property {Array<WorkerInfo>} workers - Estado dos workers
 */

/**
 * ParallelExecutor - Sistema de execução paralela otimizada
 * @class ParallelExecutor
 * @extends EventEmitter
 * @description Gerencia execução paralela de skills com queue system e load balancing
 * @example
 * const executor = new ParallelExecutor(skillsManager, {
 *   maxWorkers: 3,
 *   maxConcurrent: 3,
 *   taskTimeout: 30000,
 *   retryAttempts: 2,
 *   loadBalancing: true
 * });
 *
 * const results = await executor.executeBatch([
 *   { skillName: 'skill1', params: { test: 1 } },
 *   { skillName: 'skill2', params: { test: 2 } },
 *   { skillName: 'skill3', params: { test: 3 } }
 * ]);
 */
class ParallelExecutor extends EventEmitter {
  /**
   * @param {Object} skillsManager - Instância do SkillsManager
   * @param {ParallelExecutorOptions} options - Opções de configuração
   */
  constructor(skillsManager, options = {}) {
    super();

    if (!skillsManager) {
      throw new Error('SkillsManager is required for ParallelExecutor');
    }

    this.skillsManager = skillsManager;
    this.options = {
      maxWorkers: options.maxWorkers || 3,
      maxConcurrent: options.maxConcurrent || 3,
      queueSize: options.queueSize || 100,
      taskTimeout: options.taskTimeout || 30000,
      retryAttempts: options.retryAttempts || 2,
      retryDelay: options.retryDelay || 1000,
      loadBalancing: options.loadBalancing !== false,
      priorityScheduling: options.priorityScheduling !== false,
      loadBalancer: options.loadBalancer || this.defaultLoadBalancer.bind(this),
      ...options
    };

    // Estado interno
    this.taskQueue = [];
    this.workers = new Map();
    this.runningTasks = new Map();
    this.taskIdCounter = 0;
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      queuedTasks: 0,
      runningTasks: 0,
      averageWaitTime: 0,
      averageExecutionTime: 0,
      throughput: 0,
      queueSize: 0,
      workers: []
    };

    // Métricas de performance
    this.metrics = {
      startTime: Date.now(),
      taskTimings: new Map(),
      waitTimes: [],
      executionTimes: []
    };

    // Controle de concorrência
    this.semaphore = new Semaphore(this.options.maxConcurrent);
    this.isRunning = false;
    this.processingInterval = null;

    this._initializeWorkers();
    this._startQueueProcessor();
  }

  /**
   * Inicializa o pool de workers
   * @private
   */
  _initializeWorkers() {
    const workerCount = Math.min(
      this.options.maxWorkers,
      os.cpus().length,
      8 // Limite máximo para evitar sobrecarga
    );

    for (let i = 0; i < workerCount; i++) {
      this._createWorker(i);
    }

    this.emit('workers_initialized', { count: workerCount });
  }

  /**
   * Cria um novo worker
   * @private
   * @param {number} workerId - ID do worker
   * @returns {WorkerInfo} Informações do worker
   */
  _createWorker(workerId) {
    const workerPath = path.join(__dirname, 'parallel-worker.cjs');

    const worker = new Worker(workerPath, {
      workerData: {
        workerId,
        options: this.options
      }
    });

    const workerInfo = {
      id: workerId,
      worker,
      busy: false,
      tasksCompleted: 0,
      tasksFailed: 0,
      load: 0,
      lastTaskTime: 0
    };

    worker.on('message', (message) => {
      this._handleWorkerMessage(workerId, message);
    });

    worker.on('error', (error) => {
      this._handleWorkerError(workerId, error);
    });

    worker.on('exit', (code) => {
      this._handleWorkerExit(workerId, code);
    });

    this.workers.set(workerId, workerInfo);
    this.stats.workers.push(workerInfo);

    return workerInfo;
  }

  /**
   * Processador de fila principal
   * @private
   */
  _startQueueProcessor() {
    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this._processQueue();
    }, 10); // Processa a cada 10ms para baixa latência
  }

  /**
   * Processa tarefas da fila
   * @private
   */
  async _processQueue() {
    if (!this.isRunning || this.taskQueue.length === 0) {
      return;
    }

    // Ordena por prioridade (maior primeiro) e depois por tempo de criação
    if (this.options.priorityScheduling) {
      this.taskQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.createdAt - b.createdAt;
      });
    }

    // Tenta processar tarefas enquanto houver capacidade
    while (this.taskQueue.length > 0 && this._hasAvailableCapacity()) {
      const task = this.taskQueue.shift();
      this.stats.queueSize = this.taskQueue.length;

      try {
        await this._executeTask(task);
      } catch (error) {
        this._handleTaskError(task, error);
      }
    }
  }

  /**
   * Verifica se há capacidade disponível
   * @private
   * @returns {boolean} True se há capacidade
   */
  _hasAvailableCapacity() {
    return this.runningTasks.size < this.options.maxConcurrent;
  }

  /**
   * Seleciona o melhor worker para uma tarefa
   * @private
   * @param {ParallelTask} task - Tarefa a executar
   * @returns {WorkerInfo|null} Worker selecionado
   */
  _selectWorker(task) {
    if (!this.options.loadBalancing) {
      // Seleção simples: primeiro worker disponível
      for (const worker of this.workers.values()) {
        if (!worker.busy) {
          return worker;
        }
      }
      return null;
    }

    // Load balancing inteligente
    return this.options.loadBalancer(task);
  }

  /**
   * Balanceador de carga padrão
   * @private
   * @param {ParallelTask} task - Tarefa a executar
   * @returns {WorkerInfo|null} Worker selecionado
   */
  defaultLoadBalancer(task) {
    const availableWorkers = Array.from(this.workers.values())
      .filter(w => !w.busy)
      .sort((a, b) => {
        // Prioriza workers com menor carga
        if (a.load !== b.load) {
          return a.load - b.load;
        }
        // Depois por menor número de tarefas completadas (mais "fresco")
        return a.tasksCompleted - b.tasksCompleted;
      });

    return availableWorkers[0] || null;
  }

  /**
   * Executa uma tarefa
   * @private
   * @param {ParallelTask} task - Tarefa a executar
   */
  async _executeTask(task) {
    const worker = this._selectWorker(task);
    if (!worker) {
      // Sem workers disponíveis, retorna à fila
      this.taskQueue.unshift(task);
      return;
    }

    // Registra métricas
    const waitTime = Date.now() - task.createdAt;
    this.metrics.waitTimes.push(waitTime);
    this.metrics.taskTimings.set(task.id, { startTime: Date.now() });

    // Atualiza estatísticas
    this.runningTasks.set(task.id, task);
    this.stats.runningTasks = this.runningTasks.size;
    this.stats.queuedTasks = this.taskQueue.length;

    worker.busy = true;
    worker.lastTaskTime = Date.now();

    this.emit('task_started', { taskId: task.id, workerId: worker.id });

    try {
      // Usar semáforo para controle de concorrência
      await this.semaphore.acquire();

      // Prepara dados para o worker
      const taskData = {
        id: task.id,
        skillName: task.skillName,
        params: task.params,
        options: task.options,
        retryCount: task.retryCount
      };

      // Envia para o worker
      worker.worker.postMessage({
        type: 'execute',
        task: taskData
      });

    } catch (error) {
      this.semaphore.release();
      throw error;
    }
  }

  /**
   * Processa mensagem de worker
   * @private
   * @param {number} workerId - ID do worker
   * @param {Object} message - Mensagem do worker
   */
  _handleWorkerMessage(workerId, message) {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    switch (message.type) {
      case 'task_completed':
        this._handleTaskCompleted(message.taskId, message.result, worker);
        break;

      case 'task_failed':
        this._handleTaskFailed(message.taskId, message.error, worker);
        break;

      case 'worker_ready':
        this._handleWorkerReady(workerId);
        break;

      case 'worker_error':
        this._handleWorkerError(workerId, new Error(message.error));
        break;
    }
  }

  /**
   * Processa tarefa completada
   * @private
   * @param {string} taskId - ID da tarefa
   * @param {Object} result - Resultado da execução
   * @param {WorkerInfo} worker - Worker que executou
   */
  _handleTaskCompleted(taskId, result, worker) {
    const task = this.runningTasks.get(taskId);
    if (!task) return;

    // Libera semáforo
    this.semaphore.release();

    // Atualiza métricas
    const timing = this.metrics.taskTimings.get(taskId);
    if (timing) {
      const executionTime = Date.now() - timing.startTime;
      this.metrics.executionTimes.push(executionTime);
      this.metrics.taskTimings.delete(taskId);
    }

    // Atualiza estatísticas
    this.runningTasks.delete(taskId);
    this.stats.runningTasks = this.runningTasks.size;
    this.stats.completedTasks++;
    this.stats.totalTasks++;

    worker.busy = false;
    worker.tasksCompleted++;
    worker.load = Math.max(0, worker.load - 0.1);

    this.emit('task_completed', { taskId, result, workerId: worker.id });

    // Resolve a promise
    task.resolve({
      success: true,
      result: result.result,
      executionTime: result.executionTime,
      metadata: result.metadata
    });
  }

  /**
   * Processa tarefa falhada
   * @private
   * @param {string} taskId - ID da tarefa
   * @param {Object} error - Erro da execução
   * @param {WorkerInfo} worker - Worker que executou
   */
  _handleTaskFailed(taskId, error, worker) {
    const task = this.runningTasks.get(taskId);
    if (!task) return;

    // Libera semáforo
    this.semaphore.release();

    // Atualiza estatísticas
    this.runningTasks.delete(taskId);
    this.stats.runningTasks = this.runningTasks.size;
    this.stats.failedTasks++;
    this.stats.totalTasks++;

    worker.busy = false;
    worker.tasksFailed++;
    worker.load = Math.min(1, worker.load + 0.2);

    this.emit('task_failed', { taskId, error, workerId: worker.id });

    // Verifica se deve fazer retry
    if (task.retryCount < task.maxRetries && this._shouldRetry(error)) {
      console.log(`[ParallelExecutor] Retrying task ${taskId} (attempt ${task.retryCount + 1}/${task.maxRetries})`);
      task.retryCount++;
      task.createdAt = Date.now(); // Reset timestamp para nova tentativa
      this.taskQueue.unshift(task); // Adiciona de volta à fila
      return;
    }

    // Rejeita a promise após todas as tentativas
    task.reject(new Error(`Task failed after ${task.retryCount} attempts: ${error.message}`));
  }

  /**
   * Verifica se uma tarefa deve ser reexecutada
   * @private
   * @param {Error} error - Erro da execução
   * @returns {boolean} True se deve fazer retry
   */
  _shouldRetry(error) {
    // Retry para erros temporários
    const retryableErrors = [
      'timeout',
      'connection',
      'network',
      'busy',
      'unavailable',
      'retry'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Processa erro de worker
   * @private
   * @param {number} workerId - ID do worker
   * @param {Error} error - Erro do worker
   */
  _handleWorkerError(workerId, error) {
    console.error(`[ParallelExecutor] Worker ${workerId} error:`, error.message);
    this.emit('worker_error', { workerId, error });

    // Recria o worker se necessário
    const worker = this.workers.get(workerId);
    if (worker) {
      this._recreateWorker(workerId);
    }
  }

  /**
   * Processa saída de worker
   * @private
   * @param {number} workerId - ID do worker
   * @param {number} code - Código de saída
   */
  _handleWorkerExit(workerId, code) {
    console.log(`[ParallelExecutor] Worker ${workerId} exited with code ${code}`);
    this.emit('worker_exit', { workerId, code });

    // Recria o worker
    this._recreateWorker(workerId);
  }

  /**
   * Recria um worker
   * @private
   * @param {number} workerId - ID do worker
   */
  _recreateWorker(workerId) {
    const oldWorker = this.workers.get(workerId);
    if (oldWorker) {
      oldWorker.worker.terminate();
      this.workers.delete(workerId);
    }

    // Recria com novo ID
    this._createWorker(workerId);
  }

  /**
   * Processa worker pronto
   * @private
   * @param {number} workerId - ID do worker
   */
  _handleWorkerReady(workerId) {
    this.emit('worker_ready', { workerId });
  }

  /**
   * Executa múltiplas skills em paralelo
   * @param {Array<Object>} tasks - Array de tarefas {skillName, params, options, priority}
   * @param {Object} options - Opções de execução em lote
   * @returns {Promise<Array<Object>>} Resultados de todas as tarefas
   */
  async executeBatch(tasks, options = {}) {
    if (!Array.isArray(tasks)) {
      throw new Error('Tasks must be an array');
    }

    if (tasks.length === 0) {
      return [];
    }

    const batchOptions = {
      timeout: options.timeout || this.options.taskTimeout * tasks.length,
      priority: options.priority || 5,
      ...options
    };

    console.log(`[ParallelExecutor] Executing batch of ${tasks.length} tasks`);

    // Cria promises para todas as tarefas
    const promises = tasks.map((task, index) => {
      const taskConfig = {
        skillName: task.skillName,
        params: task.params || {},
        options: task.options || {},
        priority: task.priority || batchOptions.priority,
        timeout: task.timeout || batchOptions.timeout
      };

      return this.executeTask(taskConfig);
    });

    // Usa Promise.allSettled para não falhar completamente se uma tarefa falhar
    const results = await Promise.allSettled(promises);

    // Formata resultados
    return results.map((result, index) => ({
      index,
      skillName: tasks[index].skillName,
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  /**
   * Executa uma única tarefa
   * @param {Object} taskConfig - Configuração da tarefa
   * @returns {Promise<Object>} Resultado da execução
   */
  async executeTask(taskConfig) {
    const taskId = `task_${++this.taskIdCounter}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const task = {
        id: taskId,
        skillName: taskConfig.skillName,
        params: taskConfig.params || {},
        options: taskConfig.options || {},
        priority: taskConfig.priority || 5,
        maxRetries: taskConfig.maxRetries || this.options.retryAttempts,
        retryCount: 0,
        createdAt: Date.now(),
        resolve,
        reject
      };

      // Verifica se a fila está cheia
      if (this.taskQueue.length >= this.options.queueSize) {
        reject(new Error('Task queue is full'));
        return;
      }

      // Adiciona à fila
      this.taskQueue.push(task);
      this.stats.queuedTasks = this.taskQueue.length;
      this.stats.queueSize = this.taskQueue.length;

      this.emit('task_queued', { taskId, skillName: task.skillName });
    });
  }

  /**
   * Obtém estatísticas detalhadas
   * @returns {ParallelExecutorStats} Estatísticas do executor
   */
  getStats() {
    const now = Date.now();
    const uptime = now - this.metrics.startTime;

    // Calcula médias
    const avgWaitTime = this.metrics.waitTimes.length > 0
      ? this.metrics.waitTimes.reduce((a, b) => a + b, 0) / this.metrics.waitTimes.length
      : 0;

    const avgExecutionTime = this.metrics.executionTimes.length > 0
      ? this.metrics.executionTimes.reduce((a, b) => a + b, 0) / this.metrics.executionTimes.length
      : 0;

    const throughput = uptime > 0 ? (this.stats.completedTasks + this.stats.failedTasks) / (uptime / 1000) : 0;

    return {
      totalTasks: this.stats.totalTasks,
      completedTasks: this.stats.completedTasks,
      failedTasks: this.stats.failedTasks,
      queuedTasks: this.stats.queuedTasks,
      runningTasks: this.stats.runningTasks,
      averageWaitTime: Math.round(avgWaitTime),
      averageExecutionTime: Math.round(avgExecutionTime),
      throughput: Math.round(throughput * 100) / 100,
      queueSize: this.stats.queueSize,
      workers: this.stats.workers.map(w => ({
        id: w.id,
        busy: w.busy,
        tasksCompleted: w.tasksCompleted,
        tasksFailed: w.tasksFailed,
        load: Math.round(w.load * 100) / 100,
        lastTaskTime: w.lastTaskTime
      })),
      uptime: uptime,
      queueUtilization: this.stats.queueSize / this.options.queueSize
    };
  }

  /**
   * Pausa o processamento de novas tarefas
   */
  pause() {
    this.isRunning = false;
    this.emit('paused');
  }

  /**
   * Retoma o processamento de tarefas
   */
  resume() {
    this.isRunning = true;
    this.emit('resumed');
  }

  /**
   * Limpa a fila de tarefas
   */
  clearQueue() {
    const clearedCount = this.taskQueue.length;
    this.taskQueue = [];
    this.stats.queuedTasks = 0;
    this.stats.queueSize = 0;
    this.emit('queue_cleared', { count: clearedCount });
    return clearedCount;
  }

  /**
   * Finaliza o executor e limpa recursos
   */
  async shutdown() {
    console.log('[ParallelExecutor] Shutting down...');

    this.isRunning = false;

    // Limpa intervalo
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Aguarda tarefas em execução terminarem
    const maxWaitTime = 30000; // 30 segundos
    const startTime = Date.now();

    while (this.runningTasks.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Termina workers
    const workerTerminations = Array.from(this.workers.values()).map(workerInfo => {
      return new Promise((resolve) => {
        workerInfo.worker.once('exit', resolve);
        workerInfo.worker.terminate();
      });
    });

    await Promise.all(workerTerminations);
    this.workers.clear();

    console.log('[ParallelExecutor] Shutdown complete');
    this.emit('shutdown');
  }
}

/**
 * Semáforo para controle de concorrência
 * @class Semaphore
 */
class Semaphore {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.currentCount = 0;
    this.waitQueue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.currentCount < this.maxConcurrent) {
        this.currentCount++;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  release() {
    this.currentCount--;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      this.currentCount++;
      next();
    }
  }
}

module.exports = ParallelExecutor;