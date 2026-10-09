#!/usr/bin/env bash
# Generates packages/shared/src/database.generated.ts from the migrations.
# Builds a throwaway DB on local Postgres (no Docker needed), so types always
# match supabase/migrations exactly.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/packages/shared/src/database.generated.ts"
DB="modulr_types_$$"

createdb "$DB"
trap 'dropdb --if-exists "$DB"' EXIT

for f in "$ROOT/scripts/db/supabase-stub.sql" "$ROOT"/supabase/migrations/*.sql; do
  psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null
done

"$ROOT/node_modules/.bin/supabase" gen types typescript \
  --db-url "postgresql://$(whoami)@localhost:5432/$DB?sslmode=disable" \
  --schema public 2>/dev/null >"$OUT"

"$ROOT/node_modules/.bin/prettier" --write "$OUT" >/dev/null
echo "Wrote $OUT"
