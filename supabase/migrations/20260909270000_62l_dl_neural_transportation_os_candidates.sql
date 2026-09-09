-- 62L-DL Neural Transportation OS — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Neural highways require explicit route policies, congestion control, revocation, audit.
-- Wormholes/fast paths ≠ auth/sealed/zero-trust bypass.
-- RUNNING_VERIFIED requires powered authorized node + fresh heartbeat; else WAITING_NODE/OFFLINE_STOPPED.
-- Tech history lake: authorized + provenance.
-- Edge microservers: candidates/enrollment; NOT_APPLIED to production infra; no stealth install.
-- Privacy Universe gateway: deny-by-default; moderated anonymity.
-- Business Media social graph: opt-in; adult 18+.
-- Supply-chain intelligence highway: provenance-aware; forecast ≠ fact.
-- SoT: GitHub #129. GitLab #63 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS dl_neural_transportation_os (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  predecessor_layer text NOT NULL,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  tip_land boolean NOT NULL DEFAULT false,
  full_production_transport_os_shipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dl_route_policies (
  id uuid PRIMARY KEY,
  governor_id uuid NOT NULL,
  route_id text NOT NULL,
  allowlist jsonb NOT NULL DEFAULT '[]'::jsonb,
  require_signature boolean NOT NULL DEFAULT true,
  require_audit boolean NOT NULL DEFAULT true,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS dl_transport_attempts (
  id uuid PRIMARY KEY,
  governor_id uuid NOT NULL,
  route_id text NOT NULL,
  cargo_kind text NOT NULL,
  signed boolean NOT NULL DEFAULT false,
  audited boolean NOT NULL DEFAULT false,
  sealed_or_raw_private boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dl_tech_history_lake_entries (
  id uuid PRIMARY KEY,
  lake_id uuid NOT NULL,
  source_id text NOT NULL,
  authorized boolean NOT NULL DEFAULT false,
  provenance_ref text,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dl_agent_shifts (
  id uuid PRIMARY KEY,
  network_id uuid NOT NULL,
  node_id uuid,
  status text NOT NULL,
  last_heartbeat_at timestamptz,
  runtime_evidence text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dl_edge_microservers (
  id uuid PRIMARY KEY,
  fabric_id uuid NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  health text NOT NULL,
  status text NOT NULL,
  applied_to_production boolean NOT NULL DEFAULT false,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dl_privacy_universe_gateways (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  deny_by_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dl_business_media_social_shares (
  id uuid PRIMARY KEY,
  graph_id uuid NOT NULL,
  opt_in boolean NOT NULL DEFAULT false,
  declared_age_years int,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dl_supply_chain_forecasts (
  id uuid PRIMARY KEY,
  highway_id uuid NOT NULL,
  sku_or_lane text NOT NULL,
  provenance_ref text,
  label text NOT NULL,
  labeled_verified_fact boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
