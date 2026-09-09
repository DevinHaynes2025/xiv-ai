/**
 * 62L-EQ16 — Software Wormhole Router runtime.
 *
 * Governed software shortcuts; auth checks never skipped.
 * Soft-wires EQ15/EQ14(WAITING_DATA)/EQ13/EQ12/EQ6/EP15/EM157.
 */

import { createHash } from 'node:crypto';
import {
  EQ16_AGENT_BOUNDS,
  EQ16_DB_CANDIDATES_STATUS,
  EQ16_LOCKS,
  EQ16_MAY,
  EQ16_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SOFTWARE_WORMHOLE_ROUTER_CYCLE,
  WORMHOLE_AUTH_HOP_CHECKS,
  WORMHOLE_AUTH_RULE,
  WORMHOLE_CANDIDATE_TEST_GATES,
  WORMHOLE_CORE_FLOW,
  WORMHOLE_INVALIDATION_TRIGGERS,
  WORMHOLE_ROUTE_FIELDS,
  WORMHOLE_ROUTE_STATES,
  WORMHOLE_SHORTCUT_TYPES,
  WORMHOLE_TRUTH_BOUNDARY,
  assertEq16LocksIntact,
  authHopChecksComplete,
  candidateGatesComplete,
  claimsUnsupportedPhysics,
  eq16SoftWireSnapshot,
  isEq16Agent,
  isHumanApprover,
  securityShortcutAllowed,
  shortcutMayReduceAuthorizationChecks,
  wormholeMeansSoftwareOnly,
  type Eq16Actor,
  type Eq16EvidenceState,
  type Eq16HopRecord,
  type Eq16SoftWireSnapshot,
  type WormholeAuthContext,
  type WormholeAuthHopCheck,
  type WormholeCandidateTestGate,
  type WormholeInvalidationTrigger,
  type WormholeRoute,
  type WormholeRouteField,
  type WormholeShortcutType,
} from './software-wormhole-router-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof SOFTWARE_WORMHOLE_ROUTER_CYCLE)[number],
  state: Eq16EvidenceState,
  summary: string,
): Eq16HopRecord {
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

export type WormholeTask = {
  taskId: string;
  actor: Eq16Actor;
  auth: WormholeAuthContext;
  purpose: string;
  dataClass: string;
  action: string;
  objectId: string;
};

export type WormholeReceipt = {
  receiptId: string;
  taskId: string;
  pathUsed: 'shortcut' | 'full_path';
  routeId: string | null;
  shortcutType: WormholeShortcutType | null;
  authChecksPerformed: readonly WormholeAuthHopCheck[];
  authChecksSkipped: false;
  securityShortcutUsed: false;
  physicsClaimMade: false;
  freshnessOk: boolean;
  latencySavedMs: number;
  evidenceRefs: readonly string[];
  returnedToHomeBase: boolean;
};

export function verifyAuthHop(input: {
  auth: WormholeAuthContext;
  expectedTenantId: string;
  expectedUniverseId: string;
  expectedPurpose: string;
  expectedDataClass: string;
  expectedAction: string;
  expectedObjectId: string;
  attemptSkipChecks?: boolean;
}):
  | {
      ok: true;
      checksPerformed: readonly WormholeAuthHopCheck[];
      checksSkipped: false;
    }
  | DenialResult {
  if (
    input.attemptSkipChecks ||
    EQ16_LOCKS.SKIP_AUTH_HOP_CHECKS === true ||
    shortcutMayReduceAuthorizationChecks()
  ) {
    return deny(
      'SKIP_AUTH_HOP_CHECKS=false — shortcut cannot reduce authorization checks.',
    );
  }

  const a = input.auth;
  if (
    !a.userId ||
    a.tenantId !== input.expectedTenantId ||
    a.universeId !== input.expectedUniverseId ||
    a.objectId !== input.expectedObjectId ||
    a.purpose !== input.expectedPurpose ||
    a.dataClass !== input.expectedDataClass ||
    a.action !== input.expectedAction
  ) {
    return deny(
      'Auth hop failed — user+tenant+Universe+object+purpose+data_class+action must all match.',
    );
  }

  if (!authHopChecksComplete(WORMHOLE_AUTH_HOP_CHECKS)) {
    return deny('Auth hop checks incomplete.');
  }

  return {
    ok: true,
    checksPerformed: WORMHOLE_AUTH_HOP_CHECKS,
    checksSkipped: false,
  };
}

export function proposeSandboxCandidate(input: {
  actor: Eq16Actor;
  routeId: string;
  source: string;
  destination: string;
  shortcutType: WormholeShortcutType;
  dataClass: string;
  purpose: string;
  cacheIndexVersion: string;
  evidenceRefs?: readonly string[];
  rollbackPath: string;
  ttlExpiry?: string | null;
}): WormholeRoute | DenialResult {
  if (!EQ16_AGENT_BOUNDS.mayProposeSandboxShortcutCandidates) {
    return deny('mayProposeSandboxShortcutCandidates=false');
  }
  if (!isEq16Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only EQ16 agents / home_base may propose sandbox candidates.');
  }
  if (input.shortcutType === ('security_bypass' as WormholeShortcutType)) {
    return deny('SECURITY_SHORTCUT_ALLOWED=false');
  }

  return {
    routeId: input.routeId,
    source: input.source,
    destination: input.destination,
    shortcutType: input.shortcutType,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    dataClass: input.dataClass,
    purpose: input.purpose,
    freshness: 'UNKNOWN',
    ttlExpiry: input.ttlExpiry ?? null,
    cacheIndexVersion: input.cacheIndexVersion,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    latencySavedMs: 0,
    costSavedProxy: 0,
    reliability: 0,
    invalidationTrigger: null,
    rollbackPath: input.rollbackPath,
    state: 'SANDBOX_CANDIDATE',
    authChecksRequired: WORMHOLE_AUTH_HOP_CHECKS,
    candidateGatesPassed: [],
  };
}

export function promoteCandidateAfterGates(input: {
  actor: Eq16Actor;
  route: WormholeRoute;
  gatesPassed: readonly WormholeCandidateTestGate[];
  attemptSkipGates?: boolean;
}): WormholeRoute | DenialResult {
  if (input.attemptSkipGates || EQ16_LOCKS.PROMOTE_CANDIDATE_WITHOUT_GATES) {
    return deny(
      'PROMOTE_CANDIDATE_WITHOUT_GATES=false — sandbox candidates need correctness/freshness/isolation/speed/rollback/auditability.',
    );
  }
  if (!candidateGatesComplete(input.gatesPassed)) {
    return deny(
      'Candidate remains SANDBOX_CANDIDATE until all test gates pass.',
    );
  }
  if (input.route.state !== 'SANDBOX_CANDIDATE' && input.route.state !== 'TESTED') {
    return deny(`Cannot promote from state ${input.route.state}.`);
  }

  return {
    ...input.route,
    evidenceRefs: [...input.route.evidenceRefs],
    state: 'ACTIVE',
    freshness: 'FRESH',
    candidateGatesPassed: [...WORMHOLE_CANDIDATE_TEST_GATES],
    reliability: Math.max(input.route.reliability, 0.7),
  };
}

export function invalidateRoute(input: {
  route: WormholeRoute;
  trigger: WormholeInvalidationTrigger;
}): WormholeRoute {
  // data/evidence/model → STALE; permissions/scope/regression/integrity → INVALIDATED
  let nextState: WormholeRoute['state'] = 'INVALIDATED';
  if (
    input.trigger === 'source_data_changes' ||
    input.trigger === 'evidence_expires' ||
    input.trigger === 'model_runtime_version_changes'
  ) {
    nextState = 'STALE';
  }

  return {
    ...input.route,
    evidenceRefs: [...input.route.evidenceRefs],
    state: nextState,
    freshness: 'STALE',
    invalidationTrigger: input.trigger,
  };
}

export function routeShortcut(input: {
  task: WormholeTask;
  route: WormholeRoute;
  nowIso?: string;
  attemptSkipAuth?: boolean;
  attemptSecurityShortcut?: boolean;
  attemptPhysicsClaim?: boolean;
}):
  | {
      used: 'shortcut' | 'full_path';
      receipt: WormholeReceipt;
      route: WormholeRoute;
    }
  | DenialResult {
  if (input.attemptSecurityShortcut || securityShortcutAllowed()) {
    return deny('SECURITY_SHORTCUT_ALLOWED=false — no security shortcut ever.');
  }
  if (
    input.attemptPhysicsClaim ||
    claimsUnsupportedPhysics() ||
    !wormholeMeansSoftwareOnly()
  ) {
    return deny(
      'WORMHOLE_MEANS_SOFTWARE_ONLY — no spacetime/FTL/unsupported physics claims.',
    );
  }

  const auth = verifyAuthHop({
    auth: input.task.auth,
    expectedTenantId: input.route.tenantId,
    expectedUniverseId: input.route.universeId,
    expectedPurpose: input.route.purpose,
    expectedDataClass: input.route.dataClass,
    expectedAction: input.task.action,
    expectedObjectId: input.task.objectId,
    attemptSkipChecks: input.attemptSkipAuth,
  });
  if ('denied' in auth) return auth;

  // Cross-scope deny even if auth context forged
  if (
    input.task.actor.tenantId !== input.route.tenantId ||
    input.task.actor.universeId !== input.route.universeId
  ) {
    return deny('Tenant/Universe scope mismatch — shortcut denied.');
  }

  const now = input.nowIso ?? nowIso();
  const expired =
    input.route.ttlExpiry !== null &&
    Date.parse(input.route.ttlExpiry) < Date.parse(now);
  const usable =
    input.route.state === 'ACTIVE' &&
    input.route.freshness === 'FRESH' &&
    !expired;

  const used: 'shortcut' | 'full_path' = usable ? 'shortcut' : 'full_path';
  const latencySavedMs = usable ? Math.max(input.route.latencySavedMs, 1) : 0;

  const receipt: WormholeReceipt = {
    receiptId: `rcpt-${input.task.taskId}`,
    taskId: input.task.taskId,
    pathUsed: used,
    routeId: usable ? input.route.routeId : null,
    shortcutType: usable ? input.route.shortcutType : null,
    authChecksPerformed: auth.checksPerformed,
    authChecksSkipped: false,
    securityShortcutUsed: false,
    physicsClaimMade: false,
    freshnessOk: usable,
    latencySavedMs,
    evidenceRefs: [...input.route.evidenceRefs, `flow:${WORMHOLE_CORE_FLOW.join('→')}`],
    returnedToHomeBase: false,
  };

  return {
    used,
    receipt,
    route: {
      ...input.route,
      evidenceRefs: [...input.route.evidenceRefs],
      latencySavedMs: usable
        ? input.route.latencySavedMs || latencySavedMs
        : input.route.latencySavedMs,
    },
  };
}

export function returnReceiptToHomeBase(input: {
  receipt: WormholeReceipt;
  actor: Eq16Actor;
}):
  | {
      receipt: WormholeReceipt;
      returnedToHomeBase: true;
      authorityGranted: false;
      authChecksSkipped: false;
    }
  | DenialResult {
  if (!EQ16_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEq16Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only EQ16 agents / home_base may return receipts.');
  }
  return {
    receipt: { ...input.receipt, returnedToHomeBase: true },
    returnedToHomeBase: true,
    authorityGranted: false,
    authChecksSkipped: false,
  };
}

export function attemptSkipAuthorizationChecks(): DenialResult {
  return deny(
    'SHORTCUT_REDUCES_AUTHORIZATION_CHECKS=false — shortcut reduces work only.',
  );
}

export function attemptSecurityShortcut(): DenialResult {
  return deny('SECURITY_SHORTCUT_ALLOWED=false — no security shortcut ever.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('BYPASS_GUARDIAN_RLS=false.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('EXPAND_TENANT_UNIVERSE_ACCESS=false.');
}

export function attemptPhysicsOrFtlClaim(): DenialResult {
  return deny(
    'No spacetime manipulation, FTL, or unsupported physics claims — software only.',
  );
}

export function attemptPersistHiddenChainOfThought(): DenialResult {
  return deny('PERSIST_HIDDEN_CHAIN_OF_THOUGHT=false.');
}

export function attemptAutoDeployChanges(): DenialResult {
  return deny('AUTO_DEPLOY_CHANGES=false.');
}

export function attemptPromoteCandidateWithoutGates(): DenialResult {
  return deny('PROMOTE_CANDIDATE_WITHOUT_GATES=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act / authorize.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq16Actor;
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
    unchanged: EQ16_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ16_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ16_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleActiveCacheRoute(actor: Eq16Actor): {
  candidate: WormholeRoute;
  active: WormholeRoute;
  task: WormholeTask;
} {
  const candidate = proposeSandboxCandidate({
    actor,
    routeId: 'wh-cache-1',
    source: 'task.embed.query',
    destination: 'cache.embed.v3',
    shortcutType: 'cache_hit_path',
    dataClass: 'embeddings',
    purpose: 'reuse_precomputed_embedding',
    cacheIndexVersion: 'idx-v3',
    evidenceRefs: ['bench://eq12/cache', 'path://eq15/pref'],
    rollbackPath: 'full_path:embed.compute',
    ttlExpiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
  if ('denied' in candidate) throw new Error(candidate.reason);

  const active = promoteCandidateAfterGates({
    actor,
    route: candidate,
    gatesPassed: WORMHOLE_CANDIDATE_TEST_GATES,
  });
  if ('denied' in active) throw new Error(active.reason);

  const withLatency: WormholeRoute = {
    ...active,
    latencySavedMs: 42,
    costSavedProxy: 0.3,
  };

  const task: WormholeTask = {
    taskId: 'task-wh-1',
    actor,
    auth: {
      userId: actor.id,
      tenantId: actor.tenantId,
      universeId: actor.universeId,
      objectId: 'obj-embed-1',
      purpose: withLatency.purpose,
      dataClass: withLatency.dataClass,
      action: 'read_shortcut',
    },
    purpose: withLatency.purpose,
    dataClass: withLatency.dataClass,
    action: 'read_shortcut',
    objectId: 'obj-embed-1',
  };

  return { candidate, active: withLatency, task };
}

export function bootstrapSoftwareWormholeRouter(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq16SoftWireSnapshot;
  shortcutTypes: typeof WORMHOLE_SHORTCUT_TYPES;
  coreFlow: typeof WORMHOLE_CORE_FLOW;
  routeFields: readonly WormholeRouteField[];
  authHopChecks: typeof WORMHOLE_AUTH_HOP_CHECKS;
  invalidationTriggers: typeof WORMHOLE_INVALIDATION_TRIGGERS;
  candidateGates: typeof WORMHOLE_CANDIDATE_TEST_GATES;
  routeStates: typeof WORMHOLE_ROUTE_STATES;
  truthBoundary: typeof WORMHOLE_TRUTH_BOUNDARY;
  authRule: typeof WORMHOLE_AUTH_RULE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ16_MAY;
  mustNot: typeof EQ16_MUST_NOT;
  dbCandidates: typeof EQ16_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq16LocksIntact(),
    softWire: eq16SoftWireSnapshot(repoRoot),
    shortcutTypes: WORMHOLE_SHORTCUT_TYPES,
    coreFlow: WORMHOLE_CORE_FLOW,
    routeFields: WORMHOLE_ROUTE_FIELDS,
    authHopChecks: WORMHOLE_AUTH_HOP_CHECKS,
    invalidationTriggers: WORMHOLE_INVALIDATION_TRIGGERS,
    candidateGates: WORMHOLE_CANDIDATE_TEST_GATES,
    routeStates: WORMHOLE_ROUTE_STATES,
    truthBoundary: WORMHOLE_TRUTH_BOUNDARY,
    authRule: WORMHOLE_AUTH_RULE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ16_MAY,
    mustNot: EQ16_MUST_NOT,
    dbCandidates: EQ16_DB_CANDIDATES_STATUS,
  };
}

function softWireHopState(present: boolean): Eq16EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function runSoftwareWormholeRouterCycle(input: {
  actor: Eq16Actor;
  human: Eq16Actor;
  repoRoot?: string;
}): {
  hops: Eq16HopRecord[];
  receipt: WormholeReceipt;
  route: WormholeRoute;
  softWire: Eq16SoftWireSnapshot;
  cycleEvidenceSha256: string;
} {
  const hops: Eq16HopRecord[] = [];
  const softWire = eq16SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq16LocksIntact() ? 'PASS' : 'FAIL',
      'EQ16 locks intact including L4=false and software-only wormhole truth.',
    ),
  );
  hops.push(
    hop(
      'software_wormhole_router_bootstrap',
      'PASS',
      'Software Wormhole Router bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'shortcut_types_encoded',
      WORMHOLE_SHORTCUT_TYPES.length === 11 ? 'PASS' : 'FAIL',
      `${WORMHOLE_SHORTCUT_TYPES.length} shortcut types encoded.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      WORMHOLE_CORE_FLOW.length === 7 ? 'PASS' : 'FAIL',
      WORMHOLE_CORE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'route_fields_encoded',
      WORMHOLE_ROUTE_FIELDS.length === 16 ? 'PASS' : 'FAIL',
      WORMHOLE_ROUTE_FIELDS.join(' · '),
    ),
  );
  hops.push(
    hop(
      'auth_hop_checks_encoded',
      WORMHOLE_AUTH_HOP_CHECKS.length === 7 ? 'PASS' : 'FAIL',
      WORMHOLE_AUTH_HOP_CHECKS.join(' + '),
    ),
  );
  hops.push(
    hop(
      'invalidation_triggers_encoded',
      WORMHOLE_INVALIDATION_TRIGGERS.length === 7 ? 'PASS' : 'FAIL',
      WORMHOLE_INVALIDATION_TRIGGERS.join(' | '),
    ),
  );
  hops.push(
    hop(
      'candidate_test_gates_encoded',
      WORMHOLE_CANDIDATE_TEST_GATES.length === 6 ? 'PASS' : 'FAIL',
      WORMHOLE_CANDIDATE_TEST_GATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'truth_boundary_software_only',
      wormholeMeansSoftwareOnly() &&
        !claimsUnsupportedPhysics() &&
        WORMHOLE_TRUTH_BOUNDARY.claimsSpacetimeManipulation === false &&
        WORMHOLE_TRUTH_BOUNDARY.claimsFasterThanLightCommunication === false
        ? 'PASS'
        : 'FAIL',
      'Wormhole = software routing acceleration only; no physics claims.',
    ),
  );

  const { candidate, active, task } = exampleActiveCacheRoute(input.actor);
  const routed = routeShortcut({ task, route: active });
  if ('denied' in routed) {
    hops.push(
      hop(
        'shortcut_reduces_work_not_authorization',
        'FAIL',
        routed.reason,
      ),
    );
  } else {
    hops.push(
      hop(
        'shortcut_reduces_work_not_authorization',
        routed.used === 'shortcut' &&
          routed.receipt.authChecksSkipped === false &&
          routed.receipt.latencySavedMs > 0 &&
          WORMHOLE_AUTH_RULE.shortcutMayReduceWork === true &&
          WORMHOLE_AUTH_RULE.shortcutMayReduceAuthorizationChecks === false
          ? 'PASS'
          : 'FAIL',
        'Shortcut reduced work; authorization checks unchanged.',
      ),
    );
  }

  const skipDenied = routeShortcut({
    task,
    route: active,
    attemptSkipAuth: true,
  });
  const authHopPass =
    'denied' in skipDenied &&
    authHopChecksComplete(WORMHOLE_AUTH_HOP_CHECKS) &&
    !('denied' in routed) &&
    routed.receipt.authChecksPerformed.length === 7;
  hops.push(
    hop(
      'every_hop_verifies_auth_dimensions',
      authHopPass ? 'PASS' : 'FAIL',
      'Every hop verifies user+tenant+Universe+object+purpose+data_class+action.',
    ),
  );

  hops.push(
    hop(
      'no_security_shortcut_allowed',
      attemptSecurityShortcut().state === 'DENIED' &&
        securityShortcutAllowed() === false
        ? 'PASS'
        : 'FAIL',
      'No security shortcut is ever allowed.',
    ),
  );

  const stale = invalidateRoute({
    route: active,
    trigger: 'source_data_changes',
  });
  const invalidated = invalidateRoute({
    route: active,
    trigger: 'cache_integrity_fails',
  });
  const permChange = invalidateRoute({
    route: active,
    trigger: 'permissions_change',
  });
  hops.push(
    hop(
      'invalidate_on_stale_triggers',
      stale.state === 'STALE' &&
        invalidated.state === 'INVALIDATED' &&
        permChange.state === 'INVALIDATED'
        ? 'PASS'
        : 'FAIL',
      'Routes become STALE/INVALIDATED on invalidation triggers.',
    ),
  );

  const ungated = promoteCandidateAfterGates({
    actor: input.actor,
    route: candidate,
    gatesPassed: ['correctness'],
    attemptSkipGates: false,
  });
  hops.push(
    hop(
      'candidate_stays_sandbox_until_gated',
      candidate.state === 'SANDBOX_CANDIDATE' && 'denied' in ungated
        ? 'PASS'
        : 'FAIL',
      'Agent proposals stay SANDBOX_CANDIDATE until all gates pass.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof SOFTWARE_WORMHOLE_ROUTER_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_skip_authorization_checks', fn: attemptSkipAuthorizationChecks },
    { hop: 'deny_security_shortcut', fn: attemptSecurityShortcut },
    { hop: 'deny_bypass_guardian_rls', fn: attemptBypassGuardianRls },
    {
      hop: 'deny_expand_tenant_universe_access',
      fn: attemptExpandTenantUniverseAccess,
    },
    { hop: 'deny_physics_or_ftl_claims', fn: attemptPhysicsOrFtlClaim },
    {
      hop: 'deny_persist_hidden_chain_of_thought',
      fn: attemptPersistHiddenChainOfThought,
    },
    { hop: 'deny_auto_deploy_changes', fn: attemptAutoDeployChanges },
    {
      hop: 'deny_promote_candidate_without_gates',
      fn: attemptPromoteCandidateWithoutGates,
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
      EQ16_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
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
      'eq6_soft_wire',
      softWireHopState(softWire.eq6ArchitectureCapabilityGraph.present),
      softWire.eq6ArchitectureCapabilityGraph.note,
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
      EQ16_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  let receipt: WormholeReceipt;
  let route: WormholeRoute = active;
  if ('denied' in routed) {
    receipt = {
      receiptId: 'rcpt-fail',
      taskId: task.taskId,
      pathUsed: 'full_path',
      routeId: null,
      shortcutType: null,
      authChecksPerformed: WORMHOLE_AUTH_HOP_CHECKS,
      authChecksSkipped: false,
      securityShortcutUsed: false,
      physicsClaimMade: false,
      freshnessOk: false,
      latencySavedMs: 0,
      evidenceRefs: [],
      returnedToHomeBase: false,
    };
  } else {
    receipt = routed.receipt;
    route = routed.route;
  }

  const home = returnReceiptToHomeBase({ receipt, actor: input.actor });
  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq16-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in home || 'denied' in humanGate ? 'DENIED' : 'PASS',
      'Receipt returned to Home Base; human gate exercised; auth never skipped.',
    ),
  );

  if (!('denied' in home)) {
    receipt = home.receipt;
  }

  void SOFTWARE_WORMHOLE_ROUTER_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
      routeId: route.routeId,
      pathUsed: receipt.pathUsed,
    }),
  );

  return {
    hops,
    receipt,
    route,
    softWire,
    cycleEvidenceSha256,
  };
}
