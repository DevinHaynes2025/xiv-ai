# XIV 12D-09 Offline Snapshot Preview

Offline Command Center snapshot is READ ONLY over SIMULATION layers. Sync-status is local honesty only (FRESH|STALE|WAITING_SYNC|CONFLICT). Never fabricates live cloud sync. Twin CAP 64, maxDuty 0.25. Atomic Data Cells = software knowledge records only (naming ALIGN; no physics-scale storage claims). Checkpoint = read/review only — no Policy Gate bypass. High-autonomy: LOCAL|CLOUD_SANDBOX only.

- snapshotId: `demo-offline-1`
- syncStatus: **WAITING_SYNC**
- contentChecksum: `dg1:e5b6c3d91c7986a5`
- liveCloudSyncClaimed: false
- dutyCycleAware: true
- atomicCellChecksum: `dg1:c328e85ab79bedaf`
