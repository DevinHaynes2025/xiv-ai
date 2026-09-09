# 62L-EO6 — Classical Baseline Requirement Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — autonomy / vague-claim / tradeoff honesty denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest / auto-promote without measured advantage / L4 / vague “quantum-powered” claims without data

Date: 2026-09-09  
Branch: `cursor/62l-eo6-classical-baseline-requirement-4059`  
Tip SHA: `844a79ea9b268309c0b6ba8e825329bbaa1d4836`  
Implementation SHA (feat): `53a20bbc2ed8f8f163b0056538585a3fd3128e9b`  
Base: `cursor/62l-eo5-quantum-evidence-boundary-4059` @ `7869e39cbccc893cc8335393392257c3e40ac291` (preferred predecessor)  
SoT: **GitHub #159** EO family — *Classical Baseline Requirement* (park-and-implement child)  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Soft-wire presence ≠ VERIFIED
- Recommend ≠ promote / act
- No auto-promote without measured advantage
- Classical baselines required before advanced / AI-agentic / quantum claims
- Tradeoff honesty required: state **exactly what improved and what got worse**
- Government proposal rule: every optimization claim traceable to benchmark evidence
- Deny vague claims (e.g. “quantum-powered efficiency”) without test data
- DB candidates **NOT_APPLIED**
- Tip-land / PR / prod deploy: **NO**

## User story

As XIV AI OS, I want every advanced optimization, AI-agentic, or quantum experiment compared against strong classical baselines so XIV can prove whether a new method actually improves performance.

## Predecessor / base

| Field | Value |
| --- | --- |
| Preferred base | EO5 `cursor/62l-eo5-quantum-evidence-boundary-4059` @ `7869e39c` |
| Fallback | EO4 `cursor/62l-eo4-ai-quantum-capability-matrix-4059` / EO3 / … |
| Working branch | `cursor/62l-eo6-classical-baseline-requirement-4059` |
| Tip-land / PR / prod / DB | **NO** / **None** / **NO** / **NOT_APPLIED** |

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire |
| --- | --- |
| EO4 AI & Quantum Capability Matrix | probe `ai-quantum-capability-matrix*.ts` + report — **WAITING_DATA** (sibling not on tip) |
| EO5 Quantum Evidence Boundary (language gate / classical mandate) | `quantum-evidence-boundary*.ts` + report — **PRESENT** |
| EM9 classical quant benchmarks | `local-runtime/classical-quant-benchmark.ts` — **PRESENT** |
| EO3 watch / #159 EO Mission OS / EN Deal OS | presence probes only |

## Problem definition fields (encoded)

`problemId`, `objectiveFunction`, `constraints`, `datasetVersion`, `baselineAlgorithms`, `advancedCandidateAlgorithms`, `evaluationMetrics`, `computeBudget`, `runtimeBudget`, `reproducibilitySeed`, `testEnvironment`, `expectedOutcome`, `evidenceOwner`

## Minimum baseline families

| Family | Id |
| --- | --- |
| Greedy / rule-based | `greedy_rule_based` |
| LP | `linear_programming` |
| MIP | `mixed_integer_programming` |
| Constraint programming | `constraint_programming` |
| Graph algorithms | `graph_algorithms` |
| DP (where applicable) | `dynamic_programming` |
| Monte Carlo / statistical | `monte_carlo_statistical` |
| Classical ML | `classical_ml` |
| Metaheuristics (GA, SA, tabu, particle, …) | `metaheuristics` |

## Comparison metrics

`solution_quality`, `runtime`, `memory`, `throughput`, `convergence`, `robustness`, `reliability`, `cost`, `energy_proxy`, `explainability`, `reproducibility`

## Promotion outcomes (evidence only)

`BETTER_QUALITY` | `LOWER_COST` | `LOWER_LATENCY` | `BETTER_SCALING` | `BETTER_ROBUSTNESS` | `BETTER_PRIVACY_LOCALITY` | `BETTER_MULTI_OBJECTIVE_TRADEOFF`

Else: `NO_MEASURED_ADVANTAGE` | `RESEARCH_ONLY`

Auto-promote without measured advantage: **DENIED**. Human review required; recommendation ≠ promote.

## Critical rule (tested)

A method need not beat classical baselines on every metric, but XIV must state **exactly what tradeoff improved and what got worse**. Soft-wires EO5 language gate / classical baseline mandate.

## Government proposal rule (tested)

Every optimization claim must be traceable to benchmark evidence. Vague claims such as “quantum-powered efficiency” without test data are **DENIED**.

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `classical-baseline-requirement-types.ts` | Fields, families, metrics, promotion outcomes, locks, soft-wire |
| `classical-baseline-requirement-runtime.ts` | Register / compare / promotion gate / vague-claim deny / cycle |
| `classical-baseline-requirement.ts` | Public facade |
| `phase62leo6.test.ts` | Executed denial + honesty tests |
| `supabase/migrations/20260909180000_62l_eo6_classical_baseline_requirement_candidates.sql` | **NOT_APPLIED** |

## Autonomy / honesty denies (tested)

| Deny | Lock / result |
| --- | --- |
| Auto-promote without measured advantage | `AUTO_PROMOTE_WITHOUT_MEASURED_ADVANTAGE=false` → **DENIED** |
| Promote without classical baseline | → **DENIED** |
| Promote without tradeoff statement | → **DENIED** |
| Vague “quantum-powered efficiency” without data | → **DENIED** |
| Optimization claim without benchmark evidence | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |
| Tip-land / ManagePullRequest | **false** |

## Tests

```bash
cd services/ai && npm run test:62leo6
```

Result: **PASS** — 10/10 executed (`# pass 10` / `# fail 0`)

Covered: SoT / L4 locks / problem fields / baseline families / metrics / promotion outcomes / tradeoff honesty / promotion gate (no auto-promote) / vague “quantum-powered efficiency” deny / soft-wire EO4 WAITING_DATA + EO5/EM9 PRESENT / full comparison cycle.

## Next (do not implement)

**EO7 — Government Logistics Mission Pack** — transportation, warehousing, inventory, maintenance, readiness, routing, procurement, supplier-risk capabilities for public-sector missions.
