import { EncryptedLocalEventStore } from './encrypted-local-event-store';

export interface RecoveryCheckpoint {
  tenantId: string;
  streamId: string;
  lastAppliedSequence: number;
  lastEnvelopeHash?: string;
  checkpointedAt: string;
}

export interface RecoveryReceipt {
  tenantId: string;
  streamId: string;
  integrityVerified: boolean;
  eventsAvailable: number;
  replayFromSequence: number;
  replayThroughSequence: number;
  ready: boolean;
  blockers: string[];
  checkedAt: string;
}

export class OfflineReplayRecovery {
  constructor(private readonly store: EncryptedLocalEventStore) {}

  inspect(checkpoint: RecoveryCheckpoint): RecoveryReceipt {
    if (!checkpoint.tenantId || !checkpoint.streamId) throw new Error('tenant/stream required');
    if (!Number.isInteger(checkpoint.lastAppliedSequence) || checkpoint.lastAppliedSequence < 0) {
      throw new Error('checkpoint sequence must be a nonnegative integer');
    }

    const all = this.store.readStream(checkpoint.tenantId, checkpoint.streamId);
    const integrityVerified = this.store.verifyChain(checkpoint.tenantId, checkpoint.streamId);
    const blockers: string[] = [];

    if (!integrityVerified) blockers.push('event chain integrity not verified');
    if (checkpoint.lastAppliedSequence > all.length) blockers.push('checkpoint is ahead of durable event stream');
    if (checkpoint.lastAppliedSequence > 0 && checkpoint.lastEnvelopeHash) {
      const checkpointRow = all[checkpoint.lastAppliedSequence - 1];
      if (!checkpointRow || checkpointRow.envelopeHash !== checkpoint.lastEnvelopeHash) blockers.push('checkpoint hash does not match durable event stream');
    }

    const replayFromSequence = checkpoint.lastAppliedSequence + 1;
    const replayThroughSequence = all.length;
    return {
      tenantId: checkpoint.tenantId,
      streamId: checkpoint.streamId,
      integrityVerified,
      eventsAvailable: Math.max(0, all.length - checkpoint.lastAppliedSequence),
      replayFromSequence,
      replayThroughSequence,
      ready: blockers.length === 0,
      blockers,
      checkedAt: new Date().toISOString(),
    };
  }

  replayEnvelopeRange(tenantId: string, streamId: string, fromSequence: number) {
    if (!this.store.verifyChain(tenantId, streamId)) throw new Error('refusing replay from unverified event chain');
    return this.store.readStream(tenantId, streamId, fromSequence);
  }
}

export const OFFLINE_RECOVERY_GUARDRAILS = {
  integrityCheckRequiredBeforeReplay: true,
  crossTenantReplayAllowed: false,
  replayMutatesProduction: false,
  checkpointHashValidationSupported: true,
};
