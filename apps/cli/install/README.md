# NEXUS IA CLI - Instalação

## Requisitos
- Node.js 18+ instalado

## Instalação Rápida

### Windows (PowerShell)
```powershell
$env:NEXUS_REPO = "miguel913111/nexus"; iwr -useb https://raw.githubusercontent.com/$env:NEXUS_REPO/main/apps/cli/install/install.ps1 | iex
```

### Linux / macOS
```bash
export NEXUS_REPO="miguel913111/nexus"
curl -fsSL https://raw.githubusercontent.com/$NEXUS_REPO/main/apps/cli/install/install.sh | bash
```

## Após instalar
```bash
nexus login --key <tua-api-key>
nexus chat
nexus ask "Gera uma função de soma em Python"
```

## Comandos disponíveis
| Comando | Descrição |
|---------|-----------|
| `nexus login --key <key>` | Autenticar com API Key |
| `nexus chat` | Chat interativo |
| `nexus ask <prompt>` | Pergunta única |
| `nexus status` | Ver créditos e plano |
| `nexus planos` | Ver planos disponíveis |
| `nexus usage` | Histórico de uso |
| `nexus logout` | Remover autenticação |
