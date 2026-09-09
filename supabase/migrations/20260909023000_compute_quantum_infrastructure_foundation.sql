-- MIGRATION AUTHORED — DO NOT APPLY FROM THIS COMMIT.
-- Requires schema review, RLS negative tests, rollback evidence and separate human authorization.

create table if not exists public.xiv_compute_nodes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  universe_id uuid not null,
  node_key text not null,
  accelerator_kind text not null check (accelerator_kind in ('cpu_x86_64','cpu_arm64','nvidia_cuda','amd_rocm','apple_metal','samsung_arm','quantum_simulator','quantum_qpu')),
  runtime_state text not null default 'UNAVAILABLE' check (runtime_state in ('AVAILABLE','DEGRADED','UNAVAILABLE','SUSPENDED')),
  configured boolean not null default false,
  authorized boolean not null default false,
  local_node boolean not null default false,
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, node_key),
  check (runtime_state <> 'AVAILABLE' or (configured and authorized))
);

create table if not exists public.xiv_infrastructure_nodes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  universe_id uuid not null,
  node_key text not null,
  node_kind text not null,
  label text not null,
  country text,
  region text,
  classification text not null default 'internal',
  verification_state text not null default 'PLANNED' check (verification_state in ('PLANNED','KNOWN','VERIFIED','UNAVAILABLE')),
  provenance_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, node_key)
);

create table if not exists public.xiv_infrastructure_edges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  universe_id uuid not null,
  from_node_id uuid not null references public.xiv_infrastructure_nodes(id) on delete cascade,
  to_node_id uuid not null references public.xiv_infrastructure_nodes(id) on delete cascade,
  relation text not null,
  capacity numeric,
  unit text,
  provenance_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  check (from_node_id <> to_node_id)
);

create table if not exists public.xiv_quantum_experiments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  universe_id uuid not null,
  experiment_key text not null,
  objective text not null,
  algorithm text not null,
  backend text not null check (backend in ('classical_simulator','quantum_simulator','quantum_qpu')),
  qubit_count integer not null check (qubit_count between 1 and 40),
  shots integer not null check (shots between 1 and 100000),
  experiment_state text not null default 'DRAFT' check (experiment_state in ('DRAFT','READY_FOR_SIMULATION','UNAVAILABLE','COMPLETED','REJECTED')),
  classical_baseline_required boolean not null default true check (classical_baseline_required = true),
  claims_quantum_advantage boolean not null default false check (claims_quantum_advantage = false),
  production_authorized boolean not null default false check (production_authorized = false),
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, experiment_key)
);

alter table public.xiv_compute_nodes enable row level security;
alter table public.xiv_infrastructure_nodes enable row level security;
alter table public.xiv_infrastructure_edges enable row level security;
alter table public.xiv_quantum_experiments enable row level security;

create policy xiv_compute_nodes_deny_authenticated on public.xiv_compute_nodes for all to authenticated using (false) with check (false);
create policy xiv_infrastructure_nodes_deny_authenticated on public.xiv_infrastructure_nodes for all to authenticated using (false) with check (false);
create policy xiv_infrastructure_edges_deny_authenticated on public.xiv_infrastructure_edges for all to authenticated using (false) with check (false);
create policy xiv_quantum_experiments_deny_authenticated on public.xiv_quantum_experiments for all to authenticated using (false) with check (false);

revoke all on public.xiv_compute_nodes from anon, public;
revoke all on public.xiv_infrastructure_nodes from anon, public;
revoke all on public.xiv_infrastructure_edges from anon, public;
revoke all on public.xiv_quantum_experiments from anon, public;
