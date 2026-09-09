# 62L-EW7 / #169 — AMD Local Communication Adapter Evidence Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — honesty/denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-ew7-amd-local-communication-adapter-4059`  
Base: `cursor/62l-ew6-cross-chip-capability-graph-v2-4059` @ `6098668` (EW6 tip name present; committed EW6 chipgraph modules not yet on tip — soft-wired via `existsSync` park / sibling markers; presence ≠ VERIFIED)  
SoT: **GitHub #169** — Global Operations Brain / 62L-EW Offline Research Mesh family  
Canonical ownership: **Global Operations Brain**  
Track: 62L-EW → EW6 Cross-Chip Capability Graph v2 → **EW7 AMD Local Communication Adapter**  
Next (docs-only): **EW8 — NVIDIA Adapter Candidate** (same envelope / graph / governor / receipts / Home Base)

`DOCUMENTED ≠ DETECTED ≠ SUPPORTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

---

## Honesty banner

- `L4_AUTONOMY_ENABLED=false`
- Independent AMD device truth: `AMD_CPU` / `AMD_GPU` / `AMD_NPU`
- Never infer CPU present ⇒ NPU verified, or Radeon detected ⇒ GPU inference works
- AMD GPU / NPU remain **NOT_TESTED** in this cloud VM — **VERIFIED not fabricated**
- Silent / honest fallback does **not** verify the requested accelerator
- Missing receipt → **UNVERIFIED**
- Software acceleration only (no silicon / BIOS / firmware / clock / voltage / driver replace)
- Never disable thermal protections
- No separate AMD agent system — connects Agent Mesh + Chip Capability Graph
- Guardian / RLS tenant / Universe isolation **unchanged**
- tip-land / PR / prod deploy / prod DB mutate: **NO**

---

## Canonical flow

`Agent Mission → Agent Mesh → Task Envelope → Chip Capability Graph → AMD Adapter → Resource Governor → CPU/GPU/NPU → Execution Receipt → Benchmark/Evidence → XIV Home Base`

---

## Soft-wire (existsSync; presence ≠ VERIFIED; absent → WAITING_DATA not FAIL)

| Target | Soft-wire hop (this environment) |
| --- | --- |
| EW6 chipgraph (`types.ts` / park `.wt-ew6`) | **PASS** (park marker) — presence ≠ VERIFIED |
| Agent Mesh `services/ai/runtime/agentmesh/` | **PASS** |
| HC1 Hybrid Compute Home Base (report / module) | **PASS** (sibling docs / park) |
| HC4 core-compute | **PASS** (sibling park) |
| `local-runtime` | **PASS** (sibling park) |
| `workload-router` | **PASS** (soft-wire/reuse — no competing router) |
| `resource-governor` | **PASS** (soft-wire/reuse — thin `resource-policy` bridge) |

Committed EW6 graph implementation on tip: **WAITING_DATA** relative to sealed tip contents; park soft-wire used. EW7 does not claim EW6 VERIFIED.

---

## Deliverables (`services/ai/runtime/chipgraph/**`)

| File | Role |
| --- | --- |
| `ew7-types.ts` | SoT #169, locks, AMD device truth, soft-wires, software levers |
| `compute-envelope.ts` | Compute request envelope + tenant/universe/expiry/budget/offline validation |
| `compute-receipt.ts` | Execution receipt + Home Base ledger; missing → UNVERIFIED |
| `resource-policy.ts` | Thin governor bridge: ALLOW/QUEUE/THROTTLE/FALLBACK/DENY; thermal lock |
| `amd-adapter.ts` | Shared AMD adapter (Agent Mesh ↔ chip graph ↔ local AMD paths) |
| `index.ts` | Facade + `runAmdLocalCommunicationAdapterCycle` |
| `phase62lew7.test.ts` | Required honesty tests (14) |
| `docs/operations/reports/62L_EW7_AMD_LOCAL_COMMUNICATION_ADAPTER_REPORT.md` | this report |
| `npm run test:62lew7` | package script |

EW7 uses `ew7-types.ts` so it does not collide with EW6’s planned `types.ts` ownership of the shared chipgraph package.

---

## Device truth (independent)

| Device | Default in this VM | Notes |
| --- | --- | --- |
| AMD_CPU | **VERIFIED** (safe baseline after bounded CPU path) | CPU is safe initial route |
| AMD_GPU | **NOT_TESTED** | DETECTED ≠ VERIFIED; fallback ≠ VERIFIED |
| AMD_NPU | **NOT_TESTED** | NOT_TESTED cannot satisfy VERIFIED request |

GPU/NPU become VERIFIED only when: exact device detected, compatible runtime, model loads, inference completes on that device, output valid, evidence receipt stored.

---

## Tests

```bash
cd services/ai && npm run test:62lew7
```

Result: **14/14 PASS**

| # | Requirement | Result |
| --- | --- | --- |
| 1 | AMD CPU eligible when VERIFIED | PASS |
| 2 | AMD GPU DETECTED cannot satisfy VERIFIED (no fallback) | PASS |
| 3 | AMD NPU NOT_TESTED cannot satisfy VERIFIED | PASS |
| 4 | GPU→CPU fallback recorded truthfully | PASS |
| 5 | NPU→CPU fallback recorded truthfully | PASS |
| 6 | expired request denied | PASS |
| 7 | over-budget request denied | PASS |
| 8 | tenant mismatch denied | PASS |
| 9 | Universe mismatch denied | PASS |
| 10 | stale device evidence rejected | PASS |
| 11 | offline local compute where verified | PASS |
| 12 | offline cloud-required → WAITING_DATA | PASS |
| 13 | L4 false | PASS |
| 14 | Guardian/RLS unchanged (locks) + missing receipt UNVERIFIED | PASS |

---

## Hardware / environment honesty

| Claim | Status |
| --- | --- |
| AMD GPU VERIFIED | **NO** / `NOT_TESTED` |
| AMD NPU VERIFIED | **NO** / `NOT_TESTED` |
| CPU safe baseline | Yes (software path) |
| Silicon / BIOS / firmware / overclock | **DENIED** |
| Thermal protections disabled | **NO** |
| Separate AMD agent system | **NO** |
| Production authorization | **NO** |

---

## Next (docs-only)

**EW8 — NVIDIA Adapter Candidate** — reuse the same compute envelope, chip capability graph, resource governor soft-wire, execution receipts, and XIV Home Base return path. Do not invent a separate NVIDIA agent brain.

---

## Blockers

- EW6 committed tip modules not sealed on remote at EW7 start — soft-wired WAITING_DATA / park PRESENT; presence ≠ VERIFIED.
- No real AMD GPU/NPU evidence in this agent VM — VERIFIED correctly withheld.
- GitHub `gh issue view 169` may be unresolved in agent env — founder brief + #169 retained as SoT.
- GitLab MCP may be `needsAuth` — no mirror issue number invented.
- tip-land / PR: **NO** (founder ask required).
