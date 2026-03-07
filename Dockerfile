FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
# Install python/make/g++ to compile better-sqlite3 from source for Alpine (musl libc)
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json pnpm-lock.yaml .npmrc* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# We need python/make/g++ in builder too in case Next.js triggers native rebuilds or postinstall scripts
RUN apk add --no-cache python3 make g++
RUN corepack enable pnpm \
    && pnpm rebuild better-sqlite3 \
    && pnpm build

FROM base AS runner
ENV NODE_ENV=production
# Next.js standalone output config
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Data directory for SQLite database
RUN mkdir -p /app/data && chown -R node:node /app/data

USER node
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
