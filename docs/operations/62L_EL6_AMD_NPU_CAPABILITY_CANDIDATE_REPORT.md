# 62L-EL6 — AMD NPU Capability Candidate Report

**Branch:** `cursor/62l-el6-amd-npu-capability-candidate-4059`  
**Tip SHA:** `1883b01ce797d837c33d0ff02ea9ad0aa21ef8ba`  
**Base:** `cursor/62l-el5-amd-gpu-capability-candidate-4059` @ `32bcbc36542742e17a32cd7f1075eb1801eb222c` (final EL5 incl. EM)  
**Home:** `services/ai/local-runtime/**`  
**Status:** Candidate contracts + denial tests landed. **NPU VERIFIED claimed: NO.**  
**Next (not implemented):** EL7 — Windows Local Runtime Adapter  

---

## User story

As the XIV Local Runtime, detect whether the ASUS device exposes an AMD Ryzen AI NPU and classify usable AI capabilities so XIV can determine whether low-power local inference is available **without overstating hardware support**.

## Truth progression (hard)

`UNKNOWN → DETECTED → SUPPORTED → VERIFIED` — no skipping.

- `DETECTED ≠ VERIFIED`
- Presence / classification never auto-promotes to `VERIFIED`
- Fixtures may simulate device evidence for rule tests; they never auto-`VERIFIED`

## Acceptance criteria mapping

| # | Criterion | Encoding |
|---|-----------|----------|
| 1 | Detect NPU via supported Windows/runtime interfaces (read-only; stub OK for non-Windows CI) | `npu-presence-probe.ts` — Windows PnP/CIM read-only; stub-simulator for non-Windows / fixtures |
| 2 | Start UNKNOWN/NOT_TESTED; DETECTED only with real device evidence | `initialNpuCapabilityPosture()`, probe + `classifyAmdNpuCandidate({ deviceEvidencePresent })` |
| 3 | AMD CPU / Ryzen brand ≠ NPU_DETECTED | `refuseAmdCpuAsNpuInference`, denial tests |
| 4 | Record Windows ML / ONNX Runtime EP path **candidates** (not proven) | `AMD_NPU_RUNTIME_PATH_CANDIDATES` (`proven: false`) |
| 5 | NPU not VERIFIED until bounded local model load + inference | `resolveNpuExecutionState` / `recordNpuCapabilityBenchmark` |
| 6 | Evidence: latency, model, EP, timestamp, errors, resources | `NpuCapabilityBenchmarkRecord` + `npuEvidenceFieldsPresent` |
| 7 | On NPU fail → prefer **VERIFIED** GPU else CPU | `attemptNpuOrDegrade` (soft-wires EL5 `attemptGpuOrFallbackCpu`) |
| 8 | No BIOS / driver install / privilege escalation / power-plan / hidden persistence | `EL6_LOCKS` + benchmark flags all `false` for those side effects |
| 9 | No autonomous cloud provisioning / external model routing | `EL6_LOCKS.CLOUD_PROVISIONING_FORBIDDEN`, `EXTERNAL_MODEL_ROUTING_FORBIDDEN` |
| 10 | Guardian, RLS, tenant/Universe boundaries, human approval intact | `EL6_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT`, `HUMAN_APPROVAL_REQUIRED_INTACT` |
| 11 | `L4_AUTONOMY_ENABLED=false` | `EL6_LOCKS.L4_AUTONOMY_ENABLED` |

## Deliverables

### Contracts / runtime

| Module | Role |
|--------|------|
| `capability-truth.ts` | Shared hard progression (soft-wired from EL5) |
| `amd-gpu-capability.ts` | EL5 GPU candidate soft-wire |
| `benchmark.ts` (EL5) | EL5 GPU benchmark recorder soft-wire (rebased; no duplicate) |
| `amd-npu-capability.ts` | EL6 NPU candidate classify / refuse / degrade |
| `npu-presence-probe.ts` | Read-only Windows + stub presence probe |
| `npu-benchmark.ts` | Evidence / benchmark records |
| `soft-wire-el6.ts` | Soft-wire presence of EL5/EL6 modules + locks |

### Tests

- `npm run test:62lel6` — EL6 denial + honesty suite
- `npm run test:local-runtime` — includes EL6 + prior local-runtime tests

Denial coverage includes:

- AMD CPU / Ryzen ≠ NPU
- No skip `DETECTED → VERIFIED`
- Safe degrade to VERIFIED GPU else CPU
- Evidence field capture
- Fixture DETECTED ≠ auto-VERIFIED
- Soft-wire EL5 PRESENT; L4 false

### Honesty claims

| Claim | Value |
|-------|-------|
| NPU VERIFIED claimed | **NO** |
| Production AMD NPU inference authorized | **NO** |
| Driver/BIOS/power-plan changes performed | **NO** |
| Cloud provisioning / external model routing | **NO** |
| `L4_AUTONOMY_ENABLED` | **false** |

## Soft-wire notes

- EL5 GPU candidate logic is soft-wired into this branch (`amd-gpu-capability.ts`, `benchmark.ts`, shared `capability-truth.ts`, EM modules (`honesty.ts`, etc.)).
- Workload routing remains CPU-first until an accelerator is **VERIFIED**; DETECTED NPU never wins.
- On NPU inference failure / non-VERIFIED NPU, degrade prefers **VERIFIED GPU** (EL5 path) else **CPU**.

## Test results (this agent run)

| Command | Result |
|---------|--------|
| `npm run test:62lel6` | **pass** — 14/14 |
| `npm run test:local-runtime` | **pass** — 44/44 (EL5 + EM + prior + EL6 after rebase onto ) |

Rebase: **yes** — EL6 commits replayed onto final EL5 tip .

## Out of scope / next

- **EL7 — Windows Local Runtime Adapter** (do not implement here)
- Tip-land / PR / ManagePullRequest
- Real ASUS device driver install or live NPU EP verification
- Privilege escalation, BIOS, power-plan, or persistence changes

## Return checklist

- Branch: `cursor/62l-el6-amd-npu-capability-candidate-4059`
- Base tip: `32bcbc36542742e17a32cd7f1075eb1801eb222c` on `cursor/62l-el5-amd-gpu-capability-candidate-4059` (final EL5 incl. EM)
- Report: this file
- NPU VERIFIED claimed: **NO**
- Next: **EL7 — Windows Local Runtime Adapter**
