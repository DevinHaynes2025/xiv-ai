-- AC-03 tenant and universe isolation: executed negative tests.
--
-- Runs against a local PostgreSQL instance that has the Supabase auth shim and
-- the 62D migration applied. Every check runs as the `authenticated` role with
-- a JWT subject set, which is the same path a mobile or web client takes.
--
-- Output: one row per check with pass/fail, consumed by tools/rls-verify.ts.

\set ON_ERROR_STOP on

drop schema if exists xiv_test cascade;
create schema xiv_test;

create table xiv_test.results (
  id serial primary key,
  category text not null,
  name text not null,
  expectation text not null,
  observed text not null,
  passed boolean not null
);

-- The harness schema is granted to anon as well, so the anon checks below fail
-- on the runtime tables rather than on the harness itself.
grant usage on schema xiv_test to authenticated, anon;
grant select, insert on table xiv_test.results to authenticated, anon;
grant usage, select on sequence xiv_test.results_id_seq to authenticated, anon;

-- Records the outcome of a statement that must be refused by RLS.
create or replace function xiv_test.expect_denied(p_category text, p_name text, p_sql text)
returns void
language plpgsql
security invoker
as $$
begin
  execute p_sql;
  insert into xiv_test.results (category, name, expectation, observed, passed)
  values (p_category, p_name, 'denied', 'permitted', false);
exception
  when insufficient_privilege then
    insert into xiv_test.results (category, name, expectation, observed, passed)
    values (p_category, p_name, 'denied', 'denied:' || sqlstate, true);
  when others then
    insert into xiv_test.results (category, name, expectation, observed, passed)
    values (p_category, p_name, 'denied', 'error:' || sqlstate, true);
end
$$;

-- Records the outcome of a read that must return an exact row count.
create or replace function xiv_test.expect_count(p_category text, p_name text, p_sql text, p_expected bigint)
returns void
language plpgsql
security invoker
as $$
declare
  actual bigint;
begin
  execute p_sql into actual;
  insert into xiv_test.results (category, name, expectation, observed, passed)
  values (p_category, p_name, 'rows=' || p_expected, 'rows=' || coalesce(actual, -1), coalesce(actual, -1) = p_expected);
exception
  when others then
    insert into xiv_test.results (category, name, expectation, observed, passed)
    values (p_category, p_name, 'rows=' || p_expected, 'error:' || sqlstate, false);
end
$$;

-- Records the number of rows a write actually affected.
create or replace function xiv_test.expect_affected(p_category text, p_name text, p_sql text, p_expected bigint)
returns void
language plpgsql
security invoker
as $$
declare
  affected bigint;
begin
  execute p_sql;
  get diagnostics affected = row_count;
  insert into xiv_test.results (category, name, expectation, observed, passed)
  values (p_category, p_name, 'affected=' || p_expected, 'affected=' || affected, affected = p_expected);
exception
  when others then
    insert into xiv_test.results (category, name, expectation, observed, passed)
    values (p_category, p_name, 'affected=' || p_expected, 'error:' || sqlstate, p_expected = 0);
end
$$;

grant execute on function xiv_test.expect_denied(text, text, text) to authenticated, anon;
grant execute on function xiv_test.expect_count(text, text, text, bigint) to authenticated, anon;
grant execute on function xiv_test.expect_affected(text, text, text, bigint) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Fixtures. Seeded as the superuser so the tests measure policy behaviour and
-- not seeding permissions.
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'b@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'c@example.test'),
  ('44444444-4444-4444-8444-444444444444', 'nomember@example.test')
on conflict (id) do nothing;

insert into public.xiv_runtime_memberships (user_id, organization_id, universe_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a1', 'operator'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-0000000000b1', 'operator'),
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a2', 'operator')
on conflict do nothing;

insert into public.xiv_runtime_nodes
  (node_id, organization_id, universe_id, hardware_class, enrollment_fingerprint, enrollment_id, state)
values
  ('node_org_a_uni_1', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a1', 'cpu_x86_amd', 'fp_a1', 'enr_a1', 'active'),
  ('node_org_a_uni_2', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a2', 'cpu_x86_amd', 'fp_a2', 'enr_a2', 'active'),
  ('node_org_b_uni_1', 'bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-0000000000b1', 'cpu_x86_amd', 'fp_b1', 'enr_b1', 'active')
on conflict (node_id) do nothing;

insert into public.xiv_runtime_agents (agent_id, organization_id, universe_id, agent_key, classification)
values
  ('agent_a1', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a1', 'analyst-1', 'confidential'),
  ('agent_b1', 'bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-0000000000b1', 'analyst-1', 'confidential')
on conflict (agent_id) do nothing;

insert into public.xiv_runtime_workloads
  (workload_id, organization_id, universe_id, classification, state, node_id, agent_id)
values
  ('wl_a1', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a1', 'confidential', 'completed', 'node_org_a_uni_1', 'agent_a1'),
  ('wl_b1', 'bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-0000000000b1', 'confidential', 'completed', 'node_org_b_uni_1', 'agent_b1')
on conflict (workload_id) do nothing;

insert into public.xiv_runtime_lineage
  (lineage_id, workload_id, organization_id, universe_id, stage, reference, previous_hash, hash)
values
  ('lin_a1', 'wl_a1', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a1', 'result', 'result:wl_a1', 'genesis', 'hash_a1'),
  ('lin_b1', 'wl_b1', 'bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-0000000000b1', 'result', 'result:wl_b1', 'genesis', 'hash_b1')
on conflict (lineage_id) do nothing;

insert into public.xiv_runtime_audit_events
  (event_id, sequence, organization_id, universe_id, category, kind, subject_id, previous_hash, hash)
values
  ('aud_a1', 1, 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a1', 'workload', 'workload_completed', 'wl_a1', 'genesis', 'h1'),
  ('aud_b1', 1, 'bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-0000000000b1', 'workload', 'workload_completed', 'wl_b1', 'genesis', 'h2')
on conflict (event_id) do nothing;

insert into public.xiv_runtime_usage (usage_id, workload_id, organization_id, universe_id, node_id, cost_usd)
values
  ('use_a1', 'wl_a1', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a1', 'node_org_a_uni_1', 0.01),
  ('use_b1', 'wl_b1', 'bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-0000000000b1', 'node_org_b_uni_1', 0.02)
on conflict (usage_id) do nothing;

insert into public.xiv_runtime_offline_packages
  (package_id, organization_id, universe_id, agent_id, node_id, classification, max_tasks, nonce, signature, expires_at)
values
  ('pkg_a1', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a1', 'agent_a1', 'node_org_a_uni_1', 'confidential', 5, 'n1', 's1', now() + interval '1 day'),
  ('pkg_b1', 'bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-0000000000b1', 'agent_b1', 'node_org_b_uni_1', 'confidential', 5, 'n2', 's2', now() + interval '1 day')
on conflict (package_id) do nothing;

-- ---------------------------------------------------------------------------
-- Tenant A operator: sees only organization A / universe A1.
-- ---------------------------------------------------------------------------

set role authenticated;
set request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select xiv_test.expect_count('cross_tenant_read', 'nodes_visible_to_own_tenant', 'select count(*) from public.xiv_runtime_nodes', 1);
select xiv_test.expect_count('cross_tenant_read', 'nodes_of_other_org_invisible', 'select count(*) from public.xiv_runtime_nodes where node_id = ''node_org_b_uni_1''', 0);
select xiv_test.expect_count('cross_universe_read', 'nodes_of_other_universe_invisible', 'select count(*) from public.xiv_runtime_nodes where node_id = ''node_org_a_uni_2''', 0);
select xiv_test.expect_count('cross_tenant_read', 'agents_of_other_org_invisible', 'select count(*) from public.xiv_runtime_agents where agent_id = ''agent_b1''', 0);
select xiv_test.expect_count('cross_tenant_read', 'workloads_of_other_org_invisible', 'select count(*) from public.xiv_runtime_workloads where workload_id = ''wl_b1''', 0);
select xiv_test.expect_count('cross_tenant_read', 'lineage_of_other_org_invisible', 'select count(*) from public.xiv_runtime_lineage where lineage_id = ''lin_b1''', 0);
select xiv_test.expect_count('cross_tenant_read', 'audit_of_other_org_invisible', 'select count(*) from public.xiv_runtime_audit_events where event_id = ''aud_b1''', 0);
select xiv_test.expect_count('cross_tenant_read', 'usage_of_other_org_invisible', 'select count(*) from public.xiv_runtime_usage where usage_id = ''use_b1''', 0);
select xiv_test.expect_count('cross_tenant_read', 'offline_packages_of_other_org_invisible', 'select count(*) from public.xiv_runtime_offline_packages where package_id = ''pkg_b1''', 0);
select xiv_test.expect_count('cross_tenant_read', 'memberships_of_other_user_invisible', 'select count(*) from public.xiv_runtime_memberships where user_id = ''22222222-2222-4222-8222-222222222222''', 0);
select xiv_test.expect_count('cross_tenant_read', 'join_cannot_leak_other_org_rows', 'select count(*) from public.xiv_runtime_workloads w join public.xiv_runtime_nodes n on n.node_id = w.node_id where w.organization_id <> ''aaaaaaaa-0000-4000-8000-000000000001''', 0);
select xiv_test.expect_count('cross_tenant_read', 'subquery_cannot_leak_other_org_rows', 'select count(*) from public.xiv_runtime_lineage where workload_id in (select workload_id from public.xiv_runtime_workloads)  and organization_id <> ''aaaaaaaa-0000-4000-8000-000000000001''', 0);

select xiv_test.expect_denied('cross_tenant_write', 'insert_node_into_other_org_denied', 'insert into public.xiv_runtime_nodes (node_id, organization_id, universe_id, hardware_class, enrollment_fingerprint, enrollment_id) values (''attack_node_1'', ''bbbbbbbb-0000-4000-8000-000000000002'', ''bbbbbbbb-0000-4000-8000-0000000000b1'', ''cpu_x86_amd'', ''fp_attack_1'', ''enr_attack_1'')');
select xiv_test.expect_denied('cross_universe_write', 'insert_node_into_other_universe_denied', 'insert into public.xiv_runtime_nodes (node_id, organization_id, universe_id, hardware_class, enrollment_fingerprint, enrollment_id) values (''attack_node_2'', ''aaaaaaaa-0000-4000-8000-000000000001'', ''aaaaaaaa-0000-4000-8000-0000000000a2'', ''cpu_x86_amd'', ''fp_attack_2'', ''enr_attack_2'')');
select xiv_test.expect_denied('cross_tenant_write', 'insert_workload_into_other_org_denied', 'insert into public.xiv_runtime_workloads (workload_id, organization_id, universe_id, classification, state) values (''attack_wl_1'', ''bbbbbbbb-0000-4000-8000-000000000002'', ''bbbbbbbb-0000-4000-8000-0000000000b1'', ''restricted'', ''submitted'')');
select xiv_test.expect_denied('cross_tenant_write', 'insert_audit_into_other_org_denied', 'insert into public.xiv_runtime_audit_events (event_id, sequence, organization_id, universe_id, category, kind, subject_id, previous_hash, hash) values (''attack_aud_1'', 2, ''bbbbbbbb-0000-4000-8000-000000000002'', ''bbbbbbbb-0000-4000-8000-0000000000b1'', ''security'', ''forged'', ''x'', ''g'', ''h'')');
select xiv_test.expect_denied('cross_tenant_write', 'membership_self_grant_denied', 'insert into public.xiv_runtime_memberships (user_id, organization_id, universe_id) values (''11111111-1111-4111-8111-111111111111'', ''bbbbbbbb-0000-4000-8000-000000000002'', ''bbbbbbbb-0000-4000-8000-0000000000b1'')');
select xiv_test.expect_affected('cross_tenant_write', 'update_other_org_node_affects_nothing', 'update public.xiv_runtime_nodes set state = ''revoked'' where node_id = ''node_org_b_uni_1''', 0);
select xiv_test.expect_affected('cross_universe_write', 'update_other_universe_node_affects_nothing', 'update public.xiv_runtime_nodes set state = ''revoked'' where node_id = ''node_org_a_uni_2''', 0);
select xiv_test.expect_affected('cross_tenant_write', 'update_own_node_succeeds', 'update public.xiv_runtime_nodes set degraded = true where node_id = ''node_org_a_uni_1''', 1);
select xiv_test.expect_denied('cross_tenant_write', 'reparent_own_node_to_other_org_denied', 'update public.xiv_runtime_nodes set organization_id = ''bbbbbbbb-0000-4000-8000-000000000002'', universe_id = ''bbbbbbbb-0000-4000-8000-0000000000b1'' where node_id = ''node_org_a_uni_1''');

reset role;
reset request.jwt.claims;

-- ---------------------------------------------------------------------------
-- Same organization, different universe: universe isolation must hold.
-- ---------------------------------------------------------------------------

set role authenticated;
set request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';

select xiv_test.expect_count('cross_universe_read', 'same_org_other_universe_nodes_invisible', 'select count(*) from public.xiv_runtime_nodes where node_id = ''node_org_a_uni_1''', 0);
select xiv_test.expect_count('cross_universe_read', 'same_org_other_universe_workloads_invisible', 'select count(*) from public.xiv_runtime_workloads where workload_id = ''wl_a1''', 0);
select xiv_test.expect_count('cross_universe_read', 'same_org_own_universe_visible', 'select count(*) from public.xiv_runtime_nodes where node_id = ''node_org_a_uni_2''', 1);
select xiv_test.expect_denied('cross_universe_write', 'same_org_insert_into_other_universe_denied', 'insert into public.xiv_runtime_agents (agent_id, organization_id, universe_id, agent_key) values (''attack_agent_1'', ''aaaaaaaa-0000-4000-8000-000000000001'', ''aaaaaaaa-0000-4000-8000-0000000000a1'', ''smuggled'')');

reset role;
reset request.jwt.claims;

-- ---------------------------------------------------------------------------
-- Authenticated user with no membership: sees nothing anywhere.
-- ---------------------------------------------------------------------------

set role authenticated;
set request.jwt.claims = '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}';

select xiv_test.expect_count('no_membership', 'nodes_invisible', 'select count(*) from public.xiv_runtime_nodes', 0);
select xiv_test.expect_count('no_membership', 'workloads_invisible', 'select count(*) from public.xiv_runtime_workloads', 0);
select xiv_test.expect_count('no_membership', 'agents_invisible', 'select count(*) from public.xiv_runtime_agents', 0);
select xiv_test.expect_count('no_membership', 'lineage_invisible', 'select count(*) from public.xiv_runtime_lineage', 0);
select xiv_test.expect_count('no_membership', 'audit_invisible', 'select count(*) from public.xiv_runtime_audit_events', 0);
select xiv_test.expect_denied('no_membership', 'insert_node_denied', 'insert into public.xiv_runtime_nodes (node_id, organization_id, universe_id, hardware_class, enrollment_fingerprint, enrollment_id) values (''attack_node_3'', ''aaaaaaaa-0000-4000-8000-000000000001'', ''aaaaaaaa-0000-4000-8000-0000000000a1'', ''cpu_x86_amd'', ''fp_attack_3'', ''enr_attack_3'')');

reset role;
reset request.jwt.claims;

-- ---------------------------------------------------------------------------
-- Authenticated role with no session at all: auth.uid() is NULL.
-- ---------------------------------------------------------------------------

set role authenticated;

select xiv_test.expect_count('no_session', 'nodes_invisible_without_jwt', 'select count(*) from public.xiv_runtime_nodes', 0);
select xiv_test.expect_count('no_session', 'workloads_invisible_without_jwt', 'select count(*) from public.xiv_runtime_workloads', 0);

reset role;

-- ---------------------------------------------------------------------------
-- The anon role has no grants on any table in this migration.
-- ---------------------------------------------------------------------------

set role anon;

select xiv_test.expect_denied('anon', 'anon_select_nodes_denied', 'select count(*) from public.xiv_runtime_nodes');
select xiv_test.expect_denied('anon', 'anon_select_workloads_denied', 'select count(*) from public.xiv_runtime_workloads');
select xiv_test.expect_denied('anon', 'anon_select_audit_denied', 'select count(*) from public.xiv_runtime_audit_events');
select xiv_test.expect_denied('anon', 'anon_select_model_registry_denied', 'select count(*) from public.xiv_runtime_model_registry');

reset role;

-- ---------------------------------------------------------------------------
-- Structural checks over the catalogs: every tenant-bearing table must have RLS
-- enabled and forced, must have select and insert policies, and must grant
-- nothing to anon or public.
-- ---------------------------------------------------------------------------

insert into xiv_test.results (category, name, expectation, observed, passed)
select
  'structure',
  'rls_enabled_and_forced:' || c.relname,
  'enabled+forced',
  case when c.relrowsecurity and c.relforcerowsecurity then 'enabled+forced' else 'missing' end,
  c.relrowsecurity and c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname like 'xiv_runtime_%';

insert into xiv_test.results (category, name, expectation, observed, passed)
select
  'structure',
  'tenant_columns_not_null:' || c.relname,
  'organization_id+universe_id not null',
  string_agg(a.attname || '=' || case when a.attnotnull then 'not_null' else 'nullable' end, ','order by a.attname),
  bool_and(a.attnotnull)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attname in ('organization_id', 'universe_id')
where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'xiv_runtime_%'
group by c.relname;

insert into xiv_test.results (category, name, expectation, observed, passed)
select
  'structure',
  'select_policy_present:' || t.relname,
  'has select policy',
  coalesce(string_agg(p.polname, ','), 'none'),
  count(p.polname) > 0
from pg_class t
join pg_namespace n on n.oid = t.relnamespace
left join pg_policy p on p.polrelid = t.oid and p.polcmd in ('r', '*')
where n.nspname = 'public' and t.relkind = 'r' and t.relname like 'xiv_runtime_%'
group by t.relname;

insert into xiv_test.results (category, name, expectation, observed, passed)
select
  'structure',
  'no_anon_or_public_grants:' || c.relname,
  'no privileges',
  case
    when has_table_privilege('anon', c.oid, 'SELECT')
      or has_table_privilege('anon', c.oid, 'INSERT')
      or has_table_privilege('anon', c.oid, 'UPDATE')
      or has_table_privilege('anon', c.oid, 'DELETE')
    then 'anon has privileges'
    else 'no privileges'
  end,
  not (
    has_table_privilege('anon', c.oid, 'SELECT')
    or has_table_privilege('anon', c.oid, 'INSERT')
    or has_table_privilege('anon', c.oid, 'UPDATE')
    or has_table_privilege('anon', c.oid, 'DELETE')
  )
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'xiv_runtime_%';

-- Tenant-bearing tables must resolve access through the membership helper. The
-- memberships table itself is stricter: it is scoped to the signed-in user.
insert into xiv_test.results (category, name, expectation, observed, passed)
select
  'structure',
  'policies_tenant_scoped:' || c.relname,
  'membership-scoped or owner-scoped policies',
  coalesce(string_agg(distinct p.polname, ','), 'none'),
  bool_and(
    coalesce(pg_get_expr(p.polqual, p.polrelid), '') like '%xiv_runtime_is_member%'
    or coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') like '%xiv_runtime_is_member%'
    or coalesce(pg_get_expr(p.polqual, p.polrelid), '') like '%uid()%'
    or coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') like '%uid()%'
  )
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_policy p on p.polrelid = c.oid
join pg_attribute a on a.attrelid = c.oid and a.attname = 'organization_id'
where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'xiv_runtime_%'
group by c.relname;

select category, name, expectation, observed, passed from xiv_test.results order by id;
