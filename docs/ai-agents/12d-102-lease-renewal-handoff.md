# 12D-102 — Bounded Queue-Lease Renewal (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. Closes the standing finding from 12D-99/100: `renew()` refreshed only the HOST lease (10–30s TTL) while the QUEUE lease stayed pinned at its original deadline, capping any story at ~120s of total task life.

## Design

- **`OfflineStoryQueue.renewLease(lease, extendMs)`** — for the owning controller while the lease is held:
  - Requires the exact current lease identity and an **unexpired** lease. A lapsed lease is never resurrected — operator recovery (12D-100) is the only path.
  - Never shortens a lease: a request smaller than the remaining time returns `extended: false` with the deadline untouched.
  - **Total-life cap**: the deadline can never exceed the original claim deadline plus `maxLeaseMs` (300s), so a story's total lease life is bounded by 2 × maxLeaseMs no matter how many renewals are requested.
  - Honest cap reporting: `extensionExhausted: true` once a request reaches the cap, whether or not a partial extension was applied. Nothing throws on a cap refusal — only identity/expiry failures throw.
  - Ledger provenance: the lease row records `base_deadline_ms` (original deadline, migration-added for pre-12D-102 files) and a `renewals` counter, both visible through `inspectHeldLease()`.
- **`SharedQueueAdmission.renewQueueLease(ticket, extendMs)`** — validates the ticket, extends the queue lease, and returns the REFRESHED ticket (the lease deadline moves; callers must keep using the returned ticket).
- **Worker integration**: the 12D-99 maintenance interval (4s, inside the single in-flight request) now renews both leases — host on its short clock, queue with `queueRenewalExtendMs: 60_000`. Still never a retry; still one model request. The run packet reports `queueLeaseExtensions` and `queueLeaseExtensionExhausted`.

## Tests

`queue-lease-renewal.test.ts` (5): differential proof (without renewal a +130s settle fails; with renewal the same position settles AWAITING_REVIEW); no-shortening + cap clamp + exhaustion reporting; identity/amount validation; admission-level ticket refresh with the renewed ticket settling; and a full worker run under mocked timers where a 160s gated generation settles because interval renewals kept the queue lease alive past its original 120s deadline.

## Trust limits

- Renewal is lease maintenance by the owning controller during one settled request — it grants no new authority, invokes no model, and cannot revive an expired lease.
- The cap is structural: 12D-102 makes the 120s cap a ceiling instead of a hard wall, but total lease life remains bounded (≤ 2 × maxLeaseMs) by the queue policy, not by worker behavior.
- Honest packet flags unchanged: `humanDecision: 'REQUIRED'`, `learningPromoted: false`, `liveAgentCount: null`, `automaticRecovery: false`.