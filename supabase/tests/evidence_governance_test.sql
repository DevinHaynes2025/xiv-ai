-- 2I-AI-62D (governance) — negative tests for evidence, verification and ownership.
--
-- FOUNDER: run this in the hosted Supabase SQL editor (or psql as the postgres
-- role) AFTER applying 20260909120000_evidence_verification_ownership.sql. It
-- runs inside one transaction and ends with ROLLBACK, so it leaves nothing
-- behind. The first violated expectation raises and aborts.
--
-- What it proves. The service layer in services/ai/evidence refuses all of the
-- moves below, and its own tests cover that. This file exists because the
-- service layer is not the only way into the database: PostgREST is. So every
-- rule that would matter if somebody wrote to the table directly is proved
-- against the table directly.
--
--   * evidence cannot be edited or deleted after it is written
--   * a level cannot be claimed, only earned; E4 cannot be written at all
--   * nobody verifies their own evidence
--   * nobody approves a release-critical gate whose evidence they produced
--   * hard blockers refuse exceptions
--   * an exception with no future expiry, or a self-reviewed one, is refused
--   * credential-shaped strings never enter the evidence trail
--   * PASS is computed from evidence and cannot be written
--   * a skipped mandatory test is not a pass
--   * evidence for one commit does not pass another commit
--   * evidence goes stale when something it depended on changes
--   * the whole thing is tenant-isolated, and invisible to anon

begin;

set local role postgres;

select set_config('xiv.suite', '62D-evidence-governance', true);

create or replace function pg_temp.xiv_evidence(
  label text, expected text, actual text, status text, kind text
)
returns void
language plpgsql
as $$
begin
  raise notice 'XIV-EVIDENCE|%|%|%|%|%|%',
    coalesce(current_setting('xiv.suite', true), 'unknown'),
    replace(label, '|', '/'), expected, actual, status, kind;
end;
$$;

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
    when insufficient_privilege or check_violation or raise_exception
      or not_null_violation or foreign_key_violation or unique_violation then
      perform pg_temp.xiv_evidence(label, 'DENIED', 'DENIED (refused)', 'pass', 'negative');
      return;
  end;

  if affected = 0 then
    perform pg_temp.xiv_evidence(label, 'DENIED', 'DENIED (no row visible)', 'pass', 'negative');
    return;
  end if;

  perform pg_temp.xiv_evidence(label, 'DENIED', 'ALLOWED (' || affected || ' rows)', 'fail', 'negative');
  raise exception 'XIV EVIDENCE TEST FAILED: % changed % row(s) but must be blocked', label, affected;
end;
$$;

create or replace function pg_temp.xiv_expect_value(query text, expected text, label text)
returns void
language plpgsql
as $$
declare
  actual text;
begin
  execute query into actual;
  if actual is distinct from expected then
    perform pg_temp.xiv_evidence(label, expected, coalesce(actual, 'null'), 'fail', 'positive');
    raise exception 'XIV EVIDENCE TEST FAILED: % (expected %, saw %)', label, expected, coalesce(actual, 'null');
  end if;
  perform pg_temp.xiv_evidence(label, expected, coalesce(actual, 'null'), 'pass', 'positive');
end;
$$;

create or replace function pg_temp.xiv_expect_rows(query text, expected bigint, label text)
returns void
language plpgsql
as $$
declare
  actual bigint;
begin
  execute format('select count(*) from (%s) as counted', query) into actual;
  if actual <> expected then
    perform pg_temp.xiv_evidence(label, expected || ' rows', actual || ' rows', 'fail',
      case when expected = 0 then 'negative' else 'positive' end);
    raise exception 'XIV EVIDENCE TEST FAILED: % (expected % rows, saw %)', label, expected, actual;
  end if;
  perform pg_temp.xiv_evidence(label, expected || ' rows', actual || ' rows', 'pass',
    case when expected = 0 then 'negative' else 'positive' end);
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
-- Fixtures
-- ---------------------------------------------------------------------------
--
-- Four people, because section 36 needs four distinct hands to be provable: an
-- owner who produces the evidence, an independent verifier, an approver who did
-- neither, and an outsider from another tenant.

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('e1111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ev.owner@xiv.test', '', now(), now(), now()),
  ('e2222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ev.verifier@xiv.test', '', now(), now(), now()),
  ('e3333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ev.approver@xiv.test', '', now(), now(), now()),
  ('e4444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ev.outsider@xiv.test', '', now(), now(), now())
on conflict (id) do nothing;

insert into public.universe_lifecycle (id, organization_id, name, created_by, lifecycle_stage)
values
  ('ea000000-0000-4000-8000-00000000000a', 'ea000000-0000-4000-8000-0000000000fa', 'Evidence Universe A', 'e1111111-1111-4111-8111-111111111111', 'operational'),
  ('eb000000-0000-4000-8000-00000000000b', 'eb000000-0000-4000-8000-0000000000fb', 'Evidence Universe B', 'e4444444-4444-4444-8444-444444444444', 'operational');

insert into public.universe_memberships (universe_id, organization_id, user_id, membership_role, is_supervisor)
values
  ('ea000000-0000-4000-8000-00000000000a', 'ea000000-0000-4000-8000-0000000000fa', 'e1111111-1111-4111-8111-111111111111', 'supervisor', true),
  ('ea000000-0000-4000-8000-00000000000a', 'ea000000-0000-4000-8000-0000000000fa', 'e2222222-2222-4222-8222-222222222222', 'supervisor', true),
  ('ea000000-0000-4000-8000-00000000000a', 'ea000000-0000-4000-8000-0000000000fa', 'e3333333-3333-4333-8333-333333333333', 'supervisor', true),
  ('eb000000-0000-4000-8000-00000000000b', 'eb000000-0000-4000-8000-0000000000fb', 'e4444444-4444-4444-8444-444444444444', 'supervisor', true);

insert into public.release_gates (
  id, universe_id, gate_key, title, owner_role, verifier_role,
  required_evidence_level, human_approval_rule, threshold, release_critical, hard_blocker,
  assigned_owner_id, assigned_verifier_id, created_by
)
values
  ('e6000000-0000-4000-8000-00000000000a', 'ea000000-0000-4000-8000-00000000000a', 'rls',
   'Row level security', 'Database', 'Security', 'E3', 'exception_only', '100%', true, false,
   'e1111111-1111-4111-8111-111111111111', 'e2222222-2222-4222-8222-222222222222',
   'e1111111-1111-4111-8111-111111111111'),
  ('e6000000-0000-4000-8000-00000000000c', 'ea000000-0000-4000-8000-00000000000a', 'no_confirmed_cross_tenant_exposure',
   'No confirmed cross-tenant exposure', 'Database/Security', 'independent security verifier',
   'E4', 'none', '0 occurrences', true, true,
   'e1111111-1111-4111-8111-111111111111', 'e2222222-2222-4222-8222-222222222222',
   'e1111111-1111-4111-8111-111111111111'),
  ('e6000000-0000-4000-8000-00000000000d', 'ea000000-0000-4000-8000-00000000000a', 'compute_routing',
   'Compute routing', 'Runtime Platform', 'QA', 'E2', 'none', '>=99.9%', false, false,
   'e1111111-1111-4111-8111-111111111111', 'e2222222-2222-4222-8222-222222222222',
   'e1111111-1111-4111-8111-111111111111');

insert into public.evidence_records (
  id, universe_id, gate_id, test_run_id, repository, branch, commit_sha, environment,
  test_suite, test_case, expected_result, actual_result, status, evidence_level,
  executor_type, executor_id, evidence_location, evidence_hash, reproduction_command,
  primary_owner, created_by
)
values (
  'e7000000-0000-4000-8000-00000000000a', 'ea000000-0000-4000-8000-00000000000a',
  'e6000000-0000-4000-8000-00000000000a', 'e8000000-0000-4000-8000-00000000000a',
  'xiv', 'main', 'c0ffee1234567890', 'local-postgres',
  'rls-matrix', 'agent_registry :: SELECT ORG_A -> ORG_B', 'DENY', 'DENY (0 rows)', 'pass', 'E3',
  'database', 'postgres-16', 'xiv-evidence/rls/matrix.jsonl',
  '9f2c1d5a0b3e4f6789abcdef0123456789abcdef0123456789abcdef01234567',
  './supabase/tests/run-local.sh',
  'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'
);

-- ---------------------------------------------------------------------------
-- 1. anon has no reach at all
-- ---------------------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

select pg_temp.xiv_expect_blocked($$select id from public.release_gates$$, 'anon select on release_gates');
select pg_temp.xiv_expect_blocked($$select id from public.evidence_records$$, 'anon select on evidence_records');
select pg_temp.xiv_expect_blocked($$select id from public.evidence_approvals$$, 'anon select on evidence_approvals');
select pg_temp.xiv_expect_blocked($$select id from public.evidence_exceptions$$, 'anon select on evidence_exceptions');

-- ---------------------------------------------------------------------------
-- 2. Tenant isolation
-- ---------------------------------------------------------------------------

set local role authenticated;
select pg_temp.xiv_act_as('e4444444-4444-4444-8444-444444444444');

select pg_temp.xiv_expect_rows('select 1 from public.release_gates', 0,
  'universe B cannot see universe A release gates');
select pg_temp.xiv_expect_rows('select 1 from public.evidence_records', 0,
  'universe B cannot see universe A evidence');

-- An outsider cannot file evidence into another tenant's gate even naming it
-- exactly, because the gate is invisible and the policy is on the universe.
select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_records (
    universe_id, gate_id, test_run_id, repository, branch, commit_sha, environment,
    test_suite, test_case, expected_result, actual_result, status, evidence_level,
    executor_type, executor_id, evidence_location, evidence_hash, primary_owner, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000a',
          gen_random_uuid(), 'xiv', 'main', 'c0ffee1234567890', 'local',
          'forged', 'forged', 'PASS', 'PASS', 'pass', 'E1', 'human', 'outsider',
          'nowhere', 'deadbeef', 'e4444444-4444-4444-8444-444444444444',
          'e4444444-4444-4444-8444-444444444444')
$$, 'an outsider filing evidence into another tenant''s gate');

-- ---------------------------------------------------------------------------
-- 3. Evidence is tamper-evident
-- ---------------------------------------------------------------------------

select pg_temp.xiv_act_as('e1111111-1111-4111-8111-111111111111');

select pg_temp.xiv_expect_blocked($$
  update public.evidence_records set status = 'pass'
  where id = 'e7000000-0000-4000-8000-00000000000a'
$$, 'rewriting the status of an evidence record');

select pg_temp.xiv_expect_blocked($$
  update public.evidence_records set commit_sha = 'feedface12345678'
  where id = 'e7000000-0000-4000-8000-00000000000a'
$$, 'repointing an evidence record at a different commit');

select pg_temp.xiv_expect_blocked($$
  update public.evidence_records set actual_result = 'DENY (0 rows)  -- tidied up'
  where id = 'e7000000-0000-4000-8000-00000000000a'
$$, 'editing what actually happened');

select pg_temp.xiv_expect_blocked($$
  delete from public.evidence_records where id = 'e7000000-0000-4000-8000-00000000000a'
$$, 'deleting an inconvenient evidence record');

-- ---------------------------------------------------------------------------
-- 4. Levels are earned, not claimed
-- ---------------------------------------------------------------------------

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_records (
    universe_id, gate_id, test_run_id, repository, branch, commit_sha, environment,
    test_suite, test_case, expected_result, actual_result, status, evidence_level,
    executor_type, executor_id, evidence_location, evidence_hash, reproduction_command,
    primary_owner, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000a',
          gen_random_uuid(), 'xiv', 'main', 'c0ffee1234567890', 'local',
          'suite', 'case', 'PASS', 'PASS', 'pass', 'E4', 'ci', 'runner',
          'xiv-evidence/x.json', 'abc123', './run.sh',
          'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111')
$$, 'writing E4 directly instead of earning it by independent verification');

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_records (
    universe_id, gate_id, test_run_id, repository, branch, commit_sha, environment,
    test_suite, test_case, expected_result, actual_result, status, evidence_level,
    executor_type, executor_id, evidence_location, evidence_hash, reproduction_command,
    primary_owner, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000a',
          gen_random_uuid(), 'xiv', 'main', 'c0ffee1234567890', 'local',
          'suite', 'case', 'PASS', 'PASS', 'pass', 'E3', 'agent', 'agent-7',
          'xiv-evidence/x.json', 'abc123', './run.sh',
          'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111')
$$, 'an agent''s own account of its success claiming to be system-generated evidence');

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_records (
    universe_id, gate_id, test_run_id, repository, branch, commit_sha, environment,
    test_suite, test_case, expected_result, actual_result, status, evidence_level,
    executor_type, executor_id, evidence_location, evidence_hash,
    primary_owner, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000a',
          gen_random_uuid(), 'xiv', 'main', 'c0ffee1234567890', 'local',
          'suite', 'case', 'PASS', 'PASS', 'pass', 'E3', 'ci', 'runner',
          'xiv-evidence/x.json', 'abc123',
          'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111')
$$, 'E3 without a command anyone else could re-run');

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_records (
    universe_id, gate_id, test_run_id, repository, branch, commit_sha, environment,
    test_suite, test_case, expected_result, actual_result, status, evidence_level,
    executor_type, executor_id, evidence_location, evidence_hash, reproduction_command,
    primary_owner, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000a',
          gen_random_uuid(), 'xiv', 'main', 'wip', 'local',
          'suite', 'case', 'PASS', 'PASS', 'pass', 'E2', 'ci', 'runner',
          'xiv-evidence/x.json', 'abc123', './run.sh',
          'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111')
$$, 'an automated result that does not identify the source revision');

-- ---------------------------------------------------------------------------
-- 5. No secrets in the evidence trail
-- ---------------------------------------------------------------------------

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_records (
    universe_id, gate_id, test_run_id, repository, branch, commit_sha, environment,
    test_suite, test_case, expected_result, actual_result, status, evidence_level,
    executor_type, executor_id, evidence_location, evidence_hash, reproduction_command,
    primary_owner, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000a',
          gen_random_uuid(), 'xiv', 'main', 'c0ffee1234567890', 'local',
          'auth', 'login returns a session', 'a token', 'Bearer abcdefghijklmnopqrstuvwxyz012345',
          'pass', 'E3', 'ci', 'runner', 'xiv-evidence/auth.json', 'abc123', './run.sh',
          'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111')
$$, 'pasting a bearer token into an evidence artifact');

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_records (
    universe_id, gate_id, test_run_id, repository, branch, commit_sha, environment,
    test_suite, test_case, expected_result, actual_result, status, evidence_level,
    executor_type, executor_id, evidence_location, evidence_hash, reproduction_command,
    primary_owner, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000a',
          gen_random_uuid(), 'xiv', 'main', 'c0ffee1234567890', 'local',
          'db', 'restore succeeds', 'connected', 'connected',
          'pass', 'E3', 'ci', 'runner',
          'postgresql://xiv:hunter2@db.internal:5432/prod', 'abc123', './run.sh',
          'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111')
$$, 'recording a credentialed connection string as the evidence location');

-- ---------------------------------------------------------------------------
-- 6. Separation of duties
-- ---------------------------------------------------------------------------

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_verifications (
    universe_id, evidence_id, verifier_id, verifier_role, verdict, rationale, checked_commit_sha)
  values ('ea000000-0000-4000-8000-00000000000a', 'e7000000-0000-4000-8000-00000000000a',
          'e1111111-1111-4111-8111-111111111111', 'Security', 'satisfies',
          'I wrote it and I am satisfied with it', 'c0ffee1234567890')
$$, 'the owner of a result verifying their own result');

-- A verification is first-person: the policy pins verifier_id to the caller, so
-- one member cannot record a verification in another member's name.
select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_verifications (
    universe_id, evidence_id, verifier_id, verifier_role, verdict, rationale, checked_commit_sha)
  values ('ea000000-0000-4000-8000-00000000000a', 'e7000000-0000-4000-8000-00000000000a',
          'e2222222-2222-4222-8222-222222222222', 'Security', 'satisfies',
          'signed on their behalf', 'c0ffee1234567890')
$$, 'filing a verification in another person''s name');

-- The genuine article, by somebody who did not produce the evidence.
select pg_temp.xiv_act_as('e2222222-2222-4222-8222-222222222222');
insert into public.evidence_verifications (
  universe_id, evidence_id, verifier_id, verifier_role, verdict, rationale, checked_commit_sha)
values ('ea000000-0000-4000-8000-00000000000a', 'e7000000-0000-4000-8000-00000000000a',
        'e2222222-2222-4222-8222-222222222222', 'Security', 'satisfies',
        're-ran the matrix at this commit and read the artifact', 'c0ffee1234567890');

select pg_temp.xiv_expect_value(
  $$select public.xiv_evidence_effective_level('e7000000-0000-4000-8000-00000000000a')$$,
  'E4', 'independent verification is what raises E3 to E4');

-- Now the approval side. The owner produced the evidence, so they may not
-- approve the gate; the verifier confirmed it, so neither may they.
select pg_temp.xiv_act_as('e1111111-1111-4111-8111-111111111111');
select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_approvals (
    universe_id, gate_id, approver_id, approval_kind, decision, rationale, commit_sha)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000a',
          'e1111111-1111-4111-8111-111111111111', 'gate', 'approved',
          'my evidence, my approval', 'c0ffee1234567890')
$$, 'approving a release-critical gate whose evidence you produced');

select pg_temp.xiv_act_as('e2222222-2222-4222-8222-222222222222');
select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_approvals (
    universe_id, gate_id, approver_id, approval_kind, decision, rationale, commit_sha)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000a',
          'e2222222-2222-4222-8222-222222222222', 'gate', 'approved',
          'I verified it so I will approve it too', 'c0ffee1234567890')
$$, 'approving a release-critical gate whose evidence you verified');

-- ---------------------------------------------------------------------------
-- 7. Exception governance
-- ---------------------------------------------------------------------------

select pg_temp.xiv_act_as('e1111111-1111-4111-8111-111111111111');

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_exceptions (
    universe_id, gate_id, severity, risk, reason, scope, compensating_control,
    owner_id, reviewer_id, expires_at, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000c',
          'critical', 'tenants can read each other', 'shipping deadline', 'all tenants',
          'we will watch the logs',
          'e1111111-1111-4111-8111-111111111111', 'e2222222-2222-4222-8222-222222222222',
          now() + interval '30 days', 'e1111111-1111-4111-8111-111111111111')
$$, 'filing an exception against confirmed cross-tenant exposure');

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_exceptions (
    universe_id, gate_id, severity, risk, reason, scope, compensating_control,
    owner_id, reviewer_id, expires_at, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000d',
          'low', 'routing is unproven', 'not yet built', 'routing only', 'manual routing',
          'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111',
          now() + interval '30 days', 'e1111111-1111-4111-8111-111111111111')
$$, 'an exception reviewed by the person who owns the gap');

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_exceptions (
    universe_id, gate_id, severity, risk, reason, scope, compensating_control,
    owner_id, reviewer_id, expires_at, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000d',
          'low', 'routing is unproven', 'not yet built', 'routing only', 'manual routing',
          'e1111111-1111-4111-8111-111111111111', 'e2222222-2222-4222-8222-222222222222',
          now() - interval '1 day', 'e1111111-1111-4111-8111-111111111111')
$$, 'an exception that expired before it was filed');

-- ---------------------------------------------------------------------------
-- 8. Gate state is computed, never written
-- ---------------------------------------------------------------------------
--
-- release_gates has no state column at all, so there is nothing to write. The
-- checks below establish that the computed answer moves for the right reasons.

select pg_temp.xiv_expect_value(
  $$select public.xiv_gate_state('e6000000-0000-4000-8000-00000000000a', 'c0ffee1234567890')$$,
  'PASS', 'a verified E3 result at this commit passes an E3 gate');

-- Section 38: the same evidence says nothing about a different commit.
select pg_temp.xiv_expect_value(
  $$select public.xiv_gate_state('e6000000-0000-4000-8000-00000000000a', 'ba5eba11deadbeef')$$,
  'EVIDENCE_PENDING', 'evidence for one commit does not pass another commit');

-- A gate nobody has produced anything for is not quietly fine.
select pg_temp.xiv_expect_value(
  $$select public.xiv_gate_state('e6000000-0000-4000-8000-00000000000d', 'c0ffee1234567890')$$,
  'ASSIGNED', 'a gate with an owner and no evidence is ASSIGNED, not PASS');

-- A hard blocker with no evidence at all is not PASS either, which is what
-- stops the canary summary from ever being green by omission.
select pg_temp.xiv_expect_value(
  $$select public.xiv_gate_state('e6000000-0000-4000-8000-00000000000c', 'c0ffee1234567890')$$,
  'ASSIGNED', 'an unproven hard blocker is not PASS');

-- An E4 gate holding an E3 artifact is waiting for a reviewer, not for a test
-- run, and says so. Reporting it as EVIDENCE_PENDING would send the owner back
-- to work that is already done.
insert into public.evidence_records (
  id, universe_id, gate_id, test_run_id, repository, branch, commit_sha, environment,
  test_suite, test_case, expected_result, actual_result, status, evidence_level,
  executor_type, executor_id, evidence_location, evidence_hash, reproduction_command,
  primary_owner, created_by)
values ('e7000000-0000-4000-8000-00000000000c', 'ea000000-0000-4000-8000-00000000000a',
        'e6000000-0000-4000-8000-00000000000c', 'e8000000-0000-4000-8000-00000000000c',
        'xiv', 'main', 'c0ffee1234567890', 'local-postgres',
        'rls-matrix', 'every tenant-bearing table :: cross-tenant matrix', 'DENY', 'DENY on all 39 tables',
        'pass', 'E3', 'database', 'postgres-16', 'xiv-evidence/tenant-isolation/matrix.jsonl',
        'bb17c0de0000000000000000000000000000000000000000000000000000beef',
        './supabase/tests/run-local.sh',
        'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111');

select pg_temp.xiv_expect_value(
  $$select public.xiv_gate_state('e6000000-0000-4000-8000-00000000000c', 'c0ffee1234567890')$$,
  'VERIFICATION_PENDING', 'an E4 gate with an unreviewed E3 artifact is waiting on a reviewer');

-- Section 35 counts "no unresolved blocker" as part of E4, so an open critical
-- failure takes the level back down and the gate with it.
insert into public.evidence_failures (
  id, universe_id, gate_id, test_suite, test_case, commit_sha, environment, failure, severity, owner_id)
values ('e9000000-0000-4000-8000-00000000000c', 'ea000000-0000-4000-8000-00000000000a',
        'e6000000-0000-4000-8000-00000000000c', 'rls-matrix',
        'agent_meeting_messages :: DELETE ORG_A -> ORG_B', 'c0ffee1234567890', 'local-postgres',
        'the delete crossed the tenant boundary on one run in twenty', 'critical',
        'e1111111-1111-4111-8111-111111111111');

select pg_temp.xiv_expect_value(
  $$select public.xiv_gate_state('e6000000-0000-4000-8000-00000000000c', 'c0ffee1234567890')$$,
  'EVIDENCE_PENDING', 'an open critical failure holds the evidence below the level the gate needs');

-- Section 53: closing it takes a passing artifact at the commit that claims the
-- fix, not a rerun and a shrug.
select pg_temp.xiv_expect_blocked($$
  update public.evidence_failures
  set closed_at = now(), root_cause = 'flaky', remediation = 'ran it again'
  where id = 'e9000000-0000-4000-8000-00000000000c'
$$, 'closing a failure with no retest artifact');

select pg_temp.xiv_expect_blocked($$
  update public.evidence_failures
  set closed_at = now(), root_cause = 'a missing tenant predicate', remediation = 'added the predicate',
      fix_commit = 'ba5eba11deadbeef', retest_evidence_id = 'e7000000-0000-4000-8000-00000000000c'
  where id = 'e9000000-0000-4000-8000-00000000000c'
$$, 'closing a failure with a retest taken against a different commit');

update public.evidence_failures
set closed_at = now(),
    root_cause = 'the delete policy checked membership but not the tenant of the target row',
    remediation = 'added the tenant predicate and a matrix case that fails without it',
    fix_commit = 'c0ffee1234567890',
    retest_evidence_id = 'e7000000-0000-4000-8000-00000000000c',
    verification = '500 iterations with no crossing'
where id = 'e9000000-0000-4000-8000-00000000000c';

select pg_temp.xiv_act_as('e2222222-2222-4222-8222-222222222222');
insert into public.evidence_verifications (
  universe_id, evidence_id, verifier_id, verifier_role, verdict, rationale, checked_commit_sha)
values ('ea000000-0000-4000-8000-00000000000a', 'e7000000-0000-4000-8000-00000000000c',
        'e2222222-2222-4222-8222-222222222222', 'independent security verifier', 'satisfies',
        'reproduced the matrix on a clean database and compared the artifact hash', 'c0ffee1234567890');

select pg_temp.xiv_expect_value(
  $$select public.xiv_gate_state('e6000000-0000-4000-8000-00000000000c', 'c0ffee1234567890')$$,
  'PASS', 'a reviewed E3 artifact with no open blocker earns E4 and passes an E4 gate');

select pg_temp.xiv_act_as('e1111111-1111-4111-8111-111111111111');

-- Section 39: a skipped mandatory test is not a pass, and it outranks the
-- passing evidence sitting beside it.
insert into public.evidence_records (
  universe_id, gate_id, test_run_id, repository, branch, commit_sha, environment,
  test_suite, test_case, expected_result, actual_result, status, evidence_level, mandatory,
  executor_type, executor_id, evidence_location, evidence_hash, reproduction_command,
  primary_owner, created_by)
values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000a',
        'e8000000-0000-4000-8000-00000000000a', 'xiv', 'main', 'c0ffee1234567890', 'local-postgres',
        'rls-matrix', 'storage buckets :: cross-tenant read', 'DENY', 'not run', 'skipped', 'E2', true,
        'ci', 'runner', 'xiv-evidence/rls/skipped.json', 'abc123', './supabase/tests/run-local.sh',
        'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111');

select pg_temp.xiv_expect_value(
  $$select public.xiv_gate_state('e6000000-0000-4000-8000-00000000000a', 'c0ffee1234567890')$$,
  'EVIDENCE_PENDING', 'a skipped mandatory test drops the gate out of PASS');

-- ---------------------------------------------------------------------------
-- 9. Freshness
-- ---------------------------------------------------------------------------

select pg_temp.xiv_expect_value(
  $$select public.xiv_evidence_freshness('e7000000-0000-4000-8000-00000000000a')$$,
  'VALID', 'evidence is fresh while nothing it depends on has moved');

-- occurred_at is set explicitly rather than defaulted. now() is the transaction
-- start time, so inside a single test transaction the change would appear to
-- have happened at the same instant as the evidence it invalidates; in
-- production the two arrive in different transactions and differ naturally.
insert into public.evidence_revalidations (
  universe_id, trigger_kind, detail, to_commit_sha, affects_gate_id, declared_by, occurred_at)
values ('ea000000-0000-4000-8000-00000000000a', 'rls_policy_change',
        'agent_registry select policy rewritten', 'ba5eba11deadbeef',
        'e6000000-0000-4000-8000-00000000000a', 'e1111111-1111-4111-8111-111111111111',
        now() + interval '1 minute');

select pg_temp.xiv_expect_value(
  $$select public.xiv_evidence_freshness('e7000000-0000-4000-8000-00000000000a')$$,
  'STALE', 'an RLS policy change makes the RLS evidence stale');

select pg_temp.xiv_expect_value(
  $$select public.xiv_gate_state('e6000000-0000-4000-8000-00000000000a', 'c0ffee1234567890')$$,
  'EVIDENCE_PENDING', 'a gate does not stay green on stale evidence');

-- ---------------------------------------------------------------------------
-- 10. Only supervisors declare gates, and nobody forges authorship
-- ---------------------------------------------------------------------------

-- The outsider is admitted to Universe A as an ordinary participant, so what
-- follows tests privilege rather than tenancy: they can see the gates now, and
-- still cannot declare one, approve one, or file evidence as somebody else.
-- Seeded as postgres because it is fixture setup, not one of the assertions.
set local role postgres;
insert into public.universe_memberships (universe_id, organization_id, user_id, membership_role, is_supervisor)
values ('ea000000-0000-4000-8000-00000000000a', 'ea000000-0000-4000-8000-0000000000fa',
        'e4444444-4444-4444-8444-444444444444', 'participant', false)
on conflict (universe_id, user_id) do nothing;

set local role authenticated;
select pg_temp.xiv_act_as('e4444444-4444-4444-8444-444444444444');

select pg_temp.xiv_expect_blocked($$
  insert into public.release_gates (
    universe_id, gate_key, title, owner_role, verifier_role, required_evidence_level, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'invented_gate', 'Invented',
          'me', 'me', 'E0', 'e4444444-4444-4444-8444-444444444444')
$$, 'a non-supervisor declaring a release gate');

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_approvals (
    universe_id, gate_id, approver_id, approval_kind, decision, rationale, commit_sha)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000d',
          'e3333333-3333-4333-8333-333333333333', 'canary', 'approved',
          'the CEO would have said yes', 'c0ffee1234567890')
$$, 'recording a human approval in somebody else''s name');

select pg_temp.xiv_expect_blocked($$
  insert into public.evidence_records (
    universe_id, gate_id, test_run_id, repository, branch, commit_sha, environment,
    test_suite, test_case, expected_result, actual_result, status, evidence_level,
    executor_type, executor_id, evidence_location, evidence_hash, primary_owner, created_by)
  values ('ea000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-00000000000d',
          gen_random_uuid(), 'xiv', 'main', 'c0ffee1234567890', 'local',
          'suite', 'case', 'PASS', 'PASS', 'pass', 'E1', 'human', 'someone-else',
          'note.md', 'abc123', 'e1111111-1111-4111-8111-111111111111',
          'e1111111-1111-4111-8111-111111111111')
$$, 'filing evidence under another member''s authorship');

set local role postgres;

do $$
begin
  raise notice 'XIV EVIDENCE GOVERNANCE TESTS PASSED';
end;
$$;

rollback;
