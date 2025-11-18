/**
 * @fileoverview Testes unitários para PythonProcessPool
 * @module test/unit/test-process-pool
 */

import { describe, it, before, after, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import PythonProcessPool from '../../core/process-pool.cjs';

describe('FASE 7.2 - Python Process Pool', () => {
  let pool;

  afterEach(async () => {
    if (pool) {
      await pool.cleanup().catch(() => {});
    }
  });

  describe('Inicialização', () => {
    it('deve inicializar pool com configurações padrão', async () => {
      pool = new PythonProcessPool({ poolSize: 2 });
      await pool.initialize();

      expect(pool.initialized).to.be.true;
      expect(pool.processes.length).to.equal(2);
      expect(pool.available.length).to.equal(2);
      expect(pool.busy.length).to.equal(0);
    });

    it('deve aceitar configurações customizadas', async () => {
      pool = new PythonProcessPool({
        poolSize: 3,
        healthCheckInterval: 15000,
        maxRestarts: 5
      });

      expect(pool.options.poolSize).to.equal(3);
      expect(pool.options.healthCheckInterval).to.equal(15000);
      expect(pool.options.maxRestarts).to.equal(5);
    });

    it('deve emitir evento initialized', (done) => {
      pool = new PythonProcessPool({ poolSize: 1 });

      pool.on('initialized', () => {
        expect(pool.initialized).to.be.true;
        done();
      });

      pool.initialize();
    });
  });

  describe('Métricas', () => {
    beforeEach(async () => {
      pool = new PythonProcessPool({ poolSize: 2 });
      await pool.initialize();
    });

    it('deve rastrear estatísticas iniciais', () => {
      const stats = pool.getStats();

      expect(stats.poolSize).to.equal(2);
      expect(stats.available).to.equal(2);
      expect(stats.busy).to.equal(0);
      expect(stats.totalRequests).to.equal(0);
      expect(stats.reuseCount).to.equal(0);
      expect(stats.spawnCount).to.equal(2);
    });

    it('deve calcular taxa de reuso corretamente', async () => {
      // Simular 3 execuções (todas devem reusar processos do pool)
      pool.stats.totalRequests = 3;
      pool.stats.reuseCount = 3;

      const stats = pool.getStats();
      expect(stats.reuseRate).to.equal('100.00%');
    });

    it('deve calcular utilização do pool', () => {
      // Mover 1 processo para busy
      pool.available.pop();
      pool.busy.push({ id: 1 });

      const stats = pool.getStats();
      expect(stats.utilization).to.equal('50.00%');
    });
  });

  describe('Queue System', () => {
    it('deve enfileirar requisições quando pool está cheio', async () => {
      pool = new PythonProcessPool({ poolSize: 1 });
      await pool.initialize();

      // Simular processo ocupado
      const process = pool.available.pop();
      pool.busy.push(process);

      // Tentar obter processo (deve enfileirar)
      const promise = pool._getAvailableProcess();

      expect(pool.requestQueue.length).to.equal(1);
      expect(pool.stats.queuedRequests).to.equal(1);

      // Liberar processo
      pool.busy.pop();
      pool.available.push(process);
      pool._processQueue();

      const result = await promise;
      expect(result.id).to.equal(process.id);
    });

    it('deve processar fila FIFO (First-In-First-Out)', async () => {
      pool = new PythonProcessPool({ poolSize: 1 });
      await pool.initialize();

      // Deixar pool cheio
      const process = pool.available.pop();
      pool.busy.push(process);

      // Enfileirar 3 requisições
      const promise1 = pool._getAvailableProcess();
      const promise2 = pool._getAvailableProcess();
      const promise3 = pool._getAvailableProcess();

      expect(pool.requestQueue.length).to.equal(3);

      // Liberar processo (deve atender primeiro da fila)
      setTimeout(() => {
        pool.busy.pop();
        pool.available.push(process);
        pool._processQueue();
      }, 50);

      await promise1;
      expect(pool.requestQueue.length).to.equal(2);

      setTimeout(() => {
        pool._processQueue();
      }, 50);

      await promise2;
      expect(pool.requestQueue.length).to.equal(1);
    });
  });

  describe('Health Checks', () => {
    it('deve iniciar health checks periódicos', async () => {
      pool = new PythonProcessPool({
        poolSize: 1,
        healthCheckInterval: 100
      });

      await pool.initialize();

      expect(pool.healthCheckTimer).to.not.be.null;

      // Aguardar alguns health checks
      await new Promise(resolve => setTimeout(resolve, 250));

      await pool.cleanup();
      expect(pool.healthCheckTimer).to.be.null;
    });

    it('deve detectar processos falhos via health check', async () => {
      pool = new PythonProcessPool({
        poolSize: 1,
        healthCheckInterval: 100
      });

      await pool.initialize();

      const process = pool.processes[0];

      // Simular processo morto
      setTimeout(() => {
        process.process.kill();
      }, 150);

      // Aguardar health check falhar
      await new Promise(resolve => {
        pool.on('exit', resolve);
      });

      expect(pool.stats.healthCheckFailures).to.be.greaterThan(0);
      await pool.cleanup();
    });
  });

  describe('Auto-restart', () => {
    it('deve reiniciar processo que falhou', async () => {
      pool = new PythonProcessPool({
        poolSize: 1,
        restartDelay: 50
      });

      await pool.initialize();

      const originalProcess = pool.processes[0];
      const originalId = originalProcess.id;

      // Matar processo
      originalProcess.process.kill();

      // Aguardar restart
      await new Promise(resolve => {
        setTimeout(resolve, 200);
      });

      expect(pool.processes[0].id).to.equal(originalId);
      expect(pool.processes[0].isReady).to.be.true;
      expect(pool.stats.restartCount).to.equal(1);
    });

    it('deve respeitar limite máximo de restarts', async () => {
      pool = new PythonProcessPool({
        poolSize: 1,
        maxRestarts: 2,
        restartDelay: 50
      });

      await pool.initialize();

      const process = pool.processes[0];
      process.restartCount = 2;

      // Matar processo
      process.process.kill();

      // Aguardar (não deve restart)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Processo deve ter saído do pool
      expect(pool.processes.find(p => p.id === process.id)).to.be.undefined;
    });
  });

  describe('Lifecycle Management', () => {
    it('deve limpar pool corretamente', async () => {
      pool = new PythonProcessPool({ poolSize: 2 });
      await pool.initialize();

      expect(pool.processes.length).to.equal(2);

      await pool.cleanup();

      expect(pool.processes.length).to.equal(0);
      expect(pool.available.length).to.equal(0);
      expect(pool.busy.length).to.equal(0);
      expect(pool.requestQueue.length).to.equal(0);
      expect(pool.initialized).to.be.false;
    });

    it('deve emitir evento shutdown ao limpar', (done) => {
      pool = new PythonProcessPool({ poolSize: 1 });

      pool.on('shutdown', async () => {
        expect(pool.initialized).to.be.false;
        done();
      });

      pool.initialize().then(async () => {
        await pool.cleanup();
      });
    });

    it('deve liberar todos os recursos ao limpar', async () => {
      pool = new PythonProcessPool({ poolSize: 2 });
      await pool.initialize();

      const processes = [...pool.processes];

      await pool.cleanup();

      // Todos os processos devem estar mortos
      for (const proc of processes) {
        expect(proc.process.killed).to.be.true;
      }

      expect(pool.healthCheckTimer).to.be.null;
    });
  });

  describe('Performance', () => {
    it('deve ter overhead de spawn < 2s', async () => {
      const startTime = Date.now();

      pool = new PythonProcessPool({ poolSize: 1 });
      await pool.initialize();

      const spawnTime = Date.now() - startTime;
      console.log(`      → Spawn time: ${spawnTime}ms`);

      expect(spawnTime).to.be.lessThan(2000);
    });

    it('deve reusar processos (reuseRate > 0%)', async () => {
      pool = new PythonProcessPool({ poolSize: 1 });
      await pool.initialize();

      // Simular execuções
      pool.stats.totalRequests = 5;
      pool.stats.reuseCount = 5;

      const stats = pool.getStats();
      expect(parseFloat(stats.reuseRate)).to.be.greaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com cleanup duplicado', async () => {
      pool = new PythonProcessPool({ poolSize: 1 });
      await pool.initialize();

      await pool.cleanup();
      await pool.cleanup(); // Não deve falhar
      await pool.cleanup(); // Não deve falhar

      expect(pool.processes.length).to.equal(0);
    });

    it('deve lidar com initialize após cleanup', async () => {
      pool = new PythonProcessPool({ poolSize: 1 });
      await pool.initialize();
      await pool.cleanup();

      // Re-initialize
      pool = new PythonProcessPool({ poolSize: 1 });
      await pool.initialize();

      expect(pool.initialized).to.be.true;
      expect(pool.processes.length).to.equal(1);
    });

    it('deve calcular médias corretamente (média móvel)', () => {
      pool = new PythonProcessPool({ poolSize: 1 });

      // Simular média móvel
      pool._updateAverageWaitTime(100);
      expect(pool.stats.averageWaitTime).to.equal(100);

      pool._updateAverageWaitTime(200);
      expect(pool.stats.averageWaitTime).to.equal(110); // 100*0.9 + 200*0.1

      pool._updateAverageWaitTime(300);
      expect(pool.stats.averageWaitTime).to.equal(129); // 110*0.9 + 300*0.1
    });
  });
});

describe('ProcessPool Stress Tests', () => {
  it('deve suportar múltiplas execuções simultâneas', async function() {
    this.timeout(10000);

    const pool = new PythonProcessPool({ poolSize: 3 });
    await pool.initialize();

    // Executar 10 requisições concorrentes
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        pool._getAvailableProcess().then(proc => {
          // Simular execução rápida
          return new Promise(resolve => {
            setTimeout(() => {
              pool.available.push(proc);
              pool.busy = pool.busy.filter(p => p.id !== proc.id);
              pool._processQueue();
              resolve(proc.id);
            }, 50);
          });
        })
      );
    }

    const results = await Promise.all(promises);

    expect(results.length).to.equal(10);
    expect(pool.stats.totalRequests).to.equal(10);

    await pool.cleanup();
  });

  it('deve manter consistência sob carga', async function() {
    this.timeout(10000);

    const pool = new PythonProcessPool({ poolSize: 2 });
    await pool.initialize();

    // Simular carga: 20 requisições
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(
        pool._getAvailableProcess()
          .then(proc => {
            pool.available = pool.available.filter(p => p.id !== proc.id);
            pool.busy.push(proc);

            return new Promise(resolve => {
              setTimeout(() => {
                pool.busy = pool.busy.filter(p => p.id !== proc.id);
                pool.available.push(proc);
                pool._processQueue();
                resolve();
              }, Math.random() * 30);
            });
          })
      );
    }

    await Promise.all(promises);

    // Verificar consistência
    expect(pool.available.length + pool.busy.length).to.equal(2);
    expect(pool.requestQueue.length).to.equal(0);

    await pool.cleanup();
  });
});
