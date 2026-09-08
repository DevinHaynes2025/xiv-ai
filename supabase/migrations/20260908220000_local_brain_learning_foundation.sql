-- XIV 62L Local Brain + Learning Foundation
-- MIGRATION AUTHORED — DO NOT APPLY FROM THIS COMMIT.
-- Requires separate migration review, RLS tests, rollback evidence, and human authorization.
-- L4 autonomy remains disabled. This schema does not authorize deployment or cloud access.

create extension if not exists pgcrypto;

create table if not exists public.xiv_agent_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  role_key text not null,
  display_name text not null,
  department text not null,
  capabilities jsonb not null default '[]'::jsonb,
  authority_level text not null default 'L0',
  active boolean not null default false,
  can_self_expand boolean not null default false,
  production_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, role_key),
  constraint xiv_agent_roles_authority check (authority_level in ('L0','L1','L2','L3')),
  constraint xiv_agent_roles_no_self_expand check (can_self_expand = false),
  constraint xiv_agent_roles_no_prod check (production_authorized = false)
);

create table if not exists public.xiv_agent_meeting_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  meeting_id text not null,
  message_id text not null,
  from_role text not null,
  to_role text not null,
  content text not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, message_id)
);

create table if not exists public.xiv_learning_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  domain text not null,
  subject text not null,
  claim_state text not null default 'UNKNOWN',
  summary text not null,
  source_refs jsonb not null default '[]'::jsonb,
  evidence_hash text null,
  confidence numeric null,
  observed_at timestamptz null,
  learned_at timestamptz not null default now(),
  expires_at timestamptz null,
  permission_change boolean not null default false,
  production_change boolean not null default false,
  constraint xiv_learning_claim_state check (claim_state in ('VERIFIED_FACT','PRIMARY_SOURCE','HISTORICAL_ACCOUNT','CULTURAL_CONTEXT','BELIEF_OR_TRADITION','DISPUTED','MODEL_INFERENCE','PREDICTION','UNKNOWN')),
  constraint xiv_learning_confidence check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint xiv_learning_no_permission_change check (permission_change = false),
  constraint xiv_learning_no_production_change check (production_change = false)
);

create table if not exists public.xiv_runtime_registry (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  universe_id uuid not null references public.universes(id) on delete restrict,
  provider text not null,
  locality text not null,
  configured boolean not null default false,
  authorized boolean not null default false,
  state text not null default 'UNAVAILABLE',
  allowed_classifications jsonb not null default '[]'::jsonb,
  attestation_ref text null,
  last_verified_at timestamptz null,
  created_at timestamptz not null default now(),
  unique (organization_id, universe_id, provider),
  constraint xiv_runtime_provider check (provider in ('local','aws','azure','gcp')),
  constraint xiv_runtime_locality check (locality in ('device','edge','cloud')),
  constraint xiv_runtime_state check (state in ('AVAILABLE','DEGRADED','UNAVAILABLE','SUSPENDED')),
  constraint xiv_runtime_available_requires_auth check (state <> 'AVAILABLE' or (configured = true and authorized = true))
);

create index if not exists xiv_agent_meeting_messages_lookup on public.xiv_agent_meeting_messages (organization_id, universe_id, meeting_id, created_at);
create index if not exists xiv_learning_ledger_lookup on public.xiv_learning_ledger (organization_id, universe_id, domain, learned_at desc);
create index if not exists xiv_runtime_registry_lookup on public.xiv_runtime_registry (organization_id, universe_id, provider, state);

alter table public.xiv_agent_roles enable row level security;
alter table public.xiv_agent_meeting_messages enable row level security;
alter table public.xiv_learning_ledger enable row level security;
alter table public.xiv_runtime_registry enable row level security;

-- Deny by default until the current canonical membership/RLS helper surface is
-- reconciled and negative-tested. No anon/public policies are created here.
create policy xiv_agent_roles_deny_all on public.xiv_agent_roles for all to authenticated using (false) with check (false);
create policy xiv_agent_meeting_messages_deny_all on public.xiv_agent_meeting_messages for all to authenticated using (false) with check (false);
create policy xiv_learning_ledger_deny_all on public.xiv_learning_ledger for all to authenticated using (false) with check (false);
create policy xiv_runtime_registry_deny_all on public.xiv_runtime_registry for all to authenticated using (false) with check (false);

revoke all on public.xiv_agent_roles from anon, public;
revoke all on public.xiv_agent_meeting_messages from anon, public;
revoke all on public.xiv_learning_ledger from anon, public;
revoke all on public.xiv_runtime_registry from anon, public;
