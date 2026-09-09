# 62L-EW6 — Cross-Chip Capability Graph v2 — Implementation Evidence Report

**Track:** Global Operations Brain / 62L-EW Offline Research Mesh — GitHub **#169**  
**Label:** `62L-EW6`  
**Branch:** `cursor/62l-ew6-cross-chip-capability-graph-v2-4059`  
**Base:** `origin/xiv-v2` @ `60986682f7a6913def6da08499388aecd4acea4a` (EW1–EW5 tip `cursor/62l-ew1-ew5-offline-research-mesh-4059` was at same SHA; soft-wired)  
**Feat SHA:** `285dc2b95d8df28d75d35754d6b5cd0e95bd7ae2`
**Docs SHA:** `e17e43af2979ac038abab50c63f79839eb2e9e41`
**Tip SHA:** `e17e43af2979ac038abab50c63f79839eb2e9e41`
**Script:** `npm run test:62lew6`  
**L4_AUTONOMY_ENABLED:** `false`  
**tip-land / PR / merge main:** **NO**  
**DB / production mutations:** **NO**

`DOCUMENTED ≠ DETECTED ≠ SUPPORTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

---

## Verdict

EW6 lands a **single shared** evidence-backed capability graph under `services/ai/runtime/chipgraph/` covering AMD, NVIDIA, Intel, ARM, Apple, Qualcomm, RISC-V, and future accelerators. Agents route by **capabilities** (not brands). Soft-wires Agent Mesh + EW1–EW5 markers + HC3 `compute-graph` via `existsSync` (presence ≠ VERIFIED; absent → WAITING_DATA). **No separate vendor brains. No second orchestration framework.**

---

## Files

| Path | Role |
|------|------|
| `services/ai/runtime/chipgraph/types.ts` | Truth states, vendors, locks, soft-wires, AMD honesty |
| `services/ai/runtime/chipgraph/registry.ts` | Shared vendor/architecture/device/runtime seeds |
| `services/ai/runtime/chipgraph/graph.ts` | CapabilityGraph nodes/edges + tenant/Universe isolation |
| `services/ai/runtime/chipgraph/evidence.ts` | Evidence apply; proprietary reject; stale demotion |
| `services/ai/runtime/chipgraph/bottlenecks.ts` | Multi-class bottleneck links (incl. CACHE_BOUND) |
| `services/ai/runtime/chipgraph/routing.ts` | Capability-based eligibility routing |
| `services/ai/runtime/chipgraph/receipts.ts` | Fallback receipts + neural pathway weighting |
| `services/ai/runtime/chipgraph/index.ts` | Facade + cycle runner |
| `services/ai/runtime/chipgraph/phase62lew6.test.ts` | Required honesty tests (1–10) |
| `services/ai/package.json` | `test:62lew6` script |
| `docs/operations/reports/62L_EW6_CROSS_CHIP_CAPABILITY_GRAPH_V2_REPORT.md` | This report |

---

## Canonical pathway (encoded)

Business Problem → Algorithm → Workload Genome → Runtime/Compiler → Architecture → Physical Device → Benchmark → Bottleneck → Result → Lesson → XIV Home Base

---

## Soft-wires (`existsSync`; presence ≠ VERIFIED)

| Target | Expected on this tip | Hop |
|--------|----------------------|-----|
| Agent Mesh (`runtime/agentmesh`) | PRESENT | PASS |
| EW1–EW5 research mesh markers | Sibling park / mesh host | PASS or WAITING_DATA |
| HC3 `services/ai/compute-graph` | Often absent on xiv-v2 tip; may soft-wire parent park | PASS or WAITING_DATA (not FAIL) |
| Global Operations Brain | Park/module when present | PASS or WAITING_DATA |

EW6 home is **`runtime/chipgraph/`**. HC3 `compute-graph` is soft-wired only — not duplicated as a competing graph.

---

## Tests run

```text
cd services/ai && npm run test:62lew6
# tests 12 / pass 12 / fail 0
```

| # | Requirement | Result |
|---|-------------|--------|
| 1 | DOCUMENTED cannot satisfy VERIFIED | **PASS** |
| 2 | DETECTED cannot satisfy VERIFIED | **PASS** |
| 3 | VERIFIED CPU route can be selected | **PASS** |
| 4 | NOT_TESTED GPU/NPU excluded when verification required | **PASS** |
| 5 | Fallback records requested vs actual | **PASS** |
| 6 | Stale benchmark lowers eligibility | **PASS** |
| 7 | Cross-tenant graph access denied | **PASS** |
| 8 | Cross-Universe graph access denied | **PASS** |
| 9 | Proprietary/restricted evidence rejected | **PASS** |
| 10 | L4 remains false | **PASS** |
| + | Neural pathways strengthen/weaken without authority change | **PASS** |
| + | SoT / locks / no separate brains / no second orchestrator | **PASS** |

---

## Hardware honesty (this environment)

| Claim | Status |
|-------|--------|
| AMD GPU VERIFIED | **NO** / `NOT_TESTED` |
| AMD NPU (Ryzen AI) VERIFIED | **NO** / `NOT_TESTED` |
| AMD Radeon / ROCm live probe | **NOT_TESTED** |
| NVIDIA CUDA/TensorRT live | **NOT_TESTED** (candidate DOCUMENTED/NOT_TESTED) |
| Intel GPU/NPU/OpenVINO live | **NOT_TESTED** |
| ARM / Apple / Qualcomm / RISC-V live device VERIFIED | **NOT_TESTED** |
| Fallback CPU PASS while AMD NPU remains NOT_TESTED | **Encoded / tested** |
| Silicon modify / RTL / firmware copy | **NO** (locked) |
| Production authorization | **NO** |

---

## Proprietary XIV value (encoded; not vendor IP)

Workload genome hooks, routing policy, benchmark memory, bottleneck graph, fallback intelligence, cache/session strategy hooks, quantization policy stub, Agent Mesh integration, evidence graph, pathway weighting.

**Rejected evidence classes:** VENDOR_RTL, VENDOR_FIRMWARE, CONFIDENTIAL_MICROARCHITECTURE, LEAKED_SOURCE, RESTRICTED_ISA_EXTENSION, TRADE_SECRET.

---

## Explicit non-claims / remaining NOT_TESTED

- Live multi-vendor device inventory on this node — **NOT_TESTED**
- AMD Local Communication Adapter — **next story EW7**
- Tip-land onto `xiv-v2` / main — **NO**
- PR / ManagePullRequest — **NO**
- L4 autonomy — **false**

---

## Next story

**EW7 — AMD Local Communication Adapter**
