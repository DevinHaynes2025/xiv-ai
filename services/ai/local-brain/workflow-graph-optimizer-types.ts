/**
 * 62L-ES28 — Workflow Graph Optimizer (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory /
 * Capability Composition → Graph Optimization.
 *
 * Composed agent workflows are optimized for latency, cost, duplication,
 * reliability, and evidence quality without weakening permissions or
 * approval requirements.
 *
 * Core flow:
 * Existing workflow → baseline metrics → optimization candidates →
 * sandbox comparison → evaluator review → improved workflow candidate
 *
 * Soft-wire when PRESENT (existsSync): ES27 Capability Composition,
 * ES26 Marketplace, ES23 experiments, ES9 regression gate, ER7 quantum /
 * historical atlas, EP18 quantum-inspired lab. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * May remove wasted work; cannot remove mandatory Guardian/policy,
 * tenant/Universe, approval gates, evidence/provenance, security review,
 * or human authorization for consequential actions.
 * Quantum-inspired scheduling must beat/justify classical graph/OR baselines;
 * soft-wire ER7; label QUANTUM_INSPIRED / SIMULATED honestly.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR / ManagePullRequest.
 * No self-deploy to production, permission expansion, budget increase,
 * or review bypass.
 * Next (report only): ES29 — Multi-Agent Reliability & Consensus Engine.
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
export const GITHUB_SOT_LABEL = '62L-ES28' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES28 Workflow Graph Optimizer — baseline→candidate sandbox compare; preserve mandatory Guardian/approvals; result classifications; quantum-inspired needs classical OR baseline; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES28_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory / Capability Composition → Graph Optimization' as const;

export const NEXT_PHASE_TITLE =
  'ES29 — Multi-Agent Reliability & Consensus Engine — strengthen multi-agent agreement, failover, and evidence consensus without expanding autonomy or weakening approval gates.' as const;

/**
 * Core optimization flow (exact order from user story).
 */
export const WORKFLOW_GRAPH_OPTIMIZER_CORE_FLOW = [
  'existing_workflow',
  'baseline_metrics',
  'optimization_candidates',
  'sandbox_comparison',
  'evaluator_review',
  'improved_workflow_candidate',
] as const;

export type WorkflowGraphOptimizerCoreFlowHop =
  (typeof WORKFLOW_GRAPH_OPTIMIZER_CORE_FLOW)[number];

/**
 * Evaluation dimensions (exact set from user story).
 */
export const OPTIMIZATION_EVALUATE_DIMENSIONS = [
  'task_ordering',
  'parallel_vs_sequential',
  'duplicate_research_removal',
  'model_provider_selection',
  'cpu_gpu_npu_routing',
  'cache_index_reuse',
  'retry_policy',
  'batching',
  'agent_count',
  'handoff_frequency',
  'evidence_quality',
  'approval_checkpoints',
  'total_cost',
  'total_latency',
] as const;

export type OptimizationEvaluateDimension =
  (typeof OPTIMIZATION_EVALUATE_DIMENSIONS)[number];

/**
 * Optimization run tracking fields (exact set from user story).
 */
export const OPTIMIZATION_TRACKING_FIELDS = [
  'optimizationId',
  'compositionId',
  'baselineWorkflowVersion',
  'candidateWorkflowVersion',
  'changedNodesEdges',
  'expectedBenefit',
  'actualMeasuredBenefit',
  'costDifference',
  'latencyDifference',
  'reliabilityDifference',
  'evidenceQualityDifference',
  'regressionState',
  'testRefs',
  'reviewer',
  'rollbackVersion',
] as const;

export type OptimizationTrackingField =
  (typeof OPTIMIZATION_TRACKING_FIELDS)[number];

/**
 * Required result states (exact set from user story).
 */
export const OPTIMIZATION_RESULT_STATES = [
  'NO_ADVANTAGE',
  'LOWER_LATENCY',
  'LOWER_COST',
  'BETTER_RELIABILITY',
  'BETTER_EVIDENCE',
  'BETTER_MULTI_OBJECTIVE_TRADEOFF',
  'REGRESSED',
  'REJECTED',
] as const;

export type OptimizationResultState =
  (typeof OPTIMIZATION_RESULT_STATES)[number];

/**
 * Mandatory checks that cannot be stripped by optimization.
 */
export const MANDATORY_PRESERVED_CHECKS = [
  'guardian_policy_checks',
  'tenant_universe_checks',
  'approval_gates',
  'evidence_provenance_checks',
  'security_review',
  'human_authorization_consequential_actions',
] as const;

export type MandatoryPreservedCheck =
  (typeof MANDATORY_PRESERVED_CHECKS)[number];

/**
 * Quantum-inspired labeling honesty for workflow graph scheduling research.
 */
export const QUANTUM_OPTIMIZATION_LABELS = [
  'CLASSICAL_GRAPH_OR',
  'QUANTUM_INSPIRED',
  'SIMULATED',
  'PHYSICAL_QPU',
] as const;

export type QuantumOptimizationLabel =
  (typeof QUANTUM_OPTIMIZATION_LABELS)[number];

export const WORKFLOW_GRAPH_OPTIMIZER_TRUTH_BOUNDARY = Object.freeze({
  mayRemoveWastedWork: true as const,
  mayStripMandatoryGuardianPolicyChecks: false as const,
  mayStripTenantUniverseChecks: false as const,
  mayStripApprovalGates: false as const,
  mayStripEvidenceProvenanceChecks: false as const,
  mayStripSecurityReview: false as const,
  mayStripHumanAuthorizationConsequential: false as const,
  sandboxRequiredBeforePromote: true as const,
  quantumMustBeatOrJustifyClassicalBaseline: true as const,
  quantumInspiredRemainsClassicalSoftwareUnlessPhysicalQpu: true as const,
  maySelfDeployToProduction: false as const,
  mayExpandPermissions: false as const,
  mayIncreaseBudget: false as const,
  mayBypassReview: false as const,
  documentedEqImplemented: false as const,
  implementedEqVerified: false as const,
  verifiedEqProductionAuthorized: false as const,
});

export const WORKFLOW_GRAPH_OPTIMIZER_CYCLE = [
  'honesty_locks',
  'workflow_graph_optimizer_bootstrap',
  // A — Structure
  'core_flow_encoded',
  'evaluate_dimensions_encoded',
  'tracking_fields_encoded',
  'result_states_encoded',
  'mandatory_checks_encoded',
  // B — Truth
  'may_remove_wasted_work_only',
  'cannot_strip_mandatory_checks',
  'sandbox_required_before_promote',
  'quantum_needs_classical_baseline',
  'quantum_label_honesty',
  // C — Safety denies
  'no_strip_guardian_policy',
  'no_strip_tenant_universe',
  'no_strip_approval_gates',
  'no_strip_evidence_provenance',
  'no_strip_security_review',
  'no_strip_human_authorization',
  'no_self_deploy_production',
  'no_permission_expansion',
  'no_budget_increase',
  'no_review_bypass',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'es27_soft_wire',
  'es26_soft_wire',
  'es23_soft_wire',
  'es9_soft_wire',
  'er7_soft_wire',
  'ep18_qi_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Es28Hop = (typeof WORKFLOW_GRAPH_OPTIMIZER_CYCLE)[number];

export type Es28EvidenceState =
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
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'DEGRADED'
  | 'UNKNOWN'
  | 'NO_ADVANTAGE'
  | 'LOWER_LATENCY'
  | 'LOWER_COST'
  | 'BETTER_RELIABILITY'
  | 'BETTER_EVIDENCE'
  | 'BETTER_MULTI_OBJECTIVE_TRADEOFF'
  | 'REGRESSED'
  | 'SANDBOX_REQUIRED';

export type Es28HopRecord = {
  hop: Es28Hop;
  state: Es28EvidenceState;
  summary: string;
  at: string;
};

export type Es28ActorKind =
  | 'workflow_graph_optimizer'
  | 'evaluator'
  | 'composition_runtime'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Es28Actor = {
  kind: Es28ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export type WorkflowNodeKind =
  | 'research'
  | 'analysis'
  | 'merge'
  | 'guardian_policy'
  | 'tenant_universe'
  | 'approval_gate'
  | 'evidence_provenance'
  | 'security_review'
  | 'human_authorization'
  | 'model_invoke'
  | 'cache_lookup'
  | 'handoff';

export type WorkflowNode = {
  id: string;
  kind: WorkflowNodeKind;
  label: string;
  mandatory: boolean;
  parallelGroup?: string;
  modelProvider?: string;
  computeRoute?: 'cpu' | 'gpu' | 'npu' | 'edge' | 'cloud';
  estimatedCost: number;
  estimatedLatencyMs: number;
};

export type WorkflowEdge = {
  from: string;
  to: string;
  kind: 'sequence' | 'parallel' | 'handoff' | 'evidence';
};

export type WorkflowGraph = {
  version: string;
  compositionId: string;
  nodes: readonly WorkflowNode[];
  edges: readonly WorkflowEdge[];
  approvalCheckpointIds: readonly string[];
  mandatoryCheckIds: readonly string[];
};

export type WorkflowMetrics = {
  totalCost: number;
  totalLatencyMs: number;
  reliability: number;
  evidenceQuality: number;
  duplicateResearchCount: number;
  agentCount: number;
  handoffFrequency: number;
};

export const ES28_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_WORKFLOW_OPTIMIZER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  AUTO_OPEN_PR: false as const,

  STRIP_GUARDIAN_POLICY_CHECKS: false as const,
  STRIP_TENANT_UNIVERSE_CHECKS: false as const,
  STRIP_APPROVAL_GATES: false as const,
  STRIP_EVIDENCE_PROVENANCE_CHECKS: false as const,
  STRIP_SECURITY_REVIEW: false as const,
  STRIP_HUMAN_AUTHORIZATION_CONSEQUENTIAL: false as const,
  PROMOTE_WITHOUT_SANDBOX: false as const,
  SELF_DEPLOY_TO_PRODUCTION: false as const,
  PERMISSION_EXPANSION: false as const,
  BUDGET_INCREASE: false as const,
  REVIEW_BYPASS: false as const,
  QUANTUM_WITHOUT_CLASSICAL_BASELINE: false as const,
  QUANTUM_CLAIMED_PHYSICAL_WITHOUT_EVIDENCE: false as const,
  QUANTUM_MIXED_INTO_CLASSICAL_LABEL: false as const,
  HIDDEN_CHAIN_OF_THOUGHT: false as const,

  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const ES28_AGENT_BOUNDS = Object.freeze({
  mayProposeOptimizationCandidates: true as const,
  mayRunSandboxComparisons: true as const,
  mayRemoveDuplicateResearch: true as const,
  mayReorderNonMandatoryTasks: true as const,
  mayRecommendImprovedWorkflow: true as const,
  mayStripMandatoryGuardianPolicyChecks: false as const,
  mayStripTenantUniverseChecks: false as const,
  mayStripApprovalGates: false as const,
  mayStripEvidenceProvenanceChecks: false as const,
  mayStripSecurityReview: false as const,
  mayStripHumanAuthorizationConsequential: false as const,
  mayPromoteWithoutSandbox: false as const,
  maySelfDeployToProduction: false as const,
  mayExpandPermissions: false as const,
  mayIncreaseBudget: false as const,
  mayBypassReview: false as const,
  mayClaimQuantumWithoutClassicalBaseline: false as const,
  mayClaimPhysicalQpuWithoutEvidence: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ES28_MAY = Object.freeze([
  'measure_baseline_workflow_metrics',
  'propose_optimization_candidates_for_latency_cost_reliability_evidence',
  'remove_duplicate_research_and_wasted_work',
  'parallelize_independent_domain_analysis',
  'sandbox_compare_baseline_vs_candidate',
  'classify_result_states_honestly',
  'require_evaluator_review_before_improved_candidate',
  'label_quantum_inspired_against_classical_graph_or_baseline',
  'preserve_all_mandatory_checks',
  'return_optimization_evidence_to_Home_Base',
] as const);

export const ES28_MUST_NOT = Object.freeze([
  'strip_guardian_policy_checks',
  'strip_tenant_universe_checks',
  'strip_approval_gates',
  'strip_evidence_provenance_checks',
  'strip_security_review',
  'strip_human_authorization_for_consequential_actions',
  'promote_without_sandbox_comparison',
  'self_deploy_to_production',
  'expand_permissions_or_increase_budget',
  'bypass_evaluator_or_human_review',
  'claim_quantum_advantage_without_classical_baseline',
  'claim_physical_qpu_without_evidence',
  'package_hidden_chain_of_thought',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
  'enable_L4_autonomy',
] as const);

export function assertEs28LocksIntact(): boolean {
  return (
    ES28_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES28_LOCKS.STRIP_GUARDIAN_POLICY_CHECKS === false &&
    ES28_LOCKS.STRIP_TENANT_UNIVERSE_CHECKS === false &&
    ES28_LOCKS.STRIP_APPROVAL_GATES === false &&
    ES28_LOCKS.STRIP_EVIDENCE_PROVENANCE_CHECKS === false &&
    ES28_LOCKS.STRIP_SECURITY_REVIEW === false &&
    ES28_LOCKS.STRIP_HUMAN_AUTHORIZATION_CONSEQUENTIAL === false &&
    ES28_LOCKS.PROMOTE_WITHOUT_SANDBOX === false &&
    ES28_LOCKS.SELF_DEPLOY_TO_PRODUCTION === false &&
    ES28_LOCKS.PERMISSION_EXPANSION === false &&
    ES28_LOCKS.BUDGET_INCREASE === false &&
    ES28_LOCKS.REVIEW_BYPASS === false &&
    ES28_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE === false &&
    ES28_LOCKS.QUANTUM_CLAIMED_PHYSICAL_WITHOUT_EVIDENCE === false &&
    ES28_LOCKS.TIP_LAND === false &&
    ES28_LOCKS.MANAGE_PULL_REQUEST === false &&
    ES28_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    WORKFLOW_GRAPH_OPTIMIZER_TRUTH_BOUNDARY.sandboxRequiredBeforePromote ===
      true &&
    WORKFLOW_GRAPH_OPTIMIZER_TRUTH_BOUNDARY.quantumMustBeatOrJustifyClassicalBaseline ===
      true &&
    WORKFLOW_GRAPH_OPTIMIZER_TRUTH_BOUNDARY.mayStripMandatoryGuardianPolicyChecks ===
      false &&
    WORKFLOW_GRAPH_OPTIMIZER_TRUTH_BOUNDARY.maySelfDeployToProduction ===
      false &&
    ES28_AGENT_BOUNDS.automaticAuthority === false &&
    ES28_AGENT_BOUNDS.mayPromoteWithoutSandbox === false &&
    ES28_AGENT_BOUNDS.mayStripApprovalGates === false
  );
}

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es28SoftWireSnapshot = {
  es27CapabilityComposition: SoftWirePresence;
  es27Report: SoftWirePresence;
  es26Marketplace: SoftWirePresence;
  es26Report: SoftWirePresence;
  es23Experiments: SoftWirePresence;
  es23Report: SoftWirePresence;
  es9RegressionGate: SoftWirePresence;
  es9Report: SoftWirePresence;
  er7HistoricalAtlas: SoftWirePresence;
  er7Report: SoftWirePresence;
  ep18QuantumInspiredLab: SoftWirePresence;
  ep18Report: SoftWirePresence;
};

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

function softWireFirstPresent(
  relCandidates: readonly string[],
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  for (const rel of relCandidates) {
    const pathChecked = join(
      dirname(fileURLToPath(import.meta.url)),
      rel,
    );
    if (existsSync(pathChecked)) {
      return {
        present: true,
        pathChecked,
        note: notePresent,
      };
    }
  }
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relCandidates[0] ?? './missing.ts',
  );
  return {
    present: false,
    pathChecked,
    note: noteAbsent,
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

function softWireRepoFirstPresent(
  repoRoot: string,
  relCandidates: readonly string[],
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  for (const rel of relCandidates) {
    const pathChecked = join(repoRoot, rel);
    if (existsSync(pathChecked)) {
      return { present: true, pathChecked, note: notePresent };
    }
  }
  return {
    present: false,
    pathChecked: join(repoRoot, relCandidates[0] ?? 'missing.md'),
    note: noteAbsent,
  };
}

/**
 * Soft-wire probes. Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 */
export function es28SoftWireSnapshot(repoRoot?: string): Es28SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    es27CapabilityComposition: softWireFile(
      './capability-composition-engine-types.ts',
      'ES27 Capability Composition Engine PRESENT (soft-wire).',
      'ES27 Capability Composition Engine absent — soft-wire WAITING_DATA.',
    ),
    es27Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES27_CAPABILITY_COMPOSITION_ENGINE_REPORT.md',
      'ES27 report PRESENT.',
      'ES27 report absent — soft-wire WAITING_DATA.',
    ),
    es26Marketplace: softWireFirstPresent(
      [
        './agent-capability-marketplace-types.ts',
        './skill-marketplace-types.ts',
      ],
      'ES26 Agent Capability Marketplace PRESENT (soft-wire).',
      'ES26 Agent Capability Marketplace absent — soft-wire WAITING_DATA.',
    ),
    es26Report: softWireRepoFirstPresent(
      root,
      [
        'docs/operations/62L_ES26_AGENT_CAPABILITY_MARKETPLACE_REPORT.md',
        'docs/operations/62L_ES26_SKILL_MARKETPLACE_REPORT.md',
      ],
      'ES26 report PRESENT.',
      'ES26 report absent — soft-wire WAITING_DATA.',
    ),
    es23Experiments: softWireFirstPresent(
      [
        './controlled-experiment-lab-types.ts',
        './sandbox-experiment-lab-types.ts',
        './ab-experiment-lab-types.ts',
      ],
      'ES23 Experiments PRESENT (soft-wire).',
      'ES23 Experiments absent — soft-wire WAITING_DATA.',
    ),
    es23Report: softWireRepoFirstPresent(
      root,
      [
        'docs/operations/62L_ES23_CONTROLLED_EXPERIMENT_LAB_REPORT.md',
        'docs/operations/62L_ES23_SANDBOX_EXPERIMENT_LAB_REPORT.md',
      ],
      'ES23 report PRESENT.',
      'ES23 report absent — soft-wire WAITING_DATA.',
    ),
    es9RegressionGate: softWireFile(
      './automated-code-review-regression-gate-types.ts',
      'ES9 Automated Code Review & Regression Gate PRESENT (soft-wire).',
      'ES9 Automated Code Review & Regression Gate absent — soft-wire WAITING_DATA.',
    ),
    es9Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES9_AUTOMATED_CODE_REVIEW_REGRESSION_GATE_REPORT.md',
      'ES9 report PRESENT.',
      'ES9 report absent — soft-wire WAITING_DATA.',
    ),
    er7HistoricalAtlas: softWireFile(
      './historical-science-engineering-atlas-types.ts',
      'ER7 Historical Science & Engineering Atlas PRESENT (soft-wire).',
      'ER7 Historical Science & Engineering Atlas absent — soft-wire WAITING_DATA.',
    ),
    er7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER7_HISTORICAL_SCIENCE_ENGINEERING_ATLAS_REPORT.md',
      'ER7 report PRESENT.',
      'ER7 report absent — soft-wire WAITING_DATA.',
    ),
    ep18QuantumInspiredLab: softWireFile(
      './quantum-inspired-compute-lab-types.ts',
      'EP18 Quantum-Inspired Compute Lab PRESENT (soft-wire; classical baseline reference).',
      'EP18 Quantum-Inspired Compute Lab absent — soft-wire WAITING_DATA.',
    ),
    ep18Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP18_QUANTUM_INSPIRED_COMPUTE_LAB_REPORT.md',
      'EP18 report PRESENT.',
      'EP18 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Es28EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isEs28Agent(actor: Es28Actor): boolean {
  return (
    actor.kind === 'workflow_graph_optimizer' ||
    actor.kind === 'evaluator' ||
    actor.kind === 'composition_runtime'
  );
}

export function isHumanApprover(actor: Es28Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isMandatoryNodeKind(kind: WorkflowNodeKind): boolean {
  return (
    kind === 'guardian_policy' ||
    kind === 'tenant_universe' ||
    kind === 'approval_gate' ||
    kind === 'evidence_provenance' ||
    kind === 'security_review' ||
    kind === 'human_authorization'
  );
}

export function mandatoryChecksPresent(
  graph: WorkflowGraph,
): readonly MandatoryPreservedCheck[] {
  const kinds = new Set(graph.nodes.map((n) => n.kind));
  const present: MandatoryPreservedCheck[] = [];
  if (kinds.has('guardian_policy')) present.push('guardian_policy_checks');
  if (kinds.has('tenant_universe')) present.push('tenant_universe_checks');
  if (kinds.has('approval_gate')) present.push('approval_gates');
  if (kinds.has('evidence_provenance'))
    present.push('evidence_provenance_checks');
  if (kinds.has('security_review')) present.push('security_review');
  if (kinds.has('human_authorization'))
    present.push('human_authorization_consequential_actions');
  return present;
}

export function missingMandatoryChecks(
  graph: WorkflowGraph,
): readonly MandatoryPreservedCheck[] {
  const present = new Set(mandatoryChecksPresent(graph));
  return MANDATORY_PRESERVED_CHECKS.filter((c) => !present.has(c));
}
