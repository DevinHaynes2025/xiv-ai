/**
 * Bounded GLEIF Legal Entity Identifier client.
 * Official api.gleif.org only. Public LEI reference data. No API key.
 * Does not invent filings or financial facts.
 */
import { nowIso } from '../actions';
import type {
  InternationalCompanyAdapterResult,
  InternationalCompanyEvent,
  InternationalCompanyIdentity,
  InternationalCompanyProvenance,
  InternationalCompanyQuery,
  InternationalCompanyRecord,
} from './types';

export const GLEIF_PROVIDER_ID = 'gleif_lei' as const;
export const GLEIF_PUBLISHER = 'GLEIF';
export const GLEIF_LICENSE_TYPE = 'public_lei_reference';
export const GLEIF_USAGE_RIGHTS =
  'GLEIF LEI reference data. Attribution to GLEIF. Bounded identity lookup only. Not market data.';
export const GLEIF_USER_AGENT =
  'XIV-AI/2I-H InternationalCompanyIntelligence (bounded LEI research; not a scraper; https://xiv.ai)';
export const GLEIF_MAX_RECORDS = 3;
export const GLEIF_ORIGIN = 'https://api.gleif.org';

export type GleifDeniedResult = { allowed: false; reason: string };

type GleifName = { name?: unknown; language?: unknown };
type GleifAddress = {
  addressLines?: unknown;
  city?: unknown;
  region?: unknown;
  country?: unknown;
  postalCode?: unknown;
};
type GleifEntity = {
  legalName?: GleifName | string;
  otherEntityNames?: unknown;
  status?: unknown;
  jurisdiction?: unknown;
  legalForm?: { id?: unknown };
  legalAddress?: GleifAddress;
  headquartersAddress?: GleifAddress;
};
type GleifRegistration = {
  initialRegistrationDate?: unknown;
  lastUpdateDate?: unknown;
  status?: unknown;
  validatedAs?: unknown;
};
type GleifAttributes = {
  entity?: GleifEntity;
  registration?: GleifRegistration;
};
type GleifResource = { id?: unknown; attributes?: GleifAttributes };

function deny(reason: string): GleifDeniedResult {
  return { allowed: false, reason };
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function legalNameOf(entity: GleifEntity | undefined) {
  const raw = entity?.legalName;
  if (typeof raw === 'string') return raw.trim() || null;
  if (raw && typeof raw === 'object') return text(raw.name);
  return null;
}

function addressLine(address: GleifAddress | undefined) {
  if (!address) return null;
  const lines = Array.isArray(address.addressLines)
    ? address.addressLines.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const parts = [...lines, text(address.city), text(address.region), text(address.postalCode), text(address.country)].filter(
    Boolean,
  );
  return parts.length ? parts.join(', ') : null;
}

function provenance(sourceRecordId: string, retrievedAt: string): InternationalCompanyProvenance {
  return {
    provider: GLEIF_PROVIDER_ID,
    sourceId: GLEIF_PROVIDER_ID,
    sourceRecordId,
    retrievedAt,
    publisher: GLEIF_PUBLISHER,
    licenseType: GLEIF_LICENSE_TYPE,
    usageRights: GLEIF_USAGE_RIGHTS,
    fabricated: false,
  };
}

export function mapGleifResource(resource: GleifResource, retrievedAt = nowIso()): InternationalCompanyRecord | GleifDeniedResult {
  const lei = text(resource.id);
  const entity = resource.attributes?.entity;
  const registration = resource.attributes?.registration;
  const legalName = legalNameOf(entity);
  if (!lei || !legalName) {
    return deny('GLEIF record missing LEI or legal name. Record is not fabricated.');
  }
  const country = text(entity?.jurisdiction) ?? text(entity?.legalAddress?.country);
  if (!country) {
    return deny('GLEIF record missing jurisdiction. Name-only identity is rejected.');
  }
  const companyNumber = text(registration?.validatedAs);
  const registry = country === 'GB' && companyNumber ? 'uk_companies_house' : null;
  const identity: InternationalCompanyIdentity = {
    country,
    region: text(entity?.legalAddress?.region),
    registry,
    registryId: companyNumber,
    companyNumber,
    lei,
    exchange: null,
    ticker: null,
    currency: country === 'GB' ? 'GBP' : country === 'US' ? 'USD' : null,
    language: text(typeof entity?.legalName === 'object' ? entity?.legalName?.language : null) ?? 'en',
    legalName,
    tradingName: null,
    status: text(entity?.status),
    incorporationDate: text(registration?.initialRegistrationDate),
    industry: null,
    registeredAddress: addressLine(entity?.legalAddress),
    source: GLEIF_PROVIDER_ID,
    retrievedAt,
  };
  const events: InternationalCompanyEvent[] = [];
  if (identity.incorporationDate) {
    events.push({
      eventType: 'registration',
      source: GLEIF_PROVIDER_ID,
      sourceTimestamp: identity.incorporationDate,
      retrievedAt,
      jurisdiction: country,
      evidence: `${lei}:${identity.incorporationDate}`,
      verificationState: 'SUPPORTED',
    });
  }
  if (identity.status) {
    events.push({
      eventType: 'status_change',
      source: GLEIF_PROVIDER_ID,
      sourceTimestamp: text(registration?.lastUpdateDate),
      retrievedAt,
      jurisdiction: country,
      evidence: `${lei}:${identity.status}`,
      verificationState: 'SUPPORTED',
    });
  }
  return {
    identity,
    officers: [],
    filings: [],
    events,
    facts: [],
    provenance: provenance(`lei:${lei}`, retrievedAt),
    fabricated: false,
  };
}

function encodeGleifSearch(query: InternationalCompanyQuery) {
  const params = new URLSearchParams();
  params.set('page[size]', String(Math.min(Math.max(query.limit ?? 1, 1), GLEIF_MAX_RECORDS)));
  if (query.legalName) params.set('filter[entity.legalName]', query.legalName);
  if (query.jurisdiction) params.set('filter[entity.jurisdiction]', query.jurisdiction);
  return `${GLEIF_ORIGIN}/api/v1/lei-records?${params.toString()}`;
}

function encodeGleifLei(lei: string) {
  return `${GLEIF_ORIGIN}/api/v1/lei-records/${encodeURIComponent(lei)}`;
}

async function gleifGet(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.api+json',
      'User-Agent': GLEIF_USER_AGENT,
    },
  });
  if (!response.ok) {
    return deny(`GLEIF HTTP ${response.status}`);
  }
  return (await response.json()) as { data?: GleifResource | GleifResource[] };
}

export async function fetchGleifCompanies(query: InternationalCompanyQuery): Promise<InternationalCompanyAdapterResult> {
  if (!query.legalName && !query.lei) {
    return deny('GLEIF query requires a legal name or LEI. Name-less browse is denied.');
  }
  try {
    const url = query.lei ? encodeGleifLei(query.lei) : encodeGleifSearch(query);
    const body = await gleifGet(url);
    if ('allowed' in body) return body;
    const rows = Array.isArray(body.data) ? body.data : body.data ? [body.data] : [];
    const records: InternationalCompanyRecord[] = [];
    for (const row of rows.slice(0, GLEIF_MAX_RECORDS)) {
      const mapped = mapGleifResource(row);
      if ('allowed' in mapped && mapped.allowed === false) continue;
      if ('identity' in mapped) records.push(mapped);
    }
    if (records.length === 0) {
      return deny('GLEIF returned no validated legal-entity records.');
    }
    return { allowed: true, fabricated: false, records };
  } catch (error) {
    return deny(error instanceof Error ? error.message : 'GLEIF fetch failed.');
  }
}

export function gleifUserAgentContainsSecrets() {
  return false;
}
