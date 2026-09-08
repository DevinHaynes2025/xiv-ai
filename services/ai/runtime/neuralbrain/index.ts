/**
 * Phase 2I-AC XIV Brain V4 barrel.
 * Separated brains + multimodal library + quality + founder council.
 * Twin discusses but is never actual CEO. AI agreement ≠ VERIFIED.
 */

export type {
  BrainLane,
  CouncilFlowStage,
  CouncilRole,
  KnowledgeNodeKind,
  KnowledgeQualityState,
  MediaAssetKind,
  MediaRightsState,
} from './types';
export {
  BRAIN_LANES,
  COUNCIL_FLOW,
  COUNCIL_ROLES,
  FOUNDER_TWIN_DISCLOSURE,
  KNOWLEDGE_NODE_KINDS,
  KNOWLEDGE_QUALITY_STATES,
  MEDIA_ASSET_KINDS,
} from './types';

export {
  companyMayAutoPromoteToGlobal,
  createKnowledgeNode,
  evaluateCrossLanePromotion,
  linkKnowledgeNodes,
  listBrainLanes,
  listKnowledgeNodeKinds,
  listKnowledgeQualityStates,
  openBrainLane,
  openXivBrainV4,
  personalMayAutoPromoteToCompany,
  privateMayAutoPromoteToPublic,
} from './brain';
export type {
  BrainLaneSurface,
  KnowledgeEdge,
  KnowledgeNode,
  XivBrainV4,
} from './brain';

export {
  aiAgreementEqualsVerified,
  evidencePromotesQuality,
  markObserved,
  markUnverified,
  promoteKnowledgeQuality,
} from './quality';
export type { QualityPromotionRequest, QualityPromotionResult } from './quality';

export {
  createMediaAsset,
  createMediaRights,
  extractStructuredIntelligence,
  indexingRequiresAuthorizedRights,
  listMediaAssetKinds,
  openMultimodalKnowledgeLibrary,
  wholesaleCopyrightDatabaseCopyAllowed,
} from './library';
export type {
  Claim,
  Citation,
  Embedding,
  Entity,
  Evidence,
  MediaAsset,
  MediaRights,
  MediaSource,
  MultimodalKnowledgeLibrary,
  Relationship,
  Summary,
  Topic,
  Transcript,
  Translation,
} from './library';

export {
  advanceCouncilStage,
  forceArtificialConsensus,
  founderTwinDisclosure,
  listCouncilFlow,
  listCouncilRoles,
  openCouncilSession,
  openFounderCouncil,
  recordDisagreement,
  recordFounderDecision,
  twinBecomesActualCeo,
  twinBecomesUltimateAuthority,
} from './council';
export type {
  AgentChallenge,
  AgentConsensus,
  AgentCounterargument,
  AgentDisagreement,
  AgentEvidence,
  AgentPosition,
  AgentProposal,
  CouncilAgenda,
  CouncilSession,
  FounderCouncil,
  FounderDecision,
} from './council';
