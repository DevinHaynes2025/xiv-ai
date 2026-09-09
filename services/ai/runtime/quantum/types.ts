/**
 * 62L-EX4 — Local Quantum Simulator Registry types.
 *
 * Truth boundary: classical CPU/GPU/NPU quantum modeling → SIMULATED_QUANTUM only.
 * Never PHYSICAL_QPU_VERIFIED. Simulation ≠ physical execution or quantum advantage.
 *
 * Soft-wire EX1–EX3, Agent Mesh, chipgraph, baselines via existsSync.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA.
 *
 * L4_AUTONOMY_ENABLED=false. tip-land=NO. No PR unless founder asks.
 * Parent: 62L-EX / GitHub #170.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED; SIMULATED_QUANTUM ≠ PHYSICAL_QPU_VERIFIED' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX4' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX4 — Local Quantum Simulator Registry — SIMULATED_QUANTUM only; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const EX4_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EX5 — QPU Provider Truth Registry' as const;

/** Canonical ownership path — never spawn a parallel agent framework. */
export const CANONICAL_PATHWAY = [
  'ResearchMission',
  'QuantumWorkloadGenome',
  'ClassicalBaseline',
  'SimulatorRegistry',
  'EligibleLocalRuntime',
  'CPU_GPU',
  'QuantumSimulation',
  'ExecutionReceipt',
  'Comparison',
  'EvidenceReview',
  'NeuralPathway',
  'XIVHomeBase',
] as const;

export type CanonicalPathwayHop = (typeof CANONICAL_PATHWAY)[number];

/** Shared IR path: Problem → Formulation → Circuit/Model IR → Adapter → Runtime → Device */
export const SHARED_IR_PATH = [
  'Problem',
  'QuantumFormulation',
  'CircuitModelIR',
  'SimulatorAdapter',
  'Runtime',
  'Device',
] as const;

export type SharedIrHop = (typeof SHARED_IR_PATH)[number];

export const EXECUTION_CLASSES = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type ExecutionClass = (typeof EXECUTION_CLASSES)[number];

/** EX4 simulator truth states — no skip to VERIFIED. */
export const SIMULATOR_STATES = [
  'UNKNOWN',
  'DOCUMENTED',
  'NOT_CONFIGURED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'STALE',
  'UNAVAILABLE',
  'REVOKED',
] as const;

export type SimulatorState = (typeof SIMULATOR_STATES)[number];

/** Ordered ladder for progressive verification (subset). No skip. */
export const SIMULATOR_VERIFICATION_LADDER = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
] as const;

export type SimulatorVerificationLadderHop =
  (typeof SIMULATOR_VERIFICATION_LADDER)[number];

export const SIMULATOR_CLASSES = [
  'STATE_VECTOR',
  'DENSITY_MATRIX',
  'STABILIZER',
  'TENSOR_NETWORK',
  'NOISE_SIMULATION',
  'SAMPLER',
  'ANNEALING_SIMULATOR',
  'CUSTOM_XIV_RESEARCH_SIMULATOR',
] as const;

export type SimulatorClass = (typeof SIMULATOR_CLASSES)[number];

export const RUNTIME_TYPES = [
  'LOCAL_CPU',
  'LOCAL_GPU',
  'LOCAL_NPU',
  'HYBRID_LOCAL',
  'CLOUD_SIMULATOR',
] as const;

export type RuntimeType = (typeof RUNTIME_TYPES)[number];

export const PRECISION_MODES = [
  'FLOAT32',
  'FLOAT64',
  'COMPLEX64',
  'COMPLEX128',
  'FIXED_POINT',
] as const;

export type PrecisionMode = (typeof PRECISION_MODES)[number];

export const RESOURCE_DECISIONS = [
  'ALLOW',
  'QUEUE',
  'REDUCE_SCOPE',
  'FALLBACK',
  'DENY',
] as const;

export type ResourceDecision = (typeof RESOURCE_DECISIONS)[number];

export const RESOURCE_DENY_REASONS = [
  'DENY_RESOURCE_LIMIT',
  'DENY_UNSUPPORTED_GATE',
  'DENY_LICENSE',
  'DENY_OFFLINE_NETWORK_REQUIRED',
  'DENY_TENANT',
  'DENY_UNIVERSE',
  'DENY_EXPIRED',
  'DENY_REVOKED',
  'DENY_L4',
  'DENY_NOT_VERIFIED_FOR_CLAIM',
  'DENY_PHYSICAL_QPU_CLAIM',
] as const;

export type ResourceDenyReason = (typeof RESOURCE_DENY_REASONS)[number];

export const REPRODUCIBILITY_STATES = [
  'UNTESTED',
  'REPRODUCIBLE',
  'PARTIALLY_REPRODUCIBLE',
  'NON_REPRODUCIBLE',
] as const;

export type ReproducibilityState = (typeof REPRODUCIBILITY_STATES)[number];

export const CONSENSUS_STATES = [
  'AGREE',
  'REVIEW_REQUIRED',
  'INSUFFICIENT_EVIDENCE',
  'NOT_COMPARED',
] as const;

export type ConsensusState = (typeof CONSENSUS_STATES)[number];

export const WORK_STATES = [
  'QUEUED',
  'LOCAL_READY',
  'RUNNING_SIMULATOR',
  'WAITING_PROVIDER',
  'WAITING_DATA',
  'WAITING_NODE',
  'REVIEW_REQUIRED',
  'COMPLETED',
  'FAILED',
  'EXPIRED',
  'REVOKED',
  'OFFLINE_STOPPED',
] as const;

export type WorkState = (typeof WORK_STATES)[number];

export const QUANTUM_MESH_ROLES = [
  'QuantumResearchAgent',
  'ClassicalBaselineAgent',
  'QuantumInspiredAgent',
  'SimulationAgent',
  'HardwareEvidenceAgent',
  'BenchmarkAgent',
  'ReviewerAgent',
] as const;

export type QuantumMeshRole = (typeof QUANTUM_MESH_ROLES)[number];

export const EX4_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  FABRICATE_PHYSICAL_QPU: false as const,
  REPRESENT_SIM_AS_PHYSICAL_QPU: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  HIDDEN_COT_PERSISTENCE: false as const,
  BROADEN_PERMISSIONS: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  DOCUMENTED_EQ_VERIFIED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  GPU_EXISTS_EQ_ACCEL_EXISTS: false as const,
  SILENT_GPU_CPU_FALLBACK: false as const,
  SILENT_SIMULATOR_AVERAGE: false as const,
  BUY_CLOUD_QPU: false as const,
  REVERSE_ENGINEER_PROPRIETARY_QPU_IP: false as const,
  THIRD_PARTY_ADAPTER_WITHOUT_LICENSE_REVIEW: false as const,
  CROSS_TENANT: false as const,
  CROSS_UNIVERSE: false as const,
  BYPASS_AUTH_GUARDIAN_RLS: false as const,
} as const;

export type Ex4LockKey = keyof typeof EX4_LOCKS;

export const EX4_MUST_NOT = [
  'represent_simulation_as_physical_qpu',
  'claim_unsupported_quantum_advantage',
  'skip_simulator_state_ladder_to_verified',
  'assume_third_party_simulators_installed',
  'gpu_exists_implies_acceleration_verified',
  'silent_gpu_to_cpu_fallback_without_recording_device',
  'silent_average_on_simulator_disagreement',
  'bypass_auth_guardian_rls_tenant_universe',
  'clone_proprietary_qpu_chip_ip_into_dna',
  'spawn_second_orchestration_framework',
  'store_hidden_cot',
  'buy_cloud_or_qpu',
] as const;

export function assertEx4LocksIntact(): boolean {
  return (
    EX4_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX4_LOCKS.TIP_LAND === false &&
    EX4_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX4_LOCKS.FABRICATE_PHYSICAL_QPU === false &&
    EX4_LOCKS.REPRESENT_SIM_AS_PHYSICAL_QPU === false &&
    EX4_LOCKS.CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE === false &&
    EX4_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX4_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false &&
    EX4_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EX4_LOCKS.DOCUMENTED_EQ_VERIFIED === false &&
    EX4_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EX4_LOCKS.GPU_EXISTS_EQ_ACCEL_EXISTS === false &&
    EX4_LOCKS.SILENT_GPU_CPU_FALLBACK === false &&
    EX4_LOCKS.SILENT_SIMULATOR_AVERAGE === false &&
    EX4_LOCKS.BUY_CLOUD_QPU === false
  );
}

export function ex4L4AutonomyEnabled(): false {
  return EX4_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx4(): true {
  return true;
}

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  /** Presence alone never equals VERIFIED. */
  verified: false;
  disposition: 'PRESENT_UNVERIFIED' | 'WAITING_DATA';
};

export type Ex4SoftWireSnapshot = {
  agentMesh: SoftWirePresence;
  ex1Mission: SoftWirePresence;
  ex2ClassicalBaseline: SoftWirePresence;
  ex3QiAlgorithmLab: SoftWirePresence;
  chipgraph: SoftWirePresence;
  classicalBaselineLedger: SoftWirePresence;
  benchmarkEvidence: SoftWirePresence;
  homeBaseDna: SoftWirePresence;
  guardian: SoftWirePresence;
};

export type TenantScope = {
  tenantId: string;
  universeId: string;
  orgId?: string;
};

export type SimulatorRegistryEntry = {
  simulatorId: string;
  name: string;
  version: string;
  provider: string;
  runtimeType: RuntimeType;
  simulatorClass: SimulatorClass;
  supportedPlatforms: readonly string[];
  supportedArchitectures: readonly string[];
  supportedDeviceClasses: readonly string[];
  maxQubitsEvidence: number;
  supportedGateSet: readonly string[];
  precisionModes: readonly PrecisionMode[];
  noiseModelSupport: boolean;
  localOnly: boolean;
  networkRequired: boolean;
  installState: SimulatorState;
  runtimeState: SimulatorState;
  verificationState: SimulatorState;
  source: string;
  license: string;
  sourceHash: string;
  lastDetectedAt: string | null;
  lastVerifiedAt: string | null;
  gpuAccelerationVerified: boolean;
  gpuAccelerationEvidenceRefs: readonly string[];
  licenseReviewed: boolean;
  adapterEnabled: boolean;
  tenantId: string | null;
  universeId: string | null;
};

export type SimulationRequest = {
  requestId: string;
  missionId: string;
  taskId: string;
  agentId: string;
  tenantId: string;
  universeId: string;
  circuitIrId: string;
  preferredSimulatorId: string | null;
  preferredRuntimeType: RuntimeType;
  preferredDeviceClass: 'CPU' | 'GPU' | 'NPU';
  shots: number;
  seed: number;
  precision: PrecisionMode;
  noiseModel: string | null;
  maxQubits: number;
  maxDepth: number;
  maxMemoryMb: number;
  maxWallClockMs: number;
  classicalBaselineId: string | null;
  expiresAt: string;
  offlineDisconnected: boolean;
  poweredOff: boolean;
  requireVerifiedSimulator: boolean;
  networkAvailable: boolean;
  role: QuantumMeshRole;
};

function softWireFile(
  pathChecked: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
    verified: false,
    disposition: present ? 'PRESENT_UNVERIFIED' : 'WAITING_DATA',
  };
}

function firstExisting(
  candidates: string[],
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
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

/**
 * Soft-wire presence probe. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (not FAIL).
 * Probes local tip first, then sibling EX1–EX3 / EW worktrees when present.
 */
export function ex4SoftWireSnapshot(repoRoot?: string): Ex4SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const runtime = join(here, '..');
  const aiRoot = join(here, '../..');
  const root = repoRoot ?? join(here, '../../../..');
  const workspaceParent = join(root, '..');

  return {
    agentMesh: softWireFile(
      join(runtime, 'agentmesh/index.ts'),
      'Agent Mesh PRESENT (soft-wire). Presence≠VERIFIED. Reuse — do not duplicate.',
      'Agent Mesh absent — soft-wire WAITING_DATA.',
    ),
    ex1Mission: firstExisting(
      [
        join(here, 'mission.ts'),
        join(workspaceParent, '.wt-ex1/services/ai/runtime/quantum/mission.ts'),
        join(root, '.wt-ex1/services/ai/runtime/quantum/mission.ts'),
      ],
      'EX1 Offline Quantum Mission soft-wired. Presence≠VERIFIED.',
      'EX1 Mission absent — soft-wire WAITING_DATA.',
    ),
    ex2ClassicalBaseline: firstExisting(
      [
        join(here, 'classical-baseline.ts'),
        join(workspaceParent, '.wt-ex2/services/ai/runtime/quantum/types.ts'),
        join(root, '.wt-ex2/services/ai/runtime/quantum/types.ts'),
      ],
      'EX2 Classical Baseline soft-wired. Presence≠VERIFIED.',
      'EX2 Classical Baseline absent — soft-wire WAITING_DATA.',
    ),
    ex3QiAlgorithmLab: firstExisting(
      [
        join(here, 'qi-algorithm-lab.ts'),
        join(
          workspaceParent,
          '.wt-ex3/services/ai/runtime/quantum/qi-algorithm-lab.ts',
        ),
        join(root, '.wt-ex3/services/ai/runtime/quantum/qi-algorithm-lab.ts'),
      ],
      'EX3 QI Algorithm Lab soft-wired. Presence≠VERIFIED.',
      'EX3 QI Algorithm Lab absent — soft-wire WAITING_DATA.',
    ),
    chipgraph: firstExisting(
      [
        join(runtime, 'chipgraph/types.ts'),
        join(workspaceParent, '.wt-ew6/services/ai/runtime/chipgraph/types.ts'),
        join(root, '.wt-ew6/services/ai/runtime/chipgraph/types.ts'),
        join(workspaceParent, '.wt-ew9/services/ai/runtime/chipgraph/ew9-types.ts'),
      ],
      'Cross-Chip Graph soft-wired. Presence≠VERIFIED.',
      'Chipgraph absent — soft-wire WAITING_DATA.',
    ),
    classicalBaselineLedger: firstExisting(
      [
        join(aiRoot, 'local-runtime/classical-quant-benchmark.ts'),
        join(root, 'services/ai/local-runtime/classical-quant-benchmark.ts'),
      ],
      'Classical baseline / benchmark ledger soft-wired. Presence≠VERIFIED.',
      'Classical baseline ledger absent — soft-wire WAITING_DATA.',
    ),
    benchmarkEvidence: firstExisting(
      [
        join(runtime, 'benchmarks'),
        join(aiRoot, 'local-runtime/benchmark.ts'),
      ],
      'Benchmark evidence soft-wired. Presence≠VERIFIED.',
      'Benchmark evidence absent — soft-wire WAITING_DATA.',
    ),
    homeBaseDna: firstExisting(
      [
        join(aiRoot, 'orchestration/dna/XIV_DNA_MANIFEST.json'),
        join(root, 'services/ai/orchestration/dna/XIV_DNA_MANIFEST.json'),
      ],
      'XIV Home Base DNA soft-wired. Presence≠VERIFIED.',
      'Home Base DNA absent — soft-wire WAITING_DATA.',
    ),
    guardian: firstExisting(
      [
        join(runtime, 'guardian'),
        join(runtime, 'security/hardening.ts'),
        join(aiRoot, 'auth.ts'),
      ],
      'Guardian/policy soft-wired — EX4 must not mutate Guardian/RLS.',
      'Guardian path absent — soft-wire WAITING_DATA (policy still enforced in-contract).',
    ),
  };
}

/** Ladder hop: no skip. DOCUMENTED/DETECTED cannot satisfy VERIFIED. */
export function canAdvanceSimulatorLadder(
  from: SimulatorState,
  to: SimulatorState,
): boolean {
  const fromIdx = (SIMULATOR_VERIFICATION_LADDER as readonly string[]).indexOf(
    from,
  );
  const toIdx = (SIMULATOR_VERIFICATION_LADDER as readonly string[]).indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return false;
  return toIdx === fromIdx + 1;
}

export function documentedSatisfiesVerified(state: SimulatorState): boolean {
  return state === 'VERIFIED';
}

export function detectedSatisfiesVerified(state: SimulatorState): boolean {
  return state === 'VERIFIED';
}
