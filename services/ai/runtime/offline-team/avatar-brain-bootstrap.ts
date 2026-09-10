import { createHash } from 'node:crypto';
import { EnrollmentReceipt, canBootstrapAvatarBrain } from './live-onboarding-runtime';

export interface AvatarBrainBootstrap {
  namespaceId: string;
  userId: string;
  tenantId: string;
  localFirst: true;
  cloudSync: 'DISABLED' | 'CONSENTED';
  memoryMode: 'RAG_MEMORY_EVAL';
  evidenceRefs: string[];
  createdAt: string;
}

export function bootstrapAvatarBrain(receipt: EnrollmentReceipt, cloudSyncConsented = false): AvatarBrainBootstrap {
  if (!canBootstrapAvatarBrain(receipt)) throw new Error('secure enrollment required');
  const digest = createHash('sha256').update(`${receipt.tenantId}:${receipt.userId}`).digest('hex').slice(0, 24);
  return {
    namespaceId: `avatar-brain:${digest}`,
    userId: receipt.userId,
    tenantId: receipt.tenantId,
    localFirst: true,
    cloudSync: cloudSyncConsented ? 'CONSENTED' : 'DISABLED',
    memoryMode: 'RAG_MEMORY_EVAL',
    evidenceRefs: [...receipt.consentRefs],
    createdAt: new Date().toISOString(),
  };
}

export const AVATAR_BRAIN_BOOTSTRAP_GUARDRAILS = {
  literalMindClone: false,
  modelWeightMutation: false,
  secretsInSourceAllowed: false,
  crossTenantMemoryAllowed: false,
};
