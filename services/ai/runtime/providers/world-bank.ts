import { nowIso } from '../actions';
import type { LicenseUseStatus } from '../realtime/types';

export type SourceCadence = 'live' | 'near_real_time' | 'periodic' | 'historical' | 'stale' | 'unavailable';

export type WorldBankDeniedResult = {
  allowed: false;
  reason: string;
  cadence: 'unavailable';
};

export type WorldBankSeriesResult = {
  allowed: true;
  fabricated: false;
  observations: readonly WorldBankObservation[];
};

const MAX_WORLD_BANK_ROWS = 8;

type WorldBankApiRow = {
  country?: { id?: string; value?: string };
  indicator?: { id?: string; value?: string };
  date?: string;
  value?: number | null;
};

export function isWorldBankDenied(result: object): result is { allowed: false; reason: string } {
  return 'allowed' in result && (result as { allowed: unknown }).allowed === false;
}

export function isWorldBankObservation(result: object): result is WorldBankObservation {
  if (isWorldBankDenied(result)) return false;
  const candidate = result as Partial<WorldBankObservation>;
  return (
    candidate.sourceId === 'world_bank_open_data' &&
    typeof candidate.sourceRecordId === 'string' &&
    candidate.sourceRecordId.length > 0 &&
    typeof candidate.retrievedAt === 'string' &&
    candidate.retrievedAt.length > 0 &&
    typeof candidate.freshness === 'string' &&
    candidate.freshness.length > 0
  );
}

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

function denyWorldBank(reason: string): WorldBankDeniedResult {
  return { allowed: false, reason, cadence: 'unavailable' };
}

function worldBankSourceUrl(input: {
  countryCode: string;
  indicatorId: string;
  perPage: number;
  dateStart?: string;
  dateEnd?: string;
}) {
  const params = new URLSearchParams({ format: 'json', per_page: String(input.perPage) });
  if (input.dateStart && input.dateEnd) {
    params.set('date', `${input.dateStart}:${input.dateEnd}`);
  }
  return `https://api.worldbank.org/v2/country/${encodeURIComponent(input.countryCode)}/indicator/${encodeURIComponent(input.indicatorId)}?${params.toString()}`;
}

function finalizeFetchedObservation(mapped: WorldBankObservation, sourceUrl: string): WorldBankObservation {
  return {
    ...mapped,
    sourceUrl,
    connected: true,
    live: false,
    prototype: false,
    cadence: 'historical',
    freshness: mapped.value === null ? 'unknown' : 'aging',
  };
}

export async function fetchWorldBankObservations(input: {
  countryCode: string;
  indicatorId: string;
  dateStart?: string;
  dateEnd?: string;
  perPage?: number;
}): Promise<WorldBankSeriesResult | WorldBankDeniedResult> {
  const perPage = Math.min(Math.max(input.perPage ?? 5, 1), MAX_WORLD_BANK_ROWS);
  const sourceUrl = worldBankSourceUrl({
    countryCode: input.countryCode,
    indicatorId: input.indicatorId,
    perPage,
    dateStart: input.dateStart,
    dateEnd: input.dateEnd,
  });
  try {
    const response = await fetch(sourceUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return denyWorldBank(`World Bank HTTP ${response.status}`);
    }
    const body = (await response.json()) as unknown;
    const rows = Array.isArray(body) && Array.isArray(body[1]) ? body[1] : [];
    const observations: WorldBankObservation[] = [];
    for (const item of rows) {
      if (!item || typeof item !== 'object') continue;
      const mapped = mapWorldBankRecord(item as WorldBankApiRow);
      if (isWorldBankDenied(mapped)) continue;
      if (!isWorldBankObservation(mapped)) continue;
      observations.push(finalizeFetchedObservation(mapped, sourceUrl));
    }
    if (observations.length === 0) {
      return denyWorldBank('World Bank returned no observation rows.');
    }
    markWorldBankFetchConnected(true);
    return { allowed: true, fabricated: false, observations };
  } catch (error) {
    return denyWorldBank(error instanceof Error ? error.message : 'World Bank fetch failed.');
  }
}

export async function fetchWorldBankObservation(input: {
  countryCode: string;
  indicatorId?: string;
}): Promise<WorldBankObservation | WorldBankDeniedResult> {
  const series = await fetchWorldBankObservations({
    countryCode: input.countryCode,
    indicatorId: input.indicatorId ?? 'NY.GDP.MKTP.CD',
    perPage: 5,
  });
  if (isWorldBankDenied(series)) return series;
  const first = series.observations[0];
  if (!first || !isWorldBankObservation(first)) {
    return denyWorldBank('World Bank returned no observation rows.');
  }
  return first;
}

export function worldBankIsRealtime() {
  return false;
}

export function worldBankProviderConnected() {
  return lastFetchConnected;
}
