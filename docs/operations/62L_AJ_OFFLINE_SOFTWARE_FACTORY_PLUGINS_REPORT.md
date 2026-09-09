# 62L-AJ — Offline Software Factory + Governed Plugin Ecosystem + Agent-Generated Applications

Status: IMPLEMENTATION COMPLETE ON CHILD BRANCH — UNIT TESTS EXECUTED — NOT A WINDOWS-NODE VERIFICATION PASS — NOT PRODUCTION AUTHORIZATION — NOT RELEASED

Date: 2026-09-09
Branch: `cursor/62l-aj-offline-software-factory-plugins-4059`
Parent: `cursor/62l-ai-autonomous-research-director-4059` @ `3593c00` (`docs(62L-AI): add Autonomous Research Director operations report #47`)
Grandparent: `cursor/62l-ad-distributed-offline-agent-mesh-4059` @ `a4d8e55`
Implementation SHAs: `4a4dc04` (factory), `89ec619` (AI-tip intake)
Tip-land: **NO**
PR: **NOT CREATED**

## Gate protocol

| Check | Result |
|---|---|
| `gh issue view 48 --comments` | **BLOCKED.** GraphQL unresolved; Issues API 403. Exact GitHub US IDs **not readable**. Stories implemented as `US-AJ1`..`US-AJ30` from founder paste. |
| `docs/operations/62L_AI_AUTONOMOUS_RESEARCH_DIRECTOR_REPORT.md` | **PRESENT** on parent `3593c00`. This child **rebased onto AI** (first AJ slice had been AD-only while AI was WAITING_DATA). |
| `docs/operations/62L_AH_CAUSAL_WORLD_MODEL_DIGITAL_TWINS_REPORT.md` | **MISSING** on the AI parent (AI recorded AH WAITING_DATA). This child **did not merge** unfinished AH. **WAITING_DATA**. |
| 62L-AG / 62L-AF / 62L-AE reports | **MISSING** on this AI/AD lineage. **Not merged.** `WAITING_DATA`. |
| `docs/operations/62L_AD_DISTRIBUTED_OFFLINE_AGENT_MESH_REPORT.md` | **PRESENT** on the AI/AD chain (`a4d8e55`). |
| `docs/operations/62L_AC_OFFLINE_AGENT_RUNTIME_WORKCELLS_REPORT.md` | **PRESENT** on the AD parent chain. |
| 62J Software Factory docs | Present as **QUEUED ARCHITECTURE**. Patterns composed; 62J runtime is **not** claimed implemented. |
| Working tree | Dedicated worktree `/tmp/62l-aj-work`. Rebased `origin/cursor/62l-ai-autonomous-research-director-4059`. Did not edit `/workspace`. Did not merge AE/AH in-flight trees. |
| Gate verdict | **62L-AI CLEAR for this child.** AH/AG/AF **WAITING_DATA**. Not PASS for Windows-node verification. Not FAIL-with-report. |

Honesty: this report does **not** invent PASS for Issues #32–#48. It does **not** invent PASS for Windows-node verification. It does **not** invent “released.” AI discoveries entering the factory remain **SUPPORTED local candidates**, never `VERIFIED_FACT`.

## Operating cycle (executed, not diagram-only)

```
Approved Story / Verified Discovery → Requirements → Architecture → Engineering Workcell → Protected Sandbox → Code → Tests → Security → API/UI Review → Evidence → Plugin Manifest → Registry → Human Release Gate → Candidate Artifact
```

Encoded as `FACTORY_CYCLE` in `services/ai/local-brain/software-factory-types.ts` and walked by `runFactoryCycle`.

**Verified discovery** reuses 62L-AI: `acceptAiVerifiedDiscovery` requires `promoted=true`, `state=SUPPORTED`, `replicated=true`, `verifiedFact=false`. Unreplicated, flag-only, or CEO-sealed inputs are **DENIED**.

**Agent-generated app = build candidate only.** Compile + tests PASS ≠ authorize deployment, publication, production DB changes, new permissions, or customer use.

## US-AJ1 .. US-AJ30

GitHub issue IDs were unreadable (403). Mapping below is the founder-paste order.

| Story | Status | What landed | Honesty |
|---|---|---|---|
| US-AJ1 Protected source sandboxes | **DONE** | Isolation denies `.env` / `../` / `/etc/passwd`; `main` refused. | Local path policy, not a hypervisor. |
| US-AJ2 Agent code generation | **DONE** | Structured patches via `proposeStructuredPatch`. Shell refused. | `productionAuthorized: false`. |
| US-AJ3 Allowlisted build/test runners | **DONE** | Reuses `local-command-runner`. Real `git_status` exit 0. Model-provided shell refused. | Never executes model-provided arbitrary shell. |
| US-AJ4 Test-first acceptance | **DONE** | Empty `testsExpected` refuses code. | Full monorepo runtime suite **NOT_TESTED** for AJ scope. |
| US-AJ5 Security review | **DONE** | Reuses `verifySecurity`. | No Guardian/RLS weaken. |
| US-AJ6 API contracts | **DONE** | Unpublished candidates. Publication denied. | Not an external API. |
| US-AJ7 Mobile candidate profiles | **DONE** | `storePublish: false`. | Not an app-store submission. |
| US-AJ8 Desktop candidate profiles | **DONE** | `installerPublish: false`. | Not an installer release. |
| US-AJ9 Plugin manifests | **DONE** | `production_deploy` requested → denied. | Manifest ≠ published plugin. |
| US-AJ10 Governed plugin registry | **DONE** | `.xiv-local/plugin-registry.json` `registered_candidate`. | Not a public marketplace. |
| US-AJ11 Permission-diff gates | **DONE** | Extra `network` → `PERMISSION_DIFF_DENY`; cycle registry **DENIED**. | `permissionExpansion: false`. |
| US-AJ12 Local plugin runtime sandboxing | **DONE** | Allowlisted commands only. | No plugin network. |
| US-AJ13 Internal tool generation | **DONE** | Allowlisted map only (`curl` refused). | Candidate, not deployed. |
| US-AJ14 Business-app templates | **DONE** | ledger/crm/inventory structured-patch candidates. | Not customer apps. |
| US-AJ15 Connector factories | **DONE** | Unconfigured AWS `UNAVAILABLE`. | No live cloud connector. |
| US-AJ16 Model-adapter factories | **DONE** | Local + Google AI Studio `UNAVAILABLE`. `cloudFallback: false`. | Unconfigured stays UNAVAILABLE. |
| US-AJ17 Migration candidate gates | **DONE** | Apply always `applied: false`. RLS-disable denied. | No migrations applied. |
| US-AJ18 Release-candidate packaging | **DONE** | Compile+tests PASS → `eligible: true`, `released: false`. | RC ≠ released. |
| US-AJ19 Compatibility matrices | **DONE** | Platforms recorded as `candidate`. | Not a release matrix. |
| US-AJ20 Vulnerability quarantine | **DONE** | CRITICAL → quarantine. | Not a production IR platform. |
| US-AJ21 Learning loops | **DONE** | Learning ledger + checkpoint. | `permissionChange: false`. |
| US-AJ22 Offline queue/resume | **DONE** | Crash after `code`; recover 1; resume to candidate. | Not Windows-node crash proof. |
| US-AJ23 Requirements / verified discovery | **DONE** | Context Vault + AI discovery intake. Unapproved / unreplicated / CEO-sealed denied. SUPPORTED discovery may enter and still does not release. | `inventedFacts: false`. |
| US-AJ24 Architecture | **DONE** | Candidate architecture hop. | Not approved authority. |
| US-AJ25 Engineering workcell | **DONE** | Reuses AC `runProtectedCodingWorkcell`. | No duplicate coding agent. |
| US-AJ26 API/UI review | **DONE** | Customer-facing publication refused. | Not a store listing. |
| US-AJ27 Evidence | **DONE** | Evidence ledger `productionAuthorization: false`. | Bundle ≠ release. |
| US-AJ28 Human release gate | **DONE** | `HUMAN_RELEASE_GATE_BLOCKS_DEPLOY` + 62L-AI `gateResearchAction({ deploy: true })` `allowed=false`. Cycle hop **DENIED**. | Human approval in this slice still does not deploy. |
| US-AJ29 Candidate artifact | **DONE** | `eligible=true` after compile/tests; `released=false`. | Compile+tests PASS ≠ released. |
| US-AJ30 Factory cycle + honesty | **DONE** | Health: AI report **PASS**; AH/AG/AF **WAITING_DATA**. Research Director reused; L4=false; no founder impersonation. | Windows-node **NOT_TESTED**. |

## Candidate vs release (required evidence)

Observed in `npm run test:62laj` (exit **0**):

| Case | Result | Evidence class |
|---|---|---|
| Sandbox isolation | `.env` / `../` / `/etc/passwd` refused | **PASS** (unit) |
| Allowlist runner | Real `git_status` exit 0; model shell refused | **PASS** (unit) |
| Permission-diff deny | Extra `network` → registry DENIED | **PASS** (unit) |
| Release-gate blocking deploy | `HUMAN_RELEASE_GATE_BLOCKS_DEPLOY`; AI research authority `allowed=false` | **PASS** (unit) |
| Compile+tests PASS | `eligible=true`, **`released=false`** | **PASS** (unit) — **not released** |
| AI SUPPORTED discovery intake | Factory hop PASS; still `released=false` | **PASS** (unit) |
| Unreplicated / CEO-sealed discovery | DENIED | **PASS** (unit) |
| Invented “released” | Health `released=0` | **PASS** (honesty) |
| 62L-AI predecessor | Report + `research-director.ts` present | **PASS** (files on this tree) |
| 62L-AH / AG / AF | Reports absent | **WAITING_DATA** |
| Windows disconnected-network factory | Not run | **NOT_TESTED** |

`npm run test:62lai` also exit **0** on this child (AI tests still pass after rebase).

## Reuse map (do not duplicate)

| Capability | Reused module | 62L-AJ addition |
|---|---|---|
| Autonomous Research Director (AI) | `research-director.ts`, `research-authority.ts`, `discovery-intelligence.ts` promotion contract | Verified-discovery intake + deploy deny |
| Offline Experiment Factory (AI) | present on parent; **not copied** | Software factory is a separate candidate plane |
| Protected coding / testing / security (AC) | `coding-agent.ts`, `testing-agent.ts`, `security-verifier.ts`, `offline-workcells.ts` | Engineering hops + test-first |
| Sandbox / allowlist | `sandbox-guard.ts`, `local-command-runner.ts` | Isolation writes + model-shell refuse |
| Context Vault / Decision Gate / Evidence / Learning | existing local-brain | Requirements, release gate, evidence, learning |
| Mesh (AD) | present on parent | Not reimplemented |
| 62J docs | queued architecture | MERGE CANDIDATE ≠ release |

## Files

- `services/ai/local-brain/software-factory-types.ts`
- `services/ai/local-brain/software-factory-sandbox.ts`
- `services/ai/local-brain/software-factory-engineering.ts`
- `services/ai/local-brain/software-factory-plugins.ts`
- `services/ai/local-brain/software-factory-candidates.ts`
- `services/ai/local-brain/software-factory-runtime.ts`
- `services/ai/local-brain/software-factory-cli.ts`
- `services/ai/local-brain/phase62laj.test.ts`
- `services/ai/local-brain/README.md`
- `services/ai/package.json` (`test:62laj`, `local:factory`; keeps `test:62lai`)

## Commands and real test exits

Working directory: `/tmp/62l-aj-work/services/ai`

```
$ npx tsc --noEmit
exit 0

$ npm run test:62laj
62L-AJ safety tests PASS
exit 0

$ npm run test:62lai
62L-AI safety tests PASS
exit 0

$ npm run test:local-brain
… 62L-X/Y/AC/AD/AI/AJ safety tests PASS
exit 0

$ git diff --check
exit 0
```

Crash/resume: simulated crash after `code`; recovered 1 job; resume completed through `candidate_artifact`; `released` remained false.

Health on empty store: `jobs=0`, `released=0`, localModel `UNAVAILABLE`, all cloud providers `UNAVAILABLE`, AI predecessor **PASS**, AH/AG/AF **WAITING_DATA**, `windowsNodeVerification=NOT_TESTED`.

## Blockers / not claimed

- GitHub Issue #48 unreadable (403).
- 62L-AH / AG / AF reports missing → `WAITING_DATA`.
- Windows disconnected-network proof **NOT_TESTED**.
- Live local model **UNAVAILABLE**.
- Full `npm run test:runtime` **NOT_TESTED**.
- No plugin published, deployed, or customer-released.
- **NO PR** created.

## Honesty locks

- `L4_AUTONOMY_ENABLED=false`
- `AUTO_PRODUCTION_DEPLOY=false`
- `PRODUCTION_DATABASE_WRITE=false`
- `PRODUCTION_GIT_PUSH=false` (child branch push ≠ production git push)
- `AUTO_PERMISSION_EXPANSION=false`
- `AUTO_DATABASE_MIGRATION=false`
- Unconfigured providers **UNAVAILABLE**
- No founder impersonation; CEO-sealed non-replicating
- No physical infrastructure control
- Agent-generated applications are **build candidates only**
- Compile + tests PASS ≠ released
- No invented PASS
- tip-land = **NO**; never `main`

## Git

- Child of committed 62L-AI tip `3593c00`; **did not merge main**; **did not tip-land xiv-v2**
- First AJ commits were AD-parented while AI was WAITING_DATA; this slice **rebased onto AI**
- Pushed `-u origin cursor/62l-aj-offline-software-factory-plugins-4059` (`--force-with-lease` after rebase)
- **NO PR** (`gh pr create` not invoked)

## NEXT

**62L-AK — Offline Developer Platform + Local App Store + Universe Package Manager + Agent Tool Marketplace**

Do **not** implement 62L-AK in this slice.
