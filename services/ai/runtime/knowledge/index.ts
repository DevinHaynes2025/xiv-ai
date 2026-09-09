export type {
  AgentFoundryState,
  AiBoardId,
  ArticlePublishState,
  ArticleSummary,
  KnowledgeLoopStep,
  LogisticsIntegratorId,
  PassportEvidenceClass,
  ProductJourneyStage,
  ResearchProvider,
  ResearchProviderStatus,
  ResearchProviderType,
} from './types';

export {
  RESEARCH_PROVIDER_REGISTRY,
  articleSummaryKeepsProvenance,
  autoPublishAiDraft,
  conflictingSourcesRemainVisible,
  copyrightedSourceCannotBeRepublishedWholesale,
  createArticleSummary,
  deduplicateArticles,
  publicDataCannotOverrideGuardian,
  republishCopyrightedArticle,
  researchProviderStatus,
  unprovenSearchProviderRemainsNotConfigured,
} from './research';
export type { ArticleIdentity } from './research';

export {
  createHistoricalRecord,
  historicalClaimsRequireProvenance,
  historicalLibraryStatus,
} from './history';
export type { HistoricalBusinessRecord, HistoricalProvenance } from './history';

export {
  carrierEventIsManufacturerFact,
  classifySupplierClaim,
  createProductPassport,
  createSupplierProfile,
  createSupplyChainEvent,
  inferCompletedJourneyStage,
  inventProductOrigin,
  productPassportInventedOrigin,
  supplierSelfReportIsVerifiedFact,
} from './supply';
export type { ProductPassport, SupplierProfile, SupplyChainEvent } from './supply';

export {
  LOGISTICS_INTEGRATORS,
  commerceCustomerDataStaysPrivate,
  commerceCustomerRecord,
  externalIntegrationsRemainNotConfigured,
  fabricateParcelTracking,
  logisticsIntegrationStatus,
  normalizeLogisticsEvent,
} from './logistics';

export {
  draftAgentSpecification,
  foundryMayDeployWithoutHumanApproval,
  foundrySelfDeploy,
  foundrySelfGrantPermissions,
  foundrySelfGrantTools,
} from './foundry';
export type { AgentSpecification } from './foundry';

export {
  AI_BOARD_IDS,
  aiBoardDisagreementVisible,
  consequentialBoardHasContradictionSeat,
  openAiBoard,
} from './boards';
export type { AiBoardPosition, AiBoardSession } from './boards';

export {
  KNOWLEDGE_INTELLIGENCE_LOOP,
  globalBrainExcludesTenantPrivateData,
  knowledgeCrossOrgDenied,
  learningMayRewriteSecurityOrProductionPolicy,
} from './loop';
