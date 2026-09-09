/**
 * 62L-ER1 — Real API Connection Registry (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * ER1 defines how XIV tracks real providers, endpoints, credential/scope refs,
 * rate limits, data rights, authorization, health, and revocation before
 * agents are allowed to use live data.
 *
 * Critical rules:
 * - Registry appearance = DOCUMENTED until authorized + rights-checked + healthy.
 * - Registry entry ≠ live-use authorization.
 * - Credential refs / scopes only — never harvest or persist raw secrets.
 * - Agents cannot use live data until connection is AUTHORIZED_LIVE and not revoked.
 * - Guardian/RLS/tenant/Universe boundaries unchanged.
 *
 * Soft-wire when PRESENT: EQ16, EQ15, EQ13, EQ12, EP15, EM (#157).
 * EQ14 may be WAITING_DATA. Presence ≠ VERIFIED.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER2 — Public/Open Historical Data Registry.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER1' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER1 Real API Connection Registry — providers/endpoints/scopes/rate-limits/rights/auth/health/revocation before live data use' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER1_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

/** Broader layer context from founder / #162 (report + honesty only). */
export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER2 — Public/Open Historical Data Registry — catalog public/open/licensed historical corpora with provenance and rights before ingestion.' as const;

/**
 * Fields tracked per real API connection.
 */
export const API_CONNECTION_REGISTRY_FIELDS = [
  'connectionId',
  'provider',
  'endpoint',
  'credentialRef',
  'scopes',
  'rateLimit',
  'dataRights',
  'authorization',
  'health',
  'revocation',
] as const;

export type ApiConnectionRegistryField =
  (typeof API_CONNECTION_REGISTRY_FIELDS)[number];

/**
 * Connection lifecycle before live use.
 */
export const API_CONNECTION_STATES = [
  'REGISTERED',
  'DOCUMENTED',
  'RIGHTS_CHECKED',
  'AUTHORIZED_LIVE',
  'DEGRADED',
  'REVOKED',
  'DENIED',
] as const;

export type ApiConnectionState = (typeof API_CONNECTION_STATES)[number];

/**
 * Health probe outcomes.
 */
export const API_CONNECTION_HEALTH_STATES = [
  'UNKNOWN',
  'HEALTHY',
  'DEGRADED',
  'UNREACHABLE',
  'RATE_LIMITED',
  'AUTH_FAILED',
] as const;

export type ApiConnectionHealthState =
  (typeof API_CONNECTION_HEALTH_STATES)[number];

/**
 * Data-rights classifications for live connectors.
 */
export const API_DATA_RIGHTS_CLASSES = [
  'PUBLIC_OPEN',
  'LICENSED',
  'AUTHORIZED_PRIVATE',
  'TENANT_SCOPED',
  'UNKNOWN_RIGHTS',
] as const;

export type ApiDataRightsClass = (typeof API_DATA_RIGHTS_CLASSES)[number];

/**
 * Preconditions before an agent may use live data from a connection.
 */
export const LIVE_DATA_USE_PRECONDITIONS = [
  'connection_registered',
  'endpoint_documented',
  'credential_ref_present_not_raw_secret',
  'scopes_declared',
  'rate_limit_declared',
  'data_rights_known_and_allowed',
  'authorization_granted',
  'health_ok',
  'not_revoked',
  'tenant_universe_scope_match',
] as const;

export type LiveDataUsePrecondition =
  (typeof LIVE_DATA_USE_PRECONDITIONS)[number];

/**
 * Core registry flow.
 */
export const API_CONNECTION_REGISTRY_FLOW = [
  'register_provider_endpoint',
  'attach_credential_ref_and_scopes',
  'declare_rate_limits_and_data_rights',
  'authorization_gate',
  'health_probe',
  'allow_or_deny_live_use',
  'revoke_or_refresh',
  'receipt_to_home_base',
] as const;

export type ApiRateLimit = {
  requestsPerMinute: number;
  burst: number;
  quotaPeriod: 'minute' | 'hour' | 'day';
  remainingKnown: boolean;
};

export type ApiConnectionRecord = {
  connectionId: string;
  provider: string;
  endpoint: string;
  /** Opaque vault/ref id — never a raw secret. */
  credentialRef: string | null;
  scopes: readonly string[];
  rateLimit: ApiRateLimit | null;
  dataRights: ApiDataRightsClass;
  authorization: boolean;
  health: ApiConnectionHealthState;
  revoked: boolean;
  revocationReason: string | null;
  state: ApiConnectionState;
  orgId: string;
  tenantId: string;
  universeId: string;
  evidenceRefs: readonly string[];
  rawSecretPresent: false;
};

/**
 * Truth: registry ≠ live use; credentials are refs only.
 */
export const API_CONNECTION_TRUTH_BOUNDARY = Object.freeze({
  registryAppearanceMeansDocumentedOnly: true as const,
  registryEntryEqLiveUseAuthorized: false as const,
  mayStoreRawSecretsInRegistry: false as const,
  mayHarvestCredentials: false as const,
  mayUseLiveDataWithoutPreconditions: false as const,
  unknownRightsEqAllowed: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  mayAutonomousSpendOrProvision: false as const,
});

export const REAL_API_CONNECTION_REGISTRY_CYCLE = [
  'honesty_locks',
  'real_api_connection_registry_bootstrap',
  // A — Structure
  'registry_fields_encoded',
  'connection_states_encoded',
  'health_states_encoded',
  'data_rights_classes_encoded',
  'live_use_preconditions_encoded',
  'registry_flow_encoded',
  'truth_boundary_registry_neq_live',
  // B — Truth
  'register_provider_endpoint_documented',
  'credential_ref_not_raw_secret',
  'live_use_requires_all_preconditions',
  'unknown_rights_denies_live_use',
  'revocation_blocks_live_use',
  'health_failure_blocks_or_degrades',
  // C — Denies
  'deny_live_use_without_authorization',
  'deny_store_raw_secrets',
  'deny_credential_harvesting',
  'deny_unknown_rights_as_allowed',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_persist_hidden_chain_of_thought',
  'deny_auto_deploy_changes',
  'deny_autonomous_spend_or_provision',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires + ER layer note
  'er_layer_context_documented',
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

export type Er1Hop = (typeof REAL_API_CONNECTION_REGISTRY_CYCLE)[number];

export type Er1EvidenceState =
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
  | 'AUTHORIZED_LIVE'
  | 'REVOKED';

export type Er1HopRecord = {
  hop: Er1Hop;
  state: Er1EvidenceState;
  summary: string;
  at: string;
};

export type Er1ActorKind =
  | 'api_connection_registry'
  | 'live_data_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er1Actor = {
  kind: Er1ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER1_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_API_CONNECTION_REGISTRY_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Registry truth
  REGISTRY_ENTRY_EQ_LIVE_USE: false as const,
  LIVE_USE_WITHOUT_PRECONDITIONS: false as const,
  UNKNOWN_RIGHTS_EQ_ALLOWED: false as const,
  STORE_RAW_SECRETS_IN_REGISTRY: false as const,
  CREDENTIAL_HARVESTING: false as const,
  AUTONOMOUS_SPEND_OR_PROVISION: false as const,
  USE_REVOKED_CONNECTION: false as const,

  // Isolation / autonomy
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

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const ER1_AGENT_BOUNDS = Object.freeze({
  mayRegisterDocumentedConnections: true as const,
  mayAttachCredentialRefsAndScopes: true as const,
  mayProbeHealthAndRateLimits: true as const,
  mayUseLiveDataWhenPreconditionsMet: true as const,
  mayRevokeConnections: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  mayStoreRawSecrets: false as const,
  mayHarvestCredentials: false as const,
  mayUseLiveDataWithoutPreconditions: false as const,
  mayTreatUnknownRightsAsAllowed: false as const,
  mayUseRevokedConnection: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  mayAutonomousSpendOrProvision: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER1_MAY = Object.freeze([
  'register_providers_endpoints_as_documented',
  'track_credential_refs_scopes_rate_limits_rights_auth_health_revocation',
  'allow_live_data_use_only_when_all_preconditions_met',
  'revoke_or_degrade_connections_on_health_or_rights_failure',
  'return_connection_receipts_to_home_base',
] as const);

export const ER1_MUST_NOT = Object.freeze([
  'treat_registry_entry_as_live_use_authorization',
  'store_or_harvest_raw_secrets_in_registry',
  'use_live_data_without_preconditions',
  'treat_unknown_rights_as_allowed',
  'use_revoked_connections',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'autonomous_spend_or_provision_from_registry',
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

export type Er1SoftWireSnapshot = {
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

export function assertEr1LocksIntact(): boolean {
  return (
    ER1_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER1_LOCKS.REGISTRY_ENTRY_EQ_LIVE_USE === false &&
    ER1_LOCKS.LIVE_USE_WITHOUT_PRECONDITIONS === false &&
    ER1_LOCKS.UNKNOWN_RIGHTS_EQ_ALLOWED === false &&
    ER1_LOCKS.STORE_RAW_SECRETS_IN_REGISTRY === false &&
    ER1_LOCKS.CREDENTIAL_HARVESTING === false &&
    ER1_LOCKS.AUTONOMOUS_SPEND_OR_PROVISION === false &&
    ER1_LOCKS.USE_REVOKED_CONNECTION === false &&
    ER1_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER1_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER1_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER1_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER1_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER1_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER1_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER1_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER1_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER1_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER1_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER1_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER1_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER1_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER1_LOCKS.TIP_LAND === false &&
    ER1_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER1_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER1_LOCKS.FULL_PRODUCTION_API_CONNECTION_REGISTRY_SHIPPED === false &&
    ER1_LOCKS.MANAGE_PULL_REQUEST === false &&
    API_CONNECTION_TRUTH_BOUNDARY.registryEntryEqLiveUseAuthorized === false &&
    API_CONNECTION_TRUTH_BOUNDARY.mayStoreRawSecretsInRegistry === false &&
    API_CONNECTION_TRUTH_BOUNDARY.mayHarvestCredentials === false &&
    API_CONNECTION_TRUTH_BOUNDARY.unknownRightsEqAllowed === false &&
    ER1_AGENT_BOUNDS.mayStoreRawSecrets === false &&
    ER1_AGENT_BOUNDS.mayHarvestCredentials === false &&
    ER1_AGENT_BOUNDS.mayUseLiveDataWithoutPreconditions === false &&
    ER1_AGENT_BOUNDS.automaticAuthority === false
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

export function er1SoftWireSnapshot(repoRoot?: string): Er1SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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

export function isHumanApprover(actor: Er1Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr1Agent(actor: Er1Actor): boolean {
  const agents: readonly Er1ActorKind[] = [
    'api_connection_registry',
    'live_data_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function registryEntryMeansLiveUse(): false {
  return false;
}

export function unknownRightsAllowed(): false {
  return false;
}

export function evaluateLiveUsePreconditions(conn: ApiConnectionRecord): {
  ok: boolean;
  missing: LiveDataUsePrecondition[];
} {
  const missing: LiveDataUsePrecondition[] = [];
  if (!conn.connectionId) missing.push('connection_registered');
  if (!conn.endpoint) missing.push('endpoint_documented');
  if (!conn.credentialRef || conn.rawSecretPresent) {
    missing.push('credential_ref_present_not_raw_secret');
  }
  if (conn.scopes.length === 0) missing.push('scopes_declared');
  if (!conn.rateLimit) missing.push('rate_limit_declared');
  if (
    conn.dataRights === 'UNKNOWN_RIGHTS' ||
    ER1_LOCKS.UNKNOWN_RIGHTS_EQ_ALLOWED === true
  ) {
    missing.push('data_rights_known_and_allowed');
  }
  if (!conn.authorization) missing.push('authorization_granted');
  if (conn.health !== 'HEALTHY') missing.push('health_ok');
  if (conn.revoked) missing.push('not_revoked');
  if (!conn.tenantId || !conn.universeId) {
    missing.push('tenant_universe_scope_match');
  }
  return { ok: missing.length === 0, missing };
}
