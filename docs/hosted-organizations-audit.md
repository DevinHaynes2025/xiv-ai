# Hosted organizations audit

**Status:** documented from Phase 2F-B REST + repository history. SQL catalog was **not** re-proven in Phase 2H-A.

## Proven via prior REST (publishable API)

Project host: `laxpnlnavzkjawuvzyxh.supabase.co`

| Fact | Result |
| --- | --- |
| Object exists at `/organizations` | HTTP 200, empty at 2F-B |
| Columns visible | `id`, `name`, `slug`, `created_by`, `created_at` |
| `status` | missing (`42703`) |
| `universes` / memberships / `xiv_create_*` | not in schema cache |
| Anon/publishable SELECT | yes |

## Unproven this session

Column types, primary key, foreign keys, unique constraints, indexes, RLS enabled, FORCE RLS, policies, SQL grants, owner, triggers, functions referencing the table, views referencing it, inbound FKs.

Do not infer those details.

## Origin

XIV authored `create table public.organizations` in commit `a8dfa95` (Phase 2F-A). That migration was **not applied**. Earlier XIV migrations do not create `organizations`. Repository history does not show a Supabase starter table. The hosted object predates the applied XIV tenant design. **Ownership is not assumed.**

## App use

Mobile reads `organizations` only to detect collision. It does not treat rows as XIV tenants. Agents do not query it.

Do not rename, drop, or auto-alter the hosted table.
