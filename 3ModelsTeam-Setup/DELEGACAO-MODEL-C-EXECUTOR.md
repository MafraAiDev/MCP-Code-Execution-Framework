# 🎯 DELEGAÇÃO PARA MODEL C (EXECUTOR)

**Data**: 2025-11-14
**Gerente**: Model A (Claude Sonnet 4.5)
**Executor**: Model C (Kimi K2 Preview)
**Projeto**: MCP Code Execution Framework (75% → 100%)

---

## 📋 RESUMO EXECUTIVO

Você receberá **4 tarefas** classificadas como MÉDIA e BAIXA complexidade para concluir o projeto MCP Code Execution Framework de 75% para 100%.

**Prazo**: 6-8 horas
**Complexidade**: MÉDIA (3 tarefas) + BAIXA (1 tarefa)

---

## 🎯 TAREFA 1: IMPLEMENTAR MCPs REAIS (MÉDIA)

### Contexto
Atualmente os MCPs retornam dados mockados (placeholders). Você deve implementar chamadas reais via subprocess.

### Arquivos a Modificar

#### 1.1 Apify Run Actor
**Arquivo**: `servers/scraping/apify/run_actor.py`

**Atual**:
```python
async def run_actor(actor_name, config=None):
    return {'mock': 'data'}  # PLACEHOLDER
```

**Implementar**:
```python
import subprocess
import json
import asyncio

async def run_actor(actor_name, config=None):
    """
    Executa um Apify Actor via MCP real

    Args:
        actor_name: Nome do actor (ex: 'apify/web-scraper')
        config: Configuração do actor (dict)

    Returns:
        dict: Resultado do actor executado
    """
    try:
        # 1. Monta comando para npx
        cmd = ['npx', '-y', '@apify/mcp-server', 'run-actor', actor_name]

        if config:
            cmd.extend(['--config', json.dumps(config)])

        # 2. Executa via subprocess
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        # 3. Valida resultado
        if process.returncode != 0:
            raise Exception(f"Apify error: {stderr.decode()}")

        # 4. Parseia JSON
        result = json.loads(stdout.decode())

        # 5. Retorna dados
        return result

    except Exception as e:
        return {
            'error': str(e),
            'actor': actor_name,
            'success': False
        }
```

#### 1.2 Apify Get Dataset
**Arquivo**: `servers/scraping/apify/get_dataset.py`

Implementar de forma similar ao run_actor, usando:
```bash
npx -y @apify/mcp-server get-dataset <dataset_id>
```

#### 1.3 Guardrails Validate
**Arquivo**: `servers/security/guardrails/validate.py`

**Implementar**:
```python
import subprocess
import json
import asyncio

async def validate(prompt, config=None):
    """
    Valida prompt usando Guardrails AI

    Args:
        prompt: Texto a validar
        config: Configuração de validação

    Returns:
        dict: Resultado da validação
    """
    try:
        cmd = ['npx', '-y', 'guardrails-ai', 'validate']

        # Cria arquivo temporário com prompt
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write(prompt)
            temp_path = f.name

        cmd.extend(['--input', temp_path])

        if config:
            cmd.extend(['--config', json.dumps(config)])

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        # Limpa arquivo temporário
        import os
        os.unlink(temp_path)

        if process.returncode != 0:
            raise Exception(f"Guardrails error: {stderr.decode()}")

        result = json.loads(stdout.decode())
        return result

    except Exception as e:
        return {
            'error': str(e),
            'valid': False
        }
```

#### 1.4 Guardrails Scan
**Arquivo**: `servers/security/guardrails/scan.py`

Implementar de forma similar ao validate.

### Critérios de Sucesso - Tarefa 1
- [ ] 4 funções implementadas (run_actor, get_dataset, validate, scan)
- [ ] Chamadas reais via subprocess funcionando
- [ ] Error handling robusto
- [ ] Código assíncrono (async/await)
- [ ] JSON parsing correto
- [ ] Testes manuais passando

### Entrega Esperada
- 4 arquivos .py modificados
- ~200 LOC total
- Código testado e funcional

---

## 🎯 TAREFA 2: CRIAR TESTES UNITÁRIOS (BAIXA)

### Contexto
O projeto tem apenas um teste básico. Criar suite completa de testes unitários.

### Estrutura a Criar

```
test/
├── unit/
│   ├── test-python-bridge.js
│   ├── test-mcp-interceptor.js
│   └── test-core-index.js
├── integration/
│   ├── test-js-python-comm.js
│   ├── test-mcp-execution.js
│   └── test-enforcement.js
└── package.json (configurar scripts de teste)
```

### Implementação

#### 2.1 test/unit/test-python-bridge.js
```javascript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import PythonBridge from '../../core/python-bridge.js';

describe('PythonBridge', () => {
  let bridge;

  beforeAll(async () => {
    bridge = new PythonBridge();
    await bridge.initialize();
  });

  afterAll(async () => {
    await bridge.cleanup();
  });

  it('should initialize successfully', () => {
    expect(bridge.initialized).toBe(true);
  });

  it('should execute simple Python code', async () => {
    const result = await bridge.execute('2 + 2');
    expect(result).toBe(4);
  });

  it('should handle Python errors gracefully', async () => {
    await expect(bridge.execute('1/0')).rejects.toThrow();
  });

  it('should import Python modules', async () => {
    const servers = await bridge.import('servers');
    expect(servers).toBeDefined();
  });

  it('should evaluate Python expressions', async () => {
    const result = await bridge.eval('[1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });

  it('should maintain state between executions', async () => {
    await bridge.execute('x = 42');
    const result = await bridge.eval('x');
    expect(result).toBe(42);
  });

  it('should handle async Python code', async () => {
    const code = `
import asyncio
async def test():
    return 'async works'
await test()
    `;
    const result = await bridge.execute(code);
    expect(result).toBe('async works');
  });

  it('should capture Python stdout', async () => {
    const result = await bridge.execute('print("hello"); "done"');
    expect(result).toBe('done');
  });

  it('should support Python callbacks to JS', async () => {
    // Testar callback se implementado
    expect(bridge.callbackHandler).toBeDefined();
  });

  it('should provide accurate stats', () => {
    const stats = bridge.getStats();
    expect(stats.totalRequestsSent).toBeGreaterThan(0);
    expect(stats.initialized).toBe(true);
  });
});
```

#### 2.2 test/unit/test-mcp-interceptor.js
Similar structure, testar:
- Enforcement ativado/desativado
- Interceptação de MCPs
- Contagem de tentativas bloqueadas
- Estatísticas

#### 2.3 test/unit/test-core-index.js
Similar structure, testar:
- Inicialização framework
- Auto-routing Python/JS
- Execução de código
- Relatórios
- Cleanup

### Critérios de Sucesso - Tarefa 2
- [ ] 30+ testes unitários criados
- [ ] Estrutura test/ organizada
- [ ] package.json com scripts de teste
- [ ] Todos os testes passando
- [ ] Cobertura >70%

### Entrega Esperada
- 6 arquivos de teste
- ~400 LOC de testes
- Scripts npm configurados

---

## 🎯 TAREFA 3: CRIAR TESTES DE INTEGRAÇÃO (MÉDIA)

### Contexto
Testes que validam a integração entre componentes.

### Implementação

#### 3.1 test/integration/test-mcp-execution.js
```javascript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import framework from '../../core/index.js';

describe('MCP Execution Flow', () => {
  beforeAll(async () => {
    await framework.initialize();
  });

  afterAll(async () => {
    await framework.cleanup();
  });

  it('should execute Apify MCP via framework', async () => {
    const code = `
from servers.scraping.apify import run_actor

result = await run_actor('apify/web-scraper', {
    'startUrls': ['https://example.com']
})
result
    `;

    const result = await framework.execute(code);
    expect(result).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('should execute Guardrails MCP via framework', async () => {
    const code = `
from servers.security.guardrails import validate

result = await validate('test prompt', {'strict': True})
result
    `;

    const result = await framework.execute(code);
    expect(result).toBeDefined();
  });

  it('should enforce Progressive Disclosure', async () => {
    const code = `
from servers import list_categories
categories = list_categories()
categories
    `;

    const result = await framework.execute(code);
    expect(result).toContain('security');
    expect(result).toContain('scraping');
  });
});
```

#### 3.2 test/integration/test-enforcement.js
Testar:
- Bloqueio de chamadas diretas
- Enforcement obrigatório
- Mensagens educativas

#### 3.3 test/integration/test-js-python-comm.js
Testar:
- Comunicação bidirecional
- Callbacks JS do Python
- Serialização de dados complexos

### Critérios de Sucesso - Tarefa 3
- [ ] 15+ testes de integração
- [ ] Fluxo completo JS → Python → MCP testado
- [ ] Enforcement validado
- [ ] Todos os testes passando

### Entrega Esperada
- 3 arquivos de teste de integração
- ~200 LOC
- Validação de fluxos críticos

---

## 🎯 TAREFA 4: CRIAR DOCUMENTAÇÃO COMPLETA (MÉDIA)

### Contexto
Criar documentação profissional para usuários finais.

### Arquivos a Criar

#### 4.1 QUICKSTART.md
```markdown
# 🚀 Guia de Início Rápido

## Instalação

### Pré-requisitos
- Node.js ≥ 18
- Python ≥ 3.9
- npm ou yarn

### Passo 1: Clonar e Instalar
\`\`\`bash
git clone <repo>
cd MCP-Code-Execution-Framework
npm install
\`\`\`

### Passo 2: Configurar Ambiente
\`\`\`bash
cp .env.example .env
# Editar .env com suas credenciais
\`\`\`

### Passo 3: Primeiro Uso
\`\`\`javascript
import framework from './core/index.js';

await framework.initialize();

const result = await framework.execute(\`
from servers.scraping.apify import run_actor
result = await run_actor('apify/web-scraper')
result
\`);

console.log(result);
\`\`\`

## Exemplos Práticos

### Web Scraping com Apify
[Exemplo completo...]

### Validação de Segurança
[Exemplo completo...]

### Proteção de PII
[Exemplo completo...]
```

#### 4.2 API.md
Documentar TODOS os métodos:
- `framework.initialize(options)`
- `framework.execute(code, context)`
- `framework.importPython(module)`
- `framework.evalPython(expression)`
- `framework.getStats()`
- `framework.generateReport()`
- `framework.cleanup()`

Para cada método:
- Descrição
- Parâmetros
- Retorno
- Exemplo de uso
- Notas importantes

#### 4.3 TROUBLESHOOTING.md
```markdown
# 🔧 Troubleshooting

## Erros Comuns

### Error: Python process not initialized
**Causa**: Framework não inicializado
**Solução**:
\`\`\`javascript
await framework.initialize();
\`\`\`

### Error: MCPDirectCallError
**Causa**: Tentativa de chamar MCP diretamente
**Solução**: Use framework.execute()
[Exemplo...]

### Error: Module 'servers' not found
**Causa**: PYTHONPATH incorreto
**Solução**: [Passos...]

[Mais 10+ erros comuns...]
```

#### 4.4 examples/
Criar 5 exemplos funcionais:
- `01-hello-world.js`
- `02-web-scraping.js`
- `03-security-validation.js`
- `04-privacy-protection.js`
- `05-complete-workflow.js`

Cada exemplo deve:
- Ter comentários explicativos
- Ser executável standalone
- Demonstrar uma funcionalidade específica
- Incluir error handling

### Critérios de Sucesso - Tarefa 4
- [ ] QUICKSTART.md completo e claro
- [ ] API.md com todos os métodos documentados
- [ ] TROUBLESHOOTING.md com 10+ soluções
- [ ] 5 exemplos funcionando
- [ ] README.md atualizado
- [ ] Linguagem clara e profissional

### Entrega Esperada
- 3 arquivos .md de documentação
- 5 arquivos de exemplo .js
- ~800 linhas de documentação
- Todos exemplos testados

---

## 📊 RESUMO DAS ENTREGAS

| Tarefa | Complexidade | Arquivos | LOC | Prioridade |
|--------|--------------|----------|-----|------------|
| 1. MCPs Reais | MÉDIA | 4 .py | 200 | 🔴 ALTA |
| 2. Testes Unitários | BAIXA | 6 .js | 400 | 🟡 MÉDIA |
| 3. Testes Integração | MÉDIA | 3 .js | 200 | 🟡 MÉDIA |
| 4. Documentação | MÉDIA | 8 .md/.js | 800 | 🟢 BAIXA |
| **TOTAL** | - | **21 arquivos** | **1600 LOC** | - |

---

## 🎯 CRITÉRIOS DE SUCESSO GERAIS

### Qualidade do Código
- [ ] Código limpo e bem comentado
- [ ] Error handling robusto
- [ ] Async/await onde apropriado
- [ ] Sem hardcoded values
- [ ] Segue padrões do projeto

### Funcionalidade
- [ ] Todos os testes passando
- [ ] MCPs reais funcionando
- [ ] Exemplos executáveis
- [ ] Zero erros em execução

### Documentação
- [ ] Linguagem clara e objetiva
- [ ] Exemplos práticos
- [ ] Sem typos ou erros
- [ ] Formatação consistente

---

## 📝 FORMATO DE RELATÓRIO

Após concluir CADA tarefa, envie relatório neste formato:

```markdown
# RELATÓRIO - TAREFA [N]

**Executor**: Model C (Kimi K2 Preview)
**Data**: [Data]
**Tarefa**: [Nome da tarefa]

## Status
- [X] Concluída
- [ ] Parcialmente concluída
- [ ] Bloqueada

## Entregas
- [X] Arquivo 1 (caminho completo)
- [X] Arquivo 2 (caminho completo)
- ...

## Testes Realizados
- [X] Teste manual de run_actor: OK
- [X] Teste manual de validate: OK
- ...

## Problemas Encontrados
- [Se houver, listar aqui]

## Observações
- [Qualquer nota importante]

## Pronto para Auditoria
- [X] SIM / [ ] NÃO
```

---

## ⚠️ REGRAS IMPORTANTES

### SEMPRE FAÇA
1. ✅ Teste manualmente antes de entregar
2. ✅ Comente código complexo
3. ✅ Siga padrões existentes no projeto
4. ✅ Use async/await para operações assíncronas
5. ✅ Trate erros adequadamente

### NUNCA FAÇA
1. ❌ Envie código sem testar
2. ❌ Copie código sem entender
3. ❌ Ignore erros ou warnings
4. ❌ Use valores hardcoded
5. ❌ Pule documentação de código

### EM CASO DE BLOQUEIO
1. Tente resolver por 15 minutos
2. Documente o problema claramente
3. Envie relatório com status "Bloqueada"
4. Passe para próxima tarefa se possível
5. Aguarde orientação do Model A (gerente)

---

## 📞 COMUNICAÇÃO

### Reportar Progresso
- A cada tarefa concluída: Envie relatório
- Se encontrar bloqueio: Reporte imediatamente
- Dúvidas: Pergunte antes de implementar errado

### Solicitar Revisão
Quando terminar TODAS as tarefas:
```markdown
**DELEGAÇÃO PARA MODEL A (GERENTE):**

Tarefas 1-4 concluídas. Aguardando auditoria.

**Entregas**:
- 21 arquivos criados/modificados
- ~1600 LOC implementadas
- Todos os testes passando

**Próxima Ação**: Auditoria e aprovação
```

---

## 🎯 OBJETIVO FINAL

Levar o projeto de **75% → 95%** com:
- ✅ MCPs reais funcionando
- ✅ Suite completa de testes
- ✅ Documentação profissional
- ✅ Código pronto para produção

**Os 5% finais (95% → 100%) serão feitos pelo Model A após auditoria.**

---

**Boa sorte, Model C! Conte com o suporte do gerente sempre que necessário.**

**Data de Início**: 2025-11-14
**Deadline**: 2025-11-15 (24-48h)
