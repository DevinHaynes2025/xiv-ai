export type PartnerStage = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
export type Industry = 'HEALTHCARE' | 'GENEALOGY' | 'SOCIAL' | 'ECOMMERCE' | 'GAMING' | 'FINANCE' | 'CONSULTING' | 'RETAIL' | 'FASHION' | 'COSMETICS' | 'CHIPS' | 'TELECOM' | 'OTHER';

export interface PartnerAdapterTarget {
  id: string;
  name: string;
  industry: Industry;
  stage: PartnerStage;
  apiDocsRef?: string;
  agreementReceiptRef?: string;
  dataClasses: string[];
  consentRequired: boolean;
  regulatedData: boolean;
}

export function isVerifiedPartner(target: PartnerAdapterTarget): boolean {
  return target.stage === 'VERIFIED_PARTNER' && Boolean(target.agreementReceiptRef);
}

export function canExchangePrivateData(target: PartnerAdapterTarget): boolean {
  return isVerifiedPartner(target) && target.consentRequired && Boolean(target.apiDocsRef);
}

export const PARTNER_REGISTRY_GUARDRAILS = {
  targetIsNotPartnership: true,
  apiReadyIsNotPartnership: true,
  regulatedDataNeedsPolicyReview: true,
  userConsentRequiredForPrivateData: true,
} as const;
