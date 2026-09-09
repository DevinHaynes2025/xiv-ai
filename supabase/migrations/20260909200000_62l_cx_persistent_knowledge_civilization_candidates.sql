-- 62L-CX Persistent Knowledge Civilization — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Colonies: RUNNING_VERIFIED requires heartbeat; no powered node → WAITING_NODE/OFFLINE_STOPPED.
-- Memory products must be signed; raw private not globally pooled.
-- Accelerator grid: verified AMD/NVIDIA/NPU/quantum only; classical baseline for quantum.
-- Tool ecosystem: reuse-first; registration ≠ authority; no self-promotion to production.
-- Compiler: scoped approved assets only; deny raw private / unapproved cross-Universe.
-- SoT: GitHub #115. GitLab #49 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cx_knowledge_civilizations (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  tip_land boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cx_research_colonies (
  id uuid PRIMARY KEY,
  civilization_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL,
  authorized_node_powered boolean NOT NULL DEFAULT false,
  last_heartbeat_at timestamptz,
  runtime_evidence text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cx_evolution_candidates (
  id uuid PRIMARY KEY,
  model_id text NOT NULL,
  parent_model_id text,
  status text NOT NULL,
  eval_passed boolean NOT NULL DEFAULT false,
  human_review_passed boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cx_memory_products (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  label text NOT NULL,
  signed boolean NOT NULL DEFAULT false,
  signature_ref text,
  contains_raw_private boolean NOT NULL DEFAULT false,
  globally_pooled boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cx_accelerator_targets (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cx_ecosystem_tools (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  capability_key text NOT NULL,
  lifecycle text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cx_compiler_transfers (
  id uuid PRIMARY KEY,
  source_universe_id text NOT NULL,
  target_universe_id text NOT NULL,
  asset_class text NOT NULL,
  asset_ref text NOT NULL,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
