-- 2I-AI-62D (governance) — the section 40 RLS evidence matrix.
--
-- FOUNDER: run this in the hosted Supabase SQL editor (or psql as the postgres
-- role) AFTER applying all three migrations. It runs inside one transaction and
-- ends with ROLLBACK, so it leaves nothing behind.
--
-- Why this exists when 62A and 62B already have RLS tests.
--
-- Those harnesses prove specific, hand-picked attacks, which is the right way to
-- test the cases you thought of. Section 40 asks for something different and
-- less flattering: the same five-way matrix against *every* tenant-bearing
-- table, including the ones nobody remembered to write a test for. So this file
-- discovers the tables from the catalog rather than from a list a human
-- maintains, and a table added next month is in scope the moment it is created.
--
-- For every discovered table it establishes:
--
--   ORG_A  -> ORG_A          ALLOW
--   ORG_A  -> ORG_B          DENY
--   ORG_B  -> ORG_A          DENY
--   UNAUTHENTICATED -> data  DENY
--   REVOKED USER    -> data  DENY
--
-- across SELECT, UPDATE and DELETE. INSERT is deliberately not attempted
-- generically: a refused INSERT is ambiguous, because a row rejected for the
-- wrong shape looks exactly like a row rejected by a policy, and evidence that
-- cannot distinguish the two is not evidence. INSERT denial is proved
-- case-by-case in the two slice harnesses instead.
--
-- Honesty about coverage. Seeding a row generically is best-effort: a table
-- whose constraints this file cannot satisfy is reported as SKIPPED, by name,
-- with the reason. Per section 39 a skipped mandatory check is not a pass, and
-- the collector carries these skips into the evidence package rather than
-- quietly reporting a smaller denominator.

begin;

set local role postgres;

select set_config('xiv.suite', 'rls-matrix', true);

create or replace function pg_temp.xiv_evidence(
  label text, expected text, actual text, status text, kind text
)
returns void
language plpgsql
as $$
begin
  raise notice 'XIV-EVIDENCE|%|%|%|%|%|%',
    coalesce(current_setting('xiv.suite', true), 'unknown'),
    replace(label, '|', '/'),
    expected,
    actual,
    status,
    kind;
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

create or replace function pg_temp.xiv_act_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matrix.a@xiv.test', '', now(), now(), now()),
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matrix.b@xiv.test', '', now(), now(), now()),
  ('55555555-5555-4555-8555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matrix.revoked@xiv.test', '', now(), now(), now()),
  ('66666666-6666-4666-8666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matrix.reviewer@xiv.test', '', now(), now(), now())
on conflict (id) do nothing;

insert into public.universe_lifecycle (id, organization_id, name, created_by, lifecycle_stage)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a', 'Matrix Universe A', '11111111-1111-4111-8111-111111111111', 'operational'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-00000000000b', 'Matrix Universe B', '33333333-3333-4333-8333-333333333333', 'operational');

insert into public.universe_memberships (universe_id, organization_id, user_id, membership_role, is_supervisor)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'supervisor', true),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-00000000000b', '33333333-3333-4333-8333-333333333333', 'supervisor', true);

-- The revoked user was a genuine supervisor of Universe A and had their
-- membership withdrawn. Section 40 asks for this case specifically because it
-- is the one that fails when a policy checks "was ever a member".
insert into public.universe_memberships (universe_id, organization_id, user_id, membership_role, is_supervisor, revoked_at)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a', '55555555-5555-4555-8555-555555555555', 'supervisor', true, now());

insert into public.agent_resource_budgets (universe_id, agent_id, max_registered_agents, max_active_agents, max_queued_tasks, max_cost_micro_usd)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', null, 50, 50, 50, 5000000),
  ('bbbbbbbb-0000-4000-8000-000000000002', null, 50, 50, 50, 5000000);

-- Two agents per universe, because several tables relate one agent to another
-- and a self-relationship is rejected by design.
insert into public.agent_registry (
  id, universe_id, organization_id, agent_key, display_name, profession,
  model_runtime, human_supervisor_id, created_by, lifecycle_state
)
values
  ('a9e00000-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a',
   'matrix-one', 'Matrix A One', 'coordination', 'gemini-flash',
   '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'registered'),
  ('a9e00000-0000-4000-8000-0000000000a2', 'aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a',
   'matrix-two', 'Matrix A Two', 'analysis', 'gemini-flash',
   '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'registered'),
  ('b9e00000-0000-4000-8000-0000000000b1', 'bbbbbbbb-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-00000000000b',
   'matrix-one', 'Matrix B One', 'coordination', 'gemini-flash',
   '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'registered'),
  ('b9e00000-0000-4000-8000-0000000000b2', 'bbbbbbbb-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-00000000000b',
   'matrix-two', 'Matrix B Two', 'analysis', 'gemini-flash',
   '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'registered');

-- Two meetings per universe. The primary one is fully set up — budgeted, with a
-- person in the room — because 62B refuses to seat participants in an
-- unbudgeted meeting and refuses to record a decision where no human is
-- present. Those rules live in triggers rather than in columns, so a
-- catalog-driven seeder cannot discover them. The spare exists so the budget
-- table itself has an unbudgeted meeting to attach to.
insert into public.agent_meetings (id, universe_id, title, created_by, lifecycle_stage)
values
  ('c1100000-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000001',
   'Matrix A primary room', '11111111-1111-4111-8111-111111111111', 'debate'),
  ('c1100000-0000-4000-8000-0000000000a2', 'aaaaaaaa-0000-4000-8000-000000000001',
   'Matrix A spare room', '11111111-1111-4111-8111-111111111111', 'debate'),
  ('c1100000-0000-4000-8000-0000000000b1', 'bbbbbbbb-0000-4000-8000-000000000002',
   'Matrix B primary room', '33333333-3333-4333-8333-333333333333', 'debate'),
  ('c1100000-0000-4000-8000-0000000000b2', 'bbbbbbbb-0000-4000-8000-000000000002',
   'Matrix B spare room', '33333333-3333-4333-8333-333333333333', 'debate');

insert into public.agent_meeting_budgets (universe_id, meeting_id)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'c1100000-0000-4000-8000-0000000000a1'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'c1100000-0000-4000-8000-0000000000b1');

insert into public.agent_meeting_participants (universe_id, meeting_id, participant_kind, user_id, participant_role)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'c1100000-0000-4000-8000-0000000000a1', 'human',
   '11111111-1111-4111-8111-111111111111', 'human_supervisor'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'c1100000-0000-4000-8000-0000000000b1', 'human',
   '33333333-3333-4333-8333-333333333333', 'human_supervisor');

-- ---------------------------------------------------------------------------
-- Seeding overrides
-- ---------------------------------------------------------------------------
--
-- A handful of tables carry conditional constraints — "one of these two columns
-- must be set", "this may not equal that", "an exception must expire after it
-- was created". No generic seeder can infer those, so they are declared here.
-- Everything not listed is still discovered and seeded automatically, and a new
-- table with a conditional constraint will simply appear in the SKIPPED list
-- until somebody adds a line here, which is the visible failure mode rather
-- than the silent one.

create temporary table xiv_matrix_overrides (
  table_name text not null,
  column_name text not null,
  value_kind text not null,
  primary key (table_name, column_name)
) on commit drop;

insert into xiv_matrix_overrides (table_name, column_name, value_kind) values
  ('agent_relationships', 'to_agent_id', 'AGENT2'),
  ('agent_messages', 'receiver_user_id', 'USER'),
  ('agent_tasks', 'rollback_plan', 'restore the previous row'),
  ('agent_tasks', 'requires_human_approval', 'FALSE'),
  ('knowledge_lineage', 'actor_kind', 'system'),
  ('agent_control_actions', 'subject_agent_id', 'AGENT'),
  ('agent_resource_budgets', 'agent_id', 'AGENT'),
  ('evidence_revalidations', 'affects_all_gates', 'TRUE'),
  ('evidence_exceptions', 'expires_at', 'SQL:now() + interval ''30 days'''),
  ('evidence_exceptions', 'reviewer_id', 'USER2'),
  ('evidence_verifications', 'verifier_id', 'USER2'),
  ('agent_messages', 'sender_user_id', 'USER'),
  ('agent_meeting_participants', 'operator_user_id', 'USER'),
  ('agent_meeting_participants', 'agent_id', 'AGENT'),
  ('agent_meeting_evidence', 'submitted_by_agent_id', 'AGENT'),
  ('agent_meeting_evidence', 'operator_user_id', 'USER'),
  ('agent_meeting_objections', 'raised_by_agent_id', 'AGENT'),
  ('agent_meeting_objections', 'operator_user_id', 'USER'),
  ('agent_meeting_proposals', 'evidence_ids', 'SQL:array[gen_random_uuid()]'),
  ('agent_meeting_proposals', 'proposed_by_agent_id', 'AGENT'),
  ('agent_meeting_proposals', 'operator_user_id', 'USER'),
  ('agent_meeting_votes', 'cited_evidence_ids', 'SQL:array[gen_random_uuid()]'),
  ('agent_meeting_votes', 'voter_agent_id', 'AGENT'),
  ('agent_meeting_votes', 'operator_user_id', 'USER'),
  ('agent_meeting_evidence', 'provenance', 'SQL:jsonb_build_object(''source'', ''rls-matrix'')'),
  ('agent_evaluations', 'evaluator_user_id', 'USER'),
  ('agent_meeting_messages', 'speaker_kind', 'system'),
  ('agent_meeting_budgets', 'meeting_id', 'MEETING_SPARE'),
  ('agent_meeting_decisions', 'selected_proposal_id', 'PROPOSAL');

-- ---------------------------------------------------------------------------
-- Discovery
-- ---------------------------------------------------------------------------
--
-- A table is tenant-bearing if it carries universe_id. universe_lifecycle is the
-- one exception: it is the tenant, so its own primary key is the tenant key.

create temporary table xiv_matrix_tables (
  table_name text primary key,
  tenant_column text not null,
  rls_enabled boolean not null,
  rls_forced boolean not null,
  -- Set where the table carries a user_id, meaning some of its rows are *about*
  -- a particular person rather than merely belonging to a tenant.
  self_column text,
  row_a uuid,
  row_b uuid,
  skip_reason text
) on commit drop;

insert into xiv_matrix_tables (table_name, tenant_column, rls_enabled, rls_forced, self_column)
select c.relname,
       case when c.relname = 'universe_lifecycle' then 'id' else 'universe_id' end,
       c.relrowsecurity,
       c.relforcerowsecurity,
       (select a.attname from pg_attribute a
        where a.attrelid = c.oid and a.attname = 'user_id' and a.attnum > 0 and not a.attisdropped)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and (
    c.relname = 'universe_lifecycle'
    or exists (
      select 1 from pg_attribute a
      where a.attrelid = c.oid and a.attname = 'universe_id' and a.attnum > 0 and not a.attisdropped
    )
  );

-- ---------------------------------------------------------------------------
-- Generic seeding
-- ---------------------------------------------------------------------------
--
-- Only columns that are NOT NULL and have no default are synthesised; anything
-- with a default is left to the schema, which keeps the guessing to a minimum.
-- Values come from the column's own check constraint where it has one, so an
-- enum-shaped column gets a legal member rather than a string the constraint
-- will reject.

create or replace function pg_temp.xiv_matrix_enum_value(tbl text, col text)
returns text
language sql
stable
as $$
  select (regexp_match(pg_get_constraintdef(c.oid), 'ARRAY\[''([^'']+)'''))[1]
  from pg_constraint c
  where c.conrelid = ('public.' || tbl)::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) like '%' || col || ' = ANY%'
  limit 1;
$$;

create or replace function pg_temp.xiv_matrix_fk_target(tbl text, col text)
returns text
language sql
stable
as $$
  select con.confrelid::regclass::text
  from pg_constraint con
  join pg_attribute a on a.attrelid = con.conrelid and a.attname = col
  where con.conrelid = ('public.' || tbl)::regclass
    and con.contype = 'f'
    and a.attnum = any (con.conkey)
  limit 1;
$$;

create or replace function pg_temp.xiv_matrix_has_column(qualified text, col text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from pg_attribute a
    where a.attrelid = qualified::regclass and a.attname = col and a.attnum > 0 and not a.attisdropped
  );
$$;

create or replace function pg_temp.xiv_matrix_seed(
  tbl text, tenant_column text, target_universe uuid, target_org uuid, actor uuid, attempt integer
)
returns uuid
language plpgsql
as $$
declare
  col record;
  columns text[] := array[]::text[];
  values_list text[] := array[]::text[];
  fk_target text;
  fk_value uuid;
  literal text;
  new_id uuid;
  override_kind text;
  agent_one uuid;
  agent_two uuid;
  spare_meeting uuid;
  a_proposal uuid;
begin
  select id into agent_one from public.agent_registry
  where universe_id = target_universe order by agent_key limit 1;
  select id into agent_two from public.agent_registry
  where universe_id = target_universe and id is distinct from agent_one order by agent_key desc limit 1;
  select id into spare_meeting from public.agent_meetings
  where universe_id = target_universe and title like '%spare room' limit 1;
  select id into a_proposal from public.agent_meeting_proposals
  where universe_id = target_universe order by ctid limit 1;

  for col in
    select a.attname,
           format_type(a.atttypid, a.atttypmod) as data_type,
           a.attnotnull,
           pg_get_expr(d.adbin, d.adrelid) as default_expr
    from pg_attribute a
    left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where a.attrelid = ('public.' || tbl)::regclass
      and a.attnum > 0
      and not a.attisdropped
    order by a.attnum
  loop
    literal := null;

    select o.value_kind into override_kind
    from xiv_matrix_overrides o
    where o.table_name = tbl and o.column_name = col.attname;

    if override_kind is not null then
      literal := case override_kind
        when 'AGENT' then quote_literal(agent_one) || '::uuid'
        when 'AGENT2' then quote_literal(agent_two) || '::uuid'
        when 'USER' then quote_literal(actor) || '::uuid'
        when 'USER2' then quote_literal('66666666-6666-4666-8666-666666666666'::uuid) || '::uuid'
        when 'MEETING_SPARE' then quote_literal(spare_meeting) || '::uuid'
        when 'PROPOSAL' then coalesce(quote_literal(a_proposal) || '::uuid', 'null')
        when 'TRUE' then 'true'
        when 'FALSE' then 'false'
        else case
          when override_kind like 'SQL:%' then substring(override_kind from 5)
          else quote_literal(override_kind)
        end
      end;
    elsif col.attname = tenant_column then
      literal := quote_literal(target_universe) || '::uuid';
    elsif col.attname = 'organization_id' then
      literal := quote_literal(target_org) || '::uuid';
    elsif not col.attnotnull or col.default_expr is not null then
      -- Nullable, or the schema already knows what to put here.
      continue;
    else
      fk_target := pg_temp.xiv_matrix_fk_target(tbl, col.attname);

      if fk_target = 'auth.users' then
        literal := quote_literal(actor) || '::uuid';
      elsif fk_target is not null then
        -- Point at a row belonging to the same tenant where the target is
        -- itself tenant-scoped, so the seeded row is internally consistent and
        -- the cross-universe triggers have nothing to object to.
        if pg_temp.xiv_matrix_has_column(fk_target, 'universe_id') then
          -- ctid order means the oldest row wins, which is the hand-written
          -- fixture rather than something a previous pass improvised. It keeps
          -- the run deterministic and points relationships at the rows that
          -- were set up properly.
          execute format('select id from %s where universe_id = %L order by ctid limit 1',
            fk_target, target_universe) into fk_value;
        elsif fk_target = 'public.universe_lifecycle' then
          fk_value := target_universe;
        else
          execute format('select id from %s limit 1', fk_target) into fk_value;
        end if;
        if fk_value is null then
          raise exception 'no % row available for %.%', fk_target, tbl, col.attname;
        end if;
        literal := quote_literal(fk_value) || '::uuid';
      elsif col.data_type = 'uuid' then
        literal := 'gen_random_uuid()';
      elsif col.data_type like 'timestamp%' then
        literal := 'now()';
      elsif col.data_type = 'boolean' then
        literal := 'false';
      elsif col.data_type like '%[]' then
        literal := quote_literal('{}') || '::' || col.data_type;
      elsif col.data_type similar to '(integer|bigint|smallint|real|double precision)'
        or col.data_type like 'numeric%' then
        -- Two attempts because bounded columns disagree about which end is
        -- legal: a confidence is 0..1 and a count is often > 0.
        literal := case when attempt = 0 then '1' else '0' end;
      elsif col.data_type in ('jsonb', 'json') then
        literal := quote_literal('{}') || '::' || col.data_type;
      else
        literal := quote_literal(coalesce(pg_temp.xiv_matrix_enum_value(tbl, col.attname), 'xiv-matrix-' || tbl));
      end if;
    end if;

    columns := columns || quote_ident(col.attname);
    values_list := values_list || literal;
  end loop;

  execute format(
    'insert into public.%I (%s) values (%s) returning id',
    tbl, array_to_string(columns, ', '), array_to_string(values_list, ', ')
  ) into new_id;

  return new_id;
end;
$$;

-- Seeding runs in passes rather than in a topological order. A table whose
-- foreign key points at another discovered table fails on the first pass and
-- succeeds on the next, once its parent exists. Repeating until a pass makes no
-- progress reaches the same place as a dependency sort without having to build
-- one, and it degrades gracefully: a genuine cycle stops rather than looping.

do $$
declare
  t record;
  seeded_a uuid;
  seeded_b uuid;
  attempt integer;
  last_error text;
  pass integer;
  progress boolean;
begin
  update xiv_matrix_tables set
    row_a = 'aaaaaaaa-0000-4000-8000-000000000001',
    row_b = 'bbbbbbbb-0000-4000-8000-000000000002'
  where table_name in ('universe_lifecycle', 'universe_memberships');

  for pass in 1..8 loop
    progress := false;

    for t in select * from xiv_matrix_tables where row_a is null or row_b is null order by table_name loop
      seeded_a := null;
      seeded_b := null;
      last_error := null;

      for attempt in 0..1 loop
        begin
          seeded_a := pg_temp.xiv_matrix_seed(
            t.table_name, t.tenant_column,
            'aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a',
            '11111111-1111-4111-8111-111111111111', attempt
          );
          exit;
        exception when others then
          last_error := sqlerrm;
          seeded_a := null;
        end;
      end loop;

      if seeded_a is null then
        update xiv_matrix_tables set skip_reason = last_error where table_name = t.table_name;
        continue;
      end if;

      for attempt in 0..1 loop
        begin
          seeded_b := pg_temp.xiv_matrix_seed(
            t.table_name, t.tenant_column,
            'bbbbbbbb-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-00000000000b',
            '33333333-3333-4333-8333-333333333333', attempt
          );
          exit;
        exception when others then
          last_error := sqlerrm;
          seeded_b := null;
        end;
      end loop;

      if seeded_b is null then
        -- One tenant's row on its own proves nothing about isolation, so the
        -- half-seeded table is left uncovered rather than half-tested.
        update xiv_matrix_tables set skip_reason = last_error where table_name = t.table_name;
        continue;
      end if;

      update xiv_matrix_tables
      set row_a = seeded_a, row_b = seeded_b, skip_reason = null
      where table_name = t.table_name;
      progress := true;
    end loop;

    exit when not progress;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Structural check: RLS on, and forced
-- ---------------------------------------------------------------------------
--
-- Section 40 says this is not sufficient, and it is not; it is here because it
-- is necessary. A table with RLS merely enabled still bypasses policies for its
-- owner, which is why forced is checked too.

do $$
declare
  t record;
  failures integer := 0;
begin
  for t in select * from xiv_matrix_tables order by table_name loop
    if t.rls_enabled and t.rls_forced then
      perform pg_temp.xiv_evidence(
        t.table_name || ' :: rls enabled and forced', 'enabled+forced', 'enabled+forced', 'pass', 'positive');
    else
      failures := failures + 1;
      perform pg_temp.xiv_evidence(
        t.table_name || ' :: rls enabled and forced', 'enabled+forced',
        case when t.rls_enabled then 'enabled only' else 'disabled' end, 'fail', 'positive');
    end if;
  end loop;

  if failures > 0 then
    raise exception 'XIV RLS MATRIX FAILED: % table(s) do not have RLS enabled and forced', failures;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- The five-way behavioural matrix
-- ---------------------------------------------------------------------------

do $$
declare
  payload jsonb;
  item jsonb;
  t record;
  visible bigint;
  affected bigint;
  covered integer := 0;
  skipped integer := 0;
  violations integer := 0;
  supervisor_a constant uuid := '11111111-1111-4111-8111-111111111111';
  supervisor_b constant uuid := '33333333-3333-4333-8333-333333333333';
  revoked constant uuid := '55555555-5555-4555-8555-555555555555';
  universe_a constant uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  universe_b constant uuid := 'bbbbbbbb-0000-4000-8000-000000000002';

  procedure_label text;
begin
  -- Read the plan once, as postgres, into a local value. The loop below spends
  -- most of its time as `authenticated` or `anon`, and those roles have no
  -- business reading the harness's own bookkeeping table.
  select jsonb_agg(to_jsonb(m) order by m.table_name) into payload from xiv_matrix_tables m;

  for item in select value from jsonb_array_elements(payload) loop
    t := jsonb_populate_record(null::xiv_matrix_tables, item);

    if t.row_a is null or t.row_b is null then
      skipped := skipped + 1;
      -- Named, with the reason, and counted as SKIPPED rather than folded away.
      perform pg_temp.xiv_evidence(
        t.table_name || ' :: cross-tenant matrix', 'ALLOW/DENY matrix',
        'SKIPPED — ' || coalesce(left(t.skip_reason, 120), 'no fixture row'), 'skipped', 'negative');
      continue;
    end if;

    covered := covered + 1;

    -- The role matters as much as the JWT claim. postgres is a superuser and
    -- bypasses row level security even where it is forced, so a matrix run as
    -- postgres would report a clean sweep while proving nothing whatsoever.
    execute 'set role authenticated';

    -- 1. ORG_A -> ORG_A -> ALLOW
    perform pg_temp.xiv_act_as(supervisor_a);
    execute format('select count(*) from public.%I where %I = %L', t.table_name, t.tenant_column, universe_a)
      into visible;
    procedure_label := t.table_name || ' :: SELECT ORG_A -> ORG_A';
    if visible >= 1 then
      perform pg_temp.xiv_evidence(procedure_label, 'ALLOW', 'ALLOW (' || visible || ' rows)', 'pass', 'positive');
    else
      violations := violations + 1;
      perform pg_temp.xiv_evidence(procedure_label, 'ALLOW', 'DENIED', 'fail', 'positive');
    end if;

    -- 2. ORG_A -> ORG_B -> DENY
    execute format('select count(*) from public.%I where %I = %L', t.table_name, t.tenant_column, universe_b)
      into visible;
    procedure_label := t.table_name || ' :: SELECT ORG_A -> ORG_B';
    if visible = 0 then
      perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'DENY (0 rows)', 'pass', 'negative');
    else
      violations := violations + 1;
      perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'LEAKED (' || visible || ' rows)', 'fail', 'negative');
    end if;

    -- 3. ORG_B -> ORG_A -> DENY
    perform pg_temp.xiv_act_as(supervisor_b);
    execute format('select count(*) from public.%I where %I = %L', t.table_name, t.tenant_column, universe_a)
      into visible;
    procedure_label := t.table_name || ' :: SELECT ORG_B -> ORG_A';
    if visible = 0 then
      perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'DENY (0 rows)', 'pass', 'negative');
    else
      violations := violations + 1;
      perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'LEAKED (' || visible || ' rows)', 'fail', 'negative');
    end if;

    -- 4. ORG_B -> UPDATE ORG_A row -> DENY
    procedure_label := t.table_name || ' :: UPDATE ORG_B -> ORG_A';
    begin
      execute format('update public.%I set %I = %I where id = %L',
        t.table_name, t.tenant_column, t.tenant_column, t.row_a);
      get diagnostics affected = row_count;
      if affected = 0 then
        perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'DENY (no row visible)', 'pass', 'negative');
      else
        violations := violations + 1;
        perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'ALLOWED (' || affected || ' rows)', 'fail', 'negative');
      end if;
    exception when insufficient_privilege or check_violation or raise_exception then
      perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'DENY (refused)', 'pass', 'negative');
    end;

    -- 5. ORG_B -> DELETE ORG_A row -> DENY
    procedure_label := t.table_name || ' :: DELETE ORG_B -> ORG_A';
    begin
      execute format('delete from public.%I where id = %L', t.table_name, t.row_a);
      get diagnostics affected = row_count;
      if affected = 0 then
        perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'DENY (no row visible)', 'pass', 'negative');
      else
        violations := violations + 1;
        perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'DELETED (' || affected || ' rows)', 'fail', 'negative');
      end if;
    exception when insufficient_privilege or check_violation or raise_exception then
      perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'DENY (refused)', 'pass', 'negative');
    end;

    -- 6. UNAUTHENTICATED -> DENY
    execute 'set role anon';
    perform pg_temp.xiv_act_anon();
    procedure_label := t.table_name || ' :: SELECT UNAUTHENTICATED';
    begin
      execute format('select count(*) from public.%I', t.table_name) into visible;
      if visible = 0 then
        perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'DENY (0 rows)', 'pass', 'negative');
      else
        violations := violations + 1;
        perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'LEAKED (' || visible || ' rows)', 'fail', 'negative');
      end if;
    exception when insufficient_privilege then
      perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'DENY (no grant)', 'pass', 'negative');
    end;

    -- 7. REVOKED USER -> DENY
    --
    -- With one carve-out the matrix found on its own. A membership row is about
    -- the member: the record saying "this person's access was withdrawn" is
    -- that person's own row, and being able to read it is correct rather than a
    -- leak. So where a table carries a user_id, the revoked party's own rows are
    -- excluded from the count and everybody else's must still be invisible. The
    -- carve-out is narrow on purpose — it exempts a row about you, never a row
    -- about your former colleagues.
    execute 'set role authenticated';
    perform pg_temp.xiv_act_as(revoked);
    procedure_label := t.table_name || ' :: SELECT REVOKED MEMBER'
      || case when t.self_column is null then '' else ' (excluding their own rows)' end;
    if t.self_column is null then
      execute format('select count(*) from public.%I where %I = %L', t.table_name, t.tenant_column, universe_a)
        into visible;
    else
      execute format('select count(*) from public.%I where %I = %L and (%I is distinct from %L)',
        t.table_name, t.tenant_column, universe_a, t.self_column, revoked)
        into visible;
    end if;
    if visible = 0 then
      perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'DENY (0 rows)', 'pass', 'negative');
    else
      violations := violations + 1;
      perform pg_temp.xiv_evidence(procedure_label, 'DENY', 'LEAKED (' || visible || ' rows)', 'fail', 'negative');
    end if;

    execute 'set role postgres';
  end loop;

  execute 'set role postgres';
  perform set_config('request.jwt.claims', null, true);

  raise notice 'XIV-RLS-MATRIX-COVERAGE|%|%|%', covered, skipped, covered + skipped;

  if violations > 0 then
    raise exception 'XIV RLS MATRIX FAILED: % cross-tenant violation(s)', violations;
  end if;

  raise notice 'XIV RLS MATRIX PASSED: % tables covered, % skipped', covered, skipped;
end;
$$;

rollback;
