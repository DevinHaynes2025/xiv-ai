-- 62L-CU Cognitive Research Cloud / University Federation / Model Academy /
-- Experiment Memory / Scientific Compute / Algorithm Graph / Plugin Runtime
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Experiments require reproducibility metadata; without it NOT_VERIFIED.
-- Negative results remain searchable (never discarded).
-- Algorithm variants carry lineage parent links.
-- Local model improvements = sandbox until eval + human review.
-- No uncontrolled self-improvement; unknown-rights training DENIED.
-- Plugin runtime deny-by-default; registration ≠ authority (reuse CP).
-- Scientific compute local-first; AWS/GCP configured+authorized+verified only;
--   sealed never silent cloud fallback.
-- University skill ≠ permission. Queue cannot production-deploy.
-- SoT: GitHub #111. GitLab #45 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cu_cognitive_research_clouds (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'local_first_offline_brain',
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cu_federated_universities (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  department text NOT NULL,
  region text NOT NULL,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  bounded boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cu_university_skill_grants (
  id uuid PRIMARY KEY,
  university_id uuid NOT NULL,
  agent_id text NOT NULL,
  skill_key text NOT NULL,
  prior_permission_level integer NOT NULL DEFAULT 0,
  permission_level integer NOT NULL DEFAULT 0,
  permission_increased boolean NOT NULL DEFAULT false,
  skill_is_permission_grant boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cu_local_model_candidates (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  lifecycle text NOT NULL,
  sandbox boolean NOT NULL DEFAULT true,
  eval_pass boolean NOT NULL DEFAULT false,
  human_review_pass boolean NOT NULL DEFAULT false,
  rights_known boolean NOT NULL DEFAULT false,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cu_experiments (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  outcome text NOT NULL,
  reproducibility_json jsonb,
  verification_state text NOT NULL,
  discarded boolean NOT NULL DEFAULT false,
  searchable boolean NOT NULL DEFAULT true,
  negative_kept boolean NOT NULL DEFAULT false,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cu_scientific_compute_endpoints (
  id uuid PRIMARY KEY,
  provider text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cu_scientific_compute_routes (
  id uuid PRIMARY KEY,
  provider text NOT NULL,
  content_mode text NOT NULL,
  silent_fallback_requested boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cu_algorithm_nodes (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  parent_id uuid,
  lineage_root_id uuid NOT NULL,
  lineage_depth integer NOT NULL DEFAULT 0,
  outcome text NOT NULL,
  negative_kept boolean NOT NULL DEFAULT false,
  searchable boolean NOT NULL DEFAULT true,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cu_runtime_plugins (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  registered boolean NOT NULL DEFAULT true,
  grants_authority boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cu_runtime_invokes (
  id uuid PRIMARY KEY,
  plugin_id uuid NOT NULL,
  requested_scope text NOT NULL,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Suggested indexes (candidates only; NOT_APPLIED)
-- CREATE INDEX IF NOT EXISTS cu_experiments_outcome_idx ON cu_experiments (outcome);
-- CREATE INDEX IF NOT EXISTS cu_experiments_searchable_idx ON cu_experiments (searchable) WHERE searchable = true;
-- CREATE INDEX IF NOT EXISTS cu_algorithm_parent_idx ON cu_algorithm_nodes (parent_id);
-- CREATE INDEX IF NOT EXISTS cu_algorithm_lineage_root_idx ON cu_algorithm_nodes (lineage_root_id);
*/
-- END NOT_APPLIED CANDIDATES
