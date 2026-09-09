import type { LogisticsIntegratorId, ResearchProviderStatus } from './types';

export const LOGISTICS_INTEGRATORS: readonly LogisticsIntegratorId[] = [
  'amazon_shipping',
  'uber_direct',
  'lyft',
  'ups',
  'fedex',
  'usps',
  'dhl',
  'maersk',
];

export type LogisticsDomain = 'parcel' | 'freight' | 'cargo' | 'last_mile' | 'fulfillment' | 'trade';

export type TrackingObservation = {
  allowed: boolean;
  fabricated: false;
  reason?: string;
  domain: LogisticsDomain;
};

export type CommerceCustomerRecord = {
  classification: 'TENANT_PRIVATE';
  tenantId: string;
  mayEnterGlobalBrain: false;
};

export function logisticsIntegrationStatus(id: LogisticsIntegratorId): ResearchProviderStatus {
  void id;
  return 'NOT_CONFIGURED';
}

export function externalIntegrationsRemainNotConfigured(): boolean {
  return LOGISTICS_INTEGRATORS.every((id) => logisticsIntegrationStatus(id) === 'NOT_CONFIGURED');
}

export function fabricateParcelTracking(input: { trackingNumber?: string; inventedLocation?: string }): TrackingObservation {
  void input;
  return { allowed: false, fabricated: false, reason: 'parcel_tracking_cannot_be_fabricated', domain: 'parcel' };
}

export function normalizeLogisticsEvent(input: {
  domain: LogisticsDomain;
  evidence?: { source: string; retrievedAt: string; reference: string } | null;
}): TrackingObservation {
  if (!input.evidence?.source || !input.evidence.retrievedAt || !input.evidence.reference) {
    return { allowed: false, fabricated: false, reason: 'logistics_event_requires_evidence', domain: input.domain };
  }
  return { allowed: true, fabricated: false, domain: input.domain };
}

export function commerceCustomerRecord(tenantId: string): CommerceCustomerRecord {
  return { classification: 'TENANT_PRIVATE', tenantId, mayEnterGlobalBrain: false };
}

export function commerceCustomerDataStaysPrivate(record: CommerceCustomerRecord): boolean {
  return record.classification === 'TENANT_PRIVATE' && record.mayEnterGlobalBrain === false;
}
