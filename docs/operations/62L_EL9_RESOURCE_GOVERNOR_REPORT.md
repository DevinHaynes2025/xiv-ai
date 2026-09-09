# 62L-EL9 — Resource Governor Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — ceiling reject/throttle **PASS** — **NOT** a Windows/ASUS live thermal/battery verification pass — **NOT** production authorization

Date: 2026-09-09  
Branch: `cursor/62l-el9-resource-governor-4059`  
Tip SHA: `2aa4667f2e6741d8ae2d1116ccdab21dd0cbc4ee`  
Base: `cursor/62l-el8-model-load-evidence-4059` @ `0e7ca0930245d2c1b4cfbc41e2078e2aa8f2c502` (EL8 tip at branch creation; preferred predecessor; EL8-* preferred over EL7/EL6/feat probe)  
Why this base: Founder EL9 SoT prefers EL8 → else EL7 → else EL6/EL5 → else feat/EL/EM. EL8 branch existed; used as predecessor.  
Tip-land onto `xiv-v2` / `main`: **NO**  
PR / ManagePullRequest: **NOT CREATED**  
Production deploy / merge: **NO**

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Never disable Windows thermal protections
- No BIOS / overclock / undervolt / fan-control / power-limit modification
- No unlimited CPU / GPU / RAM
- No automatic cloud spillover without separate authorization
- Guardian / RLS / approval posture **unchanged**
- ASUS live thermal/battery/GPU memory metering remains **NOT_TESTED** until measured on-device

## Core behavior (implemented)

`Task request → estimateResourceNeed → governTaskRequest (policy compare) → ALLOW | THROTTLE | QUEUE | DENY → execute → monitorRunningTask → STOP_SAFE if limits exceeded`

## Governor states

| State | Role |
|---|---|
| `NORMAL` | Within ceilings |
| `THROTTLED` | Soft CPU pressure; reduced plan |
| `RESOURCE_PRESSURE` | Host pressure / GPU-NPU unknown / priority defer |
| `THERMAL_LIMIT` | Read-only thermal serious/critical; protections stay enabled |
| `BATTERY_SAVER` | DC + low battery or on-battery background throttle |
| `MEMORY_LIMIT` | RAM ceiling hit |
| `QUEUE_FULL` | Queue depth at/above ceiling |
| `DENIED` | Hard policy reject (incl. cloud spillover, workers, network, duration, cache) |
| `WAITING_NODE` | Soft-wire: stale/waiting heartbeat |
| `OFFLINE_STOPPED` | Soft-wire: node offline / sleep / shutdown |

## Limits enforced (policy + executed checks)

| Dimension | Enforcement |
|---|---|
| CPU utilization / worker count | ALLOW / THROTTLE / QUEUE / DENY |
| RAM allocation | MEMORY_LIMIT DENY/QUEUE; live STOP_SAFE |
| GPU/NPU memory | QUEUE when not measurable or over ceiling (no destabilizing overcommit) |
| Concurrent model sessions | QUEUE/DENY vs `maxConcurrentModelSessions` |
| Local storage/cache growth | DENY vs `maxLocalCacheBytes` |
| Network use | DENY vs `maxNetworkBytesPerTask` |
| Battery state | BATTERY_SAVER QUEUE/THROTTLE/STOP_SAFE |
| Thermal (Windows-exposed, read-only) | THERMAL_LIMIT DENY/THROTTLE/STOP_SAFE |
| Task duration | DENY at admit; STOP_SAFE while running |
| Queue size | QUEUE_FULL DENY |

Legacy `evaluateResourceRequest` (concurrency + RAM ceilings) **preserved**.

## Soft-wire

| Target | Result at tip |
|---|---|
| EL7 `windows-local-runtime-adapter.ts` | **absent** on this branch tip (presence check only) |
| EL8 `model-load-evidence.ts` | **absent** on this branch tip (presence check only) |
| Heartbeat `WAITING_NODE` / `OFFLINE_STOPPED` | **wired** into admit + monitor |

Presence soft-wire does **not** imply EL7/EL8 VERIFIED.

## Acceptance criteria checklist

| # | Criterion | Evidence | Result |
|---|---|---|---|
| 1 | Policy + estimate + ALLOW/THROTTLE/QUEUE/DENY | `governTaskRequest` / `estimateResourceNeed` | **PASS** (unit, executed) |
| 2 | Monitor + stop-safe | `monitorRunningTask` | **PASS** (unit, executed) |
| 3 | States incl. thermal/battery/heartbeat | `EL9_GOVERNOR_STATES` + tests | **PASS** (unit, executed) |
| 4 | Priority: system/user over XIV background | priority defer → QUEUE | **PASS** (unit, executed) |
| 5 | No cloud spillover without auth | `DENIED_NO_AUTHORIZATION` | **PASS** (unit, executed) |
| 6 | Ceiling reject/throttle in executed tests | memory/workers/CPU/queue/cache/network/duration | **PASS** (unit, executed) |
| 7 | Offline research bounded budgets | `offlineResearchBudgetFactor` | **PASS** (unit, executed) |
| 8 | Simulation cost estimate required | missing estimate → DENY | **PASS** (unit, executed) |
| 9 | Safety locks intact | `assertEl9LocksIntact` | **PASS** (unit, executed) |
| 10 | Legacy ceilings preserved | `evaluateResourceRequest` + prior local-runtime tests | **PASS** (unit, executed) |

## NOT_TESTED inventory

| Item | State |
|---|---|
| Live ASUS Windows thermal API observation | **NOT_TESTED** |
| Live battery/AC metering on device | **NOT_TESTED** |
| Live GPU/NPU memory counters on device | **NOT_TESTED** |
| EL7 Windows local runtime adapter integration | **NOT_TESTED** / module absent on tip |
| EL8 model-load evidence integration | **NOT_TESTED** / module absent on tip |
| Production authorization / tip-land / PR | **false** / not created |

## Deliverables

| Path | Role |
|---|---|
| `services/ai/local-runtime/resource-governor.ts` | Full EL9 governor + preserved legacy ceilings |
| `services/ai/local-runtime/__tests__/el9-resource-governor.test.ts` | EL9 acceptance tests (must execute) |
| `services/ai/package.json` | `test:62lel9` + existing `test:local-runtime` |
| `docs/operations/62L_EL9_RESOURCE_GOVERNOR_REPORT.md` | This report |

## Tests (executed)

Commands:

```bash
cd services/ai && npm run test:62lel9
cd services/ai && npm run test:local-runtime
cd services/ai && npm run typecheck
```

| Command | Result | When (UTC) |
|---|---|---|
| `npm run test:62lel9` | **PASS** — 27/27 | 2026-09-09 after tip `2aa4667` |
| `npm run test:local-runtime` | **PASS** — 33/33 | same run |
| `npm run typecheck` | **PASS** | 2026-09-09T13:44:18Z |

Ceiling enforcement tested: **YES** (memory DENY, workers DENY, concurrency QUEUE, CPU THROTTLE, queue-full DENY, cache/network/duration DENY, unlimited policy DENY).

Do **not** treat unit PASS as ASUS hardware VERIFIED.

## Explicit NON-claims

- Windows thermal protections disabled: **false** (forbidden)
- BIOS/OC/undervolt/fan/power-limit changed: **false** (forbidden)
- Unlimited CPU/GPU/RAM: **false** (forbidden)
- Automatic cloud spillover: **false** (denied without separate auth)
- Tip-land / PR: **NO**
- EL10 workload router: **not implemented** (next only)

## Next (report only — do not implement)

**EL10 — Workload Router** — choose verified CPU/GPU/NPU/local model/authorized hybrid·cloud by privacy, capability, latency, resource state.
