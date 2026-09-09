-- 62L-DN Universal Agent Runtime OS — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Installed plugins ≠ auto-trusted; compat/trust gate required.
-- Unverified device platforms → UNAVAILABLE/NOT_TESTED.
-- Civilization memory requires provenance + rights.
-- No demographic profiling by race/gender/culture/background.
-- Adult 18+ where required; under-18 DENIED.
-- RUNNING_VERIFIED only with fresh heartbeat on powered authorized node.
-- Optimizer has no spend/billing authority.
-- Sealed silent leak via plugin/device fabric DENIED.
-- Plugin exchange registration ≠ credentials/billing/deploy.
-- SoT: GitHub #131. GitLab #65 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS dn_universal_agent_runtime_os (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  predecessor_layer text NOT NULL,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  tip_land boolean NOT NULL DEFAULT false,
  full_production_dn_shipped boolean NOT NULL DEFAULT false,
  coexistence_not_mega_merge boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dn_device_profiles (
  id uuid PRIMARY KEY,
  fabric_id uuid NOT NULL,
  platform text NOT NULL,
  compatibility_tested boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dn_civilization_memory_nodes (
  id uuid PRIMARY KEY,
  graph_id uuid NOT NULL,
  region text NOT NULL,
  title text NOT NULL,
  provenance_ref text,
  rights_ref text,
  authorized boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dn_plugin_exchange_entries (
  id uuid PRIMARY KEY,
  exchange_id uuid NOT NULL,
  plugin_id text NOT NULL,
  name text NOT NULL,
  installed boolean NOT NULL DEFAULT false,
  compatibility_tested boolean NOT NULL DEFAULT false,
  trust_state text NOT NULL,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dn_shift_slots (
  id uuid PRIMARY KEY,
  scheduler_id uuid NOT NULL,
  name text NOT NULL,
  mode text NOT NULL,
  node_id uuid,
  status text NOT NULL,
  last_heartbeat_at timestamptz,
  runtime_evidence text,
  bounded boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dn_accelerator_targets (
  id uuid PRIMARY KEY,
  brain_id uuid NOT NULL,
  kind text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dn_sealed_leak_attempts (
  id uuid PRIMARY KEY,
  kernel_id uuid NOT NULL,
  channel text NOT NULL,
  silent boolean NOT NULL DEFAULT true,
  status text NOT NULL,
  reason text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
