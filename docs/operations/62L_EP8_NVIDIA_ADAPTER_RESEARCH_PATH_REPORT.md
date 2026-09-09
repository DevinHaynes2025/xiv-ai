# 62L-EP8 — NVIDIA Adapter Research Path Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest / GPU-detection=CUDA / silent-CPU-fallback=VERIFIED

Date: 2026-09-09  
Branch: `cursor/62l-ep8-nvidia-adapter-research-path-4059`  
Tip SHA: *(pending commit — will align after push)*  
Base: `cursor/62l-ep7-amd-adapter-research-path-4059` @ `d932f9d4b6e4c288380b5a6ea27157702acc29eb`  
Predecessor: EP7 AMD Adapter Research Path **PRESENT**  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP8 NVIDIA Adapter Research Path*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Detecting an NVIDIA GPU **≠** CUDA or TensorRT usable
- VERIFIED requires bounded model load + successful inference on intended NVIDIA path
- CPU fallback receipt must record `requestedDevice=NVIDIA_GPU`, `actualDevice=CPU`, `fallbackUsed=true`; GPU remains **unverified**
- Multi-GPU and distributed inference stay **NOT_TESTED** until actually measured
- No automatic CUDA/TensorRT/driver install; no overclock/thermal bypass; no BIOS/firmware; no privilege escalation; no automatic cloud GPU provisioning
- Private tenant data cannot leave its permitted Universe
- Guardian/RLS and human-approval boundaries unchanged
- No production deployment, main merge, or permission expansion
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Core flow

`Agent task → Virtual Chip Registry → NVIDIA Adapter → runtime/provider check → bounded inference → return receipt → Benchmark Memory → XIV Home Base`

## Adapter fields (18)

`adapterId`, `nvidiaGpuModel`, `vram`, `driverState`, `cudaState`, `tensorRtState`, `tensorRtLlmState`, `onnxCompatibility`, `supportedPrecisions`, `modelCompatibility`, `actualExecutionDevice`, `latency`, `throughput`, `memoryUsage`, `fallbackRoute`, `benchmarkReference`, `lastVerifiedTimestamp`, `failureClass`

## States

`UNKNOWN` | `DETECTED` | `SUPPORTED` | `VERIFIED` | `NOT_TESTED` | `DEGRADED` | `UNAVAILABLE`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP7 tip |
| --- | --- |
| EP7 AMD Adapter Research Path + report | **PRESENT** |
| EP6 Local Hardware Truth Probe v2 + report | **PRESENT** |
| EP5 Public Benchmark Memory + report | **PRESENT** |
| EP1 Virtual Chip Contract + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `nvidia-adapter-research-path-types.ts` | fields, states, locks, soft-wire |
| `nvidia-adapter-research-path-runtime.ts` | register/inference/receipt/deny + cycle |
| `nvidia-adapter-research-path.ts` | public facade |
| `phase62lep8.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP8_NVIDIA_ADAPTER_RESEARCH_PATH_REPORT.md` | this report |

## Autonomy / safety / truth denies (tested)

| Deny | Result |
| --- | --- |
| Assume CUDA/TensorRT from GPU detection | → **DENIED** |
| Claim VERIFIED after silent CPU fallback | → **DENIED** |
| VERIFIED without all preconditions | → **DENIED** |
| Auto CUDA/TensorRT/driver install | → **DENIED** |
| Overclock / thermal-limit bypass | → **DENIED** |
| BIOS/firmware / privilege escalation | → **DENIED** |
| Automatic cloud GPU provisioning | → **DENIED** |
| Private tenant data leave Universe | → **DENIED** |
| Multi-GPU / distributed without measurement | → **DENIED** (stay NOT_TESTED) |
| Production deploy / main merge / permission expansion | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep8
```

| Command | Result |
| --- | --- |
| `npm run test:62lep8` | **PASS** — GPU≠CUDA/TensorRT; CPU fallback receipt fields; VERIFIED preconditions; safety denies; EP7/EP6/EP5/EP1 soft-wire PRESENT |

## Next (report only — do not implement)

**EP9 — Intel Adapter Research Path** — add the same evidence-first abstraction for Intel CPU/GPU/NPU and OpenVINO/oneAPI-compatible runtimes.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
