/**
 * Global company discovery + source registry foundations.
 * World Bank and SEC remain independently proven. New jurisdictions stay NOT_CONFIGURED.
 */
import { connectorCatalog } from '../network-os/experience';
import { secAdapterCapabilityStatus, secGlobalFabricIsProductionLive } from '../sources/sec-status';
import { worldBankAdapterCapabilityStatus, worldBankGlobalFabricIsProductionLive } from '../sources/world-bank-status';
import type { DataSurfaceState } from '../network-os/surface-state';

export type CompanyDiscoveryKind =
  | 'startup'
  | 'public_company'
  | 'private_discoverable'
  | 'small_cap'
  | 'micro_cap'
  | 'international'
  | 'manufacturer'
  | 'technology'
  | 'supply_chain'
  | 'emerging_market'
  | 'founder'
  | 'innovation_ecosystem';

export type CompanyIdentity = { legalName: string; aliases: readonly string[] };
export type CompanyJurisdiction = { country: string; region: string | null };
export type CompanyRegistryIdentity = { registry: string; registryId: string | null; configured: boolean };
export type SecurityIdentity = { ticker: string | null; cik: string | null };
export type ExchangeIdentity = { exchange: string | null; listingStatus: 'unknown' | 'listed' | 'unlisted' };
export type CompanyClassification = CompanyDiscoveryKind;
export type DiscoveryReason = string;
export type VerificationState = 'UNVERIFIED' | 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'CONTRADICTED' | 'INSUFFICIENT_EVIDENCE' | 'STALE';
export type OpportunitySignal = 'WATCH' | 'EMERGING' | 'REQUIRES_REVIEW' | 'IMPROVING' | 'DETERIORATING' | 'INSUFFICIENT_EVIDENCE';
export type RiskSignal = 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' | 'CONFLICTING_EVIDENCE' | 'INSUFFICIENT_EVIDENCE';

export type CompanyDiscoverySignal = {
  kind: 'filing_change' | 'revenue_change' | 'margin_change' | 'balance_sheet' | 'expansion' | 'partnership' | 'product' | 'patent' | 'procurement' | 'capital' | 'listing' | 'industry' | 'macro';
  stance: 'FACT' | 'RESEARCH' | 'SIGNAL' | 'RISK' | 'INFERENCE' | 'FORECAST';
  summary: string;
};

export type CompanyDiscoveryCandidate = {
  candidateId: string;
  identity: CompanyIdentity;
  jurisdiction: CompanyJurisdiction;
  registry: CompanyRegistryIdentity;
  security: SecurityIdentity;
  exchange: ExchangeIdentity;
  classification: CompanyClassification;
  signals: readonly CompanyDiscoverySignal[];
  reason: DiscoveryReason;
  verification: VerificationState;
  opportunity: OpportunitySignal;
  risk: RiskSignal;
  investmentRecommendation: null;
  guaranteedWinner: false;
  surface: DataSurfaceState;
};

export type ResearchWatchlist = { watchlistId: string; organizationId: string; candidateIds: readonly string[] };
export type CompanyInvitationCandidate = {
  candidateId: string;
  reviewState: 'requires_review';
  automatedOutreach: false;
};

export const GLOBAL_SOURCE_CATEGORIES = [
  'SECURITIES_REGULATOR',
  'STOCK_EXCHANGE',
  'CORPORATE_REGISTRY',
  'GOVERNMENT_DATA',
  'ECONOMIC_DATA',
  'PATENT_DATA',
  'PROCUREMENT_DATA',
  'COMPANY_WEBSITE',
  'LICENSED_NEWS',
  'AUTHORIZED_ENTERPRISE',
  'ACADEMIC',
  'PUBLIC_RESEARCH',
  'OTHER',
] as const;
export type GlobalSourceCategory = (typeof GLOBAL_SOURCE_CATEGORIES)[number];

export type JurisdictionDescriptor = {
  country: string;
  region: string | null;
  regulator: string | null;
  exchange: string | null;
  language: string;
  currency: string;
  timezone: string;
};

export type GlobalSourceDescriptor = {
  sourceId: string;
  name: string;
  category: GlobalSourceCategory;
  jurisdiction: JurisdictionDescriptor;
  surface: DataSurfaceState;
  provenLive: boolean;
};

export type SourceLicensePolicy = { known: boolean; usageRights: string };
export type SourceRatePolicy = { bounded: true };
export type SourceTrustProfile = { explainable: true; universalTruthScore: false };
export type SourceVerificationPolicy = { independentProofRequired: true };
export type SourceFreshnessPolicy = { agingIsNotLive: true };
export type SourceAvailabilityState = DataSurfaceState;

export function globalSourceRegistry(): readonly GlobalSourceDescriptor[] {
  const worldBankLive = worldBankAdapterCapabilityStatus() === 'LIVE';
  const secLive = secAdapterCapabilityStatus() === 'LIVE';
  const us: JurisdictionDescriptor = {
    country: 'US',
    region: null,
    regulator: 'SEC',
    exchange: null,
    language: 'en',
    currency: 'USD',
    timezone: 'America/New_York',
  };
  return [
    {
      sourceId: 'world_bank_open_data',
      name: 'World Bank Open Data',
      category: 'ECONOMIC_DATA',
      jurisdiction: { ...us, country: 'GLOBAL', regulator: null, timezone: 'UTC', currency: 'USD' },
      surface: worldBankLive ? 'LIVE' : 'CONNECTED',
      provenLive: worldBankLive,
    },
    {
      sourceId: 'us_sec_edgar',
      name: 'U.S. SEC EDGAR',
      category: 'SECURITIES_REGULATOR',
      jurisdiction: us,
      surface: secLive ? 'LIVE' : 'CONNECTED',
      provenLive: secLive,
    },
    {
      sourceId: 'uk_companies_house',
      name: 'UK Companies House',
      category: 'CORPORATE_REGISTRY',
      jurisdiction: { country: 'GB', region: null, regulator: null, exchange: null, language: 'en', currency: 'GBP', timezone: 'Europe/London' },
      surface: 'NOT_CONFIGURED',
      provenLive: false,
    },
    {
      sourceId: 'eu_ojeu_procurement',
      name: 'EU public procurement',
      category: 'PROCUREMENT_DATA',
      jurisdiction: { country: 'EU', region: null, regulator: null, exchange: null, language: 'en', currency: 'EUR', timezone: 'Europe/Brussels' },
      surface: 'NOT_CONFIGURED',
      provenLive: false,
    },
    {
      sourceId: 'uspto_patents',
      name: 'USPTO patents',
      category: 'PATENT_DATA',
      jurisdiction: us,
      surface: 'NOT_CONFIGURED',
      provenLive: false,
    },
    {
      sourceId: 'licensed_news',
      name: 'Licensed news',
      category: 'LICENSED_NEWS',
      jurisdiction: { ...us, country: 'GLOBAL' },
      surface: 'NOT_CONFIGURED',
      provenLive: false,
    },
  ];
}

export function unsupportedGlobalProvidersRemainNotConfigured() {
  return globalSourceRegistry()
    .filter((item) => item.sourceId !== 'world_bank_open_data' && item.sourceId !== 'us_sec_edgar')
    .every((item) => item.surface === 'NOT_CONFIGURED' && item.provenLive === false);
}

export function discoveryInvestmentRecommendation() {
  return null;
}

export function createDiscoveryCandidate(input: {
  candidateId: string;
  legalName: string;
  country: string;
  surface?: DataSurfaceState;
}): CompanyDiscoveryCandidate {
  return {
    candidateId: input.candidateId,
    identity: { legalName: input.legalName, aliases: [] },
    jurisdiction: { country: input.country, region: null },
    registry: { registry: 'unknown', registryId: null, configured: false },
    security: { ticker: null, cik: null },
    exchange: { exchange: null, listingStatus: 'unknown' },
    classification: 'startup',
    signals: [],
    reason: 'Research watchlist sample. Not a stock pick.',
    verification: 'UNVERIFIED',
    opportunity: 'REQUIRES_REVIEW',
    risk: 'INSUFFICIENT_EVIDENCE',
    investmentRecommendation: null,
    guaranteedWinner: false,
    surface: input.surface ?? 'DEMO',
  };
}

export function workspaceProviderTruth() {
  return {
    worldBank: worldBankAdapterCapabilityStatus(),
    sec: secAdapterCapabilityStatus(),
    fabric: worldBankGlobalFabricIsProductionLive() || secGlobalFabricIsProductionLive(),
    unprovenConnectors: connectorCatalog().filter((item) => !item.provenLive).every((item) => item.surface === 'NOT_CONFIGURED'),
  };
}
