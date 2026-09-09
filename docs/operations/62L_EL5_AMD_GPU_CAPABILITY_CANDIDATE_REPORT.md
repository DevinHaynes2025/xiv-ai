# 62L-EL5 — AMD GPU Capability Candidate Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests executed — **NOT** a Windows-node / ASUS GPU verification pass — **NOT** production authorization

Date: 2026-09-09  
Branch: `cursor/62l-el5-amd-gpu-capability-candidate-4059`  
Base tip: `origin/feat/62l-el-local-runtime-probe` @ `0e7ca0930245d2c1b4cfbc41e2078e2aa8f2c502`  
Why this base: Founder EL SoT (`feat/62l-el-local-runtime-probe`) preferred; contains hardware-probe / workload-router / resource-governor / runtime-state.  
Tip-land onto `xiv-v2` / `main`: **NO**  
PR / ManagePullRequest: **NOT CREATED**  
Production deploy / merge: **NO**  
GPU VERIFIED claimed: **NO**

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- AMD/Radeon visibility ⇒ **DETECTED** only
- **DETECTED ≠ VERIFIED**
- Truth progression (hard): `UNKNOWN → DETECTED → SUPPORTED → VERIFIED` — **deny skip**
- GPU execution stays **NOT_TESTED** until a real model loads and performs **bounded** inference
- CPU remains the default fallback
- Candidate runtimes (Windows ML / ONNX Runtime) are **candidates**, not proven
- Probe is **read-only**; no driver install, elevation, cloud purchase, or system config changes
- Guardian / RLS / tenant-Universe isolation / human-approval posture **unchanged** (soft-wire only)

## Truth progression

| From | To | Allowed? |
|---|---|---|
| UNKNOWN → DETECTED | adjacent | yes |
| DETECTED → SUPPORTED | adjacent | yes |
| SUPPORTED → VERIFIED | adjacent (needs bounded evidence) | yes when evidence exists |
| DETECTED → VERIFIED | **skip** | **DENIED** |
| UNKNOWN → VERIFIED | **skip** | **DENIED** |

Side states preserved: `DEGRADED` / `UNAVAILABLE` / `NOT_TESTED`.

## Acceptance criteria checklist

| # | Criterion | Evidence | Result |
|---|---|---|---|
| 1 | Detect GPU name/vendor via read-only Windows APIs; stub/simulator for non-Windows CI | `hardware-probe.ts` + `simulateHardwareProbe` + EL5 tests | **PASS** (unit) |
| 2 | AMD hardware initially **DETECTED**, never auto **VERIFIED** | `classifyAmdGpuCandidate` / `refuseAmdGpuAutoVerify` | **PASS** (unit) |
| 3 | Record candidate paths Windows ML / ONNX Runtime (not proven) | `AMD_GPU_RUNTIME_PATH_CANDIDATES` | **PASS** (unit) |
| 4 | Do not access personal files, credentials, browser data, unrelated processes | `EL5_LOCKS` + probe notes | **PASS** (contract/unit) |
| 5 | CPU remains default fallback | `routeWorkload` / `routeWithAmdGpuCandidatePolicy` | **PASS** (unit) |
| 6 | GPU execution **NOT_TESTED** until bounded inference | `resolveGpuExecutionState` / benchmark recorder | **PASS** (unit) |
| 7 | Benchmark records model, provider, latency, memory/resource, timestamp, errors | `recordGpuCapabilityBenchmark` | **PASS** (unit) |
| 8 | Failed/unsupported GPU → safe CPU fallback | `attemptGpuOrFallbackCpu` / `routeAfterGpuFailure` | **PASS** (unit) |
| 9 | No driver install / elevation / cloud purchase / system config changes | `EL5_LOCKS` + benchmark flags | **PASS** (contract/unit) |
| 10 | Guardian, RLS, tenant/Universe isolation, human-approval unchanged | soft-wire `policies.ts` assertions | **PASS** (unit soft-wire) |
| 11 | `L4_AUTONOMY_ENABLED=false` | `EL5_LOCKS.L4_AUTONOMY_ENABLED` | **PASS** (unit) |

## NOT_TESTED inventory

| Item | State | Notes |
|---|---|---|
| Live ASUS Windows CIM GPU probe on device | **NOT_TESTED** | CI uses injected stub/simulator |
| Windows ML provider install / EP | **NOT_TESTED** | Candidate only |
| ONNX Runtime AMD GPU EP | **NOT_TESTED** | Candidate only |
| Real model load on AMD GPU | **NOT_TESTED** | No bounded inference executed on device in this agent |
| AMD GPU **VERIFIED** claim | **NOT_TESTED** / **denied without evidence** | Fixtures must not fake VERIFIED |
| AMD NPU capability (EL6) | **NOT_TESTED** | Next candidate only — not implemented here |
| Production authorization | **false** | Unchanged |

## Deliverables

| Path | Role |
|---|---|
| `services/ai/local-runtime/capability-truth.ts` | Truth progression + deny-skip |
| `services/ai/local-runtime/amd-gpu-capability.ts` | AMD GPU candidate classification + CPU fallback |
| `services/ai/local-runtime/benchmark.ts` | Benchmark field recorder |
| `services/ai/local-runtime/hardware-probe.ts` | Read-only probe + CI stub/simulator |
| `services/ai/local-runtime/workload-router.ts` | CPU-first + `routeAfterGpuFailure` |
| `services/ai/local-runtime/types.ts` | EL truth set constant |
| `services/ai/local-runtime/__tests__/el5-amd-gpu-capability.test.ts` | EL5 acceptance tests |
| `services/ai/package.json` | `test:62lel5` + existing `test:local-runtime` |
| `docs/operations/62L_EL5_AMD_GPU_CAPABILITY_CANDIDATE_REPORT.md` | This report |

## Tests

Commands:

```bash
cd services/ai && npm run test:62lel5
cd services/ai && npm run test:local-runtime
```

| Command | Result |
|---|---|
| `npm run test:62lel5` | **PASS** — 18/18 |
| `npm run test:local-runtime` | **PASS** — 24/24 (includes prior EL probe tests; no regression) |

GPU VERIFIED claimed from these tests: **NO** (fixtures prove rules only).

## Soft-wire

- Existing policy: auto high-risk blocked (`policy_high_risk_blocked`); consequential / medium tools require human approval; `canAutoExecute` remains false
- EK/EL probe-first: extends founder EL local-runtime probe; does not weaken Guardian/RLS
- ASUS actual AMD state remains **unverified** until real probe + bounded benchmark on device

## Explicit NON-claims

- ASUS AMD GPU inference already run: **false**
- GPU VERIFIED: **NO**
- Driver/runtime installed by this change: **false**
- NPU capability (EL6): **not implemented**

## Next (report only — do not implement)

**EL6 — AMD NPU Capability Candidate** — same evidence-first approach for any Ryzen AI NPU on the ASUS.
