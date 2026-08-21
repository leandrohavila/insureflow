# Build context: monorepo root (Railway / docker compose)
# npm workspaces: o package-lock exige os package.json de todos os workspaces
# para `npm ci`. Só compilamos a API + Prisma + forms.
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY scripts ./scripts
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/docs/package.json ./apps/docs/
COPY packages/database/package.json ./packages/database/
COPY packages/forms-engine/package.json ./packages/forms-engine/
COPY packages/forms-library/package.json ./packages/forms-library/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/auth/package.json ./packages/auth/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/

COPY packages/typescript-config ./packages/typescript-config
COPY packages/database ./packages/database
COPY packages/forms-engine ./packages/forms-engine
COPY packages/forms-library ./packages/forms-library
COPY apps/api ./apps/api

# Apenas prisma generate (prisma.config.ts). Sem migrate neste estágio.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/insureflow?schema=public"

RUN npm ci
RUN npm run build -w @repo/database
RUN npm run build -w @repo/forms-engine
RUN npm run build -w @repo/forms-library
RUN npm run build -w api

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/forms-engine ./packages/forms-engine
COPY --from=builder /app/packages/forms-library ./packages/forms-library
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/scripts ./apps/api/scripts

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "scripts/start-release.cjs"]
