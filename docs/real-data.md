# XIV Real Data

Phase 2E adds the first meaningful **real** read-only business-data path beside the prototype Context Provider.

## Status

| Piece | Maturity |
| --- | --- |
| PrototypeContextProvider | IMPLEMENTED (sample / CI / offline / demo) |
| BusinessDataAdapter + provenance | IMPLEMENTED |
| Company Data Gateway (read-only) | IMPLEMENTED |
| HTTP `/health` connection adapter | IMPLEMENTED (real probe, no invented records) |
| Authorized session records adapter | IMPLEMENTED (profile identity + agent activity only) |
| Domain capability map | IMPLEMENTED |
| Deterministic freshness | IMPLEMENTED |
| ERP / WMS / TMS adapters | PLANNED |
| Silent fallback from live → sample | FORBIDDEN |

## Pipeline

```
Agent
  → Agent Registry
  → Policy Engine
  → Tool Gateway
  → Company Data Gateway
  → BusinessDataAdapter
  → Source
```

Agents must not call adapters directly. Agents must not receive database or object-storage credentials.

## First real source

Existing Supabase tables do **not** hold enterprise KPIs. Phase 2E does not invent those records and does not change schema or RLS.

The first real record source is `createSessionRecordAdapter()`:

- Reads owner-scoped **profile identity** and **governed agent activity** already available under existing RLS
- Source system: `supabase_owner_rls`
- Domain capability: `technology: true` only when a reader is configured
- `operations`, `inventory`, `supply_chain`, `warehouse`, `customer`, `finance` remain `false`
- Write capability is `false`

The HTTP `/health` adapter remains a **connection-health** probe. It still returns **zero** ERP/WMS/TMS records.

If a live source is down or unconfigured, the runtime shows **SOURCE UNAVAILABLE** or **NOT CONFIGURED**. It does **not** substitute Northstar sample findings.

## Provenance (required)

Every live dataset includes:

- sourceId, sourceSystem, sourceType
- sourceRecordId (nullable)
- ownerId, scope (`public` | `personal` | `organization` | `universe`)
- organizationId, universeId
- retrievedAt, sourceUpdatedAt when known
- freshness / freshnessStatus
- live, prototype, confidence
- dataClassification

Provenance is not optional. Incomplete provenance is rejected.

`technology` is a domain, not a tenant scope. It does not bypass owner, organization, or Universe checks.

- `scope=personal` → ownerId required and must match the caller
- `scope=organization` → organizationId required
- `scope=universe` → organizationId + universeId required
- `scope=public` → explicit `dataClassification: public` on the dataset and the request. Public is never inferred from missing metadata.

Session profile/activity records are `personal` unless a real organization/Universe relationship is present. Profile company/title fields are user-declared identity, not organization-authoritative business records.

Persisted organizations/Universes remain **MIGRATION AUTHORED — NOT APPLIED** after Phase 2F-B because hosted `organizations` already exists with a different shape. Personal identity is not auto-migrated into organization scope.

Organization and Universe company-data reads now require persisted membership verification in the Company Data Gateway. A client `organizationId` or `universeId` alone grants nothing. `user_roles` and `profiles.company` are not tenant authority.

## Freshness

`classifyFreshness()` is timestamp-based, not LLM judgment:

- fresh ≤ 15 minutes
- aging ≤ 6 hours
- otherwise stale
- unknown when no usable timestamp

Agents must not present stale information as current.

## Labels

- LIVE DATA
- PROTOTYPE DATA
- STALE DATA
- SOURCE UNAVAILABLE
- NOT CONFIGURED

Prototype remains for development, testing, CI, offline, and demonstration only. Never present it as live company data.
