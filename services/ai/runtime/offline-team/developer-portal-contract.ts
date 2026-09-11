export type DeveloperPortalStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REVOKED';

export interface DeveloperPortalProfile {
  developerId: string;
  tenantId: string;
  status: DeveloperPortalStatus;
  contractReceiptRef?: string;
  legalReviewReceiptRef?: string;
  securityReviewReceiptRef?: string;
  paymentAccountRef?: string;
  sandboxEnabled: boolean;
  productionPublishAllowed: boolean;
  approvedProjectRoomIds: string[];
}

export function developerPortalReady(profile: DeveloperPortalProfile): boolean {
  return profile.status === 'APPROVED'
    && Boolean(profile.contractReceiptRef)
    && Boolean(profile.legalReviewReceiptRef)
    && Boolean(profile.securityReviewReceiptRef)
    && profile.sandboxEnabled
    && !profile.productionPublishAllowed;
}

export const DEVELOPER_PORTAL_POLICY = {
  productionMutationAllowed: false,
  contractRequired: true,
  legalReviewRequired: true,
  securityReviewRequired: true,
  secretsInPortalResponses: false,
  topSecretExternalSync: false,
} as const;
