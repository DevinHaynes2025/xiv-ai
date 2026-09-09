# 62L-EM5 — AMD Windows ML Adapter Path Report

Status: **IMPLEMENTED on child branch** — **rebased onto sealed EM4 tip** — unit tests **re-executed** — **NOT** a live ASUS/Windows AMD verification pass — **NOT** production authorization — no tip-land / PR / ManagePullRequest / DB apply

Date: 2026-09-09

## Summary

Governed AMD Windows ML / ONNX Runtime adapter path under `services/ai/local-runtime/**` with hard verification gate, CPU-safe default, explicit silent-fallback honesty (EL8 soft-wire), model/provider compatibility checks, policy denies, and evidence-bearing return receipts. **AMD GPU/NPU VERIFIED is NOT claimed** without measured exact-EP evidence (default remains **NOT_TESTED** / **UNAVAILABLE**).

## Branch / Base

| Field | Value |
| --- | --- |
| Branch | `cursor/62l-em5-amd-windows-ml-adapter-path-4059` |
| Predecessor preference | `cursor/62l-em4-*` → else EM3 / EM1 → else EL9 |
| Base used | sealed `cursor/62l-em4-cpu-gpu-npu-message-envelope-4059` @ `0c31b27…` (EM3 `eb6e963…`) |
| Base SHA | `0c31b27d694484499c69fd9fb2eb549d80ac89e8` |
| Implement SHA | `37614e2afbda27d4648f24f95e2704ea40e9a0a8` |
| Tip SHA | `PLACEHOLDER` |
| Rebase onto sealed EM4 | **YES** |
| Tip-land / PR | **NO** |
| `L4_AUTONOMY_ENABLED` | `false` |

## Core flow

`Agent Compute Envelope → Policy Gate → Universal Compute Registry → AMD Windows ML Adapter → Actual Execution Provider → Return Receipt → XIV Home Base`

## Deliverables

| Item | Path / command | Status |
| --- | --- | --- |
| Adapter path + verification gate | `services/ai/local-runtime/amd-windows-ml-adapter-path.ts` | Encoded |
| Honesty locks | `services/ai/local-runtime/em5-honesty.ts` | Encoded |
| Soft-wire probe | `services/ai/local-runtime/em5-soft-wire.ts` | Encoded |
| Tests | `npm run test:62lem5` | **PASS** 15/15 executed |
| Local-runtime regression | `npm run test:local-runtime` | **PASS** 133/133 executed |
| Report | `docs/operations/62L_EM5_AMD_WINDOWS_ML_ADAPTER_PATH_REPORT.md` | This file |

## Adapter tracking fields

`adapterId`, `runtimeVersion`, `windowsMlState`, `onnxRuntimeState`, `deviceId`, `cpuState`, `gpuState`, `npuState`, `supportedModels`, `lastVerifiedAt`, `benchmarkEvidence`, `fallbackPolicy`, `resourceLimits`

## Soft-wire (presence post-EM4 rebase)

| Target | Result |
| --- | --- |
| EM3 universal compute registry | **PRESENT** (on base) |
| EM4 message envelope | **PRESENT** (after rebase onto sealed EM4 tip) |
| EL7 inference adapter | **PRESENT** |
| EL8 model-load / silent-fallback | **PRESENT** |
| EL9 resource governor | **PRESENT** |
| EL5 AMD GPU / EL6 AMD NPU | **PRESENT** |
| Prior EM ONNX/Windows ML adapter | **PRESENT** |

Presence soft-wire ≠ VERIFIED ≠ production authorization.

## Governance invariants (tested)

- CPU is the safe default
- AMD GPU/NPU used only when provider state is **VERIFIED**
- DETECTED or SUPPORTED ≠ verified inference hardware
- Silent fallback to CPU recorded explicitly (`fallbackUsed` + EL8 `detectSilentFallback`)
- Model/provider compatibility checked before execution
- Every inference receipt includes latency, actual device, runtime/provider, model hash/version, resource evidence, failure state
- Failed accelerator execution falls back only according to policy
- No driver/BIOS/overclock/privilege escalation/hidden persistence
- No automatic model download or cloud escalation
- Guardian / RLS / auth / Universe / human-approval soft-wires intact
- `L4_AUTONOMY_ENABLED=false`

## Verification gate (hard)

AMD GPU or NPU becomes **VERIFIED** only after a real bounded local inference succeeds on that **exact** execution provider. Unit tests use fixtures for rule enforcement; live ASUS verification is **not** faked. Default remains **NOT_TESTED** / **UNAVAILABLE** without measured evidence.

## AMD VERIFIED claimed?

**NO** — without live measured evidence on founder hardware. Fixture paths may graduate adapter state inside unit tests only; production/live claim remains **NOT_TESTED**.

## Test results (executed)

| Suite | Command | Result |
| --- | --- | --- |
| EM5 adapter | `npm run test:62lem5` | **PASS** (15/15) |
| Local-runtime regression | `npm run test:local-runtime` | **PASS** (133/133 post-rebase; EM4 soft-wire PRESENT) |

## Next (do not implement)

**EM6 — NVIDIA Runtime Candidate Path** — same evidence-first contract for NVIDIA GPUs / TensorRT-compatible inference.
