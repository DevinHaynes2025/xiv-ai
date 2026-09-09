# public.organizations security review

**Status: SECURITY REVIEW REQUIRED**

This object is **not** XIV tenant authority. It was not altered in Phase 2H-C.

## Privileged catalog

**Not available this session.** Columns, PK, FKs, indexes, RLS, FORCE RLS, policies, SQL grants, owner, triggers, views, functions, and inbound FKs could not be re-proven from Postgres catalog.

## Known from prior publishable REST

| Fact | Result |
| --- | --- |
| Path | `/organizations` |
| HTTP | 200, empty array at last probe |
| Visible columns | `id`, `name`, `slug`, `created_by`, `created_at` |
| Anon/publishable SELECT | yes |
| XIV tenant tables | `xiv_*` absent (`PGRST205`) |
| PostgREST hint | `public.organization_members` also exists (untouched) |

## Recommendation (do not execute in this phase)

1. Prove whether any external client depends on anon SELECT.
2. If unused: separate reviewed migration to revoke anon/PUBLIC SELECT and enable FORCE RLS if appropriate.
3. Never rename, drop, or copy this table into `xiv_*`.
4. Keep documenting it as a legacy/unknown hosted object after XIV tenant persistence becomes live.

**Anon SELECT remains. SECURITY REVIEW REQUIRED.**
