#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-3100}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB="$ROOT/prisma/e2e.db"
rm -f "$DB" "$DB-journal"
export DATABASE_URL="file:$DB"
export AUTH_SECRET="${AUTH_SECRET:-e2e-test-secret-please-change}"
cd "$ROOT"
npx prisma migrate deploy
npx prisma db seed
# Build cold, and into our own directory: a warm tree can mix chunks and fail prerendering,
# and a dev server on the shared .next would fight us for it.
export NEXT_DIST_DIR=".next-e2e"
rm -rf "$ROOT/$NEXT_DIST_DIR"
npm run build
exec npx next start -p "$PORT" -H 127.0.0.1
