# COMO ATIVAR OS MODELOS - GUIA RAPIDO

**Sistema 3ModelsTeam - Ativacao Local (Sem Depender do $PROFILE)**

---

## SOLUCAO DEFINITIVA

Este diretorio agora possui **scripts locais** que funcionam **sempre**, sem depender do `$PROFILE` do PowerShell.

---

## COMO USAR

### Opcao 1: PowerShell (Recomendado)

Abra 3 terminais PowerShell neste diretorio e execute:

**Terminal 1 (Model A - Gerente):**
```powershell
.\ativar-model-a.ps1
claude
```

**Terminal 2 (Model B - Corretor):**
```powershell
.\ativar-model-b.ps1
claude
```

**Terminal 3 (Model C - Executor):**
```powershell
.\ativar-model-c.ps1
claude
```

### Opcao 2: Batch (Alternativa)

Se preferir arquivos .bat (mais simples):

**Terminal 1:**
```cmd
ativar-model-a.bat
claude
```

**Terminal 2:**
```cmd
ativar-model-b.bat
claude
```

**Terminal 3:**
```cmd
ativar-model-c.bat
claude
```

### Verificar Modelo Ativo

```powershell
.\qual-modelo.ps1
```

---

## ARQUIVOS DISPONIVEIS

### Scripts PowerShell (.ps1)
- `ativar-model-a.ps1` - Ativar Claude Sonnet 4.5 (Gerente)
- `ativar-model-b.ps1` - Ativar Kimi K2 Thinking (Corretor)
- `ativar-model-c.ps1` - Ativar Kimi K2 Preview (Executor)
- `qual-modelo.ps1` - Ver qual modelo esta ativo

### Scripts Batch (.bat)
- `ativar-model-a.bat` - Ativar Model A
- `ativar-model-b.bat` - Ativar Model B
- `ativar-model-c.bat` - Ativar Model C

---

## VANTAGENS DESTE METODO

1. **Funciona sempre** - Nao depende do `$PROFILE`
2. **Sem encoding issues** - Scripts locais em UTF-8
3. **Portavel** - Copie para qualquer projeto
4. **Sem reload** - Nao precisa recarregar terminal
5. **Visual claro** - Mostra papel e responsabilidades

---

## WORKFLOW COMPLETO

### 1. Abrir 3 Terminais VSCode

Todos neste diretorio:
```
C:\Users\thiag\Projects\MCP-Code-Execution-Framework\
```

### 2. Ativar Modelos

**Terminal 1:**
```powershell
.\ativar-model-a.ps1
claude
```

**Terminal 2:**
```powershell
.\ativar-model-b.ps1
claude
```

**Terminal 3:**
```powershell
.\ativar-model-c.ps1
claude
```

### 3. Iniciar Projeto (Model A)

No **Terminal 1**, digite:

```
Ola Model A!

Contexto:
- docs/contextos/CONTEXTO-MODEL-A-GERENTE.md
- docs/regras/REGRAS-GLOBAIS-MODEL-A.md

Projeto: MCP-Code-Execution-Framework

Analise:
- README.md
- STATUS-PROJETO.md
- VISAO-GERAL.md

Crie PLANNING.md e TASK.md.
Classifique tarefas: ALTA / MEDIA / BAIXA.
Coordene Model B e Model C.
```

### 4. Model B e Model C Aguardam

**Terminal 2 (Model B):**
```
Ola Model B!

Contexto: docs/contextos/CONTEXTO-MODEL-B-CORRETOR.md

Aguardando delegacoes de correcao do Model A...
```

**Terminal 3 (Model C):**
```
Ola Model C!

Contexto: docs/contextos/CONTEXTO-MODEL-C-EXECUTOR.md

Aguardando tarefas do Model A...
```

---

## PARA NOVOS PROJETOS

Copie estes arquivos para qualquer projeto novo:

```powershell
# Navegar para novo projeto
cd C:\Users\thiag\Projects\NovoProjeto

# Copiar scripts de ativacao
cp C:\Users\thiag\Projects\MCP-Code-Execution-Framework\ativar-model-*.ps1 .
cp C:\Users\thiag\Projects\MCP-Code-Execution-Framework\ativar-model-*.bat .
cp C:\Users\thiag\Projects\MCP-Code-Execution-Framework\qual-modelo.ps1 .

# Copiar documentacao (opcional)
cp -r C:\Users\thiag\Projects\MCP-Code-Execution-Framework\docs .
cp C:\Users\thiag\Projects\MCP-Code-Execution-Framework\PLANNING.md .
cp C:\Users\thiag\Projects\MCP-Code-Execution-Framework\TASK.md .
```

---

## TROUBLESHOOTING

### Problema: "Execution Policy"

Se aparecer erro de ExecutionPolicy, execute:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Ou use os arquivos .bat que nao tem esse problema.

### Problema: "Arquivo nao encontrado"

Certifique-se de estar no diretorio correto:

```powershell
cd C:\Users\thiag\Projects\MCP-Code-Execution-Framework
```

### Problema: Settings nao existem

Verifique se os arquivos de configuracao existem:

```powershell
ls ~/.claude/settings-*.json
```

Se faltando:
```powershell
cp C:\Users\thiag\Projects\3ModelsTeam\kimi\settings-kimi-thinking.json ~/.claude/
```

---

## COMPARACAO: ANTES vs DEPOIS

### ANTES (Problematico)
```powershell
# Depende do $PROFILE
ativar-model-a  # Erro: comando nao encontrado
```

### DEPOIS (Solucao Definitiva)
```powershell
# Scripts locais sempre funcionam
.\ativar-model-a.ps1  # Funciona sempre!
```

---

**Problema resolvido em definitivo!**

**Data:** 2025-11-14
**Versao:** 1.0
