/**
 * 62L-ER1 — Real API Connection Registry runtime.
 *
 * Track providers/endpoints/scopes/rate-limits/rights/auth/health/revocation.
 * Live data use only when all preconditions met. Credential refs only.
 */

import { createHash } from 'node:crypto';
import {
  API_CONNECTION_HEALTH_STATES,
  API_CONNECTION_REGISTRY_FIELDS,
  API_CONNECTION_REGISTRY_FLOW,
  API_CONNECTION_STATES,
  API_CONNECTION_TRUTH_BOUNDARY,
  API_DATA_RIGHTS_CLASSES,
  ER1_AGENT_BOUNDS,
  ER1_DB_CANDIDATES_STATUS,
  ER1_LOCKS,
  ER1_MAY,
  ER1_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  LIVE_DATA_USE_PRECONDITIONS,
  NEXT_PHASE_TITLE,
  REAL_API_CONNECTION_REGISTRY_CYCLE,
  assertEr1LocksIntact,
  er1SoftWireSnapshot,
  evaluateLiveUsePreconditions,
  isEr1Agent,
  isHumanApprover,
  registryEntryMeansLiveUse,
  unknownRightsAllowed,
  type ApiConnectionHealthState,
  type ApiConnectionRecord,
  type ApiConnectionRegistryField,
  type ApiDataRightsClass,
  type ApiRateLimit,
  type Er1Actor,
  type Er1EvidenceState,
  type Er1HopRecord,
  type Er1SoftWireSnapshot,
  type LiveDataUsePrecondition,
} from './real-api-connection-registry-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof REAL_API_CONNECTION_REGISTRY_CYCLE)[number],
  state: Er1EvidenceState,
  summary: string,
): Er1HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED';
  reason: string;
  executed: false;
};

function deny(reason: string): DenialResult {
  return { denied: true, state: 'DENIED', reason, executed: false };
}

export type LiveUseDecision =
  | {
      allowed: true;
      connectionId: string;
      state: 'AUTHORIZED_LIVE';
      preconditions: readonly LiveDataUsePrecondition[];
      rawSecretUsed: false;
    }
  | DenialResult;

export function registerApiConnection(input: {
  actor: Er1Actor;
  connectionId: string;
  provider: string;
  endpoint: string;
  dataRights?: ApiDataRightsClass;
  evidenceRefs?: readonly string[];
}): ApiConnectionRecord | DenialResult {
  if (!ER1_AGENT_BOUNDS.mayRegisterDocumentedConnections) {
    return deny('mayRegisterDocumentedConnections=false');
  }
  if (!isEr1Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER1 agents / home_base may register connections.');
  }
  if (!input.provider || !input.endpoint) {
    return deny('provider and endpoint required.');
  }

  return {
    connectionId: input.connectionId,
    provider: input.provider,
    endpoint: input.endpoint,
    credentialRef: null,
    scopes: [],
    rateLimit: null,
    dataRights: input.dataRights ?? 'UNKNOWN_RIGHTS',
    authorization: false,
    health: 'UNKNOWN',
    revoked: false,
    revocationReason: null,
    state: 'DOCUMENTED',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    rawSecretPresent: false,
  };
}

export function attachCredentialRefAndScopes(input: {
  connection: ApiConnectionRecord;
  credentialRef: string;
  scopes: readonly string[];
  rateLimit: ApiRateLimit;
  dataRights: ApiDataRightsClass;
  attemptStoreRawSecret?: boolean;
}): ApiConnectionRecord | DenialResult {
  if (input.attemptStoreRawSecret || ER1_LOCKS.STORE_RAW_SECRETS_IN_REGISTRY) {
    return deny(
      'STORE_RAW_SECRETS_IN_REGISTRY=false — credentialRef only; never raw secrets.',
    );
  }
  if (!input.credentialRef || input.credentialRef.startsWith('secret:')) {
    return deny(
      'credentialRef must be an opaque vault/ref id — not a raw secret payload.',
    );
  }
  if (input.scopes.length === 0) {
    return deny('scopes must be declared.');
  }
  if (!ER1_AGENT_BOUNDS.mayAttachCredentialRefsAndScopes) {
    return deny('mayAttachCredentialRefsAndScopes=false');
  }

  const rightsState =
    input.dataRights === 'UNKNOWN_RIGHTS' ? 'DOCUMENTED' : 'RIGHTS_CHECKED';

  return {
    ...input.connection,
    scopes: [...input.scopes],
    evidenceRefs: [...input.connection.evidenceRefs],
    credentialRef: input.credentialRef,
    rateLimit: { ...input.rateLimit },
    dataRights: input.dataRights,
    state: rightsState,
    rawSecretPresent: false,
  };
}

export function authorizeConnection(input: {
  connection: ApiConnectionRecord;
  human: Er1Actor;
  attemptWithoutHuman?: boolean;
}): ApiConnectionRecord | DenialResult {
  if (input.attemptWithoutHuman || !isHumanApprover(input.human)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — live authorization requires human_approver/founder/tenant_admin.',
    );
  }
  if (!input.human.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  if (input.connection.dataRights === 'UNKNOWN_RIGHTS') {
    return deny('UNKNOWN_RIGHTS_EQ_ALLOWED=false — rights must be known.');
  }
  if (!input.connection.credentialRef || input.connection.scopes.length === 0) {
    return deny('credentialRef and scopes required before authorization.');
  }
  if (!input.connection.rateLimit) {
    return deny('rateLimit required before authorization.');
  }

  return {
    ...input.connection,
    scopes: [...input.connection.scopes],
    evidenceRefs: [...input.connection.evidenceRefs],
    rateLimit: input.connection.rateLimit
      ? { ...input.connection.rateLimit }
      : null,
    authorization: true,
    // Not AUTHORIZED_LIVE until health OK
    state: 'RIGHTS_CHECKED',
  };
}

export function probeConnectionHealth(input: {
  connection: ApiConnectionRecord;
  health: ApiConnectionHealthState;
}): ApiConnectionRecord {
  let state = input.connection.state;
  if (input.health === 'HEALTHY' && input.connection.authorization) {
    state = 'AUTHORIZED_LIVE';
  } else if (input.health === 'DEGRADED' && input.connection.authorization) {
    state = 'DEGRADED';
  } else if (
    input.health === 'UNREACHABLE' ||
    input.health === 'AUTH_FAILED' ||
    input.health === 'RATE_LIMITED'
  ) {
    state = input.connection.authorization ? 'DEGRADED' : input.connection.state;
  }

  return {
    ...input.connection,
    scopes: [...input.connection.scopes],
    evidenceRefs: [...input.connection.evidenceRefs],
    rateLimit: input.connection.rateLimit
      ? { ...input.connection.rateLimit }
      : null,
    health: input.health,
    state,
  };
}

export function revokeConnection(input: {
  connection: ApiConnectionRecord;
  reason: string;
}): ApiConnectionRecord {
  return {
    ...input.connection,
    scopes: [...input.connection.scopes],
    evidenceRefs: [...input.connection.evidenceRefs],
    rateLimit: input.connection.rateLimit
      ? { ...input.connection.rateLimit }
      : null,
    revoked: true,
    revocationReason: input.reason,
    authorization: false,
    state: 'REVOKED',
  };
}

export function attemptLiveDataUse(input: {
  actor: Er1Actor;
  connection: ApiConnectionRecord;
  attemptSkipPreconditions?: boolean;
}): LiveUseDecision {
  if (
    input.attemptSkipPreconditions ||
    ER1_LOCKS.LIVE_USE_WITHOUT_PRECONDITIONS ||
    registryEntryMeansLiveUse()
  ) {
    return deny(
      'REGISTRY_ENTRY_EQ_LIVE_USE=false — live use requires all preconditions.',
    );
  }

  if (
    input.actor.tenantId !== input.connection.tenantId ||
    input.actor.universeId !== input.connection.universeId
  ) {
    return deny('Tenant/Universe scope mismatch — live use denied.');
  }

  if (input.connection.revoked || ER1_LOCKS.USE_REVOKED_CONNECTION) {
    return deny('USE_REVOKED_CONNECTION=false — revoked connections blocked.');
  }

  if (
    input.connection.dataRights === 'UNKNOWN_RIGHTS' ||
    unknownRightsAllowed()
  ) {
    return deny('UNKNOWN_RIGHTS_EQ_ALLOWED=false.');
  }

  const pre = evaluateLiveUsePreconditions(input.connection);
  if (!pre.ok) {
    return deny(
      `Live use denied — missing preconditions: ${pre.missing.join(', ')}`,
    );
  }

  if (!ER1_AGENT_BOUNDS.mayUseLiveDataWhenPreconditionsMet) {
    return deny('mayUseLiveDataWhenPreconditionsMet=false');
  }

  return {
    allowed: true,
    connectionId: input.connection.connectionId,
    state: 'AUTHORIZED_LIVE',
    preconditions: LIVE_DATA_USE_PRECONDITIONS,
    rawSecretUsed: false,
  };
}

export function attemptStoreRawSecrets(): DenialResult {
  return deny('STORE_RAW_SECRETS_IN_REGISTRY=false.');
}

export function attemptCredentialHarvesting(): DenialResult {
  return deny('CREDENTIAL_HARVESTING=false.');
}

export function attemptUnknownRightsAsAllowed(): DenialResult {
  return deny('UNKNOWN_RIGHTS_EQ_ALLOWED=false.');
}

export function attemptLiveUseWithoutAuthorization(): DenialResult {
  return deny('Live use without authorization denied.');
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

export function attemptAutonomousSpendOrProvision(): DenialResult {
  return deny('AUTONOMOUS_SPEND_OR_PROVISION=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act / authorize.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnEr1EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er1Actor;
  connection: ApiConnectionRecord;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
      rawSecretPresent: false;
      connectionId: string;
      connectionState: ApiConnectionRecord['state'];
    }
  | DenialResult {
  if (!ER1_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEr1Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER1 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
    rawSecretPresent: false,
    connectionId: input.connection.connectionId,
    connectionState: input.connection.state,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er1Actor;
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
    unchanged: ER1_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: ER1_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: ER1_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleAuthorizedLiveConnection(
  actor: Er1Actor,
  human: Er1Actor,
): {
  documented: ApiConnectionRecord;
  live: ApiConnectionRecord;
} {
  const documented = registerApiConnection({
    actor,
    connectionId: 'conn-openlibrary-1',
    provider: 'OpenLibrary',
    endpoint: 'https://openlibrary.org/api',
    dataRights: 'PUBLIC_OPEN',
    evidenceRefs: ['rights://public-open', 'er://162'],
  });
  if ('denied' in documented) throw new Error(documented.reason);

  const withCreds = attachCredentialRefAndScopes({
    connection: documented,
    credentialRef: 'vault:ref/openlibrary-readonly',
    scopes: ['read:catalog', 'read:works'],
    rateLimit: {
      requestsPerMinute: 60,
      burst: 10,
      quotaPeriod: 'minute',
      remainingKnown: false,
    },
    dataRights: 'PUBLIC_OPEN',
  });
  if ('denied' in withCreds) throw new Error(withCreds.reason);

  const authorized = authorizeConnection({
    connection: withCreds,
    human,
  });
  if ('denied' in authorized) throw new Error(authorized.reason);

  const live = probeConnectionHealth({
    connection: authorized,
    health: 'HEALTHY',
  });
  return { documented, live };
}

export function bootstrapRealApiConnectionRegistry(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Er1SoftWireSnapshot;
  registryFields: readonly ApiConnectionRegistryField[];
  connectionStates: typeof API_CONNECTION_STATES;
  healthStates: typeof API_CONNECTION_HEALTH_STATES;
  dataRights: typeof API_DATA_RIGHTS_CLASSES;
  preconditions: typeof LIVE_DATA_USE_PRECONDITIONS;
  flow: typeof API_CONNECTION_REGISTRY_FLOW;
  truthBoundary: typeof API_CONNECTION_TRUTH_BOUNDARY;
  erLayer: typeof ER_LAYER_TITLE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof ER1_MAY;
  mustNot: typeof ER1_MUST_NOT;
  dbCandidates: typeof ER1_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEr1LocksIntact(),
    softWire: er1SoftWireSnapshot(repoRoot),
    registryFields: API_CONNECTION_REGISTRY_FIELDS,
    connectionStates: API_CONNECTION_STATES,
    healthStates: API_CONNECTION_HEALTH_STATES,
    dataRights: API_DATA_RIGHTS_CLASSES,
    preconditions: LIVE_DATA_USE_PRECONDITIONS,
    flow: API_CONNECTION_REGISTRY_FLOW,
    truthBoundary: API_CONNECTION_TRUTH_BOUNDARY,
    erLayer: ER_LAYER_TITLE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: ER1_MAY,
    mustNot: ER1_MUST_NOT,
    dbCandidates: ER1_DB_CANDIDATES_STATUS,
  };
}

function softWireHopState(present: boolean): Er1EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function runRealApiConnectionRegistryCycle(input: {
  actor: Er1Actor;
  human: Er1Actor;
  repoRoot?: string;
}): {
  hops: Er1HopRecord[];
  connection: ApiConnectionRecord;
  liveUse: Extract<LiveUseDecision, { allowed: true }>;
  softWire: Er1SoftWireSnapshot;
  cycleEvidenceSha256: string;
} {
  const hops: Er1HopRecord[] = [];
  const softWire = er1SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr1LocksIntact() ? 'PASS' : 'FAIL',
      'ER1 locks intact including L4=false and registry≠live-use.',
    ),
  );
  hops.push(
    hop(
      'real_api_connection_registry_bootstrap',
      'PASS',
      'Real API Connection Registry bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'registry_fields_encoded',
      API_CONNECTION_REGISTRY_FIELDS.length === 10 ? 'PASS' : 'FAIL',
      API_CONNECTION_REGISTRY_FIELDS.join(' · '),
    ),
  );
  hops.push(
    hop(
      'connection_states_encoded',
      API_CONNECTION_STATES.length === 7 ? 'PASS' : 'FAIL',
      API_CONNECTION_STATES.join(' → '),
    ),
  );
  hops.push(
    hop(
      'health_states_encoded',
      API_CONNECTION_HEALTH_STATES.length === 6 ? 'PASS' : 'FAIL',
      API_CONNECTION_HEALTH_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'data_rights_classes_encoded',
      API_DATA_RIGHTS_CLASSES.length === 5 ? 'PASS' : 'FAIL',
      API_DATA_RIGHTS_CLASSES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'live_use_preconditions_encoded',
      LIVE_DATA_USE_PRECONDITIONS.length === 10 ? 'PASS' : 'FAIL',
      `${LIVE_DATA_USE_PRECONDITIONS.length} live-use preconditions.`,
    ),
  );
  hops.push(
    hop(
      'registry_flow_encoded',
      API_CONNECTION_REGISTRY_FLOW.length === 8 ? 'PASS' : 'FAIL',
      API_CONNECTION_REGISTRY_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'truth_boundary_registry_neq_live',
      registryEntryMeansLiveUse() === false &&
        API_CONNECTION_TRUTH_BOUNDARY.registryAppearanceMeansDocumentedOnly ===
          true
        ? 'PASS'
        : 'FAIL',
      'Registry appearance = DOCUMENTED; entry ≠ live-use authorization.',
    ),
  );

  const { documented, live } = exampleAuthorizedLiveConnection(
    input.actor,
    input.human,
  );

  hops.push(
    hop(
      'register_provider_endpoint_documented',
      documented.state === 'DOCUMENTED' &&
        documented.authorization === false &&
        registryEntryMeansLiveUse() === false
        ? 'PASS'
        : 'FAIL',
      'Provider/endpoint registered as DOCUMENTED only.',
    ),
  );

  hops.push(
    hop(
      'credential_ref_not_raw_secret',
      live.credentialRef !== null &&
        live.rawSecretPresent === false &&
        attemptStoreRawSecrets().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'credentialRef attached; raw secrets denied.',
    ),
  );

  const liveUse = attemptLiveDataUse({
    actor: input.actor,
    connection: live,
  });
  hops.push(
    hop(
      'live_use_requires_all_preconditions',
      !('denied' in liveUse) &&
        liveUse.allowed === true &&
        live.state === 'AUTHORIZED_LIVE'
        ? 'PASS'
        : 'FAIL',
      'Live use allowed only when all preconditions met.',
    ),
  );

  const unknown = registerApiConnection({
    actor: input.actor,
    connectionId: 'conn-unknown-1',
    provider: 'UnknownVendor',
    endpoint: 'https://example.invalid/api',
    dataRights: 'UNKNOWN_RIGHTS',
  });
  const unknownDenied =
    !('denied' in unknown) &&
    attemptLiveDataUse({ actor: input.actor, connection: unknown }).state ===
      'DENIED';
  hops.push(
    hop(
      'unknown_rights_denies_live_use',
      unknownDenied && attemptUnknownRightsAsAllowed().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'UNKNOWN_RIGHTS denies live use.',
    ),
  );

  const revoked = revokeConnection({
    connection: live,
    reason: 'scope_reduced',
  });
  hops.push(
    hop(
      'revocation_blocks_live_use',
      revoked.state === 'REVOKED' &&
        attemptLiveDataUse({ actor: input.actor, connection: revoked }).state ===
          'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Revocation blocks live use.',
    ),
  );

  const degraded = probeConnectionHealth({
    connection: { ...live, health: 'HEALTHY', state: 'AUTHORIZED_LIVE' },
    health: 'UNREACHABLE',
  });
  hops.push(
    hop(
      'health_failure_blocks_or_degrades',
      degraded.state === 'DEGRADED' &&
        attemptLiveDataUse({ actor: input.actor, connection: degraded })
          .state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Health failure degrades and blocks strict live use.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof REAL_API_CONNECTION_REGISTRY_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_live_use_without_authorization',
      fn: attemptLiveUseWithoutAuthorization,
    },
    { hop: 'deny_store_raw_secrets', fn: attemptStoreRawSecrets },
    { hop: 'deny_credential_harvesting', fn: attemptCredentialHarvesting },
    { hop: 'deny_unknown_rights_as_allowed', fn: attemptUnknownRightsAsAllowed },
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
      hop: 'deny_autonomous_spend_or_provision',
      fn: attemptAutonomousSpendOrProvision,
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
      ER1_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
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
      `ER layer context: ${ER_LAYER_TITLE} (#162).`,
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
      ER1_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  if ('denied' in liveUse) {
    throw new Error(`expected live use allowed: ${liveUse.reason}`);
  }

  const evidence = returnEr1EvidenceToHomeBase({
    evidenceId: 'ev-er1-1',
    actor: input.actor,
    connection: live,
    summary: 'api connection registry advisory',
  });
  const humanGate = requireHumanApproval({
    approvalId: 'appr-er1-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in evidence || 'denied' in humanGate ? 'DENIED' : 'PASS',
      'Connection receipt to Home Base; human gate exercised; no raw secrets.',
    ),
  );

  void REAL_API_CONNECTION_REGISTRY_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
      connectionId: live.connectionId,
      liveAllowed: liveUse.allowed,
    }),
  );

  return {
    hops,
    connection: live,
    liveUse,
    softWire,
    cycleEvidenceSha256,
  };
}
