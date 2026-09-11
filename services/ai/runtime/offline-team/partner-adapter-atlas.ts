export type PartnerState = 'TARGET' | 'RESEARCH' | 'API_READY' | 'CONTRACT_REVIEW' | 'VERIFIED_PARTNER';
export type PartnerDomain = 'OS' | 'HARDWARE' | 'SPACE' | 'AVIATION' | 'HEALTHCARE' | 'MOTORSPORT' | 'MOBILE' | 'LAPTOP' | 'CLOUD' | 'OTHER';

export interface PartnerAdapterTarget {
  name: string;
  domain: PartnerDomain;
  state: PartnerState;
  apiReceiptRef?: string;
  contractReceiptRef?: string;
  benchmarkReceiptRef?: string;
}

export function partnerState(target: PartnerAdapterTarget): PartnerState {
  if (target.apiReceiptRef && target.contractReceiptRef) return 'VERIFIED_PARTNER';
  if (target.contractReceiptRef) return 'CONTRACT_REVIEW';
  if (target.apiReceiptRef) return 'API_READY';
  return target.state;
}

export const PARTNER_ATLAS_SEEDS: PartnerAdapterTarget[] = [
  { name: 'Microsoft Windows', domain: 'OS', state: 'TARGET' },
  { name: 'ASUS', domain: 'HARDWARE', state: 'TARGET' },
  { name: 'AMD', domain: 'HARDWARE', state: 'TARGET' },
  { name: 'NVIDIA', domain: 'HARDWARE', state: 'TARGET' },
  { name: 'NASA', domain: 'SPACE', state: 'RESEARCH' },
  { name: 'Aviation Systems', domain: 'AVIATION', state: 'RESEARCH' },
  { name: 'Hospital Equipment Platforms', domain: 'HEALTHCARE', state: 'RESEARCH' },
  { name: 'Formula 1 Technology', domain: 'MOTORSPORT', state: 'RESEARCH' },
  { name: 'NASCAR Technology', domain: 'MOTORSPORT', state: 'RESEARCH' },
];
