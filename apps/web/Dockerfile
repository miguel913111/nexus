# Web Frontend Dockerfile for Railway / Production
FROM node:20-alpine

WORKDIR /app

# Build argument for API URL (will be available during build)
ARG NEXT_PUBLIC_API_URL=https://api-gateway-production-dccf.up.railway.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy all package files and source code
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

# Install all dependencies
RUN npm install

# Build shared packages
RUN cd /app/packages/types && npm run build

# Build Next.js for production
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start"]
