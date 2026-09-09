import { evaluateOfflineTask } from './offline-policy';
import type { NeuralTransitEnvelope } from './neural-transit-envelope';

export type TransitPartition = {
  id: 'local' | 'cloud';
  open: boolean;
  reason: string;
};

export function describeTransitPartitions(): { local: TransitPartition; cloud: TransitPartition } {
  const cloud = evaluateOfflineTask({
    needsInternet: false,
    needsCloudProvider: true,
    needsExternalFreshness: false,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });
  return {
    local: { id: 'local', open: true, reason: 'Local/offline partition is eligible for bounded sandbox transit.' },
    cloud: { id: 'cloud', open: false, reason: `${cloud.reason} Cloud partition stays closed until configured/authorized/verified.` },
  };
}

export function assignEnvelopePartition(envelope: NeuralTransitEnvelope) {
  const partitions = describeTransitPartitions();
  if (envelope.partition === 'cloud' || !partitions.cloud.open) {
    if (envelope.partition === 'cloud') {
      return { partition: 'local' as const, rerouted: true as const, reason: partitions.cloud.reason };
    }
  }
  return { partition: 'local' as const, rerouted: false as const, reason: partitions.local.reason };
}

export function isolatePartition(envelope: NeuralTransitEnvelope, tenantId: string, universeId: string) {
  if (envelope.tenantId !== tenantId || envelope.universeId !== universeId) {
    return { allowed: false as const, reason: 'OFFLINE_PARTITION_SCOPE_DENIED' };
  }
  return { allowed: true as const, partition: assignEnvelopePartition(envelope) };
}
