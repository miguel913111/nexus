# API Gateway Dockerfile for Railway / Production
FROM node:20-alpine

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy all package files and source code
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY services/api-gateway ./services/api-gateway

# Install all dependencies
RUN npm install

# Build packages in dependency order
RUN cd /app/packages/types && npm run build
RUN cd /app/packages/core && npm run build

# Build API Gateway
WORKDIR /app/services/api-gateway
RUN npm run build

# Ensure data directory exists for persistent volume
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/nexus.db

EXPOSE 3000

CMD ["node", "dist/index.js"]
