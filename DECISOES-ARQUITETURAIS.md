# 🏗️ Decisões Arquiteturais - MCP Code Execution Framework v2

**Documento de Decisões Críticas - Sonnet 4.5**
**Data**: 2025-11-12

---

## 🎯 Objetivo

Garantir que **TODOS os MCPs sejam obrigatoriamente acionados através do framework**, independente do terminal ou projeto onde o Claude Code está rodando.

---

## 🏛️ DECISÃO ARQUITETURAL #1: Arquitetura Híbrida

### Escolha
**Arquitetura Híbrida: JavaScript (Core) + Python (Wrappers)**

### Justificativa

**Por que não apenas JavaScript?**
- ❌ VRSEN provou que Python + IPython é mais eficaz para Progressive Disclosure
- ❌ Ecossistema MCP tem forte presença Python
- ❌ Difícil simular comportamento de imports dinâmicos em JS puro

**Por que não apenas Python?**
- ❌ Framework existente é JavaScript (~3000 LOC)
- ❌ Reescrever tudo seria desperdício
- ❌ Nossos benefícios (Privacy, Sandbox) já estão implementados em JS

**Solução: Híbrido**
```
┌─────────────────────────────────────────┐
│         Core Framework (JavaScript)      │
│  - Privacy Tokenizer                     │
│  - Secure Sandbox                        │
│  - Skills Manager                        │
│  - Data Filter                           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Python Execution Layer (Novo)        │
│  - IPython Interpreter                   │
│  - MCP Wrappers (importáveis)            │
│  - Progressive Disclosure                │
└─────────────────────────────────────────┘
```

### Implementação

**Camada de Integração**: `core/python-bridge.js`
- Executa código Python via child_process
- Passa contexto JS → Python
- Retorna resultados Python → JS
- Mantém estado entre execuções (IPython-like)

---

## 🏛️ DECISÃO ARQUITETURAL #2: Sistema de Obrigatoriedade

### Escolha
**Tripla Camada de Enforcement**

### Justificativa

Um único método pode falhar. Três camadas garantem robustez:

#### Camada 1: Configuração Claude Code (Preferencial)
```json
// .claude/mcp-config.json
{
  "mcpExecutionMode": "framework-only",
  "frameworkPath": "./core/index.js",
  "blockDirectMCPCalls": true
}
```

**Benefício**: Claude Code nativamente bloqueia MCPs diretos
**Limitação**: Depende de suporte do Claude Code (pode não existir)

#### Camada 2: Interceptação Global (Fallback)
```javascript
// core/mcp-interceptor.js
class MCPInterceptor {
  static enforce() {
    // Sobrescreve globals
    const mcpTools = ['apify', 'guardrails', 'chrome-devtools', ...];

    mcpTools.forEach(tool => {
      global[tool] = new Proxy({}, {
        get() {
          throw new MCPDirectCallError(tool);
        }
      });
    });
  }
}
```

**Benefício**: Funciona sempre, não depende de configuração externa
**Limitação**: Precisa conhecer nomes de MCPs antecipadamente

#### Camada 3: Documentação Mandatória (Last Resort)
```markdown
// LEITURA-OBRIGATORIA.md (sempre no root do projeto)
# ⚠️ REGRA CRÍTICA: MCPs VIA FRAMEWORK APENAS
[Instruções claras para agentes]
```

**Benefício**: Agentes Claude leem documentação automaticamente
**Limitação**: Agente pode "esquecer" em conversas longas

### Decisão Final
**Implementar as 3 camadas simultaneamente** para máxima garantia.

---

## 🏛️ DECISÃO ARQUITETURAL #3: MCPs como Módulos

### Escolha
**MCPs como módulos Python importáveis + Registry JavaScript**

### Estrutura
```
servers/
├── registry.js              # Registry JS (auto-discovery)
├── __init__.py              # Python package
│
├── security/
│   ├── __init__.py
│   ├── guardrails/
│   │   ├── __init__.py
│   │   ├── validate.py     # async def validate(...)
│   │   ├── scan.py         # async def scan(...)
│   │   └── _internal.py    # Implementação interna
│   └── garak/
│       └── ...
│
├── scraping/
│   ├── __init__.py
│   ├── apify/
│   │   ├── __init__.py
│   │   ├── run_actor.py    # async def run_actor(...)
│   │   ├── get_dataset.py  # async def get_dataset(...)
│   │   └── _client.py      # Cliente MCP interno
│   └── crawl4ai/
│       └── ...
│
└── [outras categorias...]
```

### Padrão de Wrapper

**Cada função Python faz**:
1. Recebe parâmetros tipados
2. Chama MCP real via subprocess/npx
3. Aplica Data Filter (opcionalmente)
4. Aplica Privacy Tokenizer (opcionalmente)
5. Retorna resultado processado

**Exemplo**:
```python
# servers/scraping/apify/run_actor.py
import asyncio
import json
from typing import Dict, List, Optional
from ...core.bridge import call_js_function

async def run_actor(
    actor_id: str,
    input_data: Optional[Dict] = None,
    apply_filter: bool = True,
    protect_pii: bool = True
) -> Dict:
    """
    Executa Apify actor através do MCP

    Args:
        actor_id: ID do actor no Apify
        input_data: Dados de entrada para o actor
        apply_filter: Aplicar Data Filter
        protect_pii: Aplicar Privacy Tokenizer

    Returns:
        Resultados processados
    """
    # 1. Chama MCP real
    result = await _call_apify_mcp(actor_id, input_data)

    # 2. Aplica Data Filter (JS)
    if apply_filter:
        result = await call_js_function('dataFilter.optimize', result)

    # 3. Aplica Privacy Tokenizer (JS)
    if protect_pii:
        result = await call_js_function('privacyTokenizer.tokenize', result)

    return result
```

### Benefícios
✅ Progressive Disclosure: import sob demanda
✅ Tipagem: Python type hints
✅ Reuso: Framework JS (filter, privacy) via bridge
✅ Testável: Cada função é testável isoladamente

---

## 🏛️ DECISÃO ARQUITETURAL #4: Progressive Disclosure

### Escolha
**Discovery em 3 Níveis**

### Implementação

#### Nível 1: Metadata (sempre carregado)
```python
# servers/__init__.py
REGISTRY = {
    "security": ["guardrails", "garak", "cipher"],
    "scraping": ["apify", "crawl4ai"],
    # ... 25+ MCPs
}
```
**Tokens**: ~500 tokens (só nomes)

#### Nível 2: Signatures (sob demanda)
```python
# Quando agente quer saber o que um MCP faz
from servers.scraping.apify import __all__, __doc__

print(__all__)  # ['run_actor', 'get_dataset', ...]
print(__doc__)  # Documentação do módulo
```
**Tokens**: ~2K tokens (por MCP)

#### Nível 3: Implementation (execução)
```python
# Quando agente realmente vai usar
from servers.scraping.apify import run_actor

result = await run_actor("web-scraper", {...})
```
**Tokens**: Só código executado, não definições

### Economia
```
Antes: 150K tokens (25 MCPs × 6K tokens cada)
Depois:
  - Nível 1: 500 tokens (sempre)
  - Nível 2: 2K tokens (quando consulta)
  - Nível 3: 0 tokens (só executa)

Uso típico: 500 + (2K × 3 MCPs usados) = 6.5K tokens
Economia: 95.7%! (150K → 6.5K)
```

---

## 🏛️ DECISÃO ARQUITETURAL #5: Bridge JavaScript ↔ Python

### Escolha
**Comunicação Bidirecional via IPC (Inter-Process Communication)**

### Arquitetura

```javascript
// core/python-bridge.js
class PythonBridge {
  constructor() {
    this.pythonProcess = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  async initialize() {
    // Inicia processo Python persistente
    this.pythonProcess = spawn('python', [
      '-u',  // Unbuffered
      path.join(__dirname, 'python_server.py')
    ]);

    // Escuta respostas
    this.pythonProcess.stdout.on('data', this._handleResponse);
  }

  async execute(code, context = {}) {
    const requestId = this.requestId++;

    // Envia para Python
    const request = {
      id: requestId,
      type: 'execute',
      code,
      context: {
        ...context,
        // Injeta funções JS disponíveis
        jsCallbacks: {
          dataFilter: this._makeJSCallback('dataFilter'),
          privacyTokenizer: this._makeJSCallback('privacyTokenizer'),
          sandbox: this._makeJSCallback('sandbox')
        }
      }
    };

    this.pythonProcess.stdin.write(JSON.stringify(request) + '\n');

    // Aguarda resposta
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
    });
  }

  _makeJSCallback(moduleName) {
    return async (method, ...args) => {
      // Chama função JS do Python
      const module = this.framework[moduleName];
      return await module[method](...args);
    };
  }
}
```

```python
# core/python_server.py
import sys
import json
import asyncio

class JSBridge:
    """Ponte para chamar funções JS do Python"""

    def __init__(self, callbacks):
        self.callbacks = callbacks

    async def call(self, module, method, *args):
        """Chama função JS"""
        # Envia request para JS
        request = {
            'type': 'js_call',
            'module': module,
            'method': method,
            'args': args
        }
        print(json.dumps(request), flush=True)

        # Aguarda resposta
        response = await self._wait_response()
        return response['result']

async def main():
    while True:
        line = sys.stdin.readline()
        if not line:
            break

        request = json.loads(line)

        if request['type'] == 'execute':
            # Executa código Python
            result = await execute_code(
                request['code'],
                request['context']
            )

            # Retorna para JS
            response = {
                'id': request['id'],
                'result': result
            }
            print(json.dumps(response), flush=True)

if __name__ == '__main__':
    asyncio.run(main())
```

### Benefícios
✅ Processo Python persistente (não recria a cada chamada)
✅ Comunicação bidirecional (Python chama JS, JS chama Python)
✅ Estado mantido (variáveis Python sobrevivem entre execuções)
✅ Assíncrono (não bloqueia)

---

## 🏛️ DECISÃO ARQUITETURAL #6: Formato de Uso

### Escolha
**API Unificada com Auto-Routing**

### Como o Agente Usa

```javascript
import framework from './core/index.js';

await framework.initialize();

// Agente escreve código Python dentro de string
const result = await framework.execute(`
  # Progressive Disclosure Nível 1: Ver categorias
  from servers import REGISTRY
  print(REGISTRY.keys())  # ['security', 'scraping', ...]

  # Progressive Disclosure Nível 2: Ver funções disponíveis
  from servers.scraping import apify
  print(apify.__all__)  # ['run_actor', 'get_dataset']

  # Progressive Disclosure Nível 3: Usar
  result = await apify.run_actor('web-scraper', {
    'startUrls': ['https://example.com']
  })

  # Data Filter já aplicado automaticamente
  # Privacy Tokenizer já aplicado automaticamente

  return result
`);

// result já vem filtrado e com PII tokenizado
console.log(result);
```

### Auto-Routing

O framework detecta automaticamente:
- Se é código Python → Executa via Python Bridge
- Se é código JavaScript → Executa via Sandbox JS existente

```javascript
// core/index.js
async execute(code, context = {}) {
  // Auto-detecta linguagem
  const language = this._detectLanguage(code);

  if (language === 'python') {
    return await this.pythonBridge.execute(code, context);
  } else {
    return await this.sandbox.execute(code, context);
  }
}
```

---

## 📊 RESUMO DAS DECISÕES

| Decisão | Escolha | Complexidade | Executado Por |
|---------|---------|--------------|---------------|
| **1. Arquitetura** | Híbrido JS+Python | 🔴 ALTA | ✅ Sonnet 4.5 |
| **2. Obrigatoriedade** | Tripla camada | 🔴 ALTA | ✅ Sonnet 4.5 |
| **3. MCPs como Módulos** | Python importável | 🔴 ALTA | ✅ Sonnet 4.5 |
| **4. Progressive Disclosure** | 3 níveis | 🔴 ALTA | ✅ Sonnet 4.5 |
| **5. Bridge JS↔Python** | IPC bidirecional | 🔴 ALTA | ✅ Sonnet 4.5 |
| **6. API Unificada** | Auto-routing | 🔴 ALTA | ✅ Sonnet 4.5 |

---

## 🎯 PRÓXIMOS PASSOS

### ✅ Concluído (Sonnet 4.5)
- [x] Análise do repositório VRSEN
- [x] Definição de arquitetura híbrida
- [x] Projeto do sistema de obrigatoriedade
- [x] Especificação do padrão de módulos
- [x] Design do Progressive Disclosure
- [x] Arquitetura da bridge JS↔Python

### 🔄 Em Andamento (Sonnet 4.5)
- [ ] Implementar `core/python-bridge.js` (PRÓXIMA)
- [ ] Implementar `core/python_server.py` (PRÓXIMA)
- [ ] Implementar `core/mcp-interceptor.js` (PRÓXIMA)

### ⏳ Aguardando (Kimi K2)
- [ ] Criar estrutura de pastas `servers/` (MÉDIA)
- [ ] Implementar 25+ wrappers Python (MÉDIA)
- [ ] Criar testes unitários (MÉDIA)
- [ ] Escrever documentação (BAIXA)

---

**Documento mantido por**: Sonnet 4.5 (Arquiteto)
**Última atualização**: 2025-11-12
**Status**: Decisões arquiteturais APROVADAS - Pronto para implementação
