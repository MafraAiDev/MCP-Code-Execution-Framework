# ====================================================================
# ATIVAR MODEL A - CLAUDE SONNET 4.5 (GERENTE)
# ====================================================================
# Script local que funciona sem depender do $PROFILE
# Uso: .\ativar-model-a.ps1
# ====================================================================

$ErrorActionPreference = "Stop"

# Copiar configuração
Copy-Item ~/.claude/settings-anthropic.json ~/.claude/settings.json -Force

# Mensagem de confirmação
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
Write-Host "Contexto:" -ForegroundColor Yellow
Write-Host "  - docs/contextos/CONTEXTO-MODEL-A-GERENTE.md" -ForegroundColor Cyan
Write-Host "  - docs/regras/REGRAS-GLOBAIS-MODEL-A.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Agora execute: claude" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
