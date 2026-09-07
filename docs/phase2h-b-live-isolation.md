# Phase 2H-B — Live isolation and hosted apply

**Status:** APPLY BLOCKED · `tenantPersistence != live`

Starting commit for this phase: `1f01ca8`.

## What this phase did

- Reconfirmed Plan C: isolated `xiv_*` tables only.
- Re-reviewed `20260906230000_xiv_tenant_reconciliation.sql` (no hosted `organizations` mutation, no anon grants, no `service_role`, no open-true policies, RLS + FORCE RLS, fixed `search_path`, bootstrap-only create).
- Did **not** apply `20260906220000_persistent_organizations_and_universes.sql`.
- Wired mobile hydration to `xiv_*` when those tables are readable.
- Added hosted proof gates so `tenantPersistenceIsLive()` stays false until apply + two-user isolation are recorded.
- Connected a real World Bank Open Data read adapter (historical/periodic, never realtime).

## Hosted REST preflight (publishable/anon)

| Object | Result |
| --- | --- |
| `xiv_organizations` | HTTP 404 `PGRST205` — not in schema cache |
| `xiv_universes` | HTTP 404 `PGRST205` |
| `xiv_organization_memberships` | HTTP 404 `PGRST205` |
| `xiv_universe_memberships` | HTTP 404 `PGRST205` |
| `organizations` | HTTP 200, empty array (unrelated hosted table preserved) |

No `xiv_*` collision exists in the API schema. A PostgREST hint also mentioned `public.organization_members`; that object was not altered.

## What this phase did not do

Hosted DDL was **not applied**. The publishable/anon key cannot create tables. This session has no linked Supabase CLI project and no privileged database URL in the apply gate. PostgREST reload and User A / User B proofs were therefore **not run on hosted Supabase**.

Do not treat TypeScript isolation helpers as hosted RLS proof.

## Required before `tenantPersistence = live`

1. Privileged database credential available to a human operator.
2. Collision check: `xiv_organizations`, `xiv_universes`, memberships, helper functions, and enums must not already exist.
3. Apply **only** `20260906230000_xiv_tenant_reconciliation.sql`.
4. `NOTIFY pgrst, 'reload schema';`
5. Verify PKs, FKs, uniques, enums, indexes, RLS, FORCE RLS, policies.
6. User A bootstrap org + Universe through RPCs only.
7. User B bootstrap org + Universe through RPCs only.
8. Cross-read denials, membership attack denials, freshness denials.
9. Record apply + isolation evidence. Only then may `tenantPersistenceIsLive()` become true.

If any hosted check fails: stop. Do not weaken policies. Leave persistence not live.

## Hosted `public.organizations`

Unrelated pre-existing table. Anon/publishable SELECT remains a residual risk. XIV does not use it as tenant authority. No remediation migration was mixed into this phase because unused status is not proven for every external client.
