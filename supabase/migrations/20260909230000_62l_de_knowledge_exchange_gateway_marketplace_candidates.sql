-- 62L-DE Knowledge Exchange Gateway Marketplace — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Marketplace listing ≠ credentials/billing/deploy/broader access.
-- Knowledge exchange requires explicit rights + provenance; sealed silent DENIED.
-- Tournament winner/consensus ≠ verified proof / production model.
-- Capacity planner cannot purchase/bill; unverified hardware UNAVAILABLE.
-- Incubator sandbox only; self-promote DENIED; consequential needs human approval.
-- Recovery: signed + authorized; orchestration ≠ auto prod restore.
-- SoT: GitHub #122. GitLab #56 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS de_knowledge_exchange_gateway_marketplace (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  predecessor_layer text NOT NULL,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  tip_land boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS de_exchange_nodes (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL,
  logical boolean NOT NULL DEFAULT true,
  authorized_node_powered boolean NOT NULL DEFAULT false,
  last_heartbeat_at timestamptz,
  runtime_evidence text,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS de_marketplace_listings (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  capability_key text NOT NULL,
  required_scopes text[] NOT NULL DEFAULT '{}',
  credentials_granted boolean NOT NULL DEFAULT false,
  billing_granted boolean NOT NULL DEFAULT false,
  deploy_granted boolean NOT NULL DEFAULT false,
  broader_data_access_granted boolean NOT NULL DEFAULT false,
  authority_granted boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS de_fabric_federation_packs (
  id uuid PRIMARY KEY,
  source_universe_id text NOT NULL,
  target_universe_id text NOT NULL,
  asset_class text NOT NULL,
  has_data_rights boolean NOT NULL DEFAULT false,
  has_provenance boolean NOT NULL DEFAULT false,
  signed boolean NOT NULL DEFAULT false,
  silent boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  payload_digest text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS de_model_tournaments (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  winner_target_id text,
  consensus_only boolean NOT NULL DEFAULT true,
  labeled_verified_proof boolean NOT NULL DEFAULT false,
  production_model_promoted boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS de_capacity_ledger (
  id uuid PRIMARY KEY,
  action text NOT NULL,
  units numeric NOT NULL,
  currency_attempted boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS de_incubator_companies (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  lifecycle text NOT NULL,
  sandbox_only boolean NOT NULL DEFAULT true,
  production_authorized boolean NOT NULL DEFAULT false,
  human_approval_granted boolean NOT NULL DEFAULT false,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS de_recovery_packs (
  id uuid PRIMARY KEY,
  source_universe_id text NOT NULL,
  target_universe_id text NOT NULL,
  signed boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  recovery_authorized boolean NOT NULL DEFAULT false,
  auto_production_restore boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  payload_digest text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
