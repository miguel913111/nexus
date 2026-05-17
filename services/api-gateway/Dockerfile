# API Gateway Dockerfile for Railway / Production
FROM node:20-alpine

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy root package files for workspace install
COPY package*.json ./
COPY services/api-gateway/package*.json ./services/api-gateway/
COPY packages/*/package*.json ./packages/*/

# Install all dependencies (including dev, needed for build)
RUN npm ci

# Copy source code
COPY services/api-gateway ./services/api-gateway
COPY packages ./packages

# Build TypeScript
WORKDIR /app/services/api-gateway
RUN npm run build

# Ensure data directory exists for persistent volume
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/nexus.db

EXPOSE 3000

CMD ["node", "dist/index.js"]
