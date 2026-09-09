-- XIV Supabase SECURITY DEFINER grant hardening (advisor remediation)
-- MIGRATION AUTHORED — does NOT mark Supabase LIVE.
-- Safe additive hardening: uses IF EXISTS / catalog checks only.
--
-- Addresses advisor findings:
--   1) public.rls_auto_enable() SECURITY DEFINER callable by anon/authenticated
--   2) membership helpers exposed as public PostgREST RPCs
--   3) create org/universe remain intentional authenticated bootstrap RPCs
--
-- EXTERNAL DASHBOARD ACTION (cannot be fixed in SQL):
--   Auth → leaked-password protection (HaveIBeenPwned) must be ENABLED by a
--   human in the Supabase project Auth settings. This migration does not
--   claim that control is fixed. See docs/supabase-security-hardening.md.
--
-- Does NOT: connect MongoDB/AWS, mark fabric LIVE, or enable L4.

-- ---------------------------------------------------------------------------
-- 1) rls_auto_enable — revoke aggressively (not an XIV RPC; privilege elevating)
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select n.nspname as schema_name,
           p.proname as func_name,
           pg_catalog.pg_get_function_identity_arguments(p.oid) as args
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'rls_auto_enable'
      and n.nspname in ('public', 'extensions', 'auth')
  loop
    execute format(
      'revoke all on function %I.%I(%s) from public, anon, authenticated',
      r.schema_name,
      r.func_name,
      r.args
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Legacy public membership helpers — revoke PostgREST-callable EXECUTE
-- If an older authored apply left these in public, strip anon/authenticated
-- EXECUTE. Canonical helpers live in xiv_internal (reconciliation migration).
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
  target text;
begin
  for target in
    select unnest(array[
      'xiv_is_org_member',
      'xiv_has_org_role',
      'xiv_is_universe_member',
      'xiv_has_universe_role',
      'xiv_can_view_universe',
      'xiv_user_is_org_member',
      'xiv_universe_org_id',
      'xiv_universe_belongs_to_org'
    ])
  loop
    for r in
      select pg_catalog.pg_get_function_identity_arguments(p.oid) as args
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = target
    loop
      execute format(
        'revoke all on function public.%I(%s) from public, anon, authenticated',
        target,
        r.args
      );
    end loop;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Intentional public bootstrap RPCs — keep authenticated, deny PUBLIC/anon
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select p.proname as func_name,
           pg_catalog.pg_get_function_identity_arguments(p.oid) as args
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('xiv_create_organization', 'xiv_create_universe')
  loop
    execute format(
      'revoke all on function public.%I(%s) from public, anon',
      r.func_name,
      r.args
    );
    execute format(
      'grant execute on function public.%I(%s) to authenticated',
      r.func_name,
      r.args
    );
  end loop;
end;
$$;

-- Auth leaked-password protection remains a Supabase Auth dashboard action.
-- This file does not enable it and does not claim it is fixed.
