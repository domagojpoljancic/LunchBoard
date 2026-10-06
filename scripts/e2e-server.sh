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
# A warm .next from an earlier build can mix chunks and fail prerendering, so start clean.
rm -rf "$ROOT/.next"
npm run build
exec npx next start -p "$PORT" -H 127.0.0.1
