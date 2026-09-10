# XIV 12D-05 — Universe Simulation Kernel

**Ticket:** 12D-05  
**Branch:** `grok/12d-05-universe-simulation-kernel`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d` only  
**Ingest:** `origin/xiv-12d-dimensional-fabric` @ `f6eae640` (multi-cloud Database City)  
**State:** research / feature branch — SIMULATION contracts + local-safe stubs  
**L4 production:** false  
**Production dimensional fabric:** false  
**Live production DDL/DML:** false

## Founder Twin ethics gate

| Constant | Value |
|----------|-------|
| UNIVERSES_ARE_SIMULATION_LAYERS_ONLY | true |
| PHYSICAL_PORTALS_BANNED | true |
| PHYSICAL_PORTAL_CAPABILITY | false |
| QUANTUM_ADVANTAGE_CLAIM | false |
| VALUATION_THEATER_ALLOWED | false |
| BUSINESS_BAR_METRICS | adoption, reliability, security, unit_economics, customer_value |
| HIGH_AUTONOMY_TARGETS | LOCAL, CLOUD_SANDBOX |
| autonomousProduction* | all false |
| autonomousProductionReplication | false |
| cloudProvidersAreSandboxRoutingOnly | true (GCP/Azure = sandbox routing, not PRODUCTION deploy / live DDL) |

Universes are **SIMULATION layers only**. Red-line capabilities remain disabled. UX/docs/prompts must not use banned red-line language; `assertEthicsSafeCopy` enforces this in tests.

## Deliverables

| Module | Role |
|--------|------|
| `universe-ethics.ts` | Assertable Founder Twin ethics + kernel guardrails |
| `universe-kernel.ts` | SimulatedUniverse, companies, supply chains, agents, spatial/XR schema, scenario branches, city+multi-cloud routing |
| `sqlite-shard-fixture.ts` | Pocket Brain metadata SQLite fixtures (memory / temp-file via `node:sqlite`) |
| `offline-manifest.ts` | Checksummed offline manifests + IN_SYNC / CONFLICT / WAITING_SYNC reconcile |
| `architecture-reader.ts` | Markdown/JSON topology summary for Command Center / mobile |
| `city-blueprint-emitter.ts` | LOCAL_RULES (+ Ollama when reachable) reviewable blueprint emitter — never applied DDL |
| `12d05.test.ts` | Contract tests |
| `runtime/databasecity/*` | Ingested 12D-04 multi-cloud neural highway (f6eae640) |

## Topology wiring

```
SimulatedUniverse (SIMULATION layer)
  -> dimensional Database City ladder (device -> local_shard -> company -> regional -> global)
  -> databasecity multi-cloud highway (LOCAL / GOOGLE_CLOUD / AZURE sandbox routing)
  -> memory heat HOT/WARM/COLD/ARCHIVE on world-state
  -> offline SQLite pocket_meta + checksummed manifest
```

Routing factors (multi-cloud): latency, cost, offline preference, tenant isolation, encryption, write requirements, vector/graph capability, allowed providers.

Quantum: classical pathway math + QPU-candidate simulator only — never claim quantum advantage.

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/dimensional.test.ts
npx tsx runtime/dimensional/12d02.test.ts
npx tsx runtime/dimensional/12d03.test.ts
npx tsx runtime/dimensional/12d04.test.ts
npx tsx runtime/dimensional/12d05.test.ts
npx tsx runtime/dimensional/atomic-memory.test.ts
npx tsx runtime/builder/builder.test.ts
npx tsx runtime/databasecity/databasecity.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab.