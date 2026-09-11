import { createHash } from 'node:crypto';

export interface KnowledgePackItem {
  id: string;
  tenantId: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  content: string;
  evidenceRefs: string[];
  approved: boolean;
}

export interface KnowledgePackManifest {
  packId: string;
  tenantId: string;
  encryptedAtRestRequired: true;
  itemHashes: string[];
  itemCount: number;
  externalSyncAllowed: boolean;
}

export function buildKnowledgePack(packId: string, tenantId: string, items: KnowledgePackItem[]): KnowledgePackManifest {
  const approved = items.filter((i) => i.tenantId === tenantId && i.approved);
  const hashes = approved.map((i) => createHash('sha256').update(`${i.id}:${i.content}`).digest('hex'));
  const hasTopSecret = approved.some((i) => i.classification === 'TOP_SECRET');
  return {
    packId,
    tenantId,
    encryptedAtRestRequired: true,
    itemHashes: hashes,
    itemCount: approved.length,
    externalSyncAllowed: !hasTopSecret,
  };
}

export const knowledgePackPolicy = {
  rawSecretMaterialInManifest: false,
  crossTenantMixingAllowed: false,
  portableOfflineUseSupported: true,
  encryptionImplementationMustBeRuntimeVerified: true,
};
