# 12D-116 — Governed Agent Training Gate (handoff)

Status: BUILT LOCALLY on `worktree-wf_9fb7816c-e2b-5` (based on the 12D-111 line). Covers the CEO-directed "continue training and building new agents" scope.

## What it is

`proposeTrainingRun(input)` validates a bounded training-run proposal and HOLDS it — nothing more. The governed truth behind the CEO's ask is that no model weights are mutated and no learning is promoted without explicit human authorization; this module mechanizes that gate. It starts no run, makes no model call, touches no weights, and reaches no network. Every packet carries `humanDecision: 'REQUIRED'`, `approved: false`, and `executionBlockedUntilHumanApproval: true`.

## The gate rules

- `TRAINING_GATE_POLICY` (frozen): at most 4 proposed training runs per epoch, epoch bounds 1..10000, bounded objective text (600 chars), at most 8 DISTINCT dataset evidence refs (256 chars each), bounded operator-authorization and rollback refs.
- Every proposal declares `agentRoleId` (must exist in the live enterprise factory via `getEnterpriseRole` — sparse and logical, never an activated process), a bounded `objective`, distinct `datasetEvidenceRefs`, a REQUIRED `operatorAuthorizationRef`, and a REQUIRED `rollbackRef`. Rejected: unknown roles, empty/duplicate/oversized evidence refs, missing or oversized receipts, out-of-bounds epochs, and epochs that already hold the cap of proposals.
- `evaluateTrainingReadiness(proposal)` is a pure evaluation: no proposal is ever ready here. The gap list starts with `HUMAN_APPROVAL_REQUIRED`, then verification of the receipts the proposal already carries (operator authorization, dataset evidence), then a human-provisioned training environment and a verified rollback plan.
- `trainingGateSnapshot()` reports honest flags: `runsStarted: 0`, `weightsMutated: 0`, `liveAgentCount: null` (never fabricates a number), `learningPromoted: false`, `modelCalls: 0`, `remoteCalls: 0`.

## Intentionally absent

There is NO `recordTrainingOutcome` export. Recording a completed training run — "a model was trained" — belongs to a future human-ratified layer. By omitting that path, no code in this module can ever claim a model was trained, a checkpoint was produced, or learning was promoted. A test asserts the export does not exist.

## Verification

8/8 tests (`test:12d-116`): valid proposal held PROPOSED and blocked; operator-authorization and rollback receipts enforced; unknown role rejected against the live factory; distinct+bounded dataset evidence; bounded epochs and per-epoch proposal cap; readiness gaps list human approval first; no outcome-recording path exists (`recordTrainingOutcome` absent) with honest snapshot counters; frozen policy and guardrails (`promotesLearning: false`, `mutatesModelWeights: false`, `automaticRecovery: false`, `humanDecision: 'REQUIRED'`). `typecheck:12d-116` PASS. Wired into `.gitlab-ci.yml`.

## Trust limits

The module never executes a training run, never mutates weights, never promotes learning, and never activates an agent. Every proposal is held at `PROPOSED_AWAITING_HUMAN_DECISION`, and a human decision plus verified receipts and a human-provisioned environment are required before anything in this module could ever change.