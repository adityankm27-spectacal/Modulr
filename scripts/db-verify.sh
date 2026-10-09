#!/usr/bin/env bash
# Verifies the database: migrations + seed + RLS/entitlement tests.
#
#   pnpm db:verify                 # throwaway DB on local Postgres (no Docker needed)
#   pnpm db:verify --url <db-url>  # run tests only, against a Supabase DB that already
#                                  # has migrations + seed (e.g. after `supabase db reset`)
#
# The tests run inside a transaction and roll back, so they leave no data behind.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PSQL=(psql -X -q -v ON_ERROR_STOP=1)
TESTS="$ROOT/scripts/db/rls.test.sql"

if [[ "${1:-}" == "--url" ]]; then
  "${PSQL[@]}" "${2:?usage: db-verify.sh --url <postgres-url>}" -f "$TESTS"
  exit 0
fi

DB="modulr_verify_$$"
createdb "$DB"
trap 'dropdb --if-exists "$DB"' EXIT

echo "→ Supabase stub"
"${PSQL[@]}" -d "$DB" -f "$ROOT/scripts/db/supabase-stub.sql"

for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ migration $(basename "$f")"
  "${PSQL[@]}" -d "$DB" -f "$f"
done

echo "→ seed"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/seed.sql"

echo "→ tests"
"${PSQL[@]}" -d "$DB" -f "$TESTS"
