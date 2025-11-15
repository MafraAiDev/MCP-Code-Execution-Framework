# ====================================================================
# INSTALADOR DO SISTEMA DE EQUIPE DE 3 MODELOS
# ====================================================================
#
# Este script instala automaticamente as funções PowerShell para
# ativar os 3 modelos que trabalham em equipe:
#
# - Model A: Claude Sonnet 4.5 (Gerente)
# - Model B: Kimi K2 Thinking (Corretor)
# - Model C: Kimi K2 Preview (Executor)
#
# Uso: .\install-team-system.ps1
# ====================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALADOR - Sistema de Equipe" -ForegroundColor Cyan
Write-Host "  3 Modelos Trabalhando Juntos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o perfil existe
if (-Not (Test-Path $PROFILE)) {
    Write-Host "Criando arquivo de perfil PowerShell..." -ForegroundColor Yellow
    New-Item -Path $PROFILE -Type File -Force | Out-Null
}

# Backup do perfil atual
$backupPath = "$PROFILE.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $PROFILE $backupPath -Force
Write-Host "[OK] Backup criado: $backupPath" -ForegroundColor Green

# Conteúdo a ser adicionado ao perfil
$profileContent = @'

# ====================================================================
# SISTEMA DE EQUIPE - 3 MODELOS CLAUDE CODE
# Instalado automaticamente em: {TIMESTAMP}
# ====================================================================

# Função para ativar Model A: Claude Sonnet 4.5 (Gerente)
function ativar-model-a {
    Copy-Item ~/.claude/settings-anthropic.json ~/.claude/settings.json -Force

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  MODEL A: CLAUDE SONNET 4.5" -ForegroundColor Green
    Write-Host "  Papel: GERENTE" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Responsabilidades:" -ForegroundColor Yellow
    Write-Host "  - Planejamento e gerenciamento (taskmaster)" -ForegroundColor White
    Write-Host "  - Mecanismos de seguranca (guardrails-ai)" -ForegroundColor White
    Write-Host "  - Tarefas de ALTA complexidade (sequential-thinking)" -ForegroundColor White
    Write-Host "  - Auditoria (Garak) de Model B e Model C" -ForegroundColor White
    Write-Host "  - Intervencao em casos nao resolvidos por Model B" -ForegroundColor White
    Write-Host ""
    Write-Host "MCPs Disponiveis:" -ForegroundColor Yellow
    Write-Host "  - taskmaster-mcp" -ForegroundColor Cyan
    Write-Host "  - sequential-thinking" -ForegroundColor Cyan
    Write-Host "  - guardrails-ai/guardrails" -ForegroundColor Cyan
    Write-Host "  - cipher-mcp-v0.3.0" -ForegroundColor Cyan
    Write-Host "  - byterover-mcp" -ForegroundColor Cyan
    Write-Host "  - garak" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Agora execute: claude" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
}

# Função para ativar Model B: Kimi K2 Thinking (Corretor)
function ativar-model-b {
    Copy-Item ~/.claude/settings-kimi-thinking.json ~/.claude/settings.json -Force

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  MODEL B: KIMI K2 THINKING" -ForegroundColor Cyan
    Write-Host "  Papel: CORRETOR" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Responsabilidades:" -ForegroundColor Yellow
    Write-Host "  - Correcoes de tarefas MEDIA complexidade (delegadas por Model C)" -ForegroundColor White
    Write-Host "  - Implementar correcoes pos-auditoria (identificadas por Model A)" -ForegroundColor White
    Write-Host "  - Redigir relatorios para auditoria de Model A" -ForegroundColor White
    Write-Host ""
    Write-Host "Parametros Obrigatorios:" -ForegroundColor Yellow
    Write-Host "  - temperature = 1.0" -ForegroundColor Cyan
    Write-Host "  - max_tokens >= 16,000" -ForegroundColor Cyan
    Write-Host "  - stream = true" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Campo reasoning_content ativo!" -ForegroundColor Magenta
    Write-Host "  - Mostra processo de raciocinio detalhado" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Agora execute: claude" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

# Função para ativar Model C: Kimi K2 Preview (Executor)
function ativar-model-c {
    Copy-Item ~/.claude/settings-openrouter.json ~/.claude/settings.json -Force

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  MODEL C: KIMI K2 PREVIEW" -ForegroundColor Yellow
    Write-Host "  Papel: EXECUTOR" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Responsabilidades:" -ForegroundColor Yellow
    Write-Host "  - Executar tarefas de MEDIA e BAIXA complexidade" -ForegroundColor White
    Write-Host "  - Pensar estruturadamente (sequential-thinking via MCP)" -ForegroundColor White
    Write-Host "  - Corrigir erros de tarefas BAIXA complexidade" -ForegroundColor White
    Write-Host "  - Relatar erros MEDIA complexidade para Model A" -ForegroundColor White
    Write-Host "  - Redigir relatorios para auditoria de Model A" -ForegroundColor White
    Write-Host ""
    Write-Host "MCPs Disponiveis:" -ForegroundColor Yellow
    Write-Host "  - sequential-thinking (via MCP-CODE-EXECUTION-FRAMEWORK)" -ForegroundColor Cyan
    Write-Host "  - cipher-mcp-v0.3.0 (memoria compartilhada)" -ForegroundColor Cyan
    Write-Host "  - byterover-mcp (memoria compartilhada)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Caracteristicas:" -ForegroundColor Yellow
    Write-Host "  - 256k tokens de contexto" -ForegroundColor Cyan
    Write-Host "  - Capacidades aprimoradas de codigo" -ForegroundColor Cyan
    Write-Host "  - Velocidade otimizada" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Agora execute: claude" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
}

# Função auxiliar: mostrar qual modelo está ativo
function qual-modelo {
    if (Test-Path ~/.claude/settings.json) {
        $settings = Get-Content ~/.claude/settings.json | ConvertFrom-Json
        $model = $settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL

        Write-Host ""
        Write-Host "Modelo Ativo:" -ForegroundColor Cyan

        switch -Wildcard ($model) {
            "*sonnet*" {
                Write-Host "  - MODEL A: Claude Sonnet 4.5 (Gerente)" -ForegroundColor Green
            }
            "*kimi-k2-thinking*" {
                Write-Host "  - MODEL B: Kimi K2 Thinking (Corretor)" -ForegroundColor Cyan
            }
            "*kimi-k2*" {
                Write-Host "  - MODEL C: Kimi K2 Preview (Executor)" -ForegroundColor Yellow
            }
            default {
                Write-Host "  - Modelo: $model" -ForegroundColor White
            }
        }
        Write-Host ""
    } else {
        Write-Host "Nenhum modelo configurado ainda." -ForegroundColor Red
    }
}

# Função auxiliar: workflow de inicialização de projeto
function iniciar-projeto-equipe {
    param(
        [Parameter(Mandatory=$true)]
        [string]$NomeProjeto
    )

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "  INICIANDO PROJETO EM EQUIPE" -ForegroundColor Magenta
    Write-Host "  Projeto: $NomeProjeto" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host ""

    Write-Host "Instruções:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Terminal 1 (VSCode Janela 1):" -ForegroundColor Green
    Write-Host "   PS> ativar-model-a" -ForegroundColor White
    Write-Host "   PS> claude" -ForegroundColor White
    Write-Host ""

    Write-Host "2. Terminal 2 (VSCode Janela 2):" -ForegroundColor Cyan
    Write-Host "   PS> ativar-model-b" -ForegroundColor White
    Write-Host "   PS> claude" -ForegroundColor White
    Write-Host ""

    Write-Host "3. Terminal 3 (VSCode Janela 3):" -ForegroundColor Yellow
    Write-Host "   PS> ativar-model-c" -ForegroundColor White
    Write-Host "   PS> claude" -ForegroundColor White
    Write-Host ""

    Write-Host "IMPORTANTE:" -ForegroundColor Red
    Write-Host "  - Todos os terminais devem estar no MESMO diretorio" -ForegroundColor White
    Write-Host "  - Model A coordena o projeto (taskmaster)" -ForegroundColor White
    Write-Host "  - Memoria compartilhada via cipher-mcp e byterover-mcp" -ForegroundColor White
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host ""
}

# Mensagem de ajuda
Write-Host "Funções instaladas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Comandos disponiveis:" -ForegroundColor Yellow
Write-Host "  ativar-model-a              - Ativar Claude Sonnet 4.5 (Gerente)" -ForegroundColor White
Write-Host "  ativar-model-b              - Ativar Kimi K2 Thinking (Corretor)" -ForegroundColor White
Write-Host "  ativar-model-c              - Ativar Kimi K2 Preview (Executor)" -ForegroundColor White
Write-Host "  qual-modelo                 - Ver qual modelo esta ativo" -ForegroundColor White
Write-Host "  iniciar-projeto-equipe      - Instrucoes para iniciar projeto" -ForegroundColor White
Write-Host ""

'@

# Substituir timestamp
$profileContent = $profileContent -replace '\{TIMESTAMP\}', (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# Verificar se já existe instalação anterior
$currentProfile = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue

if ($currentProfile -match "SISTEMA DE EQUIPE - 3 MODELOS CLAUDE CODE") {
    Write-Host "[AVISO] Sistema ja instalado anteriormente!" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Deseja reinstalar? (S/N)"

    if ($response -ne "S" -and $response -ne "s") {
        Write-Host "Instalacao cancelada." -ForegroundColor Red
        exit 0
    }

    # Remover instalacao anterior
    Write-Host "Removendo instalacao anterior..." -ForegroundColor Yellow
    $currentProfile = $currentProfile -replace '(?ms)# ====================================================================\s*# SISTEMA DE EQUIPE.*?Write-Host ""', ''
    Set-Content -Path $PROFILE -Value $currentProfile -Force
}

# Adicionar ao perfil
Add-Content -Path $PROFILE -Value $profileContent -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  INSTALACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Recarregar o perfil:" -ForegroundColor White
Write-Host "   . `$PROFILE" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Ou fechar e abrir novo terminal PowerShell" -ForegroundColor White
Write-Host ""
Write-Host "3. Testar os comandos:" -ForegroundColor White
Write-Host "   ativar-model-a" -ForegroundColor Cyan
Write-Host "   qual-modelo" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentacao completa em:" -ForegroundColor Yellow
Write-Host "  WORKFLOW-EQUIPE-3-MODELOS.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Perguntar se quer recarregar agora
$reload = Read-Host "Recarregar perfil agora? (S/N)"
if ($reload -eq "S" -or $reload -eq "s") {
    . $PROFILE
    Write-Host ""
    Write-Host "[OK] Perfil recarregado! Comandos prontos para uso." -ForegroundColor Green
    Write-Host ""
}
