# 62L-EM6 — NVIDIA Runtime Candidate Path Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — **NOT** a live NVIDIA CUDA/TensorRT verification pass — **NOT** production authorization

Date: 2026-09-09  
Branch: `cursor/62l-em6-nvidia-runtime-candidate-path-4059`  
Base: `cursor/62l-el9-resource-governor-4059` @ `c834e5242ba1a2b04e6126babbbaf695133178b1` (EM5 absent at park-and-implement; EM4/EM3 soft-wire only)  
Implementation SHA: `94f90e11da5ba5c3165d98e0f09386616e9654e4` (feat)  
Tip SHA: `PLACEHOLDER_TIP`  
Tip-land onto `xiv-v2` / `main`: **NO**  
PR / ManagePullRequest: **NOT CREATED**  
Production deploy / merge: **NO**  
NVIDIA VERIFIED claimed: **NO**  
Integration status: **INTEGRATION_CANDIDATE**

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Detecting NVIDIA GPU ≠ proving CUDA or TensorRT works
- **DETECTED ≠ VERIFIED**
- Truth progression (hard): `UNKNOWN → DETECTED → SUPPORTED → VERIFIED` — **deny skip**
- VERIFIED requires actual bounded model load + inference on the **requested** NVIDIA execution path
- CPU fallback recorded explicitly; cannot verify the GPU (soft-wire EM4/EL8/EM5)
- Agents cannot install CUDA/drivers/TensorRT/system packages automatically
- No overclocking, BIOS changes, thermal-limit bypass, or privileged configuration changes
- Resource Governor limits VRAM, concurrency, runtime, queue depth, task duration (soft-wire EL9)
- Private/tenant data cannot move to another node without explicit authorization
- Multi-GPU routing remains **NOT_TESTED** until measured
- Cloud NVIDIA capacity requires separately authorized providers and spend controls (no auto-purchase)
- Guardian / RLS / tenant / Universe **unchanged**
- NVIDIA = **INTEGRATION_CANDIDATE** until evidence

## Core flow (adapter segment)

`Agent Compute Envelope → Policy Gate → Compute Registry → NVIDIA Adapter → Verified Runtime → Inference → Return Receipt → XIV Home Base`

EM6 implements the **NVIDIA Adapter** + truth gates + fallback honesty. Envelope / registry / home-base are soft-wired when present.

## Adapter tracking fields

| Field | Encoding |
|---|---|
| deviceId | `tracking.deviceId` |
| GPU model | `tracking.gpuModel` |
| VRAM | `tracking.vramBytes` |
| driver state | `tracking.driverState` |
| CUDA state | `tracking.cudaState` (UNKNOWN until evidenced — not inferred from detection) |
| TensorRT / TensorRT-LLM state | `tracking.tensorRtState` / `tensorRtLlmState` |
| ONNX compatibility | `tracking.onnxCompatibility` |
| supported precision modes | `tracking.supportedPrecisionModes` |
| model compatibility | `tracking.modelCompatibility` |
| benchmark evidence | `tracking.benchmarkEvidence` |
| thermal/resource state | `tracking.thermalResourceState` |
| last verification timestamp | `tracking.lastVerificationTimestamp` |
| fallback route | `tracking.fallbackRoute` (default `cpu`) |

## Truth progression

| From | To | Allowed? |
|---|---|---|
| UNKNOWN → DETECTED | adjacent | yes |
| DETECTED → SUPPORTED | adjacent (needs bounded evidence on requested path) | yes when evidence exists |
| SUPPORTED → VERIFIED | adjacent (matching requested NVIDIA path) | yes when evidence exists |
| DETECTED → VERIFIED | **skip** | **DENIED** |
| CPU fallback / mismatched path → NVIDIA VERIFIED | — | **DENIED** |

Side states preserved: `DEGRADED` / `UNAVAILABLE` / `NOT_TESTED`.

## Acceptance criteria checklist

| # | Criterion | Evidence | Result |
|---|---|---|---|
| 1 | NVIDIA adapter candidate + tracking fields | `nvidia-runtime-adapter.ts` | **PASS** (unit) |
| 2 | Detect ≠ CUDA/TensorRT proven | `cudaState`/`tensorRtState` UNKNOWN on detect | **PASS** (unit) |
| 3 | Truth gates deny DETECTED→VERIFIED skip | `capability-truth` + refuse auto-verify | **PASS** (unit) |
| 4 | VERIFIED requires bounded inference on **requested** path | `resolveNvidiaExecutionState` | **PASS** (unit) |
| 5 | CPU fallback explicit; cannot verify GPU | `attemptNvidiaOrFallbackCpu` / receipt | **PASS** (unit) |
| 6 | Install/config denies (CUDA/driver/TensorRT/packages/overclock/BIOS/thermal/privileged) | `denyNvidiaInstallOrPrivilegedAction` | **PASS** (unit) |
| 7 | Multi-GPU routing NOT_TESTED | `assessMultiGpuRouting` | **PASS** (unit) |
| 8 | Cloud spend / auth gate; no auto-purchase | `gateCloudNvidiaAccess` | **PASS** (unit) |
| 9 | Private/tenant cross-node deny without auth | `gatePrivateTenantCrossNodeMove` | **PASS** (unit) |
| 10 | EL9 soft resource ceilings | `admitNvidiaUnderResourceGovernor` | **PASS** (unit) |
| 11 | Cross-vendor benchmark CONTRACT_ONLY / NOT_TESTED | `em6-cross-vendor-benchmark-contract.ts` | **PASS** (unit) |
| 12 | Guardian/RLS/approval soft-wire unchanged; L4=false | soft-wire + policy asserts | **PASS** (unit) |
| 13 | NVIDIA VERIFIED not claimed by fixtures | tests assert INTEGRATION_CANDIDATE | **PASS** (unit) |

## NOT_TESTED inventory

| Item | State | Notes |
|---|---|---|
| Live NVIDIA GPU bounded inference | **NOT_TESTED** | No device CUDA run in this agent |
| CUDA runtime on requested path | **NOT_TESTED** | Candidate only |
| TensorRT / TensorRT-LLM | **NOT_TESTED** | Candidate only |
| Multi-GPU routing | **NOT_TESTED** | Explicitly locked |
| Authorized cloud NVIDIA capacity | **NOT_TESTED** | Auth+spend gate only |
| Cross-vendor CPU/AMD/NVIDIA measured suite | **CONTRACT_ONLY** / **NOT_TESTED** | Defined; not measured |
| NVIDIA **VERIFIED** claim | **NO** | Fixtures prove rules only |
| Production authorization | **false** | Unchanged |

## Deliverables

| Path | Role |
|---|---|
| `services/ai/local-runtime/nvidia-runtime-adapter.ts` | NVIDIA adapter + gates + denies + cloud/spend + EL9 limits |
| `services/ai/local-runtime/em6-honesty.ts` | EM6 locks + INTEGRATION_CANDIDATE |
| `services/ai/local-runtime/em6-soft-wire.ts` | Soft-wire EM4/EL8/EM5/EL9/home-base presence |
| `services/ai/local-runtime/em6-cross-vendor-benchmark-contract.ts` | Later benchmark contract |
| `services/ai/local-runtime/__tests__/em6-nvidia-runtime.test.ts` | EM6 acceptance tests |
| `services/ai/package.json` | `test:62lem6` |
| `docs/operations/62L_EM6_NVIDIA_RUNTIME_CANDIDATE_PATH_REPORT.md` | This report |

## Tests

Commands:

```bash
cd services/ai && npm run test:62lem6
cd services/ai && npm run test:local-runtime
```

| Command | Result |
|---|---|
| `npm run test:62lem6` | **PASS** — 19/19 |
| `npm run test:local-runtime` | **PASS** — 123/123 (includes EM6 + prior EL/EM; no regression) |

NVIDIA VERIFIED claimed from these tests: **NO** (fixtures prove rules only).

## Soft-wire

- EL8 model-load evidence / honesty: presence soft-wire
- EL9 resource governor: presence + VRAM/concurrency/runtime/queue/duration ceilings
- EM4 compute envelope: presence probe (may be ABSENT on park-and-implement base)
- EM5 AMD Windows ML path: soft-wires via `onnx-windows-ml-adapter` / EM5 modules when present
- local-brain home-base: optional presence
- Existing policy: auto high-risk blocked; consequential approval required; `canAutoExecute` false

## Explicit NON-claims

- Live NVIDIA inference already run: **false**
- NVIDIA VERIFIED: **NO**
- CUDA / TensorRT installed by this change: **false**
- Multi-GPU routing proven: **false**
- Cloud capacity purchased: **false**
- Cross-vendor benchmark measured: **false** (CONTRACT_ONLY)

## Next (report only — do not implement)

**EM7 — Device-Neutral Inference Router** — choose among verified CPU, AMD GPU/NPU, NVIDIA GPU, edge, or authorized cloud by privacy, compatibility, cost, latency, resource state.
