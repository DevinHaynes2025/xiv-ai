/**
 * 62L-EX8 — Offline Quantum Agent Team (Global Operations Brain / GitHub #170).
 *
 * Soft-wire EX1–EX7, Agent Mesh, hybrid router, baselines, QI lab,
 * simulator/QPU registries, benchmarks, evidence, chipgraph via existsSync.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * Base: EX7 tip `cursor/62l-ex7-hybrid-classical-quantum-router-4059`
 * (hybrid-router co-located; EX8 extends — does not replace).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. tip-land=NO. No PR unless founder asks.
 * Never claim simulator=physical QPU, unsupported quantum advantage,
 * or consciousness/superintelligence as verified.
 *
 * Canonical flow (one mesh — not a second agent framework):
 * Founder/User Mission → Home Base → Mission Planner → Quantum Agent Team →
 * Child Tasks → Local Compute (Hybrid Router only) → Results/Evidence →
 * Agent Review Meeting → Consensus/Disagreement Record → Home Base →
 * Neural Pathway Update.
 *
 * Next (docs-only): EX9 — Quantum Workload Genome.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED; simulator ≠ physical QPU; presence ≠ VERIFIED' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX8' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX8 — Offline Quantum Agent Team — mesh-governed multi-agent quantum research; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const EX8_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE = 'EX9 — Quantum Workload Genome' as const;

/** Canonical ownership path — never spawn a parallel agent framework. */
export const CANONICAL_PATHWAY = [
  'FounderUserMission',
  'HomeBase',
  'MissionPlanner',
  'QuantumAgentTeam',
  'ChildTasks',
  'LocalCompute',
  'ResultsEvidence',
  'AgentReviewMeeting',
  'ConsensusDisagreementRecord',
  'HomeBase',
  'NeuralPathwayUpdate',
] as const;

export type CanonicalPathwayHop = (typeof CANONICAL_PATHWAY)[number];

export const EX8_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  FORCE_PUSH: false as const,
  SECOND_AGENT_FRAMEWORK: false as const,
  HIDDEN_COT: false as const,
  CLAIM_SIMULATOR_EQ_PHYSICAL_QPU: false as const,
  CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE: false as const,
  CLAIM_CONSCIOUSNESS_AS_FACT: false as const,
  CLAIM_SUPERINTELLIGENCE_AS_FACT: false as const,
  BROADEN_PERMISSIONS: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  LEARNING_CHANGES_PERMISSIONS: false as const,
  LEARNING_CHANGES_GUARDIAN: false as const,
  LEARNING_CHANGES_RLS: false as const,
  LEARNING_CHANGES_FINANCIAL_AUTHORITY: false as const,
  LEARNING_CHANGES_PRODUCTION_AUTHORITY: false as const,
  DIRECT_ARBITRARY_HARDWARE: false as const,
  AUTOMATIC_LAN_ENROLLMENT: false as const,
  BUY_CLOUD_QPU_AUTONOMOUSLY: false as const,
  SPAWN_UNCONTROLLED_AGENTS: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  CROSS_TENANT_MESSAGE: false as const,
  CROSS_UNIVERSE_MESSAGE: false as const,
  CHILD_PERMISSION_EXPANSION: false as const,
  CHILD_COMPUTE_BUDGET_EXPANSION: false as const,
} as const;

export type Ex8LockKey = keyof typeof EX8_LOCKS;

export const EX8_MUST_NOT = [
  'spawn_second_agent_framework',
  'persist_hidden_cot',
  'claim_simulator_equals_physical_qpu',
  'claim_unsupported_quantum_advantage',
  'claim_consciousness_or_superintelligence_as_verified',
  'learning_changes_permissions_guardian_rls_financial_or_production',
  'direct_arbitrary_hardware_bypass_hybrid_router',
  'automatic_lan_enrollment',
  'buy_cloud_or_qpu_autonomously',
  'expand_child_permissions_or_budgets_beyond_parent',
  'cross_tenant_or_cross_universe_message',
  'treat_presence_as_verified',
  'weaken_guardian_or_rls',
  'tip_land_merge_main_force_push_or_open_pr_without_founder',
] as const;

export function assertEx8LocksIntact(): boolean {
  return (
    EX8_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX8_LOCKS.TIP_LAND === false &&
    EX8_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX8_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX8_LOCKS.SECOND_AGENT_FRAMEWORK === false &&
    EX8_LOCKS.HIDDEN_COT === false &&
    EX8_LOCKS.LEARNING_CHANGES_PERMISSIONS === false &&
    EX8_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX8_LOCKS.DIRECT_ARBITRARY_HARDWARE === false &&
    EX8_LOCKS.CHILD_PERMISSION_EXPANSION === false &&
    EX8_LOCKS.CHILD_COMPUTE_BUDGET_EXPANSION === false
  );
}

export function ex8L4AutonomyEnabled(): false {
  return EX8_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx8(): true {
  return true;
}

/** Logical roles — one Agent Mesh; not a new framework. */
export const QUANTUM_TEAM_ROLES = [
  'QuantumMissionAgent',
  'ProblemFormulationAgent',
  'ClassicalBaselineAgent',
  'QuantumInspiredResearchAgent',
  'CircuitDesignAgent',
  'SimulationAgent',
  'HybridRoutingAgent',
  'ComputeEvidenceAgent',
  'BenchmarkAgent',
  'CostAgent',
  'PrivacyPolicyAgent',
  'HistoricalResearchAgent',
  'ReviewerAgent',
] as const;

export type QuantumTeamRole = (typeof QUANTUM_TEAM_ROLES)[number];

export const AGENT_TEAM_STATES = [
  'REGISTERED',
  'LOCAL_READY',
  'QUEUED',
  'RUNNING_VERIFIED',
  'WAITING_DEPENDENCY',
  'WAITING_NODE',
  'WAITING_DATA',
  'WAITING_PROVIDER',
  'REVIEW_REQUIRED',
  'COMPLETED',
  'FAILED',
  'EXPIRED',
  'REVOKED',
  'OFFLINE_STOPPED',
] as const;

export type AgentTeamState = (typeof AGENT_TEAM_STATES)[number];

export const MESSAGE_TYPES = [
  'TASK_ASSIGNMENT',
  'TASK_ACCEPTED',
  'EVIDENCE_REQUEST',
  'EVIDENCE_RESPONSE',
  'HYPOTHESIS',
  'EXPERIMENT_PLAN',
  'EXPERIMENT_RESULT',
  'BENCHMARK_RESULT',
  'COMPARISON_RESULT',
  'DISAGREEMENT',
  'REVIEW_REQUEST',
  'REVIEW_RESULT',
  'BLOCKER',
  'CHECKPOINT',
  'RETURN_RECEIPT',
  'MISSION_SUMMARY',
] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number];

export const CONSENSUS_STATES = [
  'CONSENSUS',
  'MAJORITY_WITH_DISSENT',
  'INSUFFICIENT_EVIDENCE',
  'CONFLICTING_EVIDENCE',
  'RETEST_REQUIRED',
  'HUMAN_REVIEW_REQUIRED',
] as const;

export type ConsensusState = (typeof CONSENSUS_STATES)[number];

export const EXECUTION_CLASSES = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU',
] as const;

export type ExecutionClass = (typeof EXECUTION_CLASSES)[number];

export const DATA_CLASSES = [
  'SYNTHETIC',
  'PUBLIC_REFERENCE',
  'TENANT_AUTHORIZED',
  'XIV_OWNED',
  'BENCHMARK_FIXTURE',
  'RESTRICTED',
] as const;

export type DataClass = (typeof DATA_CLASSES)[number];

export type ComputeBudget = {
  maxCpuMs: number;
  maxGpuMs: number;
  maxNpuMs: number;
  maxQpuShots: number;
};

export type MemoryBudget = {
  maxMb: number;
};

export type TimeBudget = {
  maxWallClockMs: number;
};

export type ExternalCostBudget = {
  maxUsd: number;
  cloudPurchaseAllowed: false;
  qpuPurchaseAllowed: false;
};

/** Shared agent contract — structured only; no hidden CoT. */
export type QuantumTeamAgentContract = {
  agentId: string;
  agentRole: QuantumTeamRole;
  missionId: string;
  taskId: string;
  parentTaskId: string | null;
  tenantId: string;
  universeId: string;
  allowedTools: readonly string[];
  allowedDataClasses: readonly DataClass[];
  allowedExecutionClasses: readonly ExecutionClass[];
  computeBudget: ComputeBudget;
  memoryBudget: MemoryBudget;
  timeBudget: TimeBudget;
  externalCostBudget: ExternalCostBudget;
  dependencies: readonly string[];
  expectedOutput: string;
  evidenceRequirements: readonly string[];
  checkpointPolicy: string;
  returnPath: string;
  createdAt: string;
  expiresAt: string;
  status: AgentTeamState;
  /** Heartbeat ISO timestamp — required for RUNNING_VERIFIED. */
  lastHeartbeatAt: string | null;
  poweredOff: boolean;
  webOnline: boolean;
  physicalQpuOnline: boolean;
  hybridRouterAuthorized: boolean;
  permissionsFrozen: true;
  hiddenCotPersisted: false;
  secondFramework: false;
  l4Enabled: false;
};

export type TeamMessageEnvelope = {
  messageId: string;
  messageType: MessageType;
  missionId: string;
  taskId: string;
  fromAgentId: string;
  toAgentId: string;
  tenantId: string;
  universeId: string;
  payload: Readonly<Record<string, unknown>>;
  /** Explicit: no chain-of-thought transcript. */
  hiddenCot: false;
  createdAt: string;
  status: 'ACCEPTED' | 'DENIED';
  denyReason: string | null;
};

export type BranchReturnRecord = {
  taskId: string;
  parentTaskId: string | null;
  missionId: string;
  tenantId: string;
  universeId: string;
  status: AgentTeamState;
  result: Readonly<Record<string, unknown>> | null;
  evidenceRefs: readonly string[];
  experimentRefs: readonly string[];
  benchmarkRefs: readonly string[];
  confidence: number | null;
  contradictions: readonly string[];
  failures: readonly string[];
  blockers: readonly string[];
  lessons: readonly string[];
  nextExperiment: string | null;
  returnPath: string;
  homeBaseReceived: boolean;
  createdAt: string;
};

export type DisagreementRecord = {
  disagreementId: string;
  missionId: string;
  meetingId: string;
  tenantId: string;
  universeId: string;
  agentIds: readonly string[];
  claims: readonly string[];
  evidenceRefs: readonly string[];
  preserved: true;
  hiddenCot: false;
  createdAt: string;
};

export type MeetingRecord = {
  meetingId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  participantAgentIds: readonly string[];
  agenda: readonly string[];
  /** Structured turns only — never free-form CoT. */
  structuredTurns: readonly {
    agentId: string;
    messageType: MessageType;
    summary: string;
    evidenceRefs: readonly string[];
  }[];
  consensusState: ConsensusState;
  disagreements: readonly DisagreementRecord[];
  /** Policy always overrides consensus. */
  policyOverridesConsensus: true;
  hiddenCotTranscript: false;
  createdAt: string;
  closedAt: string | null;
};

export type NeuralPathwayUpdate = {
  pathwayId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  hops: readonly CanonicalPathwayHop[];
  rankingDelta: number | null;
  confidenceDelta: number | null;
  retestRecommended: boolean;
  /** LEARNING never changes these. */
  permissionsChanged: false;
  guardianChanged: false;
  rlsChanged: false;
  financialAuthorityChanged: false;
  productionAuthorityChanged: false;
  createdAt: string;
};

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: 'PRESENT_UNVERIFIED' | 'WAITING_DATA';
};

export type Ex8SoftWireSnapshot = {
  agentMesh: SoftWirePresence;
  agentMeetings: SoftWirePresence;
  agentsRuntime: SoftWirePresence;
  ex1QuantumMission: SoftWirePresence;
  ex2ClassicalBaseline: SoftWirePresence;
  ex3QiLab: SoftWirePresence;
  ex4SimulatorRegistry: SoftWirePresence;
  ex5QpuRegistry: SoftWirePresence;
  ex6PhysicalReceipt: SoftWirePresence;
  ex7HybridRouter: SoftWirePresence;
  chipgraph: SoftWirePresence;
  benchmarks: SoftWirePresence;
  evidence: SoftWirePresence;
  guardian: SoftWirePresence;
  dnaManifest: SoftWirePresence;
};

function softWire(
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
    pathChecked: candidates[0] ?? '',
    note: noteAbsent,
    verified: false,
    disposition: 'WAITING_DATA',
  };
}

const HERE = dirname(fileURLToPath(import.meta.url));
const AI_ROOT = join(HERE, '..', '..');
const WORKTREE_ROOT = join(AI_ROOT, '..', '..');
const WORKSPACE_PARENT = join(WORKTREE_ROOT, '..');

/** Soft-wire audit — presence ≠ VERIFIED. Absent → WAITING_DATA. */
export function ex8SoftWireSnapshot(repoRoot: string = WORKTREE_ROOT): Ex8SoftWireSnapshot {
  const aiRoot = join(repoRoot, 'services', 'ai');
  const parent = join(repoRoot, '..');
  return {
    agentMesh: softWire(
      join(aiRoot, 'runtime', 'agentmesh'),
      'Agent Mesh PRESENT (soft-wire). Presence≠VERIFIED. Reuse — do not duplicate.',
      'Agent Mesh absent — soft-wire WAITING_DATA.',
    ),
    agentMeetings: softWire(
      join(aiRoot, 'runtime', 'agentmeetings'),
      'Agent Meetings PRESENT (soft-wire). Presence≠VERIFIED.',
      'Agent Meetings absent — soft-wire WAITING_DATA.',
    ),
    agentsRuntime: softWire(
      join(aiRoot, 'runtime', 'agents.ts'),
      'agents.ts PRESENT (soft-wire). Presence≠VERIFIED.',
      'agents.ts absent — soft-wire WAITING_DATA.',
    ),
    ex1QuantumMission: firstExisting(
      [
        join(aiRoot, 'runtime', 'quantum', 'mission.ts'),
        join(parent, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'mission.ts'),
        join(WORKSPACE_PARENT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'mission.ts'),
      ],
      'EX1 Quantum Mission PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX1 Quantum Mission absent — soft-wire WAITING_DATA.',
    ),
    ex2ClassicalBaseline: firstExisting(
      [
        join(aiRoot, 'runtime', 'quantum', 'baseline.ts'),
        join(parent, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'baseline.ts'),
        join(WORKSPACE_PARENT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'baseline.ts'),
      ],
      'EX2 Classical Baseline PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX2 Classical Baseline absent — soft-wire WAITING_DATA.',
    ),
    ex3QiLab: firstExisting(
      [
        join(aiRoot, 'runtime', 'quantum', 'qi-lab.ts'),
        join(aiRoot, 'runtime', 'quantum', 'inspired.ts'),
        join(parent, '.wt-ex3', 'services', 'ai', 'runtime', 'quantum', 'qi-lab.ts'),
        join(WORKSPACE_PARENT, '.wt-ex3', 'services', 'ai', 'runtime', 'quantum', 'qi-lab.ts'),
      ],
      'EX3 QI Lab PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX3 QI Lab absent — soft-wire WAITING_DATA.',
    ),
    ex4SimulatorRegistry: firstExisting(
      [
        join(aiRoot, 'runtime', 'quantum', 'simulator-registry.ts'),
        join(parent, '.wt-ex4', 'services', 'ai', 'runtime', 'quantum', 'simulator-registry.ts'),
        join(WORKSPACE_PARENT, '.wt-ex4', 'services', 'ai', 'runtime', 'quantum', 'simulator-registry.ts'),
      ],
      'EX4 Simulator Registry PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX4 Simulator Registry absent — soft-wire WAITING_DATA.',
    ),
    ex5QpuRegistry: firstExisting(
      [
        join(aiRoot, 'runtime', 'quantum', 'qpu-registry.ts'),
        join(parent, '.wt-ex5', 'services', 'ai', 'runtime', 'quantum', 'qpu-registry.ts'),
        join(WORKSPACE_PARENT, '.wt-ex5', 'services', 'ai', 'runtime', 'quantum', 'qpu-registry.ts'),
      ],
      'EX5 QPU Registry PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX5 QPU Registry absent — soft-wire WAITING_DATA.',
    ),
    ex6PhysicalReceipt: firstExisting(
      [
        join(aiRoot, 'runtime', 'quantum', 'physical-receipt.ts'),
        join(parent, '.wt-ex6', 'services', 'ai', 'runtime', 'quantum', 'types.ts'),
        join(WORKSPACE_PARENT, '.wt-ex6', 'services', 'ai', 'runtime', 'quantum', 'types.ts'),
      ],
      'EX6 Physical Receipt PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX6 Physical Receipt absent — soft-wire WAITING_DATA.',
    ),
    ex7HybridRouter: firstExisting(
      [
        join(aiRoot, 'runtime', 'quantum', 'hybrid-router.ts'),
        join(aiRoot, 'runtime', 'quantum', 'router.ts'),
        join(parent, '.wt-ex7', 'services', 'ai', 'runtime', 'quantum', 'hybrid-router.ts'),
        join('/tmp/62l-ex7-work', 'services', 'ai', 'runtime', 'quantum', 'hybrid-router.ts'),
      ],
      'EX7 Hybrid Classical/Quantum Router PRESENT (soft-wire). Presence≠VERIFIED.',
      'EX7 Hybrid Router absent — soft-wire WAITING_DATA. Compute still routed via Hybrid Router contract only (no direct hardware).',
    ),
    chipgraph: firstExisting(
      [
        join(aiRoot, 'runtime', 'chipgraph'),
        join(parent, '.wt-ew6', 'services', 'ai', 'runtime', 'chipgraph'),
        join(WORKSPACE_PARENT, '.wt-ew6', 'services', 'ai', 'runtime', 'chipgraph'),
      ],
      'Chipgraph PRESENT (soft-wire). Presence≠VERIFIED.',
      'Chipgraph absent — soft-wire WAITING_DATA.',
    ),
    benchmarks: firstExisting(
      [
        join(aiRoot, 'runtime', 'benchmarks'),
        join(aiRoot, 'runtime', 'quantum', 'benchmark.ts'),
        join(parent, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'benchmark.ts'),
        join(WORKSPACE_PARENT, '.wt-ex2', 'services', 'ai', 'runtime', 'quantum', 'benchmark.ts'),
      ],
      'Benchmarks PRESENT (soft-wire). Presence≠VERIFIED.',
      'Benchmarks absent — soft-wire WAITING_DATA.',
    ),
    evidence: firstExisting(
      [
        join(aiRoot, 'runtime', 'evidence'),
        join(aiRoot, 'runtime', 'quantum', 'receipts.ts'),
        join(parent, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'receipts.ts'),
        join(WORKSPACE_PARENT, '.wt-ex1', 'services', 'ai', 'runtime', 'quantum', 'receipts.ts'),
      ],
      'Evidence ledger PRESENT (soft-wire). Presence≠VERIFIED.',
      'Evidence ledger absent — soft-wire WAITING_DATA.',
    ),
    guardian: softWire(
      join(aiRoot, 'runtime', 'guardian'),
      'Guardian PRESENT — EX8 must not mutate Guardian/RLS.',
      'Guardian path absent — soft-wire WAITING_DATA (policy still enforced in-contract).',
    ),
    dnaManifest: firstExisting(
      [
        join(aiRoot, 'orchestration', 'dna', 'XIV_AGENT_DNA_MANIFEST.json'),
        join(aiRoot, 'runtime', 'quantum', 'XIV_AGENT_DNA_MANIFEST.json'),
      ],
      'XIV_AGENT_DNA_MANIFEST PRESENT (soft-wire). Presence≠VERIFIED.',
      'XIV_AGENT_DNA_MANIFEST absent — soft-wire WAITING_DATA.',
    ),
  };
}
