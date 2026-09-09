# 62L-EM7 — Device-Neutral Inference Router Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — safeguard denies + priority scoring **PASS** — soft-wire EM3/EM5/EM6/EL9/EM1 (presence) — **NOT** a live multi-vendor ASUS verification pass — **NOT** production authorization

Date: 2026-09-09  
Branch: `cursor/62l-em7-device-neutral-inference-router-4059`  
Base: `cursor/62l-el9-resource-governor-4059` @ `c834e5242ba1a2b04e6126babbbaf695133178b1`  
Predecessor preference: EM6 → EM5/EM4/EM3 → EL9 — **EM6 remote absent at implement time; EM3–EM5 park-and-implement still landing → EL9 tip used**  
Tip-land onto `xiv-v2` / `main`: **NO**  
PR / ManagePullRequest: **NOT CREATED**  
Production deploy / merge: **NO**  
Automatic capacity purchase: **FORBIDDEN**  
Silent privacy downgrade: **FORBIDDEN**  
`L4_AUTONOMY_ENABLED`: **false**

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

## User story

As XIV AI OS, one hardware-neutral router lets agents request inference without hard-coding AMD, NVIDIA, CPU, NPU, edge, or cloud paths.

## Core flow (implemented)

`Agent Request → Policy → Data Classification → Model Compatibility → Compute Registry → Resource Governor → Route Scoring → Execute → Return Receipt → XIV Home Base`

Home Base result acceptance is **PENDING_EM8_RECEIPT** (EM8 owns compute return receipts).

## Priority bands (privacy & correctness before speed)

1. `LOCAL_VERIFIED_NPU_GPU`
2. `LOCAL_VERIFIED_CPU`
3. `AUTHORIZED_EDGE`
4. `AUTHORIZED_CLOUD`

## Scoring inputs (eligible routes only)

privacy/locality, model compatibility, hardware verification state, latency evidence, available RAM/VRAM, current queue/load, reliability history, cost, energy proxy, network availability, tenant/Universe policy, fallback permissions / preference hints (non-exclusive)

## Routing decision fields

`selectedNode`, `selectedDevice`, `runtimeProvider`, `reasonCodes`, `estimatedLatency`, `estimatedCost`, `privacyState`, `fallbackPlan`, `evidenceRefs` (+ priorityBand, score, deniedCandidates, locks)

## Critical safeguards (tested)

| Safeguard | Result |
|---|---|
| NOT_TESTED / UNAVAILABLE / stale denied when verified required | **PASS** |
| No cross-tenant data movement for faster compute | **PASS** |
| No cloud spillover without explicit authorization | **PASS** |
| No automatic capacity purchase | **PASS** |
| Accelerator failure → fallback visible in receipt (EM4 soft-wire) | **PASS** |
| No silent privacy downgrade | **PASS** |
| Consequential tasks approval-gated on any compute path | **PASS** |
| `L4_AUTONOMY_ENABLED=false` | **PASS** |

## Soft-wire (presence only)

| Target | Role |
|---|---|
| EM3 Universal Compute Registry | presence probe |
| EM4 message envelope | fallback visibility soft-wire |
| EM5 AMD Windows ML | presence / onnx / AMD candidates |
| EM6 NVIDIA runtime | presence / honesty candidate |
| EL9 Resource Governor | **PRESENT** (ceiling soft-wire + locks) |
| EM1 Agent Home Base | presence probe |
| Prior EM honesty / capability-truth | **PRESENT** |

Presence ≠ VERIFIED ≠ production authorization. ABSENT predecessors are honest on the EL9 park-and-implement base.

## Deliverables

| Artifact | Path |
|---|---|
| Router | `services/ai/local-runtime/device-neutral-inference-router.ts` |
| Types | `services/ai/local-runtime/device-neutral-inference-router-types.ts` |
| Honesty | `services/ai/local-runtime/em7-honesty.ts` |
| Soft-wire | `services/ai/local-runtime/em7-soft-wire.ts` |
| Tests | `services/ai/local-runtime/__tests__/em7-device-neutral-inference-router.test.ts` |
| Script | `npm run test:62lem7` (in `services/ai`) |

## Test evidence

Command: `npm run test:62lem7` (cwd `services/ai`)  
Result: **12/12 PASS** (locks, soft-wire, safeguards, priority, vendor-neutral scoring, decision fields).

## Next (do not implement here)

**EM8 — Compute Return Receipt** — every CPU/GPU/NPU/edge/cloud execution must return proof of what actually ran before XIV accepts the result into Home Base.
