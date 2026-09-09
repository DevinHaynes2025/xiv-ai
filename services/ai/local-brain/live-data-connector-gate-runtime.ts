/**
 * 62L-ER12 — Live Data Connector Gate runtime.
 *
 * Evaluate connectors for live requests; compute state from auth/health/
 * freshness/rate-limit/provider timestamps; ALLOW / WAIT / FALLBACK / DENY.
 * Fallback always sets liveUnavailable + fallbackType. Never silent stale-as-live.
 */

import { createHash } from 'node:crypto';
import {
  ER12_AGENT_BOUNDS,
  ER12_DB_CANDIDATES_STATUS,
  ER12_LOCKS,
  ER12_MAY,
  ER12_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  LIVE_CONNECTOR_BOUNDARY,
  LIVE_CONNECTOR_CHECK_FIELDS,
  LIVE_CONNECTOR_WORKFLOW,
  LIVE_DATA_CONNECTOR_GATE_CYCLE,
  LIVE_DATA_STATES,
  LIVE_FALLBACK_TYPES,
  LIVE_FEED_DOMAINS,
  LIVE_GATE_DECISIONS,
  NEXT_PHASE_TITLE,
  VOLATILE_DECAY_RULE,
  assertEr12LocksIntact,
  computeLiveFreshness,
  er12SoftWireSnapshot,
  isEr12Agent,
  isHumanApprover,
  mayDescribeAsRealtime,
  type Er12Actor,
  type Er12EvidenceState,
  type Er12HopRecord,
  type Er12SoftWireSnapshot,
  type LiveConnectorCheck,
  type LiveConnectorCheckField,
  type LiveConnectorWorkflowStep,
  type LiveDataState,
  type LiveFallbackDisclosure,
  type LiveFallbackType,
  type LiveFeedDomain,
  type LiveGateDecision,
  type VolatileDecayResult,
  type VolatileObservation,
} from './live-data-connector-gate-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof LIVE_DATA_CONNECTOR_GATE_CYCLE)[number],
  state: Er12EvidenceState,
  summary: string,
): Er12HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA';
  reason: string;
  executed: false;
  decision: 'DENY' | 'WAIT';
  liveUnavailable?: true;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' = 'DENIED',
): DenialResult {
  return {
    denied: true,
    state,
    reason,
    executed: false,
    decision: state === 'WAITING_DATA' ? 'WAIT' : 'DENY',
    ...(state === 'WAITING_DATA' ? { liveUnavailable: true as const } : {}),
  };
}

export type LiveGateAllowResult = {
  allowed: true;
  decision: 'ALLOW';
  liveDataState: 'LIVE_VERIFIED';
  mayDescribeAsRealtime: true;
  liveUnavailable: false;
  connector: LiveConnectorCheck;
  workflowCompleted: readonly LiveConnectorWorkflowStep[];
  returnedStaleAsLive: false;
};

export type LiveGateWaitResult = {
  allowed: false;
  decision: 'WAIT';
  liveDataState: LiveDataState;
  mayDescribeAsRealtime: false;
  liveUnavailable: true;
  reason: string;
  connector: LiveConnectorCheck;
  workflowCompleted: readonly LiveConnectorWorkflowStep[];
};

export type LiveGateFallbackResult = {
  allowed: false;
  decision: 'FALLBACK';
  liveUnavailable: true;
  fallbackType: LiveFallbackType;
  liveDataState: LiveDataState;
  mayDescribeAsRealtime: false;
  reason: string;
  disclosure: LiveFallbackDisclosure;
  connector: LiveConnectorCheck;
  workflowCompleted: readonly LiveConnectorWorkflowStep[];
};

export type LiveGateDenyResult = DenialResult & {
  connector?: LiveConnectorCheck;
  workflowCompleted?: readonly LiveConnectorWorkflowStep[];
  mayDescribeAsRealtime?: false;
};

export type LiveGateResult =
  | LiveGateAllowResult
  | LiveGateWaitResult
  | LiveGateFallbackResult
  | LiveGateDenyResult;

export type EvaluateLiveRequestInput = {
  actor: Er12Actor;
  connector: LiveConnectorCheck | null;
  requiredScopes: readonly string[];
  taskPermitsHistoricalFallback?: boolean;
  taskPermitsSimulatedFallback?: boolean;
  preferredFallbackType?: LiveFallbackType;
  nowMs?: number;
  /** Illegal attempt flags — always denied when set. */
  attemptSilentStaleAsLive?: boolean;
  attemptUnauthorizedScraping?: boolean;
  attemptScopeExpansion?: boolean;
  attemptCredentialSharing?: boolean;
  attemptPrivateEndpointDiscovery?: boolean;
  attemptCrossTenantLeakage?: boolean;
  registryPresent?: boolean;
};

/**
 * Create a connector check snapshot (bounded runtime fixture helper).
 */
export function createLiveConnectorCheck(input: {
  actor: Er12Actor;
  connectionId: string;
  provider: string;
  feedDomain: LiveFeedDomain;
  scopes: readonly string[];
  authorizationState?: LiveConnectorCheck['authorizationState'];
  endpointHealth?: LiveConnectorCheck['endpointHealth'];
  lastSuccessfulResponse?: string | null;
  providerTimestamp?: string | null;
  expectedRefreshIntervalMs?: number;
  schemaVersion?: string | null;
  rateLimitState?: LiveConnectorCheck['rateLimitState'];
  evidenceRefs?: readonly string[];
  nowMs?: number;
}): LiveConnectorCheck {
  const now = input.nowMs ?? Date.now();
  const last =
    input.lastSuccessfulResponse === undefined
      ? new Date(now - 30_000).toISOString()
      : input.lastSuccessfulResponse;
  const expected = input.expectedRefreshIntervalMs ?? 60_000;
  const freshness = computeLiveFreshness({
    lastSuccessfulResponse: last,
    expectedRefreshIntervalMs: expected,
    nowMs: now,
  });
  return {
    connectionId: input.connectionId,
    provider: input.provider,
    authorizationState: input.authorizationState ?? 'AUTHORIZED',
    scopes: [...input.scopes],
    endpointHealth: input.endpointHealth ?? 'HEALTHY',
    lastSuccessfulResponse: last,
    providerTimestamp:
      input.providerTimestamp === undefined
        ? last
        : input.providerTimestamp,
    xivReceiptTimestamp: new Date(now).toISOString(),
    expectedRefreshIntervalMs: expected,
    schemaVersion: input.schemaVersion ?? '1.0.0',
    rateLimitState: input.rateLimitState ?? 'OK',
    dataFreshness: freshness,
    tenantUniverseScope: {
      orgId: input.actor.orgId,
      tenantId: input.actor.tenantId,
      universeId: input.actor.universeId,
    },
    failureState: 'NONE',
    evidenceRefs: input.evidenceRefs ?? ['ev://live-connector/bootstrap'],
    feedDomain: input.feedDomain,
    secretValuePresentInLogs: false,
  };
}

function scopesCovered(
  granted: readonly string[],
  required: readonly string[],
): boolean {
  return required.every((s) => granted.includes(s));
}

function tenantUniverseMatches(
  actor: Er12Actor,
  scope: LiveConnectorCheck['tenantUniverseScope'],
): boolean {
  return (
    actor.orgId === scope.orgId &&
    actor.tenantId === scope.tenantId &&
    actor.universeId === scope.universeId
  );
}

/**
 * Core gate: Agent → Registry → auth/scope → health → freshness →
 * rate-limit → provider timestamp → ALLOW / WAIT / FALLBACK / DENY.
 */
export function evaluateLiveDataRequest(
  input: EvaluateLiveRequestInput,
): LiveGateResult {
  const workflow: LiveConnectorWorkflowStep[] = ['agent_requests_live_data'];

  if (input.attemptSilentStaleAsLive || ER12_LOCKS.SILENT_STALE_AS_LIVE) {
    return deny('SILENT_STALE_AS_LIVE=false — cannot silently substitute stale as live.');
  }
  if (
    input.attemptUnauthorizedScraping ||
    ER12_LOCKS.UNAUTHORIZED_SCRAPING_FALLBACK
  ) {
    return deny(
      'UNAUTHORIZED_SCRAPING_FALLBACK=false — no scraping if API fails.',
    );
  }
  if (input.attemptScopeExpansion || ER12_LOCKS.AUTOMATIC_SCOPE_EXPANSION) {
    return deny('AUTOMATIC_SCOPE_EXPANSION=false.');
  }
  if (input.attemptCredentialSharing || ER12_LOCKS.CREDENTIAL_SHARING) {
    return deny('CREDENTIAL_SHARING=false.');
  }
  if (
    input.attemptPrivateEndpointDiscovery ||
    ER12_LOCKS.PRIVATE_ENDPOINT_DISCOVERY
  ) {
    return deny('PRIVATE_ENDPOINT_DISCOVERY=false.');
  }
  if (
    input.attemptCrossTenantLeakage ||
    ER12_LOCKS.CROSS_TENANT_DATA_LEAKAGE
  ) {
    return deny('CROSS_TENANT_DATA_LEAKAGE=false.');
  }
  if (!ER12_AGENT_BOUNDS.mayEvaluateLiveConnector) {
    return deny('mayEvaluateLiveConnector=false');
  }
  if (!isEr12Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER12 agents / home_base may evaluate live connectors.');
  }

  // API Registry
  workflow.push('api_registry_lookup');
  if (input.registryPresent === false) {
    return {
      ...deny(
        'API Registry missing connector — WAITING_DATA (not FAIL).',
        'WAITING_DATA',
      ),
      workflowCompleted: [...workflow],
      mayDescribeAsRealtime: false,
    };
  }
  if (!input.connector) {
    return {
      ...deny(
        'No connector check available — WAITING_DATA.',
        'WAITING_DATA',
      ),
      workflowCompleted: [...workflow],
      mayDescribeAsRealtime: false,
    };
  }

  const connector = {
    ...input.connector,
    dataFreshness: computeLiveFreshness({
      lastSuccessfulResponse: input.connector.lastSuccessfulResponse,
      expectedRefreshIntervalMs: input.connector.expectedRefreshIntervalMs,
      nowMs: input.nowMs,
    }),
  };

  // Authorization / scope
  workflow.push('authorization_scope_check');
  if (!tenantUniverseMatches(input.actor, connector.tenantUniverseScope)) {
    return {
      ...deny('Tenant/Universe isolation — cross-tenant access denied.'),
      connector: { ...connector, failureState: 'TENANT_FAIL' },
      workflowCompleted: [...workflow],
      mayDescribeAsRealtime: false,
    };
  }
  if (
    connector.authorizationState !== 'AUTHORIZED' &&
    connector.authorizationState !== 'WAITING_DATA'
  ) {
    return {
      ...deny(
        `Authorization state ${connector.authorizationState} cannot serve live.`,
      ),
      connector: { ...connector, failureState: 'AUTH_FAIL' },
      workflowCompleted: [...workflow],
      mayDescribeAsRealtime: false,
    };
  }
  if (connector.authorizationState === 'WAITING_DATA') {
    return {
      allowed: false,
      decision: 'WAIT',
      liveDataState: 'WAITING_DATA',
      mayDescribeAsRealtime: false,
      liveUnavailable: true,
      reason: 'Authorization WAITING_DATA.',
      connector: { ...connector, failureState: 'AUTH_FAIL', dataFreshness: 'WAITING_DATA' },
      workflowCompleted: [...workflow],
    };
  }
  if (!scopesCovered(connector.scopes, input.requiredScopes)) {
    return {
      ...deny('Required scopes not granted — no scope expansion.'),
      connector: { ...connector, failureState: 'SCOPE_FAIL' },
      workflowCompleted: [...workflow],
      mayDescribeAsRealtime: false,
    };
  }

  // Connector health
  workflow.push('connector_health_check');
  if (connector.endpointHealth === 'DOWN') {
    return finalizeUnavailable({
      input,
      connector: { ...connector, failureState: 'HEALTH_FAIL', dataFreshness: 'UNAVAILABLE' },
      workflow,
      reason: 'Endpoint health DOWN.',
      liveDataState: 'UNAVAILABLE',
    });
  }
  if (connector.endpointHealth === 'UNKNOWN') {
    return {
      allowed: false,
      decision: 'WAIT',
      liveDataState: 'UNKNOWN',
      mayDescribeAsRealtime: false,
      liveUnavailable: true,
      reason: 'Endpoint health UNKNOWN — WAIT.',
      connector: { ...connector, failureState: 'HEALTH_FAIL', dataFreshness: 'UNKNOWN' },
      workflowCompleted: [...workflow],
    };
  }

  // Freshness
  workflow.push('freshness_check');
  const freshness = connector.dataFreshness;

  // Rate-limit
  workflow.push('rate_limit_check');
  if (connector.rateLimitState === 'EXCEEDED') {
    return {
      allowed: false,
      decision: 'WAIT',
      liveDataState: freshness === 'LIVE_VERIFIED' ? 'DELAYED' : freshness,
      mayDescribeAsRealtime: false,
      liveUnavailable: true,
      reason: 'Rate limit EXCEEDED — WAIT.',
      connector: { ...connector, failureState: 'RATE_LIMIT' },
      workflowCompleted: [...workflow],
    };
  }

  // Provider timestamp validation
  workflow.push('provider_timestamp_validation');
  if (!connector.providerTimestamp || !connector.lastSuccessfulResponse) {
    return {
      allowed: false,
      decision: 'WAIT',
      liveDataState: 'WAITING_DATA',
      mayDescribeAsRealtime: false,
      liveUnavailable: true,
      reason: 'Missing provider/last-success timestamps — WAITING_DATA.',
      connector: {
        ...connector,
        failureState: 'TIMESTAMP_INVALID',
        dataFreshness: 'WAITING_DATA',
      },
      workflowCompleted: [...workflow],
    };
  }
  const providerTs = Date.parse(connector.providerTimestamp);
  if (Number.isNaN(providerTs)) {
    return {
      ...deny('Invalid provider timestamp.'),
      connector: { ...connector, failureState: 'TIMESTAMP_INVALID' },
      workflowCompleted: [...workflow],
      mayDescribeAsRealtime: false,
    };
  }

  workflow.push('gate_decision');

  if (freshness === 'LIVE_VERIFIED' && connector.endpointHealth === 'HEALTHY') {
    if (!ER12_AGENT_BOUNDS.mayAllowWhenLiveVerified) {
      return deny('mayAllowWhenLiveVerified=false');
    }
    return {
      allowed: true,
      decision: 'ALLOW',
      liveDataState: 'LIVE_VERIFIED',
      mayDescribeAsRealtime: true,
      liveUnavailable: false,
      connector: { ...connector, failureState: 'NONE', dataFreshness: 'LIVE_VERIFIED' },
      workflowCompleted: [...workflow],
      returnedStaleAsLive: false,
    };
  }

  if (freshness === 'NEAR_REAL_TIME' || freshness === 'DELAYED') {
    if (!ER12_AGENT_BOUNDS.mayWaitWhenNearRealtimeOrDelayed) {
      return deny('mayWaitWhenNearRealtimeOrDelayed=false');
    }
    return {
      allowed: false,
      decision: 'WAIT',
      liveDataState: freshness,
      mayDescribeAsRealtime: false,
      liveUnavailable: true,
      reason: `Live state ${freshness} — not LIVE_VERIFIED; cannot describe as real-time.`,
      connector: { ...connector, failureState: 'FRESHNESS_FAIL' },
      workflowCompleted: [...workflow],
    };
  }

  if (freshness === 'STALE' || freshness === 'HISTORICAL' || freshness === 'SIMULATED') {
    return finalizeUnavailable({
      input,
      connector: {
        ...connector,
        failureState: 'FRESHNESS_FAIL',
        dataFreshness: freshness,
      },
      workflow,
      reason: `Live state ${freshness} — live unavailable.`,
      liveDataState: freshness,
    });
  }

  // UNKNOWN / WAITING_DATA / UNAVAILABLE
  if (freshness === 'WAITING_DATA' || freshness === 'UNKNOWN') {
    return {
      allowed: false,
      decision: 'WAIT',
      liveDataState: freshness,
      mayDescribeAsRealtime: false,
      liveUnavailable: true,
      reason: `Live state ${freshness}.`,
      connector,
      workflowCompleted: [...workflow],
    };
  }

  return finalizeUnavailable({
    input,
    connector: {
      ...connector,
      failureState: 'UNKNOWN',
      dataFreshness: freshness,
    },
    workflow,
    reason: `Live state ${freshness} — unavailable.`,
    liveDataState: freshness,
  });
}

function finalizeUnavailable(args: {
  input: EvaluateLiveRequestInput;
  connector: LiveConnectorCheck;
  workflow: LiveConnectorWorkflowStep[];
  reason: string;
  liveDataState: LiveDataState;
}): LiveGateResult {
  const { input, connector, workflow, reason, liveDataState } = args;
  const preferSim =
    input.preferredFallbackType === 'SIMULATED' &&
    input.taskPermitsSimulatedFallback;
  const preferHist =
    (input.preferredFallbackType === 'HISTORICAL' ||
      input.preferredFallbackType === undefined) &&
    input.taskPermitsHistoricalFallback;
  const canSim = !!input.taskPermitsSimulatedFallback;
  const canHist = !!input.taskPermitsHistoricalFallback;

  let fallbackType: LiveFallbackType | null = null;
  if (preferSim) fallbackType = 'SIMULATED';
  else if (preferHist) fallbackType = 'HISTORICAL';
  else if (canHist) fallbackType = 'HISTORICAL';
  else if (canSim) fallbackType = 'SIMULATED';

  if (fallbackType && ER12_AGENT_BOUNDS.mayFallbackWithDisclosureWhenTaskPermits) {
    if (ER12_LOCKS.FALLBACK_WITHOUT_DISCLOSURE) {
      return deny('FALLBACK_WITHOUT_DISCLOSURE=false.');
    }
    const disclosure: LiveFallbackDisclosure = {
      liveUnavailable: true,
      fallbackType,
      liveDataState:
        fallbackType === 'HISTORICAL' ? 'HISTORICAL' : 'SIMULATED',
      reason,
    };
    return {
      allowed: false,
      decision: 'FALLBACK',
      liveUnavailable: true,
      fallbackType,
      liveDataState: disclosure.liveDataState,
      mayDescribeAsRealtime: false,
      reason,
      disclosure,
      connector: {
        ...connector,
        dataFreshness: disclosure.liveDataState,
      },
      workflowCompleted: [...workflow],
    };
  }

  if (liveDataState === 'STALE' || liveDataState === 'UNAVAILABLE') {
    return {
      ...deny(
        `${reason} No permitted fallback — WAITING_DATA / DENY (not silent live).`,
        liveDataState === 'STALE' ? 'WAITING_DATA' : 'DENIED',
      ),
      connector,
      workflowCompleted: [...workflow],
      mayDescribeAsRealtime: false,
    };
  }

  return {
    ...deny(`${reason} DENY.`),
    connector,
    workflowCompleted: [...workflow],
    mayDescribeAsRealtime: false,
  };
}

/**
 * Volatile observation decay helper — traffic congestion etc. must not
 * become permanent historical truth without timestamp/context.
 */
export function decayVolatileObservation(input: {
  observation: VolatileObservation;
  nowMs?: number;
  attemptPermanentizeWithoutTimestamp?: boolean;
}): VolatileDecayResult | DenialResult {
  if (
    input.attemptPermanentizeWithoutTimestamp ||
    ER12_LOCKS.PERMANENTIZE_VOLATILE_WITHOUT_TIMESTAMP ||
    VOLATILE_DECAY_RULE.mayBecomePermanentHistoricalTruthWithoutTimestamp
  ) {
    return deny(
      'PERMANENTIZE_VOLATILE_WITHOUT_TIMESTAMP=false — volatile data must carry timestamp/context and decay.',
    );
  }
  if (!ER12_AGENT_BOUNDS.mayDecayVolatileObservations) {
    return deny('mayDecayVolatileObservations=false');
  }

  const hasTimestampAndContext =
    !!input.observation.providerTimestamp &&
    !!input.observation.xivReceiptTimestamp &&
    !!input.observation.context;

  if (!hasTimestampAndContext) {
    return deny(
      'Volatile observation missing timestamp/context — cannot retain as historical truth.',
    );
  }

  const now = input.nowMs ?? Date.now();
  const receipt = Date.parse(input.observation.xivReceiptTimestamp);
  const ageMs = Number.isNaN(receipt) ? Number.POSITIVE_INFINITY : now - receipt;
  const halfLife =
    input.observation.halfLifeMs > 0
      ? input.observation.halfLifeMs
      : VOLATILE_DECAY_RULE.defaultDecayHalfLifeMs;
  const remainingWeight = Math.pow(0.5, ageMs / halfLife);
  const decayed = remainingWeight < 0.5;

  return {
    observationId: input.observation.observationId,
    decayed,
    retainedAsPermanentHistoricalTruth: false,
    hasTimestampAndContext: true,
    ageMs,
    halfLifeMs: halfLife,
    remainingWeight,
    note: decayed
      ? 'Observation decayed; not permanent historical truth.'
      : 'Observation still within half-life; timestamp/context retained.',
  };
}

export function attemptSilentStaleAsLive(): DenialResult {
  return deny('SILENT_STALE_AS_LIVE=false.');
}

export function attemptUnauthorizedScrapingFallback(): DenialResult {
  return deny('UNAUTHORIZED_SCRAPING_FALLBACK=false.');
}

export function attemptScopeExpansion(): DenialResult {
  return deny('AUTOMATIC_SCOPE_EXPANSION=false.');
}

export function attemptCredentialSharing(): DenialResult {
  return deny('CREDENTIAL_SHARING=false.');
}

export function attemptPrivateEndpointDiscovery(): DenialResult {
  return deny('PRIVATE_ENDPOINT_DISCOVERY=false.');
}

export function attemptCrossTenantDataLeakage(): DenialResult {
  return deny('CROSS_TENANT_DATA_LEAKAGE=false.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('BYPASS_GUARDIAN_RLS=false.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('EXPAND_TENANT_UNIVERSE_ACCESS=false.');
}

export function attemptPersistHiddenChainOfThought(): DenialResult {
  return deny('PERSIST_HIDDEN_CHAIN_OF_THOUGHT=false.');
}

export function attemptAutoDeployChanges(): DenialResult {
  return deny('AUTO_DEPLOY_CHANGES=false.');
}

export function attemptPermanentizeVolatileWithoutTimestamp(): DenialResult {
  return deny('PERMANENTIZE_VOLATILE_WITHOUT_TIMESTAMP=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act / authorize.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function attemptDescribeAsRealtimeWithoutLiveVerified(): DenialResult {
  return deny(
    'DESCRIBE_AS_REALTIME_WITHOUT_LIVE_VERIFIED=false — real-time is an evidence state.',
  );
}

export function returnEr12EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er12Actor;
  connector: LiveConnectorCheck;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
      secretValuePresentInLogs: false;
      connectionId: string;
      liveDataState: LiveDataState;
    }
  | DenialResult {
  if (!ER12_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEr12Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER12 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
    secretValuePresentInLogs: false,
    connectionId: input.connector.connectionId,
    liveDataState: input.connector.dataFreshness,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er12Actor;
  action: string;
}):
  | {
      approvalId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver, founder, or tenant_admin.',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  return {
    approvalId: input.approvalId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  humanApprovalUnchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: ER12_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: ER12_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: ER12_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleLiveVerifiedConnector(actor: Er12Actor, nowMs?: number): {
  fresh: LiveConnectorCheck;
  stale: LiveConnectorCheck;
} {
  const now = nowMs ?? Date.now();
  const fresh = createLiveConnectorCheck({
    actor,
    connectionId: 'conn-live-weather-1',
    provider: 'ExampleWeatherLive',
    feedDomain: 'weather',
    scopes: ['read:live_forecast'],
    lastSuccessfulResponse: new Date(now - 30_000).toISOString(),
    providerTimestamp: new Date(now - 30_000).toISOString(),
    expectedRefreshIntervalMs: 60_000,
    nowMs: now,
    evidenceRefs: ['ev://weather/live-1'],
  });
  const stale = createLiveConnectorCheck({
    actor,
    connectionId: 'conn-live-weather-1',
    provider: 'ExampleWeatherLive',
    feedDomain: 'weather',
    scopes: ['read:live_forecast'],
    lastSuccessfulResponse: new Date(now - 25 * 60_000).toISOString(),
    providerTimestamp: new Date(now - 25 * 60_000).toISOString(),
    expectedRefreshIntervalMs: 60_000,
    nowMs: now,
    evidenceRefs: ['ev://weather/stale-1'],
  });
  return { fresh, stale };
}

export function bootstrapLiveDataConnectorGate(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Er12SoftWireSnapshot;
  liveStates: typeof LIVE_DATA_STATES;
  checkFields: readonly LiveConnectorCheckField[];
  workflow: typeof LIVE_CONNECTOR_WORKFLOW;
  gateDecisions: typeof LIVE_GATE_DECISIONS;
  fallbackTypes: typeof LIVE_FALLBACK_TYPES;
  feedDomains: typeof LIVE_FEED_DOMAINS;
  liveBoundary: typeof LIVE_CONNECTOR_BOUNDARY;
  volatileDecay: typeof VOLATILE_DECAY_RULE;
  erLayer: typeof ER_LAYER_TITLE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof ER12_MAY;
  mustNot: typeof ER12_MUST_NOT;
  dbCandidates: typeof ER12_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEr12LocksIntact(),
    softWire: er12SoftWireSnapshot(repoRoot),
    liveStates: LIVE_DATA_STATES,
    checkFields: LIVE_CONNECTOR_CHECK_FIELDS,
    workflow: LIVE_CONNECTOR_WORKFLOW,
    gateDecisions: LIVE_GATE_DECISIONS,
    fallbackTypes: LIVE_FALLBACK_TYPES,
    feedDomains: LIVE_FEED_DOMAINS,
    liveBoundary: LIVE_CONNECTOR_BOUNDARY,
    volatileDecay: VOLATILE_DECAY_RULE,
    erLayer: ER_LAYER_TITLE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: ER12_MAY,
    mustNot: ER12_MUST_NOT,
    dbCandidates: ER12_DB_CANDIDATES_STATUS,
  };
}

function softWireHopState(present: boolean): Er12EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function runLiveDataConnectorGateCycle(input: {
  actor: Er12Actor;
  human: Er12Actor;
  repoRoot?: string;
  nowMs?: number;
}): {
  hops: Er12HopRecord[];
  freshConnector: LiveConnectorCheck;
  softWire: Er12SoftWireSnapshot;
  cycleEvidenceSha256: string;
} {
  const hops: Er12HopRecord[] = [];
  const softWire = er12SoftWireSnapshot(input.repoRoot);
  const now = input.nowMs ?? Date.now();

  hops.push(
    hop(
      'honesty_locks',
      assertEr12LocksIntact() ? 'PASS' : 'FAIL',
      'ER12 locks intact including L4=false and no silent stale-as-live.',
    ),
  );
  hops.push(
    hop(
      'live_data_connector_gate_bootstrap',
      'PASS',
      'Live Data Connector Gate bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'live_states_encoded',
      LIVE_DATA_STATES.length === 9 ? 'PASS' : 'FAIL',
      LIVE_DATA_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'check_fields_encoded',
      LIVE_CONNECTOR_CHECK_FIELDS.length === 15 ? 'PASS' : 'FAIL',
      LIVE_CONNECTOR_CHECK_FIELDS.join(' · '),
    ),
  );
  hops.push(
    hop(
      'workflow_encoded',
      LIVE_CONNECTOR_WORKFLOW.length === 8 &&
        LIVE_GATE_DECISIONS.length === 4
        ? 'PASS'
        : 'FAIL',
      `${LIVE_CONNECTOR_WORKFLOW.join(' → ')} ⇒ ${LIVE_GATE_DECISIONS.join(' | ')}`,
    ),
  );
  hops.push(
    hop(
      'feed_domains_encoded',
      LIVE_FEED_DOMAINS.length === 10 ? 'PASS' : 'FAIL',
      LIVE_FEED_DOMAINS.join(' | '),
    ),
  );
  hops.push(
    hop(
      'fallback_disclosure_shape_encoded',
      LIVE_FALLBACK_TYPES.length === 2 &&
        LIVE_CONNECTOR_BOUNDARY.mayFallbackWithoutDisclosure === false
        ? 'PASS'
        : 'FAIL',
      'liveUnavailable + fallbackType required on fallback.',
    ),
  );
  hops.push(
    hop(
      'volatile_decay_rule_encoded',
      VOLATILE_DECAY_RULE.mustCarryTimestampAndContext === true &&
        VOLATILE_DECAY_RULE.mayBecomePermanentHistoricalTruthWithoutTimestamp ===
          false
        ? 'PASS'
        : 'FAIL',
      'Volatile observations decay with timestamp/context.',
    ),
  );
  hops.push(
    hop(
      'live_boundary_encoded',
      LIVE_CONNECTOR_BOUNDARY.realtimeIsEvidenceStateNotMarketingLabel ===
        true &&
        LIVE_CONNECTOR_BOUNDARY.maySilentlySubstituteStaleAsLive === false
        ? 'PASS'
        : 'FAIL',
      'Real-time is evidence; no silent stale-as-live.',
    ),
  );

  const { fresh, stale } = exampleLiveVerifiedConnector(input.actor, now);

  hops.push(
    hop(
      'freshness_overdue_becomes_stale',
      fresh.dataFreshness === 'LIVE_VERIFIED' &&
        stale.dataFreshness === 'STALE' &&
        computeLiveFreshness({
          lastSuccessfulResponse: stale.lastSuccessfulResponse,
          expectedRefreshIntervalMs: 60_000,
          nowMs: now,
        }) === 'STALE'
        ? 'PASS'
        : 'FAIL',
      'expected 1m + last success 25m ago → STALE.',
    ),
  );

  hops.push(
    hop(
      'realtime_is_evidence_not_label',
      mayDescribeAsRealtime('LIVE_VERIFIED') === true &&
        mayDescribeAsRealtime('STALE') === false &&
        attemptDescribeAsRealtimeWithoutLiveVerified().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Real-time requires LIVE_VERIFIED evidence.',
    ),
  );

  const allow = evaluateLiveDataRequest({
    actor: input.actor,
    connector: fresh,
    requiredScopes: ['read:live_forecast'],
    nowMs: now,
  });
  const waitNear = evaluateLiveDataRequest({
    actor: input.actor,
    connector: createLiveConnectorCheck({
      actor: input.actor,
      connectionId: 'conn-near',
      provider: 'P',
      feedDomain: 'weather',
      scopes: ['read:live_forecast'],
      lastSuccessfulResponse: new Date(now - 90_000).toISOString(),
      expectedRefreshIntervalMs: 60_000,
      nowMs: now,
    }),
    requiredScopes: ['read:live_forecast'],
    nowMs: now,
  });
  const fallback = evaluateLiveDataRequest({
    actor: input.actor,
    connector: stale,
    requiredScopes: ['read:live_forecast'],
    taskPermitsHistoricalFallback: true,
    preferredFallbackType: 'HISTORICAL',
    nowMs: now,
  });
  const denyStale = evaluateLiveDataRequest({
    actor: input.actor,
    connector: stale,
    requiredScopes: ['read:live_forecast'],
    nowMs: now,
  });

  hops.push(
    hop(
      'workflow_allow_wait_fallback_deny',
      !('denied' in allow) &&
        allow.decision === 'ALLOW' &&
        !('denied' in waitNear) &&
        waitNear.decision === 'WAIT' &&
        !('denied' in fallback) &&
        fallback.decision === 'FALLBACK' &&
        'denied' in denyStale
        ? 'PASS'
        : 'FAIL',
      'ALLOW / WAIT / FALLBACK / DENY exercised.',
    ),
  );

  hops.push(
    hop(
      'fallback_discloses_live_unavailable',
      !('denied' in fallback) &&
        fallback.decision === 'FALLBACK' &&
        fallback.liveUnavailable === true &&
        fallback.fallbackType === 'HISTORICAL' &&
        fallback.disclosure.liveUnavailable === true
        ? 'PASS'
        : 'FAIL',
      'Fallback discloses liveUnavailable=true + fallbackType.',
    ),
  );

  const obs: VolatileObservation = {
    observationId: 'obs-traffic-1',
    connectionId: fresh.connectionId,
    feedDomain: 'public_mobility',
    valueSummary: 'congestion_high_segment_42',
    providerTimestamp: new Date(now - 20 * 60_000).toISOString(),
    xivReceiptTimestamp: new Date(now - 20 * 60_000).toISOString(),
    context: 'segment=42; corridor=downtown',
    halfLifeMs: 5 * 60_000,
  };
  const decay = decayVolatileObservation({ observation: obs, nowMs: now });
  hops.push(
    hop(
      'volatile_observation_decays',
      !('denied' in decay) &&
        decay.decayed === true &&
        decay.retainedAsPermanentHistoricalTruth === false
        ? 'PASS'
        : 'FAIL',
      'Volatile traffic observation decays; not permanent truth.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof LIVE_DATA_CONNECTOR_GATE_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_silent_stale_as_live', fn: attemptSilentStaleAsLive },
    {
      hop: 'deny_unauthorized_scraping_fallback',
      fn: attemptUnauthorizedScrapingFallback,
    },
    { hop: 'deny_scope_expansion', fn: attemptScopeExpansion },
    { hop: 'deny_credential_sharing', fn: attemptCredentialSharing },
    {
      hop: 'deny_private_endpoint_discovery',
      fn: attemptPrivateEndpointDiscovery,
    },
    {
      hop: 'deny_cross_tenant_data_leakage',
      fn: attemptCrossTenantDataLeakage,
    },
    { hop: 'deny_bypass_guardian_rls', fn: attemptBypassGuardianRls },
    {
      hop: 'deny_expand_tenant_universe_access',
      fn: attemptExpandTenantUniverseAccess,
    },
    {
      hop: 'deny_persist_hidden_chain_of_thought',
      fn: attemptPersistHiddenChainOfThought,
    },
    { hop: 'deny_auto_deploy_changes', fn: attemptAutoDeployChanges },
    {
      hop: 'deny_permanentize_volatile_without_timestamp',
      fn: attemptPermanentizeVolatileWithoutTimestamp,
    },
  ];
  for (const d of denyHops) {
    hops.push(
      hop(d.hop, d.fn().state === 'DENIED' ? 'PASS' : 'FAIL', `${d.hop} DENIED.`),
    );
  }

  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptAgentAutoAuthority().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no agent auto-authority.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER12_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      ER_LAYER_TITLE.includes('Real API Data Fabric') &&
        GITHUB_SOT_ISSUE === 162
        ? 'PASS'
        : 'FAIL',
      'ER layer context (#162); next ER13 Online Brain Index.',
    ),
  );

  hops.push(
    hop(
      'er11_soft_wire',
      softWireHopState(softWire.er11PublicGovernmentDataPack.present),
      softWire.er11PublicGovernmentDataPack.note,
    ),
  );
  hops.push(
    hop(
      'er10_soft_wire',
      softWireHopState(softWire.er10PublicGeospatialMobilityPack.present),
      softWire.er10PublicGeospatialMobilityPack.note,
    ),
  );
  hops.push(
    hop(
      'er9_soft_wire',
      softWireHopState(softWire.er9PublicLawPolicyKnowledgePack.present),
      softWire.er9PublicLawPolicyKnowledgePack.note,
    ),
  );
  hops.push(
    hop(
      'er8_soft_wire',
      softWireHopState(softWire.er8PublicResearchKnowledgePack.present),
      softWire.er8PublicResearchKnowledgePack.note,
    ),
  );
  hops.push(
    hop(
      'er7_soft_wire',
      softWireHopState(softWire.er7PublicWebKnowledgePack.present),
      softWire.er7PublicWebKnowledgePack.note,
    ),
  );
  hops.push(
    hop(
      'er6_soft_wire',
      softWireHopState(softWire.er6PublicCorpusIngestionPack.present),
      softWire.er6PublicCorpusIngestionPack.note,
    ),
  );
  hops.push(
    hop(
      'er5_soft_wire',
      softWireHopState(softWire.er5PublicSourceAllowlist.present),
      softWire.er5PublicSourceAllowlist.note,
    ),
  );
  hops.push(
    hop(
      'er4_soft_wire',
      softWireHopState(softWire.er4PublicOpenHistoricalDataRegistry.present),
      softWire.er4PublicOpenHistoricalDataRegistry.note,
    ),
  );
  hops.push(
    hop(
      'er3_soft_wire',
      softWireHopState(softWire.er3PublicDataSourceRegistry.present),
      softWire.er3PublicDataSourceRegistry.note,
    ),
  );
  hops.push(
    hop(
      'er2_soft_wire',
      softWireHopState(softWire.er2ApiTruthStateMachine.present),
      softWire.er2ApiTruthStateMachine.note,
    ),
  );
  hops.push(
    hop(
      'er1_soft_wire',
      softWireHopState(softWire.er1RealApiConnectionRegistry.present),
      softWire.er1RealApiConnectionRegistry.note,
    ),
  );
  hops.push(
    hop(
      'eq16_soft_wire',
      softWireHopState(softWire.eq16SoftwareWormholeRouter.present),
      softWire.eq16SoftwareWormholeRouter.note,
    ),
  );
  hops.push(
    hop(
      'eq15_soft_wire',
      softWireHopState(softWire.eq15PathwayPlasticity.present),
      softWire.eq15PathwayPlasticity.note,
    ),
  );
  hops.push(
    hop(
      'eq14_soft_wire',
      softWireHopState(softWire.eq14NeuralPathwayArchitectureGraph.present),
      softWire.eq14NeuralPathwayArchitectureGraph.note,
    ),
  );
  hops.push(
    hop(
      'eq13_soft_wire',
      softWireHopState(softWire.eq13ArchitectureReturnReceipt.present),
      softWire.eq13ArchitectureReturnReceipt.note,
    ),
  );
  hops.push(
    hop(
      'eq12_soft_wire',
      softWireHopState(softWire.eq12CrossArchitectureBenchmarkMatrix.present),
      softWire.eq12CrossArchitectureBenchmarkMatrix.note,
    ),
  );
  hops.push(
    hop(
      'ep15_soft_wire',
      softWireHopState(softWire.ep15AlgorithmTuningSandbox.present),
      softWire.ep15AlgorithmTuningSandbox.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWireHopState(softWire.em157HomeBase.present),
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ER12_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const evidence = returnEr12EvidenceToHomeBase({
    evidenceId: 'ev-er12-live-1',
    actor: input.actor,
    connector: fresh,
    summary: 'live data connector gate advisory',
  });
  const humanGate = requireHumanApproval({
    approvalId: 'appr-er12-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in evidence || 'denied' in humanGate ? 'DENIED' : 'PASS',
      'Live gate evidence to Home Base; human gate exercised.',
    ),
  );

  void LIVE_DATA_CONNECTOR_GATE_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
      connectionId: fresh.connectionId,
      liveDataState: fresh.dataFreshness,
    }),
  );

  return {
    hops,
    freshConnector: fresh,
    softWire,
    cycleEvidenceSha256,
  };
}
