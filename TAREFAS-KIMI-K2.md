# 🎯 TAREFAS PARA KIMI K2

**Executor**: Kimi K2
**Arquiteto**: Sonnet 4.5
**Data**: 2025-11-12

---

## 📋 INSTRUÇÕES IMPORTANTES

### Seu Papel (Kimi K2)
Você é o **EXECUTOR** de tarefas de MÉDIA e BAIXA complexidade.

**DEVE fazer**:
✅ Executar tarefas conforme especificações
✅ Seguir templates fornecidos
✅ Testar implementações
✅ Reportar erros usando formato padrão
✅ Pensar estruturadamente apenas em tarefas Média/Baixa

**NÃO DEVE fazer**:
❌ Tomar decisões arquiteturais
❌ Modificar design planejado pelo Sonnet
❌ Implementar tarefas de ALTA complexidade
❌ Planejar novas funcionalidades

### Formato de Relatório de Erro

```markdown
## ❌ RELATÓRIO DE ERRO - Tarefa #[número]

### Status
[CONCLUÍDA COM ERROS / BLOQUEADA / PRECISA RECLASSIFICAÇÃO]

### O Que Foi Feito
[Lista do que foi implementado]

### Erro Encontrado
```
[Stack trace ou descrição detalhada]
```

### Tentativas de Correção
1. Tentativa 1: [descrição] → [resultado]
2. Tentativa 2: [descrição] → [resultado]

### Análise (apenas se MÉDIA complexidade)
[Breve análise do que pode estar causando]

### Solicitação
[O que você precisa do Sonnet 4.5]
```

---

## 🟡 TAREFA #1 - MÉDIA Complexidade

### Título
**Criar estrutura de diretórios para servers/ com módulos Python**

### Contexto
O Sonnet 4.5 definiu que MCPs devem ser organizados como módulos Python importáveis. Você precisa criar a estrutura de pastas e arquivos `__init__.py` conforme especificação.

### Especificação Técnica

#### Estrutura Esperada
```
servers/
├── __init__.py                    # Registry Python principal
├── README.md                      # Documentação da estrutura
│
├── security/
│   ├── __init__.py               # Exports da categoria
│   ├── guardrails/
│   │   ├── __init__.py           # Exports do MCP
│   │   ├── validate.py           # Função validate()
│   │   └── _client.py            # Cliente interno (não exportado)
│   ├── garak/
│   │   ├── __init__.py
│   │   ├── scan.py
│   │   └── _client.py
│   └── cipher/
│       ├── __init__.py
│       ├── encrypt.py
│       ├── decrypt.py
│       └── _client.py
│
├── scraping/
│   ├── __init__.py
│   ├── apify/
│   │   ├── __init__.py
│   │   ├── run_actor.py
│   │   ├── get_dataset.py
│   │   └── _client.py
│   └── crawl4ai/
│       ├── __init__.py
│       ├── crawl.py
│       └── _client.py
│
├── dev/
│   ├── __init__.py
│   ├── chrome_devtools/
│   │   └── ...
│   ├── magic/
│   │   └── ...
│   ├── react_bits/
│   │   └── ...
│   └── shadcn/
│       └── ...
│
├── workflows/
│   ├── __init__.py
│   └── n8n/
│       └── ...
│
├── utils/
│   ├── __init__.py
│   ├── clickup/
│   │   └── ...
│   ├── context7/
│   │   └── ...
│   ├── sequential_thinking/
│   │   └── ...
│   └── testsprite/
│       └── ...
│
├── integrations/
│   ├── __init__.py
│   ├── supabase/
│   │   └── ...
│   ├── dinastia_api/
│   │   └── ...
│   └── vapi/
│       └── ...
│
└── infrastructure/
    ├── __init__.py
    └── docker_gateway/
        └── ...
```

#### Template: `servers/__init__.py`

```python
"""
MCP Servers - Módulos Python Importáveis

Organização de 25+ MCPs em categorias
Progressive Disclosure: Import sob demanda
"""

# Registry de categorias
CATEGORIES = {
    'security': ['guardrails', 'garak', 'cipher'],
    'scraping': ['apify', 'crawl4ai'],
    'dev': ['chrome_devtools', 'magic', 'react_bits', 'shadcn'],
    'workflows': ['n8n'],
    'utils': ['clickup', 'context7', 'sequential_thinking', 'testsprite'],
    'integrations': ['supabase', 'dinastia_api', 'vapi'],
    'infrastructure': ['docker_gateway']
}

# Metadata completo
REGISTRY = {
    'security': {
        'guardrails': {
            'name': 'Guardrails AI',
            'version': '0.6.7',
            'description': 'LLM validation and security guardrails',
            'functions': ['validate', 'scan']
        },
        'garak': {
            'name': 'NVIDIA Garak',
            'version': '0.13.1',
            'description': 'LLM vulnerability scanner',
            'functions': ['scan', 'report']
        },
        'cipher': {
            'name': 'Cipher',
            'version': '0.3.0',
            'description': 'Encryption and decryption for LLMs',
            'functions': ['encrypt', 'decrypt']
        }
    },
    'scraping': {
        'apify': {
            'name': 'Apify',
            'version': '0.5.1',
            'description': 'Web scraping and automation',
            'functions': ['run_actor', 'get_dataset']
        },
        'crawl4ai': {
            'name': 'Crawl4AI',
            'version': 'latest',
            'description': 'AI-powered web crawling',
            'functions': ['crawl', 'extract']
        }
    },
    # ... adicione outras categorias
}

def list_categories():
    """Lista todas as categorias de MCPs"""
    return list(CATEGORIES.keys())

def list_mcps(category=None):
    """Lista MCPs de uma categoria ou todos"""
    if category:
        return CATEGORIES.get(category, [])
    return CATEGORIES

def get_mcp_info(category, mcp_name):
    """Obtém informações de um MCP específico"""
    return REGISTRY.get(category, {}).get(mcp_name)

__all__ = ['CATEGORIES', 'REGISTRY', 'list_categories', 'list_mcps', 'get_mcp_info']
```

#### Template: `servers/[categoria]/__init__.py`

```python
"""
[Categoria] MCPs

[Descrição da categoria]
"""

from . import [mcp1], [mcp2], [mcp3]

__all__ = ['[mcp1]', '[mcp2]', '[mcp3]']
```

**Exemplo para security**:
```python
"""
Security MCPs

Ferramentas de segurança, validação e proteção para LLMs
"""

from . import guardrails, garak, cipher

__all__ = ['guardrails', 'garak', 'cipher']
```

#### Template: `servers/[categoria]/[mcp]/__init__.py`

```python
"""
[Nome do MCP]

[Descrição]

Exemplo de uso:
    from servers.[categoria].[mcp] import [funcao]

    result = await [funcao](...)
"""

from .[arquivo1] import [funcao1]
from .[arquivo2] import [funcao2]

__all__ = ['[funcao1]', '[funcao2]']

# Metadata
__version__ = '[versão]'
__description__ = '[descrição]'
```

#### Template: `servers/README.md`

```markdown
# MCP Servers - Módulos Python

## Estrutura

MCPs organizados como módulos Python importáveis para Progressive Disclosure.

## Categorias

- **security/**: Segurança e validação (Guardrails, Garak, Cipher)
- **scraping/**: Web scraping (Apify, Crawl4AI)
- **dev/**: Ferramentas de desenvolvimento
- **workflows/**: Automação de workflows
- **utils/**: Utilitários diversos
- **integrations/**: Integrações externas
- **infrastructure/**: Infraestrutura e containers

## Uso

```python
# Level 1: Ver categorias
from servers import list_categories
print(list_categories())

# Level 2: Ver MCPs de uma categoria
from servers import list_mcps
print(list_mcps('scraping'))

# Level 3: Importar e usar
from servers.scraping.apify import run_actor
result = await run_actor('web-scraper', {...})
```

## Convenções

- Arquivos privados começam com `_` (ex: `_client.py`)
- Cada MCP tem seu próprio diretório
- Funções públicas exportadas via `__init__.py`
- Funções assíncronas (async/await) quando apropriado
```

### Critérios de Aceitação

- [ ] Estrutura de diretórios criada conforme especificação
- [ ] Todos os `__init__.py` criados
- [ ] REGISTRY em `servers/__init__.py` completo (25+ MCPs)
- [ ] README.md criado e documentado
- [ ] Convenção de nomes seguida (snake_case para Python)

### Comandos de Teste

```bash
# Testar estrutura
python -c "import servers; print(servers.list_categories())"

# Testar imports
python -c "from servers import REGISTRY; print(len(REGISTRY))"

# Validar estrutura
find servers -name "__init__.py" | wc -l  # Deve ter 30+ arquivos
```

### Se Encontrar Erros
Use o formato de RELATÓRIO DE ERRO acima.

---

## 🟢 TAREFA #2 - BAIXA Complexidade

### Título
**Criar arquivo package.json com dependências**

### Contexto
O framework precisa de dependências npm para funcionar (child_process já é nativo, mas precisamos de python-shell).

### Especificação Técnica

#### Arquivo: `package.json`

```json
{
  "name": "mcp-code-execution-framework",
  "version": "2.0.0",
  "description": "Framework para execução eficiente de código com MCP - Híbrido JS + Python",
  "type": "module",
  "main": "core/index.js",
  "scripts": {
    "start": "node core/index.js",
    "test": "node test/run-tests.js",
    "discover": "node core/auto-discovery.js",
    "example:basic": "node examples/01-basic-usage.js",
    "example:filtering": "node examples/02-data-filtering.js",
    "example:privacy": "node examples/03-privacy-protection.js",
    "example:skills": "node examples/04-skills-system.js",
    "example:complete": "node examples/05-complete-integration.js",
    "example:all": "npm run example:basic && npm run example:filtering && npm run example:privacy && npm run example:skills && npm run example:complete"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "code-execution",
    "anthropic",
    "claude",
    "llm",
    "ai",
    "framework"
  ],
  "author": "Sonnet 4.5 (Architect) + Kimi K2 (Executor)",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0",
    "python": ">=3.9.0"
  },
  "dependencies": {
    "python-shell": "^5.0.0"
  },
  "devDependencies": {
    "prettier": "^3.0.0",
    "eslint": "^8.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/seu-usuario/mcp-code-execution-framework"
  }
}
```

### Critérios de Aceitação

- [ ] Arquivo `package.json` criado
- [ ] Todos os campos preenchidos corretamente
- [ ] Scripts npm definidos
- [ ] Dependências listadas

### Comandos de Teste

```bash
# Validar JSON
npm install --dry-run

# Testar scripts
npm run --silent
```

---

## 🟢 TAREFA #3 - BAIXA Complexidade

### Título
**Criar arquivo .env.example com variáveis necessárias**

### Contexto
Alguns MCPs precisam de variáveis de ambiente (API tokens, etc). Criar template.

### Especificação Técnica

#### Arquivo: `.env.example`

```bash
# MCP Code Execution Framework - Environment Variables

# Python
PYTHON_PATH=python3

# MCPs - API Tokens
APIFY_API_TOKEN=your_apify_token_here
CLICKUP_API_TOKEN=your_clickup_token_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here

# Security MCPs
GUARDRAILS_API_KEY=your_guardrails_key_here

# Development
NODE_ENV=development
DEBUG=false

# Framework Settings
MCP_FRAMEWORK_MODE=production
MCP_ENFORCE_FRAMEWORK=true
MCP_TIMEOUT=300000

# Sandbox Settings
SANDBOX_TIMEOUT=30000
SANDBOX_MEMORY_LIMIT=512
SANDBOX_MAX_CONCURRENT=5

# Privacy Settings
PRIVACY_TOKENIZE_PII=true
PRIVACY_LOG_SANITIZE=true
```

### Critérios de Aceitação

- [ ] Arquivo `.env.example` criado
- [ ] Todas as variáveis documentadas
- [ ] Valores de exemplo fornecidos
- [ ] Comentários explicativos

---

## 🟢 TAREFA #4 - BAIXA Complexidade

### Título
**Criar arquivo LEITURA-OBRIGATORIA.md (enforcement via documentação)**

### Contexto
Camada 3 de enforcement: documentação que agentes Claude DEVEM ler.

### Especificação Técnica

#### Arquivo: `LEITURA-OBRIGATORIA.md`

```markdown
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
```

### Critérios de Aceitação

- [ ] Arquivo criado
- [ ] Exemplos claros de uso correto vs incorreto
- [ ] Benefícios explicados
- [ ] Referências para documentação completa

---

## 📊 RESUMO DAS TAREFAS

| # | Complexidade | Título | Status |
|---|--------------|--------|--------|
| 1 | 🟡 MÉDIA | Estrutura servers/ | ⏳ Pendente |
| 2 | 🟢 BAIXA | package.json | ⏳ Pendente |
| 3 | 🟢 BAIXA | .env.example | ⏳ Pendente |
| 4 | 🟢 BAIXA | LEITURA-OBRIGATORIA.md | ⏳ Pendente |

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

1. **Tarefa #2** (package.json) - Mais simples, boa para começar
2. **Tarefa #3** (.env.example) - Rápido
3. **Tarefa #4** (LEITURA-OBRIGATORIA.md) - Documentação
4. **Tarefa #1** (Estrutura servers/) - Mais trabalhosa, por último

---

## ✅ CHECKLIST FINAL

Após completar todas as tarefas, verifique:

- [ ] Todas as 4 tarefas concluídas
- [ ] Testes executados e passando
- [ ] Sem erros de sintaxe
- [ ] Estrutura de arquivos correta
- [ ] Documentação completa

---

**Preparado por**: Sonnet 4.5 (Arquiteto)
**Destinado para**: Kimi K2 (Executor)
**Data**: 2025-11-12
