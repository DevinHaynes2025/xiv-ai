# 12D-252 — XIV OS Approval Ledger Batch CLI (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-approval-ledger-batch.cli.ts` + 8
focused tests). **TEST RUN DISCLOSED**: `test:12d-252` = **8/8 pass**,
`typecheck:12d-252` (strict) = **exit 0**; sibling regressions all green
(exact counts below). CI IS NOT CLAIMED PASSED
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review; pre-run
cleanups listed). GROK_XAI review PENDING — never fabricated.

## What it is

The batch adoption layer: `--journal=<path> --seed=<seed>
--records-dir=<path>` in the 12D-238/12D-250 CLI pattern, over the
12D-251 whole-directory batch summary. One invocation, one frozen JSON
packet, every decision in the directory reported in deterministic
sorted-filename order with its registered/verified status.

Fail-closed shape (12D-250 discipline carries verbatim): strict
`--key=value` args, unknown keys refuse BY NAME (the single-record
`--decision-record` flag is explicitly unknown here — this is the batch
CLI), missing arguments refuse individually, the records directory is
read strictly from local disk, any malformed entry refuses the whole
batch (12D-251), an empty/missing directory refuses, the CLI never
writes, failures print an honest error packet to stderr and exit 2, and
the seed never serializes into any packet.

## Defects found and paid down during this story

- **(self-review, pre-run, twice-caught class):** the module's first
  draft contained placeholder expressions (a nonsense conditional cast on
  `recordsDir`, a fabricated verifier stub referencing a nonexistent
  `policyVersionCheck` field, mid-file imports). Rewritten cleanly BEFORE
  the first run — placeholders never survive to a test run on this
  branch.
- **(self-review, pre-run, test-side):** an `await import('fs')` inside a
  non-async test callback and a `require('fs')` helper — the ESM lesson
  paid down for the third time this session; replaced with top-level
  imports.

## Disclosed residuals

- The self-check runs a SECOND full replay of the journal (re-derive and
  byte-compare) — honest cost of belt-and-braces; disclosed.
- All 12D-233/236/249/251 residuals carry verbatim: possession of
  journal + seed is full custody control; registration is not issuance
  proof; the summary reflects THIS journal only; custody authenticates
  the CHAIN, not the operator.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Exact files

- `services/ai/runtime/offline-team/xiv-approval-ledger-batch.cli.ts` (new)
- `services/ai/runtime/offline-team/xiv-approval-ledger-batch.cli.test.ts`
  (new, 8 tests)
- `docs/ai-agents/12d-252-approval-batch-cli-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-252`, `typecheck:12d-252`
- `.gitlab-ci.yml` — `typecheck:12d-252`, `test:12d-252`

## Exact commands and local results

```
npm run test:12d-252      # RAN: 8/8 pass
npm run typecheck:12d-252 # RAN: strict, exit 0
```

One pre-run defect caught by strict tsc: `ApprovalLedgerSummary` is
exported by `./xiv-approval-ledger`, not re-exported by the batch
module — import fixed, module logic unchanged.

DISCLOSURE (honest flags): a classifier outage intermittently blocked
Bash during authoring; per standing rules it was waited out and retried,
never bypassed, and NO command results above were claimed until they
actually ran (the pre-run draft of this handoff carried an explicit
do-not-commit-until-tested placeholder, now replaced by the real
results).

Sibling regressions this cycle (run from `services/ai`): 12d-233 13/13,
12d-236 13/13, 12d-237 12/12, 12d-238 11/11, 12d-239 13/13, 12d-240
13/13, 12d-241 13/13, 12d-242 14/14, 12d-244 14/14, 12d-247 12/12,
12d-248 7/7, 12d-249 9/9, 12d-250 8/8, 12d-251 7/7 — all green. 167
tests this cycle, 0 failures.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no installer execution. The commit stages ONLY the files above
and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

The XIV OS web front-end story-shell (the Next.js scaffold was blocked
behind the same classifier outage and the CEO's pending `gh auth login`;
installs need per-use authorization, which the CEO has given), or the
12D-243/12D-245 operator questions.