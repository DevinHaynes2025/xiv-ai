-- 2I-AI-62D (governance) — Test Evidence, Verification & Ownership
-- FOUNDER: run this file in the hosted Supabase SQL editor AFTER
--   20260908120000_agent_civilization_foundation.sql and
--   20260908180000_agent_meetings_collective_reasoning.sql.
-- This workspace cannot apply it remotely. Until it is applied, PostgREST returns
-- PGRST205 for these relations and the clients must surface that honestly.
-- After this file succeeds, also run:
--   NOTIFY pgrst, 'reload schema';
--
-- What this file is for.
--
-- 62A and 62B produced code and tests. Neither produced evidence. The difference
-- matters: a test that passed and was never recorded proves nothing tomorrow,
-- and "the suite is green" written by the same party that wrote the suite is a
-- claim, not a verification. This file gives XIV somewhere to put the proof, and
-- makes the database — not the caller — decide whether a gate has actually been
-- satisfied.
--
-- The rules that are enforced here rather than in the service layer, because a
-- direct PostgREST write must not be able to skip them:
--
--   * Evidence records are tamper-evident. The fields that carry the meaning of
--     a result cannot be edited after insert. A wrong record is superseded, not
--     rewritten.
--   * The same person cannot be owner and independent verifier of one record,
--     nor approve a critical gate they owned or verified (section 36).
--   * Hard blockers cannot be waived by an exception (section 54).
--   * A gate's state is computed from its evidence by xiv_gate_state, so no
--     caller can write PASS. TBD is not PASS and neither is a skipped mandatory
--     test (sections 39, 56, 57).
--   * Evidence is bound to one exact commit. It does not travel to another
--     commit unless an explicit, justified impact analysis carries it there
--     (section 38).
--   * Credential-shaped strings are refused at insert, so the evidence trail
--     cannot become the place secrets leak (sections 34, 47).
--
-- Naming. Nothing here carries an xiv_ prefix on tables, matching the rest of
-- the repository; the xiv_ prefix stays reserved for functions. Evidence is
-- shared core rather than an enterprise workflow, so it lives with the Global
-- operations brain tables and is tenant-scoped the same way they are.
--
-- Re-runnable: create table if not exists, add column if not exists, drop policy
-- if exists then recreate, create or replace function, drop trigger if exists.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. release_gates — the acceptance criteria XIV is held to
-- ---------------------------------------------------------------------------
--
-- One row per criterion in the section 37 ownership matrix. The row records who
-- owns it, what strength of evidence it demands and whether a human must accept
-- the residual risk. It deliberately does not record whether the gate passed:
-- that is derived from the evidence by xiv_gate_state below.

create table if not exists public.release_gates (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  gate_key text not null,
  title text not null,
  section_ref text null,
  owner_role text not null,
  verifier_role text not null,
  required_evidence_level text not null,
  human_approval_rule text not null default 'none',
  threshold text not null default '100%',
  release_critical boolean not null default false,
  hard_blocker boolean not null default false,
  assigned_owner_id uuid null references auth.users (id) on delete set null,
  assigned_verifier_id uuid null references auth.users (id) on delete set null,
  assigned_approver_id uuid null references auth.users (id) on delete set null,
  blocked_reason text null,
  provenance jsonb not null default '{}'::jsonb,
  security_classification text not null default 'internal',
  retention_policy text not null default 'retain-7y-then-review',
  audit_event_id uuid null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint release_gates_key_unique unique (universe_id, gate_key),
  constraint release_gates_level_check check (
    required_evidence_level in ('E0', 'E1', 'E2', 'E3', 'E4')
  ),
  constraint release_gates_approval_rule_check check (
    human_approval_rule in ('none', 'exception_only', 'required', 'ceo')
  ),
  -- A hard blocker is a gate whose failure cannot be traded away: confirmed
  -- cross-tenant exposure, Guardian bypass, unauthorized production action,
  -- exposed production secrets, inability to stop a dangerous workload. Those
  -- are release-critical by definition, so the pair is constrained rather than
  -- left to whoever seeds the row.
  constraint release_gates_hard_blocker_is_critical check (
    hard_blocker = false or release_critical = true
  )
);

-- ---------------------------------------------------------------------------
-- 2. evidence_records — the section 34 evidence contract
-- ---------------------------------------------------------------------------

create table if not exists public.evidence_records (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  gate_id uuid not null references public.release_gates (id) on delete cascade,
  test_run_id uuid not null,

  -- Exact-commit binding (section 38).
  repository text not null,
  branch text not null,
  commit_sha text not null,
  build_id text null,
  artifact_hash text null,
  dependency_lock_hash text null,
  migration_hash text null,
  container_digest text null,
  mobile_build_id text null,
  runtime_version text null,
  configuration_version text null,
  model_registry_version text null,
  policy_version text null,

  environment text not null,
  test_suite text not null,
  test_case text not null,
  test_version text not null default '1',

  expected_result text not null,
  actual_result text not null,
  status text not null,
  -- Section 52. A denial that was expected and observed is evidence in its own
  -- right, and is the only way to prove what XIV refuses to do.
  outcome_kind text not null default 'positive',
  -- Section 39. A skipped mandatory test has to stay visible instead of being
  -- rounded up to PASS, so mandatory-ness is recorded on the record itself.
  mandatory boolean not null default true,

  evidence_level text not null,

  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  duration_ms integer null,

  runtime_node_id uuid null references public.runtime_nodes (id) on delete set null,
  model_id text null,
  model_version text null,
  executor_type text not null,
  executor_id text not null,

  evidence_location text not null,
  evidence_hash text not null,
  -- The command that regenerates the artifact. Section 35 separates an
  -- automated result from system-generated verified evidence partly on whether
  -- a third party can run it again, so it is a column rather than a note.
  reproduction_command text null,

  primary_owner uuid not null references auth.users (id) on delete restrict,
  reviewer uuid null references auth.users (id) on delete set null,
  approval_state text not null default 'not_required',

  exception_id uuid null,
  expires_at timestamptz null,

  -- Freshness bookkeeping (section 55). superseded_by is how a corrected record
  -- replaces a wrong one without anybody editing history.
  superseded_by uuid null references public.evidence_records (id) on delete set null,
  invalidated_at timestamptz null,
  invalidated_reason text null,

  provenance jsonb not null default '{}'::jsonb,
  security_classification text not null default 'internal',
  retention_policy text not null default 'retain-7y-then-review',
  audit_event_id uuid null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint evidence_records_status_check check (
    status in ('pass', 'fail', 'skipped', 'error', 'blocked')
  ),
  constraint evidence_records_level_check check (
    evidence_level in ('E0', 'E1', 'E2', 'E3', 'E4')
  ),
  constraint evidence_records_outcome_kind_check check (
    outcome_kind in ('positive', 'negative')
  ),
  constraint evidence_records_approval_state_check check (
    approval_state in ('not_required', 'pending', 'approved', 'rejected')
  ),
  constraint evidence_records_executor_type_check check (
    executor_type in ('ci', 'human', 'agent', 'runtime', 'database')
  ),
  -- Section 38. E2 and above claim to identify the code under test, so a
  -- placeholder commit is refused rather than accepted and quietly relied on.
  constraint evidence_records_commit_required check (
    evidence_level in ('E0', 'E1') or length(commit_sha) >= 7
  )
);

create index if not exists evidence_records_gate_idx on public.evidence_records (gate_id, commit_sha);
create index if not exists evidence_records_run_idx on public.evidence_records (test_run_id);

-- ---------------------------------------------------------------------------
-- 3. evidence_verifications — the independent VERIFIER (section 36)
-- ---------------------------------------------------------------------------

create table if not exists public.evidence_verifications (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  evidence_id uuid not null references public.evidence_records (id) on delete cascade,
  verifier_id uuid not null references auth.users (id) on delete restrict,
  verifier_role text not null,
  verdict text not null,
  rationale text not null,
  checked_commit_sha text not null,
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null,
  verified_at timestamptz not null default now(),
  constraint evidence_verifications_verdict_check check (
    verdict in ('satisfies', 'insufficient', 'contradicted')
  ),
  constraint evidence_verifications_once unique (evidence_id, verifier_id)
);

-- ---------------------------------------------------------------------------
-- 4. evidence_approvals — the human APPROVER (sections 36, 59)
-- ---------------------------------------------------------------------------

create table if not exists public.evidence_approvals (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  gate_id uuid not null references public.release_gates (id) on delete cascade,
  approver_id uuid not null references auth.users (id) on delete restrict,
  approval_kind text not null,
  decision text not null,
  rationale text not null,
  commit_sha text not null,
  residual_risk text null,
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null,
  decided_at timestamptz not null default now(),
  constraint evidence_approvals_kind_check check (
    approval_kind in ('gate', 'exception', 'staging', 'canary', 'production', 'authority_expansion')
  ),
  constraint evidence_approvals_decision_check check (
    decision in ('approved', 'rejected')
  )
);

-- ---------------------------------------------------------------------------
-- 5. evidence_exceptions — section 54
-- ---------------------------------------------------------------------------

create table if not exists public.evidence_exceptions (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  gate_id uuid not null references public.release_gates (id) on delete cascade,
  severity text not null,
  risk text not null,
  reason text not null,
  scope text not null,
  compensating_control text not null,
  owner_id uuid not null references auth.users (id) on delete restrict,
  reviewer_id uuid not null references auth.users (id) on delete restrict,
  human_approver_id uuid null references auth.users (id) on delete restrict,
  approval_id uuid null references public.evidence_approvals (id) on delete set null,
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint evidence_exceptions_severity_check check (
    severity in ('low', 'medium', 'high', 'critical')
  ),
  -- An exception with no end date is a silent policy change. Section 48 forbids
  -- permanent unexplained suppression, so expiry is mandatory and must be in the
  -- future at the moment it is filed.
  constraint evidence_exceptions_bounded check (expires_at > created_at)
);

-- ---------------------------------------------------------------------------
-- 6. evidence_failures — section 53, the engineering memory
-- ---------------------------------------------------------------------------

create table if not exists public.evidence_failures (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  gate_id uuid null references public.release_gates (id) on delete set null,
  evidence_id uuid null references public.evidence_records (id) on delete set null,
  test_suite text not null,
  test_case text not null,
  commit_sha text not null,
  environment text not null,
  failure text not null,
  severity text not null,
  owner_id uuid not null references auth.users (id) on delete restrict,
  root_cause text null,
  remediation text null,
  fix_commit text null,
  retest_evidence_id uuid null references public.evidence_records (id) on delete set null,
  verification text null,
  closed_at timestamptz null,
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null,
  created_at timestamptz not null default now(),
  constraint evidence_failures_severity_check check (
    severity in ('low', 'medium', 'high', 'critical')
  )
);

-- ---------------------------------------------------------------------------
-- 7. evidence_revalidations — section 55 triggers
-- ---------------------------------------------------------------------------
--
-- A row here says "the world changed in a way that could invalidate what we
-- proved". Freshness is then computed from these rows rather than assumed, so a
-- historic PASS stops counting the moment the thing it depended on moves.

create table if not exists public.evidence_revalidations (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  trigger_kind text not null,
  detail text not null,
  from_commit_sha text null,
  to_commit_sha text null,
  affects_gate_id uuid null references public.release_gates (id) on delete cascade,
  affects_all_gates boolean not null default false,
  declared_by uuid not null references auth.users (id) on delete cascade,
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null,
  occurred_at timestamptz not null default now(),
  constraint evidence_revalidations_trigger_check check (
    trigger_kind in (
      'code_change', 'rls_policy_change', 'schema_change', 'guardian_change',
      'runtime_change', 'model_change', 'dependency_change', 'mobile_build_change',
      'infrastructure_change', 'security_policy_change'
    )
  ),
  constraint evidence_revalidations_target check (
    affects_all_gates = true or affects_gate_id is not null
  )
);

-- ---------------------------------------------------------------------------
-- 8. evidence_manifests — the section 39 CI evidence package
-- ---------------------------------------------------------------------------

create table if not exists public.evidence_manifests (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe_lifecycle (id) on delete cascade,
  organization_id uuid not null,
  test_run_id uuid not null,
  repository text not null,
  branch text not null,
  commit_sha text not null,
  build_id text null,
  environment text not null,
  tests_executed integer not null default 0,
  tests_skipped integer not null default 0,
  passes integer not null default 0,
  failures integer not null default 0,
  warnings integer not null default 0,
  exceptions integer not null default 0,
  artifact_hashes jsonb not null default '{}'::jsonb,
  manifest_hash text not null,
  generated_by text not null,
  provenance jsonb not null default '{}'::jsonb,
  audit_event_id uuid null,
  created_at timestamptz not null default now(),
  constraint evidence_manifests_run_unique unique (test_run_id)
);

-- ---------------------------------------------------------------------------
-- Organization derivation, shared with the earlier slices
-- ---------------------------------------------------------------------------

drop trigger if exists release_gates_organization on public.release_gates;
create trigger release_gates_organization
  before insert or update on public.release_gates
  for each row execute function public.xiv_apply_organization();

drop trigger if exists evidence_records_organization on public.evidence_records;
create trigger evidence_records_organization
  before insert or update on public.evidence_records
  for each row execute function public.xiv_apply_organization();

drop trigger if exists evidence_verifications_organization on public.evidence_verifications;
create trigger evidence_verifications_organization
  before insert or update on public.evidence_verifications
  for each row execute function public.xiv_apply_organization();

drop trigger if exists evidence_approvals_organization on public.evidence_approvals;
create trigger evidence_approvals_organization
  before insert or update on public.evidence_approvals
  for each row execute function public.xiv_apply_organization();

drop trigger if exists evidence_exceptions_organization on public.evidence_exceptions;
create trigger evidence_exceptions_organization
  before insert or update on public.evidence_exceptions
  for each row execute function public.xiv_apply_organization();

drop trigger if exists evidence_failures_organization on public.evidence_failures;
create trigger evidence_failures_organization
  before insert or update on public.evidence_failures
  for each row execute function public.xiv_apply_organization();

drop trigger if exists evidence_revalidations_organization on public.evidence_revalidations;
create trigger evidence_revalidations_organization
  before insert or update on public.evidence_revalidations
  for each row execute function public.xiv_apply_organization();

drop trigger if exists evidence_manifests_organization on public.evidence_manifests;
create trigger evidence_manifests_organization
  before insert or update on public.evidence_manifests
  for each row execute function public.xiv_apply_organization();

-- ---------------------------------------------------------------------------
-- Tamper evidence
-- ---------------------------------------------------------------------------
--
-- Section 34 asks for records that are immutable or tamper-evident. Postgres
-- gives no cheap immutability, so the rule is enforced positively: the columns
-- that carry the meaning of a result are frozen after insert, and the only
-- mutable columns are the ones that describe what later happened to the record
-- (it was reviewed, it was superseded, it went stale). A result that turns out
-- to be wrong is corrected by inserting a replacement and pointing the old row
-- at it, which leaves both visible.

create or replace function public.xiv_evidence_is_append_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.universe_id is distinct from old.universe_id
    or new.organization_id is distinct from old.organization_id
    or new.gate_id is distinct from old.gate_id
    or new.test_run_id is distinct from old.test_run_id
    or new.repository is distinct from old.repository
    or new.branch is distinct from old.branch
    or new.commit_sha is distinct from old.commit_sha
    or new.build_id is distinct from old.build_id
    or new.artifact_hash is distinct from old.artifact_hash
    or new.environment is distinct from old.environment
    or new.test_suite is distinct from old.test_suite
    or new.test_case is distinct from old.test_case
    or new.expected_result is distinct from old.expected_result
    or new.actual_result is distinct from old.actual_result
    or new.status is distinct from old.status
    or new.outcome_kind is distinct from old.outcome_kind
    or new.mandatory is distinct from old.mandatory
    or new.evidence_level is distinct from old.evidence_level
    or new.started_at is distinct from old.started_at
    or new.completed_at is distinct from old.completed_at
    or new.executor_type is distinct from old.executor_type
    or new.executor_id is distinct from old.executor_id
    or new.evidence_location is distinct from old.evidence_location
    or new.evidence_hash is distinct from old.evidence_hash
    or new.primary_owner is distinct from old.primary_owner
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'xiv_evidence_record_immutable' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists evidence_records_append_only on public.evidence_records;
create trigger evidence_records_append_only
  before update on public.evidence_records
  for each row execute function public.xiv_evidence_is_append_only();

-- Deleting evidence is how an inconvenient result disappears, so nobody may.
create or replace function public.xiv_evidence_no_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'xiv_evidence_record_immutable' using errcode = 'check_violation';
end;
$$;

drop trigger if exists evidence_records_no_delete on public.evidence_records;
create trigger evidence_records_no_delete
  before delete on public.evidence_records
  for each row execute function public.xiv_evidence_no_delete();

drop trigger if exists evidence_verifications_no_delete on public.evidence_verifications;
create trigger evidence_verifications_no_delete
  before delete on public.evidence_verifications
  for each row execute function public.xiv_evidence_no_delete();

-- ---------------------------------------------------------------------------
-- Secrets must not enter the evidence trail (sections 34, 47)
-- ---------------------------------------------------------------------------
--
-- The scan is deliberately shape-based and conservative. It will not catch every
-- credential, and it is not a substitute for the secret scanner; what it does is
-- stop the two most common accidents — pasting a bearer token or a private key
-- block into an actual_result, and copying a connection string into an evidence
-- location — from being written down forever in a table nobody deletes from.

create or replace function public.xiv_evidence_rejects_secrets()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  haystack text;
begin
  haystack := coalesce(new.expected_result, '') || ' ' || coalesce(new.actual_result, '') || ' '
    || coalesce(new.evidence_location, '') || ' ' || coalesce(new.provenance::text, '');

  if haystack ~* '(bearer\s+[a-z0-9._\-]{20,})'
    or haystack ~* '(-----begin[a-z ]*private key-----)'
    or haystack ~* '(postgres(ql)?|mysql|mongodb)://[^\s:]+:[^\s@]+@'
    or haystack ~* '(eyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.)'
    or haystack ~* '(sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9\-]{10,}|gh[pousr]_[A-Za-z0-9]{20,})'
    or haystack ~* '(aws_secret_access_key\s*[:=]\s*\S+)'
  then
    raise exception 'xiv_evidence_contains_secret' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists evidence_records_secret_scan on public.evidence_records;
create trigger evidence_records_secret_scan
  before insert or update on public.evidence_records
  for each row execute function public.xiv_evidence_rejects_secrets();

-- ---------------------------------------------------------------------------
-- Evidence levels are earned, not claimed (section 35)
-- ---------------------------------------------------------------------------
--
-- Saying "this is E4" is itself an E0 claim, so the level a row may carry is
-- checked against what the row actually has. E4 in particular can never be
-- written: it requires an independent reviewer, who by definition has not
-- looked at the artifact at the moment it is inserted. A record reaches E4 by
-- being verified, which is what xiv_evidence_effective_level computes below.

create or replace function public.xiv_evidence_level_is_earned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.evidence_level = 'E4' then
    raise exception 'xiv_evidence_level_overclaimed' using errcode = 'check_violation',
      detail = 'E4 is earned by independent verification and cannot be written directly';
  end if;

  if new.evidence_level in ('E2', 'E3', 'E4') and length(coalesce(new.commit_sha, '')) < 7 then
    raise exception 'xiv_evidence_level_overclaimed' using errcode = 'check_violation',
      detail = 'an automated result must identify the exact source revision';
  end if;

  if new.evidence_level = 'E3' then
    if new.executor_type not in ('ci', 'database', 'runtime') then
      raise exception 'xiv_evidence_level_overclaimed' using errcode = 'check_violation',
        detail = 'E3 requires a system-generated artifact, not an agent or human account of one';
    end if;
    if coalesce(new.artifact_hash, new.evidence_hash, '') = '' then
      raise exception 'xiv_evidence_level_overclaimed' using errcode = 'check_violation',
        detail = 'E3 requires a hashed artifact';
    end if;
    if coalesce(btrim(new.reproduction_command), '') = '' then
      raise exception 'xiv_evidence_level_overclaimed' using errcode = 'check_violation',
        detail = 'E3 requires a command a third party can re-run';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists evidence_records_level_earned on public.evidence_records;
create trigger evidence_records_level_earned
  before insert or update on public.evidence_records
  for each row execute function public.xiv_evidence_level_is_earned();

-- The level a record has actually reached, which is its stored level plus the
-- step that only somebody else can grant.
create or replace function public.xiv_evidence_effective_level(record_id uuid)
returns text
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  rec public.evidence_records;
  blockers integer;
begin
  select * into rec from public.evidence_records e where e.id = record_id;
  if rec.id is null then
    return 'E0';
  end if;
  if rec.evidence_level <> 'E3' then
    return rec.evidence_level;
  end if;

  select count(*) into blockers
  from public.evidence_failures f
  where f.gate_id = rec.gate_id
    and f.closed_at is null
    and f.severity in ('high', 'critical');

  if blockers > 0 then
    return 'E3';
  end if;

  if exists (
    select 1 from public.evidence_verifications v
    where v.evidence_id = rec.id
      and v.verdict = 'satisfies'
      and v.checked_commit_sha = rec.commit_sha
  ) then
    return 'E4';
  end if;

  return 'E3';
end;
$$;

-- ---------------------------------------------------------------------------
-- Separation of duties (section 36)
-- ---------------------------------------------------------------------------
--
-- The rule reads "the same agent/process should not simultaneously be
-- implementation owner + independent verifier + human approver for a critical
-- gate". Enforced in two places, because the two halves fail differently:
-- self-verification is never acceptable at any level, while self-approval is
-- refused specifically where the gate is release-critical.

create or replace function public.xiv_verification_is_independent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  record_owner uuid;
  record_universe uuid;
begin
  select e.primary_owner, e.universe_id into record_owner, record_universe
  from public.evidence_records e
  where e.id = new.evidence_id;

  if record_owner is null then
    raise exception 'xiv_evidence_unknown' using errcode = 'check_violation';
  end if;

  if record_universe <> new.universe_id then
    raise exception 'xiv_evidence_cross_universe' using errcode = 'check_violation';
  end if;

  if record_owner = new.verifier_id then
    raise exception 'xiv_verifier_must_be_independent' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists evidence_verifications_independent on public.evidence_verifications;
create trigger evidence_verifications_independent
  before insert or update on public.evidence_verifications
  for each row execute function public.xiv_verification_is_independent();

create or replace function public.xiv_approval_is_independent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gate public.release_gates;
begin
  select * into gate from public.release_gates g where g.id = new.gate_id;

  if gate.id is null then
    raise exception 'xiv_gate_unknown' using errcode = 'check_violation';
  end if;

  if gate.universe_id <> new.universe_id then
    raise exception 'xiv_evidence_cross_universe' using errcode = 'check_violation';
  end if;

  if gate.release_critical then
    if exists (
      select 1 from public.evidence_records e
      where e.gate_id = gate.id
        and e.commit_sha = new.commit_sha
        and e.primary_owner = new.approver_id
    ) then
      raise exception 'xiv_approver_owned_the_evidence' using errcode = 'check_violation';
    end if;

    if exists (
      select 1
      from public.evidence_verifications v
      join public.evidence_records e on e.id = v.evidence_id
      where e.gate_id = gate.id
        and e.commit_sha = new.commit_sha
        and v.verifier_id = new.approver_id
    ) then
      raise exception 'xiv_approver_verified_the_evidence' using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists evidence_approvals_independent on public.evidence_approvals;
create trigger evidence_approvals_independent
  before insert or update on public.evidence_approvals
  for each row execute function public.xiv_approval_is_independent();

-- ---------------------------------------------------------------------------
-- Hard blockers cannot be excepted (section 54)
-- ---------------------------------------------------------------------------

create or replace function public.xiv_exception_respects_hard_blockers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gate public.release_gates;
begin
  select * into gate from public.release_gates g where g.id = new.gate_id;

  if gate.id is null then
    raise exception 'xiv_gate_unknown' using errcode = 'check_violation';
  end if;

  if gate.universe_id <> new.universe_id then
    raise exception 'xiv_evidence_cross_universe' using errcode = 'check_violation';
  end if;

  if gate.hard_blocker then
    raise exception 'xiv_hard_blocker_cannot_be_excepted' using errcode = 'check_violation';
  end if;

  -- The filer cannot also be the independent reviewer of their own exception.
  if new.owner_id = new.reviewer_id then
    raise exception 'xiv_verifier_must_be_independent' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists evidence_exceptions_hard_blockers on public.evidence_exceptions;
create trigger evidence_exceptions_hard_blockers
  before insert or update on public.evidence_exceptions
  for each row execute function public.xiv_exception_respects_hard_blockers();

-- ---------------------------------------------------------------------------
-- Freshness (section 55)
-- ---------------------------------------------------------------------------
--
-- Returns VALID, STALE, SUPERSEDED or INVALID for one record. STALE is the
-- interesting one: the record was true when it was taken and nothing has
-- contradicted it, but something it depended on has since moved, so it no longer
-- counts towards a gate until it is retaken.

-- Deliberately security invoker. A member already sees every evidence row in
-- their own Universe, so the honest answer needs no elevation, and running as
-- the caller means the function cannot be used to read another tenant's state.
create or replace function public.xiv_evidence_freshness(record_id uuid)
returns text
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  rec public.evidence_records;
begin
  select * into rec from public.evidence_records e where e.id = record_id;
  if rec.id is null then
    return 'INVALID';
  end if;

  if rec.superseded_by is not null then
    return 'SUPERSEDED';
  end if;

  if rec.invalidated_at is not null then
    return 'INVALID';
  end if;

  if rec.expires_at is not null and rec.expires_at <= now() then
    return 'STALE';
  end if;

  if exists (
    select 1
    from public.evidence_revalidations r
    where r.universe_id = rec.universe_id
      and r.occurred_at > rec.completed_at
      and (r.affects_all_gates or r.affects_gate_id = rec.gate_id)
      -- A revalidation that carries the very commit this evidence was taken
      -- against is the change that produced it, not a change that invalidates
      -- it, so it does not age its own evidence.
      and coalesce(r.to_commit_sha, '') <> rec.commit_sha
  ) then
    return 'STALE';
  end if;

  return 'VALID';
end;
$$;

-- ---------------------------------------------------------------------------
-- Gate state (sections 56, 57)
-- ---------------------------------------------------------------------------
--
-- The single accountable state of a gate at a given commit, computed rather than
-- declared. Nobody can write PASS: PASS is what this function returns when the
-- evidence in the table earns it. The ordering of the checks is the policy:
--
--   a failure outbids everything, then a skipped mandatory test, then a missing
--   owner, then missing evidence, then evidence that is too weak, then evidence
--   that has gone stale, then missing independent verification, then missing
--   human approval. Only a gate that survives all of them passes.

create or replace function public.xiv_gate_state(gate_id_in uuid, commit_sha_in text)
returns text
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  gate public.release_gates;
  level_order constant text[] := array['E0', 'E1', 'E2', 'E3', 'E4'];
  required_rank integer;
  best_rank integer := 0;
  fresh_count integer := 0;
  has_exception boolean;
begin
  select * into gate from public.release_gates g where g.id = gate_id_in;
  if gate.id is null then
    return 'UNASSIGNED';
  end if;

  if gate.blocked_reason is not null then
    return 'BLOCKED';
  end if;

  required_rank := array_position(level_order, gate.required_evidence_level);

  -- A failing mandatory test at this commit is the answer, regardless of how
  -- much passing evidence sits beside it.
  if exists (
    select 1 from public.evidence_records e
    where e.gate_id = gate.id
      and e.commit_sha = commit_sha_in
      and e.mandatory
      and e.status in ('fail', 'error')
      and public.xiv_evidence_freshness(e.id) <> 'SUPERSEDED'
  ) then
    return 'FAIL';
  end if;

  -- Section 39: a skipped mandatory test stays visible and cannot round up.
  if exists (
    select 1 from public.evidence_records e
    where e.gate_id = gate.id
      and e.commit_sha = commit_sha_in
      and e.mandatory
      and e.status in ('skipped', 'blocked')
      and public.xiv_evidence_freshness(e.id) <> 'SUPERSEDED'
  ) then
    return 'EVIDENCE_PENDING';
  end if;

  if gate.assigned_owner_id is null then
    return 'UNASSIGNED';
  end if;

  select count(*), coalesce(max(array_position(level_order, public.xiv_evidence_effective_level(e.id))), 0)
    into fresh_count, best_rank
  from public.evidence_records e
  where e.gate_id = gate.id
    and e.commit_sha = commit_sha_in
    and e.status = 'pass'
    and public.xiv_evidence_freshness(e.id) = 'VALID';

  has_exception := exists (
    select 1 from public.evidence_exceptions x
    where x.gate_id = gate.id
      and x.revoked_at is null
      and x.expires_at > now()
      and x.human_approver_id is not null
  );

  if fresh_count = 0 then
    -- Evidence may exist for this gate at some other commit, or may have gone
    -- stale. Either way it does not prove this commit (section 38).
    if exists (select 1 from public.evidence_records e where e.gate_id = gate.id) then
      if exists (
        select 1 from public.evidence_records e
        where e.gate_id = gate.id
          and e.commit_sha = commit_sha_in
          and public.xiv_evidence_freshness(e.id) = 'STALE'
      ) then
        return 'STALE';
      end if;
      return 'EVIDENCE_PENDING';
    end if;
    return case when has_exception then 'EXCEPTION_APPROVED' else 'ASSIGNED' end;
  end if;

  if best_rank < required_rank then
    return case when has_exception then 'EXCEPTION_APPROVED' else 'EVIDENCE_PENDING' end;
  end if;

  -- E3 and above are only meaningful once somebody who did not produce them has
  -- said they answer the question that was asked.
  if required_rank >= array_position(level_order, 'E3') then
    if not exists (
      select 1
      from public.evidence_verifications v
      join public.evidence_records e on e.id = v.evidence_id
      where e.gate_id = gate.id
        and e.commit_sha = commit_sha_in
        and e.status = 'pass'
        and v.verdict = 'satisfies'
        and public.xiv_evidence_freshness(e.id) = 'VALID'
    ) then
      return 'VERIFICATION_PENDING';
    end if;

    if exists (
      select 1
      from public.evidence_verifications v
      join public.evidence_records e on e.id = v.evidence_id
      where e.gate_id = gate.id
        and e.commit_sha = commit_sha_in
        and v.verdict in ('insufficient', 'contradicted')
        and public.xiv_evidence_freshness(e.id) = 'VALID'
    ) then
      return 'FAIL';
    end if;
  end if;

  if gate.human_approval_rule in ('required', 'ceo') then
    if not exists (
      select 1 from public.evidence_approvals a
      where a.gate_id = gate.id
        and a.commit_sha = commit_sha_in
        and a.decision = 'approved'
    ) then
      return 'VERIFICATION_PENDING';
    end if;
  end if;

  return 'PASS';
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.release_gates enable row level security;
alter table public.evidence_records enable row level security;
alter table public.evidence_verifications enable row level security;
alter table public.evidence_approvals enable row level security;
alter table public.evidence_exceptions enable row level security;
alter table public.evidence_failures enable row level security;
alter table public.evidence_revalidations enable row level security;
alter table public.evidence_manifests enable row level security;

alter table public.release_gates force row level security;
alter table public.evidence_records force row level security;
alter table public.evidence_verifications force row level security;
alter table public.evidence_approvals force row level security;
alter table public.evidence_exceptions force row level security;
alter table public.evidence_failures force row level security;
alter table public.evidence_revalidations force row level security;
alter table public.evidence_manifests force row level security;

revoke all on table public.release_gates from anon;
revoke all on table public.evidence_records from anon;
revoke all on table public.evidence_verifications from anon;
revoke all on table public.evidence_approvals from anon;
revoke all on table public.evidence_exceptions from anon;
revoke all on table public.evidence_failures from anon;
revoke all on table public.evidence_revalidations from anon;
revoke all on table public.evidence_manifests from anon;

grant select, insert, update on table public.release_gates to authenticated;
-- No delete and no general update: evidence is append-only, and the narrow
-- update the freshness bookkeeping needs is granted below on named columns.
grant select, insert on table public.evidence_records to authenticated;
grant update (superseded_by, invalidated_at, invalidated_reason, reviewer, approval_state, expires_at, exception_id)
  on table public.evidence_records to authenticated;
grant select, insert on table public.evidence_verifications to authenticated;
grant select, insert on table public.evidence_approvals to authenticated;
grant select, insert, update on table public.evidence_exceptions to authenticated;
grant select, insert, update on table public.evidence_failures to authenticated;
grant select, insert on table public.evidence_revalidations to authenticated;
grant select, insert on table public.evidence_manifests to authenticated;

grant execute on function public.xiv_evidence_freshness(uuid) to authenticated;
grant execute on function public.xiv_evidence_effective_level(uuid) to authenticated;
grant execute on function public.xiv_gate_state(uuid, text) to authenticated;

drop policy if exists release_gates_select_member on public.release_gates;
drop policy if exists release_gates_insert_supervisor on public.release_gates;
drop policy if exists release_gates_update_supervisor on public.release_gates;
drop policy if exists evidence_records_select_member on public.evidence_records;
drop policy if exists evidence_records_insert_member on public.evidence_records;
drop policy if exists evidence_records_update_supervisor on public.evidence_records;
drop policy if exists evidence_verifications_select_member on public.evidence_verifications;
drop policy if exists evidence_verifications_insert_self on public.evidence_verifications;
drop policy if exists evidence_approvals_select_member on public.evidence_approvals;
drop policy if exists evidence_approvals_insert_supervisor on public.evidence_approvals;
drop policy if exists evidence_exceptions_select_member on public.evidence_exceptions;
drop policy if exists evidence_exceptions_insert_supervisor on public.evidence_exceptions;
drop policy if exists evidence_exceptions_update_supervisor on public.evidence_exceptions;
drop policy if exists evidence_failures_select_member on public.evidence_failures;
drop policy if exists evidence_failures_insert_member on public.evidence_failures;
drop policy if exists evidence_failures_update_member on public.evidence_failures;
drop policy if exists evidence_revalidations_select_member on public.evidence_revalidations;
drop policy if exists evidence_revalidations_insert_member on public.evidence_revalidations;
drop policy if exists evidence_manifests_select_member on public.evidence_manifests;
drop policy if exists evidence_manifests_insert_member on public.evidence_manifests;

create policy release_gates_select_member
  on public.release_gates for select to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy release_gates_insert_supervisor
  on public.release_gates for insert to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id) and created_by = auth.uid());

create policy release_gates_update_supervisor
  on public.release_gates for update to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy evidence_records_select_member
  on public.evidence_records for select to authenticated
  using (public.xiv_is_universe_member(universe_id));

-- Any member may file evidence; what they cannot do is file it in someone
-- else's name, because created_by is pinned to the caller.
create policy evidence_records_insert_member
  on public.evidence_records for insert to authenticated
  with check (public.xiv_is_universe_member(universe_id) and created_by = auth.uid());

create policy evidence_records_update_supervisor
  on public.evidence_records for update to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy evidence_verifications_select_member
  on public.evidence_verifications for select to authenticated
  using (public.xiv_is_universe_member(universe_id));

-- A verification is a first-person statement. There is no path by which one
-- member records a verification under another member's name.
create policy evidence_verifications_insert_self
  on public.evidence_verifications for insert to authenticated
  with check (public.xiv_is_universe_member(universe_id) and verifier_id = auth.uid());

create policy evidence_approvals_select_member
  on public.evidence_approvals for select to authenticated
  using (public.xiv_is_universe_member(universe_id));

-- Section 59: agents prepare the package, a person approves it. The approver is
-- always the caller and always a supervisor.
create policy evidence_approvals_insert_supervisor
  on public.evidence_approvals for insert to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id) and approver_id = auth.uid());

create policy evidence_exceptions_select_member
  on public.evidence_exceptions for select to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy evidence_exceptions_insert_supervisor
  on public.evidence_exceptions for insert to authenticated
  with check (public.xiv_is_universe_supervisor(universe_id) and created_by = auth.uid());

create policy evidence_exceptions_update_supervisor
  on public.evidence_exceptions for update to authenticated
  using (public.xiv_is_universe_supervisor(universe_id))
  with check (public.xiv_is_universe_supervisor(universe_id));

create policy evidence_failures_select_member
  on public.evidence_failures for select to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy evidence_failures_insert_member
  on public.evidence_failures for insert to authenticated
  with check (public.xiv_is_universe_member(universe_id));

create policy evidence_failures_update_member
  on public.evidence_failures for update to authenticated
  using (public.xiv_is_universe_member(universe_id))
  with check (public.xiv_is_universe_member(universe_id));

create policy evidence_revalidations_select_member
  on public.evidence_revalidations for select to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy evidence_revalidations_insert_member
  on public.evidence_revalidations for insert to authenticated
  with check (public.xiv_is_universe_member(universe_id) and declared_by = auth.uid());

create policy evidence_manifests_select_member
  on public.evidence_manifests for select to authenticated
  using (public.xiv_is_universe_member(universe_id));

create policy evidence_manifests_insert_member
  on public.evidence_manifests for insert to authenticated
  with check (public.xiv_is_universe_member(universe_id));

-- ---------------------------------------------------------------------------
-- Readiness view (section 57)
-- ---------------------------------------------------------------------------
--
-- The dashboard row for each gate at the newest commit that has any evidence for
-- it. A gate with no evidence still appears, showing its state honestly rather
-- than being omitted because it has nothing to say.

-- security_invoker so the dashboard is filtered by the reader's own membership.
-- Without it the view would run as its owner and hand every tenant's readiness
-- to whoever asked.
create or replace view public.evidence_readiness
with (security_invoker = true)
as
select
  g.id as gate_id,
  g.universe_id,
  g.organization_id,
  g.gate_key,
  g.title,
  g.owner_role,
  g.verifier_role,
  g.required_evidence_level,
  g.threshold,
  g.release_critical,
  g.hard_blocker,
  g.human_approval_rule,
  latest.commit_sha,
  public.xiv_gate_state(g.id, coalesce(latest.commit_sha, '')) as state,
  coalesce(counts.total, 0) as evidence_count,
  coalesce(counts.passes, 0) as passes,
  coalesce(counts.failures, 0) as failures,
  coalesce(counts.skipped, 0) as skipped,
  latest.freshness
from public.release_gates g
left join lateral (
  select e.commit_sha, public.xiv_evidence_freshness(e.id) as freshness
  from public.evidence_records e
  where e.gate_id = g.id
  order by e.completed_at desc
  limit 1
) latest on true
left join lateral (
  select
    count(*) as total,
    count(*) filter (where e.status = 'pass') as passes,
    count(*) filter (where e.status in ('fail', 'error')) as failures,
    count(*) filter (where e.status in ('skipped', 'blocked')) as skipped
  from public.evidence_records e
  where e.gate_id = g.id and e.commit_sha = latest.commit_sha
) counts on true;

grant select on public.evidence_readiness to authenticated;
revoke all on public.evidence_readiness from anon;
