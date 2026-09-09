-- 62L-CV Distributed Intelligence Laboratory OS — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- RUNNING_VERIFIED requires heartbeat/runtime evidence.
-- Model evolution requires lineage; sandbox until eval+human review.
-- Experiment lake: no unknown-rights; negatives searchable.
-- Scheduler: verified CPU/AMD/NVIDIA/NPU/quantum only; classical baseline for quantum.
-- Tool factory: SBOM/security/benchmark gates; registration ≠ authority.
-- Knowledge expansion: lawful authorized sources only; hypothesis ≠ verified.
-- SoT: GitHub #112. GitLab #46 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cv_lab_os_instances (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  tip_land boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cv_federated_workcells (
  id uuid PRIMARY KEY,
  lab_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL,
  last_heartbeat_at timestamptz,
  runtime_evidence text,
  invented boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cv_model_evolution_nodes (
  id uuid PRIMARY KEY,
  model_id text NOT NULL,
  parent_node_id uuid,
  lineage_complete boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL,
  permission_escalation boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cv_experiment_lake_records (
  id uuid PRIMARY KEY,
  experiment_id text NOT NULL,
  kind text NOT NULL,
  rights_class text NOT NULL,
  reproducibility_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  searchable boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cv_compute_targets (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cv_schedule_attempts (
  id uuid PRIMARY KEY,
  target_id uuid,
  target_kind text NOT NULL,
  classical_baseline_ref text,
  content_mode text NOT NULL,
  silent_cloud_accelerator_fallback boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cv_research_tools (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  sbom_present boolean NOT NULL DEFAULT false,
  security_gate_passed boolean NOT NULL DEFAULT false,
  benchmark_passed boolean NOT NULL DEFAULT false,
  lifecycle text NOT NULL,
  authority_granted boolean NOT NULL DEFAULT false,
  production_deployed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cv_knowledge_expansion_records (
  id uuid PRIMARY KEY,
  source_id text NOT NULL,
  source_authorization text NOT NULL,
  claim_kind text NOT NULL,
  claim_text text NOT NULL,
  provenance text,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
