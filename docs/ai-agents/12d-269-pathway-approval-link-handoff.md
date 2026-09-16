# 12D-269 — Pathway Approval Link (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-pathway-approval-link.ts` + 12
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-269` (node TAP via
tsx) = **12/12 pass**; `typecheck:12d-269` (strict tsc, also covering
the 12D-264 ledger) = **exit 0**. Sibling regressions (single tsx run):
41/41 across 12d-264 pathway ledger, the 12D-2xx pathway-evidence
bridge, 12d-247 approval custody, 12d-267 custody decision view. CI IS
NOT CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review; findings below). GROK_XAI review PENDING — never
fabricated.

## What it is

The 12D-247-pattern custody link for pathway candidates — the closing of
the unverifiable handoff the 12D-264 ledger disclosed: between the
12D-2xx bridge (a candidate with `humanApproved: false`) and the ledger
(which requires a recorded approval), nothing bound the operator's
recorded decision to the EXACT candidate bytes it decided over. This
pure link closes that gap:

1. `buildPathwayApprovalPlan({packet, decision, decidedBy, decidedAtMs})`
   — the operator's EXPLICIT decision ('APPROVED' | 'REJECTED',
   exact-case, no default, never inferred) over a bridge packet whose
   pinned flags are re-checked, never trusted. The decision record
   carries `candidateDigestSha256` — sha256 over the candidate's
   canonical JSON (the SAME key list and order the ledger's digest
   discipline uses) — and the receipt re-derives from the canonical
   record under a FIXED custody purpose `xiv-os-pathway-approval`. The
   plan RUNS nothing; the operator executes it out of band (12D-244).
2. `applyRecordedApproval(packet, plan)` — the CANDIDATE-BYTES BINDING,
   the property that exists nowhere else: the packet's candidate must
   re-derive the recorded digest and identity, or the application
   refuses — a decision recorded over candidate B cannot approve
   candidate A (the 12D-267 cross-binding lesson, applied to the
   brain's ledger). ELIGIBILITY IS RE-EVALUATED: the approved candidate
   must pass the REAL 12D-89 gate fresh — a forged packet claiming
   `currentEligibility.eligible` cannot shortcut the gate (proven by
   the suite). APPROVED yields a LEDGER-READY candidate (humanApproved
   carried by the recorded decision) that the 12D-264 ledger appends —
   the suite proves the END-TO-END loop: queue → bridge → recorded
   decision → ledger entry → census (activated stays the literal 0).
   REJECTED yields an honest `CANDIDATE_REJECTED_RECORDED` with NO
   ledger-ready shape — the ledger path stays structurally closed.
3. `verifyPathwayApprovalPlan(plan)` — the record re-derives its
   receipt; the single register step binds exactly to that receipt
   under the fixed purpose; the SECRET-CONTENT RE-GATE LIVES INSIDE
   THE VALIDATOR FROM DAY ONE (the 12D-267 paydown, learned before it
   could recur here — the suite proves a forged internally-consistent
   plan with a credential-shaped decidedBy refuses at verify).

## Defects found and paid down during this story

- **(self-review, pre-run)** a leftover placeholder expression inside
  `applyRecordedApproval` was removed before the first run (the same
  leftover-defect class 12D-247 disclosed); two stray test-file tokens
  and a wrong pathwayId assertion were fixed the same way.
- **(caught by the suite, disclosed)** the first test fixture reused
  one story id and identical story content per queue — the queue
  correctly refused the duplicates (claimNext returned null), proving
  the queue's dedup works; fixed by binding each packet to its OWN
  story with a unique id + sourceRevision.
- **(strict tsc, two runs)** the module's packet input type originally
  demanded an index signature the concrete bridge packet cannot carry
  (TS2322); redefined structurally — the runtime exact-keys gates
  enforce the full shape, the type carries only what it means.

## The honest boundary

- The link proves the BINDING, not the approver's identity —
  registration is not issuance proof (the 12D-233 residual verbatim);
  the ledger still records, never verifies who approved (12D-264
  residual verbatim).
- Nothing is activated: `ledgeredNeverActivated: true` on the link and
  the ledger; `activated` in the census stays the literal 0.
- `applyRecordedApproval`'s APPROVED outcome carries
  `sourceStoryId`/`outputHash` read defensively from the packet for
  operator context only — the ledger consumes ONLY the digest-bound
  candidate.
- `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
  `remoteCalls: 0`, `modelCalls: 0`, `collectsNothing: true`,
  `automaticRecovery: false`, `billionUsersProven: false` on every
  surface. The receipt domain `XIV_OS_PATHWAY_APPROVAL_RECEIPT` is
  distinct from every other receipt domain in the OS (asserted).

## Exact files

- `services/ai/runtime/offline-team/xiv-pathway-approval-link.ts` (new)
- `services/ai/runtime/offline-team/xiv-pathway-approval-link.test.ts`
  (new, 12 tests — END-TO-END bridge→decision→ledger with census;
  REJECTED-is-a-decision with no ledger path and a distinct receipt;
  CROSS-BINDING candidate-B-over-candidate-A; tampered candidate;
  identity-mismatch with compensating digest; decision flip;
  credential decidedBy inside the verifier; eligibility re-evaluation
  vs a forged eligibility claim; exact-keys gates; pre-approved
  candidates refuse the link; malformed inputs; policy pins)
- `services/ai/package.json` — `test:12d-269`, `typecheck:12d-269`
- `.gitlab-ci.yml` — `typecheck:12d-269`, `test:12d-269` steps
- `docs/ai-agents/12d-269-pathway-approval-link-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-269  # RAN: exit 0 (after the disclosed fixes)
npm run test:12d-269       # RAN: 12/12 pass
sibling run via tsx --test # RAN: 41/41 (12d-264 ledger, bridge,
                           #      12d-247 custody, 12d-267 view)
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
external fetch, no install, no credentials. The commit stages ONLY the
files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

The pathway-approval receipt surface in the story shell (the 12D-267
pattern applied to a 12D-269 plan — the operator's window into the
brain's recorded approvals), a ledger census view for the shell
(measured counts only), and the open 12D-243/12D-245 operator
questions (fail-closed, not acted on). GitHub Phase 1 lockdown remains
blocked on the CEO's `! gh auth login`.