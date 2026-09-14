# 12D-126 — Measured regional failover contract (handoff)

Status: REVIEW + PAYDOWN BUILT LOCALLY on `claude/12d-99-supervised-local-worker`.
Provenance: the implementer lineage delivered `measured-regional-failover.ts` (received
via Downloads, never committed) with a claimed **26/26** test suite and documentation —
**the suite and its documentation were not provided and remain UNVERIFIED; never
fabricated.** This story is the adversarial review of that contract and the paydown of
every confirmed finding, rebuilt in repo style at
`services/ai/runtime/offline-team/measured-regional-failover.ts`.

## What it is

The scale ladder's MEASURED FAILOVER rung. The contract consumes DECLARED capacity
evidence for a primary and a secondary region and, when the primary is evidenced
ineligible and an allowlisted, independently fault-isolated secondary is evidenced
healthy in the SAME measurement window, it PROPOSES a bounded canary failover for
HUMAN approval. It moves no traffic, authorizes nothing, and deploys nothing — every
path returns `authorizedTrafficBps: 0`, `trafficMoved: false`,
`providerInvocationAuthorized: false`, `automaticRecovery: false`,
`productionScaleProven: false`, `humanApprovalRequired: true` (structural), plus the
constitution flags (`learningPromoted: false`, `modelCalls: 0`, `remoteCalls: 0`,
`billionUsersProven: false`).

Governing properties, as enforced:

- Classified first: CONFIDENTIAL/TOP_SECRET → `OFFLINE_LOCAL_REQUIRED` /
  `CLASSIFIED_FAILOVER_DENIED` BEFORE any evidence is examined — no evidence path can
  ever move classified work.
- Failover REQUIRES verified primary evidence: a null primary is DENIED
  (`PRIMARY_EVIDENCE_REQUIRED`), never planned on; the declared failure reason is
  never corroborated by absence.
- The failover policy digest RE-DERIVES from the declared policy object (canary
  ceiling, evidence skew AND age bounds, allowlisted pairs, order-normalized) — a
  foreign or stale policy attestation fails closed, so an approval binds the policy
  that was actually applied.
- The plan digest binds EVERY declared input that materially determines the plan:
  request, re-derived policy digest, candidate region AND failure domain AND provider
  AND its full measured evidence, and the primary's evidenced ineligibility at its
  observation time. Single-variable isolation is regression-tested for every one.
- Evidence is exactly-shaped and fail-closed (`hasExactKeys` first, the 12D-124/125
  discipline): non-negative safe-integer measurements, safe-integer timestamps,
  validated ids, known provider, `providerInvocationAuthorized: false` and
  `productionScaleProven: false` structural. A NaN or missing `observedAtMs` can
  never again bypass the window check.
- Freshness: `maxEvidenceAgeMs` policy bound against a DECLARED reference time
  (`nowMs` parameter — this runtime reads no clock). Stale primary or secondary
  evidence is denied, never planned on.
- Substituted primary identities (region or failure domain) THROW — tamper-evident,
  never silently re-routed.

## Adversarial review (paydown record)

Adversarial review of the implementer's original confirmed 4 defects (2 BLOCKING,
2 MAJOR) plus 3 conservative notes. The original's defect behaviors were reproduced
LIVE by the scratch script `services/ai/.xiv-runtime/failover-repro.ts` (never
committed) against the unmodified Downloads copy — actual output:

```
1 NaN-window bypass: REPRODUCED
2 digest escape: REPRODUCED
3 null primary: REPRODUCED
4 policy-value binding: REPRODUCED
```

All paydown is committed here with regression tests (15/15 green + typecheck after
paydown; two live-reproduced corrections during paydown: the test helper's policy
digest now binds to the policy under test, and the secondary evidence shape gate was
re-ordered BEFORE the health check so a non-boolean `admissionEligible` is a shape
failure, never a quiet "unhealthy"):

1. **BLOCKING — planDigest did not bind the measured evidence.** The original preimage
   bound only request + policy-digest + region ids: two plans with secondary evidence
   differing only in `p95LatencyMs` (5 vs 5000) shared ONE digest, and the effective
   policy values (canary ceiling, window bounds, pairs) were bound only as an opaque
   attestation — a ceiling changed between plan and approval kept the same digest.
   Fixed: evidence measurements, candidate failure domain/provider, dataClass, and the
   primary's ineligibility evidence all enter the preimage; the policy digest
   RE-DERIVES from the policy object (order-normalized pairs) and must match the
   request's. Tests: single-variable digest isolation over every measured field and
   request field; foreign-digest throw; equivalent-pair-order digest equality.
2. **BLOCKING — evidence never runtime-validated; NaN bypassed the window check.**
   `Math.abs(NaN - x) > maxSkew` is false, so a NaN/undefined `observedAtMs` reached
   `HUMAN_APPROVAL_REQUIRED` while claiming window-match; negative/NaN measurements,
   invalid ids, unknown providers, and authorization/scale claims were all accepted as
   "measured" evidence. Fixed: `assertEvidence` exact-shape gate on BOTH evidences
   before any window logic. Tests: NaN/undefined/fractional timestamps throw;
   negative/NaN/infinite measurements throw; undeclared fields (including the
   12D-125-style smuggled `scoreFromLiveDatabase`) and missing declared keys throw.
3. **MAJOR — no staleness bound.** `maxEvidenceSkewMs` bounded only the skew BETWEEN
   the two evidences; both could be arbitrarily old. Fixed: `maxEvidenceAgeMs` policy
   bound against a declared `nowMs` reference time; stale primary →
   `PRIMARY_EVIDENCE_STALE`, stale secondary → `SECONDARY_EVIDENCE_STALE`.
4. **MAJOR — null primary planned a failover.** The declared
   PRIMARY_UNAVAILABLE/UNHEALTHY/SATURATED reason was never corroborated by evidence.
   Fixed: `PRIMARY_EVIDENCE_REQUIRED` denial; failover is planned only on evidenced
   primary ineligibility.
5. **CONSERVATIVE ×3** — the canary-limit denial ran before the primary-identity throw
   (a substituted primary on an over-limit request was silently swallowed by an
   unrelated denial): identity now throws before the canary check; allowedRegionPairs
   entries and the policy object are exactly-shaped and validated; `sourceCommit`
   remains sha1-only (40-hex, fine for current git — noted for sha256 repos), and
   `virtualShard`'s 0–65535 ceiling must be reconciled with 12D-109's shard-id domain
   at any future integration.

Residual: the contract cannot verify that a human approval was ever recorded against a
planDigest (that is the 12D-121 / adoption-layer future work, same as every prior
contract); `admissionEligible` and the measurement values are DECLARED — this runtime
never infers or measures health itself. Reviewer receipts: CLAUDE_CODE. GROK_XAI
PENDING — never fabricated. The implementer's 26/26 claim and its documentation:
UNVERIFIED (not provided).

## 12D-127 (follow-on story) — receipt-gated human decision records for failover plans

`recordFailoverDecision` (same module) completes the failover decision loop the way
12D-124's `recordTreatmentDecision` completed the Story Engine's: ONLY an eligible
plan (`HUMAN_APPROVAL_REQUIRED` / `MEASURED_SECONDARY_CANDIDATE`) can receive a
decision — denied, `OFFLINE_LOCAL_REQUIRED`, and `NO_FAILOVER_REQUIRED` packets are
final states, and "approving" one would manufacture authorization no plan proposed.
The record binds the `planDigest` VERBATIM, the candidate region, and the requested
traffic fraction; it is receipt-gated (64-hex sha256 operator receipt), validates the
decider identity and timestamp, and REJECTS a decision timestamp predating the
capacity evidence (max of both observation times — the 12D-121 ordering rule). Every
record carries `requiresDecisionSafetyWorkflowBeforeAnyAction: true` (a requirement,
never a past-tense routing claim), `authorizedTrafficBps: 0`, `trafficMoved: false`,
`executedByThisRuntime: false`, `productionExecutionAllowed: false`, and the full
honest flag set. The plan's governance flags are re-verified before any record is
issued. 16/16 tests + typecheck green (one live-corrected test during the write: the
temporal boundary is strict — a decision AT the evidence timestamp is accepted, only
strictly-earlier ones are impossible orderings).

Residual (disclosed, then CLOSED by 12D-128): the record once bound `planDigest`
verbatim and could not re-derive it — a hand-built frozen plan packet with honest
flags and a fabricated digest could obtain a decision record, exactly as 12D-124's
record once trusted a foreign `storyId`. CLOSED: `recordFailoverDecision` now takes
the plan's full PROVENANCE (request, policy, declared reference time, both capacity
evidences) and RE-COMPOSES the plan from those inputs before issuing any record; a
presented plan whose digest, candidate region, or requested traffic fraction does not
re-derive fails closed before any receipt is examined (regression-tested: fabricated
digest, differing measured evidence, differing policy ceiling, evidence that would
now compose to a denial, and a stale reference time all throw). The record boundary
no longer trusts any presented identity.

## Honest state

No region has ever been probed by this runtime — all evidence is declared. No traffic
was ever moved by this runtime — `trafficMoved: false` and `authorizedTrafficBps: 0`
are structural on every path. No approval exists in this runtime — the eligible packet
is a PROPOSAL requiring human approval and, per the standing rule, a 12D-121
decision-safety workflow before any resulting action in a system outside this runtime.
`billionUsersProven: false`.