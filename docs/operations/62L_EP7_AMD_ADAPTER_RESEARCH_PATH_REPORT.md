# 62L-EP7 — AMD Adapter Research Path Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest / silent-CPU-fallback=VERIFIED / auto driver install

Date: 2026-09-09  
Branch: `cursor/62l-ep7-amd-adapter-research-path-4059`  
Tip SHA: *(pending commit — will align after push)*  
Base: `cursor/62l-ep6-local-hardware-truth-probe-v2-4059` @ `a8d8d4dfe430f690576785c47d66066b1e15d59a`  
Predecessor: EP6 Local Hardware Truth Probe v2 **PRESENT**  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP7 AMD Adapter Research Path*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- If AMD GPU/NPU request **silently executes on CPU**, receipt **must record fallback** and accelerator **remains unverified**
- Documented Windows ML / ONNX Runtime research paths **allowed**
- Must **not** auto-install drivers, alter BIOS/firmware, overclock, undervolt, or bypass Windows security
- No production deployment, main merge, permission expansion, or cloud purchasing
- VERIFIED requires all 8 preconditions (device, runtime, model load, inference on intended device, execution device confirmed, timestamp, benchmark evidence, CPU fallback tested separately)
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Core flow

`Agent task → Virtual Chip Registry → AMD Adapter → runtime/provider check → bounded inference → return receipt → benchmark memory → XIV Home Base`

## Adapter fields (16)

`adapterId`, `amdDeviceModel`, `windowsVersion`, `runtimeProvider`, `modelCompatibility`, `precision`, `memoryRequirement`, `providerInitializationState`, `actualExecutionDevice`, `latency`, `throughput`, `resourceUsage`, `fallbackPath`, `benchmarkReference`, `lastVerifiedTimestamp`, `failureClass`

## States

`UNKNOWN` | `DETECTED` | `SUPPORTED` | `VERIFIED` | `NOT_TESTED` | `DEGRADED` | `UNAVAILABLE`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP6 tip |
| --- | --- |
| EP6 Local Hardware Truth Probe v2 + report | **PRESENT** |
| EP5 Public Benchmark Memory + report | **PRESENT** |
| EP1 Virtual Chip Contract + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `amd-adapter-research-path-types.ts` | fields, states, locks, soft-wire |
| `amd-adapter-research-path-runtime.ts` | register/inference/receipt/deny + cycle |
| `amd-adapter-research-path.ts` | public facade |
| `phase62lep7.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP7_AMD_ADAPTER_RESEARCH_PATH_REPORT.md` | this report |

## Autonomy / safety / truth denies (tested)

| Deny | Result |
| --- | --- |
| Claim VERIFIED after silent CPU fallback | → **DENIED** |
| VERIFIED without all preconditions | → **DENIED** |
| Auto-install drivers | → **DENIED** |
| Alter BIOS/firmware | → **DENIED** |
| Overclock / undervolt | → **DENIED** |
| Bypass Windows security | → **DENIED** |
| Production deploy / main merge | → **DENIED** |
| Permission expansion / cloud purchase | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep7
```

| Command | Result |
| --- | --- |
| `npm run test:62lep7` | **PASS** — silent CPU fallback recorded; accelerator unverified; VERIFIED preconditions; safety denies; EP6/EP5/EP1 soft-wire PRESENT |

## Next (report only — do not implement)

**EP8 — NVIDIA Adapter Research Path** — apply the same evidence-first contract to CUDA/TensorRT/ONNX-compatible NVIDIA environments.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
