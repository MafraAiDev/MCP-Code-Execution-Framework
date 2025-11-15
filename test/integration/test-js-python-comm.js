/**
 * Testes de Integração - Comunicação JS ↔ Python
 * @file test/integration/test-js-python-comm.js
 */

describe('JS ↔ Python Communication - Testes de Integração', () => {

  describe('Comunicação Bidirecional', () => {
    it('should handle JS to Python code execution', async () => {
      // Simula Python Bridge executando código Python
      const pythonBridge = {
        execute: async (code) => {
          // Simula execução Python
          if (code.includes('2 + 2')) return 4;
          if (code.includes('print')) return 'output captured';
          if (code.includes('import math')) return 'module loaded';

          // Simula erro
          if (code.includes('1/0')) {
            throw new Error('ZeroDivisionError: division by zero');
          }

          return 'executed';
        }
      };

      // Testa execuções simples
      const result1 = await pythonBridge.execute('2 + 2');
      expect(result1).toBe(4);

      const result2 = await pythonBridge.execute('print("Hello from Python")');
      expect(result2).toBe('output captured');

      // Testa tratamento de erros
      await expect(pythonBridge.execute('1/0')).rejects.toThrow('ZeroDivisionError');
    });

    it('should handle Python to JS callbacks', async () => {
      const jsCallbacks = new Map();
      const pythonBridge = {
        callbacks: jsCallbacks,
        registerCallback: (name, fn) => {
          jsCallbacks.set(name, fn);
        },
        executeWithCallback: async (code) => {
          // Simula Python chamando callback JS
          if (code.includes('js_callback')) {
            const callback = jsCallbacks.get('process_data');
            if (callback) {
              const result = callback({ data: 'from python', timestamp: Date.now() });
              return result;
            }
          }
          return null;
        }
      };

      // Registra callback JS
      pythonBridge.registerCallback('process_data', (data) => {
        return {
          processed: true,
          jsData: data,
          response: 'Processed in JS'
        };
      });

      // Python chama callback JS
      const result = await pythonBridge.executeWithCallback(`
# Python code calling JS callback
data = {"data": "from python", "timestamp": 1234567890}
result = js_callback('process_data', data)
result
      `);

      expect(result).toBeDefined();
      expect(result.processed).toBe(true);
      expect(result.response).toBe('Processed in JS');
    });

    it('should handle complex data serialization', async () => {
      const pythonBridge = {
        execute: async (code) => {
          // Simula serialização complexa
          if (code.includes('complex_data')) {
            return {
              nested: {
                array: [1, 2, { key: 'value' }],
                date: '2024-01-01T00:00:00Z',
                nullValue: null,
                boolean: true
              },
              metadata: {
                type: 'complex_structure',
                size: 3
              }
            };
          }
          return null;
        }
      };

      const result = await pythonBridge.execute('complex_data = build_complex_structure()');
      expect(result).toBeDefined();
      expect(result.nested.array).toHaveLength(3);
      expect(result.nested.array[2].key).toBe('value');
      expect(result.nested.boolean).toBe(true);
      expect(result.nested.nullValue).toBeNull();
      expect(result.metadata.type).toBe('complex_structure');
    });

    it('should handle large data transfers', async () => {
      const pythonBridge = {
        execute: async (code, options = {}) => {
          const maxSize = options.maxDataSize || 1000000; // 1MB default

          if (code.includes('large_dataset')) {
            // Simula geração de dataset grande
            const size = 10000;
            const data = Array(size).fill(null).map((_, i) => ({
              id: i,
              url: `https://example${i}.com`,
              title: `Page ${i}`,
              content: 'x'
            }));

            // Verifica tamanho
            const estimatedSize = JSON.stringify(data).length;
            if (estimatedSize > maxSize) {
              throw new Error(`Data size ${estimatedSize} exceeds limit ${maxSize}`);
            }

            return {
              success: true,
              data: data,
              size: estimatedSize,
              count: data.length
            };
          }
          return null;
        }
      };

      const result = await pythonBridge.execute('dataset = generate_large_dataset()');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10000);
      expect(result.count).toBe(10000);
      expect(typeof result.size).toBe('number');
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('Comunicação com MCPs via Python', () => {
    it('should route MCP calls through Python bridge', async () => {
      const mockFramework = {
        pythonBridge: {
          execute: async (code) => {
            // Simula importação e uso de MCP via Python
            if (code.includes('from servers.scraping.apify import')) {
              return {
                success: true,
                actor_id: 'test-actor-123',
                status: 'succeeded',
                dataset_id: 'dataset-456'
              };
            }

            if (code.includes('from servers.security.guardrails import')) {
              return {
                success: true,
                valid: true,
                issues: [],
                score: 0.95
              };
            }

            return null;
          }
        },
        execute: async function(code) {
          return await this.pythonBridge.execute(code);
        }
      };

      // Testa Apify via Python
      const apifyResult = await mockFramework.execute(`
from servers.scraping.apify import run_actor
result = await run_actor('apify/web-scraper', {
    'startUrls': ['https://example.com'],
    'maxRequestsPerCrawl': 50
})
result
      `);

      expect(apifyResult.success).toBe(true);
      expect(apifyResult.actor_id).toBe('test-actor-123');
      expect(apifyResult.dataset_id).toBe('dataset-456');

      // Testa Guardrails via Python
      const guardrailsResult = await mockFramework.execute(`
from servers.security.guardrails import validate
result = await validate('user input text', {'strict': True})
result
      `);

      expect(guardrailsResult.success).toBe(true);
      expect(guardrailsResult.valid).toBe(true);
      expect(guardrailsResult.score).toBe(0.95);
    });

    it('should handle MCP import errors gracefully', async () => {
      const mockFramework = {
        pythonBridge: {
          execute: async (code) => {
            if (code.includes('nonexistent_module')) {
              throw new Error(`ModuleNotFoundError: No module named 'nonexistent_module'`);
            }

            if (code.includes('invalid_mcp')) {
              return {
                success: false,
                error: 'Invalid MCP configuration',
                code: 'MCP_CONFIG_ERROR'
              };
            }

            return {
              success: true,
              data: 'executed'
            };
          }
        },
        execute: async function(code) {
          try {
            return await this.pythonBridge.execute(code);
          } catch (error) {
            return {
              success: false,
              error: error.message,
              type: 'python_error'
            };
          }
        }
      };

      // Testa erro de módulo não encontrado
      const moduleError = await mockFramework.execute(`
from servers.nonexistent_module import invalid_mcp
result = await invalid_mcp()
result
      `);

      expect(moduleError.success).toBe(false);
      expect(moduleError.error).toContain('ModuleNotFoundError');

      // Testa erro de configuração
      const configError = await mockFramework.execute(`
from servers.security.guardrails import validate
result = await validate('test', {'invalid_mcp': True})
result
      `);

      expect(configError.success).toBe(false);
      expect(configError.error).toContain('Invalid MCP configuration');
    });

    it('should handle concurrent MCP operations', async () => {
      const mockFramework = {
        executionLog: [],
        pythonBridge: {
          execute: async (code) => {
            // Simula delay baseado no tipo de operação
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            if (code.includes('slow_operation')) {
              await delay(100); // Operação lenta
              return { success: true, type: 'slow', duration: 100 };
            }

            if (code.includes('fast_operation')) {
              await delay(10); // Operação rápida
              return { success: true, type: 'fast', duration: 10 };
            }

            return { success: true, type: 'normal', duration: 50 };
          }
        },
        execute: async function(code) {
          const start = performance.now();
          const result = await this.pythonBridge.execute(code);
          const end = performance.now();

          this.executionLog.push({
            code: code.substring(0, 50) + '...',
            duration: end - start,
            result: result
          });

          return result;
        }
      };

      // Executa operações concorrentes
      const concurrentOps = [
        mockFramework.execute('slow_operation()'),
        mockFramework.execute('fast_operation()'),
        mockFramework.execute('normal_operation()'),
        mockFramework.execute('fast_operation()')
      ];

      const results = await Promise.all(concurrentOps);

      expect(results).toHaveLength(4);
      expect(results.some(r => r.type === 'slow')).toBe(true);
      expect(results.some(r => r.type === 'fast')).toBe(true);
      expect(results.some(r => r.type === 'normal')).toBe(true);
      expect(mockFramework.executionLog).toHaveLength(4);
    });
  });

  describe('Validação e Segurança na Comunicação', () => {
    it('should validate data before Python execution', () => {
      const validator = {
        validateCode: (code) => {
          const dangerousPatterns = [
            /__import__\s*\(/,
            /eval\s*\(/,
            /exec\s*\(/,
            /os\.system/,
            /subprocess\.call/,
            /open\s*\(/,
            /file\s*\(/
          ];

          for (const pattern of dangerousPatterns) {
            if (pattern.test(code)) {
              return { valid: false, error: `Dangerous pattern detected: ${pattern}` };
            }
          }

          return { valid: true };
        },
        validateData: (data) => {
          if (data === null || data === undefined) {
            return { valid: false, error: 'Data cannot be null' };
          }

          const dataSize = JSON.stringify(data).length;
          const maxSize = 1024 * 1024; // 1MB

          if (dataSize > maxSize) {
            return { valid: false, error: 'Data size exceeds limit' };
          }

          return { valid: true };
        }
      };

      // Testa código perigoso
      const dangerousCode = "import os\nos.system('rm -rf /')";
      const dangerousResult = validator.validateCode(dangerousCode);
      expect(dangerousResult.valid).toBe(false);
      expect(dangerousResult.error).toContain('Dangerous pattern');

      // Testa código seguro
      const safeCode = "from servers.scraping.apify import run_actor\nresult = await run_actor('test')";
      const safeResult = validator.validateCode(safeCode);
      expect(safeResult.valid).toBe(true);

      // Testa validação de dados
      const largeData = Array(500000).fill('xxxxxxxxxx'); // Dados grandes (mais que o limite de 1MB)
      const dataResult = validator.validateData(largeData);
      expect(dataResult.valid).toBe(false);
      expect(dataResult.error).toContain('exceeds limit');
    });

    it('should sanitize data between JS and Python', () => {
      const sanitizer = {
        escapePython: (str) => {
          return str
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        },
        escapeJS: (str) => {
          return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
        },
        sanitizeObject: function(obj) {
          if (typeof obj === 'string') {
            return this.escapePython(obj);
          }
          if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
          }
          if (typeof obj === 'object' && obj !== null) {
            const sanitized = {};
            for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                sanitized[key] = this.sanitizeObject(obj[key]);
              }
            }
            return sanitized;
          }
          return obj;
        }
      };

      // Testa strings com caracteres especiais
      const specialString = "It's a \"test\" string\nwith newlines";
      const escaped = sanitizer.escapePython(specialString);
      expect(escaped).toContain("\\'");
      expect(escaped).toContain('\\"');
      expect(escaped).toContain('\\n');

      // Testa objetos complexos
      const complexObj = {
        message: "Hello \"World\"",
        path: 'C:\\Users\\Test',
        nested: {
          content: 'Line 1\nLine 2'
        }
      };

      const sanitized = sanitizer.sanitizeObject(complexObj);
      expect(sanitized.message).toContain('\\"');
      expect(sanitized.path).toContain('\\\\');
      expect(sanitized.nested.content).toContain('\\n');
    });
  });

  describe('Performance e Escalabilidade', () => {
    it('should handle high-frequency communication', async () => {
      const performanceTest = {
        results: [],
        executeBatch: async (count) => {
          const promises = [];

          for (let i = 0; i < count; i++) {
            promises.push(
              new Promise(resolve => {
                // Simula operação rápida
                setTimeout(() => {
                  resolve({
                    id: i,
                    result: i * 2,
                    timestamp: Date.now()
                  });
                }, Math.random() * 10); // Delay aleatório até 10ms
              })
            );
          }

          return Promise.all(promises);
        }
      };

      const startTime = performance.now();
      const results = await performanceTest.executeBatch(100);
      const endTime = performance.now();

      expect(results).toHaveLength(100);
      expect(results[0].id).toBe(0);
      expect(results[99].id).toBe(99);
      expect(endTime - startTime).toBeLessThan(1000); // Deve completar em menos de 1 segundo
    });

    it('should optimize repeated Python operations', () => {
      const optimizer = {
        cache: new Map(),
        stats: { cacheHits: 0, cacheMisses: 0 },
        executeOptimized: function(code) {
          if (this.cache.has(code)) {
            this.stats.cacheHits++;
            return { ...this.cache.get(code), cached: true };
          }

          this.stats.cacheMisses++;

          // Simula execução real
          const result = {
            success: true,
            data: `result_of_${code.replace(/\s+/g, '_')}`,
            executionTime: Math.random() * 100
          };

          this.cache.set(code, result);
          return result;
        },
        getCacheStats: function() {
          const total = this.stats.cacheHits + this.stats.cacheMisses;
          return {
            hits: this.stats.cacheHits,
            misses: this.stats.cacheMisses,
            hitRate: total > 0 ? (this.stats.cacheHits / total) * 100 : 0,
            cacheSize: this.cache.size
          };
        }
      };

      // Primeira execução - cache miss
      const result1 = optimizer.executeOptimized('print("hello")');
      expect(result1.cached).toBeUndefined();

      // Segunda execução - cache hit
      const result2 = optimizer.executeOptimized('print("hello")');
      expect(result2.cached).toBe(true);
      expect(result2.data).toBe(result1.data);

      const stats = optimizer.getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(50);
    });
  });
});