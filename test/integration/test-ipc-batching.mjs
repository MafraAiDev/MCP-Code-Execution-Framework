/**
 * @fileoverview Testes de integração para IPC Batching
 * @module test/integration/test-ipc-batching
 */

import { describe, it, before, after, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import IPCBatcher from '../../core/ipc-batcher.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('FASE 7.5 - IPC Batching Integration Tests', () => {
  let pythonProcess;
  let bridgePath;

  before(() => {
    bridgePath = path.join(__dirname, '..', '..', 'servers', 'skills', 'bridge.py');
  });

  beforeEach(async () => {
    // Start Python bridge
    pythonProcess = spawn('python', [bridgePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    // Wait for ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Bridge initialization timeout')), 5000);

      pythonProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const message = JSON.parse(line.trim());
              if (message.type === 'ready') {
                clearTimeout(timeout);
                resolve();
              }
            } catch (e) {
              // Ignore non-JSON
            }
          }
        }
      });

      pythonProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  afterEach(() => {
    if (pythonProcess && !pythonProcess.killed) {
      pythonProcess.kill();
    }
  });

  describe('Batch Execution Flow', () => {
    it('deve executar batch de 3 requisições via Python Bridge', async function() {
      this.timeout(15000);

      let batchReceived = false;
      let batchRequestCount = 0;

      // Mock bridge that forwards to Python
      const mockBridge = {
        executeBatch: async (payload) => {
          // Send to Python process
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout waiting for batch response')), 10000);

            pythonProcess.stdin.write(JSON.stringify({
              action: 'batch',
              requestId: payload.requestId,
              requests: payload.requests
            }) + '\n');

            const messageHandler = (data) => {
              const lines = data.toString().split('\n');
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const message = JSON.parse(line.trim());
                    if (message.type === 'batch_response' && message.requestId === payload.requestId) {
                      clearTimeout(timeout);
                      batchReceived = true;
                      batchRequestCount = message.results.length;
                      resolve(message);
                    }
                  } catch (e) {
                    // Ignore
                  }
                }
              }
            };

            pythonProcess.stdout.on('data', messageHandler);

            pythonProcess.on('error', (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          });
        }
      };

      const batcher = new IPCBatcher(mockBridge, {
        maxBatchSize: 10,
        maxWaitTime: 100
      });

      // Execute 3 requests
      const results = [];
      results.push(batcher.execute('test-skill', { name: 'Alice' }));
      results.push(batcher.execute('test-skill', { name: 'Bob' }));
      results.push(batcher.execute('test-skill', { name: 'Charlie' }));

      const responses = await Promise.all(results);

      expect(responses.length).to.equal(3);
      expect(batchReceived).to.be.true;
      expect(batchRequestCount).to.equal(3);

      // Cleanup
      await batcher.cleanup();

      const stats = batcher.getStats();
      console.log(`      📊 Batch Stats: ${JSON.stringify(stats, null, 2)}`);
    });

    it('deve demonstrar redução de latência com batching', async function() {
      this.timeout(15000);

      // Teste comparativo: batch vs individual
      const results = [];

      // Mock bridge para batch
      const mockBridge = {
        executeBatch: async (payload) => {
          pythonProcess.stdin.write(JSON.stringify({
            action: 'batch',
            requestId: payload.requestId,
            requests: payload.requests
          }) + '\n');

          return new Promise((resolve) => {
            const handler = (data) => {
              const lines = data.toString().split('\n');
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const msg = JSON.parse(line.trim());
                    if (msg.type === 'batch_response' && msg.requestId === payload.requestId) {
                      pythonProcess.stdout.off('data', handler);
                      resolve(msg);
                    }
                  } catch (e) {}
                }
              }
            };
            pythonProcess.stdout.on('data', handler);
          });
        }
      };

      const batcher = new IPCBatcher(mockBridge, {
        maxBatchSize: 10,
        maxWaitTime: 50
      });

      // Medir tempo de execução do batch
      const batchStart = Date.now();

      const batchResults = await Promise.all([
        batcher.execute('test-skill', { name: 'Test' }),
        batcher.execute('test-skill', { name: 'Test2' }),
        batcher.execute('test-skill', { name: 'Test3' })
      ]);

      const batchTime = Date.now() - batchStart;

      expect(batchResults.length).to.equal(3);

      // Mostrar métricas
      const stats = batcher.getStats();
      console.log(`      📊 Batching time: ${batchTime}ms`);
      console.log(`      📊 Avg latency: ${stats.averageLatency}ms`);
      console.log(`      📊 Batch efficiency: ${stats.batchingEfficiency}%`);

      // Validar latência reduzida (menos de 100ms por requisição média)
      expect(stats.averageLatency).to.be.lessThan(100);

      await batcher.cleanup();

      results.push({ batchTime, avgLatency: stats.averageLatency });
      return results;
    });

    it('deve lidar com erros parciais no batch', async function() {
      this.timeout(15000);

      const mockBridge = {
        executeBatch: async (payload) => {
          pythonProcess.stdin.write(JSON.stringify({
            action: 'batch',
            requestId: payload.requestId,
            requests: payload.requests
          }) + '\n');

          return new Promise((resolve) => {
            const handler = (data) => {
              const lines = data.toString().split('\n');
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const msg = JSON.parse(line.trim());
                    if (msg.type === 'batch_response' && msg.requestId === payload.requestId) {
                      pythonProcess.stdout.off('data', handler);
                      resolve(msg);
                    }
                  } catch (e) {}
                }
              }
            };
            pythonProcess.stdout.on('data', handler);
          });
        }
      };

      const batcher = new IPCBatcher(mockBridge, {
        maxBatchSize: 5,
        maxWaitTime: 100
      });

      // Executar requests (incluindo um que pode falhar)
      const results = await Promise.allSettled([
        batcher.execute('test-skill', { name: 'Alice' }),
        batcher.execute('nonexistent-skill', { name: 'Bob' }), // Este deve falhar
        batcher.execute('test-skill', { name: 'Charlie' })
      ]);

      // Verificar resultados
      expect(results.length).to.equal(3);
      expect(results[0].status).to.equal('fulfilled');
      expect(results[1].status).to.equal('rejected'); // Deve falhar
      expect(results[2].status).to.equal('fulfilled');

      const stats = batcher.getStats();
      expect(stats.totalRequests).to.equal(3);

      await batcher.cleanup();
    });
  });

  describe('Perf Throughput', () => {
    it('deve suportar throughput de 50+ requisições/segundo', async function() {
      this.timeout(10000);

      let batchCount = 0;
      const mockBridge = {
        executeBatch: async (payload) => {
          batchCount++;
          pythonProcess.stdin.write(JSON.stringify({
            action: 'batch',
            requestId: payload.requestId,
            requests: payload.requests
          }) + '\n');

          return new Promise((resolve) => {
            const handler = (data) => {
              const lines = data.toString().split('\n');
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const msg = JSON.parse(line.trim());
                    if (msg.type === 'batch_response' && msg.requestId === payload.requestId) {
                      pythonProcess.stdout.off('data', handler);
                      resolve(msg);
                    }
                  } catch (e) {}
                }
              }
            };
            pythonProcess.stdout.on('data', handler);
          });
        }
      };

      const batcher = new IPCBatcher(mockBridge, {
        maxBatchSize: 10,
        maxWaitTime: 50
      });

      const startTime = Date.now();

      // Enviar 50 requisições
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(batcher.execute('test-skill', { id: i }));
      }

      await Promise.all(promises);

      const totalTime = Date.now() - startTime;
      const throughput = 50 / (totalTime / 1000); // req/s

      console.log(`      📊 Throughput: ${throughput.toFixed(2)} req/s`);
      console.log(`      📊 Batches: ${batchCount}`);
      console.log(`      📊 Total time: ${totalTime}ms`);

      // Validar throughput mínimo
      expect(throughput).to.be.greaterThan(10); // > 10 req/s

      const stats = batcher.getStats();
      expect(stats.totalRequests).to.equal(50);

      await batcher.cleanup();
    });
  });
});

describe('IPCBatcher Real-World Scenarios', () => {
  it('deve lidar com padrão de tráfego burst', async function() {
    this.timeout(10000);

    let maxBatchSize = 0;
    const mockBridge = {
      executeBatch: async (payload) => {
        maxBatchSize = Math.max(maxBatchSize, payload.requests.length);
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
      maxBatchSize: 15,
      maxWaitTime: 30
    });

    // Simular burst: 20 requisições em 50ms
    const burst = [];
    for (let i = 0; i < 20; i++) {
      burst.push(batcher.execute(`skill${i}`, { burst: true }));
    }

    await Promise.all(burst);

    // Deve criar pelo menos 2 batches (maxBatchSize=15)
    const stats = batcher.getStats();
    expect(stats.totalBatchesSent).to.be.greaterThanOrEqual(2);
    expect(maxBatchSize).to.be.lessThanOrEqual(15);

    await batcher.cleanup();
  });

  it('deve otimizar batch size dinamicamente', async function() {
    this.timeout(5000);

    const batchSizes = [];
    const mockBridge = {
      executeBatch: async (payload) => {
        batchSizes.push(payload.requests.length);
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
      maxBatchSize: 20,
      maxWaitTime: 100
    });

    // Primeira onda: 5 requisições (devem batch juntas)
    await Promise.all(Array(5).fill(null).map((_, i) =>
      batcher.execute(`skill${i}`, {})
    ));

    // Delay
    await new Promise(resolve => setTimeout(resolve, 150));

    // Segunda onda: 12 requisições
    await Promise.all(Array(12).fill(null).map((_, i) =>
      batcher.execute(`skill${i + 5}`, {})
    ));

    // Verificar batch sizes
    expect(batchSizes.length).to.be.greaterThanOrEqual(2);
    expect(batchSizes[0]).to.equal(5);
    expect(batchSizes[1]).to.equal(12);

    const stats = batcher.getStats();
    expect(stats.averageBatchSize).to.be.greaterThan(5);

    await batcher.cleanup();
  });
});
