# 2I-AI-62E — Concrete File & Command Mapping

**Status:** **QUEUED ARCHITECTURE — NOT IMPLEMENTED.** Mapping documentation only.
**DEPLOYMENT_STATE:** QUEUED
**Runtime:** NOT STARTED — **do not create** mapped runtime sources from this document
**tip-landed:** **NO**
**Park branch:** `cursor/queue-2i-ai-62e-massive-agent-scheduler-neural-pathway-4059`
**L4_AUTONOMY_ENABLED:** **FALSE**
**Evidence class:** QUEUED / FALSE / UNKNOWN — **NEVER INVENT PASS**
**`deployment_authorized`:** **false** (permanent for this park)

**Companions (compose — unique paths; do not clobber):**
- Architecture (contracts §§1–43 + Phases 0–52 fuller set): [`xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-task-force-fabric.md`](./xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-task-force-fabric.md)
- Short pointer path: [`xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-fabric.md`](./xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-fabric.md)
- Queue: [`../queue/2I-AI-62E-massive-agent-scheduler-neural-pathway.md`](../queue/2I-AI-62E-massive-agent-scheduler-neural-pathway.md)
- Evidence placeholders: [`../../evidence/2i-ai-62e/`](../../evidence/2i-ai-62e/)
- SQL drafts (NOT AUTHORIZED): [`./drafts/2i-ai-62e/`](./drafts/2i-ai-62e/)
- 62D park — **do not overwrite**
- Alternate `-104c` 62E park — **do not clobber**
- Sibling agents: `bc-102c5519` (base), `bc-159ccdbc` (phases 0–52) — rebase on park tip; unique paths

> **HARD STOP.** This file maps **future** files and commands for an authorized implementation era.
> **DO NOT** create `src/xiv/agents/*.ts`, migrations, CI workflows, or `package.json` scripts **as implementation** from this park.
> **DO NOT** run `supabase db push` against shared infra. **DO NOT** enable L4.
> Prefer isolated worktree; selective docs `git add` only; dual-push park; never force-push; never push `main`; tip-land **NO**.

---

## Repository Rule

**Rule:** Park documentation may **name** future paths and commands. Naming ≠ creating. Creating mapped runtime/migration/CI/script artifacts requires a later authorized implementation PR after **62D PASS** (+ predecessors + Deployment Gate Hardening PASS). Architecture docs ≠ migration authorization ≠ VERIFY PASS ≠ `DEPLOYMENT_AUTHORIZED`.

**Read-only discovery bash** (safe on any clone; does not create files; does not mutate remotes):

```bash
# Identify park tip (read-only)
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git remote -v
git log --oneline -5

# Discover whether mapped runtime already exists (must remain ABSENT on this park)
test ! -e src/xiv/agents && echo 'OK: src/xiv/agents absent (docs-only park)'
git ls-files 'src/xiv/agents/**' 'supabase/migrations/*62e*' '.github/workflows/*62e*' | tee /tmp/62e-runtime-leak.txt
test ! -s /tmp/62e-runtime-leak.txt && echo 'OK: no 62E runtime/migration/CI tracked files'

# Discover docs + evidence placeholders only
git ls-files 'docs/**/*62[Ee]*' 'evidence/2i-ai-62e/**' 'docs/architecture/drafts/2i-ai-62e/**'

# Diff hygiene (docs edits)
git diff --check
git status --porcelain

# Remotes honesty (never force / never main)
git branch -vv | sed -n '1,20p'
```

**Forbidden discovery mutations:** `git push --force`, `git reset --hard origin/main`, `supabase db push`, enabling L4 flags, inventing PASS in evidence JSON.

---

## §1 Target Repository Layout (full tree — proposed; NOT created)

```
xiv-ai/
├── docs/
│   ├── architecture/
│   │   ├── xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-task-force-fabric.md   # contracts
│   │   ├── xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-fabric.md             # Phases 0–52
│   │   ├── xiv-2i-ai-62e-concrete-file-command-mapping.md                            # THIS FILE
│   │   └── drafts/2i-ai-62e/
│   │       ├── README.md
│   │       ├── migration-slice.sql.draft                    # NOT AUTHORIZED TO EXECUTE
│   │       └── agent_civilization_rls_test.sql.draft        # DRAFT_NOT_EXECUTED
│   └── queue/
│       └── 2I-AI-62E-massive-agent-scheduler-neural-pathway.md
├── evidence/
│   └── 2i-ai-62e/
│       ├── README.md
│       ├── manifest.json                                    # QUEUED placeholders
│       ├── 62e-preflight.json
│       ├── scale-100k-logical.json                          # planned
│       ├── scale-10k-discovery.json                         # planned
│       ├── scale-1k-active.json                             # planned
│       ├── scale-100-task-forces.json                       # planned
│       ├── scale-1k-pathways-per-sec.json                   # planned
│       ├── kill-switch-race.json                            # planned
│       ├── rls-registry.json / rls-pathway.json / ...       # planned
│       └── verify-62e.json                                  # planned; deployment_authorized:false
├── src/xiv/agents/                                          # ★ FUTURE ONLY — DO NOT CREATE NOW
│   ├── index.ts
│   ├── types.ts
│   ├── lifecycle.ts
│   ├── capabilities.ts
│   ├── security.ts
│   ├── population-governor.ts
│   ├── registry.ts
│   ├── discovery.ts
│   ├── activation.ts
│   ├── hibernation.ts
│   ├── pathways.ts
│   ├── task-forces.ts
│   ├── scheduler.ts
│   ├── budgets.ts
│   ├── evaluation.ts
│   ├── telemetry.ts
│   └── __tests__/
│       ├── types.test.ts
│       ├── lifecycle.test.ts
│       ├── capabilities.test.ts
│       ├── security.test.ts
│       ├── population-governor.test.ts
│       ├── registry.test.ts
│       ├── discovery.test.ts
│       ├── activation.test.ts
│       ├── hibernation.test.ts
│       ├── pathways.test.ts
│       ├── task-forces.test.ts
│       ├── scheduler.test.ts
│       ├── budgets.test.ts
│       ├── evaluation.test.ts
│       ├── telemetry.test.ts
│       └── kill-switch-race.test.ts
├── services/ai/runtime/agentscheduler/                      # compose adjacency (Phases 1 layout)
│   ├── contracts/ …                                         # FUTURE ONLY
│   ├── discovery/ ranking/ activation/ pathway/ taskforce/ guardian/ scheduler/
│   └── queued/2i-ai-62e.test.ts                             # FUTURE queued stub only when authorized
├── supabase/
│   ├── migrations/
│   │   └── 20260908180000_xiv_2i_ai_62e_massive_agent_scheduler.sql   # PROPOSED name — NOT AUTHORED as executable
│   └── tests/
│       ├── agent_civilization_rls_test.sql                  # PRESERVE (see §19)
│       ├── 62e_registry_rls_test.sql                        # planned §20
│       ├── 62e_pathway_rls_test.sql                         # planned §21
│       ├── 62e_task_force_rls_test.sql                      # planned §22
│       └── 62e_scheduler_rls_test.sql                       # planned §23
├── scripts/2i-ai-62e/
│   ├── scale-100k-logical.ts
│   ├── scale-10k-discovery.ts
│   ├── scale-1k-active.ts
│   ├── scale-100-task-forces.ts
│   ├── scale-1k-pathways-per-sec.ts
│   ├── fault-injection.ts
│   ├── adversarial-suite.ts
│   ├── kill-switch-race.ts
│   └── verify.ts                                            # master verify:62e emitter
├── .github/workflows/
│   ├── 62e-fast-gates.yml                                   # planned §35
│   ├── 62e-bounded-scale.yml                                # planned §36
│   └── 62e-security-scan.yml                                # planned §37
└── package.json / services/ai/package.json                  # script keys mapped §34 — DO NOT add now
```

**Compose note:** Phases 0–52 may also cite `services/ai/runtime/agentscheduler/**`. That layout is **adjacency**, not a license to create either tree in this park. Canonical module map for §§3–17 is `src/xiv/agents/*`.

---

## §2 Architecture file path + `git diff --check`

| Role | Path |
|------|------|
| Contracts architecture | `docs/architecture/xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-task-force-fabric.md` |
| Executable plan Phases 0–52 | `docs/architecture/xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-fabric.md` |
| **Concrete File & Command Mapping** | `docs/architecture/xiv-2i-ai-62e-concrete-file-command-mapping.md` |
| Queue founder card | `docs/queue/2I-AI-62E-massive-agent-scheduler-neural-pathway.md` |

**Hygiene command (run after docs edits):**

```bash
git diff --check
git diff --check -- docs/architecture/xiv-2i-ai-62e-concrete-file-command-mapping.md \
  docs/architecture/xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-task-force-fabric.md \
  docs/architecture/xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-fabric.md \
  docs/queue/2I-AI-62E-massive-agent-scheduler-neural-pathway.md
```

Whitespace/conflict markers must be clean before park push.

---

## §3–17 Core modules (`src/xiv/agents/*` — FUTURE ONLY)

Each module below: **exports**, **invariants**, **npm test command**, **scale targets** where given.
**None of these files exist in this park commit.** Commands are **planned**.

### §3 `types.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/types.ts` |
| **Exports** | `AgentId`, `TenantId`, `UniverseId`, `DemandId`, `TaskForceId`, `PathwayId`, `SynapseId`, `AgentTaskId`, `EvidenceRef`, `RightsScope`, `Classification`, `Result<T,E>` |
| **Invariants** | IDs are branded/opaque; cross-tenant ID reuse does not imply access; UNKNOWN deny-safe |
| **Test** | `npm test -- src/xiv/agents/__tests__/types.test.ts` |
| **Scale** | types must remain O(1) per identity; no embedding of live process handles in logical types |

### §4 `lifecycle.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/lifecycle.ts` |
| **Exports** | `AgentLifecycleState`, `assertTransition`, `canActivate`, `canRetire`, `LIFECYCLE_GRAPH` |
| **States** | `IDEA · DEFINED · SANDBOX · TRAINING · EVALUATION · CERTIFIED · AVAILABLE · ACTIVE · RESTING · HIBERNATING · DEGRADED · QUARANTINED · RETIRED` |
| **Invariants** | AVAILABLE→ACTIVE requires demand+budget+attestation+rights; RETIRED→ACTIVE forbidden without re-cert; task-force membership is lease ≠ permanent state |
| **Test** | `npm test -- src/xiv/agents/__tests__/lifecycle.test.ts` |

### §5 `capabilities.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/capabilities.ts` |
| **Exports** | `AgentCapability`, `CapabilityClass`, `declareCapability`, `attestedCapabilities`, `capabilityImpliesGrant` → always `false` helper |
| **Invariants** | CAPABILITY NAME ≠ GRANT; DETECTED ≠ SUPPORTED ≠ OPTIMIZED ≠ AVAILABLE (compose 62D); specialization ≠ permission |
| **Test** | `npm test -- src/xiv/agents/__tests__/capabilities.test.ts` |

### §6 `security.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/security.ts` |
| **Exports** | `FORBIDDEN_AUTONOMOUS_CAPABILITIES`, `securityGate`, `SecurityDecision`, `denySafe`, `assertAutoFlagsFalse` |
| **Invariants** | SECURITY is a **hard gate/veto**, never a ranking score; all `AUTO_*` FALSE; `L4_AUTONOMY_ENABLED=false`; UNKNOWN → DENY |
| **Test** | `npm test -- src/xiv/agents/__tests__/security.test.ts` |

### §7 `population-governor.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/population-governor.ts` |
| **Exports** | `PopulationBudget`, `PopulationDecision`, `PopulationGovernor`, `RecursiveCreationLock`, `enforceCaps` |
| **Invariants** | over-cap → PAUSE/DENY (never silent security shed); recursive spawn depth/fan-out locked; MORE AGENTS ≠ MORE PERMISSIONS |
| **Test** | `npm test -- src/xiv/agents/__tests__/population-governor.test.ts` |
| **Scale targets (engineering, not claims)** | logical ≤ **100k**; active ≤ **1k**; task forces ≤ **100**; uncontrolled recursive creation = **0** |

### §8 `registry.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/registry.ts` |
| **Exports** | `AgentRegistry`, `AgentRegistryRepository`, `LogicalAgent`, `registerLogicalAgent`, `listAvailable`, `countActive` |
| **Invariants** | LOGICAL ≠ LIVE; millions AVAILABLE + near-zero ACTIVE is success; registry row ≠ continuous LLM session |
| **Test** | `npm test -- src/xiv/agents/__tests__/registry.test.ts` |
| **Scale** | address **100k** logical identities in harness (not LIVE claim) |

### §9 `discovery.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/discovery.ts` |
| **Exports** | `discoverSpecialists`, `DiscoveryQuery`, `DiscoveryHit`, `rankCandidates` (utility only; security veto separate) |
| **Invariants** | discover ≠ authorize; ranking cannot override security gate; no raw process-ID discovery across tenants |
| **Test** | `npm test -- src/xiv/agents/__tests__/discovery.test.ts` |
| **Scale** | **10k** AVAILABLE pool discovery harness |

### §10 `activation.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/activation.ts` |
| **Exports** | `activateOnDemand`, `ActivationLease`, `idempotentActivate`, `DemandRecord` |
| **Invariants** | DEMAND ≠ PERMISSION; N live ≪ logical; idempotent under concurrent identical demand; lease expiry → hibernate |
| **Test** | `npm test -- src/xiv/agents/__tests__/activation.test.ts` |
| **Scale** | **1k** concurrent activation stress; **100** concurrent identical demand idempotency hammer |

### §11 `hibernation.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/hibernation.ts` |
| **Exports** | `HibernationTier` (`HOT|WARM|COLD|ARCHIVED|RETIRED`), `hibernate`, `wakeEligible`, `defaultSleep` |
| **Invariants** | sleep is default; activation is exception; HOT mass without lease is defect; RETIRED not schedulable |
| **Test** | `npm test -- src/xiv/agents/__tests__/hibernation.test.ts` |

### §12 `pathways.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/pathways.ts` |
| **Exports** | `NeuralPathway`, `Synapse`, `PathwayGrant`, `authorizeSynapse`, `strengthenPathway`, `defaultDeny` |
| **Invariants** | PATHWAY STRENGTH ≠ SECURITY AUTHORITY; default-deny synapses; high strength + AuthZ FAIL → still DENY; no silent cross-tenant hop |
| **Test** | `npm test -- src/xiv/agents/__tests__/pathways.test.ts` |
| **Scale** | **1k** pathways/sec authZ-checked harness |

### §13 `task-forces.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/task-forces.ts` |
| **Exports** | `TaskForce`, `TaskForceBuilder`, `proposeTaskForce`, `authorizeTaskForce`, `dissolveTaskForce`, `AntiAgentExplosion` |
| **Invariants** | temporary; mandatory DISSOLVE/ARCHIVE; generator may not mint authority; `AUTO_TASK_FORCE_AUTHORITY=false`; no permanent authority residue |
| **Test** | `npm test -- src/xiv/agents/__tests__/task-forces.test.ts` |
| **Scale** | **100** concurrent task forces (engineering target) |

### §14 `scheduler.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/scheduler.ts` |
| **Exports** | `HierarchicalScheduler`, `UniverseScheduler`, `OrgScheduler`, `TaskForceScheduler`, `admit`, `pauseTree` |
| **Invariants** | lower schedulers **cannot** expand rights; security overrides throughput; race-safe admit; Guardian kill obeyed immediately |
| **Test** | `npm test -- src/xiv/agents/__tests__/scheduler.test.ts` |

### §15 `budgets.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/budgets.ts` |
| **Exports** | `ResourceBudget`, `BudgetLedger`, `attachBudget`, `consume`, `exhaust` |
| **Invariants** | **100%** of ACTIVE must have budget attachment; cost savings ≠ skipping validation; tokens/CPU/GPU/RAM/network/energy bounded |
| **Test** | `npm test -- src/xiv/agents/__tests__/budgets.test.ts` |

### §16 `evaluation.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/evaluation.ts` |
| **Exports** | `EvaluationRecord`, `evaluateActivation`, `ReputationScore`, `applyReputation` |
| **Invariants** | REPUTATION ≠ AUTHORITY; TEST GENERATED ≠ TEST PASSED; failed eval → DEGRADED/QUARANTINE not silent retry storms; CONSENSUS ≠ TRUTH |
| **Test** | `npm test -- src/xiv/agents/__tests__/evaluation.test.ts` |

### §17 `telemetry.ts`

| | |
|--|--|
| **Path** | `src/xiv/agents/telemetry.ts` |
| **Exports** | `emitAdmit`, `emitDeny`, `emitSynapse`, `emitKill`, `SchedulerMetrics`, `logicalVsActiveGauge` |
| **Invariants** | dashboards measured not decorative; never conflate logical counts with active; lineage required for consequential hops |
| **Test** | `npm test -- src/xiv/agents/__tests__/telemetry.test.ts` |

**Barrel:** `src/xiv/agents/index.ts` re-exports public contracts only; must not enable flags.

---

## §18 Supabase migration (proposed file + tables)

| | |
|--|--|
| **Proposed file** | `supabase/migrations/20260908180000_xiv_2i_ai_62e_massive_agent_scheduler.sql` |
| **Draft only (park)** | `docs/architecture/drafts/2i-ai-62e/migration-slice.sql.draft` |
| **Authorization** | **NONE** in this park |

**Proposed tables (tenant-bearing → RLS required before feature logic):**

`xiv_logical_agents`, `xiv_agent_capabilities`, `xiv_agent_evaluations`, `xiv_agent_sleep_states`, `xiv_activation_demands`, `xiv_scheduler_decisions`, `xiv_neural_pathways`, `xiv_synapses`, `xiv_pathway_grants`, `xiv_task_forces`, `xiv_task_force_members`, `xiv_task_force_budgets`, `xiv_agent_tasks`, `xiv_message_envelopes`, `xiv_evidence_refs`, `xiv_swarm_coordination_events`, `xiv_runaway_agent_detections`, `xiv_kill_switch_events`, `xiv_reputation_records`, `xiv_population_governor_counters`, `xiv_recursive_creation_lock_events`

**Lint / reset notes (implementation era only):**

```bash
# Planned local-only checks — NOT run against shared infra from this park
supabase db lint                          # local
supabase migration list                   # read-only inventory
# supabase db reset                       # LOCAL disposable DB only — never shared
```

**HARD FORBIDDEN now:**

```bash
supabase db push          # NEVER against shared from this park
supabase db push --linked # NEVER
```

Do **not** alter `20260908150000_xiv_agent_meetings.sql` (62B) from 62E without separate process.

---

## §19 Preserve `agent_civilization_rls_test.sql` + anon+JWT = NO GRANT

| | |
|--|--|
| **Canonical preserve path** | `supabase/tests/agent_civilization_rls_test.sql` |
| **Park draft (not executed)** | `docs/architecture/drafts/2i-ai-62e/agent_civilization_rls_test.sql.draft` |

**Preserve rules:**
1. If `supabase/tests/agent_civilization_rls_test.sql` already exists from 62A/civilization work — **do not delete, weaken, or “simplify away” negative cases**.
2. 62E may **extend** with pathway/registry/task-force/scheduler cases (§§20–23) in **additional** files — not by gutting the civilization suite.
3. **`anon` + JWT absence = NO GRANT.** No table/policy may allow `anon` to read/write 62E tenant tables. Missing/invalid/expired/wrong-audience JWT → DENY.
4. Draft presence ≠ PASS. `DRAFT_NOT_EXECUTED` remains until an authorized evidence era.

---

## §20–23 RLS tests (planned SQL + commands)

| § | Suite file | Focus | Planned command |
|---|------------|-------|-----------------|
| **§20** | `supabase/tests/62e_registry_rls_test.sql` | Org A cannot SELECT/ACTIVATE Org B logical agents; registry isolation | `npm run test:62e:rls:registry` |
| **§21** | `supabase/tests/62e_pathway_rls_test.sql` | Default-deny synapse; cross-universe private pathway grant DENY; strength≠AuthZ | `npm run test:62e:rls:pathway` |
| **§22** | `supabase/tests/62e_task_force_rls_test.sql` | Task force members/budgets tenant-scoped; dissolve clears authority residue | `npm run test:62e:rls:task-force` |
| **§23** | `supabase/tests/62e_scheduler_rls_test.sql` | Scheduler decisions not cross-tenant readable; kill-switch insert unauthorized DENY | `npm run test:62e:rls:scheduler` |

**Aggregate (planned):** `npm run test:62e:rls` → runs civilization preserve suite + §§20–23.

Evidence JSON (planned): `evidence/2i-ai-62e/rls-registry.json`, `rls-pathway.json`, `rls-task-force.json`, `rls-scheduler.json` — default `"pass": false`, `"status": "NOT_RUN"`.

---

## §24–32 Scale scripts + evidence JSON + kill-switch + manifest + `verify.ts`

| § | Script (FUTURE) | Evidence JSON | Intent |
|---|-----------------|---------------|--------|
| **§24** | `scripts/2i-ai-62e/scale-100k-logical.ts` | `evidence/2i-ai-62e/scale-100k-logical.json` | 100k logical identities; live ≈ 0 |
| **§25** | `scripts/2i-ai-62e/scale-10k-discovery.ts` | `evidence/2i-ai-62e/scale-10k-discovery.json` | 10k AVAILABLE discovery |
| **§26** | `scripts/2i-ai-62e/scale-1k-active.ts` | `evidence/2i-ai-62e/scale-1k-active.json` | 1k concurrent ACTIVE cap honesty |
| **§27** | `scripts/2i-ai-62e/scale-100-task-forces.ts` | `evidence/2i-ai-62e/scale-100-task-forces.json` | 100 concurrent forces + dissolve |
| **§28** | `scripts/2i-ai-62e/scale-1k-pathways-per-sec.ts` | `evidence/2i-ai-62e/scale-1k-pathways-per-sec.json` | 1k pathways/sec authZ-checked |
| **§29** | `scripts/2i-ai-62e/fault-injection.ts` | `evidence/2i-ai-62e/fault-injection.json` | budget exhaustion, attestation fail, deny-safe |
| **§30** | `scripts/2i-ai-62e/adversarial-suite.ts` | `evidence/2i-ai-62e/adversarial-suite.json` | rights expansion / cross-tenant / AUTO_* flip attempts |
| **§31** | `scripts/2i-ai-62e/kill-switch-race.ts` + `src/xiv/agents/__tests__/kill-switch-race.test.ts` | `evidence/2i-ai-62e/kill-switch-race.json` | hierarchical kill wins races; fabric ≠ unkillable |
| **§32** | `scripts/2i-ai-62e/verify.ts` | `evidence/2i-ai-62e/verify-62e.json` + `manifest.json` | master aggregator; **must emit `deployment_authorized:false`** |

**Manifest path:** `evidence/2i-ai-62e/manifest.json` (placeholder present; items QUEUED / NOT_RUN / `pass:false`).

**Planned commands:**

```bash
npm run scale:62e:100k
npm run scale:62e:10k
npm run scale:62e:1k-active
npm run scale:62e:100-tf
npm run scale:62e:1k-pathways
npm run test:62e:fault
npm run test:62e:adversarial
npm run test:62e:kill-switch
npm run verify:62e
```

**Never invent PASS** in any evidence JSON from this park.

---

## §34 `package.json` script mapping (DO NOT add keys now)

Planned keys (root and/or `services/ai/package.json`):

| Script | Planned command body |
|--------|----------------------|
| `test:62e` | unit tests under `src/xiv/agents/__tests__` |
| `test:62e:rls` | civilization + §§20–23 SQL suites |
| `test:62e:rls:registry` | §20 |
| `test:62e:rls:pathway` | §21 |
| `test:62e:rls:task-force` | §22 |
| `test:62e:rls:scheduler` | §23 |
| `test:62e:kill-switch` | §31 |
| `test:62e:fault` | §29 |
| `test:62e:adversarial` | §30 |
| `scale:62e:100k` | §24 |
| `scale:62e:10k` | §25 |
| `scale:62e:1k-active` | §26 |
| `scale:62e:100-tf` | §27 |
| `scale:62e:1k-pathways` | §28 |
| `verify:62e` | `tsx scripts/2i-ai-62e/verify.ts` (or `xiv verify`) |

**Park rule:** documenting these keys ≠ editing `package.json` in this commit.

---

## §35–37 CI workflow mapping

### §35 Fast gates — `.github/workflows/62e-fast-gates.yml` (planned)

Triggers: PR paths touching `src/xiv/agents/**`, `docs/**/*62E*`, `evidence/2i-ai-62e/**` (docs-only PRs must not require green runtime that does not exist yet).

Jobs (planned):
- `diff-check` → `git diff --check`
- `unit-fast` → `npm run test:62e` (implementation era)
- `flags-false` → assert all 62E `*_ENABLED` + `AUTO_*` + L4 FALSE
- `no-runtime-on-docs-park` → fail if docs-only park accidentally adds `src/xiv/agents/**`

### §36 Bounded scale gates — `.github/workflows/62e-bounded-scale.yml` (planned)

Manual / nightly (implementation era): §§24–28 harnesses with hard timeouts; upload evidence JSON artifacts; **fail closed** on missing evidence; never auto-mark PASS.

### §37 Security scan mapping — `.github/workflows/62e-security-scan.yml` (planned)

- Secret scan on PR diff
- Dependency scan
- RLS suite job (`npm run test:62e:rls`) when DB service present
- Block `supabase db push` usage in CI scripts
- Block workflows that set `L4_AUTONOMY_ENABLED=true`

**Park rule:** do **not** create these workflow files now.

---

## §38 Git safety commands (no force / hard reset)

**Allowed (park):**

```bash
git checkout -B cursor/queue-2i-ai-62e-massive-agent-scheduler-neural-pathway-4059
git fetch origin cursor/queue-2i-ai-62e-massive-agent-scheduler-neural-pathway-4059
git fetch gitlab cursor/queue-2i-ai-62e-massive-agent-scheduler-neural-pathway-4059
git rebase origin/cursor/queue-2i-ai-62e-massive-agent-scheduler-neural-pathway-4059
# selective docs add only:
git add docs/architecture/xiv-2i-ai-62e-concrete-file-command-mapping.md \
        docs/architecture/xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-task-force-fabric.md \
        docs/architecture/xiv-2i-ai-62e-massive-agent-scheduler-neural-pathway-fabric.md \
        docs/queue/2I-AI-62E-massive-agent-scheduler-neural-pathway.md \
        docs/architecture/drafts/2i-ai-62e/ \
        evidence/2i-ai-62e/
git commit -m "docs(xiv): add 2I-AI-62E concrete file and command mapping"
git push -u origin cursor/queue-2i-ai-62e-massive-agent-scheduler-neural-pathway-4059
git push -u gitlab cursor/queue-2i-ai-62e-massive-agent-scheduler-neural-pathway-4059
```

**Forbidden:**

```bash
git push --force           # NEVER
git push --force-with-lease  # NEVER for this program
git push origin main       # NEVER
git reset --hard           # NEVER as recovery for shared tips
```

**tip-landed=NO** — do not merge/cherry-pick onto `xiv-v2` from this mapping commit.

---

## §39 PR-to-File Mapping — `PR-62E-01` … `PR-62E-20`

| PR | Primary files (planned) | Focus |
|----|-------------------------|-------|
| **PR-62E-01** | `src/xiv/agents/types.ts`, `lifecycle.ts`, tests | Domain contracts + lifecycle |
| **PR-62E-02** | `capabilities.ts`, `security.ts` | Capabilities + forbidden autonomous list |
| **PR-62E-03** | `population-governor.ts`, `registry.ts`, `budgets.ts` | Governor + registry + budgets |
| **PR-62E-04** | `supabase/migrations/20260908180000_xiv_2i_ai_62e_massive_agent_scheduler.sql` | Migration **review only** (no shared apply) |
| **PR-62E-05** | `supabase/tests/agent_civilization_rls_test.sql` (+ preserve), `62e_*_rls_test.sql` | RLS + adversarial SQL |
| **PR-62E-06** | `discovery.ts` | Discovery |
| **PR-62E-07** | `security.ts` hooks in ranking path | Ranking with security veto |
| **PR-62E-08** | `activation.ts` | Activation + idempotency |
| **PR-62E-09** | `pathways.ts` + pathway tables | Pathway tables |
| **PR-62E-10** | `pathways.ts` AuthZ engine | Default-deny synapse |
| **PR-62E-11** | `task-forces.ts` | TaskForce model + builder |
| **PR-62E-12** | `population-governor.ts` anti-explosion | Anti-agent-explosion |
| **PR-62E-13** | `scheduler.ts` | Scheduler V1 |
| **PR-62E-14** | `scheduler.ts` race + `budgets.ts` | Race safety + resource budget |
| **PR-62E-15** | envelope/evidence modules (compose telemetry) | Message envelope + evidence refs |
| **PR-62E-16** | `hibernation.ts`, `evaluation.ts` | Hibernation + evaluation + reputation≠authority |
| **PR-62E-17** | kill-switch tests + Guardian hooks | Guardian + kill-switch race |
| **PR-62E-18** | `telemetry.ts` + audit logistics | Audit/logistics + observability |
| **PR-62E-19** | `scripts/2i-ai-62e/scale-*.ts`, fault, adversarial | Synthetic + scale + fault + adversarial |
| **PR-62E-20** | workflows + `package.json` scripts + `scripts/2i-ai-62e/verify.ts` | Scans + evidence manifest + CI + verify |

Each PR inherits: L4 FALSE; AUTO_* FALSE; tip-land NO unless separately authorized; never invent PASS.

---

## §40 Agent Execution Prompt Mapping

| Agent / role prompt | Reads | May write (later era) | Must not |
|---------------------|-------|------------------------|----------|
| **Docs park agent** | this mapping + contracts + Phases 0–52 | `docs/**`, `evidence/2i-ai-62e/*` placeholders, drafts | runtime, migrations apply, CI create, tip-land |
| **PR-62E-01…03 implementer** | §§3–8 | `src/xiv/agents/{types,lifecycle,capabilities,security,population-governor,registry,budgets}.ts` + tests | enable flags; db push |
| **PR-62E-04…05 DB/RLS** | §§18–23 | migration under process; RLS tests; **preserve** civilization RLS | shared `db push` without process; weaken anon deny |
| **PR-62E-06…14 control plane** | §§9–15 | discovery→scheduler modules | expand rights downward; skip security gate |
| **PR-62E-15…18 honesty/obs** | §§11,16,17,31 | hibernation/eval/telemetry/kill-switch | reputation→authority; decorative dashboards |
| **PR-62E-19…20 verify/CI** | §§24–37,41 | scripts, workflows, verify emitter | invent PASS; set `deployment_authorized:true` |
| **Guardian reviewer** | all | approve/deny only | auto-override (`AUTO_GUARDIAN_OVERRIDE=false`) |

Prompt stub (docs-only agents):

```
You are parking 2I-AI-62E mapping docs on
cursor/queue-2i-ai-62e-massive-agent-scheduler-neural-pathway-4059.
DO NOT create src/xiv/agents/*.ts, migrations, CI, or package.json scripts.
DO NOT tip-land, force-push, push main, db push, or enable L4.
Status remains QUEUED ARCHITECTURE — NOT IMPLEMENTED.
Never invent PASS. deployment_authorized must remain false.
```

---

## §41 Master `verify:62e` JSON (`deployment_authorized:false`)

**Emitter (planned):** `scripts/2i-ai-62e/verify.ts`
**Commands:** `xiv verify` · `npm run verify:62e` · `pnpm verify:62e`
**Output path:** `evidence/2i-ai-62e/verify-62e.json`

**Required shape (illustrative — not produced as PASS here):**

```json
{
  "story": "2I-AI-62E",
  "status": "QUEUED_ARCHITECTURE",
  "implementation_complete": false,
  "verified": false,
  "deployment_authorized": false,
  "l4_autonomy_enabled": false,
  "auto_flags_all_false": true,
  "tip_landed": false,
  "migration_authorized": false,
  "runtime_sources_present": false,
  "scale_targets_claimed_live": false,
  "never_infer_pass": true,
  "modules": {
    "types": "NOT_IMPLEMENTED",
    "lifecycle": "NOT_IMPLEMENTED",
    "capabilities": "NOT_IMPLEMENTED",
    "security": "NOT_IMPLEMENTED",
    "population_governor": "NOT_IMPLEMENTED",
    "registry": "NOT_IMPLEMENTED",
    "discovery": "NOT_IMPLEMENTED",
    "activation": "NOT_IMPLEMENTED",
    "hibernation": "NOT_IMPLEMENTED",
    "pathways": "NOT_IMPLEMENTED",
    "task_forces": "NOT_IMPLEMENTED",
    "scheduler": "NOT_IMPLEMENTED",
    "budgets": "NOT_IMPLEMENTED",
    "evaluation": "NOT_IMPLEMENTED",
    "telemetry": "NOT_IMPLEMENTED"
  },
  "evidence_manifest": "evidence/2i-ai-62e/manifest.json"
}
```

**Hard rule:** verify tooling may report QUEUED/FAIL/PASS only from real evidence. This park must not emit `"verified": true` or `"deployment_authorized": true`.

---

## Implementation Lock (state machine — NOT `QUEUE→PRODUCTION`)

```
QUEUED_ARCHITECTURE          ← THIS PARK (docs + mapping only)
        │
        │ (62D PASS + predecessors PASS + Deployment Gate Hardening PASS
        │  + explicit human/Guardian authorization — never invent)
        ▼
IMPLEMENTATION_AUTHORIZED    (opens PR-62E-01…20 under process)
        │
        ▼
IMPLEMENTATION_IN_PROGRESS
        │
        ▼
IMPLEMENTATION_COMPLETE      (code+tests exist; flags still FALSE)
        │
        ▼
VERIFIED                     (verify:62e with honest evidence; still
                              deployment_authorized:false unless gate)
        │
        ▼
STAGING_CANARY_CANDIDATE     (Deployment Gate Hardening still required)
        │
        ▼
DEPLOYMENT_AUTHORIZED        (explicit separate gate ONLY)
```

**Forbidden transition:** `QUEUED_ARCHITECTURE → PRODUCTION` / `→ DEPLOYMENT_AUTHORIZED` directly.
**Forbidden:** treating docs checkmarks, queue cards, or mapping completeness as PASS.

| Lock bit | Value now |
|----------|-----------|
| Runtime | NOT STARTED |
| tip-landed | NO |
| L4 | FALSE |
| AUTO_* | all FALSE |
| migration_authorized | false |
| deployment_authorized | false |
| Implementation Lock | **QUEUED_ARCHITECTURE** |

---

## Final Rule

1. **LOGICAL AGENTS ≠ LIVE PROCESSES. MORE AGENTS ≠ MORE PERMISSIONS.**
2. **SECURITY is a gate, not a score. REPUTATION ≠ AUTHORITY. PATHWAYS default-deny.**
3. This Concrete File & Command Mapping is **documentation only**.
4. **Do not** create `src/xiv/agents/*.ts`, migrations, CI workflows, or `package.json` script keys from this park.
5. **Do not** `supabase db push` shared infra. **Do not** enable L4. **Do not** tip-land. **Do not** force-push. **Do not** push `main`.
6. **Do not** invent PASS. `deployment_authorized` remains **false**.
7. Preserve `agent_civilization_rls_test.sql` negative posture (`anon`+missing JWT = NO GRANT).
8. Unique 62E neural-pathway paths; **do not clobber 62D** or alternate `-104c` parks.
9. Status remains **QUEUED ARCHITECTURE — NOT IMPLEMENTED** until a later authorized era proves otherwise with evidence.

**HARD STOP — mapping documented; runtime not started.**
