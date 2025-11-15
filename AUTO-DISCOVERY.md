# 🔍 Auto-Discovery de MCPs

## O Problema Resolvido

**Antes**: Quando você configurava um novo MCP globalmente, tinha que:
1. Adicionar manualmente em `servers/index.js`
2. Especificar categoria, capacidades, versão
3. Reiniciar o framework

**Agora**: O framework **detecta automaticamente** qualquer novo MCP!

---

## 🎯 Como Funciona

### Fontes de Descoberta

O sistema varre **duas fontes** automaticamente:

#### 1. Scripts `.bat`
```
C:\Users\thiag\.claude\mcp-scripts\*.bat
```

Detecta todos os arquivos `.bat` e extrai:
- Nome do MCP
- Versão (se presente no nome)
- Descrição (de comentários REM)
- Path completo

#### 2. Configuração Global
```
C:\Users\thiag\.claude\mcp_servers.json
```

Lê a configuração oficial e extrai:
- Comandos e argumentos
- Variáveis de ambiente necessárias
- Configurações específicas

### Inferência Inteligente

O sistema **infere automaticamente**:

1. **Categoria** baseada em palavras-chave:
   - `security`, `guardrail`, `garak` → **Security**
   - `scraping`, `crawl`, `apify` → **Scraping**
   - `chrome`, `browser`, `ui` → **Dev**
   - `workflow`, `n8n` → **Workflows**
   - E mais...

2. **Capacidades** baseadas em contexto:
   - `security scan` → `['security-testing', 'vulnerability-scan']`
   - `web scraping` → `['web-scraping', 'data-extraction']`
   - `chrome devtools` → `['browser-automation', 'debugging']`
   - E mais...

3. **Variáveis de Ambiente** necessárias:
   - Detecta `APIFY_API_TOKEN`, `CLICKUP_API_TOKEN`, etc.

---

## 🚀 Uso

### Modo Automático (Padrão)

```javascript
import framework from './core/index.js';

// Auto-discovery ativado por padrão
await framework.initialize();

// MCPs descobertos automaticamente!
const result = await framework.execute(`
  const categories = mcp.listCategories();
  return categories;
`);
```

### Modo Manual (Discovery Explícito)

```bash
# Executa discovery e mostra detalhes
npm run discover
```

Isso gera:
- `discovered/mcps-discovered.json` - Lista completa em JSON
- `discovered/registry-auto-generated.js` - Registry JavaScript

### Desativar Auto-Discovery

```javascript
import framework from './core/index.js';

// Desativa auto-discovery (usa registry estático)
const customFramework = new MCPCodeExecutionFramework({
  autoDiscover: false
});

await customFramework.initialize();
```

---

## 📋 Exemplo: Adicionar Novo MCP

### Cenário

Você acabou de instalar um novo MCP chamado `ollama-mcp`:

```bash
cd C:\Users\thiag\.claude\mcp-scripts
# Cria novo script
echo @echo off > ollama-mcp.bat
echo npx -y @modelcontextprotocol/server-ollama >> ollama-mcp.bat
```

### O Que Acontece

1. **Próxima vez que o framework iniciar**:
   ```javascript
   await framework.initialize();
   // 🔍 Descobrindo MCPs...
   // ✓ ollama-mcp detectado!
   ```

2. **Categorização automática**:
   - Nome: `ollama-mcp`
   - Categoria inferida: `integrations` (tem "API" implícito)
   - Capacidades: `['api-integration', 'llm-integration']`

3. **Disponível imediatamente**:
   ```javascript
   const ollama = await mcp.load('integrations', 'ollama-mcp');
   ```

**Zero configuração manual!**

---

## 🎯 Exemplos de Inferência

### Exemplo 1: Security MCP

```
Arquivo: garak-security-scanner.bat
Conteúdo: REM NVIDIA Garak - Scanner de vulnerabilidades LLM

Detectado:
✓ Nome: "Garak Security Scanner"
✓ Categoria: security (palavra "security" encontrada)
✓ Capacidades: ['security-testing', 'vulnerability-scan', 'llm-security']
✓ Versão: Extraída do conteúdo se presente
```

### Exemplo 2: Scraping MCP

```
Arquivo: apify-mcp-v0.5.1.bat
Conteúdo: npx -y @apify/mcp-server

Detectado:
✓ Nome: "Apify MCP"
✓ Versão: "0.5.1" (do nome do arquivo)
✓ Categoria: scraping (palavra "apify" conhecida)
✓ Capacidades: ['web-scraping', 'automation', 'data-extraction']
```

### Exemplo 3: Dev Tools MCP

```
Arquivo: chrome-devtools-mcp-v0.10.0.bat

Detectado:
✓ Nome: "Chrome Devtools MCP"
✓ Versão: "0.10.0"
✓ Categoria: dev (palavra "chrome" e "devtools")
✓ Capacidades: ['browser-automation', 'debugging', 'console-access']
```

---

## 📊 Categorias Suportadas

| Categoria | Palavras-chave | Exemplos |
|-----------|----------------|----------|
| **security** | security, guardrail, garak, cipher, auth | Guardrails, Garak, Cipher |
| **scraping** | scraping, crawl, apify, spider | Apify, Crawl4AI |
| **dev** | dev, chrome, browser, ui, component | Chrome DevTools, shadcn |
| **workflows** | workflow, n8n, automation, flow | n8n MCP |
| **utils** | test, click, context, sequential | ClickUp, TestSprite |
| **integrations** | api, database, supabase, vapi | Supabase, VAPI |
| **infrastructure** | docker, container, k8s, deploy | Docker Gateway |

---

## 🔧 Personalização

### Adicionar Palavras-chave Customizadas

Edite `core/auto-discovery.js`:

```javascript
_inferCategory(mcp) {
  const keywords = {
    // Adicione suas próprias categorias
    myCategory: ['palavra1', 'palavra2'],
    // ...
  };
}
```

### Adicionar Capacidades Customizadas

```javascript
_inferCapabilities(mcp) {
  const capabilityMap = {
    // Adicione seus próprios mapeamentos
    'minha-palavra': ['capacidade1', 'capacidade2'],
    // ...
  };
}
```

---

## 📈 Estatísticas

Após discovery, veja estatísticas:

```javascript
const stats = framework.autoDiscovery.getStats();

console.log(stats);
// {
//   total: 25,
//   byCategory: {
//     security: 3,
//     scraping: 2,
//     dev: 4,
//     ...
//   },
//   bySource: {
//     script: 15,
//     config: 8,
//     both: 2
//   }
// }
```

---

## 🎁 Benefícios

### 1. Zero Configuração Manual

```
❌ Antes:
1. Instala MCP
2. Edita servers/index.js manualmente
3. Adiciona categoria, capacidades, etc
4. Reinicia framework

✅ Agora:
1. Instala MCP
2. Reinicia framework
   (detecta automaticamente!)
```

### 2. Sempre Atualizado

```
✓ Novos MCPs detectados automaticamente
✓ Versões atualizadas reconhecidas
✓ Configurações sincronizadas
```

### 3. Inferência Inteligente

```
✓ Categorização automática
✓ Detecção de capacidades
✓ Identificação de env vars
```

### 4. Múltiplas Fontes

```
✓ Scripts .bat
✓ mcp_servers.json
✓ Mesclagem inteligente
```

---

## 🧪 Testar Auto-Discovery

### Teste 1: Ver MCPs Descobertos

```bash
npm run example:autodiscovery
```

### Teste 2: Discovery Manual

```bash
npm run discover
```

### Teste 3: Programático

```javascript
import MCPAutoDiscovery from './core/auto-discovery.js';

const discovery = new MCPAutoDiscovery();
const discovered = await discovery.discover();

console.log(discovered);
```

---

## ❓ FAQ

### P: E se a categorização estiver errada?

**R**: Você pode:
1. Adicionar palavra-chave customizada
2. Usar registry estático manual
3. Sobrescrever após discovery

### P: Como forçar re-discovery?

**R**: Reinicie o framework:
```javascript
await framework.cleanup();
await framework.initialize(); // Re-descobre
```

### P: Posso misturar manual + auto?

**R**: Sim! MCPs manuais em `servers/index.js` têm prioridade sobre auto-descobertos.

### P: Discovery tem overhead?

**R**: Mínimo (~100-200ms). Ocorre apenas na inicialização.

---

## 🎯 Resumo

**Antes do Auto-Discovery:**
- 😓 Configuração manual trabalhosa
- 😓 Propenso a erros
- 😓 Precisa editar código
- 😓 Desatualizado facilmente

**Depois do Auto-Discovery:**
- ✅ Automático e inteligente
- ✅ Sempre atualizado
- ✅ Zero configuração
- ✅ Detecta tudo automaticamente

---

## 📚 Comandos Úteis

```bash
# Ver todos os MCPs descobertos
npm run discover

# Executar exemplo de auto-discovery
npm run example:autodiscovery

# Executar todos os exemplos (incluindo auto-discovery)
npm run example:all
```

---

## 🎉 Conclusão

Com **Auto-Discovery**, você nunca mais precisa configurar MCPs manualmente!

Instale novos MCPs globalmente e o framework:
- ✅ Detecta automaticamente
- ✅ Categoriza inteligentemente
- ✅ Infere capacidades
- ✅ Detecta env vars necessárias

**Tudo isso sem editar uma linha de código!**

---

**Desenvolvido especificamente para seus MCPs globais**
**100% automático, 0% configuração**
