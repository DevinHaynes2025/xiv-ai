-- 2I-AI-62A — cross-tenant negative tests for the agent civilization slice.
--
-- Run this in the hosted Supabase SQL editor (or psql as the postgres role)
-- AFTER applying supabase/migrations/20260908120000_agent_civilization_foundation.sql.
--
-- The whole script runs inside one transaction and ends with ROLLBACK, so it
-- leaves no rows behind. It fails loudly: the first violated expectation raises
-- and aborts. Success prints a single notice at the end.
--
-- What it proves:
--   organization isolation, universe isolation, agent identity isolation,
--   RLS enforcement on every slice table, supervisor-only governance writes,
--   the anon role having no reach at all, agent registration quotas,
--   the evaluation activation gate, the deterministic kill switch,
--   bounded agent creation, and refusal of cross-universe references.

begin;

set local role postgres;

create or replace function pg_temp.xiv_expect_rows(query text, expected bigint, label text)
returns void
language plpgsql
as $$
declare
  actual bigint;
begin
  execute format('select count(*) from (%s) as counted', query) into actual;
  if actual <> expected then
    raise exception 'XIV RLS TEST FAILED: % (expected % rows, saw %)', label, expected, actual;
  end if;
end;
$$;

-- A refusal has two legitimate shapes. A write that violates a policy WITH CHECK,
-- a constraint or a trigger raises. A write that simply cannot see the target row
-- affects nothing and returns quietly. Both mean the caller changed no data, and
-- the second is what RLS does to a cross-tenant UPDATE or DELETE.
create or replace function pg_temp.xiv_expect_blocked(statement text, label text)
returns void
language plpgsql
as $$
declare
  affected bigint;
begin
  begin
    execute statement;
    get diagnostics affected = row_count;
  exception
    when insufficient_privilege or check_violation or raise_exception then
      return;
  end;

  if affected = 0 then
    return;
  end if;

  raise exception 'XIV RLS TEST FAILED: % changed % row(s) but must be blocked', label, affected;
end;
$$;

create or replace function pg_temp.xiv_act_as(actor uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', actor, 'role', 'authenticated')::text, true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixtures. Two organizations, two universes, four humans.
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'supervisor.a@xiv.test', '', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member.a@xiv.test', '', now(), now(), now()),
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'supervisor.b@xiv.test', '', now(), now(), now()),
  ('44444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider@xiv.test', '', now(), now(), now())
on conflict (id) do nothing;

insert into public.universe_lifecycle (id, organization_id, name, created_by, lifecycle_stage)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a', 'Universe A', '11111111-1111-4111-8111-111111111111', 'operational'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-00000000000b', 'Universe B', '33333333-3333-4333-8333-333333333333', 'operational');

insert into public.universe_memberships (universe_id, organization_id, user_id, membership_role, is_supervisor)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'supervisor', true),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a', '22222222-2222-4222-8222-222222222222', 'participant', false),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-00000000000b', '33333333-3333-4333-8333-333333333333', 'supervisor', true);

insert into public.agent_resource_budgets (universe_id, agent_id, max_registered_agents, max_active_agents, max_queued_tasks, max_cost_micro_usd)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', null, 2, 1, 10, 500000),
  ('bbbbbbbb-0000-4000-8000-000000000002', null, 5, 2, 10, 500000);

insert into public.agent_registry (
  id, universe_id, organization_id, agent_key, display_name, profession,
  model_runtime, human_supervisor_id, created_by, lifecycle_state
)
values
  ('a9e00000-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a',
   'coordinator', 'Universe A Coordinator', 'coordination', 'gemini-flash',
   '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'registered'),
  ('a9e00000-0000-4000-8000-00000000000c', 'aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a',
   'logistics', 'Universe A Logistics', 'logistics', 'gemini-flash',
   '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'registered'),
  ('b9e00000-0000-4000-8000-00000000000b', 'bbbbbbbb-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-00000000000b',
   'coordinator', 'Universe B Coordinator', 'coordination', 'gemini-flash',
   '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'registered');

insert into public.agent_capabilities (universe_id, agent_id, capability_kind, capability_key, risk_level, requires_approval, approved, granted_by)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'a9e00000-0000-4000-8000-00000000000a', 'tool',
        'summarize_business_health', 'low', false, true, '11111111-1111-4111-8111-111111111111');

insert into public.agent_relationships (universe_id, from_agent_id, to_agent_id, relationship_type, authorized, authorized_by)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'a9e00000-0000-4000-8000-00000000000a',
        'a9e00000-0000-4000-8000-00000000000c', 'coordinates', true, '11111111-1111-4111-8111-111111111111');

insert into public.agent_task_forces (id, universe_id, name, purpose, human_executive_id, created_by, status)
values ('a6600000-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000001',
        'Universe A crisis task force', 'Respond to a port closure',
        '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'active');

insert into public.agent_meetings (id, universe_id, task_force_id, title, created_by, status)
values ('a1100000-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000001',
        'a6600000-0000-4000-8000-00000000000a', 'Universe A private meeting',
        '11111111-1111-4111-8111-111111111111', 'open');

insert into public.agent_meeting_participants (universe_id, meeting_id, participant_kind, agent_id, participant_role)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-00000000000a', 'agent',
        'a9e00000-0000-4000-8000-00000000000a', 'chair');

insert into public.agent_meeting_participants (universe_id, meeting_id, participant_kind, user_id, participant_role)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-00000000000a', 'human',
        '11111111-1111-4111-8111-111111111111', 'human_executive');

insert into public.agent_messages (universe_id, conversation_id, sequence, phase, sender_agent_id, receiver_user_id, purpose, reasoning_artifact)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'a2200000-0000-4000-8000-00000000000a', 1, 'report',
        'a9e00000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111',
        'Universe A situation report', 'Reasoning artifact for universe A only');

insert into public.agent_knowledge_sources (id, universe_id, title, claim_kind, discipline, era, origin)
values ('a3300000-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000001',
        'Universe A supplier ledger', 'human_fact', 'supply_chain', 'present', 'operations team');

insert into public.knowledge_lineage (universe_id, knowledge_source_id, stage, sequence, actor_kind, actor_user_id, detail)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'a3300000-0000-4000-8000-00000000000a', 'origin', 1, 'human',
        '11111111-1111-4111-8111-111111111111', 'Recorded by the universe A operations team');

insert into public.runtime_nodes (id, universe_id, node_key, platform_class, provider, status)
values ('a4400000-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000001', 'edge-01', 'edge', 'on_premise', 'available');

insert into public.runtime_capabilities (universe_id, node_id, capability_key)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'a4400000-0000-4000-8000-00000000000a', 'compute.cpu.general');

insert into public.agent_evaluations (universe_id, agent_id, evaluation_kind, score, passed, evaluator_kind, evaluator_user_id)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'a9e00000-0000-4000-8000-00000000000a', 'safety', 0.910, true, 'human', '11111111-1111-4111-8111-111111111111');

insert into public.agent_governance_events (universe_id, event_kind, subject_agent_id, actor_user_id, detail)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'agent_registered', 'a9e00000-0000-4000-8000-00000000000a',
        '11111111-1111-4111-8111-111111111111', '{"slice":"2I-AI-62A"}'::jsonb);

-- ---------------------------------------------------------------------------
-- The anon role reaches nothing.
-- ---------------------------------------------------------------------------

-- Even holding a valid member's JWT claims, the anon database role has no grant.
select pg_temp.xiv_act_as('11111111-1111-4111-8111-111111111111');

set local role anon;

do $$
begin
  perform pg_temp.xiv_expect_blocked(
    'select * from public.agent_registry',
    'anon select on agent_registry'
  );
  perform pg_temp.xiv_expect_blocked(
    'select * from public.agent_messages',
    'anon select on agent_messages'
  );
  perform pg_temp.xiv_expect_blocked(
    'select * from public.universe_lifecycle',
    'anon select on universe_lifecycle'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Universe A supervisor sees universe A and nothing else.
-- ---------------------------------------------------------------------------

set local role authenticated;

do $$
begin
  perform pg_temp.xiv_act_as('11111111-1111-4111-8111-111111111111');

  perform pg_temp.xiv_expect_rows('select 1 from public.universe_lifecycle', 1, 'supervisor A sees exactly one universe');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_registry', 2, 'supervisor A sees only universe A agents');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_capabilities', 1, 'supervisor A sees only universe A capabilities');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_relationships', 1, 'supervisor A sees only universe A relationships');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_messages', 1, 'supervisor A sees only universe A messages');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_meetings', 1, 'supervisor A sees only universe A meetings');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_meeting_participants', 2, 'supervisor A sees both participants');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_task_forces', 1, 'supervisor A sees only universe A task forces');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_knowledge_sources', 1, 'supervisor A sees only universe A knowledge');
  perform pg_temp.xiv_expect_rows('select 1 from public.knowledge_lineage', 1, 'supervisor A sees only universe A lineage');
  perform pg_temp.xiv_expect_rows('select 1 from public.runtime_nodes', 1, 'supervisor A sees only universe A runtime nodes');
  perform pg_temp.xiv_expect_rows('select 1 from public.runtime_capabilities', 1, 'supervisor A sees only universe A runtime capabilities');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_evaluations', 1, 'supervisor A sees only universe A evaluations');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_resource_budgets', 1, 'supervisor A sees only universe A budgets');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_governance_events', 1, 'supervisor A sees only universe A audit events');
end;
$$;

-- ---------------------------------------------------------------------------
-- Universe B supervisor sees zero of universe A. This is the isolation proof.
-- ---------------------------------------------------------------------------

do $$
begin
  perform pg_temp.xiv_act_as('33333333-3333-4333-8333-333333333333');

  perform pg_temp.xiv_expect_rows(
    'select 1 from public.agent_registry where universe_id = ''aaaaaaaa-0000-4000-8000-000000000001''',
    0, 'universe B cannot see universe A agents');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_messages', 0, 'universe B cannot see universe A messages');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_meetings', 0, 'universe B cannot see universe A meetings');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_meeting_participants', 0, 'universe B cannot see who was in the room');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_task_forces', 0, 'universe B cannot see universe A task forces');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_capabilities', 0, 'universe B cannot see universe A capabilities');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_relationships', 0, 'universe B cannot see universe A relationships');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_tasks', 0, 'universe B cannot see universe A tasks');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_knowledge_sources', 0, 'universe B cannot see universe A knowledge');
  perform pg_temp.xiv_expect_rows('select 1 from public.knowledge_lineage', 0, 'universe B cannot see universe A lineage');
  perform pg_temp.xiv_expect_rows('select 1 from public.runtime_nodes', 0, 'universe B cannot see universe A runtime nodes');
  perform pg_temp.xiv_expect_rows('select 1 from public.runtime_capabilities', 0, 'universe B cannot see universe A runtime capabilities');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_evaluations', 0, 'universe B cannot see universe A evaluations');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_governance_events', 0, 'universe B cannot see universe A audit events');
  perform pg_temp.xiv_expect_rows(
    'select 1 from public.universe_lifecycle where id = ''aaaaaaaa-0000-4000-8000-000000000001''',
    0, 'universe B cannot see universe A itself');
  perform pg_temp.xiv_expect_rows(
    'select 1 from public.universe_memberships where universe_id = ''aaaaaaaa-0000-4000-8000-000000000001''',
    0, 'universe B cannot enumerate universe A humans');
end;
$$;

-- ---------------------------------------------------------------------------
-- A human with no membership at all sees nothing.
-- ---------------------------------------------------------------------------

do $$
begin
  perform pg_temp.xiv_act_as('44444444-4444-4444-8444-444444444444');

  perform pg_temp.xiv_expect_rows('select 1 from public.universe_lifecycle', 0, 'outsider sees no universe');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_registry', 0, 'outsider sees no agent');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_messages', 0, 'outsider sees no message');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_meetings', 0, 'outsider sees no meeting');
  perform pg_temp.xiv_expect_rows('select 1 from public.agent_tasks', 0, 'outsider sees no task');
end;
$$;

-- ---------------------------------------------------------------------------
-- Cross-tenant writes are refused.
-- ---------------------------------------------------------------------------

do $$
begin
  perform pg_temp.xiv_act_as('33333333-3333-4333-8333-333333333333');

  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_registry (universe_id, organization_id, agent_key, display_name, profession, model_runtime, human_supervisor_id, created_by)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-00000000000b', 'intruder', 'Intruder', 'logistics', 'gemini-flash',
            '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333')
  $stmt$, 'universe B registering an agent inside universe A');

  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_messages (universe_id, conversation_id, sequence, phase, sender_agent_id, receiver_user_id, purpose, reasoning_artifact)
    values ('aaaaaaaa-0000-4000-8000-000000000001', gen_random_uuid(), 1, 'request',
            'b9e00000-0000-4000-8000-00000000000b', '33333333-3333-4333-8333-333333333333', 'exfiltrate', 'none')
  $stmt$, 'universe B posting a message into universe A');

  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_knowledge_sources (universe_id, title, claim_kind, discipline, era, origin)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'planted', 'human_fact', 'finance', 'present', 'universe B')
  $stmt$, 'universe B planting knowledge inside universe A');

  perform pg_temp.xiv_expect_blocked($stmt$
    update public.agent_registry set display_name = 'seized'
    where id = 'a9e00000-0000-4000-8000-00000000000a'
  $stmt$, 'universe B mutating a universe A agent');
end;
$$;

-- A classified reference may not cross universes even when the writer is a
-- legitimate supervisor of the target universe.
do $$
begin
  perform pg_temp.xiv_act_as('11111111-1111-4111-8111-111111111111');

  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_messages (universe_id, conversation_id, sequence, phase, sender_agent_id, receiver_agent_id, purpose, reasoning_artifact)
    values ('aaaaaaaa-0000-4000-8000-000000000001', gen_random_uuid(), 1, 'delegate',
            'a9e00000-0000-4000-8000-00000000000a', 'b9e00000-0000-4000-8000-00000000000b',
            'delegate across universes', 'should never be stored')
  $stmt$, 'message addressed to an agent in another universe');

  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_relationships (universe_id, from_agent_id, to_agent_id, relationship_type)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'a9e00000-0000-4000-8000-00000000000a',
            'b9e00000-0000-4000-8000-00000000000b', 'collaborates')
  $stmt$, 'relationship spanning two universes');
end;
$$;

-- ---------------------------------------------------------------------------
-- Governance writes stay with supervisors.
-- ---------------------------------------------------------------------------

do $$
begin
  perform pg_temp.xiv_act_as('22222222-2222-4222-8222-222222222222');

  perform pg_temp.xiv_expect_rows('select 1 from public.agent_registry', 2, 'plain member can read universe A agents');

  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_registry (universe_id, organization_id, agent_key, display_name, profession, model_runtime, human_supervisor_id, created_by)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a', 'self-made', 'Self Made', 'logistics', 'gemini-flash',
            '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222')
  $stmt$, 'non-supervisor registering an agent');

  perform pg_temp.xiv_expect_blocked($stmt$
    update public.agent_resource_budgets set max_registered_agents = 100000
    where universe_id = 'aaaaaaaa-0000-4000-8000-000000000001'
  $stmt$, 'non-supervisor raising its own quota');

  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_evaluations (universe_id, agent_id, evaluation_kind, score, passed, evaluator_kind, evaluator_user_id)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'a9e00000-0000-4000-8000-00000000000a', 'safety', 1.0, true, 'human',
            '22222222-2222-4222-8222-222222222222')
  $stmt$, 'non-supervisor writing its own passing evaluation');
end;
$$;

-- ---------------------------------------------------------------------------
-- Bounded agent creation, evaluation gate, kill switch.
-- ---------------------------------------------------------------------------

do $$
begin
  perform pg_temp.xiv_act_as('11111111-1111-4111-8111-111111111111');

  -- Universe A budget allows two registered agents and two already exist, so a
  -- third is refused. A recursive population cannot outrun a quota.
  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_registry (universe_id, organization_id, agent_key, display_name, profession, model_runtime, human_supervisor_id, created_by)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a', 'overflow', 'Overflow Agent', 'finance', 'gemini-flash',
            '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111')
  $stmt$, 'agent registration beyond the universe quota');

  -- Activation without the required passing gates is refused. The coordinator
  -- has a safety pass but no tenancy_isolation pass yet.
  perform pg_temp.xiv_expect_blocked($stmt$
    update public.agent_registry set lifecycle_state = 'active'
    where id = 'a9e00000-0000-4000-8000-00000000000a'
  $stmt$, 'activation without a complete evaluation gate');

  insert into public.agent_evaluations (universe_id, agent_id, evaluation_kind, score, passed, evaluator_kind, evaluator_user_id)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'a9e00000-0000-4000-8000-00000000000a', 'tenancy_isolation', 0.990, true, 'human',
          '11111111-1111-4111-8111-111111111111');

  update public.agent_registry set lifecycle_state = 'active', activated_at = now()
  where id = 'a9e00000-0000-4000-8000-00000000000a';

  perform pg_temp.xiv_expect_rows(
    'select 1 from public.agent_registry where lifecycle_state = ''active''',
    1, 'exactly one active agent after passing the gate');

  -- max_active_agents is one, so a second activation is refused even though the
  -- second agent could otherwise pass.
  insert into public.agent_evaluations (universe_id, agent_id, evaluation_kind, score, passed, evaluator_kind, evaluator_user_id)
  values
    ('aaaaaaaa-0000-4000-8000-000000000001', 'a9e00000-0000-4000-8000-00000000000c', 'safety', 0.950, true, 'human', '11111111-1111-4111-8111-111111111111'),
    ('aaaaaaaa-0000-4000-8000-000000000001', 'a9e00000-0000-4000-8000-00000000000c', 'tenancy_isolation', 0.950, true, 'human', '11111111-1111-4111-8111-111111111111');

  perform pg_temp.xiv_expect_blocked($stmt$
    update public.agent_registry set lifecycle_state = 'active'
    where id = 'a9e00000-0000-4000-8000-00000000000c'
  $stmt$, 'activation beyond the concurrent active-agent quota');

  -- A failing gate blocks activation outright.
  insert into public.agent_evaluations (universe_id, agent_id, evaluation_kind, score, passed, evaluator_kind, evaluator_user_id)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'a9e00000-0000-4000-8000-00000000000c', 'tool_discipline', 0.100, false, 'human',
          '11111111-1111-4111-8111-111111111111');

  perform pg_temp.xiv_expect_blocked($stmt$
    update public.agent_registry set lifecycle_state = 'active'
    where id = 'a9e00000-0000-4000-8000-00000000000c'
  $stmt$, 'activation with a failed gating evaluation');
end;
$$;

do $$
begin
  perform pg_temp.xiv_act_as('11111111-1111-4111-8111-111111111111');

  -- A task that needs approval must carry a rollback plan and an approver.
  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_tasks (universe_id, requested_by, title, description, requires_human_approval)
    values ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
            'Reallocate suppliers', 'No rollback plan', true)
  $stmt$, 'approval-gated task without a rollback plan');

  insert into public.agent_tasks (id, universe_id, requested_by, title, description, requires_human_approval, rollback_plan)
  values ('a5500000-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000001',
          '11111111-1111-4111-8111-111111111111', 'Reallocate suppliers',
          'Move 15 percent of volume to the secondary supplier', true,
          'Restore the original allocation from the pre-change snapshot');

  perform pg_temp.xiv_expect_blocked($stmt$
    update public.agent_tasks set status = 'active' where id = 'a5500000-0000-4000-8000-00000000000a'
  $stmt$, 'approval-gated task going active without an approver');

  update public.agent_tasks
  set status = 'active', approved_by = '11111111-1111-4111-8111-111111111111', approved_at = now(), started_at = now()
  where id = 'a5500000-0000-4000-8000-00000000000a';

  -- An approved high-risk capability can never be stored.
  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_capabilities (universe_id, agent_id, capability_kind, capability_key, risk_level, approved, granted_by)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'a9e00000-0000-4000-8000-00000000000a', 'tool', 'move_money', 'critical', true,
            '11111111-1111-4111-8111-111111111111')
  $stmt$, 'approving a critical capability');

  -- Satellite and orbital classes stay unconfigured external providers.
  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.runtime_nodes (universe_id, node_key, platform_class, provider, status, is_external_unconfigured)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'orbit-01', 'orbital_compute', 'unnamed', 'available', false)
  $stmt$, 'bringing an orbital runtime node online');
end;
$$;

do $$
begin
  perform pg_temp.xiv_act_as('11111111-1111-4111-8111-111111111111');

  update public.universe_lifecycle
  set kill_switch_engaged = true, kill_switch_reason = 'deterministic kill switch test', kill_switch_engaged_at = now()
  where id = 'aaaaaaaa-0000-4000-8000-000000000001';

  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_tasks (universe_id, requested_by, title, description, requires_human_approval)
    values ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'after kill switch', 'should never queue', false)
  $stmt$, 'queueing a task while the kill switch is engaged');

  perform pg_temp.xiv_expect_blocked($stmt$
    insert into public.agent_messages (universe_id, conversation_id, sequence, phase, sender_agent_id, receiver_user_id, purpose, reasoning_artifact)
    values ('aaaaaaaa-0000-4000-8000-000000000001', gen_random_uuid(), 1, 'request',
            'a9e00000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'after kill switch', 'should never send')
  $stmt$, 'sending an XACP message while the kill switch is engaged');

  -- The switch is deterministic in both directions: clearing it restores work.
  update public.universe_lifecycle
  set kill_switch_engaged = false, kill_switch_reason = null, kill_switch_engaged_at = null
  where id = 'aaaaaaaa-0000-4000-8000-000000000001';

  insert into public.agent_tasks (universe_id, requested_by, title, description, requires_human_approval)
  values ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'after kill switch cleared', 'queues normally', false);
end;
$$;

set local role postgres;

do $$
begin
  raise notice 'XIV agent civilization RLS tests passed.';
end;
$$;

rollback;
