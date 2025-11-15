# ====================================================================
# ATIVAR MODEL B - KIMI K2 THINKING (CORRETOR)
# ====================================================================
# Script local que funciona sem depender do $PROFILE
# Uso: .\ativar-model-b.ps1
# ====================================================================

$ErrorActionPreference = "Stop"

# Copiar configuração
Copy-Item ~/.claude/settings-kimi-thinking.json ~/.claude/settings.json -Force

# Mensagem de confirmação
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
Write-Host "Contexto:" -ForegroundColor Yellow
Write-Host "  - docs/contextos/CONTEXTO-MODEL-B-CORRETOR.md" -ForegroundColor Cyan
Write-Host "  - docs/regras/REGRAS-GLOBAIS-MODEL-B.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Agora execute: claude" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
