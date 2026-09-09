-- XIV 62L-BT AI Engineering Apprenticeship / Experiment Factory / Puzzle Lab /
-- Cross-Language Refactor / Software Evolution Graph candidates
-- MIGRATION AUTHORED — NOT_APPLIED — DO NOT APPLY FROM THIS COMMIT.
-- Requires separate migration review, tenant/Universe RLS tests, rollback evidence, and human authorization.
-- L4 autonomy remains disabled. This schema does not authorize deployment, tip-land, or cloud access.
-- Does not overload production tables; candidate tables only.
-- Mentor/apprentice cannot transfer production authority.
-- Experiments remain sandboxed; success ≠ auto-merge/deploy.
-- Failed experiments preserved as negative knowledge (not discarded, not auto best practice).

-- STATUS: NOT_APPLIED

create extension if not exists pgcrypto;

create table if not exists public.xiv_bt_pair_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  mentor_agent_id text not null,
  apprentice_agent_id text not null,
  apprentice_permission_tier text not null default 'sandbox',
  authority_transferred boolean not null default false,
  apprentice_gained_mentor_permissions boolean not null default false,
  apprentice_gained_production_authority boolean not null default false,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  constraint xiv_bt_pair_no_auth_xfer check (authority_transferred = false),
  constraint xiv_bt_pair_no_mentor_gain check (apprentice_gained_mentor_permissions = false),
  constraint xiv_bt_pair_no_prod_gain check (apprentice_gained_production_authority = false),
  constraint xiv_bt_pair_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bt_code_experiments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  title text not null,
  approach_fingerprint text not null,
  status text not null,
  sandboxed boolean not null default true,
  apply_to_main_allowed boolean not null default false,
  auto_merged boolean not null default false,
  auto_deployed boolean not null default false,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  constraint xiv_bt_exp_sandboxed check (sandboxed = true),
  constraint xiv_bt_exp_no_auto_apply check (apply_to_main_allowed = false),
  constraint xiv_bt_exp_no_merge check (auto_merged = false),
  constraint xiv_bt_exp_no_deploy check (auto_deployed = false),
  constraint xiv_bt_exp_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bt_negative_knowledge (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  experiment_id uuid not null,
  approach_fingerprint text not null,
  status text not null check (status in ('failed', 'rejected')),
  summary text not null,
  preserved boolean not null default true,
  auto_best_practice boolean not null default false,
  created_at timestamptz not null default now(),
  constraint xiv_bt_nk_preserved check (preserved = true),
  constraint xiv_bt_nk_no_best_practice check (auto_best_practice = false)
);

create table if not exists public.xiv_bt_architecture_puzzles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  root_label text not null,
  max_depth integer not null,
  max_hops integer not null,
  hops_used integer not null default 0,
  max_depth_reached integer not null default 0,
  bounded boolean not null default true,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  constraint xiv_bt_puzzle_bounded check (bounded = true),
  constraint xiv_bt_puzzle_no_prod check (production_authorized = false),
  constraint xiv_bt_puzzle_depth check (max_depth > 0 and max_depth <= 4),
  constraint xiv_bt_puzzle_hops check (max_hops > 0 and max_hops <= 8)
);

create table if not exists public.xiv_bt_refactor_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  source_language text not null,
  target_language text not null,
  summary text not null,
  label text not null,
  has_equivalence_evidence boolean not null default false,
  production_authorized boolean not null default false,
  auto_merged boolean not null default false,
  created_at timestamptz not null default now(),
  constraint xiv_bt_ref_no_prod check (production_authorized = false),
  constraint xiv_bt_ref_no_merge check (auto_merged = false),
  constraint xiv_bt_ref_verified_requires_eq check (
    label <> 'VERIFIED' or has_equivalence_evidence = true
  )
);

create table if not exists public.xiv_bt_evolution_nodes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  kind text not null,
  label text not null,
  summary text not null,
  cortex_trace_id text,
  hidden_reasoning_trace boolean not null default false,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  constraint xiv_bt_evo_no_hidden check (hidden_reasoning_trace = false),
  constraint xiv_bt_evo_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bt_evolution_provenance (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.xiv_bt_evolution_nodes(id) on delete cascade,
  provenance_kind text not null,
  ref text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

alter table public.xiv_bt_pair_sessions enable row level security;
alter table public.xiv_bt_code_experiments enable row level security;
alter table public.xiv_bt_negative_knowledge enable row level security;
alter table public.xiv_bt_architecture_puzzles enable row level security;
alter table public.xiv_bt_refactor_candidates enable row level security;
alter table public.xiv_bt_evolution_nodes enable row level security;
alter table public.xiv_bt_evolution_provenance enable row level security;

-- RLS policies intentionally omitted here; candidate sketches only (NOT_APPLIED).
