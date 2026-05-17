# Web Frontend Dockerfile for Railway / Production
FROM node:20-alpine

WORKDIR /app

# Copy root package files for workspace install
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/*/package*.json ./packages/*/

# Install all dependencies (including dev, needed for build)
RUN npm ci

# Copy source code
COPY apps/web ./apps/web
COPY packages ./packages

# Build Next.js for production
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start"]
