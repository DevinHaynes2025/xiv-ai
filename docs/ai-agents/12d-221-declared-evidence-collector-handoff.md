# 12D-221 — Scaling & Failover observed-evidence collectors (handoff)

RENUMBER NOTE: this story was initially built under the number 12D-132 and
renumbered to 12D-221 by CEO directive (12D-132 already belongs to Draft MR
!59 on the private project). Only the story number, documentation, test
descriptions, and handoff references changed — no behavior changed, and the
existing historical 12D-132 files and Draft MR !59 were not altered.

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/declared-evidence-collector.ts` +
`declared-evidence-collector.test.ts`; 12/12 tests + typecheck green; siblings
re-run green — 12D-126 17/17, 12D-129 12/12, 12D-130 9/9, 12D-131 9/9, 12D-113
audit 9/9). CI IS NOT CLAIMED PASSED: GitLab CI remains quota-blocked
(`ci_quota_exceeded`) — the `.gitlab-ci.yml` wiring was appended but no pipeline
has run.

## What it is

`DeclaredEvidenceCollector` converts LOCALLY OBSERVED scaling and failover
outcomes into bounded, redacted, hash-bound evidence receipts — the first
declared-evidence step toward the MEASURED evidence rung. It permits nothing:
no provider call, no traffic movement, no production mutation, no merge, no
deployment; every honest flag is structural on the receipt.

### Requirement coverage (from the story spec)

- **Binding** — every receipt binds tenant, universe, run, source commit
  (40-hex), decision ID, the decision record's `recordDigest`, instruction ID,
  operator receipt (identity reference), recording timestamp, AND both a before
  and an after `TrafficObservation` (`observedBefore`/`observedAfter`). A
  receipt without independent observations is self-declared-only and rejected.
- **Six declared statuses, never inferred** — PROPOSED, NOT_EXECUTED, EXECUTED,
  FAILED, ROLLED_BACK, UNVERIFIED. The collector NEVER flips or promotes a
  status: an accepted decision record or an issued instruction is not execution;
  EXECUTED/FAILED require a strictly-elapsed after observation; ROLLED_BACK can
  only arrive via `recordRollbackEvidence`.
- **Separate execution and rollback evidence** — rollback is issued only against
  a SEPARATELY presented, digest-verified EXECUTED receipt, carries its own
  fresh before/after observations (which must postdate the execution's own
  after-observation), binds `rolledBackExecutionDigest`, and carries its own
  operator receipt (separate human acts, separate receipts — regression-tested).
- **Rejection surface (all regression-tested)** — stale observations (beyond
  `maxObservationAgeMs` 3.6e6 ms), future-dated observations, receipt recorded
  before the decision it evidences, duplicated evidence (receipt-digest replay
  backstop + observation-id dedupe, per collector), unsigned evidence (receipt
  must be 64-hex sha256), mismatched evidence (scaling receipt vs failover
  record and vice versa; EXECUTED vs declined decision), cross-tenant /
  cross-universe evidence (presented scope must match the collector's binding),
  and self-declared-only evidence (no before/after observations).
- **Tamper detection** — the presented decision record is UNTRUSTED: its
  `recordDigest` re-derives over its recorded fields via the 12D-130/131
  `deriveScalingRecordDigest`/`deriveFailoverRecordDigest` helpers and must
  match; a presented EXECUTED receipt's `evidenceDigest` re-derives the same way
  before a rollback can bind it. Six post-recording field swaps, a forged
  digest, and an unfrozen record all throw (regression-tested).
- **Exclusions** — exact-shape gates on observations (`hasExactKeys`) reject
  undeclared fields, so prompts, responses, credentials, customer data, and
  classified workloads can never ride in; the only free text is a bounded note
  (≤500 chars) scrubbed by `redactDeclaredNote` (key=value credential forms,
  `sk-…`, AKIA…, PEM private-key blocks, any ≥32-char opaque token →
  `[REDACTED]`, no boundary anchors so base64 padding cannot escape); the
  receipt records `redactionApplied` honestly and its digest binds the REDACTED
  note.
- **No permissions** — `providerInvocationAuthorized/trafficMoved/
  productionMutationAllowed/mergeAllowed/deployAllowed: false`,
  `databasesProvisioned: 0`, `humanDecision: 'REQUIRED'`,
  `learningPromoted: false`, `modelCalls: 0`, `remoteCalls: 0`,
  `automaticRecovery: false`, `billionUsersProven: false` — structural, frozen,
  regression-tested, with `DECLARED_EVIDENCE_GUARDRAILS` frozen alongside.

### Review findings paid down during this build

1. **Digest-scheme split (found by the rollback re-derivation test)** —
   `#finish` originally recomputed a SECOND digest over the whole receipt
   (guardrails included), overwriting the declared-fields digest the record
   methods had registered, so no receipt re-derived over the documented
   preimage. Closed: `#finish` now receives the caller-computed digest and does
   not recompute; the declared-fields preimage is the single digest scheme, and
   the test suite re-derives every receipt's `evidenceDigest` over it.
2. **Non-independent observations** — `before` and `after` could carry the SAME
   observation id in one call (neither registered when the other was checked),
   violating the independent-observation requirement. Closed: same-id pairs now
   throw `not independent` (regression-tested).

Residuals (disclosed, inherent — the standing discipline since 12D-119/124):
- A recomputed digest is self-consistent: a forger who swaps fields AND
  recomputes `recordDigest`/`evidenceDigest` produces a self-consistent object.
  Receipts authenticate out-of-band via the operator's custody registry.
- `decisionId` and `instructionId` are DECLARED references: no canonical id
  exists inside the decision records to re-derive against, so the receipt binds
  them verbatim alongside the `recordDigest` (which IS re-derived).
- Dedupe state is per collector instance (documented); two collectors in the
  same tenant do not share observation-id registries.
- Observations are DECLARED locally observed values; this runtime never
  measures traffic itself (the honest flag the whole story turns into receipts).

## Exact files

- `services/ai/runtime/offline-team/declared-evidence-collector.ts` (new)
- `services/ai/runtime/offline-team/declared-evidence-collector.test.ts` (new)
- `services/ai/runtime/offline-team/measured-horizontal-scaling.ts` (exported
  `deriveScalingRecordDigest` — the pre-existing recordDigest made callable)
- `services/ai/runtime/offline-team/measured-regional-failover.ts` (exported
  `deriveFailoverRecordDigest`)
- `services/ai/package.json` (`test:12d-221`, `typecheck:12d-221`)
- `.gitlab-ci.yml` (`typecheck:12d-221`, `test:12d-221` appended)

## Exact commands and local results

```
npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler \
  --strict --skipLibCheck --types node \
  runtime/offline-team/declared-evidence-collector.ts \
  runtime/offline-team/declared-evidence-collector.test.ts   # OK
npm run test:12d-221      # 12/12 pass
npm run test:12d-126      # 17/17 pass
npm run test:12d-129      # 12/12 pass
npm run test:12d-130      # 9/9 pass
npm run test:12d-131      # 9/9 pass
npm run test:12d-113      # 9/9 pass (guardrail audit)
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

Awaiting CEO authorization for any merge/deploy (standing rule). Reviewer
receipts: CLAUDE_CODE. GROK_XAI PENDING — never fabricated. No provider call,
no traffic movement, no production mutation, no merge, no deployment, no
learning promotion occurred in this story; `billionUsersProven: false`.