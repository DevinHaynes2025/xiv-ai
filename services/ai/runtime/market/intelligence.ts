import { nameOnlyCompanyMergeDenied } from '../international/identity';
import { privateCompanyDataMayEnterGlobalResearch } from '../international/intelligence';
import { watchlistTermAllowed } from '../international/intelligence';
import type {
  FreshnessState,
  GlobalEventType,
  OpportunityCategory,
  ResearchState,
  StartupStage,
} from './types';

export type GlobalCompanyEvent = {
  eventType: GlobalEventType;
  legalName: string;
  jurisdiction: string;
  lei?: string | null;
  registryId?: string | null;
  provider: string;
  source: string;
  sourceTimestamp: string | null;
  retrievedAt: string;
  evidence: string;
  verificationState: 'SUPPORTED' | 'UNVERIFIED' | 'INSUFFICIENT_EVIDENCE';
  material: boolean;
};

export type CompanySnapshot = {
  legalName: string;
  status: string | null;
  address: string | null;
  registryField: string | null;
  latestFiling: string | null;
  latestFact: string | null;
};

export type CompanyChange = {
  field: 'status' | 'legal_name' | 'officer' | 'filing' | 'financial_fact' | 'address' | 'registry_field' | 'event';
  from: string | null;
  to: string | null;
  severity: 'observed' | 'requires_review';
  materialClaim: false;
  evidence: string;
};

export type OpportunityCandidate = {
  candidateId: string;
  category: OpportunityCategory;
  legalName: string;
  country: string;
  signal: ResearchState;
  risk: ResearchState;
  evidence: string;
  reason: string;
  freshness: FreshnessState;
  score: { explainable: true; investmentRecommendation: false; value: number; explanation: string };
  recommendation: null;
};

export type StartupProfile = {
  startupId: string;
  legalName: string;
  stage: StartupStage;
  fundingClaim?: { amount: string; investor?: string; evidence?: string };
  valuationClaim?: { value: string; evidence?: string };
};

export type StartupEcosystem = {
  country: string;
  city: string | null;
  sector: string | null;
  publicPolicy: 'UNKNOWN' | 'NOT_CONFIGURED';
  macroContext: 'UNKNOWN' | 'SUPPORTED';
  founderDensity: 'UNKNOWN';
  companyDensity: 'UNKNOWN';
  capitalAvailability: 'UNKNOWN' | 'NOT_CONFIGURED';
  talentIndicators: 'UNKNOWN';
};

const BANNED_INVESTMENT = ['BUY', 'SELL', 'STRONG_BUY', 'TARGET_PRICE', 'GUARANTEED_RETURN', 'MULTIBAGGER', 'CERTAIN_WINNER'];

export function createGlobalCompanyEvent(input: {
  eventType: GlobalEventType;
  legalName: string;
  jurisdiction: string;
  provider: string;
  source: string;
  retrievedAt: string;
  evidence?: string | null;
  sourceTimestamp?: string | null;
  lei?: string | null;
  registryId?: string | null;
}): { allowed: true; event: GlobalCompanyEvent } | { allowed: false; reason: string } {
  if (!input.evidence || !input.jurisdiction || !input.retrievedAt) {
    return { allowed: false, reason: 'Company events require jurisdiction, retrievedAt, and evidence.' };
  }
  if (!input.lei && !input.registryId) {
    return { allowed: false, reason: 'Jurisdiction-aware identifiers are required. Name-only events are denied.' };
  }
  return {
    allowed: true,
    event: {
      eventType: input.eventType,
      legalName: input.legalName,
      jurisdiction: input.jurisdiction,
      lei: input.lei ?? null,
      registryId: input.registryId ?? null,
      provider: input.provider,
      source: input.source,
      sourceTimestamp: input.sourceTimestamp ?? null,
      retrievedAt: input.retrievedAt,
      evidence: input.evidence,
      verificationState: 'SUPPORTED',
      material: false,
    },
  };
}

export function detectCompanyChanges(before: CompanySnapshot, after: CompanySnapshot, evidence: string): readonly CompanyChange[] {
  const changes: CompanyChange[] = [];
  const pairs: Array<[CompanyChange['field'], string | null, string | null]> = [
    ['legal_name', before.legalName, after.legalName],
    ['status', before.status, after.status],
    ['address', before.address, after.address],
    ['registry_field', before.registryField, after.registryField],
    ['filing', before.latestFiling, after.latestFiling],
    ['financial_fact', before.latestFact, after.latestFact],
  ];
  for (const [field, from, to] of pairs) {
    if (from !== to) {
      changes.push({
        field,
        from,
        to,
        severity: 'requires_review',
        materialClaim: false,
        evidence,
      });
    }
  }
  return changes;
}

export function createOpportunityCandidate(input: {
  candidateId: string;
  category: OpportunityCategory;
  legalName: string;
  country: string;
  evidence: string;
  signal?: ResearchState;
}): OpportunityCandidate {
  return {
    candidateId: input.candidateId,
    category: input.category,
    legalName: input.legalName,
    country: input.country,
    signal: input.signal ?? 'REQUIRES_REVIEW',
    risk: 'INSUFFICIENT_EVIDENCE',
    evidence: input.evidence,
    reason: 'Evidence-linked research candidate. Not an investment recommendation.',
    freshness: 'HISTORICAL',
    score: {
      explainable: true,
      investmentRecommendation: false,
      value: 0,
      explanation: 'Score is bounded coverage, not an investment rating.',
    },
    recommendation: null,
  };
}

export function investmentLanguageDenied(term: string) {
  if (BANNED_INVESTMENT.includes(term) || watchlistTermAllowed(term).allowed === false) {
    return { allowed: false as const, reason: 'Investment recommendation language is denied.' };
  }
  return { allowed: true as const };
}

export function acceptStartupFundingClaim(profile: StartupProfile) {
  const claim = profile.fundingClaim;
  if (!claim) return { allowed: false as const, reason: 'No funding claim provided.' };
  if (!claim.evidence) return { allowed: false as const, reason: 'Startup funding claims require evidence.' };
  return { allowed: true as const, fabricated: false as const };
}

export function acceptFakeValuation(profile: StartupProfile) {
  const claim = profile.valuationClaim;
  if (!claim?.evidence) {
    return { allowed: false as const, reason: 'Fake valuation denied. Valuation claims require evidence.' };
  }
  return { allowed: true as const };
}

export function describeStartupEcosystem(input: { country: string; city?: string | null; sector?: string | null; macroSupported?: boolean }): StartupEcosystem {
  return {
    country: input.country,
    city: input.city ?? null,
    sector: input.sector ?? null,
    publicPolicy: 'NOT_CONFIGURED',
    macroContext: input.macroSupported ? 'SUPPORTED' : 'UNKNOWN',
    founderDensity: 'UNKNOWN',
    companyDensity: 'UNKNOWN',
    capitalAvailability: 'NOT_CONFIGURED',
    talentIndicators: 'UNKNOWN',
  };
}

export function jurisdictionAwareMergeDenied(
  a: { country: string; lei: string | null; registry: string | null; registryId: string | null; legalName: string },
  b: { country: string; lei: string | null; registry: string | null; registryId: string | null; legalName: string },
) {
  return nameOnlyCompanyMergeDenied(a, b);
}

export function privateTenantDataCannotEnterPublicDiscovery(input: {
  brainOrigin: 'personal' | 'company' | 'global' | 'external_public';
  provenancePresent: boolean;
  licenseKnown: boolean;
}) {
  return privateCompanyDataMayEnterGlobalResearch({
    ...input,
    category: input.brainOrigin === 'company' ? 'private_company' : 'public',
  });
}
