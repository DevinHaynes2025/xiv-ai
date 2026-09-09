-- 62L-CF Data Refinery / Compression / Replication — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Extends CE/CD candidate surfaces conceptually; write deny-by-default.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cf_refinery_packs (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  source_id text NOT NULL,
  checksum_sha256 text NOT NULL,
  classification text NOT NULL,
  rejected boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cf_archive_research_shifts (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  archive_id text NOT NULL,
  authorization text NOT NULL,
  bound_max_hops integer NOT NULL,
  hops_used integer NOT NULL DEFAULT 0,
  accepted boolean NOT NULL DEFAULT false,
  soul_resurrection_claim boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cf_compression_candidates (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  source_pack_id text NOT NULL,
  method text NOT NULL,
  status text NOT NULL DEFAULT 'sandbox_candidate',
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cf_intelligence_providers (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unavailable',
  failure_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cf_device_lab_experiments (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'sandbox',
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cf_offline_replication_packs (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  checksum_sha256 text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  trusted boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
