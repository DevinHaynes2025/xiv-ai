/**
 * 62L-EO8 — Supply Chain Resilience Pack barrel.
 *
 * Soft-wire EO6 / EO7 / EO5 / #159 / Home Base when present.
 * L4_AUTONOMY_ENABLED=false. tip-land=NO. No PR.
 */

export {
  HONESTY_BANNER,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  SOFT_WIRE_EO_ISSUE,
  SOFT_WIRE_EN_ISSUE,
  GITLAB_MIRROR_NOTE,
  EO8_DB_CANDIDATES_STATUS,
  NEXT_PHASE_TITLE,
  TRUTH_BOUNDARY_LABELS,
  RESILIENCE_GRAPH_NODE_KINDS,
  RESILIENCE_WORKFLOW,
  SCENARIO_LIBRARY,
  RESILIENCE_RECORD_FIELDS,
  RESILIENCE_AGENT_TEAM,
  RESILIENCE_OUTPUT_FIELDS,
  SUPPLY_CHAIN_RESILIENCE_PACK_CYCLE,
  EO8_LOCKS,
  EO8_MAY,
  EO8_MUST_NOT,
  assertEo8LocksIntact,
  eo8SoftWireSnapshot,
  isHumanApprover,
  isBoundedResilienceAgent,
  isValidTruthLabel,
} from './supply-chain-resilience-pack-types.ts';

export type {
  TruthBoundaryLabel,
  ResilienceGraphNodeKind,
  ResilienceWorkflowHop,
  ScenarioLibraryId,
  ResilienceRecordField,
  ResilienceAgentRole,
  ResilienceOutputField,
  Eo8Hop,
  Eo8EvidenceState,
  Eo8HopRecord,
  Eo8ActorKind,
  Eo8Actor,
  SoftWirePresence,
  Eo8SoftWireSnapshot,
} from './supply-chain-resilience-pack-types.ts';

export {
  registerResilienceGraph,
  getResilienceGraph,
  listResilienceRecordFields,
  listTruthBoundaryLabels,
  listScenarioLibrary,
  listResilienceAgentTeam,
  bootstrapSupplyChainResiliencePack,
  runSandboxScenario,
  advanceResilienceWorkflow,
  recommendRecovery,
  requireHumanRecoveryApproval,
  attachEvidenceToHomeBase,
  attemptAutonomousPurchasing,
  attemptAutonomousSupplierSwitching,
  attemptAutonomousContractChanges,
  attemptAutonomousPhysicalDispatch,
  attemptAutonomousExternalCommunications,
  attemptFabricateMissionDisruptionData,
  attemptTreatHistoricalAsProofOfNext,
  attemptTreatSimAsFact,
  attemptTreatRecommendAsAct,
  attemptL4Autonomy,
  attemptAgentSelfExpandAuthority,
  attemptAutoExecuteRecovery,
} from './supply-chain-resilience-pack-runtime.ts';

export type {
  ResilienceGraphNode,
  ResilienceGraphEdge,
  ResilienceGraph,
  ResiliencePackBootstrap,
  HistoricalAnalogue,
  RecoveryOption,
  ResilienceScenarioResult,
  RecoveryRecommendationPacket,
  HumanRecoveryApproval,
  HomeBaseEvidenceAttach,
  AutonomyDeny,
} from './supply-chain-resilience-pack-runtime.ts';
