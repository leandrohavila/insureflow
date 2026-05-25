# Build context: monorepo root (see docker-compose)
FROM node:22-alpine AS deps
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

RUN npm ci --omit=dev -w @repo/database -w api || npm install --omit=dev

FROM node:22-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/database ./packages/database
COPY apps/api ./apps/api
COPY turbo.json ./

RUN npm ci
RUN npm run build -w @repo/database
RUN npm run build -w api

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/scripts ./apps/api/scripts
COPY --from=builder /app/package.json ./package.json

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "scripts/start-release.cjs"]
