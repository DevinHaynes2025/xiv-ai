# MR !117 Remediation Review — Governed Summary-Index Migration (Claude Code, 2026-09-13)

Branch `chatgpt/queue-summary-scale-index` @ `577c301e` (three commits over `0d054acd`:
`fcd8b7d1` revert of the automatic schema index, `917b6cbf` explicit governed migration,
`577c301e` corrected benchmark). Validated locally at exact head on disposable databases
only.

## Verdict: SOUND — the remediation resolves both of this reviewer's blocking findings

## Finding-by-finding resolution (from this reviewer's 2026-09-12 review)

1. **Deleted governance comments → RESOLVED.** All ~10 provenance/fail-safe comment blocks
   on `offline-story-queue.ts` (`inspectLease`, `returnUnstarted`, `inspectHeldLease`,
   `renewLease`, `voidLease`, `settle`, `acceptReview`, `inspectStory`,
   `applyReviewDecision`, enqueue fingerprint note) are restored, and the automatic
   `CREATE INDEX story_summary` was removed from the schema so a fresh queue no longer
   gains an index silently.
2. **Rollout discipline → STRENGTHENED.** Index creation is now an explicit operator
   action (`applySummaryIndexMigration`) requiring literal `operatorAuthorized:true`, an
   evidence ref, free-space preflight (max of 64 MiB absolute, 25% of current DB size,
   caller floor), an active-lease block enforced both before and *inside* the
   `BEGIN IMMEDIATE` transaction, and a durable `queue_schema_migrations` ledger with
   `PLANNED → APPLIED` / `ROLLED_BACK` states. Rollback drops the index without secretly
   running VACUUM (`storageReclamationRequiresVacuum:true`,
   `automaticVacuumPerformed:false`).
3. **Benchmark methodology → FIXED.** The corrected
   `offline-story-queue.summary-benchmark.ts` compares *unindexed insertion vs indexed
   insertion on separate disposable databases*, uses deterministic
   `ORDER BY kind,state` normalization, reports write-overhead ratio, summary speedup,
   migration-build time, storage overhead, query plans, and an anomalies channel that
   fails the process (exit 2) on plan or count mismatches.

## Checks at exact head `577c301e`

- `offline-story-queue.summary-index-migration.test.ts`: **5/5 pass**.
- Full queue regression `offline-story-queue.test.ts`: **12/12 pass**.
- `tsc --noEmit` strict over queue + migration + benchmark: **PASS**.
- Windows-host run of the corrected benchmark at 100,000 rows: anomalies `[]`, native
  exit 0, speedup 9.94× (183.4 ms → 18.5 ms median), write-overhead 1.118×, migration
  320 ms, index ≈ 4.9 MB, plan flips to
  `SEARCH stories USING COVERING INDEX story_summary (tenant=?)`.
- Full 2,000,000-row governed run (this reviewer, disposable copy, native exit 0,
  anomalies `[]`): unindexed insertion 540.8 s vs indexed insertion 498.3 s
  (write-overhead ratio 0.921 — this warm-cache run showed no insertion penalty; the
  12D-103 cold drill's 607.9 s remains the cold reference), tenant summary
  2,264.6 ms → 223.1 ms after governed migration (**10.15×**), fresh indexed-insert
  summary 280.3 ms, migration 3.19 s, index ≈ 98.8 MB, plan flipped to
  `SEARCH stories USING COVERING INDEX story_summary (tenant=?)`,
  `billionUsersProven: false`, `realUserStories: 0`, `modelCalls: 0`.

## Honest limits

Still a ledger-telemetry optimization at the 2M-row policy ceiling; zero real user
stories; zero model calls; no live XIV database opened or migrated. The
`statfsSync` free-space preflight was exercised on this Windows host and behaved.

humanDecision: REQUIRED · learningPromoted: false · automaticRecovery: false · no merge performed by the reviewer.