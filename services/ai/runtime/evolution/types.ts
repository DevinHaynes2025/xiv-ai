/**
 * Phase 2I-AC Continuous Evolution contracts.
 * Feedback Loop V4, Interface Evolution, Night Shift V3, Content Intelligence, Visual graphs.
 */

export type FeedbackLoopStage =
  | 'OBSERVE'
  | 'MEASURE'
  | 'COMPARE_EXPECTED_VS_ACTUAL'
  | 'ANALYZE'
  | 'CRITIQUE'
  | 'LESSON'
  | 'NEW_HYPOTHESIS';

export type NightShiftKind =
  | 'RESEARCH'
  | 'ENGINEERING'
  | 'DATABASE'
  | 'SECURITY'
  | 'PRODUCT'
  | 'SUPPLY_CHAIN'
  | 'INFORMATION_LOGISTICS'
  | 'CONTENT_INTELLIGENCE'
  | 'QA'
  | 'INNOVATION';

export type ContentIntelligenceStage =
  | 'SOURCE_ASSET'
  | 'RIGHTS_AND_SOURCE'
  | 'TRANSCRIPTION_OR_EXTRACTION'
  | 'ENTITIES'
  | 'CLAIMS'
  | 'EVIDENCE'
  | 'TOPICS'
  | 'RELATIONSHIPS'
  | 'COMPANY_SUPPLY_CHAIN_CONTEXT'
  | 'KNOWLEDGE_GRAPH'
  | 'SEARCH_ANSWERS_RESEARCH';

export type VisualGraphKind =
  | 'DATA_LINEAGE'
  | 'KNOWLEDGE'
  | 'AGENT_COLLABORATION'
  | 'SUPPLIER'
  | 'PRODUCT_JOURNEY'
  | 'INFORMATION_LOGISTICS'
  | 'COMPANY_BRAIN'
  | 'CLOUD_INFRA'
  | 'DECISION'
  | 'OUTCOME'
  | 'UNIVERSE';

export type InterfaceProposalKind =
  | 'NAVIGATION'
  | 'DASHBOARD'
  | 'VISUALIZATION'
  | 'GRAPH'
  | 'MOBILE'
  | 'ACCESSIBILITY'
  | 'WORKFLOW'
  | 'PERSONALIZATION';

export const FEEDBACK_LOOP_STAGES = [
  'OBSERVE',
  'MEASURE',
  'COMPARE_EXPECTED_VS_ACTUAL',
  'ANALYZE',
  'CRITIQUE',
  'LESSON',
  'NEW_HYPOTHESIS',
] as const satisfies readonly FeedbackLoopStage[];

export const NIGHT_SHIFT_KINDS = [
  'RESEARCH',
  'ENGINEERING',
  'DATABASE',
  'SECURITY',
  'PRODUCT',
  'SUPPLY_CHAIN',
  'INFORMATION_LOGISTICS',
  'CONTENT_INTELLIGENCE',
  'QA',
  'INNOVATION',
] as const satisfies readonly NightShiftKind[];

export const CONTENT_INTELLIGENCE_STAGES = [
  'SOURCE_ASSET',
  'RIGHTS_AND_SOURCE',
  'TRANSCRIPTION_OR_EXTRACTION',
  'ENTITIES',
  'CLAIMS',
  'EVIDENCE',
  'TOPICS',
  'RELATIONSHIPS',
  'COMPANY_SUPPLY_CHAIN_CONTEXT',
  'KNOWLEDGE_GRAPH',
  'SEARCH_ANSWERS_RESEARCH',
] as const satisfies readonly ContentIntelligenceStage[];

export const VISUAL_GRAPH_KINDS = [
  'DATA_LINEAGE',
  'KNOWLEDGE',
  'AGENT_COLLABORATION',
  'SUPPLIER',
  'PRODUCT_JOURNEY',
  'INFORMATION_LOGISTICS',
  'COMPANY_BRAIN',
  'CLOUD_INFRA',
  'DECISION',
  'OUTCOME',
  'UNIVERSE',
] as const satisfies readonly VisualGraphKind[];

export const INTERFACE_PROPOSAL_KINDS = [
  'NAVIGATION',
  'DASHBOARD',
  'VISUALIZATION',
  'GRAPH',
  'MOBILE',
  'ACCESSIBILITY',
  'WORKFLOW',
  'PERSONALIZATION',
] as const satisfies readonly InterfaceProposalKind[];
