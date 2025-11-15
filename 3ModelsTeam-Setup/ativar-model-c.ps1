# ====================================================================
# ATIVAR MODEL C - KIMI K2 PREVIEW (EXECUTOR)
# ====================================================================
# Script local que funciona sem depender do $PROFILE
# Uso: .\ativar-model-c.ps1
# ====================================================================

$ErrorActionPreference = "Stop"

# Copiar configuração
Copy-Item ~/.claude/settings-openrouter.json ~/.claude/settings.json -Force

# Mensagem de confirmação
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
Write-Host "Contexto:" -ForegroundColor Yellow
Write-Host "  - docs/contextos/CONTEXTO-MODEL-C-EXECUTOR.md" -ForegroundColor Cyan
Write-Host "  - docs/regras/REGRAS-GLOBAIS-MODEL-C.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Agora execute: claude" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
