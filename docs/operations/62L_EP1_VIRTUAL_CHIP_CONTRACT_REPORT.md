# 62L-EP1 — Virtual Chip Contract Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest / silicon-modification claims / raw privacy pooling

Date: 2026-09-09  
Branch: `cursor/62l-ep1-virtual-chip-contract-4059`  
Tip SHA: _(filled after commit)_  
Base: `cursor/62l-eo11-virtual-data-warehouse-mission-pack-4059` @ `1480319daea173e69435e5c907edc2b8313dc065`  
Predecessor: EO11 Virtual Data Warehouse Mission Pack **PRESENT**  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP1 Virtual Chip Contract*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- **Virtual chip ≠ silicon modification** — software intelligence layer **above** AMD/NVIDIA/Intel/Apple/Qualcomm (and other) physical chips
- Software-layer surfaces only: routing, batching, caching, quantization, scheduling, model selection, benchmarking, simulation
- **DETECTED ≠ VERIFIED** — VERIFIED requires runtime evidence
- Quantum: **THEORETICAL** | **SIMULATED** | **QUANTUM_INSPIRED** | **PHYSICAL_QPU_VERIFIED**
- No raw GPS / camera / telemetry / trip collection without explicit opt-in; no raw driving-data pooling
- No autonomous device control (no steering/braking/throttle/ECU)
- Agents return evidence to Home Base; **no automatic authority**
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Vendor families (encoded)

| Id | Label |
| --- | --- |
| `amd` | AMD |
| `nvidia` | NVIDIA |
| `intel` | Intel |
| `apple` | Apple |
| `qualcomm` | Qualcomm |
| `edge_generic` | Edge (generic) |
| `cloud_accelerator` | Cloud Accelerator |
| `qpu_path_candidate` | QPU Path (candidate) |

## Device classes

`cpu` | `gpu` | `npu` | `accelerator` | `hybrid` | `qpu_path`

## Capability states

`UNKNOWN` | `DETECTED` | `CANDIDATE` | `SUPPORTED` | `VERIFIED` | `NOT_AVAILABLE`

## Contract fields

`virtualChipId`, `vendorFamily`, `deviceClass`, `capabilityState`, `physicalDeviceRef`, `softwareLayerCapabilities`, `runtimeAdapters`, `benchmarkEvidenceRefs`, `quantumClaimState`, `siliconModificationClaimed`, `privacyCollectionEnabled`, `orgId`, `tenantId`, `universeId`, `evidenceState`

## Neural compute pathway (encoded)

`workload → model → runtime → device → benchmark → outcome → lesson → updated routing policy`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EO11-base tip |
| --- | --- |
| EO11 Virtual Data Warehouse + report | **PRESENT** |
| EO10 Physical Product Contract Pack + report | **PRESENT** (pre-EO10-refactor tip ancestor) |
| EM (#157) Agent Compute Home Base | **PRESENT** |
| EM local-runtime ONNX adapter | probe (boolean) |
| EM1 Home Base contract | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `virtual-chip-contract-types.ts` | vendors, fields, capability ladder, locks, soft-wire |
| `virtual-chip-contract-runtime.ts` | register/label/deny surfaces + cycle |
| `virtual-chip-contract.ts` | public facade |
| `phase62lep1.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP1_VIRTUAL_CHIP_CONTRACT_REPORT.md` | this report |

## Autonomy / truth denies (tested)

| Deny | Result |
| --- | --- |
| Silicon-modification claim (AMD/NVIDIA/Intel/Apple/Qualcomm) | → **DENIED** |
| VERIFIED without runtime evidence | → **DENIED** |
| PHYSICAL_QPU_VERIFIED without authorized evidence | → **DENIED** |
| Raw GPS/camera/telemetry/trip without opt-in | → **DENIED** |
| Autonomous device control | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep1
```

| Command | Result |
| --- | --- |
| `npm run test:62lep1` | **PASS** — vendors/fields/pathway; silicon≠virtual; DETECTED≠VERIFIED; privacy/control denies; EO11+EO10+EM157 soft-wire present |

## Next (report only — do not implement)

**EP2 — Cross-Vendor CPU/GPU/NPU Abstraction** — portable capability mapping and routing across AMD, NVIDIA, Intel, Apple, Qualcomm, edge, and cloud accelerators without silicon-modification claims.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
