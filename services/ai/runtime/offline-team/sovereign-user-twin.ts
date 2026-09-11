export type TwinLearningMode = 'LOCAL_ONLY' | 'LOCAL_PLUS_APPROVED_SHARED_SIGNALS';

export interface SovereignUserTwin {
  tenantId: string;
  userId: string;
  genomeId: string;
  learningMode: TwinLearningMode;
  permissions: string[];
  consentReceiptIds: string[];
  localMemoryNamespace: string;
  cloudSync: 'DISABLED' | 'CONSENTED';
  confidence: number;
}

export function createSovereignUserTwin(input: Omit<SovereignUserTwin, 'localMemoryNamespace'>): SovereignUserTwin {
  if (!input.tenantId || !input.userId || !input.genomeId) throw new Error('tenant/user/genome required');
  if (!input.consentReceiptIds.length) throw new Error('consent receipt required');
  if (input.confidence < 0 || input.confidence > 1) throw new Error('confidence must be 0..1');
  return { ...input, localMemoryNamespace: `xiv://${input.tenantId}/${input.userId}/avatar-brain` };
}

export const SOVEREIGN_TWIN_GUARDRAILS = {
  localFirst: true,
  silentGlobalDataMiningAllowed: false,
  sharedLearningRequiresApproval: true,
  modelWeightMutationAllowedByDefault: false,
  literalHumanCloneClaimAllowed: false,
};
