# Checklist de Segurança NEXUS IA

## ✅ Implementado

### API Keys
- [x] API Key da DeepInfra **NUNCA** no código do cliente
- [x] API keys dos clientes: formato `nx-` com prefixo único
- [x] API keys revogáveis instantaneamente (`UPDATE users SET status = 'suspended'`)
- [x] Hash de API keys nos logs (apenas primeiros 12 chars)

### Verificação de Créditos
- [x] Verificação **SEMPRE** no backend (database lookup)
- [x] Cache Redis para performance (5 min TTL)
- [x] Fallback para DB se Redis falhar
- [x] Deduction atómica (UPDATE com verificação)

### Rate Limiting
- [x] Máximo X requests/minuto por user (configurável por plano)
  - Teste: 10/min
  - Starter: 30/min
  - Pro: 60/min
  - Team: 120/min
- [x] Headers `X-RateLimit-Remaining` e `X-RateLimit-Reset`
- [x] Redis-based rate limiting (distribuído)

### Rate Limiting por Tokens
- [x] Máximo Y tokens/request por plano
  - Teste: 2,048
  - Starter: 4,096
  - Pro: 8,192
  - Team: 128,000
- [x] Validação com Zod schema

### HTTPS
- [x] HTTPS obrigatório em produção (`enforceHttps` middleware)
- [x] Rejeita requests HTTP com 403
- [x] HSTS headers via Helmet

### Input Validation
- [x] Limite tamanho máximo do prompt: 30K chars
- [x] Limite máximo de tokens por request (ver plano)
- [x] Limite body size: 100KB
- [x] Sanitização de input (remove null bytes)
- [x] Validação Zod para todos os campos
- [x] Máximo 50 messages, 1-30K chars cada

### Webhook Flutterwave
- [x] Verificação de assinatura (`verif-hash` header)
- [x] Idempotência (não processa pagamentos duplicados)
- [x] Responde 200 imediatamente (evita retries desnecessários)
- [x] Logs de todos os webhooks recebidos

### Logs
- [x] Logs de todas as requests (quem, quando, quantos tokens)
- [x] Winston logger com rotação
- [x] Logs separados: error.log, combined.log, requests.log
- [x] Request ID tracking
- [x] IP address e User Agent logging

### Database
- [x] SQLite com WAL mode (melhor concorrência)
- [x] Foreign keys enabled
- [x] Indexes em campos de lookup frequentes
- [x] Prepared statements (prevenção SQL injection)

## 🔧 Configurar em Produção

### Firewall
```bash
# Permitir apenas HTTPS (443)
ufw default deny incoming
ufw allow 443/tcp
ufw allow 22/tcp  # SSH
```

### SSL/TLS
```bash
# Certbot + Let's Encrypt
certbot --nginx -d api.nexus-ia.ao
```

### Redis Security
```bash
# Redis com password
requirepass sua-senha-forte
bind 127.0.0.1  # apenas localhost
```

### Environment Variables
```bash
# NUNCA committar .env
chmod 600 .env

# Usar secrets manager em produção
# AWS Secrets Manager / HashiCorp Vault
```

### Headers de Segurança (já via Helmet)
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection
- Referrer-Policy

## 🚨 Monitoramento

### Alertas recomendados
- Rate limit excedido > 100x/hora (possível ataque)
- Créditos negativos (bug ou fraude)
- Webhook failures > 5x (Flutterwave problemas)
- DeepInfra errors > 10% (problemas de API)

### Ferramentas
- Sentry para error tracking
- Datadog / Grafana para métricas
- UptimeRobot para health checks
