-- 2I-AI-62B XIV Agent Meeting Network (tenant-bound, RLS REQUIRED).
-- Bounded schema for meetings, evidence, proposals, decisions, actions, outcomes.
-- Does not bypass Guardian. LIVE overnight execution is not granted by this migration.

CREATE TABLE IF NOT EXISTS xiv_agent_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  title text NOT NULL,
  purpose text NOT NULL,
  classification text NOT NULL DEFAULT 'internal',
  stage text NOT NULL DEFAULT 'MEETING_CREATED',
  status text NOT NULL DEFAULT 'OPEN',
  trigger text NOT NULL,
  provenance text NOT NULL,
  retention_policy text NOT NULL DEFAULT 'tenant_universe_default',
  audit_id text NOT NULL,
  meeting_equals_authority boolean NOT NULL DEFAULT false,
  production_live boolean NOT NULL DEFAULT false,
  l4_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xiv_agent_meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES xiv_agent_meetings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  actor_id text NOT NULL,
  kind text NOT NULL,
  xarp_role text,
  specialist_domain text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xiv_agent_meeting_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES xiv_agent_meetings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  actor_id text NOT NULL,
  body text NOT NULL,
  classification text NOT NULL DEFAULT 'internal',
  provenance text NOT NULL DEFAULT 'meeting-message',
  changes_authority boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xiv_agent_meeting_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES xiv_agent_meetings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  claim text NOT NULL,
  source text NOT NULL,
  provenance text NOT NULL,
  evidence_date text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  classification text NOT NULL DEFAULT 'internal',
  rights text NOT NULL DEFAULT 'purpose-limited',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xiv_agent_meeting_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES xiv_agent_meetings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  actor_id text NOT NULL,
  claim text NOT NULL,
  evidence_refs text[] NOT NULL DEFAULT '{}',
  source text NOT NULL,
  provenance text NOT NULL,
  proposal_date text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  assumptions text[] NOT NULL DEFAULT '{}',
  counterargument text NOT NULL,
  risk text NOT NULL,
  unknown_text text NOT NULL,
  recommendation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xiv_agent_meeting_objections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES xiv_agent_meetings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  proposal_id uuid NOT NULL,
  actor_id text NOT NULL,
  statement text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xiv_agent_meeting_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES xiv_agent_meetings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  proposal_id uuid NOT NULL,
  actor_id text NOT NULL,
  stance text NOT NULL,
  evidence_backed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xiv_agent_meeting_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES xiv_agent_meetings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  recommendation text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  human_decision_required boolean NOT NULL DEFAULT true,
  human_approved boolean NOT NULL DEFAULT false,
  approved_by text,
  source_kind text NOT NULL DEFAULT 'machine_inference',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xiv_agent_meeting_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES xiv_agent_meetings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  description text NOT NULL,
  queued boolean NOT NULL DEFAULT true,
  executed boolean NOT NULL DEFAULT false,
  unauthorized boolean NOT NULL DEFAULT false,
  authority text NOT NULL DEFAULT 'human-approval',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xiv_agent_meeting_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES xiv_agent_meetings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  universe_id text NOT NULL,
  summary text NOT NULL,
  measured boolean NOT NULL DEFAULT false,
  provenance text NOT NULL DEFAULT 'meeting-outcome',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE xiv_agent_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_outcomes ENABLE ROW LEVEL SECURITY;

ALTER TABLE xiv_agent_meetings FORCE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_participants FORCE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_evidence FORCE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_proposals FORCE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_objections FORCE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_votes FORCE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_decisions FORCE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_actions FORCE ROW LEVEL SECURITY;
ALTER TABLE xiv_agent_meeting_outcomes FORCE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'xiv_agent_meetings',
    'xiv_agent_meeting_participants',
    'xiv_agent_meeting_messages',
    'xiv_agent_meeting_evidence',
    'xiv_agent_meeting_proposals',
    'xiv_agent_meeting_objections',
    'xiv_agent_meeting_votes',
    'xiv_agent_meeting_decisions',
    'xiv_agent_meeting_actions',
    'xiv_agent_meeting_outcomes'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_tenant_isolation'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL USING (tenant_id::text = coalesce(auth.jwt() ->> ''tenant_id'', '''')) WITH CHECK (tenant_id::text = coalesce(auth.jwt() ->> ''tenant_id'', ''''))',
        t || '_tenant_isolation',
        t
      );
    END IF;
  END LOOP;
END $$;
