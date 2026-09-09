/**
 * 62L-EQ15 — Pathway Plasticity (park-and-implement).
 *
 * Evidence-driven pathway plasticity so the system can strengthen useful
 * compute routes and weaken stale, contradictory, or regressed routes without
 * uncontrolled self-modification.
 *
 * Lifecycle: HYPOTHESIS → TESTED → MEASURED → VERIFIED → STALE / REGRESSED / REJECTED
 *
 * Critical rule: pathway learning can change routing preference, not
 * permissions or authority. Never self-grant tools, bypass Guardian/RLS,
 * expand tenant/Universe access, promote research to production, persist
 * hidden CoT, or auto-deploy.
 *
 * Soft-wire when PRESENT: EQ13, EQ12, EQ6, EP15, EM (#157). EQ14 may be
 * WAITING_DATA if not yet parked. Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ16 — Software Wormhole Router.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ15' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ15 Pathway Plasticity — strengthen/weaken routes from evidence; preference≠authority; HYPOTHESIS→VERIFIED→STALE/REGRESSED/REJECTED' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ15_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ16 — Software Wormhole Router — governed cache, index, materialized-view, graph-shortcut, and task-routing paths to reduce latency without unsupported physics claims.' as const;

/**
 * Factors that influence pathway weight.
 */
export const PATHWAY_WEIGHT_INFLUENCES = [
  'benchmark_success',
  'recency_freshness',
  'reliability',
  'latency',
  'cost_energy_proxy',
  'output_quality',
  'repeated_failure',
  'contradiction',
  'regression',
  'evaluator_review',
  'human_approval_where_required',
] as const;

/**
 * Core pathway lifecycle states.
 */
export const PATHWAY_LIFECYCLE_STATES = [
  'HYPOTHESIS',
  'TESTED',
  'MEASURED',
  'VERIFIED',
  'STALE',
  'REGRESSED',
  'REJECTED',
] as const;

export type PathwayLifecycleState =
  (typeof PATHWAY_LIFECYCLE_STATES)[number];

/**
 * Suggested pathway metadata fields.
 */
export const PATHWAY_METADATA_FIELDS = [
  'weight',
  'confidence',
  'successCount',
  'failureCount',
  'lastVerifiedAt',
  'stalenessScore',
  'regressionState',
  'evidenceRefs',
  'rollbackVersion',
] as const;

export type PathwayMetadataField = (typeof PATHWAY_METADATA_FIELDS)[number];

export type PathwayWeightInfluence =
  (typeof PATHWAY_WEIGHT_INFLUENCES)[number];

export type PathwayRegressionState = 'NONE' | 'SUSPECTED' | 'REGRESSED';

/**
 * Suggested pathway record (preference metadata only — not permissions).
 */
export type PathwayRecord = {
  pathwayId: string;
  routeKey: string;
  lifecycle: PathwayLifecycleState;
  weight: number;
  confidence: number;
  successCount: number;
  failureCount: number;
  lastVerifiedAt: string | null;
  stalenessScore: number;
  regressionState: PathwayRegressionState;
  evidenceRefs: readonly string[];
  rollbackVersion: string | null;
  hypothesis: string;
};

/**
 * Strengthen conditions.
 */
export const PATHWAY_STRENGTHEN_CONDITIONS = [
  'repeated_bounded_tests_succeed',
  'results_reproducible',
  'evidence_fresh',
  'route_beats_or_justifies_against_baselines',
] as const;

/**
 * Weaken conditions.
 */
export const PATHWAY_WEAKEN_CONDITIONS = [
  'runtime_behavior_regresses',
  'drivers_models_change',
  'failures_increase',
  'evidence_goes_stale',
  'conflicting_results_appear',
  'reviewer_rejects_conclusion',
] as const;

/**
 * Critical boundary: preference change only — not authority.
 */
export const PATHWAY_LEARNING_BOUNDARY = Object.freeze({
  mayChangeRoutingPreference: true as const,
  mayChangePermissions: false as const,
  mayChangeAuthority: false as const,
  maySelfGrantTools: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPromoteResearchDirectlyToProduction: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
});

export const PATHWAY_PLASTICITY_CYCLE = [
  'honesty_locks',
  'pathway_plasticity_bootstrap',
  // A — Structure
  'weight_influences_encoded',
  'lifecycle_states_encoded',
  'metadata_fields_encoded',
  'strengthen_weaken_conditions_encoded',
  'preference_neq_authority_encoded',
  // B — Truth
  'strengthen_on_reproducible_fresh_success',
  'weaken_on_regression_stale_contradiction_reject',
  'preference_change_neq_permission_or_authority',
  // C — Denies
  'deny_self_grant_tools',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_promote_research_to_production',
  'deny_persist_hidden_chain_of_thought',
  'deny_auto_deploy_changes',
  'deny_strengthen_without_evidence',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  'promoted_policy_needs_reproducible_tests_and_review',
  // E — Soft-wires
  'eq14_soft_wire',
  'eq13_soft_wire',
  'eq12_soft_wire',
  'eq6_soft_wire',
  'ep15_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq15Hop = (typeof PATHWAY_PLASTICITY_CYCLE)[number];

export type Eq15EvidenceState =
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
  | 'STALE'
  | 'UNKNOWN'
  | 'HYPOTHESIS'
  | 'TESTED'
  | 'MEASURED'
  | 'REGRESSED';

export type Eq15HopRecord = {
  hop: Eq15Hop;
  state: Eq15EvidenceState;
  summary: string;
  at: string;
};

export type Eq15ActorKind =
  | 'pathway_plasticity_engine'
  | 'evaluator_reviewer'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq15Actor = {
  kind: Eq15ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ15_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_PATHWAY_PLASTICITY_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Preference ≠ authority
  PREFERENCE_EQ_PERMISSION: false as const,
  PREFERENCE_EQ_AUTHORITY: false as const,
  SELF_GRANT_TOOLS: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  PROMOTE_RESEARCH_DIRECTLY_TO_PRODUCTION: false as const,
  PERSIST_HIDDEN_CHAIN_OF_THOUGHT: false as const,
  AUTO_DEPLOY_CHANGES: false as const,
  STRENGTHEN_WITHOUT_EVIDENCE: false as const,
  UNCONTROLLED_SELF_MODIFICATION: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  PROMOTED_POLICY_REQUIRES_REPRODUCIBLE_TESTS_AND_REVIEW: true as const,
});

export const EQ15_AGENT_BOUNDS = Object.freeze({
  mayAdjustPathwayWeightsFromEvidence: true as const,
  mayStrengthenOnReproducibleFreshSuccess: true as const,
  mayWeakenOnRegressionStaleContradictionReject: true as const,
  mayChangeRoutingPreferenceOnly: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayChangePermissions: false as const,
  mayChangeAuthority: false as const,
  maySelfGrantTools: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPromoteResearchDirectlyToProduction: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  mayStrengthenWithoutEvidence: false as const,
  mayRecommendOnly: true as const,
});

export const EQ15_MAY = Object.freeze([
  'strengthen_pathways_on_reproducible_fresh_bounded_success',
  'weaken_pathways_on_regression_stale_contradiction_or_reject',
  'change_routing_preference_from_evidence',
  'retain_weight_confidence_counts_staleness_rollback_metadata',
  'require_reproducible_tests_and_review_before_promoted_policy',
  'keep_permissions_and_authority_unchanged_by_plasticity',
] as const);

export const EQ15_MUST_NOT = Object.freeze([
  'self_grant_tools_or_bypass_guardian_rls',
  'expand_tenant_universe_access',
  'promote_research_directly_to_production',
  'persist_hidden_chain_of_thought',
  'auto_deploy_changes',
  'treat_preference_change_as_permission_or_authority_change',
  'strengthen_without_evidence',
  'uncontrolled_self_modification',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eq15SoftWireSnapshot = {
  eq14NeuralPathwayArchitectureGraph: SoftWirePresence;
  eq14Report: SoftWirePresence;
  eq13ArchitectureReturnReceipt: SoftWirePresence;
  eq13Report: SoftWirePresence;
  eq12CrossArchitectureBenchmarkMatrix: SoftWirePresence;
  eq12Report: SoftWirePresence;
  eq6ArchitectureCapabilityGraph: SoftWirePresence;
  eq6Report: SoftWirePresence;
  ep15AlgorithmTuningSandbox: SoftWirePresence;
  ep15Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq15LocksIntact(): boolean {
  return (
    EQ15_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ15_LOCKS.PREFERENCE_EQ_PERMISSION === false &&
    EQ15_LOCKS.PREFERENCE_EQ_AUTHORITY === false &&
    EQ15_LOCKS.SELF_GRANT_TOOLS === false &&
    EQ15_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    EQ15_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    EQ15_LOCKS.PROMOTE_RESEARCH_DIRECTLY_TO_PRODUCTION === false &&
    EQ15_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    EQ15_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    EQ15_LOCKS.STRENGTHEN_WITHOUT_EVIDENCE === false &&
    EQ15_LOCKS.UNCONTROLLED_SELF_MODIFICATION === false &&
    EQ15_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ15_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ15_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ15_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ15_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ15_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ15_LOCKS.PROMOTED_POLICY_REQUIRES_REPRODUCIBLE_TESTS_AND_REVIEW ===
      true &&
    EQ15_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ15_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ15_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ15_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ15_LOCKS.TIP_LAND === false &&
    EQ15_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ15_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ15_LOCKS.FULL_PRODUCTION_PATHWAY_PLASTICITY_SHIPPED === false &&
    EQ15_LOCKS.MANAGE_PULL_REQUEST === false &&
    PATHWAY_LEARNING_BOUNDARY.mayChangePermissions === false &&
    PATHWAY_LEARNING_BOUNDARY.mayChangeAuthority === false &&
    PATHWAY_LEARNING_BOUNDARY.maySelfGrantTools === false &&
    PATHWAY_LEARNING_BOUNDARY.mayBypassGuardianRls === false &&
    PATHWAY_LEARNING_BOUNDARY.mayExpandTenantUniverseAccess === false &&
    PATHWAY_LEARNING_BOUNDARY.mayPromoteResearchDirectlyToProduction ===
      false &&
    PATHWAY_LEARNING_BOUNDARY.mayPersistHiddenChainOfThought === false &&
    PATHWAY_LEARNING_BOUNDARY.mayAutoDeployChanges === false &&
    EQ15_AGENT_BOUNDS.automaticAuthority === false &&
    EQ15_AGENT_BOUNDS.mayChangePermissions === false &&
    EQ15_AGENT_BOUNDS.mayChangeAuthority === false &&
    EQ15_AGENT_BOUNDS.maySelfGrantTools === false &&
    EQ15_AGENT_BOUNDS.mayBypassGuardianRls === false &&
    EQ15_AGENT_BOUNDS.mayExpandTenantUniverseAccess === false &&
    EQ15_AGENT_BOUNDS.mayPromoteResearchDirectlyToProduction === false &&
    EQ15_AGENT_BOUNDS.mayPersistHiddenChainOfThought === false &&
    EQ15_AGENT_BOUNDS.mayAutoDeployChanges === false &&
    EQ15_AGENT_BOUNDS.mayStrengthenWithoutEvidence === false
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

export function eq15SoftWireSnapshot(repoRoot?: string): Eq15SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eq14NeuralPathwayArchitectureGraph: softWireFile(
      './neural-pathway-architecture-graph-types.ts',
      'EQ14 Neural Pathway Architecture Graph PRESENT (soft-wire).',
      'EQ14 Neural Pathway Architecture Graph absent — soft-wire WAITING_DATA.',
    ),
    eq14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ14_NEURAL_PATHWAY_ARCHITECTURE_GRAPH_REPORT.md',
      'EQ14 report PRESENT.',
      'EQ14 report absent — soft-wire WAITING_DATA.',
    ),
    eq13ArchitectureReturnReceipt: softWireFile(
      './architecture-return-receipt-types.ts',
      'EQ13 Architecture Return Receipt PRESENT (soft-wire).',
      'EQ13 Architecture Return Receipt absent — soft-wire WAITING_DATA.',
    ),
    eq13Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ13_ARCHITECTURE_RETURN_RECEIPT_REPORT.md',
      'EQ13 report PRESENT.',
      'EQ13 report absent — soft-wire WAITING_DATA.',
    ),
    eq12CrossArchitectureBenchmarkMatrix: softWireFile(
      './cross-architecture-benchmark-matrix-types.ts',
      'EQ12 Cross-Architecture Benchmark Matrix PRESENT (soft-wire).',
      'EQ12 Cross-Architecture Benchmark Matrix absent — soft-wire WAITING_DATA.',
    ),
    eq12Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ12_CROSS_ARCHITECTURE_BENCHMARK_MATRIX_REPORT.md',
      'EQ12 report PRESENT.',
      'EQ12 report absent — soft-wire WAITING_DATA.',
    ),
    eq6ArchitectureCapabilityGraph: softWireFile(
      './architecture-capability-graph-types.ts',
      'EQ6 Architecture Capability Graph PRESENT (soft-wire).',
      'EQ6 Architecture Capability Graph absent — soft-wire WAITING_DATA.',
    ),
    eq6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ6_ARCHITECTURE_CAPABILITY_GRAPH_REPORT.md',
      'EQ6 report PRESENT.',
      'EQ6 report absent — soft-wire WAITING_DATA.',
    ),
    ep15AlgorithmTuningSandbox: softWireFile(
      './algorithm-tuning-sandbox-types.ts',
      'EP15 Algorithm Tuning Sandbox PRESENT (soft-wire).',
      'EP15 Algorithm Tuning Sandbox absent — soft-wire WAITING_DATA.',
    ),
    ep15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP15_ALGORITHM_TUNING_SANDBOX_REPORT.md',
      'EP15 report PRESENT.',
      'EP15 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eq15Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEq15Agent(actor: Eq15Actor): boolean {
  const agents: readonly Eq15ActorKind[] = [
    'pathway_plasticity_engine',
    'evaluator_reviewer',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Preference change does not equal permission or authority change.
 */
export function preferenceImpliesAuthority(): false {
  return false;
}

export function preferenceImpliesPermission(): false {
  return false;
}

/**
 * Strengthen requires evidence of reproducible fresh success.
 */
export function canStrengthenPathway(input: {
  repeatedBoundedTestsSucceed: boolean;
  resultsReproducible: boolean;
  evidenceFresh: boolean;
  evidenceRefs: readonly string[];
}): boolean {
  return (
    input.repeatedBoundedTestsSucceed &&
    input.resultsReproducible &&
    input.evidenceFresh &&
    input.evidenceRefs.length > 0
  );
}
