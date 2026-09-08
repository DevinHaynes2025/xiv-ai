# Supabase security hardening (SECURITY DEFINER grants)

**Does NOT mark Supabase LIVE.** Tenant `xiv_*` SQL remains authored / gated.

## Advisor findings addressed in-repo

| Finding | In-repo action |
| --- | --- |
| `public.rls_auto_enable()` SECURITY DEFINER callable by anon/authenticated | Additive migration revokes EXECUTE from `PUBLIC` / `anon` / `authenticated` when the function exists (any of `public` / `extensions` / `auth`). Not an XIV RPC. |
| `xiv_can_view_universe`, `xiv_has_org_role`, `xiv_has_universe_role`, `xiv_is_org_member`, `xiv_is_universe_member` SECURITY DEFINER callable by authenticated | Moved to schema `xiv_internal` in the reconciliation migration. Not PostgREST RPCs (`xiv_internal` must stay off `db-schemas`). `authenticated` EXECUTE remains intentional least privilege for RLS policy resolution only. |
| `xiv_create_organization`, `xiv_create_universe` SECURITY DEFINER RPCs | Kept as intentional authenticated bootstrap RPCs. Require `auth.uid()`; universe create requires org owner/admin via `xiv_internal.xiv_has_org_role`. `PUBLIC` / `anon` EXECUTE revoked. |
| Auth leaked-password protection disabled | **Dashboard-only.** Cannot be fixed by SQL migrations. |

## Required external dashboard action

In the Supabase project dashboard:

1. Open **Authentication** → **Providers** / **Attack Protection** (wording varies by dashboard version).
2. Enable **Leaked password protection** (HaveIBeenPwned / compromised password check).
3. Record proof (screenshot or project setting export) before claiming the control is fixed.

Until that human step is done, treat leaked-password protection as **OPEN**.

## Authoritative SQL

- `supabase/migrations/20260906230000_xiv_tenant_reconciliation.sql` — canonical `xiv_*` model with helpers in `xiv_internal`.
- `supabase/migrations/20260908013000_harden_security_definer_grants.sql` — additive revoke for `rls_auto_enable` and any leftover public membership helper EXECUTE grants.
- `supabase/migrations/20260906220000_persistent_organizations_and_universes.sql` — **DO NOT APPLY** (superseded).

## Runtime contract

`services/ai/runtime/tenant/security-definer-review.ts` + `tenant-hardening.test.ts` assert grant policy text contracts. Agents still cannot obtain DB credentials; L4 stays disabled; GDF production-live remains false (also covered in phase 2I-X tests).
