# XIV Master User Story Queue

This is the canonical XIV Operations Brain backlog. It contains user stories,
governance boundaries, selection state, and evidence receipts—not implementation
code. Implementation belongs in the designated service, app, database, and
report folders.

## Operating Flow

```text
XIV_MASTER_USER_STORY_QUEUE.md
  → GitHub issue
  → Agent Home Base
  → task/dependency graph
  → child worktree/branch
  → implementation files
  → tests
  → evidence receipt
  → review
  → Operations Brain result
```

No story is implemented merely by appearing here. A selected story needs a
traceable issue, bounded task graph, branch, tests, and evidence receipt.

## Shared Engineering Convergence

| Concern | Canonical location |
| --- | --- |
| Agent-to-agent orchestration and task coordination | `services/ai/orchestration/` |
| ASUS/local CPU/GPU/NPU runtimes | `services/ai/local-runtime/` |
| Cross-vendor capability and workload routing | `services/ai/compute-graph/` |
| Authorization, policy, audit, model routing | existing `services/ai/` core |
| User-facing XIV OS | `apps/mobile/` |
| Governed storage and RLS candidates | `supabase/` |
| Build/test/evidence receipts | `docs/operations/reports/` |

Shared modules are mandatory where a capability crosses agent, runtime, or
vendor boundaries. A story must extend them rather than creating a disconnected
parallel control plane.

## Shared Agent Message Envelope

Every inter-agent message, task handoff, task-graph node, and return receipt
must carry this envelope. Implementations may add fields, but may not omit the
minimum control fields.

```ts
type XIVAgentEnvelope = {
  missionId: string;
  taskId: string;
  parentTaskId?: string;
  agentId: string;
  universeId: string;
  permissions: readonly string[];
  dataClass: string;
  computeBudget: {
    maxDurationMs: number;
    maxModelCalls: number;
    maxComputeUnits: number;
    maxCost: number;
  };
  evidenceRequirement: readonly string[];
  returnPath: string;
};
```

The envelope is metadata and authorization context, not a credential container.
Raw passwords, access tokens, service keys, or cross-tenant data are never
placed in it.

## Non-Negotiable Security Lock

```text
L4_AUTONOMY_ENABLED=false
AUTO_AGENT_REPLICATION=false
AUTO_PERMISSION_EXPANSION=false
AUTO_TOOL_INSTALL=false
AUTO_MODEL_ENABLE=false
AUTO_GPU_PURCHASE=false
AUTO_ENTERPRISE_CONNECTION=false
AUTO_EXTERNAL_ACCOUNT_CREATION=false
AUTO_EXTERNAL_CONTRACT=false
AUTO_MAIN_BRANCH_MERGE=false
AUTO_DATABASE_MIGRATION=false
AUTO_PRODUCTION_DEPLOY=false
AUTO_GUARDIAN_OVERRIDE=false
```

Unknown, unconfigured, unattested, expired, or unauthorized capabilities are
`UNAVAILABLE`, never implicitly eligible.

## Queue

### 62I — Adaptive Agent Foundry, Tool Mesh, Learning Pipeline & Accelerator Intelligence OS

- **State:** In progress — first bounded code foundation exists.
- **Purpose:** Reuse eligible specialists before proposing bounded ephemeral
  specialists; require a registered blueprint, population limits, Guardian and
  human approval, lineage, expiration, and explicit lifecycle transitions.
- **Evidence required:** no recursive self-creation, no permission expansion,
  no unbudgeted creation, no Guardian bypass, and complete lineage.
- **Result:** `services/ai/agent-foundry.ts` provides the initial in-memory
  reuse-first validation and ephemeral lifecycle foundation. It does not create
  infrastructure, credentials, tools, models, or production agents.

### ES4 / 62L-EU — AMD Software Acceleration Layer, Agent Integration Spine & Unified File/Service Coordination

- **State:** Selected for implementation after a resolvable issue and task
  graph are available.
- **External issue reference:** GitHub `#166` was referenced by the founder,
  but was not resolvable from the repository configured for this workspace when
  checked on 2026-09-09. Do not fabricate an issue body or status.
- **User story:** As the founder of XIV AI, I want governed agents to select
  eligible local AMD CPU/GPU/NPU execution paths, optimize software workloads
  through measured batching, caching, and quantization candidates, and return
  benchmark-backed evidence through one shared task and message spine—so XIV
  improves software use of available hardware without claiming physical silicon
  enhancement or bypassing governance.
- **Scope:**
  - local CPU/GPU/NPU capability discovery with explicit truth states;
  - compute-graph capability model shared across AMD, NVIDIA, Intel, ARM, and
    RISC-V representations;
  - deterministic workload selection, resource ceilings, batching/cache/
    quantization recommendations, and CPU fallback;
  - task graph, Agent Home Base return receipts, evidence requirements, and
    bottleneck feedback;
  - measured benchmark registry inputs only.
- **Out of scope:** physical silicon modification, vendor capability claims
  without measured evidence, raw credential access, automatic hardware purchase,
  production deployment, model enablement, or permission expansion.
- **Acceptance evidence:**
  - CPU path and eligible accelerator path are distinguishable;
  - unavailable or unattested hardware is never selected;
  - budget exhaustion stops work;
  - benchmark comparisons use a common workload and baseline;
  - every handoff and result has the shared envelope and return receipt;
  - actual runtime results are reported as `VERIFIED`, `NOT_TESTED`,
    `DEGRADED`, or `UNAVAILABLE` truthfully.
- **Dependencies:** the existing 62L Windows hardware/runtime probe brief,
  shared Agent Foundry policy boundary, and a resolvable GitHub issue.

### ES5 — NVIDIA Software Acceleration Layer & Shared Hybrid Compute Integration

- **State:** Queued; not selected.
- **User story:** As the founder of XIV AI, I want NVIDIA-capable software
  execution to use the same compute graph, Agent Home Base, message envelope,
  benchmark registry, evidence graph, and resource governor as ES4—so XIV
  receives hybrid compute support without creating a separate NVIDIA control
  plane.
- **Hard requirement:** ES5 extends the shared modules from ES4. It may not
  duplicate orchestration, evidence, task graph, scheduling, or security logic.
- **Acceptance evidence:** identical security and evidence controls apply to
  NVIDIA paths; vendor selection is based on measured eligible results, not
  marketing claims.

## Operations Brain Return Receipt

Every completed task returns a concise receipt to this file or a linked report
in `docs/operations/reports/`:

```text
storyId:
issue:
missionId:
taskId:
branch:
commit:
filesChanged:
testsRun:
evidenceArtifacts:
truthState:
securityChecks:
knownLimitations:
recommendedNextTask:
```

Only observed results belong in `truthState`, `testsRun`, and
`securityChecks`. Designs, anticipated work, and blocked prerequisites must be
labelled separately.
