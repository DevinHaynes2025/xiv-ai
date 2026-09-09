# 62L-AJ — Offline Software Factory + Governed Plugin Ecosystem + Agent-Generated Applications

Status: IMPLEMENTATION COMPLETE ON CHILD BRANCH — UNIT TESTS EXECUTED — NOT A WINDOWS-NODE VERIFICATION PASS — NOT PRODUCTION AUTHORIZATION — NOT RELEASED

Date: 2026-09-09
Branch: `cursor/62l-aj-offline-software-factory-plugins-4059`
Parent: `cursor/62l-ad-distributed-offline-agent-mesh-4059` @ `a4d8e55` (`docs(62L-AD): add distributed offline agent mesh operations report`)
Implementation SHA: `28888ef` (`feat(62L-AJ): add offline software factory and governed plugin ecosystem #48`)
Tip-land: **NO**
PR: **NOT CREATED**

## Gate protocol

| Check | Result |
|---|---|
| `gh issue view 48 --comments` | **BLOCKED.** GraphQL: issue number 48 could not be resolved. REST/GitHub Issues API → HTTP 403 `Resource not accessible by integration`. Exact GitHub US IDs were **not readable**. Stories were implemented in founder-paste order as `US-AJ1`..`US-AJ30`. |
| `docs/operations/62L_AI_AUTONOMOUS_RESEARCH_DIRECTOR_REPORT.md` (Issue #47 / 62L-AI) | **MISSING** after polling remotes with backoff. Recorded `WAITING_DATA`. This child **did not merge** a missing AI tree. |
| 62L-AH Causal World Model report | **MISSING.** `WAITING_DATA`. |
| 62L-AG Persistent Offline Agent Society report | Local AG branch existed at the AC tip without an operations report and was **not on origin**. **Not merged.** `WAITING_DATA`. |
| 62L-AF Universe Kernel report | **MISSING.** `WAITING_DATA`. |
| `docs/operations/62L_AD_DISTRIBUTED_OFFLINE_AGENT_MESH_REPORT.md` | **PRESENT** on the parent tip (`a4d8e55`). Used as the latest completed predecessor with a report (AH→AG→… fallback). |
| `docs/operations/62L_AC_OFFLINE_AGENT_RUNTIME_WORKCELLS_REPORT.md` | **PRESENT** on the AD parent chain (`034d416`). |
| 62J Software Factory docs | Present as **QUEUED ARCHITECTURE** (`docs/architecture/xiv-2i-ai-62j-self-improvement-lab-governed-software-factory.md`). Patterns composed; 62J runtime is **not** claimed implemented. |
| Working tree | Dedicated worktree `/tmp/62l-aj-work` from `origin/cursor/62l-ad-distributed-offline-agent-mesh-4059`. `/workspace` was detached and had unrelated dirty files; this child did not edit `/workspace`. Did not merge AE (different lineage, no AJ operations report). |
| Gate verdict | **62L-AD CLEAR for this child.** 62L-AI/AH/AG/AF **WAITING_DATA**. Not PASS for Windows-node verification. Not FAIL-with-report. |

Honesty: this report does **not** invent PASS for Issues #32–#48. It does **not** invent PASS for Windows-node verification. It does **not** invent “released.”

## Operating cycle (executed, not diagram-only)

```
Approved Story / Verified Discovery → Requirements → Architecture → Engineering Workcell → Protected Sandbox → Code → Tests → Security → API/UI Review → Evidence → Plugin Manifest → Registry → Human Release Gate → Candidate Artifact
```

Encoded as `FACTORY_CYCLE` in `services/ai/local-brain/software-factory-types.ts` and walked by `runFactoryCycle`. Tests proved every hop ran, including crash after `code` and resume through `candidate_artifact`.

**Agent-generated app = build candidate only.** Compile + tests PASS ≠ authorize deployment, publication, production DB changes, new permissions, or customer use.

## US-AJ1 .. US-AJ30

GitHub issue IDs were unreadable (403). Mapping below is the founder-paste order. Confirm against founder paste of Issue #48 when the API is readable.

| Story | Status | What landed | Honesty |
|---|---|---|---|
| US-AJ1 Protected source sandboxes | **DONE** | `openProtectedSourceSandbox` + `evaluateSandboxIsolation` wrap `sandbox-guard`. Writes to `.env`, `../`, `/etc/passwd` refused; in-root candidate write allowed. `main` refused. | Isolation is local filesystem + path policy, not a hypervisor. |
| US-AJ2 Agent code generation | **DONE** | `generateAgentCode` reuses `proposeStructuredPatch`. Shell proposals refused. | Structured patches only. `productionAuthorized: false`. |
| US-AJ3 Allowlisted build/test runners | **DONE** | `runFactoryAllowlistedCommand` reuses `local-command-runner`. Real `git_status` exit 0. `rm -rf /` and model-provided shell refused. | Never executes model-provided arbitrary shell. |
| US-AJ4 Test-first acceptance | **DONE** | Empty `testsExpected` refuses code. Allowlisted `git_status` acceptance ran with exit 0. | Full monorepo `npm test` is **not** claimed as an AJ acceptance run beyond `test:62laj` / `test:local-brain`. |
| US-AJ5 Security review | **DONE** | Cycle hop reuses `verifySecurity` / production-lock scan. | No Guardian/RLS weaken. |
| US-AJ6 API contracts | **DONE** | `reviewApiContract`. `publish` / production endpoint → denied. `published: false`. | Not an external API. |
| US-AJ7 Mobile candidate profiles | **DONE** | `mobileCandidateProfile`. `storePublish: false`, `customerUseAuthorized: false`. | Not an app-store submission. |
| US-AJ8 Desktop candidate profiles | **DONE** | `desktopCandidateProfile`. `installerPublish: false`. | Not an installer release. |
| US-AJ9 Plugin manifests | **DONE** | `parsePluginManifest`. `production_deploy` requested → denied. `sandboxOnly: true`. | Manifest ≠ installed production plugin. |
| US-AJ10 Governed plugin registry | **DONE** | Durable `.xiv-local/plugin-registry.json`. Status `registered_candidate`. | Not a public marketplace. |
| US-AJ11 Permission-diff gates | **DONE** | `permissionDiffGate` + registry insert. Requesting `network` beyond granted → `PERMISSION_DIFF_DENY`. Full cycle registry hop **DENIED**. | `permissionExpansion: false`. |
| US-AJ12 Local plugin runtime sandboxing | **DONE** | `executePluginInSandbox` only allowlisted commands. Model-provided shell refused. | No plugin network. |
| US-AJ13 Internal tool generation | **DONE** | Maps to allowlisted commands only (`npm_typecheck` accepted; `curl` refused). | Generated tool is a candidate, not deployed. |
| US-AJ14 Business-app templates | **DONE** | `crm` / `ledger` / `inventory` templates as structured-patch candidates. | Not customer apps. |
| US-AJ15 Connector factories | **DONE** | `createConnectorCandidate`. Unconfigured AWS → `UNAVAILABLE`. | No live cloud connector. |
| US-AJ16 Model-adapter factories | **DONE** | `createModelAdapter`. Observed local + Google AI Studio `UNAVAILABLE`. `cloudFallback: false`. | Unconfigured providers stay UNAVAILABLE. |
| US-AJ17 Migration candidate gates | **DONE** | `proposeMigrationCandidate` / `applyMigrationCandidate`. RLS-disable denied. Apply always `applied: false`. | No migrations applied. |
| US-AJ18 Release-candidate packaging | **DONE** | `packageReleaseCandidate`. Compile+tests PASS → `eligible: true`, `released: false`, `deployBlocked: true`. | RC ≠ released. |
| US-AJ19 Compatibility matrices | **DONE** | Mobile/desktop recorded as `candidate`, not released. | Incompatible matrices cannot package as eligible. |
| US-AJ20 Vulnerability quarantine | **DONE** | CRITICAL findings → `VULNERABILITY_QUARANTINE`. | Quarantine ≠ production incident response platform. |
| US-AJ21 Learning loops | **DONE** | Cycle writes `appendLearning` (`permissionChange: false`, `productionChange: false`) plus `LocalCheckpointStore`. | Does not expand permissions. |
| US-AJ22 Offline queue/resume | **DONE** | `enqueueFactoryStory` + `FactorySimulatedCrash` after `code`; recover 1 job; resume completed remaining hops. | Test evidence, not a Windows-node crash proof. |
| US-AJ23 Requirements | **DONE** | `deriveRequirements` + Context Vault. Unapproved stories `denied` before the cycle. | `inventedFacts: false`. |
| US-AJ24 Architecture | **DONE** | `recordArchitecture` hop. `productionAuthorization: false`. | Architecture note ≠ approved authority. |
| US-AJ25 Engineering workcell | **DONE** | Reuses 62L-AC `runProtectedCodingWorkcell`. | No duplicate coding agent. |
| US-AJ26 API/UI review | **DONE** | Unpublished API + UI review. Customer-facing publication refused. | Not a store listing. |
| US-AJ27 Evidence | **DONE** | Evidence ledger event `productionAuthorization: false`. | Bundle ≠ release. |
| US-AJ28 Human release gate | **DONE** | `humanReleaseGate({ deploy: true })` → `HUMAN_RELEASE_GATE_BLOCKS_DEPLOY`. Cycle hop state **DENIED**. Decision Gate also refuses production/publication. | Human approval in this slice still does not deploy. |
| US-AJ29 Candidate artifact | **DONE** | Eligible candidate after compile/tests; `released: false`, `published: false`, `productionDeployed: false`, `customerUseAuthorized: false`. | Compile+tests PASS ≠ released. |
| US-AJ30 Factory cycle + honesty locks | **DONE** | `FACTORY_HONESTY` + health CLI. L4=false. No founder impersonation. CEO-sealed non-replicating. No physical infra control. Unconfigured providers UNAVAILABLE. | Windows-node verification `NOT_TESTED`. |

## Candidate vs release (required evidence)

Observed in `npm run test:62laj` (exit **0**):

| Case | Result | Evidence class |
|---|---|---|
| Sandbox isolation | `.env` / `../` / `/etc/passwd` not written; in-root candidate file written | **PASS** (unit) |
| Allowlist runner | Real `git_status` exit 0; `rm -rf /` denied; model-provided `curl` refused | **PASS** (unit) |
| Permission-diff deny | `network` beyond granted → registry `denied`; cycle registry hop **DENIED** | **PASS** (unit) |
| Release-gate blocking deploy | `HUMAN_RELEASE_GATE_BLOCKS_DEPLOY`; cycle hop **DENIED**; `released=false` | **PASS** (unit) |
| Compile+tests PASS | Candidate `eligible=true` and `released=false` / `productionDeployed=false` | **PASS** (unit) — **not released** |
| Invented “released” | Health `released=0` on empty store; no job sets `released: true` | **PASS** (honesty) |
| Windows disconnected-network factory | Not run on a Windows node | **NOT_TESTED** |
| Customer/store publication | Gate refuses; no store API called | **DENIED** / not attempted |
| 62L-AI Research Director | Report file absent | **WAITING_DATA** |

## Reuse map (do not duplicate)

| Capability | Reused module | 62L-AJ addition |
|---|---|---|
| Protected coding / testing / security (AC) | `coding-agent.ts`, `testing-agent.ts`, `security-verifier.ts`, `offline-workcells.ts` | Factory engineering hops + test-first gate |
| Sandbox git/path/credential guard | `sandbox-guard.ts` | Protected source sandbox + isolation writes |
| Local command allowlist | `local-command-runner.ts` | Factory runner refuses model-provided shell |
| Context Vault | `context-vault.ts` | Requirements hop |
| Decision Gate / Evidence / Learning Ledger | `decision-gate.ts`, `evidence-ledger.ts`, `learning-ledger.ts` | Release gate + evidence + learning loop |
| Checkpoints | `checkpoint-store.ts` | Candidate checkpoint; resume via factory job store |
| Provider / local model | `provider-fabric.ts`, `local-model.ts` | Connector + model-adapter factories (UNAVAILABLE if unconfigured) |
| Offline Agent Runtime / mesh (AC/AD) | present on parent; **not copied** | Factory does not reimplement workcells or mesh routing |
| 62J Software Factory | queued docs only | Honesty loop + MERGE CANDIDATE ≠ release; no 62J runtime duplication |
| Runtime platform plugins (`runtime/platform/plugins.ts`) | **not duplicated** | Local-brain governed registry is a separate sandbox candidate plane |

Not copied from 62L-AE (different lineage / no AJ report): CEO sealed vault implementation. AJ records `ceoSealedNonReplicating: true` as an honesty lock and does not replicate CEO-sealed material.

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
- `services/ai/package.json` (`test:62laj`, `local:factory`)

## Commands and real test exits

Working directory: `/tmp/62l-aj-work/services/ai`

```
$ npx tsc --noEmit
exit 0

$ npm run test:62laj
# tsx local-brain/phase62laj.test.ts
62L-AJ safety tests PASS
exit 0

$ npm run test:local-brain
offline-policy.test.ts PASS
62L-E safety tests PASS
context-vault.test.ts PASS
agent-population.test.ts PASS
agent-bus.test.ts PASS
collaboration-protocol.test.ts PASS
sandbox-guard.test.ts PASS
coding-agent.test.ts PASS
testing-agent.test.ts PASS
security-verifier.test.ts PASS
evidence-ledger.test.ts PASS
local-dev-civilization.test.ts PASS
62L-X safety tests PASS
62L-Y safety tests PASS
62L-AC safety tests PASS
62L-AD safety tests PASS
62L-AJ safety tests PASS
exit 0

$ git diff --check
exit 0

$ npm run local:factory
exit 0
```

### Crash/resume evidence (from `npm run test:62laj`)

- Simulated crash after hop `code` (`FactorySimulatedCrash`)
- `recoverInterruptedFactoryJobs` recovered **1** running job → `queued`
- Resume completed remaining hops through `candidate_artifact`
- `released` remained `false`

### Runtime metrics (`npm run local:factory` on empty `services/ai` cwd)

| Metric | Observed |
|---|---|
| jobs / completed / released | 0 / 0 / 0 (empty local store — not invented) |
| localModel | `UNAVAILABLE` — `XIV_LOCAL_MODEL is not configured.` |
| providers | all `UNAVAILABLE` (`configured=false`) |
| predecessor.adMesh / acWorkcells / jSoftwareFactoryDocs | PASS / PASS / PASS (files present on this tree) |
| predecessor.aiResearchDirector / ahCausalWorldModel / agAgentSociety / afUniverseKernel | **WAITING_DATA** |
| honesty.windowsNodeVerification | `NOT_TESTED` |
| honesty.l4AutonomyEnabled / founderImpersonation / inventedPass / tipLand | false |
| honesty.ceoSealedNonReplicating / compileAndTestsDoNotAuthorizeRelease / agentGeneratedAppIsBuildCandidateOnly | true |
| next | 62L-AK title only |

## Blockers / not claimed

- GitHub Issue #48 unreadable (403). US IDs are founder-paste mappings pending API access.
- 62L-AI / 62L-AH / 62L-AG / 62L-AF reports missing → `WAITING_DATA`.
- 62L-AE hybrid edge-cloud / CEO vault **not merged** (different lineage; no AJ operations report).
- Windows disconnected-network proof **NOT_TESTED**.
- Live local model / Ollama **UNAVAILABLE** / **NOT_TESTED**.
- Full `npm run test:runtime` **NOT_TESTED** (out of 62L-AJ scope).
- No plugin was published, deployed, or customer-released.
- Draft GitHub PR: **NOT CREATED** (hard policy).

## Honesty locks

- `L4_AUTONOMY_ENABLED=false`
- `AUTO_PRODUCTION_DEPLOY=false`
- `PRODUCTION_DATABASE_WRITE=false`
- `PRODUCTION_GIT_PUSH=false` (this child branch push is not a production git push)
- `AUTO_PERMISSION_EXPANSION=false`
- `AUTO_DATABASE_MIGRATION=false`
- Unconfigured cloud/model/QPU providers remain **UNAVAILABLE**
- Guardian/RLS not weakened; no migrations applied
- No founder impersonation; CEO-sealed non-replicating
- No physical infrastructure control
- Agent-generated applications are **build candidates only**
- Compile + tests PASS ≠ released
- No invented PASS
- tip-land = **NO**; never `main`

## Git

- Child of committed 62L-AD tip; **did not merge main**; **did not tip-land xiv-v2**
- Conventional commit: `feat(62L-AJ): add offline software factory and governed plugin ecosystem #48`
- This report committed separately
- Pushed `-u origin cursor/62l-aj-offline-software-factory-plugins-4059`
- **NO PR** created (`gh pr create` not invoked). ManagePullRequest was not used.

## NEXT

**62L-AK — Offline Developer Platform + Local App Store + Universe Package Manager + Agent Tool Marketplace**

Do **not** implement 62L-AK in this slice.
