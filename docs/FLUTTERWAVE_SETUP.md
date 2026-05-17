# Setup Flutterwave para Pagamentos em Angola

## 1. Criar Conta Flutterwave

1. Vai a https://dashboard.flutterwave.com/
2. Regista conta empresarial (Business Account)
3. Completa verificação KYC (documentos da empresa)

## 2. Ativar Métodos de Pagamento Angola

No Dashboard:
- **Settings > Payment Methods**
- Ativar:
  - **Unitel Money** (M-Pesa equivalente em Angola)
  - **Afrimoney**
  - **Cartão de crédito/débito**
  - **Transferência bancária**

## 3. Configurar Webhook

No Dashboard:
- **Settings > Webhooks**
- URL: `https://api.nexus-ia.ao/v1/payments/flutterwave/webhook`
- Ativar eventos: `charge.completed`
- Copiar **Webhook Secret** para `.env`

## 4. Obter Chaves API

No Dashboard:
- **Settings > API**
- Copiar:
  - `FLUTTERWAVE_PUBLIC_KEY` (para frontend)
  - `FLUTTERWAVE_SECRET_KEY` (para backend)
  - `FLUTTERWAVE_ENCRYPTION_KEY` (para backend)

## 5. Configurar .env

```env
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxx
FLUTTERWAVE_ENCRYPTION_KEY=xxxxxxxxxxxxxxxx
FLUTTERWAVE_WEBHOOK_SECRET=seu-webhook-secret
```

## 6. Testar Pagamento

### Criar payload de pagamento (frontend):
```javascript
const paymentData = {
  tx_ref: `pro_${Date.now()}`,
  amount: 60000,
  currency: "KZ",
  redirect_url: "https://nexus-ia.ao/payment/callback",
  meta: {
    plan: "pro",
    user_id: "user-123"
  },
  customer: {
    email: "cliente@email.ao",
    phonenumber: "2449XXXXXXXX",
    name: "Nome Cliente"
  },
  customizations: {
    title: "NEXUS IA - Plano Pro",
    description: "20M tokens + 20% bónus",
    logo: "https://nexus-ia.ao/logo.png"
  }
};
```

### Iniciar pagamento:
```bash
curl -X POST https://api.flutterwave.com/v3/payments \
  -H "Authorization: Bearer $FLUTTERWAVE_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tx_ref":"test_001","amount":60000,"currency":"KZ",...}'
```

## 7. Testar Webhook Localmente

Usar ngrok para testar webhooks em desenvolvimento:
```bash
ngrok http 3000
# Copiar URL https e configurar no Flutterwave Dashboard
```

## 8. Verificação de Assinatura

O backend já implementa verificação via header `verif-hash`:
```typescript
// src/routes/flutterwave.ts
function verifyWebhookSignature(req: Request): boolean {
  const signature = req.headers['verif-hash'];
  return signature === process.env.FLUTTERWAVE_WEBHOOK_SECRET;
}
```

## 9. Fluxo Completo

```
1. Cliente clica "Comprar Plano Pro" no teu site
2. Frontend chama Flutterwave API → retorna link de pagamento
3. Cliente paga via Unitel Money / Cartão
4. Flutterwave envia webhook POST para /v1/payments/flutterwave/webhook
5. Backend verifica assinatura → ativa plano → envia email com API key
6. Cliente recebe API key e começa a usar
```

## 10. Taxas Flutterwave (Angola)

| Método | Taxa |
|--------|------|
| Unitel Money | ~1.4% |
| Cartão | ~3.8% |
| Transferência bancária | ~1% |

Fatora estas taxas nos teus preços!
