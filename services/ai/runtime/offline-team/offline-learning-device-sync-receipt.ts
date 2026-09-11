export interface OfflineLearningDeviceSyncReceiptInput {
  tenantId: string;
  generatedAt: string;
  indexedKnowledgeCount: number;
  promotedLearningCount: number;
  rejectedLearningCount: number;
  verifiedDeviceCount: number;
  preparedSyncItemCount: number;
  rejectedSyncItemCount: number;
  topSecretRejectedFromOrdinaryIndex: boolean;
  topSecretRejectedFromClientSync: boolean;
  citationsPresentForRetrieval: boolean;
}

export interface OfflineLearningDeviceSyncReceipt extends OfflineLearningDeviceSyncReceiptInput {
  status: 'HEALTHY' | 'DEGRADED' | 'UNVERIFIED';
  blockers: readonly string[];
  claims: {
    modelWeightsMutated: false;
    universalDeviceSupportVerified: false;
    externalVendorPartnershipsInferred: false;
  };
}

export function buildOfflineLearningDeviceSyncReceipt(input: OfflineLearningDeviceSyncReceiptInput): OfflineLearningDeviceSyncReceipt {
  if (!input.tenantId || !input.generatedAt) throw new Error('tenant and generatedAt required');
  const numeric = [
    input.indexedKnowledgeCount,
    input.promotedLearningCount,
    input.rejectedLearningCount,
    input.verifiedDeviceCount,
    input.preparedSyncItemCount,
    input.rejectedSyncItemCount,
  ];
  if (numeric.some(value => value < 0 || !Number.isFinite(value))) throw new Error('receipt counts must be finite non-negative numbers');

  const blockers: string[] = [];
  if (!input.citationsPresentForRetrieval) blockers.push('retrieval citations not verified');
  if (!input.topSecretRejectedFromOrdinaryIndex) blockers.push('TOP_SECRET index exclusion not verified');
  if (!input.topSecretRejectedFromClientSync) blockers.push('TOP_SECRET client-sync exclusion not verified');
  if (input.verifiedDeviceCount === 0) blockers.push('no verified device receipt measured');

  const status: OfflineLearningDeviceSyncReceipt['status'] = blockers.length === 0
    ? 'HEALTHY'
    : input.indexedKnowledgeCount === 0 && input.verifiedDeviceCount === 0
      ? 'UNVERIFIED'
      : 'DEGRADED';

  return {
    ...input,
    status,
    blockers,
    claims: {
      modelWeightsMutated: false,
      universalDeviceSupportVerified: false,
      externalVendorPartnershipsInferred: false,
    },
  };
}
