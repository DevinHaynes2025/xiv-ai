-- XIV 62L-BJ Global Operations Brain / Executive Cortex / Workforce / Business Twin candidates
-- MIGRATION AUTHORED — NOT_APPLIED — DO NOT APPLY FROM THIS COMMIT.
-- Requires separate migration review, tenant/Universe RLS tests, rollback evidence, and human authorization.
-- L4 autonomy remains disabled. This schema does not authorize deployment, tip-land, or cloud access.
-- Does not overload production tables; candidate tables only.

-- STATUS: NOT_APPLIED

create extension if not exists pgcrypto;

create table if not exists public.xiv_bj_brain_subsystem_bindings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  subsystem_key text not null,
  binding_state text not null default 'probe_only',
  module_hint text not null default '',
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, subsystem_key),
  constraint xiv_bj_brain_binding_state check (binding_state in ('wired','probe_only','waiting_data','denied')),
  constraint xiv_bj_brain_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bj_executive_deliberations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  decision_id text not null,
  objective text not null,
  ranked_options jsonb not null default '[]'::jsonb,
  selected_option_id text null,
  human_authority_required boolean not null default true,
  executable_by_agent boolean not null default false,
  twin_is_founder boolean not null default false,
  recommendation_is_deploy boolean not null default false,
  forecast_is_fact boolean not null default false,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, decision_id),
  constraint xiv_bj_exec_human_required check (human_authority_required = true),
  constraint xiv_bj_exec_no_agent_exec check (executable_by_agent = false),
  constraint xiv_bj_exec_twin_not_founder check (twin_is_founder = false),
  constraint xiv_bj_exec_rec_not_deploy check (recommendation_is_deploy = false),
  constraint xiv_bj_exec_forecast_not_fact check (forecast_is_fact = false),
  constraint xiv_bj_exec_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bj_workforce_activations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  agent_instance_id text not null,
  role_key text not null,
  state text not null default 'READY',
  sparse_activation boolean not null default true,
  materialized_process_claim boolean not null default false,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, agent_instance_id),
  constraint xiv_bj_wf_sparse check (sparse_activation = true),
  constraint xiv_bj_wf_no_million_claim check (materialized_process_claim = false),
  constraint xiv_bj_wf_no_prod check (production_authorized = false),
  constraint xiv_bj_wf_state check (state in ('HIBERNATING','READY','RUNNING','BLOCKED','RETIRED'))
);

create table if not exists public.xiv_bj_business_twins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  twin_key text not null,
  kind text not null,
  display_name text not null,
  is_founder boolean not null default false,
  authority text not null default 'SIMULATED_ONLY',
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, twin_key),
  constraint xiv_bj_twin_kind check (kind in ('organization','business_unit','product_line','market')),
  constraint xiv_bj_twin_not_founder check (is_founder = false),
  constraint xiv_bj_twin_sim_only check (authority = 'SIMULATED_ONLY'),
  constraint xiv_bj_twin_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bj_scenario_universes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  parent_universe_id uuid not null references public.universes(id) on delete restrict,
  scenario_key text not null,
  label text not null,
  isolated boolean not null default true,
  verified_fact boolean not null default false,
  forecast_is_fact boolean not null default false,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, parent_universe_id, scenario_key),
  constraint xiv_bj_scen_isolated check (isolated = true),
  constraint xiv_bj_scen_not_fact check (verified_fact = false),
  constraint xiv_bj_scen_forecast_not_fact check (forecast_is_fact = false),
  constraint xiv_bj_scen_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_bj_decision_outcomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  decision_id text not null,
  option_id text null,
  outcome_summary text not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  measured_score numeric null,
  permission_escalated boolean not null default false,
  learning_is_permission_grant boolean not null default false,
  production_change boolean not null default false,
  production_authorized boolean not null default false,
  learned_at timestamptz not null default now(),
  constraint xiv_bj_out_score check (measured_score is null or (measured_score >= 0 and measured_score <= 1)),
  constraint xiv_bj_out_no_escalation check (permission_escalated = false),
  constraint xiv_bj_out_learn_not_grant check (learning_is_permission_grant = false),
  constraint xiv_bj_out_no_prod_change check (production_change = false),
  constraint xiv_bj_out_no_prod check (production_authorized = false)
);

-- Candidate RLS sketches (NOT_APPLIED — enable only after review)
alter table public.xiv_bj_brain_subsystem_bindings enable row level security;
alter table public.xiv_bj_executive_deliberations enable row level security;
alter table public.xiv_bj_workforce_activations enable row level security;
alter table public.xiv_bj_business_twins enable row level security;
alter table public.xiv_bj_scenario_universes enable row level security;
alter table public.xiv_bj_decision_outcomes enable row level security;

-- NOTE: Policy bodies intentionally omitted from auto-apply path.
-- Tenant/Universe isolation policies must be authored and tested before apply.
