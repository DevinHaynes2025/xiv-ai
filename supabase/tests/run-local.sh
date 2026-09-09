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
#
# Each slice is proved on its own schema state. 62A runs against a database that
# has only the foundation applied, so the foundation stands on its own; 62B runs
# against foundation-plus-meetings, which is what production will look like.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB_NAME="${DB_NAME:-xiv_rls_test}"
DB_NAME_62B="${DB_NAME_62B:-${DB_NAME}_62b}"
PSQL_SUPERUSER="${PSQL_SUPERUSER:-postgres}"

FOUNDATION_SQL="${REPO_ROOT}/supabase/migrations/20260908120000_agent_civilization_foundation.sql"
MEETINGS_SQL="${REPO_ROOT}/supabase/migrations/20260908180000_agent_meetings_collective_reasoning.sql"

run_psql() {
  local database="$1"
  shift
  if [[ -n "${DATABASE_URL:-}" ]]; then
    psql "${DATABASE_URL}" -q -v ON_ERROR_STOP=1 "$@"
  else
    sudo -u "${PSQL_SUPERUSER}" psql -d "${database}" -q -v ON_ERROR_STOP=1 "$@"
  fi
}

reset_database() {
  local database="$1"
  if [[ -z "${DATABASE_URL:-}" ]]; then
    sudo -u "${PSQL_SUPERUSER}" dropdb --if-exists "${database}"
    sudo -u "${PSQL_SUPERUSER}" createdb "${database}"
  fi
}

echo "[xiv-sql] 62A — agent civilization foundation"
reset_database "${DB_NAME}"
run_psql "${DB_NAME}" -f "${REPO_ROOT}/supabase/tests/supabase_shim.sql" >/dev/null
run_psql "${DB_NAME}" -f "${FOUNDATION_SQL}" >/dev/null
run_psql "${DB_NAME}" -f "${REPO_ROOT}/supabase/tests/agent_civilization_rls_test.sql"

echo "[xiv-sql] 62B — agent meetings, collective reasoning and the human bridge"
if [[ -n "${DATABASE_URL:-}" ]]; then
  run_psql "${DB_NAME}" -f "${MEETINGS_SQL}" >/dev/null
  run_psql "${DB_NAME}" -f "${REPO_ROOT}/supabase/tests/agent_meetings_rls_test.sql"
else
  reset_database "${DB_NAME_62B}"
  run_psql "${DB_NAME_62B}" -f "${REPO_ROOT}/supabase/tests/supabase_shim.sql" >/dev/null
  run_psql "${DB_NAME_62B}" -f "${FOUNDATION_SQL}" >/dev/null
  run_psql "${DB_NAME_62B}" -f "${MEETINGS_SQL}" >/dev/null
  # Applied twice on purpose: both migrations must stay re-runnable, because the
  # founder applies them by hand in the Supabase SQL editor.
  run_psql "${DB_NAME_62B}" -f "${MEETINGS_SQL}" >/dev/null
  run_psql "${DB_NAME_62B}" -f "${REPO_ROOT}/supabase/tests/agent_meetings_rls_test.sql"
fi

echo "[xiv-sql] all SQL tests passed"
