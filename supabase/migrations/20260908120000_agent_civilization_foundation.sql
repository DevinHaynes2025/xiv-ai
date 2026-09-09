-- 2I-AI-62A — XIV Agent Civilization Foundation (first engineering slice)
-- FOUNDER: run this entire file in the hosted Supabase SQL editor, after
--   20260904180000_ai_agent_governance.sql and 20260904200000_profile_identity_and_avatars.sql.
-- This workspace cannot apply it remotely. Until it is applied, PostgREST returns
-- PGRST205 for these relations and the clients must surface that honestly.
-- After this file succeeds, also run:
--   NOTIFY pgrst, 'reload schema';
--
-- Scope. This file creates the fifteen slice tables plus the two tenancy anchors
-- (universe_lifecycle, universe_memberships) that the slice tables need in order to
-- have an enforceable RLS predicate, and one append-only governance ledger.
-- It does not create autonomous behaviour. Nothing here executes an agent.
--
-- Tenancy model.
--   organization -> universe -> (humans, agents, teams, knowledge, tasks, audit)
-- Every tenant-bearing table carries universe_id directly, even when it could be
-- reached by join, so that each RLS policy is a single non-recursive predicate.
--
-- RLS recursion. The two helper predicates are STABLE and SECURITY INVOKER. They stay
-- terminating because universe_memberships policies are self-contained (user_id =
-- auth.uid()) and never call back into another table's policy.
--
-- Re-runnable: create table if not exists, drop policy if exists then recreate,
-- create or replace function, drop trigger if exists then recreate.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tenancy anchors
-- ---------------------------------------------------------------------------

-- Universe registry and lifecycle state.
-- Created -> Seed -> Growth -> Operational -> Mature -> Transformation -> Archive.
-- constellation_key and galaxy_key are reserved namespace labels for a future
-- federation story (2I-AI-62F / 62H). Nothing federates today.
create table if not exists public.universe_lifecycle (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  lifecycle_stage text not null default 'created',
  stage_entered_at timestamptz not null default now(),
  security_classification text not null default 'internal',
  constellation_key text null,
  galaxy_key text null,
  kill_switch_engaged boolean not null default false,
  kill_switch_reason text null,
  kill_switch_engaged_at timestamptz null,
  created_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint universe_lifecycle_stage_check check (
    lifecycle_stage in ('created', 'seed', 'growth', 'operational', 'mature', 'transformation', 'archive')
  ),
  constraint universe_lifecycle_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  ),
  constraint universe_lifecycle_kill_switch_reason_check check (
    kill_switch_engaged = false or coalesce(btrim(kill_switch_reason), '') <> ''
  )
);

-- Which humans belong to a universe. is_supervisor marks the accountable human
-- supervisor required by the agent identity contract.
create table if not exists public.universe_memberships (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  membership_role text not null default 'participant',
  is_supervisor boolean not null default false,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  constraint universe_memberships_role_check check (
    membership_role in ('owner', 'supervisor', 'participant', 'observer')
  ),
  constraint universe_memberships_unique unique (universe_id, user_id)
);

create or replace function public.xiv_is_universe_member(target_universe uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.universe_memberships m
    where m.universe_id = target_universe
      and m.user_id = auth.uid()
      and m.revoked_at is null
  );
$$;

create or replace function public.xiv_is_universe_supervisor(target_universe uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.universe_memberships m
    where m.universe_id = target_universe
      and m.user_id = auth.uid()
      and m.revoked_at is null
      and m.is_supervisor = true
  );
$$;

-- ---------------------------------------------------------------------------
-- 1. agent_registry — the controlled agent identity
-- ---------------------------------------------------------------------------

create table if not exists public.agent_registry (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  agent_key text not null,
  display_name text not null,
  profession text not null,
  specialization text null,
  model_runtime text not null,
  memory_scope text not null default 'session',
  security_classification text not null default 'internal',
  lifecycle_state text not null default 'registered',
  human_supervisor_id uuid not null references auth.users (id) on delete restrict,
  guardian_policy_key text not null default 'guardian.default.v1',
  parent_agent_id uuid null references public.agent_registry (id) on delete set null,
  generation_depth integer not null default 0,
  provenance jsonb not null default '{}'::jsonb,
  kill_switch_engaged boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  activated_at timestamptz null,
  archived_at timestamptz null,
  constraint agent_registry_key_unique unique (universe_id, agent_key),
  constraint agent_registry_memory_scope_check check (
    memory_scope in ('none', 'session', 'agent', 'universe')
  ),
  constraint agent_registry_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  ),
  constraint agent_registry_lifecycle_check check (
    lifecycle_state in ('draft', 'registered', 'evaluating', 'active', 'sleeping', 'suspended', 'archived', 'terminated')
  ),
  constraint agent_registry_generation_depth_check check (generation_depth between 0 and 3),
  constraint agent_registry_no_self_parent check (parent_agent_id is null or parent_agent_id <> id)
);

-- ---------------------------------------------------------------------------
-- 2. agent_capabilities — approved tools, languages, cultural context, domains
-- ---------------------------------------------------------------------------

create table if not exists public.agent_capabilities (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  agent_id uuid not null references public.agent_registry (id) on delete cascade,
  capability_kind text not null,
  capability_key text not null,
  risk_level text not null default 'low',
  requires_approval boolean not null default true,
  approved boolean not null default false,
  granted_by uuid null references auth.users (id) on delete set null,
  granted_at timestamptz null,
  expires_at timestamptz null,
  constraint agent_capabilities_unique unique (agent_id, capability_kind, capability_key),
  constraint agent_capabilities_kind_check check (
    capability_kind in ('tool', 'language', 'cultural_context', 'knowledge_domain', 'runtime')
  ),
  constraint agent_capabilities_risk_check check (risk_level in ('low', 'medium', 'high', 'critical')),
  -- An agent may never hold an approved high or critical capability. Guardian owns
  -- that boundary and this constraint keeps the database honest if code regresses.
  constraint agent_capabilities_no_approved_high_risk check (
    approved = false or risk_level in ('low', 'medium')
  ),
  constraint agent_capabilities_granted_by_check check (approved = false or granted_by is not null)
);

-- ---------------------------------------------------------------------------
-- 3. agent_relationships — authorized discovery and delegation edges
-- ---------------------------------------------------------------------------

create table if not exists public.agent_relationships (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  from_agent_id uuid not null references public.agent_registry (id) on delete cascade,
  to_agent_id uuid not null references public.agent_registry (id) on delete cascade,
  relationship_type text not null,
  authorized boolean not null default false,
  authorized_by uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  constraint agent_relationships_unique unique (from_agent_id, to_agent_id, relationship_type),
  constraint agent_relationships_type_check check (
    relationship_type in ('coordinates', 'supervises', 'collaborates', 'delegates_to', 'reports_to')
  ),
  constraint agent_relationships_no_self check (from_agent_id <> to_agent_id)
);

-- ---------------------------------------------------------------------------
-- 4. agent_messages — the XIV Agent Communication Protocol (XACP) envelope
-- ---------------------------------------------------------------------------
-- Structured and auditable, never free-form autonomous networking. Every row
-- records sender, receiver, universe, purpose, evidence, reasoning artifact,
-- decision, confidence, approval and result.

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  conversation_id uuid not null,
  sequence integer not null,
  phase text not null,
  sender_agent_id uuid null references public.agent_registry (id) on delete set null,
  sender_user_id uuid null references auth.users (id) on delete set null,
  receiver_agent_id uuid null references public.agent_registry (id) on delete set null,
  receiver_user_id uuid null references auth.users (id) on delete set null,
  purpose text not null,
  evidence jsonb not null default '[]'::jsonb,
  reasoning_artifact text not null,
  decision text null,
  confidence numeric(4, 3) null,
  approval_status text not null default 'not_required',
  approved_by uuid null references auth.users (id) on delete set null,
  result text null,
  security_classification text not null default 'internal',
  created_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint agent_messages_sequence_unique unique (conversation_id, sequence),
  constraint agent_messages_phase_check check (
    phase in ('discover', 'request', 'negotiate', 'reason', 'delegate', 'collaborate', 'verify', 'report', 'archive')
  ),
  constraint agent_messages_approval_check check (
    approval_status in ('not_required', 'pending', 'approved', 'rejected')
  ),
  constraint agent_messages_approved_by_check check (approval_status <> 'approved' or approved_by is not null),
  constraint agent_messages_confidence_check check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint agent_messages_sender_check check (sender_agent_id is not null or sender_user_id is not null),
  constraint agent_messages_receiver_check check (receiver_agent_id is not null or receiver_user_id is not null),
  constraint agent_messages_purpose_check check (btrim(purpose) <> ''),
  constraint agent_messages_reasoning_check check (btrim(reasoning_artifact) <> '')
);

-- ---------------------------------------------------------------------------
-- 5. agent_meetings — XIV AI Meeting Rooms
-- ---------------------------------------------------------------------------

create table if not exists public.agent_meetings (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  task_force_id uuid null,
  title text not null,
  agenda jsonb not null default '[]'::jsonb,
  status text not null default 'scheduled',
  security_classification text not null default 'confidential',
  requires_human_decision boolean not null default true,
  decision text null,
  decision_by uuid null references auth.users (id) on delete set null,
  decided_at timestamptz null,
  unresolved_disagreements jsonb not null default '[]'::jsonb,
  summary text null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint agent_meetings_status_check check (
    status in ('scheduled', 'open', 'deliberating', 'awaiting_human', 'decided', 'archived')
  ),
  constraint agent_meetings_classification_check check (
    security_classification in ('public', 'internal', 'confidential', 'restricted')
  ),
  -- A meeting cannot claim a decision without an attributable human decider.
  constraint agent_meetings_decision_check check (
    status <> 'decided' or (decision is not null and decision_by is not null and decided_at is not null)
  )
);

-- ---------------------------------------------------------------------------
-- 6. agent_meeting_participants — agents and humans in the room
-- ---------------------------------------------------------------------------

create table if not exists public.agent_meeting_participants (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  meeting_id uuid not null references public.agent_meetings (id) on delete cascade,
  participant_kind text not null,
  agent_id uuid null references public.agent_registry (id) on delete cascade,
  user_id uuid null references auth.users (id) on delete cascade,
  participant_role text not null default 'contributor',
  vote text null,
  vote_rationale text null,
  joined_at timestamptz not null default now(),
  constraint agent_meeting_participants_kind_check check (participant_kind in ('agent', 'human')),
  constraint agent_meeting_participants_role_check check (
    participant_role in ('chair', 'contributor', 'observer', 'human_supervisor', 'human_executive')
  ),
  constraint agent_meeting_participants_vote_check check (
    vote is null or vote in ('recommend', 'object', 'abstain', 'insufficient_evidence')
  ),
  constraint agent_meeting_participants_identity_check check (
    (participant_kind = 'agent' and agent_id is not null and user_id is null)
    or (participant_kind = 'human' and user_id is not null and agent_id is null)
  )
);

-- Partial indexes rather than a composite unique constraint: agent_id and
-- user_id are each null for half the rows, and null is distinct in a unique key.
create unique index if not exists agent_meeting_participants_agent_unique
  on public.agent_meeting_participants (meeting_id, agent_id)
  where agent_id is not null;
create unique index if not exists agent_meeting_participants_user_unique
  on public.agent_meeting_participants (meeting_id, user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- 7. agent_task_forces — temporary specialist teams
-- ---------------------------------------------------------------------------

create table if not exists public.agent_task_forces (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  name text not null,
  purpose text not null,
  status text not null default 'forming',
  human_executive_id uuid not null references auth.users (id) on delete restrict,
  recommendation jsonb null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  dissolved_at timestamptz null,
  archived_at timestamptz null,
  constraint agent_task_forces_status_check check (
    status in ('forming', 'active', 'reporting', 'dissolved', 'archived')
  )
);

-- ---------------------------------------------------------------------------
-- 8. agent_tasks — the queue the scheduler and resource governor read
-- ---------------------------------------------------------------------------

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  task_force_id uuid null references public.agent_task_forces (id) on delete set null,
  assigned_agent_id uuid null references public.agent_registry (id) on delete set null,
  requested_by uuid not null references auth.users (id) on delete restrict,
  title text not null,
  description text not null,
  status text not null default 'queued',
  priority integer not null default 100,
  requires_human_approval boolean not null default true,
  approved_by uuid null references auth.users (id) on delete set null,
  approved_at timestamptz null,
  rollback_plan text null,
  rolled_back_at timestamptz null,
  cost_estimate_micro_usd bigint not null default 0,
  cost_actual_micro_usd bigint not null default 0,
  result jsonb null,
  queued_at timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null,
  archived_at timestamptz null,
  constraint agent_tasks_status_check check (
    status in ('queued', 'scheduled', 'awaiting_approval', 'active', 'blocked', 'completed', 'failed', 'cancelled', 'rolled_back', 'archived')
  ),
  constraint agent_tasks_priority_check check (priority between 1 and 1000),
  constraint agent_tasks_cost_check check (cost_estimate_micro_usd >= 0 and cost_actual_micro_usd >= 0),
  -- Anything that needs a human also needs a stated way back.
  constraint agent_tasks_rollback_plan_check check (
    requires_human_approval = false or coalesce(btrim(rollback_plan), '') <> ''
  ),
  -- An approval-gated task can never reach active without an attributable approver.
  constraint agent_tasks_approval_check check (
    requires_human_approval = false
    or status in ('queued', 'scheduled', 'awaiting_approval', 'blocked', 'cancelled')
    or (approved_by is not null and approved_at is not null)
  )
);

alter table public.agent_meetings
  drop constraint if exists agent_meetings_task_force_fk;
alter table public.agent_meetings
  add constraint agent_meetings_task_force_fk
  foreign key (task_force_id) references public.agent_task_forces (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 9. agent_knowledge_sources — curated historical and professional knowledge
-- ---------------------------------------------------------------------------
-- A historical belief is stored as a historical belief. It never becomes a
-- modern fact by storage alone: modern_relevance and contradictions stay separate
-- from the original claim, and claim_kind records what the row actually is.

create table if not exists public.agent_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  title text not null,
  claim_kind text not null,
  discipline text not null,
  era text not null default 'present',
  origin text not null,
  source_date text null,
  civilization_or_location text null,
  original_language text null,
  original_text text null,
  translation text null,
  interpretation text null,
  confidence numeric(4, 3) not null default 0.5,
  contradictions jsonb not null default '[]'::jsonb,
  modern_relevance text null,
  security_classification text not null default 'internal',
  storage_tier text not null default 'hot',
  retention_policy text not null default 'standard',
  recorded_by uuid null references auth.users (id) on delete set null,
  recorded_by_agent_id uuid null references public.agent_registry (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint agent_knowledge_sources_claim_kind_check check (
    claim_kind in ('human_fact', 'human_opinion', 'agent_inference', 'historical_evidence', 'external_source', 'prediction', 'unknown')
  ),
  constraint agent_knowledge_sources_era_check check (
    era in ('ancient', 'classical', 'medieval', 'industrial', 'modern', 'digital', 'present')
  ),
  constraint agent_knowledge_sources_tier_check check (
    storage_tier in ('hot', 'warm', 'cold', 'archival')
  ),
  constraint agent_knowledge_sources_confidence_check check (confidence >= 0 and confidence <= 1),
  -- Translation is not interpretation. If either exists the original must survive.
  constraint agent_knowledge_sources_translation_check check (
    (translation is null and interpretation is null) or coalesce(btrim(original_text), '') <> ''
  ),
  -- Historical evidence must never be filed as a present-day claim.
  constraint agent_knowledge_sources_history_check check (
    claim_kind <> 'historical_evidence' or era <> 'present'
  )
);

-- ---------------------------------------------------------------------------
-- 10. knowledge_lineage — information logistics
-- ---------------------------------------------------------------------------
-- Origin -> Acquisition -> Classification -> Storage -> Transformation ->
-- Reasoning -> Validation -> Distribution -> Decision -> Retention/Deletion.

create table if not exists public.knowledge_lineage (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  knowledge_source_id uuid not null references public.agent_knowledge_sources (id) on delete cascade,
  stage text not null,
  sequence integer not null,
  actor_kind text not null,
  actor_agent_id uuid null references public.agent_registry (id) on delete set null,
  actor_user_id uuid null references auth.users (id) on delete set null,
  model_id text null,
  detail text not null,
  related_task_id uuid null references public.agent_tasks (id) on delete set null,
  related_meeting_id uuid null references public.agent_meetings (id) on delete set null,
  related_message_id uuid null references public.agent_messages (id) on delete set null,
  recorded_at timestamptz not null default now(),
  constraint knowledge_lineage_stage_check check (
    stage in ('origin', 'acquisition', 'classification', 'storage', 'transformation', 'reasoning', 'validation', 'distribution', 'decision', 'retention', 'deletion')
  ),
  constraint knowledge_lineage_actor_kind_check check (actor_kind in ('human', 'agent', 'system')),
  constraint knowledge_lineage_actor_check check (
    (actor_kind = 'agent' and actor_agent_id is not null)
    or (actor_kind = 'human' and actor_user_id is not null)
    or actor_kind = 'system'
  ),
  constraint knowledge_lineage_sequence_unique unique (knowledge_source_id, sequence)
);

-- ---------------------------------------------------------------------------
-- 11. agent_evaluations — the gate an agent passes before it can be activated
-- ---------------------------------------------------------------------------

create table if not exists public.agent_evaluations (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  agent_id uuid not null references public.agent_registry (id) on delete cascade,
  evaluation_kind text not null,
  score numeric(4, 3) not null,
  passed boolean not null,
  gates_activation boolean not null default true,
  evaluator_kind text not null,
  evaluator_user_id uuid null references auth.users (id) on delete set null,
  notes text null,
  evaluated_at timestamptz not null default now(),
  constraint agent_evaluations_kind_check check (
    evaluation_kind in ('safety', 'accuracy', 'tool_discipline', 'tenancy_isolation', 'cost_discipline', 'human_escalation')
  ),
  constraint agent_evaluations_evaluator_check check (evaluator_kind in ('human', 'automated')),
  constraint agent_evaluations_score_check check (score >= 0 and score <= 1),
  constraint agent_evaluations_human_evaluator_check check (
    evaluator_kind <> 'human' or evaluator_user_id is not null
  )
);

-- ---------------------------------------------------------------------------
-- 12. agent_resource_budgets — quotas and cost telemetry
-- ---------------------------------------------------------------------------
-- agent_id null means the budget governs the whole universe.

create table if not exists public.agent_resource_budgets (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  agent_id uuid null references public.agent_registry (id) on delete cascade,
  period_start timestamptz not null default now(),
  period_end timestamptz null,
  max_registered_agents integer not null default 100,
  max_active_agents integer not null default 10,
  max_queued_tasks integer not null default 100,
  max_cost_micro_usd bigint not null default 1000000,
  consumed_cost_micro_usd bigint not null default 0,
  consumed_tasks integer not null default 0,
  hard_stop boolean not null default true,
  created_at timestamptz not null default now(),
  constraint agent_resource_budgets_limits_check check (
    max_registered_agents > 0
    and max_active_agents > 0
    and max_active_agents <= max_registered_agents
    and max_queued_tasks > 0
    and max_cost_micro_usd >= 0
  ),
  constraint agent_resource_budgets_consumed_check check (
    consumed_cost_micro_usd >= 0 and consumed_tasks >= 0
  )
);

-- One universe-wide budget, and at most one budget per agent.
create unique index if not exists agent_resource_budgets_universe_scope_unique
  on public.agent_resource_budgets (universe_id)
  where agent_id is null;
create unique index if not exists agent_resource_budgets_agent_scope_unique
  on public.agent_resource_budgets (universe_id, agent_id)
  where agent_id is not null;

-- ---------------------------------------------------------------------------
-- 13. runtime_nodes — the cross-device / beyond-cloud runtime catalog
-- ---------------------------------------------------------------------------
-- Satellite and orbital classes exist so the interface does not need redesigning
-- later. They are registered as unconfigured external providers and this story
-- authorizes no satellite command, contract, purchase or deployment.

create table if not exists public.runtime_nodes (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  node_key text not null,
  platform_class text not null,
  provider text not null default 'unspecified',
  region text null,
  status text not null default 'registered',
  is_external_unconfigured boolean not null default false,
  created_at timestamptz not null default now(),
  constraint runtime_nodes_key_unique unique (universe_id, node_key),
  constraint runtime_nodes_platform_check check (
    platform_class in (
      'ios', 'android', 'android_google_play', 'web',
      'cpu_intel', 'cpu_amd', 'gpu_nvidia', 'cloud_cpu', 'cloud_gpu',
      'edge', 'terrestrial_distributed', 'satellite_link', 'orbital_compute', 'deep_space'
    )
  ),
  constraint runtime_nodes_status_check check (
    status in ('registered', 'available', 'degraded', 'offline', 'unconfigured_external')
  ),
  -- Anything beyond terrestrial infrastructure stays unconfigured and unusable.
  constraint runtime_nodes_space_unconfigured_check check (
    platform_class not in ('satellite_link', 'orbital_compute', 'deep_space')
    or (is_external_unconfigured = true and status = 'unconfigured_external')
  )
);

-- ---------------------------------------------------------------------------
-- 14. runtime_capabilities — what a node offers, expressed as capabilities
-- ---------------------------------------------------------------------------
-- Applications request capabilities. They never name a chip vendor.

create table if not exists public.runtime_capabilities (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  node_id uuid not null references public.runtime_nodes (id) on delete cascade,
  capability_key text not null,
  capability_value jsonb not null default '{}'::jsonb,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  constraint runtime_capabilities_unique unique (node_id, capability_key)
);

-- ---------------------------------------------------------------------------
-- 15. agent_governance_events — append-only civilization audit ledger
-- ---------------------------------------------------------------------------

create table if not exists public.agent_governance_events (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  event_kind text not null,
  subject_agent_id uuid null references public.agent_registry (id) on delete set null,
  actor_user_id uuid null references auth.users (id) on delete set null,
  actor_agent_id uuid null references public.agent_registry (id) on delete set null,
  decision text null,
  detail jsonb not null default '{}'::jsonb,
  cost_micro_usd bigint not null default 0,
  created_at timestamptz not null default now(),
  constraint agent_governance_events_cost_check check (cost_micro_usd >= 0)
);

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------

-- Cross-universe leakage guard. Every child row must point at agents that live
-- in the same universe as the row itself.
--
-- The four enforcement triggers below are SECURITY DEFINER on purpose. A guard
-- that runs as the caller can only see what the caller can see, so a reference
-- to a row in another universe would read as "not found" and pass silently.
-- Enforcement has to see the whole table to be able to refuse.
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
    'recorded_by_agent_id', 'parent_agent_id'
  ];
  column_name text;
  referenced_agent uuid;
  referenced_universe uuid;
begin
  foreach column_name in array agent_columns loop
    referenced_agent := nullif(payload ->> column_name, '')::uuid;
    if referenced_agent is null then
      continue;
    end if;

    select a.universe_id into referenced_universe
    from public.agent_registry a
    where a.id = referenced_agent;

    if referenced_universe is not null and referenced_universe <> target_universe then
      raise exception 'xiv_cross_universe_reference_blocked'
        using errcode = 'check_violation';
    end if;
  end loop;

  return new;
end;
$$;

create or replace function public.xiv_assert_kill_switch_clear()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  universe_stopped boolean;
begin
  select u.kill_switch_engaged into universe_stopped
  from public.universe_lifecycle u
  where u.id = new.universe_id;

  if coalesce(universe_stopped, true) then
    raise exception 'xiv_kill_switch_engaged' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- Bounded agent creation. Registration fails when the universe has no budget or
-- when the budget is already spent. Recursive populations cannot outrun a quota.
create or replace function public.xiv_enforce_agent_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  registered_cap integer;
  active_cap integer;
  registered_count integer;
  active_count integer;
begin
  select b.max_registered_agents, b.max_active_agents
    into registered_cap, active_cap
  from public.agent_resource_budgets b
  where b.universe_id = new.universe_id and b.agent_id is null;

  if registered_cap is null then
    raise exception 'xiv_agent_budget_missing' using errcode = 'check_violation';
  end if;

  select count(*) into registered_count
  from public.agent_registry a
  where a.universe_id = new.universe_id
    and a.lifecycle_state not in ('archived', 'terminated')
    and a.id <> new.id;

  if tg_op = 'INSERT' and registered_count + 1 > registered_cap then
    raise exception 'xiv_agent_registration_quota_exceeded' using errcode = 'check_violation';
  end if;

  if new.lifecycle_state = 'active' then
    select count(*) into active_count
    from public.agent_registry a
    where a.universe_id = new.universe_id
      and a.lifecycle_state = 'active'
      and a.id <> new.id;

    if active_count + 1 > active_cap then
      raise exception 'xiv_agent_activation_quota_exceeded' using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

-- Evaluation gate. An agent only becomes active after a passing evaluation for
-- every gating evaluation kind it has been assessed on, and never with fewer
-- than the safety and tenancy_isolation gates on record.
create or replace function public.xiv_enforce_activation_gate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  failed_gates integer;
  required_gates integer;
begin
  if new.lifecycle_state <> 'active' then
    return new;
  end if;

  if new.kill_switch_engaged then
    raise exception 'xiv_agent_kill_switch_engaged' using errcode = 'check_violation';
  end if;

  select count(*) into failed_gates
  from public.agent_evaluations e
  where e.agent_id = new.id and e.gates_activation = true and e.passed = false;

  if failed_gates > 0 then
    raise exception 'xiv_agent_evaluation_gate_failed' using errcode = 'check_violation';
  end if;

  select count(distinct e.evaluation_kind) into required_gates
  from public.agent_evaluations e
  where e.agent_id = new.id
    and e.gates_activation = true
    and e.passed = true
    and e.evaluation_kind in ('safety', 'tenancy_isolation');

  if required_gates < 2 then
    raise exception 'xiv_agent_evaluation_gate_missing' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists agent_registry_same_universe on public.agent_registry;
create trigger agent_registry_same_universe
  before insert or update on public.agent_registry
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_registry_quota on public.agent_registry;
create trigger agent_registry_quota
  before insert or update on public.agent_registry
  for each row execute function public.xiv_enforce_agent_quota();

drop trigger if exists agent_registry_activation_gate on public.agent_registry;
create trigger agent_registry_activation_gate
  before insert or update on public.agent_registry
  for each row execute function public.xiv_enforce_activation_gate();

drop trigger if exists agent_capabilities_same_universe on public.agent_capabilities;
create trigger agent_capabilities_same_universe
  before insert or update on public.agent_capabilities
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_relationships_same_universe on public.agent_relationships;
create trigger agent_relationships_same_universe
  before insert or update on public.agent_relationships
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_messages_same_universe on public.agent_messages;
create trigger agent_messages_same_universe
  before insert or update on public.agent_messages
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_messages_kill_switch on public.agent_messages;
create trigger agent_messages_kill_switch
  before insert on public.agent_messages
  for each row execute function public.xiv_assert_kill_switch_clear();

drop trigger if exists agent_tasks_same_universe on public.agent_tasks;
create trigger agent_tasks_same_universe
  before insert or update on public.agent_tasks
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_tasks_kill_switch on public.agent_tasks;
create trigger agent_tasks_kill_switch
  before insert on public.agent_tasks
  for each row execute function public.xiv_assert_kill_switch_clear();

drop trigger if exists agent_meeting_participants_same_universe on public.agent_meeting_participants;
create trigger agent_meeting_participants_same_universe
  before insert or update on public.agent_meeting_participants
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_knowledge_sources_same_universe on public.agent_knowledge_sources;
create trigger agent_knowledge_sources_same_universe
  before insert or update on public.agent_knowledge_sources
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists knowledge_lineage_same_universe on public.knowledge_lineage;
create trigger knowledge_lineage_same_universe
  before insert or update on public.knowledge_lineage
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_evaluations_same_universe on public.agent_evaluations;
create trigger agent_evaluations_same_universe
  before insert or update on public.agent_evaluations
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_resource_budgets_same_universe on public.agent_resource_budgets;
create trigger agent_resource_budgets_same_universe
  before insert or update on public.agent_resource_budgets
  for each row execute function public.xiv_assert_same_universe();

drop trigger if exists agent_governance_events_same_universe on public.agent_governance_events;
create trigger agent_governance_events_same_universe
  before insert or update on public.agent_governance_events
  for each row execute function public.xiv_assert_same_universe();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists universe_memberships_user_idx
  on public.universe_memberships (user_id, universe_id);
create index if not exists agent_registry_universe_idx
  on public.agent_registry (universe_id, lifecycle_state);
create index if not exists agent_registry_supervisor_idx
  on public.agent_registry (human_supervisor_id);
create index if not exists agent_capabilities_agent_idx
  on public.agent_capabilities (agent_id, capability_kind);
create index if not exists agent_relationships_from_idx
  on public.agent_relationships (from_agent_id, relationship_type);
create index if not exists agent_messages_conversation_idx
  on public.agent_messages (conversation_id, sequence);
create index if not exists agent_messages_universe_idx
  on public.agent_messages (universe_id, created_at desc);
create index if not exists agent_meetings_universe_idx
  on public.agent_meetings (universe_id, status, created_at desc);
create index if not exists agent_meeting_participants_meeting_idx
  on public.agent_meeting_participants (meeting_id);
create index if not exists agent_tasks_queue_idx
  on public.agent_tasks (universe_id, status, priority, queued_at);
create index if not exists agent_task_forces_universe_idx
  on public.agent_task_forces (universe_id, status);
create index if not exists agent_knowledge_sources_universe_idx
  on public.agent_knowledge_sources (universe_id, discipline, era);
create index if not exists knowledge_lineage_source_idx
  on public.knowledge_lineage (knowledge_source_id, sequence);
create index if not exists agent_evaluations_agent_idx
  on public.agent_evaluations (agent_id, evaluated_at desc);
create index if not exists agent_resource_budgets_universe_idx
  on public.agent_resource_budgets (universe_id);
create index if not exists runtime_nodes_universe_idx
  on public.runtime_nodes (universe_id, platform_class, status);
create index if not exists runtime_capabilities_node_idx
  on public.runtime_capabilities (node_id, capability_key);
create index if not exists agent_governance_events_universe_idx
  on public.agent_governance_events (universe_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.universe_lifecycle enable row level security;
alter table public.universe_memberships enable row level security;
alter table public.agent_registry enable row level security;
alter table public.agent_capabilities enable row level security;
alter table public.agent_relationships enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_meetings enable row level security;
alter table public.agent_meeting_participants enable row level security;
alter table public.agent_task_forces enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_knowledge_sources enable row level security;
alter table public.knowledge_lineage enable row level security;
alter table public.agent_evaluations enable row level security;
alter table public.agent_resource_budgets enable row level security;
alter table public.runtime_nodes enable row level security;
alter table public.runtime_capabilities enable row level security;
alter table public.agent_governance_events enable row level security;

alter table public.universe_lifecycle force row level security;
alter table public.universe_memberships force row level security;
alter table public.agent_registry force row level security;
alter table public.agent_capabilities force row level security;
alter table public.agent_relationships force row level security;
alter table public.agent_messages force row level security;
alter table public.agent_meetings force row level security;
alter table public.agent_meeting_participants force row level security;
alter table public.agent_task_forces force row level security;
alter table public.agent_tasks force row level security;
alter table public.agent_knowledge_sources force row level security;
alter table public.knowledge_lineage force row level security;
alter table public.agent_evaluations force row level security;
alter table public.agent_resource_budgets force row level security;
alter table public.runtime_nodes force row level security;
alter table public.runtime_capabilities force row level security;
alter table public.agent_governance_events force row level security;

revoke all on table public.universe_lifecycle from public, anon;
revoke all on table public.universe_memberships from public, anon;
revoke all on table public.agent_registry from public, anon;
revoke all on table public.agent_capabilities from public, anon;
revoke all on table public.agent_relationships from public, anon;
revoke all on table public.agent_messages from public, anon;
revoke all on table public.agent_meetings from public, anon;
revoke all on table public.agent_meeting_participants from public, anon;
revoke all on table public.agent_task_forces from public, anon;
revoke all on table public.agent_tasks from public, anon;
revoke all on table public.agent_knowledge_sources from public, anon;
revoke all on table public.knowledge_lineage from public, anon;
revoke all on table public.agent_evaluations from public, anon;
revoke all on table public.agent_resource_budgets from public, anon;
revoke all on table public.runtime_nodes from public, anon;
revoke all on table public.runtime_capabilities from public, anon;
revoke all on table public.agent_governance_events from public, anon;

revoke all on function public.xiv_is_universe_member(uuid) from public, anon;
revoke all on function public.xiv_is_universe_supervisor(uuid) from public, anon;
grant execute on function public.xiv_is_universe_member(uuid) to authenticated;
grant execute on function public.xiv_is_universe_supervisor(uuid) to authenticated;

grant select, insert, update on table public.universe_lifecycle to authenticated;
grant select, insert, update on table public.universe_memberships to authenticated;
grant select, insert, update on table public.agent_registry to authenticated;
grant select, insert, update on table public.agent_capabilities to authenticated;
grant select, insert, update on table public.agent_relationships to authenticated;
grant select, insert on table public.agent_messages to authenticated;
grant select, insert, update on table public.agent_meetings to authenticated;
grant select, insert, update on table public.agent_meeting_participants to authenticated;
grant select, insert, update on table public.agent_task_forces to authenticated;
grant select, insert, update on table public.agent_tasks to authenticated;
grant select, insert on table public.agent_knowledge_sources to authenticated;
grant select, insert on table public.knowledge_lineage to authenticated;
grant select, insert on table public.agent_evaluations to authenticated;
grant select, insert, update on table public.agent_resource_budgets to authenticated;
grant select, insert, update on table public.runtime_nodes to authenticated;
grant select, insert, update on table public.runtime_capabilities to authenticated;
grant select, insert on table public.agent_governance_events to authenticated;

drop policy if exists universe_lifecycle_select_member on public.universe_lifecycle;
drop policy if exists universe_lifecycle_insert_creator on public.universe_lifecycle;
drop policy if exists universe_lifecycle_update_supervisor on public.universe_lifecycle;
drop policy if exists universe_memberships_select_own on public.universe_memberships;
drop policy if exists universe_memberships_insert_bootstrap on public.universe_memberships;
drop policy if exists universe_memberships_update_supervisor on public.universe_memberships;
drop policy if exists agent_registry_select_member on public.agent_registry;
drop policy if exists agent_registry_insert_supervisor on public.agent_registry;
drop policy if exists agent_registry_update_supervisor on public.agent_registry;
drop policy if exists agent_capabilities_select_member on public.agent_capabilities;
drop policy if exists agent_capabilities_insert_supervisor on public.agent_capabilities;
drop policy if exists agent_capabilities_update_supervisor on public.agent_capabilities;
drop policy if exists agent_relationships_select_member on public.agent_relationships;
drop policy if exists agent_relationships_insert_supervisor on public.agent_relationships;
drop policy if exists agent_relationships_update_supervisor on public.agent_relationships;
drop policy if exists agent_messages_select_member on public.agent_messages;
drop policy if exists agent_messages_insert_member on public.agent_messages;
drop policy if exists agent_meetings_select_member on public.agent_meetings;
drop policy if exists agent_meetings_insert_member on public.agent_meetings;
drop policy if exists agent_meetings_update_member on public.agent_meetings;
drop policy if exists agent_meeting_participants_select_member on public.agent_meeting_participants;
drop policy if exists agent_meeting_participants_insert_member on public.agent_meeting_participants;
drop policy if exists agent_meeting_participants_update_member on public.agent_meeting_participants;
drop policy if exists agent_task_forces_select_member on public.agent_task_forces;
drop policy if exists agent_task_forces_insert_member on public.agent_task_forces;
drop policy if exists agent_task_forces_update_member on public.agent_task_forces;
drop policy if exists agent_tasks_select_member on public.agent_tasks;
drop policy if exists agent_tasks_insert_member on public.agent_tasks;
drop policy if exists agent_tasks_update_member on public.agent_tasks;
drop policy if exists agent_knowledge_sources_select_member on public.agent_knowledge_sources;
drop policy if exists agent_knowledge_sources_insert_member on public.agent_knowledge_sources;
drop policy if exists knowledge_lineage_select_member on public.knowledge_lineage;
drop policy if exists knowledge_lineage_insert_member on public.knowledge_lineage;
drop policy if exists agent_evaluations_select_member on public.agent_evaluations;
drop policy if exists agent_evaluations_insert_supervisor on public.agent_evaluations;
drop policy if exists agent_resource_budgets_select_member on public.agent_resource_budgets;
drop policy if exists agent_resource_budgets_insert_supervisor on public.agent_resource_budgets;
drop policy if exists agent_resource_budgets_update_supervisor on public.agent_resource_budgets;
drop policy if exists runtime_nodes_select_member on public.runtime_nodes;
drop policy if exists runtime_nodes_insert_supervisor on public.runtime_nodes;
drop policy if exists runtime_nodes_update_supervisor on public.runtime_nodes;
drop policy if exists runtime_capabilities_select_member on public.runtime_capabilities;
drop policy if exists runtime_capabilities_insert_supervisor on public.runtime_capabilities;
drop policy if exists runtime_capabilities_update_supervisor on public.runtime_capabilities;
drop policy if exists agent_governance_events_select_member on public.agent_governance_events;
drop policy if exists agent_governance_events_insert_member on public.agent_governance_events;

create policy universe_lifecycle_select_member
  on public.universe_lifecycle
  for select
  to authenticated
  using (created_by = auth.uid() or public.xiv_is_universe_member(id));

create policy universe_lifecycle_insert_creator
  on public.universe_lifecycle
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy universe_lifecycle_update_supervisor
  on public.universe_lifecycle
  for update
  to authenticated
  using (created_by = auth.uid() or public.xiv_is_universe_supervisor(id))
  with check (created_by = auth.uid() or public.xiv_is_universe_supervisor(id));

-- Self-contained on purpose. Calling a helper here would make every other
-- policy in this file recursive.
create policy universe_memberships_select_own
  on public.universe_memberships
  for select
  to authenticated
  using (user_id = auth.uid());

create policy universe_memberships_insert_bootstrap
  on public.universe_memberships
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.universe_lifecycle u
      where u.id = universe_id and u.created_by = auth.uid()
    )
  );

create policy universe_memberships_update_supervisor
  on public.universe_memberships
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.universe_lifecycle u
      where u.id = universe_id and u.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.universe_lifecycle u
      where u.id = universe_id and u.created_by = auth.uid()
    )
  );

create policy agent_registry_select_member
  on public.agent_registry
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_registry_insert_supervisor
  on public.agent_registry
  for insert
  to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id) and created_by = auth.uid());

create policy agent_registry_update_supervisor
  on public.agent_registry
  for update
  to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_capabilities_select_member
  on public.agent_capabilities
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_capabilities_insert_supervisor
  on public.agent_capabilities
  for insert
  to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_capabilities_update_supervisor
  on public.agent_capabilities
  for update
  to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_relationships_select_member
  on public.agent_relationships
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_relationships_insert_supervisor
  on public.agent_relationships
  for insert
  to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_relationships_update_supervisor
  on public.agent_relationships
  for update
  to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_messages_select_member
  on public.agent_messages
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_messages_insert_member
  on public.agent_messages
  for insert
  to authenticated
  with check (public.xiv_is_universe_member(universe_id));

create policy agent_meetings_select_member
  on public.agent_meetings
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_meetings_insert_member
  on public.agent_meetings
  for insert
  to authenticated
  with check (public.xiv_is_universe_member(universe_id) and created_by = auth.uid());

create policy agent_meetings_update_member
  on public.agent_meetings
  for update
  to authenticated
  using (public.xiv_is_universe_member(universe_id))
  with check (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_participants_select_member
  on public.agent_meeting_participants
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_participants_insert_member
  on public.agent_meeting_participants
  for insert
  to authenticated
  with check (public.xiv_is_universe_member(universe_id));

create policy agent_meeting_participants_update_member
  on public.agent_meeting_participants
  for update
  to authenticated
  using (public.xiv_is_universe_member(universe_id))
  with check (public.xiv_is_universe_member(universe_id));

create policy agent_task_forces_select_member
  on public.agent_task_forces
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_task_forces_insert_member
  on public.agent_task_forces
  for insert
  to authenticated
  with check (public.xiv_is_universe_member(universe_id) and created_by = auth.uid());

create policy agent_task_forces_update_member
  on public.agent_task_forces
  for update
  to authenticated
  using (public.xiv_is_universe_member(universe_id))
  with check (public.xiv_is_universe_member(universe_id));

create policy agent_tasks_select_member
  on public.agent_tasks
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_tasks_insert_member
  on public.agent_tasks
  for insert
  to authenticated
  with check (public.xiv_is_universe_member(universe_id) and requested_by = auth.uid());

create policy agent_tasks_update_member
  on public.agent_tasks
  for update
  to authenticated
  using (public.xiv_is_universe_member(universe_id))
  with check (public.xiv_is_universe_member(universe_id));

create policy agent_knowledge_sources_select_member
  on public.agent_knowledge_sources
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_knowledge_sources_insert_member
  on public.agent_knowledge_sources
  for insert
  to authenticated
  with check (public.xiv_is_universe_member(universe_id));

create policy knowledge_lineage_select_member
  on public.knowledge_lineage
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy knowledge_lineage_insert_member
  on public.knowledge_lineage
  for insert
  to authenticated
  with check (public.xiv_is_universe_member(universe_id));

create policy agent_evaluations_select_member
  on public.agent_evaluations
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_evaluations_insert_supervisor
  on public.agent_evaluations
  for insert
  to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_resource_budgets_select_member
  on public.agent_resource_budgets
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_resource_budgets_insert_supervisor
  on public.agent_resource_budgets
  for insert
  to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_resource_budgets_update_supervisor
  on public.agent_resource_budgets
  for update
  to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy runtime_nodes_select_member
  on public.runtime_nodes
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy runtime_nodes_insert_supervisor
  on public.runtime_nodes
  for insert
  to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy runtime_nodes_update_supervisor
  on public.runtime_nodes
  for update
  to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy runtime_capabilities_select_member
  on public.runtime_capabilities
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy runtime_capabilities_insert_supervisor
  on public.runtime_capabilities
  for insert
  to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy runtime_capabilities_update_supervisor
  on public.runtime_capabilities
  for update
  to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy agent_governance_events_select_member
  on public.agent_governance_events
  for select
  to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy agent_governance_events_insert_member
  on public.agent_governance_events
  for insert
  to authenticated
  with check (public.xiv_is_universe_member(universe_id));

notify pgrst, 'reload schema';
