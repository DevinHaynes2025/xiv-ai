-- 2I-AI-62B — XIV Agent Meetings, Collective Reasoning & Human Intelligence Bridge
-- FOUNDER: run this file in the hosted Supabase SQL editor AFTER
--   20260908120000_agent_civilization_foundation.sql.
-- This workspace cannot apply it remotely. Until it is applied, PostgREST returns
-- PGRST205 for these relations and the clients must surface that honestly.
-- After this file succeeds, also run:
--   NOTIFY pgrst, 'reload schema';
--
-- Table naming. The story lists these tables as xiv_agent_meeting_*. Nothing in
-- this repository carries an xiv_ prefix, and 62A already created agent_meetings
-- and agent_meeting_participants. Adding a second, parallel xiv_agent_meetings
-- would leave two meeting tables with no rule about which one is authoritative,
-- which is exactly the sort of ambiguity that produces a tenancy bug later. The
-- tables therefore land under the existing agent_meeting_* convention. The
-- mapping is one to one:
--   xiv_agent_meetings              -> agent_meetings (extended below)
--   xiv_agent_meeting_participants  -> agent_meeting_participants (extended below)
--   xiv_agent_meeting_messages      -> agent_meeting_messages
--   xiv_agent_meeting_evidence      -> agent_meeting_evidence
--   xiv_agent_meeting_proposals     -> agent_meeting_proposals
--   xiv_agent_meeting_objections    -> agent_meeting_objections
--   xiv_agent_meeting_votes         -> agent_meeting_votes
--   xiv_agent_meeting_decisions     -> agent_meeting_decisions
--   xiv_agent_meeting_actions       -> agent_meeting_actions
--   xiv_agent_meeting_outcomes      -> agent_meeting_outcomes
--
-- Scope. This file adds the deliberation record, the human intelligence bridge,
-- the meeting resource governor, the agent directory, the reputation model and
-- the kill/pause controls. It does not create autonomous behaviour. Nothing here
-- executes an agent, and no row in this file can grant a capability.
--
-- Every new tenant-bearing table carries, per the story:
--   organization_id  organization ownership, checked against the universe
--   universe_id      Universe ownership, the RLS predicate
--   provenance       where the row came from
--   created_at       timestamps
--   security_classification
--   retention_policy
--   audit_event_id   audit linkage into agent_governance_events
--
-- Re-runnable: create table if not exists, add column if not exists, drop policy
-- if exists then recreate, create or replace function, drop trigger if exists.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Extensions to the 62A meeting tables
-- ---------------------------------------------------------------------------

-- The sixteen-step meeting lifecycle. status (62A) stays as the coarse state the
-- clients already read; lifecycle_stage is the fine-grained position and is the
-- single source of truth. A trigger below derives status from it so the two can
-- never disagree.
alter table public.agent_meetings
  add column if not exists organization_id uuid null,
  add column if not exists lifecycle_stage text not null default 'trigger',
  add column if not exists trigger_kind text not null default 'human_request',
  add column if not exists trigger_detail text null,
  add column if not exists meeting_mode text not null default 'interactive',
  add column if not exists async_window_start timestamptz null,
  add column if not exists async_window_end timestamptz null,
  add column if not exists temporal_context jsonb not null default '{}'::jsonb,
  add column if not exists working_language text not null default 'en',
  add column if not exists synthesis jsonb null,
  add column if not exists recommendation_confidence numeric null,
  add column if not exists human_decision_required boolean not null default true,
  add column if not exists provenance jsonb not null default '{}'::jsonb,
  add column if not exists retention_policy text not null default 'retain-7y-then-review',
  add column if not exists audit_event_id uuid null,
  add column if not exists closed_at timestamptz null;

alter table public.agent_meetings
  drop constraint if exists agent_meetings_lifecycle_stage_check;
alter table public.agent_meetings
  add constraint agent_meetings_lifecycle_stage_check check (
    lifecycle_stage in (
      'trigger', 'created', 'participants_selected', 'context_authorized',
      'evidence_collected', 'specialist_analysis', 'debate', 'contradiction_detection',
      'alternatives_generated', 'risk_analysis', 'consensus_or_disagreement',
      'human_checkpoint', 'decision', 'authorized_action', 'outcome',
      'post_meeting_evaluation', 'knowledge_lineage'
    )
  );

alter table public.agent_meetings
  drop constraint if exists agent_meetings_mode_check;
alter table public.agent_meetings
  add constraint agent_meetings_mode_check check (meeting_mode in ('interactive', 'asynchronous'));

alter table public.agent_meetings
  drop constraint if exists agent_meetings_confidence_check;
alter table public.agent_meetings
  add constraint agent_meetings_confidence_check check (
    recommendation_confidence is null
    or (recommendation_confidence >= 0 and recommendation_confidence <= 1)
  );

-- An asynchronous meeting is the overnight case. It must declare the window it
-- is allowed to run inside, so "bounded reasoning while the executive is away"
-- is a stored boundary and not an intention.
alter table public.agent_meetings
  drop constraint if exists agent_meetings_async_window_check;
alter table public.agent_meetings
  add constraint agent_meetings_async_window_check check (
    meeting_mode <> 'asynchronous'
    or (async_window_start is not null and async_window_end is not null and async_window_end > async_window_start)
  );

-- operator_user_id is the anti-spoofing binding. An agent does not hold
-- credentials; a human or service principal relays its turns. Only that
-- principal may author rows attributed to that agent in that meeting, so one
-- member cannot post in another member's agent's name.
alter table public.agent_meeting_participants
  add column if not exists organization_id uuid null,
  add column if not exists xarp_roles text[] not null default '{}'::text[],
  add column if not exists operator_user_id uuid null references auth.users (id) on delete set null,
  add column if not exists speaking_language text not null default 'en',
  add column if not exists invited_by uuid null references auth.users (id) on delete set null,
  add column if not exists provenance jsonb not null default '{}'::jsonb,
  add column if not exists left_at timestamptz null;

alter table public.agent_meeting_participants
  drop constraint if exists agent_meeting_participants_xarp_roles_check;
alter table public.agent_meeting_participants
  add constraint agent_meeting_participants_xarp_roles_check check (
    xarp_roles <@ array[
      'investigator', 'specialist', 'challenger', 'historian', 'cultural',
      'risk', 'security', 'financial', 'human_liaison', 'synthesizer'
    ]::text[]
  );

alter table public.agent_meeting_participants
  drop constraint if exists agent_meeting_participants_operator_check;
alter table public.agent_meeting_participants
  add constraint agent_meeting_participants_operator_check check (
    participant_kind <> 'agent' or operator_user_id is not null
  );

-- Kill and pause controls live on the subject row, not in a message to the
-- agent. Every write path consults control_state, so a control takes effect
-- whether or not the agent cooperates.
alter table public.agent_registry
  add column if not exists control_state text not null default 'normal',
  add column if not exists control_reason text null,
  add column if not exists control_set_by uuid null references auth.users (id) on delete set null,
  add column if not exists control_set_at timestamptz null;

alter table public.agent_registry
  drop constraint if exists agent_registry_control_state_check;
alter table public.agent_registry
  add constraint agent_registry_control_state_check check (
    control_state in ('normal', 'paused', 'stopped', 'quarantined')
  );

alter table public.agent_registry
  drop constraint if exists agent_registry_control_reason_check;
alter table public.agent_registry
  add constraint agent_registry_control_reason_check check (
    control_state = 'normal' or coalesce(btrim(control_reason), '') <> ''
  );

alter table public.agent_task_forces
  add column if not exists control_state text not null default 'normal',
  add column if not exists control_reason text null,
  add column if not exists control_set_by uuid null references auth.users (id) on delete set null,
  add column if not exists control_set_at timestamptz null;

alter table public.agent_task_forces
  drop constraint if exists agent_task_forces_control_state_check;
alter table public.agent_task_forces
  add constraint agent_task_forces_control_state_check check (
    control_state in ('normal', 'paused', 'stopped', 'quarantined')
  );

-- ---------------------------------------------------------------------------
-- 1. agent_meeting_messages — the deliberation transcript
-- ---------------------------------------------------------------------------

-- Multilingual by construction. original_text is never overwritten by its
-- translation, and cultural_context is a separate column from factual_claim so a
-- reader can tell "this is how the request will be heard in Osaka" apart from
-- "the line was down for six hours".
create table if not exists public.agent_meeting_messages (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  meeting_id uuid not null references public.agent_meetings (id) on delete cascade,
  sequence integer not null,
  speaker_kind text not null,
  speaker_agent_id uuid null references public.agent_registry (id) on delete set null,
  speaker_user_id uuid null references auth.users (id) on delete set null,
  operator_user_id uuid null references auth.users (id) on delete set null,
  xarp_role text null,
  message_kind text not null default 'statement',
  original_language text not null default 'en',
  original_text text not null,
  translated_text text null,
  translation_language text null,
  interpretation text null,
  translation_provenance jsonb not null default '{}'::jsonb,
  cultural_context text null,
  factual_claim text null,
  xacp_message_id uuid null references public.agent_messages (id) on delete set null,
  security_classification text not null default 'confidential',
  retention_policy text not null default 'retain-7y-then-review',
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint agent_meeting_messages_sequence_unique unique (meeting_id, sequence),
  constraint agent_meeting_messages_speaker_kind_check check (
    speaker_kind in ('agent', 'human', 'guardian', 'system')
  ),
  constraint agent_meeting_messages_identity_check check (
    (speaker_kind = 'agent' and speaker_agent_id is not null and speaker_user_id is null)
    or (speaker_kind = 'human' and speaker_user_id is not null and speaker_agent_id is null)
    or (speaker_kind in ('guardian', 'system') and speaker_agent_id is null and speaker_user_id is null)
  ),
  constraint agent_meeting_messages_operator_check check (
    speaker_kind <> 'agent' or operator_user_id is not null
  ),
  constraint agent_meeting_messages_kind_check check (
    message_kind in (
      'statement', 'question', 'challenge', 'analysis', 'synthesis',
      'human_context', 'guardian_note', 'system_note'
    )
  ),
  constraint agent_meeting_messages_xarp_role_check check (
    xarp_role is null or xarp_role in (
      'investigator', 'specialist', 'challenger', 'historian', 'cultural',
      'risk', 'security', 'financial', 'human_liaison', 'synthesizer'
    )
  ),
  constraint agent_meeting_messages_original_text_check check (coalesce(btrim(original_text), '') <> ''),
  -- A translation without its target language loses the provenance that makes it
  -- checkable, so the pair is required together.
  constraint agent_meeting_messages_translation_check check (
    translated_text is null or coalesce(btrim(translation_language), '') <> ''
  ),
  constraint agent_meeting_messages_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  )
);

-- ---------------------------------------------------------------------------
-- 2. agent_meeting_evidence — evidence before consensus
-- ---------------------------------------------------------------------------

-- The columns are the story's evidence contract. They are not nullable
-- conveniences: an agent that cannot state its counterargument, its risk and its
-- unknowns has not finished reasoning and cannot put the claim into the room.
create table if not exists public.agent_meeting_evidence (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  meeting_id uuid not null references public.agent_meetings (id) on delete cascade,
  submitted_by_agent_id uuid null references public.agent_registry (id) on delete set null,
  submitted_by_user_id uuid null references auth.users (id) on delete set null,
  operator_user_id uuid null references auth.users (id) on delete set null,
  xarp_role text null,
  subject text not null,
  dimension text not null,
  direction text not null default 'neutral',
  claim text not null,
  evidence text not null,
  source text not null,
  provenance jsonb not null default '{}'::jsonb,
  evidence_date date null,
  confidence numeric not null,
  assumptions jsonb not null default '[]'::jsonb,
  counterargument text not null,
  risk text not null,
  unknowns jsonb not null default '[]'::jsonb,
  recommendation text null,
  claim_kind text not null,
  knowledge_source_id uuid null references public.agent_knowledge_sources (id) on delete set null,
  security_classification text not null default 'confidential',
  retention_policy text not null default 'retain-7y-then-review',
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint agent_meeting_evidence_identity_check check (
    (submitted_by_agent_id is not null and submitted_by_user_id is null)
    or (submitted_by_user_id is not null and submitted_by_agent_id is null)
  ),
  constraint agent_meeting_evidence_operator_check check (
    submitted_by_agent_id is null or operator_user_id is not null
  ),
  constraint agent_meeting_evidence_confidence_check check (confidence >= 0 and confidence <= 1),
  constraint agent_meeting_evidence_direction_check check (
    direction in ('favourable', 'unfavourable', 'neutral')
  ),
  constraint agent_meeting_evidence_claim_kind_check check (
    claim_kind in (
      'human_fact', 'human_opinion', 'agent_inference', 'historical_evidence',
      'external_source', 'prediction', 'unknown'
    )
  ),
  constraint agent_meeting_evidence_contract_check check (
    coalesce(btrim(subject), '') <> ''
    and coalesce(btrim(dimension), '') <> ''
    and coalesce(btrim(claim), '') <> ''
    and coalesce(btrim(evidence), '') <> ''
    and coalesce(btrim(source), '') <> ''
    and coalesce(btrim(counterargument), '') <> ''
    and coalesce(btrim(risk), '') <> ''
  ),
  constraint agent_meeting_evidence_provenance_check check (provenance <> '{}'::jsonb),
  constraint agent_meeting_evidence_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  )
);

-- ---------------------------------------------------------------------------
-- 3. agent_meeting_proposals — the alternatives put to the room
-- ---------------------------------------------------------------------------

create table if not exists public.agent_meeting_proposals (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  meeting_id uuid not null references public.agent_meetings (id) on delete cascade,
  option_key text not null,
  title text not null,
  proposed_by_agent_id uuid null references public.agent_registry (id) on delete set null,
  proposed_by_user_id uuid null references auth.users (id) on delete set null,
  operator_user_id uuid null references auth.users (id) on delete set null,
  xarp_role text null,
  claim text not null,
  evidence_ids uuid[] not null default '{}'::uuid[],
  source text not null,
  provenance jsonb not null default '{}'::jsonb,
  proposal_date date null,
  confidence numeric not null,
  assumptions jsonb not null default '[]'::jsonb,
  counterargument text not null,
  risk text not null,
  unknowns jsonb not null default '[]'::jsonb,
  recommendation text not null,
  status text not null default 'open',
  security_classification text not null default 'confidential',
  retention_policy text not null default 'retain-7y-then-review',
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint agent_meeting_proposals_option_unique unique (meeting_id, option_key),
  constraint agent_meeting_proposals_identity_check check (
    (proposed_by_agent_id is not null and proposed_by_user_id is null)
    or (proposed_by_user_id is not null and proposed_by_agent_id is null)
  ),
  constraint agent_meeting_proposals_operator_check check (
    proposed_by_agent_id is null or operator_user_id is not null
  ),
  constraint agent_meeting_proposals_confidence_check check (confidence >= 0 and confidence <= 1),
  constraint agent_meeting_proposals_status_check check (
    status in ('open', 'superseded', 'selected', 'rejected', 'withdrawn')
  ),
  -- A proposal with no cited evidence is an opinion wearing a proposal's clothes.
  constraint agent_meeting_proposals_evidence_check check (coalesce(array_length(evidence_ids, 1), 0) >= 1),
  constraint agent_meeting_proposals_contract_check check (
    coalesce(btrim(claim), '') <> ''
    and coalesce(btrim(source), '') <> ''
    and coalesce(btrim(counterargument), '') <> ''
    and coalesce(btrim(risk), '') <> ''
    and coalesce(btrim(recommendation), '') <> ''
  ),
  constraint agent_meeting_proposals_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  )
);

-- ---------------------------------------------------------------------------
-- 4. agent_meeting_objections — productive disagreement, kept
-- ---------------------------------------------------------------------------

create table if not exists public.agent_meeting_objections (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  meeting_id uuid not null references public.agent_meetings (id) on delete cascade,
  proposal_id uuid null references public.agent_meeting_proposals (id) on delete cascade,
  raised_by_agent_id uuid null references public.agent_registry (id) on delete set null,
  raised_by_user_id uuid null references auth.users (id) on delete set null,
  operator_user_id uuid null references auth.users (id) on delete set null,
  xarp_role text null,
  objection text not null,
  severity text not null default 'material',
  supporting_evidence_id uuid null references public.agent_meeting_evidence (id) on delete set null,
  resolution_kind text not null default 'unresolved',
  resolution text null,
  resolved_by_user_id uuid null references auth.users (id) on delete set null,
  resolved_at timestamptz null,
  security_classification text not null default 'confidential',
  retention_policy text not null default 'retain-7y-then-review',
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint agent_meeting_objections_identity_check check (
    (raised_by_agent_id is not null and raised_by_user_id is null)
    or (raised_by_user_id is not null and raised_by_agent_id is null)
  ),
  constraint agent_meeting_objections_operator_check check (
    raised_by_agent_id is null or operator_user_id is not null
  ),
  constraint agent_meeting_objections_severity_check check (
    severity in ('advisory', 'material', 'blocking')
  ),
  constraint agent_meeting_objections_resolution_kind_check check (
    resolution_kind in ('unresolved', 'accepted', 'rejected', 'mitigated', 'deferred_to_human')
  ),
  -- Only a person closes an objection, and closing it requires saying how.
  constraint agent_meeting_objections_resolution_check check (
    resolution_kind = 'unresolved'
    or (resolved_by_user_id is not null and resolved_at is not null and coalesce(btrim(resolution), '') <> '')
  ),
  constraint agent_meeting_objections_text_check check (coalesce(btrim(objection), '') <> ''),
  constraint agent_meeting_objections_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  )
);

-- ---------------------------------------------------------------------------
-- 5. agent_meeting_votes — a vote must cite what convinced it
-- ---------------------------------------------------------------------------

create table if not exists public.agent_meeting_votes (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  meeting_id uuid not null references public.agent_meetings (id) on delete cascade,
  proposal_id uuid not null references public.agent_meeting_proposals (id) on delete cascade,
  voter_kind text not null,
  voter_agent_id uuid null references public.agent_registry (id) on delete set null,
  voter_user_id uuid null references auth.users (id) on delete set null,
  operator_user_id uuid null references auth.users (id) on delete set null,
  xarp_role text null,
  vote text not null,
  rationale text not null,
  cited_evidence_ids uuid[] not null default '{}'::uuid[],
  confidence numeric null,
  security_classification text not null default 'confidential',
  retention_policy text not null default 'retain-7y-then-review',
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint agent_meeting_votes_kind_check check (voter_kind in ('agent', 'human')),
  constraint agent_meeting_votes_identity_check check (
    (voter_kind = 'agent' and voter_agent_id is not null and voter_user_id is null)
    or (voter_kind = 'human' and voter_user_id is not null and voter_agent_id is null)
  ),
  constraint agent_meeting_votes_operator_check check (
    voter_kind <> 'agent' or operator_user_id is not null
  ),
  constraint agent_meeting_votes_vote_check check (
    vote in ('support', 'oppose', 'abstain', 'insufficient_evidence')
  ),
  -- Evidence before consensus. A supporting or opposing vote has to point at the
  -- evidence it read, so agreement cannot spread on the strength of a persuasive
  -- sentence from another model.
  constraint agent_meeting_votes_evidence_check check (
    vote not in ('support', 'oppose') or coalesce(array_length(cited_evidence_ids, 1), 0) >= 1
  ),
  constraint agent_meeting_votes_rationale_check check (coalesce(btrim(rationale), '') <> ''),
  constraint agent_meeting_votes_confidence_check check (
    confidence is null or (confidence >= 0 and confidence <= 1)
  ),
  constraint agent_meeting_votes_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  )
);

create unique index if not exists agent_meeting_votes_agent_unique
  on public.agent_meeting_votes (proposal_id, voter_agent_id)
  where voter_agent_id is not null;
create unique index if not exists agent_meeting_votes_user_unique
  on public.agent_meeting_votes (proposal_id, voter_user_id)
  where voter_user_id is not null;

-- ---------------------------------------------------------------------------
-- 6. agent_meeting_decisions — the human checkpoint, recorded
-- ---------------------------------------------------------------------------

-- The XIV recommendation and the human decision are separate columns because
-- they are separate things. preserved_disagreements is not a summary field; it
-- carries the positions the room did not reconcile, so the executive sees the
-- disagreement rather than an averaged answer.
create table if not exists public.agent_meeting_decisions (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  meeting_id uuid not null references public.agent_meetings (id) on delete cascade,
  selected_proposal_id uuid null references public.agent_meeting_proposals (id) on delete set null,
  xiv_recommendation text not null,
  xiv_confidence numeric not null,
  alternatives jsonb not null default '[]'::jsonb,
  preserved_disagreements jsonb not null default '[]'::jsonb,
  human_decision_required boolean not null default true,
  decision_kind text not null,
  decided_by_user_id uuid not null references auth.users (id) on delete restrict,
  rationale text not null,
  human_knowledge_record_id uuid null,
  security_classification text not null default 'confidential',
  retention_policy text not null default 'retain-7y-then-review',
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  decided_at timestamptz not null default now(),
  constraint agent_meeting_decisions_kind_check check (
    decision_kind in ('approved', 'rejected', 'postponed', 'escalated')
  ),
  constraint agent_meeting_decisions_confidence_check check (xiv_confidence >= 0 and xiv_confidence <= 1),
  constraint agent_meeting_decisions_rationale_check check (coalesce(btrim(rationale), '') <> ''),
  -- Approving something means choosing which thing.
  constraint agent_meeting_decisions_selection_check check (
    decision_kind <> 'approved' or selected_proposal_id is not null
  ),
  constraint agent_meeting_decisions_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  )
);

-- ---------------------------------------------------------------------------
-- 7. agent_meeting_actions — only authorized work leaves the room
-- ---------------------------------------------------------------------------

create table if not exists public.agent_meeting_actions (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  meeting_id uuid not null references public.agent_meetings (id) on delete cascade,
  decision_id uuid null references public.agent_meeting_decisions (id) on delete set null,
  task_id uuid null references public.agent_tasks (id) on delete set null,
  assigned_agent_id uuid null references public.agent_registry (id) on delete set null,
  action text not null,
  authorization_basis text not null,
  requires_human_approval boolean not null default true,
  approved_by uuid null references auth.users (id) on delete set null,
  approved_at timestamptz null,
  rollback_plan text null,
  status text not null default 'queued',
  security_classification text not null default 'confidential',
  retention_policy text not null default 'retain-7y-then-review',
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  created_at timestamptz not null default now(),
  executed_at timestamptz null,
  revoked_at timestamptz null,
  constraint agent_meeting_actions_status_check check (
    status in ('queued', 'authorized', 'executing', 'completed', 'failed', 'revoked', 'rolled_back')
  ),
  constraint agent_meeting_actions_text_check check (
    coalesce(btrim(action), '') <> '' and coalesce(btrim(authorization_basis), '') <> ''
  ),
  -- An action that needs a person cannot move past the queue without one, and
  -- the approver column is the only place that approval can come from.
  constraint agent_meeting_actions_approval_check check (
    requires_human_approval = false
    or status in ('queued', 'revoked')
    or (approved_by is not null and approved_at is not null)
  ),
  constraint agent_meeting_actions_rollback_check check (
    status not in ('authorized', 'executing', 'completed')
    or coalesce(btrim(rollback_plan), '') <> ''
  ),
  constraint agent_meeting_actions_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  )
);

-- ---------------------------------------------------------------------------
-- 8. agent_meeting_outcomes — what actually happened
-- ---------------------------------------------------------------------------

-- Outcome-based learning reads from here. predicted and observed are stored side
-- by side so calibration is computed from the record rather than asserted.
create table if not exists public.agent_meeting_outcomes (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  meeting_id uuid not null references public.agent_meetings (id) on delete cascade,
  decision_id uuid null references public.agent_meeting_decisions (id) on delete set null,
  action_id uuid null references public.agent_meeting_actions (id) on delete set null,
  horizon_days integer not null default 30,
  predicted jsonb not null default '{}'::jsonb,
  observed jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  outcome_grade text not null,
  predicted_confidence numeric null,
  calibration_error numeric null,
  notes text null,
  recorded_by_user_id uuid not null references auth.users (id) on delete restrict,
  security_classification text not null default 'confidential',
  retention_policy text not null default 'retain-7y-then-review',
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint agent_meeting_outcomes_grade_check check (
    outcome_grade in ('successful', 'partial', 'unsuccessful', 'inconclusive')
  ),
  constraint agent_meeting_outcomes_horizon_check check (horizon_days > 0),
  constraint agent_meeting_outcomes_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  )
);

-- ---------------------------------------------------------------------------
-- 9. agent_meeting_budgets — the resource governor
-- ---------------------------------------------------------------------------

-- One budget row per meeting. A meeting cannot create infinite subagents, cannot
-- deliberate forever and cannot spend an unbounded number of tool calls; when a
-- ceiling is reached the meeting terminates into the human checkpoint rather
-- than continuing quietly.
create table if not exists public.agent_meeting_budgets (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  meeting_id uuid not null references public.agent_meetings (id) on delete cascade,
  max_tokens bigint not null default 250000,
  max_compute_ms bigint not null default 600000,
  max_gpu_ms bigint not null default 0,
  max_storage_bytes bigint not null default 10485760,
  max_tool_calls integer not null default 100,
  max_duration_seconds integer not null default 3600,
  max_external_requests integer not null default 25,
  max_participant_agents integer not null default 12,
  max_subagents integer not null default 0,
  max_messages integer not null default 500,
  consumed_tokens bigint not null default 0,
  consumed_compute_ms bigint not null default 0,
  consumed_gpu_ms bigint not null default 0,
  consumed_storage_bytes bigint not null default 0,
  consumed_tool_calls integer not null default 0,
  consumed_duration_seconds integer not null default 0,
  consumed_external_requests integer not null default 0,
  consumed_subagents integer not null default 0,
  consumed_messages integer not null default 0,
  exhausted boolean not null default false,
  exhausted_dimension text null,
  terminated_at timestamptz null,
  provenance jsonb not null default '{}'::jsonb,
  security_classification text not null default 'internal',
  retention_policy text not null default 'retain-2y',
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint agent_meeting_budgets_meeting_unique unique (meeting_id),
  constraint agent_meeting_budgets_nonnegative_check check (
    max_tokens >= 0 and max_compute_ms >= 0 and max_gpu_ms >= 0 and max_storage_bytes >= 0
    and max_tool_calls >= 0 and max_duration_seconds >= 0 and max_external_requests >= 0
    and max_participant_agents >= 0 and max_subagents >= 0 and max_messages >= 0
  ),
  constraint agent_meeting_budgets_exhausted_check check (
    exhausted = false or coalesce(btrim(exhausted_dimension), '') <> ''
  )
);

-- ---------------------------------------------------------------------------
-- 10. agent_reputation — trust is measured, and it only ever narrows authority
-- ---------------------------------------------------------------------------

-- max_impact_level is a ceiling, never a grant. A high composite score does not
-- hand an agent a capability; it only decides whether the agent remains eligible
-- for higher-impact assignments. Capability grants stay with the supervisor.
create table if not exists public.agent_reputation (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  agent_id uuid not null references public.agent_registry (id) on delete cascade,
  accuracy numeric not null default 0.5,
  evidence_quality numeric not null default 0.5,
  calibration numeric not null default 0.5,
  task_success numeric not null default 0.5,
  human_correction_rate numeric not null default 0,
  security_compliance numeric not null default 1,
  hallucination_rate numeric not null default 0,
  cost_efficiency numeric not null default 0.5,
  latency_score numeric not null default 0.5,
  collaboration_quality numeric not null default 0.5,
  sample_size integer not null default 0,
  composite numeric not null default 0.5,
  eligibility_tier text not null default 'probationary',
  max_impact_level text not null default 'low',
  last_evaluated_at timestamptz null,
  provenance jsonb not null default '{}'::jsonb,
  security_classification text not null default 'internal',
  retention_policy text not null default 'retain-2y',
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_reputation_agent_unique unique (agent_id),
  constraint agent_reputation_tier_check check (
    eligibility_tier in ('restricted', 'probationary', 'standard', 'trusted')
  ),
  constraint agent_reputation_impact_check check (max_impact_level in ('none', 'low', 'medium', 'high')),
  constraint agent_reputation_bounds_check check (
    accuracy between 0 and 1 and evidence_quality between 0 and 1 and calibration between 0 and 1
    and task_success between 0 and 1 and human_correction_rate between 0 and 1
    and security_compliance between 0 and 1 and hallucination_rate between 0 and 1
    and cost_efficiency between 0 and 1 and latency_score between 0 and 1
    and collaboration_quality between 0 and 1 and composite between 0 and 1
  ),
  constraint agent_reputation_sample_check check (sample_size >= 0)
);

-- ---------------------------------------------------------------------------
-- 11. agent_directory — the logical population
-- ---------------------------------------------------------------------------

-- The directory is a catalogue of professions, not a fleet of running processes.
-- logical_agent_count can describe a thousand identities while the active count
-- in agent_registry stays small; that separation is what makes scaling a
-- namespace problem instead of a compute problem.
create table if not exists public.agent_directory (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  profession_key text not null,
  category text not null,
  display_name text not null,
  description text null,
  oversight_level text not null default 'standard',
  requires_human_approval boolean not null default false,
  default_xarp_roles text[] not null default '{}'::text[],
  logical_agent_count integer not null default 0,
  security_classification text not null default 'internal',
  retention_policy text not null default 'retain-indefinite-review-annually',
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint agent_directory_profession_unique unique (universe_id, profession_key),
  constraint agent_directory_category_check check (
    category in (
      'business', 'supply_chain', 'technology', 'professional_intelligence',
      'operations', 'science', 'cultural_intelligence'
    )
  ),
  constraint agent_directory_oversight_check check (
    oversight_level in ('standard', 'elevated', 'high_stakes')
  ),
  -- Legal, medical, accounting, engineering and the other high-stakes
  -- professions do not get to opt out of human approval.
  constraint agent_directory_high_stakes_check check (
    oversight_level <> 'high_stakes' or requires_human_approval = true
  ),
  constraint agent_directory_count_check check (logical_agent_count >= 0)
);

-- ---------------------------------------------------------------------------
-- 12. agent_control_actions — pause, stop, quarantine, revoke
-- ---------------------------------------------------------------------------

create table if not exists public.agent_control_actions (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  control text not null,
  subject_kind text not null,
  subject_agent_id uuid null references public.agent_registry (id) on delete cascade,
  subject_task_force_id uuid null references public.agent_task_forces (id) on delete cascade,
  subject_meeting_id uuid null references public.agent_meetings (id) on delete cascade,
  target_task_id uuid null references public.agent_tasks (id) on delete set null,
  target_capability_id uuid null references public.agent_capabilities (id) on delete set null,
  reason text not null,
  issued_by uuid not null references auth.users (id) on delete restrict,
  effective boolean not null default true,
  cleared_by uuid null references auth.users (id) on delete set null,
  cleared_at timestamptz null,
  security_classification text not null default 'restricted',
  retention_policy text not null default 'retain-7y-then-review',
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  issued_at timestamptz not null default now(),
  constraint agent_control_actions_control_check check (
    control in ('pause', 'resume', 'stop', 'quarantine', 'revoke_task', 'revoke_tool', 'archive', 'escalate_to_human')
  ),
  constraint agent_control_actions_subject_kind_check check (
    subject_kind in ('agent', 'task_force', 'meeting')
  ),
  constraint agent_control_actions_subject_check check (
    (subject_kind = 'agent' and subject_agent_id is not null)
    or (subject_kind = 'task_force' and subject_task_force_id is not null)
    or (subject_kind = 'meeting' and subject_meeting_id is not null)
  ),
  constraint agent_control_actions_reason_check check (coalesce(btrim(reason), '') <> ''),
  constraint agent_control_actions_revoke_tool_check check (
    control <> 'revoke_tool' or target_capability_id is not null
  ),
  constraint agent_control_actions_revoke_task_check check (
    control <> 'revoke_task' or target_task_id is not null
  )
);

-- ---------------------------------------------------------------------------
-- 13. human_knowledge_records — what a person said, filed as what it is
-- ---------------------------------------------------------------------------

-- The categories are the story's. elevates_to_fact is the guard against the
-- failure mode the story names: an executive's opinion does not silently become
-- an organizational truth that agents then reason from.
create table if not exists public.human_knowledge_records (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  meeting_id uuid null references public.agent_meetings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete restrict,
  category text not null,
  statement text not null,
  context text null,
  subject_agent_id uuid null references public.agent_registry (id) on delete set null,
  corrects_evidence_id uuid null references public.agent_meeting_evidence (id) on delete set null,
  approves_decision_id uuid null references public.agent_meeting_decisions (id) on delete set null,
  elevates_to_fact boolean not null default false,
  elevated_by uuid null references auth.users (id) on delete set null,
  confidence numeric null,
  knowledge_source_id uuid null references public.agent_knowledge_sources (id) on delete set null,
  security_classification text not null default 'confidential',
  retention_policy text not null default 'retain-7y-then-review',
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint human_knowledge_records_category_check check (
    category in (
      'HUMAN_OBSERVATION', 'HUMAN_EXPERIENCE', 'HUMAN_OPINION',
      'HUMAN_DECISION', 'HUMAN_CORRECTION', 'HUMAN_APPROVAL'
    )
  ),
  constraint human_knowledge_records_statement_check check (coalesce(btrim(statement), '') <> ''),
  constraint human_knowledge_records_opinion_check check (
    category <> 'HUMAN_OPINION' or elevates_to_fact = false
  ),
  constraint human_knowledge_records_elevation_check check (
    elevates_to_fact = false or elevated_by is not null
  ),
  constraint human_knowledge_records_correction_check check (
    category <> 'HUMAN_CORRECTION' or corrects_evidence_id is not null
  ),
  constraint human_knowledge_records_approval_check check (
    category <> 'HUMAN_APPROVAL' or approves_decision_id is not null
  ),
  constraint human_knowledge_records_confidence_check check (
    confidence is null or (confidence >= 0 and confidence <= 1)
  ),
  constraint human_knowledge_records_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  )
);

-- ---------------------------------------------------------------------------
-- 14. guardian_observations — Guardian watches, it does not join
-- ---------------------------------------------------------------------------

-- Guardian is a policy observer, not a participant with a vote. The room cannot
-- overrule an observation, and Guardian's verdict is recorded next to the
-- meeting rather than inside its deliberation.
create table if not exists public.guardian_observations (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  meeting_id uuid null references public.agent_meetings (id) on delete cascade,
  message_id uuid null references public.agent_meeting_messages (id) on delete cascade,
  subject_agent_id uuid null references public.agent_registry (id) on delete set null,
  who text not null,
  why text not null,
  what_information text not null,
  owning_universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  information_classification text not null,
  proposed_action text not null,
  requires_human_approval boolean not null,
  verdict text not null,
  conditions jsonb not null default '[]'::jsonb,
  policy_key text not null default 'guardian.default.v1',
  security_classification text not null default 'restricted',
  retention_policy text not null default 'retain-7y-then-review',
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null references public.agent_governance_events (id) on delete set null,
  observed_at timestamptz not null default now(),
  constraint guardian_observations_verdict_check check (
    verdict in ('allow', 'allow_with_conditions', 'require_human', 'refuse')
  ),
  constraint guardian_observations_classification_check check (
    information_classification in ('public', 'internal', 'confidential', 'restricted')
  ),
  constraint guardian_observations_questions_check check (
    coalesce(btrim(who), '') <> '' and coalesce(btrim(why), '') <> ''
    and coalesce(btrim(what_information), '') <> '' and coalesce(btrim(proposed_action), '') <> ''
  )
);

-- The decision row points back at the human approval that authorised it. The
-- constraint is added after both tables exist because the reference is circular.
alter table public.agent_meeting_decisions
  drop constraint if exists agent_meeting_decisions_human_record_fk;
alter table public.agent_meeting_decisions
  add constraint agent_meeting_decisions_human_record_fk
  foreign key (human_knowledge_record_id)
  references public.human_knowledge_records (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------

-- Extends the 62A guard with the agent columns introduced by this slice. Still
-- SECURITY DEFINER for the same reason: a guard that can only see the caller's
-- rows reads a foreign reference as "not found" and lets it through.
create or replace function public.xiv_assert_same_universe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb := to_jsonb(new);
  target_universe uuid := (payload ->> 'universe_id')::uuid;
  agent_columns text[] := array[
    'agent_id', 'assigned_agent_id', 'subject_agent_id', 'actor_agent_id',
    'from_agent_id', 'to_agent_id', 'sender_agent_id', 'receiver_agent_id',
    'recorded_by_agent_id', 'parent_agent_id',
    'speaker_agent_id', 'submitted_by_agent_id', 'proposed_by_agent_id',
    'raised_by_agent_id', 'voter_agent_id'
  ];
  meeting_columns text[] := array['meeting_id', 'subject_meeting_id'];
  column_name text;
  referenced uuid;
  referenced_universe uuid;
begin
  foreach column_name in array agent_columns loop
    referenced := nullif(payload ->> column_name, '')::uuid;
    if referenced is null then
      continue;
    end if;

    select a.universe_id into referenced_universe
    from public.agent_registry a
    where a.id = referenced;

    if referenced_universe is not null and referenced_universe <> target_universe then
      raise exception 'xiv_cross_universe_reference_blocked'
        using errcode = 'check_violation';
    end if;
  end loop;

  foreach column_name in array meeting_columns loop
    referenced := nullif(payload ->> column_name, '')::uuid;
    if referenced is null then
      continue;
    end if;

    select m.universe_id into referenced_universe
    from public.agent_meetings m
    where m.id = referenced;

    if referenced_universe is not null and referenced_universe <> target_universe then
      raise exception 'xiv_cross_universe_reference_blocked'
        using errcode = 'check_violation';
    end if;
  end loop;

  return new;
end;
$$;

-- Organization ownership. The story asks every tenant-bearing table to carry the
-- organization, so the column is filled from the universe rather than trusted
-- from the client, and a mismatched value is refused instead of corrected.
create or replace function public.xiv_apply_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owning_organization uuid;
begin
  select u.organization_id into owning_organization
  from public.universe_lifecycle u
  where u.id = new.universe_id;

  if owning_organization is null then
    raise exception 'xiv_universe_unknown' using errcode = 'check_violation';
  end if;

  if new.organization_id is null then
    new.organization_id := owning_organization;
  elsif new.organization_id <> owning_organization then
    raise exception 'xiv_organization_mismatch' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- Kill and pause controls that do not need the agent's cooperation. Every write
-- path that an agent could travel calls this, so a paused agent stops producing
-- rows the moment the control is set, whatever the agent itself intends.
create or replace function public.xiv_assert_agent_controllable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb := to_jsonb(new);
  agent_columns text[] := array[
    'speaker_agent_id', 'submitted_by_agent_id', 'proposed_by_agent_id',
    'raised_by_agent_id', 'voter_agent_id', 'sender_agent_id', 'assigned_agent_id'
  ];
  column_name text;
  referenced uuid;
  state text;
begin
  foreach column_name in array agent_columns loop
    referenced := nullif(payload ->> column_name, '')::uuid;
    if referenced is null then
      continue;
    end if;

    select a.control_state into state
    from public.agent_registry a
    where a.id = referenced;

    if state is not null and state <> 'normal' then
      raise exception 'xiv_agent_control_state_blocked' using errcode = 'check_violation';
    end if;
  end loop;

  return new;
end;
$$;

-- Anti-spoofing. An agent-authored row must belong to an agent that is a
-- participant in that meeting, and the caller must be the operator recorded on
-- the participant row. A member cannot speak in another member's agent's name.
create or replace function public.xiv_assert_speaking_grant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb := to_jsonb(new);
  agent_columns text[] := array[
    'speaker_agent_id', 'submitted_by_agent_id', 'proposed_by_agent_id',
    'raised_by_agent_id', 'voter_agent_id'
  ];
  column_name text;
  referenced uuid;
  claimed_operator uuid := nullif(payload ->> 'operator_user_id', '')::uuid;
  granted_operator uuid;
  meeting uuid := nullif(payload ->> 'meeting_id', '')::uuid;
begin
  foreach column_name in array agent_columns loop
    referenced := nullif(payload ->> column_name, '')::uuid;
    if referenced is null then
      continue;
    end if;

    select p.operator_user_id into granted_operator
    from public.agent_meeting_participants p
    where p.meeting_id = meeting
      and p.agent_id = referenced
      and p.left_at is null;

    if not found then
      raise exception 'xiv_agent_not_a_participant' using errcode = 'check_violation';
    end if;

    if claimed_operator is null or claimed_operator <> granted_operator then
      raise exception 'xiv_agent_impersonation_blocked' using errcode = 'check_violation';
    end if;

    -- auth.uid() is null for the service role and for the migration itself; the
    -- check only applies to an end-user session, which is where spoofing would
    -- come from.
    if auth.uid() is not null and auth.uid() <> granted_operator then
      raise exception 'xiv_agent_impersonation_blocked' using errcode = 'check_violation';
    end if;
  end loop;

  return new;
end;
$$;

-- The resource governor. Deliberation stops at the ceiling instead of running
-- until something else breaks.
create or replace function public.xiv_enforce_meeting_budget()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  budget public.agent_meeting_budgets%rowtype;
  message_count integer;
  agent_count integer;
begin
  select * into budget
  from public.agent_meeting_budgets b
  where b.meeting_id = new.meeting_id;

  if not found then
    raise exception 'xiv_meeting_budget_missing' using errcode = 'check_violation';
  end if;

  if budget.exhausted then
    raise exception 'xiv_meeting_budget_exhausted' using errcode = 'check_violation';
  end if;

  if tg_table_name = 'agent_meeting_messages' then
    select count(*) into message_count
    from public.agent_meeting_messages m
    where m.meeting_id = new.meeting_id and m.id <> new.id;

    if message_count + 1 > budget.max_messages then
      raise exception 'xiv_meeting_message_budget_exceeded' using errcode = 'check_violation';
    end if;
  end if;

  if tg_table_name = 'agent_meeting_participants' and new.participant_kind = 'agent' then
    select count(*) into agent_count
    from public.agent_meeting_participants p
    where p.meeting_id = new.meeting_id
      and p.participant_kind = 'agent'
      and p.left_at is null
      and p.id <> new.id;

    if agent_count + 1 > budget.max_participant_agents then
      raise exception 'xiv_meeting_participant_budget_exceeded' using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

-- The human checkpoint. Only a human participant in that room may record the
-- decision, and an agent cannot manufacture the approval by writing the column.
create or replace function public.xiv_assert_human_decider()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_participant boolean;
begin
  select exists (
    select 1
    from public.agent_meeting_participants p
    where p.meeting_id = new.meeting_id
      and p.participant_kind = 'human'
      and p.user_id = new.decided_by_user_id
  ) into is_participant;

  if not is_participant then
    raise exception 'xiv_decision_requires_human_participant' using errcode = 'check_violation';
  end if;

  if auth.uid() is not null and auth.uid() <> new.decided_by_user_id then
    raise exception 'xiv_decision_attribution_blocked' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- The lifecycle only moves forward. A room cannot quietly reopen its evidence
-- phase after a decision has been recorded against it.
create or replace function public.xiv_enforce_meeting_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  stages text[] := array[
    'trigger', 'created', 'participants_selected', 'context_authorized',
    'evidence_collected', 'specialist_analysis', 'debate', 'contradiction_detection',
    'alternatives_generated', 'risk_analysis', 'consensus_or_disagreement',
    'human_checkpoint', 'decision', 'authorized_action', 'outcome',
    'post_meeting_evaluation', 'knowledge_lineage'
  ];
  old_index integer;
  new_index integer;
begin
  if tg_op = 'UPDATE' then
    old_index := array_position(stages, old.lifecycle_stage);
    new_index := array_position(stages, new.lifecycle_stage);

    if new_index < old_index then
      raise exception 'xiv_meeting_lifecycle_regression_blocked' using errcode = 'check_violation';
    end if;
  end if;

  -- status is derived, never independently set, so the coarse state the clients
  -- read can never contradict the lifecycle stage.
  new.status := case
    when new.archived_at is not null then 'archived'
    when new.lifecycle_stage = 'knowledge_lineage' then 'archived'
    when new.lifecycle_stage in ('decision', 'authorized_action', 'outcome', 'post_meeting_evaluation')
      and new.decision is not null then 'decided'
    when new.lifecycle_stage in ('decision', 'authorized_action', 'outcome', 'post_meeting_evaluation')
      then 'awaiting_human'
    when new.lifecycle_stage = 'human_checkpoint' then 'awaiting_human'
    when new.lifecycle_stage in (
      'evidence_collected', 'specialist_analysis', 'debate', 'contradiction_detection',
      'alternatives_generated', 'risk_analysis', 'consensus_or_disagreement'
    ) then 'deliberating'
    when new.lifecycle_stage = 'trigger' then 'scheduled'
    else 'open'
  end;

  return new;
end;
$$;

-- Reputation narrows, it never widens. The ceiling is derived from the measured
-- composite here so no caller can hand an agent a higher impact level by writing
-- the column directly.
create or replace function public.xiv_derive_reputation_ceiling()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.composite := round((
      new.accuracy * 0.20
    + new.evidence_quality * 0.15
    + new.calibration * 0.15
    + new.task_success * 0.15
    + new.security_compliance * 0.10
    + new.cost_efficiency * 0.08
    + new.latency_score * 0.05
    + new.collaboration_quality * 0.07
    + (1 - new.hallucination_rate) * 0.03
    + (1 - new.human_correction_rate) * 0.02
  )::numeric, 4);

  new.eligibility_tier := case
    when new.security_compliance < 0.9 or new.hallucination_rate > 0.2 then 'restricted'
    when new.sample_size < 5 then 'probationary'
    when new.composite >= 0.85 then 'trusted'
    when new.composite >= 0.65 then 'standard'
    when new.composite >= 0.45 then 'probationary'
    else 'restricted'
  end;

  new.max_impact_level := case new.eligibility_tier
    when 'trusted' then 'high'
    when 'standard' then 'medium'
    when 'probationary' then 'low'
    else 'none'
  end;

  new.updated_at := now();

  return new;
end;
$$;

-- Organization stamping.
drop trigger if exists agent_meeting_messages_organization on public.agent_meeting_messages;
create trigger agent_meeting_messages_organization
  before insert or update on public.agent_meeting_messages
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_meeting_evidence_organization on public.agent_meeting_evidence;
create trigger agent_meeting_evidence_organization
  before insert or update on public.agent_meeting_evidence
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_meeting_proposals_organization on public.agent_meeting_proposals;
create trigger agent_meeting_proposals_organization
  before insert or update on public.agent_meeting_proposals
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_meeting_objections_organization on public.agent_meeting_objections;
create trigger agent_meeting_objections_organization
  before insert or update on public.agent_meeting_objections
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_meeting_votes_organization on public.agent_meeting_votes;
create trigger agent_meeting_votes_organization
  before insert or update on public.agent_meeting_votes
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_meeting_decisions_organization on public.agent_meeting_decisions;
create trigger agent_meeting_decisions_organization
  before insert or update on public.agent_meeting_decisions
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_meeting_actions_organization on public.agent_meeting_actions;
create trigger agent_meeting_actions_organization
  before insert or update on public.agent_meeting_actions
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_meeting_outcomes_organization on public.agent_meeting_outcomes;
create trigger agent_meeting_outcomes_organization
  before insert or update on public.agent_meeting_outcomes
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_meeting_budgets_organization on public.agent_meeting_budgets;
create trigger agent_meeting_budgets_organization
  before insert or update on public.agent_meeting_budgets
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_reputation_organization on public.agent_reputation;
create trigger agent_reputation_organization
  before insert or update on public.agent_reputation
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_directory_organization on public.agent_directory;
create trigger agent_directory_organization
  before insert or update on public.agent_directory
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_control_actions_organization on public.agent_control_actions;
create trigger agent_control_actions_organization
  before insert or update on public.agent_control_actions
  for each row execute function public.xiv_apply_organization();

drop trigger if exists human_knowledge_records_organization on public.human_knowledge_records;
create trigger human_knowledge_records_organization
  before insert or update on public.human_knowledge_records
  for each row execute function public.xiv_apply_organization();

drop trigger if exists guardian_observations_organization on public.guardian_observations;
create trigger guardian_observations_organization
  before insert or update on public.guardian_observations
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_meetings_organization on public.agent_meetings;
create trigger agent_meetings_organization
  before insert or update on public.agent_meetings
  for each row execute function public.xiv_apply_organization();

drop trigger if exists agent_meeting_participants_organization on public.agent_meeting_participants;
create trigger agent_meeting_participants_organization
  before insert or update on public.agent_meeting_participants
  for each row execute function public.xiv_apply_organization();

-- Cross-universe guards.
drop trigger if exists agent_meeting_messages_same_universe on public.agent_meeting_messages;
create trigger agent_meeting_messages_same_universe
  before insert or update on public.agent_meeting_messages
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_meeting_evidence_same_universe on public.agent_meeting_evidence;
create trigger agent_meeting_evidence_same_universe
  before insert or update on public.agent_meeting_evidence
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_meeting_proposals_same_universe on public.agent_meeting_proposals;
create trigger agent_meeting_proposals_same_universe
  before insert or update on public.agent_meeting_proposals
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_meeting_objections_same_universe on public.agent_meeting_objections;
create trigger agent_meeting_objections_same_universe
  before insert or update on public.agent_meeting_objections
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_meeting_votes_same_universe on public.agent_meeting_votes;
create trigger agent_meeting_votes_same_universe
  before insert or update on public.agent_meeting_votes
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_meeting_decisions_same_universe on public.agent_meeting_decisions;
create trigger agent_meeting_decisions_same_universe
  before insert or update on public.agent_meeting_decisions
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_meeting_actions_same_universe on public.agent_meeting_actions;
create trigger agent_meeting_actions_same_universe
  before insert or update on public.agent_meeting_actions
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_meeting_outcomes_same_universe on public.agent_meeting_outcomes;
create trigger agent_meeting_outcomes_same_universe
  before insert or update on public.agent_meeting_outcomes
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_meeting_budgets_same_universe on public.agent_meeting_budgets;
create trigger agent_meeting_budgets_same_universe
  before insert or update on public.agent_meeting_budgets
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_reputation_same_universe on public.agent_reputation;
create trigger agent_reputation_same_universe
  before insert or update on public.agent_reputation
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_directory_same_universe on public.agent_directory;
create trigger agent_directory_same_universe
  before insert or update on public.agent_directory
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_control_actions_same_universe on public.agent_control_actions;
create trigger agent_control_actions_same_universe
  before insert or update on public.agent_control_actions
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists human_knowledge_records_same_universe on public.human_knowledge_records;
create trigger human_knowledge_records_same_universe
  before insert or update on public.human_knowledge_records
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists guardian_observations_same_universe on public.guardian_observations;
create trigger guardian_observations_same_universe
  before insert or update on public.guardian_observations
  for each row execute function public.xiv_assert_same_universe();

-- Kill switch.
drop trigger if exists agent_meeting_messages_kill_switch on public.agent_meeting_messages;
create trigger agent_meeting_messages_kill_switch
  before insert on public.agent_meeting_messages
  for each row execute function public.xiv_assert_kill_switch_clear();

drop trigger if exists agent_meeting_evidence_kill_switch on public.agent_meeting_evidence;
create trigger agent_meeting_evidence_kill_switch
  before insert on public.agent_meeting_evidence
  for each row execute function public.xiv_assert_kill_switch_clear();

drop trigger if exists agent_meeting_proposals_kill_switch on public.agent_meeting_proposals;
create trigger agent_meeting_proposals_kill_switch
  before insert on public.agent_meeting_proposals
  for each row execute function public.xiv_assert_kill_switch_clear();

drop trigger if exists agent_meeting_votes_kill_switch on public.agent_meeting_votes;
create trigger agent_meeting_votes_kill_switch
  before insert on public.agent_meeting_votes
  for each row execute function public.xiv_assert_kill_switch_clear();

-- Pause, stop and quarantine.
drop trigger if exists agent_meeting_messages_control on public.agent_meeting_messages;
create trigger agent_meeting_messages_control
  before insert on public.agent_meeting_messages
  for each row execute function public.xiv_assert_agent_controllable();

drop trigger if exists agent_meeting_evidence_control on public.agent_meeting_evidence;
create trigger agent_meeting_evidence_control
  before insert on public.agent_meeting_evidence
  for each row execute function public.xiv_assert_agent_controllable();

drop trigger if exists agent_meeting_proposals_control on public.agent_meeting_proposals;
create trigger agent_meeting_proposals_control
  before insert on public.agent_meeting_proposals
  for each row execute function public.xiv_assert_agent_controllable();

drop trigger if exists agent_meeting_objections_control on public.agent_meeting_objections;
create trigger agent_meeting_objections_control
  before insert on public.agent_meeting_objections
  for each row execute function public.xiv_assert_agent_controllable();

drop trigger if exists agent_meeting_votes_control on public.agent_meeting_votes;
create trigger agent_meeting_votes_control
  before insert on public.agent_meeting_votes
  for each row execute function public.xiv_assert_agent_controllable();

drop trigger if exists agent_messages_control on public.agent_messages;
create trigger agent_messages_control
  before insert on public.agent_messages
  for each row execute function public.xiv_assert_agent_controllable();

drop trigger if exists agent_tasks_control on public.agent_tasks;
create trigger agent_tasks_control
  before insert on public.agent_tasks
  for each row execute function public.xiv_assert_agent_controllable();

-- Anti-spoofing.
drop trigger if exists agent_meeting_messages_speaking_grant on public.agent_meeting_messages;
create trigger agent_meeting_messages_speaking_grant
  before insert on public.agent_meeting_messages
  for each row execute function public.xiv_assert_speaking_grant();

drop trigger if exists agent_meeting_evidence_speaking_grant on public.agent_meeting_evidence;
create trigger agent_meeting_evidence_speaking_grant
  before insert on public.agent_meeting_evidence
  for each row execute function public.xiv_assert_speaking_grant();

drop trigger if exists agent_meeting_proposals_speaking_grant on public.agent_meeting_proposals;
create trigger agent_meeting_proposals_speaking_grant
  before insert on public.agent_meeting_proposals
  for each row execute function public.xiv_assert_speaking_grant();

drop trigger if exists agent_meeting_objections_speaking_grant on public.agent_meeting_objections;
create trigger agent_meeting_objections_speaking_grant
  before insert on public.agent_meeting_objections
  for each row execute function public.xiv_assert_speaking_grant();

drop trigger if exists agent_meeting_votes_speaking_grant on public.agent_meeting_votes;
create trigger agent_meeting_votes_speaking_grant
  before insert on public.agent_meeting_votes
  for each row execute function public.xiv_assert_speaking_grant();

-- Resource governor.
drop trigger if exists agent_meeting_messages_budget on public.agent_meeting_messages;
create trigger agent_meeting_messages_budget
  before insert on public.agent_meeting_messages
  for each row execute function public.xiv_enforce_meeting_budget();

drop trigger if exists agent_meeting_participants_budget on public.agent_meeting_participants;
create trigger agent_meeting_participants_budget
  before insert on public.agent_meeting_participants
  for each row execute function public.xiv_enforce_meeting_budget();

-- Human checkpoint and lifecycle.
drop trigger if exists agent_meeting_decisions_human on public.agent_meeting_decisions;
create trigger agent_meeting_decisions_human
  before insert or update on public.agent_meeting_decisions
  for each row execute function public.xiv_assert_human_decider();

drop trigger if exists agent_meetings_lifecycle on public.agent_meetings;
create trigger agent_meetings_lifecycle
  before insert or update on public.agent_meetings
  for each row execute function public.xiv_enforce_meeting_lifecycle();

drop trigger if exists agent_reputation_ceiling on public.agent_reputation;
create trigger agent_reputation_ceiling
  before insert or update on public.agent_reputation
  for each row execute function public.xiv_derive_reputation_ceiling();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists agent_meeting_messages_meeting_idx
  on public.agent_meeting_messages (meeting_id, sequence);
create index if not exists agent_meeting_messages_universe_idx
  on public.agent_meeting_messages (universe_id, created_at desc);
create index if not exists agent_meeting_evidence_meeting_idx
  on public.agent_meeting_evidence (meeting_id, subject, dimension);
create index if not exists agent_meeting_proposals_meeting_idx
  on public.agent_meeting_proposals (meeting_id, status);
create index if not exists agent_meeting_objections_meeting_idx
  on public.agent_meeting_objections (meeting_id, severity, resolution_kind);
create index if not exists agent_meeting_votes_meeting_idx
  on public.agent_meeting_votes (meeting_id, proposal_id);
create index if not exists agent_meeting_decisions_meeting_idx
  on public.agent_meeting_decisions (meeting_id, decided_at desc);
create index if not exists agent_meeting_actions_meeting_idx
  on public.agent_meeting_actions (meeting_id, status);
create index if not exists agent_meeting_outcomes_meeting_idx
  on public.agent_meeting_outcomes (meeting_id, measured_at desc);
create index if not exists agent_meeting_budgets_universe_idx
  on public.agent_meeting_budgets (universe_id, exhausted);
create index if not exists agent_reputation_universe_idx
  on public.agent_reputation (universe_id, eligibility_tier);
create index if not exists agent_directory_universe_idx
  on public.agent_directory (universe_id, category, oversight_level);
create index if not exists agent_control_actions_subject_idx
  on public.agent_control_actions (universe_id, subject_kind, effective);
create index if not exists human_knowledge_records_universe_idx
  on public.human_knowledge_records (universe_id, category, created_at desc);
create index if not exists guardian_observations_universe_idx
  on public.guardian_observations (universe_id, verdict, observed_at desc);
create index if not exists agent_meetings_lifecycle_idx
  on public.agent_meetings (universe_id, lifecycle_stage);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.agent_meeting_messages enable row level security;
alter table public.agent_meeting_evidence enable row level security;
alter table public.agent_meeting_proposals enable row level security;
alter table public.agent_meeting_objections enable row level security;
alter table public.agent_meeting_votes enable row level security;
alter table public.agent_meeting_decisions enable row level security;
alter table public.agent_meeting_actions enable row level security;
alter table public.agent_meeting_outcomes enable row level security;
alter table public.agent_meeting_budgets enable row level security;
alter table public.agent_reputation enable row level security;
alter table public.agent_directory enable row level security;
alter table public.agent_control_actions enable row level security;
alter table public.human_knowledge_records enable row level security;
alter table public.guardian_observations enable row level security;

alter table public.agent_meeting_messages force row level security;
alter table public.agent_meeting_evidence force row level security;
alter table public.agent_meeting_proposals force row level security;
alter table public.agent_meeting_objections force row level security;
alter table public.agent_meeting_votes force row level security;
alter table public.agent_meeting_decisions force row level security;
alter table public.agent_meeting_actions force row level security;
alter table public.agent_meeting_outcomes force row level security;
alter table public.agent_meeting_budgets force row level security;
alter table public.agent_reputation force row level security;
alter table public.agent_directory force row level security;
alter table public.agent_control_actions force row level security;
alter table public.human_knowledge_records force row level security;
alter table public.guardian_observations force row level security;

revoke all on table public.agent_meeting_messages from public, anon;
revoke all on table public.agent_meeting_evidence from public, anon;
revoke all on table public.agent_meeting_proposals from public, anon;
revoke all on table public.agent_meeting_objections from public, anon;
revoke all on table public.agent_meeting_votes from public, anon;
revoke all on table public.agent_meeting_decisions from public, anon;
revoke all on table public.agent_meeting_actions from public, anon;
revoke all on table public.agent_meeting_outcomes from public, anon;
revoke all on table public.agent_meeting_budgets from public, anon;
revoke all on table public.agent_reputation from public, anon;
revoke all on table public.agent_directory from public, anon;
revoke all on table public.agent_control_actions from public, anon;
revoke all on table public.human_knowledge_records from public, anon;
revoke all on table public.guardian_observations from public, anon;

-- The transcript, the evidence and the votes are append-only from the client's
-- side. Rewriting what an agent said is not an edit, it is a forgery, so no
-- update grant exists on those tables at all.
grant select, insert on table public.agent_meeting_messages to authenticated;
grant select, insert on table public.agent_meeting_evidence to authenticated;
grant select, insert, update on table public.agent_meeting_proposals to authenticated;
grant select, insert, update on table public.agent_meeting_objections to authenticated;
grant select, insert on table public.agent_meeting_votes to authenticated;
grant select, insert on table public.agent_meeting_decisions to authenticated;
grant select, insert, update on table public.agent_meeting_actions to authenticated;
grant select, insert on table public.agent_meeting_outcomes to authenticated;
grant select, insert, update on table public.agent_meeting_budgets to authenticated;
grant select, insert, update on table public.agent_reputation to authenticated;
grant select, insert, update on table public.agent_directory to authenticated;
grant select, insert, update on table public.agent_control_actions to authenticated;
grant select, insert on table public.human_knowledge_records to authenticated;
grant select, insert on table public.guardian_observations to authenticated;

drop policy if exists agent_meeting_messages_select_member on public.agent_meeting_messages;
drop policy if exists agent_meeting_messages_insert_member on public.agent_meeting_messages;
drop policy if exists agent_meeting_evidence_select_member on public.agent_meeting_evidence;
drop policy if exists agent_meeting_evidence_insert_member on public.agent_meeting_evidence;
drop policy if exists agent_meeting_proposals_select_member on public.agent_meeting_proposals;
drop policy if exists agent_meeting_proposals_insert_member on public.agent_meeting_proposals;
drop policy if exists agent_meeting_proposals_update_member on public.agent_meeting_proposals;
drop policy if exists agent_meeting_objections_select_member on public.agent_meeting_objections;
drop policy if exists agent_meeting_objections_insert_member on public.agent_meeting_objections;
drop policy if exists agent_meeting_objections_update_member on public.agent_meeting_objections;
drop policy if exists agent_meeting_votes_select_member on public.agent_meeting_votes;
drop policy if exists agent_meeting_votes_insert_member on public.agent_meeting_votes;
drop policy if exists agent_meeting_decisions_select_member on public.agent_meeting_decisions;
drop policy if exists agent_meeting_decisions_insert_member on public.agent_meeting_decisions;
drop policy if exists agent_meeting_actions_select_member on public.agent_meeting_actions;
drop policy if exists agent_meeting_actions_insert_member on public.agent_meeting_actions;
drop policy if exists agent_meeting_actions_update_supervisor on public.agent_meeting_actions;
drop policy if exists agent_meeting_outcomes_select_member on public.agent_meeting_outcomes;
drop policy if exists agent_meeting_outcomes_insert_supervisor on public.agent_meeting_outcomes;
drop policy if exists agent_meeting_budgets_select_member on public.agent_meeting_budgets;
drop policy if exists agent_meeting_budgets_insert_supervisor on public.agent_meeting_budgets;
drop policy if exists agent_meeting_budgets_update_supervisor on public.agent_meeting_budgets;
drop policy if exists agent_reputation_select_member on public.agent_reputation;
drop policy if exists agent_reputation_insert_supervisor on public.agent_reputation;
drop policy if exists agent_reputation_update_supervisor on public.agent_reputation;
drop policy if exists agent_directory_select_member on public.agent_directory;
drop policy if exists agent_directory_insert_supervisor on public.agent_directory;
drop policy if exists agent_directory_update_supervisor on public.agent_directory;
drop policy if exists agent_control_actions_select_member on public.agent_control_actions;
drop policy if exists agent_control_actions_insert_supervisor on public.agent_control_actions;
drop policy if exists agent_control_actions_update_supervisor on public.agent_control_actions;
drop policy if exists human_knowledge_records_select_member on public.human_knowledge_records;
drop policy if exists human_knowledge_records_insert_self on public.human_knowledge_records;
drop policy if exists guardian_observations_select_member on public.guardian_observations;
drop policy if exists guardian_observations_insert_member on public.guardian_observations;

create policy agent_meeting_messages_select_member
  on public.agent_meeting_messages
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_messages_insert_member
  on public.agent_meeting_messages
  for insert
  to authenticated
  with check (
    public.xiv_is_universe_member(universe_id)
    and (speaker_kind <> 'human' or speaker_user_id = auth.uid())
  );

create policy agent_meeting_evidence_select_member
  on public.agent_meeting_evidence
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_evidence_insert_member
  on public.agent_meeting_evidence
  for insert
  to authenticated
  with check (
    public.xiv_is_universe_member(universe_id)
    and (submitted_by_user_id is null or submitted_by_user_id = auth.uid())
  );

create policy agent_meeting_proposals_select_member
  on public.agent_meeting_proposals
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_proposals_insert_member
  on public.agent_meeting_proposals
  for insert
  to authenticated
  with check (
    public.xiv_is_universe_member(universe_id)
    and (proposed_by_user_id is null or proposed_by_user_id = auth.uid())
  );

create policy agent_meeting_proposals_update_member
  on public.agent_meeting_proposals
  for update
  to authenticated
  using (public.xiv_is_universe_member(universe_id))
  with check (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_objections_select_member
  on public.agent_meeting_objections
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_objections_insert_member
  on public.agent_meeting_objections
  for insert
  to authenticated
  with check (
    public.xiv_is_universe_member(universe_id)
    and (raised_by_user_id is null or raised_by_user_id = auth.uid())
  );

-- Only a person closes an objection, and only the person doing it can sign it.
create policy agent_meeting_objections_update_member
  on public.agent_meeting_objections
  for update
  to authenticated
  using (public.xiv_is_universe_member(universe_id))
  with check (
    public.xiv_is_universe_member(universe_id)
    and (resolved_by_user_id is null or resolved_by_user_id = auth.uid())
  );

create policy agent_meeting_votes_select_member
  on public.agent_meeting_votes
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_votes_insert_member
  on public.agent_meeting_votes
  for insert
  to authenticated
  with check (
    public.xiv_is_universe_member(universe_id)
    and (voter_kind <> 'human' or voter_user_id = auth.uid())
  );

create policy agent_meeting_decisions_select_member
  on public.agent_meeting_decisions
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

-- A decision is signed by the person making it. There is no path by which one
-- member records a decision in another member's name.
create policy agent_meeting_decisions_insert_member
  on public.agent_meeting_decisions
  for insert
  to authenticated
  with check (
    public.xiv_is_universe_member(universe_id)
    and decided_by_user_id = auth.uid()
  );

create policy agent_meeting_actions_select_member
  on public.agent_meeting_actions
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_actions_insert_member
  on public.agent_meeting_actions
  for insert
  to authenticated
  with check (public.xiv_is_universe_member(universe_id));

-- Authorising work is a supervisor act, and the approver column can only ever
-- hold the supervisor who is actually calling.
create policy agent_meeting_actions_update_supervisor
  on public.agent_meeting_actions
  for update
  to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (
    public.xiv_is_universe_supervisor(universe_id)
    and (approved_by is null or approved_by = auth.uid())
  );

create policy agent_meeting_outcomes_select_member
  on public.agent_meeting_outcomes
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_outcomes_insert_supervisor
  on public.agent_meeting_outcomes
  for insert
  to authenticated
  with check (
    public.xiv_is_universe_supervisor(universe_id)
    and recorded_by_user_id = auth.uid()
  );

create policy agent_meeting_budgets_select_member
  on public.agent_meeting_budgets
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_budgets_insert_supervisor
  on public.agent_meeting_budgets
  for insert
  to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_meeting_budgets_update_supervisor
  on public.agent_meeting_budgets
  for update
  to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_reputation_select_member
  on public.agent_reputation
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_reputation_insert_supervisor
  on public.agent_reputation
  for insert
  to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_reputation_update_supervisor
  on public.agent_reputation
  for update
  to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_directory_select_member
  on public.agent_directory
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_directory_insert_supervisor
  on public.agent_directory
  for insert
  to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_directory_update_supervisor
  on public.agent_directory
  for update
  to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_control_actions_select_member
  on public.agent_control_actions
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

-- Stopping an agent is a human administrator's act. An agent cannot issue a
-- control, and cannot clear one that was issued against it.
create policy agent_control_actions_insert_supervisor
  on public.agent_control_actions
  for insert
  to authenticated
  with check (
    public.xiv_is_universe_supervisor(universe_id)
    and issued_by = auth.uid()
  );

create policy agent_control_actions_update_supervisor
  on public.agent_control_actions
  for update
  to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (
    public.xiv_is_universe_supervisor(universe_id)
    and (cleared_by is null or cleared_by = auth.uid())
  );

create policy human_knowledge_records_select_member
  on public.human_knowledge_records
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

-- A human knowledge record is first-person by construction: it is what this
-- person said, so only this person can file it.
create policy human_knowledge_records_insert_self
  on public.human_knowledge_records
  for insert
  to authenticated
  with check (
    public.xiv_is_universe_member(universe_id)
    and user_id = auth.uid()
    and (elevates_to_fact = false or public.xiv_is_universe_supervisor(universe_id))
  );

create policy guardian_observations_select_member
  on public.guardian_observations
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy guardian_observations_insert_member
  on public.guardian_observations
  for insert
  to authenticated
  with check (public.xiv_is_universe_member(universe_id));

-- ---------------------------------------------------------------------------
-- What this file still does not do
-- ---------------------------------------------------------------------------
-- No agent runs. No schedule fires. No capability is granted by any row here.
-- Reputation narrows eligibility and never widens authority. Asynchronous
-- meetings are a bounded window plus a budget, not a licence to act overnight:
-- every action still lands in agent_meeting_actions with requires_human_approval
-- and waits for a person.
