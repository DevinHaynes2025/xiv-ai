-- Minimal Supabase-compatible shim for running the XIV SQL tests against a
-- plain PostgreSQL instance.
--
-- A hosted Supabase project already provides all of this. Use this file only
-- when you want to execute supabase/tests/*.sql locally, for example in CI:
--
--   createdb xiv_test
--   psql -d xiv_test -f supabase/tests/supabase_shim.sql
--   psql -d xiv_test -v ON_ERROR_STOP=1 -f supabase/migrations/20260908120000_agent_civilization_foundation.sql
--   psql -d xiv_test -v ON_ERROR_STOP=1 -f supabase/tests/agent_civilization_rls_test.sql
--
-- It intentionally reproduces only what the tests touch: the three PostgREST
-- roles, the auth schema, auth.users, and auth.uid() reading the request JWT.

create extension if not exists pgcrypto;

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
end;
$$;

grant usage on schema public to anon, authenticated, service_role;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

create table if not exists auth.users (
  id uuid primary key,
  instance_id uuid null,
  aud text null,
  role text null,
  email text null,
  encrypted_password text null,
  email_confirmed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    ),
    ''
  )::uuid;
$$;

grant execute on function auth.uid() to anon, authenticated, service_role;

-- PostgREST reloads are a no-op outside Supabase, but the migration ends with
-- a NOTIFY and psql should not treat it as an error.
