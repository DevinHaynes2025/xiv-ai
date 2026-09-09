-- 62L-DI Personalized Intelligence Companion OS — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- SoT: GitHub #126. GitLab #60 coordination only.
-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS di_personalized_intelligence_companion_os (
  id uuid PRIMARY KEY, org_id uuid NOT NULL, tenant_id uuid NOT NULL, universe_id text NOT NULL,
  predecessor_layer text NOT NULL, l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false, tip_land boolean NOT NULL DEFAULT false,
  full_production_companion_shipped boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS di_forecast_memories (
  id uuid PRIMARY KEY, network_id uuid NOT NULL, forecast_id text NOT NULL,
  original_label text NOT NULL, current_label text NOT NULL, probability double precision NOT NULL,
  labeled_verified_fact boolean NOT NULL DEFAULT false, history_rewritten_as_fact boolean NOT NULL DEFAULT false,
  status text NOT NULL, reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS di_marketplace_listings (
  id uuid PRIMARY KEY, marketplace_id uuid NOT NULL, team_name text NOT NULL,
  grants_credentials boolean NOT NULL DEFAULT false, grants_billing boolean NOT NULL DEFAULT false,
  grants_deploy boolean NOT NULL DEFAULT false, grants_authority boolean NOT NULL DEFAULT false,
  status text NOT NULL, reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
