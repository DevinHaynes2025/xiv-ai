# 62L-EM3 — Universal Compute Registry Report

Status: **IMPLEMENTED on child branch** — **rebased onto EM1 (post-#157)** — unit tests **re-executed** — **NOT** a live ASUS/cloud verification pass — **NOT** production authorization — no tip-land / PR / DB apply / auto-purchase

Date: 2026-09-09

## Source of truth

- Founder queue title: **62L-EM3 — Universal Compute Registry**
- User story: one governed registry of CPU, GPU, NPU, edge, and authorized cloud compute so agents choose hardware from evidence, not assumptions

## Predecessor / base

| Field | Value |
| --- | --- |
| Preferred EM2 | `cursor/62l-em2-*` — **ABSENT** |
| Preferred EM1 | `cursor/62l-em1-agent-home-base-contract-4059` @ `ffc8b69b0f7f853c4e0eaf2d82ecbccb41c5045b` (includes sealed #157) |
| Home-base #157 | `cursor/62l-em-agent-compute-home-base-4059` @ `b1040f4124802f73fe3545f6a5e9f9da8337ce0c` (ancestor of EM1) |
| Effective base | EM1 `ffc8b69b0f7f853c4e0eaf2d82ecbccb41c5045b` |
| Working branch | `cursor/62l-em3-universal-compute-registry-4059` |
| EM3 implement SHA (rebased) | `8de694cb4998f7ef5ebed998bd070df2323cec24` |
| Rebase | **YES** — onto EM1 latest after #157 |
| Tip-land / PR | **NO** |

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- `DETECTED ≠ VERIFIED` / `DETECTED ≠ usable`
- Silent fallback ≠ accelerator verify
- Guardian / RLS / tenant / Universe boundaries intact
- Cloud auto-purchase forbidden
- DB candidates: **NOT_APPLIED**

## Node contract (encoded)

`nodeId`, `owner`, `tenantId` / `universeScope`, `deviceType`, `cpu` / `gpu` / `npu`, `ramBytes`, `storageBytes`, `osRuntime`, `executionProviders`, `placement` (local/edge/cloud), `privacyClass`, `costModel`, `latencyEvidence`, `energyProxy`, `heartbeat`, `verificationState`, `revocationState` (+ cloud authorization when placement=cloud)

## Truth states

Promotion: `UNKNOWN → DETECTED → SUPPORTED → VERIFIED`  
Side / wait: `DEGRADED`, `UNAVAILABLE`, `NOT_TESTED`, `WAITING_NODE`

## Modules

| Module | Role |
| --- | --- |
| `local-runtime/universal-compute-registry-types.ts` | Contracts |
| `local-runtime/universal-compute-registry.ts` | Registry + eligibility + selection gates |
| `local-runtime/em3-honesty.ts` | EM3 locks |
| `local-runtime/em3-soft-wire.ts` | Soft-wire EL5–EL9 + prior EM truth rules |
| `local-runtime/__tests__/phase62lem3.test.ts` | Denial + selection tests |
| `package.json` → `test:62lem3` | Test entry |

Home soft-wire: optional `local-brain/` presence checked; registry lives in `local-runtime` (EM/EL home on this base).

## Rules tested (all PASS)

| Rule | Result |
| --- | --- |
| Detected hardware not automatically usable | **PASS** |
| AMD/NVIDIA/Intel/Apple/other same evidence model | **PASS** |
| GPU/NPU VERIFIED requires bounded inference or benchmark | **PASS** |
| Cloud requires explicit authorization; no auto-purchase | **PASS** |
| Local/private prefer compatible local compute | **PASS** |
| Cross-tenant deny-by-default | **PASS** |
| Cross-universe / Guardian scope deny | **PASS** |
| Stale heartbeat removes RUNNING_VERIFIED eligibility | **PASS** |
| Revoked devices ineligible for new tasks | **PASS** |
| Perf/cost claims need measured evidence | **PASS** |
| Soft-wire EL5–EL9 + EM; L4=false | **PASS** |

## Tests (executed)

```bash
cd services/ai && npm run test:62lem3
```

| Command | Result |
| --- | --- |
| `npm run test:62lem3` | **PASS** — 14/14 |

## NOT_TESTED inventory

| Item | State |
| --- | --- |
| Founder ASUS live node registry | **NOT_TESTED** |
| Live AMD/NVIDIA/Intel/Apple acceleration | **NOT_TESTED** |
| Authorized cloud capacity live | **NOT_TESTED** |
| EM1 / EM2 predecessor | **EM2 ABSENT**; EM3 rebased onto EM1 (post-#157). Live hardware still NOT_TESTED. |
| Production authorization / tip-land / PR | **false** / not created |

## Next (do not implement here)

**EM4 — CPU/GPU/NPU Message Envelope** — signed request agents use when talking to compute hardware and evidence that must come back.
