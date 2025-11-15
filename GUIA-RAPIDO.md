# 🚀 Guia Rápido - MCP Code Execution Framework

## 📋 Índice

1. [Instalação](#instalação)
2. [Conceitos Principais](#conceitos-principais)
3. [Uso Básico](#uso-básico)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Benefícios](#benefícios)

## 🔧 Instalação

```bash
cd C:\Users\thiag\.claude\mcp-code-execution
install.bat
```

## 💡 Conceitos Principais

### 1. Carregamento Sob Demanda

Ao invés de carregar todos os MCPs no contexto:

```javascript
// ❌ Tradicional: Carrega tudo antecipadamente
// Ocupa muito contexto mesmo sem usar

// ✅ Code Execution: Carrega apenas quando necessário
const apify = await mcp.load('scraping', 'apify');
```

### 2. Filtragem Local

Processa dados NO ambiente de execução, não no contexto do modelo:

```javascript
// Retorna 10.000 resultados
const results = await apify.runActor();

// ❌ Tradicional: Passa tudo para o modelo (150k tokens)
return results;

// ✅ Code Execution: Filtra localmente (2k tokens)
const filtered = filter.where(results, r => r.price < 100);
const optimized = filter.selectFields(filtered, ['title', 'price']);
return filter.limit(optimized, 10);  // Apenas 10 items ao modelo!
```

### 3. Proteção de Privacidade

Tokeniza dados sensíveis automaticamente:

```javascript
// Dados com PII
const data = { email: 'john@example.com', phone: '+1-555-1234' };

// Tokeniza
const { tokenized } = privacy.tokenize(data);
// → { email: 'TOKEN_EMAIL_a1b2c3', phone: 'TOKEN_PHONE_d4e5f6' }

// MCPs processam tokens, modelo nunca vê dados reais
```

### 4. Skills Persistentes

Salva código reutilizável:

```javascript
// Cria skill
await framework.saveAsSkill('my-scraper', {
  description: 'Web scraper otimizado',
  scripts: { 'main.js': '...' }
});

// Reutiliza depois
const skill = await skills.load('my-scraper');
const result = await skill.execute(context);
```

## 🎯 Uso Básico

### Inicializar Framework

```javascript
import framework from './core/index.js';

await framework.initialize();
```

### Executar Código

```javascript
const code = `
  // Carrega MCP
  const chrome = await mcp.load('dev', 'chromeDevtools');

  // Usa MCP
  const info = chrome.info();

  return info;
`;

const result = await framework.execute(code);
```

## 📚 Exemplos Práticos

### Exemplo 1: Listar MCPs por Capacidade

```javascript
const code = `
  const securityMCPs = mcp.findByCapability('security-testing');

  console.log('MCPs de segurança:');
  securityMCPs.forEach(m => console.log('  •', m.name));

  return securityMCPs;
`;

await framework.execute(code);
```

### Exemplo 2: Web Scraping Eficiente

```javascript
const code = `
  // Carrega scraper
  const apify = await mcp.load('scraping', 'apify');

  // Scraping (retorna muitos dados)
  const results = await apify.execute(['scrape', 'https://example.com']);

  // Filtra localmente - 98.7% de redução!
  const filtered = filter.where(results, r => r.status === 'success');
  const optimized = filter.selectFields(filtered, ['title', 'url']);
  const final = filter.limit(optimized, 10);

  return final;
`;

await framework.execute(code);
```

### Exemplo 3: Proteção de Dados Sensíveis

```javascript
const code = `
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-1234',
    ssn: '123-45-6789'
  };

  // Detecta PII
  const pii = privacy.detectPII(JSON.stringify(userData));
  console.log('PII detectado:', pii);

  // Tokeniza
  const { tokenized } = privacy.tokenize(userData);

  // Dados tokenizados seguros para processar
  return tokenized;
`;

await framework.execute(code);
```

### Exemplo 4: Criar e Usar Skill

```javascript
// Criar skill
await framework.saveAsSkill('data-cleaner', {
  description: 'Limpa e otimiza dados',
  tags: ['data', 'optimization'],
  scripts: {
    'main.js': `
      module.exports = async function(data) {
        const cleaned = filter.where(data, item => item.valid);
        const optimized = filter.selectFields(cleaned, ['id', 'value']);
        return filter.limit(optimized, 100);
      };
    `
  }
});

// Usar skill
const code = `
  const skill = await skills.load('data-cleaner');
  const cleaned = await skill.execute(largeDataset);
  return cleaned;
`;

await framework.execute(code);
```

## 🎁 Benefícios

### 1. Eficiência de Tokens

- **Antes**: 150.000 tokens para processar 10.000 resultados
- **Depois**: 2.000 tokens (apenas 10 resultados filtrados)
- **Economia**: 98.7%

### 2. Privacidade

- PII nunca passa pelo modelo
- Tokenização reversível quando necessário
- Conformidade com GDPR/LGPD

### 3. Performance

- Carregamento sob demanda
- Processamento local de dados
- Menos latência e custos

### 4. Manutenibilidade

- Código reutilizável em Skills
- Versionamento de lógica
- Progressive Disclosure

## 🔥 Executar Exemplos

```bash
# Exemplo básico
npm run example:basic

# Filtragem de dados
npm run example:filtering

# Proteção de privacidade
npm run example:privacy

# Sistema de skills
npm run example:skills

# Integração completa
npm run example:complete

# Todos os exemplos
npm run example:all
```

## 📊 Estatísticas

```javascript
const stats = framework.getStats();

console.log(stats);
// {
//   mcps: { totalAvailable: 25, loaded: 3, ... },
//   sandbox: { total: 10, successRate: '100%', ... },
//   tokenizer: { totalTokens: 50, ... },
//   skills: { totalSkills: 5, ... }
// }
```

## 🆘 Troubleshooting

### MCPs não carregam

Verifique se os scripts .bat existem:

```bash
dir C:\Users\thiag\.claude\mcp-scripts\
```

### Erro de dependências

Reinstale:

```bash
npm install
```

### Variáveis de ambiente

Configure tokens necessários:

```bash
SET APIFY_API_TOKEN=seu_token
SET CLICKUP_API_TOKEN=seu_token
```

## 📚 Recursos

- [README.md](./README.md) - Documentação completa
- [Exemplos](./examples/) - Código de exemplo
- [Artigo Original](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

## 🎯 Próximos Passos

1. Execute os exemplos para entender o framework
2. Crie suas próprias skills
3. Integre com seus MCPs existentes
4. Meça a economia de tokens em seus casos de uso

---

**Desenvolvido com base nos artigos da Anthropic sobre Code Execution e Agent Skills**
