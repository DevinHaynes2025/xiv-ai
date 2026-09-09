# Persistence Reconciliation

**TENANT PERSISTENCE BLOCKED**

Phase 2H-C: APPLY BLOCKED — PRIVILEGED DATABASE CONNECTION REQUIRED. The isolated reconciliation SQL was not applied. Hosted RLS and two-user isolation are unproven. TypeScript helpers are not hosted RLS.

## Preferred option

**C — isolate XIV tenant tables** (`xiv_organizations`, `xiv_universes`, `xiv_organization_memberships`, `xiv_universe_memberships`).

Do not rename or drop hosted `public.organizations`. Do not apply `20260906220000_persistent_organizations_and_universes.sql`.

Authored file: `supabase/migrations/20260906230000_xiv_tenant_reconciliation.sql` — **NOT APPLIED**. Do not apply in this hardening pass.

Rerun class: **A — intentionally one-time and atomic.** `CREATE TABLE` / `CREATE POLICY` / `CREATE TRIGGER` are not idempotent. A failed apply must roll back the whole file.

Hardening in the authored SQL: Universe create is owner/admin only; ADMIN cannot affect OWNER; final OWNER cannot be removed; membership and Universe `organization_id` relationships are immutable; `role_version` increments on role/status change via trigger; internal helpers live in `xiv_internal`.

Mobile hydrates `xiv_*` only when those tables are readable. Until they exist, detection stays `schema_collision`. `tenantPersistenceIsLive()` remains false until apply + isolation evidence are recorded.

Hosted `public.organizations` is unused as XIV tenant authority. Residual anon/publishable SELECT is documented, not auto-remediated. See [phase2h-b-live-isolation.md](./phase2h-b-live-isolation.md).

## Options (not executed)

| Option | Risk |
| --- | --- |
| A Adopt hosted `organizations` | Inherits anon SELECT; catalog unproven |
| B Extend hosted `organizations` | ALTER/revoke without catalog proof |
| C Isolate `xiv_*` tables | Lowest blast radius. Preferred. |

## Authority

`auth.uid()` → membership → organization → Universe → classification → policy → RLS.

Never: client `organizationId`, `profiles.company`, `user_roles`, or experience role.
