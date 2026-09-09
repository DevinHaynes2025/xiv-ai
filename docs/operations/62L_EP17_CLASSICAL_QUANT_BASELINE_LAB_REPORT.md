# 62L-EP17 — Classical Quant Baseline Lab Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-ep17-classical-quant-baseline-lab-4059`  
Tip SHA: *(aligned on commit)*  
Base: `cursor/62l-ep16-no-overclock-bios-rule-4059` @ `39d54b73bf83695789881878967317d06b8f9bc8`  
Predecessor: EP16 **PRESENT**  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP17 Classical Quant Baseline Lab*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Flow: Problem → Classical Baselines → Candidate Method → Same Data/Test Conditions → Compare → Promote / Reject
- **No unrun benchmark is a PASS**
- Classical baselines are mandatory before advanced / quantum-inspired candidates
- Tradeoffs must be stated explicitly (e.g. better latency, higher cost)
- No “quantum advantage” / “quantum-powered efficiency” language unless evidence supports it
- This lab is **mandatory** for quantum-inspired work
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Promotion states

`BASELINE_ONLY` | `NO_MEASURED_ADVANTAGE` | `TRADEOFF_IMPROVEMENT` | `IMPROVED_CANDIDATE` | `VERIFIED_CANDIDATE` | `RESEARCH_ONLY`

## Classical baseline families

`greedy_heuristics` | `priority_queues` | `weighted_scoring` | `linear_programming` | `mixed_integer_programming` | `constraint_programming` | `graph_algorithms` | `dynamic_programming` | `monte_carlo` | `statistical_forecasting` | `classical_ml` | `metaheuristics` (e.g. simulated annealing, genetic algorithms)

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP16 tip |
| --- | --- |
| EP16 No Overclock / BIOS Rule + report | **PRESENT** |
| EP15 Algorithm Tuning Sandbox + report | **PRESENT** |
| EP14 Adaptive Benchmark Ledger + report | **PRESENT** |
| EP12 Hardware-Neutral Scheduler + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `classical-quant-baseline-lab-types.ts` | families, states, locks, soft-wire |
| `classical-quant-baseline-lab-runtime.ts` | experiment/compare/review/deny + cycle |
| `classical-quant-baseline-lab.ts` | public facade |
| `phase62lep17.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP17_CLASSICAL_QUANT_BASELINE_LAB_REPORT.md` | this report |

## Autonomy / integrity denies (tested)

| Deny | Result |
| --- | --- |
| Unrun benchmark as PASS | → **DENIED** |
| Skip classical baselines | → **DENIED** |
| Compare unlike data/conditions | → **DENIED** |
| Hide tradeoffs | → **DENIED** |
| Quantum advantage / powered-efficiency without evidence | → **DENIED** |
| Skip this lab for quantum-inspired | → **DENIED** |
| Auto-promote to production | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep17
```

| Command | Result |
| --- | --- |
| `npm run test:62lep17` | **PASS** — unrun≠PASS; same conditions; tradeoffs; quantum gates; soft-wires PRESENT |

## Next (report only — do not implement)

**EP18 — Quantum-Inspired Compute Lab** — test quantum-inspired scheduling, routing, graph search, assignment, and optimization against these classical baselines.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
