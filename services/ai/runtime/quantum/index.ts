/**
 * 62L-EX1 — Offline Quantum Mission Contract barrel.
 * Integrates with Agent Mesh + Home Base — not a second orchestration framework.
 * Soft-wires chipgraph / compute / benchmarks via existsSync; presence ≠ VERIFIED.
 */

export type {
  AdvantageClaimKind,
  ClassicalBaselineEquivalence,
  ComputeBudget,
  EvidenceState,
  ExecutionClass,
  Ex1LockKey,
  ExternalCostBudget,
  InputDataClass,
  MemoryBudget,
  MissionStatus,
  NeuralPathwayStage,
  OfflineAllowedDevice,
  PrivacyClass,
  ProblemClass,
  ProviderRequiredDevice,
  QuantumChildTaskSpec,
  QuantumMeshRole,
  QuantumMissionContract,
  QuantumWorkState,
  RequestedDevice,
  SoftWirePresence,
  TimeBudget,
} from './types';

export {
  ADVANTAGE_CLAIM_KINDS,
  EVIDENCE_STATES,
  EXECUTION_CLASSES,
  EX1_LOCKS,
  INPUT_DATA_CLASSES,
  MISSION_STATUS_VALUES,
  NEURAL_PATHWAY_STAGES,
  OFFLINE_ALLOWED_DEVICES,
  PRIVACY_CLASSES,
  PROBLEM_CLASSES,
  PROVIDER_REQUIRED_DEVICES,
  QUANTUM_MESH_ROLES,
  QUANTUM_WORK_STATES,
} from './types';

export {
  advanceQuantumMission,
  applyNeuralPathwayLesson,
  applyReclassification,
  assertEx1LocksIntact,
  attachClassicalBaseline,
  auditEx1SoftWires,
  createQuantumMissionContract,
  evaluateClassicalBaselineGate,
  evaluateQuantumAdvantageGate,
  evaluateQuantumHandoff,
  ex1HiddenCotPersistenceAllowed,
  ex1L4AutonomyEnabled,
  guardianRlsUnchangedByEx1,
  listExecutionClasses,
  listNeuralPathwayStages,
  listOfflineAllowedDevices,
  listQuantumMeshRoles,
  listQuantumWorkStates,
  reclassifyExecution,
  routeOfflineDevice,
  setQuantumAdvantageFlag,
  spawnQuantumChild,
} from './mission';

export type {
  AdvantageGateResult,
  ChildSpawnResult,
  ClassicalBaselineGateResult,
  ClassificationResult,
  DeviceRouteResult,
  HandoffEvalResult,
  MissionAdvanceResult,
  MissionCreateResult,
} from './mission';

export {
  completeMissionWithReceipt,
  createExecutionReceipt,
} from './receipts';

export type {
  ExecutionReceipt,
  ExecutionReceiptInput,
  ReceiptCreateResult,
} from './receipts';
