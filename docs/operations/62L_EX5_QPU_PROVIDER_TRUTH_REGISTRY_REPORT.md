# 62L-EX5 — QPU Provider Truth Registry — Operations Report

**Family:** 62L-EX (Global Operations Brain)  
**Parent:** GitHub #170  
**Label:** 62L-EX5  
**Branch:** `cursor/62l-ex5-qpu-provider-truth-registry-4059`  
**L4_AUTONOMY_ENABLED:** `false`  
**PR:** not opened (founder must ask)

## Checkpoint gate

| Ref | SHA |
|-----|-----|
| LOCAL `xiv-v2` | `1c82e0c149f15c532d8700f4802a690c2bb7555f` |
| GITHUB `origin/xiv-v2` | `60986682f7a6913def6da08499388aecd4acea4a` |
| GITLAB `gitlab/xiv-v2` | `1c82e0c149f15c532d8700f4802a690c2bb7555f` |
| EX4 tip (`cursor/62l-ex4-local-quantum-simulator-registry-4059`) | `60986682f7a6913def6da08499388aecd4acea4a` |
| EX1 / EX2 / EX3 tips | `60986682f7a6913def6da08499388aecd4acea4a` (aligned) |
| EX5 base | EX4 tip = GITHUB `origin/xiv-v2` |

**TREE note:** Workspace `/workspace` was dirty on an unrelated GOB branch at gate time; EX5 was built in an isolated worktree from the EX4 tip. LOCAL/GITLAB xiv-v2 diverge from GITHUB; authorized EX chain base is GITHUB `origin/xiv-v2`. Predecessor EX1–EX4 tips were identical — no stop-on-divergence.

## Mission honesty

- DOCUMENTED ≠ VERIFIED
- AUTHORIZED ≠ QPU VERIFIED
- API-visible ≠ successful physical execution
- Mocked registry success ≠ physical verification
- Physical execution alone ≠ quantum advantage
- Presence ≠ VERIFIED; soft-wire absent → WAITING_DATA
- Default with no QPU configured: provider `NOT_CONFIGURED`, backend `NOT_TESTED`
- Credentials by reference only — never raw secrets in logs/receipts/KG/agent memory/Git
- No autonomous QPU/cloud purchase; external spend → `HUMAN_APPROVAL_REQUIRED`
- Simulators → `SIMULATED_QUANTUM` only; never `PHYSICAL_QPU_VERIFIED`
- Never infer physical from brand
- Not a second orchestration framework (extends `services/ai/runtime/quantum/`)

## Canonical path

Quantum Mission → Classical Baseline → QPU Requirement → **Provider Truth Registry** → Authorization Gate → Backend Capability Gate → Privacy/Cost Gate → Job Candidate → Human Authorization where required → Physical QPU → Execution Receipt → Comparison → Evidence Review → XIV Home Base

## Implementation

| File | Role |
|------|------|
| `services/ai/runtime/quantum/qpu-types.ts` | Provider/backend states, locks, job request, honesty constants |
| `services/ai/runtime/quantum/qpu-soft-wire.ts` | EX1–EX4 / Agent Mesh / chipgraph / evidence / benchmark via `existsSync` |
| `services/ai/runtime/quantum/qpu-provider.ts` | Provider records, credential refs, authorize/revoke |
| `services/ai/runtime/quantum/qpu-registry.ts` | Truth registry, backend freshness, DOCUMENTED≠VERIFIED |
| `services/ai/runtime/quantum/qpu-cost-policy.ts` | Cost governor; no autonomous purchase |
| `services/ai/runtime/quantum/qpu-job.ts` | Pre-submit auth/capability/privacy/cost/offline gates |
| `services/ai/runtime/quantum/qpu-receipt.ts` | Physical receipt + advantage separation |
| `services/ai/runtime/quantum/qpu-router.ts` | Multi-provider routing; no auto-submit on approval |
| `services/ai/runtime/quantum/providers/index.ts` | Isolated stub adapters (no embedded credentials) |
| `services/ai/runtime/quantum/index.ts` | Barrel |
| `services/ai/runtime/phase62lex5.test.ts` | Required honesty tests |
| `services/ai/package.json` | `test:62lex5` |

**Candidates seeded (unconnected until evidence):**  
`IBM_QUANTUM_CANDIDATE`, `AWS_BRAKET_CANDIDATE`, `AZURE_QUANTUM_CANDIDATE`, `GOOGLE_QUANTUM_CANDIDATE`, `OTHER_AUTHORIZED_QPU_PROVIDER`

## Soft-wire (presence ≠ VERIFIED)

Probes: Agent Mesh, EX1 mission, EX2 baseline, EX3 algorithm lab, EX4 simulator registry, chipgraph, evidence/receipts, benchmark, Guardian.  
Absent paths return `WAITING_DATA` — not FAIL. Sibling worktrees (`.wt-ex1` … `/tmp/62l-ex4-work`) are probed when local files are not yet merged.

## Tests

Command: `cd services/ai && npm run test:62lex5`

| # | Case | Result |
|---|------|--------|
| 1 | unconfigured provider → NOT_CONFIGURED | PASS |
| 2 | documented backend cannot satisfy VERIFIED | PASS |
| 3 | simulator backend → SIMULATED_QUANTUM | PASS |
| 4 | simulator never PHYSICAL_QPU_VERIFIED | PASS |
| 5 | unauthorized physical provider → DENIED | PASS |
| 6 | expired mission → DENIED | PASS |
| 7 | budget exceeded → DENIED | PASS |
| 8 | payment-required → HUMAN_APPROVAL_REQUIRED | PASS |
| 9 | region mismatch → DENIED | PASS |
| 10 | privacy/data-class mismatch → DENIED | PASS |
| 11 | offline QPU → WAITING_PROVIDER | PASS |
| 12 | stale backend excluded from fresh VERIFIED route | PASS |
| 13 | successful mocked registry flow ≠ physical verification | PASS |
| 14 | PHYSICAL_QPU_VERIFIED requires real job receipt | PASS |
| 15 | physical execution alone cannot claim quantum advantage | PASS |
| 16 | cross-tenant DENIED | PASS |
| 17 | cross-Universe DENIED | PASS |
| 18 | L4 false | PASS |
| 19 | Guardian/RLS unchanged (tree hash stable; neural lesson cannot weaken) | PASS |

No mocked test was reported as real physical QPU evidence. No unrun test reported as PASS.

## Explicit non-claims

- No physical QPU connected, paid, authorized, or verified in this phase
- No production deploy, tip-land, merge to main, or PR
- No Guardian/RLS mutation; no permission expansion
- No consciousness / superintelligence engineering claims
- No unsupported quantum advantage claims

## Next (docs-only)

1. **EX6 — Physical QPU Execution Receipt**
2. **EX7 — Hybrid Classical/Quantum Router**

## Blockers

- EX1–EX4 implementation tips were present as worktrees but not yet committed onto shared remote branches at EX5 start; EX5 soft-wires them via `existsSync` and remains useful with `NOT_CONFIGURED` / `NOT_TESTED` defaults.
- Physical QPU access is optional and not configured (by design).
- GitLab MCP issue mirror: needsAuth / not resolved — GitHub #170 remains SoT.
