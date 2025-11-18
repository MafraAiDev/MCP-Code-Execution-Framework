/**
 * @fileoverview Parallel Executor Simples - Versão sem Workers para testes
 * @module core/parallel-executor-simple
 * @description Executor paralelo simplificado usando Promise.all com controle de concorrência
 * @author Claude AI
 * @version 1.0.0
 * @requires events
 */

const { EventEmitter } = require('events');

/**
 * ParallelExecutorSimple - Versão simplificada sem Workers
 * Usa Promise.all com semáforo para controle de concorrência
 * @class ParallelExecutorSimple
 * @extends EventEmitter
 */
class ParallelExecutorSimple extends EventEmitter {
  /**
   * @param {Object} skillsManager - Instância do SkillsManager
   * @param {Object} options - Opções de configuração
   */
  constructor(skillsManager, options = {}) {
    super();

    if (!skillsManager) {
      throw new Error('SkillsManager is required for ParallelExecutorSimple');
    }

    this.skillsManager = skillsManager;
    this.options = {
      maxConcurrent: options.maxConcurrent || 3,
      taskTimeout: options.taskTimeout || 30000,
      retryAttempts: options.retryAttempts || 2,
      retryDelay: options.retryDelay || 1000,
      ...options
    };

    // Estado interno
    this.runningTasks = new Map();
    this.taskIdCounter = 0;
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      runningTasks: 0
    };

    // Semáforo para controle de concorrência
    this.semaphore = new Semaphore(this.options.maxConcurrent);
    this.isRunning = true;
  }

  /**
   * Executa múltiplas skills em paralelo com controle de concorrência
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

    console.log(`[ParallelExecutorSimple] Executing batch of ${tasks.length} tasks`);

    const startTime = Date.now();

    // Cria promises para todas as tarefas com controle de concorrência
    const promises = tasks.map((task, index) => {
      return this._executeTaskWithSemaphore({
        skillName: task.skillName,
        params: task.params || {},
        options: task.options || {},
        index: index
      });
    });

    // Usa Promise.allSettled para não falhar completamente se uma tarefa falhar
    const results = await Promise.allSettled(promises);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`[ParallelExecutorSimple] Batch completed in ${totalTime}ms`);

    // Formata resultados
    return results.map((result, index) => ({
      index,
      skillName: tasks[index].skillName,
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
      executionTime: result.status === 'fulfilled' ? result.value?.executionTime : null
    }));
  }

  /**
   * Executa uma tarefa com controle de concorrência via semáforo
   * @private
   * @param {Object} taskConfig - Configuração da tarefa
   * @returns {Promise<Object>} Resultado da execução
   */
  async _executeTaskWithSemaphore(taskConfig) {
    const taskId = `task_${++this.taskIdCounter}_${Date.now()}`;

    // Aguarda slot disponível no semáforo
    await this.semaphore.acquire();

    try {
      return await this._executeTask(taskId, taskConfig);
    } finally {
      this.semaphore.release();
    }
  }

  /**
   * Executa uma única tarefa
   * @private
   * @param {string} taskId - ID da tarefa
   * @param {Object} taskConfig - Configuração da tarefa
   * @returns {Promise<Object>} Resultado da execução
   */
  async _executeTask(taskId, taskConfig) {
    const { skillName, params, options } = taskConfig;

    console.log(`[ParallelExecutorSimple] Starting task ${taskId}: ${skillName}`);

    this.runningTasks.set(taskId, taskConfig);
    this.stats.runningTasks = this.runningTasks.size;
    this.stats.totalTasks++;

    this.emit('task_started', { taskId, skillName });

    const startTime = Date.now();

    try {
      // Adiciona timeout se especificado
      const timeout = options.timeout || this.options.taskTimeout;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Task timeout after ${timeout}ms`)), timeout);
      });

      // Executa a skill com timeout
      const result = await Promise.race([
        this.skillsManager.executeSkill(skillName, params, options),
        timeoutPromise
      ]);

      const executionTime = Date.now() - startTime;

      this.runningTasks.delete(taskId);
      this.stats.runningTasks = this.runningTasks.size;
      this.stats.completedTasks++;

      this.emit('task_completed', { taskId, result, executionTime });

      return {
        success: true,
        result: result.result || result, // Handle both formats
        executionTime: executionTime / 1000,
        metadata: {
          taskId,
          skillName,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      this.runningTasks.delete(taskId);
      this.stats.runningTasks = this.runningTasks.size;
      this.stats.failedTasks++;

      this.emit('task_failed', { taskId, error });

      // Verifica se deve fazer retry
      if (this._shouldRetry(error)) {
        console.log(`[ParallelExecutorSimple] Retrying task ${taskId} due to recoverable error`);
        // Para simplificar, apenas re-throw o erro nesta versão
      }

      throw new Error(`Task execution failed: ${error.message}`);
    }
  }

  /**
   * Verifica se uma tarefa deve ser reexecutada
   * @private
   * @param {Error} error - Erro da execução
   * @returns {boolean} True se deve fazer retry
   */
  _shouldRetry(error) {
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
   * Obtém estatísticas detalhadas
   * @returns {Object} Estatísticas do executor
   */
  getStats() {
    return {
      totalTasks: this.stats.totalTasks,
      completedTasks: this.stats.completedTasks,
      failedTasks: this.stats.failedTasks,
      runningTasks: this.stats.runningTasks,
      maxConcurrent: this.options.maxConcurrent,
      queueUtilization: this.stats.runningTasks / this.options.maxConcurrent
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
   * Finaliza o executor e limpa recursos
   */
  async shutdown() {
    console.log('[ParallelExecutorSimple] Shutting down...');

    this.isRunning = false;

    // Aguarda tarefas em execução terminarem
    const maxWaitTime = 10000; // 10 segundos
    const startTime = Date.now();

    while (this.runningTasks.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.runningTasks.size > 0) {
      console.warn(`[ParallelExecutorSimple] ${this.runningTasks.size} tasks still running after shutdown timeout`);
    }

    console.log('[ParallelExecutorSimple] Shutdown complete');
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

module.exports = ParallelExecutorSimple;