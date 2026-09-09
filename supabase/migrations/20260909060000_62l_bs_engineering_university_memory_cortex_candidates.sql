-- XIV 62L-BS Engineering University / Test Lab / Architecture Evolution /
-- Review Council / Engineering Memory Cortex candidates
-- MIGRATION AUTHORED — NOT_APPLIED — DO NOT APPLY FROM THIS COMMIT.
-- Requires separate migration review, tenant/Universe RLS tests, rollback evidence, and human authorization.
-- L4 autonomy remains disabled. This schema does not authorize deployment, tip-land, or cloud access.
-- Does not overload production tables; candidate tables only.

-- Candidate: software engineering skill certifications (no permission/authority columns as grants)
CREATE TABLE IF NOT EXISTS xiv_bs_skill_certifications_candidate (
  id uuid PRIMARY KEY,
  org_id text NOT NULL,
  tenant_id text NOT NULL,
  universe_id text NOT NULL,
  agent_id text NOT NULL,
  skill_key text NOT NULL,
  trust_state text NOT NULL DEFAULT 'uncertified',
  permission_level integer NOT NULL DEFAULT 0,
  authority_level integer NOT NULL DEFAULT 0,
  skill_is_permission_grant boolean NOT NULL DEFAULT false,
  learning_is_self_escalation boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  certified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Candidate: flaky / regression evidence labels (suspected until verified)
CREATE TABLE IF NOT EXISTS xiv_bs_test_lab_signals_candidate (
  id uuid PRIMARY KEY,
  org_id text NOT NULL,
  tenant_id text NOT NULL,
  universe_id text NOT NULL,
  test_name text NOT NULL,
  signal_kind text NOT NULL,
  evidence_label text NOT NULL,
  flake_label text,
  auto_production_block boolean NOT NULL DEFAULT false,
  false_positive_possible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Candidate: architecture drift + refactor candidates (never auto-applied)
CREATE TABLE IF NOT EXISTS xiv_bs_architecture_candidates (
  id uuid PRIMARY KEY,
  org_id text NOT NULL,
  tenant_id text NOT NULL,
  universe_id text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'candidate',
  applied boolean NOT NULL DEFAULT false,
  auto_deploy boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Candidate: review council sessions (recommendation only; no auto-merge)
CREATE TABLE IF NOT EXISTS xiv_bs_review_council_sessions_candidate (
  id uuid PRIMARY KEY,
  org_id text NOT NULL,
  tenant_id text NOT NULL,
  universe_id text NOT NULL,
  subject text NOT NULL,
  consensus text NOT NULL DEFAULT 'recommendation_only',
  merged boolean NOT NULL DEFAULT false,
  auto_merged boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Candidate: engineering memory cortex auditable links (reject hidden reasoning)
CREATE TABLE IF NOT EXISTS xiv_bs_engineering_memory_links_candidate (
  id uuid PRIMARY KEY,
  org_id text NOT NULL,
  tenant_id text NOT NULL,
  universe_id text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  trust_tier text NOT NULL DEFAULT 'candidate',
  outcome_verification text NOT NULL,
  hidden_reasoning_trace boolean NOT NULL DEFAULT false,
  auditable boolean NOT NULL DEFAULT true,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS sketches (NOT_APPLIED): tenant/universe isolation required before any apply.
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY ... USING (tenant_id = auth.jwt()->>'tenant_id');
