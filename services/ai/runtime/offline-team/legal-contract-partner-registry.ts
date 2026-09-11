export type PartnerState = 'TARGET'|'RESEARCH'|'API_READY'|'CONTRACT_REVIEW'|'VERIFIED_PARTNER';
export type ContractType = 'PRIVACY'|'DATA_PROCESSING'|'BUSINESS'|'API'|'SECURITY'|'MARKETPLACE'|'E_SIGNATURE';

export interface PartnerContractRecord {
  partnerId: string;
  displayName: string;
  state: PartnerState;
  contractType: ContractType;
  jurisdiction: string[];
  agreementReceiptId?: string;
  apiReceiptId?: string;
  humanApproved: boolean;
  dataScopes: string[];
}

export function isVerifiedPartner(r: PartnerContractRecord): boolean {
  return r.state === 'VERIFIED_PARTNER' && !!r.agreementReceiptId && r.humanApproved;
}

export function mayExchangePrivateData(r: PartnerContractRecord): boolean {
  return isVerifiedPartner(r) && !!r.apiReceiptId && r.dataScopes.length > 0;
}

export const legalRegistryPolicy = {
  oneGlobalContractSatisfiesAllJurisdictions: false,
  jurisdictionReviewRequired: true,
  electronicSignatureProviderTargetAllowed: true,
  partnershipClaimsRequireReceipt: true,
  ethicalSecurityTestingRequiresAuthorization: true,
};
