import { evaluateGlobalBrainIngestion } from '../sources/policy';
import { workspaceCrossOrgDenied } from '../workspace/privacy';
import { GLEIF_PROVIDER_ID } from './gleif';
import type {
  CompanyGraphEdge,
  CompanyWatchItem,
  InternationalCompanyEvent,
  InternationalCompanyFinancialFact,
  InternationalCompanyIdentity,
  InternationalCompanyRecord,
  InternationalCompanyStance,
  InternationalCompanyVerificationState,
  InvitationPipelineStage,
  WatchLabel,
} from './types';

const BANNED_WATCH_TERMS = ['BUY', 'SELL', 'STRONG_BUY', 'GUARANTEED_WINNER', 'PRICE_TARGET', 'CERTAIN_RETURN', 'GUARANTEED_RETURN'];

export const INVITATION_PIPELINE: readonly InvitationPipelineStage[] = [
  'discover',
  'verify_identity',
  'research_packet',
  'assess_relevance',
  'human_business_development_review',
  'invitation_candidate',
  'company_claims_profile',
  'business_verification',
  'universe_onboarding',
];

export type CompanyResearchClaim = {
  claimId: string;
  subject: string;
  value: string;
  period?: string | null;
  currency?: string | null;
  ticker?: string | null;
  registryId?: string | null;
  legalName?: string | null;
  status?: string | null;
  stance: InternationalCompanyStance;
  sourceId: string | null;
  websiteClaim?: boolean;
  filingClaim?: boolean;
  inferred?: boolean;
  correctedFiling?: boolean;
  duplicateFiling?: boolean;
};

export type CompanyContradiction = {
  status: InternationalCompanyVerificationState;
  reason: string;
  claimIds: readonly string[];
};

export type GlobalCompanyResearchPacket = {
  packetId: string;
  identity: InternationalCompanyIdentity | null;
  jurisdiction: string | null;
  history: readonly InternationalCompanyEvent[];
  filings: readonly { form: string; source: string }[];
  financialFacts: readonly InternationalCompanyFinancialFact[];
  events: readonly InternationalCompanyEvent[];
  industry: string | null;
  macroContext: { sourceId: string; summary: string; comparableDefinitions: false } | null;
  risks: readonly string[];
  opportunities: readonly string[];
  contradictions: readonly CompanyContradiction[];
  dataQuality: CompanyQualitySummary;
  sources: readonly string[];
  confidence: { explainable: true; certainty: false; universalTrustNumber: false };
  watchlistState: WatchLabel;
  sections: readonly string[];
};

export type CompanyQualitySummary = {
  identityCompleteness: string;
  filingCompleteness: string;
  financialFactCoverage: string;
  sourceFreshness: string;
  sourceAuthority: string;
  contradictionCount: number;
  jurisdictionConfidence: string;
  overallExplainableQuality: string;
  universalTrustNumber: false;
};

export type CompanyStoryParagraph = {
  heading: string;
  body: string;
  stance: InternationalCompanyStance;
  evidence: string | null;
};

export type CompanyStory = {
  title: string;
  paragraphs: readonly CompanyStoryParagraph[];
  sources: readonly string[];
};

export type SheetFactBinding = {
  provider: string;
  sourceRecordId: string;
  period: string | null;
  currency: string | null;
  retrievedAt: string;
  verificationState: InternationalCompanyVerificationState;
  value: string | number;
};

export type CompanyChartBinding = {
  kind: 'revenue_trend' | 'asset_liability' | 'profit_trend' | 'filing_timeline' | 'event_timeline' | 'macro_overlay' | 'company_comparison';
  source: string;
  period: string;
  currency: string | null;
  unit: string | null;
  freshness: string;
  provenance: string;
  fakeMarketPrice: false;
};

export const COMPANY_ARTICLE_THEMES = [
  'startup ecosystems',
  'international companies',
  'cross-border trade',
  'manufacturing',
  'supply chain',
  'economic development',
  'founder stories',
  'market structure',
  'company transformation',
] as const;

export function buildCompanyTimeline(record: InternationalCompanyRecord): readonly InternationalCompanyEvent[] {
  return record.events.filter((event) => event.evidence && event.source && event.retrievedAt);
}

export function companyGraphEdges(record: InternationalCompanyRecord): readonly CompanyGraphEdge[] {
  const company = record.identity.lei ?? record.identity.legalName;
  const edges: CompanyGraphEdge[] = [
    { from: company, relation: 'REGISTERED_IN', to: record.identity.country, persisted: false },
    { from: company, relation: 'HAS_SOURCE', to: record.provenance.sourceId, persisted: false },
  ];
  for (const event of record.events) {
    edges.push({ from: company, relation: 'HAS_EVENT', to: event.eventType, persisted: false });
  }
  if (record.identity.industry) {
    edges.push({ from: company, relation: 'OPERATES_IN', to: record.identity.industry, persisted: false });
  }
  for (const filing of record.filings) {
    edges.push({ from: company, relation: 'FILED', to: filing.form, persisted: false });
  }
  return edges;
}

export function expandCompanyContradiction(a: CompanyResearchClaim, b: CompanyResearchClaim): CompanyContradiction {
  const ids = [a.claimId, b.claimId];
  if (a.legalName && b.legalName && a.legalName !== b.legalName && (a.registryId === b.registryId || a.ticker === b.ticker)) {
    return { status: 'CONTRADICTED', reason: 'Legal name mismatch for the same identifier.', claimIds: ids };
  }
  if (a.registryId && b.registryId && a.registryId !== b.registryId && a.legalName && a.legalName === b.legalName) {
    return { status: 'CONTRADICTED', reason: 'Registry ID mismatch. Name match is not identity.', claimIds: ids };
  }
  if (a.ticker && b.ticker && a.ticker !== b.ticker && a.legalName === b.legalName) {
    return { status: 'CONTRADICTED', reason: 'Ticker mismatch.', claimIds: ids };
  }
  if (a.subject === b.subject && a.period && b.period && a.period !== b.period && a.value !== b.value) {
    return { status: 'STALE', reason: 'Reporting-period mismatch is surfaced and not silently reconciled.', claimIds: ids };
  }
  if (a.currency && b.currency && a.currency !== b.currency && a.subject === b.subject) {
    return { status: 'CONTRADICTED', reason: 'Currency mismatch is surfaced and not silently coerced.', claimIds: ids };
  }
  if (a.status === 'ACTIVE' && b.status && b.status !== 'ACTIVE' && a.legalName === b.legalName) {
    return { status: 'STALE', reason: 'Stale company status conflict.', claimIds: ids };
  }
  if (a.websiteClaim && b.filingClaim && a.value !== b.value) {
    return { status: 'CONTRADICTED', reason: 'Company website claim conflicts with filing.', claimIds: ids };
  }
  if (a.stance === 'FORECAST' && b.stance === 'FACT') {
    return { status: 'UNVERIFIED', reason: 'Forecast presented against a fact remains a forecast.', claimIds: ids };
  }
  if (a.inferred && b.filingClaim && a.subject === 'revenue' && a.value !== b.value) {
    return { status: 'CONTRADICTED', reason: 'Inferred revenue conflicts with filed revenue.', claimIds: ids };
  }
  if ((a.duplicateFiling || b.correctedFiling) && a.subject === b.subject && a.value !== b.value) {
    return { status: 'CONTRADICTED', reason: 'Duplicated or corrected filing conflict.', claimIds: ids };
  }
  if (a.sourceId && b.sourceId && a.sourceId !== b.sourceId && a.subject === b.subject && a.value !== b.value) {
    return { status: 'CONTRADICTED', reason: 'Source conflict. Definitions are not assumed comparable.', claimIds: ids };
  }
  if (!a.sourceId || !b.sourceId) {
    return { status: 'INSUFFICIENT_EVIDENCE', reason: 'Provenance is required before a company claim is supported.', claimIds: ids };
  }
  return { status: 'PARTIALLY_SUPPORTED', reason: 'No hard contradiction detected. Consensus is not automatic.', claimIds: ids };
}

export function provenanceRequiredForCompanyRecord(record: Pick<InternationalCompanyRecord, 'provenance'>) {
  if (!record.provenance.sourceId || !record.provenance.sourceRecordId || !record.provenance.retrievedAt) {
    return { allowed: false as const, reason: 'Source provenance is required.' };
  }
  return { allowed: true as const };
}

export function filingsRemainFacts(filingStance: InternationalCompanyStance) {
  return filingStance === 'FACT';
}

export function forecastRemainsForecast(stance: InternationalCompanyStance) {
  return stance === 'FORECAST';
}

export function explainCompanyQuality(input: {
  identity: InternationalCompanyIdentity | null;
  filings: number;
  facts: number;
  contradictions: number;
  retrievedAt: string | null;
}): CompanyQualitySummary {
  return {
    identityCompleteness: input.identity?.lei && input.identity.country ? 'LEI and jurisdiction present' : 'Identity incomplete',
    filingCompleteness: input.filings > 0 ? `${input.filings} sourced filings` : 'No international filings retrieved',
    financialFactCoverage: input.facts > 0 ? `${input.facts} sourced facts` : 'No GLEIF financial facts; facts require a proven filing adapter',
    sourceFreshness: input.retrievedAt ? `Retrieved ${input.retrievedAt}. Historical identity is not live certainty.` : 'Freshness unknown',
    sourceAuthority: 'GLEIF is a public LEI authority. This is not a universal trust score.',
    contradictionCount: input.contradictions,
    jurisdictionConfidence: input.identity?.country ? `Jurisdiction ${input.identity.country} from registry identifiers` : 'Jurisdiction unknown',
    overallExplainableQuality: 'Quality is explainable by coverage and provenance. Not a fake universal trust number.',
    universalTrustNumber: false,
  };
}

export function buildGlobalCompanyResearchPacket(input: {
  packetId: string;
  record?: InternationalCompanyRecord | null;
  secFacts?: readonly InternationalCompanyFinancialFact[];
  worldBankMacro?: { summary: string } | null;
  contradictions?: readonly CompanyContradiction[];
}): GlobalCompanyResearchPacket {
  const record = input.record ?? null;
  const facts = input.secFacts ?? record?.facts ?? [];
  const contradictions = input.contradictions ?? [];
  return {
    packetId: input.packetId,
    identity: record?.identity ?? null,
    jurisdiction: record?.identity.country ?? null,
    history: record ? buildCompanyTimeline(record) : [],
    filings: record?.filings.map((item) => ({ form: item.form, source: item.source })) ?? [],
    financialFacts: facts,
    events: record?.events ?? [],
    industry: record?.identity.industry ?? null,
    macroContext: input.worldBankMacro
      ? { sourceId: 'world_bank_open_data', summary: input.worldBankMacro.summary, comparableDefinitions: false }
      : null,
    risks: [],
    opportunities: [],
    contradictions,
    dataQuality: explainCompanyQuality({
      identity: record?.identity ?? null,
      filings: record?.filings.length ?? 0,
      facts: facts.length,
      contradictions: contradictions.length,
      retrievedAt: record?.provenance.retrievedAt ?? null,
    }),
    sources: [record?.provenance.sourceId, input.worldBankMacro ? 'world_bank_open_data' : null, facts[0]?.provider]
      .filter((item): item is string => Boolean(item)),
    confidence: { explainable: true, certainty: false, universalTrustNumber: false },
    watchlistState: 'REQUIRES_REVIEW',
    sections: [
      'IDENTITY',
      'JURISDICTION',
      'COMPANY HISTORY',
      'FILINGS',
      'FINANCIAL FACTS',
      'EVENTS',
      'INDUSTRY',
      'MACRO CONTEXT',
      'RISKS',
      'OPPORTUNITIES',
      'CONTRADICTIONS',
      'DATA QUALITY',
      'SOURCES',
      'CONFIDENCE',
      'WATCHLIST STATE',
    ],
  };
}

export function createCompanyWatchItem(input: {
  watchId: string;
  legalName: string;
  jurisdiction: string;
  reason: string;
  signal: WatchLabel;
  risk?: WatchLabel;
  evidence: string;
}): CompanyWatchItem {
  return {
    watchId: input.watchId,
    legalName: input.legalName,
    jurisdiction: input.jurisdiction,
    reason: input.reason,
    signal: input.signal,
    risk: input.risk ?? 'INSUFFICIENT_EVIDENCE',
    evidence: input.evidence,
    freshness: 'research-only',
    recommendation: null,
    guaranteedReturn: false,
  };
}

export function watchlistTermAllowed(term: string) {
  if (BANNED_WATCH_TERMS.includes(term)) {
    return { allowed: false as const, reason: 'Watchlist research never emits BUY/SELL, price targets, or guaranteed returns.' };
  }
  return { allowed: true as const };
}

export function bindCompanyFactToSheet(input: {
  provider: string;
  sourceRecordId: string;
  period: string | null;
  currency: string | null;
  expectedCurrency?: string | null;
  expectedPeriod?: string | null;
  retrievedAt: string;
  verificationState: InternationalCompanyVerificationState;
  value: string | number;
}): { allowed: true; binding: SheetFactBinding } | { allowed: false; reason: string } {
  if (!input.provider || !input.sourceRecordId || !input.retrievedAt) {
    return { allowed: false, reason: 'XIV Sheets real-data bindings must preserve provider, source reference, and retrievedAt.' };
  }
  if (input.expectedCurrency && input.currency && input.expectedCurrency !== input.currency) {
    return { allowed: false, reason: 'Currency mismatch is surfaced and not silently coerced.' };
  }
  if (input.expectedPeriod && input.period && input.expectedPeriod !== input.period) {
    return { allowed: false, reason: 'Reporting-period mismatch is surfaced and not silently coerced.' };
  }
  return {
    allowed: true,
    binding: {
      provider: input.provider,
      sourceRecordId: input.sourceRecordId,
      period: input.period,
      currency: input.currency,
      retrievedAt: input.retrievedAt,
      verificationState: input.verificationState,
      value: input.value,
    },
  };
}

export function bindCompanyChart(input: {
  kind: CompanyChartBinding['kind'] | 'market_price';
  source: string;
  period: string;
  currency?: string | null;
  unit?: string | null;
  freshness: string;
  provenance: string;
  fakeMarketPrice?: boolean;
}): { allowed: true; chart: CompanyChartBinding } | { allowed: false; reason: string } {
  if (input.kind === 'market_price' || input.fakeMarketPrice) {
    return { allowed: false, reason: 'Fake market prices are not shown.' };
  }
  if (!input.source || !input.period || !input.provenance) {
    return { allowed: false, reason: 'Charts require source, period, and provenance.' };
  }
  return {
    allowed: true,
    chart: {
      kind: input.kind,
      source: input.source,
      period: input.period,
      currency: input.currency ?? null,
      unit: input.unit ?? null,
      freshness: input.freshness,
      provenance: input.provenance,
      fakeMarketPrice: false,
    },
  };
}

export function buildCompanyStory(record: InternationalCompanyRecord): CompanyStory {
  const identity = record.identity;
  return {
    title: identity.legalName,
    paragraphs: [
      {
        heading: 'WHAT THE COMPANY IS',
        body: `${identity.legalName} is identified by ${identity.lei ? `LEI ${identity.lei}` : 'insufficient identifiers'}.`,
        stance: 'FACT',
        evidence: record.provenance.sourceRecordId,
      },
      {
        heading: 'WHERE IT OPERATES',
        body: `Registered jurisdiction ${identity.country}. Address is public LEI data where present.`,
        stance: 'FACT',
        evidence: record.provenance.sourceRecordId,
      },
      {
        heading: 'HOW IT CHANGED',
        body: identity.incorporationDate
          ? `LEI registration timestamp ${identity.incorporationDate}. This is registration metadata, not a complete corporate history.`
          : 'Change history is insufficient without additional official filings.',
        stance: identity.incorporationDate ? 'FACT' : 'INFERENCE',
        evidence: identity.incorporationDate ? record.provenance.sourceRecordId : null,
      },
      {
        heading: 'IMPORTANT FILINGS',
        body: 'GLEIF does not supply financial filings. Filing facts require a proven filing adapter such as SEC.',
        stance: 'FACT',
        evidence: null,
      },
      {
        heading: 'IMPORTANT EVENTS',
        body: record.events.length ? `${record.events.length} sourced identity events.` : 'No invented milestones.',
        stance: 'FACT',
        evidence: record.events[0]?.evidence ?? null,
      },
      {
        heading: 'FINANCIAL DIRECTION',
        body: 'Financial direction is not inferred from LEI identity alone.',
        stance: 'INFERENCE',
        evidence: null,
      },
      {
        heading: 'RISKS',
        body: 'Risk language stays research-only. No guaranteed outcome.',
        stance: 'INFERENCE',
        evidence: null,
      },
      {
        heading: 'OPPORTUNITIES',
        body: 'Opportunity language stays research-only.',
        stance: 'INFERENCE',
        evidence: null,
      },
      {
        heading: 'WHAT XIV IS WATCHING',
        body: 'Watch state is REQUIRES_REVIEW until more official sources are proven.',
        stance: 'INFERENCE',
        evidence: null,
      },
      {
        heading: 'SOURCES',
        body: `${record.provenance.publisher} ${record.provenance.sourceRecordId}`,
        stance: 'FACT',
        evidence: record.provenance.sourceRecordId,
      },
    ],
    sources: [GLEIF_PROVIDER_ID],
  };
}

export function createInvitationCandidate(input: { candidateId: string; reviewedByHuman: boolean }) {
  if (!input.reviewedByHuman) {
    return { allowed: false as const, reason: 'Company invitation requires human business-development review. No automated mass outreach.' };
  }
  return {
    allowed: true as const,
    pipeline: INVITATION_PIPELINE,
    automatedMassOutreach: false as const,
    reviewState: 'requires_review' as const,
  };
}

export function draftInternationalArticle(theme: string) {
  return {
    theme,
    state: 'AI_GENERATED_DRAFT' as const,
    published: false,
    humanReviewed: false,
  };
}

export function privateCompanyDataMayEnterGlobalResearch(input: {
  brainOrigin: 'personal' | 'company' | 'global' | 'external_public';
  provenancePresent: boolean;
  licenseKnown: boolean;
  category?: string | null;
}) {
  if (input.brainOrigin === 'company' || input.category === 'private_company') {
    return { allowed: false as const, reason: 'Private company data cannot enter global research.' };
  }
  return evaluateGlobalBrainIngestion({
    category: input.category ?? 'public',
    brainOrigin: input.brainOrigin,
    provenancePresent: input.provenancePresent,
    licenseKnown: input.licenseKnown,
  });
}

export function internationalCrossOrgDenied(actor?: string | null, target?: string | null) {
  return workspaceCrossOrgDenied(actor, target);
}
