#!/usr/bin/env bash
# Run the XIV SQL migrations and their negative tests against a local PostgreSQL.
#
#   ./supabase/tests/run-local.sh
#
# Requires a running PostgreSQL you can reach as a superuser. Set PSQL_SUPERUSER
# if yours is not "postgres", or DATABASE_URL to target an existing database.
#
# The hosted Supabase project already provides the auth schema and the PostgREST
# roles; supabase_shim.sql recreates just enough of them to run locally.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB_NAME="${DB_NAME:-xiv_rls_test}"
PSQL_SUPERUSER="${PSQL_SUPERUSER:-postgres}"

run_psql() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    psql "${DATABASE_URL}" -q -v ON_ERROR_STOP=1 "$@"
  else
    sudo -u "${PSQL_SUPERUSER}" psql -d "${DB_NAME}" -q -v ON_ERROR_STOP=1 "$@"
  fi
}

if [[ -z "${DATABASE_URL:-}" ]]; then
  sudo -u "${PSQL_SUPERUSER}" dropdb --if-exists "${DB_NAME}"
  sudo -u "${PSQL_SUPERUSER}" createdb "${DB_NAME}"
fi

echo "[xiv-sql] applying the Supabase shim"
run_psql -f "${REPO_ROOT}/supabase/tests/supabase_shim.sql" >/dev/null

echo "[xiv-sql] applying the agent civilization migration"
run_psql -f "${REPO_ROOT}/supabase/migrations/20260908120000_agent_civilization_foundation.sql" >/dev/null

echo "[xiv-sql] running cross-tenant negative tests"
run_psql -f "${REPO_ROOT}/supabase/tests/agent_civilization_rls_test.sql"

echo "[xiv-sql] all SQL tests passed"
