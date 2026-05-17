# Model Fallback - Sistema de Resiliência

## Como funciona

O NEXUS IA tenta automaticamente múltiplos modelos de IA se o principal falhar:

```
Pedido do cliente
    ↓
DeepInfra (Kimi K2.6) —> Falha? 
    ↓
OpenRouter (Kimi K2.6) —> Falha?
    ↓
Groq (Llama 3.3 70B) —> Falha?
    ↓
Together AI (Qwen 2.5 Coder) —> Falha?
    ↓
Erro: "Todos os modelos falharam"
```

## Configuração

Define as chaves no `.env` (pelo menos uma obrigatória):

```env
# Primary (recomendado)
DEEPINFRA_API_KEY=xxx

# Fallbacks opcionais mas recomendados
OPENROUTER_API_KEY=xxx
GROQ_API_KEY=xxx
TOGETHER_API_KEY=xxx
```

## Preços comparativos (por 1M tokens)

| Provider | Modelo | Input | Output | Speed |
|----------|--------|-------|--------|-------|
| DeepInfra | Kimi K2.6 | $1.50 | $6.00 | Média |
| OpenRouter | Kimi K2.6 | $2.00 | $8.00 | Média |
| Groq | Llama 3.3 70B | $0.59 | $0.79 | **Ultra-rápido** |
| Together | Qwen 2.5 Coder | $0.80 | $0.80 | Rápida |

## Comportamento

1. **DeepInfra** é sempre tentado primeiro (melhor preço)
2. Se falhar (timeout, erro 5xx, rate limit), tenta o próximo
3. O cliente recebe a resposta do primeiro modelo que funcionar
4. O header `model` na resposta indica qual foi usado

## Retry logic

Cada modelo tenta até `maxRetries` vezes antes de passar ao próximo:
- DeepInfra: 2 retries
- OpenRouter: 2 retries
- Groq: 2 retries
- Together: 1 retry

## Monitoramento

O histórico de fallbacks fica em memória e pode ser consultado:
```bash
curl https://api.nexus-ia.ao/v1/admin/models/health \
  -H "X-Admin-Key: $ADMIN_API_KEY"
```

## Streaming

O fallback também funciona em streaming! Se o stream do DeepInfra falhar a meio, o sistema tenta reiniciar com outro modelo.

## Dica

Para **desenvolvimento rápido** (sem esperar pelo Kimi), usa Groq como primary — é 10x mais rápido, embora menos capaz que o Kimi K2.6.
