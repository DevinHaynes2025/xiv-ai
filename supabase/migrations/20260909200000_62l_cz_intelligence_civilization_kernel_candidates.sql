-- 62L-CZ Intelligence Civilization Kernel — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- L4_AUTONOMY_ENABLED=false
-- Departments cannot self-grant production authority.
-- Workbench: dissent preserved; consensus ≠ verified proof.
-- Scheduler: verified AMD/NVIDIA/NPU/quantum only; classical baseline for quantum;
--   unconfigured → UNAVAILABLE; cannot spend/bill.
-- Product factory: sandbox → gates; no self-production-promote; registration ≠ authority.
-- Universe routing/recovery: authorized + signed; sealed/raw private silent route DENIED;
--   recovery cannot invent RUNNING_VERIFIED without heartbeat;
--   no powered node → WAITING_NODE / OFFLINE_STOPPED.
-- SoT: GitHub #117. GitLab #51 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cz_intelligence_civilization_kernel_instances (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  tip_land boolean NOT NULL DEFAULT false,
  coexistence_under_superbrain boolean NOT NULL DEFAULT true,
  unsafe_mega_merge boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cz_research_departments (
  id uuid PRIMARY KEY,
  kernel_id uuid NOT NULL,
  name text NOT NULL,
  sandboxed boolean NOT NULL DEFAULT true,
  production_authority boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cz_cognitive_workbench_sessions (
  id uuid PRIMARY KEY,
  kernel_id uuid NOT NULL,
  task text NOT NULL,
  consensus_reached boolean NOT NULL DEFAULT false,
  labeled_verified_proof boolean NOT NULL DEFAULT false,
  dissent_silenced boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cz_workbench_contributions (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL,
  kind text NOT NULL,
  model_or_agent_id text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cz_fabric_events (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  topic text NOT NULL,
  payload_digest text NOT NULL,
  sealed boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cz_scheduler_targets (
  id uuid PRIMARY KEY,
  vendor text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cz_schedule_attempts (
  id uuid PRIMARY KEY,
  target_id uuid,
  vendor text NOT NULL,
  classical_baseline_ref text,
  spend_requested boolean NOT NULL DEFAULT false,
  bill_requested boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cz_product_candidates (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  sandboxed boolean NOT NULL DEFAULT true,
  registered boolean NOT NULL DEFAULT true,
  production_authority boolean NOT NULL DEFAULT false,
  promoted boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cz_universe_mesh_nodes (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  universe_id text NOT NULL,
  authorized boolean NOT NULL DEFAULT true,
  powered_on boolean NOT NULL DEFAULT false,
  last_heartbeat_at timestamptz,
  runtime_evidence text,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cz_universe_routes (
  id uuid PRIMARY KEY,
  source_universe_id text NOT NULL,
  target_universe_id text NOT NULL,
  payload_digest text NOT NULL,
  signature text,
  signed boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  content_class text NOT NULL,
  silent_route boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
