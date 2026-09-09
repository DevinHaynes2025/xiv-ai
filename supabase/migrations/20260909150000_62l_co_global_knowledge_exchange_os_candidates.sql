-- 62L-CO Global Knowledge Exchange OS / Regional Micro-Cloud Fabric / Archive Discovery /
-- Trade-Tech Graph / Cross-Cloud Compression / Research Coordination — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Extends CL constellation / CI surfaces conceptually; write deny-by-default.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS co_exchange_endpoints (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  kind text NOT NULL,
  label text NOT NULL,
  region_id text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS co_exchange_attempts (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  from_endpoint_id uuid,
  to_endpoint_id uuid,
  accepted boolean NOT NULL DEFAULT false,
  state text NOT NULL,
  residency text,
  classification text,
  provenance_ref text,
  sealed boolean NOT NULL DEFAULT false,
  reason text NOT NULL,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS co_regional_micro_clouds (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  region_id text NOT NULL,
  label text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  isolation_default boolean NOT NULL DEFAULT true,
  raw_private_pooling_default boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS co_archive_discovery_sources (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  name text NOT NULL,
  authorized boolean NOT NULL DEFAULT false,
  coverage_claim text NOT NULL,
  coverage_status text NOT NULL,
  coverage_evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  unknown_gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS co_trade_tech_graph_nodes (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  kind text NOT NULL,
  provenance_ref text,
  trust_state text NOT NULL,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS co_trade_tech_graph_edges (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  from_id uuid NOT NULL,
  to_id uuid NOT NULL,
  kind text NOT NULL,
  pathway text NOT NULL,
  provenance_ref text,
  trust_state text NOT NULL,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS co_compression_candidates (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'candidate',
  auto_applied boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS co_knowledge_packs (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  label text NOT NULL,
  signed boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  checksum text NOT NULL,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS co_research_workcells (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  region_id text NOT NULL,
  objective text NOT NULL,
  bounded boolean NOT NULL DEFAULT true,
  permission_escalation boolean NOT NULL DEFAULT false,
  spend_authority boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
