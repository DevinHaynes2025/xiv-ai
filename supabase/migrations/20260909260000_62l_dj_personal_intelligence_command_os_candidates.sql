-- 62L-DJ Personal Intelligence Command OS — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- Fabricated RUNNING_VERIFIED without heartbeat DENIED.
-- Silent permission inheritance DENIED.
-- Guaranteed prediction claims REJECTED (probabilistic only).
-- Raw private cross-tenant share DENIED.
-- Overnight without powered node → WAITING_NODE / OFFLINE_STOPPED.
-- Pattern memory cannot auto-promote correlation to verified causation.
-- Marketplace listing ≠ credentials / billing / deploy.
-- UX improvement proposals reversible; cannot self-grant authority.
-- Collaboration opt-in required; adult 18+ where applicable.
-- Control tower recommendation ≠ charge / deploy / publish.
-- SoT: GitHub #127. GitLab #61 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS dj_personal_intelligence_command_os (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  predecessor_layer text NOT NULL,
  l4_autonomy_enabled boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  tip_land boolean NOT NULL DEFAULT false,
  full_production_command_os_shipped boolean NOT NULL DEFAULT false,
  cohesive_command_ux boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dj_command_surface_contracts (
  id uuid PRIMARY KEY,
  os_id uuid NOT NULL,
  surface text NOT NULL,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dj_predictive_storyline_cards (
  id uuid PRIMARY KEY,
  feed_id uuid NOT NULL,
  title text NOT NULL,
  probability numeric NOT NULL,
  label text NOT NULL,
  evidence_ids text[] NOT NULL DEFAULT '{}',
  claim_guaranteed boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dj_historical_pattern_memory (
  id uuid PRIMARY KEY,
  cortex_id uuid NOT NULL,
  pattern_summary text NOT NULL,
  provenance_ids text[] NOT NULL DEFAULT '{}',
  claim_status text NOT NULL DEFAULT 'CORRELATION_ONLY',
  auto_promote_attempted boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dj_scenario_control_tower_recommendations (
  id uuid PRIMARY KEY,
  tower_id uuid NOT NULL,
  scenario_id text NOT NULL,
  recommendation text NOT NULL,
  label text NOT NULL DEFAULT 'RECOMMENDATION_ONLY',
  attempted_charge boolean NOT NULL DEFAULT false,
  attempted_deploy boolean NOT NULL DEFAULT false,
  attempted_publish boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dj_agent_team_marketplace_listings (
  id uuid PRIMARY KEY,
  marketplace_id uuid NOT NULL,
  team_name text NOT NULL,
  grants_credentials boolean NOT NULL DEFAULT false,
  grants_billing boolean NOT NULL DEFAULT false,
  grants_deploy boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dj_collaboration_knowledge_rooms (
  id uuid PRIMARY KEY,
  fabric_id uuid NOT NULL,
  name text NOT NULL,
  opt_in_required boolean NOT NULL DEFAULT true,
  participants_opted_in text[] NOT NULL DEFAULT '{}',
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dj_ux_learning_proposals (
  id uuid PRIMARY KEY,
  fabric_id uuid NOT NULL,
  summary text NOT NULL,
  consented_feedback boolean NOT NULL DEFAULT false,
  reversible boolean NOT NULL DEFAULT true,
  self_grant_authority_attempted boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
