-- XIV 62L-BN Superbrain Neural Growth / Org Agent Factory / Knowledge Circulation / Metabolism candidates
-- MIGRATION AUTHORED — NOT_APPLIED — DO NOT APPLY FROM THIS COMMIT.
-- Requires separate migration review, tenant/Universe RLS tests, rollback evidence, and human authorization.
-- L4 autonomy remains disabled. This schema does not authorize deployment, tip-land, or cloud access.
-- Does not overload production tables; candidate tables only.
-- STATUS: NOT_APPLIED

create extension if not exists pgcrypto;

create table if not exists public.xiv_bn_growth_proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  growth_kind text not null,
  growth_key text not null,
  status text not null default 'SANDBOX_PROPOSAL',
  demand_proven boolean not null default false,
  org_real boolean not null default false,
  auto_deployed boolean not null default false,
  production_authorized boolean not null default false,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint xiv_bn_growth_kind check (growth_kind in ('neuron','pathway','agent_template','department','route','tool','knowledge_node')),
  constraint xiv_bn_growth_status check (status in (
    'REJECTED_REDUNDANT','REJECTED_NO_DEMAND','SANDBOX_PROPOSAL','AWAITING_HUMAN_APPROVAL','APPROVED_NOT_DEPLOYED','DENIED'
  )),
  constraint xiv_bn_growth_no_prod check (production_authorized = false),
  constraint xiv_bn_growth_no_auto check (auto_deployed = false),
  constraint xiv_bn_growth_not_org_real check (org_real = false)
);

create table if not exists public.xiv_bn_org_sandboxes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  sandbox_kind text not null,
  sandbox_key text not null,
  display_name text not null,
  status text not null default 'SANDBOX_ISOLATED',
  sandbox_isolated boolean not null default true,
  org_real boolean not null default false,
  applied_to_org boolean not null default false,
  founder_approved boolean not null default false,
  privilege_escalation boolean not null default false,
  production_authorized boolean not null default false,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint xiv_bn_sandbox_kind check (sandbox_kind in ('agent_template','department')),
  constraint xiv_bn_sandbox_no_prod check (production_authorized = false),
  constraint xiv_bn_sandbox_not_applied check (applied_to_org = false),
  constraint xiv_bn_sandbox_no_priv check (privilege_escalation = false)
);

create table if not exists public.xiv_bn_pathways (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  pathway_key text not null,
  activation_weight numeric not null default 1,
  value_score numeric not null default 1,
  health text not null default 'active',
  production_authorized boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (organization_id, universe_id, pathway_key),
  constraint xiv_bn_pathway_health check (health in ('active','weakened','hibernating','retired')),
  constraint xiv_bn_pathway_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bn_knowledge_circulation (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  classification text not null,
  title text not null,
  approved_for_circulation boolean not null default false,
  raw_private boolean not null default false,
  circulated boolean not null default false,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint xiv_bn_know_class check (classification in (
    'public_approved','derived_aggregate','permissioned_schema','private_raw','founder_sealed'
  )),
  constraint xiv_bn_know_no_raw_pool check (not (raw_private = true and circulated = true))
);

create table if not exists public.xiv_bn_metabolism_routes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  workload_id text not null,
  routed_to text not null,
  route_state text not null,
  classification text not null,
  cheaper_faster_bypass_attempted boolean not null default false,
  privacy_over_speed_or_price boolean not null default true,
  production_authorized boolean not null default false,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint xiv_bn_metab_to check (routed_to in ('local','edge','cloud','none')),
  constraint xiv_bn_metab_state check (route_state in ('ROUTED','DENIED','UNAVAILABLE')),
  constraint xiv_bn_metab_no_prod check (production_authorized = false),
  constraint xiv_bn_metab_privacy check (privacy_over_speed_or_price = true)
);

-- RLS sketches (NOT_APPLIED): enable + tenant/universe isolation policies required before any apply.
-- alter table public.xiv_bn_growth_proposals enable row level security;
-- alter table public.xiv_bn_org_sandboxes enable row level security;
-- alter table public.xiv_bn_pathways enable row level security;
-- alter table public.xiv_bn_knowledge_circulation enable row level security;
-- alter table public.xiv_bn_metabolism_routes enable row level security;
