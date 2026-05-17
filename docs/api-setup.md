# Como Obter e Configurar a API do Kimi

## 1. Registo na Moonshot AI

1. Acede a https://platform.moonshot.cn/
2. Cria conta com email empresarial
3. Verifica identidade (KYC empresarial recomendado)
4. Gera API Key em "API Keys"

## 2. Alternativa: OpenRouter

Se a Moonshot não der conta ou for muito restrita:
1. Regista em https://openrouter.ai/
2. Kimi K2.6 está disponível via OpenRouter
3. Usa a key do OpenRouter no lugar da Moonshot

## 3. Enterprise / Volume

Para obter:
- Preços mais baixos
- SLA garantido
- API dedicada

Contactar:
- Email: business@moonshot.cn
- Ou via formulário no site

Requisitos típicos:
- > $1000/mês em uso
- Contrato de 12 meses
- Empresa registada

## 4. Configuração no Projeto

```bash
# Copiar configuração
cp .env.example .env

# Editar .env
MOONSHOT_API_KEY=sk-sua-chave-aqui
MOONSHOT_BASE_URL=https://api.moonshot.cn/v1
```

## 5. Testar Conexão

```bash
cd apps/cli
npm install
npm run build
nexus ask "Olá, funciona?"
```

## 6. Proxy Obrigatório

**NUNCA** expor a API Key diretamente no CLI ou VS Code.

O fluxo correto é:
```
CLI/VS Code → NEXUS API Gateway (autenticado com JWT) 
  → Proxy para Moonshot API (tua key secreta)
```

Isto permite:
- Revogar tokens individuais
- Contar uso por cliente
- Trocar de provider sem afetar clientes
- Prevenir roubo de API key

## 7. Limitações Conhecidas

- Rate limit: 60 req/min (free), mais em enterprise
- Contexto: 128K tokens (K2.6)
- Disponibilidade: 99.9% em planos pagos

## 8. Custos Reais (atualização Maio 2026)

Verificar sempre em https://platform.moonshot.cn/pricing
Os preços mudam frequentemente.
