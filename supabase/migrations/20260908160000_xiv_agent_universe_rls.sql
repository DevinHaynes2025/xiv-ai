-- 2I-AI-62B follow-up — Universe-scoped RLS for the agent tables.
--
-- 2I-AI-62B §3 requires every tenant-bearing table to carry BOTH organization
-- ownership and Universe ownership, and §22 requires a passing "Universe
-- Boundary" test: an agent from Universe A cannot retrieve private Universe B
-- context. The in-process meeting engine enforces that boundary, but the
-- database did not: every policy on the agent tables filtered on tenant_id
-- only, even though all of them carry a universe_id column. A principal
-- holding a valid tenant JWT could therefore read every Universe in the
-- tenant. This migration closes that gap for all 18 affected tables.
--
-- Direction of change is deny-more, never allow-more.
--
-- PROPOSE → TEST → TENANT ISOLATION → BACKUP/ROLLBACK → APPLY WHEN AUTHORIZED → VERIFY
-- Nothing here marks any surface live. L4 remains disabled.

-- ---------------------------------------------------------------------------
-- Universe reference resolver
--
-- The agent tables store universe_id as text holding a slug (for example
-- 'universe_a'), while public.universes.id is uuid. A universe_id::uuid cast
-- would raise on non-uuid input, so this resolver matches either the slug or
-- the uuid rendered as text, and never casts untrusted text to uuid.
--
-- Membership semantics follow the existing xiv_is_universe_member helper:
-- an active universe membership PLUS an active membership in the organization
-- that owns the Universe.
-- ---------------------------------------------------------------------------
create or replace function public.xiv_universe_ref_is_member(p_universe_ref text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.universes u
    join public.universe_memberships m
      on m.universe_id = u.id
     and m.user_id = auth.uid()
     and m.status = 'active'
    join public.organization_memberships om
      on om.organization_id = u.organization_id
     and om.user_id = auth.uid()
     and om.status = 'active'
    where u.slug = p_universe_ref
       or u.id::text = p_universe_ref
  );
$$;

comment on function public.xiv_universe_ref_is_member(text) is
  'Resolves a text universe reference (slug or uuid-as-text) to an active Universe membership backed by an active organization membership. Used by agent-table RLS so Universe ownership is enforced in the database, not only in the runtime.';

-- Not a PostgREST RPC: reachable only from RLS predicates. Follows the grant
-- convention in 20260908013000 — revoke from public/anon, allow authenticated.
revoke all on function public.xiv_universe_ref_is_member(text) from public, anon;
grant execute on function public.xiv_universe_ref_is_member(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Replace tenant-only policies with tenant AND Universe policies.
--
-- The old policy MUST be dropped rather than left alongside the new one:
-- PostgreSQL combines permissive policies with OR, so retaining the tenant-only
-- policy would fully negate the Universe predicate being added here.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tenant_expr text;
begin
  foreach t in array array[
    -- 2I-AI-62B agent meeting network
    'xiv_agent_meetings',
    'xiv_agent_meeting_participants',
    'xiv_agent_meeting_messages',
    'xiv_agent_meeting_evidence',
    'xiv_agent_meeting_proposals',
    'xiv_agent_meeting_objections',
    'xiv_agent_meeting_votes',
    'xiv_agent_meeting_decisions',
    'xiv_agent_meeting_actions',
    'xiv_agent_meeting_outcomes',
    -- 2I-LA-03 mission control (same defect, same shape)
    'agent_departments',
    'agent_shift_instances',
    'agent_shift_assignments',
    'agent_task_forces',
    'agent_task_force_members',
    'agent_mc_messages',
    'agent_meetings',
    'agent_performance'
  ]
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('drop policy if exists %I on public.%I', t || '_tenant_isolation', t);
    execute format('drop policy if exists %I on public.%I', t || '_tenant_universe_isolation', t);

    tenant_expr := $pol$tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', '')$pol$;

    execute format(
      'create policy %I on public.%I for all using (%s and public.xiv_universe_ref_is_member(universe_id)) with check (%s and public.xiv_universe_ref_is_member(universe_id))',
      t || '_tenant_universe_isolation',
      t,
      tenant_expr,
      tenant_expr
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Indexes supporting the RLS predicates.
-- ---------------------------------------------------------------------------
create index if not exists xiv_agent_meetings_tenant_universe_idx
  on public.xiv_agent_meetings (tenant_id, universe_id);
create index if not exists xiv_agent_meeting_participants_meeting_idx
  on public.xiv_agent_meeting_participants (meeting_id);
create index if not exists xiv_agent_meeting_messages_meeting_idx
  on public.xiv_agent_meeting_messages (meeting_id);
create index if not exists xiv_agent_meeting_evidence_meeting_idx
  on public.xiv_agent_meeting_evidence (meeting_id);
create index if not exists xiv_agent_meeting_proposals_meeting_idx
  on public.xiv_agent_meeting_proposals (meeting_id);
create index if not exists xiv_agent_meeting_objections_meeting_idx
  on public.xiv_agent_meeting_objections (meeting_id);
create index if not exists xiv_agent_meeting_votes_meeting_idx
  on public.xiv_agent_meeting_votes (meeting_id);
create index if not exists xiv_agent_meeting_decisions_meeting_idx
  on public.xiv_agent_meeting_decisions (meeting_id);
create index if not exists xiv_agent_meeting_actions_meeting_idx
  on public.xiv_agent_meeting_actions (meeting_id);
create index if not exists xiv_agent_meeting_outcomes_meeting_idx
  on public.xiv_agent_meeting_outcomes (meeting_id);

-- ---------------------------------------------------------------------------
-- Referential integrity for votes and objections.
--
-- Both carry proposal_id but neither referenced the proposals table, so an
-- objection or vote could be recorded against a proposal that does not exist.
-- §5 requires evidence before consensus; a vote with no resolvable proposal
-- cannot satisfy that.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'xiv_agent_meeting_objections_proposal_fk'
  ) then
    alter table public.xiv_agent_meeting_objections
      add constraint xiv_agent_meeting_objections_proposal_fk
      foreign key (proposal_id) references public.xiv_agent_meeting_proposals (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'xiv_agent_meeting_votes_proposal_fk'
  ) then
    alter table public.xiv_agent_meeting_votes
      add constraint xiv_agent_meeting_votes_proposal_fk
      foreign key (proposal_id) references public.xiv_agent_meeting_proposals (id) on delete cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Pin the governance invariants in the database.
--
-- The TypeScript types already pin these as literal false, and the columns
-- default to false, but a direct INSERT could still set them true. The
-- agent_workers table in 20260908031500 established the convention of
-- expressing these as CHECK constraints; these tables did not follow it.
--
-- MEETING ≠ AUTHORITY, L4 disabled, nothing production-live, and an action
-- recorded as unauthorized must never also be recorded as executed.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'xiv_agent_meetings_not_authority'
  ) then
    alter table public.xiv_agent_meetings
      add constraint xiv_agent_meetings_not_authority check (meeting_equals_authority = false);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'xiv_agent_meetings_l4_disabled'
  ) then
    alter table public.xiv_agent_meetings
      add constraint xiv_agent_meetings_l4_disabled check (l4_enabled = false);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'xiv_agent_meetings_not_live'
  ) then
    alter table public.xiv_agent_meetings
      add constraint xiv_agent_meetings_not_live check (production_live = false);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'xiv_agent_meeting_actions_no_unauthorized_execution'
  ) then
    alter table public.xiv_agent_meeting_actions
      add constraint xiv_agent_meeting_actions_no_unauthorized_execution
      check (not (unauthorized and executed));
  end if;
end $$;
