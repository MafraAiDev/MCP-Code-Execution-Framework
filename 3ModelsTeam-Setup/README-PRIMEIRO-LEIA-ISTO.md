# SISTEMA 3ModelsTeam - COMO USAR

**Localizacao:** Todos os arquivos do 3ModelsTeam estao nesta pasta
**Projeto Atual:** MCP-Code-Execution-Framework

---

## COMO INICIAR OS 3 TERMINAIS

### TERMINAL 1 - Model A (Gerente - Claude Sonnet 4.5)

```powershell
# Execute a partir da RAIZ do projeto:
cd C:\Users\thiag\Projects\MCP-Code-Execution-Framework

# Ativar Model A
.\3ModelsTeam-Setup\ativar-model-a.ps1

# Iniciar Claude
claude
```

**Depois que Claude iniciar, cole:**
```
Ola Model A! Gerente do MCP-Code-Execution-Framework.

Leia: 3ModelsTeam-Setup/docs/contextos/CONTEXTO-MODEL-A-GERENTE.md
Analise: STATUS-PROJETO.md, VISAO-GERAL.md, LEITURA-OBRIGATORIA.md

Objetivo: Concluir projeto de 75% para 100%.

TAREFAS:
1. Analise o que falta para 100%
2. Leia 3ModelsTeam-Setup/PLANNING.md e TASK.md
3. Classifique tarefas: ALTA / MEDIA / BAIXA
4. Delegue para Model B e Model C
```

---

### TERMINAL 2 - Model B (Corretor - Kimi K2 Thinking)

```powershell
# Execute a partir da RAIZ do projeto:
cd C:\Users\thiag\Projects\MCP-Code-Execution-Framework

# Ativar Model B
.\3ModelsTeam-Setup\ativar-model-b.ps1

# Iniciar Claude
claude
```

**Depois que Claude iniciar, cole:**
```
Ola Model B! Corretor aguardando delegacoes.

Leia: 3ModelsTeam-Setup/docs/contextos/CONTEXTO-MODEL-B-CORRETOR.md
Leia: 3ModelsTeam-Setup/docs/regras/REGRAS-GLOBAIS-MODEL-B.md

Aguardando instrucoes de Model A para correcoes MEDIA complexidade.
```

---

### TERMINAL 3 - Model C (Executor - Kimi K2 Preview)

```powershell
# Execute a partir da RAIZ do projeto:
cd C:\Users\thiag\Projects\MCP-Code-Execution-Framework

# Ativar Model C
.\3ModelsTeam-Setup\ativar-model-c.ps1

# Iniciar Claude
claude
```

**Depois que Claude iniciar, cole:**
```
Ola Model C! Executor aguardando tarefas.

Leia: 3ModelsTeam-Setup/docs/contextos/CONTEXTO-MODEL-C-EXECUTOR.md
Leia: 3ModelsTeam-Setup/docs/regras/REGRAS-GLOBAIS-MODEL-C.md

Aguardando instrucoes de Model A para tarefas MEDIA/BAIXA complexidade.
```

---

## VERIFICAR MODELO ATIVO

```powershell
.\3ModelsTeam-Setup\qual-modelo.ps1
```

---

## ESTRUTURA DESTA PASTA

```
3ModelsTeam-Setup/
├── ativar-model-a.ps1/.bat     # Scripts de ativacao
├── ativar-model-b.ps1/.bat
├── ativar-model-c.ps1/.bat
├── qual-modelo.ps1
│
├── docs/                        # Contextos e Regras
│   ├── contextos/
│   │   ├── CONTEXTO-MODEL-A-GERENTE.md
│   │   ├── CONTEXTO-MODEL-B-CORRETOR.md
│   │   └── CONTEXTO-MODEL-C-EXECUTOR.md
│   ├── regras/
│   │   ├── REGRAS-GLOBAIS-MODEL-A.md
│   │   ├── REGRAS-GLOBAIS-MODEL-B.md
│   │   └── REGRAS-GLOBAIS-MODEL-C.md
│   ├── templates/
│   ├── tools/
│   └── workflow/
│
├── PLANNING.md                  # Template de planejamento
├── TASK.md                      # Template de tarefas
│
├── GUIAS:
├── README-PRIMEIRO-LEIA-ISTO.md (este arquivo)
├── INICIO-RAPIDO.md
├── COMO-INICIAR-3-TERMINAIS.md
├── COMO-ATIVAR-MODELOS.md
├── INSTALACAO-SISTEMA-EQUIPE.md
├── SOLUCAO-DEFINITIVA.md
├── CORRECAO-MODEL-B-MOONSHOT.md
└── ...
```

---

## IMPORTANTE

**TODOS os comandos devem ser executados a partir da RAIZ do projeto:**

```powershell
C:\Users\thiag\Projects\MCP-Code-Execution-Framework\
```

**Os scripts estao dentro da pasta `3ModelsTeam-Setup/`, entao use:**

```powershell
.\3ModelsTeam-Setup\ativar-model-a.ps1
```

---

## ORDEM DE EXECUCAO

1. **Terminal 1:** Ativar Model A → Claude → Colar contexto
2. **Terminal 2:** Ativar Model B → Claude → Colar contexto
3. **Terminal 3:** Ativar Model C → Claude → Colar contexto
4. **Model A analisa e delega** tarefas

---

**Versao:** 1.0
**Data:** 2025-11-14
