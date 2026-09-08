/**
 * 2I-AI-62B Agent Meeting Network barrel.
 * Composes with mission-control task forces without replacing them.
 * L4 disabled. Meeting ≠ authority. Overnight ≠ uncontrolled action.
 */

export {
  STORY_ID,
  STORY_TITLE,
  MEETING_LIFECYCLE,
  XARP_ROLES,
  HUMAN_KNOWLEDGE_CLASSES,
  AGENT_CONTROLS,
  TASK_FORCE_LIFECYCLE,
  DEFAULT_BUDGET,
  EMPTY_SPEND,
} from './types';
export type {
  Actor,
  AgentControl,
  AgentReputation,
  Allow,
  Classification,
  CommandCenterSnapshot,
  Deny,
  DirectoryAgent,
  GuardianObservation,
  HumanContribution,
  HumanKnowledgeClass,
  MeetingAction,
  MeetingBudget,
  MeetingDecision,
  MeetingEvidence,
  MeetingMessage,
  MeetingOutcome,
  MeetingParticipant,
  MeetingProposal,
  MeetingStage,
  MeetingStatus,
  OvernightBrief,
  TaskForceRecord,
  TemporalContext,
  TranslatedUtterance,
  XarpRole,
  XivAgentMeeting,
} from './types';

export {
  advanceStage,
  authorizeContext,
  charge,
  collectEvidence,
  createMeeting,
  getMeeting,
  isSeated,
  joinMeeting,
  meetingEqualsAuthority,
  meetingNetworkLive,
  openMeetingNetwork,
  postMessage,
  retrievePrivateContext,
  selectParticipants,
  spawnUnrestrictedSubagent,
} from './engine';
export type { MeetingNetwork } from './engine';

export {
  consensusEqualsTruth,
  listDecisions,
  listObjections,
  listOptions,
  listProposals,
  listVotes,
  listXarpRoles,
  objectToProposal,
  preserveDisagreement,
  resetProtocolState,
  submitProposal,
  synthesizeRecommendation,
  voteOnProposal,
} from './protocol';

export {
  fabricateApproval,
  humanDecide,
  humanEnterMeeting,
  humanOpinionIsUniversalTruth,
  listActions,
  listHumanContributions,
  listOutcomes,
  queueAuthorizedAction,
  recordHumanKnowledge,
  recordOutcome,
  resetHumanState,
} from './humans';

export {
  advanceTaskForce,
  evaluateRecommendationOutcome,
  getDirectoryAgent,
  listDirectory,
  listTaskForces,
  logicalPopulationEqualsActiveCompute,
  overnightEqualsUncontrolledAction,
  recommendTaskForce,
  registerDirectoryAgent,
  reputationExpandsAuthority,
  resetSocietyState,
  runOvernightSession,
  seedExampleDirectory,
  sleepTaskForce,
  taskForceGrantsPermissions,
  updateReputation,
} from './society';

export {
  applyControl,
  guardianIsSubordinateToMeeting,
  killTaskForce,
  listControls,
  observeGuardian,
  terminateOnBudgetExhaustion,
  useTool,
} from './governance';

export {
  attachTemporalContext,
  commandCenterSnapshot,
  culturalContextIsFact,
  evaluateMeetingKnowledge,
  reconstructMeeting,
  translateUtterance,
} from './memory';
export type { MeetingMemory } from './memory';

export { apiNameGrantsCapability, handleMeetingApi } from './api';

export const AGENT_MEETING_NETWORK_LIVE = false;
export const OVERNIGHT_MEETINGS_LIVE = false;
export const AUTO_MEETING_EXECUTION = false;
export const L4_AUTONOMY_ENABLED = false;
export const AGENT_CIVILIZATION_FOUNDATION_62A_IMPLEMENTED = false;
