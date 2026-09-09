-- 62L-CT AI Research Civilization OS — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- L4_AUTONOMY_ENABLED=false. No uncontrolled self-improvement.
-- Unknown-rights training denied. Quantum requires classical baseline + evidence.
-- Memory compiler cannot auto-apply production schema.
-- Sim ≠ verified discovery. Correlation ≠ causation.
-- Academy skill ≠ permission. Queue cannot production-deploy.
-- SoT: GitHub #110. GitLab #44 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS ct_research_civilizations (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id uuid NOT NULL,
  coexistence_with_superbrain boolean NOT NULL DEFAULT true,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ct_research_schools (
  id uuid PRIMARY KEY,
  civilization_id uuid NOT NULL,
  name text NOT NULL,
  domain text NOT NULL,
  bounded boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'bounded',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ct_research_labs (
  id uuid PRIMARY KEY,
  school_id uuid NOT NULL,
  name text NOT NULL,
  universe_id uuid NOT NULL,
  bounded boolean NOT NULL DEFAULT true,
  permission_level integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'bounded',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ct_training_datasets (
  id uuid PRIMARY KEY,
  label text NOT NULL,
  rights_class text NOT NULL,
  sealed boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ct_memory_packs (
  id uuid PRIMARY KEY,
  label text NOT NULL,
  index_digest text NOT NULL,
  candidate_only boolean NOT NULL DEFAULT true,
  applied_to_production boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'candidate',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ct_simulation_runs (
  id uuid PRIMARY KEY,
  lab_id uuid NOT NULL,
  universe_ids text[] NOT NULL DEFAULT '{}',
  labeled boolean NOT NULL DEFAULT true,
  label text NOT NULL DEFAULT 'LABELED_SIMULATION',
  verified_discovery boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ct_accelerator_nodes (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unavailable',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ct_discovery_nodes (
  id uuid PRIMARY KEY,
  label text NOT NULL,
  kind text NOT NULL,
  evidence_refs text[] NOT NULL DEFAULT '{}',
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ct_academy_skills (
  id uuid PRIMARY KEY,
  agent_id text NOT NULL,
  skill text NOT NULL,
  sandbox boolean NOT NULL DEFAULT true,
  permission_level_before integer NOT NULL DEFAULT 0,
  permission_level_after integer NOT NULL DEFAULT 0,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
