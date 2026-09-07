# RLS Security Model (Phase 2F)

Persisted tenant RLS is **not LIVE**. Phase 2H-A prefers isolated `xiv_*` tables. Hosted `public.organizations` stays untouched. See [persistence-reconciliation.md](./persistence-reconciliation.md).

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

Policies on `organizations` / `universes` call `xiv_is_org_member` / `xiv_can_view_universe`.

Those helpers are `SECURITY DEFINER` with `set search_path = public` and read membership tables **without** going back through RLS.

That is why the cycle

```
organizations policy → memberships → memberships policy → organizations
```

does not recurse.

Helpers take `auth.uid()` (except `xiv_user_is_org_member(org, user)`, used only to stop Universe membership for non-org users). No dynamic SQL. `PUBLIC` execute is revoked; `authenticated` may execute.

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
| INSERT | none — `xiv_create_universe` only |
| UPDATE | Universe owner/admin or org owner/admin; org id cannot be retargeted to another org |
| DELETE | none — disabled in MVP |

Universe membership alone is insufficient if organization membership is missing or invalid.

## Membership RLS (authored)

Users may read their own row. Roster read for owner/admin/executive/manager (org) or equivalent Universe/org admin roles.

Insert/update/delete: authorized admins only, **never self**. Owner grant requires an existing owner actor. Universe inserts require the target user to already be an active org member.

## Classification vs authorization

Universe `classification` is a default posture. It is **not** a grant. Membership and classification must both pass for future resources.

## Agents

Agents are not database principals. `agent.id = executive` grants no SQL access. Future path remains:

User session → governed agent → policy → tool gateway → company data gateway → server-side authorized operation.

## TypeScript helpers

`canViewOrganization` and siblings mirror policy semantics. They **do not** replace RLS.

`client/server policy helper != database authorization`
