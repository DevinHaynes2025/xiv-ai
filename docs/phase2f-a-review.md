# Phase 2F-A Review

**Do not apply this migration. Do not commit from this phase unless a human asks.**

Persisted Universes are **not live** until Phase 2F-B migration execution.

## Inventory (existing)

### EXISTING TABLES (from migrations + mobile usage)

- `public.profiles` (identity columns; `company` is personal text)
- `public.user_roles` (experience, not tenant membership)
- `public.user_interests`
- `public.onboarding_progress`
- `public.ai_agent_sessions` / `messages` / `actions` / `approvals` / `audit_events`
- `storage.buckets` `avatars` (private)

### EXISTING RLS

- Agent tables: `auth.uid() = user_id`, no anon, no public
- Avatar objects: path prefix = `auth.uid()`
- Profiles: existing owner RLS (not redefined here)

### EXISTING AUTH RELATIONSHIPS

- `auth.users` → profile / agent rows
- `user_roles.user_id` = experience selection

### MISSING STRUCTURES

- organizations, universes, tenant memberships, tenant role enums

### POTENTIAL CONFLICTS

- `user_roles` must not be reused as org membership
- `profiles.company` must not become an organization
- In-memory `UniverseRole` still includes `consumer_guest` / `agent` for resource policy; persisted Universe roles do **not** include `agent`
- `ai_agent_*.organization_id` is nullable with no FK — left unchanged so this migration does not rewrite agent rows

## Static SQL review (authored file)

Checked for: `USING (true)`, `WITH CHECK (true)`, anon grants, service_role, missing search_path, self-promotion, missing RLS/FORCE, missing FKs/uniques.

Automated check: `reviewPhase2FaMigration()` in `services/ai/runtime/tenant/migration-review.ts`.

## Human review required before apply

1. Confirm hosted DB has no colliding `organizations` / `universes` tables
2. Confirm function owner will be a privileged role (typical Supabase `postgres`)
3. Confirm default privileges will not re-grant `anon`
4. Decide whether `xiv_user_is_org_member(org, user)` boolean leakage is acceptable
5. Confirm no product UI should claim Universes exist until 2F-B
6. Plan PostgREST reload after apply
7. Do **not** add service-role usage to mobile

## Phase 2F-B execution checklist

1. Review this file and the migration on a non-production project first if available
2. Apply `20260906220000_persistent_organizations_and_universes.sql` once
3. `NOTIFY pgrst, 'reload schema';`
4. Verify RLS with two authenticated users (member vs stranger)
5. Verify `xiv_create_organization` + `xiv_create_universe` bootstrap
6. Verify self-promotion and cross-org inserts fail
7. Verify personal profile fields unchanged
8. Only then wire mobile hydration
9. Keep Gemini `/v1/executive/turn` separate from tenant SQL
