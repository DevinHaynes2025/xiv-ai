# 62L-EX2 — Classical Baseline First

**Parent:** 62L-EX / Global Operations Brain / GitHub **#170**  
**Branch:** `cursor/62l-ex2-classical-baseline-first-4059`  
**Status:** IMPLEMENTED (unit-tested) ≠ VERIFIED ≠ PRODUCTION AUTHORIZED  
**L4_AUTONOMY_ENABLED:** `false`  
**PR:** none (founder ask required)  
**tip-land / main merge / force-push / prod deploy:** NO

## Checkpoint gate

| Ref | SHA |
|-----|-----|
| LOCAL (EX2 tip at feat) | `aecba039e7690e81486e826eed3a8ee3dc8a0330` |
| GITHUB `origin/xiv-v2` | `60986682f7a6913def6da08499388aecd4acea4a` |
| GITLAB `gitlab/xiv-v2` | `1c82e0c149f15c532d8700f4802a690c2bb7555f` (behind GitHub by 4 commits; merge-base = GitLab tip — not unsafe) |
| EX1 tip `cursor/62l-ex1-offline-quantum-mission-contract-4059` | `60986682f7a6913def6da08499388aecd4acea4a` (= origin/xiv-v2; EX1 quantum modules not landed yet) |
| TREE (base) | `4d5e3c29c1e9b15e135b7c085095fd0306d03af5` |

Base = EX1 tip. Soft-wires via `existsSync`; presence ≠ VERIFIED; absent → `WAITING_DATA`.

## Mission

Classical Baseline Lab is the **mandatory comparison layer** for quantum / quantum-inspired / simulated-quantum research.

Canonical path (no second agent framework):

`Home Base → Agent Mesh → Quantum Mission → Classical Baseline → Candidate → Comparable Benchmark → Evidence Review → Neural Pathway → Home Base`

## Implementation

Under `services/ai/runtime/quantum/` (co-located with EX1 quantum surface; EX1 `mission.ts` soft-wired):

| File | Role |
|------|------|
| `types.ts` | Contract fields, baseline/comparison states, locks, soft-wire snapshot |
| `baseline.ts` | Receipt create/complete, CPU/GPU/NPU target selection, library index, stale detection |
| `comparison.ts` | Comparability gate + advantage-claim rule |
| `benchmark.ts` | Comparable benchmark pack; COST_UNKNOWN / energy honesty |
| `reproducibility.ts` | Repeat-run stats; COMPLETED ≠ auto REPRODUCIBLE |
| `pathways.ts` | Classical + candidate pathways + `COMPARISON_EDGE` |
| `agent.ts` | `ClassicalBaselineAgent` role on Agent Mesh (not a new framework) |
| `index.ts` | Barrel |
| `phase62lex2.test.ts` | Required denial/honesty tests |

Script: `npm run test:62lex2` in `services/ai`.

### Soft-wire (on EX1 tip)

| Hop | Presence on base | Hop state |
|-----|------------------|-----------|
| Agent Mesh | PRESENT | PASS (≠ VERIFIED) |
| EX1 Quantum Mission (`mission.ts`) | ABSENT | WAITING_DATA |
| Chipgraph | ABSENT | WAITING_DATA |
| Classical quant benchmark | ABSENT | WAITING_DATA |

### Honesty locks

- Never claim quantum faster/cheaper/superior/advantage from one isolated result.
- Require baseline + candidate + comparability receipts + repeat runs + variance + hardware/runtime identity + review.
- `COMPLETED ≠ REPRODUCIBLE`.
- Cost: known or `COST_UNKNOWN` (no fabricate). Energy: measured vs `ENERGY_PROXY_ESTIMATE`.
- Cross-tenant / cross-Universe → DENIED.
- GPU/NPU only when independently VERIFIED (else CPU fallback recorded truthfully).
- STALE baselines cannot support strong claims until rerun.
- Lawful public/open/licensed knowledge only; no restricted proprietary IP copy.
- Pathway learning may change ranking/confidence/retest — never permissions / Guardian / RLS / tenant / Universe / production.
- Guardian + RLS migrations unchanged by this phase.
- DB candidates: `NOT_APPLIED`.

## Tests (`npm run test:62lex2`)

| # | Case | Result |
|---|------|--------|
| 1 | quantum candidate without baseline → advantage DENIED | PASS |
| 2 | equivalent inputs → comparison ELIGIBLE | PASS |
| 3 | different problem size → NOT_COMPARABLE | PASS |
| 4 | different success criteria → NOT_COMPARABLE | PASS |
| 5 | stale baseline blocked from strong claim | PASS |
| 6 | failed baseline → comparison BLOCKED | PASS |
| 7 | reproducible repeated baseline → REPRODUCIBLE | PASS |
| 8 | CPU fallback recorded truthfully | PASS |
| 9 | unverified GPU/NPU excluded when VERIFIED required | PASS |
| 10 | cross-tenant baseline DENIED | PASS |
| 11 | cross-Universe baseline DENIED | PASS |
| 12 | offline external-data → WAITING_DATA | PASS |
| 13 | L4 false | PASS |
| 14 | Guardian/RLS unchanged | PASS |

**Summary:** 16/16 pass (includes SoT/soft-wire/library extras).

## Next (docs-only)

**EX3 — Quantum-Inspired Algorithm Lab**

## Blockers / honesty

- EX1 quantum mission modules not yet on tip → soft-wire `WAITING_DATA` (not FAIL).
- Chipgraph / offline benchmark packs absent on base → `WAITING_DATA`.
- No quantum advantage claimed; no hardware VERIFIED beyond CPU fixture honesty.
- GitLab MCP needsAuth — no GitLab issue number invented.
- No PR opened.
