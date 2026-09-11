export type LearningTrust = 'RAW' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
export type RuntimePlane = 'LOCAL' | 'HYBRID' | 'CLOUD_TARGET';

export interface LearningRecord {
  recordId: string;
  tenantId: string;
  sourceRef: string;
  contentHash: string;
  trust: LearningTrust;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  createdAt: string;
  reviewedBy?: string;
  confidence?: number;
}

export interface DataNode {
  nodeId: string;
  plane: RuntimePlane;
  role: 'DATABASE' | 'CACHE' | 'VECTOR_INDEX' | 'OBJECT_STORE' | 'QUEUE' | 'API';
  status: 'TARGET' | 'DETECTED' | 'VERIFIED' | 'DEGRADED' | 'OFFLINE';
  receiptRef?: string;
}

export class OfflineLearningDataPlane {
  private records = new Map<string, LearningRecord>();
  private nodes = new Map<string, DataNode>();

  addRecord(record: LearningRecord) {
    if (!record.tenantId || !record.sourceRef || !record.contentHash) throw new Error('tenant/source/hash required');
    if (record.confidence !== undefined && (record.confidence < 0 || record.confidence > 1)) throw new Error('confidence out of range');
    this.records.set(`${record.tenantId}:${record.recordId}`, record);
  }

  canEnterTrustedBrain(tenantId: string, recordId: string) {
    const record = this.records.get(`${tenantId}:${recordId}`);
    return !!record && record.trust === 'APPROVED' && record.classification !== 'TOP_SECRET';
  }

  registerNode(node: DataNode) {
    if (node.status === 'VERIFIED' && !node.receiptRef) throw new Error('verified nodes require receipt');
    this.nodes.set(node.nodeId, node);
  }

  listNodes() { return [...this.nodes.values()]; }
}

export const OFFLINE_LEARNING_GUARDRAILS = {
  ragMemoryEvaluationByDefault: true,
  silentWeightMutationAllowed: false,
  topSecretOrdinaryEmbeddingAllowed: false,
  verifiedRequiresReceipt: true,
};
