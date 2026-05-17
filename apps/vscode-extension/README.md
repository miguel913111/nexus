# NEXUS IA - Extensão VS Code / Cursor / Antigravity

Assistente de código com **Kimi K2.6** via DeepInfra, otimizado para Angola. Acede aos teus créditos, faz perguntas, explica código, refatora e gera testes — tudo dentro do teu IDE.

## Funcionalidades

- **Chat interativo** — Painel lateral com histórico de conversas
- **Explicar código** — Seleciona código → clica direito → "NEXUS: Explicar código"
- **Refatorar código** — Substitui o código selecionado com melhorias
- **Gerar testes** — Cria testes unitários automaticamente
- **Contexto com ficheiros** — Usa `@file caminho/do/ficheiro.ts` no chat
- **Status de créditos** — Barra de estado mostra créditos restantes em tempo real

## Instalação

### VS Code / Cursor
1. Abre a aba de Extensões (`Ctrl+Shift+X`)
2. Procura por **"NEXUS IA"**
3. Clica em **Install**

### Antigravity
1. Antigravity → `Extensions` → `...` → `Install from VSIX...`
2. Ou muda o marketplace para VS Code oficial nas settings

## Configuração

1. `Ctrl+Shift+P` → `Preferences: Open Settings`
2. Procura por **"NEXUS IA"**
3. Introduz a tua **API Key** em `Nexus: Api Key`

Obtém a tua API Key em: [https://web-production-6ef15.up.railway.app/dashboard](https://web-production-6ef15.up.railway.app/dashboard)

## Comandos

| Comando | Atalho | Descrição |
|---------|--------|-----------|
| `NEXUS: Abrir Chat` | — | Chat interativo no painel lateral |
| `NEXUS: Explicar código` | Menu de contexto | Explica o código selecionado |
| `NEXUS: Refatorar código` | Menu de contexto | Melhora o código selecionado |
| `NEXUS: Gerar testes` | Menu de contexto | Gera testes unitários |
| `NEXUS: Ver estado da conta` | — | Mostra plano e créditos |

## Planos

| Plano | Créditos | Preço |
|-------|----------|-------|
| Teste | 10.000 | GRÁTIS |
| Starter | 6.000.000 | 15.000 KZ |
| Pro | 20.000.000 | 60.000 KZ |
| Team | 70.000.000 | 220.000 KZ |

## CLI

Usa também o NEXUS IA no terminal:

```bash
npx nexus-ia login
nexus chat
nexus ask "Como criar uma API em Node.js?"
```

## Suporte

- Website: [nexus-ia.ao](https://nexus-ia.ao)
- Email: suporte@nexus-ia.ao
- GitHub: [github.com/miguel913111/nexus](https://github.com/miguel913111/nexus)
