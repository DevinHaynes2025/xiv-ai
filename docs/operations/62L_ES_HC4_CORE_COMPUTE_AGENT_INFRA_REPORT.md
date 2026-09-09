# 62L-ES-HC4 / #166 — Core Compute / Agent Infrastructure Evidence Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-es-hc4-amd-software-acceleration-layer-4059`  
Tip SHA (feat): `e3e4d2637db6be0769cc0f18a0d908e969ab28b5`  
Base: `cursor/62l-es-hc3-cross-vendor-chip-path-graph-4059` @ `f6c3bce` (HC3 tip PRESENT)  
SoT: **GitHub #166** — *Core Compute / Agent Infrastructure* (HC4 AMD Software Acceleration Layer)  
Canonical ownership: **Global Operations Brain**  
Track: 62L-ES-HC Hybrid Compute Superbrain family (#164 HC1/HC2 → #165 HC3 → **#166 HC4**)  
Note: `gh issue view 166` unresolved in this agent environment (403/404); founder brief + #166 retained as SoT.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Truth ladder (no skip): `DOCUMENTED → DETECTED → SUPPORTED → VERIFIED`
- Acceleration = software intelligence only (scheduling / batching / caching / quantization / model-selection / fallback) — **≠** silicon / BIOS / firmware / overclock / driver privilege escalation
- AMD GPU / NPU remain **NOT_TESTED** / verification **NO** unless fresh bounded-inference evidence exists — **not fabricated**
- CPU fallback **≠** claimed GPU/NPU `VERIFIED`
- Unverified AMD GPU path **cannot** be preferred as `VERIFIED`
- No auto cloud purchase; no cross-tenant pooling; Guardian/RLS tenant/Universe isolation unchanged
- Home Base receipt **required** for every branch execution
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Global Operations Brain ownership (mandatory taxonomy)

| Role | Binding |
| --- | --- |
| Canonical home | **Global Operations Brain** (agents, Home Base, CPU/GPU/NPU, hybrid cloud, orchestration, neural pathways, security, compute graph) |
| This story | Global Ops Brain → **#166** Core Compute / Agent Infrastructure (HC4 AMD Software Acceleration Layer) |
| Enterprise OS | **Depends on #166** — enterprise-specific usage only; **no** parallel enterprise brain |
| Engineering civilization | Long-range R&D — **not** this story’s primary home |
| Mobile / product | UI/onboarding/consumer — **not** this story |

Lock encoded: `GLOBAL_OPERATIONS_BRAIN_IS_CANONICAL_HOME=true`, `ENTERPRISE_OS_MAY_BUILD_PARALLEL_BRAIN=false`, `ENTERPRISE_OS_DEPENDS_ON_166_ONLY=true`, `ALLOW_FRAGMENT_AMD_ENTERPRISE_MOBILE_GOVERNMENT_BRAINS=false`.

## Enterprise OS depends-on (short — no duplicate story)

Enterprise OS may **reference / depend on** #166 for enterprise-specific compute/agent usage. It must **not** copy the full Core Compute story into a second enterprise-only brain, and must not fragment AMD / mobile / government brains. Next (docs only): Enterprise OS consumer of #166 (depends-on / reference only).

## Soft-wire (presence ≠ VERIFIED; absent → WAITING_DATA not FAIL)

| Target | Soft-wire on HC3 tip |
| --- | --- |
| HC1 Hybrid Compute Home Base + report | **PRESENT** |
| HC2 Chip Bottleneck Analyzer + report | **PRESENT** |
| HC3 `services/ai/compute-graph/*` + report | **PRESENT** |
| Global Operations Brain (park `.wt-dh-final/…` or `services/ai/local-brain/…`) | **PRESENT** (park) |

## Deliverables (`services/ai/core-compute/**`)

| File | Role |
| --- | --- |
| `types.ts` | SoT #166, locks, truth ladder, soft-wire, GOB taxonomy |
| `amd-acceleration.ts` | AMD-first software acceleration plans (evidence-gated) |
| `cpu-gpu-npu-router.ts` | CPU/GPU/NPU routing; fallback honesty |
| `message-bus.ts` | Agent/task orchestration bus; tenant isolation |
| `task-graph.ts` | Budgets, scopes, return paths; receipt-gated exec |
| `home-base-receipts.ts` | Home Base receipt ledger per branch |
| `index.ts` | Public facade + `runCoreComputeAgentInfraCycle` |
| `phase62leshc4.test.ts` | Denial + honesty tests (8) |
| `docs/operations/62L_ES_HC4_CORE_COMPUTE_AGENT_INFRA_REPORT.md` | this evidence report |
| `npm run test:62leshc4` / `test:62lgob166` | package scripts |

Track collision: distinct from productization ES4 (`test:62les4`) — HC4 uses `core-compute` / `phase62leshc4` / `test:62leshc4`.

## Autonomy / boundary denies (tested)

| Deny | Result |
| --- | --- |
| DOCUMENTED→VERIFIED ladder skip | **DENIED** |
| Unverified AMD GPU preferred as VERIFIED | **DENIED** / **NOT_TESTED** |
| Fabricated AMD GPU VERIFIED at register | demoted to **NOT_TESTED** |
| Branch exec without Home Base receipt | **DENIED** |
| Fallback claiming accelerator VERIFIED on receipt | **DENIED** |
| Cross-tenant message bus / task graph | **DENIED** |
| Parallel Enterprise / AMD / mobile / government brain | **DENIED** (GOB canonical) |
| Silicon / BIOS / firmware / overclock claim | **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62leshc4
# alias: npm run test:62lgob166
```

Result: **8/8 PASS** (truth ladder; unverified AMD; bus/graph/receipt; tenant isolation; no parallel enterprise brain; L4 + AMD honesty + soft-wires).

## Findings returnable to Global Operations Brain

- HC4/#166 core-compute modules landed on child branch only.
- Soft-wires to HC1–HC3 + GOB park recorded as PRESENT (presence ≠ VERIFIED).
- AMD GPU/NPU verification honesty: **NOT_TESTED** in this environment.
- Enterprise OS consumer remains next docs-only depends-on story — no second brain created.

## Blockers

- GitHub `gh issue view 166` unresolved (403/404) — founder brief used as SoT.
- GitLab MCP `needsAuth` — no mirror issue number invented.
- No real AMD GPU/NPU node evidence in this agent VM — VERIFIED correctly withheld.
- Global Operations Brain module still park-path soft-wire (not yet landed under `services/ai/local-brain/` on tip) — findings returnable when present; not FAIL.
