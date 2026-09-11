export type DeveloperRegionStatus = 'TARGET' | 'ONBOARDING' | 'APPROVED' | 'SUSPENDED';

export interface GlobalDeveloperNode {
  developerId: string;
  region: string;
  jurisdictionPolicyRef: string;
  contractReceiptRef?: string;
  securityReviewRef?: string;
  status: DeveloperRegionStatus;
  allowedScopes: string[];
  offlineBuildAllowed: boolean;
  productionMutationAllowed: false;
}

export function canBuild(node: GlobalDeveloperNode): boolean {
  return node.status === 'APPROVED' && !!node.contractReceiptRef && !!node.securityReviewRef;
}

export const GLOBAL_DEVELOPER_POLICY = {
  productionMutationAllowed: false,
  topSecretExternalSync: false,
  globalAccessRequiresJurisdictionPolicy: true,
  offlineBuildSupported: true,
} as const;
