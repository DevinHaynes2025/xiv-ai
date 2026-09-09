-- 62L-DM Global Neural Transit + Civilization Atlas — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- ChatGPT/Cursor/plugin = verify-only; unconfigured → UNAVAILABLE; registration ≠ authority.
-- Unverified iOS/Android/web/desktop → UNAVAILABLE/NOT_TESTED.
-- Atlas intake requires lawful provenance + rights; no demographic profiling.
-- Adult 18+ where required; RUNNING_VERIFIED needs fresh heartbeat + powered node.
-- Encrypted offline packs reject tamper/checksum fail; cross-device needs enrollment.
-- New agents bounded; no self-grant production authority; sealed silent share DENIED.
-- SoT: GitHub #130. GitLab #64 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS dm_global_neural_transit_civilization_atlas_os (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  predecessor_layer text NOT NULL,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  tip_land boolean NOT NULL DEFAULT false,
  full_production_dm_shipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dm_transit_corridors (
  id uuid PRIMARY KEY,
  grid_id uuid NOT NULL,
  name text NOT NULL,
  from_region text NOT NULL,
  to_region text NOT NULL,
  sealed_bypass_attempt boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dm_civilization_atlas_packs (
  id uuid PRIMARY KEY,
  atlas_id uuid NOT NULL,
  region text NOT NULL,
  title text NOT NULL,
  authorized boolean NOT NULL DEFAULT false,
  provenance_ref text,
  rights_cleared boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dm_workforce_agents (
  id uuid PRIMARY KEY,
  workforce_id uuid NOT NULL,
  name text NOT NULL,
  node_id uuid,
  status text NOT NULL,
  last_heartbeat_at timestamptz,
  runtime_evidence text,
  self_grant_production_authority_attempt boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dm_encrypted_offline_packs (
  id uuid PRIMARY KEY,
  workforce_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  ciphertext text NOT NULL,
  checksum_sha256 text NOT NULL,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dm_device_runtime_profiles (
  id uuid PRIMARY KEY,
  runtime_id uuid NOT NULL,
  platform text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  tested boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dm_toolchain_capabilities (
  id uuid PRIMARY KEY,
  ecosystem_id uuid NOT NULL,
  capability text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  registered boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  grants_authority boolean NOT NULL DEFAULT false,
  grants_credentials boolean NOT NULL DEFAULT false,
  grants_billing boolean NOT NULL DEFAULT false,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
