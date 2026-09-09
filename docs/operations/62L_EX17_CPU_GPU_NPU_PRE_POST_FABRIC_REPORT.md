# 62L-EX17 — CPU/GPU/NPU Quantum Pre/Post-Processing Fabric — Operations Report

**Family:** 62L-EX (Global Operations Brain)  
**Parent:** GitHub #170  
**Label:** 62L-EX17  
**Branch:** `cursor/62l-ex17-cpu-gpu-npu-pre-post-fabric-4059`  
**L4_AUTONOMY_ENABLED:** `false`  
**PR:** not opened (founder must ask)

## Checkpoint gate

| Ref | SHA |
|-----|-----|
| LOCAL workspace HEAD | `090e98693998382f22cbe39d47eb0e65f29d0153` |
| GITHUB `origin/xiv-v2` | `60986682f7a6913def6da08499388aecd4acea4a` |
| GITLAB `gitlab/xiv-v2` | `1c82e0c149f15c532d8700f4802a690c2bb7555f` |
| TREE (dirty workspace) | `cd486e256dbbfca590b9dcc27718256bd0f7f28b` |
| EX16 local tip (`cursor/62l-ex16-…-4059`) | `e25c722ea2b9254034aa7bfe3b46c77f722b685a` (descendant of GITHUB xiv-v2; **not pushed** to origin at gate) |
| EX17 base | GITHUB `origin/xiv-v2` @ `60986682` (EX16 tip not on origin → do not soft-base) |
| EX17 feat SHA | `6cf3ca5e90263a6ada76b10679a68a5f1e000278` |
| EX17 tip (this branch) | `a115d0a2a3c100e906ce3061e09ae698f477736c` |

**TREE note:** Workspace `/workspace` was dirty/contested (unrelated GOB local-brain + many `.wt-*` parks). EX17 built in isolated worktree `/tmp/62l-ex17-work`. LOCAL/GITLAB xiv-v2 diverge from GITHUB; authorized EX chain base is GITHUB `origin/xiv-v2`. No stop-on-divergence — sibling EX tips expected under soft-wire; EX17 does not tip-land or merge them.

**Predecessor state:** EX16 validated locally in `/tmp/62l-ex16-work` and soft-wired via `existsSync` (`PRESENT_UNVERIFIED`). EX13–EX15 may still be landing. Presence ≠ VERIFIED; absent → `WAITING_DATA` (not FAIL).

## Mission honesty

- Agents request **COMPUTE CAPABILITIES**; they do **not** seize hardware
- `DETECTED ≠ VERIFIED`; CPU fallback **never** verifies failed accelerator
- Functional with `QPU=UNAVAILABLE` → `WAITING_PROVIDER`
- Power-off → `OFFLINE_STOPPED` + checkpoint; **no** fake continued compute
- Never claim end-to-end purely quantum when major stages are classical
- Software wormholes / COMPUTE_HIGHWAYS never bypass auth / Guardian / tenant / Universe
- Learning cannot modify permissions; no hidden CoT persistence
- XIV_VIRTUAL_CHIP is a software abstraction; cross-chip bridges = shared contract/adapters only
- Does **not** duplicate Agent Mesh / Guardian / Evidence Ledger / Benchmark systems

## Canonical path

Home Base → Agent Mesh → Workload Genome → Problem/Algorithm IR → Hybrid Router → Resource Governor → CPU/GPU/NPU → Simulator/optional QPU → Post-Processing → Benchmark → Evidence → Neural Pathways → Home Base

## Pipeline stages (§1)

`MISSION → INGEST → VALIDATE → PREPROCESS → ENCODE → OPTIMIZE → ROUTE → EXECUTE → DECODE → POSTPROCESS → VERIFY → BENCHMARK → EVIDENCE → LEARN`

## Implementation

| File | Role |
|------|------|
| `services/ai/runtime/compute-fabric/types.ts` | Stages, compute classes, truth ladder, envelope, locks |
| `services/ai/runtime/compute-fabric/soft-wire.ts` | EX1–EX16 / agentmesh / quantum/ir / chipgraph / lifecycle via `existsSync` |
| `services/ai/runtime/compute-fabric/preprocess.ts` | Pre + quantum-preprocess fabric + provenance |
| `services/ai/runtime/compute-fabric/postprocess.ts` | Post-process fabric + provenance |
| `services/ai/runtime/compute-fabric/partitioner.ts` | Actual CPU/GPU/NPU/QPU route recording |
| `services/ai/runtime/compute-fabric/resource-governor.ts` | Memory + simulator resource control |
| `services/ai/runtime/compute-fabric/receipts.ts` | Stage receipts, hybrid timing, evidence, learning |
| `services/ai/runtime/compute-fabric/pipeline.ts` | Routing decisions + CPU safe fallback + offline/power gates |
| `services/ai/runtime/compute-fabric/virtual-chip.ts` | XIV_VIRTUAL_CHIP, highways, wormholes, cross-chip bridges |
| `services/ai/runtime/compute-fabric/meeting.ts` | Structured agent brief; Agent Mesh compute roles |
| `services/ai/runtime/compute-fabric/index.ts` | Barrel |
| `services/ai/runtime/phase62lex17.test.ts` | Required honesty tests (20) |
| `services/ai/package.json` | `test:62lex17` |

## Soft-wire (presence ≠ VERIFIED)

| Probe | Disposition (gate time) |
|-------|-------------------------|
| EX1–EX3, EX6–EX12, EX14–EX16 | `PRESENT_UNVERIFIED` (sibling parks /tmp or `.wt-*`) |
| EX4, EX5, EX13 | `WAITING_DATA` |
| agentmesh, quantum/ir, chipgraph, lifecycle, guardian, benchmark, evidence | `PRESENT_UNVERIFIED` |
| local-runtime (on this xiv-v2 tip) | `WAITING_DATA` |

Absent paths return `WAITING_DATA` — not FAIL. Do not block forever waiting for merge onto `xiv-v2`.

## Tests

Command: `cd services/ai && npm run test:62lex17`

| # | Case | Result |
|---|------|--------|
| 1 | verified CPU route eligibility | PASS |
| 2 | DETECTED GPU cannot satisfy VERIFIED request | PASS |
| 3 | DETECTED NPU cannot satisfy VERIFIED request | PASS |
| 4 | GPU failure → explicit CPU fallback | PASS |
| 5 | NPU failure → explicit CPU fallback | PASS |
| 6 | CPU fallback does not verify accelerator | PASS |
| 7 | memory-over-budget → denied/reduced | PASS |
| 8 | oversized simulator → denied/reduced | PASS |
| 9 | offline local workload eligible | PASS |
| 10 | offline web → WAITING_DATA | PASS |
| 11 | offline QPU → WAITING_PROVIDER | PASS |
| 12 | powered-off → OFFLINE_STOPPED | PASS |
| 13 | pre/execution/post times separate | PASS |
| 14 | failed route creates evidence | PASS |
| 15 | learning cannot modify permissions | PASS |
| 16 | cross-tenant DENIED | PASS |
| 17 | cross-Universe DENIED | PASS |
| 18 | no hidden CoT persistence | PASS |
| 19 | L4 false | PASS |
| 20 | Guardian/RLS unchanged | PASS |

No unrun test reported as PASS. No simulation presented as physical QPU. No fabricated accelerator VERIFIED via CPU fallback.

## Explicit non-claims

- No physical QPU connected, paid, authorized, or verified
- No production deploy, tip-land, merge to main, or PR
- No Guardian/RLS mutation; no permission expansion
- No proprietary chip/QPU internals copied
- No end-to-end purely quantum claim when major stages classical
- No hardware seizure by agents

## Governance locks

`L4_AUTONOMY_ENABLED`, `TIP_LAND`, `PRODUCTION_*`, `MERGE_MAIN`, `MANAGE_PULL_REQUEST`, `DETECTED_EQ_VERIFIED`, `CPU_FALLBACK_VERIFIES_ACCELERATOR`, `AGENTS_SEIZE_HARDWARE`, `FAKE_CONTINUED_COMPUTE_WHEN_POWERED_OFF`, `WORMHOLE_BYPASS_AUTH`, `LEARNING_MODIFIES_PERMISSIONS`, `HIDDEN_COT_PERSISTENCE`, `CROSS_TENANT/UNIVERSE_COMPUTE`, `WEAKEN_GUARDIAN_RLS`, `NPU_WITHOUT_RUNTIME_MODEL_EVIDENCE`, `COPY_PROPRIETARY_CHIP_INTERNALS` — all **false**.

## Next (docs-only)

**EX18 — Quantum Research Wormhole Router**

## Blockers

- EX16 tip exists locally (`e25c722`) and is a safe descendant of GITHUB xiv-v2, but was **not pushed** to `origin` at EX17 gate → EX17 baselined on GITHUB `origin/xiv-v2` and soft-wires EX16 from `/tmp/62l-ex16-work` (`PRESENT_UNVERIFIED`, not VERIFIED).
- EX4/EX5/EX13 soft-wires `WAITING_DATA` (sibling parks incomplete).
- Physical QPU access optional and not configured (by design).
- GitLab MCP issue mirror: needsAuth / not resolved — GitHub #170 remains SoT.
