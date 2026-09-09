/**
 * 62L-ES32 — Mission Decomposition & Dependency Planner (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory /
 * Agent Team Orchestration → Mission Planning.
 *
 * Break complex missions into bounded work packages so agents know what can
 * run in parallel, what depends on prior evidence, what requires human
 * approval, and when execution should stop.
 *
 * Core flow:
 * Mission → objective → constraints → work packages → dependencies →
 * critical path → agent/team assignment → evidence requirements →
 * execution plan
 *
 * Soft-wire when PRESENT (existsSync): ES31 Dynamic Agent Team Builder,
 * ES30 Agent Reputation / Domain Trust Graph (soft-wire base when ES31
 * absent), ES27 Capability Composition Engine, ES15 deployment plans,
 * ER7 quantum honesty (Historical Science & Engineering Atlas quantum
 * classification locks / related quantum honesty surfaces).
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Planning optimizes sequencing but cannot remove Guardian/RLS checks,
 * widen permissions, create spending authority, or bypass human gates.
 * Next (report only): ES33 — Critical Path & Bottleneck Optimizer.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

/** GitHub SoT not resolved here — do not invent an issue number. */
export const GITHUB_SOT_ISSUE: null = null;
export const GITHUB_SOT_ISSUE_NOTE =
  'GitHub SoT for 62L-ES not resolved in this environment — no issue number invented.' as const;
export const GITHUB_SOT_LABEL = '62L-ES32' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES32 Mission Decomposition & Dependency Planner — mission→packages→deps→critical path→assignment→evidence→plan; HARD/SOFT/HUMAN/DATA gates; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES32_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory' as const;

export const NEXT_PHASE_TITLE =
  'ES33 — Critical Path & Bottleneck Optimizer — optimize schedule risk, missing evidence, overloaded teams, and human-approval bottlenecks without removing Guardian/human controls.' as const;

/**
 * Work package tracking fields (exact set from user story).
 */
export const WORK_PACKAGE_FIELDS = [
  'workPackageId',
  'parentMission',
  'objective',
  'ownerTeam',
  'requiredInputs',
  'requiredDataApiScopes',
  'requiredCertifiedSkills',
  'computeRuntimeNeeds',
  'dependencies',
  'blockers',
  'expectedOutput',
  'acceptanceCriteria',
  'evidenceRequirements',
  'costRuntimeBudget',
  'deadlineExpiry',
  'stopConditions',
  'escalationPath',
  'returnPath',
] as const;

export type WorkPackageField = (typeof WORK_PACKAGE_FIELDS)[number];

/**
 * Required work-package states (exact).
 */
export const WORK_PACKAGE_STATES = [
  'PLANNED',
  'READY',
  'WAITING_DEPENDENCY',
  'RUNNING_VERIFIED',
  'BLOCKED',
  'REVIEW_REQUIRED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const;

export type WorkPackageState = (typeof WORK_PACKAGE_STATES)[number];

/**
 * Dependency kinds (exact).
 */
export const DEPENDENCY_KINDS = [
  'HARD_DEPENDENCY',
  'SOFT_DEPENDENCY',
  'HUMAN_GATE',
  'DATA_GATE',
] as const;

export type DependencyKind = (typeof DEPENDENCY_KINDS)[number];

/**
 * Core planning flow (exact order).
 */
export const MISSION_DECOMPOSITION_CORE_FLOW = [
  'mission',
  'objective',
  'constraints',
  'work_packages',
  'dependencies',
  'critical_path',
  'agent_team_assignment',
  'evidence_requirements',
  'execution_plan',
] as const;

export type MissionDecompositionCoreFlowHop =
  (typeof MISSION_DECOMPOSITION_CORE_FLOW)[number];

export const MISSION_DECOMPOSITION_PLANNER_CYCLE = [
  'intake_mission',
  'decompose_packages',
  'wire_dependencies',
  'compute_critical_path',
  'bound_parallelism',
  'assign_teams',
  'encode_evidence_and_stops',
  'emit_execution_plan',
  'soft_wire_prior_phases',
] as const;

export type MissionDecompositionCycleHop =
  (typeof MISSION_DECOMPOSITION_PLANNER_CYCLE)[number];

/**
 * Stop conditions (exact themes from user story).
 */
export const STOP_CONDITION_KINDS = [
  'REQUIRED_DATA_RIGHTS_FAIL',
  'CRITICAL_PREREQUISITE_FAILS',
  'COST_BUDGET_EXHAUSTED',
  'EVIDENCE_DISPROVES_HYPOTHESIS',
  'SECURITY_POLICY_BOUNDARY_CANNOT_BE_PRESERVED',
  'HUMAN_REVIEWER_REJECTS_CONTINUATION',
] as const;

export type StopConditionKind = (typeof STOP_CONDITION_KINDS)[number];

/**
 * Critical-path intelligence signals.
 */
export const CRITICAL_PATH_SIGNALS = [
  'longest_dependency_path',
  'schedule_risk_tasks',
  'missing_evidence',
  'overloaded_teams',
  'api_runtime_blockers',
  'human_approval_bottlenecks',
] as const;

export type CriticalPathSignal = (typeof CRITICAL_PATH_SIGNALS)[number];

/**
 * Evidence / soft-wire hop states.
 */
export const ES32_EVIDENCE_STATES = [
  'PASS',
  'FAIL',
  'WAITING_DATA',
  'WAITING_DEPENDENCY',
  'BLOCKED',
  'DENIED',
  'REJECTED',
  'UNAVAILABLE',
] as const;

export type Es32EvidenceState = (typeof ES32_EVIDENCE_STATES)[number];

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es32SoftWireSnapshot = {
  es31DynamicAgentTeamBuilder: SoftWirePresence;
  es31Report: SoftWirePresence;
  es30AgentReputationTrustGraph: SoftWirePresence;
  es30Report: SoftWirePresence;
  es27CapabilityComposition: SoftWirePresence;
  es27Report: SoftWirePresence;
  es15DeploymentPlans: SoftWirePresence;
  es15Report: SoftWirePresence;
  er7QuantumHonesty: SoftWirePresence;
  er7Report: SoftWirePresence;
};

export type Es32ActorKind =
  | 'mission_decomposition_planner'
  | 'mission_owner'
  | 'team_lead'
  | 'work_package_owner'
  | 'human_approver'
  | 'founder'
  | 'tenant_admin'
  | 'guardian'
  | 'compliance_reviewer';

export type Es32Actor = {
  kind: Es32ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export type DependencyEdge = {
  fromWorkPackageId: string;
  toWorkPackageId: string;
  kind: DependencyKind;
  note?: string;
};

export type CostRuntimeBudget = {
  costUnits: number;
  runtimeMinutes: number;
  currencyNote?: string;
};

export type WorkPackage = {
  workPackageId: string;
  parentMission: string;
  objective: string;
  ownerTeam: string;
  requiredInputs: readonly string[];
  requiredDataApiScopes: readonly string[];
  requiredCertifiedSkills: readonly string[];
  computeRuntimeNeeds: readonly string[];
  dependencies: readonly DependencyEdge[];
  blockers: readonly string[];
  expectedOutput: string;
  acceptanceCriteria: readonly string[];
  evidenceRequirements: readonly string[];
  costRuntimeBudget: CostRuntimeBudget;
  deadlineExpiry?: string;
  stopConditions: readonly StopConditionKind[];
  escalationPath: string;
  returnPath: string;
  state: WorkPackageState;
  /** Soft deps may begin with assumptions; must reconcile later. */
  assumptions?: readonly string[];
  scheduleRisk?: boolean;
  missingEvidence?: readonly string[];
};

export type MissionConstraints = {
  maxParallelWorkPackages: number;
  costBudgetUnits: number;
  runtimeBudgetMinutes: number;
  requireHumanGateBeforeExternalSubmission: boolean;
  preserveGuardianRls: true;
  preserveTenantUniverseIsolation: true;
  allowPermissionWidening: false;
  allowSpendingAuthorityCreation: false;
  allowHumanGateBypass: false;
};

export type MissionIntake = {
  missionId: string;
  title: string;
  objective: string;
  constraints: MissionConstraints;
  industryContext?: string;
  notes?: string;
};

export type CriticalPathResult = {
  pathWorkPackageIds: readonly string[];
  length: number;
  scheduleRiskWorkPackageIds: readonly string[];
  missingEvidenceWorkPackageIds: readonly string[];
  overloadedTeamIds: readonly string[];
  apiRuntimeBlockers: readonly string[];
  humanApprovalBottlenecks: readonly string[];
  signals: readonly CriticalPathSignal[];
};

export type ParallelismAssessment = {
  proposedParallelGroups: readonly (readonly string[])[];
  independentEnough: boolean;
  overParallelWasteFlag: boolean;
  wasteReason?: string;
  maxParallelAllowed: number;
};

export type ExecutionPlan = {
  planId: string;
  missionId: string;
  objective: string;
  workPackages: readonly WorkPackage[];
  dependencyEdges: readonly DependencyEdge[];
  criticalPath: CriticalPathResult;
  parallelism: ParallelismAssessment;
  stopConditions: readonly StopConditionKind[];
  agentTeamAssignments: readonly {
    workPackageId: string;
    ownerTeam: string;
    requiredCertifiedSkills: readonly string[];
  }[];
  evidenceRequirements: readonly string[];
  l4AutonomyEnabled: false;
  guardianRlsIntact: true;
  permissionWideningAuthorized: false;
  spendingAuthorityCreated: false;
  humanGatesBypassed: false;
  tipLand: false;
  productionAuthorized: false;
  planState: 'PLANNED' | 'READY' | 'BLOCKED' | 'REVIEW_REQUIRED';
};

export type Es32HopRecord = {
  hop: MissionDecompositionCycleHop;
  state: Es32EvidenceState;
  summary: string;
  at: string;
};

export const ES32_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  REMOVE_GUARDIAN_RLS_CHECKS: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
  WIDEN_PERMISSIONS: false as const,
  CREATE_SPENDING_AUTHORITY: false as const,
  BYPASS_HUMAN_GATES: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_MISSION_PLANNER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  PLANNING_CANNOT_REMOVE_CONTROLS: true as const,
} as const;

export const ES32_AGENT_BOUNDS = {
  mayOptimizeSequencing: true,
  mayFlagOverParallelWaste: true,
  mayComputeCriticalPath: true,
  mayRemoveGuardianChecks: false,
  mayWidenPermissions: false,
  mayCreateSpendingAuthority: false,
  mayBypassHumanGates: false,
  mayTipLand: false,
  mayManagePullRequest: false,
  mayAuthorizeProduction: false,
} as const;

export const ES32_MAY = [
  'decompose_mission_into_bounded_work_packages',
  'encode_hard_soft_human_data_dependencies',
  'compute_longest_dependency_critical_path',
  'flag_schedule_risk_missing_evidence_overloaded_teams',
  'bound_parallelism_to_truly_independent_packages',
  'assign_owner_teams_and_certified_skill_requirements',
  'encode_stop_conditions_and_escalation_return_paths',
  'soft_wire_es31_es30_es27_es15_er7_when_present',
] as const;

export const ES32_MUST_NOT = [
  'remove_guardian_rls_checks',
  'widen_permissions',
  'create_spending_authority',
  'bypass_human_gates',
  'tip_land_onto_xiv_v2_or_main',
  'open_manage_pull_request_unless_founder_asks',
  'claim_production_authorization',
  'treat_presence_as_verified',
  'fail_soft_wire_when_prior_phase_absent',
  'finalize_pricing_before_technical_scope_known_as_hard_ready',
  'over_parallelize_into_duplicated_or_contradictory_work',
] as const;

export const MISSION_PLANNER_TRUTH_BOUNDARY = {
  planningOptimizesSequencingOnly: true,
  cannotRemoveGuardianRls: true,
  cannotWidenPermissions: true,
  cannotCreateSpendingAuthority: true,
  cannotBypassHumanGates: true,
  presenceNotVerified: true,
  absentSoftWireIsWaitingDataNotFail: true,
  l4AutonomyEnabled: false,
  mayTipLand: false,
  mayManagePullRequest: false,
  pricingMustNotFinalizeBeforeScopeSufficientlyKnown: true,
  parallelismOnlyWhenTrulyIndependent: true,
} as const;

/** Default max parallel packages before waste flag (bounded intelligence). */
export const DEFAULT_MAX_PARALLEL_WORK_PACKAGES = 4 as const;

export function assertEs32LocksIntact(): boolean {
  return (
    ES32_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES32_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ES32_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ES32_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ES32_LOCKS.REMOVE_GUARDIAN_RLS_CHECKS === false &&
    ES32_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ES32_LOCKS.WIDEN_PERMISSIONS === false &&
    ES32_LOCKS.CREATE_SPENDING_AUTHORITY === false &&
    ES32_LOCKS.BYPASS_HUMAN_GATES === false &&
    ES32_LOCKS.TIP_LAND === false &&
    ES32_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ES32_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ES32_LOCKS.FULL_PRODUCTION_MISSION_PLANNER_SHIPPED === false &&
    ES32_LOCKS.MANAGE_PULL_REQUEST === false &&
    ES32_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ES32_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ES32_LOCKS.PLANNING_CANNOT_REMOVE_CONTROLS === true &&
    MISSION_PLANNER_TRUTH_BOUNDARY.l4AutonomyEnabled === false &&
    MISSION_PLANNER_TRUTH_BOUNDARY.cannotRemoveGuardianRls === true &&
    MISSION_PLANNER_TRUTH_BOUNDARY.pricingMustNotFinalizeBeforeScopeSufficientlyKnown ===
      true &&
    MISSION_PLANNER_TRUTH_BOUNDARY.parallelismOnlyWhenTrulyIndependent === true
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

function softWireFirstPresent(
  candidates: readonly SoftWirePresence[],
): SoftWirePresence {
  for (const c of candidates) {
    if (c.present) return c;
  }
  return candidates[candidates.length - 1]!;
}

export function es32SoftWireSnapshot(repoRoot?: string): Es32SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    es31DynamicAgentTeamBuilder: softWireFirstPresent([
      softWireFile(
        './dynamic-agent-team-builder-types.ts',
        'ES31 Dynamic Agent Team Builder PRESENT (soft-wire).',
        'ES31 Dynamic Agent Team Builder absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './dynamic-agent-team-builder.ts',
        'ES31 Dynamic Agent Team Builder facade PRESENT (soft-wire).',
        'ES31 Dynamic Agent Team Builder facade absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es31Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES31_DYNAMIC_AGENT_TEAM_BUILDER_REPORT.md',
        'ES31 Dynamic Agent Team Builder report PRESENT.',
        'ES31 Dynamic Agent Team Builder report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es30AgentReputationTrustGraph: softWireFirstPresent([
      softWireFile(
        './agent-reputation-domain-trust-graph-types.ts',
        'ES30 Agent Reputation / Domain Trust Graph PRESENT (soft-wire).',
        'ES30 Agent Reputation / Domain Trust Graph absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-reputation-domain-trust-graph.ts',
        'ES30 Agent Reputation facade PRESENT (soft-wire).',
        'ES30 Agent Reputation facade absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es30Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES30_AGENT_REPUTATION_DOMAIN_TRUST_GRAPH_REPORT.md',
        'ES30 Agent Reputation report PRESENT.',
        'ES30 Agent Reputation report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es27CapabilityComposition: softWireFirstPresent([
      softWireFile(
        './capability-composition-engine-types.ts',
        'ES27 Capability Composition Engine PRESENT (soft-wire).',
        'ES27 Capability Composition Engine absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './capability-composition-engine.ts',
        'ES27 Capability Composition Engine facade PRESENT (soft-wire).',
        'ES27 Capability Composition Engine facade absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es27Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES27_CAPABILITY_COMPOSITION_ENGINE_REPORT.md',
        'ES27 Capability Composition Engine report PRESENT.',
        'ES27 Capability Composition Engine report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es15DeploymentPlans: softWireFirstPresent([
      softWireFile(
        './deployment-plan-types.ts',
        'ES15 deployment plans PRESENT (soft-wire).',
        'ES15 deployment plans absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './service-deployment-plan-types.ts',
        'ES15 service deployment plans PRESENT (soft-wire).',
        'ES15 service deployment plans absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './deployment-plans-types.ts',
        'ES15 deployment-plans types PRESENT (soft-wire).',
        'ES15 deployment-plans types absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './release-deployment-plan-types.ts',
        'ES15 release deployment plans PRESENT (soft-wire).',
        'ES15 release deployment plans absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es15Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES15_DEPLOYMENT_PLAN_REPORT.md',
        'ES15 deployment plan report PRESENT.',
        'ES15 deployment plan report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES15_SERVICE_DEPLOYMENT_PLAN_REPORT.md',
        'ES15 service deployment plan report PRESENT.',
        'ES15 service deployment plan report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    er7QuantumHonesty: softWireFirstPresent([
      softWireFile(
        './historical-science-engineering-atlas-types.ts',
        'ER7 quantum honesty (Historical S&E Atlas quantum classification locks) PRESENT (soft-wire).',
        'ER7 quantum honesty atlas absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './quantum-inspired-compute-lab-types.ts',
        'ER7-adjacent quantum honesty surface (quantum-inspired compute lab) PRESENT (soft-wire).',
        'ER7-adjacent quantum honesty surface absent — soft-wire WAITING_DATA.',
      ),
    ]),
    er7Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ER7_HISTORICAL_SCIENCE_ENGINEERING_ATLAS_REPORT.md',
        'ER7 Historical Science & Engineering Atlas report PRESENT.',
        'ER7 Historical Science & Engineering Atlas report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_EP18_QUANTUM_INSPIRED_COMPUTE_LAB_REPORT.md',
        'Quantum-inspired compute lab report PRESENT (honesty-adjacent).',
        'Quantum-inspired compute lab report absent — soft-wire WAITING_DATA.',
      ),
    ]),
  };
}

export function softWireHopState(present: boolean): Es32EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isHumanApprover(actor: Es32Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.kind === 'compliance_reviewer'
  );
}

export function isEs32Planner(actor: Es32Actor): boolean {
  return (
    actor.kind === 'mission_decomposition_planner' ||
    actor.kind === 'mission_owner' ||
    actor.kind === 'team_lead' ||
    actor.kind === 'work_package_owner'
  );
}

/**
 * HARD: cannot begin until predecessor COMPLETED (passed).
 * SOFT: may begin with assumptions; must reconcile later.
 * HUMAN_GATE: pauses until explicit authorization.
 * DATA_GATE: waits for lawful/authorized evidence.
 */
export function initialStateForDependency(
  kind: DependencyKind,
  predecessorPassed: boolean,
  humanAuthorized: boolean,
  dataAuthorized: boolean,
): WorkPackageState {
  switch (kind) {
    case 'HARD_DEPENDENCY':
      return predecessorPassed ? 'READY' : 'WAITING_DEPENDENCY';
    case 'SOFT_DEPENDENCY':
      return predecessorPassed ? 'READY' : 'READY';
    case 'HUMAN_GATE':
      return humanAuthorized ? 'READY' : 'REVIEW_REQUIRED';
    case 'DATA_GATE':
      return dataAuthorized ? 'READY' : 'WAITING_DEPENDENCY';
    default: {
      const _exhaustive: never = kind;
      void _exhaustive;
      return 'BLOCKED';
    }
  }
}

export function dependencyBlocksStart(
  kind: DependencyKind,
  predecessorPassed: boolean,
  humanAuthorized: boolean,
  dataAuthorized: boolean,
): boolean {
  switch (kind) {
    case 'HARD_DEPENDENCY':
      return !predecessorPassed;
    case 'SOFT_DEPENDENCY':
      return false;
    case 'HUMAN_GATE':
      return !humanAuthorized;
    case 'DATA_GATE':
      return !dataAuthorized;
    default: {
      const _exhaustive: never = kind;
      void _exhaustive;
      return true;
    }
  }
}
