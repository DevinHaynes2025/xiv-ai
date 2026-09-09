-- 62L-CN World Knowledge Routing OS / Corridor Graph / Mini-Server Mesh /
-- Historical Infrastructure Atlas / Cross-Border Research / Memory Exchange
-- CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Extends CL/CI candidate surfaces conceptually; write deny-by-default.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cn_configured_endpoints (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  label text NOT NULL,
  kind text NOT NULL,
  region text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  trust_score integer NOT NULL DEFAULT 0,
  sealed_capable boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cn_corridor_edges (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  from_endpoint_id uuid NOT NULL,
  to_endpoint_id uuid NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  trust_weight integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  sealed_allowed boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cn_mini_servers (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  region text NOT NULL,
  cell_ref text,
  configured boolean NOT NULL DEFAULT false,
  enrolled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cn_atlas_entries (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  domain text NOT NULL,
  region text NOT NULL,
  era_start text NOT NULL,
  era_end text,
  summary text NOT NULL,
  provenance_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  coverage_label text NOT NULL DEFAULT 'UNKNOWN',
  verification_state text NOT NULL DEFAULT 'UNKNOWN',
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cn_research_sessions (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  topic text NOT NULL,
  jurisdictions jsonb NOT NULL DEFAULT '[]'::jsonb,
  bounded boolean NOT NULL DEFAULT true,
  permission_escalated boolean NOT NULL DEFAULT false,
  spend_escalated boolean NOT NULL DEFAULT false,
  deal_approved boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cn_memory_deltas (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  compact_payload text NOT NULL,
  checksum_sha256 text NOT NULL,
  signature text,
  signed boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  raw_private_pooling boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
