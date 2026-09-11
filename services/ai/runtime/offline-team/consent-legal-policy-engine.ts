export type PolicyScope = 'PRIVACY' | 'TERMS' | 'WAIVER' | 'FINANCIAL_DATA' | 'DEVICE_ACCESS' | 'MARKETPLACE';

export interface LegalPolicyReceipt {
  receiptId: string;
  tenantId: string;
  userId: string;
  scope: PolicyScope;
  jurisdiction: string;
  policyVersion: string;
  acceptedAt: string;
  revokedAt?: string;
  legalReviewStatus: 'DRAFT' | 'COUNSEL_REVIEWED' | 'APPROVED';
}

export function isPolicyActive(receipt: LegalPolicyReceipt): boolean {
  return receipt.legalReviewStatus === 'APPROVED' && !receipt.revokedAt;
}

export const LEGAL_POLICY_GUARDRAILS = {
  oneContractCoversEveryJurisdiction: false,
  jurisdictionSpecificReviewRequired: true,
  revocationSupported: true,
  acceptanceMustBeVersioned: true,
  legalAdviceAutomationAllowed: false,
};
