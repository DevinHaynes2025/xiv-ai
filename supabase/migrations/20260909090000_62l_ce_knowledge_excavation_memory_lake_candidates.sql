-- 62L-CE Knowledge Excavation / Memory Lake — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- CD mesh write-to-DB deny-by-default if touching CD archive mesh.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS ce_knowledge_sources (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  label text NOT NULL,
  authorized boolean NOT NULL DEFAULT false,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'denied',
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ce_research_council_members (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  role text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unavailable',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ce_memory_lake_records (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  domain text NOT NULL,
  title text NOT NULL,
  era_start_year integer NOT NULL,
  era_end_year integer NOT NULL,
  time_aware boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'denied',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ce_persona_simulations (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  era_year integer NOT NULL,
  labeled_simulation boolean NOT NULL DEFAULT true,
  soul_resurrection_claim boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'labeled_simulation',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ce_pipeline_jobs (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  source_label text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  current_stage text NOT NULL,
  enrichment_reached boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'running',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ce_hardware_combos (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  cpu text NOT NULL,
  gpu text,
  npu text,
  memory_gb integer NOT NULL,
  compiler text NOT NULL,
  runtime text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unavailable',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ce_compression_research (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  technique text NOT NULL,
  status text NOT NULL DEFAULT 'research_candidate',
  auto_deploy boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ce_edge_energy_profiles (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  kind text NOT NULL,
  energy_score numeric NOT NULL,
  security_score numeric NOT NULL,
  correctness_score numeric NOT NULL,
  sealed_policy_ok boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
