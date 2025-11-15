# ====================================================================
# SETUP SISTEMA 3MODELS PARA NOVOS PROJETOS (v3.3)
# ====================================================================
# Cria pasta 3ModelsTeam/ dentro do projeto para manter organizacao
# Uso: .\setup-3models-para-novo-projeto.ps1 -DestinoProjeto "C:\caminho\projeto"
# ====================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$DestinoProjeto
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP SISTEMA 3MODELS v3.3" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Destino: $DestinoProjeto" -ForegroundColor Yellow
Write-Host ""

# Verificar se destino existe
if (-Not (Test-Path $DestinoProjeto)) {
    Write-Host "[ERRO] Diretorio nao existe: $DestinoProjeto" -ForegroundColor Red
    exit 1
}

# Diretorio atual (onde estao os scripts)
$DiretorioAtual = $PSScriptRoot

# Criar pasta 3ModelsTeam dentro do projeto
$Pasta3Models = Join-Path $DestinoProjeto "3ModelsTeam"

Write-Host "Criando pasta 3ModelsTeam/..." -ForegroundColor Yellow

if (-Not (Test-Path $Pasta3Models)) {
    New-Item -Path $Pasta3Models -ItemType Directory -Force | Out-Null
    Write-Host "[OK] Pasta 3ModelsTeam/ criada" -ForegroundColor Green
} else {
    Write-Host "[OK] Pasta 3ModelsTeam/ ja existe" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Copiando scripts de ativacao..." -ForegroundColor Yellow

# Copiar scripts PowerShell para a pasta 3ModelsTeam
Copy-Item "$DiretorioAtual\ativar-model-a.ps1" $Pasta3Models -Force
Copy-Item "$DiretorioAtual\ativar-model-b.ps1" $Pasta3Models -Force
Copy-Item "$DiretorioAtual\ativar-model-c.ps1" $Pasta3Models -Force
Copy-Item "$DiretorioAtual\qual-modelo.ps1" $Pasta3Models -Force

# Copiar scripts Batch
Copy-Item "$DiretorioAtual\ativar-model-a.bat" $Pasta3Models -Force
Copy-Item "$DiretorioAtual\ativar-model-b.bat" $Pasta3Models -Force
Copy-Item "$DiretorioAtual\ativar-model-c.bat" $Pasta3Models -Force

Write-Host "[OK] Scripts copiados!" -ForegroundColor Green
Write-Host ""

# Perguntar se quer copiar documentacao
$copiarDocs = Read-Host "Copiar documentacao (docs/, PLANNING.md, TASK.md, guias)? (S/N)"

if ($copiarDocs -eq "S" -or $copiarDocs -eq "s") {
    Write-Host ""
    Write-Host "Copiando documentacao..." -ForegroundColor Yellow

    # Copiar pasta docs para 3ModelsTeam
    if (Test-Path "$DiretorioAtual\docs") {
        Copy-Item "$DiretorioAtual\docs" $Pasta3Models -Recurse -Force
        Write-Host "[OK] Pasta docs/ copiada" -ForegroundColor Green
    }

    # Copiar templates para 3ModelsTeam
    if (Test-Path "$DiretorioAtual\PLANNING.md") {
        Copy-Item "$DiretorioAtual\PLANNING.md" $Pasta3Models -Force
        Write-Host "[OK] PLANNING.md copiado" -ForegroundColor Green
    }

    if (Test-Path "$DiretorioAtual\TASK.md") {
        Copy-Item "$DiretorioAtual\TASK.md" $Pasta3Models -Force
        Write-Host "[OK] TASK.md copiado" -ForegroundColor Green
    }

    # Copiar guias principais para 3ModelsTeam
    if (Test-Path "$DiretorioAtual\README-PRIMEIRO-LEIA-ISTO.md") {
        Copy-Item "$DiretorioAtual\README-PRIMEIRO-LEIA-ISTO.md" $Pasta3Models -Force
        Write-Host "[OK] README-PRIMEIRO-LEIA-ISTO.md copiado" -ForegroundColor Green
    }

    if (Test-Path "$DiretorioAtual\COMO-ATIVAR-MODELOS.md") {
        Copy-Item "$DiretorioAtual\COMO-ATIVAR-MODELOS.md" $Pasta3Models -Force
        Write-Host "[OK] COMO-ATIVAR-MODELOS.md copiado" -ForegroundColor Green
    }

    if (Test-Path "$DiretorioAtual\INSTALACAO-SISTEMA-EQUIPE.md") {
        Copy-Item "$DiretorioAtual\INSTALACAO-SISTEMA-EQUIPE.md" $Pasta3Models -Force
        Write-Host "[OK] INSTALACAO-SISTEMA-EQUIPE.md copiado" -ForegroundColor Green
    }

    if (Test-Path "$DiretorioAtual\SISTEMA-3-MODELOS-README.md") {
        Copy-Item "$DiretorioAtual\SISTEMA-3-MODELOS-README.md" $Pasta3Models -Force
        Write-Host "[OK] SISTEMA-3-MODELOS-README.md copiado" -ForegroundColor Green
    }
}

# Criar guia rapido na RAIZ do projeto
$NomeProjeto = Split-Path -Leaf $DestinoProjeto
$GuiaRapido = @"
# COMO INICIAR OS 3 MODELOS

**Sistema:** 3ModelsTeam v3.3
**Projeto:** $NomeProjeto

---

## COMANDOS RAPIDOS

### TERMINAL 1 - Model A (Gerente)
``````powershell
.\3ModelsTeam\ativar-model-a.ps1
claude
``````

### TERMINAL 2 - Model B (Corretor)
``````powershell
.\3ModelsTeam\ativar-model-b.ps1
claude
``````

### TERMINAL 3 - Model C (Executor)
``````powershell
.\3ModelsTeam\ativar-model-c.ps1
claude
``````

---

## CONTEXTOS PARA COLAR

### TERMINAL 1
``````
Ola Model A! Gerente deste projeto.

Leia: 3ModelsTeam/docs/contextos/CONTEXTO-MODEL-A-GERENTE.md

Analise o projeto e classifique tarefas.
Delegue para Model B e Model C.
``````

### TERMINAL 2
``````
Ola Model B! Corretor.
Leia: 3ModelsTeam/docs/contextos/CONTEXTO-MODEL-B-CORRETOR.md
Aguardando delegacoes de Model A.
``````

### TERMINAL 3
``````
Ola Model C! Executor.
Leia: 3ModelsTeam/docs/contextos/CONTEXTO-MODEL-C-EXECUTOR.md
Aguardando tarefas de Model A.
``````

---

**Documentacao completa:** ``3ModelsTeam/README-PRIMEIRO-LEIA-ISTO.md``

**Versao:** 3.3
**Data:** 2025-11-14
"@

$CaminhoGuiaRapido = Join-Path $DestinoProjeto "INICIAR-3-MODELOS.md"
Set-Content -Path $CaminhoGuiaRapido -Value $GuiaRapido -Encoding UTF8

Write-Host ""
Write-Host "[OK] Guia rapido criado na raiz: INICIAR-3-MODELOS.md" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP CONCLUIDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "ESTRUTURA CRIADA:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  $DestinoProjeto\" -ForegroundColor White
Write-Host "  ├── 3ModelsTeam/              (Sistema 3ModelsTeam)" -ForegroundColor Cyan
Write-Host "  │   ├── ativar-model-*.ps1" -ForegroundColor Gray
Write-Host "  │   ├── docs/" -ForegroundColor Gray
Write-Host "  │   └── ..." -ForegroundColor Gray
Write-Host "  └── INICIAR-3-MODELOS.md      (Guia rapido)" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROXIMO PASSO:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Navegar para o projeto:" -ForegroundColor White
Write-Host "   cd $DestinoProjeto" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Abrir 3 terminais e executar:" -ForegroundColor White
Write-Host "   .\3ModelsTeam\ativar-model-a.ps1" -ForegroundColor Cyan
Write-Host "   .\3ModelsTeam\ativar-model-b.ps1" -ForegroundColor Cyan
Write-Host "   .\3ModelsTeam\ativar-model-c.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Executar claude em cada terminal" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
