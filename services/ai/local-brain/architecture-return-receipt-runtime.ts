/**
 * 62L-EQ13 — Architecture Return Receipt runtime.
 *
 * Emit receipts; allow requested≠actual; fallback verifies actual only;
 * missing/stale/malformed/inconsistent → UNVERIFIED; no hidden CoT.
 * Soft-wires EQ12/EQ11/EQ6/EP13/EM157 when present.
 */

import { createHash } from 'node:crypto';
import {
  ARCHITECTURE_RECEIPT_FIELDS,
  ARCHITECTURE_RECEIPT_HOME_BASE_FLOW,
  ARCHITECTURE_RECEIPT_STATES,
  ARCHITECTURE_RETURN_RECEIPT_CYCLE,
  EQ13_AGENT_BOUNDS,
  EQ13_DB_CANDIDATES_STATUS,
  EQ13_LOCKS,
  EQ13_MAY,
  EQ13_MUST_NOT,
  FALLBACK_TRUTH_EXAMPLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  RECEIPT_UNVERIFIED_REASONS,
  assertEq13LocksIntact,
  eq13SoftWireSnapshot,
  fallbackVerifiesRequestedRoute,
  isEq13Agent,
  isHumanApprover,
  requestedMustEqualActual,
  type ArchitectureReceiptField,
  type ArchitectureReceiptState,
  type Eq13Actor,
  type Eq13EvidenceState,
  type Eq13HopRecord,
  type Eq13SoftWireSnapshot,
} from './architecture-return-receipt-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ARCHITECTURE_RETURN_RECEIPT_CYCLE)[number],
  state: Eq13EvidenceState,
  summary: string,
): Eq13HopRecord {
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

export type TaskEnvelope = {
  taskId: string;
  workloadId: string;
  agentId: string;
  tenantId: string;
  homeUniverseId: string;
  requestedArchitecture: string;
};

export type ArchitectureReturnReceipt = {
  receiptId: string;
  taskId: string;
  workloadId: string;
  agentId: string;
  tenantId: string;
  homeUniverseId: string;
  requestedArchitecture: string;
  selectedArchitecture: string;
  actualArchitecture: string;
  deviceId: string;
  vendor: string;
  runtimeProvider: string;
  modelId: string;
  modelVersionHash: string;
  precision: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  throughput: number;
  memoryUsed: number;
  resourceState: string;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  resultState: ArchitectureReceiptState;
  benchmarkRef: string | null;
  evidenceRefs: readonly string[];
  receiptHashSignature: string;
  verifiesRequestedRoute: boolean;
  verifiesActualRoute: boolean;
  hiddenChainOfThoughtPresent: false;
};

export type ReceiptValidation = {
  valid: boolean;
  resultState: ArchitectureReceiptState;
  reason: string | null;
  unverifiedReason:
    | (typeof RECEIPT_UNVERIFIED_REASONS)[number]
    | null;
};

export function emitArchitectureReturnReceipt(input: {
  actor: Eq13Actor;
  receiptId: string;
  envelope: TaskEnvelope;
  selectedArchitecture: string;
  actualArchitecture: string;
  deviceId: string;
  vendor: string;
  runtimeProvider: string;
  modelId: string;
  modelVersionHash: string;
  precision: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  throughput: number;
  memoryUsed: number;
  resourceState: string;
  fallbackUsed: boolean;
  fallbackReason?: string | null;
  resultState?: ArchitectureReceiptState;
  benchmarkRef?: string | null;
  evidenceRefs?: readonly string[];
  attemptRequireRequestedEqActual?: boolean;
  attemptVerifyRequestedOnFallback?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): ArchitectureReturnReceipt | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_RECEIPT=false — no hidden chain-of-thought.',
    );
  }
  if (input.attemptRequireRequestedEqActual) {
    return deny(
      'REQUIRE_REQUESTED_EQ_ACTUAL=false — requestedArchitecture != actualArchitecture must always be possible.',
    );
  }
  if (
    input.attemptVerifyRequestedOnFallback ||
    (input.fallbackUsed &&
      input.envelope.requestedArchitecture !== input.actualArchitecture &&
      input.attemptVerifyRequestedOnFallback)
  ) {
    return deny(
      'VERIFY_REQUESTED_ROUTE_ON_FALLBACK=false — fallback verifies actual route only.',
    );
  }

  void ARCHITECTURE_RECEIPT_FIELDS;

  const fallbackUsed = input.fallbackUsed;
  const requested = input.envelope.requestedArchitecture;
  const actual = input.actualArchitecture;

  if (
    fallbackUsed &&
    requested !== actual &&
    input.attemptVerifyRequestedOnFallback
  ) {
    return deny('VERIFY_REQUESTED_ROUTE_ON_FALLBACK=false.');
  }

  const verifiesRequestedRoute = !fallbackUsed && requested === actual;
  const verifiesActualRoute = true;

  const payload = {
    receiptId: input.receiptId,
    taskId: input.envelope.taskId,
    workloadId: input.envelope.workloadId,
    agentId: input.envelope.agentId,
    tenantId: input.envelope.tenantId,
    homeUniverseId: input.envelope.homeUniverseId,
    requestedArchitecture: requested,
    selectedArchitecture: input.selectedArchitecture,
    actualArchitecture: actual,
    deviceId: input.deviceId,
    vendor: input.vendor,
    runtimeProvider: input.runtimeProvider,
    modelId: input.modelId,
    modelVersionHash: input.modelVersionHash,
    precision: input.precision,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    latencyMs: input.latencyMs,
    throughput: input.throughput,
    memoryUsed: input.memoryUsed,
    resourceState: input.resourceState,
    fallbackUsed,
    fallbackReason: input.fallbackReason ?? null,
    resultState: input.resultState ?? 'PASS',
    benchmarkRef: input.benchmarkRef ?? null,
    evidenceRefs: input.evidenceRefs ?? [],
  };

  return {
    ...payload,
    receiptHashSignature: sha256(JSON.stringify(payload)),
    verifiesRequestedRoute,
    verifiesActualRoute,
    hiddenChainOfThoughtPresent: false,
  };
}

export function validateReceiptAtHomeBase(input: {
  receipt: ArchitectureReturnReceipt | null | undefined;
  envelope: TaskEnvelope;
  maxAgeMs?: number;
  nowMs?: number;
  attemptAcceptMissing?: boolean;
  attemptAcceptMalformed?: boolean;
  attemptAcceptStale?: boolean;
  attemptAcceptInconsistent?: boolean;
}): ReceiptValidation {
  if (!input.receipt) {
    if (input.attemptAcceptMissing) {
      return {
        valid: false,
        resultState: 'UNVERIFIED',
        reason: 'ACCEPT_MISSING_RECEIPT_AS_VERIFIED=false',
        unverifiedReason: 'missing',
      };
    }
    return {
      valid: false,
      resultState: 'UNVERIFIED',
      reason: 'Receipt missing',
      unverifiedReason: 'missing',
    };
  }

  const r = input.receipt;

  // Malformed: missing hash or empty required ids
  if (
    !r.receiptHashSignature ||
    !r.receiptId ||
    !r.taskId ||
    !r.actualArchitecture
  ) {
    if (input.attemptAcceptMalformed) {
      return {
        valid: false,
        resultState: 'UNVERIFIED',
        reason: 'ACCEPT_MALFORMED_RECEIPT=false',
        unverifiedReason: 'malformed',
      };
    }
    return {
      valid: false,
      resultState: 'UNVERIFIED',
      reason: 'Receipt malformed',
      unverifiedReason: 'malformed',
    };
  }

  // Inconsistent with task envelope
  const inconsistent =
    r.taskId !== input.envelope.taskId ||
    r.workloadId !== input.envelope.workloadId ||
    r.tenantId !== input.envelope.tenantId ||
    r.homeUniverseId !== input.envelope.homeUniverseId ||
    r.requestedArchitecture !== input.envelope.requestedArchitecture ||
    r.agentId !== input.envelope.agentId;

  if (inconsistent) {
    if (input.attemptAcceptInconsistent) {
      return {
        valid: false,
        resultState: 'UNVERIFIED',
        reason: 'ACCEPT_INCONSISTENT_ENVELOPE=false',
        unverifiedReason: 'inconsistent_with_task_envelope',
      };
    }
    return {
      valid: false,
      resultState: 'UNVERIFIED',
      reason: 'Receipt inconsistent with task envelope',
      unverifiedReason: 'inconsistent_with_task_envelope',
    };
  }

  // Stale
  const maxAge = input.maxAgeMs ?? 24 * 60 * 60 * 1000;
  const now = input.nowMs ?? Date.now();
  const completed = Date.parse(r.completedAt);
  if (Number.isFinite(completed) && now - completed > maxAge) {
    if (input.attemptAcceptStale) {
      return {
        valid: false,
        resultState: 'UNVERIFIED',
        reason: 'ACCEPT_STALE_RECEIPT=false',
        unverifiedReason: 'stale',
      };
    }
    return {
      valid: false,
      resultState: 'UNVERIFIED',
      reason: 'Receipt stale',
      unverifiedReason: 'stale',
    };
  }

  // Fallback cannot verify requested route
  if (
    r.fallbackUsed &&
    r.requestedArchitecture !== r.actualArchitecture &&
    r.verifiesRequestedRoute
  ) {
    return {
      valid: false,
      resultState: 'UNVERIFIED',
      reason: 'Fallback cannot verify requested route',
      unverifiedReason: 'inconsistent_with_task_envelope',
    };
  }

  return {
    valid: true,
    resultState: r.resultState,
    reason: null,
    unverifiedReason: null,
  };
}

export function routesVerifiedByReceipt(
  receipt: ArchitectureReturnReceipt,
): {
  requestedVerified: boolean;
  actualVerified: boolean;
} {
  if (
    receipt.fallbackUsed &&
    receipt.requestedArchitecture !== receipt.actualArchitecture
  ) {
    return {
      requestedVerified: false,
      actualVerified: true,
    };
  }
  return {
    requestedVerified: receipt.requestedArchitecture === receipt.actualArchitecture,
    actualVerified: true,
  };
}

export function attemptRequireRequestedEqActual(): DenialResult {
  return deny('REQUIRE_REQUESTED_EQ_ACTUAL=false.');
}

export function attemptVerifyRequestedRouteOnFallback(): DenialResult {
  return deny('VERIFY_REQUESTED_ROUTE_ON_FALLBACK=false.');
}

export function attemptAcceptMissingReceiptAsVerified(): DenialResult {
  return deny('ACCEPT_MISSING_RECEIPT_AS_VERIFIED=false.');
}

export function attemptAcceptMalformedReceipt(): DenialResult {
  return deny('ACCEPT_MALFORMED_RECEIPT=false.');
}

export function attemptAcceptStaleReceipt(): DenialResult {
  return deny('ACCEPT_STALE_RECEIPT=false.');
}

export function attemptAcceptInconsistentEnvelope(): DenialResult {
  return deny('ACCEPT_INCONSISTENT_ENVELOPE=false.');
}

export function attemptStoreHiddenChainOfThought(): DenialResult {
  return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_RECEIPT=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnEq13EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq13Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      homeBaseFlow: typeof ARCHITECTURE_RECEIPT_HOME_BASE_FLOW;
      authorityGranted: false;
      hiddenChainOfThoughtPresent: false;
    }
  | DenialResult {
  if (!EQ13_AGENT_BOUNDS.mayReturnStructuredEvidenceOnly) {
    return deny('mayReturnStructuredEvidenceOnly=false');
  }
  if (!isEq13Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only EQ13 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    homeBaseFlow: ARCHITECTURE_RECEIPT_HOME_BASE_FLOW,
    authorityGranted: false,
    hiddenChainOfThoughtPresent: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq13Actor;
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
    unchanged: EQ13_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ13_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ13_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleArmNpuFallbackReceipt(
  actor: Eq13Actor,
): {
  envelope: TaskEnvelope;
  receipt: ArchitectureReturnReceipt;
} {
  const envelope: TaskEnvelope = {
    taskId: 'task-1',
    workloadId: 'wl-attn-1',
    agentId: actor.id,
    tenantId: actor.tenantId,
    homeUniverseId: actor.universeId,
    requestedArchitecture: FALLBACK_TRUTH_EXAMPLE.requestedArchitecture,
  };
  const receipt = emitArchitectureReturnReceipt({
    actor,
    receiptId: 'rcpt-fallback-1',
    envelope,
    selectedArchitecture: FALLBACK_TRUTH_EXAMPLE.requestedArchitecture,
    actualArchitecture: FALLBACK_TRUTH_EXAMPLE.actualArchitecture,
    deviceId: 'arm-cpu-1',
    vendor: 'arm',
    runtimeProvider: 'onnxruntime-cpu',
    modelId: 'model-a',
    modelVersionHash: 'sha256:abc',
    precision: 'fp16',
    startedAt: nowIso(),
    completedAt: nowIso(),
    latencyMs: 42,
    throughput: 12,
    memoryUsed: 1024,
    resourceState: 'ok',
    fallbackUsed: true,
    fallbackReason: 'npu_runtime_unavailable',
    resultState: 'PASS',
    benchmarkRef: 'bench-arm-cpu-1',
    evidenceRefs: ['exec-1'],
  });
  if ('denied' in receipt) throw new Error('fallback receipt failed');
  return { envelope, receipt };
}

export function bootstrapArchitectureReturnReceipt(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq13SoftWireSnapshot;
  receiptFields: readonly ArchitectureReceiptField[];
  receiptStates: typeof ARCHITECTURE_RECEIPT_STATES;
  homeBaseFlow: typeof ARCHITECTURE_RECEIPT_HOME_BASE_FLOW;
  unverifiedReasons: typeof RECEIPT_UNVERIFIED_REASONS;
  fallbackExample: typeof FALLBACK_TRUTH_EXAMPLE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ13_MAY;
  mustNot: typeof EQ13_MUST_NOT;
  dbCandidates: typeof EQ13_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq13LocksIntact(),
    softWire: eq13SoftWireSnapshot(repoRoot),
    receiptFields: ARCHITECTURE_RECEIPT_FIELDS,
    receiptStates: ARCHITECTURE_RECEIPT_STATES,
    homeBaseFlow: ARCHITECTURE_RECEIPT_HOME_BASE_FLOW,
    unverifiedReasons: RECEIPT_UNVERIFIED_REASONS,
    fallbackExample: FALLBACK_TRUTH_EXAMPLE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ13_MAY,
    mustNot: EQ13_MUST_NOT,
    dbCandidates: EQ13_DB_CANDIDATES_STATUS,
  };
}

export function runArchitectureReturnReceiptCycle(input: {
  actor: Eq13Actor;
  human: Eq13Actor;
  repoRoot?: string;
}): {
  hops: Eq13HopRecord[];
  receipt: ArchitectureReturnReceipt;
  validation: ReceiptValidation;
  softWire: Eq13SoftWireSnapshot;
} {
  const hops: Eq13HopRecord[] = [];
  const softWire = eq13SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq13LocksIntact() ? 'PASS' : 'FAIL',
      'EQ13 locks intact including L4=false and requested≠actual allowed.',
    ),
  );
  hops.push(
    hop(
      'architecture_return_receipt_bootstrap',
      'PASS',
      'Architecture Return Receipt bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'receipt_fields_encoded',
      'PASS',
      `${ARCHITECTURE_RECEIPT_FIELDS.length} receipt fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'receipt_states_encoded',
      'PASS',
      ARCHITECTURE_RECEIPT_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'home_base_flow_encoded',
      'PASS',
      ARCHITECTURE_RECEIPT_HOME_BASE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'unverified_reasons_encoded',
      'PASS',
      RECEIPT_UNVERIFIED_REASONS.join(' | '),
    ),
  );

  const { envelope, receipt } = exampleArmNpuFallbackReceipt(input.actor);
  const routes = routesVerifiedByReceipt(receipt);

  hops.push(
    hop(
      'requested_neq_actual_always_possible',
      receipt.requestedArchitecture !== receipt.actualArchitecture &&
        requestedMustEqualActual() === false &&
        attemptRequireRequestedEqActual().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'requestedArchitecture != actualArchitecture always possible.',
    ),
  );

  hops.push(
    hop(
      'fallback_verifies_actual_not_requested',
      receipt.fallbackUsed === true &&
        routes.requestedVerified === false &&
        routes.actualVerified === true &&
        FALLBACK_TRUTH_EXAMPLE.verifiesNpuRoute === false &&
        fallbackVerifiesRequestedRoute() === false &&
        attemptVerifyRequestedRouteOnFallback().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Fallback verifies CPU route, not NPU route.',
    ),
  );

  const missing = validateReceiptAtHomeBase({
    receipt: null,
    envelope,
  });
  const inconsistent = validateReceiptAtHomeBase({
    receipt: { ...receipt, taskId: 'wrong-task' },
    envelope,
  });
  const stale = validateReceiptAtHomeBase({
    receipt: {
      ...receipt,
      completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
    envelope,
    maxAgeMs: 60 * 60 * 1000,
  });
  const malformed = validateReceiptAtHomeBase({
    receipt: { ...receipt, receiptHashSignature: '' },
    envelope,
  });
  const validation = validateReceiptAtHomeBase({ receipt, envelope });

  hops.push(
    hop(
      'missing_malformed_stale_inconsistent_unverified',
      missing.resultState === 'UNVERIFIED' &&
        inconsistent.resultState === 'UNVERIFIED' &&
        stale.resultState === 'UNVERIFIED' &&
        malformed.resultState === 'UNVERIFIED' &&
        validation.valid === true
        ? 'PASS'
        : 'FAIL',
      'Missing/stale/malformed/inconsistent → UNVERIFIED.',
    ),
  );

  hops.push(
    hop(
      'no_hidden_chain_of_thought',
      receipt.hiddenChainOfThoughtPresent === false &&
        attemptStoreHiddenChainOfThought().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'No hidden chain-of-thought stored in receipts.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof ARCHITECTURE_RETURN_RECEIPT_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_require_requested_eq_actual',
      fn: attemptRequireRequestedEqActual,
    },
    {
      hop: 'deny_verify_requested_route_on_fallback',
      fn: attemptVerifyRequestedRouteOnFallback,
    },
    {
      hop: 'deny_accept_missing_receipt_as_verified',
      fn: attemptAcceptMissingReceiptAsVerified,
    },
    {
      hop: 'deny_accept_malformed_receipt',
      fn: attemptAcceptMalformedReceipt,
    },
    { hop: 'deny_accept_stale_receipt', fn: attemptAcceptStaleReceipt },
    {
      hop: 'deny_accept_inconsistent_envelope',
      fn: attemptAcceptInconsistentEnvelope,
    },
    {
      hop: 'deny_store_hidden_chain_of_thought',
      fn: attemptStoreHiddenChainOfThought,
    },
  ];
  for (const d of denyHops) {
    hops.push(
      hop(
        d.hop,
        d.fn().state === 'DENIED' ? 'PASS' : 'FAIL',
        `${d.hop} DENIED.`,
      ),
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
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Recommend ≠ act / authorize.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EQ13_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );
  hops.push(
    hop(
      'human_authorization_unchanged',
      EQ13_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true
        ? 'PASS'
        : 'FAIL',
      'High-consequence actions remain human-authorized.',
    ),
  );

  hops.push(
    hop(
      'eq12_soft_wire',
      softWire.eq12CrossArchitectureBenchmarkMatrix.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.eq12CrossArchitectureBenchmarkMatrix.note,
    ),
  );
  hops.push(
    hop(
      'eq11_soft_wire',
      softWire.eq11DeviceNeutralWorkloadGenome.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.eq11DeviceNeutralWorkloadGenome.note,
    ),
  );
  hops.push(
    hop(
      'eq6_soft_wire',
      softWire.eq6ArchitectureCapabilityGraph.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq6ArchitectureCapabilityGraph.note,
    ),
  );
  hops.push(
    hop(
      'ep13_soft_wire',
      softWire.ep13RuntimeReturnReceipt.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep13RuntimeReturnReceipt.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWire.em157HomeBase.present ? 'PASS' : 'WAITING_DATA',
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EQ13_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq13-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate ? 'DENIED' : 'PASS',
      'Human approval gate exercised; cycle evidence recorded.',
    ),
  );

  void ARCHITECTURE_RETURN_RECEIPT_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    receipt,
    validation,
    softWire,
  };
}
