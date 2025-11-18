/**
 * @fileoverview Testes unitários para IPCBatcher
 * @module test/unit/test-ipc-batcher
 */

import { describe, it, before, after, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import IPCBatcher from '../../core/ipc-batcher.cjs';

describe('FASE 7.5 - IPC Batcher', () => {
  let mockBridge;
  let batcher;

  // Mock Python Bridge
  beforeEach(() => {
    mockBridge = {
      executeBatch: async (payload) => {
        // Simular execução de batch
        const requests = payload.requests || [];
        const results = requests.map(req => ({
          id: req.id,
          success: true,
          result: { output: `Result for ${req.skill}` }
        }));

        return { type: 'batch_response', results };
      }
    };
  });

  afterEach(async () => {
    if (batcher) {
      await batcher.cleanup();
    }
  });

  describe('Inicialização', () => {
    it('deve criar batcher com configurações padrão', () => {
      batcher = new IPCBatcher(mockBridge);

      expect(batcher.pythonBridge).to.equal(mockBridge);
      expect(batcher.options.maxBatchSize).to.equal(10);
      expect(batcher.options.maxWaitTime).to.equal(50);
      expect(batcher.options.compression).to.be.true;
    });

    it('deve aceitar configurações customizadas', () => {
      batcher = new IPCBatcher(mockBridge, {
        maxBatchSize: 5,
        maxWaitTime: 100,
        compression: false,
        compressionThreshold: 5000
      });

      expect(batcher.options.maxBatchSize).to.equal(5);
      expect(batcher.options.maxWaitTime).to.equal(100);
      expect(batcher.options.compression).to.be.false;
      expect(batcher.options.compressionThreshold).to.equal(5000);
    });

    it('deve inicializar estatísticas em zero', () => {
      batcher = new IPCBatcher(mockBridge);
      const stats = batcher.getStats();

      expect(stats.totalBatchesSent).to.equal(0);
      expect(stats.totalRequests).to.equal(0);
      expect(stats.batchedRequests).to.equal(0);
      expect(stats.averageBatchSize).to.equal(0);
      expect(stats.averageLatency).to.equal(0);
    });
  });

  describe('Batching Básico', () => {
    it('deve agrupar múltiplas requisições em um batch', async () => {
      batcher = new IPCBatcher(mockBridge, {
        maxBatchSize: 3,
        maxWaitTime: 100
      });

      // Executar 3 requisições simultaneamente
      const promise1 = batcher.execute('skill1', { param: 'value1' });
      const promise2 = batcher.execute('skill2', { param: 'value2' });
      const promise3 = batcher.execute('skill3', { param: 'value3' });

      await new Promise(resolve => setTimeout(resolve, 150));

      const results = await Promise.all([promise1, promise2, promise3]);

      expect(results.length).to.equal(3);
      expect(results[0].success).to.be.true;
      expect(results[1].success).to.be.true;
      expect(results[2].success).to.be.true;

      // Verificar stats
      const stats = batcher.getStats();
      expect(stats.totalBatchesSent).to.equal(1);
      expect(stats.batchedRequests).to.equal(3);
    });

    it('deve acionar flush quando atingir maxBatchSize', async () => {
      let batchCallCount = 0;
      mockBridge.executeBatch = async () => {
        batchCallCount++;
        return {
          type: 'batch_response',
          results: []
        };
      };

      batcher = new IPCBatcher(mockBridge, {
        maxBatchSize: 2
      });

      // Enviar 3 requisições (deve criar 2 batches: 2 + 1)
      batcher.execute('skill1', { param: 'value1' });
      batcher.execute('skill2', { param: 'value2' });

      // Wait um pouco para processar
      await new Promise(resolve => setTimeout(resolve, 100));

      // Aguardar última requisição estar pendente
      expect(batcher.pendingRequests.length).to.equal(1);
    });

    it('deve respeitar maxWaitTime', async () => {
      let batchCallCount = 0;
      mockBridge.executeBatch = async () => {
        batchCallCount++;
        return {
          type: 'batch_response',
          results: [{ id: `req_${batchCallCount}`, success: true, result: {} }]
        };
      };

      batcher = new IPCBatcher(mockBridge, {
        maxBatchSize: 10,
        maxWaitTime: 50
      });

      batcher.execute('skill1', { param: 'value1' });

      await new Promise(resolve => setTimeout(resolve, 60));

      expect(batcher.pendingRequests.length).to.equal(0);
    });
  });

  describe('Request Management', () => {
    it('deve gerar IDs únicos para cada requisição', () => {
      batcher = new IPCBatcher(mockBridge);

      const req1 = batcher.execute('skill1', {});
      const req2 = batcher.execute('skill2', {});
      const req3 = batcher.execute('skill3', {});

      expect(batcher.pendingRequests.length).to.equal(3);

      const ids = batcher.pendingRequests.map(req => req.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).to.equal(3);
    });

    it('deve timeout de requisições corretamente', async () => {
      mockBridge.executeBatch = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return { type: 'batch_response', results: [] };
      };

      batcher = new IPCBatcher(mockBridge);

      try {
        await batcher.execute('skill1', {}, 50);
        expect.fail('Deveria ter lançado timeout error');
      } catch (error) {
        expect(error.message).to.include('timeout');
      }
    });
  });

  describe('Métricas', () => {
    beforeEach(() => {
      batcher = new IPCBatcher(mockBridge, {
        maxBatchSize: 5,
        maxWaitTime: 100
      });
    });

    it('deve calcular média de batch size corretamente', async () => {
      await batcher.execute('skill1', {});
      await batcher.execute('skill2', {});
      await batcher.execute('skill3', {});

      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = batcher.getStats();
      expect(stats.averageBatchSize).to.be.greaterThan(0);
      expect(stats.totalBatchesSent).to.equal(1);
      expect(stats.batchedRequests).to.equal(3);
    });

    it('deve calcular eficiência do batching', async () => {
      batcher.execute('skill1', {});
      await batcher.execute('skill2', {});

      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = batcher.getStats();
      expect(stats.totalRequests).to.equal(2);
      expect(stats.batchingEfficiency).to.equal(100); // Todas foram batchadas
    });

    it('deve rastrear requisições pendentes', async () => {
      const promise1 = batcher.execute('skill1', {});
      const promise2 = batcher.execute('skill2', {});

      expect(batcher.pendingRequests.length).to.equal(2);

      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = batcher.getStats();
      expect(stats.pendingRequests).to.equal(0);
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com batch vazio no flush', async () => {
      batcher = new IPCBatcher(mockBridge);

      expect(() => {
        batcher._flushBatch();
      }).to.not.throw();
    });

    it('deve limpar timer corretamente', () => {
      batcher = new IPCBatcher(mockBridge);

      batcher._startFlushTimer();
      expect(batcher.flushTimer).to.not.be.null;

      batcher._clearTimer();
      expect(batcher.flushTimer).to.be.null;
    });

    it('deve handle resposta de batch inválida', async () => {
      mockBridge.executeBatch = async () => {
        return { type: 'invalid_response' };
      };

      batcher = new IPCBatcher(mockBridge);

      try {
        await batcher.execute('skill1', {});
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        expect(error.message).to.include('Batch execution failed');
      }
    });

    it('deve handle requisições fora de ordem', async () => {
      const results = [];
      mockBridge.executeBatch = async (payload) => {
        const ids = payload.requests.map(req => req.id);
        results.push(ids);

        return {
          type: 'batch_response',
          results: payload.requests.map(req => ({
            id: req.id,
            success: true,
            result: {}
          }))
        };
      };

      batcher = new IPCBatcher(mockBridge);

      const promises = [
        batcher.execute('skill1', {}),
        batcher.execute('skill2', {}),
        batcher.execute('skill3', {})
      ];

      await Promise.all(promises);

      expect(results.length).to.be.greaterThan(0);
      expect(results[0].length).to.equal(3);
    });
  });

  describe('Modo Singleton', () => {
    it('deve processar requisição individual se apenas uma no batch', async () => {
      let batchSize = 0;
      mockBridge.executeBatch = async (payload) => {
        batchSize = payload.requests.length;
        return {
          type: 'batch_response',
          results: [{
            id: payload.requests[0].id,
            success: true,
            result: { single: true }
          }]
        };
      };

      batcher = new IPCBatcher(mockBridge);

      await batcher.execute('skill1', { param: 'value' });
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(batchSize).to.equal(1);

      const stats = batcher.getStats();
      expect(stats.totalBatchesSent).to.equal(1);
      expect(stats.batchedRequests).to.equal(1);
    });
  });

  describe('Flush Manual', () => {
    it('deve suportar flush manual', async () => {
      batcher = new IPCBatcher(mockBridge, {
        maxWaitTime: 10000 // Longo para não disparar automaticamente
      });

      batcher.execute('skill1', {});
      batcher.execute('skill2', {});

      expect(batcher.pendingRequests.length).to.equal(2);

      await batcher.flush();

      expect(batcher.pendingRequests.length).to.equal(0);

      const stats = batcher.getStats();
      expect(stats.totalBatchesSent).to.equal(1);
    });

    it('deve não falhar flush com queue vazia', async () => {
      batcher = new IPCBatcher(mockBridge);

      expect(batcher.pendingRequests.length).to.equal(0);
      await batcher.flush();

      expect(batcher.pendingRequests.length).to.equal(0);
    });
  });

  describe('Cleanup', () => {
    it('deve limpar requisições pendentes no cleanup', async () => {
      batcher = new IPCBatcher(mockBridge);

      batcher.execute('skill1', {});
      batcher.execute('skill2', {});

      expect(batcher.pendingRequests.length).to.equal(2);

      await batcher.cleanup();

      expect(batcher.pendingRequests.length).to.equal(0);
      expect(batcher.flushTimer).to.be.null;
    });

    it('deve limpar timer no cleanup', async () => {
      batcher = new IPCBatcher(mockBridge);

      batcher._startFlushTimer();
      expect(batcher.flushTimer).to.not.be.null;

      await batcher.cleanup();
      expect(batcher.flushTimer).to.be.null;
    });
  });
});

describe('IPCBatcher Stress Tests', () => {
  it('deve handle 100 requisições rápidas', async function() {
    this.timeout(5000);

    const mockBridge = {
      executeBatch: async (payload) => {
        return {
          type: 'batch_response',
          results: payload.requests.map(req => ({
            id: req.id,
            success: true,
            result: { data: 'result' }
          }))
        };
      }
    };

    const batcher = new IPCBatcher(mockBridge, {
      maxBatchSize: 20,
      maxWaitTime: 100
    });

    // Enviar 100 requisições simultâneas
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(batcher.execute(`skill${i}`, { id: i }));
    }

    const results = await Promise.all(promises);

    expect(results.length).to.equal(100);
    expect(results.every(r => r.success)).to.be.true;

    const stats = batcher.getStats();
    expect(stats.totalRequests).to.equal(100);
    expect(stats.batchedRequests).to.equal(100);
    expect(stats.totalBatchesSent).to.be.greaterThan(1);

    await batcher.cleanup();
  });

  it('deve manter eficiência sob carga variável', async function() {
    this.timeout(3000);

    let totalBatchSize = 0;
    const mockBridge = {
      executeBatch: async (payload) => {
        totalBatchSize += payload.requests.length;
        return {
          type: 'batch_response',
          results: payload.requests.map(req => ({
            id: req.id,
            success: true,
            result: {}
          }))
        };
      }
    };

    const batcher = new IPCBatcher(mockBridge, {
      maxBatchSize: 10,
      maxWaitTime: 50
    });

    // Onda 1: 5 requisições rápidas (devem ir em 1 batch)
    const wave1 = Array(5).fill(null).map((_, i) =>
      batcher.execute(`skill${i}`, {})
    );

    // Onda 2: após delay, 8 requisições (provavelmente 1 batch)
    await Promise.all(wave1);
    await new Promise(resolve => setTimeout(resolve, 100));

    const wave2 = Array(8).fill(null).map((_, i) =>
      batcher.execute(`skill${i + 5}`, {})
    );

    await Promise.all(wave2);

    // Verificar eficiência
    const stats = batcher.getStats();
    expect(stats.batchingEfficiency).to.be.greaterThan(80); // > 80% foram batchadas

    await batcher.cleanup();
  });
});
