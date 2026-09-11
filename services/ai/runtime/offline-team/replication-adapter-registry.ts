export type ProviderRelationship = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
export type ReplicationAdapterStatus = 'DISABLED' | 'CONFIGURED' | 'VERIFIED';
export type ReplicationClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface ReplicationAdapter {
  adapterId: string;
  provider: string;
  relationship: ProviderRelationship;
  status: ReplicationAdapterStatus;
  receiptRef?: string;
  allowedClassifications: ReplicationClassification[];
}

export class ReplicationAdapterRegistry {
  private adapters = new Map<string, ReplicationAdapter>();

  register(adapter: ReplicationAdapter) {
    if (!adapter.adapterId || !adapter.provider) throw new Error('adapter/provider required');
    if (adapter.status === 'VERIFIED' && (!adapter.receiptRef || adapter.relationship !== 'VERIFIED_PARTNER')) {
      throw new Error('verified replication requires verified partner and receipt');
    }
    if (adapter.allowedClassifications.includes('TOP_SECRET')) throw new Error('TOP_SECRET cloud replication disabled');
    this.adapters.set(adapter.adapterId, adapter);
  }

  canReplicate(adapterId: string, classification: ReplicationClassification) {
    const adapter = this.adapters.get(adapterId);
    return !!adapter && adapter.status === 'VERIFIED' && adapter.relationship === 'VERIFIED_PARTNER' && classification !== 'TOP_SECRET' && adapter.allowedClassifications.includes(classification);
  }

  list() { return [...this.adapters.values()]; }
}

export const REPLICATION_GUARDRAILS = {
  topSecretCloudReplicationAllowed: false,
  verifiedPartnerRequired: true,
  receiptRequired: true,
  targetVendorIsNotPartnership: true,
};
