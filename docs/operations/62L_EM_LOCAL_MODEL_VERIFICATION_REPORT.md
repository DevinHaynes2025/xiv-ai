# 62L-EM — Local Model Verification + ONNX/Windows ML Adapter + AMD Accelerator Benchmark + Agent Runtime Heartbeat API + Classical Quant Benchmark Suite

Status: **IMPLEMENTED on child branch** — unit tests executed in CI/agent environment — **NOT** a Windows/ASUS node verification pass — **NOT** production authorization — no tip-land / PR / DB apply

Date: 2026-09-09

## Source of truth

- Founder queue title: **62L-EM — Local Model Verification + ONNX/Windows ML Adapter + AMD Accelerator Benchmark + Agent Runtime Heartbeat API + Classical Quant Benchmark Suite**
- GitHub issue search for `62L-EM` at implement time: **none found** — no issue number invented

## Predecessor / base

| Field | Value |
| --- | --- |
| Preferred EL base | `origin/feat/62l-el-local-runtime-probe` |
| Base tip SHA | `0e7ca0930245d2c1b4cfbc41e2078e2aa8f2c502` |
| Working branch | `cursor/62l-em-local-model-verification-4059` |
| EM tip SHA | `3dd9d480b1f35dcc47d301c99271f24d30496284` |
| EL inheritance | Truth states, read-only probe, CPU-first router, heartbeat freshness, resource governor preserved |
| EK honesty soft-wire | Optional presence check for `local-brain/windows-amd-local-cognitive-os-types.ts` (does not imply EK VERIFIED) |

## Honesty locks

- `DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`
- `L4_AUTONOMY_ENABLED=false`
- `DETECTED ≠ VERIFIED`
- Recommendation ≠ execute; Digital Twin ≠ founder
- DB candidates: **NOT_APPLIED**
- No automatic high-risk execution; consequential actions need approval (existing Agent Brain policy unchanged)

## Measurement-before-claim rules

1. Hardware/device visibility → at most **DETECTED**
2. Compatibility/docs/install hints → at most **SUPPORTED**
3. **VERIFIED** requires a measured probe/benchmark with evidence strings/metrics
4. Fake “successful inference” / `MODEL_LOAD_VERIFIED` without evidence → **DENIED**, state remains **NOT_TESTED**
5. Missing/stale heartbeat → **WAITING_NODE** / **STALE** / **OFFLINE_STOPPED** — never claim agents working while node off
6. Classical quant baselines must pass before quantum-inspired comparison is even considered; **quantum advantage is never claimed** here
7. ASUS / AMD GPU-NPU / Windows ML / ONNX load / offline agents / physical QPU / Microsoft desktop integrations remain **NOT_TESTED** until founder runs measured probe on real hardware

## Deliverables (A–E)

| Area | Module | Default state |
| --- | --- | --- |
| A Local Model Verification | `model-verification.ts` | NOT_TESTED; `MODEL_LOAD_VERIFIED` only with load+inference evidence |
| B ONNX / Windows ML Adapter | `onnx-windows-ml-adapter.ts` | NOT_TESTED / UNAVAILABLE; path Windows ML → ONNX Runtime → AMD EP |
| C AMD Accelerator Benchmark | `amd-accelerator-benchmark.ts` | GPU/NPU VERIFIED only after measured inference benchmark; CPU fallback always |
| D Agent Runtime Heartbeat API | `heartbeat-api.ts` | Missing/stale → WAITING_NODE / OFFLINE_STOPPED |
| E Classical Quant Benchmark Suite | `classical-quant-benchmark.ts` | Classical baselines recorded; quantum advantage claimed = false |

Supporting: `honesty.ts`, extended `types.ts` (`EvidenceGrade`, `EM_DB_CANDIDATES_STATUS`), exports via `index.ts`.

## VERIFIED vs NOT_TESTED

| Claim | State |
| --- | --- |
| EL truth-state / CPU-first routing / heartbeat freshness / resource ceilings (unit-tested) | **VERIFIED** (in-repo unit evidence) |
| EM contract gates A–E (unit-tested) | **IMPLEMENTED** + unit **VERIFIED** for gate behavior |
| Founder ASUS hardware model | **NOT_TESTED** |
| AMD GPU acceleration | **NOT_TESTED** |
| AMD NPU acceleration | **NOT_TESTED** |
| Windows local inference | **NOT_TESTED** |
| ONNX model load on Windows | **NOT_TESTED** |
| Windows ML → ORT → AMD EP path on real device | **NOT_TESTED** |
| Offline agents running on powered ASUS node | **NOT_TESTED** |
| Physical QPU / quantum advantage | **NOT_TESTED** / denied |
| Microsoft desktop integrations | **NOT_TESTED** |
| Production authorization / tip-land / DB apply | **NOT_APPLIED** / false |

## Tests

```bash
cd services/ai && npm run test:62lem
cd services/ai && npm run test:local-runtime
```

Record actual PASS/FAIL from the agent run in the return table (do not mark PASS unless executed).

## Next (report only)

Await founder paste for the next lettered phase. Deepen measured AMD/ONNX verification on real ASUS only when founder runs the probe.
