#!/bin/bash
set -e

REPO="${NEXUS_REPO:-miguel913111/nexus}"
BRANCH="${NEXUS_BRANCH:-main}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.nexus}"
BIN_DIR="$INSTALL_DIR/bin"

GITHUB_RAW="https://raw.githubusercontent.com/$REPO/$BRANCH/apps/cli/dist"

echo "==================================="
echo "  NEXUS IA CLI - Instalador"
echo "==================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado."
    echo "   Instala primeiro: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js $NODE_VERSION detectado. Recomendado: 18+"
fi

echo "✅ Node.js encontrado: $(node --version)"
echo ""

# Create directories
mkdir -p "$BIN_DIR"

# Download files
echo "📥 A descarregar NEXUS CLI..."
curl -fsSL "$GITHUB_RAW/bundle.js" -o "$BIN_DIR/nexus.js" || {
    echo "❌ Falha ao descarregar bundle.js"
    echo "   Verifica se o repositório '$REPO' existe e se o branch é '$BRANCH'"
    echo "   Podes definir: export NEXUS_REPO=utilizador/repo"
    exit 1
}

curl -fsSL "$GITHUB_RAW/nexus" -o "$BIN_DIR/nexus" || {
    echo "❌ Falha ao descarregar wrapper"
    exit 1
}

chmod +x "$BIN_DIR/nexus"
chmod +x "$BIN_DIR/nexus.js"

echo "✅ Ficheiros instalados em $BIN_DIR"
echo ""

# Add to PATH
SHELL_RC=""
if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ "$SHELL" = "/bin/bash" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ] && [ -f "$SHELL_RC" ]; then
    if ! grep -q "$BIN_DIR" "$SHELL_RC"; then
        echo "" >> "$SHELL_RC"
        echo "# NEXUS IA CLI" >> "$SHELL_RC"
        echo 'export PATH="$HOME/.nexus/bin:$PATH"' >> "$SHELL_RC"
        echo "✅ PATH atualizado em $SHELL_RC"
    else
        echo "✅ PATH já configurado"
    fi
else
    echo "⚠️  Adiciona manualmente ao PATH:"
    echo "   export PATH=\"$BIN_DIR:\$PATH\""
fi

echo ""
echo "==================================="
echo "  ✅ Instalação concluída!"
echo "==================================="
echo ""
echo "🚀 Inicia uma nova terminal e corre:"
echo ""
echo "   nexus login"
echo ""
echo "📖 Comandos disponíveis:"
echo "   nexus chat          → Chat interativo"
echo "   nexus ask <texto>   → Pergunta única"
echo "   nexus status        → Ver créditos"
echo "   nexus planos        → Ver planos"
echo "   nexus usage         → Histórico de uso"
echo ""
