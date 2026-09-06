# XIV Real Data

Phase 2D adds a replaceable **real** read-only adapter beside the prototype Context Provider.

## Status

| Piece | Maturity |
| --- | --- |
| PrototypeContextProvider | IMPLEMENTED (sample / CI / offline / demo) |
| BusinessDataAdapter + provenance | IMPLEMENTED |
| Company Data Gateway (read-only) | IMPLEMENTED |
| HTTP `/health` connection adapter | IMPLEMENTED (real probe, no invented records) |
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

Existing Supabase tables do **not** hold enterprise business metrics. Phase 2D does not invent those records and does not change schema or RLS.

The first real adapter is `createHttpHealthAdapter()`:

- Probes the existing XIV AI `GET /health` URL when configured
- Returns `live` | `unavailable` | `not_configured` | `stale`
- Returns **zero** business metric records
- Always includes provenance
- Write capability is `false`

If the live source is down or unconfigured, the UI/runtime shows **Live source unavailable**. It does **not** substitute Northstar sample findings.

## Provenance (required)

Every dataset includes:

- sourceId, sourceSystem, sourceType
- sourceRecordId (nullable)
- organizationId, universeId
- retrievedAt, freshness
- live, prototype, confidence

Provenance is not optional. Incomplete provenance is rejected.

## Labels

- LIVE DATA
- PROTOTYPE DATA
- STALE DATA
- SOURCE UNAVAILABLE

Prototype remains for development, testing, CI, offline, and demonstration only. Never present it as live company data.
