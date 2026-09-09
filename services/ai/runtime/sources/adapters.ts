import { nowIso } from '../actions';
import {
  fetchWorldBankObservations,
  isWorldBankDenied,
  isWorldBankObservation,
  mapWorldBankRecord,
  worldBankProviderConnected,
} from '../providers/world-bank';
import {
  enforceSecBounds,
  fetchSecCompanyBundle,
  isSecDenied,
  padSecCik,
  SEC_PROVIDER_ID,
  SEC_USAGE_RIGHTS,
} from '../providers/sec-edgar';
import type { BusinessDataAdapter, BusinessDataAdapterError, BusinessDataAdapterRequest } from './adapter';
import { canIngestFromProvider } from './registry';
import { secAdapterCapabilityStatus } from './sec-status';
import { worldBankAdapterCapabilityStatus } from './world-bank-status';

function deny(reason: string): BusinessDataAdapterError {
  return { allowed: false, reason };
}

export function createUnconfiguredAdapter(providerId: string): BusinessDataAdapter {
  return {
    providerId,
    async fetch() {
      return deny('Unconfigured provider cannot ingest.');
    },
    normalize() {
      return deny('Unconfigured provider cannot ingest.');
    },
    validate() {
      return { ok: false, reason: 'Unconfigured provider cannot ingest.' };
    },
    classify() {
      return 'unknown';
    },
    attachProvenance() {
      return deny('Missing provenance rejected.');
    },
    deduplicate(records) {
      return records;
    },
    recordFreshness() {
      return 'unknown';
    },
    health() {
      return { providerId, reachable: false, status: 'not_configured' };
    },
  };
}

export function createWorldBankAdapter(): BusinessDataAdapter {
  return {
    providerId: 'world_bank_open_data',
    async fetch(request: BusinessDataAdapterRequest) {
      const gate = canIngestFromProvider('world_bank_open_data');
      if (!gate.allowed) return deny(gate.reason);
      const countryCode = request.query.countryCode;
      const indicatorId = request.query.indicatorId;
      if (!countryCode || !indicatorId) {
        return deny('World Bank fetch requires countryCode and indicatorId.');
      }
      const series = await fetchWorldBankObservations({
        countryCode,
        indicatorId,
        dateStart: request.query.dateStart,
        dateEnd: request.query.dateEnd,
        perPage: request.query.perPage ? Number(request.query.perPage) : 5,
      });
      if (isWorldBankDenied(series)) {
        return deny(series.reason);
      }
      const observations = series.observations.filter(isWorldBankObservation);
      const first = observations[0];
      if (!first) {
        return deny('World Bank returned no validated observation rows.');
      }
      return {
        allowed: true as const,
        records: observations.map((observation) => ({ ...observation }) as Record<string, unknown>),
        provenance: {
          sourceId: first.sourceId,
          sourceRecordId: first.sourceRecordId,
          retrievedAt: first.retrievedAt,
          publisher: 'World Bank',
          licenseType: 'CC-BY-4.0',
          usageRights: 'Public open data. Attribution required.',
        },
        freshness: first.freshness,
        fabricated: false as const,
      };
    },
    normalize(record) {
      const mapped = mapWorldBankRecord({
        country: { id: String(record.countryCode ?? record.country ?? '') },
        indicator: { id: String(record.indicatorId ?? ''), value: String(record.indicatorName ?? '') },
        date: String(record.period ?? record.date ?? ''),
        value: typeof record.value === 'number' ? record.value : null,
      });
      if (isWorldBankDenied(mapped)) return deny(mapped.reason);
      if (!isWorldBankObservation(mapped)) {
        return deny('World Bank normalize rejected a result missing sourceRecordId, retrievedAt, or freshness.');
      }
      return { ...mapped } as Record<string, unknown>;
    },
    validate(record) {
      if (!record.sourceId || !record.sourceRecordId) {
        return { ok: false, reason: 'Missing provenance rejected.' };
      }
      return { ok: true, reason: 'World Bank provenance present.' };
    },
    classify() {
      return 'public';
    },
    attachProvenance(record) {
      if (!record.sourceId || !record.sourceRecordId) return deny('Missing provenance rejected.');
      return {
        sourceId: String(record.sourceId),
        sourceRecordId: String(record.sourceRecordId),
        retrievedAt: String(record.retrievedAt ?? nowIso()),
        publisher: 'World Bank',
        licenseType: 'CC-BY-4.0',
        usageRights: 'Public open data. Attribution required.',
      };
    },
    deduplicate(records) {
      const seen = new Set<string>();
      return records.filter((row) => {
        const key = String(row.sourceRecordId ?? '');
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    recordFreshness(record) {
      return String(record.freshness ?? 'unknown');
    },
    health() {
      return {
        providerId: 'world_bank_open_data',
        reachable: worldBankProviderConnected(),
        status: worldBankAdapterCapabilityStatus() === 'LIVE' ? 'live_validated' : 'authorized',
      };
    },
  };
}

export function createSecEdgarAdapter(): BusinessDataAdapter {
  return {
    providerId: SEC_PROVIDER_ID,
    async fetch(request: BusinessDataAdapterRequest) {
      const gate = canIngestFromProvider(SEC_PROVIDER_ID);
      if (!gate.allowed) return deny(gate.reason);
      const bounds = enforceSecBounds({
        bulk: request.query.bulk === 'true',
        maxFilings: request.query.maxFilings ? Number(request.query.maxFilings) : undefined,
        companyCount: 1,
      });
      if (!bounds.allowed) return deny(bounds.reason);
      const cik = padSecCik(request.query.cik);
      if (!cik) return deny('SEC fetch requires a CIK. Bounded identity only.');
      const bundle = await fetchSecCompanyBundle({ cik, maxFilings: bounds.maxFilings });
      if (isSecDenied(bundle)) return deny(bundle.reason);
      const records = [bundle.identity, ...bundle.filings, ...bundle.facts].map((row) => ({ ...row }) as Record<string, unknown>);
      return {
        allowed: true as const,
        records,
        provenance: {
          sourceId: bundle.identity.sourceId,
          sourceRecordId: bundle.identity.sourceRecordId,
          retrievedAt: bundle.identity.retrievedAt,
          publisher: 'U.S. SEC EDGAR',
          licenseType: 'us_government_public',
          usageRights: SEC_USAGE_RIGHTS,
        },
        freshness: bundle.identity.freshness,
        fabricated: false as const,
      };
    },
    normalize(record) {
      if (!record.sourceId || !record.sourceRecordId) return deny('Missing provenance rejected.');
      return record;
    },
    validate(record) {
      if (!record.sourceId || !record.sourceRecordId) {
        return { ok: false, reason: 'Missing provenance rejected.' };
      }
      return { ok: true, reason: 'SEC provenance present.' };
    },
    classify() {
      return 'public';
    },
    attachProvenance(record) {
      if (!record.sourceId || !record.sourceRecordId) return deny('Missing provenance rejected.');
      return {
        sourceId: String(record.sourceId),
        sourceRecordId: String(record.sourceRecordId),
        retrievedAt: String(record.retrievedAt ?? nowIso()),
        publisher: 'U.S. SEC EDGAR',
        licenseType: 'us_government_public',
        usageRights: SEC_USAGE_RIGHTS,
      };
    },
    deduplicate(records) {
      const seen = new Set<string>();
      return records.filter((row) => {
        const key = String(row.sourceRecordId ?? '');
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    recordFreshness(record) {
      return String(record.freshness ?? 'unknown');
    },
    health() {
      return {
        providerId: SEC_PROVIDER_ID,
        reachable: secAdapterCapabilityStatus() === 'LIVE',
        status: secAdapterCapabilityStatus() === 'LIVE' ? 'live_validated' : 'authorized',
      };
    },
  };
}

export function createBlsAdapter(): BusinessDataAdapter {
  return createUnconfiguredAdapter('us_bls');
}

export function createFredAdapter(): BusinessDataAdapter {
  return createUnconfiguredAdapter('us_fred');
}

export function createCensusAdapter(): BusinessDataAdapter {
  return createUnconfiguredAdapter('us_census');
}

export function adapterForProvider(providerId: string): BusinessDataAdapter {
  if (providerId === 'world_bank_open_data') return createWorldBankAdapter();
  if (providerId === 'us_sec_edgar') return createSecEdgarAdapter();
  if (providerId === 'us_bls') return createBlsAdapter();
  if (providerId === 'us_fred') return createFredAdapter();
  if (providerId === 'us_census') return createCensusAdapter();
  return createUnconfiguredAdapter(providerId);
}
