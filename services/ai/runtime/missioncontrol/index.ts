/**
 * Phase 2I-LA-03 Agent Mission Control + 24/7 Shift Orchestrator barrel.
 * Composes LA-01 cloudworkforce + LA-02 cloudworker.
 * L4 DISABLED. DEFAULT PERMISSIONS = NONE. Architecture ≠ 24/7 LIVE.
 */

export type {
  AgentDepartment,
  AgentDirectoryEntry,
  AgentManager,
  AgentMeeting,
  AgentShiftAssignment,
  AgentShiftDefinition,
  AgentShiftHandoff,
  AgentShiftInstance,
  AgentShiftMission,
  AgentShiftReport,
  AgentTaskForce,
  AnalysisRound,
  AuthorityCeiling,
  BrainLesson,
  BusMessageType,
  Classification,
  ComputationalDegradation,
  DepartmentId,
  EvidencePacket,
  FollowTheSunZone,
  FounderControlAction,
  LiveWorkforceView,
  MissionControlMessage,
  MissionGraph,
  MorningExperience,
  NewRoleProposal,
  OrgMapNode,
  ParallelBrainId,
  PerformanceMemory,
  PriorityClass,
  PrioritySignals,
  ShiftScorecard,
  ShiftTemplateId,
  SimulationResult,
  SkillMatchScore,
  WhyAgentWorking,
  WipLimits,
} from './types';

export {
  ANALYSIS_ROUNDS,
  DEFAULT_WIP_LIMITS,
  FOUNDER_BRIEF_EMAIL,
  INITIAL_DEPARTMENTS,
  SHIFT_TEMPLATE_IDS,
} from './types';

export {
  XIV_SHIFT_DEFINITIONS,
  assignAgentToShift,
  attachMissionToShift,
  createShiftHandoff,
  createShiftReport,
  evaluateShiftHandoff,
  followTheSunImpliesHumanEmployees,
  followTheSunMeans247Live,
  followTheSunZones,
  getShiftDefinition,
  listShiftDefinitions,
  listShiftTemplateIds,
  openShiftInstance,
  shiftCadence,
  shiftHandoffTransfersAuthority,
  shiftHandoffTransfersPermissions,
} from './shifts';

export {
  MANAGER_CAPABILITIES,
  attachDepartmentMission,
  departmentHealth,
  departmentPolicy,
  departmentReport,
  listDepartments,
  managerAttemptDisableGuardian,
  managerAttemptGrantPermissions,
  managerAttemptIncreaseAuthority,
  managerIsAuthorizationAuthority,
  managerMay,
  moreAgentsMeansMoreAuthority,
  openAgentManager,
  openDepartment,
  openDepartmentBudget,
} from './departments';

export {
  advanceAnalysisRound,
  agentsMayCopyFirstAnswerImmediately,
  classifyProblem,
  closeTaskForce,
  formTaskForce,
  independentAnalysisRequired,
  listAnalysisRounds,
  makeMember,
  preserveMeaningfulDisagreement,
  selectTaskForceLead,
  taskForceLeadInheritsExtraPermissions,
} from './taskforces';

export {
  activeWorkRemainsBounded,
  addGraphEdge,
  addGraphNode,
  evaluateWipAdmission,
  ideaPoolMayBeHuge,
  isBlocked,
  mayRunNode,
  openMissionGraph,
  openWipGovernor,
  scorePriority,
} from './graph';

export {
  advanceRoleProposal,
  discoveryEqualsAuthorization,
  duplicateRoleCheck,
  findCapabilityGap,
  proposeNewRole,
  rankAgents,
  registerDirectoryEntry,
  requestSpecialist,
  roleProposalAutoGrantsPermissions,
  scoreSkillMatch,
} from './directory';

export {
  advanceMeeting,
  createBusMessage,
  createEvidencePacket,
  evaluateBusMessage,
  evidenceCopiesSensitivePayload,
  mayDeliverEvidence,
  meetingEqualsAuthority,
  openMeeting,
} from './bus';

export {
  assessDegradation,
  degradationRecoverySteps,
  recordPerformance,
  routingShouldUseMeasuredResults,
  shouldReplaceWorker,
  usesHumanFatigueModel,
} from './performance';

export {
  databaseAgentsProposeOnly,
  engineeringAllowsAutoProdDeploy,
  getShiftBehavior,
  salesAllowsSpam,
  securityFindingsCanStopUnsafeWork,
  unknownRemainsValidInResearch,
} from './behaviors';
export type { ShiftBehaviorFlow } from './behaviors';

export {
  PARALLEL_BRAINS,
  consensusEqualsTruth,
  conveneParallelBrains,
  eachBrainReasonsIndependently,
  runSimulation,
  simulationEqualsReality,
  synthesizeParallelResults,
} from './parallel';
export type { ParallelBrainResult } from './parallel';

export {
  applyFounderControl,
  buildOrgMap,
  buildShiftScorecard,
  composeMorningExperience,
  explainWhyWorking,
  lessonAutoPromotesIgnoringClassification,
  liveViewClaims247,
  moreCompletedEqualsBetterIntelligence,
  morningExperienceIs247Live,
  openLiveWorkforceView,
  recordBrainLesson,
} from './founder';

export {
  attemptBudgetBypass,
  attemptCrossTenantTaskForce,
  attemptForgedHandoff,
  attemptManagerPermissionEscalation,
  attemptUnauthorizedAgentAddition,
  attemptUnauthorizedToolDelegation,
  denySecurityAttempt,
  missionDependsOnSingleProcess,
  recoverFromManagerDeath,
} from './security';
export type { SecurityAttempt } from './security';

export {
  emptyCompletionEvidence,
  missionControlDefaultPermissions,
  missionControlL4Enabled,
  missionControlRuns247Live,
  openPhase2ilcGrounding,
  shiftOrchestrationMeans247Live,
} from './grounding';
export type { MissionControlCompletionEvidence } from './grounding';
