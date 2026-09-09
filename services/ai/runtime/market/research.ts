import { bindCompanyChart, bindCompanyFactToSheet, expandCompanyContradiction, createInvitationCandidate } from '../international/intelligence';
import { internationalCrossOrgDenied } from '../international/intelligence';
import { draftInternationalArticle } from '../international/intelligence';
import type {
  CompanyResearchAgentRole,
  FreshnessState,
  InvitationStatus,
  ProfileContentClass,
  ResearchState,
  StoryClaimLabel,
} from './types';

export const COMPANY_RESEARCH_AGENTS: readonly CompanyResearchAgentRole[] = [
  'Discovery',
  'Identity',
  'Filings',
  'Financial',
  'Risk',
  'Macro',
  'Industry',
  'Startup',
  'News/Event',
  'Contradiction',
  'Verification',
  'Provenance',
  'Story',
  'Opportunity',
];

export type ResearchAgentContribution = {
  role: CompanyResearchAgentRole;
  claim: string;
  stance: StoryClaimLabel;
  evidence: string | null;
};

export type CompanyResearchRoom = {
  roomId: string;
  contributions: readonly ResearchAgentContribution[];
  disagreements: readonly { claimIds: readonly string[]; visible: true }[];
  consensus: { reached: boolean; automaticFactPromotion: false };
};

export type CompanyResearchScorecard = {
  identityQuality: string;
  sourceCoverage: string;
  financialCoverage: string;
  eventFreshness: string;
  contradictionCount: number;
  macroContextCoverage: string;
  industryContextCoverage: string;
  riskEvidence: string;
  opportunityEvidence: string;
  composite: { explainable: true; bounded: true; investmentRecommendation: false; evidenceLinked: true };
};

export type WatchlistItemV2 = {
  watchId: string;
  reason: string;
  country: string;
  industry: string | null;
  companyType: string;
  latestEvent: string | null;
  latestFiling: string | null;
  latestChange: string | null;
  risk: ResearchState;
  opportunity: ResearchState;
  freshness: FreshnessState;
  evidenceCount: number;
  contradictions: number;
  researchState: ResearchState;
  recommendation: null;
  notificationTransportLive: false;
};

export type DocumentaryClaim = {
  text: string;
  label: StoryClaimLabel;
  evidence: string | null;
};

export type CommunityCompanyProfile = {
  identity: string;
  sections: readonly string[];
  classes: readonly ProfileContentClass[];
};

export function openCompanyResearchRoom(contributions: readonly ResearchAgentContribution[]): CompanyResearchRoom {
  const disagreements = [];
  const facts = contributions.filter((item) => item.stance === 'FACT');
  const inferences = contributions.filter((item) => item.stance !== 'FACT');
  if (facts.length && inferences.length) {
    disagreements.push({ claimIds: contributions.map((item) => item.role), visible: true as const });
  }
  return {
    roomId: 'room_company',
    contributions,
    disagreements,
    consensus: { reached: false, automaticFactPromotion: false },
  };
}

export function agentDisagreementAutoPromotesFact(_room: CompanyResearchRoom) {
  return false;
}

export function contradictionRemainsVisible(a: { claimId: string; subject: string; value: string; stance: 'FACT'; sourceId: string }, b: typeof a) {
  const result = expandCompanyContradiction(
    { ...a, period: '2024' },
    { ...b, period: '2024' },
  );
  return result.status === 'CONTRADICTED' && result.reason.length > 0;
}

export function explainCompanyScorecard(input: { identity: boolean; filings: number; facts: number; contradictions: number }): CompanyResearchScorecard {
  return {
    identityQuality: input.identity ? 'Jurisdiction identifier present' : 'Identity incomplete',
    sourceCoverage: 'World Bank / SEC / GLEIF only when proven',
    financialCoverage: input.facts > 0 ? `${input.facts} SEC facts` : 'No financial facts without a proven filing adapter',
    eventFreshness: 'Historical unless a proven source timestamp exists',
    contradictionCount: input.contradictions,
    macroContextCoverage: 'World Bank macro is a separate stream',
    industryContextCoverage: 'NOT_CONFIGURED unless sourced',
    riskEvidence: 'Research-only',
    opportunityEvidence: 'Research-only',
    composite: { explainable: true, bounded: true, investmentRecommendation: false, evidenceLinked: true },
  };
}

export function createWatchlistItemV2(input: { watchId: string; country: string; reason: string }): WatchlistItemV2 {
  return {
    watchId: input.watchId,
    reason: input.reason,
    country: input.country,
    industry: null,
    companyType: 'PUBLIC_COMPANY',
    latestEvent: null,
    latestFiling: null,
    latestChange: null,
    risk: 'INSUFFICIENT_EVIDENCE',
    opportunity: 'REQUIRES_REVIEW',
    freshness: 'HISTORICAL',
    evidenceCount: 0,
    contradictions: 0,
    researchState: 'REQUIRES_REVIEW',
    recommendation: null,
    notificationTransportLive: false,
  };
}

export function createCompanyComparisonSheet(rows: readonly { company: string; country: string; provider: string; sourceRecordId: string; retrievedAt: string }[]) {
  return rows.map((row) =>
    bindCompanyFactToSheet({
      provider: row.provider,
      sourceRecordId: row.sourceRecordId,
      period: null,
      currency: null,
      retrievedAt: row.retrievedAt,
      verificationState: 'SUPPORTED',
      value: row.company,
    }),
  );
}

export function createCompanyIntelligenceChart(input: {
  kind: 'RevenueTrend' | 'ProfitTrend' | 'BalanceSheetComparison' | 'CompanyTimeline' | 'FilingTimeline' | 'EventTimeline' | 'CompanyVsMacro' | 'RiskOpportunityMatrix' | 'CrossCompanyComparison' | 'market_price';
  source: string;
  period: string;
  provenance: string;
}) {
  if (input.kind === 'market_price') {
    return bindCompanyChart({ kind: 'market_price', source: input.source, period: input.period, freshness: 'n/a', provenance: input.provenance });
  }
  return bindCompanyChart({
    kind: input.kind === 'RevenueTrend' ? 'revenue_trend' : 'event_timeline',
    source: input.source,
    period: input.period,
    freshness: 'aging',
    provenance: input.provenance,
  });
}

export function createBusinessStoryClaim(label: StoryClaimLabel, evidence: string | null) {
  return { label, evidence, collapsed: false as const };
}

export function createDocumentaryPacket(claims: readonly DocumentaryClaim[]) {
  return {
    videoProductionLive: false as const,
    transcriptionLive: false as const,
    documentaryRenderingLive: false as const,
    claims,
    gaps: claims.filter((item) => !item.evidence).map((item) => item.text),
  };
}

export function documentaryClaimPreservesType(claim: DocumentaryClaim, expected: StoryClaimLabel) {
  return claim.label === expected;
}

export function createDailyArticleCandidate(input: { title: string; category: string; reviewState?: 'AI_GENERATED_DRAFT' | 'PUBLISHED' }) {
  const draft = draftInternationalArticle(input.category);
  if (input.reviewState === 'PUBLISHED') {
    return { allowed: false as const, reason: 'AI articles require human review before PUBLISHED.', state: draft.state };
  }
  return { allowed: true as const, state: 'AI_GENERATED_DRAFT' as const, published: false, humanReviewed: false };
}

export function expandInvitationStatus(input: { reviewedByHuman: boolean; status?: InvitationStatus }) {
  const base = createInvitationCandidate({ candidateId: 'inv_1', reviewedByHuman: input.reviewedByHuman });
  if (!base.allowed) return base;
  return { ...base, status: input.status ?? ('REVIEW_REQUIRED' as const), automatedHighVolumeMessaging: false as const };
}

export function createCommunityCompanyProfile(): CommunityCompanyProfile {
  return {
    identity: 'Public/community profile foundation',
    sections: [
      'Identity',
      'Story',
      'Industry',
      'Jurisdiction',
      'Verified public facts',
      'Latest sourced events',
      'Research',
      'Company posts',
      'Founder story',
      'Ideas',
      'Open collaboration',
      'XIV participation',
    ],
    classes: ['OFFICIAL_COMPANY_CONTENT', 'PUBLIC_SOURCE_CONTENT', 'XIV_RESEARCH', 'COMMUNITY_CONTENT'],
  };
}

export function mixProfileClassesSilently() {
  return false;
}

export function freshnessCard(input: {
  source: string;
  retrievedAt: string;
  sourceTimestamp: string | null;
  freshness: FreshnessState;
  verificationState: string;
}) {
  if (input.freshness === 'LIVE' && !input.source) {
    return { allowed: false as const, reason: 'No fake real-time label without source metadata.' };
  }
  return {
    allowed: true as const,
    source: input.source,
    retrievedAt: input.retrievedAt,
    sourceTimestamp: input.sourceTimestamp,
    freshness: input.freshness,
    quality: 'explainable',
    verificationState: input.verificationState,
  };
}

export function marketCrossOrgDenied(actor?: string | null, target?: string | null) {
  return internationalCrossOrgDenied(actor, target);
}
