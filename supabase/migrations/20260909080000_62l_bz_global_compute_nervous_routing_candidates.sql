-- 62L-BZ Global Compute Nervous Routing — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS bz_compute_nervous_nodes (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id uuid NOT NULL,
  label text NOT NULL,
  locality text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unavailable',
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bz_chip_design_candidates (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'sandbox_candidate',
  fab_authority boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bz_cache_coherence_entries (
  id uuid PRIMARY KEY,
  cache_key text NOT NULL,
  freshness text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  coherence_epoch bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bz_federated_devices (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'unavailable',
  authorized boolean NOT NULL DEFAULT false,
  enrolled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bz_business_signals (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  topic text NOT NULL,
  derived boolean NOT NULL DEFAULT true,
  authorized boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'denied',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bz_cognitive_routes (
  id uuid PRIMARY KEY,
  selected_candidate_id text,
  status text NOT NULL,
  purchase_authority boolean NOT NULL DEFAULT false,
  billing_authority boolean NOT NULL DEFAULT false,
  compile_generation bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
