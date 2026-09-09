-- 62L-CI Persistent Intelligence Economy / Workforce / Simulation / DB Lab / Model Academy / Edge Exchange
-- CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload. No live Supabase apply.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Extends CF/CE/CD candidate surfaces conceptually; write deny-by-default.
-- Resource accounting ≠ spend/purchase/billing authority.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS ci_intelligence_economy_accounts (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  compute_units numeric NOT NULL DEFAULT 0,
  memory_units numeric NOT NULL DEFAULT 0,
  storage_units numeric NOT NULL DEFAULT 0,
  model_call_units numeric NOT NULL DEFAULT 0,
  spend_authority boolean NOT NULL DEFAULT false,
  purchase_authority boolean NOT NULL DEFAULT false,
  billing_authority boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ci_workforce_agents (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL,
  last_heartbeat_at timestamptz,
  runtime_evidence text,
  permission_level integer NOT NULL DEFAULT 0,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ci_simulation_runs (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  kind text NOT NULL,
  scenario text NOT NULL,
  label text NOT NULL DEFAULT 'LABELED_SIMULATION',
  verified_fact boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ci_db_research_proposals (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  title text NOT NULL,
  sql_candidate text NOT NULL,
  sandbox boolean NOT NULL DEFAULT true,
  applied boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'SANDBOX_CANDIDATE',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ci_model_evolution_candidates (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  model_id text NOT NULL,
  eval_score numeric NOT NULL,
  baseline_score numeric NOT NULL,
  status text NOT NULL,
  permission_escalation boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ci_edge_nodes (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ci_knowledge_deltas (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  payload_digest text NOT NULL,
  checksum_sha256 text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
