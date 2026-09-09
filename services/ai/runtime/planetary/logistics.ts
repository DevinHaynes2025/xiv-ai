import type { ProviderCapabilityStatus } from './types';

export type LogisticsDomain = 'transportation' | 'parcel' | 'freight' | 'cargo' | 'port' | 'trade' | 'telematics';

export type LogisticsIntelligenceRecord = {
  domain: LogisticsDomain;
  provider: string;
  status: ProviderCapabilityStatus;
  fabricated: false;
};

export const LOGISTICS_PROVIDER_IDS = [
  'carrier_telematics',
  'ocean_ais',
  'air_cargo',
  'rail',
  'port_terminal',
  'customs',
  'trade_compliance',
] as const;

export function logisticsProviderStatus(id: (typeof LOGISTICS_PROVIDER_IDS)[number]): ProviderCapabilityStatus {
  void id;
  return 'NOT_CONFIGURED';
}

export function telematicsConnectivityIsLocationAuthority(): false {
  return false;
}

export function createLogisticsIntelligence(input: {
  domain: LogisticsDomain;
  provider: string;
  evidence?: { source: string; retrievedAt: string; reference: string } | null;
}): LogisticsIntelligenceRecord | { allowed: false; reason: string } {
  if (!input.evidence?.source || !input.evidence.retrievedAt || !input.evidence.reference) {
    return { allowed: false, reason: `${input.domain}_event_requires_evidence` };
  }
  return {
    domain: input.domain,
    provider: input.provider,
    status: 'NOT_CONFIGURED',
    fabricated: false,
  };
}

export function everyCarrierConnected(): false {
  return false;
}
