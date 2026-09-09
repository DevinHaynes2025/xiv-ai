import type { Clock } from './clock';
import { canonicalize, sha256 } from './crypto';
import type { IdFactory } from './ids';
import type { LineageRecord, LineageStage, TenantRef } from './types';

/** AC-15 requires this exact chain to be reconstructable for a result. */
export const REQUIRED_LINEAGE_STAGES: readonly LineageStage[] = [
  'source',
  'classification',
  'organization_universe',
  'agent',
  'model',
  'runtime',
  'transformation',
  'meeting_task',
  'recommendation',
  'result',
];

export type LineageReconstruction = {
  workloadId: string;
  complete: boolean;
  missingStages: LineageStage[];
  chain: LineageRecord[];
  chainIntact: boolean;
  unknownModel: boolean;
  unknownRuntime: boolean;
  approvalPresent: boolean;
  fieldCoverage: number;
};

const GENESIS = sha256('xiv:62d:lineage:genesis');

export class LineageStore {
  private readonly byWorkload = new Map<string, LineageRecord[]>();

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
  ) {}

  record(input: {
    workloadId: string;
    tenant: TenantRef;
    stage: LineageStage;
    reference: string;
    detail: string;
  }): LineageRecord {
    const chain = this.byWorkload.get(input.workloadId) ?? [];
    const previousHash = chain.length ? (chain[chain.length - 1] as LineageRecord).hash : GENESIS;
    const body = {
      workloadId: input.workloadId,
      tenant: input.tenant,
      stage: input.stage,
      reference: input.reference,
      detail: input.detail,
      at: this.clock.now(),
      previousHash,
    };
    const entry: LineageRecord = {
      lineageId: this.ids.mint('lin'),
      ...body,
      hash: sha256(canonicalize(body)),
    };
    chain.push(entry);
    this.byWorkload.set(input.workloadId, chain);
    return entry;
  }

  chainFor(workloadId: string): LineageRecord[] {
    return [...(this.byWorkload.get(workloadId) ?? [])];
  }

  /**
   * Rebuilds source -> ... -> result for one workload and reports exactly which
   * required fields are missing. A consequential result with any missing stage
   * is an orphan, which AC-15 counts as a failure rather than a warning.
   */
  reconstruct(workloadId: string, options: { approvalMandatory: boolean }): LineageReconstruction {
    const chain = this.chainFor(workloadId);
    const present = new Set(chain.map((entry) => entry.stage));
    const missingStages = REQUIRED_LINEAGE_STAGES.filter((stage) => !present.has(stage));

    let previous = GENESIS;
    let chainIntact = true;
    for (const entry of chain) {
      const recomputed = sha256(
        canonicalize({
          workloadId: entry.workloadId,
          tenant: entry.tenant,
          stage: entry.stage,
          reference: entry.reference,
          detail: entry.detail,
          at: entry.at,
          previousHash: entry.previousHash,
        }),
      );
      if (entry.previousHash !== previous || recomputed !== entry.hash) {
        chainIntact = false;
        break;
      }
      previous = entry.hash;
    }

    const modelEntry = chain.find((entry) => entry.stage === 'model');
    const runtimeEntry = chain.find((entry) => entry.stage === 'runtime');
    const approvalPresent = chain.some((entry) => entry.stage === 'approval');
    const populatedFields = chain.filter((entry) => entry.reference.trim() && entry.detail.trim()).length;

    return {
      workloadId,
      complete: missingStages.length === 0 && (!options.approvalMandatory || approvalPresent),
      missingStages,
      chain,
      chainIntact,
      unknownModel: !modelEntry || !modelEntry.reference.trim() || modelEntry.reference === 'unknown',
      unknownRuntime: !runtimeEntry || !runtimeEntry.reference.trim() || runtimeEntry.reference === 'unknown',
      approvalPresent,
      fieldCoverage: chain.length === 0 ? 0 : populatedFields / chain.length,
    };
  }

  get workloadCount() {
    return this.byWorkload.size;
  }

  export(): Record<string, LineageRecord[]> {
    return Object.fromEntries(this.byWorkload.entries());
  }

  restore(rows: Record<string, LineageRecord[]>) {
    this.byWorkload.clear();
    for (const [workloadId, chain] of Object.entries(rows)) this.byWorkload.set(workloadId, [...chain]);
  }
}
