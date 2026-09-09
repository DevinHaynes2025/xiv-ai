# 62L-EM7 — Device-Neutral Inference Router Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — **rebased onto EM6** — unit tests **re-executed** — safeguard denies + priority scoring **PASS** — soft-wires updated — **NOT** a live multi-vendor ASUS verification pass — **NOT** production authorization

Date: 2026-09-09  
Branch: `cursor/62l-em7-device-neutral-inference-router-4059`  
Tip SHA: `73a892ff148615e7927e6033dceec0ebc5dad5e5`  
Base used: `cursor/62l-em6-nvidia-runtime-candidate-path-4059` @ `5301b7cf24672d16b27adead619d02db7eaace3f`  
EM6 lineage includes EM3 @ `eb6e963ac31af155225660cb2a420116e21abaff` (on EM1/#157)  
Prior base (superseded): EL9 @ `c834e5242ba1a2b04e6126babbbaf695133178b1`  
Rebase onto EM6: **YES**  
EM5 remote: **ABSENT** at rebase time (EM5 soft-wire via onnx/AMD candidate modules on EM6 tip)  
EM4 tip exists remotely but is **not** an ancestor of EM6 → envelope soft-wire **ABSENT** (honest)  
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

## Soft-wire (presence only — post-EM6 rebase)

| Target | Presence | Notes |
|---|---|---|
| EM3 Universal Compute Registry | **PRESENT** | `universal-compute-registry.ts` + `em3-honesty.ts` |
| EM4 message envelope | **ABSENT** | EM4 tip not in EM6 ancestry; fallback visibility still enforced in EM7 decision record |
| EM5 AMD Windows ML | **PRESENT** | via `onnx-windows-ml-adapter.ts` / `amd-gpu-capability.ts` on EM6 tip |
| EM6 NVIDIA runtime | **PRESENT** | `nvidia-runtime-adapter.ts` + `em6-honesty.ts` / soft-wire |
| EL9 Resource Governor | **PRESENT** | ceiling soft-wire + locks |
| EM1 Agent Home Base | **PRESENT** | `local-brain/agent-home-base-*.ts` |
| Prior EM honesty / capability-truth | **PRESENT** | |

Presence ≠ VERIFIED ≠ production authorization.

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
Result after EM6 rebase: **12/12 PASS** (locks, soft-wire, safeguards, priority, vendor-neutral scoring, decision fields).

## Next (do not implement here)

**EM8 — Compute Return Receipt** — every CPU/GPU/NPU/edge/cloud execution must return proof of what actually ran before XIV accepts the result into Home Base.
