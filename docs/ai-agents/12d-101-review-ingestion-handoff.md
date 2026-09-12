# 12D-101 — Authenticated Reviewer-Response Ingestion (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. Closes the `AWAITING_REVIEW` port: reviewer decisions now land through a signature-verified, output-hash-bound, atomically applied ingestion path instead of the unauthenticated `acceptReview(reviewRef)` gap.

## Design

- **Enrollment is operator-constructed only** (same rule as the presence census): reviewer ID, tenant, the enterprise roles it may review, an Ed25519 public key, and an expiry. Enrollment is never accepted from review messages. Verify-only — no private key is handled, no network API exists.
- **Signed envelope**: `{payload, signatureHex}` over a fixed field-order encoding with domain separation `XIV_REVIEW_RESPONSE_V1`. Payload binds reviewerId, tenant, storyId, the **exact settled output hash** being judged, decision (`APPROVED` / `CHANGES_REQUESTED` / `REJECTED`), reviewRef, bounded note, monotonic sequence, and a TTL (≤ 300s, inside enrollment validity).
- **Admission gates, in order** (fail toward no-write): size/shape → enrolled reviewer → not revoked → enrollment unexpired → tenant scope → replay (monotonic sequence AND non-decreasing reviewedAtMs, checked *before* state) → TTL staleness → signature → story exists and is `AWAITING_REVIEW` → stored `output_hash` equals the signed hash → reviewer designated for the story's role.
- **Atomic application** (new `OfflineStoryQueue.applyReviewDecision`): re-checks state, hash, and designated-reviewer inside one transaction; `APPROVED→DONE`, `CHANGES_REQUESTED→READY` (old output hash kept as the audit record; the next settlement overwrites it), `REJECTED→FAILED`. `review_ref` is stored for every outcome.
- **`OfflineStoryQueue.inspectStory`**: read-only single-story lookup (state, role, outputHash); grants nothing.

## Trust limits (honest)

- A valid signature authenticates an **enrolled reviewer identity**, NOT an independent model attestation: `assurance: 'REVIEWER_SIGNATURE_NOT_INDEPENDENT_MODEL_ATTESTATION'`.
- Nothing is auto-promoted: `learningPromoted: false`, `liveAgentCount: null`, `humanDecision: 'REQUIRED'` on snapshots; the queue-level reviewer designation (`getEnterpriseRole(role).reviewerIds`) is still independently enforced at write time, so an enrolled-but-undesignated reviewer cannot write.
- `acceptReview` (the old operator-metadata path) is unchanged; the authenticated path is strictly stronger.
- A reviewer's signature does not authorize execution, deployment, or learning promotion — it only moves the story within the queue's state machine.

## Tests

`authenticated-review-response.test.ts` (7): approved→DONE; forged/tampered→MALFORMED with story untouched; hash binding + replay precedence; CHANGES_REQUESTED→READY→re-claim→new hash→DONE; REJECTED→FAILED; scope/revocation/designation/expired-enrollment all refused before any write; stale/future-dated refused + honest snapshot.

## Known follow-ups

1. Key custody for real reviewers (where private keys live) is an operator concern outside this module — by design.
2. `reviewRef`/`note` are echoed, not parsed; evidence artifacts live outside the queue.
3. The 120s queue-lease cap finding from 12D-99/100 still stands.