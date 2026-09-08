import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import { canonicalize, sha256 } from './crypto';
import { RuntimeError } from './errors';
import type { IdFactory } from './ids';
import type { PlaneSnapshot } from './types';

export type SnapshotSource = {
  /** Tables that must be captured for this runtime layer's state. */
  exportTables: () => Record<string, unknown>;
  restoreTables: (tables: Record<string, unknown>) => void;
  countRecords: (tables: Record<string, unknown>) => number;
  version: string;
};

export type RestoreReport = {
  snapshotId: string;
  integrityVerified: boolean;
  recordsBefore: number;
  recordsRestored: number;
  lostRecords: number;
  /** Measured, not promised: gap between snapshot and restore start. */
  measuredRpoMs: number;
  measuredRtoMs: number;
};

/** Tables AC-23 requires in the backup policy for the 62D runtime layer. */
export const REQUIRED_BACKUP_TABLES = [
  'nodes',
  'workloads',
  'attestations',
  'approvals',
  'agents',
  'lineage',
  'audit',
  'usage',
  'checkpoints',
  'externalActions',
  'releases',
] as const;

export class SnapshotService {
  private readonly snapshots = new Map<string, PlaneSnapshot>();

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly audit: AuditLedger,
    private readonly source: SnapshotSource,
  ) {}

  take(): PlaneSnapshot {
    const tables = this.source.exportTables();
    const missing = REQUIRED_BACKUP_TABLES.filter((name) => !(name in tables));
    if (missing.length) {
      throw new RuntimeError('malformed', 'Backup policy does not cover every required table.', { missing });
    }
    const snapshot: PlaneSnapshot = {
      snapshotId: this.ids.mint('snap'),
      takenAt: this.clock.now(),
      version: this.source.version,
      tables,
      recordCount: this.source.countRecords(tables),
      integrityHash: sha256(canonicalize(tables)),
    };
    this.snapshots.set(snapshot.snapshotId, snapshot);
    this.audit.append({
      tenant: null,
      category: 'release',
      kind: 'snapshot_taken',
      subjectId: snapshot.snapshotId,
      detail: { recordCount: snapshot.recordCount, version: snapshot.version },
    });
    return snapshot;
  }

  /**
   * Restores a snapshot after verifying its integrity hash. A snapshot whose
   * contents changed since capture is refused, so a corrupted backup cannot
   * quietly become the restored state.
   */
  restore(snapshotId: string): RestoreReport {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) throw new RuntimeError('not_found', 'Unknown snapshot.', { snapshotId });

    const restoreStarted = this.clock.now();
    const integrityVerified = sha256(canonicalize(snapshot.tables)) === snapshot.integrityHash;
    if (!integrityVerified) {
      this.audit.append({
        tenant: null,
        category: 'release',
        kind: 'restore_rejected',
        subjectId: snapshotId,
        detail: { reason: 'integrity_hash_mismatch' },
      });
      throw new RuntimeError('checkpoint_corrupt', 'The snapshot failed integrity verification.', { snapshotId });
    }

    const recordsBefore = this.source.countRecords(this.source.exportTables());
    this.source.restoreTables(snapshot.tables as Record<string, unknown>);
    const recordsRestored = this.source.countRecords(this.source.exportTables());
    const completedAt = this.clock.now();

    const report: RestoreReport = {
      snapshotId,
      integrityVerified,
      recordsBefore,
      recordsRestored,
      lostRecords: Math.max(0, snapshot.recordCount - recordsRestored),
      measuredRpoMs: restoreStarted - snapshot.takenAt,
      measuredRtoMs: completedAt - restoreStarted,
    };
    this.audit.append({
      tenant: null,
      category: 'release',
      kind: 'restore_completed',
      subjectId: snapshotId,
      detail: { ...report },
    });
    return report;
  }

  corruptForTest(snapshotId: string) {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return;
    this.snapshots.set(snapshotId, {
      ...snapshot,
      tables: { ...(snapshot.tables as Record<string, unknown>), __tampered: true },
    });
  }

  get(snapshotId: string): PlaneSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  list(): PlaneSnapshot[] {
    return [...this.snapshots.values()];
  }
}
