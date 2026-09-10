# XIV Authorized Source Inventory — Supabase (schema-only)

Story: 62L-EZ / GitHub #175  
Project: XIV AI (`laxpnlnavzkjawuvzyxh`) us-east-2 ACTIVE_HEALTHY  
Method: MCP `list_tables` on `public` only — no row exports, no `auth.*` / `vault.*` / credentials  

## Source registry entry
| Field | Value |
|-------|-------|
| sourceId | supabase:laxpnlnavzkjawuvzyxh:public |
| owner | XIV AI (DevinHaynes org) |
| rightsClass | XIV-owned |
| tenantId | per-row / RLS |
| universeId | via xiv_universes membership |
| schema | public (listed below) |
| freshness | live inventory snapshot |
| retention | per Supabase project policy |
| replicationPolicy | WAITING_DATA |
| revocationState | active |
| provenance | Supabase MCP list_tables 2026-09-09 CT |

## Public tables (metadata)
| table | rls | rows (count only) |
|-------|-----|-------------------|
| profiles | on | 1 |
| user_roles | on | 5 |
| user_interests | on | 14 |
| onboarding_progress | on | 1 |
| organizations | on | 0 |
| organization_members | on | 0 |
| ai_agent_sessions | on | 3 |
| ai_agent_messages | on | 0 |
| ai_agent_actions | on | 0 |
| ai_agent_approvals | on | 0 |
| ai_agent_audit_events | on | 0 |
| xiv_organizations | on | 2 |
| xiv_universes | on | 2 |
| xiv_organization_memberships | on | 3 |
| xiv_universe_memberships | on | 2 |

## Explicitly NOT inventoried
- auth.*, vault.*, storage objects, secrets, session tokens
- cross-tenant private payloads beyond aggregate counts

## Next safe step
Normalize this registry into knowledge-fabric source cards; aggregate profiling only with tenant/Universe filters.