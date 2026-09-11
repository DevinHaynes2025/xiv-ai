export type WorkspaceRecordKind = 'TASK' | 'MESSAGE' | 'LESSON' | 'DECISION' | 'CHECKPOINT';

export interface WorkspaceRecord {
  id: string;
  tenantId: string;
  agentId: string;
  kind: WorkspaceRecordKind;
  payloadHash: string;
  evidenceRefs: string[];
  createdAt: string;
  approved: boolean;
}

export interface PersistentAgentWorkspacePolicy {
  localFirst: true;
  encryptedAtRestRequired: true;
  productionMutationAllowed: false;
  topSecretExternalSyncAllowed: false;
}

export const persistentAgentWorkspacePolicy: PersistentAgentWorkspacePolicy = {
  localFirst: true,
  encryptedAtRestRequired: true,
  productionMutationAllowed: false,
  topSecretExternalSyncAllowed: false,
};

export function validateWorkspaceRecord(record: WorkspaceRecord): boolean {
  return Boolean(record.id && record.tenantId && record.agentId && record.payloadHash && record.createdAt && record.evidenceRefs.length);
}
