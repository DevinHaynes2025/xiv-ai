export type SandboxMode = 'OFFLINE' | 'HYBRID' | 'ONLINE';

export interface DeveloperSandbox {
  sandboxId: string;
  tenantId: string;
  developerId: string;
  mode: SandboxMode;
  localhostOnly: boolean;
  productionMutationAllowed: boolean;
  allowedTools: string[];
  checkpointId?: string;
}

export function validateSandbox(s: DeveloperSandbox): boolean {
  return !!s.sandboxId && !!s.tenantId && !!s.developerId && s.localhostOnly && !s.productionMutationAllowed && s.allowedTools.length > 0;
}

export const developerSandboxPolicy = {
  offlineFirst: true,
  checkpointBeforePromotion: true,
  failFastSandboxAllowed: true,
  lessonPromotionRequiresEvaluation: true,
  productionMutationAllowed: false,
  topSecretExternalSyncAllowed: false,
};
