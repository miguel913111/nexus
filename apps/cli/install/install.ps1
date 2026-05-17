# NEXUS IA CLI - Instalador para Windows
$ErrorActionPreference = "Stop"

$REPO = if ($env:NEXUS_REPO) { $env:NEXUS_REPO } else { "miguel913111/nexus" }
$BRANCH = if ($env:NEXUS_BRANCH) { $env:NEXUS_BRANCH } else { "main" }
$INSTALL_DIR = if ($env:INSTALL_DIR) { $env:INSTALL_DIR } else { "$env:USERPROFILE\.nexus" }
$BIN_DIR = "$INSTALL_DIR\bin"

$GITHUB_RAW = "https://raw.githubusercontent.com/$REPO/$BRANCH/apps/cli/dist"

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  NEXUS IA CLI - Instalador" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $NODE_VERSION = node --version 2>$null
    if (-not $NODE_VERSION) { throw "Node.js não encontrado" }
} catch {
    Write-Host "❌ Node.js não encontrado." -ForegroundColor Red
    Write-Host "   Instala primeiro: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js encontrado: $NODE_VERSION" -ForegroundColor Green
Write-Host ""

# Create directories
New-Item -ItemType Directory -Force -Path $BIN_DIR | Out-Null

# Download files
Write-Host "📥 A descarregar NEXUS CLI..." -ForegroundColor Cyan

try {
    Invoke-WebRequest -Uri "$GITHUB_RAW/bundle.js" -OutFile "$BIN_DIR\nexus.js" -UseBasicParsing
} catch {
    Write-Host "❌ Falha ao descarregar bundle.js" -ForegroundColor Red
    Write-Host "   Verifica se o repositório '$REPO' existe e se o branch é '$BRANCH'" -ForegroundColor Yellow
    Write-Host "   Podes definir: `$env:NEXUS_REPO = 'utilizador/repo'" -ForegroundColor Yellow
    exit 1
}

try {
    Invoke-WebRequest -Uri "$GITHUB_RAW/nexus.cmd" -OutFile "$BIN_DIR\nexus.cmd" -UseBasicParsing
} catch {
    Write-Host "❌ Falha ao descarregar wrapper" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Ficheiros instalados em $BIN_DIR" -ForegroundColor Green
Write-Host ""

# Add to PATH
$USER_PATH = [Environment]::GetEnvironmentVariable("Path", "User")
if ($USER_PATH -notlike "*$BIN_DIR*") {
    [Environment]::SetEnvironmentVariable("Path", "$USER_PATH;$BIN_DIR", "User")
    Write-Host "✅ PATH atualizado (User)" -ForegroundColor Green
} else {
    Write-Host "✅ PATH já configurado" -ForegroundColor Green
}

# Also add to current session
if ($env:Path -notlike "*$BIN_DIR*") {
    $env:Path += ";$BIN_DIR"
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  ✅ Instalação concluída!" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Abre uma NOVA janela do terminal e corre:" -ForegroundColor Green
Write-Host ""
Write-Host "   nexus login --key <tua-api-key>" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 Comandos disponíveis:" -ForegroundColor White
Write-Host "   nexus chat          → Chat interativo"
Write-Host "   nexus ask <texto>   → Pergunta única"
Write-Host "   nexus status        → Ver créditos"
Write-Host "   nexus planos        → Ver planos"
Write-Host "   nexus usage         → Histórico de uso"
Write-Host ""
