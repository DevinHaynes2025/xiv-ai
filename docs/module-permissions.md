# Module permissions

**Status:** DESIGN · default deny

Every module must request explicit permissions. Unknown names are denied. `*` is rejected for third-party modules.

## Catalog

- `crm.read` / `crm.write`
- `inventory.read` / `inventory.write`
- `documents.read` / `documents.write`
- `contacts.read`
- `business_health.read`
- `agent.request`
- `live.schedule`
- `analytics.read`

Default: `{ allow: false, wildcard: false }`.

Consumers cannot install a tenant module. Organization approval is required before any future install becomes durable.

Runtime helper: `requestModulePermissions()` in `services/ai/runtime/modules/permissions.ts`.
