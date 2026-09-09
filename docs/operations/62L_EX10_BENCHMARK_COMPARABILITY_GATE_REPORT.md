# 62L-EX10 — Benchmark Comparability Gate

**Parent:** 62L-EX / Global Operations Brain / GitHub #170  
**Branch:** `cursor/62l-ex10-benchmark-comparability-gate-4059`  
**Feat SHA:** `6d8e6c8fe4f4cfd7a297f371225c2811057ceea8`  
**L4_AUTONOMY_ENABLED:** `false`  
**PR:** none (founder ask required)  
**tip-land / production / merge main:** NO

## Checkpoint gate

| Ref | SHA | Tree |
|-----|-----|------|
| LOCAL `xiv-v2` | `1c82e0c149f15c532d8700f4802a690c2bb7555f` | `c834fc3023092d5fd6174c278b6fe5a9147067a5` |
| GITHUB `origin/xiv-v2` | `60986682f7a6913def6da08499388aecd4acea4a` | `4d5e3c29c1e9b15e135b7c085095fd0306d03af5` |
| GITLAB `gitlab/xiv-v2` | `1c82e0c149f15c532d8700f4802a690c2bb7555f` | `c834fc3023092d5fd6174c278b6fe5a9147067a5` |

- **Authorized EX base:** GitHub `origin/xiv-v2` (`60986682`) — EX4+ child tips share this tip.
- **EX9 tip present:** `cursor/62l-ex9-quantum-workload-genome-4059` @ `60986682` (base; genome implementation soft-wired / WAITING_DATA).
- **EX10 branched from EX9 tip** (equals GH `xiv-v2`).
- LOCAL/GITLAB `xiv-v2` diverge from GITHUB `xiv-v2` (docs tip-land history). EX child work stays on GH tip; no merge of main / tip-land into this branch.
- Predecessor soft-wire: EX1–EX9, Agent Mesh, baselines, hybrid router, simulators, QPU registry/receipts, chipgraph, evidence via `existsSync`. **Presence ≠ VERIFIED.** Absent → **WAITING_DATA**.

## Mission delivered

Canonical flow:

`Experiment A + Experiment B → Benchmark Normalization → Comparability Gate → Difference Classification → Valid Comparison or NOT_COMPARABLE → Evidence Review → Learning Update → XIV Home Base`

No route/algorithm/hardware/simulator/QPU may be declared better unless materially comparable. Gate states never collapse to generic `PASS`.

### States

`COMPARABLE | PARTIALLY_COMPARABLE | NOT_COMPARABLE | INSUFFICIENT_EVIDENCE | STALE_COMPARISON | REVIEW_REQUIRED | DENIED | WAITING_DATA | WAITING_PROVIDER`

### Key behaviors

- Hard mismatches (problem/size/objective/quality/timing scope without normalization) → `NOT_COMPARABLE`
- Timing scopes: `EXECUTION_ONLY | END_TO_END | PROVIDER_REPORTED | LOCAL_MEASURED` — never silently equated
- Quality must pass before speed winners
- Multi-run stats preferred; single lucky run ≠ high-confidence pathway
- Cost: `MEASURED | PROVIDER_REPORTED | ESTIMATED | UNKNOWN` — no precise conclusion MEASURED vs UNKNOWN
- Energy mixed methods → `PARTIALLY_COMPARABLE`; never fabricate efficiency
- Simulator ≠ physical QPU performance; physical QPU needs provider/context evidence (+ `QPU_EXECUTION_ONLY` / `END_TO_END_HYBRID_RUNTIME` when applicable)
- Strong neural updates only for `COMPARABLE` + sufficient evidence; `PARTIAL` = weak; `NOT_COMPARABLE` = no winner-learning
- Contradiction records on conflicting claims; stale → `STALE_COMPARISON`; offline external → `WAITING_DATA`
- Cross-tenant / cross-Universe → `DENIED`
- Guardian/RLS unchanged; L4 false

## Key files

| File | Role |
|------|------|
| `services/ai/runtime/quantum/types.ts` | Request contract, states, locks, experiment sides |
| `services/ai/runtime/quantum/soft-wire.ts` | EX1–EX9 + mesh/chipgraph/evidence soft-wires |
| `services/ai/runtime/quantum/benchmark-normalizer.ts` | Metric normalization + timing honesty |
| `services/ai/runtime/quantum/comparability.ts` | Gate + difference classification + learning |
| `services/ai/runtime/quantum/comparison-receipt.ts` | `BenchmarkComparisonReceipt` |
| `services/ai/runtime/quantum/contradiction.ts` | Contradiction records |
| `services/ai/runtime/quantum/index.ts` | Facade / Home Base cycle |
| `services/ai/runtime/quantum/phase62lex10.test.ts` | 18 required tests |
| `services/ai/package.json` | `test:62lex10` script |

## Tests

```text
npm run test:62lex10
# 18 pass / 0 fail
```

Coverage: identical → COMPARABLE; size/objective/quality/timing mismatches; statistical multi-run; single-run no high-confidence; measured vs unknown cost; simulator≠physical; QPU evidence; stale; contradiction; NOT_COMPARABLE no neural strengthen; cross-tenant/Universe DENIED; offline WAITING_DATA; L4 false; Guardian/RLS unchanged.

## Honesty

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`  
Simulator ≠ physical QPU. Presence ≠ VERIFIED. Soft-wire absences are WAITING_DATA, not fabricated PASS. No quantum advantage / consciousness / superintelligence claims. DB candidates: **NOT_APPLIED**.

## Next (docs-only)

**EX11 — Quantum Evidence Ledger**

## Blockers

- GitLab MCP `needsAuth` — no GitLab issue number invented (`GITLAB_MIRROR_NOTE`).
- EX6–EX9 feature implementations may still be WIP on sibling branches; EX10 soft-wires them (WAITING_DATA when absent).
- LOCAL/GITLAB `xiv-v2` ≠ GITHUB `xiv-v2` — intentional non-merge for this child branch.
