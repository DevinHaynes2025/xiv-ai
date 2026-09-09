-- 62L-CW Autonomous Research Infrastructure OS — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Offline realism: WAITING_NODE / OFFLINE_STOPPED when all authorized devices off.
-- RUNNING_VERIFIED requires heartbeat/runtime evidence.
-- Model/tool/experiment lineage required.
-- Lakehouse: no unknown-rights; governed authorized sources.
-- Adaptive compute: verified CPU/GPU/NPU/quantum only; classical baseline for quantum.
-- Algorithm discovery: reproducibility required for VERIFIED; negatives retained.
-- Universe replication: signed; authorized; revocable; no raw private pooling by default.
-- SoT: GitHub #114. GitLab #48 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cw_research_infra_os_instances (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  tip_land boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cw_offline_agent_laboratories (
  id uuid PRIMARY KEY,
  infra_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL,
  last_heartbeat_at timestamptz,
  runtime_evidence text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cw_offline_lab_devices (
  id uuid PRIMARY KEY,
  lab_id uuid NOT NULL,
  name text NOT NULL,
  authorized boolean NOT NULL DEFAULT true,
  powered_on boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS cw_experiment_graph_nodes (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  ref_id text NOT NULL,
  parent_node_id uuid,
  lineage_complete boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cw_knowledge_lakehouse_objects (
  id uuid PRIMARY KEY,
  source_id text NOT NULL,
  rights_class text NOT NULL,
  content_summary text NOT NULL,
  searchable_negative boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cw_adaptive_compute_targets (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cw_algorithm_candidates (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  hypothesis_text text NOT NULL,
  reproducibility_metadata jsonb,
  negative_result boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cw_universe_replication_links (
  id uuid PRIMARY KEY,
  source_universe_id text NOT NULL,
  target_universe_id text NOT NULL,
  authorized boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cw_universe_replication_packs (
  id uuid PRIMARY KEY,
  source_universe_id text NOT NULL,
  target_universe_id text NOT NULL,
  payload_digest text NOT NULL,
  signature text,
  signed boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  raw_private_pooling boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
