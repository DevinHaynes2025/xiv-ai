# XIV AI OS — Build Progress Report (12D-99 + 12D-100)

Date: 2026-09-12 · Branch: `claude/12d-99-supervised-local-worker` · Reviewer: Claude Code (external)

## Where we are in the queue pipeline

```
 12D-85..97 (existing, CI-gated)
        │
        ▼
 ┌────────────────────────────────────────────────────────────────────┐
 │  OFFLINE STORY QUEUE (SQLite, singleton lease, ORDINARY-only)      │
 │    READY ──claim──▶ LEASED ──settle──▶ AWAITING_REVIEW ──▶ FAILED  │
 │       ▲                  │                                          │
 │       │ returnUnstarted  │ (held on any failure — fail toward hold) │
 │       └──────────────────┘                                          │
 └────────────────────────────────────────────────────────────────────┘
        │ shared admission (12D-98: one model job per host, SQLite ledger)
        ▼
 ┌────────────────────────────────────────────────────────────────────┐
 │  SUPERVISED LOCAL WORKER (12D-99)  ──▶  Ollama 127.0.0.1:11434     │
 │    exactly ONE bounded model request · 0 remote calls · 0 retries  │
 │    settlement-proof: a fully received body is the ONLY signal      │
 │    host-lease renewal every 4s during the request                  │
 └────────────────────────────────────────────────────────────────────┘
        │ any failure settles to HELD (never silent)
        ▼
 ┌────────────────────────────────────────────────────────────────────┐
 │  OPERATOR RECOVERY (12D-100, NEW)                                  │
 │    snapshot · void-host-lease · confirm-host-stop                  │
 │    release-host-lease · void-queue-lease (READY | FAILED)          │
 │    every verb: evidence-required · operatorRecoveryAttested=true   │
 │    automaticRecovery: false · humanDecision: REQUIRED              │
 └────────────────────────────────────────────────────────────────────┘
```

## What 12D-99 shipped (commit `9bb73b5e`)

- `supervised-local-worker.ts` — takes one READY story end-to-end: claim → presence → host
  admission → single bounded Ollama request → settlement → AWAITING_REVIEW. One model call,
  no retries, no remote calls; aborted/timed-out exchanges are **held for the operator**, never
  treated as settled. Live proof run: story `pilot-99-draft-1` → `SETTLED_AWAITING_REVIEW`
  (1 model call, 0 remote, outputHash `6f6a4f1a…`).
- `supervised-local-worker.cli.ts` — pre-provisioned, one-shot, args-validated CLI.
- 11 integration tests (virtual clock, bounded mock provider) — all green.

## What 12D-100 shipped (commit `e3bd0fd3`)

- Operator recovery for the deliberate "fail toward hold" states: a crashed worker used to
  strand the whole host capacity with no recovery verb. New terminal state
  `VOIDED_BY_OPERATOR` + `operatorRecoveryAttested` provenance on every record.
- Operator verbs gated on **lease-id match, not the owner secret** — the operator owns the
  ledger file; a crashed worker cannot hand over a handle. Owner-secret path is unchanged for
  controllers.
- Queue `inspectHeldLease()` (read-only) and `voidLease(READY|FAILED)` which claims **no**
  provider settlement — READY re-queues only on the operator's explicit attestation.
- 7 operator-recovery tests, including full end-to-end recovery of a 12D-99 unconfirmed hold.
- Handoff doc: `docs/ai-agents/12d-100-operator-recovery-handoff.md`.

## Verification status (this session)

| Check | Result |
|---|---|
| `typecheck` (full `tsc --noEmit`) | PASS |
| `typecheck:12d-99` / `typecheck:12d-100` | PASS |
| `shared-host-admission.test.ts` (12D-98) | 32/32, 0 fail |
| `supervised-local-worker.test.ts` (12D-99) | 11/11, 0 fail |
| `operator-recovery.test.ts` (12D-100) | 7/7, 0 fail |
| `authenticated-review-response.test.ts` (12D-101) | 7/7, 0 fail |
| `offline-story-queue.test.ts` regression after 12D-101 | 12/12, 0 fail |
| 2,000,000-row capacity fixture | PASS (exit 0; see below) |
| GitLab push of branch | ⏳ pending (retrying) |

## Honest status flags (unchanged, on every packet)

`humanDecision: 'REQUIRED'` · `learningPromoted: false` · `liveAgentCount: null` ·
`executionClaimsVerified: false` · `providerIdentityAttested: false` ·
reviewers CLAUDE_CODE / GROK_XAI = PENDING (Grok has never responded; never fabricated) ·
`automaticRecovery: false`

## 2,000,000 user stories — what the run actually proves

The queue's policy ceiling is 2,000,000 rows. The capacity fixture
(`offline-story-queue.capacity.ts --rows 2000000`) **completed, exit 0**:

| Metric | Value |
|---|---|
| Requested / stored rows | 2,000,000 / 2,000,000 |
| Product stories created | 0 |
| Model calls | 0 |
| Insertion time | 530.1 s |
| Last-page (100 rows) read | 0.611 ms |
| Database size | 1.86 GB |
| Peak RSS | 209.6 MiB |
| `millionUsersProven` / `liveAgentsProven` | false / false (honest by construction) |

This is **CAPACITY FIXTURE** proof that the queue ledger physically holds, pages, and admits
2M story rows within policy — it does NOT mean 2,000,000 real user stories exist or completed.
`productStoriesCreated: 0` is recorded by the fixture itself.

## Queued next

1. **12D-101 — DONE this session** — authenticated reviewer-response ingestion (commit
   `14158944`): Ed25519-signed, output-hash-bound, atomically applied review decisions;
   7/7 tests; handoff at `docs/ai-agents/12d-101-review-ingestion-handoff.md`.
2. Reconcile the parallel 12D-96 lineages (MR !17 vs !18) so 12D-97's consent assessment rides
   the queue lineage.
3. The 120s queue-lease cap on long generations (renew() doesn't extend the queue lease) —
   now deadlock-free thanks to 12D-100, but still a cap.
4. Grok review: still PENDING; the moment a real response exists it gets recorded — never before.