# Phase 2F-B Validation

Starting commit: `a8dfa95` (Phase 2F-A). Working tree was clean at start.

Persisted organizations and Universes are **not LIVE**.

LIVE would require: migration applied + RLS verified + tenant isolation tested on the hosted database. None of those three completed.

## Status

| Check | Result |
| --- | --- |
| Migration preflight (static SQL) | PASS |
| SECURITY DEFINER review | PASS |
| Hosted collision check | FAIL — `public.organizations` already exists |
| Privilege review of authored SQL | PASS |
| Privilege review of hosted colliding table | FAIL — anon/publishable can SELECT |
| Apply `20260906220000_persistent_organizations_and_universes.sql` | NOT APPLIED |
| PostgREST reload | NOT RUN |
| Hosted table / RLS / bootstrap / isolation tests | NOT RUN |
| TypeScript tenant helpers + gateway membership | IMPLEMENTED IN CODE |
| Mobile tenant context + create UX | IMPLEMENTED IN CODE |
| Persistent audit table | PLANNED |
| S3 / malware scan / signed upload | NOT CONFIGURED |

## Collision (do not apply)

Hosted project `laxpnlnavzkjawuvzyxh.supabase.co` (publishable REST, no secrets logged):

| Object | API result |
| --- | --- |
| `organizations` | HTTP 200, empty, columns `id, name, slug, created_by, created_at` |
| `organizations.status` | missing (`42703`) |
| `universes` | PGRST205 not in schema cache |
| `organization_memberships` | PGRST205 |
| `universe_memberships` | PGRST205 |
| `xiv_create_organization` / `xiv_create_universe` | not in schema cache |
| Phase 2F enums | not mentioned in OpenAPI |
| `profiles` / `user_roles` | visible (unchanged personal/experience tables) |

This is a **different** `organizations` table than the Phase 2F-A design. Phase 2F-B stopped. The hosted object was not renamed, dropped, or patched.

## Authored migration preflight

`supabase/migrations/20260906220000_persistent_organizations_and_universes.sql` creates only:

- tables: `organizations`, `universes`, `organization_memberships`, `universe_memberships`
- enums, indexes, SECURITY DEFINER helpers, RLS + FORCE RLS, policies

It does **not**: drop profiles, alter `auth.users`, weaken existing RLS, change `user_roles`, migrate `profiles.company`, grant anon/PUBLIC table rights, mention `service_role`, create superadmin, allow self-escalation, allow arbitrary join, use dynamic SQL, or use `USING (true)` / `WITH CHECK (true)` on tenant tables.

## SECURITY DEFINER boundary

All helpers use `set search_path = public`, no dynamic SQL, PUBLIC execute revoked, authenticated execute granted.

| Function | Authority |
| --- | --- |
| `xiv_is_org_member` | `auth.uid()` is an active org member |
| `xiv_has_org_role` | same + role allowlist |
| `xiv_user_is_org_member` | boolean only; blocks Universe membership for non-org users |
| `xiv_universe_org_id` | lookup |
| `xiv_universe_belongs_to_org` | relation check |
| `xiv_is_universe_member` | Universe member **and** org member |
| `xiv_has_universe_role` | same + role |
| `xiv_can_view_universe` | org member AND (Universe member OR org owner/admin/executive) |
| `xiv_create_organization` | authenticated bootstrap; inserts org + owner membership |
| `xiv_create_universe` | org owner/admin/executive; inserts Universe + Universe owner membership |

A supplied UUID is not authority. Agents are not principals.

## Privileges (authored)

- `anon`: no tenant-table grants
- `authenticated`: table rights plus RLS
- `service_role`: not referenced; remains server/admin infrastructure only, never mobile

The **existing** hosted `organizations` table is selectable with the publishable/anon key. That is outside this migration and is one reason apply stayed blocked.

## Application layer

Mobile loads memberships only when the Phase 2F schema is present. On this project it reports `schema_collision` and does not synthesize organization, Universe, or membership ids.

Create organization / Universe UI calls `xiv_create_organization` / `xiv_create_universe` only. Those RPCs are absent today, so create stays disabled / Failed — no fake success.

Company Data Gateway: selector + authenticated owner + persisted membership. `user_roles` and `profiles.company` grant nothing.

Media may attach real org/Universe ids only when a persisted authorized Universe exists. Upload remains `not_configured`. Scan remains `unavailable`.

In-memory audit events cover org/Universe select, bootstrap, membership denied, and cross-tenant denied. Tokens are not logged. Persistent audit table remains PLANNED.

## Tests that ran

`services/ai` `npm run test:runtime` includes `phase2fb.test.ts` (authorization / gateway / media / L4 / writes). These are **not** hosted RLS proofs.

Live Parts 7–13 and 25 remain **NOT RUN** because the migration was not applied and no second isolated development user was used against the authored schema.

## Local validation

| Command | Result |
| --- | --- |
| `apps/mobile` `npx tsc --noEmit` | PASS |
| `apps/mobile` `npm run lint` | PASS |
| `apps/mobile` `npx expo-doctor` | PASS (21/21) |
| `services/ai` `npx tsc --noEmit` | PASS |
| `services/ai` `npm run test:runtime` | PASS (2A–2F-B) |
| `services/ai` `npm run guardian:validate` | PASS (8 healthy; `/health` and public config names unknown/skipped) |
| `git diff --check` | PASS (CRLF warnings only) |

Not committed. Not pushed.
