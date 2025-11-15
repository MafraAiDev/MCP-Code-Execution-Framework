/**
 * Data Filter - Otimização de tokens
 *
 * Remove dados desnecessários e otimiza estruturas para economizar tokens
 * Meta: 90%+ economia em dados de MCPs
 *
 * @module core/data-filter
 * @complexity HIGH
 * @architect Model A (Sonnet 4.5)
 */

export class DataFilter {
  constructor(options = {}) {
    this.options = {
      maxArrayLength: options.maxArrayLength || 100,
      maxStringLength: options.maxStringLength || 1000,
      maxDepth: options.maxDepth || 5,
      removeNull: options.removeNull !== false,
      removeEmpty: options.removeEmpty !== false,
      compressHTML: options.compressHTML !== false,
      ...options
    };

    this.stats = {
      bytesOriginal: 0,
      bytesFiltered: 0,
      itemsRemoved: 0,
      stringsCompressed: 0
    };
  }

  /**
   * Filtra e otimiza dados
   *
   * @param {any} data - Dados a filtrar
   * @param {object} options - Opções específicas
   * @returns {any} Dados otimizados
   */
  filter(data, options = {}) {
    const opts = { ...this.options, ...options };

    // Calcula tamanho original
    const original = JSON.stringify(data);
    this.stats.bytesOriginal = original.length;

    // Aplica filtros
    const filtered = this._filterRecursive(data, opts, 0);

    // Calcula tamanho filtrado
    const result = JSON.stringify(filtered);
    this.stats.bytesFiltered = result.length;

    return filtered;
  }

  /**
   * Filtro recursivo
   */
  _filterRecursive(data, opts, depth) {
    // Limite de profundidade
    if (depth > opts.maxDepth) {
      return '[TRUNCATED]';
    }

    // Null/undefined
    if (data === null || data === undefined) {
      return opts.removeNull ? undefined : data;
    }

    // Strings
    if (typeof data === 'string') {
      return this._filterString(data, opts);
    }

    // Arrays
    if (Array.isArray(data)) {
      return this._filterArray(data, opts, depth);
    }

    // Objetos
    if (typeof data === 'object') {
      return this._filterObject(data, opts, depth);
    }

    // Primitivos (number, boolean)
    return data;
  }

  /**
   * Filtra strings
   */
  _filterString(str, opts) {
    // Strings vazias
    if (opts.removeEmpty && str.trim() === '') {
      this.stats.itemsRemoved++;
      return undefined;
    }

    // HTML (compress)
    if (opts.compressHTML && this._isHTML(str)) {
      const compressed = this._compressHTML(str);
      if (compressed.length < str.length) {
        this.stats.stringsCompressed++;
        str = compressed;
      }
    }

    // Trunca strings longas
    if (str.length > opts.maxStringLength) {
      this.stats.stringsCompressed++;
      return str.substring(0, opts.maxStringLength) + '... [TRUNCATED]';
    }

    return str;
  }

  /**
   * Filtra arrays
   */
  _filterArray(arr, opts, depth) {
    // Arrays vazios
    if (opts.removeEmpty && arr.length === 0) {
      this.stats.itemsRemoved++;
      return undefined;
    }

    // Trunca arrays longos
    if (arr.length > opts.maxArrayLength) {
      const truncated = arr.slice(0, opts.maxArrayLength);
      this.stats.itemsRemoved += arr.length - opts.maxArrayLength;

      return [
        ...truncated.map(item => this._filterRecursive(item, opts, depth + 1)),
        `... [${arr.length - opts.maxArrayLength} items truncated]`
      ];
    }

    // Filtra cada item
    return arr
      .map(item => this._filterRecursive(item, opts, depth + 1))
      .filter(item => item !== undefined);
  }

  /**
   * Filtra objetos
   */
  _filterObject(obj, opts, depth) {
    const filtered = {};
    let hasContent = false;

    // Campos comuns a remover
    const removeFields = [
      '_id', '__v', 'metadata', 'createdAt', 'updatedAt',
      'timestamp', 'userId', 'sessionId', 'requestId'
    ];

    for (const [key, value] of Object.entries(obj)) {
      // Remove campos específicos
      if (removeFields.includes(key)) {
        this.stats.itemsRemoved++;
        continue;
      }

      // Filtra valor recursivamente
      const filteredValue = this._filterRecursive(value, opts, depth + 1);

      // Remove undefined
      if (filteredValue !== undefined) {
        filtered[key] = filteredValue;
        hasContent = true;
      } else {
        this.stats.itemsRemoved++;
      }
    }

    // Retorna undefined se objeto vazio e removeEmpty=true
    if (!hasContent && opts.removeEmpty) {
      return undefined;
    }

    return filtered;
  }

  /**
   * Verifica se string é HTML
   */
  _isHTML(str) {
    return /<[a-z][\s\S]*>/i.test(str);
  }

  /**
   * Comprime HTML
   */
  _compressHTML(html) {
    return html
      // Remove comentários
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove espaços múltiplos
      .replace(/\s+/g, ' ')
      // Remove espaços entre tags
      .replace(/>\s+</g, '><')
      // Remove atributos desnecessários
      .replace(/\s(class|id|style)="[^"]*"/g, '')
      .trim();
  }

  /**
   * Obtém estatísticas de economia
   */
  getStats() {
    const saved = this.stats.bytesOriginal - this.stats.bytesFiltered;
    const percentage = this.stats.bytesOriginal > 0
      ? (saved / this.stats.bytesOriginal * 100).toFixed(1)
      : 0;

    return {
      ...this.stats,
      bytesSaved: saved,
      percentageSaved: parseFloat(percentage)
    };
  }

  /**
   * Reseta estatísticas
   */
  resetStats() {
    this.stats = {
      bytesOriginal: 0,
      bytesFiltered: 0,
      itemsRemoved: 0,
      stringsCompressed: 0
    };
  }

  /**
   * Gera relatório
   */
  generateReport() {
    const stats = this.getStats();

    return `
═══════════════════════════════════════
   DATA FILTER - RELATÓRIO
═══════════════════════════════════════

Original:     ${stats.bytesOriginal.toLocaleString()} bytes
Filtrado:     ${stats.bytesFiltered.toLocaleString()} bytes
Economizado:  ${stats.bytesSaved.toLocaleString()} bytes (${stats.percentageSaved}%)

Items Removidos:     ${stats.itemsRemoved}
Strings Comprimidas: ${stats.stringsCompressed}

Economia de Tokens: ~${Math.floor(stats.bytesSaved / 4)} tokens
═══════════════════════════════════════
    `.trim();
  }
}

export default new DataFilter();
