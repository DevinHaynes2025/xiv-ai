# 12D-133 — Release-Lineage Consolidation & Validation Ledger (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/release-lineage-ledger.ts` +
`release-lineage-ledger.test.ts`; 11/11 tests + typecheck green; sibling
suites re-run green — 12D-126 17/17, 12D-129 12/12, 12D-130 9/9, 12D-131 9/9,
12D-221 12/12, 12D-134 10/10, 12D-113 audit 9/9). CI IS NOT CLAIMED PASSED:
GitLab CI remains quota-blocked (`ci_quota_exceeded`) — the `.gitlab-ci.yml`
wiring was appended but no pipeline has run.

Numbering note: this story number was REASSIGNED by the CEO from an
instruction-evidence bridge that had been built locally under 12D-133; the
bridge was renumbered 12D-134 in an unpushed commit before anything was
pushed, so no published lineage ever carried two different stories under the
12D-133 number.

## What it is

The private project has ~301 open merge requests, many stacked and lacking
native CI evidence; a new parallel branch would add validation debt. This
story builds the READ-ONLY release ledger that inventories that reality and
proposes — never executes — one canonical integration path.

### Requirement coverage (from the story spec)

- **Read-only inventory** — `buildReleaseLedger` consumes a DECLARED open-MR
  snapshot; per row it records source branch, target branch, exact 40-hex
  head SHA, parent MR (stacking), story id, pipeline id, declared CI status,
  conflict flag, and opened-at. The row shape is exact-keyed: an MR
  description, note, or any other confidential content is rejected outright
  (regression-tested) and can never enter the ledger.
- **Six classifications** — NATIVE_CI_PASSED, LOCAL_ONLY, NOT_EXECUTED,
  QUOTA_BLOCKED, SUPERSEDED, CONFLICTED, derived in a fixed precedence
  (SUPERSEDED > evidence > declared-abence > conflict-order per row).
- **CI claims never trusted** — a NATIVE_CI_PASSED claim must be backed by
  DECLARED pipeline evidence (pipelineId + status PASSED) in the same build;
  an unbacked or contradicted claim is recorded as a FALSE_CI_CLAIM finding
  and the row is downgraded — an unbacked claim becomes NOT_EXECUTED and a
  contradicted one takes the evidence status (regression-tested both ways).
- **Lineage findings (all deterministic, all regression-tested)** —
  MISSING_PARENT (parent not in inventory), SHA_DRIFT and
  MISSING_DECLARED_HEAD (inventory head vs the declared measured branch
  heads, e.g. from `git ls-remote`), DUPLICATE_STORY + SUPERSEDED_BY (the
  newest duplicate carries the story), CROSS_LINEAGE_CONTAMINATION (one
  story id spanning distinct lineage trees), DIVERGENT_SOURCE (one source
  branch into several targets), EXCESSIVE_STACK_DEPTH (depth > 8), ABANDONED
  (open > 30 days with no CI evidence), and NO_NATIVE_CI_HEAD.
- **Structural failures (throw)** — lineage cycles, self-parents, duplicate
  iids, non-40-hex SHAs, malformed story ids, future timestamps, duplicated
  pipeline evidence, and off-shape rows.
- **Canonical path, fail-closed** — from the last NATIVE-CI-VALIDATED head
  (newest verified-PASSED, non-conflicted row) the ledger walks the parent
  chain parent-first and PROPOSES it; it merges, rebases, and executes
  nothing. With no validated head it refuses to propose (NO_NATIVE_CI_HEAD
  finding) and falls back to the declared integration head — it never
  invents a starting point. If the validated head is itself superseded by a
  newer, CI-less duplicate, the path basis says so explicitly (CAUTION note).
- **Issues #98/#99** — recorded verbatim as CHANGES_REQUIRED and
  DIAGNOSTIC_ONLY respectively; the ledger never opens, edits, or closes
  issues.
- **Nothing modified** — frozen guardrail
  `neverClosesMergesRebasesRetriesDeploysOrModifiesBranchesOrIssues`; the
  report states it in plain words.
- **Two outputs** — `ledgerToJson` (stable machine-readable JSON, rows
  sorted by iid, titles excluded) and `composeCeoReport` (CEO-safe Markdown:
  canonical path, issue dispositions, classified MR table with REDACTED
  bounded titles, findings, and the did-NOT-do list). Both are deterministic
  and both are regression-tested to exclude secret-shaped content
  (`sk-…`, `api_key=`) from titles.
- **No permissions** — `zeroModelCalls`/`zeroRemoteCalls`,
  `automaticRecovery: false`, `humanDecision: 'REQUIRED'` structural and
  frozen; no provider call, no traffic movement, no production mutation, no
  merge, no deployment.

### Review findings paid down during this build

1. **Superseded validated head (adversarial review)** — the canonical path
   could silently start from a CI-validated head that a newer duplicate had
   superseded. Closed: the path basis now carries an explicit CAUTION when
   the validated head is superseded by a CI-less duplicate.
2. **Test fixture self-consistency** — the SHA-drift test originally
   recomputed the measured head from the drifted row (no mismatch possible);
   it now pins the original measured head. Same discipline as 12D-221's
   tamper-fixture lesson.

Residuals (disclosed):
- The MR inventory is DECLARED input: no GitLab API client or token exists in
  this runtime, and `glab`/`gh` CLIs are absent on the build host, so this
  module never fetches the ~301 open MRs itself. Populating the real
  inventory requires the operator to export the MR list out-of-band (glab /
  GitLab API read) — the ledger is the consumption contract. Branch heads,
  by contrast, are measurable today: `git ls-remote --heads gitlab` returned
  **529 heads** (measured 2026-09-14), which is the real scale of branch
  sprawl the ledger is built to inventory.
- The MR inventory is DECLARED input; the ledger trusts the shape gates and
  cross-checks (40-hex SHAs, measured-head comparison) but cannot verify MR
  metadata without API access.
- `NO_NATIVE_CI_HEAD` and cross-tree findings use sentinel MR ids (0, or the
  lineage-root iid) for anchoring; the detail strings are the authoritative
  content.
- Restoring GitLab runner capacity, validating one canonical exact-head
  lineage, and the review chain (independent review → CTO approval → CEO
  approval) are OPERATOR steps this story cannot perform.

## Exact files

- `services/ai/runtime/offline-team/release-lineage-ledger.ts` (new)
- `services/ai/runtime/offline-team/release-lineage-ledger.test.ts` (new)
- `services/ai/package.json` (`test:12d-133`, `typecheck:12d-133`)
- `.gitlab-ci.yml` (`typecheck:12d-133`, `test:12d-133` appended)
- `docs/ai-agents/12d-134-instruction-evidence-bridge-handoff.md` (the
  renumbered sibling story, same branch)

## Exact commands and local results

```
npm run typecheck:12d-133   # OK
npm run test:12d-133        # 11/11 pass
npm run test:12d-126        # 17/17 pass
npm run test:12d-129        # 12/12 pass
npm run test:12d-130        # 9/9 pass
npm run test:12d-131        # 9/9 pass
npm run test:12d-221        # 12/12 pass
npm run test:12d-134        # 10/10 pass
npm run test:12d-113        # 9/9 pass (guardrail audit)
git ls-remote --heads gitlab   # 529 branch heads (measured ground truth)
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status and CEO priority order

Per the CEO's priority order: (1) the observed-evidence collector results
(renumbered 12D-221) finished and captured
(handoff `12d-221-declared-evidence-collector-handoff.md`); (2) the
consolidation ledger is built and green locally; (3) RESTORING GITLAB RUNNER
CAPACITY is an operator step — this story cannot fix the quota; (4) validating
one canonical exact-head lineage requires the real MR snapshot (see
residuals); (5) independent review, CTO approval, then CEO approval remain
open — reviewer receipts: CLAUDE_CODE. GROK_XAI PENDING — never fabricated.
Awaiting CEO authorization for any merge/deploy (standing rule). No provider
call, no traffic movement, no production mutation, no merge, no deployment,
no learning promotion occurred in this story; `billionUsersProven: false`.