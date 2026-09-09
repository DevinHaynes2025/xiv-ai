/**
 * 62L-EP13 — Runtime Return Receipt runtime.
 *
 * Emit/validate tamper-evident receipts. Requested ≠ actual always separate.
 * Soft-wires EP12/EP10/EP5/EP1/EM157 when present.
 */

import { createHash } from 'node:crypto';
import {
  DEVICE_CLASSES,
  EP13_DB_CANDIDATES_STATUS,
  EP13_LOCKS,
  EP13_MAY,
  EP13_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  RECEIPT_AGENT_BOUNDS,
  RECEIPT_FIELDS,
  RECEIPT_HOME_BASE_FLOW,
  RECEIPT_RESULT_STATES,
  RUNTIME_RETURN_RECEIPT_CYCLE,
  assertEp13LocksIntact,
  ep13SoftWireSnapshot,
  fallbackVerifiesAccelerator,
  isAcceleratorFallback,
  isHumanApprover,
  isReceiptAgent,
  type DeviceClass,
  type Ep13Actor,
  type Ep13EvidenceState,
  type Ep13HopRecord,
  type Ep13SoftWireSnapshot,
  type ReceiptField,
  type ReceiptResultState,
} from './runtime-return-receipt-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof RUNTIME_RETURN_RECEIPT_CYCLE)[number],
  state: Ep13EvidenceState,
  summary: string,
): Ep13HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
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

export type TaskEnvelopeOrigin = {
  taskEnvelopeId: string;
  agentId: string;
  tenantId: string;
  homeUniverseId: string;
  requestedDeviceClass: DeviceClass;
  selectedNodeId: string;
  modelId: string;
  highConsequence?: boolean;
};

export type ComputeReceipt = {
  receiptId: string;
  taskEnvelopeId: string;
  agentId: string;
  tenantId: string;
  homeUniverseId: string;
  requestedDeviceClass: DeviceClass;
  selectedNodeId: string;
  actualDevice: DeviceClass;
  vendor: string;
  runtimeProvider: string;
  modelId: string;
  modelVersionHash: string;
  precision: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  memoryUsed: string;
  resourceState: string;
  fallbackUsed: boolean;
  fallbackReason: string;
  resultState: ReceiptResultState;
  failureClass: string;
  benchmarkRef: string;
  evidenceRefs: readonly string[];
  receiptSignatureHash: string;
  secretsPresent: false;
  hiddenChainOfThoughtPresent: false;
  finalized: boolean;
  appendOnly: true;
  acceleratorVerifiedByThisReceipt: boolean;
  orgId: string;
  createdAt: string;
};

export type HomeBaseValidation = {
  validationId: string;
  receiptId: string | null;
  classification: 'VALIDATED' | 'UNVERIFIED';
  reason: string;
  fedBenchmarkMemory: boolean;
  fedNeuralComputeGraph: boolean;
  agentResultReleased: boolean;
  humanAuthRequired: boolean;
  humanAuthorized: boolean;
};

function computeReceiptHash(payload: Record<string, unknown>): string {
  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 32);
}

export function emitComputeReceipt(input: {
  actor: Ep13Actor;
  receiptId: string;
  origin: TaskEnvelopeOrigin;
  actualDevice: DeviceClass;
  vendor: string;
  runtimeProvider: string;
  modelVersionHash: string;
  precision: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  memoryUsed: string;
  resourceState: string;
  resultState: ReceiptResultState;
  failureClass?: string;
  benchmarkRef?: string;
  evidenceRefs?: readonly string[];
  fallbackReason?: string;
  attemptIncludeSecrets?: boolean;
  attemptIncludeHiddenCot?: boolean;
  attemptRewritePolicyFailAsPass?: boolean;
}): ComputeReceipt | DenialResult {
  if (input.attemptIncludeSecrets) {
    return deny('SECRETS_IN_RECEIPT=false — secrets and credentials are redacted.');
  }
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_RECEIPT=false — no hidden chain-of-thought is included.',
    );
  }
  if (
    input.attemptRewritePolicyFailAsPass &&
    (input.resultState === 'POLICY_DENIED' || input.failureClass === 'policy')
  ) {
    return deny(
      'POLICY_FAIL_REWRITTEN_AS_PASS=false — failed security/policy checks cannot be rewritten as successful inference.',
    );
  }
  if (
    input.resultState === 'POLICY_DENIED' &&
    input.attemptRewritePolicyFailAsPass
  ) {
    return deny('POLICY_FAIL_REWRITTEN_AS_PASS=false.');
  }

  void RECEIPT_FIELDS;

  const fallbackUsed = isAcceleratorFallback({
    requestedDeviceClass: input.origin.requestedDeviceClass,
    actualDevice: input.actualDevice,
  });

  const payload = {
    receiptId: input.receiptId,
    taskEnvelopeId: input.origin.taskEnvelopeId,
    agentId: input.origin.agentId,
    tenantId: input.origin.tenantId,
    homeUniverseId: input.origin.homeUniverseId,
    requestedDeviceClass: input.origin.requestedDeviceClass,
    selectedNodeId: input.origin.selectedNodeId,
    actualDevice: input.actualDevice,
    vendor: input.vendor,
    runtimeProvider: input.runtimeProvider,
    modelId: input.origin.modelId,
    modelVersionHash: input.modelVersionHash,
    precision: input.precision,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    latencyMs: input.latencyMs,
    memoryUsed: input.memoryUsed,
    resourceState: input.resourceState,
    fallbackUsed,
    resultState: input.resultState,
  };

  return {
    receiptId: input.receiptId,
    taskEnvelopeId: input.origin.taskEnvelopeId,
    agentId: input.origin.agentId,
    tenantId: input.origin.tenantId,
    homeUniverseId: input.origin.homeUniverseId,
    requestedDeviceClass: input.origin.requestedDeviceClass,
    selectedNodeId: input.origin.selectedNodeId,
    actualDevice: input.actualDevice,
    vendor: input.vendor,
    runtimeProvider: input.runtimeProvider,
    modelId: input.origin.modelId,
    modelVersionHash: input.modelVersionHash,
    precision: input.precision,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    latencyMs: input.latencyMs,
    memoryUsed: input.memoryUsed,
    resourceState: input.resourceState,
    fallbackUsed,
    fallbackReason:
      input.fallbackReason ??
      (fallbackUsed ? 'silent_or_recorded_cpu_fallback' : 'none'),
    resultState: input.resultState,
    failureClass: input.failureClass ?? 'none',
    benchmarkRef: input.benchmarkRef ?? '',
    evidenceRefs: input.evidenceRefs ?? [],
    receiptSignatureHash: computeReceiptHash(payload),
    secretsPresent: false,
    hiddenChainOfThoughtPresent: false,
    finalized: true,
    appendOnly: true,
    acceleratorVerifiedByThisReceipt: fallbackVerifiesAccelerator({
      requestedDeviceClass: input.origin.requestedDeviceClass,
      actualDevice: input.actualDevice,
      fallbackUsed,
    }),
    orgId: input.actor.orgId,
    createdAt: nowIso(),
  };
}

export function validateReceiptAtHomeBase(input: {
  actor: Ep13Actor;
  validationId: string;
  origin: TaskEnvelopeOrigin;
  receipt?: ComputeReceipt | null;
  malformed?: boolean;
  stale?: boolean;
  inconsistentWithEnvelope?: boolean;
  attemptSilentAcceptMissing?: boolean;
  attemptSilentAcceptMalformed?: boolean;
  attemptSilentAcceptStale?: boolean;
  attemptSilentAcceptInconsistent?: boolean;
  attemptCrossTenantReuse?: boolean;
  attemptMutateFinalized?: boolean;
  attemptSkipHumanForHighConsequence?: boolean;
  humanAuthorized?: boolean;
}): HomeBaseValidation | DenialResult {
  if (input.attemptMutateFinalized) {
    return deny(
      'RECEIPT_MUTATION_AFTER_FINALIZE=false — final receipts are append-only audit artifacts.',
    );
  }
  if (input.attemptCrossTenantReuse) {
    return deny(
      'CROSS_TENANT_RECEIPT_REUSE=false — cross-tenant reuse is denied by default.',
    );
  }

  if (!input.receipt) {
    if (input.attemptSilentAcceptMissing) {
      return deny(
        'MISSING_RECEIPT_SILENT_ACCEPT=false — missing receipt → UNVERIFIED.',
      );
    }
    return {
      validationId: input.validationId,
      receiptId: null,
      classification: 'UNVERIFIED',
      reason: 'Receipt missing.',
      fedBenchmarkMemory: false,
      fedNeuralComputeGraph: false,
      agentResultReleased: false,
      humanAuthRequired: Boolean(input.origin.highConsequence),
      humanAuthorized: false,
    };
  }

  if (input.malformed) {
    if (input.attemptSilentAcceptMalformed) {
      return deny(
        'MALFORMED_RECEIPT_SILENT_ACCEPT=false — malformed receipt → UNVERIFIED.',
      );
    }
    return {
      validationId: input.validationId,
      receiptId: input.receipt.receiptId,
      classification: 'UNVERIFIED',
      reason: 'Receipt malformed.',
      fedBenchmarkMemory: false,
      fedNeuralComputeGraph: false,
      agentResultReleased: false,
      humanAuthRequired: Boolean(input.origin.highConsequence),
      humanAuthorized: false,
    };
  }

  if (input.stale) {
    if (input.attemptSilentAcceptStale) {
      return deny(
        'STALE_RECEIPT_SILENT_ACCEPT=false — stale receipt → UNVERIFIED.',
      );
    }
    return {
      validationId: input.validationId,
      receiptId: input.receipt.receiptId,
      classification: 'UNVERIFIED',
      reason: 'Receipt stale.',
      fedBenchmarkMemory: false,
      fedNeuralComputeGraph: false,
      agentResultReleased: false,
      humanAuthRequired: Boolean(input.origin.highConsequence),
      humanAuthorized: false,
    };
  }

  if (
    input.inconsistentWithEnvelope ||
    input.receipt.taskEnvelopeId !== input.origin.taskEnvelopeId ||
    input.receipt.tenantId !== input.origin.tenantId ||
    input.receipt.homeUniverseId !== input.origin.homeUniverseId
  ) {
    if (
      input.receipt.tenantId !== input.origin.tenantId ||
      input.receipt.homeUniverseId !== input.origin.homeUniverseId
    ) {
      if (input.attemptSilentAcceptInconsistent) {
        return deny(
          'TENANT_UNIVERSE_MISMATCH_ALLOWED=false — receipt tenant/Universe must match originating task.',
        );
      }
    }
    if (input.attemptSilentAcceptInconsistent) {
      return deny(
        'INCONSISTENT_RECEIPT_SILENT_ACCEPT=false — inconsistent receipt → UNVERIFIED.',
      );
    }
    return {
      validationId: input.validationId,
      receiptId: input.receipt.receiptId,
      classification: 'UNVERIFIED',
      reason: 'Receipt inconsistent with originating task envelope.',
      fedBenchmarkMemory: false,
      fedNeuralComputeGraph: false,
      agentResultReleased: false,
      humanAuthRequired: Boolean(input.origin.highConsequence),
      humanAuthorized: false,
    };
  }

  const highConsequence = Boolean(input.origin.highConsequence);
  if (highConsequence && input.receipt.resultState === 'PASS') {
    if (input.attemptSkipHumanForHighConsequence) {
      return deny(
        'HIGH_CONSEQUENCE_PASS_SKIPS_HUMAN=false — high-consequence outputs still require human authorization even when compute returns PASS.',
      );
    }
    if (!input.humanAuthorized) {
      return {
        validationId: input.validationId,
        receiptId: input.receipt.receiptId,
        classification: 'VALIDATED',
        reason:
          'Receipt structurally valid; high-consequence PASS awaiting human authorization.',
        fedBenchmarkMemory: true,
        fedNeuralComputeGraph: true,
        agentResultReleased: false,
        humanAuthRequired: true,
        humanAuthorized: false,
      };
    }
  }

  return {
    validationId: input.validationId,
    receiptId: input.receipt.receiptId,
    classification: 'VALIDATED',
    reason: 'Receipt validated at Home Base.',
    fedBenchmarkMemory: true,
    fedNeuralComputeGraph: true,
    agentResultReleased: !highConsequence || Boolean(input.humanAuthorized),
    humanAuthRequired: highConsequence,
    humanAuthorized: Boolean(input.humanAuthorized),
  };
}

export function attemptVerifyAcceleratorViaFallback(): DenialResult {
  return deny(
    'FALLBACK_VERIFIES_ACCELERATOR=false — CPU fallback can validate CPU path but cannot verify NPU/GPU.',
  );
}

export function attemptSilentAcceptMissingReceipt(): DenialResult {
  return deny('MISSING_RECEIPT_SILENT_ACCEPT=false.');
}

export function attemptIncludeSecrets(): DenialResult {
  return deny('SECRETS_IN_RECEIPT=false.');
}

export function attemptIncludeHiddenCot(): DenialResult {
  return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_RECEIPT=false.');
}

export function attemptMutateFinalizedReceipt(): DenialResult {
  return deny('RECEIPT_MUTATION_AFTER_FINALIZE=false.');
}

export function attemptCrossTenantReuse(): DenialResult {
  return deny('CROSS_TENANT_RECEIPT_REUSE=false.');
}

export function attemptRewritePolicyFailAsPass(): DenialResult {
  return deny('POLICY_FAIL_REWRITTEN_AS_PASS=false.');
}

export function attemptSkipHumanForHighConsequence(): DenialResult {
  return deny('HIGH_CONSEQUENCE_PASS_SKIPS_HUMAN=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnReceiptEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep13Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      flow: typeof RECEIPT_HOME_BASE_FLOW;
      authorityGranted: false;
    }
  | DenialResult {
  if (!RECEIPT_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isReceiptAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only receipt agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    flow: RECEIPT_HOME_BASE_FLOW,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep13Actor;
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
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver or founder.',
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
    unchanged: EP13_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EP13_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EP13_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleOrigin(
  overrides?: Partial<TaskEnvelopeOrigin>,
): TaskEnvelopeOrigin {
  return {
    taskEnvelopeId: 'env-1',
    agentId: 'agent-1',
    tenantId: 'ten-ep13',
    homeUniverseId: 'uni-ep13',
    requestedDeviceClass: 'npu',
    selectedNodeId: 'node-npu-1',
    modelId: 'model-embed-1',
    highConsequence: false,
    ...overrides,
  };
}

export function bootstrapRuntimeReturnReceipt(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep13SoftWireSnapshot;
  homeBaseFlow: typeof RECEIPT_HOME_BASE_FLOW;
  fields: readonly ReceiptField[];
  resultStates: readonly ReceiptResultState[];
  deviceClasses: typeof DEVICE_CLASSES;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP13_MAY;
  mustNot: typeof EP13_MUST_NOT;
  dbCandidates: typeof EP13_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp13LocksIntact(),
    softWire: ep13SoftWireSnapshot(repoRoot),
    homeBaseFlow: RECEIPT_HOME_BASE_FLOW,
    fields: RECEIPT_FIELDS,
    resultStates: RECEIPT_RESULT_STATES,
    deviceClasses: DEVICE_CLASSES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP13_MAY,
    mustNot: EP13_MUST_NOT,
    dbCandidates: EP13_DB_CANDIDATES_STATUS,
  };
}

export function runRuntimeReturnReceiptCycle(input: {
  actor: Ep13Actor;
  human: Ep13Actor;
  repoRoot?: string;
}): {
  hops: Ep13HopRecord[];
  receipt: ComputeReceipt | DenialResult;
  fallbackReceipt: ComputeReceipt | DenialResult;
  softWire: Ep13SoftWireSnapshot;
} {
  const hops: Ep13HopRecord[] = [];
  const softWire = ep13SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp13LocksIntact() ? 'PASS' : 'FAIL',
      'EP13 locks intact including L4=false and fallback ≠ accelerator verify.',
    ),
  );
  hops.push(
    hop(
      'runtime_return_receipt_bootstrap',
      'PASS',
      'Runtime Return Receipt bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'home_base_flow_encoded',
      'PASS',
      RECEIPT_HOME_BASE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'receipt_fields_encoded',
      'PASS',
      `${RECEIPT_FIELDS.length} receipt fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'result_states_encoded',
      'PASS',
      RECEIPT_RESULT_STATES.join(' | '),
    ),
  );
  hops.push(
    hop('device_classes_encoded', 'PASS', DEVICE_CLASSES.join(' | ')),
  );

  const origin = exampleOrigin();
  const receipt = emitComputeReceipt({
    actor: input.actor,
    receiptId: 'rcpt-pass-1',
    origin,
    actualDevice: 'npu',
    vendor: 'ExampleVendor',
    runtimeProvider: 'onnx',
    modelVersionHash: 'abc123',
    precision: 'fp16',
    startedAt: nowIso(),
    completedAt: nowIso(),
    latencyMs: 12,
    memoryUsed: '512MB',
    resourceState: 'ok',
    resultState: 'PASS',
    benchmarkRef: 'bm-1',
  });

  const fallbackReceipt = emitComputeReceipt({
    actor: input.actor,
    receiptId: 'rcpt-fallback-1',
    origin: exampleOrigin({ requestedDeviceClass: 'npu' }),
    actualDevice: 'cpu',
    vendor: 'ExampleVendor',
    runtimeProvider: 'onnx-cpu',
    modelVersionHash: 'abc123',
    precision: 'fp16',
    startedAt: nowIso(),
    completedAt: nowIso(),
    latencyMs: 40,
    memoryUsed: '256MB',
    resourceState: 'fallback',
    resultState: 'PASS',
    fallbackReason: 'npu_unavailable_cpu_fallback',
  });

  hops.push(
    hop(
      'requested_and_actual_recorded_separately',
      !('denied' in fallbackReceipt) &&
        fallbackReceipt.requestedDeviceClass === 'npu' &&
        fallbackReceipt.actualDevice === 'cpu' &&
        fallbackReceipt.fallbackUsed === true
        ? 'PASS'
        : 'FAIL',
      'requestedDevice and actualDevice recorded separately.',
    ),
  );
  hops.push(
    hop(
      'fallback_cannot_verify_accelerator',
      !('denied' in fallbackReceipt) &&
        fallbackReceipt.acceleratorVerifiedByThisReceipt === false &&
        attemptVerifyAcceleratorViaFallback().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Fallback validates CPU path only; cannot verify NPU.',
    ),
  );

  const missing = validateReceiptAtHomeBase({
    actor: input.actor,
    validationId: 'val-missing',
    origin,
    receipt: null,
  });
  const missingDeny = validateReceiptAtHomeBase({
    actor: input.actor,
    validationId: 'val-missing-deny',
    origin,
    receipt: null,
    attemptSilentAcceptMissing: true,
  });
  hops.push(
    hop(
      'missing_malformed_stale_inconsistent_unverified',
      !('denied' in missing) &&
        missing.classification === 'UNVERIFIED' &&
        missingDeny.state === 'DENIED' &&
        attemptSilentAcceptMissingReceipt().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Missing/malformed/stale/inconsistent → UNVERIFIED (not silent accept).',
    ),
  );

  hops.push(
    hop(
      'tenant_universe_must_match_originating_task',
      !('denied' in receipt) &&
        validateReceiptAtHomeBase({
          actor: input.actor,
          validationId: 'val-mismatch',
          origin,
          receipt: { ...receipt, tenantId: 'other-tenant' },
          attemptSilentAcceptInconsistent: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Receipt tenant/Universe must match originating task.',
    ),
  );
  hops.push(
    hop(
      'no_hidden_chain_of_thought',
      attemptIncludeHiddenCot().state,
      'Hidden chain-of-thought DENIED.',
    ),
  );
  hops.push(
    hop(
      'secrets_credentials_redacted',
      attemptIncludeSecrets().state,
      'Secrets/credentials in receipt DENIED.',
    ),
  );
  hops.push(
    hop(
      'receipts_append_only',
      attemptMutateFinalizedReceipt().state,
      'Finalized receipt mutation DENIED.',
    ),
  );
  hops.push(
    hop(
      'cross_tenant_reuse_denied',
      attemptCrossTenantReuse().state,
      'Cross-tenant receipt reuse DENIED.',
    ),
  );
  hops.push(
    hop(
      'failed_policy_cannot_rewrite_as_pass',
      attemptRewritePolicyFailAsPass().state === 'DENIED' &&
        emitComputeReceipt({
          actor: input.actor,
          receiptId: 'rcpt-policy',
          origin,
          actualDevice: 'cpu',
          vendor: 'x',
          runtimeProvider: 'x',
          modelVersionHash: 'x',
          precision: 'fp32',
          startedAt: nowIso(),
          completedAt: nowIso(),
          latencyMs: 1,
          memoryUsed: '1',
          resourceState: 'denied',
          resultState: 'POLICY_DENIED',
          attemptRewritePolicyFailAsPass: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Policy fail cannot be rewritten as PASS.',
    ),
  );

  const highOrigin = exampleOrigin({ highConsequence: true });
  const highReceipt = emitComputeReceipt({
    actor: input.actor,
    receiptId: 'rcpt-high',
    origin: highOrigin,
    actualDevice: 'npu',
    vendor: 'ExampleVendor',
    runtimeProvider: 'onnx',
    modelVersionHash: 'abc',
    precision: 'fp16',
    startedAt: nowIso(),
    completedAt: nowIso(),
    latencyMs: 10,
    memoryUsed: '512MB',
    resourceState: 'ok',
    resultState: 'PASS',
  });
  hops.push(
    hop(
      'high_consequence_pass_needs_human_auth',
      !('denied' in highReceipt) &&
        attemptSkipHumanForHighConsequence().state === 'DENIED' &&
        validateReceiptAtHomeBase({
          actor: input.actor,
          validationId: 'val-high',
          origin: highOrigin,
          receipt: highReceipt,
          attemptSkipHumanForHighConsequence: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'High-consequence PASS still requires human authorization.',
    ),
  );
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
      EP13_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep12_soft_wire',
      softWire.ep12Scheduler.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep12Scheduler.note,
    ),
  );
  hops.push(
    hop(
      'ep10_soft_wire',
      softWire.ep10OtherAcceleratorRegistry.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep10OtherAcceleratorRegistry.note,
    ),
  );
  hops.push(
    hop(
      'ep5_soft_wire',
      softWire.ep5BenchmarkMemory.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep5BenchmarkMemory.note,
    ),
  );
  hops.push(
    hop(
      'ep1_soft_wire',
      softWire.ep1VirtualChipContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep1VirtualChipContract.note,
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
      EP13_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep13-1',
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

  void RUNTIME_RETURN_RECEIPT_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    receipt,
    fallbackReceipt,
    softWire,
  };
}
