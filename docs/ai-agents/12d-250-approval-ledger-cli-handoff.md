# 12D-250 — XIV OS Approval Ledger CLI (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-approval-ledger.cli.ts` + 8
focused tests). **TEST RUN DISCLOSED**: `test:12d-250` = **8/8 pass**,
`typecheck:12d-250` (strict) = **exit 0**; sibling regressions all green
(exact counts below). CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`).
Reviewers: CLAUDE_CODE (self-review + adversarial review of a CEO-supplied
draft; findings paid down below). GROK_XAI review PENDING — never
fabricated.

## What it is

The human adoption layer for the 12D-249 approval ledger summary, in the
12D-238 CLI pattern (the custody operator CLI):

```
node xiv-approval-ledger.cli.ts --journal=<path> --seed=<seed> --decision-record=<path>
```

The operator hands it a custody journal, the custody seed, and ONE
decision-record file held on local disk; the CLI replays the whole journal
through the 12D-249 fail-closed gates (replay-before-read), re-derives the
record's receipt, and prints a frozen JSON packet carrying the 12D-249
summary plus the honest flags. Failures print an honest error packet to
stderr and exit 2.

Fail-closed shape:

1. **Strict args, exact keys**: `--key=value` only, no duplicates,
   malformed names refuse, and UNKNOWN keys REFUSE (a step stricter than
   12D-238, applying the 12D-249 exact-keys discipline to the CLI surface
   — a typo'd or smuggled flag refuses by name rather than being
   ignored). Only the FIRST `=` splits, so Windows paths containing `=`
   survive verbatim.
2. **Missing arguments refuse individually by name** (seed →
   decision-record → journal order) — never a blanket usage message that
   hides which argument was wrong.
3. **Local-plane boundary**: the decision record is read strictly from
   local disk (`readFileSync`), never fetched, never sent. Gate ordering
   is honest and layered: the journal replay runs BEFORE the record is
   shape-checked — so a bad journal path refuses at "no custody journal
   found" and a bad record refuses at the 12D-249 exact-shape gate only
   against a replayable journal (both asserted).
4. **READ-ONLY, asserted at the file layer**: the journal file is
   byte-identical (Buffer.compare) before and after a run. The CLI never
   generates receipts, never writes, never picks a mode.
5. **Refusals propagate through the CLI**: a wrong seed and a tampered
   journal (one flipped receipt hex char) both refuse THROUGH the CLI —
   proven end-to-end with a real journal file on disk.
6. **HAPPY PATH proven end-to-end**: a real journal built through the
   honest lifecycle (12D-247 register → 12D-248 verify via the 12D-244
   runner on real disk), the record exported as JSON, and the CLI packet
   compared byte-for-byte to a direct `summarizeApprovalLedger` of the
   same inputs. `registered: true`, `verified: true`,
   `verifiedAtMs` from the journal's authenticate moment.
7. **The seed never serializes into any packet** (success or error);
   `mainApprovalLedgerCli` emits an error packet with `ok: false` and
   sets exit code 2 — asserted by intercepting stderr.

## Defects found and paid down during this story

- **(adversarial review of the CEO-supplied draft, pre-adoption):** the
  draft called `summarizeApprovalLedger({store, seed, decisionRecord})` —
  the 12D-249 API takes `records` (an array); as written every invocation
  would have refused at the exact-keys gate. Fixed to
  `{store, seed, records: [record]}`.
- **(draft):** unknown arguments were silently accepted — now refused by
  name (`unknown argument --X`).
- **(draft):** `arg.split('=', 2)` truncated values containing `=` (real
  Windows paths can) — replaced with the 12D-238 `indexOf('=')` parser.
- **(draft):** no happy-path test, no through-CLI refusal tests, no
  read-only assertion — all added.
- **(caught by the suite, test-side):** three of my own first-draft test
  expectations assumed the wrong refusal order (the CLI refuses
  per-argument in use order; the replay gate runs before the record shape
  gate) — the tests were wrong, the CLI was right, expectations fixed.
- **(caught by the suite, module-side):** a blanket "all three arguments
  required" count-check short-circuited before `req()` could name the
  missing argument, leaving `req()` dead code — removed in favor of the
  12D-238 per-argument refusals.
- **(caught by strict tsc, pre-run):** the test imported
  `OperatorCustodyRegistry` from the journal module (not re-exported
  there); fixed to `./operator-custody-registry`.

## Disclosed residuals

- **One decision record per invocation** — a batch/list mode is a future
  story; the CLI is deliberately one action, one packet (12D-238
  discipline).
- The CLI's `verifyApprovalLedgerSummary` re-check adds a second replay
  of the journal per invocation (two replays, not one). Honest cost of
  the belt-and-braces self-check; disclosed, not hidden.
- All 12D-233/236/249 residuals carry verbatim: possession of journal +
  seed is full custody control; registration is not issuance proof; the
  summary reflects THIS journal only; custody authenticates the CHAIN,
  not the operator.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Exact files

- `services/ai/runtime/offline-team/xiv-approval-ledger.cli.ts` (new)
- `services/ai/runtime/offline-team/xiv-approval-ledger.cli.test.ts`
  (new, 8 tests)
- `docs/ai-agents/12d-250-approval-ledger-cli-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-250`, `typecheck:12d-250` added
  in the 12D-250 commit.
- `.gitlab-ci.yml` — `typecheck:12d-250`, `test:12d-250` appended in the
  same commit.

## Exact commands and local results

```
npm run test:12d-250      # RAN: 8/8 pass
npm run typecheck:12d-250 # RAN: strict, exit 0
```

Sibling regressions this cycle (run from `services/ai`): 12d-233 13/13,
12d-236 13/13, 12d-237 12/12, 12d-238 11/11, 12d-239 13/13, 12d-240
13/13, 12d-241 13/13, 12d-242 14/14, 12d-244 14/14, 12d-247 12/12,
12d-248 7/7, 12d-249 9/9 — all green. 152 tests this cycle, 0 failures.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no installer execution (the CEO-pasted CUDA .exe remains
unexecuted; the CEO-authorized GitHub CLI install is a separate,
explicitly-approved action and was still awaiting elevation at
commit time). The commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Direction from the CEO actioned by this story

"Every soul on earth will be in control of their own destiny" — control
requires a readable window. This CLI is that window for a single
decision: one command, one honest JSON packet, refusals that name
themselves, and a journal it will never write to. Next candidates: a
batch mode over a directory of decision records, or the XIV OS web
front-end story-shell (installs need per-use authorization).