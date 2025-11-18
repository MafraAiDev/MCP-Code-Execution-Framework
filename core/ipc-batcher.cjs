/**
 * @fileoverview IPC Batcher - Agrupa múltiplas requisições Python em batches
 * @module core/ipc-batcher
 * @description Implementa batching de requisições para reduzir latência de IPC
 * @author Claude AI
 * @version 1.0.0
 * @requires events
 */

const { EventEmitter } = require('events');

/**
 * Agrupa múltiplas requisições Python em batches para reduzir overhead de IPC
 * @class IPCBatcher
 * @extends EventEmitter
 * @description Batcher automático que agrupa requisições baseado em tempo ou tamanho
 * @example
 * const batcher = new IPCBatcher(pythonBridge, {
 *   maxBatchSize: 10,
 *   maxWaitTime: 50
 * });
 * const result = await batcher.execute('skill-name', params);
 */
class IPCBatcher extends EventEmitter {
  /**
   * Cria uma nova instância do IPCBatcher
   * @param {Object} pythonBridge - Instância do PythonBridge para comunicação
   * @param {Object} [options={}] - Opções de configuração
   * @param {number} [options.maxBatchSize=10] - Máximo de requisições por batch
   * @param {number} [options.maxWaitTime=50] - Tempo máximo de espera em ms
   * @param {boolean} [options.compression=true] - Habilitar compressão para payloads > 10KB
   * @param {number} [options.compressionThreshold=10240] - Limite para compressão (bytes)
   */
  constructor(pythonBridge, options = {}) {
    super();

    this.pythonBridge = pythonBridge;
    this.options = {
      maxBatchSize: options.maxBatchSize || 10,
      maxWaitTime: options.maxWaitTime || 50,
      compression: options.compression !== false,
      compressionThreshold: options.compressionThreshold || 10240,
      ...options
    };

    // Queue de requisições pendentes
    this.pendingRequests = [];
    this.requestId = 0;

    // Timer para flush automático
    this.flushTimer = null;

    // Métricas
    this.stats = {
      totalBatchesSent: 0,
      totalRequests: 0,
      batchedRequests: 0,
      averageBatchSize: 0,
      totalBytesSaved: 0,
      compressionSavings: 0,
      averageLatency: 0,
      batchingEfficiency: 0
    };
  }

  /**
   * Executa uma skill através do batcher
   * @async
   * @param {string} skillName - Nome da skill
   * @param {Object} params - Parâmetros da execução
   * @param {number} [timeout=30000] - Timeout em ms
   * @returns {Promise<Object>} Resultado da execução
   */
  async execute(skillName, params, timeout = 30000) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    return new Promise((resolve, reject) => {
      // Criar requisição
      const request = {
        id: `req_${Date.now()}_${this.requestId++}`,
        skillName,
        params,
        timeout: Math.ceil(timeout / 1000), // Converter para segundos
        resolve,
        reject,
        timestamp: startTime
      };

      // Adicionar à queue
      this.pendingRequests.push(request);

      // Atualizar stats
      this._updateBatchingEfficiency();

      // Iniciar timer se não estiver rodando
      if (!this.flushTimer) {
        this._startFlushTimer();
      }

      // Flush imediatamente se atingir max batch size
      if (this.pendingRequests.length >= this.options.maxBatchSize) {
        this._flushBatch();
      }
    });
  }

  /**
   * Inicia timer para flush automático
   * @private
   */
  _startFlushTimer() {
    this.flushTimer = setTimeout(() => {
      this._flushBatch();
    }, this.options.maxWaitTime);
  }

  /**
   * Envia batch para Python
   * @private
   */
  _flushBatch() {
    if (this.pendingRequests.length === 0) {
      this._clearTimer();
      return;
    }

    const batchStartTime = Date.now();
    const requestsToSend = [...this.pendingRequests];
    this.pendingRequests = [];

    // Limpar timer
    this._clearTimer();

    // Calcular tamanho do batch
    const batchSize = requestsToSend.length;
    this.stats.batchedRequests += batchSize;
    this.stats.totalBatchesSent++;

    // Preparar batch payload
    const batchPayload = {
      type: 'batch',
      requestId: `batch_${batchStartTime}`,
      requests: requestsToSend.map(req => ({
        id: req.id,
        skill: req.skillName,
        params: req.params,
        timeout: req.timeout
      }))
    };

    // Calcular payload size (para métricas)
    const payloadData = JSON.stringify(batchPayload);
    const payloadSize = Buffer.byteLength(payloadData, 'utf8');

    // Verificar se deve comprimir
    let shouldCompress = false;
    let compressedPayload = null;
    let originalSize = payloadSize;

    if (this.options.compression && payloadSize > this.options.compressionThreshold) {
      try {
        // Simular compressão (na implementação real, usar zlib)
        shouldCompress = true;
        compressedPayload = this._simulateCompression(batchPayload);

        // Calcular savings
        const compressedSize = Buffer.byteLength(JSON.stringify(compressedPayload), 'utf8');
        const savings = Math.round((1 - compressedSize / payloadSize) * 100);

        this.stats.totalBytesSaved += originalSize - compressedSize;
        this.stats.compressionSavings += savings;
      } catch (e) {
        console.warn('[IPCBatcher] Compression failed, sending uncompressed:', e.message);
        shouldCompress = false;
      }
    }

    this._updateAverageBatchSize(batchSize);

    // Enviar para Python Bridge
    const payloadToSend = shouldCompress && compressedPayload ? compressedPayload : batchPayload;

    this.pythonBridge.executeBatch(payloadToSend)
      .then(batchResponse => {
        this._processBatchResponse(batchResponse, requestsToSend);
      })
      .catch(error => {
        console.error('[IPCBatcher] Batch execution failed:', error.message);

        // Rejeitar todas as requisições do batch
        for (const request of requestsToSend) {
          request.reject(new Error(`Batch execution failed: ${error.message}`));
        }
      });
  }

  /**
   * Processa resposta do batch e distribui para requisições
   * @private
   * @param {Object} batchResponse - Resposta do batch
   * @param {Array} requests - Requisições originais
   */
  _processBatchResponse(batchResponse, requests) {
    const { results } = batchResponse;

    if (!Array.isArray(results) || results.length !== requests.length) {
      console.error('[IPCBatcher] Invalid batch response format');

      // Rejeitar todas
      for (const request of requests) {
        request.reject(new Error('Invalid batch response format'));
      }
      return;
    }

    // Distribuir respostas para cada requisição
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const request = requests[i];

      // Verificar se IDs correspondem
      if (result.id !== request.id) {
        console.error(`[IPCBatcher] Mismatched request/response ID: ${request.id} !== ${result.id}`);
        request.reject(new Error('Batch response mismatch'));
        continue;
      }

      // Resolver ou rejeitar baseado no resultado
      if (result.success) {
        request.resolve(result);
      } else {
        request.reject(new Error(result.error || 'Execution failed'));
      }
    }

    // Atualizar latência média
    const batchDuration = Date.now() - requests[0].timestamp;
    this._updateAverageLatency(batchDuration);
  }

  /**
   * Limpa timer
   * @private
   */
  _clearTimer() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Simula compressão (placeholder para implementação real com zlib)
   * @private
   * @param {Object} payload - Payload para comprimir
   * @returns {Object} Payload comprimido
   */
  _simulateCompression(payload) {
    // Na implementação real, usar zlib.deflate ou similar
    // Por enquanto, retornar payload com flag de compressão
    const compressedData = JSON.stringify(payload);
    const base64Compressed = Buffer.from(compressedData).toString('base64');

    return {
      type: 'batch_compressed',
      originalType: 'batch',
      data: base64Compressed,
      compression: 'base64' // Na real: 'gzip' ou 'deflate'
    };
  }

  /**
   * Atualiza tamanho médio de batch
   * @private
   * @param {number} batchSize - Tamanho do batch
   */
  _updateAverageBatchSize(batchSize) {
    if (this.stats.totalBatchesSent === 1) {
      this.stats.averageBatchSize = batchSize;
    } else {
      this.stats.averageBatchSize = (this.stats.averageBatchSize * 0.9) + (batchSize * 0.1);
    }
  }

  /**
   * Atualiza latência média
   * @private
   * @param {number} latency - Latência em ms
   */
  _updateAverageLatency(latency) {
    if (this.stats.averageLatency === 0) {
      this.stats.averageLatency = latency;
    } else {
      this.stats.averageLatency = (this.stats.averageLatency * 0.9) + (latency * 0.1);
    }
  }

  /**
   * Atualiza eficiência do batching
   * @private
   */
  _updateBatchingEfficiency() {
    if (this.stats.totalRequests > 0) {
      this.stats.batchingEfficiency = (this.stats.batchedRequests / this.stats.totalRequests * 100);
    }
  }

  /**
   * Força flush imediato (útil em cleanup)
   * @async
   */
  async flush() {
    if (this.pendingRequests.length > 0) {
      this._clearTimer();
      this._flushBatch();
    }
  }

  /**
   * Obtém estatísticas do batcher
   * @returns {Object} Estatísticas detalhadas
   */
  getStats() {
    const avgSavings = this.stats.totalBatchesSent > 0
      ? (this.stats.compressionSavings / this.stats.totalBatchesSent).toFixed(1)
      : 0;

    return {
      ...this.stats,
      averageBatchSize: Math.round(this.stats.averageBatchSize * 100) / 100,
      averageLatency: Math.round(this.stats.averageLatency * 100) / 100,
      batchingEfficiency: Math.round(this.stats.batchingEfficiency * 100) / 100,
      compressionSavings: parseFloat(avgSavings),
      pendingRequests: this.pendingRequests.length,
      isActive: this.flushTimer !== null
    };
  }

  /**
   * Limpa recursos do batcher
   * @async
   */
  async cleanup() {
    this._clearTimer();

    // Flush requisições pendentes
    if (this.pendingRequests.length > 0) {
      await this.flush();
    }

    console.log('[IPCBatcher] ✅ Batcher limpo');
  }
}

module.exports = IPCBatcher;
