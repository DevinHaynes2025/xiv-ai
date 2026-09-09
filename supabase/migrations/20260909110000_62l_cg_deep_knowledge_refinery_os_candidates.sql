-- 62L-CG Deep Knowledge Refinery OS — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- SoT: GitHub #97; GitLab #31 coordination only.
-- Intelligent Storage/Index Compiler may recommend these; cannot auto-apply.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cg_os_subsystems (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  subsystem_id text NOT NULL,
  layer text NOT NULL DEFAULT 'coexistence',
  mega_delta_swallowed boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cg_research_skill_grants (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id uuid NOT NULL,
  agent_id text NOT NULL,
  skill_key text NOT NULL,
  permission_level integer NOT NULL DEFAULT 0,
  authority_level integer NOT NULL DEFAULT 0,
  skill_is_permission_grant boolean NOT NULL DEFAULT false,
  learning_is_self_escalation boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cg_archive_federation_nodes (
  id uuid PRIMARY KEY,
  label text NOT NULL,
  kind text NOT NULL,
  universe_id text NOT NULL,
  authorized boolean NOT NULL DEFAULT false,
  raw_private_pooling boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cg_archive_federation_edges (
  id uuid PRIMARY KEY,
  from_node_id uuid NOT NULL,
  to_node_id uuid NOT NULL,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cg_storage_index_candidates (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  ddl_hint text NOT NULL,
  status text NOT NULL DEFAULT 'not_applied',
  auto_applied boolean NOT NULL DEFAULT false,
  production_alter boolean NOT NULL DEFAULT false,
  live_supabase_apply boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cg_reasoning_routes (
  id uuid PRIMARY KEY,
  prompt_id text NOT NULL,
  sensitivity text NOT NULL,
  selected_provider text,
  status text NOT NULL,
  silent_cloud_fallback boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cg_edge_deploy_profiles (
  id uuid PRIMARY KEY,
  device_id text NOT NULL,
  kind text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  stealth_install boolean NOT NULL DEFAULT false,
  installed_on_device boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Suggested indexes (compiler candidates only; NOT_APPLIED)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS cg_archive_nodes_universe_idx
--   ON cg_archive_federation_nodes (universe_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS cg_skill_grants_agent_idx
--   ON cg_research_skill_grants (agent_id);
*/
-- END NOT_APPLIED CANDIDATES
