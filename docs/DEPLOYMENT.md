# Deploy NEXUS IA em Produção

## Requisitos

- VPS com Ubuntu 22.04+
- 2 CPU cores, 4GB RAM (mínimo)
- Domínio: api.nexus-ia.ao
- SSL Certificate (Let's Encrypt)

## Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (inicial) → PostgreSQL (escalar)
- **Cache**: Redis
- **Proxy**: Nginx
- **PM2**: Process manager
- **SSL**: Let's Encrypt

## Passo a Passo

### 1. Servidor VPS

Recomendo:
- **Hetzner**: ~€5/mês (CPX11)
- **DigitalOcean**: ~$6/mês (Droplet)
- **AWS Lightsail**: ~$5/mês

### 2. Instalar Dependências

```bash
# Update
apt update && apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Redis
apt install -y redis-server
systemctl enable redis
systemctl start redis

# Nginx
apt install -y nginx
systemctl enable nginx

# PM2
npm install -g pm2

# Git
apt install -y git
```

### 3. Clonar e Build

```bash
cd /opt
git clone https://github.com/tu-user/nexus-ia.git
cd nexus-ia

# Instalar dependências
npm install

# Build
cd packages/types && npm run build
cd ../core && npm run build
cd ../../services/api-gateway && npm run build

# Init database
npm run db:init
```

### 4. Configurar .env

```bash
cp .env.example .env
nano .env
```

Preencher:
```env
NODE_ENV=production
PORT=3000
DEEPINFRA_API_KEY=xxx
FLUTTERWAVE_SECRET_KEY=xxx
FLUTTERWAVE_WEBHOOK_SECRET=xxx
ADMIN_API_KEY=xxx-muito-seguro
REDIS_URL=redis://localhost:6379
DATABASE_PATH=/opt/nexus-ia/data/nexus.db
FRONTEND_URL=https://nexus-ia.ao
ALLOWED_ORIGINS=https://nexus-ia.ao,https://app.nexus-ia.ao
```

### 5. PM2

```bash
# Criar ecosystem.config.js
cat > /opt/nexus-ia/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nexus-api',
    script: './services/api-gateway/dist/index.js',
    cwd: '/opt/nexus-ia',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    log_file: '/var/log/nexus/combined.log',
    out_file: '/var/log/nexus/out.log',
    error_file: '/var/log/nexus/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '512M',
    restart_delay: 3000,
    max_restarts: 5
  }]
};
EOF

# Criar diretório de logs
mkdir -p /var/log/nexus

# Iniciar
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd
```

### 6. Nginx

```bash
cat > /etc/nginx/sites-available/nexus-api << 'EOF'
server {
    listen 80;
    server_name api.nexus-ia.ao;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.nexus-ia.ao;

    ssl_certificate /etc/letsencrypt/live/api.nexus-ia.ao/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.nexus-ia.ao/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }

    location /v1/chat/completions {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
        
        # SSE support for streaming
        proxy_set_header Connection '';
        proxy_buffering off;
        cache_control no-cache;
    }
}
EOF

ln -s /etc/nginx/sites-available/nexus-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 7. SSL (Let's Encrypt)

```bash
certbot --nginx -d api.nexus-ia.ao
```

### 8. Firewall

```bash
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw enable
```

### 9. Backup Database

```bash
# Daily backup cron
cat > /opt/nexus-ia/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /opt/nexus-ia/data/nexus.db /opt/nexus-ia/backups/nexus_$DATE.db
gzip /opt/nexus-ia/backups/nexus_$DATE.db
# Keep only last 7 days
find /opt/nexus-ia/backups -name "*.gz" -mtime +7 -delete
EOF

chmod +x /opt/nexus-ia/backup.sh
mkdir -p /opt/nexus-ia/backups

# Cron daily at 3am
echo "0 3 * * * /opt/nexus-ia/backup.sh" | crontab -
```

### 10. Monitoramento

```bash
# Health check cron
cat > /opt/nexus-ia/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -sf https://api.nexus-ia.ao/health > /dev/null; then
    pm2 restart nexus-api
fi
EOF

chmod +x /opt/nexus-ia/health-check.sh

# Every 5 minutes
echo "*/5 * * * * /opt/nexus-ia/health-check.sh" | crontab -
```

## Updates

```bash
cd /opt/nexus-ia
git pull
npm install
npm run build
cd services/api-gateway && npm run build
pm2 restart nexus-api
```

## Escalar (quando necessário)

1. **Database**: Migrar SQLite → PostgreSQL
2. **Cache**: Redis Cluster
3. **Load Balancer**: Nginx upstream com múltiplas instâncias PM2
4. **CDN**: Cloudflare para static assets
