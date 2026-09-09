# 62L-EX8 — Offline Quantum Agent Team

**Parent:** 62L-EX / Global Operations Brain / GitHub **#170**  
**Branch:** `cursor/62l-ex8-offline-quantum-agent-team-4059`  
**Status:** IMPLEMENTED (unit-tested) ≠ VERIFIED ≠ PRODUCTION AUTHORIZED  
**L4_AUTONOMY_ENABLED:** `false`  
**PR:** none (founder ask required)  
**tip-land / main merge / force-push / prod deploy:** NO

## Checkpoint gate

| Ref | SHA |
|-----|-----|
| Feat SHA | `a2330f3a35b9c79b67abb69e1a8caea9f40d5a14` |
| Branch tip | see `git rev-parse HEAD` on `cursor/62l-ex8-offline-quantum-agent-team-4059` after push |
| GITHUB `origin/xiv-v2` | `60986682f7a6913def6da08499388aecd4acea4a` |
| GITLAB `gitlab/xiv-v2` | `1c82e0c149f15c532d8700f4802a690c2bb7555f` (lags GitHub; no invented GitLab issue #) |
| EX7 tip `cursor/62l-ex7-hybrid-classical-quantum-router-4059` | `6e400afdb2cfed75c1c0c297632b7fec1607af13` |
| TREE (base) | EX7 tip (rebased after EX7 landed mid-run; initially EX7 absent → xiv-v2) |

| LOCAL / GITHUB / GITLAB / TREE |
|---|
| LOCAL child branch off EX7 tip; GITHUB `xiv-v2` authorized base ancestor; GITLAB lags; TREE = `/workspace/.wt-ex8` |

Base = **EX7 tip** (hybrid router co-located). Soft-wires via `existsSync`; presence ≠ VERIFIED; absent → `WAITING_DATA`.

### Predecessor soft-wire

| Hop | Disposition |
|-----|-------------|
| Agent Mesh | PRESENT_UNVERIFIED |
| Agent Meetings | PRESENT_UNVERIFIED |
| agents.ts | PRESENT_UNVERIFIED |
| EX1 Quantum Mission | PRESENT_UNVERIFIED (sibling `.wt-ex1`) |
| EX2 Classical Baseline | PRESENT_UNVERIFIED (sibling `.wt-ex2`) |
| EX3 QI Lab | WAITING_DATA |
| EX4 Simulator Registry | WAITING_DATA |
| EX5 QPU Registry | WAITING_DATA |
| EX6 Physical Receipt | PRESENT_UNVERIFIED (sibling `.wt-ex6` types) |
| EX7 Hybrid Router | PRESENT_UNVERIFIED (on tip) |
| Chipgraph | PRESENT_UNVERIFIED (sibling `.wt-ew6`) |
| Benchmarks | PRESENT_UNVERIFIED (sibling EX2) |
| Evidence | PRESENT_UNVERIFIED (sibling EX1 receipts) |
| Guardian | PRESENT_UNVERIFIED (unchanged) |
| XIV_AGENT_DNA_MANIFEST | PRESENT_UNVERIFIED (EX8 ships) |

## Mission

Offline Quantum Agent Team on **one Agent Mesh** — not a second agent framework.

Canonical flow:

`Founder/User Mission → Home Base → Mission Planner → Quantum Agent Team → Child Tasks → Local Compute (Hybrid Router only) → Results/Evidence → Agent Review Meeting → Consensus/Disagreement Record → Home Base → Neural Pathway Update`

## Implementation

Under `services/ai/runtime/quantum/` (co-located with EX7 hybrid router; named EX8 exports avoid symbol clashes):

| File | Role |
|------|------|
| `agent-team-types.ts` | EX8 contracts, roles, states, locks, soft-wire snapshot |
| `agent-team.ts` | Register/heartbeat/states, child spawn denials, messaging, learning gate, Hybrid Router-only compute |
| `team-planner.ts` | Mission decomposition → children (tenant/Universe inherit; no orphans) |
| `team-meeting.ts` | Structured meetings; no hidden CoT; disagreement preserved; policy overrides consensus |
| `team-receipt.ts` | Branch returns to Home Base; failed experiments retained in evidence; neural pathway learning |
| `XIV_AGENT_DNA_MANIFEST.json` | Portable DNA manifest for team contract |
| `phase62lex8.test.ts` | Required denial/honesty tests |
| `index.ts` | EX7 + EX8 barrel (named EX8 exports) |

Also: `services/ai/package.json` → `test:62lex8`; soft re-exports from `runtime/index.ts`.

### Roles (logical, one mesh)

QuantumMissionAgent, ProblemFormulationAgent, ClassicalBaselineAgent, QuantumInspiredResearchAgent, CircuitDesignAgent, SimulationAgent, HybridRoutingAgent, ComputeEvidenceAgent, BenchmarkAgent, CostAgent, PrivacyPolicyAgent, HistoricalResearchAgent, ReviewerAgent.

### Honesty locks

- No second agent framework; no hidden CoT persistence.
- Child permissions/tools/data/execution/budget ≤ parent; expansions → DENIED.
- Cross-tenant / cross-Universe messages → DENIED.
- RUNNING_VERIFIED requires active heartbeat; powered-off → OFFLINE_STOPPED; expired → EXPIRED.
- Web offline + external data → WAITING_DATA; physical QPU offline → WAITING_PROVIDER.
- Compute via Hybrid Router only — no direct arbitrary hardware; no automatic LAN enrollment; no autonomous cloud/QPU purchase.
- LEARNING never changes permissions / Guardian / RLS / financial / production authority.
- Simulator ≠ physical QPU; no unsupported quantum advantage; no consciousness/superintelligence as verified.
- Guardian + RLS migrations unchanged. DB candidates: `NOT_APPLIED`.

## Tests (`npm run test:62lex8`)

| # | Case | Result |
|---|------|--------|
| 1 | child preserves tenant | PASS |
| 2 | child preserves Universe | PASS |
| 3 | permission expansion → DENIED | PASS |
| 4 | compute-budget expansion → DENIED | PASS |
| 5 | expired agent stopped | PASS |
| 6 | missing heartbeat → not RUNNING_VERIFIED | PASS |
| 7 | powered-off → OFFLINE_STOPPED | PASS |
| 8 | web offline → WAITING_DATA | PASS |
| 9 | physical QPU offline → WAITING_PROVIDER | PASS |
| 10 | conflicting agents → disagreement preserved | PASS |
| 11 | meeting no hidden CoT | PASS |
| 12 | branch result returns to Home Base | PASS |
| 13 | failed experiment remains in evidence | PASS |
| 14 | learning cannot change permissions | PASS |
| 15 | cross-tenant message → DENIED | PASS |
| 16 | cross-Universe message → DENIED | PASS |
| 17 | L4 false | PASS |
| 18 | Guardian/RLS unchanged | PASS |

**Summary:** 20/20 pass (includes SoT/soft-wire extras). EX7 suite also re-run: 20/20 pass (no regression).

## Next (docs-only)

**EX9 — Quantum Workload Genome**

## Blockers / honesty

- EX3 / EX4 / EX5 modules not on tip → soft-wire `WAITING_DATA` (not FAIL).
- GitLab MCP `needsAuth` — no GitLab issue number invented.
- DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
- No PR opened. No tip-land. No production deploy. No production DB mutation.
