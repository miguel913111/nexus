# 🚂 Deploy NEXUS IA no Railway

Este guia explica como colocar o NEXUS IA na internet usando [Railway](https://railway.app).

---

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app) (grátis com $5 de crédito mensal)
2. Código no GitHub (Railway liga diretamente ao teu repo)

---

## 🏗️ Arquitetura no Railway

| Serviço | Descrição | Dockerfile |
|---------|-----------|------------|
| `nexus-api` | API Gateway (Express + better-sqlite3) | `services/api-gateway/Dockerfile` |
| `nexus-web` | Frontend Next.js | `apps/web/Dockerfile` |
| `Redis` | Rate limiting & cache | Serviço Railway (add via UI) |

---

## 🚀 Passo a Passo

### 1. Criar Projeto no Railway

1. Vai a [railway.app/new](https://railway.app/new)
2. Seleciona **"Deploy from GitHub repo"**
3. Escolhe o teu repositório `NEXUS-IA`

### 2. Adicionar Serviço da API

1. Clica **"New" → "Service" → "Dockerfile"**
2. Seleciona o Dockerfile: `services/api-gateway/Dockerfile`
3. Nomeia: `nexus-api`

#### Variáveis de Ambiente (API)

Vai ao separador **"Variables"** do serviço `nexus-api` e adiciona:

```
NODE_ENV=production
DB_PATH=/app/data/nexus.db
REDIS_URL=${{Redis.REDIS_URL}}

MOONSHOT_API_KEY=sk-sua-chave-moonshot
FLUTTERWAVE_SECRET_KEY=FLWSECK-sua-chave
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-app-password
SMTP_FROM=NEXUS IA <noreply@nexusia.ao>

GITHUB_CLIENT_ID=Ov23li...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=https://nexus-api.up.railway.app/v1/auth/github/callback
```

> **Nota:** `GITHUB_CALLBACK_URL` deve usar o URL real do Railway (aparece depois do deploy).

#### Volume Persistente (DB SQLite)

1. No serviço `nexus-api`, vai a **"Settings" → "Volumes"**
2. Clica **"New Volume"**
3. Mount Path: `/app/data`
4. Isto garante que a base de dados SQLite persiste entre deploys!

### 3. Adicionar Serviço do Frontend

1. Clica **"New" → "Service" → "Dockerfile"**
2. Seleciona o Dockerfile: `apps/web/Dockerfile`
3. Nomeia: `nexus-web`

#### Variáveis de Ambiente (Web)

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://nexus-api.up.railway.app
```

> **Nota:** `NEXT_PUBLIC_API_URL` deve ser o URL público do serviço `nexus-api`.

### 4. Adicionar Redis

1. Clica **"New" → "Database" → "Add Redis"**
2. Railway gera automaticamente a variável `REDIS_URL`
3. O serviço `nexus-api` já referencia `${{Redis.REDIS_URL}}`

### 5. Deploy!

1. Railway faz deploy automático a cada `git push`
2. Os URLs públicos aparecem nos serviços (ex: `https://nexus-web.up.railway.app`)

---

## 🔄 Comandos Úteis

### Deploy manual (se necessário)
```bash
# Faz push para o GitHub
# Railway deploya automaticamente
git add .
git commit -m "Deploy v1.0"
git push origin main
```

### Ver logs
```bash
# Via Railway Dashboard → Service → Logs
# Ou via CLI (se instalado):
railway logs
```

---

## 🛠️ Solução de Problemas

| Problema | Solução |
|----------|---------|
| Porta em uso | Railway define `PORT` automaticamente. O código usa `process.env.PORT \|\| 3000`. |
| DB perde dados | Verifica se o Volume em `/app/data` está montado no serviço `nexus-api`. |
| Frontend não liga à API | Verifica `NEXT_PUBLIC_API_URL` aponta para o URL correcto da API. |
| Redis connection error | Verifica se o serviço Redis está criado e a variável `REDIS_URL` existe. |
| better-sqlite3 falha a compilar | O Dockerfile Alpine já inclui `python3 make g++ sqlite`. |

---

## 💰 Custos Railway (Hobby Plan)

| Recurso | Limite Grátis |
|---------|--------------|
| Execução | $5/mês de crédito |
| Banco de dados | PostgreSQL / Redis incluído |
| Volume | 1GB persistente |
| Banda | 100GB/mês |

Para produção real, considera o plano **Pro** ($20/mês).

---

## ✅ Checklist Final

- [ ] Projeto Railway criado
- [ ] Repo GitHub ligado
- [ ] Serviço `nexus-api` com Dockerfile `services/api-gateway/Dockerfile`
- [ ] Serviço `nexus-web` com Dockerfile `apps/web/Dockerfile`
- [ ] Serviço `Redis` adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] Volume `/app/data` montado no `nexus-api`
- [ ] URLs públicos verificados
- [ ] GitHub callback URL actualizada
