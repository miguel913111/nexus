# Estratégia de Preços - NEXUS IA (Mercado Angolano)

## Conceito: Revenda com Markup

Tu **não** precisas de uma API dedicada. O modelo é:
1. Compras tokens em bulk via API Moonshot (paga em $/€)
2. Vendes "pacotes" aos teus clientes em KZ
3. O teu backend (API Gateway) faz proxy e conta tokens

## Cálculo de Custos (Kimi K2.6)

| Tipo | Preço API (oficial) |
|------|---------------------|
| Input | ~$0.015 / 1K tokens |
| Output | ~$0.060 / 1K tokens |

### Cenário Pro (1.5M tokens/mês)
- Uso estimado: 70% input, 30% output
- Input: 1,050,000 × $0.000015 = **$15.75**
- Output: 450,000 × $0.000060 = **$27.00**
- **Custo total API: ~$42.75 (~€39)**
- **Preço de venda: 36.000 KZ (~€40)**
- **Margem bruta: ~3%** 😬

### Problema Identificado
O markup de 2x não funciona bem em tokens puros porque o custo API já é alto.

## Solução: Modelo Híbrido

### Opção A: Créditos com Overhead
Vender "mensalidades" que incluem:
- Tokens
- Suporte
- Funcionalidades extra (code review, test generation)
- Infraestrutura

| Plano | Preço KZ | Preço EUR | Tokens | Margem Est. |
|-------|----------|-----------|--------|-------------|
| Starter | 18.000 | 10€ | 300K | ~40% |
| Pro | 36.000 | 20€ | 800K | ~35% |
| Enterprise | 90.000 | 50€ | 2.5M | ~30% |

### Opção B: Pay-as-you-go com markup
- Custo API: $0.015/1K input
- Venda: $0.03/1K input (100% markup)
- O cliente compra créditos antecipadamente

### Opção C: Enterprise Custom
Para empresas grandes, vendes por:
- Número de developers
- SLA garantido
- On-premise deployment
- Preço: 200.000-500.000 KZ/mês

## Estratégia Recomendada para Angola

1. **Plano Free**: 10K tokens (para testar, com watermark)
2. **Starter (18.000 KZ)**: Target freelancers
3. **Pro (36.000 KZ)**: Target developers sérios
4. **Enterprise (negociável)**: Target empresas de software em Luanda

### Métodos de Pagamento em Angola
- **Multicaixa Express**: Integração com referências
- **Transferência bancária**: BFA, BIC, Atlântico
- **PayPal**: Para clientes internacionais
- **Cartão**: Stripe (se aceitar em Angola)

## Conversão EUR → KZ
Usar taxa de câmbio diária + spread de 5%:
- Se 1€ = 900 KZ, vendes a 945 KZ
- Isto cobre volatilidade e taxas

## Próximos Passos
1. Implementar contagem de tokens exata
2. Criar dashboard de admin
3. Integrar com gateway de pagamento angolano
