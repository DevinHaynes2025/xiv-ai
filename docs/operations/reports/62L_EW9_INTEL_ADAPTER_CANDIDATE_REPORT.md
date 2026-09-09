# 62L-EW9 — Intel CPU/GPU/NPU Adapter Candidate

**Status:** EW9 **IMPLEMENTED** on child branch — **NOT tip-landed** — **NO PR** — **NOT production authorized**

**Date:** 2026-09-09  
**Story:** GitHub #169 / 62L-EW Slice EW9 under Global Operations Brain  
**Branch:** `cursor/62l-ew9-intel-adapter-candidate-4059`  
**Base (authorized tip):** EW8 `origin/cursor/62l-ew8-nvidia-adapter-candidate-4059` @ `0728cdb045a6a9c298e2d4949759e5551fa644b6` (contains EW7 + `origin/xiv-v2`)  
**Feat tip SHA:** `d21a28ac9ef6fed4b75405f082a5d218b3c19a73`  
**Docs tip SHA:** `77771683356375da2c7539d28719ed0bd45af2a6`  
**Honesty:** DOCUMENTED ≠ DETECTED ≠ SUPPORTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED  
**Locks:** `L4_AUTONOMY_ENABLED=false`; tip-land=NO; merge-main=NO; no PR opened

---

## 1. FIRST CHECKPOINT

| Item | Value |
|------|-------|
| LOCAL (pre-rebase) | Started from `origin/xiv-v2` @ `60986682f7a6913def6da08499388aecd4acea4a` |
| GITHUB `origin/xiv-v2` | `60986682f7a6913def6da08499388aecd4acea4a` |
| GITLAB `gitlab/xiv-v2` | `1c82e0c149f15c532d8700f4802a690c2bb7555f` (lags GitHub; no invented GitLab issue) |
| EW8 tip | **PRESENT** @ `f20034ad…` — used as rebase base |
| EW7 tip | PRESENT (ancestor of EW8) @ `42afa7a7…` |
| EW6 tip | PRESENT @ `384c8ce3…` (soft-wire) |
| TREE | Clean child worktree `/workspace/.wt-ew9`; no merge to main; no force-push |
| Soft-wire EW8/EW7/EW6 | `existsSync` → **PRESENT** on sibling paths / ancestry — presence ≠ VERIFIED |
| Separate Intel brain? | **NO** — same shared `runtime/chipgraph` fabric as AMD/NVIDIA |
| STOP? | **NO** — EW8 tip clear; child branch rebased and implemented |

---

## 2. Mission outcome

Intel CPU/GPU/NPU adapter candidate connects Agent Mesh → Workload Genome → Compute Envelope → Cross-Chip Capability Graph → Intel Adapter → Resource Governor → CPU/GPU/NPU → Execution Receipt → Benchmark Ledger → Bottleneck Analyzer → Neural Pathway → XIV Home Base.

Independent Intel truth classes (`INTEL_CPU`, `INTEL_GPU`, `INTEL_NPU`, `OPENVINO_RUNTIME`, `ONNX_RUNTIME_PROVIDER`, `OTHER_DOCUMENTED_RUNTIME`) never infer across devices. DOCUMENTED/DETECTED cannot satisfy VERIFIED. CPU success does not verify GPU/NPU. Missing runtimes → `NOT_CONFIGURED` / `UNAVAILABLE`. Silent driver/runtime install denied. GPU/NPU → CPU fallback records requested vs actual and leaves accelerator unverified. Offline web/API → `WAITING_DATA`; hardware shutdown → `OFFLINE_STOPPED`.

---

## 3. Files created / modified

| File | Role |
|------|------|
| `services/ai/runtime/chipgraph/ew9-types.ts` | Intel truth states, locks, soft-wires, honesty |
| `services/ai/runtime/chipgraph/intel-envelope.ts` | Intel-facing envelope (mission field contract; does not replace EW7 shared AMD envelope) |
| `services/ai/runtime/chipgraph/intel-receipt.ts` | Execution receipt + Home Base ledger |
| `services/ai/runtime/chipgraph/intel-resource-policy.ts` | Thin governor bridge (ALLOW/QUEUE/THROTTLE/FALLBACK/DENY) |
| `services/ai/runtime/chipgraph/intel-capabilities.ts` | Capability truth table |
| `services/ai/runtime/chipgraph/intel-runtime.ts` | OpenVINO/ONNX/CPU/GPU/NPU runtime candidates |
| `services/ai/runtime/chipgraph/intel-benchmark.ts` | Comparable benchmarks + neural pathway weights (routing only) |
| `services/ai/runtime/chipgraph/intel-adapter.ts` | Shared Intel adapter candidate execute path |
| `services/ai/runtime/chipgraph/intel-cycle.ts` | EW9 cycle runner |
| `services/ai/runtime/chipgraph/index.ts` | Facade: EW7 + EW8 + EW9 aliased exports |
| `services/ai/runtime/phase62lew9.test.ts` | Required 16 honesty/denial tests |
| `services/ai/package.json` | `test:62lew9` script |
| `services/ai/runtime/index.ts` | Soft re-export of EW9 entrypoints |
| `docs/operations/reports/62L_EW9_INTEL_ADAPTER_CANDIDATE_REPORT.md` | This evidence |

### Soft-wired / reused (not duplicated as competing fabric)

- EW7 `compute-envelope.ts` / `compute-receipt.ts` / `resource-policy.ts` / `amd-adapter.ts` — kept from EW8 tip
- EW8 `nvidia-adapter.ts` + related — kept from base tip
- EW6 chipgraph / Agent Mesh / local-runtime governor — `existsSync` soft-wire
- Neural pathways update routing confidence only — never Guardian/RLS/tenant/Universe/permissions

---

## 4. Hardware honesty (this environment)

| Layer | State | Verified? |
|-------|-------|-----------|
| INTEL_CPU | Safe baseline path can graduate to VERIFIED via bounded test | CPU only |
| INTEL_GPU | `NOT_TESTED` | **false** — not fabricated |
| INTEL_NPU | `NOT_TESTED` | **false** — not fabricated |
| OPENVINO_RUNTIME | `NOT_CONFIGURED` | no silent install |
| ONNX_RUNTIME_PROVIDER | `NOT_CONFIGURED` | no silent install |

XIV software acceleration only: routing, operators, precision, quantization, batching, session/cache, queue, partitioning, benchmark fallback, offline placement. No firmware/BIOS/microcode/voltage/clock/thermal/silicon claims.

---

## 5. Tests run (actually executed)

### `npm run test:62lew9` — **PASS** (16/16)

| # | Test | Result |
|---|------|--------|
| 1 | DOCUMENTED Intel cannot satisfy VERIFIED | **PASS** |
| 2 | DETECTED Intel GPU cannot satisfy VERIFIED | **PASS** |
| 3 | DETECTED Intel NPU cannot satisfy VERIFIED | **PASS** |
| 4 | CPU verified path can execute | **PASS** |
| 5 | GPU→CPU fallback truth | **PASS** |
| 6 | NPU→CPU fallback truth | **PASS** |
| 7 | missing runtime → NOT_CONFIGURED/UNAVAILABLE | **PASS** |
| 8 | stale runtime evidence excluded | **PASS** |
| 9 | expired task denied | **PASS** |
| 10 | resource limit → queue/fallback/deny | **PASS** |
| 11 | tenant mismatch denied | **PASS** |
| 12 | Universe mismatch denied | **PASS** |
| 13 | offline web → WAITING_DATA | **PASS** |
| 14 | hardware shutdown → OFFLINE_STOPPED | **PASS** |
| 15 | L4 false | **PASS** |
| 16 | Guardian/RLS unchanged | **PASS** |

### Regression

- `npm run test:62lew7` — **PASS** (14/14)
- `npm run test:62lew8` — **PASS** (20/20)

---

## 6. Blockers / notes

- No local Intel GPU/NPU VERIFIED evidence in this cloud VM — correctly left `NOT_TESTED` / `NOT_CONFIGURED`.
- GitLab `xiv-v2` lags GitHub tip; no GitLab issue number invented.
- EW8 tip was absent at first probe; later present — EW9 rebased onto EW8 before push.
- Child branch only; **no PR**; tip-land=NO; production DB/Guardian/RLS untouched.

---

## 7. Next (docs-only)

**EW10 — ARM + Apple Silicon + Qualcomm + Google Tensor + Samsung/Exynos Mobile & Edge Capability Registry**
