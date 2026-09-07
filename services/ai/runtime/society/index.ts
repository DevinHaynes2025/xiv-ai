export type {
  KnowledgePromotionState,
  LogicalBrainId,
  MeshProviderClass,
  PersonClaimClass,
  PhilosophyDomain,
  SimulationLabel,
  StorageEngine,
  StorageTier,
  ThinkerDomain,
} from './types';

export {
  LEGACY_DISCLAIMER,
  LEGACY_RESEARCH_AGENTS,
  aiInferenceIsDocumentedBelief,
  createHistoricalPerson,
  createObituaryClaim,
  matchHistoricalIdentity,
  obituaryAloneCreatesCompleteLegacyBrain,
} from './person';
export type {
  BiographicalClaim,
  HistoricalIdentity,
  HistoricalPerson,
  ObituaryClaim,
  ObituaryEvidence,
  ObituaryIdentityMatch,
  ObituaryRecord,
  ObituarySource,
  PersonContradiction,
  PersonEvidence,
  PersonIdea,
  PersonInfluence,
  PersonPatent,
  PersonPublication,
  PersonRightsState,
  PersonSource,
  PersonTimeline,
  PersonWork,
} from './person';

export {
  createHistoricalQuotation,
  openLegacySimulation,
  simulateLegacyResponse,
  simulatedStatementEqualsHistoricalQuotation,
  simulationClaimsToBeDeceasedPerson,
} from './simulation';
export type {
  LegacyConcept,
  LegacyEvidence,
  LegacyKnowledgeProfile,
  LegacyPosition,
  LegacyResponse,
  LegacySimulation,
  LegacyUncertainty,
} from './simulation';

export {
  THINKERS_GRAPH_V2_DOMAINS,
  createThinkerNodeV2,
  rankIntellectualValueByProtectedAttribute,
} from './thinkers';
export type { ThinkerNodeV2 } from './thinkers';

export {
  councilDisagreementVisible,
  councilMajorityCreatesVerifiedFact,
  historicalAndAgentMembersDistinguishable,
  openCouncilOfMinds,
} from './council';
export type {
  Council,
  CouncilChallenge,
  CouncilConsensus,
  CouncilDisagreement,
  CouncilEvidence,
  CouncilMember,
  CouncilPosition,
  CouncilQuestion,
  CouncilReport,
  CouncilResponse,
} from './council';

export { agentMeetingGrantsPermissions, openAgentMeeting } from './assembly';
export type {
  AgentAgenda,
  AgentChallenge,
  AgentConsensus,
  AgentContext,
  AgentDisagreement,
  AgentEvidence,
  AgentMeeting,
  AgentMeetingPurpose,
  AgentMeetingReport,
  AgentParticipant,
  AgentPosition,
  AgentQuestion,
  AgentRecommendation,
  AgentResponse,
} from './assembly';

export { orchestratorMayBypassAuthorization, selectSpecialists } from './orchestrator';
export type { OrchestratorCriteria } from './orchestrator';

export {
  POCKET_TEAM_AGENTS,
  pocketAgentAccessUncachedPrivateData,
  pocketAgentBypassesServerAuthority,
} from './pocket-team';

export {
  algorithmModifiesGuardian,
  algorithmModifiesTenantIsolation,
  algorithmProposalProductionDeploysItself,
  biasEvaluationClaimsZeroBias,
  improvementMayChangeGuardian,
  improvementMayChangeOwnPermissions,
  improvementMayChangeTenantPolicy,
  improvementMayDisableSecurity,
  improvementMayProductionDeploy,
  improvementMayRemoveHumanApproval,
  measuredBiasEvaluation,
  proposeAlgorithm,
} from './algorithm';
export type {
  AlgorithmAccuracyEvaluation,
  AlgorithmApproval,
  AlgorithmBenchmark,
  AlgorithmBiasEvaluation,
  AlgorithmCanary,
  AlgorithmCostEvaluation,
  AlgorithmDataset,
  AlgorithmDemand,
  AlgorithmDeployment,
  AlgorithmExperiment,
  AlgorithmProposal,
  AlgorithmRollback,
  AlgorithmSecurityEvaluation,
  AlgorithmVersion,
} from './algorithm';

export { BRAIN_LAYERS, GLOBAL_BRAIN_NETWORK, brainsArePhysicalNestedDatabases } from './brains';

export { promoteKnowledge } from './promotion';
export type {
  KnowledgeCandidate,
  KnowledgeClaim,
  KnowledgeContradiction,
  KnowledgeEvidence,
  KnowledgeReview,
} from './promotion';

export {
  MESH_PROVIDER_CLASSES,
  bypassProviderAccessControls,
  harvestCredentials,
  interceptOverseasNetworks,
  secretlyListenToCommunications,
  societyCrossOrgDenied,
  unauthorizedDatabaseDenied,
  unauthorizedNetworkSourceDenied,
} from './mesh';

export {
  INTELLIGENCE_STORAGE_TIERS,
  STORAGE_ENGINES,
  intelligenceStorageLabeledInfinite,
  trillionScaleClaimedWithoutBenchmark,
} from './storage';

export { agentMemoryBecomesGlobalBrainFact } from './memory';
export type {
  AgentEvidenceMemory,
  AgentLesson,
  AgentMemoryProvenance,
  AgentMemoryRetention,
  AgentMemoryScope,
  AgentTaskMemory,
  AgentWorkingMemory,
} from './memory';

export { HUMAN_THOUGHT_DOMAINS, describePhilosophy, philosophyEndorsesReligion } from './philosophy';
export type { PhilosophyRecord } from './philosophy';
