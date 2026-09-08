-- XIV 62L Story Factory + Root Graph
-- MIGRATION AUTHORED — DO NOT APPLY FROM THIS COMMIT.
-- Requires migration review, RLS negative tests, rollback evidence and human authorization.

create table if not exists public.xiv_story_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  template_key text not null,
  persona text not null,
  domain text not null,
  goal text not null,
  outcome text not null,
  acceptance jsonb not null default '[]'::jsonb,
  risk text not null default 'low',
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, template_key),
  constraint xiv_story_templates_risk check (risk in ('low','medium','high')),
  constraint xiv_story_templates_status check (status in ('DRAFT','REVIEWED','APPROVED','RETIRED'))
);

create table if not exists public.xiv_root_nodes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  root_key text not null,
  kind text not null,
  label text not null,
  dependency_keys jsonb not null default '[]'::jsonb,
  implementation_state text not null default 'planned',
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, universe_id, root_key),
  constraint xiv_root_nodes_kind check (kind in ('capability','policy','data_domain','agent_role','runtime','workflow','experience')),
  constraint xiv_root_nodes_state check (implementation_state in ('planned','implemented','verified','unavailable')),
  constraint xiv_root_nodes_no_prod check (production_authorized = false)
);

create index if not exists xiv_story_templates_lookup on public.xiv_story_templates (organization_id, universe_id, persona, domain, status);
create index if not exists xiv_root_nodes_lookup on public.xiv_root_nodes (organization_id, universe_id, kind, implementation_state);

alter table public.xiv_story_templates enable row level security;
alter table public.xiv_root_nodes enable row level security;

create policy xiv_story_templates_deny_all on public.xiv_story_templates for all to authenticated using (false) with check (false);
create policy xiv_root_nodes_deny_all on public.xiv_root_nodes for all to authenticated using (false) with check (false);

revoke all on public.xiv_story_templates from anon, public;
revoke all on public.xiv_root_nodes from anon, public;
