# 62L-EM4 — CPU/GPU/NPU Message Envelope Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — silent-fallback honesty **PASS** — safety denies **PASS** — **NOT** production authorization

Date: 2026-09-09  
Branch: `cursor/62l-em4-cpu-gpu-npu-message-envelope-4059`  
Tip SHA: `d0c133db4f9676f894dd479535aa311cb2f45724`  
Implement SHA: `46eff3ca239028c4851ea2087e84fdf0cac1af7c`  
Base: `cursor/62l-em3-universal-compute-registry-4059` @ `185ac60c1c155661ea5618acbcf1158856ff5d0b`  
EL9 predecessor: `c834e5242ba1a2b04e6126babbbaf695133178b1`  
Tip-land onto `xiv-v2` / `main`: **NO**  
PR / ManagePullRequest: **NOT CREATED**  
Production deploy / merge: **NO**  
Automatic cloud purchase / hardware provisioning: **DENIED**  
Driver / BIOS / security config changes: **DENIED**  
`L4_AUTONOMY_ENABLED`: **false**

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- CPU success after a GPU/NPU request **does not** verify the requested accelerator
- Silent accelerator→CPU fallback **must** set `fallbackUsed=true` and `actualExecutionDevice=CPU`
- Soft-wire presence ≠ VERIFIED for EM1 / EM3 / EL7 / EL8 / EL9

## User story

As XIV AI OS, every agent-to-compute request uses one signed, scoped message format so CPU/GPU/NPU execution stays auditable, reversible, tenant-aware, and resource-bounded.

## Core flow (implemented)

`Agent → policy gate → compute registry → resource governor → verified device → execution → signed return receipt → XIV Home Base`

## Request contract fields

`requestId`, `agentId`, `parentTaskId`, `homeUniverseId`, `tenantId`, `purpose`, `modelId`, `inputDataClass`, `requestedDevice`, `minimumVerificationState`, `maxRuntimeMs`, `maxMemoryMb`, `maxConcurrency`, `privacyMode`, `networkPolicy`, `expiry`, `returnPath`

Signed as HMAC-SHA256 (`SignedComputeMessageRequest`).

## Return receipt fields

`requestId`, `deviceId`, `providerRuntime`, `actualExecutionDevice`, `modelVersionHash`, `startedAt`, `completedAt`, `latencyMs`, `resourceEvidence`, `resultState`, `fallbackUsed`, `failureClass`, `evidenceRefs`  
(+ audit echoes: `requestedDevice`, `acceleratorVerified`, tenant/universe/agent/`returnPath`)

## Critical silent-fallback rule (EL8 soft-wire)

| Case | Receipt honesty |
|---|---|
| GPU/NPU requested, CPU executed | `fallbackUsed=true`, `actualExecutionDevice=CPU`, `failureClass=SILENT_FALLBACK_TO_CPU`, `acceleratorVerified=false`, `resultState=FALLBACK_CPU` |
| GPU/NPU executed on requested device | `fallbackUsed=false`, `acceleratorVerified=true` (when success) |
| CPU requested + CPU executed | no accelerator claim |

**Hard invariant:** CPU success **cannot** verify the requested accelerator.

## Safety denies (tested)

| Rule | Denial / result |
|---|---|
| Exceeds agent compute budget | `BUDGET_EXCEEDED` |
| Cross-tenant without explicit policy | `CROSS_TENANT_DENIED` |
| Cross-Universe without explicit policy | `CROSS_UNIVERSE_DENIED` |
| Expired request | `EXPIRED` |
| Child widens device/model/data/network | `CHILD_PERMISSION_WIDEN_DENIED` |
| High-consequence | `RECOMMENDATION_ONLY` / `HIGH_CONSEQUENCE_RECOMMENDATION_ONLY` |
| Automatic cloud purchase | `CLOUD_PURCHASE_DENIED` |
| Hardware provisioning | `HARDWARE_PROVISIONING_DENIED` |
| Driver/BIOS/security config | `DRIVER_BIOS_CONFIG_DENIED` |
| `L4_AUTONOMY_ENABLED` | must remain `false` |

## Soft-wire snapshot

| Target | Result at tip |
|---|---|
| EM1 `agent-home-base-types.ts` | **present** (soft-wire) |
| EM3 `universal-compute-registry.ts` | **present** (base) |
| EL9 `resource-governor.ts` | **present** |
| EL7 `inference-adapter.ts` / `el7-soft-wire.ts` | **present** |
| EL8 `model-load-evidence.ts` (`detectSilentFallback`) | **present** |

## Deliverables

| Artifact | Path |
|---|---|
| Types | `services/ai/local-brain/em4-message-envelope-types.ts` |
| Pipeline | `services/ai/local-brain/em4-message-envelope.ts` |
| Soft-wire | `services/ai/local-brain/em4-soft-wire.ts` |
| Tests | `services/ai/local-brain/__tests__/phase62lem4.test.ts` |
| npm script | `npm run test:62lem4` |
| Report | `docs/operations/62L_EM4_CPU_GPU_NPU_MESSAGE_ENVELOPE_REPORT.md` |

## Tests (executed)

```bash
cd services/ai && npm run test:62lem4
```

| Command | Result |
|---|---|
| `npm run test:62lem4` | **PASS** — 21/21 |
| Silent-fallback GPU→CPU / NPU→CPU | **PASS** |
| Safety deny matrix | **PASS** |

## NOT_TESTED inventory

| Item | State |
|---|---|
| Live ASUS Windows GPU/NPU execution | **NOT_TESTED** |
| EM5 AMD Windows ML adapter path | **NOT IMPLEMENTED** (next) |
| Production authorization / tip-land / PR | **false** / not created |

## Next (report only — do not implement)

**EM5 — AMD Windows ML Adapter Path** — map envelopes to Windows/AMD EP candidates; CPU fallback + evidence truth preserved.
