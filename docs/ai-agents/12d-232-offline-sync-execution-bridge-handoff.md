# 12D-232 — Offline-sync execution bridge: bounded transport instructions (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/offline-sync-execution-bridge.ts` + 11/11
focused tests + strict typecheck green + 12D-113 guardrail audit green +
siblings 12D-231 (20/20) and 12D-225 (14/14) green). CI IS NOT CLAIMED
PASSED: GitLab CI remains quota-blocked (`ci_quota_exceeded`); the
`.gitlab-ci.yml` wiring was appended but no native pipeline has executed on
it. Reviewers: CLAUDE_CODE (self-review; one test-fixture defect found and
fixed live — see below). GROK_XAI PENDING — never fabricated.

## What it is

12D-231's charter reserves "the network connector that would move bytes" as a
future story. This module is the bridge to that story, built on the exact
12D-130 (scaling) / 12D-131 (failover) bridge discipline: it takes a RECORDED
sync outcome from a live 12D-231 `OfflineAgentRuntime` and drives the 12D-121
decision-safety ladder for exactly one bounded reconciliation-transport
proposal, emitting a frozen `SYNC_EXECUTION_ISSUED` packet carrying a 12D-121
`EXECUTION_INSTRUCTION` with `executedByThisRuntime: false`.

It executes NOTHING and moves NO BYTES: `bytesMovedByThisRuntime: false`,
`remoteCalls: 0`, `modelCalls: 0`, `productionExecutionAllowed: false`,
`humanDecision: 'REQUIRED'` remain structural on every surface.

## Trust discipline (the presented runtime is UNTRUSTED)

1. **Ledger verify first**: `verifyLedger()` must pass before anything else —
   a tampered trail is refused outright.
2. **Trail re-derivation**: the presented outcome must re-derive from the
   trail — exactly ONE `SYNC_PROPOSED` entry at the presented proposal time
   (uniqueness also refuses two proposals by different grants at the same
   timestamp), whose parsed aggregate matches the presented
   universe/batch/applied/conflicts, plus one `SYNC_APPLIED` entry per
   claimed task. A forged outcome has no trail.
3. **Live task-state re-derivation**: every transportable task must exist,
   belong to the SAME universe, never be QUARANTINED, and be COMPLETED with a
   result digest — trail and live state must agree; either alone can be
   presented, both must re-derive.
4. **Conflict batches are final states**: a `SYNC_CONFLICT` outcome — or any
   outcome carrying conflicts — is refused; quarantined tasks are owned by
   human review and nothing from a conflicting batch is transportable.
5. **Identity gates**: the workflow identity must be ADVISE_ONLY with
   EXACTLY one approved tool (`xiv.sync.transport`) and a data boundary
   including the sync universe. The bridge never down-labels and never
   widens; risk class is pinned to PRODUCTION_CONFIGURATION.
6. **The execution grant is a separate human act**: its receipt must differ
   from the sync-authorization receipt, and the instruction cannot be issued
   at a time predating the sync proposal.

## Disclosed residuals (the 12D-130/131 discipline, applied to sync)

- **Receipts authenticate OUT-OF-BAND** via the operator custody registry.
  The 12D-231 trail does not record the grant receipt digest, so this module
  binds the DECLARED receipt strings for separation and ordering only; a
  recomputed digest is self-consistent and authenticates nothing by itself.
- **One instruction per reconciled batch**: nothing in this module blocks
  issuing a second instruction for the same batch with a second fresh
  execution grant — enforcement lives with the operator custody registry,
  same as sibling bridges.
- **Classified work (CONFIDENTIAL/TOP_SECRET) never leaves the local plane**:
  the instruction text forbids classified transport explicitly.

## Defect found and paid down during this story

- **NON-BLOCKING (self-review, live-reproduced via the failing suite):** the
  malformed-approver test case used `'x'.repeat(64)` as the execution receipt
  — not hex — so the receipt gate fired before the approver gate and the
  assertion regex missed. Fixed the TEST FIXTURE (valid hex receipt), not the
  implementation; the implementation's gate ordering is correct. Suite now
  11/11. One typecheck fix: the validated outcome shape is bound explicitly
  after the fail-closed shape checks (`validatedOutcome`) so re-derivation
  receives the narrowed type — no behavior change.

## Exact files

- `services/ai/runtime/offline-team/offline-sync-execution-bridge.ts` (new)
- `services/ai/runtime/offline-team/offline-sync-execution-bridge.test.ts` (new)
- `services/ai/package.json` (`test:12d-232`, `typecheck:12d-232`)
- `.gitlab-ci.yml` (`typecheck:12d-232`, `test:12d-232` appended)
- `docs/ai-agents/12d-232-offline-sync-execution-bridge-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-232      # 11/11 pass (0 fail), exit 0
npm run typecheck:12d-232 # exit 0 (strict)
npm run test:12d-113      # guardrail audit, 9/9, exit 0
npm run test:12d-231      # sibling runtime suite, 20/20, exit 0
npm run test:12d-225      # sibling gateway-executor suite, 14/14, exit 0
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, `bytesMovedByThisRuntime: false`, no
production mutation, no merge, no deployment, no learning promotion, no
Ollama/provider invocation occurred in this story. The local commit stages
ONLY the five files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.