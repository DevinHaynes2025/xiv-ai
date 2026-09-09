/**
 * 62L-EQ16 — Software Wormhole Router (park-and-implement).
 *
 * Governed software-layer “wormhole” shortcuts so agents can reduce latency
 * and repeated work via cache, index, graph, routing, and materialized-view
 * paths without bypassing security or claiming physical wormholes.
 *
 * Core flow:
 * Task → policy/data scope check → shortcut candidate → freshness/permission
 * check → use shortcut OR full path → receipt → Home Base
 *
 * Critical rule: a shortcut can reduce work, but cannot reduce authorization
 * checks. Every hop verifies user + tenant + Universe + object + purpose +
 * data class + action. No security shortcut is ever allowed.
 *
 * Truth boundary: “wormhole” = software routing acceleration only.
 * No spacetime / FTL / unsupported physics claims.
 *
 * Soft-wire when PRESENT: EQ15, EQ13, EQ12, EQ6, EP15, EM (#157).
 * EQ14 may be WAITING_DATA. Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ17 — Circuit / Graph Design Sandbox.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ16' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ16 Software Wormhole Router — governed cache/index/graph/MV shortcuts; auth checks never skipped; software-only (no physics claims)' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ16_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ17 — Circuit / Graph Design Sandbox — software compute graphs and dataflow circuits for agentic workloads without cloning proprietary silicon.' as const;

/**
 * Core software shortcut types (not physical wormholes).
 */
export const WORMHOLE_SHORTCUT_TYPES = [
  'cache_hit_path',
  'vector_index_shortcut',
  'graph_neighbor_shortcut',
  'materialized_view',
  'precomputed_embedding',
  'compiled_execution_plan',
  'reusable_agent_result',
  'local_mirror_cache',
  'task_result_memoization',
  'model_session_warm_pool',
  'data_locality_routing',
] as const;

export type WormholeShortcutType = (typeof WORMHOLE_SHORTCUT_TYPES)[number];

/**
 * Core flow hops.
 */
export const WORMHOLE_CORE_FLOW = [
  'task',
  'policy_data_scope_check',
  'shortcut_candidate',
  'freshness_permission_check',
  'use_shortcut_or_full_path',
  'receipt',
  'home_base',
] as const;

/**
 * Route tracking fields.
 */
export const WORMHOLE_ROUTE_FIELDS = [
  'routeId',
  'source',
  'destination',
  'shortcutType',
  'tenantUniverseScope',
  'dataClass',
  'purpose',
  'freshness',
  'ttlExpiry',
  'cacheIndexVersion',
  'evidenceRefs',
  'latencySaved',
  'costSaved',
  'reliability',
  'invalidationTrigger',
  'rollbackPath',
] as const;

export type WormholeRouteField = (typeof WORMHOLE_ROUTE_FIELDS)[number];

/**
 * Authorization dimensions that every hop must still verify.
 */
export const WORMHOLE_AUTH_HOP_CHECKS = [
  'user',
  'tenant',
  'universe',
  'object',
  'purpose',
  'data_class',
  'action',
] as const;

export type WormholeAuthHopCheck = (typeof WORMHOLE_AUTH_HOP_CHECKS)[number];

/**
 * Invalidation / STALE triggers.
 */
export const WORMHOLE_INVALIDATION_TRIGGERS = [
  'source_data_changes',
  'permissions_change',
  'model_runtime_version_changes',
  'tenant_scope_changes',
  'evidence_expires',
  'results_regress',
  'cache_integrity_fails',
] as const;

export type WormholeInvalidationTrigger =
  (typeof WORMHOLE_INVALIDATION_TRIGGERS)[number];

/**
 * Candidate sandbox test gates before promotion.
 */
export const WORMHOLE_CANDIDATE_TEST_GATES = [
  'correctness',
  'freshness',
  'isolation',
  'speed',
  'rollback',
  'auditability',
] as const;

export type WormholeCandidateTestGate =
  (typeof WORMHOLE_CANDIDATE_TEST_GATES)[number];

export const WORMHOLE_ROUTE_STATES = [
  'SANDBOX_CANDIDATE',
  'TESTED',
  'ACTIVE',
  'STALE',
  'INVALIDATED',
  'REJECTED',
] as const;

export type WormholeRouteState = (typeof WORMHOLE_ROUTE_STATES)[number];

/**
 * Truth boundary: software acceleration only.
 */
export const WORMHOLE_TRUTH_BOUNDARY = Object.freeze({
  meansSoftwareRoutingAccelerationOnly: true as const,
  claimsSpacetimeManipulation: false as const,
  claimsFasterThanLightCommunication: false as const,
  claimsUnsupportedPhysics: false as const,
  maySkipAuthorizationChecks: false as const,
  mayCreateSecurityShortcut: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  mayPromoteCandidateWithoutGates: false as const,
});

/**
 * Critical rule: shortcuts reduce work, never authorization.
 */
export const WORMHOLE_AUTH_RULE = Object.freeze({
  shortcutMayReduceWork: true as const,
  shortcutMayReduceAuthorizationChecks: false as const,
  everyHopMustVerifyAuthDimensions: true as const,
  securityShortcutAllowed: false as const,
});

export type WormholeRoute = {
  routeId: string;
  source: string;
  destination: string;
  shortcutType: WormholeShortcutType;
  tenantId: string;
  universeId: string;
  dataClass: string;
  purpose: string;
  freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  ttlExpiry: string | null;
  cacheIndexVersion: string;
  evidenceRefs: readonly string[];
  latencySavedMs: number;
  costSavedProxy: number;
  reliability: number;
  invalidationTrigger: WormholeInvalidationTrigger | null;
  rollbackPath: string;
  state: WormholeRouteState;
  authChecksRequired: readonly WormholeAuthHopCheck[];
  candidateGatesPassed: readonly WormholeCandidateTestGate[];
};

export type WormholeAuthContext = {
  userId: string;
  tenantId: string;
  universeId: string;
  objectId: string;
  purpose: string;
  dataClass: string;
  action: string;
};

export const SOFTWARE_WORMHOLE_ROUTER_CYCLE = [
  'honesty_locks',
  'software_wormhole_router_bootstrap',
  // A — Structure
  'shortcut_types_encoded',
  'core_flow_encoded',
  'route_fields_encoded',
  'auth_hop_checks_encoded',
  'invalidation_triggers_encoded',
  'candidate_test_gates_encoded',
  'truth_boundary_software_only',
  // B — Truth
  'shortcut_reduces_work_not_authorization',
  'every_hop_verifies_auth_dimensions',
  'no_security_shortcut_allowed',
  'invalidate_on_stale_triggers',
  'candidate_stays_sandbox_until_gated',
  // C — Denies
  'deny_skip_authorization_checks',
  'deny_security_shortcut',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_physics_or_ftl_claims',
  'deny_persist_hidden_chain_of_thought',
  'deny_auto_deploy_changes',
  'deny_promote_candidate_without_gates',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq15_soft_wire',
  'eq14_soft_wire',
  'eq13_soft_wire',
  'eq12_soft_wire',
  'eq6_soft_wire',
  'ep15_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq16Hop = (typeof SOFTWARE_WORMHOLE_ROUTER_CYCLE)[number];

export type Eq16EvidenceState =
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
  | 'SANDBOX_CANDIDATE'
  | 'ACTIVE'
  | 'INVALIDATED';

export type Eq16HopRecord = {
  hop: Eq16Hop;
  state: Eq16EvidenceState;
  summary: string;
  at: string;
};

export type Eq16ActorKind =
  | 'wormhole_router'
  | 'shortcut_proposer'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq16Actor = {
  kind: Eq16ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ16_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_WORMHOLE_ROUTER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Auth / security
  SHORTCUT_REDUCES_AUTHORIZATION_CHECKS: false as const,
  SECURITY_SHORTCUT_ALLOWED: false as const,
  SKIP_AUTH_HOP_CHECKS: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  PROMOTE_CANDIDATE_WITHOUT_GATES: false as const,
  AUTO_DEPLOY_CHANGES: false as const,
  PERSIST_HIDDEN_CHAIN_OF_THOUGHT: false as const,

  // Truth
  CLAIM_SPACETIME_MANIPULATION: false as const,
  CLAIM_FASTER_THAN_LIGHT: false as const,
  CLAIM_UNSUPPORTED_PHYSICS: false as const,
  WORMHOLE_MEANS_SOFTWARE_ONLY: true as const,

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
});

export const EQ16_AGENT_BOUNDS = Object.freeze({
  mayProposeSandboxShortcutCandidates: true as const,
  mayUseGovernedShortcutAfterAuthAndFreshness: true as const,
  mayInvalidateStaleRoutes: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  mayReduceWorkViaShortcut: true as const,
  mayReduceAuthorizationChecks: false as const,
  mayCreateSecurityShortcut: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayClaimPhysicsOrFtl: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  mayPromoteCandidateWithoutGates: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const EQ16_MAY = Object.freeze([
  'propose_sandbox_shortcut_candidates_from_repeated_workloads',
  'use_governed_shortcut_after_policy_freshness_and_permission_checks',
  'track_route_metadata_including_ttl_invalidation_and_rollback',
  'invalidate_or_mark_stale_on_invalidation_triggers',
  'fall_back_to_full_path_when_shortcut_unavailable_or_stale',
  'return_shortcut_receipt_to_home_base',
] as const);

export const EQ16_MUST_NOT = Object.freeze([
  'skip_or_reduce_authorization_checks_via_shortcut',
  'create_or_use_security_shortcut',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'claim_spacetime_ftl_or_unsupported_physics',
  'promote_sandbox_candidate_without_test_gates',
  'persist_hidden_chain_of_thought',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eq16SoftWireSnapshot = {
  eq15PathwayPlasticity: SoftWirePresence;
  eq15Report: SoftWirePresence;
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

export function assertEq16LocksIntact(): boolean {
  return (
    EQ16_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ16_LOCKS.SHORTCUT_REDUCES_AUTHORIZATION_CHECKS === false &&
    EQ16_LOCKS.SECURITY_SHORTCUT_ALLOWED === false &&
    EQ16_LOCKS.SKIP_AUTH_HOP_CHECKS === false &&
    EQ16_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    EQ16_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    EQ16_LOCKS.PROMOTE_CANDIDATE_WITHOUT_GATES === false &&
    EQ16_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    EQ16_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    EQ16_LOCKS.CLAIM_SPACETIME_MANIPULATION === false &&
    EQ16_LOCKS.CLAIM_FASTER_THAN_LIGHT === false &&
    EQ16_LOCKS.CLAIM_UNSUPPORTED_PHYSICS === false &&
    EQ16_LOCKS.WORMHOLE_MEANS_SOFTWARE_ONLY === true &&
    EQ16_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ16_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ16_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ16_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ16_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ16_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ16_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ16_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ16_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ16_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ16_LOCKS.TIP_LAND === false &&
    EQ16_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ16_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ16_LOCKS.FULL_PRODUCTION_WORMHOLE_ROUTER_SHIPPED === false &&
    EQ16_LOCKS.MANAGE_PULL_REQUEST === false &&
    WORMHOLE_TRUTH_BOUNDARY.meansSoftwareRoutingAccelerationOnly === true &&
    WORMHOLE_TRUTH_BOUNDARY.claimsSpacetimeManipulation === false &&
    WORMHOLE_TRUTH_BOUNDARY.claimsFasterThanLightCommunication === false &&
    WORMHOLE_TRUTH_BOUNDARY.claimsUnsupportedPhysics === false &&
    WORMHOLE_TRUTH_BOUNDARY.maySkipAuthorizationChecks === false &&
    WORMHOLE_TRUTH_BOUNDARY.mayCreateSecurityShortcut === false &&
    WORMHOLE_AUTH_RULE.shortcutMayReduceAuthorizationChecks === false &&
    WORMHOLE_AUTH_RULE.securityShortcutAllowed === false &&
    EQ16_AGENT_BOUNDS.mayReduceAuthorizationChecks === false &&
    EQ16_AGENT_BOUNDS.mayCreateSecurityShortcut === false &&
    EQ16_AGENT_BOUNDS.mayClaimPhysicsOrFtl === false &&
    EQ16_AGENT_BOUNDS.automaticAuthority === false
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

export function eq16SoftWireSnapshot(repoRoot?: string): Eq16SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eq15PathwayPlasticity: softWireFile(
      './pathway-plasticity-types.ts',
      'EQ15 Pathway Plasticity PRESENT (soft-wire).',
      'EQ15 Pathway Plasticity absent — soft-wire WAITING_DATA.',
    ),
    eq15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ15_PATHWAY_PLASTICITY_REPORT.md',
      'EQ15 report PRESENT.',
      'EQ15 report absent — soft-wire WAITING_DATA.',
    ),
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

export function isHumanApprover(actor: Eq16Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEq16Agent(actor: Eq16Actor): boolean {
  const agents: readonly Eq16ActorKind[] = [
    'wormhole_router',
    'shortcut_proposer',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/** Shortcut may reduce work — never authorization. */
export function shortcutMayReduceAuthorizationChecks(): false {
  return false;
}

export function securityShortcutAllowed(): false {
  return false;
}

export function wormholeMeansSoftwareOnly(): true {
  return true;
}

export function claimsUnsupportedPhysics(): false {
  return false;
}

/**
 * Every hop must verify all auth dimensions; missing any → deny.
 */
export function authHopChecksComplete(
  checks: readonly WormholeAuthHopCheck[],
): boolean {
  return WORMHOLE_AUTH_HOP_CHECKS.every((c) => checks.includes(c));
}

/**
 * Candidate may promote only after all sandbox test gates pass.
 */
export function candidateGatesComplete(
  gates: readonly WormholeCandidateTestGate[],
): boolean {
  return WORMHOLE_CANDIDATE_TEST_GATES.every((g) => gates.includes(g));
}
