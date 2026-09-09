-- 62L-CJ Intelligence Resource Grid / Apprenticeship / Reconstruction / Federation / Edge — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Extends CF/CE candidate surfaces conceptually; write deny-by-default.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cj_resource_accounts (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  kind text NOT NULL,
  units_available integer NOT NULL DEFAULT 0,
  units_reserved integer NOT NULL DEFAULT 0,
  freshness_label text NOT NULL DEFAULT 'unknown',
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cj_apprenticeship_sessions (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  mentor_agent_id text NOT NULL,
  apprentice_agent_id text NOT NULL,
  mentor_eval_passed boolean NOT NULL DEFAULT false,
  authority_transferred boolean NOT NULL DEFAULT false,
  apprentice_gained_mentor_permissions boolean NOT NULL DEFAULT false,
  apprentice_gained_production_authority boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cj_historical_reconstructions (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  subject text NOT NULL,
  claim text NOT NULL,
  label text NOT NULL,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  soul_or_afterlife_claim boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cj_retrieval_memory_lab_candidates (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  kind text NOT NULL,
  proposal text NOT NULL,
  status text NOT NULL DEFAULT 'sandbox_candidate',
  auto_applied boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cj_model_federation_members (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unavailable',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cj_edge_runtime_devices (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  online boolean NOT NULL DEFAULT false,
  freshness text NOT NULL DEFAULT 'unknown',
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
