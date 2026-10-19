# syntax=docker/dockerfile:1

# ---- deps: install all packages (postinstall runs `prisma generate`, so the schema is needed) ----
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci

# ---- build: Next.js standalone build + compiled seed ----
FROM node:20-alpine AS build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate \
 && npm run build \
 && npx tsc prisma/seed.ts --outDir prisma/dist --module commonjs --target es2022 --esModuleInterop --skipLibCheck

# ---- prisma-cli: the CLI with its own dependencies, for `migrate deploy` at startup ----
FROM node:20-alpine AS prisma-cli
WORKDIR /opt/prisma
COPY package.json /tmp/package.json
RUN npm init -y >/dev/null \
 && npm install --no-audit --no-fund "prisma@$(node -p "require('/tmp/package.json').dependencies.prisma")"

# ---- runner: minimal runtime image ----
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=build --chown=app:app /app/prisma/migrations ./prisma/migrations
COPY --from=build --chown=app:app /app/prisma/dist ./prisma/dist
COPY --from=build --chown=app:app /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=app:app /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=prisma-cli --chown=app:app /opt/prisma/node_modules /opt/prisma/node_modules
COPY --chown=app:app docker-entrypoint.sh ./docker-entrypoint.sh

USER app
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
