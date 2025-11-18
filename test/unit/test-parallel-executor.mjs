/**
 * Unit tests for ParallelExecutor
 * Tests: initialization, task execution, queue management, load balancing, retry logic
 */

import assert from 'assert';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Importar o ParallelExecutor (CommonJS)
const ParallelExecutor = await import('../../core/parallel-executor.cjs').then(m => m.default);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock SkillsManager para testes
class MockSkillsManager {
  constructor() {
    this.executions = [];
  }

  async executeSkill(skillName, params, options) {
    const startTime = Date.now();

    // Simula tempo de execução baseado na skill
    const delay = this._getExecutionDelay(skillName);
    await new Promise(resolve => setTimeout(resolve, delay));

    const executionTime = Date.now() - startTime;

    const result = {
      success: true,
      result: `Result for ${skillName} with params: ${JSON.stringify(params)}`,
      executionTime: executionTime / 1000,
      timestamp: new Date().toISOString()
    };

    this.executions.push({ skillName, params, result });
    return result;
  }

  _getExecutionDelay(skillName) {
    const delays = {
      'fast-skill': 100,
      'medium-skill': 300,
      'slow-skill': 500,
      'failing-skill': 50,
      'timeout-skill': 1000
    };
    return delays[skillName] || 200;
  }

  getExecutions() {
    return this.executions;
  }
}

describe('ParallelExecutor', function() {
  this.timeout(30000); // Testes paralelos podem levar tempo

  let executor;
  let mockSkillsManager;

  beforeEach(() => {
    mockSkillsManager = new MockSkillsManager();
  });

  afterEach(async () => {
    if (executor) {
      await executor.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default options', async () => {
      executor = new ParallelExecutor(mockSkillsManager);

      assert.ok(executor);
      assert.strictEqual(executor.options.maxWorkers, 3);
      assert.strictEqual(executor.options.maxConcurrent, 3);
      assert.strictEqual(executor.options.queueSize, 100);
      assert.strictEqual(executor.options.taskTimeout, 30000);
      assert.strictEqual(executor.options.retryAttempts, 2);
      assert.strictEqual(executor.options.loadBalancing, true);
      assert.strictEqual(executor.options.priorityScheduling, true);
    });

    it('should initialize with custom options', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 5,
        maxConcurrent: 4,
        queueSize: 50,
        taskTimeout: 60000,
        retryAttempts: 3,
        loadBalancing: false,
        priorityScheduling: false
      });

      assert.strictEqual(executor.options.maxWorkers, 5);
      assert.strictEqual(executor.options.maxConcurrent, 4);
      assert.strictEqual(executor.options.queueSize, 50);
      assert.strictEqual(executor.options.taskTimeout, 60000);
      assert.strictEqual(executor.options.retryAttempts, 3);
      assert.strictEqual(executor.options.loadBalancing, false);
      assert.strictEqual(executor.options.priorityScheduling, false);
    });

    it('should throw error without skillsManager', () => {
      assert.throws(() => {
        new ParallelExecutor(null);
      }, /SkillsManager is required/);
    });

    it('should create workers on initialization', async () => {
      executor = new ParallelExecutor(mockSkillsManager);

      // Aguarda inicialização dos workers
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = executor.getStats();
      assert.ok(stats.workers.length > 0, 'Should have workers');
      assert.ok(stats.workers.length <= 3, 'Should respect maxWorkers limit');
    });
  });

  describe('Single Task Execution', () => {
    it('should execute a single task successfully', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 2,
        maxConcurrent: 2
      });

      const result = await executor.executeTask({
        skillName: 'fast-skill',
        params: { test: 1 },
        options: { timeout: 5000 }
      });

      assert.ok(result);
      assert.strictEqual(result.success, true);
      assert.ok(result.result);
      assert.ok(result.executionTime >= 0);
    });

    it('should handle task timeout', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 1,
        maxConcurrent: 1,
        taskTimeout: 500 // Timeout curto
      });

      try {
        await executor.executeTask({
          skillName: 'timeout-skill',
          params: {},
          options: { timeout: 100 } // Timeout mais curto que a execução
        });
        assert.fail('Should have timed out');
      } catch (error) {
        assert.ok(error.message.includes('timeout') || error.message.includes('failed'));
      }
    });

    it('should validate skill name', async () => {
      executor = new ParallelExecutor(mockSkillsManager);

      try {
        await executor.executeTask({
          skillName: '',
          params: {}
        });
        assert.fail('Should have thrown error for empty skill name');
      } catch (error) {
        assert.ok(error.message);
      }
    });
  });

  describe('Batch Execution', () => {
    it('should execute multiple tasks in parallel', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 3,
        maxConcurrent: 3
      });

      const tasks = [
        { skillName: 'fast-skill', params: { id: 1 } },
        { skillName: 'medium-skill', params: { id: 2 } },
        { skillName: 'fast-skill', params: { id: 3 } }
      ];

      const startTime = Date.now();
      const results = await executor.executeBatch(tasks);
      const endTime = Date.now();

      assert.strictEqual(results.length, 3);
      assert.ok(results.every(r => r.success === true));
      assert.ok(results.every(r => r.result));

      // Verifica que executou em paralelo (deve ser mais rápido que sequencial)
      const totalTime = endTime - startTime;
      const sequentialTime = 100 + 300 + 100; // delays das skills
      assert.ok(totalTime < sequentialTime * 0.8, 'Should execute faster than sequential');
    });

    it('should handle mixed success and failure in batch', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 2,
        maxConcurrent: 2
      });

      const tasks = [
        { skillName: 'fast-skill', params: { id: 1 } },
        { skillName: 'non-existent-skill', params: { id: 2 } }, // Esta vai falhar
        { skillName: 'medium-skill', params: { id: 3 } }
      ];

      const results = await executor.executeBatch(tasks);

      assert.strictEqual(results.length, 3);
      assert.strictEqual(results[0].success, true);
      assert.strictEqual(results[1].success, false); // Deve falhar
      assert.strictEqual(results[2].success, true);
    });

    it('should handle empty batch', async () => {
      executor = new ParallelExecutor(mockSkillsManager);

      const results = await executor.executeBatch([]);
      assert.strictEqual(results.length, 0);
    });

    it('should validate batch input', async () => {
      executor = new ParallelExecutor(mockSkillsManager);

      try {
        await executor.executeBatch('invalid');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('array'));
      }
    });
  });

  describe('Queue Management', () => {
    it('should queue tasks when workers are busy', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 1,
        maxConcurrent: 1
      });

      // Inicia múltiplas tarefas que vão para a fila
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(executor.executeTask({
          skillName: 'fast-skill',
          params: { id: i }
        }));
      }

      const results = await Promise.all(promises);

      assert.strictEqual(results.length, 5);
      assert.ok(results.every(r => r.success === true));

      // Verifica que a fila foi usada
      const stats = executor.getStats();
      assert.ok(stats.totalTasks >= 5);
    });

    it('should respect queue size limit', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 1,
        maxConcurrent: 1,
        queueSize: 2 // Fila pequena
      });

      // Preenche a fila
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(executor.executeTask({
          skillName: 'slow-skill', // Skill lenta para manter workers ocupados
          params: { id: i }
        }));
      }

      // Algumas devem falhar por fila cheia
      const results = await Promise.allSettled(promises);
      const failures = results.filter(r => r.status === 'rejected');

      assert.ok(failures.length > 0, 'Some tasks should fail due to queue full');
      assert.ok(failures[0].reason.message.includes('full'));
    });

    it('should clear queue', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 1,
        maxConcurrent: 1
      });

      // Adiciona tarefas à fila
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(executor.executeTask({
          skillName: 'slow-skill',
          params: { id: i }
        }));
      }

      // Aguarda um pouco para garantir que estão na fila
      await new Promise(resolve => setTimeout(resolve, 50));

      // Limpa a fila
      const cleared = executor.clearQueue();
      assert.ok(cleared > 0, 'Should clear some tasks');

      // Aguarda as que já estavam em execução terminarem
      await Promise.allSettled(promises);
    });
  });

  describe('Priority Scheduling', () => {
    it('should execute higher priority tasks first', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 1,
        maxConcurrent: 1,
        priorityScheduling: true
      });

      const executionOrder = [];

      // Cria tarefas com diferentes prioridades
      const highPriorityTask = executor.executeTask({
        skillName: 'fast-skill',
        params: { priority: 'high' },
        priority: 9
      }).then(() => executionOrder.push('high'));

      const lowPriorityTask = executor.executeTask({
        skillName: 'fast-skill',
        params: { priority: 'low' },
        priority: 1
      }).then(() => executionOrder.push('low'));

      const mediumPriorityTask = executor.executeTask({
        skillName: 'fast-skill',
        params: { priority: 'medium' },
        priority: 5
      }).then(() => executionOrder.push('medium'));

      await Promise.all([highPriorityTask, lowPriorityTask, mediumPriorityTask]);

      // Verifica ordem de execução (alta prioridade primeiro)
      assert.ok(executionOrder.indexOf('high') < executionOrder.indexOf('medium'));
      assert.ok(executionOrder.indexOf('medium') < executionOrder.indexOf('low'));
    });

    it('should handle tasks with same priority in FIFO order', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 1,
        maxConcurrent: 1,
        priorityScheduling: true
      });

      const executionOrder = [];

      // Cria tarefas com mesma prioridade
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          executor.executeTask({
            skillName: 'fast-skill',
            params: { order: i },
            priority: 5 // Mesma prioridade
          }).then(() => executionOrder.push(i))
        );
      }

      await Promise.all(promises);

      // Deve manter ordem FIFO para mesma prioridade
      assert.deepStrictEqual(executionOrder, [0, 1, 2]);
    });
  });

  describe('Load Balancing', () => {
    it('should distribute tasks across workers', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 3,
        maxConcurrent: 3,
        loadBalancing: true
      });

      // Aguarda inicialização
      await new Promise(resolve => setTimeout(resolve, 100));

      // Executa várias tarefas
      const promises = [];
      for (let i = 0; i < 9; i++) {
        promises.push(executor.executeTask({
          skillName: 'fast-skill',
          params: { id: i }
        }));
      }

      await Promise.all(promises);

      // Verifica distribuição
      const stats = executor.getStats();
      const workers = stats.workers;

      assert.ok(workers.length >= 2, 'Should have multiple workers');

      // Verifica que todos os workers foram utilizados
      const totalTasks = workers.reduce((sum, w) => sum + w.tasksCompleted + w.tasksFailed, 0);
      assert.ok(totalTasks >= 9, 'All tasks should be distributed');
    });

    it('should use custom load balancer when provided', async () => {
      let customBalancerCalled = false;

      const customLoadBalancer = (task) => {
        customBalancerCalled = true;
        // Seleciona sempre o primeiro worker disponível
        const workers = Array.from(executor.workers.values());
        return workers.find(w => !w.busy) || null;
      };

      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 2,
        maxConcurrent: 2,
        loadBalancing: true,
        loadBalancer: customLoadBalancer
      });

      await executor.executeTask({
        skillName: 'fast-skill',
        params: {}
      });

      assert.ok(customBalancerCalled, 'Custom load balancer should be called');
    });
  });

  describe('Retry Logic', () => {
    it('should retry tasks that fail with retryable errors', async () => {
      let attemptCount = 0;

      // Cria um mock que falha nas primeiras tentativas
      const failingSkillsManager = {
        executeSkill: async (skillName, params) => {
          attemptCount++;
          if (attemptCount <= 2) {
            const error = new Error('Network timeout');
            error.code = 'TIMEOUT';
            throw error;
          }
          return { success: true, result: 'Success after retries' };
        }
      };

      executor = new ParallelExecutor(failingSkillsManager, {
        maxWorkers: 1,
        maxConcurrent: 1,
        retryAttempts: 3,
        retryDelay: 100
      });

      const result = await executor.executeTask({
        skillName: 'retryable-skill',
        params: {}
      });

      assert.ok(result.success);
      assert.ok(attemptCount >= 3, 'Should have retried multiple times');
    });

    it('should not retry non-retryable errors', async () => {
      let attemptCount = 0;

      const nonRetryableSkillsManager = {
        executeSkill: async (skillName, params) => {
          attemptCount++;
          const error = new Error('Invalid parameters'); // Erro não recuperável
          throw error;
        }
      };

      executor = new ParallelExecutor(nonRetryableSkillsManager, {
        maxWorkers: 1,
        maxConcurrent: 1,
        retryAttempts: 3
      });

      try {
        await executor.executeTask({
          skillName: 'non-retryable-skill',
          params: {}
        });
        assert.fail('Should have failed permanently');
      } catch (error) {
        assert.strictEqual(attemptCount, 1, 'Should not retry non-recoverable errors');
      }
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track execution statistics', async () => {
      executor = new ParallelExecutor(mockSkillsManager);

      // Executa algumas tarefas
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(executor.executeTask({
          skillName: 'fast-skill',
          params: { id: i }
        }));
      }

      await Promise.all(promises);

      const stats = executor.getStats();

      assert.ok(stats.totalTasks >= 5);
      assert.ok(stats.completedTasks >= 5);
      assert.ok(stats.averageWaitTime >= 0);
      assert.ok(stats.averageExecutionTime >= 0);
      assert.ok(stats.throughput >= 0);
      assert.ok(Array.isArray(stats.workers));
      assert.ok(stats.uptime >= 0);
    });

    it('should update statistics in real-time', async () => {
      executor = new ParallelExecutor(mockSkillsManager);

      const stats1 = executor.getStats();
      const initialTasks = stats1.totalTasks;

      await executor.executeTask({
        skillName: 'fast-skill',
        params: {}
      });

      const stats2 = executor.getStats();
      assert.ok(stats2.totalTasks > initialTasks);
    });

    it('should calculate queue utilization', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        queueSize: 10
      });

      // Adiciona algumas tarefas
      await executor.executeTask({ skillName: 'fast-skill', params: {} });

      const stats = executor.getStats();
      assert.ok(typeof stats.queueUtilization === 'number');
      assert.ok(stats.queueUtilization >= 0 && stats.queueUtilization <= 1);
    });
  });

  describe('Pause and Resume', () => {
    it('should pause and resume task processing', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 1,
        maxConcurrent: 1
      });

      let taskExecuted = false;

      // Pausa o executor
      executor.pause();

      // Tenta executar uma tarefa (deve ficar na fila)
      const taskPromise = executor.executeTask({
        skillName: 'fast-skill',
        params: {}
      }).then(() => {
        taskExecuted = true;
      });

      // Aguarda um pouco para garantir que não executou
      await new Promise(resolve => setTimeout(resolve, 200));
      assert.ok(!taskExecuted, 'Task should not execute while paused');

      // Retoma o executor
      executor.resume();

      // Agora a tarefa deve executar
      await taskPromise;
      assert.ok(taskExecuted, 'Task should execute after resume');
    });
  });

  describe('Event Handling', () => {
    it('should emit events during task lifecycle', async () => {
      executor = new ParallelExecutor(mockSkillsManager);

      const events = [];

      executor.on('task_queued', (data) => events.push({ type: 'queued', ...data }));
      executor.on('task_started', (data) => events.push({ type: 'started', ...data }));
      executor.on('task_completed', (data) => events.push({ type: 'completed', ...data }));

      await executor.executeTask({
        skillName: 'fast-skill',
        params: {}
      });

      // Aguarda processamento
      await new Promise(resolve => setTimeout(resolve, 500));

      assert.ok(events.length >= 2, 'Should emit multiple events');
      assert.ok(events.some(e => e.type === 'queued'));
      assert.ok(events.some(e => e.type === 'completed'));
    });

    it('should emit worker events', async () => {
      executor = new ParallelExecutor(mockSkillsManager);

      const workerEvents = [];
      executor.on('workers_initialized', (data) => workerEvents.push(data));
      executor.on('worker_ready', (data) => workerEvents.push(data));

      // Aguarda inicialização
      await new Promise(resolve => setTimeout(resolve, 200));

      assert.ok(workerEvents.length > 0, 'Should emit worker events');
    });
  });

  describe('Performance Metrics', () => {
    it('should demonstrate parallel execution speedup', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 3,
        maxConcurrent: 3
      });

      const tasks = [];
      for (let i = 0; i < 6; i++) {
        tasks.push({
          skillName: 'medium-skill',
          params: { id: i }
        });
      }

      const startTime = Date.now();
      const results = await executor.executeBatch(tasks);
      const endTime = Date.now();

      const parallelTime = endTime - startTime;

      // Executa sequencialmente para comparação
      const sequentialStart = Date.now();
      for (const task of tasks) {
        await mockSkillsManager.executeSkill(task.skillName, task.params);
      }
      const sequentialEnd = Date.now();
      const sequentialTime = sequentialEnd - sequentialStart;

      console.log(`Parallel time: ${parallelTime}ms, Sequential time: ${sequentialTime}ms`);
      console.log(`Speedup: ${(sequentialTime / parallelTime).toFixed(2)}x`);

      assert.ok(results.every(r => r.success === true));
      assert.ok(parallelTime < sequentialTime * 0.7, 'Should be significantly faster than sequential');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle worker failures gracefully', async () => {
      executor = new ParallelExecutor(mockSkillsManager, {
        maxWorkers: 2,
        maxConcurrent: 2
      });

      // Aguarda inicialização
      await new Promise(resolve => setTimeout(resolve, 100));

      // Executa tarefas para verificar recuperação
      const results = await Promise.all([
        executor.executeTask({ skillName: 'fast-skill', params: {} }),
        executor.executeTask({ skillName: 'medium-skill', params: {} })
      ]);

      assert.ok(results.every(r => r.success === true));
    });

    it('should handle shutdown gracefully', async () => {
      executor = new ParallelExecutor(mockSkillsManager);

      // Inicia algumas tarefas
      const taskPromise = executor.executeTask({
        skillName: 'medium-skill',
        params: {}
      });

      // Desliga o executor
      await executor.shutdown();

      // Verifica que a tarefa foi completada ou rejeitada apropriadamente
      const result = await Promise.race([
        taskPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      assert.ok(result);
    });

    it('should handle concurrent shutdown requests', async () => {
      executor = new ParallelExecutor(mockSkillsManager);

      // Múltiplas chamadas de shutdown devem ser seguras
      const shutdownPromises = [
        executor.shutdown(),
        executor.shutdown(),
        executor.shutdown()
      ];

      await Promise.all(shutdownPromises);
      assert.ok(true, 'Multiple shutdown calls should be safe');
    });
  });
});

// Executar testes se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Executando testes unitários do ParallelExecutor...\n');

  // Executa testes manualmente
  const tests = [];
  let currentTest = 0;

  // Coleta todos os testes
  global.describe = (name, fn) => {
    console.log(`\n📋 Suite: ${name}`);
    fn();
  };

  global.it = (name, fn) => {
    tests.push({ name, fn: fn.bind({ timeout: () => {} }) });
  };

  global.beforeEach = (fn) => { /* setup */ };
  global.afterEach = (fn) => { /* cleanup */ };

  // Executa testes sequencialmente
  async function runTests() {
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        passed++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Resultado: ${passed} passou, ${failed} falhou`);
    process.exit(failed > 0 ? 1 : 0);
  }

  // Aguarda definição dos testes e executa
  setTimeout(runTests, 100);
}

export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração export { describe }; // Export para compatibilidade Mocha/Manual Tests
export { describe, ParallelExecutor, MockSkillsManager }; // Exporta para testes de integração e uso externo