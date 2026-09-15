# 12D-248 — XIV OS Approval Verification (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-approval-verification.ts` + 7
focused tests). **TEST RUN DISCLOSED**: `test:12d-248` = **7/7 pass**,
`typecheck:12d-248` (strict) = **exit 0**; sibling regressions: see
"Exact commands" (all green). CI IS NOT CLAIMED PASSED
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review; pre-run
cleanups listed below). GROK_XAI review PENDING — never fabricated.

## What it is

The second half of the approval lifecycle 12D-247 opened. 12D-247 RECORDS
an operator's decision about a verified packet (register, digest-bound
receipt). 12D-248 AUTHENTICATES that recorded decision LATER — the
receipt is consumed exactly once, and consumption is confirmed from the
runner's evidence:

1. **The receipt is RE-DERIVED from the operator-held decision record**
   (`deriveApprovalReceipt`, 12D-247), never accepted as a claim — an
   edited record (e.g. a post-hoc decision flip) re-derives a DIFFERENT
   receipt and refuses (asserted).
2. **`verifiedAtMs >= decidedAtMs` structurally** — the registry refuses
   authenticating before issuance; the module refuses even earlier, and
   the suite proves the runner surfaces the registry's refusal when a
   plan is force-built otherwise.
3. **One authenticate step under the FIXED purpose**
   `xiv-os-human-approval`; re-purposing, receipt swaps, a register
   masquerading as the authenticate, and smuggled keys all refuse at
   `verifyApprovalVerificationPlan`.
4. **FULL LIFECYCLE proven end-to-end in the suite**: 12D-247 register
   plan → 12D-244 runner (bootstrap) → 12D-248 verification plan → runner
   (resume) → `confirmApprovalConsumed` from the evidence
   (`consumedAtMs` recorded) → a SECOND verification refuses at the
   registry (single-use; the runner reports `refused`, zero applied).
5. **`confirmApprovalConsumed` refuses forged or foreign evidence**:
   register-only evidence (no consumption), a different record's receipt,
   and non-journalVerified evidence all refuse.
6. **The plan never carries the custody seed**; it round-trips JSON and
   still verifies; the honest flags are pinned in the frozen guardrails
   (`humanDecision: 'REQUIRED'`, `learningPromoted: false`,
   `zeroModelCalls: true`, `zeroRemoteCalls: true`, `collectsNothing:
   true`, `automaticRecovery: false`, `billionUsersProven: false`).

## Defects found and paid down during this story

- **(self-review, pre-run):** a convoluted `verifiedAtMs` check in the
  verify path (comparing against a field the envelope doesn't carry) was
  simplified to the real property before the first run; a placeholder
  `void` line was removed.
- **(caught by strict tsc, test-side):** an assertion on a property the
  plan doesn't carry (`plan.ok`) was replaced with a real assertion; two
  convoluted test-helper constructions were simplified before the run.

## Disclosed residuals

- **Authentication is NOT identity proof** — the 12D-233 residual carries
  verbatim: it authenticates the CHAIN, not the operator.
- **Verification consumes the receipt** — the durable proof afterwards is
  the decision record + the evidence packet; the receipt can never be
  re-authenticated. Keep both (the suite documents the exact refusal a
  second attempt gets).
- The verification plan envelope deliberately MIRRORS the 12D-247 plan
  shape (`policyVersion, decisionReceiptSha256, decisionRecord, steps`)
  so both lifecycle halves carry the same envelope.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Exact files

- `services/ai/runtime/offline-team/xiv-approval-verification.ts` (new)
- `services/ai/runtime/offline-team/xiv-approval-verification.test.ts`
  (new, 7 tests)
- `docs/ai-agents/12d-248-approval-verification-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-248`, `typecheck:12d-248` added
  in the 12D-248 commit.
- `.gitlab-ci.yml` — `typecheck:12d-248`, `test:12d-248` appended in the
  same commit.

## Exact commands and local results

```
npm run test:12d-248      # RAN: 7/7 pass
npm run typecheck:12d-248 # RAN: strict, exit 0
```

Sibling regressions this cycle (run from `services/ai`): 12d-233 13/13,
12d-236 13/13, 12d-237 12/12, 12d-238 11/11, 12d-239 13/13, 12d-240
13/13, 12d-241 13/13, 12d-242 14/14, 12d-244 14/14, 12d-247 12/12 —
all green.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no installer execution (the CEO-pasted CUDA .exe remains
unexecuted — see the fourth reference-inbox drop). The commit stages
ONLY the files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Direction from the CEO actioned by this story

"Every soul on earth will be in control of their own destiny" — the
approval lifecycle is that control, structurally: a decision is recorded
once (12D-247), verified once (12D-248), and every refusal is reported
honestly rather than retried into silence. The CEO's "gather data for
free to train agents" direction is recorded in the daily report with its
honest boundary: no training capability exists in any shipped contract
(`modelCalls: 0`, `learningPromoted: false`), no bulk scanning is claimed,
and future ingestion stories will carry license care and per-use fetches.