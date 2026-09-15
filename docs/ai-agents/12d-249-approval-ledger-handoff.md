# 12D-249 — XIV OS Approval Ledger Summary (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-approval-ledger.ts` + 9 focused
tests). **TEST RUN DISCLOSED**: `test:12d-249` = **9/9 pass**,
`typecheck:12d-249` (strict) = **exit 0**; sibling regressions all green
(exact counts below). CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`).
Reviewers: CLAUDE_CODE (self-review; one pre-run fix listed below).
GROK_XAI review PENDING — never fabricated.

## What it is

The operator's READ-ONLY review surface over the approval lifecycle:
12D-247 RECORDS a decision (register), 12D-248 AUTHENTICATES it later
(verify) — 12D-249 SUMMARIZES what the custody journal durably holds.
`summarizeApprovalLedger({store, seed, records})` reports, per
operator-held decision record: `decision, decidedBy, decidedAtMs,
receiptSha256, registered, registeredAtMs, verified, verifiedAtMs`.

Fail-closed shape:

1. **REPLAY BEFORE READ**: the WHOLE journal replays through the 12D-236
   fail-closed gates (`replayCustodyJournal`) BEFORE anything is parsed —
   a tampered line, a wrong seed, or a divergent ledger refuses the
   summary outright (asserted: one flipped hex char in a receipt breaks
   the digest chain and refuses; a wrong genesis seed refuses).
2. **READ-ONLY**: the store is only ever loaded, never saved — asserted
   byte-identical journal lines before and after both summarize AND
   verify. The ledger reviews; it never mutates.
3. **Receipts are RE-DERIVED** from the held records
   (`deriveApprovalReceipt`, 12D-247), never accepted as claims; a record
   the journal does not contain reports `registered: false` — absence is
   reported honestly, never papered over (asserted).
4. **Impossible states refuse**: a journal entry registered by an actor
   the record contradicts refuses with both ids named (the suite builds
   this impostor state through the REAL `appendCustodyOp` gates — it is
   unreachable via the honest APIs because the receipt binds decidedBy);
   duplicate register/authenticate entries for one receipt refuse (a
   receipt registers once and verifies exactly once); an authenticate
   before its decision refuses.
5. **Fixed purpose only**: only entries under
   `xiv-os-human-approval` count as approval entries
   (`totalApprovalEntries`); other custody ops still count in
   `journalOps` (asserted with a mixed journal).
6. **`verifyApprovalLedgerSummary(summary, opts)`** re-derives the
   summary through the same replay gate and refuses a tampered, foreign,
   or stale summary; a summary with smuggled keys, an unpinned
   `ledgerVerified`, or altered guardrails refuses at the shape gate.
7. The summary is frozen, deterministic (same journal + records → same
   bytes, asserted), JSON round-trips and still verifies, and NEVER
   carries the seed (asserted on the serialization for both the true and
   a wrong seed). Honest flags pinned in frozen guardrails:
   `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
   `zeroModelCalls: true`, `zeroRemoteCalls: true`, `collectsNothing:
   true`, `automaticRecovery: false` (a tampered journal refuses; a
   human decides), `billionUsersProven: false`.

## Defects found and paid down during this story

- **(caught by strict tsc, pre-run):** the test imported
  `OperatorCustodyRegistry` from the journal module — it is only
  re-imported there, not exported; fixed to import from
  `./operator-custody-registry`. Module unchanged.

## Disclosed residuals

- **The summary reflects THIS journal only** — a decision registered in
  another journal file reports `registered: false` here. Cross-journal
  reconciliation remains a future story (single-writer discipline
  carries from 12D-236).
- **The summary is derived state and proves nothing by itself** — the
  durable proofs are the tamper-evident journal and the runner's
  evidence packets (12D-244). Journal authenticity remains
  `verifyCustodySession` with the operator's seed, out of band.
- The summary is NOT identity proof — the 12D-233 residual carries
  verbatim: custody authenticates the CHAIN, not the operator.
- `verifiedAtMs` is the journal's authenticate `nowMs` — the moment the
  receipt was consumed, taken from the replay-verified journal itself.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Exact files

- `services/ai/runtime/offline-team/xiv-approval-ledger.ts` (new)
- `services/ai/runtime/offline-team/xiv-approval-ledger.test.ts`
  (new, 9 tests)
- `docs/ai-agents/12d-249-approval-ledger-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-249`, `typecheck:12d-249` added
  in the 12D-249 commit.
- `.gitlab-ci.yml` — `typecheck:12d-249`, `test:12d-249` appended in the
  same commit.

## Exact commands and local results

```
npm run test:12d-249      # RAN: 9/9 pass
npm run typecheck:12d-249 # RAN: strict, exit 0
```

Sibling regressions this cycle (run from `services/ai`): 12d-233 13/13,
12d-236 13/13, 12d-237 12/12, 12d-238 11/11, 12d-239 13/13, 12d-240
13/13, 12d-241 13/13, 12d-242 14/14, 12d-244 14/14, 12d-247 12/12,
12d-248 7/7 — all green. 144 tests this cycle, 0 failures.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no installer execution (the CEO-pasted CUDA .exe remains
unexecuted). The commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Direction from the CEO actioned by this story

"Every soul on earth will be in control of their own destiny" — a
control surface must be INSPECTABLE. 12D-249 is the operator's window
into the decision ledger: every recorded approval and rejection, its
registration and verification moments, read-only, with absence reported
honestly and every impossible state refusing rather than being smoothed
over. Next candidates: an operator CLI wrapping the summary (12D-238
pattern), or the XIV OS web front-end story-shell (installs need per-use
authorization).