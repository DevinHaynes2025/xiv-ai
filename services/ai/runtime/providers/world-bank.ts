import { nowIso } from '../actions';
import type { LicenseUseStatus } from '../realtime/types';

export type SourceCadence = 'live' | 'near_real_time' | 'periodic' | 'historical' | 'stale' | 'unavailable';

export type WorldBankObservation = {
  sourceId: 'world_bank_open_data';
  sourceSystem: 'world_bank';
  sourceUrl: string;
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
  connected: boolean;
  live: false;
  prototype: boolean;
};

export const WORLD_BANK_LICENSE: LicenseUseStatus = {
  licenseStatus: 'permitted',
  attributionRequired: true,
  redistributionAllowed: true,
  retentionLimit: null,
};

export const WORLD_BANK_PROVIDER_STATUS = 'not_configured' as const;

let lastFetchConnected = false;

export function markWorldBankFetchConnected(connected: boolean) {
  lastFetchConnected = connected;
}

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
  const sourceUrl = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorId}?format=json`;
  return {
    sourceId: 'world_bank_open_data',
    sourceSystem: 'world_bank',
    sourceUrl,
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
    live: false,
    prototype: true,
  };
}

export async function fetchWorldBankObservation(input: {
  countryCode: string;
  indicatorId?: string;
}): Promise<WorldBankObservation | { allowed: false; reason: string; cadence: 'unavailable' }> {
  const indicatorId = input.indicatorId ?? 'NY.GDP.MKTP.CD';
  const sourceUrl = `https://api.worldbank.org/v2/country/${encodeURIComponent(input.countryCode)}/indicator/${encodeURIComponent(indicatorId)}?format=json&per_page=5`;
  try {
    const response = await fetch(sourceUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return { allowed: false, reason: `World Bank HTTP ${response.status}`, cadence: 'unavailable' };
    }
    const body = (await response.json()) as unknown;
    const rows = Array.isArray(body) && Array.isArray(body[1]) ? body[1] : [];
    const row = rows.find((item) => item && typeof item === 'object' && item !== null) as
      | {
          country?: { id?: string; value?: string };
          indicator?: { id?: string; value?: string };
          date?: string;
          value?: number | null;
        }
      | undefined;
    if (!row) {
      return { allowed: false, reason: 'World Bank returned no observation rows.', cadence: 'unavailable' };
    }
    const mapped = mapWorldBankRecord(row);
    if ('allowed' in mapped) return { ...mapped, cadence: 'unavailable' };
    markWorldBankFetchConnected(true);
    return {
      ...mapped,
      sourceUrl,
      connected: true,
      live: false,
      prototype: false,
      cadence: 'historical',
      freshness: mapped.value === null ? 'unknown' : 'aging',
    };
  } catch (error) {
    return {
      allowed: false,
      reason: error instanceof Error ? error.message : 'World Bank fetch failed.',
      cadence: 'unavailable',
    };
  }
}

export function worldBankIsRealtime() {
  return false;
}

export function worldBankProviderConnected() {
  return lastFetchConnected;
}
