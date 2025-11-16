/**
 * @fileoverview Skill Loader - Carrega dinamicamente skills do MCP Framework
 * @module skills/loader
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * Loader responsável por carregar e parsear skills dinamicamente
 */
class SkillLoader {
  /**
   * @param {Object} registry - Registry de skills
   */
  constructor(registry) {
    this.registry = registry;
    this.cache = new Map();
  }

  /**
   * Carrega uma skill específica
   * @param {string} skillName - Nome da skill
   * @returns {Promise<Object>} Skill carregada
   */
  async loadSkill(skillName) {
    if (!skillName || typeof skillName !== 'string') {
      throw new Error('Skill name must be a non-empty string');
    }

    // Verificar cache
    if (this.cache.has(skillName)) {
      return this.cache.get(skillName);
    }

    // Encontrar skill no registry
    const skillInfo = this.registry.skills.find(s => s.name === skillName);
    if (!skillInfo) {
      throw new Error(`Skill '${skillName}' not found in registry`);
    }

    try {
      // Resolver caminho da skill
      const skillPath = this._resolveSkillPath(skillName);

      // Validar estrutura da skill
      await this._validateSkillStructure(skillPath);

      // Parsear SKILL.md se existir
      const skillMd = await this.parseSkillMd(skillPath);

      // Carregar módulo principal
      const entryPoint = path.join(skillPath, skillInfo.entrypoint || 'index.js');
      // Path validado - seguro para dynamic require
      // eslint-disable-next-line security/detect-non-literal-require
      const skillModule = require(entryPoint);

      // Criar objeto skill carregada
      const loadedSkill = {
        name: skillName,
        path: skillPath,
        module: skillModule,
        metadata: {
          ...skillInfo,
          skillMd: skillMd,
          loadedAt: new Date().toISOString()
        }
      };

      // Cachear resultado
      this.cache.set(skillName, loadedSkill);

      return loadedSkill;
    } catch (error) {
      throw new Error(`Failed to load skill '${skillName}': ${error.message}`);
    }
  }

  /**
   * Parseia o arquivo SKILL.md
   * @param {string} skillPath - Caminho da skill
   * @returns {Promise<Object>} Metadados parseados
   */
  async parseSkillMd(skillPath) {
    const skillMdPath = path.join(skillPath, 'SKILL.md');

    try {
      const content = await fs.readFile(skillMdPath, 'utf8');

      // Extrair informações básicas do markdown
      const metadata = {
        content: content,
        title: this._extractTitle(content),
        description: this._extractDescription(content),
        usage: this._extractUsage(content),
        examples: this._extractExamples(content)
      };

      return metadata;
    } catch (error) {
      // SKILL.md é opcional, retornar objeto vazio se não existir
      return {
        content: '',
        title: '',
        description: '',
        usage: '',
        examples: []
      };
    }
  }

  /**
   * Valida estrutura da skill
   * @private
   * @param {string} skillPath - Caminho da skill
   */
  async _validateSkillStructure(skillPath) {
    try {
      // Verificar se diretório existe
      const stats = await fs.stat(skillPath);
      if (!stats.isDirectory()) {
        throw new Error(`Skill path '${skillPath}' is not a directory`);
      }

      // Verificar arquivos obrigatórios
      const requiredFiles = ['index.js'];
      for (const file of requiredFiles) {
        const filePath = path.join(skillPath, file);
        try {
          await fs.access(filePath);
        } catch {
          throw new Error(`Required file '${file}' not found in skill directory`);
        }
      }

      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Skill directory not found: ${skillPath}`);
      }
      throw error;
    }
  }

  /**
   * Resolve caminho da skill de forma segura
   * @private
   * @param {string} skillName - Nome da skill
   * @returns {string} Caminho resolvido
   */
  _resolveSkillPath(skillName) {
    const skillInfo = this.registry.skills.find(s => s.name === skillName);
    if (!skillInfo) {
      throw new Error(`Skill '${skillName}' not found in registry`);
    }

    // Caminho base do projeto
    const basePath = path.resolve(__dirname, '..');
    const skillPath = path.resolve(basePath, skillInfo.path);

    // Verificar que o caminho está dentro do projeto (segurança)
    if (!skillPath.startsWith(basePath)) {
      throw new Error(`Invalid skill path: ${skillPath}`);
    }

    return skillPath;
  }

  /**
   * Extrai título do markdown
   * @private
   */
  _extractTitle(content) {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : '';
  }

  /**
   * Extrai descrição do markdown
   * @private
   */
  _extractDescription(content) {
    const match = content.match(/^##\s+Descrição[\s\S]*?^(.+)$/m);
    return match ? match[1].trim() : '';
  }

  /**
   * Extrai uso do markdown
   * @private
   */
  _extractUsage(content) {
    const match = content.match(/^##\s+Uso[\s\S]*?^```[\s\S]*?^```$/m);
    return match ? match[0].trim() : '';
  }

  /**
   * Extrai exemplos do markdown
   * @private
   */
  _extractExamples(content) {
    const examples = [];
    const matches = content.matchAll(/^##\s+Exemplos?[\s\S]*?^```[\s\S]*?^```$/gm);

    for (const match of matches) {
      examples.push(match[0].trim());
    }

    return examples;
  }

  /**
   * Limpa cache de skills
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Remove uma skill do cache
   * @param {string} skillName - Nome da skill
   */
  removeFromCache(skillName) {
    return this.cache.delete(skillName);
  }

  /**
   * Obtém estatísticas do loader
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      cachedSkills: this.cache.size,
      totalSkills: this.registry.totalSkills
    };
  }
}

module.exports = SkillLoader;