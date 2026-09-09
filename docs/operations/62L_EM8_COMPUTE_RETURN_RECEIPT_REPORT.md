# 62L-EM8 — Compute Return Receipt Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — fallback honesty **PASS** — Home Base ingest gate **PASS** — immutability **PASS** — **NOT** production authorization

Date: 2026-09-09  
Branch: `cursor/62l-em8-compute-return-receipt-4059`  
Tip SHA: `87578e676fffe822653597fb0c045317f5ab1ce3`  
Feat commit (post-rebase): `50842bc`  
Rebase: **YES** onto final EM7 `5b8cf08` (from interim `ed53f61`)  
Base: EM7 `cursor/62l-em7-device-neutral-inference-router-4059` @ `5b8cf085f9f9fbdddfd29f1f4c4055f5c649a85b` (on sealed EM6 `a17e6609fad9319c3abe8ddb68928459cdbee0be`)  
Preferred predecessor `cursor/62l-em7-*`: **local pointer only** (no unique commits beyond EL9) — EM6/EM5/EM4 likewise empty of unique commits → used EM3 tip which soft-carries EM1 + registry  
Tip-land onto `xiv-v2` / `main`: **NO**  
PR / ManagePullRequest / L4 / silent authority: **NOT CREATED / DENIED**  
Production deploy / merge: **NO**

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- **Requested hardware ≠ actual hardware** (hard)
- CPU fallback after NPU/GPU request does **not** verify the accelerator
- Finalized receipts are **immutable** audit artifacts
- No hidden chain-of-thought stored on receipts
- Tenant / Universe IDs must match originating request
- Missing / malformed receipts → results **UNVERIFIED**
- Stale runtime evidence cannot promote hardware capability
- Neural pathway ingestion preserves `receiptRef`
- High-consequence outputs still need human approval even if compute `PASS`
- Soft-wire EM1 Home Base acceptance gate: **no accept without valid signed receipt**
- No tip-land / PR / ManagePullRequest from this child branch

## User story

As XIV AI OS, every compute execution returns a structured receipt so Home Base knows exactly what device, runtime, model, and fallback path actually handled the task.

## Core rule (hard — tested)

If agent asks for NPU but runtime executes on CPU:

| Field | Value |
|---|---|
| `requestedDevice` | `NPU` |
| `actualDevice` | `CPU` |
| `fallbackUsed` | `true` |
| `requestedHardwareVerified` | `false` |

CPU result may be valid; **it does not verify the NPU**.

## Receipt fields (encoded)

`requestId`, `agentId`, `taskId`, `homeUniverseId`, `tenantId`, `requestedDevice`, `actualDevice`, `nodeId`, `runtimeProvider`, `model.modelId` + `model.modelVersionOrHash`, `startedAt`, `completedAt`, `latencyMs`, `resourceUsage`, `fallbackUsed`, `resultState`, `failureClass`, `evidenceRefs`, `receiptSignature`

## Receipt states

`PASS` | `FAIL` | `PARTIAL` | `DEGRADED` | `TIMEOUT` | `RESOURCE_LIMIT` | `PROVIDER_UNAVAILABLE` | `POLICY_DENIED`

Ingest outcome for missing/malformed: **`UNVERIFIED`** (not a compute `resultState`).

## Deliverables

| Artifact | Path |
|---|---|
| Honesty locks | `services/ai/local-runtime/em8-honesty.ts` |
| Soft-wire EM4/EL8/EM5/EM6/EM7 + EM1 | `services/ai/local-runtime/em8-soft-wire.ts` |
| Types | `services/ai/local-runtime/compute-return-receipt-types.ts` |
| Schema / finalize / verify | `services/ai/local-runtime/compute-return-receipt.ts` |
| Home Base ingest gate | `services/ai/local-runtime/em8-home-base-ingest.ts` |
| Neural pathway receiptRef | `services/ai/local-runtime/em8-neural-pathway.ts` |
| Tests | `services/ai/local-runtime/__tests__/em8-compute-return-receipt.test.ts` |
| npm script | `npm run test:62lem8` |
| This report | `docs/operations/62L_EM8_COMPUTE_RETURN_RECEIPT_REPORT.md` |

## Soft-wire (presence at tip)

| Target | Result at tip |
|---|---|
| EM1 Home Base contract | **PRESENT** |
| EL8 model-load evidence | **PRESENT** |
| EL9 resource governor | **PRESENT** |
| EM3 universal compute registry | **PRESENT** |
| EM4 envelope | **ABSENT** (honest; soft-wire only) |
| EM5 AMD Windows ML | **PRESENT** (adapter / honesty soft-wire candidates) |
| EM6 NVIDIA candidate | **PRESENT** |
| EM7 device-neutral router | **PRESENT** |

Presence soft-wire does **not** imply predecessors VERIFIED or production authorization.

## Acceptance criteria checklist

| # | Criterion | Result |
|---|---|---|
| 1 | Receipt schema + signature | **PASS** (executed) |
| 2 | Finalize / immutability | **PASS** (executed) |
| 3 | NPU→CPU fallback honesty (no NPU verify) | **PASS** (executed) |
| 4 | Home Base ingest requires valid signed receipt | **PASS** (executed) |
| 5 | Missing/malformed → UNVERIFIED | **PASS** (executed) |
| 6 | Tenant/Universe match | **PASS** (executed) |
| 7 | No hidden CoT | **PASS** (executed) |
| 8 | Stale evidence cannot promote hardware | **PASS** (executed) |
| 9 | Neural pathway preserves receiptRef | **PASS** (executed) |
| 10 | High-consequence still needs human approval | **PASS** (executed) |
| 11 | `L4_AUTONOMY_ENABLED=false` | **PASS** (executed) |

## Tests (executed)

```bash
cd services/ai && npm run test:62lem8
```

**Result: PASS** — 18/18 tests passed, 0 failed (agent run 2026-09-09).

## NOT_TESTED inventory

| Item | State |
|---|---|
| Live multi-node receipt mesh | **NOT_TESTED** |
| Production KMS / HSM receipt signatures | **NOT_TESTED** (dev HMAC key id only) |
| Live NPU/GPU bounded inference receipts | **NOT_TESTED** |
| EM4/EM5/EM6/EM7 full module landing | **NOT_LANDED** (soft-wire presence only) |
| EM9 compute resource market simulator | **NOT IMPLEMENTED** (next) |
| Production authorization / tip-land / PR | **false** / not created |

## Next (do not implement on this branch)

**EM9 — Compute Resource Market Simulator** — compare verified local/edge/authorized cloud on cost, latency, reliability, privacy, energy proxies before choosing where workloads run.
