import { nowIso } from '../actions';
import type { LicenseUseStatus } from '../realtime/types';

export type SourceCadence = 'live' | 'near_real_time' | 'periodic' | 'historical' | 'stale' | 'unavailable';

export type WorldBankObservation = {
  sourceId: 'world_bank_open_data';
  sourceSystem: 'world_bank';
  sourceRecordId: string;
  countryCode: string;
  indicatorId: string;
  indicatorName: string;
  period: string;
  value: number | null;
  retrievedAt: string;
  eventTime: string | null;
  cadence: SourceCadence;
  freshness: 'fresh' | 'aging' | 'stale' | 'unknown' | 'not_configured';
  jurisdiction: string;
  license: LicenseUseStatus;
  confidence: 'low' | 'medium' | 'high' | 'not_measured';
  attributionRequired: true;
  connected: false;
};

export const WORLD_BANK_LICENSE: LicenseUseStatus = {
  licenseStatus: 'permitted',
  attributionRequired: true,
  redistributionAllowed: true,
  retentionLimit: null,
};

export const WORLD_BANK_PROVIDER_STATUS = 'not_configured' as const;

export function worldBankAttribution() {
  return 'World Bank Open Data. CC BY 4.0. Attribution required. Not XIV-originated statistics.';
}

export function mapWorldBankRecord(input: {
  countryiso3code?: string;
  country?: { id?: string; value?: string };
  indicator?: { id?: string; value?: string };
  date?: string;
  value?: number | null;
}): WorldBankObservation | { allowed: false; reason: string } {
  const countryCode = input.country?.id ?? '';
  const indicatorId = input.indicator?.id ?? '';
  if (!countryCode || !indicatorId || !input.date) {
    return { allowed: false, reason: 'World Bank observation requires country, indicator, and period provenance: DENY' };
  }
  return {
    sourceId: 'world_bank_open_data',
    sourceSystem: 'world_bank',
    sourceRecordId: `${countryCode}:${indicatorId}:${input.date}`,
    countryCode,
    indicatorId,
    indicatorName: input.indicator?.value ?? indicatorId,
    period: input.date,
    value: typeof input.value === 'number' ? input.value : null,
    retrievedAt: nowIso(),
    eventTime: /^\d{4}$/.test(input.date) ? `${input.date}-12-31T00:00:00.000Z` : null,
    cadence: 'historical',
    freshness: 'unknown',
    jurisdiction: countryCode,
    license: WORLD_BANK_LICENSE,
    confidence: typeof input.value === 'number' ? 'medium' : 'not_measured',
    attributionRequired: true,
    connected: false,
  };
}

export function worldBankIsRealtime() {
  return false;
}

export function worldBankProviderConnected() {
  return false;
}
