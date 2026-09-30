# ===== Build Stage =====
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable

# Install dependencies from lockfile (layer-cached)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source (paths excluded by .dockerignore)
COPY . .

# Generate Prisma client and build Next.js
# `output: 'standalone'` in next.config.mjs makes .next/standalone self-contained.
RUN pnpm prisma generate && pnpm build

# ===== Runner Stage =====
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Standalone output bundles server.js and production-only node_modules.
# Static chunks and public/ are emitted separately and must be copied in.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma schema + migrations, for running `prisma migrate deploy` out-of-band.
COPY --from=builder /app/prisma ./prisma

# Create non-root user and fix ownership of all app files
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
