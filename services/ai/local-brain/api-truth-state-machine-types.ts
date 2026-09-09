/**
 * 62L-ER2 — API Truth State Machine (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + … (GitHub #162).
 *
 * Every external connector moves through explicit evidence states so agents
 * never confuse “we know this API exists” with “we are authorized and
 * successfully using it.”
 *
 * Core progression (no skip without evidence):
 * TARGET → DOCUMENTED → CONFIGURED → AUTHORIZED → SANDBOX_TESTED → VERIFIED
 *
 * Also: DEGRADED | STALE | REVOKED | UNAVAILABLE
 *
 * Real-time truth: live required + stale/unavailable → DENY / WAITING_DATA
 * (never return old data as live).
 *
 * Soft-wire when PRESENT: ER1, EQ16, EQ15, EQ13, EQ12, EP15, EM (#157).
 * EQ14 may be WAITING_DATA. Presence ≠ VERIFIED.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER3 — Public Data Source Registry.
 *
 * Note: an earlier provisional park named “ER2 Public/Open Historical Data
 * Registry” maps to upcoming ER3 and is not this phase.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER2' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER2 API Truth State Machine — TARGET→…→VERIFIED; no skip without evidence; live+stale→DENY/WAITING_DATA' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER2_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER3 — Public Data Source Registry — catalog lawful public/open/licensed datasets from governments, science, economics, logistics, geospatial, standards, business, and historical archives with provenance and rights metadata.' as const;

/**
 * Required connector truth states.
 */
export const API_TRUTH_STATES = [
  'TARGET',
  'DOCUMENTED',
  'CONFIGURED',
  'AUTHORIZED',
  'SANDBOX_TESTED',
  'VERIFIED',
  'DEGRADED',
  'STALE',
  'REVOKED',
  'UNAVAILABLE',
] as const;

export type ApiTruthState = (typeof API_TRUTH_STATES)[number];

/**
 * Core progression (forward evidence ladder).
 */
export const API_TRUTH_CORE_PROGRESSION = [
  'TARGET',
  'DOCUMENTED',
  'CONFIGURED',
  'AUTHORIZED',
  'SANDBOX_TESTED',
  'VERIFIED',
] as const;

export type ApiTruthCoreState = (typeof API_TRUTH_CORE_PROGRESSION)[number];

/**
 * Transition evidence fields.
 */
export const API_TRUTH_TRANSITION_FIELDS = [
  'connectionId',
  'previousState',
  'newState',
  'timestamp',
  'actor',
  'reason',
  'evidenceReference',
  'credentialScopeFingerprint',
  'testResult',
  'expiryReverificationDate',
] as const;

export type ApiTruthTransitionField =
  (typeof API_TRUTH_TRANSITION_FIELDS)[number];

/**
 * Degradation / STALE triggers.
 */
export const API_TRUTH_DEGRADATION_TRIGGERS = [
  'authentication_failing',
  'rate_limits_repeatedly_exceeded',
  'endpoint_schema_changes',
  'data_freshness_deteriorates',
  'provider_runtime_health_fails',
  'credentials_expire',
  'required_tests_outdated',
] as const;

export type ApiTruthDegradationTrigger =
  (typeof API_TRUTH_DEGRADATION_TRIGGERS)[number];

/**
 * Agent routing allow-list by state.
 */
export const API_TRUTH_ROUTING_RULES = Object.freeze({
  VERIFIED: 'normal_approved_workloads' as const,
  SANDBOX_TESTED: 'bounded_test_research_only' as const,
  AUTHORIZED: 'tests_not_production_assumptions' as const,
  DOCUMENTED: 'planning_only' as const,
  TARGET: 'planning_only' as const,
  CONFIGURED: 'planning_or_setup_only' as const,
  DEGRADED: 'cannot_silently_satisfy_realtime' as const,
  STALE: 'cannot_silently_satisfy_realtime' as const,
  REVOKED: 'block_new_calls' as const,
  UNAVAILABLE: 'cannot_silently_satisfy_realtime' as const,
});

export type ApiTruthTransition = {
  connectionId: string;
  previousState: ApiTruthState;
  newState: ApiTruthState;
  timestamp: string;
  actorId: string;
  reason: string;
  evidenceReference: string;
  /** Fingerprint only — never the secret. */
  credentialScopeFingerprint: string | null;
  testResult: 'PASS' | 'FAIL' | 'NOT_RUN' | 'N_A';
  expiryReverificationDate: string | null;
  secretValueLogged: false;
};

export type ApiTruthConnector = {
  connectionId: string;
  provider: string;
  endpoint: string | null;
  state: ApiTruthState;
  orgId: string;
  tenantId: string;
  universeId: string;
  credentialScopeFingerprint: string | null;
  expiryReverificationDate: string | null;
  transitions: readonly ApiTruthTransition[];
  evidenceRefs: readonly string[];
  secretValuePresentInLogs: false;
};

export const API_TRUTH_BOUNDARY = Object.freeze({
  maySkipStateWithoutEvidence: false as const,
  documentedEqVerified: false as const,
  authorizedEqVerified: false as const,
  sandboxTestedEqProductionVerified: false as const,
  mayReturnStaleDataAsLive: false as const,
  mayLogSecretValues: false as const,
  mayAutomaticScopeExpansion: false as const,
  mayCredentialReuseAcrossTenants: false as const,
  mayFallbackToScrapingWhenAuthFails: false as const,
  revokedImmediatelyBlocksNewCalls: true as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
});

export const API_TRUTH_STATE_MACHINE_CYCLE = [
  'honesty_locks',
  'api_truth_state_machine_bootstrap',
  // A — Structure
  'truth_states_encoded',
  'core_progression_encoded',
  'transition_fields_encoded',
  'degradation_triggers_encoded',
  'routing_rules_encoded',
  'truth_boundary_encoded',
  // B — Truth
  'no_skip_without_evidence',
  'progression_target_to_verified',
  'degrade_on_triggers',
  'revoked_blocks_new_calls',
  'routing_by_state',
  'realtime_required_stale_denies',
  // C — Denies
  'deny_skip_state_without_evidence',
  'deny_return_stale_as_live',
  'deny_log_secret_values',
  'deny_automatic_scope_expansion',
  'deny_credential_reuse_across_tenants',
  'deny_scrape_fallback_on_auth_fail',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_persist_hidden_chain_of_thought',
  'deny_auto_deploy_changes',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
  'er1_soft_wire',
  'eq16_soft_wire',
  'eq15_soft_wire',
  'eq14_soft_wire',
  'eq13_soft_wire',
  'eq12_soft_wire',
  'ep15_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er2Hop = (typeof API_TRUTH_STATE_MACHINE_CYCLE)[number];

export type Er2EvidenceState =
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
  | 'TARGET'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'SANDBOX_TESTED'
  | 'REVOKED';

export type Er2HopRecord = {
  hop: Er2Hop;
  state: Er2EvidenceState;
  summary: string;
  at: string;
};

export type Er2ActorKind =
  | 'api_truth_state_machine'
  | 'connector_operator'
  | 'live_data_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er2Actor = {
  kind: Er2ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER2_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_API_TRUTH_STATE_MACHINE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  SKIP_STATE_WITHOUT_EVIDENCE: false as const,
  DOCUMENTED_EQ_VERIFIED: false as const,
  AUTHORIZED_EQ_VERIFIED: false as const,
  SANDBOX_TESTED_EQ_PRODUCTION_VERIFIED: false as const,
  RETURN_STALE_DATA_AS_LIVE: false as const,
  LOG_SECRET_VALUES: false as const,
  AUTOMATIC_SCOPE_EXPANSION: false as const,
  CREDENTIAL_REUSE_ACROSS_TENANTS: false as const,
  SCRAPE_FALLBACK_ON_AUTH_FAIL: false as const,
  USE_REVOKED_FOR_NEW_CALLS: false as const,

  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  PERSIST_HIDDEN_CHAIN_OF_THOUGHT: false as const,
  AUTO_DEPLOY_CHANGES: false as const,
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

export const ER2_AGENT_BOUNDS = Object.freeze({
  mayAdvanceStateWithEvidence: true as const,
  mayDegradeOnTriggers: true as const,
  mayRevokeAndBlockCalls: true as const,
  mayRouteByStateRules: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  maySkipStateWithoutEvidence: false as const,
  mayReturnStaleDataAsLive: false as const,
  mayLogSecretValues: false as const,
  mayAutomaticScopeExpansion: false as const,
  mayCredentialReuseAcrossTenants: false as const,
  mayFallbackToScrapingWhenAuthFails: false as const,
  mayUseRevokedForNewCalls: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER2_MAY = Object.freeze([
  'advance_connector_states_only_with_supporting_evidence',
  'record_transition_evidence_including_credential_scope_fingerprint',
  'degrade_or_stale_on_auth_rate_schema_freshness_health_expiry_outdated_tests',
  'revoke_to_immediately_block_new_calls',
  'route_agents_by_state_allow_list',
  'deny_or_waiting_data_when_realtime_required_but_stale_unavailable',
] as const);

export const ER2_MUST_NOT = Object.freeze([
  'skip_state_without_supporting_evidence',
  'treat_documented_or_authorized_as_verified',
  'return_old_data_as_live_when_realtime_required',
  'log_secret_values',
  'automatic_scope_expansion',
  'credential_reuse_across_tenants',
  'fallback_to_scraping_when_api_authorization_fails',
  'use_revoked_degraded_stale_unavailable_to_silently_satisfy_realtime',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
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

export type Er2SoftWireSnapshot = {
  er1RealApiConnectionRegistry: SoftWirePresence;
  er1Report: SoftWirePresence;
  eq16SoftwareWormholeRouter: SoftWirePresence;
  eq16Report: SoftWirePresence;
  eq15PathwayPlasticity: SoftWirePresence;
  eq15Report: SoftWirePresence;
  eq14NeuralPathwayArchitectureGraph: SoftWirePresence;
  eq14Report: SoftWirePresence;
  eq13ArchitectureReturnReceipt: SoftWirePresence;
  eq13Report: SoftWirePresence;
  eq12CrossArchitectureBenchmarkMatrix: SoftWirePresence;
  eq12Report: SoftWirePresence;
  ep15AlgorithmTuningSandbox: SoftWirePresence;
  ep15Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEr2LocksIntact(): boolean {
  return (
    ER2_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER2_LOCKS.SKIP_STATE_WITHOUT_EVIDENCE === false &&
    ER2_LOCKS.DOCUMENTED_EQ_VERIFIED === false &&
    ER2_LOCKS.AUTHORIZED_EQ_VERIFIED === false &&
    ER2_LOCKS.SANDBOX_TESTED_EQ_PRODUCTION_VERIFIED === false &&
    ER2_LOCKS.RETURN_STALE_DATA_AS_LIVE === false &&
    ER2_LOCKS.LOG_SECRET_VALUES === false &&
    ER2_LOCKS.AUTOMATIC_SCOPE_EXPANSION === false &&
    ER2_LOCKS.CREDENTIAL_REUSE_ACROSS_TENANTS === false &&
    ER2_LOCKS.SCRAPE_FALLBACK_ON_AUTH_FAIL === false &&
    ER2_LOCKS.USE_REVOKED_FOR_NEW_CALLS === false &&
    ER2_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER2_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER2_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER2_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER2_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER2_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER2_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER2_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER2_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER2_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER2_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER2_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER2_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER2_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER2_LOCKS.TIP_LAND === false &&
    ER2_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER2_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER2_LOCKS.FULL_PRODUCTION_API_TRUTH_STATE_MACHINE_SHIPPED === false &&
    ER2_LOCKS.MANAGE_PULL_REQUEST === false &&
    API_TRUTH_BOUNDARY.maySkipStateWithoutEvidence === false &&
    API_TRUTH_BOUNDARY.mayReturnStaleDataAsLive === false &&
    API_TRUTH_BOUNDARY.mayLogSecretValues === false &&
    API_TRUTH_BOUNDARY.revokedImmediatelyBlocksNewCalls === true &&
    ER2_AGENT_BOUNDS.maySkipStateWithoutEvidence === false &&
    ER2_AGENT_BOUNDS.mayReturnStaleDataAsLive === false &&
    ER2_AGENT_BOUNDS.automaticAuthority === false
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

export function er2SoftWireSnapshot(repoRoot?: string): Er2SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er1RealApiConnectionRegistry: softWireFile(
      './real-api-connection-registry-types.ts',
      'ER1 Real API Connection Registry PRESENT (soft-wire).',
      'ER1 Real API Connection Registry absent — soft-wire WAITING_DATA.',
    ),
    er1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER1_REAL_API_CONNECTION_REGISTRY_REPORT.md',
      'ER1 report PRESENT.',
      'ER1 report absent — soft-wire WAITING_DATA.',
    ),
    eq16SoftwareWormholeRouter: softWireFile(
      './software-wormhole-router-types.ts',
      'EQ16 Software Wormhole Router PRESENT (soft-wire).',
      'EQ16 Software Wormhole Router absent — soft-wire WAITING_DATA.',
    ),
    eq16Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ16_SOFTWARE_WORMHOLE_ROUTER_REPORT.md',
      'EQ16 report PRESENT.',
      'EQ16 report absent — soft-wire WAITING_DATA.',
    ),
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

export function isHumanApprover(actor: Er2Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr2Agent(actor: Er2Actor): boolean {
  const agents: readonly Er2ActorKind[] = [
    'api_truth_state_machine',
    'connector_operator',
    'live_data_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/** Next core state in progression, or null if at VERIFIED / not on ladder. */
export function nextCoreState(
  current: ApiTruthState,
): ApiTruthCoreState | null {
  const idx = (API_TRUTH_CORE_PROGRESSION as readonly string[]).indexOf(
    current,
  );
  if (idx < 0 || idx >= API_TRUTH_CORE_PROGRESSION.length - 1) return null;
  return API_TRUTH_CORE_PROGRESSION[idx + 1]!;
}

export function isCoreProgressionStep(
  from: ApiTruthState,
  to: ApiTruthState,
): boolean {
  const fromIdx = (API_TRUTH_CORE_PROGRESSION as readonly string[]).indexOf(
    from,
  );
  const toIdx = (API_TRUTH_CORE_PROGRESSION as readonly string[]).indexOf(to);
  return fromIdx >= 0 && toIdx === fromIdx + 1;
}

export function agentMayUseForWorkload(
  state: ApiTruthState,
  workload: 'normal_approved' | 'bounded_test_research' | 'tests' | 'planning',
): boolean {
  switch (state) {
    case 'VERIFIED':
      return (
        workload === 'normal_approved' ||
        workload === 'bounded_test_research' ||
        workload === 'tests' ||
        workload === 'planning'
      );
    case 'SANDBOX_TESTED':
      return workload === 'bounded_test_research' || workload === 'planning';
    case 'AUTHORIZED':
      return workload === 'tests' || workload === 'planning';
    case 'DOCUMENTED':
    case 'TARGET':
    case 'CONFIGURED':
      return workload === 'planning';
    default:
      return false;
  }
}

export function blocksRealtimeRequirement(state: ApiTruthState): boolean {
  return (
    state === 'DEGRADED' ||
    state === 'STALE' ||
    state === 'REVOKED' ||
    state === 'UNAVAILABLE' ||
    state === 'TARGET' ||
    state === 'DOCUMENTED' ||
    state === 'CONFIGURED' ||
    state === 'AUTHORIZED' ||
    state === 'SANDBOX_TESTED'
  );
}
