/**
 * 62L-EX1 — Offline Quantum Mission Contract runtime.
 * Canonical flow: Founder/User Mission → XIV Home Base → Quantum Mission Contract →
 * Task Decomposition → Classical Baseline → Local CPU/GPU/NPU Candidate →
 * Quantum-Inspired / Simulator Candidate → Authorized QPU Candidate when available →
 * Benchmark → Evidence Review → Lesson → XIV Home Base.
 *
 * Soft-wires Agent Mesh, EW chipgraph, compute envelopes, benchmarks via existsSync.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 * L4_AUTONOMY_ENABLED=false. No second orchestration framework.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ADVANTAGE_CLAIM_KINDS,
  EXECUTION_CLASSES,
  EX1_LOCKS,
  NEURAL_PATHWAY_STAGES,
  OFFLINE_ALLOWED_DEVICES,
  PROVIDER_REQUIRED_DEVICES,
  QUANTUM_MESH_ROLES,
  QUANTUM_WORK_STATES,
  type AdvantageClaimKind,
  type ClassicalBaselineEquivalence,
  type ComputeBudget,
  type EvidenceState,
  type ExecutionClass,
  type InputDataClass,
  type OfflineAllowedDevice,
  type PrivacyClass,
  type ProblemClass,
  type QuantumChildTaskSpec,
  type QuantumMeshRole,
  type QuantumMissionContract,
  type QuantumWorkState,
  type RequestedDevice,
  type SoftWirePresence,
} from './types';

const HERE = dirname(fileURLToPath(import.meta.url));
const AI_ROOT = join(HERE, '..', '..');
const WORKTREE_ROOT = join(AI_ROOT, '..', '..');
const WORKSPACE_PARENT = join(WORKTREE_ROOT, '..');

export type MissionCreateResult =
  | { ok: true; mission: QuantumMissionContract }
  | { ok: false; reason: string; mission: QuantumMissionContract };

export type MissionAdvanceResult =
  | { ok: true; mission: QuantumMissionContract }
  | { ok: false; reason: string; state: QuantumWorkState; mission: QuantumMissionContract };

export type ClassificationResult =
  | { ok: true; classification: ExecutionClass; previous: ExecutionClass }
  | { ok: false; reason: string; classification: ExecutionClass };

export type ChildSpawnResult =
  | { allowed: true; child: QuantumMissionContract }
  | { allowed: false; reason: string };

export type HandoffEvalResult = { allowed: true } | { allowed: false; reason: string };

export type AdvantageGateResult = {
  quantumAdvantageVerified: boolean;
  allowed: boolean;
  reason: string;
  missing: readonly string[];
};

export type ClassicalBaselineGateResult = {
  allowed: boolean;
  reason: string;
  baselineRequired: boolean;
};

export type DeviceRouteResult = {
  workState: QuantumWorkState;
  classification: ExecutionClass;
  actualDevice: string | null;
  reason: string;
  fabricated: false;
};

function softWire(pathChecked: string, notePresent: string, noteAbsent: string): SoftWirePresence {
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
    verified: false,
    disposition: present ? 'PRESENT_UNVERIFIED' : 'WAITING_DATA',
  };
}

function firstExisting(candidates: string[], notePresent: string, noteAbsent: string): SoftWirePresence {
  for (const pathChecked of candidates) {
    if (existsSync(pathChecked)) {
      return {
        present: true,
        pathChecked,
        note: notePresent,
        verified: false,
        disposition: 'PRESENT_UNVERIFIED',
      };
    }
  }
  return {
    present: false,
    pathChecked: candidates[0]!,
    note: noteAbsent,
    verified: false,
    disposition: 'WAITING_DATA',
  };
}

/** Soft-wire audit — presence ≠ VERIFIED. Absent → WAITING_DATA. */
export function auditEx1SoftWires(): {
  agentMesh: SoftWirePresence;
  agentMeshRuntime: SoftWirePresence;
  agentsRuntime: SoftWirePresence;
  chipgraph: SoftWirePresence;
  computeEnvelope: SoftWirePresence;
  benchmarks: SoftWirePresence;
  classicalQuantBenchmark: SoftWirePresence;
  guardian: SoftWirePresence;
} {
  return {
    agentMesh: softWire(
      join(AI_ROOT, 'runtime', 'agentmesh'),
      'Agent Mesh present (integrate-in-place; not a second framework).',
      'Agent Mesh absent → WAITING_DATA.',
    ),
    agentMeshRuntime: softWire(
      join(AI_ROOT, 'runtime', 'agentmesh', 'runtime.ts'),
      'Agent Mesh runtime soft-wired.',
      'Agent Mesh runtime absent → WAITING_DATA.',
    ),
    agentsRuntime: softWire(
      join(AI_ROOT, 'runtime', 'agents.ts'),
      'agents.ts soft-wired.',
      'agents.ts absent → WAITING_DATA.',
    ),
    chipgraph: firstExisting(
      [
        join(AI_ROOT, 'runtime', 'chipgraph'),
        join(WORKSPACE_PARENT, '.wt-ew6', 'services', 'ai', 'runtime', 'chipgraph'),
        join(WORKTREE_ROOT, '.wt-ew6', 'services', 'ai', 'runtime', 'chipgraph'),
      ],
      'EW chipgraph present via existsSync — soft-wire only; presence ≠ VERIFIED.',
      'EW chipgraph absent → WAITING_DATA (not FAIL).',
    ),
    computeEnvelope: firstExisting(
      [
        join(AI_ROOT, 'runtime', 'compute'),
        join(AI_ROOT, 'runtime', 'compute', 'index.ts'),
      ],
      'Compute envelope module present via existsSync — soft-wire only.',
      'Compute envelopes absent → WAITING_DATA.',
    ),
    benchmarks: firstExisting(
      [
        join(AI_ROOT, 'runtime', 'benchmarks'),
        join(AI_ROOT, 'local-runtime', 'benchmark.ts'),
        join(WORKSPACE_PARENT, 'services', 'ai', 'local-runtime', 'benchmark.ts'),
      ],
      'Benchmarks present via existsSync — soft-wire only; presence ≠ VERIFIED.',
      'Benchmarks absent → WAITING_DATA.',
    ),
    classicalQuantBenchmark: firstExisting(
      [
        join(AI_ROOT, 'local-runtime', 'classical-quant-benchmark.ts'),
        join(WORKSPACE_PARENT, 'services', 'ai', 'local-runtime', 'classical-quant-benchmark.ts'),
      ],
      'Classical/quant benchmark soft-wired — presence ≠ VERIFIED.',
      'Classical/quant benchmark absent → WAITING_DATA.',
    ),
    guardian: softWire(
      join(AI_ROOT, 'runtime', 'guardian'),
      'Guardian present — EX1 must not mutate Guardian/RLS.',
      'Guardian path absent → WAITING_DATA (policy still enforced in-contract).',
    ),
  };
}

export function listExecutionClasses(): readonly ExecutionClass[] {
  return EXECUTION_CLASSES;
}

export function listQuantumWorkStates(): readonly QuantumWorkState[] {
  return QUANTUM_WORK_STATES;
}

export function listQuantumMeshRoles(): readonly QuantumMeshRole[] {
  return QUANTUM_MESH_ROLES;
}

export function listNeuralPathwayStages(): readonly string[] {
  return NEURAL_PATHWAY_STAGES;
}

export function listOfflineAllowedDevices(): readonly OfflineAllowedDevice[] {
  return OFFLINE_ALLOWED_DEVICES;
}

export function ex1L4AutonomyEnabled(): false {
  return EX1_LOCKS.L4_AUTONOMY_ENABLED;
}

export function ex1HiddenCotPersistenceAllowed(): false {
  return EX1_LOCKS.HIDDEN_COT_PERSISTENCE;
}

export function assertEx1LocksIntact(): boolean {
  return (
    EX1_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX1_LOCKS.TIP_LAND === false &&
    EX1_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX1_LOCKS.PRODUCTION_WRITE === false &&
    EX1_LOCKS.MERGE_MAIN === false &&
    EX1_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX1_LOCKS.FABRICATE_CLOUD_QPU_EXECUTION === false &&
    EX1_LOCKS.HIDDEN_COT_PERSISTENCE === false &&
    EX1_LOCKS.CHILD_PERMISSION_EXPANSION === false &&
    EX1_LOCKS.CROSS_TENANT_HANDOFF === false &&
    EX1_LOCKS.CROSS_UNIVERSE_HANDOFF === false &&
    EX1_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    EX1_LOCKS.SILENT_RECLASSIFICATION === false &&
    EX1_LOCKS.AUTO_QUANTUM_ADVANTAGE_CLAIM === false &&
    EX1_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EX1_LOCKS.CLAIM_CONSCIOUSNESS_VERIFIED === false &&
    EX1_LOCKS.CLAIM_SUPERINTELLIGENCE_VERIFIED === false
  );
}

function isExpired(expiresAt: string, nowIso: string): boolean {
  return Date.parse(nowIso) > Date.parse(expiresAt);
}

function isSubset<T extends string>(child: readonly T[], parent: readonly T[]): boolean {
  const set = new Set(parent);
  return child.every((x) => set.has(x));
}

function budgetLte(child: ComputeBudget, parent: ComputeBudget): boolean {
  return (
    child.maxCpuMs <= parent.maxCpuMs &&
    child.maxGpuMs <= parent.maxGpuMs &&
    child.maxNpuMs <= parent.maxNpuMs &&
    child.maxQpuShots <= parent.maxQpuShots
  );
}

function isOfflineAllowedDevice(device: string): device is OfflineAllowedDevice {
  return (OFFLINE_ALLOWED_DEVICES as readonly string[]).includes(device);
}

function isProviderRequiredDevice(device: string): boolean {
  return (PROVIDER_REQUIRED_DEVICES as readonly string[]).includes(device);
}

function defaultClassificationForDevice(device: RequestedDevice): ExecutionClass {
  if (device === 'LOCAL_CPU' || device === 'VERIFIED_LOCAL_GPU' || device === 'VERIFIED_LOCAL_NPU') {
    return 'CLASSICAL';
  }
  if (device === 'QUANTUM_INSPIRED_CLASSICAL_RUNTIME') {
    return 'QUANTUM_INSPIRED';
  }
  if (device === 'LOCAL_QUANTUM_SIMULATOR') {
    return 'SIMULATED_QUANTUM';
  }
  if (isProviderRequiredDevice(device)) {
    return 'PHYSICAL_QPU_VERIFIED';
  }
  return 'CLASSICAL';
}

function workStateForClassification(classification: ExecutionClass): QuantumWorkState {
  switch (classification) {
    case 'CLASSICAL':
      return 'RUNNING_CLASSICAL';
    case 'QUANTUM_INSPIRED':
      return 'RUNNING_QUANTUM_INSPIRED';
    case 'SIMULATED_QUANTUM':
      return 'RUNNING_SIMULATOR';
    case 'PHYSICAL_QPU_VERIFIED':
      return 'WAITING_PROVIDER';
    default:
      return 'QUEUED';
  }
}

function blockedMission(
  input: Parameters<typeof createQuantumMissionContract>[0],
  reason: string,
  workState: QuantumWorkState,
): MissionCreateResult {
  const now = input.now ?? new Date().toISOString();
  const preferred = input.preferredExecutionClass ?? 'CLASSICAL';
  const mission: QuantumMissionContract = {
    missionId: input.missionId,
    taskId: input.taskId,
    parentTaskId: input.parentTaskId ?? null,
    agentId: input.agentId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    problemClass: input.problemClass,
    objective: input.objective,
    inputDataClass: input.inputDataClass,
    privacyClass: input.privacyClass,
    allowedExecutionClasses: [...(input.allowedExecutionClasses ?? ['CLASSICAL'])],
    preferredExecutionClass: preferred,
    classicalBaselineRequired: input.classicalBaselineRequired !== false,
    minimumEvidenceState: input.minimumEvidenceState ?? 'DOCUMENTED',
    computeBudget: { ...input.computeBudget },
    memoryBudget: { ...input.memoryBudget },
    timeBudget: { ...input.timeBudget },
    externalCostBudget: {
      maxUsd: input.externalCostBudget?.maxUsd ?? 0,
      cloudPurchaseAllowed: false,
      qpuPurchaseAllowed: false,
    },
    allowedProviders: [...(input.allowedProviders ?? [])],
    allowedDevices: [...(input.allowedDevices ?? ['LOCAL_CPU'])],
    evidenceRequirements: [...input.evidenceRequirements],
    benchmarkRequirements: [...(input.benchmarkRequirements ?? [])],
    stopConditions: [...(input.stopConditions ?? ['EXPIRY', 'REVOCATION', 'POWERED_OFF', 'BUDGET_EXHAUSTED'])],
    returnPath: input.returnPath,
    createdAt: now,
    expiresAt: input.expiresAt,
    status: workState === 'EXPIRED' ? 'EXPIRED' : workState === 'REVOKED' ? 'REVOKED' : 'FAILED',
    workState,
    classification: preferred,
    agentRole: input.agentRole ?? 'QuantumResearchAgent',
    poweredOff: input.poweredOff === true,
    offlineDisconnected: input.offlineDisconnected !== false,
    physicalQpuAvailable: input.physicalQpuAvailable === true,
    classicalBaselineId: null,
    classicalBaseline: null,
    quantumAdvantageVerified: false,
    l4Enabled: false,
    hiddenCotPersistence: false,
    guardianRlsUnchanged: true,
  };
  return { ok: false, reason, mission };
}

export function createQuantumMissionContract(input: {
  missionId: string;
  taskId: string;
  parentTaskId?: string | null;
  agentId: string;
  tenantId: string;
  universeId: string;
  problemClass: ProblemClass;
  objective: string;
  inputDataClass: InputDataClass;
  privacyClass: PrivacyClass;
  allowedExecutionClasses?: readonly ExecutionClass[];
  preferredExecutionClass?: ExecutionClass;
  classicalBaselineRequired?: boolean;
  minimumEvidenceState?: EvidenceState;
  computeBudget: ComputeBudget;
  memoryBudget: { maxMb: number };
  timeBudget: { maxWallClockMs: number };
  externalCostBudget?: { maxUsd: number };
  allowedProviders?: readonly string[];
  allowedDevices?: readonly RequestedDevice[];
  evidenceRequirements: readonly string[];
  benchmarkRequirements?: readonly string[];
  stopConditions?: readonly string[];
  returnPath: string;
  expiresAt: string;
  agentRole?: QuantumMeshRole;
  poweredOff?: boolean;
  offlineDisconnected?: boolean;
  physicalQpuAvailable?: boolean;
  requestedDevice?: RequestedDevice;
  now?: string;
}): MissionCreateResult {
  if (!assertEx1LocksIntact() || EX1_LOCKS.L4_AUTONOMY_ENABLED) {
    return blockedMission(input, 'L4_AUTONOMY_MUST_REMAIN_FALSE', 'FAILED');
  }

  const now = input.now ?? new Date().toISOString();
  const preferred = input.preferredExecutionClass ?? 'CLASSICAL';
  const allowedClasses = input.allowedExecutionClasses ?? (['CLASSICAL'] as const);
  if (!allowedClasses.includes(preferred)) {
    return blockedMission(input, 'PREFERRED_CLASS_NOT_IN_ALLOWED', 'FAILED');
  }

  if (isExpired(input.expiresAt, now)) {
    return blockedMission(input, 'MISSION_EXPIRED', 'EXPIRED');
  }

  if (input.poweredOff === true) {
    return blockedMission(input, 'POWERED_OFF_OFFLINE_STOPPED', 'OFFLINE_STOPPED');
  }

  const offlineDisconnected = input.offlineDisconnected !== false;
  const physicalQpuAvailable = input.physicalQpuAvailable === true;
  const requestedDevice = input.requestedDevice ?? 'LOCAL_CPU';

  let classification: ExecutionClass = preferred;
  let workState: QuantumWorkState = 'LOCAL_READY';
  let reasonOk: string | null = null;
  let failReason: string | null = null;

  // Explicit device-driven routing (offline honesty).
  if (isProviderRequiredDevice(requestedDevice) || preferred === 'PHYSICAL_QPU_VERIFIED') {
    if (!physicalQpuAvailable || offlineDisconnected) {
      classification = 'PHYSICAL_QPU_VERIFIED';
      workState = 'WAITING_PROVIDER';
      failReason = 'PHYSICAL_QPU_UNAVAILABLE_WHILE_DISCONNECTED';
    } else {
      classification = 'PHYSICAL_QPU_VERIFIED';
      workState = 'QUEUED';
      reasonOk = 'PHYSICAL_QPU_AUTHORIZED_AND_AVAILABLE';
    }
  } else if (requestedDevice === 'LOCAL_QUANTUM_SIMULATOR' || preferred === 'SIMULATED_QUANTUM') {
    classification = 'SIMULATED_QUANTUM';
    workState = 'LOCAL_READY';
    reasonOk = 'LOCAL_SIMULATOR_ROUTED';
  } else if (
    requestedDevice === 'QUANTUM_INSPIRED_CLASSICAL_RUNTIME' ||
    preferred === 'QUANTUM_INSPIRED'
  ) {
    classification = 'QUANTUM_INSPIRED';
    workState = 'LOCAL_READY';
    reasonOk = 'QUANTUM_INSPIRED_LOCAL_ROUTED';
  } else {
    // Default CLASSICAL for LOCAL_CPU / verified local GPU/NPU.
    classification = 'CLASSICAL';
    workState = 'LOCAL_READY';
    reasonOk = 'CLASSICAL_LOCAL_ROUTED';
  }

  // Soft-wire absence for required data → WAITING_DATA (not fabricate).
  if (workState === 'LOCAL_READY') {
    const wires = auditEx1SoftWires();
    if (!wires.agentMesh.present) {
      workState = 'WAITING_DATA';
      failReason = 'AGENT_MESH_WAITING_DATA';
    }
  }

  const mission: QuantumMissionContract = {
    missionId: input.missionId,
    taskId: input.taskId,
    parentTaskId: input.parentTaskId ?? null,
    agentId: input.agentId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    problemClass: input.problemClass,
    objective: input.objective,
    inputDataClass: input.inputDataClass,
    privacyClass: input.privacyClass,
    allowedExecutionClasses: [...allowedClasses],
    preferredExecutionClass: preferred,
    classicalBaselineRequired: input.classicalBaselineRequired !== false,
    minimumEvidenceState: input.minimumEvidenceState ?? 'DOCUMENTED',
    computeBudget: { ...input.computeBudget },
    memoryBudget: { ...input.memoryBudget },
    timeBudget: { ...input.timeBudget },
    externalCostBudget: {
      maxUsd: input.externalCostBudget?.maxUsd ?? 0,
      cloudPurchaseAllowed: false,
      qpuPurchaseAllowed: false,
    },
    allowedProviders: [...(input.allowedProviders ?? [])],
    allowedDevices: [...(input.allowedDevices ?? ['LOCAL_CPU'])],
    evidenceRequirements: [...input.evidenceRequirements],
    benchmarkRequirements: [...(input.benchmarkRequirements ?? [])],
    stopConditions: [...(input.stopConditions ?? ['EXPIRY', 'REVOCATION', 'POWERED_OFF', 'BUDGET_EXHAUSTED'])],
    returnPath: input.returnPath,
    createdAt: now,
    expiresAt: input.expiresAt,
    status: 'ACTIVE',
    workState,
    classification,
    agentRole: input.agentRole ?? 'QuantumResearchAgent',
    poweredOff: false,
    offlineDisconnected,
    physicalQpuAvailable,
    classicalBaselineId: null,
    classicalBaseline: null,
    quantumAdvantageVerified: false,
    l4Enabled: false,
    hiddenCotPersistence: false,
    guardianRlsUnchanged: true,
  };

  if (failReason) {
    return { ok: false, reason: failReason, mission };
  }
  void reasonOk;
  return { ok: true, mission };
}

/**
 * Route a requested device under offline constraints.
 * Physical QPU while disconnected → WAITING_PROVIDER (never fabricate).
 */
export function routeOfflineDevice(input: {
  requestedDevice: RequestedDevice;
  preferredExecutionClass?: ExecutionClass;
  offlineDisconnected: boolean;
  physicalQpuAvailable: boolean;
  poweredOff?: boolean;
}): DeviceRouteResult {
  if (input.poweredOff === true) {
    return {
      workState: 'OFFLINE_STOPPED',
      classification: input.preferredExecutionClass ?? 'CLASSICAL',
      actualDevice: null,
      reason: 'POWERED_OFF',
      fabricated: false,
    };
  }

  if (isProviderRequiredDevice(input.requestedDevice)) {
    if (input.offlineDisconnected || !input.physicalQpuAvailable) {
      return {
        workState: 'WAITING_PROVIDER',
        classification: 'PHYSICAL_QPU_VERIFIED',
        actualDevice: null,
        reason: 'PHYSICAL_QPU_REQUIRES_PROVIDER',
        fabricated: false,
      };
    }
    return {
      workState: 'QUEUED',
      classification: 'PHYSICAL_QPU_VERIFIED',
      actualDevice: input.requestedDevice,
      reason: 'PHYSICAL_QPU_AVAILABLE',
      fabricated: false,
    };
  }

  if (!isOfflineAllowedDevice(input.requestedDevice)) {
    return {
      workState: 'WAITING_DATA',
      classification: input.preferredExecutionClass ?? 'CLASSICAL',
      actualDevice: null,
      reason: `DEVICE_NOT_OFFLINE_ALLOWED:${input.requestedDevice}`,
      fabricated: false,
    };
  }

  const classification =
    input.preferredExecutionClass &&
    defaultClassificationForDevice(input.requestedDevice) === input.preferredExecutionClass
      ? input.preferredExecutionClass
      : defaultClassificationForDevice(input.requestedDevice);

  // Explicit quantum-inspired labeling when preferred or device says so.
  const finalClass =
    input.preferredExecutionClass === 'QUANTUM_INSPIRED' &&
    (input.requestedDevice === 'LOCAL_CPU' ||
      input.requestedDevice === 'VERIFIED_LOCAL_GPU' ||
      input.requestedDevice === 'VERIFIED_LOCAL_NPU' ||
      input.requestedDevice === 'QUANTUM_INSPIRED_CLASSICAL_RUNTIME')
      ? 'QUANTUM_INSPIRED'
      : classification;

  return {
    workState: 'LOCAL_READY',
    classification: finalClass,
    actualDevice: input.requestedDevice,
    reason: 'OFFLINE_DEVICE_ROUTED',
    fabricated: false,
  };
}

/**
 * Explicit reclassification only — silent change denied.
 * Simulator can never become PHYSICAL_QPU_VERIFIED.
 */
export function reclassifyExecution(
  mission: QuantumMissionContract,
  next: ExecutionClass,
  opts: { explicit: boolean; physicalQpuVerified?: boolean } = { explicit: false },
): ClassificationResult {
  if (!opts.explicit || EX1_LOCKS.SILENT_RECLASSIFICATION) {
    return {
      ok: false,
      reason: 'SILENT_RECLASSIFICATION_DENIED',
      classification: mission.classification,
    };
  }
  if (!mission.allowedExecutionClasses.includes(next)) {
    return {
      ok: false,
      reason: 'CLASS_NOT_IN_ALLOWED_EXECUTION_CLASSES',
      classification: mission.classification,
    };
  }
  if (mission.classification === 'SIMULATED_QUANTUM' && next === 'PHYSICAL_QPU_VERIFIED') {
    return {
      ok: false,
      reason: 'SIMULATOR_CANNOT_BECOME_PHYSICAL_QPU_VERIFIED',
      classification: mission.classification,
    };
  }
  if (next === 'PHYSICAL_QPU_VERIFIED' && opts.physicalQpuVerified !== true) {
    return {
      ok: false,
      reason: 'PHYSICAL_QPU_NOT_VERIFIED',
      classification: mission.classification,
    };
  }
  return { ok: true, classification: next, previous: mission.classification };
}

export function applyReclassification(
  mission: QuantumMissionContract,
  next: ExecutionClass,
  opts: { explicit: boolean; physicalQpuVerified?: boolean },
): MissionAdvanceResult {
  const result = reclassifyExecution(mission, next, opts);
  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason,
      state: mission.workState,
      mission,
    };
  }
  const updated: QuantumMissionContract = {
    ...mission,
    classification: result.classification,
    preferredExecutionClass: result.classification,
    workState: workStateForClassification(result.classification),
  };
  return { ok: true, mission: updated };
}

export function advanceQuantumMission(
  mission: QuantumMissionContract,
  input: {
    now?: string;
    revoked?: boolean;
    poweredOff?: boolean;
    nodeAvailable?: boolean;
    markRunning?: boolean;
    requestedDevice?: RequestedDevice;
    physicalQpuAvailable?: boolean;
    offlineDisconnected?: boolean;
  } = {},
): MissionAdvanceResult {
  const now = input.now ?? new Date().toISOString();
  let next: QuantumMissionContract = { ...mission };

  if (input.revoked === true) {
    next = { ...next, workState: 'REVOKED', status: 'REVOKED' };
    return { ok: false, reason: 'MISSION_REVOKED', state: 'REVOKED', mission: next };
  }

  if (input.poweredOff === true || next.poweredOff) {
    next = { ...next, poweredOff: true, workState: 'OFFLINE_STOPPED', status: 'PAUSED' };
    return {
      ok: false,
      reason: 'POWERED_OFF_NEVER_CLAIM_CONTINUED_WORK',
      state: 'OFFLINE_STOPPED',
      mission: next,
    };
  }

  if (isExpired(next.expiresAt, now)) {
    next = { ...next, workState: 'EXPIRED', status: 'EXPIRED' };
    return { ok: false, reason: 'MISSION_EXPIRED', state: 'EXPIRED', mission: next };
  }

  if (input.nodeAvailable === false) {
    next = { ...next, workState: 'WAITING_NODE' };
    return { ok: false, reason: 'WAITING_NODE', state: 'WAITING_NODE', mission: next };
  }

  const offline =
    input.offlineDisconnected !== undefined ? input.offlineDisconnected : next.offlineDisconnected;
  const qpu =
    input.physicalQpuAvailable !== undefined ? input.physicalQpuAvailable : next.physicalQpuAvailable;
  next = { ...next, offlineDisconnected: offline, physicalQpuAvailable: qpu };

  if (input.requestedDevice) {
    const route = routeOfflineDevice({
      requestedDevice: input.requestedDevice,
      preferredExecutionClass: next.preferredExecutionClass,
      offlineDisconnected: offline,
      physicalQpuAvailable: qpu,
    });
    next = {
      ...next,
      workState: route.workState,
      classification: route.classification,
    };
    if (route.workState === 'WAITING_PROVIDER' || route.workState === 'WAITING_DATA') {
      return { ok: false, reason: route.reason, state: route.workState, mission: next };
    }
  }

  if (
    (next.classification === 'PHYSICAL_QPU_VERIFIED' ||
      next.preferredExecutionClass === 'PHYSICAL_QPU_VERIFIED') &&
    (offline || !qpu)
  ) {
    next = { ...next, workState: 'WAITING_PROVIDER' };
    return {
      ok: false,
      reason: 'PHYSICAL_QPU_UNAVAILABLE_WHILE_DISCONNECTED',
      state: 'WAITING_PROVIDER',
      mission: next,
    };
  }

  if (input.markRunning === true) {
    next = { ...next, workState: workStateForClassification(next.classification) };
    return { ok: true, mission: next };
  }

  if (next.workState === 'QUEUED' || next.workState === 'LOCAL_READY') {
    return { ok: true, mission: next };
  }

  return { ok: true, mission: next };
}

export function attachClassicalBaseline(
  mission: QuantumMissionContract,
  baseline: ClassicalBaselineEquivalence & { baselineId: string },
): QuantumMissionContract {
  return {
    ...mission,
    classicalBaselineId: baseline.baselineId,
    classicalBaseline: {
      algorithm: baseline.algorithm,
      input: baseline.input,
      problemSize: baseline.problemSize,
      seedOrConfig: baseline.seedOrConfig,
      precisionOrTolerance: baseline.precisionOrTolerance,
      hardware: baseline.hardware,
      runtimeMs: baseline.runtimeMs,
      latencyMs: baseline.latencyMs,
      memoryMb: baseline.memoryMb,
      outputQuality: baseline.outputQuality,
      successCriteria: baseline.successCriteria,
      recorded: baseline.recorded,
    },
  };
}

/**
 * Classical baseline gate: before claiming FASTER/BETTER/LOWER_COST/MORE_ACCURATE/MORE_EFFICIENT
 * vs a quantum candidate, require equivalent classical baseline where feasible.
 */
export function evaluateClassicalBaselineGate(input: {
  mission: QuantumMissionContract;
  claimKind: AdvantageClaimKind;
  quantumCandidatePresent: boolean;
}): ClassicalBaselineGateResult {
  if (!(ADVANTAGE_CLAIM_KINDS as readonly string[]).includes(input.claimKind)) {
    return { allowed: false, reason: 'UNKNOWN_CLAIM_KIND', baselineRequired: true };
  }
  if (!input.quantumCandidatePresent) {
    return { allowed: false, reason: 'NO_QUANTUM_CANDIDATE', baselineRequired: true };
  }
  if (input.mission.classicalBaselineRequired === false) {
    // Still block advantage claims — EX1 honesty: baseline required for advantage.
    return {
      allowed: false,
      reason: 'CLASSICAL_BASELINE_REQUIRED_FOR_ADVANTAGE_CLAIM',
      baselineRequired: true,
    };
  }
  const baseline = input.mission.classicalBaseline;
  if (!baseline || !baseline.recorded || !input.mission.classicalBaselineId) {
    return {
      allowed: false,
      reason: 'MISSING_CLASSICAL_BASELINE_BLOCKS_ADVANTAGE_CLAIM',
      baselineRequired: true,
    };
  }
  const requiredFields = [
    baseline.algorithm,
    baseline.input,
    String(baseline.problemSize),
    baseline.seedOrConfig,
    baseline.precisionOrTolerance,
    baseline.hardware,
    baseline.outputQuality,
    baseline.successCriteria,
  ];
  if (requiredFields.some((f) => !f || String(f).trim() === '')) {
    return {
      allowed: false,
      reason: 'INCOMPLETE_CLASSICAL_BASELINE_EQUIVALENCE',
      baselineRequired: true,
    };
  }
  return { allowed: true, reason: 'CLASSICAL_BASELINE_SATISFIED', baselineRequired: true };
}

/**
 * QUANTUM_ADVANTAGE_VERIFIED=true only if:
 * physical QPU verified AND equivalent classical baseline AND
 * reproducible comparable benchmark AND review gate passes.
 * Else false.
 */
export function evaluateQuantumAdvantageGate(input: {
  mission: QuantumMissionContract;
  physicalQpuVerified: boolean;
  classicalBaselineEquivalent: boolean;
  reproducibleComparableBenchmark: boolean;
  reviewGatePassed: boolean;
}): AdvantageGateResult {
  const missing: string[] = [];
  if (!input.physicalQpuVerified) missing.push('PHYSICAL_QPU_VERIFIED');
  if (!input.classicalBaselineEquivalent) missing.push('EQUIVALENT_CLASSICAL_BASELINE');
  if (!input.reproducibleComparableBenchmark) missing.push('REPRODUCIBLE_COMPARABLE_BENCHMARK');
  if (!input.reviewGatePassed) missing.push('REVIEW_GATE');
  if (EX1_LOCKS.AUTO_QUANTUM_ADVANTAGE_CLAIM) {
    return {
      quantumAdvantageVerified: false,
      allowed: false,
      reason: 'AUTO_QUANTUM_ADVANTAGE_CLAIM_FORBIDDEN',
      missing,
    };
  }
  if (missing.length > 0) {
    return {
      quantumAdvantageVerified: false,
      allowed: false,
      reason: `QUANTUM_ADVANTAGE_NOT_VERIFIED:${missing.join('+')}`,
      missing,
    };
  }
  return {
    quantumAdvantageVerified: true,
    allowed: true,
    reason: 'QUANTUM_ADVANTAGE_VERIFIED_ALL_GATES_PASSED',
    missing: [],
  };
}

export function setQuantumAdvantageFlag(
  mission: QuantumMissionContract,
  gate: AdvantageGateResult,
): QuantumMissionContract {
  return {
    ...mission,
    quantumAdvantageVerified: gate.quantumAdvantageVerified === true,
  };
}

export function spawnQuantumChild(
  parent: QuantumMissionContract,
  child: QuantumChildTaskSpec,
  opts: { now?: string } = {},
): ChildSpawnResult {
  const now = opts.now ?? new Date().toISOString();

  if (
    parent.workState === 'REVOKED' ||
    parent.workState === 'EXPIRED' ||
    parent.workState === 'OFFLINE_STOPPED' ||
    parent.workState === 'FAILED'
  ) {
    return { allowed: false, reason: `PARENT_STATE_${parent.workState}` };
  }
  if (isExpired(parent.expiresAt, now)) {
    return { allowed: false, reason: 'PARENT_EXPIRED' };
  }
  if (child.parentTaskId !== parent.taskId) {
    return { allowed: false, reason: 'PARENT_TASK_ID_MISMATCH' };
  }
  if (child.tenantId !== parent.tenantId) {
    return { allowed: false, reason: 'CROSS_TENANT_CHILD_DENIED' };
  }
  if (child.universeId !== parent.universeId) {
    return { allowed: false, reason: 'CROSS_UNIVERSE_CHILD_DENIED' };
  }
  if (!budgetLte(child.computeBudget, parent.computeBudget)) {
    return { allowed: false, reason: 'CHILD_COMPUTE_BUDGET_EXPANSION_DENIED' };
  }
  if (isExpired(child.expiry, now) || Date.parse(child.expiry) > Date.parse(parent.expiresAt)) {
    return { allowed: false, reason: 'CHILD_EXPIRY_INVALID' };
  }
  if (!isSubset(child.executionClasses, parent.allowedExecutionClasses)) {
    return { allowed: false, reason: 'CHILD_EXECUTION_CLASS_PERMISSION_EXPANSION_DENIED' };
  }
  if (!isSubset(child.allowedData, [parent.inputDataClass])) {
    // Child may only use data class equal to parent input (or empty subset).
    // Allow if every child data class is the parent class (strict ≤).
    const parentData: readonly InputDataClass[] = [parent.inputDataClass];
    if (!isSubset(child.allowedData, parentData)) {
      return { allowed: false, reason: 'CHILD_DATA_PERMISSION_EXPANSION_DENIED' };
    }
  }
  if (child.memoryBudget && child.memoryBudget.maxMb > parent.memoryBudget.maxMb) {
    return { allowed: false, reason: 'CHILD_MEMORY_BUDGET_EXPANSION_DENIED' };
  }
  if (child.timeBudget && child.timeBudget.maxWallClockMs > parent.timeBudget.maxWallClockMs) {
    return { allowed: false, reason: 'CHILD_TIME_BUDGET_EXPANSION_DENIED' };
  }
  if (EX1_LOCKS.CHILD_PERMISSION_EXPANSION) {
    return { allowed: false, reason: 'CHILD_PERMISSION_EXPANSION_LOCK' };
  }
  if (!(QUANTUM_MESH_ROLES as readonly string[]).includes(child.agentRole)) {
    return { allowed: false, reason: 'UNKNOWN_MESH_ROLE' };
  }

  const created = createQuantumMissionContract({
    missionId: parent.missionId,
    taskId: child.childTaskId,
    parentTaskId: parent.taskId,
    agentId: child.childAgentId,
    tenantId: child.tenantId,
    universeId: child.universeId,
    problemClass: parent.problemClass,
    objective: child.purpose,
    inputDataClass: child.allowedData[0] ?? parent.inputDataClass,
    privacyClass: parent.privacyClass,
    allowedExecutionClasses: child.executionClasses,
    preferredExecutionClass: child.executionClasses[0] ?? 'CLASSICAL',
    classicalBaselineRequired: parent.classicalBaselineRequired,
    minimumEvidenceState: parent.minimumEvidenceState,
    computeBudget: child.computeBudget,
    memoryBudget: child.memoryBudget ?? parent.memoryBudget,
    timeBudget: child.timeBudget ?? parent.timeBudget,
    externalCostBudget: { maxUsd: 0 },
    allowedProviders: parent.allowedProviders,
    allowedDevices: parent.allowedDevices,
    evidenceRequirements: child.evidenceRequirements,
    benchmarkRequirements: parent.benchmarkRequirements,
    stopConditions: parent.stopConditions,
    returnPath: child.returnPath,
    expiresAt: child.expiry,
    agentRole: child.agentRole,
    poweredOff: false,
    offlineDisconnected: parent.offlineDisconnected,
    physicalQpuAvailable: parent.physicalQpuAvailable,
    now,
  });

  if (!created.ok && created.mission.workState === 'EXPIRED') {
    return { allowed: false, reason: 'CHILD_EXPIRED' };
  }

  return { allowed: true, child: created.mission };
}

export function evaluateQuantumHandoff(input: {
  fromTenantId: string;
  toTenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
}): HandoffEvalResult {
  if (input.fromTenantId !== input.toTenantId) {
    return { allowed: false, reason: 'CROSS_TENANT_HANDOFF_DENIED' };
  }
  if (input.fromUniverseId !== input.toUniverseId) {
    return { allowed: false, reason: 'CROSS_UNIVERSE_HANDOFF_DENIED' };
  }
  if (EX1_LOCKS.CROSS_TENANT_HANDOFF || EX1_LOCKS.CROSS_UNIVERSE_HANDOFF) {
    return { allowed: false, reason: 'HANDOFF_LOCK' };
  }
  return { allowed: true };
}

/** Learning may change routing/research priority/confidence/retest — NOT authority. */
export function applyNeuralPathwayLesson(input: {
  stage: string;
  mayChangeRouting: true;
  mayChangeResearchPriority: true;
  mayChangeConfidence: true;
  mayChangeRetest: true;
  mayChangeGuardian: boolean;
  mayChangeRls: boolean;
  mayChangePermissions: boolean;
  mayChangeTenant: boolean;
  mayChangeUniverse: boolean;
  mayChangeFinancialAuthority: boolean;
  mayChangeProductionAuthority: boolean;
}): { allowed: boolean; reason: string } {
  if (!(NEURAL_PATHWAY_STAGES as readonly string[]).includes(input.stage)) {
    return { allowed: false, reason: 'UNKNOWN_PATHWAY_STAGE' };
  }
  if (
    input.mayChangeGuardian ||
    input.mayChangeRls ||
    input.mayChangePermissions ||
    input.mayChangeTenant ||
    input.mayChangeUniverse ||
    input.mayChangeFinancialAuthority ||
    input.mayChangeProductionAuthority
  ) {
    return {
      allowed: false,
      reason: 'NEURAL_PATHWAY_CANNOT_CHANGE_GUARDIAN_RLS_PERMISSIONS_TENANT_UNIVERSE_FINANCIAL_PRODUCTION',
    };
  }
  return { allowed: true, reason: 'LESSON_MAY_UPDATE_ROUTING_PRIORITY_CONFIDENCE_RETEST_ONLY' };
}

export function guardianRlsUnchangedByEx1(): true {
  return true;
}
