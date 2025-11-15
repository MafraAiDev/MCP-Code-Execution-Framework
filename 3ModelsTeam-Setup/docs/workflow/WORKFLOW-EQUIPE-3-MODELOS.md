# WORKFLOW - EQUIPE DE 3 MODELOS

**Sistema de Trabalho em Equipe para Mitigar Uso de Tokens**

---

## OBJETIVO DO SISTEMA

Este sistema foi criado para **mitigar o uso de tokens do Claude Sonnet 4.5** e evitar atingir o limite semanal prematuramente.

### Estratégia:
- **Model A (Sonnet 4.5)**: Apenas planejamento, segurança, alta complexidade e auditoria
- **Model B (Kimi Thinking)**: Correções e refinamentos
- **Model C (Kimi Preview)**: Execução da maior parte das tarefas

Dessa forma, **economizamos tokens do Sonnet** delegando a maior parte do trabalho para os modelos Kimi.

---

## ARQUITETURA DA EQUIPE

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
│  │ - Intervenção em casos críticos               │    │
│  └───────────────────────────────────────────────┘    │
│                        ↓                               │
│  ┌───────────────────────────────────────────────┐    │
│  │ Terminal 2: MODEL B - CORRETOR                │    │
│  │ Kimi K2 Thinking                              │    │
│  │                                                │    │
│  │ - Correções MÉDIA complexidade                │    │
│  │ - Melhorias pós-auditoria                     │    │
│  │ - Relatórios detalhados                       │    │
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
│  │ - Relatórios de execução                      │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         └────────────────────┴────────────────────┘
              Memória Compartilhada
           (cipher-mcp + byterover-mcp)
```

---

## DISTRIBUIÇÃO DE RESPONSABILIDADES

### Model A - Gerente (Sonnet 4.5)

| Responsabilidade | MCPs Usados | Quando |
|-----------------|-------------|---------|
| Planejamento | taskmaster | Sempre no início |
| Segurança | guardrails-ai | Durante todo projeto |
| Tarefas ALTA | sequential-thinking | Quando delegadas a ele |
| Auditoria | Garak | Após relatórios de B e C |
| Intervenção | sequential-thinking | Quando B não resolve |

**Economiza tokens:** Não executa tarefas MÉDIA/BAIXA!

### Model B - Corretor (Kimi Thinking)

| Responsabilidade | Quando | Output |
|-----------------|---------|---------|
| Correção MÉDIA | Model C reporta erro | Relatório com reasoning_content |
| Melhorias | Model A identifica em auditoria | Código corrigido |
| Escalação | Não consegue resolver | Relata para Model A |

**Economiza tokens do Sonnet:** Resolve maioria dos erros!

### Model C - Executor (Kimi Preview)

| Responsabilidade | MCP Usado | Quando |
|-----------------|-----------|---------|
| Tarefas MÉDIA | sequential-thinking | Delegadas por Model A |
| Tarefas BAIXA | sequential-thinking | Delegadas por Model A |
| Correção BAIXA | sequential-thinking | Erros que ele encontra |
| Relatórios | - | Após completar tarefas |

**Economiza tokens do Sonnet:** Executa 80% das tarefas!

---

## WORKFLOW COMPLETO DE PROJETO

### Fase 1: Inicialização (Model A)

```
1. Model A ativa MCPs obrigatórios:
   [OK] taskmaster-mcp
   [OK] sequential-thinking
   [OK] guardrails-ai
   [OK] cipher-mcp-v0.3.0
   [OK] byterover-mcp

2. Model A analisa projeto e classifica tarefas:
   [ALTA] → Ele mesmo executará
   [MÉDIA] → Delegar para Model C
   [BAIXA] → Delegar para Model C

3. Model A cria plano usando taskmaster:
   ┌─────────────────────────────────┐
   │ Tarefa 1: [Nome] - ALTA         │ → Model A
   │ Tarefa 2: [Nome] - MÉDIA        │ → Model C
   │ Tarefa 3: [Nome] - BAIXA        │ → Model C
   │ Tarefa 4: [Nome] - MÉDIA        │ → Model C
   │ Tarefa 5: [Nome] - ALTA         │ → Model A
   └─────────────────────────────────┘

4. Model A compartilha plano via cipher-mcp/byterover-mcp
```

### Fase 2: Execução Paralela

```
┌─────────────────────────────────────────────────────┐
│ Model A (Terminal 1)  │ Model C (Terminal 3)        │
├─────────────────────────────────────────────────────┤
│ Executa Tarefa 1      │ Executa Tarefa 2            │
│ (ALTA)                │ (MÉDIA)                     │
│                       │                             │
│ [OK] Concluída        │ [OK] Concluída              │
│                       │                             │
│ Executa Tarefa 5      │ Executa Tarefa 3            │
│ (ALTA)                │ (BAIXA)                     │
│                       │                             │
│ [OK] Concluída        │ [X] ERRO! (BAIXA)           │
│                       │                             │
│                       │ Corrige sozinho             │
│                       │ [OK] Corrigida              │
│                       │                             │
│                       │ Executa Tarefa 4            │
│                       │ (MÉDIA)                     │
│                       │                             │
│                       │ [X] ERRO! (MÉDIA)           │
│                       │                             │
│ ← Recebe relatório    │ Relata erro →               │
│    de erro            │                             │
└─────────────────────────────────────────────────────┘
```

### Fase 3: Correção (Model B)

```
Model A recebe erro MÉDIA de Model C
    ↓
Model A delega correção para Model B
    ↓
┌─────────────────────────────────────────────┐
│ Model B (Terminal 2)                        │
├─────────────────────────────────────────────┤
│ Lê contexto via cipher-mcp                  │
│ Analisa erro (reasoning_content)            │
│ Planeja correção (reasoning_content)        │
│ Implementa correção                         │
│ Testa solução                               │
│ Gera relatório                              │
│ [OK] Correção completa                      │
└─────────────────────────────────────────────┘
    ↓
Model A recebe relatório de correção
```

### Fase 4: Auditoria (Model A)

```
Model C e Model B terminam todas tarefas
    ↓
Enviam relatórios para Model A
    ↓
┌─────────────────────────────────────────────┐
│ Model A (Terminal 1)                        │
├─────────────────────────────────────────────┤
│ Aciona Garak para auditoria                 │
│ Analisa relatório de Model C                │
│ Analisa relatório de Model B                │
│                                              │
│ Encontra problemas?                         │
│ ├─ SIM → Delega correção para Model B      │
│ └─ NÃO → Aprova [OK]                        │
└─────────────────────────────────────────────┘
    ↓
Se houver problemas:
    ↓
Model B implementa melhorias
    ↓
Model A re-audita
    ↓
[OK] Projeto aprovado
```

---

## FLUXOGRAMA DE DECISÃO

```
┌────────────────────────────┐
│ Nova Tarefa                │
└────────────┬───────────────┘
             ↓
    ┌────────────────┐
    │ Classificação? │
    └────┬───────────┘
         │
    ┌────┴────┬────────┬────────┐
    ↓         ↓        ↓
┌───────┐ ┌──────┐ ┌──────┐
│ ALTA  │ │MÉDIA │ │BAIXA │
└───┬───┘ └──┬───┘ └──┬───┘
    ↓        ↓        ↓
┌───────┐ ┌──────┐ ┌──────┐
│Model A│ │Model │ │Model │
│executa│ │C exec│ │C exec│
└───┬───┘ └──┬───┘ └──┬───┘
    ↓        ↓        ↓
 ┌──────┐  ┌──────┐ ┌──────┐
 │Sucesso│ │Erro? │ │Erro? │
 └───┬──┘  └──┬───┘ └──┬───┘
     ↓        │    ┌───┴───┐
  ┌──────┐   │    │Model C│
  │Relata│   │    │corrige│
  │p/ A  │   │    └───┬───┘
  └──┬───┘   │        ↓
     ↓       ↓
   ┌─────────────────────┐
   │ Model B corrige     │
   └──────────┬──────────┘
              ↓
        ┌──────────┐
        │ Resolveu?│
        └─┬─────┬──┘
      SIM │     │ NÃO
          ↓     ↓
      ┌───────┐ ┌─────────┐
      │Model A│ │ Model A │
      │audita │ │intervém │
      └───┬───┘ └────┬────┘
          │          │
          └──────────┴─────────┘
                     ↓
              ┌────────────┐
              │ Tarefa OK  │
              └────────────┘
```

---

## GUIA PRÁTICO: INICIAR PROJETO

### 1. Instalar Sistema (Uma Vez)

```powershell
# Executar instalador
.\install-team-system.ps1

# Recarregar perfil
. $PROFILE
```

### 2. Abrir 3 Terminais PowerShell

No VSCode, abra 3 janelas side-by-side, todas no **mesmo diretório do projeto**:

```
C:\Users\thiag\Projects\MeuProjeto\
```

### 3. Ativar Modelos

**Terminal 1 (Janela Esquerda):**
```powershell
PS C:\Users\thiag\Projects\MeuProjeto> ativar-model-a
========================================
  MODEL A: CLAUDE SONNET 4.5
  Papel: GERENTE
========================================

Agora execute: claude
========================================

PS C:\Users\thiag\Projects\MeuProjeto> claude
```

**Terminal 2 (Janela Centro):**
```powershell
PS C:\Users\thiag\Projects\MeuProjeto> ativar-model-b
========================================
  MODEL B: KIMI K2 THINKING
  Papel: CORRETOR
========================================

Agora execute: claude
========================================

PS C:\Users\thiag\Projects\MeuProjeto> claude
```

**Terminal 3 (Janela Direita):**
```powershell
PS C:\Users\thiag\Projects\MeuProjeto> ativar-model-c
========================================
  MODEL C: KIMI K2 PREVIEW
  Papel: EXECUTOR
========================================

Agora execute: claude
========================================

PS C:\Users\thiag\Projects\MeuProjeto> claude
```

### 4. Iniciar Projeto (Model A)

No **Terminal 1 (Model A)**, forneça o contexto completo:

```
Olá! Sou o Model A (Gerente) deste projeto.

Leia seu contexto em: CONTEXTO-MODEL-A-GERENTE.md

Temos Model B (Corretor) e Model C (Executor) trabalhando em equipe.

Projeto: [Descreva o projeto aqui]

Por favor:
1. Ative os MCPs obrigatórios (taskmaster, guardrails-ai, etc)
2. Analise o projeto e classifique tarefas
3. Crie plano de distribuição
4. Compartilhe via cipher-mcp/byterover-mcp
```

### 5. Model B e Model C Aguardam

**Terminal 2 (Model B):**
```
Olá! Sou o Model B (Corretor).

Leia seu contexto em: CONTEXTO-MODEL-B-CORRETOR.md

Aguardando delegações de correção do Model A...
```

**Terminal 3 (Model C):**
```
Olá! Sou o Model C (Executor).

Leia seu contexto em: CONTEXTO-MODEL-C-EXECUTOR.md

Aguardando delegação de tarefas do Model A...
```

---

## MÉTRICAS DE SUCESSO

### Economia de Tokens Esperada

```
Projeto Típico (100 tarefas):
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

### KPIs do Sistema

| Métrica | Meta | Descrição |
|---------|------|-----------|
| % Tarefas Model C | ≥ 80% | Maioria executada por Kimi |
| % Correções Model B | ≥ 90% | Maioria corrigida sem Sonnet |
| % Intervenções Model A | ≤ 5% | Poucos casos críticos |
| % Aprovação 1ª Auditoria | ≥ 70% | Qualidade alta desde início |
| Tokens Sonnet Economizados | ≥ 80% | Grande economia |

---

## COMANDOS ÚTEIS

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

### Instruções de Início

```powershell
iniciar-projeto-equipe "NomeDoProjeto"
```

---

## DOCUMENTAÇÃO RELACIONADA

- **Contexto Model A:** `CONTEXTO-MODEL-A-GERENTE.md`
- **Contexto Model B:** `CONTEXTO-MODEL-B-CORRETOR.md`
- **Contexto Model C:** `CONTEXTO-MODEL-C-EXECUTOR.md`
- **Instalador:** `install-team-system.ps1`
- **MCPs:** `C:\Users\thiag\.claude\mcp-scripts\`

---

## FAQ

### Por que 3 modelos simultâneos?

**Economia de tokens do Sonnet 4.5**. Delegando 80%+ das tarefas para Kimi, economizamos tokens da assinatura PRO.

### Por que não usar GLM?

Performance do Kimi K2 é superior. GLM fica como backup de emergência.

### Posso usar menos de 3 terminais?

Sim, mas perde eficiência. O ideal é trabalho paralelo.

### E se Model B não resolver?

Model A intervém. Garantia de que tudo será resolvido.

### Preciso seguir exatamente esse workflow?

Sim. Foi desenhado para maximizar economia de tokens mantendo qualidade.

---

**Sistema criado para trabalho profissional em equipe. Economize tokens e entregue qualidade!**
