/**
 * @fileoverview Connection Pool Manager - Gerenciamento de pool de conexões reutilizáveis
 * @module core/connection-pool
 * @description Pool de conexões com health checks, estratégias de reuso e graceful degradation
 * @author Claude AI
 * @version 1.0.0
 * @requires events
 * @requires os
 * @requires ../core/circuit-breaker
 */

const { EventEmitter } = require('events');
const os = require('os');
const CircuitBreaker = require('./circuit-breaker.cjs');

/**
 * @typedef {Object} ConnectionPoolOptions
 * @property {number} minConnections - Número mínimo de conexões (default: 2)
 * @property {number} maxConnections - Número máximo de conexões (default: 10)
 * @property {number} healthCheckInterval - Intervalo de health check em ms (default: 30000)
 * @property {string} reuseStrategy - Estratégia de reuso: 'affinity', 'round-robin', 'least-used' (default: 'affinity')
 * @property {number} connectionTimeout - Timeout de conexão em ms (default: 30000)
 * @property {number} idleTimeout - Timeout de idle em ms (default: 60000)
 * @property {number} maxLifetime - Vida máxima da conexão em ms (default: 300000)
 * @property {boolean} enableWarmup - Habilitar warmup no startup (default: true)
 * @property {Function} connectionFactory - Função factory para criar conexões
 * @property {Function} connectionValidator - Função para validar conexões
 */

/**
 * @typedef {Object} ConnectionInfo
 * @property {string} id - ID único da conexão
 * @property {Object} connection - Objeto de conexão
 * @property {boolean} inUse - Se está em uso
 * @property {number} createdAt - Timestamp de criação
 * @property {number} lastUsed - Último uso
 * @property {number} useCount - Contador de uso
 * @property {string} affinityKey - Chave de afinidade
 * @property {CircuitBreaker} circuitBreaker - Circuit breaker individual
 * @property {boolean} isHealthy - Estado de saúde
 */

/**
 * @typedef {Object} ConnectionPoolStats
 * @property {number} totalConnections - Total de conexões no pool
 * @property {number} activeConnections - Conexões ativas em uso
 * @property {number} idleConnections - Conexões ociosas
 * @property {number} healthyConnections - Conexões saudáveis
 * @property {number} unhealthyConnections - Conexões com problemas
 * @property {number} waitingRequests - Requisições aguardando
 * @property {Array<Object>} connections - Detalhes de cada conexão
 * @property {Object} circuitBreakerStats - Estatísticas do circuit breaker
 */

/**
 * ConnectionPool - Gerenciamento inteligente de pool de conexões
 * @class ConnectionPool
 * @extends EventEmitter
 * @description Pool de conexões com health checks, estratégias de reuso e circuit breaker
 * @example
 * const pool = new ConnectionPool({
 *   minConnections: 2,
 *   maxConnections: 10,
 *   reuseStrategy: 'affinity',
 *   healthCheckInterval: 30000
 * });
 *
 * const connection = await pool.acquire('skill-name');
 * try {
 *   const result = await connection.execute(params);
 * } finally {
 *   pool.release(connection);
 * }
 */
class ConnectionPool extends EventEmitter {
  /**
   * @param {ConnectionPoolOptions} options - Opções de configuração
   */
  constructor(options = {}) {
    super();

    this.options = {
      minConnections: options.minConnections || 2,
      maxConnections: options.maxConnections || 10,
      healthCheckInterval: options.healthCheckInterval || 30000,
      reuseStrategy: options.reuseStrategy || 'affinity',
      connectionTimeout: options.connectionTimeout || 30000,
      idleTimeout: options.idleTimeout || 60000,
      maxLifetime: options.maxLifetime || 300000,
      enableWarmup: options.enableWarmup !== false,
      connectionFactory: options.connectionFactory || this._defaultConnectionFactory.bind(this),
      connectionValidator: options.connectionValidator || this._defaultConnectionValidator.bind(this),
      ...options
    };

    // Validações
    if (this.options.minConnections > this.options.maxConnections) {
      throw new Error('minConnections cannot be greater than maxConnections');
    }

    if (!['affinity', 'round-robin', 'least-used'].includes(this.options.reuseStrategy)) {
      throw new Error('Invalid reuseStrategy. Must be: affinity, round-robin, or least-used');
    }

    // Estado interno
    this.connections = new Map();
    this.waitingQueue = [];
    this.connectionIdCounter = 0;
    this.roundRobinIndex = 0;
    this.healthCheckTimer = null;
    this.isShuttingDown = false;
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      healthyConnections: 0,
      unhealthyConnections: 0,
      waitingRequests: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      requestsPerSecond: 0,
      averageWaitTime: 0
    };

    // Métricas de performance
    this.metrics = {
      startTime: Date.now(),
      requestTimings: [],
      waitTimes: []
    };

    // Inicializa o pool
    this._initialize();
  }

  /**
   * Inicializa o pool de conexões
   * @private
   */
  async _initialize() {
    console.log(`[ConnectionPool] Initializing with strategy: ${this.options.reuseStrategy}`);

    try {
      // Cria conexões mínimas
      await this._createMinimumConnections();

      // Inicia health checks
      this._startHealthChecks();

      // Emite evento de inicialização
      this.emit('pool_initialized', {
        minConnections: this.options.minConnections,
        maxConnections: this.options.maxConnections,
        strategy: this.options.reuseStrategy,
        totalConnections: this.connections.size
      });

      console.log(`[ConnectionPool] Initialized with ${this.connections.size} connections`);
    } catch (error) {
      console.error('[ConnectionPool] Failed to initialize:', error);
      this.emit('pool_error', { error });
      throw error;
    }
  }

  /**
   * Cria conexões mínimas
   * @private
   */
  async _createMinimumConnections() {
    if (this.options.enableWarmup) {
      console.log(`[ConnectionPool] Warming up ${this.options.minConnections} connections...`);

      const promises = [];
      for (let i = 0; i < this.options.minConnections; i++) {
        promises.push(this._createConnection());
      }

      await Promise.all(promises);
      console.log(`[ConnectionPool] Warmup completed`);
    }
  }

  /**
   * Cria uma nova conexão
   * @private
   * @param {string} affinityKey - Chave de afinidade opcional
   * @returns {Promise<ConnectionInfo>} Informações da conexão
   */
  async _createConnection(affinityKey = null) {
    const connectionId = `conn_${++this.connectionIdCounter}_${Date.now()}`;

    try {
      console.log(`[ConnectionPool] Creating connection ${connectionId}`);

      // Cria a conexão usando a factory
      const connection = await this.options.connectionFactory(connectionId);

      // Cria circuit breaker para a conexão
      const circuitBreaker = new CircuitBreaker({
        name: `connection-${connectionId}`,
        failureThreshold: 3,
        cooldownPeriod: 10000,
        monitoringWindow: 60000
      });

      const connectionInfo = {
        id: connectionId,
        connection,
        inUse: false,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        useCount: 0,
        affinityKey,
        circuitBreaker,
        isHealthy: true
      };

      this.connections.set(connectionId, connectionInfo);
      this._updateStats();

      this.emit('connection_created', { connectionId, affinityKey });

      return connectionInfo;
    } catch (error) {
      console.error(`[ConnectionPool] Failed to create connection ${connectionId}:`, error);
      this.emit('connection_error', { connectionId, error });
      throw error;
    }
  }

  /**
   * Factory padrão de conexões (deve ser sobrescrita)
   * @private
   * @param {string} connectionId - ID da conexão
   * @returns {Promise<Object>} Nova conexão
   */
  async _defaultConnectionFactory(connectionId) {
    // Implementação padrão - deve ser sobrescrita pelos usuários do pool
    return {
      id: connectionId,
      execute: async (params) => {
        // Simula execução
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return { success: true, result: `Executed with ${connectionId}` };
      },
      close: async () => {
        // Simula fechamento
        console.log(`[ConnectionPool] Connection ${connectionId} closed`);
      }
    };
  }

  /**
   * Validador padrão de conexões
   * @private
   * @param {Object} connection - Conexão a validar
   * @returns {Promise<boolean>} Se a conexão é válida
   */
  async _defaultConnectionValidator(connection) {
    try {
      // Implementação padrão - pode ser sobrescrita
      return connection && typeof connection.execute === 'function';
    } catch (error) {
      return false;
    }
  }

  /**
   * Adquire uma conexão do pool
   * @param {string} affinityKey - Chave de afinidade para estratégia de reuso
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Conexão adquirida
   */
  async acquire(affinityKey = null, options = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Verifica se está em shutdown
      if (this.isShuttingDown) {
        throw new Error('Connection pool is shutting down');
      }

      console.log(`[ConnectionPool] Acquiring connection for affinity: ${affinityKey}`);

      // Tenta adquirir uma conexão existente
      let connectionInfo = this._selectConnection(affinityKey);

      // Se não encontrou, cria uma nova (se possível)
      if (!connectionInfo) {
        if (this.connections.size < this.options.maxConnections) {
          connectionInfo = await this._createConnection(affinityKey);
        } else {
          // Pool está cheio, aguarda uma conexão ficar disponível
          console.log(`[ConnectionPool] Pool full, waiting for available connection...`);
          connectionInfo = await this._waitForConnection(affinityKey, options.timeout);
        }
      }

      if (!connectionInfo) {
        throw new Error('Failed to acquire connection from pool');
      }

      // Marca como em uso
      connectionInfo.inUse = true;
      connectionInfo.lastUsed = Date.now();
      connectionInfo.useCount++;
      connectionInfo.affinityKey = affinityKey;

      this._updateStats();

      const waitTime = Date.now() - startTime;
      this.metrics.waitTimes.push(waitTime);
      this.stats.successfulRequests++;

      this.emit('connection_acquired', {
        connectionId: connectionInfo.id,
        affinityKey,
        waitTime
      });

      console.log(`[ConnectionPool] Connection ${connectionInfo.id} acquired (wait: ${waitTime}ms)`);

      return connectionInfo.connection;
    } catch (error) {
      this.stats.failedRequests++;
      this.emit('acquire_error', { affinityKey, error });
      throw error;
    }
  }

  /**
   * Seleciona uma conexão disponível baseado na estratégia
   * @private
   * @param {string} affinityKey - Chave de afinidade
   * @returns {ConnectionInfo|null} Conexão selecionada ou null
   */
  _selectConnection(affinityKey) {
    const availableConnections = Array.from(this.connections.values())
      .filter(conn => !conn.inUse && conn.isHealthy && conn.circuitBreaker.isClosed());

    if (availableConnections.length === 0) {
      return null;
    }

    switch (this.options.reuseStrategy) {
      case 'affinity':
        return this._selectByAffinity(availableConnections, affinityKey);
      case 'round-robin':
        return this._selectByRoundRobin(availableConnections);
      case 'least-used':
        return this._selectByLeastUsed(availableConnections);
      default:
        return availableConnections[0];
    }
  }

  /**
   * Seleção por afinidade
   * @private
   * @param {Array<ConnectionInfo>} connections - Conexões disponíveis
   * @param {string} affinityKey - Chave de afinidade
   * @returns {ConnectionInfo|null} Conexão com afinidade ou null
   */
  _selectByAffinity(connections, affinityKey) {
    if (!affinityKey) return connections[0];

    // Procura conexão com mesma afinidade
    const affinityConnection = connections.find(conn => conn.affinityKey === affinityKey);
    if (affinityConnection) {
      console.log(`[ConnectionPool] Selected connection by affinity: ${affinityConnection.id}`);
      return affinityConnection;
    }

    // Se não encontrou, retorna a primeira disponível
    return connections[0];
  }

  /**
   * Seleção por round-robin
   * @private
   * @param {Array<ConnectionInfo>} connections - Conexões disponíveis
   * @returns {ConnectionInfo} Conexão selecionada
   */
  _selectByRoundRobin(connections) {
    const connection = connections[this.roundRobinIndex % connections.length];
    this.roundRobinIndex++;
    console.log(`[ConnectionPool] Selected connection by round-robin: ${connection.id}`);
    return connection;
  }

  /**
   * Seleção por menos usada
   * @private
   * @param {Array<ConnectionInfo>} connections - Conexões disponíveis
   * @returns {ConnectionInfo} Conexão menos usada
   */
  _selectByLeastUsed(connections) {
    const connection = connections.reduce((min, conn) =>
      conn.useCount < min.useCount ? conn : min
    );
    console.log(`[ConnectionPool] Selected connection by least-used: ${connection.id}`);
    return connection;
  }

  /**
   * Aguarda uma conexão ficar disponível
   * @private
   * @param {string} affinityKey - Chave de afinidade
   * @param {number} timeout - Timeout em ms
   * @returns {Promise<ConnectionInfo>} Conexão disponível
   */
  _waitForConnection(affinityKey, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const waitId = `wait_${Date.now()}_${Math.random()}`;
      const waitInfo = {
        id: waitId,
        affinityKey,
        resolve,
        reject,
        timeout: setTimeout(() => {
          this._removeWaitingRequest(waitId);
          reject(new Error('Timeout waiting for available connection'));
        }, timeout)
      };

      this.waitingQueue.push(waitInfo);
      this.stats.waitingRequests = this.waitingQueue.length;

      this.emit('request_queued', { waitId, affinityKey, queueSize: this.waitingQueue.length });
    });
  }

  /**
   * Remove uma requisição da fila de espera
   * @private
   * @param {string} waitId - ID da requisição de espera
   */
  _removeWaitingRequest(waitId) {
    const index = this.waitingQueue.findIndex(req => req.id === waitId);
    if (index !== -1) {
      const waitInfo = this.waitingQueue.splice(index, 1)[0];
      clearTimeout(waitInfo.timeout);
      this.stats.waitingRequests = this.waitingQueue.length;
    }
  }

  /**
   * Libera uma conexão de volta ao pool
   * @param {Object} connection - Conexão a liberar
   * @param {boolean} isHealthy - Se a conexão ainda é saudável
   */
  release(connection, isHealthy = true) {
    try {
      // Encontra a conexão no pool
      let connectionInfo = null;
      for (const conn of this.connections.values()) {
        if (conn.connection === connection) {
          connectionInfo = conn;
          break;
        }
      }

      if (!connectionInfo) {
        console.warn('[ConnectionPool] Attempted to release unknown connection');
        return;
      }

      console.log(`[ConnectionPool] Releasing connection ${connectionInfo.id}`);

      // Atualiza estado de saúde
      connectionInfo.isHealthy = isHealthy;
      connectionInfo.inUse = false;

      this._updateStats();

      this.emit('connection_released', {
        connectionId: connectionInfo.id,
        isHealthy,
        useCount: connectionInfo.useCount
      });

      // Processa fila de espera
      this._processWaitingQueue();

    } catch (error) {
      console.error('[ConnectionPool] Error releasing connection:', error);
      this.emit('release_error', { error });
    }
  }

  /**
   * Processa fila de espera
   * @private
   */
  _processWaitingQueue() {
    if (this.waitingQueue.length === 0) return;

    // Tenta atender a próxima requisição da fila
    const nextRequest = this.waitingQueue.shift();
    if (nextRequest) {
      clearTimeout(nextRequest.timeout);

      // Tenta adquirir uma conexão para esta requisição
      this._processQueuedRequest(nextRequest)
        .catch(error => nextRequest.reject(error));
    }
  }

  /**
   * Processa uma requisição da fila
   * @private
   * @param {Object} waitInfo - Informações da requisição aguardando
   */
  async _processQueuedRequest(waitInfo) {
    try {
      const connection = await this.acquire(waitInfo.affinityKey, { timeout: 5000 });
      waitInfo.resolve(connection);
    } catch (error) {
      waitInfo.reject(error);
    }
  }

  /**
   * Inicia health checks periódicos
   * @private
   */
  _startHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this._performHealthChecks();
    }, this.options.healthCheckInterval);

    console.log(`[ConnectionPool] Health checks started (interval: ${this.options.healthCheckInterval}ms)`);
  }

  /**
   * Executa health checks em todas as conexões
   * @private
   */
  async _performHealthChecks() {
    const startTime = Date.now();
    let healthyCount = 0;
    let unhealthyCount = 0;

    try {
      const promises = Array.from(this.connections.values()).map(async (connectionInfo) => {
        // Não verifica conexões em uso
        if (connectionInfo.inUse) return;

        try {
          const isValid = await this.options.connectionValidator(connectionInfo.connection);
          connectionInfo.isHealthy = isValid && connectionInfo.circuitBreaker.isClosed();

          if (connectionInfo.isHealthy) {
            healthyCount++;
          } else {
            unhealthyCount++;
          }
        } catch (error) {
          connectionInfo.isHealthy = false;
          unhealthyCount++;
        }
      });

      await Promise.all(promises);

      const duration = Date.now() - startTime;
      this._updateStats();

      this.emit('health_check_completed', {
        duration,
        healthyCount,
        unhealthyCount,
        totalConnections: this.connections.size
      });

      console.log(`[ConnectionPool] Health check completed in ${duration}ms: ${healthyCount} healthy, ${unhealthyCount} unhealthy`);

      // Remove conexões problemáticas
      await this._removeUnhealthyConnections();

    } catch (error) {
      console.error('[ConnectionPool] Health check failed:', error);
      this.emit('health_check_error', { error });
    }
  }

  /**
   * Remove conexões não saudáveis
   * @private
   */
  async _removeUnhealthyConnections() {
    const toRemove = [];

    for (const [connectionId, connectionInfo] of this.connections.entries()) {
      if (!connectionInfo.isHealthy && !connectionInfo.inUse) {
        toRemove.push({ connectionId, connectionInfo });
      }
    }

    if (toRemove.length > 0) {
      console.log(`[ConnectionPool] Removing ${toRemove.length} unhealthy connections`);

      for (const { connectionId, connectionInfo } of toRemove) {
        try {
          await this._closeConnection(connectionId, connectionInfo);
        } catch (error) {
          console.error(`[ConnectionPool] Error closing connection ${connectionId}:`, error);
        }
      }
    }
  }

  /**
   * Fecha uma conexão
   * @private
   * @param {string} connectionId - ID da conexão
   * @param {ConnectionInfo} connectionInfo - Informações da conexão
   */
  async _closeConnection(connectionId, connectionInfo) {
    try {
      console.log(`[ConnectionPool] Closing connection ${connectionId}`);

      // Fecha a conexão
      if (connectionInfo.connection && typeof connectionInfo.connection.close === 'function') {
        await connectionInfo.connection.close();
      }

      // Remove do mapa
      this.connections.delete(connectionId);

      this._updateStats();

      this.emit('connection_closed', { connectionId });

    } catch (error) {
      console.error(`[ConnectionPool] Error closing connection ${connectionId}:`, error);
      this.emit('connection_close_error', { connectionId, error });
    }
  }

  /**
   * Atualiza estatísticas
   * @private
   */
  _updateStats() {
    const connections = Array.from(this.connections.values());

    this.stats.totalConnections = connections.length;
    this.stats.activeConnections = connections.filter(conn => conn.inUse).length;
    this.stats.idleConnections = connections.filter(conn => !conn.inUse).length;
    this.stats.healthyConnections = connections.filter(conn => conn.isHealthy).length;
    this.stats.unhealthyConnections = connections.filter(conn => !conn.isHealthy).length;
    this.stats.waitingRequests = this.waitingQueue.length;

    // Calcula throughput
    const uptime = Date.now() - this.metrics.startTime;
    if (uptime > 0) {
      this.stats.requestsPerSecond = (this.stats.successfulRequests + this.stats.failedRequests) / (uptime / 1000);
    }

    // Calcula tempo médio de espera
    if (this.metrics.waitTimes.length > 0) {
      this.stats.averageWaitTime = this.metrics.waitTimes.reduce((a, b) => a + b, 0) / this.metrics.waitTimes.length;
    }
  }

  /**
   * Obtém estatísticas detalhadas
   * @returns {ConnectionPoolStats} Estatísticas do pool
   */
  getStats() {
    this._updateStats();

    return {
      totalConnections: this.stats.totalConnections,
      activeConnections: this.stats.activeConnections,
      idleConnections: this.stats.idleConnections,
      healthyConnections: this.stats.healthyConnections,
      unhealthyConnections: this.stats.unhealthyConnections,
      waitingRequests: this.stats.waitingRequests,
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      requestsPerSecond: Math.round(this.stats.requestsPerSecond * 100) / 100,
      averageWaitTime: Math.round(this.stats.averageWaitTime),
      connections: Array.from(this.connections.values()).map(conn => ({
        id: conn.id,
        inUse: conn.inUse,
        isHealthy: conn.isHealthy,
        useCount: conn.useCount,
        affinityKey: conn.affinityKey,
        createdAt: conn.createdAt,
        lastUsed: conn.lastUsed,
        age: Date.now() - conn.createdAt,
        circuitBreakerState: conn.circuitBreaker ? conn.circuitBreaker.getState() : 'unknown'
      })),
      circuitBreakerStats: this._getCircuitBreakerStats()
    };
  }

  /**
   * Obtém estatísticas do circuit breaker
   * @private
   * @returns {Object} Estatísticas do circuit breaker
   */
  _getCircuitBreakerStats() {
    const circuitBreakers = Array.from(this.connections.values()).map(conn => conn.circuitBreaker);

    return {
      total: circuitBreakers.length,
      closed: circuitBreakers.filter(cb => cb.isClosed()).length,
      open: circuitBreakers.filter(cb => cb.isOpen()).length,
      halfOpen: circuitBreakers.filter(cb => cb.isHalfOpen()).length
    };
  }

  /**
   * Executa uma operação com uma conexão do pool
   * @param {string} affinityKey - Chave de afinidade
   * @param {Function} operation - Função a executar
   * @param {Object} options - Opções adicionais
   * @returns {Promise<any>} Resultado da operação
   */
  async executeWithConnection(affinityKey, operation, options = {}) {
    const connection = await this.acquire(affinityKey, options);

    try {
      // Encontra a conexão no pool para obter o circuit breaker
      let connectionInfo = null;
      for (const conn of this.connections.values()) {
        if (conn.connection === connection) {
          connectionInfo = conn;
          break;
        }
      }

      if (!connectionInfo) {
        throw new Error('Connection not found in pool');
      }

      // Executa com circuit breaker
      const result = await connectionInfo.circuitBreaker.execute(() =>
        operation(connection)
      );

      return result;
    } finally {
      this.release(connection, true); // Assume que a conexão continua saudável
    }
  }

  /**
   * Finaliza o pool de conexões
   */
  async shutdown() {
    console.log('[ConnectionPool] Shutting down...');

    this.isShuttingDown = true;

    try {
      // Para health checks
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }

      // Aguarda conexões em uso terminarem
      const maxWaitTime = 30000; // 30 segundos
      const startTime = Date.now();

      while (this.stats.activeConnections > 0 && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (this.stats.activeConnections > 0) {
        console.warn(`[ConnectionPool] ${this.stats.activeConnections} connections still in use after shutdown timeout`);
      }

      // Fecha todas as conexões
      const closePromises = Array.from(this.connections.entries()).map(async ([connectionId, connectionInfo]) => {
        await this._closeConnection(connectionId, connectionInfo);
      });

      await Promise.all(closePromises);

      // Rejeita requisições pendentes
      const pendingRequests = this.waitingQueue.splice(0);
      for (const waitInfo of pendingRequests) {
        clearTimeout(waitInfo.timeout);
        waitInfo.reject(new Error('Connection pool is shutting down'));
      }

      console.log('[ConnectionPool] Shutdown complete');
      this.emit('pool_shutdown');

    } catch (error) {
      console.error('[ConnectionPool] Error during shutdown:', error);
      this.emit('pool_shutdown_error', { error });
      throw error;
    }
  }
}

module.exports = ConnectionPool;