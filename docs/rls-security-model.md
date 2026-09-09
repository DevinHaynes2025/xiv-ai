# RLS Security Model (Phase 2F)

**TENANT PERSISTENCE BLOCKED**

Phase 2H-C could not apply or prove hosted RLS (no privileged database connection). Isolated `xiv_*` SQL remains authored only. Hosted `public.organizations` stays untouched. See [tenant-activation-gate.md](./tenant-activation-gate.md) and [phase2h-c-hosted-tenant-proof.md](./phase2h-c-hosted-tenant-proof.md).

## Status

| Piece | Maturity |
| --- | --- |
| Owner-only agent + profile RLS (existing) | IMPLEMENTED IN CODE (already applied separately) |
| Organization / Universe RLS SQL | MIGRATION AUTHORED — NOT APPLIED (collision) |
| TypeScript policy helpers | IMPLEMENTED IN CODE (defense in depth only) |
| Live tenant RLS | NOT CONFIGURED |
| Hosted pre-existing `organizations` SELECT (anon) | LIVE (different schema; not Phase 2F) |

## Authority source

`auth.uid()` → membership → relation → policy.

Not: client says `organizationId` → grant.

## Recursion

Policies on `xiv_organizations` / `xiv_universes` call `xiv_internal.xiv_is_org_member` / `xiv_internal.xiv_can_view_universe` (reconciliation file). The older Phase 2F public helper names must not be applied as PostgREST RPCs.

Those helpers are `SECURITY DEFINER` with `set search_path = pg_catalog, public` and read membership tables **without** going back through RLS.

That is why the cycle

```
xiv_organizations policy → memberships → memberships policy → xiv_organizations
```

does not recurse.

Internal policy helpers `xiv_is_org_member`, `xiv_has_org_role`, `xiv_is_universe_member`, `xiv_has_universe_role`, `xiv_can_view_universe`, `xiv_user_is_org_member`, `xiv_universe_org_id`, and `xiv_universe_belongs_to_org` live in schema `xiv_internal`. Do **not** add `xiv_internal` to PostgREST `db-schemas` / extra search path. `authenticated` receives schema USAGE plus EXECUTE on those helpers so RLS policy expressions can resolve them; that is intentional least privilege, not public application RPC exposure. Trigger functions are revoked from `authenticated`. Bootstrap RPCs `xiv_create_organization` / `xiv_create_universe` stay in `public` as intentional authenticated entry points (with `auth.uid()` and membership checks). No dynamic SQL. `PUBLIC` / `anon` execute is revoked. See [supabase-security-hardening.md](./supabase-security-hardening.md).

Final-owner removal locks the parent organization/Universe row and all active owner memberships `FOR UPDATE` before counting, so two concurrent owner removals cannot both observe a remaining owner.

## Organization RLS (authored)

| Command | Policy |
| --- | --- |
| SELECT | active org member |
| INSERT | none — `xiv_create_organization` only |
| UPDATE | owner/admin |
| DELETE | none — disabled in MVP |

## Universe RLS (authored)

| Command | Policy |
| --- | --- |
| SELECT | org member **and** (Universe member or org owner/admin/executive) |
| INSERT | none — `xiv_create_universe` only (org **owner or admin**; executive cannot create) |
| UPDATE | Universe owner/admin or org owner/admin; `organization_id` is immutable (trigger + column privilege) |
| DELETE | none — disabled in MVP |

Universe membership alone is insufficient if organization membership is missing or invalid.

## Membership RLS (authored)

Users may read their own row. Roster read for owner/admin/executive/manager (org) or equivalent Universe/org admin roles.

Insert/update/delete: authorized admins only, **never self**. ADMIN cannot demote, suspend, revoke, delete, change, or create OWNER. OWNER is required for any operation affecting an OWNER. The last active OWNER cannot be removed (organization or Universe). Membership `organization_id` / `user_id` / Universe `universe_id` / `user_id` are immutable. `role_version` increments in a trigger on role or status change.

## Classification vs authorization

Universe `classification` is a default posture. It is **not** a grant. Membership and classification must both pass for future resources.

## Agents

Agents are not database principals. `agent.id = executive` grants no SQL access. Future path remains:

User session → governed agent → policy → tool gateway → company data gateway → server-side authorized operation.

## TypeScript helpers

`canViewOrganization` and siblings mirror policy semantics. They **do not** replace RLS.

`client/server policy helper != database authorization`
