#!/usr/bin/env bash
# Applies migrations + seed to a throwaway local PostgreSQL and runs DB tests.
# Usage: PGHOST=/tmp PGPORT=54329 PGUSER=postgres tests/db/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-scootykit_test}
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
for f in tests/db/supabase_stub.sql supabase/migrations/*.sql supabase/seed.sql tests/db/commerce_test.sql; do
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f"
done
