/**
 * 62L-ER12 — Live Data Connector Gate (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + … (GitHub #162).
 *
 * Strict live-data verification gate so agents only describe information as
 * real-time when an authorized connector is active, fresh, and successfully
 * returning current data.
 *
 * Core rule: “Real-time” is an evidence state, not a marketing label.
 * Example: expected refresh 1 min, last success 25 min ago → LIVE_VERIFIED
 * becomes STALE; agents must not describe as current.
 *
 * Soft-wire when PRESENT: ER11–ER1 (esp. ER2 API Truth), EQ16, EQ15, EQ14
 * (WAITING_DATA ok), EQ13, EQ12, EP15, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER13 — Online Brain Index.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER12' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER12 Live Data Connector Gate — real-time is evidence; ALLOW/WAIT/FALLBACK/DENY; disclose liveUnavailable' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER12_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER13 — Online Brain Index — combine approved public sources, historical knowledge, and authorized live APIs into one permission-aware searchable online intelligence layer.' as const;

/**
 * Required live-data states.
 */
export const LIVE_DATA_STATES = [
  'LIVE_VERIFIED',
  'NEAR_REAL_TIME',
  'DELAYED',
  'HISTORICAL',
  'STALE',
  'SIMULATED',
  'WAITING_DATA',
  'UNAVAILABLE',
  'UNKNOWN',
] as const;

export type LiveDataState = (typeof LIVE_DATA_STATES)[number];

/**
 * Live connector check fields.
 */
export const LIVE_CONNECTOR_CHECK_FIELDS = [
  'connectionId',
  'provider',
  'authorizationState',
  'scopes',
  'endpointHealth',
  'lastSuccessfulResponse',
  'providerTimestamp',
  'xivReceiptTimestamp',
  'expectedRefreshInterval',
  'schemaVersion',
  'rateLimitState',
  'dataFreshness',
  'tenantUniverseScope',
  'failureState',
  'evidenceRefs',
] as const;

export type LiveConnectorCheckField =
  (typeof LIVE_CONNECTOR_CHECK_FIELDS)[number];

/**
 * Core workflow steps.
 */
export const LIVE_CONNECTOR_WORKFLOW = [
  'agent_requests_live_data',
  'api_registry_lookup',
  'authorization_scope_check',
  'connector_health_check',
  'freshness_check',
  'rate_limit_check',
  'provider_timestamp_validation',
  'gate_decision',
] as const;

export type LiveConnectorWorkflowStep =
  (typeof LIVE_CONNECTOR_WORKFLOW)[number];

export const LIVE_GATE_DECISIONS = [
  'ALLOW',
  'WAIT',
  'FALLBACK',
  'DENY',
] as const;

export type LiveGateDecision = (typeof LIVE_GATE_DECISIONS)[number];

export const LIVE_FALLBACK_TYPES = ['HISTORICAL', 'SIMULATED'] as const;

export type LiveFallbackType = (typeof LIVE_FALLBACK_TYPES)[number];

/**
 * High-value application domains (later-governed feed classes).
 * Each connection remains independently authorized.
 */
export const LIVE_FEED_DOMAINS = [
  'logistics_transportation',
  'weather',
  'ports',
  'government_opportunities',
  'market_economic_indicators',
  'telecom_satellite_telemetry',
  'infrastructure',
  'public_mobility',
  'enterprise_erp_wms_tms',
  'compute_provider_availability',
] as const;

export type LiveFeedDomain = (typeof LIVE_FEED_DOMAINS)[number];

export type AuthorizationState =
  | 'AUTHORIZED'
  | 'UNAUTHORIZED'
  | 'REVOKED'
  | 'UNKNOWN'
  | 'WAITING_DATA';

export type EndpointHealth = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

export type RateLimitState =
  | 'OK'
  | 'THROTTLED'
  | 'EXCEEDED'
  | 'UNKNOWN';

export type FailureState =
  | 'NONE'
  | 'AUTH_FAIL'
  | 'HEALTH_FAIL'
  | 'FRESHNESS_FAIL'
  | 'RATE_LIMIT'
  | 'TIMESTAMP_INVALID'
  | 'SCOPE_FAIL'
  | 'TENANT_FAIL'
  | 'REGISTRY_MISSING'
  | 'UNKNOWN';

/**
 * Fallback disclosure shape — required whenever live is unavailable
 * and historical/simulated is used. Cannot silently substitute.
 */
export type LiveFallbackDisclosure = {
  liveUnavailable: true;
  fallbackType: LiveFallbackType;
  liveDataState: LiveDataState;
  reason: string;
};

export type TenantUniverseScope = {
  orgId: string;
  tenantId: string;
  universeId: string;
};

/**
 * Live connector check record.
 */
export type LiveConnectorCheck = {
  connectionId: string;
  provider: string;
  authorizationState: AuthorizationState;
  scopes: readonly string[];
  endpointHealth: EndpointHealth;
  lastSuccessfulResponse: string | null;
  providerTimestamp: string | null;
  xivReceiptTimestamp: string | null;
  /** Expected refresh interval in milliseconds. */
  expectedRefreshIntervalMs: number;
  schemaVersion: string | null;
  rateLimitState: RateLimitState;
  dataFreshness: LiveDataState;
  tenantUniverseScope: TenantUniverseScope;
  failureState: FailureState;
  evidenceRefs: readonly string[];
  feedDomain: LiveFeedDomain;
  secretValuePresentInLogs: false;
};

/**
 * Neural brain rule: volatile live observations may update pathways but
 * must decay quickly with timestamp/context — never become permanent
 * historical truth without timestamp/context.
 */
export const VOLATILE_DECAY_RULE = Object.freeze({
  volatileObservationsMayUpdatePathways: true as const,
  mustCarryTimestampAndContext: true as const,
  mayBecomePermanentHistoricalTruthWithoutTimestamp: false as const,
  trafficCongestionExampleRequiresDecay: true as const,
  defaultDecayHalfLifeMs: 5 * 60 * 1000,
});

export type VolatileObservation = {
  observationId: string;
  connectionId: string;
  feedDomain: LiveFeedDomain;
  valueSummary: string;
  providerTimestamp: string;
  xivReceiptTimestamp: string;
  context: string;
  halfLifeMs: number;
};

export type VolatileDecayResult = {
  observationId: string;
  decayed: boolean;
  retainedAsPermanentHistoricalTruth: false;
  hasTimestampAndContext: boolean;
  ageMs: number;
  halfLifeMs: number;
  remainingWeight: number;
  note: string;
};

export const LIVE_CONNECTOR_BOUNDARY = Object.freeze({
  realtimeIsEvidenceStateNotMarketingLabel: true as const,
  mayDescribeAsRealtimeWithoutLiveVerified: false as const,
  maySilentlySubstituteStaleAsLive: false as const,
  mayFallbackWithoutDisclosure: false as const,
  mayFallbackToUnauthorizedScraping: false as const,
  mayAutomaticScopeExpansion: false as const,
  mayCredentialSharing: false as const,
  mayPrivateEndpointDiscovery: false as const,
  mayCrossTenantDataLeakage: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  mayPermanentizeVolatileWithoutTimestamp: false as const,
  eachConnectionIndependentlyAuthorized: true as const,
});

export const LIVE_DATA_CONNECTOR_GATE_CYCLE = [
  'honesty_locks',
  'live_data_connector_gate_bootstrap',
  // A — Structure
  'live_states_encoded',
  'check_fields_encoded',
  'workflow_encoded',
  'feed_domains_encoded',
  'fallback_disclosure_shape_encoded',
  'volatile_decay_rule_encoded',
  'live_boundary_encoded',
  // B — Truth
  'freshness_overdue_becomes_stale',
  'realtime_is_evidence_not_label',
  'workflow_allow_wait_fallback_deny',
  'fallback_discloses_live_unavailable',
  'volatile_observation_decays',
  // C — Denies
  'deny_silent_stale_as_live',
  'deny_unauthorized_scraping_fallback',
  'deny_scope_expansion',
  'deny_credential_sharing',
  'deny_private_endpoint_discovery',
  'deny_cross_tenant_data_leakage',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_persist_hidden_chain_of_thought',
  'deny_auto_deploy_changes',
  'deny_permanentize_volatile_without_timestamp',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
  'er11_soft_wire',
  'er10_soft_wire',
  'er9_soft_wire',
  'er8_soft_wire',
  'er7_soft_wire',
  'er6_soft_wire',
  'er5_soft_wire',
  'er4_soft_wire',
  'er3_soft_wire',
  'er2_soft_wire',
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

export type Er12Hop = (typeof LIVE_DATA_CONNECTOR_GATE_CYCLE)[number];

export type Er12EvidenceState =
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
  | 'LIVE_VERIFIED'
  | 'NEAR_REAL_TIME'
  | 'DELAYED'
  | 'HISTORICAL'
  | 'SIMULATED';

export type Er12HopRecord = {
  hop: Er12Hop;
  state: Er12EvidenceState;
  summary: string;
  at: string;
};

export type Er12ActorKind =
  | 'live_data_connector_gate'
  | 'live_data_agent'
  | 'api_registry'
  | 'connector_operator'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er12Actor = {
  kind: Er12ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER12_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_LIVE_DATA_CONNECTOR_GATE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  DESCRIBE_AS_REALTIME_WITHOUT_LIVE_VERIFIED: false as const,
  SILENT_STALE_AS_LIVE: false as const,
  FALLBACK_WITHOUT_DISCLOSURE: false as const,
  UNAUTHORIZED_SCRAPING_FALLBACK: false as const,
  AUTOMATIC_SCOPE_EXPANSION: false as const,
  CREDENTIAL_SHARING: false as const,
  PRIVATE_ENDPOINT_DISCOVERY: false as const,
  CROSS_TENANT_DATA_LEAKAGE: false as const,
  PERMANENTIZE_VOLATILE_WITHOUT_TIMESTAMP: false as const,

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

export const ER12_AGENT_BOUNDS = Object.freeze({
  mayEvaluateLiveConnector: true as const,
  mayAllowWhenLiveVerified: true as const,
  mayWaitWhenNearRealtimeOrDelayed: true as const,
  mayFallbackWithDisclosureWhenTaskPermits: true as const,
  mayDecayVolatileObservations: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  mayDescribeAsRealtimeWithoutLiveVerified: false as const,
  maySilentlySubstituteStaleAsLive: false as const,
  mayFallbackWithoutDisclosure: false as const,
  mayFallbackToUnauthorizedScraping: false as const,
  mayAutomaticScopeExpansion: false as const,
  mayCredentialSharing: false as const,
  mayPrivateEndpointDiscovery: false as const,
  mayCrossTenantDataLeakage: false as const,
  mayPermanentizeVolatileWithoutTimestamp: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER12_MAY = Object.freeze([
  'evaluate_authorized_connectors_for_live_requests',
  'compute_live_state_from_auth_health_freshness_rate_limit_timestamps',
  'allow_only_when_live_verified_and_fresh',
  'wait_or_fallback_with_explicit_liveUnavailable_disclosure',
  'decay_volatile_observations_with_timestamp_and_context',
  'keep_each_feed_domain_connection_independently_authorized',
] as const);

export const ER12_MUST_NOT = Object.freeze([
  'describe_as_realtime_without_live_verified_evidence',
  'silently_substitute_stale_or_historical_as_live',
  'fallback_without_liveUnavailable_and_fallbackType',
  'fallback_to_unauthorized_scraping_when_api_fails',
  'automatic_scope_expansion',
  'credential_sharing',
  'private_endpoint_discovery',
  'cross_tenant_or_universe_data_leakage',
  'permanentize_volatile_observations_without_timestamp_context',
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

export type Er12SoftWireSnapshot = {
  er11PublicGovernmentDataPack: SoftWirePresence;
  er11Report: SoftWirePresence;
  er10PublicGeospatialMobilityPack: SoftWirePresence;
  er10Report: SoftWirePresence;
  er9PublicLawPolicyKnowledgePack: SoftWirePresence;
  er9Report: SoftWirePresence;
  er8PublicResearchKnowledgePack: SoftWirePresence;
  er8Report: SoftWirePresence;
  er7PublicWebKnowledgePack: SoftWirePresence;
  er7Report: SoftWirePresence;
  er6PublicCorpusIngestionPack: SoftWirePresence;
  er6Report: SoftWirePresence;
  er5PublicSourceAllowlist: SoftWirePresence;
  er5Report: SoftWirePresence;
  er4PublicOpenHistoricalDataRegistry: SoftWirePresence;
  er4Report: SoftWirePresence;
  er3PublicDataSourceRegistry: SoftWirePresence;
  er3Report: SoftWirePresence;
  er2ApiTruthStateMachine: SoftWirePresence;
  er2Report: SoftWirePresence;
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

export function assertEr12LocksIntact(): boolean {
  return (
    ER12_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER12_LOCKS.DESCRIBE_AS_REALTIME_WITHOUT_LIVE_VERIFIED === false &&
    ER12_LOCKS.SILENT_STALE_AS_LIVE === false &&
    ER12_LOCKS.FALLBACK_WITHOUT_DISCLOSURE === false &&
    ER12_LOCKS.UNAUTHORIZED_SCRAPING_FALLBACK === false &&
    ER12_LOCKS.AUTOMATIC_SCOPE_EXPANSION === false &&
    ER12_LOCKS.CREDENTIAL_SHARING === false &&
    ER12_LOCKS.PRIVATE_ENDPOINT_DISCOVERY === false &&
    ER12_LOCKS.CROSS_TENANT_DATA_LEAKAGE === false &&
    ER12_LOCKS.PERMANENTIZE_VOLATILE_WITHOUT_TIMESTAMP === false &&
    ER12_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER12_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER12_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER12_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER12_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER12_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER12_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER12_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER12_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER12_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER12_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER12_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER12_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER12_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER12_LOCKS.TIP_LAND === false &&
    ER12_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER12_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER12_LOCKS.FULL_PRODUCTION_LIVE_DATA_CONNECTOR_GATE_SHIPPED === false &&
    ER12_LOCKS.MANAGE_PULL_REQUEST === false &&
    LIVE_CONNECTOR_BOUNDARY.mayDescribeAsRealtimeWithoutLiveVerified ===
      false &&
    LIVE_CONNECTOR_BOUNDARY.maySilentlySubstituteStaleAsLive === false &&
    LIVE_CONNECTOR_BOUNDARY.mayFallbackWithoutDisclosure === false &&
    LIVE_CONNECTOR_BOUNDARY.mayFallbackToUnauthorizedScraping === false &&
    LIVE_CONNECTOR_BOUNDARY.mayPermanentizeVolatileWithoutTimestamp ===
      false &&
    LIVE_CONNECTOR_BOUNDARY.eachConnectionIndependentlyAuthorized === true &&
    VOLATILE_DECAY_RULE.mayBecomePermanentHistoricalTruthWithoutTimestamp ===
      false &&
    ER12_AGENT_BOUNDS.maySilentlySubstituteStaleAsLive === false &&
    ER12_AGENT_BOUNDS.automaticAuthority === false
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

export function er12SoftWireSnapshot(repoRoot?: string): Er12SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er11PublicGovernmentDataPack: softWireFile(
      './public-government-data-pack-types.ts',
      'ER11 Public Government Data Pack PRESENT (soft-wire).',
      'ER11 Public Government Data Pack absent — soft-wire WAITING_DATA.',
    ),
    er11Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER11_PUBLIC_GOVERNMENT_DATA_PACK_REPORT.md',
      'ER11 report PRESENT.',
      'ER11 report absent — soft-wire WAITING_DATA.',
    ),
    er10PublicGeospatialMobilityPack: softWireFile(
      './public-geospatial-mobility-pack-types.ts',
      'ER10 Public Geospatial Mobility Pack PRESENT (soft-wire).',
      'ER10 Public Geospatial Mobility Pack absent — soft-wire WAITING_DATA.',
    ),
    er10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER10_PUBLIC_GEOSPATIAL_MOBILITY_PACK_REPORT.md',
      'ER10 report PRESENT.',
      'ER10 report absent — soft-wire WAITING_DATA.',
    ),
    er9PublicLawPolicyKnowledgePack: softWireFile(
      './public-law-policy-knowledge-pack-types.ts',
      'ER9 Public Law/Policy Knowledge Pack PRESENT (soft-wire).',
      'ER9 Public Law/Policy Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    er9Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER9_PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_REPORT.md',
      'ER9 report PRESENT.',
      'ER9 report absent — soft-wire WAITING_DATA.',
    ),
    er8PublicResearchKnowledgePack: softWireFile(
      './public-research-knowledge-pack-types.ts',
      'ER8 Public Research Knowledge Pack PRESENT (soft-wire).',
      'ER8 Public Research Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    er8Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER8_PUBLIC_RESEARCH_KNOWLEDGE_PACK_REPORT.md',
      'ER8 report PRESENT.',
      'ER8 report absent — soft-wire WAITING_DATA.',
    ),
    er7PublicWebKnowledgePack: softWireFile(
      './public-web-knowledge-pack-types.ts',
      'ER7 Public Web Knowledge Pack PRESENT (soft-wire).',
      'ER7 Public Web Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    er7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER7_PUBLIC_WEB_KNOWLEDGE_PACK_REPORT.md',
      'ER7 report PRESENT.',
      'ER7 report absent — soft-wire WAITING_DATA.',
    ),
    er6PublicCorpusIngestionPack: softWireFile(
      './public-corpus-ingestion-pack-types.ts',
      'ER6 Public Corpus Ingestion Pack PRESENT (soft-wire).',
      'ER6 Public Corpus Ingestion Pack absent — soft-wire WAITING_DATA.',
    ),
    er6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER6_PUBLIC_CORPUS_INGESTION_PACK_REPORT.md',
      'ER6 report PRESENT.',
      'ER6 report absent — soft-wire WAITING_DATA.',
    ),
    er5PublicSourceAllowlist: softWireFile(
      './public-source-allowlist-types.ts',
      'ER5 Public Source Allowlist PRESENT (soft-wire).',
      'ER5 Public Source Allowlist absent — soft-wire WAITING_DATA.',
    ),
    er5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER5_PUBLIC_SOURCE_ALLOWLIST_REPORT.md',
      'ER5 report PRESENT.',
      'ER5 report absent — soft-wire WAITING_DATA.',
    ),
    er4PublicOpenHistoricalDataRegistry: softWireFile(
      './public-open-historical-data-registry-types.ts',
      'ER4 Public/Open Historical Data Registry PRESENT (soft-wire).',
      'ER4 Public/Open Historical Data Registry absent — soft-wire WAITING_DATA.',
    ),
    er4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER4_PUBLIC_OPEN_HISTORICAL_DATA_REGISTRY_REPORT.md',
      'ER4 report PRESENT.',
      'ER4 report absent — soft-wire WAITING_DATA.',
    ),
    er3PublicDataSourceRegistry: softWireFile(
      './public-data-source-registry-types.ts',
      'ER3 Public Data Source Registry PRESENT (soft-wire).',
      'ER3 Public Data Source Registry absent — soft-wire WAITING_DATA.',
    ),
    er3Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER3_PUBLIC_DATA_SOURCE_REGISTRY_REPORT.md',
      'ER3 report PRESENT.',
      'ER3 report absent — soft-wire WAITING_DATA.',
    ),
    er2ApiTruthStateMachine: softWireFile(
      './api-truth-state-machine-types.ts',
      'ER2 API Truth State Machine PRESENT (soft-wire — strong relation).',
      'ER2 API Truth State Machine absent — soft-wire WAITING_DATA.',
    ),
    er2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER2_API_TRUTH_STATE_MACHINE_REPORT.md',
      'ER2 report PRESENT.',
      'ER2 report absent — soft-wire WAITING_DATA.',
    ),
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

export function isHumanApprover(actor: Er12Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr12Agent(actor: Er12Actor): boolean {
  const agents: readonly Er12ActorKind[] = [
    'live_data_connector_gate',
    'live_data_agent',
    'api_registry',
    'connector_operator',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Compute live-data freshness from expected refresh vs age of last success.
 * Example: expected 1 min, last success 25 min ago → STALE.
 */
export function computeLiveFreshness(input: {
  lastSuccessfulResponse: string | null;
  expectedRefreshIntervalMs: number;
  nowMs?: number;
}): LiveDataState {
  if (!input.lastSuccessfulResponse || input.expectedRefreshIntervalMs <= 0) {
    return 'UNKNOWN';
  }
  const last = Date.parse(input.lastSuccessfulResponse);
  if (Number.isNaN(last)) return 'UNKNOWN';
  const now = input.nowMs ?? Date.now();
  const age = now - last;
  const expected = input.expectedRefreshIntervalMs;
  if (age < 0) return 'UNKNOWN';
  if (age <= expected) return 'LIVE_VERIFIED';
  if (age <= expected * 2) return 'NEAR_REAL_TIME';
  if (age <= expected * 5) return 'DELAYED';
  return 'STALE';
}

export function mayDescribeAsRealtime(state: LiveDataState): boolean {
  return state === 'LIVE_VERIFIED';
}
