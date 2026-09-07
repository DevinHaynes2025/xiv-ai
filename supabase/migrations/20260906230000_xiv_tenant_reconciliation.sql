-- XIV Phase 2H-A — Tenant persistence reconciliation
-- MIGRATION AUTHORED — NOT APPLIED.
-- Do not run against hosted Supabase until human review and a two-user isolation proof.
--
-- Preferred option: isolate XIV tenant tables.
-- This file MUST NOT:
--   drop public.organizations
--   rename public.organizations
--   delete hosted organizations rows
--   revoke or rewrite unknown hosted policies on public.organizations
--   grant anon / PUBLIC table rights
--   use open-true policy predicates
--
-- Hosted public.organizations remains untouched.
-- Phase 2F file 20260906220000_persistent_organizations_and_universes.sql
-- must not be applied (it would create a second public.organizations).

-- ---------------------------------------------------------------------------
-- Enums (created only if Phase 2F was never applied)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'xiv_organization_status') then
    create type public.xiv_organization_status as enum ('active', 'suspended', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'xiv_universe_status') then
    create type public.xiv_universe_status as enum ('active', 'suspended', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'xiv_membership_status') then
    create type public.xiv_membership_status as enum ('active', 'invited', 'suspended', 'revoked');
  end if;
  if not exists (select 1 from pg_type where typname = 'xiv_organization_role') then
    create type public.xiv_organization_role as enum ('owner', 'executive', 'admin', 'manager', 'employee', 'member', 'viewer');
  end if;
  if not exists (select 1 from pg_type where typname = 'xiv_universe_role') then
    create type public.xiv_universe_role as enum ('owner', 'executive', 'admin', 'operator', 'employee', 'member', 'viewer');
  end if;
  if not exists (select 1 from pg_type where typname = 'xiv_data_classification') then
    create type public.xiv_data_classification as enum ('public', 'internal', 'confidential', 'restricted');
  end if;
  if not exists (select 1 from pg_type where typname = 'xiv_storage_tier') then
    create type public.xiv_storage_tier as enum ('consumer', 'professional', 'business', 'enterprise', 'sovereign');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- XIV tenant tables (isolated names)
-- ---------------------------------------------------------------------------

create table public.xiv_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status public.xiv_organization_status not null default 'active',
  created_by uuid null references auth.users (id) on delete set null,
  industry text null,
  region_preference text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint xiv_organizations_name_nonempty check (char_length(btrim(name)) >= 1),
  constraint xiv_organizations_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  constraint xiv_organizations_slug_unique unique (slug)
);
comment on table public.xiv_organizations is
  'XIV tenant organization. Isolated from hosted public.organizations. created_by SET NULL if the user is deleted.';

create table public.xiv_universes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.xiv_organizations (id) on delete restrict,
  name text not null,
  slug text not null,
  status public.xiv_universe_status not null default 'active',
  classification public.xiv_data_classification not null default 'internal',
  storage_tier public.xiv_storage_tier not null default 'business',
  region_preference text null,
  created_by uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint xiv_universes_name_nonempty check (char_length(btrim(name)) >= 1),
  constraint xiv_universes_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  constraint xiv_universes_org_slug_unique unique (organization_id, slug)
);
comment on table public.xiv_universes is
  'A Universe belongs to exactly one XIV organization. ON DELETE RESTRICT from org.';

create table public.xiv_organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.xiv_organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.xiv_organization_role not null,
  status public.xiv_membership_status not null default 'active',
  role_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint xiv_organization_memberships_user_org_unique unique (organization_id, user_id),
  constraint xiv_organization_memberships_role_version_positive check (role_version >= 1)
);
comment on table public.xiv_organization_memberships is
  'One membership per user/org. role_version increments on role change. Cached roles must revalidate.';

create table public.xiv_universe_memberships (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.xiv_universes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.xiv_universe_role not null,
  status public.xiv_membership_status not null default 'active',
  role_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint xiv_universe_memberships_user_universe_unique unique (universe_id, user_id),
  constraint xiv_universe_memberships_role_version_positive check (role_version >= 1)
);

create index xiv_organizations_status_idx on public.xiv_organizations (status);
create index xiv_organization_memberships_user_status_idx on public.xiv_organization_memberships (user_id, status);
create index xiv_organization_memberships_org_status_idx on public.xiv_organization_memberships (organization_id, status);
create index xiv_universes_organization_status_idx on public.xiv_universes (organization_id, status);
create index xiv_universe_memberships_user_status_idx on public.xiv_universe_memberships (user_id, status);
create index xiv_universe_memberships_universe_status_idx on public.xiv_universe_memberships (universe_id, status);

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER helpers — search_path fixed, no dynamic SQL
-- ---------------------------------------------------------------------------

create or replace function public.xiv_is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.xiv_organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.xiv_has_org_role(p_organization_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.xiv_organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role::text = any (p_roles)
  );
$$;

create or replace function public.xiv_user_is_org_member(p_organization_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.xiv_organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
      and m.status = 'active'
  );
$$;

create or replace function public.xiv_universe_org_id(p_universe_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.organization_id
  from public.xiv_universes u
  where u.id = p_universe_id;
$$;

create or replace function public.xiv_universe_belongs_to_org(p_universe_id uuid, p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.xiv_universes u
    where u.id = p_universe_id
      and u.organization_id = p_organization_id
  );
$$;

create or replace function public.xiv_is_universe_member(p_universe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.xiv_universe_memberships um
    join public.xiv_universes u on u.id = um.universe_id
    join public.xiv_organization_memberships om
      on om.organization_id = u.organization_id
     and om.user_id = um.user_id
    where um.universe_id = p_universe_id
      and um.user_id = auth.uid()
      and um.status = 'active'
      and om.status = 'active'
  );
$$;

create or replace function public.xiv_has_universe_role(p_universe_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.xiv_universe_memberships um
    join public.xiv_universes u on u.id = um.universe_id
    join public.xiv_organization_memberships om
      on om.organization_id = u.organization_id
     and om.user_id = um.user_id
    where um.universe_id = p_universe_id
      and um.user_id = auth.uid()
      and um.status = 'active'
      and om.status = 'active'
      and um.role::text = any (p_roles)
  );
$$;

create or replace function public.xiv_can_view_universe(p_universe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.xiv_universes u
    where u.id = p_universe_id
      and public.xiv_is_org_member(u.organization_id)
      and (
        public.xiv_is_universe_member(p_universe_id)
        or public.xiv_has_org_role(u.organization_id, array['owner', 'admin', 'executive'])
      )
  );
$$;

create or replace function public.xiv_create_organization(
  p_name text,
  p_slug text,
  p_industry text default null,
  p_region_preference text default null
)
returns public.xiv_organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.xiv_organizations;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  insert into public.xiv_organizations (name, slug, created_by, industry, region_preference)
  values (p_name, p_slug, auth.uid(), p_industry, p_region_preference)
  returning * into v_org;
  insert into public.xiv_organization_memberships (organization_id, user_id, role, status, role_version)
  values (v_org.id, auth.uid(), 'owner', 'active', 1);
  return v_org;
end;
$$;

create or replace function public.xiv_create_universe(
  p_organization_id uuid,
  p_name text,
  p_slug text,
  p_classification public.xiv_data_classification default 'internal',
  p_storage_tier public.xiv_storage_tier default 'business',
  p_region_preference text default null
)
returns public.xiv_universes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uni public.xiv_universes;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  if not public.xiv_has_org_role(p_organization_id, array['owner', 'admin', 'executive']) then
    raise exception 'not authorized';
  end if;
  insert into public.xiv_universes (
    organization_id, name, slug, classification, storage_tier, region_preference, created_by
  ) values (
    p_organization_id, p_name, p_slug, p_classification, p_storage_tier, p_region_preference, auth.uid()
  ) returning * into v_uni;
  insert into public.xiv_universe_memberships (universe_id, user_id, role, status, role_version)
  values (v_uni.id, auth.uid(), 'owner', 'active', 1);
  return v_uni;
end;
$$;

revoke all on function public.xiv_is_org_member(uuid) from public;
revoke all on function public.xiv_has_org_role(uuid, text[]) from public;
revoke all on function public.xiv_user_is_org_member(uuid, uuid) from public;
revoke all on function public.xiv_universe_org_id(uuid) from public;
revoke all on function public.xiv_universe_belongs_to_org(uuid, uuid) from public;
revoke all on function public.xiv_is_universe_member(uuid) from public;
revoke all on function public.xiv_has_universe_role(uuid, text[]) from public;
revoke all on function public.xiv_can_view_universe(uuid) from public;
revoke all on function public.xiv_create_organization(text, text, text, text) from public;
revoke all on function public.xiv_create_universe(uuid, text, text, public.xiv_data_classification, public.xiv_storage_tier, text) from public;

grant execute on function public.xiv_is_org_member(uuid) to authenticated;
grant execute on function public.xiv_has_org_role(uuid, text[]) to authenticated;
grant execute on function public.xiv_user_is_org_member(uuid, uuid) to authenticated;
grant execute on function public.xiv_universe_org_id(uuid) to authenticated;
grant execute on function public.xiv_universe_belongs_to_org(uuid, uuid) to authenticated;
grant execute on function public.xiv_is_universe_member(uuid) to authenticated;
grant execute on function public.xiv_has_universe_role(uuid, text[]) to authenticated;
grant execute on function public.xiv_can_view_universe(uuid) to authenticated;
grant execute on function public.xiv_create_organization(text, text, text, text) to authenticated;
grant execute on function public.xiv_create_universe(uuid, text, text, public.xiv_data_classification, public.xiv_storage_tier, text) to authenticated;

revoke all on table public.xiv_organizations from public, anon;
revoke all on table public.xiv_universes from public, anon;
revoke all on table public.xiv_organization_memberships from public, anon;
revoke all on table public.xiv_universe_memberships from public, anon;

grant select, update on table public.xiv_organizations to authenticated;
grant select, update on table public.xiv_universes to authenticated;
grant select, insert, update, delete on table public.xiv_organization_memberships to authenticated;
grant select, insert, update, delete on table public.xiv_universe_memberships to authenticated;

alter table public.xiv_organizations enable row level security;
alter table public.xiv_universes enable row level security;
alter table public.xiv_organization_memberships enable row level security;
alter table public.xiv_universe_memberships enable row level security;

alter table public.xiv_organizations force row level security;
alter table public.xiv_universes force row level security;
alter table public.xiv_organization_memberships force row level security;
alter table public.xiv_universe_memberships force row level security;

create policy xiv_organizations_select_member
  on public.xiv_organizations
  for select
  to authenticated
  using (public.xiv_is_org_member(id));

create policy xiv_organizations_update_admin
  on public.xiv_organizations
  for update
  to authenticated
  using (public.xiv_has_org_role(id, array['owner', 'admin']))
  with check (public.xiv_has_org_role(id, array['owner', 'admin']));

create policy xiv_universes_select_authorized
  on public.xiv_universes
  for select
  to authenticated
  using (public.xiv_can_view_universe(id));

create policy xiv_universes_update_admin
  on public.xiv_universes
  for update
  to authenticated
  using (
    public.xiv_has_universe_role(id, array['owner', 'admin'])
    or public.xiv_has_org_role(organization_id, array['owner', 'admin'])
  )
  with check (
    public.xiv_universe_belongs_to_org(id, organization_id)
    and (
      public.xiv_has_universe_role(id, array['owner', 'admin'])
      or public.xiv_has_org_role(organization_id, array['owner', 'admin'])
    )
  );

create policy xiv_organization_memberships_select_self_or_roster
  on public.xiv_organization_memberships
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.xiv_has_org_role(organization_id, array['owner', 'admin', 'executive', 'manager'])
  );

create policy xiv_organization_memberships_insert_admin
  on public.xiv_organization_memberships
  for insert
  to authenticated
  with check (
    user_id <> auth.uid()
    and (
      (role <> 'owner' and public.xiv_has_org_role(organization_id, array['owner', 'admin']))
      or (role = 'owner' and public.xiv_has_org_role(organization_id, array['owner']))
    )
  );

create policy xiv_organization_memberships_update_admin
  on public.xiv_organization_memberships
  for update
  to authenticated
  using (
    user_id <> auth.uid()
    and public.xiv_has_org_role(organization_id, array['owner', 'admin'])
  )
  with check (
    user_id <> auth.uid()
    and (
      (role <> 'owner' and public.xiv_has_org_role(organization_id, array['owner', 'admin']))
      or (role = 'owner' and public.xiv_has_org_role(organization_id, array['owner']))
    )
  );

create policy xiv_organization_memberships_delete_admin
  on public.xiv_organization_memberships
  for delete
  to authenticated
  using (
    user_id <> auth.uid()
    and public.xiv_has_org_role(organization_id, array['owner', 'admin'])
  );

create policy xiv_universe_memberships_select_self_or_roster
  on public.xiv_universe_memberships
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.xiv_has_universe_role(universe_id, array['owner', 'admin', 'executive'])
    or public.xiv_has_org_role(public.xiv_universe_org_id(universe_id), array['owner', 'admin', 'executive'])
  );

create policy xiv_universe_memberships_insert_admin
  on public.xiv_universe_memberships
  for insert
  to authenticated
  with check (
    user_id <> auth.uid()
    and public.xiv_user_is_org_member(public.xiv_universe_org_id(universe_id), user_id)
    and (
      public.xiv_has_universe_role(universe_id, array['owner', 'admin'])
      or public.xiv_has_org_role(public.xiv_universe_org_id(universe_id), array['owner', 'admin'])
    )
    and (
      (role <> 'owner')
      or public.xiv_has_universe_role(universe_id, array['owner'])
      or public.xiv_has_org_role(public.xiv_universe_org_id(universe_id), array['owner'])
    )
  );

create policy xiv_universe_memberships_update_admin
  on public.xiv_universe_memberships
  for update
  to authenticated
  using (
    user_id <> auth.uid()
    and (
      public.xiv_has_universe_role(universe_id, array['owner', 'admin'])
      or public.xiv_has_org_role(public.xiv_universe_org_id(universe_id), array['owner', 'admin'])
    )
  )
  with check (
    user_id <> auth.uid()
    and public.xiv_user_is_org_member(public.xiv_universe_org_id(universe_id), user_id)
    and (
      public.xiv_has_universe_role(universe_id, array['owner', 'admin'])
      or public.xiv_has_org_role(public.xiv_universe_org_id(universe_id), array['owner', 'admin'])
    )
    and (
      (role <> 'owner')
      or public.xiv_has_universe_role(universe_id, array['owner'])
      or public.xiv_has_org_role(public.xiv_universe_org_id(universe_id), array['owner'])
    )
  );

create policy xiv_universe_memberships_delete_admin
  on public.xiv_universe_memberships
  for delete
  to authenticated
  using (
    user_id <> auth.uid()
    and (
      public.xiv_has_universe_role(universe_id, array['owner', 'admin'])
      or public.xiv_has_org_role(public.xiv_universe_org_id(universe_id), array['owner', 'admin'])
    )
  );
