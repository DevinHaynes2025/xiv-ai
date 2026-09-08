-- Local Supabase-compatible auth shim.
--
-- Hosted Supabase provides the `auth` schema, the `anon` / `authenticated` /
-- `service_role` roles and `auth.uid()`. This file recreates just enough of
-- that surface for a local PostgreSQL instance so the 62D migration can be
-- applied and its row level security can be exercised for real.
--
-- This file is a TEST HARNESS. It is not part of the migration and must never
-- be run against the hosted project.

create schema if not exists auth;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz not null default now()
);

-- Mirrors hosted behaviour: the subject claim of the verified JWT, or NULL when
-- the request carries no session. A missing, empty or unparseable claims
-- setting is treated as "no session" instead of raising, because a session-less
-- request must produce zero rows rather than an error.
create or replace function auth.uid()
returns uuid
language plpgsql
stable
as $$
declare
  raw text;
begin
  raw := nullif(current_setting('request.jwt.claims', true), '');
  if raw is null then
    return null;
  end if;
  begin
    return nullif(raw::json ->> 'sub', '')::uuid;
  exception
    when others then
      return null;
  end;
end
$$;

grant execute on function auth.uid() to anon, authenticated, service_role;
