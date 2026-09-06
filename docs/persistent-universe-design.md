# Persistent Universe + Organization Design

Persisted Universes are **not LIVE**. Phase 2F-B did not apply the migration because hosted `public.organizations` already exists and is a different shape.

## Status

| Piece | Maturity |
| --- | --- |
| In-memory Universe isolation (Phase 2D/2E) | IMPLEMENTED IN CODE |
| Persistence types + authorization helpers | IMPLEMENTED IN CODE |
| Mobile tenant context + bootstrap UX | IMPLEMENTED IN CODE |
| SQL migration `20260906220000_persistent_organizations_and_universes.sql` | MIGRATION AUTHORED — NOT APPLIED (collision) |
| Applied RLS on hosted Supabase | NOT CONFIGURED |
| Tenant isolation on hosted data | NOT CONFIGURED |
| Organization invitations | PLANNED |
| Persistent tenant audit table | PLANNED |
| FK from `ai_agent_*.organization_id` | PLANNED |

## Existing structures this design extends

Do **not** duplicate:

- `profiles` — personal identity. `company` / `professional_title` stay personal unless later linked.
- `user_roles` — app experience (`consumer`, `executive`, …), not tenant membership.
- `ai_agent_*` — owner-only RLS. `organization_id` is nullable and has no FK yet.

## Proposed tables

- `organizations`
- `universes` (exactly one `organization_id`)
- `organization_memberships` (unique user+org)
- `universe_memberships` (unique user+Universe)

## Authority

```
auth.uid()
  → membership row
  → organization / Universe relation
  → RLS decision
```

Client-supplied `organizationId` / `universeId` are selectors only. They never establish authorization.

## Bootstrap

- `xiv_create_organization` inserts the org and an **owner** membership for `auth.uid()`.
- `xiv_create_universe` requires org role `owner|admin|executive`, then inserts the Universe and a Universe **owner** membership for the creator.

Creation does not imply a platform bypass. Owner is a tenant role.

Direct `INSERT` on `organizations` / `universes` has **no** client policy.

## ON DELETE

| Relation | Action | Why |
| --- | --- | --- |
| `universes.organization_id` → `organizations.id` | RESTRICT | Do not cascade-delete isolation spaces |
| `organization_memberships.organization_id` | CASCADE | Memberships are not business records |
| `universe_memberships.universe_id` | CASCADE | Membership must not outlive the Universe |
| `*.user_id` → `auth.users` | CASCADE | Remove membership when the user is deleted |
| `created_by` → `auth.users` | SET NULL | Keep the tenant after the founder account is gone |

## Future storage prefix

`organizations/{organizationId}/universes/{universeId}/...`

S3 is **not** implemented in this phase.

## Rollback (manual review required)

If this unapplied file were applied later, rollback would drop four tables, enums, functions, and policies. No existing production rows are created until apply. Manual review is required because an applied rollback would destroy tenant memberships created after apply.

Do not execute a destructive rollback script automatically.

## Hosted collision (Phase 2F-B)

The connected project already has `public.organizations` with columns `id, name, slug, created_by, created_at`. It is empty. It does **not** have `status`, `industry`, `region_preference`, or `updated_at`. Anon/publishable can SELECT it. `universes`, membership tables, and `xiv_create_*` RPCs are not in the API schema.

Phase 2F-B stopped before apply. Do not rename or drop the hosted table automatically.
