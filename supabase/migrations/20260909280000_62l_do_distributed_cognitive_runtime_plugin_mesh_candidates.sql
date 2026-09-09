-- 62L-DO Distributed Cognitive Runtime Plugin Mesh — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Installed/configured plugins NOT trusted until XIV verifies.
-- Registration ≠ authority / credentials / billing / deploy.
-- Deny-by-default; sealed never silent; device/chip verified-only.
-- Skill exchange ≠ permission; memory lake requires provenance/rights.
-- SoT: GitHub #132. GitLab #66 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS do_distributed_cognitive_runtime_plugin_mesh (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  fabric_id text NOT NULL,
  predecessor_layer text NOT NULL,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  tip_land boolean NOT NULL DEFAULT false,
  full_production_plugin_mesh_shipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS do_plugin_manifests (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  version text NOT NULL,
  schema_version text NOT NULL,
  category text NOT NULL,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  installed boolean NOT NULL DEFAULT false,
  configured boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false,
  trust_state text NOT NULL,
  sandbox boolean NOT NULL DEFAULT true,
  agent_built boolean NOT NULL DEFAULT false,
  killed boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  drift_detected boolean NOT NULL DEFAULT false,
  grants_authority boolean NOT NULL DEFAULT false,
  grants_credentials boolean NOT NULL DEFAULT false,
  grants_billing boolean NOT NULL DEFAULT false,
  grants_deploy boolean NOT NULL DEFAULT false,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS do_plugin_audit_events (
  id uuid PRIMARY KEY,
  plugin_id uuid,
  action text NOT NULL,
  status text NOT NULL,
  reason text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS do_device_chip_capabilities (
  id uuid PRIMARY KEY,
  device_id text NOT NULL,
  chip_id text NOT NULL,
  capability text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS do_memory_lake_entries (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  title text NOT NULL,
  provenance text,
  rights_authorized boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS do_zero_trust_routes (
  id uuid PRIMARY KEY,
  from_node text NOT NULL,
  to_node text NOT NULL,
  sealed boolean NOT NULL DEFAULT false,
  silent boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  raw_private_pooling boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
