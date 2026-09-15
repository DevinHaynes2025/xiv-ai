# 12D-247 — XIV OS Approval Custody Link (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-approval-custody.ts` + 12 focused
tests). **TEST RUN DISCLOSED**: `test:12d-247` = **12/12 pass**,
`typecheck:12d-247` (strict) = **exit 0**; sibling regressions green this
cycle: 12d-233 13/13, 12d-236 13/13, 12d-237 12/12, 12d-238 11/11,
12d-239 13/13, 12d-240 13/13, 12d-241 13/13, 12d-242 14/14, 12d-244 14/14.
CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review; pre-run defects listed below). GROK_XAI review PENDING —
never fabricated.

## What it is

The out-of-band link the 12D-242 shell deferred to custody: the shell
renders `HUMAN DECISION REQUIRED` with NO approve control — this module
records the operator's EXPLICITLY STATED decision about a VERIFIED packet
into the custody chain.

1. **Verify BEFORE linking.** `buildApprovalCustodyPlan` runs 12D-241
   `verifyStoryShellPacket` FIRST — an unverified packet never gets a
   receipt (the suite proves a tampered headline refuses with the wire's
   own `tampered in flight` error).
2. **The decision is an EXPLICIT input**: `'APPROVED' | 'REJECTED'`,
   exact-case, no default, no inference — the module NEVER decides.
   `AUTO_APPROVED` / lowercase / absent all refuse. A REJECTED decision
   records too — refusal is a decision, and it derives a DIFFERENT
   receipt than approval for the same packet.
3. **The decision receipt is a digest, re-derived never invented** (the
   12D-241 pattern): sha256 over the canonical record
   `{domain: 'XIV_OS_APPROVAL_RECEIPT', receiptVersion: 1, packetId,
   storyId, decision, decidedBy, decidedAtMs}` — deterministic; distinct
   packets → distinct receipts (asserted).
4. **One register step under a FIXED purpose** `xiv-os-human-approval` —
   a misdirected record under any other purpose refuses at the registry
   (cross-purpose gate) and at verify (`fixed purpose`). The step's
   receipt, actor, and timestamps all pin to the record; verify
   re-derives the receipt from the record and refuses any edit
   (post-hoc decision flips, re-purposing, actor swaps, smuggled keys,
   an authenticate masquerading as the register).
5. **It produces a PLAN; it executes NOTHING.** The operator runs it
   through `runCustodyPlan` (12D-244) out of band. The suite proves the
   END-TO-END loop: verified packet → operator decision → runner →
   custody evidence (`journalVerified: true`), and that a SECOND
   registration of the same decision receipt refuses at the registry
   (registered-exactly-once — the runner reports `refused` and stops).
6. **Honest flags pinned** in the frozen guardrails: `humanDecision:
   'REQUIRED'`, `learningPromoted: false`, `zeroModelCalls: true`,
   `zeroRemoteCalls: true`, `collectsNothing: true`,
   `automaticRecovery: false`, `billionUsersProven: false`; the plan
   never carries the custody seed.

## Defects found and paid down during this story

- **(self-review, pre-run):** a leftover placeholder expression and an
  unused helper were removed before the first run; a duplicated constants
  declaration and a wrong constant name (`XIV_APPROVAL_PLAN_KEYS` vs the
  declared `APPROVAL_PLAN_KEYS` — a runtime ReferenceError the suite
  caught on first execution) were fixed immediately after.
- **(caught by strict tsc, test-side):** spreading the register step and
  overriding `op`/`registeredBy` needed explicit casts — the union type
  correctly refused the malformed shape at compile time, which is the
  contract working as designed.

## Disclosed residuals

- **Registration is NOT authenticity** — the 12D-233 residual carries
  verbatim: the journal proves the decision was RECORDED, not that the
  person who stated it is who they claim. Custody authenticates the
  CHAIN, not the operator; possession of the seed is control.
- Verification of a RECORDED decision (authenticating the receipt later,
  single-use) is a future story; today the operator holds the receipt
  and the journal holds the record.
- The approval AFFORDANCE in a real UI (a Next.js control calling this
  module, then the runner) is a future, separately reviewed story.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Exact files

- `services/ai/runtime/offline-team/xiv-approval-custody.ts` (new)
- `services/ai/runtime/offline-team/xiv-approval-custody.test.ts`
  (new, 12 tests)
- `docs/ai-agents/12d-247-approval-custody-link-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-247`, `typecheck:12d-247` added
  in the 12D-247 commit.
- `.gitlab-ci.yml` — `typecheck:12d-247`, `test:12d-247` appended in the
  same commit.

## Exact commands and local results

```
npm run test:12d-247      # RAN: 12/12 pass
npm run typecheck:12d-247 # RAN: strict, exit 0
```

Sibling regressions this cycle: 12d-233 13/13, 12d-236 13/13, 12d-237
12/12, 12d-238 11/11, 12d-239 13/13, 12d-240 13/13, 12d-241 13/13,
12d-242 14/14, 12d-244 14/14 — all green.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch. The commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Direction from the CEO actioned by this story

"Build the brain and neural pathways" — the governance spine now closes
its loop end to end: the front-end shell (12D-242) shows a human decision
surface; the human decides out of band; this link (12D-247) turns that
decision into a digest-bound receipt; the runner (12D-244) journals it
tamper-evidently; the registry (12D-233) authenticates it exactly once.
The CEO's blanket approval ("I approve every packet") is recorded in the
daily report — it NEVER upgrades any pinned flag: the decision input here
is the operator's out-of-band act, and `humanDecision: 'REQUIRED'` stays
pinned on every surface.