# Setup DeepInfra (Proxy para Kimi K2.6)

## Porquê DeepInfra?

DeepInfra é um proxy/API gateway que te dá acesso ao Kimi K2.6 (e outros modelos) com:
- Preços mais baixos que a API oficial da Moonshot
- Pagamento por cartão (não precisas de conta chinesa)
- API OpenAI-compatible (fácil integração)
- Suporte a streaming

## 1. Criar Conta

1. Vai a https://deepinfra.com/
2. Regista com email
3. Verifica conta

## 2. Obter API Key

1. Vai a https://deepinfra.com/dash/api_keys
2. Clica "Create API Key"
3. Copia a key (começa com `xxx-`)

## 3. Configurar .env

```env
DEEPINFRA_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEEPINFRA_MODEL=moonshotai/kimi-k2-6
```

## 4. Testar Conexão

```bash
curl https://api.deepinfra.com/v1/openai/chat/completions \
  -H "Authorization: Bearer $DEEPINFRA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "moonshotai/kimi-k2-6",
    "messages": [{"role": "user", "content": "Olá!"}]
  }'
```

## 5. Preços DeepInfra (Kimi K2.6)

| Tipo | Preço |
|------|-------|
| Input | ~$0.0015 / 1K tokens |
| Output | ~$0.006 / 1K tokens |

**Muito mais barato que Moonshot direto!**

### Cálculo de margem com DeepInfra:
- Custo real 20M tokens: ~$45
- Vendes por 60.000 KZ (~$66)
- **Margem: ~32%** ✅

## 6. Monitorar Uso

No dashboard DeepInfra:
- https://deepinfra.com/dash/usage
- Vês total de tokens gastos
- Exportas invoices

## 7. Pagamento

DeepInfra cobra:
- Cartão de crédito
- Débito automático mensal
- Faturas disponíveis no dashboard

## 8. Alternativas se DeepInfra falhar

| Provider | URL | Preço Kimi K2.6 |
|----------|-----|-----------------|
| OpenRouter | openrouter.ai | ~$0.002/1K |
| Together AI | together.ai | N/A |
| API oficial Moonshot | platform.moonshot.cn | ~$0.015/1K |

## 9. Arquitetura

```
Cliente (CLI/VS Code)
   ↓ API Key do cliente (nx-...)
NEXUS Backend (Rate Limit + Billing)
   ↓ Tua API Key Secreta (deepinfra-xxx)
DeepInfra API
   ↓
Kimi K2.6 (Moonshot AI)
```

O cliente **NUNCA** vê a tua DeepInfra API Key.
