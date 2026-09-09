-- 62L-CD Data-Root / Local LLM / Archive / DB Mesh — CANDIDATE DDL ONLY
-- Status: NOT_APPLIED
-- LIVE_SUPABASE_APPLY=false
-- Do NOT run against production. No production table overload.
-- Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
-- SoT: GitHub #94; GitLab #28 coordination only.

-- BEGIN NOT_APPLIED CANDIDATES
/*
CREATE TABLE IF NOT EXISTS cd_data_root_pipelines (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  domain text NOT NULL,
  governed boolean NOT NULL DEFAULT true,
  mega_dump boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'waiting_data',
  consent_known boolean NOT NULL DEFAULT false,
  license_known boolean NOT NULL DEFAULT false,
  jurisdiction_known boolean NOT NULL DEFAULT false,
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cd_local_llm_routes (
  id uuid PRIMARY KEY,
  prompt_id text NOT NULL,
  sensitivity text NOT NULL,
  selected_target text,
  status text NOT NULL,
  silent_cloud_fallback boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cd_google_ai_studio_slots (
  id uuid PRIMARY KEY,
  configured boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  state text NOT NULL DEFAULT 'UNAVAILABLE',
  production_authorized boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cd_archive_mines (
  id uuid PRIMARY KEY,
  source_id text NOT NULL,
  authorized boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'denied',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cd_archive_personas (
  id uuid PRIMARY KEY,
  label text NOT NULL,
  simulation boolean NOT NULL DEFAULT true,
  soul_resurrection boolean NOT NULL DEFAULT false,
  afterlife_communication boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'labeled_simulation',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cd_db_connectors (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL,
  enrolled boolean NOT NULL DEFAULT false,
  authorized boolean NOT NULL DEFAULT false,
  write_allowed boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unavailable',
  production_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cd_mini_xiv_profiles (
  id uuid PRIMARY KEY,
  target_device_id text NOT NULL,
  compatibility_profile_only boolean NOT NULL DEFAULT true,
  stealth_install boolean NOT NULL DEFAULT false,
  installed_on_device boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'compatibility_profile',
  created_at timestamptz NOT NULL DEFAULT now()
);
*/
-- END NOT_APPLIED CANDIDATES
