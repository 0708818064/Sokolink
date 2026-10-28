# ==========================================
# SokoLink Backend Standalone Dockerfile
# Multi-stage production build
# ==========================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for build
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and build TypeScript
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# ==========================================
# Production Runtime Image
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN apk add --no-cache openssl libc6-compat

# Create non-root system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sokolink

# Copy production dependencies and built files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist

USER sokolink

EXPOSE 5000

CMD ["node", "dist/server.js"]
