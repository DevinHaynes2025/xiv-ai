-- 62L-CP Global Knowledge Supply Chain / Plugin Foundry — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Registration ≠ authority/credentials/billing/deployment/broader data access.
-- New plugins sandbox until promotion gates; deny-by-default scopes.
-- Distribution packages signed+revocable; sealed never silent cloud via plugin gateway.
-- SoT: GitHub #106. GitLab #40 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cp_knowledge_supply_chains (
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

CREATE TABLE IF NOT EXISTS cp_supply_assets (
  id uuid PRIMARY KEY,
  chain_id uuid NOT NULL,
  kind text NOT NULL,
  name text NOT NULL,
  capability_tag text NOT NULL,
  registered boolean NOT NULL DEFAULT true,
  approved boolean NOT NULL DEFAULT false,
  grants_authority boolean NOT NULL DEFAULT false,
  grants_credentials boolean NOT NULL DEFAULT false,
  grants_billing boolean NOT NULL DEFAULT false,
  grants_deployment boolean NOT NULL DEFAULT false,
  grants_broader_data_access boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'registered',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_foundry_plugins (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  capability_tag text NOT NULL,
  lifecycle text NOT NULL DEFAULT 'sandbox',
  sandbox boolean NOT NULL DEFAULT true,
  promoted boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false,
  unit_tests_pass boolean NOT NULL DEFAULT false,
  integration_tests_pass boolean NOT NULL DEFAULT false,
  security_tests_pass boolean NOT NULL DEFAULT false,
  benchmarks_pass boolean NOT NULL DEFAULT false,
  human_review_pass boolean NOT NULL DEFAULT false,
  elevated_permissions boolean NOT NULL DEFAULT false,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_third_party_plugins (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  version text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  licensing_terms_accepted boolean NOT NULL DEFAULT false,
  sbom_ref text,
  secret_refs text[] NOT NULL DEFAULT '{}',
  configured boolean NOT NULL DEFAULT false,
  health text NOT NULL DEFAULT 'unconfigured',
  circuit_open boolean NOT NULL DEFAULT true,
  failure_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unavailable',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_refinery_nodes (
  id uuid PRIMARY KEY,
  region_code text NOT NULL,
  label text NOT NULL,
  authorized boolean NOT NULL DEFAULT false,
  builds_on_cf_cg boolean NOT NULL DEFAULT true,
  plugin_ids text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'unavailable',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_institutional_memory_nodes (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  institution text NOT NULL,
  statement text NOT NULL,
  provenance_ref text,
  trust_state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cp_distribution_packages (
  id uuid PRIMARY KEY,
  label text NOT NULL,
  kind text NOT NULL,
  payload_digest text NOT NULL,
  signature text,
  signed boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'rejected',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
