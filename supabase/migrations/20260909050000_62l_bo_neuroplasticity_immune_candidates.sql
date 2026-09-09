-- XIV 62L-BO Superbrain Neuroplasticity / Knowledge DNA / Skill Evolution / Immune / Adaptive Layers candidates
-- MIGRATION AUTHORED — NOT_APPLIED — DO NOT APPLY FROM THIS COMMIT.
-- Requires separate migration review, tenant/Universe RLS tests, rollback evidence, and human authorization.
-- L4 autonomy remains disabled. This schema does not authorize deployment, tip-land, or cloud access.
-- Does not overload production tables; candidate tables only.

-- STATUS: NOT_APPLIED

create extension if not exists pgcrypto;

create table if not exists public.xiv_bo_plasticity_weights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  target_key text not null,
  weight_key text not null,
  weight numeric not null default 0,
  verified_outcome_id text not null,
  permission_expanded boolean not null default false,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, target_key, weight_key),
  constraint xiv_bo_plast_weight_range check (weight >= 0 and weight <= 1),
  constraint xiv_bo_plast_no_perm check (permission_expanded = false),
  constraint xiv_bo_plast_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bo_knowledge_dna (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  version integer not null default 1,
  isolated boolean not null default true,
  raw_global_pooling boolean not null default false,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id),
  constraint xiv_bo_dna_isolated check (isolated = true),
  constraint xiv_bo_dna_no_pool check (raw_global_pooling = false),
  constraint xiv_bo_dna_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bo_agent_skills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  agent_id text not null,
  skill_key text not null,
  proficiency numeric not null default 0,
  permission_level integer not null default 0,
  authority_level integer not null default 0,
  skill_is_permission_grant boolean not null default false,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, agent_id, skill_key),
  constraint xiv_bo_skill_prof check (proficiency >= 0 and proficiency <= 1),
  constraint xiv_bo_skill_not_perm check (skill_is_permission_grant = false),
  constraint xiv_bo_skill_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bo_immune_artifacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  artifact_key text not null,
  trust_state text not null default 'trusted',
  revalidation_required boolean not null default false,
  silently_trusted boolean not null default false,
  production_authorized boolean not null default false,
  quarantined_at timestamptz null,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, artifact_key),
  constraint xiv_bo_imm_state check (trust_state in ('trusted','stale','poisoned','corrupted','quarantined','revalidation_required')),
  constraint xiv_bo_imm_no_silent check (silently_trusted = false),
  constraint xiv_bo_imm_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bo_adaptive_placements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  workload_key text not null,
  locality text not null default 'local',
  trust_satisfied boolean not null default true,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  constraint xiv_bo_adapt_locality check (locality in ('local','edge','cloud','hybrid')),
  constraint xiv_bo_adapt_no_prod check (production_authorized = false)
);

-- Candidate RLS sketches (NOT_APPLIED — enable only after review)
-- alter table public.xiv_bo_plasticity_weights enable row level security;
-- alter table public.xiv_bo_knowledge_dna enable row level security;
-- alter table public.xiv_bo_agent_skills enable row level security;
-- alter table public.xiv_bo_immune_artifacts enable row level security;
-- alter table public.xiv_bo_adaptive_placements enable row level security;
