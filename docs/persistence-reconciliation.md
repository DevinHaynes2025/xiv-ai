# Persistence Reconciliation

**Status:** BLOCKED. Phase 2H-B reviewed the isolated migration again and attempted hosted apply. Apply did not run (no privileged database credential / not linked). Two-user hosted isolation is therefore unproven.

`tenantPersistence = schema_collision`. Persistence is **not LIVE**. TypeScript helpers are not a substitute for hosted RLS.

## Preferred option

**C — isolate XIV tenant tables** (`xiv_organizations`, `xiv_universes`, `xiv_organization_memberships`, `xiv_universe_memberships`).

Do not rename or drop hosted `public.organizations`. Do not apply `20260906220000_persistent_organizations_and_universes.sql`.

Authored file: `supabase/migrations/20260906230000_xiv_tenant_reconciliation.sql` — **NOT APPLIED** in 2H-B.

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
