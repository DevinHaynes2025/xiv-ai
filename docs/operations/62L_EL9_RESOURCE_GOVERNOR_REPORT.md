# 62L-EL9 — Resource Governor Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — rebased onto final EL8 tip — unit tests **executed** — ceiling reject/throttle **PASS** — **NOT** a Windows/ASUS live thermal/battery verification pass — **NOT** production authorization

Date: 2026-09-09  
Branch: `cursor/62l-el9-resource-governor-4059`  
Tip SHA: `354e017f9eeaa71b5e1851ecb830164ad636094a`  
Base: `cursor/62l-el8-model-load-evidence-4059` @ `224715c9b741c181bf97131e9c29985d9192038d`  
EL8 predecessor: EL7 `0777b506775c5215a8c60a030a984fe0c2f4b3de`  
Prior EL9 bases: `4447be8…` (interim EL8), `0e7ca09…` (initial)  
Tip-land onto `xiv-v2` / `main`: **NO**  
PR / ManagePullRequest: **NOT CREATED**  
Production deploy / merge: **NO**  
Rebase onto final EL8: **YES**

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
| GPU/NPU memory | QUEUE when not measurable or over ceiling |
| Concurrent model sessions | QUEUE/DENY vs `maxConcurrentModelSessions` |
| Local storage/cache growth | DENY vs `maxLocalCacheBytes` |
| Network use | DENY vs `maxNetworkBytesPerTask` |
| Battery state | BATTERY_SAVER QUEUE/THROTTLE/STOP_SAFE |
| Thermal (Windows-exposed, read-only) | THERMAL_LIMIT DENY/THROTTLE/STOP_SAFE |
| Task duration | DENY at admit; STOP_SAFE while running |
| Queue size | QUEUE_FULL DENY |

Legacy `evaluateResourceRequest` (concurrency + RAM ceilings) **preserved**.

## Soft-wire (post-final-EL8 rebase)

| Target | Result at tip |
|---|---|
| EL7 `inference-adapter.ts` | **present** |
| EL7 `el7-soft-wire.ts` | **present** |
| EL8 `model-load-evidence.ts` | **present** |
| Heartbeat `WAITING_NODE` / `OFFLINE_STOPPED` | **wired** into admit + monitor |

Presence soft-wire does **not** imply EL7/EL8 VERIFIED.

## Acceptance criteria checklist

| # | Criterion | Result |
|---|---|---|
| 1 | Policy + estimate + ALLOW/THROTTLE/QUEUE/DENY | **PASS** (executed) |
| 2 | Monitor + stop-safe | **PASS** (executed) |
| 3 | States incl. thermal/battery/heartbeat | **PASS** (executed) |
| 4 | Priority: system/user over XIV background | **PASS** (executed) |
| 5 | No cloud spillover without auth | **PASS** (executed) |
| 6 | Ceiling reject/throttle in executed tests | **PASS** (executed) |
| 7 | Offline research bounded budgets | **PASS** (executed) |
| 8 | Simulation cost estimate required | **PASS** (executed) |
| 9 | Safety locks intact | **PASS** (executed) |
| 10 | Legacy ceilings preserved | **PASS** (executed) |

## NOT_TESTED inventory

| Item | State |
|---|---|
| Live ASUS Windows thermal/battery/GPU metering | **NOT_TESTED** |
| EL7/EL8 production verification | **NOT_TESTED** (presence only) |
| Production authorization / tip-land / PR | **false** / not created |

## Tests (executed post-rebase onto `224715c`)

```bash
cd services/ai && npm run test:62lel9
cd services/ai && npm run test:local-runtime
cd services/ai && npm run typecheck
```

| Command | Result |
|---|---|
| `npm run test:62lel9` | **PASS** — 27/27 |
| `npm run test:local-runtime` | **PASS** — 104/104 |
| `npm run typecheck` | **PASS** |

Ceiling enforcement tested: **YES**.

## Next (report only — do not implement)

**EL10 — Workload Router** — choose verified CPU/GPU/NPU/local model/authorized hybrid·cloud by privacy, capability, latency, resource state.
