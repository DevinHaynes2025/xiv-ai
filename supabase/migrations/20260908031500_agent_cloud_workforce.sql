-- XIV Persistent Cloud Agent Workforce foundation (2I-LA-01)
-- MIGRATION AUTHORED — prefer apply only with founder auth. Not destructive.
-- Tenant + Universe isolation columns. RLS owner-style evaluation for authenticated.
-- Architecture ≠ 24/7 LIVE. Does not enable production credentials.

create extension if not exists pgcrypto;

create table if not exists public.agent_workers (
  id uuid primary key default gen_random_uuid(),
  worker_id text not null unique,
  agent_id text not null,
  tenant_id text not null,
  universe_id text not null,
  shift_id text null,
  status text not null default 'IDLE',
  default_permissions text not null default 'NONE',
  all_tools boolean not null default false,
  l4_enabled boolean not null default false,
  production_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_workers_status_check check (
    status in ('IDLE', 'BUSY', 'OFFLINE', 'QUARANTINED')
  ),
  constraint agent_workers_default_permissions_none check (default_permissions = 'NONE'),
  constraint agent_workers_no_all_tools check (all_tools = false),
  constraint agent_workers_l4_disabled check (l4_enabled = false),
  constraint agent_workers_not_live check (production_live = false)
);

create table if not exists public.agent_missions (
  id uuid primary key default gen_random_uuid(),
  mission_id text not null unique,
  tenant_id text not null,
  universe_id text not null,
  objective text not null,
  status text not null default 'DRAFT',
  template_id text null,
  assigned_worker_id text null references public.agent_workers (worker_id) on delete set null,
  authority_level text not null default 'L0',
  self_expandable_authority boolean not null default false,
  budget_id text not null,
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  lease_id text null,
  checkpoint_id text null,
  l4_enabled boolean not null default false,
  production_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_missions_status_check check (
    status in (
      'DRAFT',
      'QUEUED',
      'CLAIMED',
      'RUNNING',
      'CHECKPOINTING',
      'HANDED_OFF',
      'COMPLETED',
      'FAILED',
      'RETRY_WAIT',
      'QUARANTINED',
      'CANCELLED',
      'ORPHANED'
    )
  ),
  constraint agent_missions_authority_check check (
    authority_level in ('L0', 'L1', 'L2', 'L3')
  ),
  constraint agent_missions_no_self_expand check (self_expandable_authority = false),
  constraint agent_missions_l4_disabled check (l4_enabled = false),
  constraint agent_missions_not_live check (production_live = false),
  constraint agent_missions_retry_nonneg check (retry_count >= 0 and max_retries >= 0)
);

create table if not exists public.agent_leases (
  id uuid primary key default gen_random_uuid(),
  lease_id text not null unique,
  mission_id text not null references public.agent_missions (mission_id) on delete cascade,
  worker_id text not null references public.agent_workers (worker_id) on delete cascade,
  tenant_id text not null,
  universe_id text not null,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null,
  heartbeat_at timestamptz not null default now(),
  active boolean not null default true,
  constraint agent_leases_expiry_check check (expires_at > acquired_at)
);

create unique index if not exists agent_leases_one_active_per_mission
  on public.agent_leases (mission_id)
  where active = true;

create table if not exists public.agent_checkpoints (
  id uuid primary key default gen_random_uuid(),
  checkpoint_id text not null unique,
  mission_id text not null references public.agent_missions (mission_id) on delete cascade,
  tenant_id text not null,
  universe_id text not null,
  worker_id text not null references public.agent_workers (worker_id) on delete cascade,
  progress_cursor text not null,
  completed_steps jsonb not null default '[]'::jsonb,
  pending_steps jsonb not null default '[]'::jsonb,
  context_refs jsonb not null default '[]'::jsonb,
  memory_refs jsonb not null default '[]'::jsonb,
  repo_state_ref text null,
  db_state_ref text null,
  last_heartbeat_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  signature text not null,
  transfers_authority boolean not null default false,
  created_at timestamptz not null default now(),
  constraint agent_checkpoints_no_authority_transfer check (transfers_authority = false)
);

create table if not exists public.agent_debriefs (
  id uuid primary key default gen_random_uuid(),
  debrief_id text not null unique,
  mission_id text not null references public.agent_missions (mission_id) on delete cascade,
  tenant_id text not null,
  universe_id text not null,
  worker_id text not null references public.agent_workers (worker_id) on delete cascade,
  outcome text not null,
  summary text not null,
  findings jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  lessons jsonb not null default '[]'::jsonb,
  human_decisions_required jsonb not null default '[]'::jsonb,
  evidence_refs jsonb not null default '[]'::jsonb,
  promotes_to_global_brain boolean not null default false,
  created_at timestamptz not null default now(),
  constraint agent_debriefs_outcome_check check (
    outcome in ('SUCCESS', 'PARTIAL', 'FAILED', 'QUARANTINED', 'HANDED_OFF')
  ),
  constraint agent_debriefs_no_global_auto check (promotes_to_global_brain = false)
);

create table if not exists public.agent_execution_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  mission_id text not null references public.agent_missions (mission_id) on delete cascade,
  tenant_id text not null,
  universe_id text not null,
  worker_id text null,
  kind text not null,
  detail text not null default '',
  audited boolean not null default true,
  created_at timestamptz not null default now(),
  constraint agent_execution_events_audited check (audited = true),
  constraint agent_execution_events_kind_check check (
    kind in (
      'ENQUEUED',
      'CLAIMED',
      'HEARTBEAT',
      'CHECKPOINT',
      'RELEASED',
      'COMPLETED',
      'FAILED',
      'RETRY',
      'QUARANTINED',
      'ORPHAN_RECOVERY',
      'HANDOFF',
      'SECURITY_DENIED',
      'BUDGET_EXCEEDED',
      'AUTHORITY_ESCALATION_DENIED'
    )
  )
);

create index if not exists agent_missions_tenant_universe_status_idx
  on public.agent_missions (tenant_id, universe_id, status, updated_at desc);
create index if not exists agent_missions_assigned_worker_idx
  on public.agent_missions (assigned_worker_id);
create index if not exists agent_workers_tenant_universe_idx
  on public.agent_workers (tenant_id, universe_id, status);
create index if not exists agent_leases_expires_active_idx
  on public.agent_leases (expires_at)
  where active = true;
create index if not exists agent_checkpoints_mission_idx
  on public.agent_checkpoints (mission_id, created_at desc);
create index if not exists agent_debriefs_mission_idx
  on public.agent_debriefs (mission_id, created_at desc);
create index if not exists agent_execution_events_mission_idx
  on public.agent_execution_events (mission_id, created_at desc);
create index if not exists agent_execution_events_tenant_universe_idx
  on public.agent_execution_events (tenant_id, universe_id, created_at desc);

alter table public.agent_workers enable row level security;
alter table public.agent_missions enable row level security;
alter table public.agent_leases enable row level security;
alter table public.agent_checkpoints enable row level security;
alter table public.agent_debriefs enable row level security;
alter table public.agent_execution_events enable row level security;

-- Authenticated-only stubs: deny-by-default until tenant membership join is wired.
-- No anon policies. No public policies. Service role not granted here.

drop policy if exists agent_workers_deny_all on public.agent_workers;
create policy agent_workers_deny_all on public.agent_workers
  for all to authenticated
  using (false)
  with check (false);

drop policy if exists agent_missions_deny_all on public.agent_missions;
create policy agent_missions_deny_all on public.agent_missions
  for all to authenticated
  using (false)
  with check (false);

drop policy if exists agent_leases_deny_all on public.agent_leases;
create policy agent_leases_deny_all on public.agent_leases
  for all to authenticated
  using (false)
  with check (false);

drop policy if exists agent_checkpoints_deny_all on public.agent_checkpoints;
create policy agent_checkpoints_deny_all on public.agent_checkpoints
  for all to authenticated
  using (false)
  with check (false);

drop policy if exists agent_debriefs_deny_all on public.agent_debriefs;
create policy agent_debriefs_deny_all on public.agent_debriefs
  for all to authenticated
  using (false)
  with check (false);

drop policy if exists agent_execution_events_deny_all on public.agent_execution_events;
create policy agent_execution_events_deny_all on public.agent_execution_events
  for all to authenticated
  using (false)
  with check (false);

revoke all on public.agent_workers from anon, public;
revoke all on public.agent_missions from anon, public;
revoke all on public.agent_leases from anon, public;
revoke all on public.agent_checkpoints from anon, public;
revoke all on public.agent_debriefs from anon, public;
revoke all on public.agent_execution_events from anon, public;

grant select, insert, update on public.agent_workers to authenticated;
grant select, insert, update on public.agent_missions to authenticated;
grant select, insert, update on public.agent_leases to authenticated;
grant select, insert, update on public.agent_checkpoints to authenticated;
grant select, insert, update on public.agent_debriefs to authenticated;
grant select, insert on public.agent_execution_events to authenticated;
