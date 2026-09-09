# 62L-EP9 — Intel Adapter Research Path Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest / CPU-presence=OpenVINO / silent-CPU-fallback=VERIFIED

Date: 2026-09-09  
Branch: `cursor/62l-ep9-intel-adapter-research-path-4059`  
Tip SHA: *(pending commit — will align after push)*  
Base: `cursor/62l-ep8-nvidia-adapter-research-path-4059` @ `977357da07c5d88d3cf571b16f7723730b58e8a1`  
Predecessor: EP8 NVIDIA Adapter Research Path **PRESENT**  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP9 Intel Adapter Research Path*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Intel CPU or integrated GPU present **≠** OpenVINO/NPU acceleration works
- VERIFIED requires exact device detection, compatible runtime, bounded model load, inference on intended Intel device, actual execution device confirmed, evidence/benchmark receipt stored
- If request targets Intel GPU/NPU but falls back to CPU → record fallback; accelerator **not** verified
- No automatic drivers/runtime installs, BIOS/firmware modifications, overclocking, privilege escalation, or autonomous cloud provisioning
- Guardian/RLS/tenant/Universe isolation unchanged
- No production deployment, main merge, or permission expansion
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Core flow

`Agent task → Virtual Chip Registry → Intel Adapter → runtime/provider check → bounded inference → return receipt → Benchmark Memory → XIV Home Base`

## Adapter fields (19)

`adapterId`, `intelDeviceModel`, `deviceClass`, `architectureGeneration`, `driverRuntimeVersions`, `openVinoState`, `oneApiState`, `onnxCompatibility`, `supportedPrecisions`, `modelCompatibility`, `memoryRequirements`, `actualExecutionDevice`, `latency`, `throughput`, `resourceUsage`, `fallbackRoute`, `benchmarkReference`, `lastVerifiedTimestamp`, `failureClass`

## States / device classes

States: `UNKNOWN` | `DETECTED` | `SUPPORTED` | `VERIFIED` | `NOT_TESTED` | `DEGRADED` | `UNAVAILABLE`  
Devices: `intel_cpu` | `intel_gpu` | `intel_npu`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP8 tip |
| --- | --- |
| EP8 NVIDIA Adapter Research Path + report | **PRESENT** |
| EP7 AMD Adapter Research Path + report | **PRESENT** |
| EP6 Local Hardware Truth Probe v2 + report | **PRESENT** |
| EP5 Public Benchmark Memory + report | **PRESENT** |
| EP1 Virtual Chip Contract + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `intel-adapter-research-path-types.ts` | fields, states, locks, soft-wire |
| `intel-adapter-research-path-runtime.ts` | register/inference/receipt/deny + cycle |
| `intel-adapter-research-path.ts` | public facade |
| `phase62lep9.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP9_INTEL_ADAPTER_RESEARCH_PATH_REPORT.md` | this report |

## Autonomy / safety / truth denies (tested)

| Deny | Result |
| --- | --- |
| Assume OpenVINO from CPU/iGPU presence | → **DENIED** |
| Assume NPU acceleration from CPU presence | → **DENIED** |
| Claim VERIFIED after silent CPU fallback | → **DENIED** |
| VERIFIED without all preconditions | → **DENIED** |
| Auto driver/runtime install | → **DENIED** |
| BIOS/firmware / overclock / privilege escalation | → **DENIED** |
| Autonomous cloud provisioning | → **DENIED** |
| Production deploy / main merge / permission expansion | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep9
```

| Command | Result |
| --- | --- |
| `npm run test:62lep9` | **PASS** — presence≠OpenVINO/NPU; CPU fallback; VERIFIED preconditions; safety denies; EP8→EP1 soft-wire PRESENT |

## Next (report only — do not implement)

**EP10 — Other Accelerator Registry** — generalize the same evidence contract to Apple Neural Engine, Qualcomm Hexagon/NPU, cloud accelerators, edge AI chips, and future compute providers.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
