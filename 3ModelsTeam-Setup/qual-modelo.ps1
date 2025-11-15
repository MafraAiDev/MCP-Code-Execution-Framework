# ====================================================================
# VERIFICAR MODELO ATIVO
# ====================================================================
# Mostra qual modelo está ativo no momento
# Uso: .\qual-modelo.ps1
# ====================================================================

$ErrorActionPreference = "Stop"

$settingsPath = "$env:USERPROFILE\.claude\settings.json"

if (Test-Path $settingsPath) {
    $settings = Get-Content $settingsPath | ConvertFrom-Json

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  MODELO ATIVO" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Detectar qual modelo baseado no conteúdo
    $settingsContent = Get-Content $settingsPath -Raw

    if ($settingsContent -match "anthropic") {
        Write-Host "  MODEL A: Claude Sonnet 4.5 (Gerente)" -ForegroundColor Green
    } elseif ($settingsContent -match "kimi-k2-thinking") {
        Write-Host "  MODEL B: Kimi K2 Thinking (Corretor)" -ForegroundColor Cyan
    } elseif ($settingsContent -match "openrouter" -or $settingsContent -match "kimi") {
        Write-Host "  MODEL C: Kimi K2 Preview (Executor)" -ForegroundColor Yellow
    } else {
        Write-Host "  Modelo desconhecido" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Nenhum modelo configurado." -ForegroundColor Red
    Write-Host ""
}
