export type AdapterState = 'TARGET' | 'RESEARCH' | 'API_READY' | 'CONTRACT_REVIEW' | 'VERIFIED_PARTNER';
export type AdapterDomain = 'MOBILITY' | 'STREAMING' | 'SMART_TV' | 'MAPS' | 'TRANSIT' | 'AUTOMOTIVE' | 'ECOMMERCE';

export interface PartnerAdapter {
  adapterId: string;
  providerName: string;
  domain: AdapterDomain;
  state: AdapterState;
  apiReceiptRef?: string;
  contractReceiptRef?: string;
  userConsentRequired: boolean;
  rawPrivateDataAllowed: false;
}

export function isVerifiedPartner(adapter: PartnerAdapter): boolean {
  return adapter.state === 'VERIFIED_PARTNER' && !!adapter.apiReceiptRef && !!adapter.contractReceiptRef;
}

export const adapterLabPolicy = {
  noPartnershipClaimWithoutReceipt: true,
  topSecretExternalTransfer: false,
  sellAggregatedInsightsNotRawHistories: true,
  smartTvViewingRequiresConsent: true,
};
