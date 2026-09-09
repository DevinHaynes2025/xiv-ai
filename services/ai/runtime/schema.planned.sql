-- =====================================================================
-- 2I-AI-62D — XIV runtime fabric, initial schema slice (story section 27)
--
-- PLANNED. NOT A MIGRATION. DO NOT APPLY.
--
-- This file deliberately does not live in supabase/migrations. Story 62D is
-- queued architecture: "architecture documentation does not authorize database
-- migration". Nothing here has been run against any database, and the runtime
-- fabric in services/ai/runtime is entirely in-memory and never opens a
-- connection.
--
-- Before any of this can be promoted to a real migration it needs, at minimum:
--   1. A human-authorized deployment story (62D is queued behind 62A-62C).
--   2. An organization/universe membership table. The RLS policies below are
--      written against `public.xiv_universe_members`, which does not exist yet.
--      The existing migration 20260904180000_ai_agent_governance.sql is
--      owner-only for exactly this reason and explicitly refuses to invent org
--      tables; this slice must not invent them either.
--   3. A decision on the retention and residency of health and usage
--      telemetry, which is the highest-volume data in the slice.
--
-- Shape notes:
--   * Every tenant-bearing table carries (organization_id, universe_id) and
--     enables + forces RLS. A shared physical host must never collapse
--     Universe isolation (section 24).
--   * `xiv_model_registry` is the one table that may hold a universe-agnostic
--     row (universe_id is null) for a globally approved model. Its read policy
--     is widened for exactly that case and for nothing else.
--   * Column names mirror the TypeScript records in services/ai/runtime/types.ts
--     so the eventual persistence layer is a direct mapping.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Membership predicate the policies depend on (NOT DEFINED HERE).
--
--   create function public.xiv_member_of(universe uuid) returns boolean ...
--
-- It must resolve the calling user's Universe membership from the future
-- membership table. Until it exists, none of the policies below can be created.
-- ---------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Runtime nodes and their reported capability (sections 2, 9)
-- ---------------------------------------------------------------------

create table public.xiv_runtime_nodes (
  node_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  universe_id uuid not null,
  device_id text not null,
  node_type text not null,
  transport_tier text not null default 'device',
  trust_level text not null default 'untrusted',
  allowed_workloads text[] not null default '{}',
  security_policy jsonb not null default '{}'::jsonb,
  runtime_version text not null,
  attestation_state text not null default 'registered',
  health_state text not null default 'unknown',
  resource_budget jsonb not null default '{}'::jsonb,
  region text not null,
  -- Capability record from section 2. No serial numbers, host names, user
  -- names, network addresses or installed software.
  hardware jsonb not null default '{}'::jsonb,
  lifecycle text not null default 'active',
  last_seen timestamptz null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  constraint xiv_runtime_nodes_trust_check
    check (trust_level in ('untrusted', 'basic', 'verified', 'trusted', 'protected')),
  constraint xiv_runtime_nodes_attestation_check
    check (attestation_state in ('unknown', 'registered', 'verified', 'attested', 'degraded', 'quarantined', 'revoked')),
  constraint xiv_runtime_nodes_lifecycle_check
    check (lifecycle in ('active', 'paused', 'draining', 'quarantined', 'revoked')),
  constraint xiv_runtime_nodes_transport_check
    -- Satellite and orbital tiers stay out of the domain until section 31 is
    -- separately authorized.
    check (transport_tier in ('device', 'edge', 'cloud', 'data_center', 'terrestrial_network')),
  unique (universe_id, device_id)
);

create table public.xiv_runtime_capabilities (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.xiv_runtime_nodes (node_id) on delete cascade,
  organization_id uuid not null,
  universe_id uuid not null,
  -- `domain.function.tier`, e.g. gpu.inference.medium
  capability text not null,
  derived boolean not null default true,
  created_at timestamptz not null default now(),
  unique (node_id, capability)
);

create table public.xiv_runtime_attestations (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.xiv_runtime_nodes (node_id) on delete cascade,
  organization_id uuid not null,
  universe_id uuid not null,
  from_state text not null,
  to_state text not null,
  measurements jsonb not null default '{}'::jsonb,
  actor_id text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.xiv_runtime_health (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.xiv_runtime_nodes (node_id) on delete cascade,
  organization_id uuid not null,
  universe_id uuid not null,
  health_state text not null,
  thermal_state text not null,
  energy_state jsonb not null default '{}'::jsonb,
  network_state text not null,
  memory_available_mb integer not null,
  cpu_pressure numeric(5, 4) not null default 0,
  gpu_pressure numeric(5, 4) not null default 0,
  sampled_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Workloads, placement and cost (sections 7, 8, 17, 18)
-- ---------------------------------------------------------------------

create table public.xiv_compute_workloads (
  workload_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  universe_id uuid not null,
  agent_id text not null,
  meeting_id text null,
  kind text not null,
  requested_capability text not null,
  classification text not null,
  data_residency text[] not null default '{}',
  latency_budget_ms integer not null,
  estimate jsonb not null default '{}'::jsonb,
  -- True when completion causes an external side effect. Section 26: these are
  -- never blindly replayed.
  consequential boolean not null default false,
  model_requirement jsonb null,
  task jsonb not null,
  status text not null default 'submitted',
  attempts integer not null default 0,
  source_label text not null,
  created_at timestamptz not null default now(),
  constraint xiv_compute_workloads_classification_check
    check (classification in ('public', 'internal', 'confidential', 'restricted')),
  constraint xiv_compute_workloads_status_check
    check (status in (
      'submitted', 'classified', 'scheduled', 'running', 'completed',
      'queued', 'escalated', 'cancelled', 'failed', 'held_for_human_review'
    ))
);

create table public.xiv_compute_assignments (
  assignment_id uuid primary key default gen_random_uuid(),
  workload_id uuid not null references public.xiv_compute_workloads (workload_id) on delete cascade,
  node_id uuid not null references public.xiv_runtime_nodes (node_id) on delete restrict,
  organization_id uuid not null,
  universe_id uuid not null,
  agent_id text not null,
  model_id text null,
  -- HMAC minted by the control plane. A runtime cannot produce one, which is
  -- what makes model substitution detectable (section 21).
  model_binding text null,
  placement text not null,
  status text not null default 'assigned',
  checkpoint jsonb null,
  termination_reason text null,
  created_at timestamptz not null default now(),
  started_at timestamptz null,
  finished_at timestamptz null,
  constraint xiv_compute_assignments_placement_check
    check (placement in ('device', 'edge', 'cpu', 'gpu', 'private')),
  constraint xiv_compute_assignments_status_check
    check (status in ('assigned', 'running', 'completed', 'failed', 'terminated', 'superseded'))
);

create table public.xiv_compute_budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  universe_id uuid not null,
  owner_kind text not null,
  owner_id text not null,
  -- All twelve governor dimensions from section 17.
  limits jsonb not null default '{}'::jsonb,
  used jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint xiv_compute_budgets_owner_check check (owner_kind in ('universe', 'node', 'agent')),
  unique (universe_id, owner_kind, owner_id)
);

create table public.xiv_compute_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  universe_id uuid not null,
  workload_id uuid null references public.xiv_compute_workloads (workload_id) on delete set null,
  assignment_id uuid null references public.xiv_compute_assignments (assignment_id) on delete set null,
  node_id uuid null references public.xiv_runtime_nodes (node_id) on delete set null,
  usage jsonb not null default '{}'::jsonb,
  monetary_usd numeric(12, 6) not null default 0,
  energy_wh numeric(12, 4) not null default 0,
  recorded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Model registry (sections 20, 21)
-- ---------------------------------------------------------------------

create table public.xiv_model_registry (
  model_id text primary key,
  organization_id uuid null,
  universe_id uuid null,
  provider text not null,
  model_family text not null,
  runtime_type text not null,
  capabilities text[] not null default '{}',
  context_limit integer not null,
  approved_domains text[] not null default '{}',
  security_classification text not null default 'internal',
  evaluation_state text not null default 'unevaluated',
  cost_profile jsonb not null default '{}'::jsonb,
  hardware_requirement jsonb not null default '{}'::jsonb,
  availability text not null default 'unavailable',
  -- Identity of the served weights. Changing it is a substitution.
  fingerprint text not null,
  created_at timestamptz not null default now(),
  constraint xiv_model_registry_evaluation_check
    check (evaluation_state in ('unevaluated', 'in_evaluation', 'evaluated', 'failed')),
  constraint xiv_model_registry_availability_check
    check (availability in ('unavailable', 'restricted', 'available')),
  -- An unevaluated model can never be marked available.
  constraint xiv_model_registry_unproven_check
    check (availability = 'unavailable' or evaluation_state = 'evaluated')
);

create table public.xiv_model_evaluations (
  id uuid primary key default gen_random_uuid(),
  model_id text not null references public.xiv_model_registry (model_id) on delete cascade,
  organization_id uuid null,
  universe_id uuid null,
  suite text not null,
  passed boolean not null,
  actor_id text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Agent mobility, offline and sync (sections 11, 12, 15)
-- ---------------------------------------------------------------------

create table public.xiv_agent_runtime_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  universe_id uuid not null,
  agent_id text not null,
  node_id uuid not null references public.xiv_runtime_nodes (node_id) on delete cascade,
  granted_capabilities text[] not null default '{}',
  classification_ceiling text not null default 'internal',
  created_at timestamptz not null default now(),
  released_at timestamptz null
);

create table public.xiv_offline_work_packages (
  package_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  universe_id uuid not null,
  node_id uuid not null references public.xiv_runtime_nodes (node_id) on delete cascade,
  agent_ids text[] not null default '{}',
  grant_payload jsonb not null default '{}'::jsonb,
  base_state_version integer not null default 0,
  issued_by text not null,
  signature text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  -- Offline never adds authority (section 11).
  constraint xiv_offline_no_consequential_check
    check (coalesce((grant_payload ->> 'allowConsequentialActions')::boolean, false) = false)
);

create table public.xiv_sync_events (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.xiv_offline_work_packages (package_id) on delete cascade,
  organization_id uuid not null,
  universe_id uuid not null,
  status text not null,
  reason text not null default '',
  accepted_task_ids text[] not null default '{}',
  rejected_task_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint xiv_sync_events_status_check check (status in ('accepted', 'rejected', 'conflict'))
);

-- ---------------------------------------------------------------------
-- Security events (section 25)
-- ---------------------------------------------------------------------

create table public.xiv_runtime_security_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  universe_id uuid not null,
  kind text not null,
  actor_id text not null,
  node_id uuid null references public.xiv_runtime_nodes (node_id) on delete set null,
  workload_id uuid null references public.xiv_compute_workloads (workload_id) on delete set null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------

create index xiv_runtime_nodes_universe_idx on public.xiv_runtime_nodes (universe_id, lifecycle);
create index xiv_runtime_capabilities_lookup_idx on public.xiv_runtime_capabilities (universe_id, capability);
create index xiv_runtime_attestations_node_idx on public.xiv_runtime_attestations (node_id, created_at desc);
create index xiv_runtime_health_node_idx on public.xiv_runtime_health (node_id, sampled_at desc);
create index xiv_compute_workloads_universe_idx on public.xiv_compute_workloads (universe_id, status, created_at desc);
create index xiv_compute_workloads_agent_idx on public.xiv_compute_workloads (universe_id, agent_id, created_at desc);
create index xiv_compute_assignments_workload_idx on public.xiv_compute_assignments (workload_id, created_at desc);
create index xiv_compute_assignments_node_idx on public.xiv_compute_assignments (node_id, status);
create index xiv_compute_usage_universe_idx on public.xiv_compute_usage (universe_id, recorded_at desc);
create index xiv_agent_runtime_assignments_agent_idx on public.xiv_agent_runtime_assignments (universe_id, agent_id, released_at);
create index xiv_offline_work_packages_node_idx on public.xiv_offline_work_packages (node_id, expires_at desc);
create index xiv_sync_events_package_idx on public.xiv_sync_events (package_id, created_at desc);
create index xiv_runtime_security_events_universe_idx on public.xiv_runtime_security_events (universe_id, created_at desc);

-- ---------------------------------------------------------------------
-- Row level security
--
-- Every tenant-bearing table is force-enabled and readable only through the
-- membership predicate. Writes stay with the service role: a runtime node
-- authenticates to the control plane, not to PostgREST.
-- ---------------------------------------------------------------------

alter table public.xiv_runtime_nodes enable row level security;
alter table public.xiv_runtime_capabilities enable row level security;
alter table public.xiv_runtime_attestations enable row level security;
alter table public.xiv_runtime_health enable row level security;
alter table public.xiv_compute_workloads enable row level security;
alter table public.xiv_compute_assignments enable row level security;
alter table public.xiv_compute_budgets enable row level security;
alter table public.xiv_compute_usage enable row level security;
alter table public.xiv_model_registry enable row level security;
alter table public.xiv_model_evaluations enable row level security;
alter table public.xiv_agent_runtime_assignments enable row level security;
alter table public.xiv_offline_work_packages enable row level security;
alter table public.xiv_sync_events enable row level security;
alter table public.xiv_runtime_security_events enable row level security;

alter table public.xiv_runtime_nodes force row level security;
alter table public.xiv_runtime_capabilities force row level security;
alter table public.xiv_runtime_attestations force row level security;
alter table public.xiv_runtime_health force row level security;
alter table public.xiv_compute_workloads force row level security;
alter table public.xiv_compute_assignments force row level security;
alter table public.xiv_compute_budgets force row level security;
alter table public.xiv_compute_usage force row level security;
alter table public.xiv_model_registry force row level security;
alter table public.xiv_model_evaluations force row level security;
alter table public.xiv_agent_runtime_assignments force row level security;
alter table public.xiv_offline_work_packages force row level security;
alter table public.xiv_sync_events force row level security;
alter table public.xiv_runtime_security_events force row level security;

revoke all on all tables in schema public from public, anon;

-- Read-only for members of the Universe that owns the row. There is no
-- organization-wide policy and no anon policy anywhere in this slice.
--
--   create policy xiv_runtime_nodes_select_member
--     on public.xiv_runtime_nodes
--     for select
--     to authenticated
--     using (public.xiv_member_of(universe_id));
--
-- ... repeated for every table above, plus this one exception for a globally
-- approved model that no single Universe owns:
--
--   create policy xiv_model_registry_select_member
--     on public.xiv_model_registry
--     for select
--     to authenticated
--     using (universe_id is null or public.xiv_member_of(universe_id));
--
-- The policy bodies are intentionally left commented out: they cannot be
-- created until `public.xiv_member_of` exists, and creating the tables without
-- them would leave tenant data readable by every authenticated user.
