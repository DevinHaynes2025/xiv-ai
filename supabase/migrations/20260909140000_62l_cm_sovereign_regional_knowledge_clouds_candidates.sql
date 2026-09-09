-- 62L-CM Sovereign Regional Knowledge Clouds / Archive Observatory / Intelligence Grid /
-- Route Optimization / Embassy Network / Offline Cache Fabric — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Extends CL/CI candidate surfaces conceptually; write deny-by-default.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cm_regional_knowledge_clouds (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  region_id text NOT NULL,
  label text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  isolation_mode text NOT NULL DEFAULT 'sovereign',
  private_pool_allowed boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cm_archive_observatory_sources (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  name text NOT NULL,
  authorized boolean NOT NULL DEFAULT false,
  coverage_claim text NOT NULL DEFAULT 'regional',
  coverage_status text NOT NULL DEFAULT 'DOCUMENTED',
  coverage_evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cm_international_intelligence_outputs (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  domain text NOT NULL,
  summary text NOT NULL,
  honesty_label text NOT NULL,
  provenance_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cm_route_optimization_nodes (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  kind text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  trust_score integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cm_agent_embassy_workcells (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  region_id text NOT NULL,
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  bounded boolean NOT NULL DEFAULT true,
  deal_authority boolean NOT NULL DEFAULT false,
  spend_authority boolean NOT NULL DEFAULT false,
  permission_escalation boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cm_offline_knowledge_caches (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  signed boolean NOT NULL DEFAULT false,
  signature_ref text,
  revoked boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cm_offline_cache_devices (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
