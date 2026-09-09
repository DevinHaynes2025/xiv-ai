# 62L-EX7 — Hybrid Classical/Quantum Router

**Parent:** 62L-EX / Global Operations Brain / GitHub **#170**  
**Branch:** `cursor/62l-ex7-hybrid-classical-quantum-router-4059`  
**Status:** IMPLEMENTED (unit-tested) ≠ VERIFIED ≠ PRODUCTION AUTHORIZED  
**L4_AUTONOMY_ENABLED:** `false`  
**PR:** none (founder ask required)  
**tip-land / main merge / force-push / prod deploy:** NO

## Checkpoint gate

| Ref | SHA |
|-----|-----|
| Feat SHA | `20082aabfef2eb3c42ed68cdc8b27264a7c5155a` |
| Branch tip | see `git rev-parse HEAD` on `cursor/62l-ex7-hybrid-classical-quantum-router-4059` after push |
| GITHUB `origin/xiv-v2` | `60986682f7a6913def6da08499388aecd4acea4a` |
| GITLAB `gitlab/xiv-v2` | `1c82e0c149f15c532d8700f4802a690c2bb7555f` (behind GitHub; merge-base = GitLab tip — not unsafe) |
| EX6 tip `cursor/62l-ex6-physical-qpu-execution-receipt-4059` | `60986682f7a6913def6da08499388aecd4acea4a` (= origin/xiv-v2; EX6 modules not tip-landed) |
| EX2 tip (committed predecessor) | `4da906eeadb6af1f6b23df0f84f784b65f45957e` |
| EX1 tip (committed predecessor) | `994f74f819040c103486f3c99f0e92f907015fd2` |
| TREE (base) | EX6 tip = `60986682f7a6913def6da08499388aecd4acea4a` |

Base = EX6 tip (equals authorized `origin/xiv-v2`). Soft-wires via `existsSync`; presence ≠ VERIFIED; absent → `WAITING_DATA`.  
Predecessor EX3–EX6 implementations were not tip-landed at base time — soft-wire `WAITING_DATA` (not FAIL). No unsafe divergence vs GitHub xiv-v2.

## Mission

One **shared hybrid router** on the existing Agent Mesh / Home Base / quantum fabric — **not** a second quantum orchestration system.

Canonical flow:

`Mission → Problem Classification → Workload Genome → Policy Gate → Data/Privacy Gate → Evidence Gate → Cost/Latency Gate → Eligible Execution Paths → Route Scoring → Selected Candidate → Execution → Receipt → Comparison → Learning → XIV Home Base`

### Route classes (never collapsed to vague QUANTUM)

`CLASSICAL_CPU` · `CLASSICAL_GPU` · `CLASSICAL_NPU` · `QUANTUM_INSPIRED_CPU/GPU/NPU` · `SIMULATED_QUANTUM_CPU/GPU` · `PHYSICAL_QPU_CANDIDATE`  

`PHYSICAL_QPU_CANDIDATE ≠ submitted`.

### LOCAL_FIRST priority

1 verified local satisfying → 2 verified local accelerator → 3 QI local when justified → 4 verified local simulator → 5 authorized remote classical (reason required) → 6 authorized physical QPU candidate.

## Implementation

Under `services/ai/runtime/quantum/`:

| File | Role |
|------|------|
| `types.ts` | HybridExecutionRequest, route classes/states, locks, soft-wire snapshot |
| `route-policy.ts` | Tenant/Universe/privacy/evidence/cost/offline/provider/approval gates |
| `route-score.ts` | Multi-factor scoring; stale benchmark confidence penalty; LOCAL_FIRST rank |
| `route-receipt.ts` | Explicit fallback recording, route receipt, learning (≠ permissions) |
| `hybrid-router.ts` | Shared router orchestration → HybridRouteDecision |
| `index.ts` | Barrel |
| `phase62lex7.test.ts` | Required denial/honesty tests 1–18 |

Script: `npm run test:62lex7` in `services/ai`.

### Soft-wire (on EX6 tip = xiv-v2)

| Hop | Presence on base | Hop state |
|-----|------------------|-----------|
| Agent Mesh | PRESENT | PASS (≠ VERIFIED) |
| Guardian / policy | PRESENT | PASS (≠ mutate) |
| Chipgraph | ABSENT | WAITING_DATA |
| EX1 mission.ts | ABSENT | WAITING_DATA |
| EX2 baseline.ts | ABSENT | WAITING_DATA |
| EX3 quantum-inspired.ts | ABSENT | WAITING_DATA |
| EX4 simulator-registry.ts | ABSENT | WAITING_DATA |
| EX5 qpu-provider.ts | ABSENT | WAITING_DATA |
| EX6 physical-qpu-receipt.ts | ABSENT | WAITING_DATA |
| Classical quant benchmark | ABSENT | WAITING_DATA |

### Honesty locks

- `L4_AUTONOMY_ENABLED=false`; no tip-land; no PR; no prod auth.
- DETECTED ≠ VERIFIED (AMD/NVIDIA/Intel/Apple/Qualcomm/ARM/QPU same rule).
- Missing EX2 baseline → `INSUFFICIENT_EVIDENCE` (no advantage claim).
- Offline physical QPU → `WAITING_PROVIDER`; web-fresh offline → `WAITING_DATA`; no fabricate.
- Cost-bearing physical QPU → `HUMAN_APPROVAL_REQUIRED` (no buy/submit/credentials/terms).
- Explicit fallback only; silent fallback forbidden.
- Route learning → ranking/confidence only; `PREFERRED ≠ production auth`.
- Cross-tenant / cross-Universe → `ROUTE_DENIED`.
- Guardian + RLS migrations unchanged; DB candidates `NOT_APPLIED`.
- Software wormholes still pass auth.

## Tests (`npm run test:62lex7`)

| # | Case | Result |
|---|------|--------|
| 1 | verified local CPU eligible | PASS |
| 2 | detected-but-unverified GPU excluded from VERIFIED request | PASS |
| 3 | offline physical QPU → WAITING_PROVIDER | PASS |
| 4 | local simulator remains SIMULATED_QUANTUM | PASS |
| 5 | QI GPU remains QUANTUM_INSPIRED | PASS |
| 6 | missing baseline blocks advantage claim | PASS |
| 7 | private local-only data cannot route to cloud/QPU | PASS |
| 8 | cost over budget → denied | PASS |
| 9 | cost-bearing physical QPU → HUMAN_APPROVAL_REQUIRED | PASS |
| 10 | stale benchmark lowers eligibility/confidence | PASS |
| 11 | fallback records requested vs actual | PASS |
| 12 | expired → EXPIRED | PASS |
| 13 | cross-tenant DENIED | PASS |
| 14 | cross-Universe DENIED | PASS |
| 15 | no eligible → NO_ELIGIBLE_ROUTE | PASS |
| 16 | route learning cannot modify permissions | PASS |
| 17 | L4 false | PASS |
| 18 | Guardian/RLS unchanged | PASS |

**Summary:** 20/20 pass (18 required + SoT/soft-wire extras).

## Next (docs-only)

**EX8 — Offline Quantum Agent Team**

## Blockers / honesty

- EX1–EX6 quantum modules not tip-landed on EX6/xiv-v2 base → soft-wire `WAITING_DATA` (not FAIL).
- Chipgraph / offline benchmark packs absent on base → `WAITING_DATA`.
- No quantum advantage claimed; no autonomous QPU purchase/submit; simulation never presented as physical.
- GitLab MCP needsAuth — no GitLab issue number invented.
- No PR opened.
