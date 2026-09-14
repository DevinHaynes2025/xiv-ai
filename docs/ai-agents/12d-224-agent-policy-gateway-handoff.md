# 12D-224 — Agent Policy Enforcement Gateway (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/agent-policy-gateway.ts` +
`agent-policy-gateway.test.ts`; 15/15 focused tests + typecheck green; sibling
suites re-run green — 12D-119 8/8, 12D-120 7/7, 12D-121 11/11, 12D-112 7/7,
12D-116 8/8, 12D-123 6/6, 12D-124 5/5, 12D-125 6/6, 12D-126 17/17, 12D-129
12/12, 12D-130 9/9, 12D-131 9/9, 12D-134 10/10, 12D-133 11/11, 12D-135 6/6,
12D-136 7/7, 12D-221 12/12, 12D-222 9/9, 12D-113 guardrail audit 9/9).
CI IS NOT CLAIMED PASSED: GitLab CI remains quota-blocked
(`ci_quota_exceeded`); the `.gitlab-ci.yml` wiring was appended but no native
pipeline has executed on it.

## What it is

The owner's Autonomous Agent Runtime charter (2026-09-14) requires that NO
agent tool call reaches production until ONE gateway verifies identity,
permission, risk, budget, approval, and audit metadata. 12D-224 is that
gateway as a pure, fail-closed decision engine:
`AgentPolicyGateway.evaluateToolCall` runs the order
**identity/liveness → prohibited → audit-required → declared-registry →
permission → budgets → retry limit → approval → clearance**, and every outcome
(allow, pause, or refusal) lands in an append-only, hash-chained audit trail
whose entries carry the agent identity AND the taskId (owner control: 100%
logged, 100% identity-attached).

### The owner's control thresholds, frozen as policy

- Automatic (low-risk reversible) classes: analyze approved data, retrieve
  documents, generate reports, update agent memory, create test cases, execute
  sandbox tests, retry recoverable failures, deploy to staging, rollback failed
  versions — all POLICY clearances only.
- Approval-required classes: production deployment, external communications,
  financial transactions, contract acceptance, permission expansion, personal
  data export, model fine-tuning, permanent data deletion.
- Prohibited classes: bypass safety controls, reveal credentials, disable audit
  logging, conceal agent actions, create unbounded agent loops — refused even
  WITH a presented approval (an approval cannot launder a prohibited act).
- Retry limit 3 (attempt > 3 refused); evaluation pass ≥ 90% (below → advisory
  rollback trigger `score_below_baseline` bounded by the 5-minute deadline);
  temporary-agent lifetime ≤ 60 minutes (absolute expiry, auto-terminate on
  every surface); emergency-stop deadline 10 s (advisory, recorded); 0
  unregistered executions; 0 high-risk actions without approval.

### The owner's agent-creation rules, enforced in `registerAgent`

A temporary specialist requires a registered creator, a permission list that is
a STRICT SUBSET of the creator's (never equal, never outside scope), budgets
that do not exceed the creator's, and an absolute lifetime ≤ 60 minutes. Any
named parent (temporary OR permanent) must reference a registered agent —
ghost lineage is refused. Duplicate agent ids are refused.

### The DECLARED tool registry

`declareTools` is the only tool source `evaluateToolCall` accepts — a per-call
registry would be caller-swappable, so the registry is declared once on the
gateway instance, digest-bound (order-insensitive), and the digest rides inside
every decision digest. A gateway with NO declared registry refuses everything.

### Human approvals

High-impact classes pause (`REQUIRES_HUMAN_APPROVAL`,
`humanDecision: 'REQUIRED'`) until a presented approval verifies: 64-hex sha256
operator receipt, non-future timestamp, approver identity, and
class-binding (`forActionClass` must equal the presented call's class). The
raw receipt value never enters the audit trail (12D-121 discipline); it rides
only inside the decision digest, authenticated out-of-band by the operator
custody registry.

### Output verification, learning, and stopping

`recordEvaluation` gates at the 90% pass line and records an advisory
`score_below_baseline` rollback trigger bounded by the owner's 5-minute
deadline. `proposeImprovement` returns `approvalStatus: 'pending'` /
`learningPromoted: false` — a proposal enters the review pipeline and AFFECTS
NOTHING until a human approves out-of-band. `emergencyStop` is idempotent and
every later surface (calls, evaluations, proposals) refuses an expired,
stopped, or unknown agent.

### CEO-review findings paid down during this build (all regression-tested)

1. **Per-call tool registry was caller-swappable** — reworked to the
   DECLARED registry (digest-bound into every decision); undeclared registry
   refuses everything. Regression-tested.
2. **Paused high-impact calls carried `humanDecision: 'NOT_REQUIRED'`** — the
   refusal path now stamps `REQUIRED` exactly for `REQUIRES_HUMAN_APPROVAL`.
   Regression-tested.
3. **Permanent agents could name a ghost parentId** — any named parent must
   now reference a registered agent. Regression-tested.
4. **Audit entries lacked taskId** — every entry now carries agentId AND
   taskId (owner control: 100% logged, identity-attached). Regression-tested.
5. **Expired/stopped agents could still evaluate and propose** —
   `recordEvaluation`/`proposeImprovement` now refuse non-operational agents.
   Regression-tested.
6. **Emergency stop made idempotent** (a second stop is a no-op, not an
   error) — tested; one EMERGENCY_STOP entry only.
7. **Refusals consume no budget** — verified: 10 refusals then a full budget
   still clears.

Residuals (disclosed):
- Approval VALIDITY WINDOW: the gateway checks non-future timestamps only;
  bounding approval age is the 12D-121 trail's job at the executor boundary.
- The raw operator receipt never rides the trail (by design; out-of-band
  custody authentication, same discipline as 12D-121/12D-222).
- `AUTO_RUN_CLEARED` is a POLICY clearance, not an execution: the separately
  reviewed executor story must re-verify before any side effect; staging
  deploy/rollback remain labels until that story exists.
- Budget/token/cost figures are caller-declared estimates, verified against
  declared budgets — not measured usage.
- Sparse logical scale (genomes/chips/agents in the trillions) is
  architecture, never materialized rows; 2,000,000 rows/database stays the
  ONLY measured ceiling; no quantum-hardware claims are made or implied.

## Exact files

- `services/ai/runtime/offline-team/agent-policy-gateway.ts` (new)
- `services/ai/runtime/offline-team/agent-policy-gateway.test.ts` (new)
- `services/ai/package.json` (`test:12d-224`, `typecheck:12d-224`)
- `.gitlab-ci.yml` (`typecheck:12d-224`, `test:12d-224` appended)

## Exact commands and local results

```
npm run typecheck:12d-224   # OK (exit 0)
npm run test:12d-224        # 15/15 pass
npm run test:12d-113        # 9/9 pass (guardrail audit)
npm run test:12d-121        # 11/11 pass
npm run test:12d-222        # 9/9 pass
(+ full sibling sweep above — all green)
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

Reviewers: CLAUDE_CODE (self-review: 7 findings identified, 4 confirmed paid
down with regression tests before commit, 3 disclosed residuals above).
GROK_XAI PENDING — never fabricated. No provider call, no traffic movement,
no production mutation, no cell provisioning, no merge, no deployment, no
learning promotion, no Ollama invocation occurred in this story;
`billionUsersProven: false`, `modelCalls: 0`, `remoteCalls: 0`,
`trafficMoved: false`, `productionMutationAllowed: false`,
`humanDecision: 'REQUIRED'` throughout. Awaiting CEO authorization for any
merge/deploy (standing rule).

## Relationship to the pending 12D-223 reconciliation

The two 12D-223 reconciliation documents
(`12d-223-release-ledger.md`, `12d-223-mr-114-reconciliation.md`) remain
UNTRACKED pending the CEO's reconciliation authorization, per the standing
hold. This story's commit stages ONLY its own four files and does not touch
them.