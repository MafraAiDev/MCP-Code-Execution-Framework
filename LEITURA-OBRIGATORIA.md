# ⚠️ LEITURA OBRIGATÓRIA - REGRAS DE USO DE MCPs

## 🚨 REGRA CRÍTICA

**TODOS os MCPs DEVEM ser acionados através do framework.**

### ❌ NUNCA Faça Isso

```javascript
// ❌ ERRADO - Chama MCP diretamente
const results = await apify.runActor('web-scraper');

// ❌ ERRADO - Import direto do MCP
import apify from '@apify/mcp-server';
```

### ✅ SEMPRE Faça Isso

```javascript
// ✅ CORRETO - Usa framework
import framework from './core/index.js';

await framework.initialize();

const result = await framework.execute(`
  from servers.scraping.apify import run_actor

  data = await run_actor('web-scraper', {
    'startUrls': ['https://example.com']
  })

  return data
`);
```

## 🎯 Por Quê?

### Benefícios do Framework

1. **98.7% de economia de tokens**
   - Antes: 150K tokens (dados brutos)
   - Depois: 2K tokens (dados filtrados)

2. **Proteção de privacidade**
   - PII (emails, telefones, etc) automaticamente tokenizado
   - Dados sensíveis nunca passam pelo modelo

3. **Filtragem local**
   - 10.000 resultados → 10 resultados relevantes
   - Processado localmente, não no contexto do modelo

4. **Execução segura**
   - Sandbox isolado
   - Limites de memória e tempo
   - Sem acesso a recursos perigosos

5. **Progressive Disclosure**
   - Carrega apenas MCPs necessários
   - Economia massiva de contexto
   - Escalável para 100+ MCPs

## 📖 Como Usar

### Passo 1: Inicializar Framework

```javascript
import framework from './core/index.js';
await framework.initialize();
```

### Passo 2: Escrever Código Python

```javascript
const result = await framework.execute(`
  # Level 1: Ver categorias disponíveis
  from servers import list_categories
  print(list_categories())  # ['security', 'scraping', 'dev', ...]

  # Level 2: Ver MCPs de uma categoria
  from servers import list_mcps
  print(list_mcps('scraping'))  # ['apify', 'crawl4ai']

  # Level 3: Importar e usar
  from servers.scraping.apify import run_actor

  result = await run_actor('web-scraper', {
    'startUrls': ['https://example.com'],
    'maxPages': 100
  })

  # Dados já vêm filtrados e com PII protegido!
  return result
`);
```

### Passo 3: Usar Resultado

```javascript
console.log(result);  // Apenas 10 resultados relevantes, ~2K tokens
```

## 🔒 Sistema de Enforcement

O framework possui 3 camadas de proteção:

1. **Interceptação Global**
   - Bloqueio automático de chamadas diretas
   - Erro educativo se tentar

2. **Configuração Claude Code**
   - MCPs só disponíveis via framework
   - Sem acesso direto

3. **Esta Documentação**
   - Você está lendo agora
   - Referência sempre disponível

## 📚 Documentação Completa

- `DECISOES-ARQUITETURAIS.md` - Decisões técnicas
- `IMPLEMENTACAO-COMPLETA.md` - Detalhes de implementação
- `GUIA-RAPIDO.md` - Início rápido
- `VISAO-GERAL.md` - Visão geral do framework

## 🆘 Precisa de Ajuda?

Se você é um agente Claude e está confuso sobre como usar MCPs:

1. SEMPRE leia este documento primeiro
2. Use o framework conforme exemplos acima
3. NUNCA tente chamar MCPs diretamente

Se você é um desenvolvedor humano:

1. Leia a documentação completa
2. Execute os exemplos: `npm run example:all`
3. Consulte `DECISOES-ARQUITETURAIS.md` para entender o design

---

**Este documento é parte do sistema de enforcement obrigatório.**
**Agentes Claude devem ler e seguir estas instruções.**