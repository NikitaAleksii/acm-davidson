#!/bin/sh
# Production start: apply migrations, create the first owner if needed, run the server.
set -e
cd "$(dirname "$0")/.."

echo "[start] applying database migrations"
npx prisma migrate deploy

echo "[start] bootstrap checks"
npx tsx scripts/bootstrap.ts

echo "[start] starting Next.js on port ${PORT:-3000}"
exec npx next start -p "${PORT:-3000}"
