# INSTALAÇÃO DO SISTEMA DE EQUIPE - 3 MODELOS

**Sistema de Trabalho em Equipe para Mitigar Uso de Tokens do Claude Sonnet 4.5**

---

## O QUE É ESTE SISTEMA?

Este sistema permite que você trabalhe com **3 modelos simultaneamente** no **mesmo diretório**, cada um em um terminal diferente:

- **Model A (Claude Sonnet 4.5)**: Gerente - planejamento, segurança, alta complexidade, auditoria
- **Model B (Kimi K2 Thinking)**: Corretor - correções de média complexidade
- **Model C (Kimi K2 Preview)**: Executor - execução de tarefas média/baixa complexidade

**Objetivo:** Economizar **~85% dos tokens** do Claude Sonnet 4.5, delegando 80%+ das tarefas para os modelos Kimi.

---

## PRÉ-REQUISITOS

Antes de instalar, certifique-se de ter:

1. **Claude Code CLI instalado**
   ```powershell
   claude --version
   ```

2. **API Keys configuradas**
   - Anthropic API Key (Claude Sonnet 4.5)
   - Moonshot AI API Key (Kimi K2 models)

3. **Arquivos de configuração**
   - `~/.claude/settings-anthropic.json` (Claude Sonnet 4.5)
   - `~/.claude/settings-kimi-thinking.json` (Kimi K2 Thinking)
   - `~/.claude/settings-kimi-preview.json` (Kimi K2 Preview)

4. **PowerShell** (Windows) ou Bash (Linux/Mac)

---

## INSTALAÇÃO AUTOMÁTICA

### 1. Execute o Instalador

No PowerShell, execute:

```powershell
.\install-team-system.ps1
```

O instalador irá:
- [OK] Adicionar 3 funções ao seu `$PROFILE`
- [OK] Criar comandos: `ativar-model-a`, `ativar-model-b`, `ativar-model-c`
- [OK] Configurar contexto de cada modelo
- [OK] Habilitar ativação sem mudar de diretório

### 2. Copiar Arquivos de Configuração

O instalador cria as funções, mas você precisa copiar os arquivos de configuração:

```powershell
# Copiar settings do Kimi K2 Thinking
cp .\kimi\settings-kimi-thinking.json ~/.claude/settings-kimi-thinking.json
```

**Nota:** Se você também tiver o arquivo `settings-kimi-preview.json` para o Model C, copie-o também:

```powershell
# Copiar settings do Kimi K2 Preview (se disponível)
cp .\kimi\settings-kimi-preview.json ~/.claude/settings-kimi-preview.json
```

### 3. Recarregar PowerShell

Após instalação, recarregue o perfil:

```powershell
. $PROFILE
```

### 4. Verificar Instalação

```powershell
qual-modelo
```

Deve mostrar qual modelo está ativo no momento.

---

## INSTALAÇÃO MANUAL (Alternativa)

Se preferir instalar manualmente:

### 1. Editar $PROFILE

```powershell
notepad $PROFILE
```

### 2. Adicionar Funções

Cole no final do arquivo:

```powershell
# ========================================
# SISTEMA DE EQUIPE - 3 MODELOS
# ========================================

function ativar-model-a {
    Copy-Item ~/.claude/settings-anthropic.json ~/.claude/settings.json -Force
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  MODEL A: CLAUDE SONNET 4.5" -ForegroundColor Yellow
    Write-Host "  Papel: GERENTE" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Responsabilidades:" -ForegroundColor Yellow
    Write-Host "  - Planejamento e gerenciamento (taskmaster)" -ForegroundColor White
    Write-Host "  - Mecanismos de seguranca (guardrails-ai)" -ForegroundColor White
    Write-Host "  - Tarefas de ALTA complexidade" -ForegroundColor White
    Write-Host "  - Auditoria final (Garak)" -ForegroundColor White
    Write-Host "  - Intervencao em casos criticos" -ForegroundColor White
    Write-Host ""
    Write-Host "Agora execute: claude" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}

function ativar-model-b {
    Copy-Item ~/.claude/settings-kimi-thinking.json ~/.claude/settings.json -Force
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  MODEL B: KIMI K2 THINKING" -ForegroundColor Yellow
    Write-Host "  Papel: CORRETOR" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Responsabilidades:" -ForegroundColor Yellow
    Write-Host "  - Correcoes de tarefas MEDIA complexidade" -ForegroundColor White
    Write-Host "  - Melhorias pos-auditoria" -ForegroundColor White
    Write-Host "  - Relatorios detalhados com reasoning_content" -ForegroundColor White
    Write-Host "  - Raciocinio profundo para solucao de problemas" -ForegroundColor White
    Write-Host ""
    Write-Host "Agora execute: claude" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}

function ativar-model-c {
    Copy-Item ~/.claude/settings-kimi-preview.json ~/.claude/settings.json -Force
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  MODEL C: KIMI K2 PREVIEW" -ForegroundColor Yellow
    Write-Host "  Papel: EXECUTOR" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Responsabilidades:" -ForegroundColor Yellow
    Write-Host "  - Execucao de tarefas MEDIA e BAIXA complexidade" -ForegroundColor White
    Write-Host "  - Correcoes de tarefas BAIXA complexidade" -ForegroundColor White
    Write-Host "  - Raciocinio estruturado (sequential-thinking)" -ForegroundColor White
    Write-Host "  - Relatorios de execucao" -ForegroundColor White
    Write-Host ""
    Write-Host "Agora execute: claude" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}

function qual-modelo {
    $settingsPath = "~/.claude/settings.json"
    if (Test-Path $settingsPath) {
        $settings = Get-Content $settingsPath | ConvertFrom-Json
        Write-Host "Modelo ativo: $($settings.models[0].modelName)" -ForegroundColor Yellow
    } else {
        Write-Host "Nenhum modelo configurado." -ForegroundColor Red
    }
}
```

### 3. Salvar e Recarregar

```powershell
. $PROFILE
```

---

## COMO USAR O SISTEMA

### Passo 1: Preparar o Ambiente

Abra **3 janelas do VSCode** lado a lado, todas no **mesmo diretório do projeto**:

```
C:\Users\thiag\Projects\MeuProjeto\
```

### Passo 2: Ativar os Modelos

**Janela 1 (Esquerda) - Model A (Gerente):**
```powershell
PS C:\Users\thiag\Projects\MeuProjeto> ativar-model-a
PS C:\Users\thiag\Projects\MeuProjeto> claude
```

**Janela 2 (Centro) - Model B (Corretor):**
```powershell
PS C:\Users\thiag\Projects\MeuProjeto> ativar-model-b
PS C:\Users\thiag\Projects\MeuProjeto> claude
```

**Janela 3 (Direita) - Model C (Executor):**
```powershell
PS C:\Users\thiag\Projects\MeuProjeto> ativar-model-c
PS C:\Users\thiag\Projects\MeuProjeto> claude
```

### Passo 3: Iniciar o Projeto (Model A)

No **Terminal 1 (Model A)**, forneça o contexto:

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

### Passo 4: Model B e Model C Aguardam

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

## WORKFLOW DE TRABALHO

### Fase 1: Planejamento (Model A)
1. Model A analisa projeto
2. Classifica tarefas: ALTA / MÉDIA / BAIXA
3. Cria plano usando taskmaster
4. Compartilha via cipher-mcp/byterover-mcp

### Fase 2: Execução Paralela
- **Model A**: Executa tarefas ALTA complexidade
- **Model C**: Executa tarefas MÉDIA e BAIXA complexidade

### Fase 3: Correção (Model B)
- Model C encontra erro MÉDIA → Relata para Model A
- Model A delega para Model B
- Model B corrige e testa
- Model B envia relatório para Model A

### Fase 4: Auditoria (Model A)
- Model A aciona Garak
- Analisa relatórios de Model B e Model C
- Aprova ou delega melhorias para Model B

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

## MCPs DISPONÍVEIS

### Model A (Gerente)
```
taskmaster-mcp           → Planejamento e gerenciamento
sequential-thinking      → Raciocínio estruturado
guardrails-ai/guardrails → Mecanismos de segurança
cipher-mcp-v0.3.0        → Memória compartilhada
byterover-mcp            → Memória compartilhada
garak                    → Auditoria de código
```

### Model B (Corretor)
```
sequential-thinking      → Raciocínio profundo
cipher-mcp-v0.3.0        → Memória compartilhada
byterover-mcp            → Memória compartilhada
```

### Model C (Executor)
```
sequential-thinking      → Raciocínio estruturado
cipher-mcp-v0.3.0        → Memória compartilhada
byterover-mcp            → Memória compartilhada
```

**Localização:** `C:\Users\thiag\.claude\mcp-scripts\`

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

### Copiar Contextos para Projeto
```powershell
# Copiar todos os arquivos de contexto
cp C:\Users\thiag\Projects\ClaudeCode-Docs\CONTEXTO-MODEL-*.md .
cp C:\Users\thiag\Projects\ClaudeCode-Docs\WORKFLOW-EQUIPE-3-MODELOS.md .
```

---

## DOCUMENTAÇÃO COMPLETA

### Arquivos de Contexto
- `CONTEXTO-MODEL-A-GERENTE.md` (268 linhas)
- `CONTEXTO-MODEL-B-CORRETOR.md` (347 linhas)
- `CONTEXTO-MODEL-C-EXECUTOR.md` (468 linhas)

### Guias do Sistema
- `WORKFLOW-EQUIPE-3-MODELOS.md` (482 linhas)
- `INSTALACAO-SISTEMA-EQUIPE.md` (este arquivo)

### Configurações
- `~/.claude/settings-anthropic.json`
- `~/.claude/settings-kimi-thinking.json`
- `~/.claude/settings-kimi-preview.json`

### Scripts
- `install-team-system.ps1` (Instalador automático)

---

## TROUBLESHOOTING

### Problema: "qual-modelo" não funciona
**Solução:**
```powershell
. $PROFILE
```

### Problema: Modelos não ativam
**Solução:** Verifique se os arquivos de configuração existem:
```powershell
ls ~/.claude/settings-*.json
```

Se `settings-kimi-thinking.json` não existir, copie do diretório kimi:
```powershell
cp .\kimi\settings-kimi-thinking.json ~/.claude/settings-kimi-thinking.json
```

### Problema: "ativar-model-b" falha com erro "PathNotFound"
**Causa:** Arquivo `settings-kimi-thinking.json` não está em `~/.claude/`

**Solução:**
```powershell
# Certifique-se de estar no diretório 3ModelsTeam
cd C:\Users\thiag\Projects\3ModelsTeam

# Copiar o arquivo de configuração
cp .\kimi\settings-kimi-thinking.json ~/.claude/settings-kimi-thinking.json

# Tentar novamente
ativar-model-b
```

### Problema: "iniciar-projeto-equipe" pede NomeProjeto
**Causa:** O comando requer um parâmetro obrigatório

**Solução:**
```powershell
iniciar-projeto-equipe -NomeProjeto "MeuProjeto"
```

### Problema: Emojis causam erros
**Solução:** Todos os arquivos já foram limpos de emojis. Apenas acentos e caracteres especiais são usados.

### Problema: MCPs não funcionam
**Solução:** Verifique se o MCP-CODE-EXECUTION-FRAMEWORK está instalado:
```powershell
ls ~/.claude/mcp-scripts/
```

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

### Os arquivos têm emojis?
Não. Todos os emojis foram removidos para evitar erros Unicode. Apenas acentos (á, é, ç) e caracteres especiais (→, ←, ↓, ┌, └, │) são usados.

---

## PRÓXIMOS PASSOS

1. Execute `install-team-system.ps1`
2. Copie os arquivos de configuração: `cp .\kimi\settings-kimi-thinking.json ~/.claude/`
3. Recarregue o PowerShell: `. $PROFILE`
4. Teste a ativação dos modelos: `ativar-model-a`, `ativar-model-b`, `ativar-model-c`
5. Abra 3 janelas VSCode no mesmo diretório
6. Ative os 3 modelos
7. Inicie o projeto com `iniciar-projeto-equipe -NomeProjeto "Nome"` ou Model A

---

**Sistema criado para trabalho profissional em equipe. Economize tokens e entregue qualidade!**

**Versão:** 3.1
**Data:** 2025-11-14
**Status:** Totalmente funcional e testado
