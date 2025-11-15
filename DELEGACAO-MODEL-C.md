# ⚙️ DELEGAÇÃO MODEL C - EXECUTOR

**Terminal:** 3 (Executor/Implementador)
**Responsável:** Claude Model C
**Data:** 2025-11-15
**Projeto:** Integração Skills → MCP Code Execution Framework

---

## 🎯 SUA MISSÃO

Você é o **MODEL C - EXECUTOR**, responsável por implementar o código que integrará as 24 Claude Skills ao MCP Code Execution Framework. Seu trabalho será revisado pelo Model B e coordenado pelo Model A.

**📖 Leia primeiro:** `PLANNING.md` (planejamento mestre completo)

---

## ✅ SUAS RESPONSABILIDADES

1. 💻 Implementar código conforme especificações
2. 🔧 Criar módulos e classes
3. ✅ Escrever testes unitários e de integração
4. 📦 Gerenciar dependências
5. 🚀 Executar e debugar código
6. 📝 Documentar APIs e funções
7. 🔄 Aplicar correções solicitadas por Model B

---

## 📋 ROADMAP DE IMPLEMENTAÇÃO

Você implementará o projeto em **6 FASES**. Cada fase deve ser completada, testada e commitada separadamente.

---

## 🔲 FASE 1: SETUP & ESTRUTURA

**Objetivo:** Preparar ambiente e estrutura de diretórios

### Tarefa 1.1: Instalar Dependência

```bash
npm install ai-labs-claude-skills --save
```

**Validação:**
- [ ] Dependência aparece em `package.json`
- [ ] `node_modules/ai-labs-claude-skills` existe
- [ ] `npm list ai-labs-claude-skills` mostra versão instalada

---

### Tarefa 1.2: Criar Estrutura de Diretórios

Crie a seguinte estrutura:

```bash
mkdir -p skills/packages
mkdir -p servers/skills
mkdir -p test/unit
mkdir -p test/integration
```

**Validação:**
- [ ] Todos os diretórios criados
- [ ] Estrutura reflete arquitetura do PLANNING.md

---

### Tarefa 1.3: Criar `skills/registry.json`

Crie o arquivo que mapeia todas as 24 skills:

**Arquivo:** `skills/registry.json`

```json
{
  "version": "1.0.0",
  "totalSkills": 24,
  "categories": {
    "creative": ["brand-analyzer", "pitch-deck", "script-writer", "social-media-generator", "storyboard-manager", "research-paper-writer"],
    "business": ["business-analytics-reporter", "business-document-generator", "finance-manager", "startup-validator", "data-analyst"],
    "development": ["codebase-documenter", "cicd-pipeline-generator", "docker-containerization", "frontend-enhancer", "tech-debt-analyzer", "test-specialist"],
    "utilities": ["csv-data-visualizer", "document-skills", "personal-assistant", "resume-manager", "seo-optimizer"],
    "specialized": ["nutritional-specialist", "travel-planner"]
  },
  "skills": [
    {
      "name": "brand-analyzer",
      "displayName": "Brand Analyzer",
      "description": "Analyzes brand identity, positioning, and marketing strategies",
      "category": "creative",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/brand-analyzer",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "brandName": { "type": "string", "required": true },
        "includeCompetitors": { "type": "boolean", "default": false }
      }
    },
    {
      "name": "business-analytics-reporter",
      "displayName": "Business Analytics Reporter",
      "description": "Generates comprehensive business analytics reports",
      "category": "business",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/business-analytics-reporter",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "dataSource": { "type": "string", "required": true },
        "format": { "type": "string", "enum": ["pdf", "html", "markdown"], "default": "markdown" }
      }
    },
    {
      "name": "business-document-generator",
      "displayName": "Business Document Generator",
      "description": "Creates professional business documents",
      "category": "business",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/business-document-generator",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "documentType": { "type": "string", "required": true },
        "template": { "type": "string", "required": false }
      }
    },
    {
      "name": "cicd-pipeline-generator",
      "displayName": "CI/CD Pipeline Generator",
      "description": "Generates CI/CD pipeline configurations",
      "category": "development",
      "priority": "high",
      "version": "1.0.0",
      "path": "skills/packages/cicd-pipeline-generator",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "platform": { "type": "string", "enum": ["github", "gitlab", "jenkins"], "required": true },
        "language": { "type": "string", "required": true }
      }
    },
    {
      "name": "codebase-documenter",
      "displayName": "Codebase Documenter",
      "description": "Generates comprehensive documentation for codebases",
      "category": "development",
      "priority": "high",
      "version": "1.0.0",
      "path": "skills/packages/codebase-documenter",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "path": { "type": "string", "required": true },
        "outputFormat": { "type": "string", "enum": ["markdown", "html", "pdf"], "default": "markdown" },
        "includeTests": { "type": "boolean", "default": true }
      }
    },
    {
      "name": "csv-data-visualizer",
      "displayName": "CSV Data Visualizer",
      "description": "Creates visualizations from CSV data",
      "category": "utilities",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/csv-data-visualizer",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "csvPath": { "type": "string", "required": true },
        "chartType": { "type": "string", "enum": ["bar", "line", "pie"], "default": "bar" }
      }
    },
    {
      "name": "data-analyst",
      "displayName": "Data Analyst",
      "description": "Performs comprehensive data analysis",
      "category": "business",
      "priority": "high",
      "version": "1.0.0",
      "path": "skills/packages/data-analyst",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "dataPath": { "type": "string", "required": true },
        "analysisType": { "type": "string", "required": true }
      }
    },
    {
      "name": "docker-containerization",
      "displayName": "Docker Containerization",
      "description": "Creates Docker configurations for applications",
      "category": "development",
      "priority": "high",
      "version": "1.0.0",
      "path": "skills/packages/docker-containerization",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "projectPath": { "type": "string", "required": true },
        "baseImage": { "type": "string", "default": "node:18" }
      }
    },
    {
      "name": "document-skills",
      "displayName": "Document Skills",
      "description": "Document processing and manipulation utilities",
      "category": "utilities",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/document-skills",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "operation": { "type": "string", "required": true },
        "documentPath": { "type": "string", "required": true }
      }
    },
    {
      "name": "finance-manager",
      "displayName": "Finance Manager",
      "description": "Financial planning and management tools",
      "category": "business",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/finance-manager",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "operation": { "type": "string", "required": true },
        "data": { "type": "object", "required": true }
      }
    },
    {
      "name": "frontend-enhancer",
      "displayName": "Frontend Enhancer",
      "description": "Enhances and optimizes frontend code",
      "category": "development",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/frontend-enhancer",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "projectPath": { "type": "string", "required": true },
        "framework": { "type": "string", "enum": ["react", "vue", "angular"] }
      }
    },
    {
      "name": "nutritional-specialist",
      "displayName": "Nutritional Specialist",
      "description": "Nutritional analysis and meal planning",
      "category": "specialized",
      "priority": "low",
      "version": "1.0.0",
      "path": "skills/packages/nutritional-specialist",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "goal": { "type": "string", "required": true }
      }
    },
    {
      "name": "personal-assistant",
      "displayName": "Personal Assistant",
      "description": "Personal productivity and task management",
      "category": "utilities",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/personal-assistant",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "task": { "type": "string", "required": true }
      }
    },
    {
      "name": "pitch-deck",
      "displayName": "Pitch Deck Generator",
      "description": "Creates investor pitch decks",
      "category": "creative",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/pitch-deck",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "companyName": { "type": "string", "required": true },
        "industry": { "type": "string", "required": true }
      }
    },
    {
      "name": "research-paper-writer",
      "displayName": "Research Paper Writer",
      "description": "Writes academic research papers",
      "category": "creative",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/research-paper-writer",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "topic": { "type": "string", "required": true },
        "citations": { "type": "array", "default": [] }
      }
    },
    {
      "name": "resume-manager",
      "displayName": "Resume Manager",
      "description": "Creates and optimizes professional resumes",
      "category": "utilities",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/resume-manager",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "profile": { "type": "object", "required": true },
        "template": { "type": "string", "default": "professional" }
      }
    },
    {
      "name": "script-writer",
      "displayName": "Script Writer",
      "description": "Writes scripts for various media",
      "category": "creative",
      "priority": "low",
      "version": "1.0.0",
      "path": "skills/packages/script-writer",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "genre": { "type": "string", "required": true },
        "length": { "type": "string", "default": "short" }
      }
    },
    {
      "name": "seo-optimizer",
      "displayName": "SEO Optimizer",
      "description": "Optimizes content for search engines",
      "category": "utilities",
      "priority": "high",
      "version": "1.0.0",
      "path": "skills/packages/seo-optimizer",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "content": { "type": "string", "required": true },
        "keywords": { "type": "array", "required": true }
      }
    },
    {
      "name": "social-media-generator",
      "displayName": "Social Media Generator",
      "description": "Generates social media content",
      "category": "creative",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/social-media-generator",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "platform": { "type": "string", "enum": ["twitter", "linkedin", "instagram"], "required": true },
        "topic": { "type": "string", "required": true }
      }
    },
    {
      "name": "startup-validator",
      "displayName": "Startup Validator",
      "description": "Validates startup ideas and business models",
      "category": "business",
      "priority": "medium",
      "version": "1.0.0",
      "path": "skills/packages/startup-validator",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "idea": { "type": "string", "required": true },
        "market": { "type": "string", "required": true }
      }
    },
    {
      "name": "storyboard-manager",
      "displayName": "Storyboard Manager",
      "description": "Creates and manages storyboards",
      "category": "creative",
      "priority": "low",
      "version": "1.0.0",
      "path": "skills/packages/storyboard-manager",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "project": { "type": "string", "required": true }
      }
    },
    {
      "name": "tech-debt-analyzer",
      "displayName": "Tech Debt Analyzer",
      "description": "Analyzes and reports technical debt",
      "category": "development",
      "priority": "high",
      "version": "1.0.0",
      "path": "skills/packages/tech-debt-analyzer",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "projectPath": { "type": "string", "required": true },
        "severity": { "type": "string", "enum": ["low", "medium", "high", "critical"], "default": "medium" }
      }
    },
    {
      "name": "test-specialist",
      "displayName": "Test Specialist",
      "description": "Generates and optimizes test suites",
      "category": "development",
      "priority": "high",
      "version": "1.0.0",
      "path": "skills/packages/test-specialist",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "codePath": { "type": "string", "required": true },
        "framework": { "type": "string", "enum": ["jest", "mocha", "pytest"], "default": "jest" }
      }
    },
    {
      "name": "travel-planner",
      "displayName": "Travel Planner",
      "description": "Plans and optimizes travel itineraries",
      "category": "specialized",
      "priority": "low",
      "version": "1.0.0",
      "path": "skills/packages/travel-planner",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "dependencies": ["python-bridge"],
      "parameters": {
        "destination": { "type": "string", "required": true },
        "duration": { "type": "number", "required": true },
        "budget": { "type": "number", "required": false }
      }
    }
  ]
}
```

**Validação:**
- [ ] JSON é válido (use `npm run validate:json` se disponível)
- [ ] Todas as 24 skills estão mapeadas
- [ ] Campos obrigatórios presentes em cada skill

---

### Tarefa 1.4: Commit da Fase 1

```bash
git add skills/registry.json package.json package-lock.json
git commit -m "feat(skills): add skills infrastructure and registry

- Install ai-labs-claude-skills dependency
- Create skills directory structure
- Add registry.json with 24 skills mapped

FASE 1/6 - Setup & Structure

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**⚠️ IMPORTANTE:** Notifique Model A que a Fase 1 está completa e aguarde review do Model B antes de prosseguir.

---

## 🔲 FASE 2: SKILLS MANAGER

**Objetivo:** Implementar gerenciador central de skills

### Tarefa 2.1: Criar `core/skills-manager.js`

**Arquivo:** `core/skills-manager.js`

```javascript
/**
 * @fileoverview Skills Manager - Gerencia carregamento e execução de Claude Skills
 * @module core/skills-manager
 */

const path = require('path');
const fs = require('fs').promises;
const SkillLoader = require('../skills/loader');
const SkillValidator = require('../skills/validator');

/**
 * Gerenciador centralizado de Skills do MCP Framework
 * Responsável por carregar, validar e executar skills
 */
class SkillsManager {
  /**
   * @param {Object} pythonBridge - Instância do Python Bridge
   * @param {Object} options - Opções de configuração
   */
  constructor(pythonBridge, options = {}) {
    if (!pythonBridge) {
      throw new Error('PythonBridge is required for SkillsManager');
    }

    this.pythonBridge = pythonBridge;
    this.options = {
      cacheSkills: options.cacheSkills !== false,
      validateOnLoad: options.validateOnLoad !== false,
      timeoutMs: options.timeoutMs || 30000,
      maxConcurrentSkills: options.maxConcurrentSkills || 3,
      ...options
    };

    // Cache de skills carregadas
    this.loadedSkills = new Map();

    // Contador de execuções
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    };

    // Carrega registry
    this.registry = this._loadRegistry();

    // Inicializa loader e validator
    this.loader = new SkillLoader(this.registry);
    this.validator = new SkillValidator(this.registry);

    // Skills em execução
    this.runningSkills = new Map();
  }

  /**
   * Carrega registry de skills
   * @private
   * @returns {Object} Registry object
   */
  _loadRegistry() {
    try {
      const registryPath = path.join(__dirname, '../skills/registry.json');
      const registryData = require(registryPath);

      if (!registryData.skills || !Array.isArray(registryData.skills)) {
        throw new Error('Invalid registry format: missing skills array');
      }

      return registryData;
    } catch (error) {
      throw new Error(`Failed to load skills registry: ${error.message}`);
    }
  }

  /**
   * Lista todas as skills disponíveis
   * @param {Object} filters - Filtros opcionais (category, priority)
   * @returns {Promise<Array>} Lista de skills
   */
  async listSkills(filters = {}) {
    let skills = this.registry.skills;

    // Aplicar filtros
    if (filters.category) {
      skills = skills.filter(s => s.category === filters.category);
    }

    if (filters.priority) {
      skills = skills.filter(s => s.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      skills = skills.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.displayName.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower)
      );
    }

    return skills.map(s => ({
      name: s.name,
      displayName: s.displayName,
      description: s.description,
      category: s.category,
      priority: s.priority,
      loaded: this.loadedSkills.has(s.name)
    }));
  }

  /**
   * Obtém informações detalhadas de uma skill
   * @param {string} skillName - Nome da skill
   * @returns {Promise<Object>} Informações da skill
   */
  async getSkillInfo(skillName) {
    const skill = this.registry.skills.find(s => s.name === skillName);

    if (!skill) {
      throw new Error(`Skill '${skillName}' not found in registry`);
    }

    return {
      ...skill,
      loaded: this.loadedSkills.has(skillName),
      executionCount: this.loadedSkills.get(skillName)?.executionCount || 0
    };
  }

  /**
   * Carrega uma skill na memória
   * @param {string} skillName - Nome da skill a carregar
   * @returns {Promise<Object>} Metadados da skill carregada
   */
  async loadSkill(skillName) {
    // Validar nome da skill
    if (!skillName || typeof skillName !== 'string') {
      throw new Error('Skill name must be a non-empty string');
    }

    // Verificar se já está carregada (cache)
    if (this.options.cacheSkills && this.loadedSkills.has(skillName)) {
      return this.loadedSkills.get(skillName).metadata;
    }

    // Buscar skill no registry
    const skillInfo = this.registry.skills.find(s => s.name === skillName);
    if (!skillInfo) {
      throw new Error(`Skill '${skillName}' not found in registry`);
    }

    try {
      // Carregar skill via loader
      const loadedSkill = await this.loader.loadSkill(skillName);

      // Validar skill se habilitado
      if (this.options.validateOnLoad) {
        const validation = await this.validator.validate(loadedSkill);
        if (!validation.valid) {
          throw new Error(`Skill validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Comunicar com Python para carregar skill
      const pythonResult = await this.pythonBridge.execute('skills.executor', 'load_skill', {
        skill_name: skillName,
        skill_path: skillInfo.path
      });

      if (!pythonResult.success) {
        throw new Error(`Python failed to load skill: ${pythonResult.error}`);
      }

      // Armazenar em cache
      const metadata = {
        name: skillName,
        loadedAt: new Date().toISOString(),
        executionCount: 0,
        ...loadedSkill.metadata
      };

      if (this.options.cacheSkills) {
        this.loadedSkills.set(skillName, {
          metadata,
          pythonHandle: pythonResult.handle
        });
      }

      return metadata;
    } catch (error) {
      throw new Error(`Failed to load skill '${skillName}': ${error.message}`);
    }
  }

  /**
   * Executa uma skill com parâmetros
   * @param {string} skillName - Nome da skill
   * @param {Object} params - Parâmetros de execução
   * @param {Object} options - Opções de execução
   * @returns {Promise<Object>} Resultado da execução
   */
  async executeSkill(skillName, params = {}, options = {}) {
    const startTime = Date.now();

    try {
      // Validar parâmetros básicos
      if (!skillName) {
        throw new Error('Skill name is required');
      }

      // Verificar limite de skills simultâneas
      if (this.runningSkills.size >= this.options.maxConcurrentSkills) {
        throw new Error(`Maximum concurrent skills limit reached (${this.options.maxConcurrentSkills})`);
      }

      // Carregar skill se necessário
      if (!this.loadedSkills.has(skillName)) {
        await this.loadSkill(skillName);
      }

      const skillCache = this.loadedSkills.get(skillName);

      // Validar parâmetros contra schema
      const skillInfo = this.registry.skills.find(s => s.name === skillName);
      if (skillInfo.parameters) {
        this._validateParameters(params, skillInfo.parameters);
      }

      // Marcar skill como em execução
      const executionId = `${skillName}-${Date.now()}`;
      this.runningSkills.set(executionId, {
        skillName,
        startTime,
        params
      });

      // Executar via Python Bridge
      const result = await Promise.race([
        this.pythonBridge.execute('skills.executor', 'execute_skill', {
          skill_name: skillName,
          params,
          handle: skillCache.pythonHandle
        }),
        this._timeout(options.timeoutMs || this.options.timeoutMs, skillName)
      ]);

      // Remover de execução
      this.runningSkills.delete(executionId);

      // Atualizar estatísticas
      const executionTime = Date.now() - startTime;
      this.stats.totalExecutions++;

      if (result.success) {
        this.stats.successfulExecutions++;
        skillCache.executionCount++;

        // Atualizar média de tempo
        this.stats.averageExecutionTime =
          (this.stats.averageExecutionTime * (this.stats.totalExecutions - 1) + executionTime) /
          this.stats.totalExecutions;

        return {
          success: true,
          skillName,
          result: result.data,
          executionTime,
          timestamp: new Date().toISOString()
        };
      } else {
        this.stats.failedExecutions++;
        throw new Error(result.error || 'Skill execution failed');
      }
    } catch (error) {
      this.stats.failedExecutions++;
      throw new Error(`Skill execution failed for '${skillName}': ${error.message}`);
    }
  }

  /**
   * Valida parâmetros contra schema
   * @private
   */
  _validateParameters(params, schema) {
    for (const [paramName, paramSchema] of Object.entries(schema)) {
      const value = params[paramName];

      // Verificar required
      if (paramSchema.required && value === undefined) {
        throw new Error(`Required parameter '${paramName}' is missing`);
      }

      // Verificar tipo
      if (value !== undefined && paramSchema.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== paramSchema.type) {
          throw new Error(`Parameter '${paramName}' must be of type ${paramSchema.type}, got ${actualType}`);
        }
      }

      // Verificar enum
      if (value !== undefined && paramSchema.enum && !paramSchema.enum.includes(value)) {
        throw new Error(`Parameter '${paramName}' must be one of: ${paramSchema.enum.join(', ')}`);
      }
    }
  }

  /**
   * Timeout helper
   * @private
   */
  _timeout(ms, skillName) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Skill '${skillName}' execution timed out after ${ms}ms`)), ms)
    );
  }

  /**
   * Descarrega uma skill da memória
   * @param {string} skillName - Nome da skill
   * @returns {Promise<boolean>} Success status
   */
  async unloadSkill(skillName) {
    if (!this.loadedSkills.has(skillName)) {
      return false;
    }

    const skillCache = this.loadedSkills.get(skillName);

    try {
      // Notificar Python para liberar recursos
      await this.pythonBridge.execute('skills.executor', 'unload_skill', {
        skill_name: skillName,
        handle: skillCache.pythonHandle
      });

      // Remover do cache
      this.loadedSkills.delete(skillName);
      return true;
    } catch (error) {
      throw new Error(`Failed to unload skill '${skillName}': ${error.message}`);
    }
  }

  /**
   * Descarrega todas as skills
   * @returns {Promise<number>} Número de skills descarregadas
   */
  async unloadAllSkills() {
    const skillNames = Array.from(this.loadedSkills.keys());
    let unloaded = 0;

    for (const skillName of skillNames) {
      try {
        await this.unloadSkill(skillName);
        unloaded++;
      } catch (error) {
        console.error(`Failed to unload ${skillName}:`, error.message);
      }
    }

    return unloaded;
  }

  /**
   * Obtém estatísticas de uso
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      ...this.stats,
      loadedSkills: this.loadedSkills.size,
      runningSkills: this.runningSkills.size,
      totalSkills: this.registry.totalSkills,
      successRate: this.stats.totalExecutions > 0
        ? (this.stats.successfulExecutions / this.stats.totalExecutions * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

module.exports = SkillsManager;
```

**Validação:**
- [ ] Arquivo criado com ~300 linhas
- [ ] Todas as funções documentadas com JSDoc
- [ ] Error handling em todos os métodos
- [ ] Sem erros de ESLint

---

*(Continua na próxima mensagem devido ao limite de caracteres)*
