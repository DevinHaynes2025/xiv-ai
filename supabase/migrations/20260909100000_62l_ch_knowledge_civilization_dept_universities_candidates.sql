-- 62L-CH Knowledge Civilization / Dept Universities — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Adaptive DB/Memory Fabric: recommend/test ≠ auto-alter production DBs.
-- SoT: GitHub #98. GitLab #32 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS ch_knowledge_civilizations (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id uuid NOT NULL,
  name text NOT NULL,
  coexistence_with_superbrain boolean NOT NULL DEFAULT true,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_department_universities (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id uuid NOT NULL,
  department text NOT NULL,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_skill_transcripts (
  id uuid PRIMARY KEY,
  university_id uuid NOT NULL,
  agent_id text NOT NULL,
  skill_key text NOT NULL,
  score numeric NOT NULL,
  trust_state text NOT NULL DEFAULT 'candidate',
  permission_level integer NOT NULL DEFAULT 0,
  authority_level integer NOT NULL DEFAULT 0,
  skill_is_permission_grant boolean NOT NULL DEFAULT false,
  learning_is_authority boolean NOT NULL DEFAULT false,
  measurable boolean NOT NULL DEFAULT true,
  reversible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_world_model_nodes (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('fact','correlation','causal_hypothesis','simulation')),
  label text NOT NULL,
  statement text NOT NULL,
  trust_state text NOT NULL,
  simulation_labeled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_db_fabric_proposals (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  summary text NOT NULL,
  status text NOT NULL DEFAULT 'candidate',
  auto_applied boolean NOT NULL DEFAULT false,
  production_altered boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_edge_colony_nodes (
  id uuid PRIMARY KEY,
  label text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unavailable',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_expert_council_members (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL,
  role text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unavailable',
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
