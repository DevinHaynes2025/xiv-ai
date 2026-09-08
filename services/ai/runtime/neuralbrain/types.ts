/**
 * Phase 2I-AC XIV Brain V4 + Multimodal Knowledge + Quality contracts.
 * Separated brains; no automatic Personal→Company / Company→Global / Private→Public.
 */

export type BrainLane =
  | 'PERSONAL'
  | 'COMPANY'
  | 'POCKET'
  | 'PUBLIC_INTELLIGENCE'
  | 'HISTORICAL'
  | 'SUPPLIER'
  | 'PRODUCT'
  | 'LOCATION';

export type KnowledgeNodeKind =
  | 'KnowledgeNode'
  | 'KnowledgeEdge'
  | 'ClaimNode'
  | 'EvidenceNode'
  | 'ContradictionNode'
  | 'DecisionNode'
  | 'OutcomeNode'
  | 'LessonNode'
  | 'HypothesisNode'
  | 'ScenarioNode'
  | 'ResearchNode';

export type KnowledgeQualityState =
  | 'OBSERVED'
  | 'UNVERIFIED'
  | 'SUPPORTED'
  | 'CONTRADICTED'
  | 'REVIEW_REQUIRED'
  | 'VERIFIED'
  | 'STALE'
  | 'RETRACTED';

export type MediaAssetKind =
  | 'ARTICLE'
  | 'BLOG'
  | 'PAPER'
  | 'REPORT'
  | 'FILING'
  | 'VIDEO'
  | 'PODCAST'
  | 'TRANSCRIPT'
  | 'BUSINESS_LIVE'
  | 'MEETING'
  | 'DOCUMENT'
  | 'IMAGE'
  | 'PRODUCT_INFO'
  | 'SUPPLIER_INFO'
  | 'HISTORICAL'
  | 'GOVERNMENT_OPEN_DATA';

export type MediaRightsState =
  | 'UNKNOWN'
  | 'LICENSED'
  | 'PUBLIC_DOMAIN'
  | 'CUSTOMER_OWNED'
  | 'FAIR_USE_REVIEW'
  | 'DENIED'
  | 'OPEN_DATA';

export type CouncilRole =
  | 'FounderTwin'
  | 'Executive'
  | 'Strategy'
  | 'Finance'
  | 'Security'
  | 'Product'
  | 'Engineering'
  | 'Research'
  | 'SupplyChain'
  | 'Database'
  | 'Customer'
  | 'Innovation'
  | 'Contradiction';

export type CouncilFlowStage =
  | 'QUESTION'
  | 'INDEPENDENT_ANALYSIS'
  | 'EVIDENCE'
  | 'DEBATE'
  | 'CONTRADICTION'
  | 'ALTERNATIVES'
  | 'RISK'
  | 'SYNTHESIS'
  | 'RECOMMENDATION'
  | 'AUTHORIZED_HUMAN_DECISION';

export const BRAIN_LANES = [
  'PERSONAL',
  'COMPANY',
  'POCKET',
  'PUBLIC_INTELLIGENCE',
  'HISTORICAL',
  'SUPPLIER',
  'PRODUCT',
  'LOCATION',
] as const satisfies readonly BrainLane[];

export const KNOWLEDGE_NODE_KINDS = [
  'KnowledgeNode',
  'KnowledgeEdge',
  'ClaimNode',
  'EvidenceNode',
  'ContradictionNode',
  'DecisionNode',
  'OutcomeNode',
  'LessonNode',
  'HypothesisNode',
  'ScenarioNode',
  'ResearchNode',
] as const satisfies readonly KnowledgeNodeKind[];

export const KNOWLEDGE_QUALITY_STATES = [
  'OBSERVED',
  'UNVERIFIED',
  'SUPPORTED',
  'CONTRADICTED',
  'REVIEW_REQUIRED',
  'VERIFIED',
  'STALE',
  'RETRACTED',
] as const satisfies readonly KnowledgeQualityState[];

export const MEDIA_ASSET_KINDS = [
  'ARTICLE',
  'BLOG',
  'PAPER',
  'REPORT',
  'FILING',
  'VIDEO',
  'PODCAST',
  'TRANSCRIPT',
  'BUSINESS_LIVE',
  'MEETING',
  'DOCUMENT',
  'IMAGE',
  'PRODUCT_INFO',
  'SUPPLIER_INFO',
  'HISTORICAL',
  'GOVERNMENT_OPEN_DATA',
] as const satisfies readonly MediaAssetKind[];

export const COUNCIL_ROLES = [
  'FounderTwin',
  'Executive',
  'Strategy',
  'Finance',
  'Security',
  'Product',
  'Engineering',
  'Research',
  'SupplyChain',
  'Database',
  'Customer',
  'Innovation',
  'Contradiction',
] as const satisfies readonly CouncilRole[];

export const COUNCIL_FLOW = [
  'QUESTION',
  'INDEPENDENT_ANALYSIS',
  'EVIDENCE',
  'DEBATE',
  'CONTRADICTION',
  'ALTERNATIVES',
  'RISK',
  'SYNTHESIS',
  'RECOMMENDATION',
  'AUTHORIZED_HUMAN_DECISION',
] as const satisfies readonly CouncilFlowStage[];

/** Exact Founder Twin disclosure — must never imply actual founder/CEO authority. */
export const FOUNDER_TWIN_DISCLOSURE =
  'XIV Founder Twin — AI representation of Devin Xavier Haynes' as const;
