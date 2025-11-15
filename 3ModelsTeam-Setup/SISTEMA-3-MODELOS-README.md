# 3ModelsTeam - Sistema de Equipe de 3 Modelos

**Sistema Profissional para Desenvolvimento com IA**
**Baseado em:** Power of Ten (NASA/JPL) + AI Coding Assistant Best Practices

---

## VISAO GERAL

Sistema de trabalho em equipe com **3 modelos de IA trabalhando simultaneamente** no mesmo diretório:

- **Model A (Gerente):** Claude Sonnet 4.5 - Planejamento, segurança, alta complexidade, auditoria
- **Model B (Corretor):** Kimi K2 Thinking - Correções de média complexidade com raciocínio profundo
- **Model C (Executor):** Kimi K2 Preview - Execução de 80% das tarefas (média/baixa complexidade)

**Objetivo:** Economizar ~85% dos tokens do Claude Sonnet 4.5, delegando a maioria das tarefas para modelos Kimi.

---

## INSTALACAO RAPIDA

### 1. Instalar Sistema

```powershell
# Navegar para o diretório
cd C:\Users\thiag\Projects\3ModelsTeam

# Executar instalador
.\install-team-system.ps1

# Copiar arquivos de configuração
cp .\kimi\settings-kimi-thinking.json ~/.claude/settings-kimi-thinking.json

# Recarregar perfil
. $PROFILE
```

### 2. Verificar Instalação

```powershell
# Verificar qual modelo está ativo
qual-modelo

# Testar ativação de cada modelo
ativar-model-a
ativar-model-b
ativar-model-c
```

### 3. Abrir 3 Terminais

No VSCode, abra **3 janelas side-by-side**, todas no **mesmo diretório do projeto**:

**Terminal 1 (Esquerda):**
```powershell
ativar-model-a
claude
```

**Terminal 2 (Centro):**
```powershell
ativar-model-b
claude
```

**Terminal 3 (Direita):**
```powershell
ativar-model-c
claude
```

### 4. Iniciar Projeto

Use o comando auxiliar para ver as instruções:

```powershell
# PowerShell
iniciar-projeto-equipe -NomeProjeto "MeuProjeto"
```

Ou no **Terminal 1 (Model A)**, forneça contexto manualmente:

```
Olá Model A! Leia:
- docs/regras/REGRAS-GLOBAIS-MODEL-A.md
- docs/contextos/CONTEXTO-MODEL-A-GERENTE.md

Projeto: [Descreva seu projeto]

Crie PLANNING.md e TASK.md, classifique tarefas e comece.
```

---

## ESTRUTURA DO PROJETO

```
3ModelsTeam/
├── README.md                           # Este arquivo
├── INSTALACAO-SISTEMA-EQUIPE.md       # Guia completo de instalação
├── install-team-system.ps1            # Instalador automático
│
├── docs/
│   ├── contextos/                     # Contexto de cada modelo
│   │   ├── CONTEXTO-MODEL-A-GERENTE.md
│   │   ├── CONTEXTO-MODEL-B-CORRETOR.md
│   │   └── CONTEXTO-MODEL-C-EXECUTOR.md
│   │
│   ├── regras/                        # Regras globais (Power of Ten + AI Coding)
│   │   ├── REGRAS-GLOBAIS-MODEL-A.md
│   │   ├── REGRAS-GLOBAIS-MODEL-B.md
│   │   └── REGRAS-GLOBAIS-MODEL-C.md
│   │
│   ├── templates/                     # Templates de projeto
│   │   ├── TEMPLATE-PLANNING.md
│   │   └── TEMPLATE-TASK.md
│   │
│   ├── tools/                         # Ferramentas Python (guardrails-ai, garak)
│   │   ├── README-TOOLS.md
│   │   ├── GUARDRAILS-AI-SETUP.md
│   │   └── GARAK-SETUP.md
│   │
│   └── workflow/                      # Documentação de workflow
│       └── WORKFLOW-EQUIPE-3-MODELOS.md
│
├── kimi/                              # Documentação Kimi K2
│   ├── README-KIMI-K2-MOONSHOT.md
│   ├── README-KIMI-K2-THINKING.md
│   ├── COMPARACAO-MODELOS-KIMI.md
│   ├── QUICK-START-KIMI-THINKING.md
│   ├── settings-kimi-thinking.json
│   ├── start-kimi-thinking.ps1
│   ├── start-kimi-thinking.bat
│   └── test-kimi-thinking.py
│
└── legacy/                            # Arquivos de referência histórica
```

---

## DOCUMENTACAO PRINCIPAL

### Guias de Instalação

- **[INSTALACAO-SISTEMA-EQUIPE.md](./INSTALACAO-SISTEMA-EQUIPE.md)** - Guia completo de instalação e uso

### Contextos dos Modelos

- **[CONTEXTO-MODEL-A-GERENTE.md](./docs/contextos/CONTEXTO-MODEL-A-GERENTE.md)** - Papel do Gerente
- **[CONTEXTO-MODEL-B-CORRETOR.md](./docs/contextos/CONTEXTO-MODEL-B-CORRETOR.md)** - Papel do Corretor
- **[CONTEXTO-MODEL-C-EXECUTOR.md](./docs/contextos/CONTEXTO-MODEL-C-EXECUTOR.md)** - Papel do Executor

### Regras Globais

- **[REGRAS-GLOBAIS-MODEL-A.md](./docs/regras/REGRAS-GLOBAIS-MODEL-A.md)** - Power of Ten + AI Coding
- **[REGRAS-GLOBAIS-MODEL-B.md](./docs/regras/REGRAS-GLOBAIS-MODEL-B.md)** - Regras para correções
- **[REGRAS-GLOBAIS-MODEL-C.md](./docs/regras/REGRAS-GLOBAIS-MODEL-C.md)** - Regras para execução

### Templates

- **[TEMPLATE-PLANNING.md](./docs/templates/TEMPLATE-PLANNING.md)** - Template de planejamento
- **[TEMPLATE-TASK.md](./docs/templates/TEMPLATE-TASK.md)** - Template de gestão de tarefas

### Ferramentas de Segurança

- **[README-TOOLS.md](./docs/tools/README-TOOLS.md)** - Visão geral das ferramentas
- **[GUARDRAILS-AI-SETUP.md](./docs/tools/GUARDRAILS-AI-SETUP.md)** - Setup e uso do guardrails-ai
- **[GARAK-SETUP.md](./docs/tools/GARAK-SETUP.md)** - Setup e uso do garak

### Workflow

- **[WORKFLOW-EQUIPE-3-MODELOS.md](./docs/workflow/WORKFLOW-EQUIPE-3-MODELOS.md)** - Workflow completo

---

## ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────┐
│              MESMO DIRETÓRIO DO PROJETO                 │
│    (3 Terminais PowerShell em 3 Janelas VSCode)        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │ Terminal 1: MODEL A - GERENTE                 │    │
│  │ Claude Sonnet 4.5                             │    │
│  │                                                │    │
│  │ - Planejamento (taskmaster)                   │    │
│  │ - Segurança (guardrails-ai)                   │    │
│  │ - Tarefas ALTA complexidade                   │    │
│  │ - Auditoria (Garak)                           │    │
│  └───────────────────────────────────────────────┘    │
│                        ↓                               │
│  ┌───────────────────────────────────────────────┐    │
│  │ Terminal 2: MODEL B - CORRETOR                │    │
│  │ Kimi K2 Thinking                              │    │
│  │                                                │    │
│  │ - Correções MÉDIA complexidade                │    │
│  │ - Melhorias pós-auditoria                     │    │
│  │ - Raciocínio profundo (reasoning_content)     │    │
│  └───────────────────────────────────────────────┘    │
│                        ↓                               │
│  ┌───────────────────────────────────────────────┐    │
│  │ Terminal 3: MODEL C - EXECUTOR                │    │
│  │ Kimi K2 Preview                               │    │
│  │                                                │    │
│  │ - Tarefas MÉDIA e BAIXA complexidade          │    │
│  │ - Correções BAIXA complexidade                │    │
│  │ - Raciocínio estruturado (sequential-thinking)│    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         └────────────────────┴────────────────────┘
              Memória Compartilhada
           (cipher-mcp + byterover-mcp)
```

---

## ECONOMIA DE TOKENS

### Projeto Típico (100 tarefas)

```
┌─────────────────────────────────────┐
│ SEM Sistema:                        │
│ 100 tarefas × Sonnet = 100% tokens  │
│                                      │
│ COM Sistema:                        │
│ 10 ALTA × Sonnet     = 10% tokens   │
│ 50 MÉDIA × Kimi C    = 0% tokens*   │
│ 40 BAIXA × Kimi C    = 0% tokens*   │
│                                      │
│ Correções:                          │
│ 10 erros × Kimi B    = 0% tokens*   │
│                                      │
│ Auditoria:                          │
│ 1 final × Sonnet     = 1% tokens    │
│                                      │
│ Total Sonnet: ~15% dos tokens       │
│ Economia: ~85%                      │
└─────────────────────────────────────┘

* Usa créditos Moonshot AI, não Anthropic
```

---

## COMANDOS UTEIS

### Verificar Modelo Ativo
```powershell
qual-modelo
```

### Alternar Entre Modelos (Mesmo Terminal)
```powershell
# Mudar para Gerente
ativar-model-a
claude

# Mudar para Corretor
ativar-model-b
claude

# Mudar para Executor
ativar-model-c
claude
```

### Copiar Templates para Novo Projeto
```powershell
# Navegar para diretório do projeto
cd C:\Users\thiag\Projects\MeuProjeto

# Copiar templates
cp C:\Users\thiag\Projects\3ModelsTeam\docs\templates\TEMPLATE-PLANNING.md .\PLANNING.md
cp C:\Users\thiag\Projects\3ModelsTeam\docs\templates\TEMPLATE-TASK.md .\TASK.md
```

---

## WORKFLOW BASICO

### Fase 1: Planejamento (Model A)
1. Model A analisa projeto
2. Classifica tarefas: ALTA / MÉDIA / BAIXA
3. Cria PLANNING.md e TASK.md
4. Compartilha via cipher-mcp

### Fase 2: Execução Paralela
- **Model A:** Executa tarefas ALTA
- **Model C:** Executa tarefas MÉDIA e BAIXA

### Fase 3: Correção (Model B)
- Model C encontra erro MÉDIA → Model A delega para Model B
- Model B analisa com `reasoning_content`
- Model B corrige e testa
- Model B envia relatório

### Fase 4: Auditoria (Model A)
- Model A aciona Garak
- Analisa relatórios de B e C
- Aprova ou delega melhorias

---

## POWER OF TEN (NASA/JPL)

Sistema baseado nas 10 regras da NASA/JPL para código crítico:

1. Controle de fluxo simples (sem goto, recursão)
2. Loops com limite superior fixo
3. Sem alocação dinâmica após inicialização
4. Funções <= 60 linhas
5. Mínimo 2 assertions por função
6. Menor escopo possível para variáveis
7. Verificar retornos de funções
8. Preprocessador limitado
9. Restrição de ponteiros
10. Zero warnings (compiladores + analyzers)

**Aplicação:** Model A aplica todas regras em tarefas ALTA complexidade.

---

## MCPs E FERRAMENTAS

### Model A (Gerente)

**MCPs:**
- taskmaster-mcp
- sequential-thinking
- cipher-mcp-v0.3.0
- byterover-mcp

**Ferramentas Python:**
- guardrails-ai (validação de segurança)
- garak (auditoria de LLMs)

### Model B (Corretor)

**MCPs:**
- sequential-thinking
- cipher-mcp-v0.3.0
- byterover-mcp

### Model C (Executor)

**MCPs:**
- sequential-thinking
- cipher-mcp-v0.3.0
- byterover-mcp

**Nota:** guardrails-ai e garak são ferramentas Python standalone, NÃO são MCPs.
Ver documentação em `docs/tools/`

---

## TROUBLESHOOTING

### Problema: "qual-modelo" não funciona
```powershell
. $PROFILE
```

### Problema: Modelos não ativam
```powershell
# Verificar arquivos de configuração
ls ~/.claude/settings-*.json

# Se faltando, copiar do diretório kimi
cp .\kimi\settings-kimi-thinking.json ~/.claude/settings-kimi-thinking.json
```

### Problema: "ativar-model-b" falha com PathNotFound
```powershell
# Copiar arquivo de configuração
cp .\kimi\settings-kimi-thinking.json ~/.claude/settings-kimi-thinking.json
```

### Problema: "iniciar-projeto-equipe" pede parâmetro
```powershell
# Usar com nome do projeto
iniciar-projeto-equipe -NomeProjeto "MeuProjeto"
```

### Problema: MCPs não funcionam
```powershell
ls ~/.claude/mcp-scripts/
```

---

## FAQ

**Por que 3 modelos simultâneos?**
- Economia de ~85% dos tokens do Claude Sonnet 4.5

**Por que não usar GLM?**
- Performance do Kimi K2 é superior

**Posso usar menos de 3 terminais?**
- Sim, mas perde eficiência

**E se Model B não resolver?**
- Model A intervém (garantia de qualidade)

**Os arquivos têm emojis?**
- Não. Apenas acentos e caracteres especiais para clareza

---

## LINKS UTEIS

- **Moonshot Platform:** https://platform.moonshot.ai/
- **Documentação Kimi K2:** https://platform.moonshot.ai/docs
- **Claude Code Docs:** https://docs.claude.com/en/docs/claude-code

---

## CHANGELOG

### v3.1 (2025-11-14)
**Correções e Melhorias na Instalação:**
- Documentado passo de cópia de `settings-kimi-thinking.json` após instalação
- Adicionado troubleshooting para erro PathNotFound ao ativar Model B
- Documentado uso correto de `iniciar-projeto-equipe -NomeProjeto "Nome"`
- Melhorado README com comandos de verificação de instalação
- Adicionadas instruções para testar ativação de todos os modelos

### v3.0 (2025-11-14)
- Sistema completo de 3 modelos
- Regras globais baseadas em Power of Ten
- Templates de PLANNING.md e TASK.md
- Documentação reorganizada
- Pasta renomeada para 3ModelsTeam

### v2.0 (2025-11-13)
- Adição de Kimi K2 Thinking
- Sistema de troca de modelos

### v1.0 (2025-11-10)
- Sistema inicial de múltiplas contas

---

**Sistema criado para desenvolvimento profissional com qualidade NASA/JPL!**

**Versão:** 3.1
**Data:** 2025-11-14
**Status:** Totalmente funcional e testado
