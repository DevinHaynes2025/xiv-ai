# 12D-133 — Instruction-evidence bridge (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/instruction-evidence-bridge.ts` +
`instruction-evidence-bridge.test.ts`; 10/10 tests + typecheck green; siblings
re-run green — 12D-126 17/17, 12D-129 12/12, 12D-130 9/9, 12D-131 9/9,
12D-132 12/12, 12D-113 audit 9/9). CI IS NOT CLAIMED PASSED: GitLab CI remains
quota-blocked (`ci_quota_exceeded`) — the `.gitlab-ci.yml` wiring was appended
but no pipeline has run.

## What it is

`DeclaredEvidenceIntake` is the instruction-gated evidence intake that closes
the loop the 12D-130/131 execution bridges opened, paying down 12D-132's
disclosed residual (`decisionId`/`instructionId` were DECLARED references no
canonical id re-derived against). The intake issues a 12D-132 evidence receipt
ONLY against a presented 12D-121 `EXECUTION_INSTRUCTION` whose whole provenance
re-derives, records the declared outcome on the workflow's own trail
(MEASURE_OUTCOME), and completes the ten-stage ladder (AUDIT_AND_MONITOR) —
so the trail and the receipt carry the SAME declared outcome bound to the
SAME proposal digest.

### Requirement coverage

- **NO presented proposal is trusted** — there is no proposal input at all.
  The intake derives the CANDIDATE proposal from the instruction plus the
  canonical tool/risk constants of the scope's execution bridge
  (`SCALING_EXECUTION_POLICY` / `FAILOVER_EXECUTION_POLICY`), re-derives its
  digest via the newly exported `deriveProposalDigest` (12D-121's internal
  `proposalDigest` scheme, made callable), and requires that digest to appear
  in the workflow's hash-chained trail. A proposal the trail never recorded
  can never bind evidence — regression-tested with a forged `minimumAction`
  and a swapped `actionId`.
- **Untrusted inputs re-verified** — the presented workflow's hash chain is
  re-verified (genesis-bound metadata) and its stage must be exactly
  EXECUTE_MINIMUM_ACTION (the intake performs the measuring, so an
  already-measured workflow can never produce a second receipt); the
  presented instruction must be a frozen `EXECUTION_INSTRUCTION` owned by the
  workflow; the presented decision record must be frozen, kind-matched to the
  scope, and its `recordDigest` re-derives inside the 12D-132 collector.
- **Trail order** — a receipt-backed HUMAN_APPROVAL event must appear BEFORE
  the EXECUTE_MINIMUM_ACTION event naming the actionId; an approval can never
  follow the act it approves.
- **Cross-contract binding** — a scaling instruction's actionId must re-derive
  as `scaling.exec.<planDigest-16>.<count>` and a failover instruction's as
  `failover.exec.<planDigest-16>.<bps>` from the presented decision record's
  `planDigest` (the 12D-130/131 bridges compose actionIds from re-derived
  values only) — regression-tested against a failover-shaped actionId and a
  wrong-scope decision record.
- **Temporal bounding** — EXECUTED/FAILED evidence requires the after
  observation to fall within the instruction's validity window
  (`validUntilMs`); an outcome observed after expiry was never covered by it.
  No-action statuses (PROPOSED/NOT_EXECUTED/UNVERIFIED) carry no such
  requirement (regression-tested both ways).
- **One declared outcome per instruction** — the intake refuses a second
  receipt for a proposal digest it has already evidenced; the operator
  declares the outcome once. Separate execution/rollback evidence stays in
  12D-132's collector (rollback is NOT an intake status — it redirects
  fail-closed to the collector).
- **Trail and receipt carry the same declared outcome** — the intake is TRAIL
  FIRST: `recordMeasuredOutcome` + `recordAuditAndMonitor` run BEFORE the
  collector receipt, so a collector refusal leaves a trail honestly carrying a
  declared outcome with no receipt — never the reverse. The MEASURE_OUTCOME
  event records only the REDACTED note (`redactDeclaredNote`, deterministic
  and identical to the receipt's), so a secret can never ride from the receipt
  path into the hash-chained trail (regression-tested).
- **Instruction reference re-derived** — `instructionId` is composed from
  VERIFIED objects only: `${workflowId}/${actionId}`, returned alongside the
  receipt and asserted equal to the receipt's bound reference.
- **No permissions** — the intake PERMITS NOTHING: no provider call, no
  traffic movement, no production mutation, no merge, no deployment;
  `zeroModelCalls`/`zeroRemoteCalls`, `automaticRecovery: false`,
  `humanDecision: 'REQUIRED'` structural and frozen in
  `EVIDENCE_INTAKE_GUARDRAILS`, mirrored on every returned record, with the
  full 12D-132 honest surface still on each receipt.

### Review findings paid down during this build

1. **Gate ordering (found by the wrong-scope record test)** — the
   candidate-digest check originally ran before the decision-record
   freeze/kind gate, so a wrong-scope record surfaced a derived-digest error
   instead of the record-identity error. Closed: the record identity gate now
   runs FIRST (validate what is presented before deriving from it), with the
   cross-contract `planDigest` prefix check retained after the trail checks.
2. **Test fixture workflow identity** — the "instruction from another
   workflow" rejection originally never fired because `workflowId` is
   content-derived (`sha256(identityId|purpose|nowMs)`) and two identical
   issuances share it. The test now issues the second workflow at a different
   time so the ownership gate is genuinely exercised; the content-derived
   identity itself is an inherent 12D-121 property (disclosed below).
3. **Dead code** — an unused `void sha256;` tail in the test file removed.

Residuals (disclosed, inherent):
- `workflowId` is content-derived: two issuances with identical inputs produce
  identical workflowIds and instructions. The ownership gate binds
  instruction-to-workflow by content identity; chain verification plus
  genesis-bound metadata remain the instance-authenticity mechanism.
- Digests re-derived over presented fields are self-consistent (standing
  discipline since 12D-119/124): a forger who swaps fields AND recomputes
  produces a self-consistent object; receipts authenticate out-of-band via
  the operator's custody registry.
- One-outcome-per-instruction dedupe is per intake instance; two intakes in
  the same tenant do not share evidenced-digest registries (the bound
  collector's digest/observation dedupe still applies per collector).
- Observations are DECLARED locally observed values; the runtime never
  measures traffic itself (the honest flag the whole chain turns into
  receipts).
- The intake accepts the five non-rollback statuses; ROLLED_BACK evidence is
  intentionally out of scope and redirects to the 12D-132 collector, which
  requires separate digest-verified EXECUTED evidence.

## Exact files

- `services/ai/runtime/offline-team/instruction-evidence-bridge.ts` (new)
- `services/ai/runtime/offline-team/instruction-evidence-bridge.test.ts` (new)
- `services/ai/runtime/offline-team/agent-decision-safety-workflow.ts`
  (exported `deriveProposalDigest` — the pre-existing internal
  `proposalDigest` scheme made callable; internal call now delegates to it)
- `services/ai/package.json` (`test:12d-133`, `typecheck:12d-133`)
- `.gitlab-ci.yml` (`typecheck:12d-133`, `test:12d-133` appended)

## Exact commands and local results

```
npm run typecheck:12d-133   # OK
npm run test:12d-133        # 10/10 pass
npm run test:12d-126        # 17/17 pass
npm run test:12d-129        # 12/12 pass
npm run test:12d-130        # 9/9 pass
npm run test:12d-131        # 9/9 pass
npm run test:12d-132        # 12/12 pass
npm run test:12d-113        # 9/9 pass (guardrail audit)
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

Awaiting CEO authorization for any merge/deploy (standing rule). Reviewer
receipts: CLAUDE_CODE. GROK_XAI PENDING — never fabricated. No provider call,
no traffic movement, no production mutation, no merge, no deployment, no
learning promotion occurred in this story; `billionUsersProven: false`.