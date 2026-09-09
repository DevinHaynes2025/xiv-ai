# 62L-EP5 — Public Benchmark Memory Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest / published≠XIV conflation / unsafe hardware tuning

Date: 2026-09-09  
Branch: `cursor/62l-ep5-public-benchmark-memory-4059`  
Tip SHA: *(pending commit — will align after push)*  
Base: `cursor/62l-ep4-proprietary-ip-firewall-4059` @ `756c93c1d3d9249fc59a180759469c9951d01c23`  
Predecessor: EP4 Proprietary-IP Firewall **PRESENT**; EP3 **WAITING_DATA** (not landed)  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP5 Public Benchmark Memory*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- **Published benchmark ≠ XIV verification**
- `VENDOR_PUBLISHED` remains a **distinct** record from `XIV_LOCAL_MEASURED`
- Virtual Chip scheduler prefers **recent, comparable, locally measured** evidence when available
- Missing normalization → **NOT_COMPARABLE** (no naïve comparisons)
- Regression memory: **PASS / REGRESSED / IMPROVED / STALE**
- Stale evidence **decays** in the neural compute graph (not permanently trusted)
- Lawful public / licensed / authorized benchmarks only
- No private benchmark DB / confidential customer results / proprietary suites across tenants
- No benchmark may justify overclocking, thermal bypass, firmware modification, or unsafe hardware tuning
- Recommend ≠ act; agents return advisory evidence to Home Base only
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Evidence classes (7)

`VENDOR_PUBLISHED` | `INDEPENDENT_PUBLIC` | `PEER_REVIEWED` | `XIV_LOCAL_MEASURED` | `CUSTOMER_AUTHORIZED_MEASURED` | `SIMULATED` | `UNKNOWN`

## Benchmark record fields (23)

`benchmarkId`, `vendor`, `deviceChip`, `deviceType`, `architectureGeneration`, `runtimeProvider`, `driverRuntimeVersion`, `modelWorkload`, `precision`, `batchSize`, `datasetInput`, `latency`, `throughput`, `memoryUsage`, `powerEnergyProxy`, `benchmarkMethodology`, `source`, `sourceDate`, `rightsLicenseState`, `environment`, `reproducibilityNotes`, `confidence`, `evidenceClass`

## Normalization dimensions (9)

`exact_hardware` | `model_version` | `input_size` | `precision` | `runtime` | `batch_size` | `thermal_power_conditions` | `software_version` | `peak_theoretical_vs_end_to_end_measured`

Comparability: `COMPARABLE` | `NOT_COMPARABLE` | `PARTIALLY_COMPARABLE`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP4 tip |
| --- | --- |
| EP4 Proprietary-IP Firewall + report | **PRESENT** |
| EP2 Cross-Vendor Capability Graph + report | **PRESENT** |
| EP1 Virtual Chip Contract + report | **PRESENT** |
| EP3 Chip Research Agent Team | **WAITING_DATA** / absent |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `public-benchmark-memory-types.ts` | evidence classes, fields, locks, soft-wire |
| `public-benchmark-memory-runtime.ts` | register/compare/regress/deny surfaces + cycle |
| `public-benchmark-memory.ts` | public facade |
| `phase62lep5.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP5_PUBLIC_BENCHMARK_MEMORY_REPORT.md` | this report |

## Autonomy / IP / safety denies (tested)

| Deny | Result |
| --- | --- |
| Equate published with XIV verification | → **DENIED** |
| Naive comparison treated as comparable | → **DENIED** / **NOT_COMPARABLE** |
| Stale evidence permanently trusted | → **DENIED** (decay) |
| Private benchmark DB cross-tenant copy | → **DENIED** |
| Confidential customer results cross-tenant | → **DENIED** |
| Overclock / thermal bypass / firmware / unsafe tuning via benchmark | → **DENIED** |
| Agent auto-authority / recommend=act | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep5
```

| Command | Result |
| --- | --- |
| `npm run test:62lep5` | **PASS** — Published≠XIV; NOT_COMPARABLE; scheduler prefers local measured; regression/STALE decay; IP/safety denies; EP4/EP2/EP1 soft-wire PRESENT |

## Next (report only — do not implement)

**EP6 — Local Hardware Truth Probe v2** — connect this benchmark memory to actual read-only ASUS CPU/GPU/NPU detection and create the first machine-specific evidence profile for the local XIV node.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
