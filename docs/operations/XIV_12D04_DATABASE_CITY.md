# XIV 12D-04 ? Database City + Neural Highway Fabric

**Ticket:** 12D-04  
**Branch:** `grok/12d-04-database-city`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d` only  
**State:** research / feature branch only ? software contracts + local-safe stubs  
**L4 production:** false  
**Production dimensional fabric:** false  
**Live production DDL/DML:** false

## Honesty gates

| Flag | Value |
|------|-------|
| CURRENT_DIMENSIONAL_MILESTONE | 12 |
| RESEARCH_DIMENSION_CEILING | 100 |
| PRODUCTION_DIMENSIONAL_FABRIC_ENABLED | false |
| L4_PRODUCTION_ENABLED | false |
| autonomousProductionDDL/DML/destructive/secrets/deploy | false |
| unstructuredMillionDbClaim | false |
| liveProductionDdlAllowed | false |

## Topology (CEO diagram)

```
device (Pocket Brain)
  ? local_shard
    ? company_brain
      ? regional_brain
        ? global_brain (federated; never materializes wholly on a device)
```

- **Pocket Brain** ? **Global Brain**
- Sparse graph routing ("city inside chips") ? bounded degree, not millions of unstructured DBs
- Memory heat tiers: `hot` / `warm` / `cold` / `archive`
- Offline-first sync journal + MANUAL conflict reconciliation stubs
- Vector search: `LOCAL_STUB` or `WAITING_PROVIDER` (never fake VERIFIED ANN)
- Historical memory bridge reuse via `bridgeHistoryOntoCity`
- Google Cloud adapters: **CLOUD_SANDBOX** generate-only ? no autonomous deploy; no secrets in git (CEO-only sealed ops)

## Deliverables

| Module | Role |
|--------|------|
| `database-city.ts` | City nodes, Pocket/Global brain types, neural highways, heat tiers, silicon claims (CPU-first) |
| `sync-journal.ts` | Offline sync journal + conflict reconciliation stubs |
| `vector-search.ts` | Local cosine stub + WAITING_PROVIDER adapter |
| `cloud-sandbox.ts` | Google Cloud CLOUD_SANDBOX plan/execute stubs |
| `12d04.test.ts` | Contract tests |

## Silicon honesty

- CPU may be `VERIFIED` for local research path
- GPU / NPU / QPU: `WAITING` or `DETECTED` only ? **never** fake `VERIFIED`

## Proprietary / secrets

- No cloud credentials or secrets in git
- Sandbox notes mark CEO-only sealed ops for credential handling

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/dimensional.test.ts
npx tsx runtime/dimensional/12d02.test.ts
npx tsx runtime/dimensional/12d03.test.ts
npx tsx runtime/dimensional/12d04.test.ts
npx tsx runtime/dimensional/atomic-memory.test.ts
npx tsx runtime/builder/builder.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab.
