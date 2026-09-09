# 62L-EP10 — Other Accelerator Registry Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest / manufacturer favoritism / cloud-spend-from-registry

Date: 2026-09-09  
Branch: `cursor/62l-ep10-other-accelerator-registry-4059`  
Tip SHA: `fbda3d2b2a3c726b0ac4f7c1f4b3d9dd8b06de6d`  
Base: `cursor/62l-ep9-intel-adapter-research-path-4059` @ `db15280f67fe45414dc9fe260f7d0ee6dfd0a019`  
Predecessor: EP9 Intel Adapter Research Path **PRESENT**  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP10 Other Accelerator Registry*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Every vendor follows the **same evidence standard** — no manufacturer-name favoritism
- Registry presence **≠** partnership, certification, hardware access, or compatibility
- Automotive: documented platforms may be listed; capabilities stay **RESEARCH/SIMULATION** until authorized vehicle/platform tested
- Cloud: registry presence **≠** spending or data movement; usability requires org authorization, credentials, region/data-policy approval, and measured runtime evidence
- Quantum ladder: `THEORETICAL` | `SIMULATED` | `QUANTUM_INSPIRED` | `PHYSICAL_QPU_VERIFIED`
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Initial categories (8)

`apple_cpu_gpu_neural_engine` | `qualcomm_cpu_gpu_hexagon_npu` | `arm_based_edge_accelerators` | `automotive_adas_compute` | `industrial_ai_accelerators` | `cloud_inference_accelerators` | `specialized_inference_asics` | `future_qpu_providers`

## Record fields (17)

`providerId`, `deviceFamily`, `deviceModel`, `deviceType`, `architecture`, `runtimeSdk`, `supportedOs`, `modelFormats`, `supportedPrecisions`, `memory`, `documentedCapabilities`, `measuredCapabilities`, `privacyLocality`, `costEnergyProxy`, `benchmarkRefs`, `verificationState`, `lastVerifiedAt`

## Truth states

Progression: `UNKNOWN` → `DOCUMENTED` → `DETECTED` → `SUPPORTED` → `VERIFIED`  
Adjacent: `NOT_TESTED` | `DEGRADED` | `UNAVAILABLE`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP9 tip |
| --- | --- |
| EP9 Intel Adapter Research Path + report | **PRESENT** |
| EP8 NVIDIA Adapter Research Path + report | **PRESENT** |
| EP7 AMD Adapter Research Path + report | **PRESENT** |
| EP5 Public Benchmark Memory + report | **PRESENT** |
| EP1 Virtual Chip Contract + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `other-accelerator-registry-types.ts` | categories, fields, locks, soft-wire |
| `other-accelerator-registry-runtime.ts` | register/advance/cloud/deny + cycle |
| `other-accelerator-registry.ts` | public facade |
| `phase62lep10.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP10_OTHER_ACCELERATOR_REGISTRY_REPORT.md` | this report |

## Autonomy / safety / truth denies (tested)

| Deny | Result |
| --- | --- |
| Favor vendor by manufacturer name | → **DENIED** |
| Imply partnership / certification / access / compatibility | → **DENIED** |
| Equate DOCUMENTED with VERIFIED | → **DENIED** |
| Automotive VERIFIED without authorized platform test | → **DENIED** |
| Cloud spend / data movement from registry presence | → **DENIED** |
| Cloud use without all preconditions | → **DENIED** |
| THEORETICAL/SIMULATED = PHYSICAL_QPU_VERIFIED | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep10
```

| Command | Result |
| --- | --- |
| `npm run test:62lep10` | **PASS** — equal evidence standard; automotive/cloud/quantum gates; soft-wire EP9→EP1 PRESENT |

## Next (report only — do not implement)

**EP11 — Virtual Instruction / Task Envelope** — turn an agent mission into a device-neutral compute instruction that can be routed safely across any verified accelerator.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
