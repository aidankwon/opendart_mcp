# Build stage
FROM node:20-alpine AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN apk add --no-cache libc6-compat \
    && npm ci --omit=dev \
    && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Create cache directory
ENV OPENDART_CACHE_DIR=/app/data
RUN mkdir -p /app/data

EXPOSE 3000

# Set transport to SSE by default for Docker
ENV MCP_TRANSPORT=sse

CMD ["node", "dist/index.js"]
