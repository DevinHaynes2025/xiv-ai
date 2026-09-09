# 62L-EL — Windows Hardware Truth Probe + Local Runtime Verification + AMD CPU/GPU/NPU Scheduler Gates + Offline Agent Heartbeat + Classical Benchmark Gate

Status: IMPLEMENTATION COMPLETE ON CHILD BRANCH — UNIT TESTS EXECUTED — NOT A WINDOWS-NODE VERIFICATION PASS — NOT PRODUCTION AUTHORIZATION — NO PUBLIC LAUNCH — NO CONTRACT/PAYMENT

Date: 2026-09-09
Branch: `cursor/62l-el-windows-hardware-truth-probe-4059`
Parent / base tip: EI `cursor/62l-ei-chip-to-cloud-cognitive-fabric-4059` @ `028edbd2c1854fc7edb8955c53536a38117f5da8` + `docs/operations/62L_EI_CHIP_TO_CLOUD_COGNITIVE_FABRIC_REPORT.md` (**PRESENT**)
Why this base: Preference **EK → EI**. `cursor/62l-ek-*` **ABSENT** on origin at implement time. Soft-wire: `62L_EK_*` **ABSENT**; `62L_EI_*` **PRESENT**. No tip-land onto `xiv-v2`/`main`.
Implementation SHA: `587b6c280c28b92c31247ac6e6837e182dfe150d`
Tip SHA: `edaae584ccd04f06f5ed234c4f4be305677d3605`
Tip-land: **NO**
PR: **NOT CREATED** (founder did not ask; ManagePullRequest / `gh pr create` not called)
Production deploy: **NO**
Merge: **NO**
DB migration applied: **NO** (`NOT_APPLIED`; no live Supabase)
Public launch: **NO**
Contract / payment: **NO**

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Recommendation ≠ execute
- Digital Twin ≠ founder
- DB candidates **NOT_APPLIED**
- `DETECTED ≠ SUPPORTED ≠ VERIFIED`
- AMD GPU/NPU route before EL1–EL4 = **DENIED**
- ONNX load / Windows local inference / ASUS model / offline agents / physical QPU / Microsoft desktop = **NOT_TESTED** until local evidence
- Missing heartbeat → `WAITING_NODE` / `OFFLINE_STOPPED` (do not claim agents run while ASUS is off)
- Classical baseline required before quantum-inspired comparison; no quantum advantage claims

## Source of truth

| Source | Role |
|---|---|
| **GitHub Issue #156** | **Implementation SoT** (issue API not resolvable in this environment; scope taken from founder master prompt; citation retained) |
| **GitLab** | Coordination search attempted — MCP `needsAuth`; **no GitLab number invented** |

## Gate protocol

| Check | Result |
|---|---|
| EK tip + report on origin | **ABSENT** — skipped per preference chain |
| EI tip + report | **PRESENT** @ `028edbd2c1854fc7edb8955c53536a38117f5da8` + `62L_EI_CHIP_TO_CLOUD_COGNITIVE_FABRIC_REPORT.md` — **used as base** |
| `origin/xiv-v2` / `main` tip-land | **NO** |
| Draft PR / ManagePullRequest | **NOT CREATED** |
| Gate verdict | **62L-EI tip + report CLEAR for this child**. Soft-wire EI **PRESENT**; EK **ABSENT**. Not PASS for Windows-node verification. |

## Architecture chain (soft-wired)

**Existing XIV Agent Brain → policy/approval gate → model router → new local-runtime layer → hardware truth probe → CPU/GPU/NPU capability registry → resource governor → offline heartbeat → classical benchmark engine → (later) quantum-inspired research**

Soft-wire verification (unit-tested):

| Surface | Result |
|---|---|
| `policies.canAutoExecute` | always **false** |
| High/critical risk tools | **blocked** |
| Medium-risk / approval-marked | **human approval required** |
| `model-router` supplier reallocation | **proposed simulation requiring approval** (not execute) |
| `diagnostics.ts` secret redaction | **PRESENT** (EL3 aligned) |
| `62L_EI_*` | **PRESENT** |
| `62L_EK_*` | **ABSENT** (honest soft-wire; not invented) |

## EL1–EL4 gate table

| Gate | Meaning | Status |
|---|---|---|
| **EL1** | Hardware truth types — capability registry enums/flags default unknown/false/NOT_TESTED | **PASS** (unit) |
| **EL2** | Read-only Windows hardware probe contract — no stealth persistence / permission bypass | **PASS** (unit) |
| **EL3** | Privacy-minimal probe output — redacts hostname/serial/MAC/username/home/GUID; secret alignment | **PASS** (unit) |
| **EL4** | CPU baseline classical benchmark gate (CPU path only) | **PASS** (unit) |
| AMD GPU/NPU route **before** EL1–EL4 | Hard deny | **DENIED in tests** |
| AMD GPU/NPU route **after** EL1–EL4 without probe flags | Deny / UNAVAILABLE / NOT_TESTED | **DENIED in tests** |
| AMD GPU scheduling candidate after EL1–EL4 **with** `GPU_DETECTED` + `AMD_EP_SUPPORTED` (+ model load flag awareness) | Candidate only; `amdInferenceClaimed=false` | **PASS** (unit; not production VERIFIED) |

## Primary code home

`services/ai/local-runtime/**`

| Module | Role |
|---|---|
| `types.ts` | EL1 capability registry / flags / honesty locks |
| `hardware-probe.ts` | EL2 read-only probe |
| `privacy.ts` | EL3 redaction |
| `runtime-state.ts` | EL1–EL4 gate state machine |
| `workload-router.ts` | AMD deny-before-pass + probe-flag routing |
| `resource-governor.ts` | Bounded resource decisions |
| `heartbeat.ts` | Offline agent heartbeat truth states |
| `benchmark.ts` | Classical CPU baseline + quantum compare gate |
| `onnx-adapter.ts` | ONNX stub/contract; load **NOT_TESTED** |
| `soft-wire.ts` | Policy / model-router / EI–EK presence probe |
| `el-sequence.ts` | Ordered EL1→EL4 runner |
| `index.ts` | Public surface |

Soft-export: `services/ai/local-brain/local-runtime-el-softwire.ts` + `phase62lel.test.ts`  
Script: `npm run test:62lel`

## VERIFIED vs NOT_TESTED inventory

### May treat as existing in repo (code-present; not overclaimed production)

| Item | Label |
|---|---|
| Agent / service code exists | **IMPLEMENTED** (repo) |
| Authorization / tool allowlists | **IMPLEMENTED** |
| Auto-execution disabled (`canAutoExecute=false`) | **IMPLEMENTED** |
| Human approval logic | **IMPLEMENTED** |
| Secret-redaction diagnostics | **IMPLEMENTED** |
| EL1–EL4 local-runtime unit gates | **IMPLEMENTED** (unit-tested) |

### Remain NOT_TESTED / unverified until local runtime evidence

| Item | Label |
|---|---|
| Founder ASUS hardware model | **NOT_TESTED** |
| AMD GPU acceleration | **NOT_TESTED** |
| NPU acceleration | **NOT_TESTED** |
| Windows local inference | **NOT_TESTED** |
| Offline-running agents | **NOT_TESTED** |
| ONNX model loading | **NOT_TESTED** |
| Physical quantum hardware | **NOT_TESTED** |
| Microsoft desktop integrations | **NOT_TESTED** |

## Offline Agent Heartbeat

| Signal | State |
|---|---|
| Missing timestamp | `WAITING_NODE` |
| Device off / runtime stopped | `OFFLINE_STOPPED` |
| Stale timestamp | `STALE` |
| Fresh + running | `RUNNING_VERIFIED` |
| Agents claimed working while off | **false** (hard) |

## Classical Benchmark Gate

- CPU-only baseline recorded in EL4
- Quantum-inspired comparison **denied** without classical baseline
- With baseline: comparison may be bounded; **quantumAdvantageClaimed=false** always
- Soft-wire EK quantum truth states when EK types module **PRESENT** (currently **ABSENT**)

## Tests

```text
cd services/ai && npm run test:62lel
```

Expected: **PASS** (unit). Not a Windows/ASUS/AMD/ONNX physical verification.

## Non-claims

- No ManagePullRequest / draft PR / merge / tip-land
- No live Supabase / DB apply
- No ASUS/AMD/ONNX/Windows-inference verified claim without local evidence
- No independent spend / sign / deploy

## Next (report only)

After EL1–EL4 pass: deepen AMD CPU/GPU/NPU scheduler routing behind probe evidence; deepen ONNX adapter; await founder **62L-EM** / next issue paste.
