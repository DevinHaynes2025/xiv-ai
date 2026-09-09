/**
 * 62L-EP12 — Hardware-Neutral Scheduler (park-and-implement).
 *
 * Hardware-neutral scheduler so every compute task can be routed to the best
 * eligible device without hard-coding a vendor.
 *
 * Core: Task Envelope → Policy Gate → Eligible Nodes → Capability Match →
 * Resource Check → Route Score → Execute → Compute Receipt → XIV Home Base
 *
 * Score (classical/explainable):
 * routeScore = compatibility + privacy + reliability + performance
 *            - cost - resourcePressure - networkRisk
 *
 * Soft-wire when PRESENT: EP11 (WAITING_DATA if absent), EP10, EP6, EP5, EP1,
 * EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family (authoritative per founder). GitLab mirror:
 * not resolved (needsAuth; no issue number invented).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. No autonomous provisioning / cloud purchasing.
 * Privacy/security cannot be traded for performance. DB candidates NOT_APPLIED.
 * tip-land=NO. Next (report only): EP13 — Runtime Return Receipt.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP12' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP12 Hardware-Neutral Scheduler — score eligible verified compute paths and choose best device by privacy/compatibility/latency/cost/reliability/energy/resource pressure without vendor hard-coding' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP12_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP13 — Runtime Return Receipt — record exactly which device/runtime/model actually handled each task and feed that verified outcome back into Home Base.' as const;

export const SCHEDULER_CORE_FLOW = [
  'task_envelope',
  'policy_gate',
  'eligible_nodes',
  'capability_match',
  'resource_check',
  'route_score',
  'execute',
  'compute_receipt',
  'xiv_home_base',
] as const;

export type SchedulerCoreFlowHop = (typeof SCHEDULER_CORE_FLOW)[number];

/**
 * Score dimensions.
 */
export const SCHEDULER_SCORE_DIMENSIONS = [
  'verificationState',
  'modelRuntimeCompatibility',
  'tenantUniversePolicy',
  'privacyLocality',
  'availableMemory',
  'queueDepth',
  'currentLoad',
  'measuredLatency',
  'throughputHistory',
  'reliability',
  'energyProxy',
  'costProxy',
  'networkDependency',
  'dataEgressRequirement',
  'fallbackQuality',
  'benchmarkFreshness',
] as const;

export type SchedulerScoreDimension =
  (typeof SCHEDULER_SCORE_DIMENSIONS)[number];

/**
 * Classical explainable score components.
 */
export const ROUTE_SCORE_COMPONENTS = [
  'compatibility',
  'privacy',
  'reliability',
  'performance',
  'cost',
  'resourcePressure',
  'networkRisk',
] as const;

export type RouteScoreComponent = (typeof ROUTE_SCORE_COMPONENTS)[number];

/**
 * Suggested route states.
 */
export const ROUTE_STATES = [
  'ELIGIBLE',
  'PREFERRED',
  'DEGRADED',
  'THROTTLED',
  'NOT_ELIGIBLE',
  'STALE',
  'WAITING_NODE',
  'UNAVAILABLE',
] as const;

export type RouteState = (typeof ROUTE_STATES)[number];

export const DEVICE_VERIFICATION_STATES = [
  'UNKNOWN',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'UNAVAILABLE',
] as const;

export type DeviceVerificationState =
  (typeof DEVICE_VERIFICATION_STATES)[number];

export const PRIVACY_MODES = [
  'LOCAL_ONLY',
  'EDGE_ALLOWED',
  'CLOUD_AUTHORIZED',
] as const;

export type PrivacyMode = (typeof PRIVACY_MODES)[number];

export const DEVICE_CLASSES = [
  'cpu',
  'gpu',
  'npu',
  'edge_gpu',
  'cloud_gpu',
  'accelerator',
  'qpu_path',
] as const;

export type DeviceClass = (typeof DEVICE_CLASSES)[number];

/**
 * Learning loop fields after every task.
 */
export const LEARNING_LOOP_FIELDS = [
  'plannedRoute',
  'actualRoute',
  'latency',
  'costResourceEvidence',
  'successFailure',
] as const;

/**
 * Quantum scheduling competitors (future) — classical-baseline gate required.
 */
export const QUANTUM_SCHEDULING_COMPETITORS = [
  'deterministic_scoring',
  'greedy_allocation',
  'priority_queues',
  'linear_integer_optimization',
  'constraint_programming',
] as const;

export const HARDWARE_NEUTRAL_SCHEDULER_CYCLE = [
  'honesty_locks',
  'hardware_neutral_scheduler_bootstrap',
  // A — Structure
  'core_flow_encoded',
  'score_dimensions_encoded',
  'route_score_components_encoded',
  'route_states_encoded',
  'privacy_modes_encoded',
  'learning_loop_encoded',
  'quantum_competitors_encoded',
  // B — Routing rules
  'not_tested_cannot_satisfy_verified',
  'stale_heartbeat_unavailable',
  'silent_fallback_recorded',
  'privacy_not_traded_for_performance',
  'local_only_cannot_leave_device',
  'cost_ceilings_hard_constraints',
  'agents_cannot_increase_budgets',
  'no_safe_route_returns_unavailable',
  'weights_configurable_by_org_mission',
  // C — Learning / quantum
  'learning_loop_feeds_benchmark_memory',
  'scheduler_cannot_self_expand_permissions',
  'quantum_requires_classical_baseline_gate',
  // D — Safety
  'no_autonomous_provisioning',
  'no_autonomous_cloud_purchasing',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'ep11_soft_wire',
  'ep10_soft_wire',
  'ep6_soft_wire',
  'ep5_soft_wire',
  'ep1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep12Hop = (typeof HARDWARE_NEUTRAL_SCHEDULER_CYCLE)[number];

export type Ep12EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'ELIGIBLE'
  | 'PREFERRED'
  | 'DEGRADED'
  | 'THROTTLED'
  | 'STALE'
  | 'WAITING_NODE'
  | 'UNKNOWN';

export type Ep12HopRecord = {
  hop: Ep12Hop;
  state: Ep12EvidenceState;
  summary: string;
  at: string;
};

export type Ep12ActorKind =
  | 'scheduler'
  | 'policy_gate'
  | 'virtual_chip_registry'
  | 'benchmark_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep12Actor = {
  kind: Ep12ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP12_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_SCHEDULER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Routing honesty
  NOT_TESTED_SATISFIES_VERIFIED: false as const,
  STALE_HEARTBEAT_EQ_AVAILABLE: false as const,
  SILENT_FALLBACK_UNRECORDED: false as const,
  PRIVACY_TRADED_FOR_PERFORMANCE: false as const,
  LOCAL_ONLY_SILENT_CLOUD: false as const,
  COST_CEILING_SOFT: false as const,
  AGENT_BUDGET_INCREASE_VIA_SCHEDULER: false as const,
  FORCE_EXECUTE_WITHOUT_SAFE_ROUTE: false as const,

  // Autonomy
  AUTONOMOUS_PROVISIONING: false as const,
  AUTONOMOUS_CLOUD_PURCHASING: false as const,
  SCHEDULER_SELF_EXPANDS_PERMISSIONS: false as const,
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_PROVISION: false as const,

  // Quantum
  QUANTUM_WITHOUT_CLASSICAL_BASELINE: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const SCHEDULER_AGENT_BOUNDS = Object.freeze({
  mayScoreEligibleRoutes: true as const,
  mayReturnUnavailableWhenNoSafeRoute: true as const,
  mayFeedLearningLoopToBenchmarkMemory: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayTradePrivacyForPerformance: false as const,
  mayIncreaseAgentBudgets: false as const,
  mayAutonomousProvision: false as const,
  mayAutonomousCloudPurchase: false as const,
  maySelfExpandPermissions: false as const,
  mayRecommendOnly: true as const,
});

export const EP12_MAY = Object.freeze([
  'score_eligible_verified_paths',
  'apply_org_mission_configurable_weights',
  'prefer_verified_local_paths_for_local_only',
  'record_silent_accelerator_fallback',
  'return_unavailable_when_no_safe_route',
  'feed_learning_loop_to_benchmark_memory',
  'require_classical_baseline_for_quantum_claims',
  'return_scheduler_evidence_to_home_base',
] as const);

export const EP12_MUST_NOT = Object.freeze([
  'let_not_tested_win_verified_route',
  'schedule_on_stale_heartbeat',
  'omit_silent_fallback_from_receipt',
  'trade_privacy_or_security_for_performance',
  'move_local_only_to_cloud_for_speed',
  'soften_cost_ceilings',
  'increase_agent_budgets_via_scheduling',
  'force_execute_without_safe_route',
  'autonomous_provision_or_cloud_purchase',
  'self_expand_scheduler_permissions',
  'claim_quantum_improvement_without_classical_baseline',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

/** Default classical weights (org/mission configurable). */
export const DEFAULT_ROUTE_WEIGHTS = Object.freeze({
  compatibility: 1,
  privacy: 1,
  reliability: 1,
  performance: 1,
  cost: 1,
  resourcePressure: 1,
  networkRisk: 1,
} as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep12SoftWireSnapshot = {
  ep11TaskEnvelope: SoftWirePresence;
  ep11Report: SoftWirePresence;
  ep10OtherAcceleratorRegistry: SoftWirePresence;
  ep10Report: SoftWirePresence;
  ep6HardwareTruthProbe: SoftWirePresence;
  ep6Report: SoftWirePresence;
  ep5BenchmarkMemory: SoftWirePresence;
  ep5Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp12LocksIntact(): boolean {
  return (
    EP12_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP12_LOCKS.NOT_TESTED_SATISFIES_VERIFIED === false &&
    EP12_LOCKS.STALE_HEARTBEAT_EQ_AVAILABLE === false &&
    EP12_LOCKS.SILENT_FALLBACK_UNRECORDED === false &&
    EP12_LOCKS.PRIVACY_TRADED_FOR_PERFORMANCE === false &&
    EP12_LOCKS.LOCAL_ONLY_SILENT_CLOUD === false &&
    EP12_LOCKS.COST_CEILING_SOFT === false &&
    EP12_LOCKS.AGENT_BUDGET_INCREASE_VIA_SCHEDULER === false &&
    EP12_LOCKS.FORCE_EXECUTE_WITHOUT_SAFE_ROUTE === false &&
    EP12_LOCKS.AUTONOMOUS_PROVISIONING === false &&
    EP12_LOCKS.AUTONOMOUS_CLOUD_PURCHASING === false &&
    EP12_LOCKS.SCHEDULER_SELF_EXPANDS_PERMISSIONS === false &&
    EP12_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE === false &&
    EP12_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP12_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP12_LOCKS.RECOMMEND_EQ_PROVISION === false &&
    EP12_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP12_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP12_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EP12_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP12_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP12_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP12_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP12_LOCKS.TIP_LAND === false &&
    EP12_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP12_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP12_LOCKS.FULL_PRODUCTION_SCHEDULER_SHIPPED === false &&
    EP12_LOCKS.MANAGE_PULL_REQUEST === false &&
    SCHEDULER_AGENT_BOUNDS.automaticAuthority === false &&
    SCHEDULER_AGENT_BOUNDS.mayTradePrivacyForPerformance === false &&
    SCHEDULER_AGENT_BOUNDS.mayIncreaseAgentBudgets === false &&
    SCHEDULER_AGENT_BOUNDS.mayAutonomousProvision === false &&
    SCHEDULER_AGENT_BOUNDS.mayAutonomousCloudPurchase === false &&
    SCHEDULER_AGENT_BOUNDS.maySelfExpandPermissions === false
  );
}

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relFromLocalBrain,
  );
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireRepoRelative(
  repoRoot: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(repoRoot, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

export function ep12SoftWireSnapshot(repoRoot?: string): Ep12SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep11TaskEnvelope: softWireFile(
      './virtual-instruction-task-envelope-types.ts',
      'EP11 Virtual Instruction / Task Envelope PRESENT (soft-wire).',
      'EP11 Virtual Instruction / Task Envelope absent — soft-wire WAITING_DATA.',
    ),
    ep11Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP11_VIRTUAL_INSTRUCTION_TASK_ENVELOPE_REPORT.md',
      'EP11 report PRESENT.',
      'EP11 report absent — soft-wire WAITING_DATA.',
    ),
    ep10OtherAcceleratorRegistry: softWireFile(
      './other-accelerator-registry-types.ts',
      'EP10 Other Accelerator Registry PRESENT (soft-wire).',
      'EP10 Other Accelerator Registry absent — soft-wire WAITING_DATA.',
    ),
    ep10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP10_OTHER_ACCELERATOR_REGISTRY_REPORT.md',
      'EP10 report PRESENT.',
      'EP10 report absent — soft-wire WAITING_DATA.',
    ),
    ep6HardwareTruthProbe: softWireFile(
      './local-hardware-truth-probe-types.ts',
      'EP6 Local Hardware Truth Probe v2 PRESENT (soft-wire).',
      'EP6 Local Hardware Truth Probe v2 absent — soft-wire WAITING_DATA.',
    ),
    ep6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP6_LOCAL_HARDWARE_TRUTH_PROBE_V2_REPORT.md',
      'EP6 report PRESENT.',
      'EP6 report absent — soft-wire WAITING_DATA.',
    ),
    ep5BenchmarkMemory: softWireFile(
      './public-benchmark-memory-types.ts',
      'EP5 Public Benchmark Memory PRESENT (soft-wire).',
      'EP5 Public Benchmark Memory absent — soft-wire WAITING_DATA.',
    ),
    ep5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP5_PUBLIC_BENCHMARK_MEMORY_REPORT.md',
      'EP5 report PRESENT.',
      'EP5 report absent — soft-wire WAITING_DATA.',
    ),
    ep1VirtualChipContract: softWireFile(
      './virtual-chip-contract-types.ts',
      'EP1 Virtual Chip Contract PRESENT (soft-wire).',
      'EP1 Virtual Chip Contract absent — soft-wire WAITING_DATA.',
    ),
    ep1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP1_VIRTUAL_CHIP_CONTRACT_REPORT.md',
      'EP1 report PRESENT.',
      'EP1 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Ep12Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isSchedulerAgent(actor: Ep12Actor): boolean {
  const agents: readonly Ep12ActorKind[] = [
    'scheduler',
    'policy_gate',
    'virtual_chip_registry',
    'benchmark_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export type RouteWeights = {
  compatibility: number;
  privacy: number;
  reliability: number;
  performance: number;
  cost: number;
  resourcePressure: number;
  networkRisk: number;
};

/**
 * Classical explainable score.
 * routeScore = compatibility + privacy + reliability + performance
 *            - cost - resourcePressure - networkRisk
 */
export function computeRouteScore(
  components: {
    compatibility: number;
    privacy: number;
    reliability: number;
    performance: number;
    cost: number;
    resourcePressure: number;
    networkRisk: number;
  },
  weights: RouteWeights = DEFAULT_ROUTE_WEIGHTS,
): number {
  return (
    weights.compatibility * components.compatibility +
    weights.privacy * components.privacy +
    weights.reliability * components.reliability +
    weights.performance * components.performance -
    weights.cost * components.cost -
    weights.resourcePressure * components.resourcePressure -
    weights.networkRisk * components.networkRisk
  );
}
