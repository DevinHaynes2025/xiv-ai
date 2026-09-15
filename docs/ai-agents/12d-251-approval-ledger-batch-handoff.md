# 12D-251 — XIV OS Approval Ledger Batch Summary (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-approval-ledger-batch.ts` + 7
focused tests). **TEST RUN DISCLOSED**: `test:12d-251` = **7/7 pass**,
`typecheck:12d-251` (strict) = **exit 0**; sibling regressions all green
(exact counts below). CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`).
Reviewers: CLAUDE_CODE (self-review; pre-run cleanups listed below).
GROK_XAI review PENDING — never fabricated.

## What it is

Batch mode over a LOCAL directory of decision records, on top of the
12D-249 read-only summary. The operator holds many decision records as
JSON files; `summarizeApprovalLedgerBatch({store, seed, recordsDir})`
summarizes ALL of them in one replay-gated, read-only pass, in
deterministic sorted-filename order.

Fail-closed shape:

1. **Replay-before-read carries over verbatim**: the WHOLE journal
   replays through the 12D-236 gates BEFORE the directory is read —
   a tampered journal (one flipped receipt hex char) or a wrong seed
   refuses the batch, asserted.
2. **ANY malformed entry refuses the WHOLE batch, by name**: bad JSON
   (`failed to parse batch record file b-broken.json`), a non-JSON file
   or subdirectory (`non-record entries in the records directory:
   notes.txt`), or a wrong-shape record (the 12D-249 exact-shape gate) —
   never a partial summary that silently drops decisions.
3. **An EMPTY records directory refuses** — a batch over zero records is
   an operator mistake, not a success with zero findings; a missing
   directory refuses too.
4. **DETERMINISTIC ORDER**: records load in sorted-filename order, so the
   decisions array is byte-stable across runs (asserted — and the suite
   feeds the records in REVERSE filename order to prove the sort is the
   module's, not the filesystem's).
5. **READ-ONLY, asserted**: the journal is never written and the records
   directory is only ever read.
6. **Absence inside the batch is reported honestly** — a record the
   journal does not contain reports `registered: false` (asserted).
7. Byte-identical output to a direct `summarizeApprovalLedger` with the
   same records in the same order; deterministic across two runs; the
   seed never serializes; JSON round-trips. Honest flags pinned in frozen
   guardrails (`humanDecision: 'REQUIRED'`, `learningPromoted: false`,
   `zeroModelCalls: true`, `zeroRemoteCalls: true`, `collectsNothing:
   true`, `automaticRecovery: false` — one bad file stops the batch; a
   human decides — `billionUsersProven: false`).

## Defects found and paid down during this story

- **(self-review, pre-run):** the test draft used `require()` inside an
  ESM module — the 12D-244 lesson, caught before the first run and
  replaced with a top-level import; a wrong offender-list expectation
  (the `notes.txt` case) and two unused imports were also fixed pre-run.
- **(caught by strict tsc, module-side):** `readdirSync(dir,
  {withFileTypes: false})` widens to a Buffer union under current
  @types/node — replaced with plain `readdirSync(dir)`.
- **(caught by the suite, test-side):** the absence test indexed
  decisions by position and forgot the sorted-filename contract
  (`absent.json` sorts before `held.json`); assertions now look rows up
  by packet id. The module was right; the test was wrong.

## Disclosed residuals

- Only `.json` files are accepted, and EVERY file in the directory must
  be one — the operator points the batch at a directory of records,
  nothing else (a directory containing notes or subdirectories refuses).
- The summary reflects THIS journal only (12D-249 residual verbatim).
- The batch is derived state and proves nothing by itself; journal
  authenticity remains `verifyCustodySession` with the operator's seed,
  out of band.
- CLI adoption of the batch mode (a `--records-dir` sibling of the
  12D-250 CLI) is the natural next story; this commit ships the module
  contract only.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Exact files

- `services/ai/runtime/offline-team/xiv-approval-ledger-batch.ts` (new)
- `services/ai/runtime/offline-team/xiv-approval-ledger-batch.test.ts`
  (new, 7 tests)
- `docs/ai-agents/12d-251-approval-ledger-batch-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-251`, `typecheck:12d-251` added
  in the 12D-251 commit.
- `.gitlab-ci.yml` — `typecheck:12d-251`, `test:12d-251` appended in the
  same commit.

## Exact commands and local results

```
npm run test:12d-251      # RAN: 7/7 pass
npm run typecheck:12d-251 # RAN: strict, exit 0
```

Sibling regressions this cycle (run from `services/ai`): 12d-233 13/13,
12d-236 13/13, 12d-237 12/12, 12d-238 11/11, 12d-239 13/13, 12d-240
13/13, 12d-241 13/13, 12d-242 14/14, 12d-244 14/14, 12d-247 12/12,
12d-248 7/7, 12d-249 9/9, 12d-250 8/8 — all green. 159 tests this
cycle, 0 failures.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no installer execution. The GitHub CLI install (CEO-authorized)
is complete and awaiting the CEO's interactive `gh auth login`; the
staged lockdown commands have NOT run and will not run until the CEO
confirms authentication. The commit stages ONLY the files above and
never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Direction from the CEO actioned by this story

"Every soul on earth will be in control of their own destiny" — control
at portfolio scale requires a readable window over ALL of it, not one
decision at a time. The batch summary is that window: every held
decision, its status, one honest packet, with any malformed input
refusing the whole batch by name rather than being skipped. Next
candidates: the batch CLI (`--records-dir`), or the XIV OS web
front-end story-shell (installs need per-use authorization).