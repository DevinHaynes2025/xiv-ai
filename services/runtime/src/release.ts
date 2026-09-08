import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import { canonicalize, sha256 } from './crypto';
import { RuntimeError } from './errors';
import type { ReleaseManifest } from './types';

export type RollbackRehearsal = {
  fromVersion: string;
  toVersion: string;
  destructiveDependency: boolean;
  recovered: boolean;
  recordsBefore: number;
  recordsAfter: number;
  unauthorizedDataLoss: number;
  durationMs: number;
  configLineageRetained: boolean;
};

/**
 * Release and rollback ledger (AC-24).
 *
 * Activating a version keeps the previous manifest addressable, so a rollback is
 * a lookup rather than a rebuild. A version whose migration is marked
 * destructive cannot be rolled back past, and the ledger says so instead of
 * letting a rehearsal appear to succeed.
 */
export class ReleaseLedger {
  private readonly manifests: ReleaseManifest[] = [];

  constructor(
    private readonly clock: Clock,
    private readonly audit: AuditLedger,
  ) {}

  activate(input: {
    version: string;
    runtimeContractVersion: string;
    config: Record<string, unknown>;
    destructiveMigration: boolean;
  }): ReleaseManifest {
    const previous = this.manifests.at(-1) ?? null;
    const manifest: ReleaseManifest = {
      version: input.version,
      runtimeContractVersion: input.runtimeContractVersion,
      activatedAt: this.clock.now(),
      configHash: sha256(canonicalize(input.config)),
      destructiveMigration: input.destructiveMigration,
      previousVersion: previous?.version ?? null,
    };
    this.manifests.push(manifest);
    this.audit.append({
      tenant: null,
      category: 'release',
      kind: 'release_activated',
      subjectId: manifest.version,
      detail: {
        configHash: manifest.configHash,
        previousVersion: manifest.previousVersion,
        destructiveMigration: manifest.destructiveMigration,
      },
    });
    return manifest;
  }

  current(): ReleaseManifest | null {
    return this.manifests.at(-1) ?? null;
  }

  previous(): ReleaseManifest | null {
    return this.manifests.length >= 2 ? (this.manifests.at(-2) as ReleaseManifest) : null;
  }

  /**
   * Rehearses a rollback to the previous known-good version using the caller's
   * restore hook, then reports measured duration and record deltas.
   */
  rehearseRollback(input: {
    restore: () => { recordsBefore: number; recordsAfter: number };
  }): RollbackRehearsal {
    const from = this.current();
    const to = this.previous();
    if (!from || !to) {
      throw new RuntimeError('not_found', 'A rollback rehearsal needs a previous known-good version.', {});
    }
    if (from.destructiveMigration) {
      this.audit.append({
        tenant: null,
        category: 'release',
        kind: 'rollback_blocked',
        subjectId: from.version,
        detail: { reason: 'destructive_migration' },
      });
      throw new RuntimeError('malformed', 'This version cannot be rolled back: its migration is destructive.', {
        version: from.version,
      });
    }

    const startedAt = this.clock.now();
    const { recordsBefore, recordsAfter } = input.restore();
    const durationMs = this.clock.now() - startedAt;

    this.manifests.push({
      ...to,
      activatedAt: this.clock.now(),
      previousVersion: from.version,
    });

    const rehearsal: RollbackRehearsal = {
      fromVersion: from.version,
      toVersion: to.version,
      destructiveDependency: false,
      recovered: true,
      recordsBefore,
      recordsAfter,
      unauthorizedDataLoss: Math.max(0, recordsBefore - recordsAfter),
      durationMs,
      configLineageRetained: this.manifests.every((manifest) => Boolean(manifest.configHash)),
    };
    this.audit.append({
      tenant: null,
      category: 'release',
      kind: 'rollback_rehearsed',
      subjectId: to.version,
      detail: { ...rehearsal },
    });
    return rehearsal;
  }

  history(): readonly ReleaseManifest[] {
    return this.manifests;
  }

  export(): ReleaseManifest[] {
    return [...this.manifests];
  }

  restore(rows: ReleaseManifest[]) {
    this.manifests.length = 0;
    this.manifests.push(...rows);
  }
}
