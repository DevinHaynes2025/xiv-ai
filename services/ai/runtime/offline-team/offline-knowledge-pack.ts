import { createHash } from 'crypto';

export type KnowledgeClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface OfflineKnowledgeItem {
  id: string;
  sourceRef: string;
  sha256: string;
  classification: KnowledgeClassification;
  approved: boolean;
}

export interface OfflineKnowledgePack {
  packId: string;
  tenantId: string;
  deviceId: string;
  encrypted: true;
  items: OfflineKnowledgeItem[];
  manifestHash: string;
  topSecretCloudSyncAllowed: false;
}

export function buildOfflineKnowledgePack(input: {
  packId: string;
  tenantId: string;
  deviceId: string;
  items: Omit<OfflineKnowledgeItem, 'sha256'>[];
}): OfflineKnowledgePack {
  const approved = input.items.filter(i => i.approved).map(i => ({
    ...i,
    sha256: createHash('sha256').update(`${i.id}|${i.sourceRef}|${i.classification}`).digest('hex'),
  }));
  const manifestHash = createHash('sha256').update(JSON.stringify(approved)).digest('hex');
  return { packId: input.packId, tenantId: input.tenantId, deviceId: input.deviceId, encrypted: true, items: approved, manifestHash, topSecretCloudSyncAllowed: false };
}
