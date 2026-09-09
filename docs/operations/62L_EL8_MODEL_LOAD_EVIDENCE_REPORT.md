# 62L-EL8 — Model-Load Evidence Report

**Branch:** `cursor/62l-el8-model-load-evidence-4059`  
**Base:** `cursor/62l-el7-windows-local-runtime-adapter-4059` @ `0e7ca09`  
**Status:** IMPLEMENTED (unit VERIFIED) — no tip-land, no PR, no production writes  
**SoT title:** 62L-EL8 — Model-Load Evidence (verification graduation + silent-fallback deny)

## User story

As XIV AI OS, every local model/provider combination must produce concrete evidence before being marked **VERIFIED**, so configuration is never confused with working inference.

## Progression (hard — no skip)

`AVAILABLE → CONFIGURED → SUPPORTED → MODEL_LOADED → INFERENCE_PASSED → VERIFIED`

Encoded in `VERIFICATION_PROGRESSION` + `advanceVerificationStage` (deny-skip). Unrun tests are never PASS. `L4_AUTONOMY_ENABLED=false`.

## Evidence schema

Module: `services/ai/local-runtime/model-load-evidence.ts`

All required fields are representable on `ModelLoadEvidence` and mirrored into ledger entries:

| Field | Representation |
| --- | --- |
| Exact model ID + version/hash | `modelId`, `modelVersionOrHash` |
| Execution provider | `requestedProvider` / `actualProvider` (`CPU` / `GPU` / `NPU`) |
| Device truth at test time | `deviceTruthState` |
| Model-load timestamps | `loadStartedAt`, `loadEndedAt` |
| Session/runtime init | `sessionInitialized` |
| Bounded test input | `boundedTestInput` |
| Inference output | `inferenceOutput` |
| Latency | `latencyMs` |
| Memory/resource observations | `memoryObservations` |
| Failure class | `failureClass` |
| Software/runtime versions | `softwareRuntimeVersions` |
| Machine/runtime timestamp | `machineRuntimeTimestamp` |
| Evidence ledger reference | `evidenceRef` |

## Verification graduation gate

Module: `services/ai/local-runtime/verification-graduation.ts`

- `deriveStageFromEvidence` walks the chain without skipping.
- `runVerificationGate` attaches an audit/runtime ledger reference and applies accelerator deny rules.
- Claim-without-evidence → denied (`CLAIM_WITHOUT_EVIDENCE`).

## Silent-fallback rule (hard)

**Silent fallback cannot count as accelerator verification.**

If XIV requests AMD GPU or NPU but ONNX/Windows ML executes on CPU:

- Result may verify **CPU fallback** (`cpuFallbackState: VERIFIED` when CPU evidence is complete).
- Requested **accelerator remains** `NOT_TESTED` / `DETECTED` / `SUPPORTED` — **never VERIFIED**.
- Overall `verified` for the requested combination is **false** when silent fallback is detected.

Lock: `SILENT_FALLBACK_EQ_ACCELERATOR_VERIFIED=false`.

## Remain NOT_TESTED / DEGRADED / UNAVAILABLE when

| Condition | Failure class | Gate posture |
| --- | --- | --- |
| Model file missing | `MODEL_FILE_MISSING` | not VERIFIED (`AVAILABLE`) |
| Provider cannot initialize | `PROVIDER_INIT_FAILED` | not VERIFIED (`CONFIGURED`) |
| GPU/NPU silent fallback to CPU | `SILENT_FALLBACK_TO_CPU` | accelerator unverified; CPU may verify |
| Inference times out | `INFERENCE_TIMEOUT` | ≤ `MODEL_LOADED` |
| Output invalid | `OUTPUT_INVALID` | ≤ `MODEL_LOADED` |
| Resource ceilings exceeded | `RESOURCE_CEILING_EXCEEDED` | not VERIFIED |
| Runtime evidence stale | `EVIDENCE_STALE` | not VERIFIED |
| Combination has not actually run | `COMBINATION_NOT_RUN` | ≤ `SUPPORTED`, not VERIFIED |

## Ledger

Module: `services/ai/local-runtime/evidence-ledger.ts`

In-process audit/runtime ledger stores `evidenceRef` + full evidence snapshot. No production DB writes, no permission expansion.

## Soft-wires / preserved invariants

- Soft-wire EL7 `runLocalInference` if present (`el7-soft-wire.ts`); absent → honest no-op.
- Guardian / RLS / tenant / Universe / human-approval locks intact (`el8-honesty.ts`).
- No automatic model downloads, driver installs, privilege changes, or tip-land.

## Tests

```bash
cd services/ai && npm run test:62lel8
cd services/ai && npm run test:local-runtime
```

Coverage: progression no-skip, silent-fallback rule, each remain-not-verified case, successful CPU/GPU paths, schema field presence, EL7 soft-wire honesty, local-runtime regressions (router / governor / heartbeat).

## Next (do not implement here)

**EL9 — Resource Governor** — hard CPU/RAM/concurrency/storage/network/battery/thermal limits before offline agents run sustained workloads.
