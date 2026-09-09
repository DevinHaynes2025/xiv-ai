# 62L-EX3 — Quantum-Inspired Algorithm Lab

**Parent:** 62L-EX / Global Operations Brain / GitHub **#170**  
**Branch:** `cursor/62l-ex3-quantum-inspired-algorithm-lab-4059`  
**Status:** IMPLEMENTED (unit-tested) ≠ VERIFIED ≠ PRODUCTION AUTHORIZED  
**L4_AUTONOMY_ENABLED:** `false`  
**PR:** none (founder ask required)  
**tip-land / main merge / force-push / prod deploy:** NO

## Checkpoint gate

| Ref | SHA |
|-----|-----|
| Base EX2 tip `cursor/62l-ex2-classical-baseline-first-4059` | `4da906eeadb6af1f6b23df0f84f784b65f45957e` |
| Feat SHA | `5c3002b04bcedb1dd544933e8117fed6ef278338` |
| Branch tip | `8e8913d36877bcbe787052870c72989ad2c44a5a` |
| GITHUB `origin/xiv-v2` | `60986682f7a6913def6da08499388aecd4acea4a` |
| GITLAB `gitlab/xiv-v2` | `1c82e0c149f15c532d8700f4802a690c2bb7555f` (behind GitHub; not unsafe divergence for this child) |
| EX1 tip soft-wire | mission.ts may be WAITING_DATA on EX2 tip; presence ≠ VERIFIED |
| TREE (EX2 base) | `68938d528090957d8b3b7c851a43377dae5ce3d1` |

Base = **EX2 tip**. Soft-wires via `existsSync`; presence ≠ VERIFIED; absent → `WAITING_DATA`.

## Mission

Canonical flow (no second agent framework):

`Problem → Workload Genome → Classical Baseline → Quantum-Inspired Candidate → CPU/GPU/NPU Route → Experiment → Benchmark → Comparison → Evidence Review → Neural Pathway Update → XIV Home Base`

Truth boundary: CPU/GPU/NPU QI runs → **QUANTUM_INSPIRED**. Never `PHYSICAL_QPU_VERIFIED` / `QUANTUM_ADVANTAGE_VERIFIED` without separate physical-QPU evidence.

## Implementation

Extends `services/ai/runtime/quantum/` on EX2 tip — **reuses** EX2 `baseline.ts` / `comparison.ts` / `pathways.ts` / `selectExecutionTarget`; does **not** duplicate Agent Mesh / Guardian / chipgraph.

| File | Role |
|------|------|
| `ex3-types.ts` | EX3 locks, SoT labels, mesh roles, QI execution classes |
| `soft-wire.ts` | EX1/EX2/mesh/chipgraph/benchmark/Guardian existsSync probes |
| `algorithm-registry.ts` | 12 algorithm families + algorithm contract registry |
| `problem-genome.ts` | Workload genome + genome-based routing (no vendor hard-code) |
| `quantum-inspired.ts` | QI classification, hardware route/fallback, candidate factory, pathways, wormholes |
| `experiment.ts` | Experiment contract + EX2 comparison gate wrapper + result states |
| `algorithm-dna.ts` | Historical algorithm brain + versioned XIV_ALGORITHM_DNA |
| `phase62lex3.test.ts` | 16 required honesty tests (+ soft-wire / factory extras) |
| `index.ts` | Barrel: EX2 exports + EX3 extensions |
| `npm run test:62lex3` | package script |

## Soft-wire (presence ≠ VERIFIED)

| Target | On EX2 tip |
|--------|------------|
| EX1 `mission.ts` | WAITING_DATA (unless landed) |
| EX2 `baseline.ts` / `comparison.ts` | PRESENT_UNVERIFIED (reused) |
| Agent Mesh | PRESENT_UNVERIFIED |
| chipgraph | WAITING_DATA (absent on tip) |
| Benchmark pack | WAITING_DATA (absent on tip) |
| Guardian | PRESENT — **unchanged** |

## Tests (`npm run test:62lex3`)

All required cases PASS:

1. CPU QI → QUANTUM_INSPIRED  
2. GPU QI → QUANTUM_INSPIRED  
3. Classical hardware never PHYSICAL_QPU_VERIFIED  
4. Missing baseline blocks superiority  
5. Mismatched problem size → NOT_COMPARABLE  
6. Deterministic reproduce within tolerance  
7. Failed experiment does not strengthen pathway  
8. Regression lowers route confidence  
9. Unverified accelerator excluded  
10. CPU fallback recorded truthfully (preferred NPU remains NOT_TESTED)  
11. Cross-tenant denied  
12. Cross-Universe denied  
13. Offline external-data → WAITING_DATA  
14. Child permission expansion denied  
15. L4 false  
16. Guardian/RLS unchanged (tree SHA + content fingerprint)

EX2 suite (`test:62lex2`) remains green on this branch.

## Honesty / locks

- `DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`
- Financial problem classes = research/simulation only — no autonomous trading
- Software wormholes = cache/kernel/index/session/warm-start/memoization only — never auth/tenant bypass
- Candidate creation ≠ preferred
- Forbidden mutations: Guardian/RLS/permissions/security/billing/production/firmware/BIOS/voltage/clocks
- DB candidates **NOT_APPLIED**
- No PR / tip-land / ManagePullRequest

## Next (docs-only)

**EX4 — Local Quantum Simulator Registry**, then **EX5 — QPU Provider Truth Registry**.
