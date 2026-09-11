export type DeveloperStatus = 'PENDING' | 'CONTRACT_REVIEW' | 'APPROVED' | 'SUSPENDED';

export interface DeveloperEntitlement {
  developerId: string;
  tenantId: string;
  status: DeveloperStatus;
  contractReceipt?: string;
  legalReviewReceipt?: string;
  securityReviewReceipt?: string;
  scopes: string[];
  offlineBuildAllowed: boolean;
  productionPublishAllowed: boolean;
}

export function canBuildOnXiv(e: DeveloperEntitlement): boolean {
  return e.status === 'APPROVED' && !!e.contractReceipt && !!e.legalReviewReceipt && !!e.securityReviewReceipt && e.scopes.length > 0;
}

export function canPublishProduction(e: DeveloperEntitlement, humanApproval: boolean): boolean {
  return canBuildOnXiv(e) && e.productionPublishAllowed && humanApproval;
}

export const developerGatePolicy = {
  contractsRequired: true,
  legalReviewRequired: true,
  securityReviewRequired: true,
  leastPrivilegeScopes: true,
  secretsInRepoAllowed: false,
  topSecretExternalBuildAllowed: false,
};
