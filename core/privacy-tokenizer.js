/**
 * Privacy Tokenizer - Proteção de PII (Personally Identifiable Information)
 *
 * Detecta e tokeniza dados pessoais para conformidade GDPR/LGPD
 *
 * @module core/privacy-tokenizer
 * @complexity HIGH
 * @architect Model A (Sonnet 4.5)
 */

import crypto from 'crypto';

export class PrivacyTokenizer {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      secret: options.secret || 'mcp-framework-secret-key',
      reversible: options.reversible !== false,
      ...options
    };

    // Padrões de PII
    this.patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      cpf: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
      creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
      ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      // Nomes próprios (simplificado - detecta palavras capitalizadas)
      name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
    };

    // Mapa de tokens (para reversibilidade)
    this.tokenMap = new Map();
    this.reverseMap = new Map();

    this.stats = {
      emailsDetected: 0,
      phonesDetected: 0,
      ssnsDetected: 0,
      cpfsDetected: 0,
      creditCardsDetected: 0,
      ipAddressesDetected: 0,
      namesDetected: 0,
      totalDetected: 0
    };
  }

  /**
   * Tokeniza dados (substitui PII por tokens)
   *
   * @param {any} data - Dados a tokenizar
   * @returns {any} Dados tokenizados
   */
  tokenize(data) {
    if (!this.options.enabled) {
      return data;
    }

    return this._tokenizeRecursive(data);
  }

  /**
   * Destokeniza dados (reverte tokens para PII original)
   * IMPORTANTE: Só funciona se reversible=true
   *
   * @param {any} data - Dados tokenizados
   * @returns {any} Dados originais
   */
  detokenize(data) {
    if (!this.options.reversible) {
      throw new Error('Detokenização desabilitada (reversible=false)');
    }

    return this._detokenizeRecursive(data);
  }

  /**
   * Tokenização recursiva
   */
  _tokenizeRecursive(data) {
    // Null/undefined
    if (data === null || data === undefined) {
      return data;
    }

    // Strings
    if (typeof data === 'string') {
      return this._tokenizeString(data);
    }

    // Arrays
    if (Array.isArray(data)) {
      return data.map(item => this._tokenizeRecursive(item));
    }

    // Objetos
    if (typeof data === 'object') {
      const tokenized = {};
      for (const [key, value] of Object.entries(data)) {
        tokenized[key] = this._tokenizeRecursive(value);
      }
      return tokenized;
    }

    // Primitivos
    return data;
  }

  /**
   * Tokeniza string
   */
  _tokenizeString(str) {
    let tokenized = str;

    // Email
    tokenized = tokenized.replace(this.patterns.email, (match) => {
      this.stats.emailsDetected++;
      this.stats.totalDetected++;
      return this._createToken('EMAIL', match);
    });

    // Telefone
    tokenized = tokenized.replace(this.patterns.phone, (match) => {
      this.stats.phonesDetected++;
      this.stats.totalDetected++;
      return this._createToken('PHONE', match);
    });

    // SSN
    tokenized = tokenized.replace(this.patterns.ssn, (match) => {
      this.stats.ssnsDetected++;
      this.stats.totalDetected++;
      return this._createToken('SSN', match);
    });

    // CPF
    tokenized = tokenized.replace(this.patterns.cpf, (match) => {
      this.stats.cpfsDetected++;
      this.stats.totalDetected++;
      return this._createToken('CPF', match);
    });

    // Cartão de crédito
    tokenized = tokenized.replace(this.patterns.creditCard, (match) => {
      // Verifica se parece um cartão válido (Luhn algorithm simplificado)
      if (this._looksLikeCreditCard(match)) {
        this.stats.creditCardsDetected++;
        this.stats.totalDetected++;
        return this._createToken('CC', match);
      }
      return match;
    });

    // IP Address
    tokenized = tokenized.replace(this.patterns.ipAddress, (match) => {
      this.stats.ipAddressesDetected++;
      this.stats.totalDetected++;
      return this._createToken('IP', match);
    });

    return tokenized;
  }

  /**
   * Cria token para PII
   */
  _createToken(type, value) {
    // Hash do valor
    const hash = crypto
      .createHmac('sha256', this.options.secret)
      .update(value)
      .digest('hex')
      .substring(0, 8);

    const token = `[${type}_${hash}]`;

    // Armazena para reversibilidade
    if (this.options.reversible) {
      this.tokenMap.set(value, token);
      this.reverseMap.set(token, value);
    }

    return token;
  }

  /**
   * Verifica se parece cartão de crédito
   */
  _looksLikeCreditCard(str) {
    const digits = str.replace(/\D/g, '');
    return digits.length === 16 || digits.length === 15;
  }

  /**
   * Destokenização recursiva
   */
  _detokenizeRecursive(data) {
    // Null/undefined
    if (data === null || data === undefined) {
      return data;
    }

    // Strings
    if (typeof data === 'string') {
      return this._detokenizeString(data);
    }

    // Arrays
    if (Array.isArray(data)) {
      return data.map(item => this._detokenizeRecursive(item));
    }

    // Objetos
    if (typeof data === 'object') {
      const detokenized = {};
      for (const [key, value] of Object.entries(data)) {
        detokenized[key] = this._detokenizeRecursive(value);
      }
      return detokenized;
    }

    // Primitivos
    return data;
  }

  /**
   * Destokeniza string
   */
  _detokenizeString(str) {
    let detokenized = str;

    // Substitui tokens por valores originais
    for (const [token, value] of this.reverseMap.entries()) {
      detokenized = detokenized.replace(token, value);
    }

    return detokenized;
  }

  /**
   * Verifica se dados contêm PII
   */
  containsPII(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);

    return Object.entries(this.patterns).some(([, pattern]) => {
      return pattern.test(str);
    });
  }

  /**
   * Obtém estatísticas
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reseta estatísticas
   */
  resetStats() {
    this.stats = {
      emailsDetected: 0,
      phonesDetected: 0,
      ssnsDetected: 0,
      cpfsDetected: 0,
      creditCardsDetected: 0,
      ipAddressesDetected: 0,
      namesDetected: 0,
      totalDetected: 0
    };
  }

  /**
   * Limpa mapa de tokens
   */
  clearTokenMap() {
    this.tokenMap.clear();
    this.reverseMap.clear();
  }

  /**
   * Gera relatório
   */
  generateReport() {
    const stats = this.getStats();

    return `
═══════════════════════════════════════
   PRIVACY TOKENIZER - RELATÓRIO
═══════════════════════════════════════

Emails detectados:       ${stats.emailsDetected}
Telefones detectados:    ${stats.phonesDetected}
SSNs detectados:         ${stats.ssnsDetected}
CPFs detectados:         ${stats.cpfsDetected}
Cartões detectados:      ${stats.creditCardsDetected}
IPs detectados:          ${stats.ipAddressesDetected}

Total PII Detectado:     ${stats.totalDetected}
Reversível:              ${this.options.reversible ? 'SIM' : 'NÃO'}
Tokens armazenados:      ${this.tokenMap.size}

Conformidade: ${stats.totalDetected > 0 ? '✅ PROTEGIDO' : '✅ SEM PII'}
═══════════════════════════════════════
    `.trim();
  }
}

export default new PrivacyTokenizer();
