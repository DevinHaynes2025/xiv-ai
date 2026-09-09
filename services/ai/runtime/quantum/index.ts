/**
 * 62L-EX7 + EX8 — quantum runtime facade.
 * EX7: Hybrid Classical/Quantum Router.
 * EX8: Offline Quantum Agent Team (extends mesh; not a second framework).
 * Does NOT duplicate Agent Mesh / Guardian / identity / tenant /
 * compute envelope / QPU registry / baseline engine.
 */

export * from './types.ts';
export * from './route-policy.ts';
export * from './route-score.ts';
export * from './route-receipt.ts';
export * from './hybrid-router.ts';

/** EX8 — Offline Quantum Agent Team (named exports to avoid EX7 symbol clashes). */
export {
  HONESTY_BANNER as EX8_HONESTY_BANNER,
  GITHUB_SOT_ISSUE as EX8_GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL as EX8_GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE as EX8_GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE as EX8_GITLAB_MIRROR_NOTE,
  EX8_DB_CANDIDATES_STATUS,
  NEXT_PHASE_TITLE as EX8_NEXT_PHASE_TITLE,
  CANONICAL_PATHWAY as EX8_CANONICAL_PATHWAY,
  EX8_LOCKS,
  EX8_MUST_NOT,
  QUANTUM_TEAM_ROLES,
  AGENT_TEAM_STATES,
  MESSAGE_TYPES,
  CONSENSUS_STATES,
  assertEx8LocksIntact,
  ex8L4AutonomyEnabled,
  guardianRlsUnchangedByEx8,
  ex8SoftWireSnapshot,
} from './agent-team-types.ts';
export type {
  QuantumTeamRole,
  AgentTeamState,
  MessageType,
  ConsensusState,
  ExecutionClass as Ex8ExecutionClass,
  DataClass as Ex8DataClass,
  ComputeBudget as Ex8ComputeBudget,
  QuantumTeamAgentContract,
  TeamMessageEnvelope,
  BranchReturnRecord,
  DisagreementRecord,
  MeetingRecord,
  NeuralPathwayUpdate,
  Ex8SoftWireSnapshot,
} from './agent-team-types.ts';

export {
  registerQuantumTeamAgent,
  recordHeartbeat,
  isHeartbeatActive,
  transitionAgentState,
  powerOffAgent,
  stopExpiredAgent,
  evaluateWebDependency,
  evaluatePhysicalQpuDependency,
  spawnChildAgent,
  sendTeamMessage,
  applyLearningUpdate,
  requestLocalCompute,
} from './agent-team.ts';
export type { RegisterAgentInput, ChildSpawnInput, Denied, Ok } from './agent-team.ts';

export { planQuantumMission } from './team-planner.ts';
export type { MissionPlanInput, PlannedChildSpec, MissionPlan } from './team-planner.ts';

export {
  openTeamMeeting,
  appendMeetingTurn,
  recordDisagreement,
  resolveMeetingConsensus,
  meetingHasHiddenCot,
} from './team-meeting.ts';

export {
  resetEvidenceLedgerForTests,
  recordEvidence,
  listEvidenceForMission,
  createBranchReturn,
  deliverReturnToHomeBase,
  recordFailedExperiment,
  updateNeuralPathway,
} from './team-receipt.ts';
export type { EvidenceLedgerEntry } from './team-receipt.ts';
