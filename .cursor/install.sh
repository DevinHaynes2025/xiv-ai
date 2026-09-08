#!/usr/bin/env bash
#
# Idempotent dev-environment bootstrap for the XIV AI repository.
# Installs dependencies for both the AI service and the mobile app, and seeds
# local (gitignored) env files so the services can boot. Real credentials
# should be provided via Cursor Secrets / environment variables, which take
# precedence over the placeholders written here.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[install] Node $(node -v), npm $(npm -v)"

echo "[install] Installing AI service dependencies (services/ai)"
( cd "$repo_root/services/ai" && npm ci )

echo "[install] Installing mobile app dependencies (apps/mobile)"
( cd "$repo_root/apps/mobile" && npm ci )

# Seed the AI service env from the example if it does not exist. Empty values
# are valid: the service starts and reports optional integrations as
# unconfigured until real keys are supplied.
ai_env="$repo_root/services/ai/.env"
if [ ! -f "$ai_env" ]; then
  echo "[install] Seeding services/ai/.env from .env.example"
  cp "$repo_root/services/ai/.env.example" "$ai_env"
fi

# The mobile app throws at startup if the Supabase env vars are empty, so seed
# a local .env.local with harmless placeholders only when neither the file nor
# a real value from the environment is present.
mobile_env="$repo_root/apps/mobile/.env.local"
if [ ! -f "$mobile_env" ] && [ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" ]; then
  echo "[install] Seeding apps/mobile/.env.local with local dev placeholders"
  cat > "$mobile_env" <<'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_placeholder_local_dev_only
EXPO_PUBLIC_XIV_AI_URL=http://localhost:8787
EOF
fi

echo "[install] Done."
