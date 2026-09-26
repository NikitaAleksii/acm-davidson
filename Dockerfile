# ACM Davidson website. Works on Railway, Fly.io, Render, or any Docker host.
#
# Persistent data (SQLite database + uploaded images) lives under /data.
# Mount a volume there and set:
#   DATABASE_URL=file:/data/acm.db
#   UPLOAD_DIR=/data/uploads

FROM node:22-bookworm-slim AS base
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
# Prisma's query engine needs OpenSSL; curl is used by the health check.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- dependencies (including dev deps needed for the build) ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

# ---- build ----
FROM deps AS build
COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    DATABASE_URL=file:/tmp/build.db
RUN npm run build

# ---- runtime ----
FROM base AS runner
ENV PORT=3000 \
    DATABASE_URL=file:/data/acm.db \
    UPLOAD_DIR=/data/uploads
# Runs as root on purpose: hosted volumes (Railway, Render) are mounted root-owned and a
# non-root process could not create the database there. The container has nothing else in it.
RUN mkdir -p /data
COPY --from=build /app ./
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD curl -fsS http://localhost:3000/api/health || exit 1
CMD ["sh", "scripts/start.sh"]
