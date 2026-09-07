# Persistence Reconciliation

**Status:** BLOCKED until the new migration is reviewed, applied, and a two-user hosted isolation proof passes.

`tenantPersistence = schema_collision`. Persistence is **not LIVE**.

## Preferred option

**C — isolate XIV tenant tables** (`xiv_organizations`, `xiv_universes`, `xiv_organization_memberships`, `xiv_universe_memberships`).

Do not rename or drop hosted `public.organizations`. Do not apply `20260906220000_persistent_organizations_and_universes.sql`.

Authored file: `supabase/migrations/20260906230000_xiv_tenant_reconciliation.sql` — **NOT APPLIED**.

## Options (not executed)

| Option | Risk |
| --- | --- |
| A Adopt hosted `organizations` | Inherits anon SELECT; catalog unproven |
| B Extend hosted `organizations` | ALTER/revoke without catalog proof |
| C Isolate `xiv_*` tables | Lowest blast radius. Preferred. |

## Authority

`auth.uid()` → membership → organization → Universe → classification → policy → RLS.

Never: client `organizationId`, `profiles.company`, `user_roles`, or experience role.
