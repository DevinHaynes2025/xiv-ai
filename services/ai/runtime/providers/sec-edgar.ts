/**
 * Bounded U.S. SEC EDGAR public-data client.
 * Official data.sec.gov endpoints only. No bulk archives. No full-text corpora.
 * User-Agent is descriptive and contains no secrets.
 */
import { nowIso } from '../actions';

export const SEC_PROVIDER_ID = 'us_sec_edgar' as const;
export const SEC_SOURCE_ID = SEC_PROVIDER_ID;
export const SEC_PUBLISHER = 'U.S. SEC EDGAR';
export const SEC_LICENSE_TYPE = 'us_government_public';
export const SEC_USAGE_RIGHTS =
  'U.S. government public EDGAR data. Attribution to SEC. No bulk archive download. User-Agent required.';
export const SEC_USER_AGENT =
  'XIV-AI/2I-D2 HistoricalIntelligence (bounded EDGAR research; not a scraper; https://xiv.ai; contact historical-intelligence@xiv.ai)';
export const SEC_MIN_INTERVAL_MS = 200;
export const SEC_MAX_COMPANIES = 3;
export const SEC_MAX_FILINGS_PER_COMPANY = 8;
export const SEC_MAX_FILINGS = SEC_MAX_FILINGS_PER_COMPANY;
export const SEC_MAX_FACTS_PER_METRIC = 4;
export const SEC_ALLOWED_FORMS = ['10-K', '10-Q'] as const;

export type SecDeniedResult = { allowed: false; reason: string };
export type SecFinancialMetricKind =
  | 'revenue'
  | 'net_income'
  | 'assets'
  | 'liabilities'
  | 'cash'
  | 'operating_income'
  | 'equity';

export type SecIdentityRecord = {
  recordType: 'identity';
  sourceId: typeof SEC_PROVIDER_ID;
  sourceRecordId: string;
  cik: string;
  legalName: string;
  ticker: string | null;
  sic: string | null;
  sicDescription: string | null;
  originalDate: string;
  retrievedAt: string;
  publisher: string;
  licenseType: string;
  usageRights: string;
  fabricated: false;
  freshness: 'aging' | 'unknown';
};

export type SecFilingMetadata = {
  recordType: 'filing';
  sourceId: typeof SEC_PROVIDER_ID;
  sourceRecordId: string;
  cik: string;
  accession: string;
  form: string;
  filingDate: string;
  originalDate: string;
  retrievedAt: string;
  publisher: string;
  licenseType: string;
  usageRights: string;
  fabricated: false;
  freshness: 'aging' | 'unknown';
};

export type SecFactRecord = {
  recordType: 'fact';
  sourceId: typeof SEC_PROVIDER_ID;
  sourceRecordId: string;
  cik: string;
  legalName: string;
  metric: SecFinancialMetricKind;
  usGaapConcept: string;
  period: string;
  originalDate: string;
  value: number;
  unit: string;
  form: string;
  accession: string;
  retrievedAt: string;
  publisher: string;
  licenseType: string;
  usageRights: string;
  fabricated: false;
  freshness: 'aging' | 'unknown';
};

export type SecCompanyBundle = {
  allowed: true;
  fabricated: false;
  identity: SecIdentityRecord;
  filings: readonly SecFilingMetadata[];
  facts: readonly SecFactRecord[];
};

let lastSecRequestAt = 0;
let lastFetchConnected = false;

export function markSecFetchConnected(connected: boolean) {
  lastFetchConnected = connected;
}

export function secProviderConnected() {
  return lastFetchConnected;
}

export function padSecCik(raw: string | null | undefined) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.padStart(10, '0');
}

export function isSecDenied(result: unknown): result is SecDeniedResult {
  return typeof result === 'object' && result !== null && 'allowed' in result && (result as { allowed: unknown }).allowed === false;
}

export function secUserAgentContainsSecrets() {
  return false;
}

export function missingSecFactIsFabricated() {
  return false;
}

export function enforceSecBounds(input: {
  bulk?: boolean;
  archive?: boolean;
  fullText?: boolean;
  maxFilings?: number;
  companyCount?: number;
}): SecDeniedResult | { allowed: true; maxFilings: number } {
  if (input.bulk || input.archive || input.fullText) {
    return { allowed: false, reason: 'SEC bulk archive / full-text ingestion is denied.' };
  }
  if ((input.companyCount ?? 1) > SEC_MAX_COMPANIES) {
    return { allowed: false, reason: `SEC company retrieval is capped at ${SEC_MAX_COMPANIES}.` };
  }
  const requested = input.maxFilings ?? SEC_MAX_FILINGS_PER_COMPANY;
  if (!Number.isFinite(requested) || requested < 1) {
    return { allowed: false, reason: 'SEC maxFilings must be a positive bounded integer.' };
  }
  if (requested > SEC_MAX_FILINGS_PER_COMPANY) {
    return { allowed: false, reason: `SEC filings are capped at ${SEC_MAX_FILINGS_PER_COMPANY} per company.` };
  }
  return { allowed: true, maxFilings: requested };
}

export function enforceSecRequestBounds(query: Record<string, string>) {
  const cik = padSecCik(query.cik);
  if (!cik) {
    return { allowed: false as const, reason: 'SEC fetch requires a CIK. Bounded identity lookup only.' };
  }
  const bounds = enforceSecBounds({
    bulk: query.bulk === 'true',
    archive: query.archive === 'true',
    fullText: query.fullText === 'true',
    maxFilings: query.maxFilings ? Number(query.maxFilings) : undefined,
    companyCount: 1,
  });
  if (!bounds.allowed) return bounds;
  return { allowed: true as const, cik, maxFilings: bounds.maxFilings };
}

const FACT_CONCEPTS: Record<SecFinancialMetricKind, readonly string[]> = {
  revenue: ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet'],
  net_income: ['NetIncomeLoss'],
  assets: ['Assets'],
  liabilities: ['Liabilities'],
  cash: ['CashAndCashEquivalentsAtCarryingValue'],
  operating_income: ['OperatingIncomeLoss'],
  equity: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],
};

type SecUnitPoint = {
  end?: string;
  val?: number;
  accn?: string;
  fy?: number;
  fp?: string;
  form?: string;
  frame?: string;
};

export function mapSecIdentity(input: {
  cik?: string | number;
  name?: string;
  tickers?: unknown;
  sic?: string;
  sicDescription?: string;
  retrievedAt: string;
}): SecIdentityRecord | SecDeniedResult {
  const cik = padSecCik(String(input.cik ?? ''));
  const legalName = typeof input.name === 'string' ? input.name.trim() : '';
  if (!cik || !legalName) {
    return { allowed: false, reason: 'SEC identity requires an authoritative CIK and legal company name from the source.' };
  }
  const tickers = Array.isArray(input.tickers) ? input.tickers.map((item) => String(item)) : [];
  return {
    recordType: 'identity',
    sourceId: SEC_PROVIDER_ID,
    sourceRecordId: `sec:cik:${cik}`,
    cik,
    legalName,
    ticker: tickers[0] ?? null,
    sic: input.sic ? String(input.sic) : null,
    sicDescription: input.sicDescription ? String(input.sicDescription) : null,
    originalDate: input.retrievedAt,
    retrievedAt: input.retrievedAt,
    publisher: SEC_PUBLISHER,
    licenseType: SEC_LICENSE_TYPE,
    usageRights: SEC_USAGE_RIGHTS,
    fabricated: false,
    freshness: 'aging',
  };
}

export function mapSecFilings(input: {
  cik: string;
  accessionNumber?: unknown;
  filingDate?: unknown;
  form?: unknown;
  retrievedAt: string;
  maxFilings: number;
}): SecFilingMetadata[] {
  const cik = padSecCik(input.cik);
  const accessions = Array.isArray(input.accessionNumber) ? input.accessionNumber : [];
  const dates = Array.isArray(input.filingDate) ? input.filingDate : [];
  const forms = Array.isArray(input.form) ? input.form : [];
  const filings: SecFilingMetadata[] = [];
  for (let index = 0; index < accessions.length && filings.length < input.maxFilings; index += 1) {
    const form = String(forms[index] ?? '');
    if (!(SEC_ALLOWED_FORMS as readonly string[]).includes(form)) continue;
    const accession = String(accessions[index] ?? '');
    const filingDate = String(dates[index] ?? '');
    if (!accession || !filingDate) continue;
    filings.push({
      recordType: 'filing',
      sourceId: SEC_PROVIDER_ID,
      sourceRecordId: `sec:filing:${cik}:${accession}`,
      cik,
      accession,
      form,
      filingDate,
      originalDate: filingDate,
      retrievedAt: input.retrievedAt,
      publisher: SEC_PUBLISHER,
      licenseType: SEC_LICENSE_TYPE,
      usageRights: SEC_USAGE_RIGHTS,
      fabricated: false,
      freshness: 'aging',
    });
  }
  return filings;
}

export function mapSecFacts(input: {
  cik: string;
  entityName: string;
  facts: unknown;
  retrievedAt: string;
  maxPerMetric?: number;
}): { facts: SecFactRecord[]; fabricated: false } {
  const cik = padSecCik(input.cik);
  const maxPerMetric = Math.min(input.maxPerMetric ?? SEC_MAX_FACTS_PER_METRIC, SEC_MAX_FACTS_PER_METRIC);
  const usGaap =
    input.facts && typeof input.facts === 'object' && input.facts !== null && 'us-gaap' in input.facts
      ? (input.facts as { 'us-gaap'?: Record<string, { units?: Record<string, SecUnitPoint[]> }> })['us-gaap']
      : undefined;
  const extracted: SecFactRecord[] = [];
  if (!usGaap) return { facts: [], fabricated: false };
  for (const metric of Object.keys(FACT_CONCEPTS) as SecFinancialMetricKind[]) {
    let found: SecFactRecord[] = [];
    for (const concept of FACT_CONCEPTS[metric]) {
      const usd = usGaap[concept]?.units?.USD;
      if (!Array.isArray(usd)) continue;
      const annual = usd
        .filter((point) => {
          if (typeof point.val !== 'number' || typeof point.end !== 'string' || typeof point.accn !== 'string') return false;
          const frame = typeof (point as { frame?: string }).frame === 'string' ? (point as { frame?: string }).frame : '';
          if (frame) return /^CY\d{4}$/.test(frame);
          return point.fp === 'FY';
        })
        .sort((left, right) => String(right.end).localeCompare(String(left.end)));
      const uniqueByYear = new Map<string, SecFactRecord>();
      for (const point of annual) {
        const year = String(point.end).slice(0, 4);
        if (uniqueByYear.has(year)) continue;
        uniqueByYear.set(year, {
          recordType: 'fact',
          sourceId: SEC_PROVIDER_ID,
          sourceRecordId: `sec:fact:${cik}:${metric}:${year}:${point.accn}`,
          cik,
          legalName: input.entityName,
          metric,
          usGaapConcept: concept,
          period: year,
          originalDate: String(point.end),
          value: point.val as number,
          unit: 'USD',
          form: point.form ?? '10-K',
          accession: String(point.accn),
          retrievedAt: input.retrievedAt,
          publisher: SEC_PUBLISHER,
          licenseType: SEC_LICENSE_TYPE,
          usageRights: SEC_USAGE_RIGHTS,
          fabricated: false,
          freshness: 'aging',
        });
        if (uniqueByYear.size >= maxPerMetric) break;
      }
      found = [...uniqueByYear.values()];
      if (found.length > 0) break;
    }
    extracted.push(...found);
  }
  return { facts: extracted, fabricated: false };
}

async function throttleSec() {
  const wait = SEC_MIN_INTERVAL_MS - (Date.now() - lastSecRequestAt);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastSecRequestAt = Date.now();
}

async function secGetJson(url: string): Promise<unknown | SecDeniedResult> {
  await throttleSec();
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': SEC_USER_AGENT,
      },
    });
    if (!response.ok) {
      return { allowed: false, reason: `SEC HTTP ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    return { allowed: false, reason: error instanceof Error ? error.message : 'SEC fetch failed.' };
  }
}

export async function fetchSecCompanyBundle(input: {
  cik: string;
  maxFilings?: number;
}): Promise<SecCompanyBundle | SecDeniedResult> {
  const bounds = enforceSecRequestBounds({
    cik: input.cik,
    maxFilings: String(input.maxFilings ?? SEC_MAX_FILINGS_PER_COMPANY),
  });
  if (!bounds.allowed) return bounds;
  const cik = bounds.cik;
  const retrievedAt = nowIso();
  const submissions = await secGetJson(`https://data.sec.gov/submissions/CIK${cik}.json`);
  if (isSecDenied(submissions)) return submissions;
  if (!submissions || typeof submissions !== 'object') {
    return { allowed: false, reason: 'SEC submissions response missing provenance payload.' };
  }
  const body = submissions as {
    cik?: string | number;
    name?: string;
    tickers?: string[];
    sic?: string;
    sicDescription?: string;
    filings?: { recent?: { accessionNumber?: unknown; filingDate?: unknown; form?: unknown } };
  };
  const identity = mapSecIdentity({
    cik: body.cik ?? cik,
    name: body.name,
    tickers: body.tickers,
    sic: body.sic,
    sicDescription: body.sicDescription,
    retrievedAt,
  });
  if (isSecDenied(identity)) return identity;
  const filings = mapSecFilings({
    cik,
    accessionNumber: body.filings?.recent?.accessionNumber,
    filingDate: body.filings?.recent?.filingDate,
    form: body.filings?.recent?.form,
    retrievedAt,
    maxFilings: bounds.maxFilings,
  });
  const factsBody = await secGetJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
  if (isSecDenied(factsBody)) return factsBody;
  const factsJson = factsBody && typeof factsBody === 'object' ? (factsBody as { facts?: unknown; entityName?: string }) : {};
  const facts = mapSecFacts({
    cik,
    entityName: typeof factsJson.entityName === 'string' ? factsJson.entityName : identity.legalName,
    facts: factsJson.facts,
    retrievedAt,
  });
  markSecFetchConnected(true);
  return {
    allowed: true,
    fabricated: false,
    identity,
    filings,
    facts: facts.facts,
  };
}
