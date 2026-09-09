-- 62L-CL Global Knowledge Server Constellation — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Regional cells enrolled/isolated; no arbitrary discovery; coverage labeled only.
-- Archive intake authorized+provenance; highways configured+authorized only.
-- Sync packs signed/revocable; DB candidates never auto-applied.
-- SoT: GitHub #102. GitLab #36 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cl_knowledge_server_constellations (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id uuid NOT NULL,
  name text NOT NULL,
  coexistence_with_superbrain boolean NOT NULL DEFAULT true,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cl_regional_cloud_service_cells (
  id uuid PRIMARY KEY,
  constellation_id uuid NOT NULL,
  region_code text NOT NULL,
  label text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  isolated boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  builds_on_mini_cell boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unavailable',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cl_archive_sources (
  id uuid PRIMARY KEY,
  region_code text NOT NULL,
  language text NOT NULL,
  label text NOT NULL,
  authorized boolean NOT NULL DEFAULT false,
  provenance_ref text,
  status text NOT NULL DEFAULT 'denied',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cl_archive_intakes (
  id uuid PRIMARY KEY,
  source_id text NOT NULL,
  region_code text NOT NULL,
  language text NOT NULL,
  title text NOT NULL,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cl_cloud_endpoints (
  id uuid PRIMARY KEY,
  provider text NOT NULL,
  label text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unavailable',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cl_data_highways (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  mode text NOT NULL DEFAULT 'open',
  status text NOT NULL DEFAULT 'candidate',
  silent_cloud_fallback boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cl_civilization_graph_nodes (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  label text NOT NULL,
  statement text NOT NULL,
  era text,
  region_code text,
  trust_state text NOT NULL,
  simulation_labeled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cl_civilization_graph_edges (
  id uuid PRIMARY KEY,
  from_id uuid NOT NULL,
  to_id uuid NOT NULL,
  relation text NOT NULL,
  honesty_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cl_research_bureaus (
  id uuid PRIMARY KEY,
  region_code text NOT NULL,
  title text NOT NULL,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id uuid NOT NULL,
  sandboxed boolean NOT NULL DEFAULT true,
  autonomous_spend boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cl_bureau_skill_grants (
  id uuid PRIMARY KEY,
  bureau_id uuid NOT NULL,
  agent_id text NOT NULL,
  skill_key text NOT NULL,
  score numeric NOT NULL,
  permission_level integer NOT NULL DEFAULT 0,
  authority_level integer NOT NULL DEFAULT 0,
  skill_is_permission_grant boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cl_sync_packs (
  id uuid PRIMARY KEY,
  label text NOT NULL,
  payload_digest text NOT NULL,
  signature text,
  signed boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  trusted boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'candidate',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cl_sync_apply_attempts (
  id uuid PRIMARY KEY,
  pack_id uuid NOT NULL,
  expected_checksum text NOT NULL,
  observed_checksum text NOT NULL,
  conflict boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
