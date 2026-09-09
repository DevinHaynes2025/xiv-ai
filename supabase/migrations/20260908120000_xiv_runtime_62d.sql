-- XIV distributed device, chip and edge runtime (2I-AI-62D) persistence.
-- FOUNDER: run this entire file in the hosted Supabase SQL editor.
-- This workspace cannot apply it remotely. Until it is applied, PostgREST
-- returns PGRST205 for these tables and the runtime control plane keeps its
-- state in process memory only — it does not pretend the rows were persisted.
-- After this file succeeds, also run:
--   NOTIFY pgrst, 'reload schema';
--
-- Isolation model (AC-03): every tenant-bearing table in this file carries
-- organization_id AND universe_id as NOT NULL columns, has row level security
-- enabled AND forced, has no anon or public grants, and its policies resolve
-- access through public.xiv_runtime_is_member(). Membership is explicit: a user
-- with no membership row sees nothing, which is the default for a new user.
--
-- Re-runnable: CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS, then recreate.
-- Verified by services/runtime/tools/rls-verify.ts, which applies this file to a
-- local PostgreSQL instance with a Supabase-compatible auth shim and runs
-- cross-tenant and cross-universe negative tests as the authenticated role.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Membership: the only source of tenant authority for these tables.
-- ---------------------------------------------------------------------------

create table if not exists public.xiv_runtime_memberships (
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null,
  universe_id uuid not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id, universe_id),
  constraint xiv_runtime_memberships_role_check check (role in ('member', 'operator', 'owner'))
);

create or replace function public.xiv_runtime_is_member(p_organization_id uuid, p_universe_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.xiv_runtime_memberships m
    where m.user_id = auth.uid()
      and m.organization_id = p_organization_id
      and m.universe_id = p_universe_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Runtime fleet
-- ---------------------------------------------------------------------------

create table if not exists public.xiv_runtime_nodes (
  node_id text primary key,
  organization_id uuid not null,
  universe_id uuid not null,
  owner_user_id uuid null references auth.users (id) on delete set null,
  hardware_class text not null,
  hardware_profile jsonb not null default '{}'::jsonb,
  capacity jsonb not null default '{}'::jsonb,
  state text not null default 'pending',
  enrollment_fingerprint text not null,
  enrollment_id text not null,
  degraded boolean not null default false,
  control_reason text null,
  registered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint xiv_runtime_nodes_state_check check (
    state in ('pending', 'active', 'paused', 'quarantined', 'revoked')
  ),
  constraint xiv_runtime_nodes_fingerprint_unique unique (enrollment_fingerprint)
);

create table if not exists public.xiv_runtime_attestations (
  attestation_id text primary key,
  node_id text not null references public.xiv_runtime_nodes (node_id) on delete cascade,
  organization_id uuid not null,
  universe_id uuid not null,
  verdict text not null,
  measurements jsonb not null default '{}'::jsonb,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  signature text not null,
  constraint xiv_runtime_attestations_verdict_check check (verdict in ('pass', 'fail'))
);

-- ---------------------------------------------------------------------------
-- Logical agents and runtime assignment
-- ---------------------------------------------------------------------------

create table if not exists public.xiv_runtime_agents (
  agent_id text primary key,
  organization_id uuid not null,
  universe_id uuid not null,
  agent_key text not null,
  classification text not null default 'internal',
  active boolean not null default false,
  assigned_node_id text null references public.xiv_runtime_nodes (node_id) on delete set null,
  activation_count integer not null default 0,
  registered_at timestamptz not null default now(),
  constraint xiv_runtime_agents_classification_check check (
    classification in ('public', 'internal', 'confidential', 'restricted')
  ),
  constraint xiv_runtime_agents_key_unique unique (organization_id, universe_id, agent_key)
);

create table if not exists public.xiv_runtime_agent_assignments (
  assignment_id text primary key,
  agent_id text not null references public.xiv_runtime_agents (agent_id) on delete cascade,
  node_id text not null references public.xiv_runtime_nodes (node_id) on delete cascade,
  organization_id uuid not null,
  universe_id uuid not null,
  classification text not null,
  reason text not null default '',
  assigned_at timestamptz not null default now(),
  released_at timestamptz null
);

-- ---------------------------------------------------------------------------
-- Workloads, resource governance and provenance
-- ---------------------------------------------------------------------------

create table if not exists public.xiv_runtime_workloads (
  workload_id text primary key,
  organization_id uuid not null,
  universe_id uuid not null,
  requester_user_id uuid null references auth.users (id) on delete set null,
  agent_id text null references public.xiv_runtime_agents (agent_id) on delete set null,
  node_id text null references public.xiv_runtime_nodes (node_id) on delete set null,
  classification text not null,
  state text not null,
  grant_id text null,
  attestation_id text null,
  model_id text null,
  consequential boolean not null default false,
  requires_approval boolean not null default false,
  budget jsonb not null default '{}'::jsonb,
  acceptance_ms numeric null,
  scheduling_ms numeric null,
  start_latency_ms numeric null,
  failure_reason text null,
  rejection_reason text null,
  submitted_at timestamptz not null default now(),
  ended_at timestamptz null,
  constraint xiv_runtime_workloads_state_check check (
    state in ('submitted', 'authorized', 'routed', 'running', 'completed', 'failed', 'terminated', 'rejected', 'recovered')
  ),
  constraint xiv_runtime_workloads_classification_check check (
    classification in ('public', 'internal', 'confidential', 'restricted')
  )
);

create table if not exists public.xiv_runtime_usage (
  usage_id text primary key,
  workload_id text not null references public.xiv_runtime_workloads (workload_id) on delete cascade,
  organization_id uuid not null,
  universe_id uuid not null,
  node_id text null references public.xiv_runtime_nodes (node_id) on delete set null,
  consumed jsonb not null default '{}'::jsonb,
  cost_usd numeric not null default 0,
  cost_attributed boolean not null default false,
  terminated_by_limit text null,
  duration_ms integer not null default 0,
  recorded_at timestamptz not null default now()
);

create table if not exists public.xiv_runtime_lineage (
  lineage_id text primary key,
  workload_id text not null,
  organization_id uuid not null,
  universe_id uuid not null,
  stage text not null,
  reference text not null,
  detail text not null default '',
  previous_hash text not null,
  hash text not null,
  recorded_at timestamptz not null default now(),
  constraint xiv_runtime_lineage_stage_check check (
    stage in (
      'source',
      'classification',
      'organization_universe',
      'agent',
      'model',
      'runtime',
      'transformation',
      'meeting_task',
      'recommendation',
      'approval',
      'result'
    )
  )
);

create table if not exists public.xiv_runtime_audit_events (
  event_id text primary key,
  sequence bigint not null,
  organization_id uuid not null,
  universe_id uuid not null,
  category text not null,
  kind text not null,
  subject_id text not null,
  principal_id text null,
  detail jsonb not null default '{}'::jsonb,
  previous_hash text not null,
  hash text not null,
  recorded_at timestamptz not null default now()
);

create table if not exists public.xiv_runtime_control_commands (
  command_id text primary key,
  organization_id uuid not null,
  universe_id uuid not null,
  kind text not null,
  target_id text not null,
  issued_by_user_id uuid null references auth.users (id) on delete set null,
  outcome text not null,
  reason text not null default '',
  ack_latency_ms numeric null,
  issued_at timestamptz not null default now(),
  effective_at timestamptz null,
  constraint xiv_runtime_control_commands_kind_check check (
    kind in ('STOP_TASK', 'STOP_AGENT', 'STOP_MEETING', 'PAUSE_NODE', 'QUARANTINE_NODE', 'REVOKE_NODE')
  ),
  constraint xiv_runtime_control_commands_outcome_check check (outcome in ('acknowledged', 'rejected'))
);

create table if not exists public.xiv_runtime_offline_packages (
  package_id text primary key,
  organization_id uuid not null,
  universe_id uuid not null,
  agent_id text not null references public.xiv_runtime_agents (agent_id) on delete cascade,
  node_id text not null references public.xiv_runtime_nodes (node_id) on delete cascade,
  issued_by_user_id uuid null references auth.users (id) on delete set null,
  capabilities jsonb not null default '[]'::jsonb,
  classification text not null,
  max_tasks integer not null,
  budget jsonb not null default '{}'::jsonb,
  nonce text not null,
  signature text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  synchronized_at timestamptz null
);

-- ---------------------------------------------------------------------------
-- Release-scoped inventory. These tables are not tenant-bearing: they describe
-- what the release itself ships, and every authenticated user reads the same
-- rows. Writes stay with the service role.
-- ---------------------------------------------------------------------------

create table if not exists public.xiv_runtime_model_registry (
  model_id text primary key,
  provider text not null,
  display_name text not null,
  approved boolean not null default false,
  provider_configured boolean not null default false,
  evaluation_id text null,
  evaluation_passed boolean not null default false,
  evaluation_evidence_uri text null,
  max_tokens integer not null default 0,
  cost_per_k_token_usd numeric null,
  classifications jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.xiv_runtime_releases (
  version text primary key,
  runtime_contract_version text not null,
  config_hash text not null,
  destructive_migration boolean not null default false,
  previous_version text null,
  activated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists xiv_runtime_nodes_tenant_idx
  on public.xiv_runtime_nodes (organization_id, universe_id, state);
create index if not exists xiv_runtime_attestations_node_idx
  on public.xiv_runtime_attestations (node_id, issued_at desc);
create index if not exists xiv_runtime_agents_tenant_idx
  on public.xiv_runtime_agents (organization_id, universe_id, active);
create index if not exists xiv_runtime_agent_assignments_agent_idx
  on public.xiv_runtime_agent_assignments (agent_id, assigned_at desc);
create index if not exists xiv_runtime_workloads_tenant_idx
  on public.xiv_runtime_workloads (organization_id, universe_id, submitted_at desc);
create index if not exists xiv_runtime_workloads_node_idx
  on public.xiv_runtime_workloads (node_id, submitted_at desc);
create index if not exists xiv_runtime_usage_workload_idx
  on public.xiv_runtime_usage (workload_id);
create index if not exists xiv_runtime_lineage_workload_idx
  on public.xiv_runtime_lineage (workload_id, recorded_at);
create index if not exists xiv_runtime_audit_events_tenant_idx
  on public.xiv_runtime_audit_events (organization_id, universe_id, sequence desc);
create index if not exists xiv_runtime_control_commands_tenant_idx
  on public.xiv_runtime_control_commands (organization_id, universe_id, issued_at desc);
create index if not exists xiv_runtime_offline_packages_tenant_idx
  on public.xiv_runtime_offline_packages (organization_id, universe_id, expires_at desc);

-- ---------------------------------------------------------------------------
-- Row level security: enabled and forced on every table in this file.
-- ---------------------------------------------------------------------------

alter table public.xiv_runtime_memberships enable row level security;
alter table public.xiv_runtime_nodes enable row level security;
alter table public.xiv_runtime_attestations enable row level security;
alter table public.xiv_runtime_agents enable row level security;
alter table public.xiv_runtime_agent_assignments enable row level security;
alter table public.xiv_runtime_workloads enable row level security;
alter table public.xiv_runtime_usage enable row level security;
alter table public.xiv_runtime_lineage enable row level security;
alter table public.xiv_runtime_audit_events enable row level security;
alter table public.xiv_runtime_control_commands enable row level security;
alter table public.xiv_runtime_offline_packages enable row level security;
alter table public.xiv_runtime_model_registry enable row level security;
alter table public.xiv_runtime_releases enable row level security;

alter table public.xiv_runtime_memberships force row level security;
alter table public.xiv_runtime_nodes force row level security;
alter table public.xiv_runtime_attestations force row level security;
alter table public.xiv_runtime_agents force row level security;
alter table public.xiv_runtime_agent_assignments force row level security;
alter table public.xiv_runtime_workloads force row level security;
alter table public.xiv_runtime_usage force row level security;
alter table public.xiv_runtime_lineage force row level security;
alter table public.xiv_runtime_audit_events force row level security;
alter table public.xiv_runtime_control_commands force row level security;
alter table public.xiv_runtime_offline_packages force row level security;
alter table public.xiv_runtime_model_registry force row level security;
alter table public.xiv_runtime_releases force row level security;

revoke all on table public.xiv_runtime_memberships from public, anon;
revoke all on table public.xiv_runtime_nodes from public, anon;
revoke all on table public.xiv_runtime_attestations from public, anon;
revoke all on table public.xiv_runtime_agents from public, anon;
revoke all on table public.xiv_runtime_agent_assignments from public, anon;
revoke all on table public.xiv_runtime_workloads from public, anon;
revoke all on table public.xiv_runtime_usage from public, anon;
revoke all on table public.xiv_runtime_lineage from public, anon;
revoke all on table public.xiv_runtime_audit_events from public, anon;
revoke all on table public.xiv_runtime_control_commands from public, anon;
revoke all on table public.xiv_runtime_offline_packages from public, anon;
revoke all on table public.xiv_runtime_model_registry from public, anon;
revoke all on table public.xiv_runtime_releases from public, anon;

revoke all on function public.xiv_runtime_is_member(uuid, uuid) from public, anon;
grant execute on function public.xiv_runtime_is_member(uuid, uuid) to authenticated;

-- Reads and tenant-scoped writes for signed-in members only.
grant select on table public.xiv_runtime_memberships to authenticated;
grant select, insert, update on table public.xiv_runtime_nodes to authenticated;
grant select, insert on table public.xiv_runtime_attestations to authenticated;
grant select, insert, update on table public.xiv_runtime_agents to authenticated;
grant select, insert, update on table public.xiv_runtime_agent_assignments to authenticated;
grant select, insert, update on table public.xiv_runtime_workloads to authenticated;
grant select, insert on table public.xiv_runtime_usage to authenticated;
grant select, insert on table public.xiv_runtime_lineage to authenticated;
grant select, insert on table public.xiv_runtime_audit_events to authenticated;
grant select, insert on table public.xiv_runtime_control_commands to authenticated;
grant select, insert, update on table public.xiv_runtime_offline_packages to authenticated;
grant select on table public.xiv_runtime_model_registry to authenticated;
grant select on table public.xiv_runtime_releases to authenticated;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

drop policy if exists xiv_runtime_memberships_select_own on public.xiv_runtime_memberships;
create policy xiv_runtime_memberships_select_own
  on public.xiv_runtime_memberships
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists xiv_runtime_nodes_select_tenant on public.xiv_runtime_nodes;
create policy xiv_runtime_nodes_select_tenant
  on public.xiv_runtime_nodes
  for select
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_nodes_insert_tenant on public.xiv_runtime_nodes;
create policy xiv_runtime_nodes_insert_tenant
  on public.xiv_runtime_nodes
  for insert
  to authenticated
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_nodes_update_tenant on public.xiv_runtime_nodes;
create policy xiv_runtime_nodes_update_tenant
  on public.xiv_runtime_nodes
  for update
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id))
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_attestations_select_tenant on public.xiv_runtime_attestations;
create policy xiv_runtime_attestations_select_tenant
  on public.xiv_runtime_attestations
  for select
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_attestations_insert_tenant on public.xiv_runtime_attestations;
create policy xiv_runtime_attestations_insert_tenant
  on public.xiv_runtime_attestations
  for insert
  to authenticated
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_agents_select_tenant on public.xiv_runtime_agents;
create policy xiv_runtime_agents_select_tenant
  on public.xiv_runtime_agents
  for select
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_agents_insert_tenant on public.xiv_runtime_agents;
create policy xiv_runtime_agents_insert_tenant
  on public.xiv_runtime_agents
  for insert
  to authenticated
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_agents_update_tenant on public.xiv_runtime_agents;
create policy xiv_runtime_agents_update_tenant
  on public.xiv_runtime_agents
  for update
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id))
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_agent_assignments_select_tenant on public.xiv_runtime_agent_assignments;
create policy xiv_runtime_agent_assignments_select_tenant
  on public.xiv_runtime_agent_assignments
  for select
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_agent_assignments_insert_tenant on public.xiv_runtime_agent_assignments;
create policy xiv_runtime_agent_assignments_insert_tenant
  on public.xiv_runtime_agent_assignments
  for insert
  to authenticated
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_agent_assignments_update_tenant on public.xiv_runtime_agent_assignments;
create policy xiv_runtime_agent_assignments_update_tenant
  on public.xiv_runtime_agent_assignments
  for update
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id))
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_workloads_select_tenant on public.xiv_runtime_workloads;
create policy xiv_runtime_workloads_select_tenant
  on public.xiv_runtime_workloads
  for select
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_workloads_insert_tenant on public.xiv_runtime_workloads;
create policy xiv_runtime_workloads_insert_tenant
  on public.xiv_runtime_workloads
  for insert
  to authenticated
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_workloads_update_tenant on public.xiv_runtime_workloads;
create policy xiv_runtime_workloads_update_tenant
  on public.xiv_runtime_workloads
  for update
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id))
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_usage_select_tenant on public.xiv_runtime_usage;
create policy xiv_runtime_usage_select_tenant
  on public.xiv_runtime_usage
  for select
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_usage_insert_tenant on public.xiv_runtime_usage;
create policy xiv_runtime_usage_insert_tenant
  on public.xiv_runtime_usage
  for insert
  to authenticated
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_lineage_select_tenant on public.xiv_runtime_lineage;
create policy xiv_runtime_lineage_select_tenant
  on public.xiv_runtime_lineage
  for select
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_lineage_insert_tenant on public.xiv_runtime_lineage;
create policy xiv_runtime_lineage_insert_tenant
  on public.xiv_runtime_lineage
  for insert
  to authenticated
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_audit_events_select_tenant on public.xiv_runtime_audit_events;
create policy xiv_runtime_audit_events_select_tenant
  on public.xiv_runtime_audit_events
  for select
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_audit_events_insert_tenant on public.xiv_runtime_audit_events;
create policy xiv_runtime_audit_events_insert_tenant
  on public.xiv_runtime_audit_events
  for insert
  to authenticated
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_control_commands_select_tenant on public.xiv_runtime_control_commands;
create policy xiv_runtime_control_commands_select_tenant
  on public.xiv_runtime_control_commands
  for select
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_control_commands_insert_tenant on public.xiv_runtime_control_commands;
create policy xiv_runtime_control_commands_insert_tenant
  on public.xiv_runtime_control_commands
  for insert
  to authenticated
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_offline_packages_select_tenant on public.xiv_runtime_offline_packages;
create policy xiv_runtime_offline_packages_select_tenant
  on public.xiv_runtime_offline_packages
  for select
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_offline_packages_insert_tenant on public.xiv_runtime_offline_packages;
create policy xiv_runtime_offline_packages_insert_tenant
  on public.xiv_runtime_offline_packages
  for insert
  to authenticated
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

drop policy if exists xiv_runtime_offline_packages_update_tenant on public.xiv_runtime_offline_packages;
create policy xiv_runtime_offline_packages_update_tenant
  on public.xiv_runtime_offline_packages
  for update
  to authenticated
  using (public.xiv_runtime_is_member(organization_id, universe_id))
  with check (public.xiv_runtime_is_member(organization_id, universe_id));

-- Release inventory: readable by any signed-in user, writable only by the
-- service role, which is not covered by these policies.
drop policy if exists xiv_runtime_model_registry_select_authenticated on public.xiv_runtime_model_registry;
create policy xiv_runtime_model_registry_select_authenticated
  on public.xiv_runtime_model_registry
  for select
  to authenticated
  using (true);

drop policy if exists xiv_runtime_releases_select_authenticated on public.xiv_runtime_releases;
create policy xiv_runtime_releases_select_authenticated
  on public.xiv_runtime_releases
  for select
  to authenticated
  using (true);

notify pgrst, 'reload schema';
