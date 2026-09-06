-- XIV Phase 2F-A — Persistent organizations, Universes, and memberships
-- MIGRATION AUTHORED — NOT APPLIED.
-- Do not run against hosted Supabase in this phase.
-- Do not apply via supabase db push / migration up until Phase 2F-B review.
--
-- Authority: auth.uid() → membership row → org/Universe relation → RLS.
-- Client-supplied organization_id / universe_id values are selectors only.
-- Agents are not database principals.
-- Personal profile.company / professional_title remain personal identity.
--
-- Existing tables are NOT replaced:
--   profiles, user_roles (experience), user_interests, onboarding_progress,
--   ai_agent_* (owner RLS; organization_id remains nullable with no FK yet).
-- No USING (true) / WITH CHECK (true) on tenant tables.
-- No anon / public table grants.

-- ---------------------------------------------------------------------------
-- Enums (finite roles — not free text in RLS)
-- ---------------------------------------------------------------------------

create type public.xiv_organization_status as enum ('active', 'suspended', 'archived');
create type public.xiv_universe_status as enum ('active', 'suspended', 'archived');
create type public.xiv_membership_status as enum ('active', 'invited', 'suspended', 'revoked');
create type public.xiv_organization_role as enum (
  'owner',
  'executive',
  'admin',
  'manager',
  'employee',
  'member',
  'viewer'
);
create type public.xiv_universe_role as enum (
  'owner',
  'executive',
  'admin',
  'operator',
  'employee',
  'member',
  'viewer'
);
create type public.xiv_data_classification as enum (
  'public',
  'internal',
  'confidential',
  'restricted'
);
create type public.xiv_storage_tier as enum (
  'consumer',
  'professional',
  'business',
  'enterprise',
  'sovereign'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status public.xiv_organization_status not null default 'active',
  created_by uuid null references auth.users (id) on delete set null,
  industry text null,
  region_preference text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_nonempty check (char_length(btrim(name)) >= 1),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  constraint organizations_slug_unique unique (slug)
);
comment on table public.organizations is
  'Tenant organization. created_by SET NULL if the user is deleted so the org can remain. Owner is a tenant role, not a platform bypass.';
comment on column public.organizations.created_by is
  'Bootstrap actor. ON DELETE SET NULL — deleting a user must not delete the organization.';

create table public.universes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  name text not null,
  slug text not null,
  status public.xiv_universe_status not null default 'active',
  classification public.xiv_data_classification not null default 'internal',
  storage_tier public.xiv_storage_tier not null default 'business',
  region_preference text null,
  created_by uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint universes_name_nonempty check (char_length(btrim(name)) >= 1),
  constraint universes_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  constraint universes_org_slug_unique unique (organization_id, slug)
);
comment on table public.universes is
  'A Universe belongs to exactly one organization. Future object prefix: organizations/{organization_id}/universes/{id}/';
comment on column public.universes.organization_id is
  'ON DELETE RESTRICT — an organization cannot be dropped while Universes exist. Avoids cascading business isolation spaces.';
comment on column public.universes.classification is
  'Default privacy posture. Classification is not authorization; membership must also pass.';

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.xiv_organization_role not null,
  status public.xiv_membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_memberships_user_org_unique unique (organization_id, user_id)
);
comment on table public.organization_memberships is
  'One membership row per user/org. Re-activation is an UPDATE, not a second insert. ON DELETE CASCADE from org or user removes membership only, not business records.';

create table public.universe_memberships (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.xiv_universe_role not null,
  status public.xiv_membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint universe_memberships_user_universe_unique unique (universe_id, user_id)
);
comment on table public.universe_memberships is
  'Universe membership dies with the Universe (CASCADE). It never authorizes another organization. User must also have an active org membership.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index organizations_status_idx
  on public.organizations (status);

create index organization_memberships_user_status_idx
  on public.organization_memberships (user_id, status);

create index organization_memberships_org_status_idx
  on public.organization_memberships (organization_id, status);

create index universes_organization_status_idx
  on public.universes (organization_id, status);

create index universe_memberships_user_status_idx
  on public.universe_memberships (user_id, status);

create index universe_memberships_universe_status_idx
  on public.universe_memberships (universe_id, status);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER only to break RLS recursion)
-- Each function uses auth.uid() except xiv_user_is_org_member, which is
-- needed to prevent Universe membership for users who are not org members.
-- Fixed search_path. No dynamic SQL. Revoke PUBLIC execute.
-- ---------------------------------------------------------------------------

create function public.xiv_is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create function public.xiv_has_org_role(p_organization_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role::text = any (p_roles)
  );
$$;

create function public.xiv_user_is_org_member(p_organization_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
      and m.status = 'active'
  );
$$;

create function public.xiv_universe_org_id(p_universe_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.organization_id
  from public.universes u
  where u.id = p_universe_id
$$;

create function public.xiv_universe_belongs_to_org(p_universe_id uuid, p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.universes u
    where u.id = p_universe_id
      and u.organization_id = p_organization_id
  );
$$;

create function public.xiv_is_universe_member(p_universe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.universe_memberships m
    join public.universes u on u.id = m.universe_id
    where m.universe_id = p_universe_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and exists (
        select 1
        from public.organization_memberships om
        where om.organization_id = u.organization_id
          and om.user_id = auth.uid()
          and om.status = 'active'
      )
  );
$$;

create function public.xiv_has_universe_role(p_universe_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.universe_memberships m
    join public.universes u on u.id = m.universe_id
    where m.universe_id = p_universe_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role::text = any (p_roles)
      and exists (
        select 1
        from public.organization_memberships om
        where om.organization_id = u.organization_id
          and om.user_id = auth.uid()
          and om.status = 'active'
      )
  );
$$;

create function public.xiv_can_view_universe(p_universe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.universes u
    where u.id = p_universe_id
      and public.xiv_is_org_member(u.organization_id)
      and (
        public.xiv_is_universe_member(u.id)
        or public.xiv_has_org_role(u.organization_id, array['owner', 'admin', 'executive'])
      )
  );
$$;

-- Controlled bootstrap. Direct INSERT policies are not granted for these tables.
create function public.xiv_create_organization(
  p_name text,
  p_slug text,
  p_industry text default null,
  p_region_preference text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org public.organizations;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  insert into public.organizations (
    name,
    slug,
    status,
    created_by,
    industry,
    region_preference
  ) values (
    p_name,
    p_slug,
    'active',
    v_user,
    p_industry,
    p_region_preference
  )
  returning * into v_org;

  insert into public.organization_memberships (
    organization_id,
    user_id,
    role,
    status
  ) values (
    v_org.id,
    v_user,
    'owner',
    'active'
  );

  return v_org;
end;
$$;

create function public.xiv_create_universe(
  p_organization_id uuid,
  p_name text,
  p_slug text,
  p_classification public.xiv_data_classification default 'internal',
  p_storage_tier public.xiv_storage_tier default 'business',
  p_region_preference text default null
)
returns public.universes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_universe public.universes;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED';
  end if;
  if not public.xiv_has_org_role(p_organization_id, array['owner', 'admin', 'executive']) then
    raise exception 'FORBIDDEN';
  end if;

  insert into public.universes (
    organization_id,
    name,
    slug,
    status,
    classification,
    storage_tier,
    region_preference,
    created_by
  ) values (
    p_organization_id,
    p_name,
    p_slug,
    'active',
    p_classification,
    p_storage_tier,
    p_region_preference,
    v_user
  )
  returning * into v_universe;

  insert into public.universe_memberships (
    universe_id,
    user_id,
    role,
    status
  ) values (
    v_universe.id,
    v_user,
    'owner',
    'active'
  );

  return v_universe;
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

-- ---------------------------------------------------------------------------
-- Grants: no anon, no public. No INSERT on organizations/universes for clients.
-- ---------------------------------------------------------------------------

revoke all on table public.organizations from public, anon;
revoke all on table public.universes from public, anon;
revoke all on table public.organization_memberships from public, anon;
revoke all on table public.universe_memberships from public, anon;

grant select, update on table public.organizations to authenticated;
grant select, update on table public.universes to authenticated;
grant select, insert, update, delete on table public.organization_memberships to authenticated;
grant select, insert, update, delete on table public.universe_memberships to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- Helpers are SECURITY DEFINER so policies do not recurse:
-- organizations → xiv_is_org_member → organization_memberships (no RLS in definer)
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.universes enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.universe_memberships enable row level security;

alter table public.organizations force row level security;
alter table public.universes force row level security;
alter table public.organization_memberships force row level security;
alter table public.universe_memberships force row level security;

-- Organizations
create policy organizations_select_member
  on public.organizations
  for select
  to authenticated
  using (public.xiv_is_org_member(id));

create policy organizations_update_admin
  on public.organizations
  for update
  to authenticated
  using (public.xiv_has_org_role(id, array['owner', 'admin']))
  with check (public.xiv_has_org_role(id, array['owner', 'admin']));

-- No INSERT policy: bootstrap via xiv_create_organization only.
-- No DELETE policy: organization delete is disabled in MVP.

-- Universes
create policy universes_select_authorized
  on public.universes
  for select
  to authenticated
  using (public.xiv_can_view_universe(id));

create policy universes_update_admin
  on public.universes
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

-- No INSERT policy: bootstrap via xiv_create_universe only.
-- No DELETE policy: Universe delete is disabled in MVP.

-- Organization memberships
create policy organization_memberships_select_self_or_roster
  on public.organization_memberships
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.xiv_has_org_role(organization_id, array['owner', 'admin', 'executive', 'manager'])
  );

create policy organization_memberships_insert_admin
  on public.organization_memberships
  for insert
  to authenticated
  with check (
    user_id <> auth.uid()
    and (
      (role <> 'owner' and public.xiv_has_org_role(organization_id, array['owner', 'admin']))
      or (role = 'owner' and public.xiv_has_org_role(organization_id, array['owner']))
    )
  );

create policy organization_memberships_update_admin
  on public.organization_memberships
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

create policy organization_memberships_delete_admin
  on public.organization_memberships
  for delete
  to authenticated
  using (
    user_id <> auth.uid()
    and public.xiv_has_org_role(organization_id, array['owner', 'admin'])
  );

-- Universe memberships
create policy universe_memberships_select_self_or_roster
  on public.universe_memberships
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.xiv_has_universe_role(universe_id, array['owner', 'admin', 'executive'])
    or public.xiv_has_org_role(public.xiv_universe_org_id(universe_id), array['owner', 'admin', 'executive'])
  );

create policy universe_memberships_insert_admin
  on public.universe_memberships
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

create policy universe_memberships_update_admin
  on public.universe_memberships
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

create policy universe_memberships_delete_admin
  on public.universe_memberships
  for delete
  to authenticated
  using (
    user_id <> auth.uid()
    and (
      public.xiv_has_universe_role(universe_id, array['owner', 'admin'])
      or public.xiv_has_org_role(public.xiv_universe_org_id(universe_id), array['owner', 'admin'])
    )
  );
