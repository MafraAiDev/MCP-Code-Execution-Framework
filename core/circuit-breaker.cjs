/**
 * @fileoverview Circuit Breaker Pattern - Proteção contra falhas em cascata
 * @module core/circuit-breaker
 * @description Implementação do padrão Circuit Breaker com estados CLOSED, OPEN, HALF_OPEN
 * @author Claude AI
 * @version 1.0.0
 * @requires events
 */

const { EventEmitter } = require('events');

/**
 * @typedef {Object} CircuitBreakerOptions
 * @property {string} name - Nome do circuit breaker
 * @property {number} failureThreshold - Número de falhas para abrir o circuito (default: 5)
 * @property {number} successThreshold - Número de sucessos para fechar circuito em HALF_OPEN (default: 3)
 * @property {number} cooldownPeriod - Período de cooldown em ms (default: 30000)
 * @property {number} monitoringWindow - Janela de monitoramento em ms (default: 60000)
 * @property {number} timeout - Timeout para operações em ms (default: 10000)
 * @property {Function} shouldRetry - Função para determinar se deve tentar novamente
 * @property {Function} onStateChange - Callback para mudanças de estado
 */

/**
 * @typedef {Object} CircuitBreakerStats
 * @property {string} state - Estado atual
 * @property {number} totalRequests - Total de requisições
 * @property {number} successfulRequests - Requisições bem-sucedidas
 * @property {number} failedRequests - Requisições falhadas
 * @property {number} failureRate - Taxa de falha (0-1)
 * @property {number} successRate - Taxa de sucesso (0-1)
 * @property {number} averageResponseTime - Tempo médio de resposta
 * @property {number} lastFailureTime - Timestamp da última falha
 * @property {number} lastSuccessTime - Timestamp do último sucesso
 * @property {number} nextRetryTime - Timestamp da próxima tentativa
 * @property {Array<Object>} recentFailures - Falhas recentes
 */

/**
 * Estados do Circuit Breaker
 */
const CIRCUIT_STATES = {
  CLOSED: 'CLOSED',     // Circuito fechado - operação normal
  OPEN: 'OPEN',        // Circuito aberto - falhas detectadas
  HALF_OPEN: 'HALF_OPEN'  // Circuito semi-aberto - testando recovery
};

/**
 * CircuitBreaker - Implementação do padrão Circuit Breaker
 * @class CircuitBreaker
 * @extends EventEmitter
 * @description Protege contra falhas em cascata com estados CLOSED, OPEN, HALF_OPEN
 * @example
 * const breaker = new CircuitBreaker({
 *   name: 'python-bridge',
 *   failureThreshold: 5,
 *   cooldownPeriod: 30000
 * });
 *
 * const result = await breaker.execute(async () => {
 *   return await someOperation();
 * });
 */
class CircuitBreaker extends EventEmitter {
  /**
   * @param {CircuitBreakerOptions} options - Opções de configuração
   */
  constructor(options = {}) {
    super();

    this.options = {
      name: options.name || 'circuit-breaker',
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 3,
      cooldownPeriod: options.cooldownPeriod || 30000,
      monitoringWindow: options.monitoringWindow || 60000,
      timeout: options.timeout || 10000,
      shouldRetry: options.shouldRetry || this._defaultShouldRetry.bind(this),
      onStateChange: options.onStateChange || null,
      ...options
    };

    // Estado interno
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.nextRetryTime = 0;
    this.halfOpenStartTime = 0;

    // Estatísticas
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      failureRate: 0,
      successRate: 0,
      averageResponseTime: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      nextRetryTime: 0
    };

    // Métricas de performance
    this.metrics = {
      startTime: Date.now(),
      responseTimes: [],
      failures: [],
      successes: []
    };

    // Limpeza periódica de métricas antigas
    this._startMetricsCleanup();

    console.log(`[CircuitBreaker:${this.options.name}] Initialized in ${this.state} state`);
    this.emit('circuit_breaker_initialized', { name: this.options.name, state: this.state });
  }

  /**
   * Executa uma operação com proteção do circuit breaker
   * @param {Function} operation - Função a executar
   * @param {Object} options - Opções adicionais
   * @returns {Promise<any>} Resultado da operação
   */
  async execute(operation, options = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Verifica o estado do circuito
      if (this.state === CIRCUIT_STATES.OPEN) {
        if (Date.now() < this.nextRetryTime) {
          throw new Error(`Circuit breaker is OPEN. Next retry at ${new Date(this.nextRetryTime).toISOString()}`);
        } else {
          // Tempo de cooldown expirou, move para HALF_OPEN
          this._transitionTo(CIRCUIT_STATES.HALF_OPEN);
        }
      }

      if (this.state === CIRCUIT_STATES.HALF_OPEN) {
        // Em HALF_OPEN, permite apenas algumas requisições para testar
        if (this._shouldAllowHalfOpenRequest()) {
          console.log(`[CircuitBreaker:${this.options.name}] Testing in HALF_OPEN state`);
        } else {
          throw new Error('Circuit breaker is HALF_OPEN but not accepting requests yet');
        }
      }

      console.log(`[CircuitBreaker:${this.options.name}] Executing operation in ${this.state} state`);

      // Executa a operação com timeout
      let result;
      try {
        result = await this._executeWithTimeout(operation, options.timeout || this.options.timeout);
      } catch (error) {
        // Verifica se é timeout da operação (não erro de rede)
        if (error.message.includes('Operation timeout after')) {
          throw new Error(`Operation timeout after ${options.timeout || this.options.timeout}ms`);
        }
        throw error;
      }

      // Sucesso
      this._recordSuccess(startTime);
      return result;

    } catch (error) {
      // Falha
      this._recordFailure(startTime, error);

      // Verifica se deve tentar novamente (apenas se o circuito não estiver aberto)
      if (this.state !== CIRCUIT_STATES.OPEN && this.options.shouldRetry(error) && (options.retryCount || 0) < 2) {
        console.log(`[CircuitBreaker:${this.options.name}] Retrying operation`);
        // Usa timeout menor para retry para evitar timeouts longos
        return this.execute(operation, {
          ...options,
          retryCount: (options.retryCount || 0) + 1,
          timeout: Math.min(options.timeout || this.options.timeout, 5000) // Timeout máximo de 5s para retry
        });
      }

      throw error;
    }
  }

  /**
   * Executa operação com timeout
   * @private
   * @param {Function} operation - Operação a executar
   * @param {number} timeout - Timeout em ms
   * @returns {Promise<any>} Resultado da operação
   */
  async _executeWithTimeout(operation, timeout) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timeout after ${timeout}ms`)), timeout);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  /**
   * Registra sucesso
   * @private
   * @param {number} startTime - Tempo de início
   */
  _recordSuccess(startTime) {
    const responseTime = Date.now() - startTime;

    this.stats.successfulRequests++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    this.lastSuccessTime = Date.now();

    // Métricas
    this.metrics.responseTimes.push(responseTime);
    this.metrics.successes.push({ timestamp: Date.now(), responseTime });

    this._updateStats();

    console.log(`[CircuitBreaker:${this.options.name}] Success in ${responseTime}ms`);

    // Em HALF_OPEN, verifica se deve fechar o circuito
    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.options.successThreshold) {
        console.log(`[CircuitBreaker:${this.options.name}] Success threshold reached, closing circuit`);
        this._transitionTo(CIRCUIT_STATES.CLOSED);
      }
    }

    this.emit('operation_success', {
      name: this.options.name,
      state: this.state,
      responseTime,
      consecutiveSuccesses: this.consecutiveSuccesses
    });
  }

  /**
   * Registra falha
   * @private
   * @param {number} startTime - Tempo de início
   * @param {Error} error - Erro da operação
   */
  _recordFailure(startTime, error) {
    const responseTime = Date.now() - startTime;

    this.stats.failedRequests++;
    this.failureCount++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();

    // Métricas
    this.metrics.responseTimes.push(responseTime);
    this.metrics.failures.push({
      timestamp: Date.now(),
      responseTime,
      error: error.message,
      type: error.constructor.name
    });

    this._updateStats();

    console.log(`[CircuitBreaker:${this.options.name}] Failure after ${responseTime}ms: ${error.message}`);

    // Verifica se deve abrir o circuito (apenas se ainda estiver fechado)
    if (this.state === CIRCUIT_STATES.CLOSED && this.consecutiveFailures >= this.options.failureThreshold) {
      console.log(`[CircuitBreaker:${this.options.name}] Failure threshold reached, opening circuit`);
      this._transitionTo(CIRCUIT_STATES.OPEN);
    }

    this.emit('operation_failure', {
      name: this.options.name,
      state: this.state,
      responseTime,
      error: error.message,
      consecutiveFailures: this.consecutiveFailures
    });
  }

  /**
   * Transiciona para um novo estado
   * @private
   * @param {string} newState - Novo estado
   */
  _transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;

    console.log(`[CircuitBreaker:${this.options.name}] State transition: ${oldState} → ${newState}`);

    // Configura timers baseados no novo estado
    if (newState === CIRCUIT_STATES.OPEN) {
      this.nextRetryTime = Date.now() + this.options.cooldownPeriod;
      this.stats.nextRetryTime = this.nextRetryTime;
      console.log(`[CircuitBreaker:${this.options.name}] Circuit will retry at ${new Date(this.nextRetryTime).toISOString()}`);
    } else if (newState === CIRCUIT_STATES.HALF_OPEN) {
      this.halfOpenStartTime = Date.now();
      this.consecutiveSuccesses = 0;
      this.consecutiveFailures = 0;
    } else if (newState === CIRCUIT_STATES.CLOSED) {
      // Reset counters when closing
      this.failureCount = 0;
      this.consecutiveFailures = 0;
      this.consecutiveSuccesses = 0;
      this.nextRetryTime = 0;
      this.stats.nextRetryTime = 0;
    }

    // Callback de mudança de estado
    if (this.options.onStateChange) {
      try {
        this.options.onStateChange(newState, oldState, this);
      } catch (error) {
        console.error(`[CircuitBreaker:${this.options.name}] Error in state change callback:`, error);
      }
    }

    this.emit('state_changed', {
      name: this.options.name,
      oldState,
      newState,
      timestamp: Date.now()
    });
  }

  /**
   * Determina se deve permitir requisição em HALF_OPEN
   * @private
   * @returns {boolean} Se deve permitir a requisição
   */
  _shouldAllowHalfOpenRequest() {
    // Em HALF_OPEN, permite apenas algumas requisições para testar
    const timeInHalfOpen = Date.now() - this.halfOpenStartTime;
    return timeInHalfOpen < 5000; // Permite por 5 segundos
  }

  /**
   * Função padrão para determinar se deve tentar novamente
   * @private
   * @param {Error} error - Erro da operação
   * @returns {boolean} Se deve tentar novamente
   */
  _defaultShouldRetry(error) {
    const errorMessage = error.message?.toLowerCase() || '';

    // Não deve retry para timeouts de operação (apenas timeouts de rede/conexão)
    if (errorMessage.includes('operation timeout after')) {
      return false;
    }

    const retryableErrors = [
      'timeout',
      'connection',
      'network',
      'retry',
      'unavailable',
      'busy',
      'rate limit'
    ];

    return retryableErrors.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Atualiza estatísticas
   * @private
   */
  _updateStats() {
    const total = this.stats.successfulRequests + this.stats.failedRequests;

    if (total > 0) {
      this.stats.failureRate = this.stats.failedRequests / total;
      this.stats.successRate = this.stats.successfulRequests / total;
    }

    // Calcula tempo médio de resposta
    if (this.metrics.responseTimes.length > 0) {
      this.stats.averageResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;
    }

    this.stats.lastFailureTime = this.lastFailureTime;
    this.stats.lastSuccessTime = this.lastSuccessTime;
    this.stats.nextRetryTime = this.nextRetryTime;
  }

  /**
   * Inicia limpeza periódica de métricas antigas
   * @private
   */
  _startMetricsCleanup() {
    // Limpa métricas antigas a cada 5 minutos
    setInterval(() => {
      const cutoff = Date.now() - this.options.monitoringWindow;

      // Limpa falhas antigas
      this.metrics.failures = this.metrics.failures.filter(f => f.timestamp > cutoff);

      // Limpa sucessos antigos
      this.metrics.successes = this.metrics.successes.filter(s => s.timestamp > cutoff);

      // Limpa tempos de resposta antigos (mantém últimos 1000)
      if (this.metrics.responseTimes.length > 1000) {
        this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
      }

      this._updateStats();
    }, 300000); // A cada 5 minutos
  }

  /**
   * Obtém estatísticas detalhadas
   * @returns {CircuitBreakerStats} Estatísticas do circuit breaker
   */
  getStats() {
    this._updateStats();

    return {
      state: this.state,
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      failureRate: Math.round(this.stats.failureRate * 100) / 100,
      successRate: Math.round(this.stats.successRate * 100) / 100,
      averageResponseTime: Math.round(this.stats.averageResponseTime),
      lastFailureTime: this.stats.lastFailureTime,
      lastSuccessTime: this.stats.lastSuccessTime,
      nextRetryTime: this.stats.nextRetryTime,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      recentFailures: this.metrics.failures.slice(-5), // Últimas 5 falhas
      recentSuccesses: this.metrics.successes.slice(-5) // Últimos 5 sucessos
    };
  }

  /**
   * Verifica se o circuito está fechado
   * @returns {boolean} Se está fechado
   */
  isClosed() {
    return this.state === CIRCUIT_STATES.CLOSED;
  }

  /**
   * Verifica se o circuito está aberto
   * @returns {boolean} Se está aberto
   */
  isOpen() {
    return this.state === CIRCUIT_STATES.OPEN;
  }

  /**
   * Verifica se o circuito está semi-aberto
   * @returns {boolean} Se está semi-aberto
   */
  isHalfOpen() {
    return this.state === CIRCUIT_STATES.HALF_OPEN;
  }

  /**
   * Força abertura do circuito (para testes)
   */
  forceOpen() {
    this._transitionTo(CIRCUIT_STATES.OPEN);
  }

  /**
   * Força fechamento do circuito (para testes)
   */
  forceClose() {
    this._transitionTo(CIRCUIT_STATES.CLOSED);
  }

  /**
   * Força estado semi-aberto (para testes)
   */
  forceHalfOpen() {
    this._transitionTo(CIRCUIT_STATES.HALF_OPEN);
  }

  /**
   * Reinicia o circuit breaker
   */
  reset() {
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.nextRetryTime = 0;

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      failureRate: 0,
      successRate: 0,
      averageResponseTime: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      nextRetryTime: 0
    };

    this.metrics = {
      startTime: Date.now(),
      responseTimes: [],
      failures: [],
      successes: []
    };

    this.emit('circuit_breaker_reset', { name: this.options.name });
  }
}

// Exporta constantes e classe
module.exports = CircuitBreaker;
module.exports.CIRCUIT_STATES = CIRCUIT_STATES;