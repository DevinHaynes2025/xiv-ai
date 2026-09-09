# XIV 62D — Backup, Restore and Rollback

AC-23 requires a restore that is tested before a canary and a documented,
reproducible procedure. AC-24 requires a rehearsed rollback to a known-good
version. Both are exercised in `services/runtime/acceptance/resilience.ts` and
their measured RPO, RTO and rollback duration are written into
`docs/62d/SCORECARD.md` on every run.

## What is in a snapshot

`SnapshotService.take()` exports every table in `REQUIRED_BACKUP_TABLES`
(`services/runtime/src/snapshot.ts`) and commits to their contents with an
integrity hash:

`nodes`, `workloads`, `attestations`, `approvals`, `agents`,
`agentAssignments`, `lineage`, `audit`, `usage`, `checkpoints`,
`externalActions`, `releases`.

A restore recomputes that hash first. A snapshot whose contents no longer match
is refused with `checkpoint_corrupt` rather than partially applied — the
acceptance suite corrupts a snapshot on purpose to prove the refusal happens.

The agent slot index is rebuilt from the restored agent rows instead of being
restored from the snapshot, so a tampered snapshot cannot reintroduce a slot
pointing at another tenant's agent.

## Restore procedure

```bash
cd services/runtime
npm run acceptance -- --only AC-23    # take a snapshot, diverge, restore, verify
```

In code the same three steps are:

1. `const snapshot = plane.snapshots.take()` — record the snapshot id and the
   record count it committed to.
2. `plane.snapshots.restore(snapshot.snapshotId)` — verifies the integrity hash,
   replaces every table, and returns a `RestoreReport` with the measured RPO
   (time between the snapshot and the restore) and RTO (time the restore took).
3. Verify: committed records are present, checkpoint signatures still verify, and
   the audit chain still verifies end to end.

## Rollback procedure

1. Activate versions through `ReleaseLedger.activate()` so each one records a
   configuration hash and its predecessor. Configuration lineage is what makes a
   rollback target identifiable rather than assumed.
2. Rehearse with `ReleaseLedger.rehearseRollback({ restore })`, passing a restore
   closure — in the suite, a restore of the pre-upgrade snapshot.
3. The rehearsal refuses to proceed when the current version declared a
   destructive migration. A destructive version is not rollback-safe, and the
   suite proves the refusal rather than assuming nobody will try.

## Limits of this evidence, stated plainly

- The measured RPO, RTO and rollback duration are for **in-process
  control-plane state on a deterministic clock**. They are not measurements of
  hosted PostgreSQL backup behaviour, and they are not a claim about restoring a
  deployed application build.
- Supabase/PostgreSQL backup and point-in-time recovery for the tables in
  `supabase/migrations/20260908120000_xiv_runtime_62d.sql` are a platform
  concern that this suite does not exercise. Until that is measured on the
  hosted database, the AC-23 numbers cover the runtime layer only.
- No multi-region or cross-account restore is exercised.
