-- 62L-CK Cognitive Infrastructure Grid / Mini Cloud / History — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- SoT: GitHub #101; GitLab #35 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS ck_grid_subsystems (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  subsystem_id text NOT NULL,
  layer text NOT NULL DEFAULT 'coexistence',
  mega_delta_swallowed boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ck_mini_cloud_cells (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  label text NOT NULL,
  kind text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  isolated boolean NOT NULL DEFAULT true,
  stealth_takeover boolean NOT NULL DEFAULT false,
  production_network_bound boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ck_federation_enrollments (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  write_allowed boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  production_auto_alter boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ck_historical_pathways (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  pack text NOT NULL,
  label text NOT NULL,
  has_provenance boolean NOT NULL DEFAULT false,
  has_evidence boolean NOT NULL DEFAULT false,
  root_graph_admitted boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ck_agent_operating_companies (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id uuid NOT NULL,
  name text NOT NULL,
  bounded boolean NOT NULL DEFAULT true,
  sandboxed boolean NOT NULL DEFAULT true,
  spend_authority boolean NOT NULL DEFAULT false,
  billing_authority boolean NOT NULL DEFAULT false,
  permission_level integer NOT NULL DEFAULT 0,
  authority_level integer NOT NULL DEFAULT 0,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ck_device_fabric (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  device_id text NOT NULL,
  kind text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  hidden_deploy boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
