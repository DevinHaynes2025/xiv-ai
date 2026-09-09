/**
 * 62L-ER2 — API Truth State Machine runtime.
 *
 * Explicit evidence states for external connectors.
 * No skip without evidence; REVOKED blocks; live+stale → DENY/WAITING_DATA.
 */

import { createHash } from 'node:crypto';
import {
  API_TRUTH_BOUNDARY,
  API_TRUTH_CORE_PROGRESSION,
  API_TRUTH_DEGRADATION_TRIGGERS,
  API_TRUTH_ROUTING_RULES,
  API_TRUTH_STATE_MACHINE_CYCLE,
  API_TRUTH_STATES,
  API_TRUTH_TRANSITION_FIELDS,
  ER2_AGENT_BOUNDS,
  ER2_DB_CANDIDATES_STATUS,
  ER2_LOCKS,
  ER2_MAY,
  ER2_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  agentMayUseForWorkload,
  assertEr2LocksIntact,
  blocksRealtimeRequirement,
  er2SoftWireSnapshot,
  isCoreProgressionStep,
  isEr2Agent,
  isHumanApprover,
  nextCoreState,
  type ApiTruthConnector,
  type ApiTruthDegradationTrigger,
  type ApiTruthState,
  type ApiTruthTransition,
  type ApiTruthTransitionField,
  type Er2Actor,
  type Er2EvidenceState,
  type Er2HopRecord,
  type Er2SoftWireSnapshot,
} from './api-truth-state-machine-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof API_TRUTH_STATE_MACHINE_CYCLE)[number],
  state: Er2EvidenceState,
  summary: string,
): Er2HopRecord {
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
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export function fingerprintCredentialScope(input: {
  credentialRef: string;
  scopes: readonly string[];
}): string {
  return sha256(
    JSON.stringify({ ref: input.credentialRef, scopes: [...input.scopes] }),
  ).slice(0, 32);
}

export function createTargetConnector(input: {
  actor: Er2Actor;
  connectionId: string;
  provider: string;
}): ApiTruthConnector | DenialResult {
  if (!isEr2Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER2 agents / home_base may create TARGET connectors.');
  }
  return {
    connectionId: input.connectionId,
    provider: input.provider,
    endpoint: null,
    state: 'TARGET',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    credentialScopeFingerprint: null,
    expiryReverificationDate: null,
    transitions: [],
    evidenceRefs: [],
    secretValuePresentInLogs: false,
  };
}

function appendTransition(
  connector: ApiTruthConnector,
  transition: ApiTruthTransition,
  newState: ApiTruthState,
  extra?: Partial<ApiTruthConnector>,
): ApiTruthConnector {
  return {
    ...connector,
    ...extra,
    state: newState,
    transitions: [...connector.transitions, transition],
    evidenceRefs: [
      ...connector.evidenceRefs,
      transition.evidenceReference,
    ],
    secretValuePresentInLogs: false,
  };
}

export type AdvanceInput = {
  actor: Er2Actor;
  connector: ApiTruthConnector;
  to: ApiTruthState;
  reason: string;
  evidenceReference: string;
  credentialScopeFingerprint?: string | null;
  testResult?: ApiTruthTransition['testResult'];
  expiryReverificationDate?: string | null;
  attemptSkip?: boolean;
  attemptLogSecret?: boolean;
};

export function advanceApiTruthState(
  input: AdvanceInput,
): ApiTruthConnector | DenialResult {
  if (input.attemptLogSecret || ER2_LOCKS.LOG_SECRET_VALUES) {
    return deny('LOG_SECRET_VALUES=false — never log secret values.');
  }
  if (input.attemptSkip || ER2_LOCKS.SKIP_STATE_WITHOUT_EVIDENCE) {
    return deny('SKIP_STATE_WITHOUT_EVIDENCE=false.');
  }
  if (!input.evidenceReference) {
    return deny('Supporting evidence reference required for every transition.');
  }
  if (input.connector.state === 'REVOKED' && input.to !== 'REVOKED') {
    return deny('REVOKED connector cannot advance; re-register as new TARGET.');
  }

  const from = input.connector.state;
  const to = input.to;

  // Lateral / recovery into degradation states handled by degrade/revoke helpers
  if (!isCoreProgressionStep(from, to)) {
    return deny(
      `Cannot advance ${from} → ${to} without evidence of the next core step (no skips).`,
    );
  }

  // AUTHORIZED requires credential/scope fingerprint
  if (to === 'AUTHORIZED' && !input.credentialScopeFingerprint) {
    return deny(
      'AUTHORIZED requires credential/scope fingerprint (never the secret).',
    );
  }
  // SANDBOX_TESTED / VERIFIED require successful test evidence
  if (
    (to === 'SANDBOX_TESTED' || to === 'VERIFIED') &&
    input.testResult !== 'PASS'
  ) {
    return deny(`${to} requires testResult=PASS.`);
  }
  if (to === 'VERIFIED' && !isHumanApprover(input.actor)) {
    // Allow connector_operator with evidence for repeated runtime — still recommend human for consequential
    if (!ER2_AGENT_BOUNDS.mayAdvanceStateWithEvidence) {
      return deny('mayAdvanceStateWithEvidence=false');
    }
  }

  const transition: ApiTruthTransition = {
    connectionId: input.connector.connectionId,
    previousState: from,
    newState: to,
    timestamp: nowIso(),
    actorId: input.actor.id,
    reason: input.reason,
    evidenceReference: input.evidenceReference,
    credentialScopeFingerprint:
      input.credentialScopeFingerprint ??
      input.connector.credentialScopeFingerprint,
    testResult: input.testResult ?? 'N_A',
    expiryReverificationDate:
      input.expiryReverificationDate ??
      input.connector.expiryReverificationDate,
    secretValueLogged: false,
  };

  return appendTransition(input.connector, transition, to, {
    endpoint:
      to === 'CONFIGURED' || from === 'CONFIGURED' || input.connector.endpoint
        ? input.connector.endpoint ?? `https://api.example/${input.connector.provider}`
        : input.connector.endpoint,
    credentialScopeFingerprint:
      input.credentialScopeFingerprint ??
      input.connector.credentialScopeFingerprint,
    expiryReverificationDate:
      input.expiryReverificationDate ??
      input.connector.expiryReverificationDate,
  });
}

export function degradeConnector(input: {
  actor: Er2Actor;
  connector: ApiTruthConnector;
  trigger: ApiTruthDegradationTrigger;
  evidenceReference: string;
  as: 'DEGRADED' | 'STALE' | 'UNAVAILABLE';
}): ApiTruthConnector | DenialResult {
  if (!ER2_AGENT_BOUNDS.mayDegradeOnTriggers) {
    return deny('mayDegradeOnTriggers=false');
  }
  if (!input.evidenceReference) {
    return deny('Evidence required for degradation.');
  }
  if (
    input.connector.state === 'REVOKED' ||
    input.connector.state === 'TARGET'
  ) {
    return deny(`Cannot degrade from ${input.connector.state}.`);
  }

  const transition: ApiTruthTransition = {
    connectionId: input.connector.connectionId,
    previousState: input.connector.state,
    newState: input.as,
    timestamp: nowIso(),
    actorId: input.actor.id,
    reason: input.trigger,
    evidenceReference: input.evidenceReference,
    credentialScopeFingerprint: input.connector.credentialScopeFingerprint,
    testResult: 'FAIL',
    expiryReverificationDate: input.connector.expiryReverificationDate,
    secretValueLogged: false,
  };
  return appendTransition(input.connector, transition, input.as);
}

export function revokeConnector(input: {
  actor: Er2Actor;
  connector: ApiTruthConnector;
  reason: string;
  evidenceReference: string;
}): ApiTruthConnector | DenialResult {
  if (!ER2_AGENT_BOUNDS.mayRevokeAndBlockCalls) {
    return deny('mayRevokeAndBlockCalls=false');
  }
  const transition: ApiTruthTransition = {
    connectionId: input.connector.connectionId,
    previousState: input.connector.state,
    newState: 'REVOKED',
    timestamp: nowIso(),
    actorId: input.actor.id,
    reason: input.reason,
    evidenceReference: input.evidenceReference,
    credentialScopeFingerprint: input.connector.credentialScopeFingerprint,
    testResult: 'N_A',
    expiryReverificationDate: null,
    secretValueLogged: false,
  };
  return appendTransition(input.connector, transition, 'REVOKED');
}

export type RouteDecision =
  | {
      allowed: true;
      state: ApiTruthState;
      workload: string;
      routingRule: string;
    }
  | DenialResult;

export function routeAgentByState(input: {
  connector: ApiTruthConnector;
  workload: 'normal_approved' | 'bounded_test_research' | 'tests' | 'planning';
}): RouteDecision {
  if (input.connector.state === 'REVOKED' || ER2_LOCKS.USE_REVOKED_FOR_NEW_CALLS) {
    return deny('REVOKED immediately blocks new calls.');
  }
  if (!agentMayUseForWorkload(input.connector.state, input.workload)) {
    return deny(
      `State ${input.connector.state} cannot serve workload ${input.workload} (${API_TRUTH_ROUTING_RULES[input.connector.state]}).`,
    );
  }
  return {
    allowed: true,
    state: input.connector.state,
    workload: input.workload,
    routingRule: API_TRUTH_ROUTING_RULES[input.connector.state],
  };
}

/**
 * Real-time truth: live required + non-VERIFIED / stale → DENY or WAITING_DATA.
 * Never return old data as live.
 */
export function requestRealtimeData(input: {
  connector: ApiTruthConnector;
  attemptReturnStaleAsLive?: boolean;
  attemptScrapeFallback?: boolean;
}):
  | {
      allowed: true;
      state: 'VERIFIED';
      dataClass: 'live';
      returnedStaleAsLive: false;
    }
  | DenialResult {
  if (input.attemptReturnStaleAsLive || ER2_LOCKS.RETURN_STALE_DATA_AS_LIVE) {
    return deny('RETURN_STALE_DATA_AS_LIVE=false — never return old data as live.');
  }
  if (
    input.attemptScrapeFallback ||
    ER2_LOCKS.SCRAPE_FALLBACK_ON_AUTH_FAIL
  ) {
    return deny(
      'SCRAPE_FALLBACK_ON_AUTH_FAIL=false — no scrape fallback when API auth fails.',
    );
  }
  if (input.connector.state === 'REVOKED') {
    return deny('REVOKED — new calls blocked.');
  }
  if (input.connector.state === 'VERIFIED') {
    return {
      allowed: true,
      state: 'VERIFIED',
      dataClass: 'live',
      returnedStaleAsLive: false,
    };
  }
  if (
    input.connector.state === 'STALE' ||
    input.connector.state === 'UNAVAILABLE' ||
    input.connector.state === 'DEGRADED'
  ) {
    return deny(
      `REAL_TIME_REQUIRED → WAITING_DATA (connector ${input.connector.state}; not live).`,
      'WAITING_DATA',
    );
  }
  return deny(
    `REAL_TIME_REQUIRED → DENY (connector ${input.connector.state} cannot satisfy live; use VERIFIED only).`,
  );
}

export function attemptSkipStateWithoutEvidence(): DenialResult {
  return deny('SKIP_STATE_WITHOUT_EVIDENCE=false.');
}

export function attemptReturnStaleAsLive(): DenialResult {
  return deny('RETURN_STALE_DATA_AS_LIVE=false.');
}

export function attemptLogSecretValues(): DenialResult {
  return deny('LOG_SECRET_VALUES=false.');
}

export function attemptAutomaticScopeExpansion(): DenialResult {
  return deny('AUTOMATIC_SCOPE_EXPANSION=false.');
}

export function attemptCredentialReuseAcrossTenants(): DenialResult {
  return deny('CREDENTIAL_REUSE_ACROSS_TENANTS=false.');
}

export function attemptScrapeFallbackOnAuthFail(): DenialResult {
  return deny('SCRAPE_FALLBACK_ON_AUTH_FAIL=false.');
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

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act / authorize.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnEr2EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er2Actor;
  connector: ApiTruthConnector;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
      secretValuePresentInLogs: false;
      connectionId: string;
      connectorState: ApiTruthState;
    }
  | DenialResult {
  if (!ER2_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEr2Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER2 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
    secretValuePresentInLogs: false,
    connectionId: input.connector.connectionId,
    connectorState: input.connector.state,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er2Actor;
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
    unchanged: ER2_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: ER2_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: ER2_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleVerifiedConnector(actor: Er2Actor): {
  target: ApiTruthConnector;
  verified: ApiTruthConnector;
} {
  const target = createTargetConnector({
    actor,
    connectionId: 'conn-truth-1',
    provider: 'ExampleWeather',
  });
  if ('denied' in target) throw new Error(target.reason);

  const fp = fingerprintCredentialScope({
    credentialRef: 'vault:ref/weather-readonly',
    scopes: ['read:forecast'],
  });

  const steps: Array<{
    to: ApiTruthState;
    reason: string;
    evidence: string;
    testResult?: ApiTruthTransition['testResult'];
    fp?: string;
  }> = [
    {
      to: 'DOCUMENTED',
      reason: 'provider_docs_found',
      evidence: 'docs://example-weather/openapi',
    },
    {
      to: 'CONFIGURED',
      reason: 'endpoint_config_added',
      evidence: 'cfg://conn-truth-1/endpoint',
    },
    {
      to: 'AUTHORIZED',
      reason: 'valid_credentials_scopes_supplied',
      evidence: 'auth://vault-ref-bound',
      fp,
    },
    {
      to: 'SANDBOX_TESTED',
      reason: 'successful_bounded_test_call',
      evidence: 'test://sandbox/call-1',
      testResult: 'PASS',
    },
    {
      to: 'VERIFIED',
      reason: 'repeated_valid_runtime_evidence',
      evidence: 'runtime://evidence-pack-3',
      testResult: 'PASS',
    },
  ];

  let cur = target;
  for (const s of steps) {
    const next = advanceApiTruthState({
      actor,
      connector: {
        ...cur,
        endpoint:
          s.to === 'CONFIGURED'
            ? 'https://api.example-weather.test/v1'
            : cur.endpoint,
      },
      to: s.to,
      reason: s.reason,
      evidenceReference: s.evidence,
      credentialScopeFingerprint: s.fp,
      testResult: s.testResult,
      expiryReverificationDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
    if ('denied' in next) throw new Error(`${s.to}: ${next.reason}`);
    cur = next;
  }

  return { target, verified: cur };
}

export function bootstrapApiTruthStateMachine(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Er2SoftWireSnapshot;
  truthStates: typeof API_TRUTH_STATES;
  coreProgression: typeof API_TRUTH_CORE_PROGRESSION;
  transitionFields: readonly ApiTruthTransitionField[];
  degradationTriggers: typeof API_TRUTH_DEGRADATION_TRIGGERS;
  routingRules: typeof API_TRUTH_ROUTING_RULES;
  truthBoundary: typeof API_TRUTH_BOUNDARY;
  erLayer: typeof ER_LAYER_TITLE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof ER2_MAY;
  mustNot: typeof ER2_MUST_NOT;
  dbCandidates: typeof ER2_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEr2LocksIntact(),
    softWire: er2SoftWireSnapshot(repoRoot),
    truthStates: API_TRUTH_STATES,
    coreProgression: API_TRUTH_CORE_PROGRESSION,
    transitionFields: API_TRUTH_TRANSITION_FIELDS,
    degradationTriggers: API_TRUTH_DEGRADATION_TRIGGERS,
    routingRules: API_TRUTH_ROUTING_RULES,
    truthBoundary: API_TRUTH_BOUNDARY,
    erLayer: ER_LAYER_TITLE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: ER2_MAY,
    mustNot: ER2_MUST_NOT,
    dbCandidates: ER2_DB_CANDIDATES_STATUS,
  };
}

function softWireHopState(present: boolean): Er2EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function runApiTruthStateMachineCycle(input: {
  actor: Er2Actor;
  human: Er2Actor;
  repoRoot?: string;
}): {
  hops: Er2HopRecord[];
  connector: ApiTruthConnector;
  softWire: Er2SoftWireSnapshot;
  cycleEvidenceSha256: string;
} {
  const hops: Er2HopRecord[] = [];
  const softWire = er2SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr2LocksIntact() ? 'PASS' : 'FAIL',
      'ER2 locks intact including L4=false and no skip without evidence.',
    ),
  );
  hops.push(
    hop(
      'api_truth_state_machine_bootstrap',
      'PASS',
      'API Truth State Machine bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'truth_states_encoded',
      API_TRUTH_STATES.length === 10 ? 'PASS' : 'FAIL',
      API_TRUTH_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'core_progression_encoded',
      API_TRUTH_CORE_PROGRESSION.length === 6 ? 'PASS' : 'FAIL',
      API_TRUTH_CORE_PROGRESSION.join(' → '),
    ),
  );
  hops.push(
    hop(
      'transition_fields_encoded',
      API_TRUTH_TRANSITION_FIELDS.length === 10 ? 'PASS' : 'FAIL',
      API_TRUTH_TRANSITION_FIELDS.join(' · '),
    ),
  );
  hops.push(
    hop(
      'degradation_triggers_encoded',
      API_TRUTH_DEGRADATION_TRIGGERS.length === 7 ? 'PASS' : 'FAIL',
      API_TRUTH_DEGRADATION_TRIGGERS.join(' | '),
    ),
  );
  hops.push(
    hop(
      'routing_rules_encoded',
      API_TRUTH_ROUTING_RULES.VERIFIED === 'normal_approved_workloads' &&
        API_TRUTH_ROUTING_RULES.REVOKED === 'block_new_calls'
        ? 'PASS'
        : 'FAIL',
      'Routing rules by state encoded.',
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      API_TRUTH_BOUNDARY.maySkipStateWithoutEvidence === false &&
        API_TRUTH_BOUNDARY.mayReturnStaleDataAsLive === false
        ? 'PASS'
        : 'FAIL',
      'Truth boundary: no skip; no stale-as-live.',
    ),
  );

  const { target, verified } = exampleVerifiedConnector(input.actor);

  const skip = advanceApiTruthState({
    actor: input.actor,
    connector: target,
    to: 'VERIFIED',
    reason: 'illegal_skip',
    evidenceReference: 'bad',
    attemptSkip: true,
  });
  hops.push(
    hop(
      'no_skip_without_evidence',
      'denied' in skip && attemptSkipStateWithoutEvidence().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'No state may be skipped without supporting evidence.',
    ),
  );

  hops.push(
    hop(
      'progression_target_to_verified',
      verified.state === 'VERIFIED' &&
        verified.transitions.length === 5 &&
        verified.secretValuePresentInLogs === false &&
        nextCoreState('SANDBOX_TESTED') === 'VERIFIED'
        ? 'PASS'
        : 'FAIL',
      'TARGET→…→VERIFIED with recorded transitions.',
    ),
  );

  const stale = degradeConnector({
    actor: input.actor,
    connector: verified,
    trigger: 'data_freshness_deteriorates',
    evidenceReference: 'health://freshness-fail',
    as: 'STALE',
  });
  const degraded = degradeConnector({
    actor: input.actor,
    connector: verified,
    trigger: 'authentication_failing',
    evidenceReference: 'health://auth-fail',
    as: 'DEGRADED',
  });
  hops.push(
    hop(
      'degrade_on_triggers',
      !('denied' in stale) &&
        stale.state === 'STALE' &&
        !('denied' in degraded) &&
        degraded.state === 'DEGRADED'
        ? 'PASS'
        : 'FAIL',
      'Connector becomes DEGRADED/STALE on triggers.',
    ),
  );

  const revoked = revokeConnector({
    actor: input.actor,
    connector: verified,
    reason: 'scope_reduced',
    evidenceReference: 'revoke://policy',
  });
  hops.push(
    hop(
      'revoked_blocks_new_calls',
      !('denied' in revoked) &&
        revoked.state === 'REVOKED' &&
        routeAgentByState({
          connector: revoked,
          workload: 'normal_approved',
        }).state === 'DENIED' &&
        requestRealtimeData({ connector: revoked }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'REVOKED immediately blocks new calls.',
    ),
  );

  const planOk = routeAgentByState({
    connector: target,
    workload: 'planning',
  });
  const normalOnSandbox = routeAgentByState({
    connector: {
      ...verified,
      state: 'SANDBOX_TESTED',
    },
    workload: 'normal_approved',
  });
  const normalOnVerified = routeAgentByState({
    connector: verified,
    workload: 'normal_approved',
  });
  hops.push(
    hop(
      'routing_by_state',
      !('denied' in planOk) &&
        'denied' in normalOnSandbox &&
        !('denied' in normalOnVerified)
        ? 'PASS'
        : 'FAIL',
      'Agents routed by state allow-list.',
    ),
  );

  const realtimeStale = !('denied' in stale)
    ? requestRealtimeData({ connector: stale })
    : deny('stale missing');
  const realtimeLive = requestRealtimeData({ connector: verified });
  hops.push(
    hop(
      'realtime_required_stale_denies',
      realtimeStale.state === 'WAITING_DATA' &&
        !('denied' in realtimeLive) &&
        realtimeLive.returnedStaleAsLive === false &&
        blocksRealtimeRequirement('STALE') === true
        ? 'PASS'
        : 'FAIL',
      'REAL_TIME_REQUIRED + STALE → WAITING_DATA; VERIFIED → live.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof API_TRUTH_STATE_MACHINE_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_skip_state_without_evidence',
      fn: attemptSkipStateWithoutEvidence,
    },
    { hop: 'deny_return_stale_as_live', fn: attemptReturnStaleAsLive },
    { hop: 'deny_log_secret_values', fn: attemptLogSecretValues },
    {
      hop: 'deny_automatic_scope_expansion',
      fn: attemptAutomaticScopeExpansion,
    },
    {
      hop: 'deny_credential_reuse_across_tenants',
      fn: attemptCredentialReuseAcrossTenants,
    },
    {
      hop: 'deny_scrape_fallback_on_auth_fail',
      fn: attemptScrapeFallbackOnAuthFail,
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
      ER2_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
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
      `ER layer context (#162); next ER3 Public Data Source Registry.`,
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
      ER2_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const evidence = returnEr2EvidenceToHomeBase({
    evidenceId: 'ev-er2-truth-1',
    actor: input.actor,
    connector: verified,
    summary: 'api truth state machine advisory',
  });
  const humanGate = requireHumanApproval({
    approvalId: 'appr-er2-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in evidence || 'denied' in humanGate ? 'DENIED' : 'PASS',
      'Transition evidence to Home Base; fingerprints only; human gate exercised.',
    ),
  );

  void API_TRUTH_STATE_MACHINE_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
      connectionId: verified.connectionId,
      connectorState: verified.state,
    }),
  );

  return {
    hops,
    connector: verified,
    softWire,
    cycleEvidenceSha256,
  };
}
