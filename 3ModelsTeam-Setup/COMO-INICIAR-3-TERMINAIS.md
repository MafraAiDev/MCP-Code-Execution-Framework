# COMO INICIAR OS 3 TERMINAIS - MCP-CODE-EXECUTION-FRAMEWORK

**Projeto:** MCP-Code-Execution-Framework (75% concluído → 100%)
**Sistema:** 3ModelsTeam
**Data:** 2025-11-14

---

## COMANDOS PARA OS 3 TERMINAIS

### TERMINAL 1 (Model A - Claude Sonnet 4.5 - GERENTE)

```powershell
# 1. Ativar Model A
.\ativar-model-a.ps1

# 2. Iniciar Claude
claude
```

**Depois que o Claude iniciar, cole:**

```
Ola Model A! Sou o Gerente deste projeto.

CONTEXTO:
- Projeto: MCP-Code-Execution-Framework
- Status: 75% concluído
- Objetivo: Concluir 100% usando sistema 3ModelsTeam

LEIA:
- docs/contextos/CONTEXTO-MODEL-A-GERENTE.md
- docs/regras/REGRAS-GLOBAIS-MODEL-A.md
- README.md
- STATUS-PROJETO.md
- VISAO-GERAL.md
- LEITURA-OBRIGATORIA.md

TAREFAS:
1. Analise o projeto e identifique o que falta para 100%
2. Leia PLANNING.md e TASK.md
3. Classifique tarefas pendentes: ALTA / MEDIA / BAIXA complexidade
4. Crie plano de distribuicao para Model B e Model C
5. Compartilhe via cipher-mcp (se disponivel)

Ative os MCPs:
- taskmaster-mcp (se disponivel)
- sequential-thinking (se disponivel)
- guardrails-ai (se disponivel)

Comece analisando o projeto.
```

---

### TERMINAL 2 (Model B - Kimi K2 Thinking - CORRETOR)

```powershell
# 1. Ativar Model B
.\ativar-model-b.ps1

# 2. Iniciar Claude
claude
```

**Depois que o Claude iniciar, cole:**

```
Ola Model B! Sou o Corretor deste projeto.

CONTEXTO:
- Projeto: MCP-Code-Execution-Framework
- Papel: Correcoes de MEDIA complexidade
- Model A (Gerente) esta coordenando

LEIA:
- docs/contextos/CONTEXTO-MODEL-B-CORRETOR.md
- docs/regras/REGRAS-GLOBAIS-MODEL-B.md

AGUARDANDO:
Delegacoes de correcao do Model A...

IMPORTANTE:
- Use reasoning_content para raciocinio profundo
- Relate erros MEDIA complexidade para Model A
- Redigir relatorios detalhados
```

---

### TERMINAL 3 (Model C - Kimi K2 Preview - EXECUTOR)

```powershell
# 1. Ativar Model C
.\ativar-model-c.ps1

# 2. Iniciar Claude
claude
```

**Depois que o Claude iniciar, cole:**

```
Ola Model C! Sou o Executor deste projeto.

CONTEXTO:
- Projeto: MCP-Code-Execution-Framework
- Papel: Executar tarefas MEDIA e BAIXA complexidade
- Model A (Gerente) esta coordenando

LEIA:
- docs/contextos/CONTEXTO-MODEL-C-EXECUTOR.md
- docs/regras/REGRAS-GLOBAIS-MODEL-C.md

AGUARDANDO:
Delegacao de tarefas do Model A...

IMPORTANTE:
- Executar tarefas MEDIA e BAIXA complexidade
- Corrigir erros de BAIXA complexidade
- Relatar erros MEDIA para Model A
- Usar sequential-thinking (via MCP se disponivel)
```

---

## WORKFLOW

### Fase 1: Inicializacao (5 min)

1. **Terminal 1:** Model A analisa projeto e cria plano
2. **Terminal 2 e 3:** Aguardam instrucoes

### Fase 2: Distribuicao de Tarefas (10 min)

- Model A classifica tarefas pendentes
- Model A delega para B e C conforme complexidade

### Fase 3: Execucao Paralela

- **Model A:** Tarefas ALTA complexidade
- **Model C:** Tarefas MEDIA e BAIXA complexidade
- **Model B:** Correcoes MEDIA complexidade

### Fase 4: Auditoria Final

- Model A audita tudo com Garak (se disponivel)
- Model B implementa melhorias pos-auditoria
- Model A aprova 100% conclusao

---

## VERIFICAR MODELO ATIVO

```powershell
# Em qualquer terminal
.\qual-modelo.ps1
```

---

## ESTRUTURA DO PROJETO

```
MCP-Code-Execution-Framework/
├── ativar-model-a.ps1/.bat    # Scripts de ativacao
├── ativar-model-b.ps1/.bat
├── ativar-model-c.ps1/.bat
├── qual-modelo.ps1
│
├── PLANNING.md                 # Planejamento (Model A)
├── TASK.md                     # Tarefas (Model A)
│
├── docs/                       # Documentacao 3ModelsTeam
│   ├── contextos/
│   ├── regras/
│   ├── templates/
│   └── workflow/
│
├── 3ModelsTeam-Setup/          # Setup e guias
│   ├── INSTALACAO-SISTEMA-EQUIPE.md
│   ├── COMO-ATIVAR-MODELOS.md
│   └── ...
│
├── core/                       # Codigo do projeto
├── servers/                    # Servidores MCP
└── README.md                   # README do projeto
```

---

## ECONOMIA DE TOKENS

**Objetivo:** Concluir os 25% restantes economizando ~85% dos tokens Sonnet:

```
25% do projeto = ~30 tarefas estimadas

SEM 3ModelsTeam:
30 tarefas × Sonnet = 100% tokens Sonnet

COM 3ModelsTeam:
5 ALTA × Sonnet     = ~17% tokens Sonnet
15 MEDIA × Kimi C   = 0% tokens Sonnet
10 BAIXA × Kimi C   = 0% tokens Sonnet

Total Sonnet: ~17% dos tokens
Economia: ~83%
```

---

## TROUBLESHOOTING

### Problema: Script nao reconhecido

```powershell
# Certifique-se de estar no diretorio correto
cd C:\Users\thiag\Projects\MCP-Code-Execution-Framework

# Execute com .\
.\ativar-model-a.ps1
```

### Problema: Model B pede autenticacao Anthropic

Ja foi corrigido! O arquivo `~/.claude/settings-kimi-thinking.json` foi atualizado.

### Problema: Qual modelo esta ativo?

```powershell
.\qual-modelo.ps1
```

---

## PROXIMOS PASSOS

1. **Abra os 3 terminais** neste diretorio
2. **Execute os comandos** acima em cada terminal
3. **Cole os contextos** quando Claude iniciar
4. **Deixe Model A coordenar** o trabalho

---

**Boa sorte com a conclusao do MCP-Code-Execution-Framework!**

**Versao:** 1.0
**Data:** 2025-11-14
