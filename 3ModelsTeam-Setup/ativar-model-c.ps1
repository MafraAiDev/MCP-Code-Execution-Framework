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
Write-Host "  - Implementar codigo conforme especificacoes" -ForegroundColor White
Write-Host "  - Criar modulos e classes (SkillsManager, Loader, etc)" -ForegroundColor White
Write-Host "  - Escrever testes unitarios e de integracao" -ForegroundColor White
Write-Host "  - Aplicar correcoes solicitadas por Model B" -ForegroundColor White
Write-Host "  - Documentar APIs e funcoes" -ForegroundColor White
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
Write-Host "  - DELEGACAO-MODEL-C.md (Instrucoes para Executor)" -ForegroundColor Cyan
Write-Host "  - PLANNING.md (Planejamento Mestre)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Agora execute: claude" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
