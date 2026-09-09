/**
 * 62L-EM8 — Compute Return Receipt
 *
 * Structured receipt for every compute execution:
 * requestId, agentId, taskId, homeUniverseId, tenantId,
 * requestedDevice, actualDevice, nodeId, runtime/provider,
 * modelId + version/hash, startedAt, completedAt, latencyMs,
 * resourceUsage, fallbackUsed, resultState, failureClass,
 * evidenceRefs, receiptSignature.
 *
 * Hard rule: Requested hardware ≠ actual hardware must be honest.
 * If agent asks for NPU but runtime executes on CPU:
 *   requestedDevice=NPU, actualDevice=CPU, fallbackUsed=true
 * CPU result may be valid; it does NOT verify the NPU.
 *
 * Finalized receipts are immutable audit artifacts.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  EM8_CORE_FLOW,
  EM8_HONESTY_BANNER,
  EM8_LOCKS,
  NEXT_PHASE_EM9,
  assertEm8LocksIntact,
  em8HonestySnapshot,
} from './em8-honesty';
import { em8SoftWireSnapshot } from './em8-soft-wire';
import type {
  ComputeDeviceKind,
  ComputeReturnReceiptDraft,
  ComputeReturnReceiptPayload,
  OriginatingComputeRequest,
  ResourceUsageSnapshot,
  SignedComputeReturnReceipt,
} from './compute-return-receipt-types';

export {
  EM8_CORE_FLOW,
  EM8_HONESTY_BANNER,
  EM8_LOCKS,
  NEXT_PHASE_EM9,
  assertEm8LocksIntact,
  em8HonestySnapshot,
} from './em8-honesty';
export { em8SoftWireSnapshot, probeEm8SoftWires } from './em8-soft-wire';
export type * from './compute-return-receipt-types';

export const EM8_DEFAULT_KEY_ID = 'xiv-em8-compute-receipt-dev' as const;

/** In-memory sealed finalized receipts — mutation attempts are denied. */
const finalizedSeal = new WeakSet<object>();

function isNonEmpty(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function emptyUsage(notes: readonly string[] = []): ResourceUsageSnapshot {
  return {
    cpuPercentObserved: null,
    memoryMbObserved: null,
    gpuMemoryMbObserved: null,
    npuMemoryMbObserved: null,
    concurrencyObserved: null,
    notes,
  };
}

/**
 * Derive fallbackUsed + requestedHardwareVerified from device honesty.
 * Requested ≠ actual ⇒ fallback; never verifies the requested accelerator.
 */
export function deriveDeviceHonesty(
  requestedDevice: ComputeDeviceKind,
  actualDevice: ComputeDeviceKind,
): {
  fallbackUsed: boolean;
  requestedHardwareVerified: boolean;
  failureClassHint: 'SILENT_FALLBACK_TO_CPU' | 'DEVICE_MISMATCH' | null;
} {
  const fallbackUsed = requestedDevice !== actualDevice;
  if (!fallbackUsed) {
    return {
      fallbackUsed: false,
      requestedHardwareVerified: true,
      failureClassHint: null,
    };
  }
  const failureClassHint =
    actualDevice === 'CPU' &&
    (requestedDevice === 'NPU' || requestedDevice === 'GPU')
      ? 'SILENT_FALLBACK_TO_CPU'
      : 'DEVICE_MISMATCH';
  return {
    fallbackUsed: true,
    // CPU (or other) success does NOT verify the requested accelerator.
    requestedHardwareVerified: false,
    failureClassHint,
  };
}

export function createReceiptDraft(
  input: Partial<ComputeReturnReceiptDraft> &
    Pick<
      ComputeReturnReceiptDraft,
      | 'requestId'
      | 'agentId'
      | 'taskId'
      | 'homeUniverseId'
      | 'tenantId'
      | 'requestedDevice'
      | 'actualDevice'
      | 'nodeId'
      | 'runtimeProvider'
      | 'model'
      | 'startedAt'
      | 'completedAt'
      | 'resultState'
    >,
): ComputeReturnReceiptDraft {
  const honesty = deriveDeviceHonesty(
    input.requestedDevice,
    input.actualDevice,
  );
  const started = Date.parse(input.startedAt);
  const completed = Date.parse(input.completedAt);
  const latencyMs =
    input.latencyMs ??
    (Number.isFinite(started) && Number.isFinite(completed)
      ? Math.max(0, completed - started)
      : 0);

  const fallbackUsed = input.fallbackUsed ?? honesty.fallbackUsed;
  let failureClass = input.failureClass ?? null;
  if (
    fallbackUsed &&
    honesty.failureClassHint &&
    (failureClass == null || failureClass === 'NONE')
  ) {
    failureClass = honesty.failureClassHint;
  }

  return {
    requestId: input.requestId,
    agentId: input.agentId,
    taskId: input.taskId,
    homeUniverseId: input.homeUniverseId,
    tenantId: input.tenantId,
    requestedDevice: input.requestedDevice,
    actualDevice: input.actualDevice,
    nodeId: input.nodeId,
    runtimeProvider: input.runtimeProvider,
    model: {
      modelId: input.model.modelId,
      modelVersionOrHash: input.model.modelVersionOrHash,
    },
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    latencyMs,
    resourceUsage: input.resourceUsage ?? emptyUsage(),
    fallbackUsed,
    resultState: input.resultState,
    failureClass,
    evidenceRefs: Object.freeze([...(input.evidenceRefs ?? [])]),
    highConsequence: input.highConsequence ?? false,
    humanAuthorized: input.humanAuthorized ?? false,
    hiddenChainOfThought: null,
    evidenceObservedAt: input.evidenceObservedAt ?? null,
    evidenceMaxAgeMs: input.evidenceMaxAgeMs ?? null,
  };
}

function validateDraftShape(draft: ComputeReturnReceiptDraft): string[] {
  const reasons: string[] = [];
  const requiredStrings: Array<[keyof ComputeReturnReceiptDraft, string]> = [
    ['requestId', 'requestId'],
    ['agentId', 'agentId'],
    ['taskId', 'taskId'],
    ['homeUniverseId', 'homeUniverseId'],
    ['tenantId', 'tenantId'],
    ['nodeId', 'nodeId'],
    ['runtimeProvider', 'runtimeProvider'],
    ['startedAt', 'startedAt'],
    ['completedAt', 'completedAt'],
  ];
  for (const [key, label] of requiredStrings) {
    const v = draft[key];
    if (typeof v !== 'string' || !isNonEmpty(v)) {
      reasons.push(`${label} is required.`);
    }
  }
  if (!draft.model || !isNonEmpty(draft.model.modelId)) {
    reasons.push('model.modelId is required.');
  }
  if (!draft.model || !isNonEmpty(draft.model.modelVersionOrHash)) {
    reasons.push('model.modelVersionOrHash is required.');
  }
  if (!Number.isFinite(draft.latencyMs) || draft.latencyMs < 0) {
    reasons.push('latencyMs must be a finite non-negative number.');
  }
  if (draft.hiddenChainOfThought != null) {
    reasons.push('hiddenChainOfThought must be null — no CoT on receipts.');
  }
  if (
    Object.prototype.hasOwnProperty.call(draft as object, 'chainOfThought') ||
    Object.prototype.hasOwnProperty.call(draft as object, 'hiddenEvidence')
  ) {
    reasons.push('Hidden evidence / chain-of-thought fields are forbidden.');
  }

  const honesty = deriveDeviceHonesty(
    draft.requestedDevice,
    draft.actualDevice,
  );
  if (honesty.fallbackUsed && draft.fallbackUsed !== true) {
    reasons.push(
      'fallbackUsed must be true when requestedDevice ≠ actualDevice.',
    );
  }
  if (!honesty.fallbackUsed && draft.fallbackUsed === true) {
    reasons.push(
      'fallbackUsed is true but requestedDevice === actualDevice.',
    );
  }
  return reasons;
}

/**
 * Stale runtime evidence cannot promote hardware capability.
 */
export function isEvidenceStale(
  draft: Pick<
    ComputeReturnReceiptDraft,
    'evidenceObservedAt' | 'evidenceMaxAgeMs' | 'completedAt'
  >,
  now: Date = new Date(),
): boolean {
  if (
    draft.evidenceMaxAgeMs == null ||
    !Number.isFinite(draft.evidenceMaxAgeMs) ||
    draft.evidenceMaxAgeMs < 0
  ) {
    return false;
  }
  const observedRaw = draft.evidenceObservedAt ?? draft.completedAt;
  const observed = Date.parse(observedRaw);
  if (!Number.isFinite(observed)) return true;
  return now.getTime() - observed > draft.evidenceMaxAgeMs;
}

function canonicalPayload(payload: ComputeReturnReceiptPayload): string {
  // Stable key order for HMAC — nested objects sorted shallowly.
  const ordered = {
    requestId: payload.requestId,
    agentId: payload.agentId,
    taskId: payload.taskId,
    homeUniverseId: payload.homeUniverseId,
    tenantId: payload.tenantId,
    requestedDevice: payload.requestedDevice,
    actualDevice: payload.actualDevice,
    nodeId: payload.nodeId,
    runtimeProvider: payload.runtimeProvider,
    model: {
      modelId: payload.model.modelId,
      modelVersionOrHash: payload.model.modelVersionOrHash,
    },
    startedAt: payload.startedAt,
    completedAt: payload.completedAt,
    latencyMs: payload.latencyMs,
    resourceUsage: payload.resourceUsage,
    fallbackUsed: payload.fallbackUsed,
    resultState: payload.resultState,
    failureClass: payload.failureClass,
    evidenceRefs: [...payload.evidenceRefs],
    highConsequence: payload.highConsequence,
    humanAuthorized: payload.humanAuthorized,
    hiddenChainOfThought: null,
    evidenceObservedAt: payload.evidenceObservedAt,
    evidenceMaxAgeMs: payload.evidenceMaxAgeMs,
    lifecycle: payload.lifecycle,
    finalizedAt: payload.finalizedAt,
    requestedHardwareVerified: payload.requestedHardwareVerified,
  };
  return JSON.stringify(ordered);
}

export type FinalizeReceiptResult =
  | { ok: true; receipt: SignedComputeReturnReceipt }
  | { ok: false; reasons: string[] };

/**
 * Finalize + sign a receipt. Once finalized, the payload is sealed immutable.
 */
export function finalizeAndSignReceipt(
  draft: ComputeReturnReceiptDraft,
  secret: string,
  options: {
    keyId?: string;
    now?: Date;
  } = {},
): FinalizeReceiptResult {
  const reasons = validateDraftShape(draft);
  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  const now = options.now ?? new Date();
  if (isEvidenceStale(draft, now)) {
    return {
      ok: false,
      reasons: [
        'Stale runtime evidence cannot promote hardware capability (EM8).',
      ],
    };
  }

  const honesty = deriveDeviceHonesty(
    draft.requestedDevice,
    draft.actualDevice,
  );

  const payload: ComputeReturnReceiptPayload = Object.freeze({
    ...draft,
    model: Object.freeze({ ...draft.model }),
    resourceUsage: Object.freeze({
      ...draft.resourceUsage,
      notes: Object.freeze([...draft.resourceUsage.notes]),
    }),
    evidenceRefs: Object.freeze([...draft.evidenceRefs]),
    hiddenChainOfThought: null,
    fallbackUsed: honesty.fallbackUsed,
    lifecycle: 'FINALIZED',
    finalizedAt: now.toISOString(),
    requestedHardwareVerified: honesty.requestedHardwareVerified,
  });

  const keyId = options.keyId ?? EM8_DEFAULT_KEY_ID;
  const signedAt = now.toISOString();
  const receiptSignature = createHmac('sha256', secret)
    .update(`${keyId}\n${signedAt}\n${canonicalPayload(payload)}`)
    .digest('hex');

  const receipt: SignedComputeReturnReceipt = Object.freeze({
    payload,
    receiptSignature,
    algorithm: 'HMAC-SHA256' as const,
    signedAt,
    keyId,
  });

  finalizedSeal.add(payload);
  finalizedSeal.add(receipt);
  return { ok: true, receipt };
}

/**
 * Deny mutation of a finalized receipt audit artifact.
 * Returns a frozen clone; never mutates the sealed original.
 */
export function attemptMutateFinalizedReceipt(
  receipt: SignedComputeReturnReceipt,
  patch: Partial<ComputeReturnReceiptDraft>,
): {
  allowed: false;
  reason: string;
  receipt: SignedComputeReturnReceipt;
  patchIgnored: Partial<ComputeReturnReceiptDraft>;
} {
  void patch;
  if (!finalizedSeal.has(receipt.payload) && receipt.payload.lifecycle === 'FINALIZED') {
    // Still deny — lifecycle says finalized even if WeakSet missed (e.g. deserialize).
  }
  return {
    allowed: false,
    reason:
      'Finalized compute return receipts are immutable audit artifacts (EM8).',
    receipt,
    patchIgnored: { ...patch },
  };
}

export function isFinalizedReceiptSealed(
  receipt: SignedComputeReturnReceipt,
): boolean {
  return (
    receipt.payload.lifecycle === 'FINALIZED' &&
    (finalizedSeal.has(receipt.payload) || finalizedSeal.has(receipt))
  );
}

export type VerifyReceiptResult = {
  ok: boolean;
  reasons: string[];
  requestedHardwareVerified: boolean;
};

/**
 * Structural + signature verification of a signed receipt.
 */
export function verifySignedReceipt(
  receipt: SignedComputeReturnReceipt | null | undefined,
  secret: string,
  origin?: OriginatingComputeRequest,
  now: Date = new Date(),
): VerifyReceiptResult {
  const reasons: string[] = [];
  if (receipt == null || typeof receipt !== 'object') {
    return {
      ok: false,
      reasons: ['Missing compute return receipt → UNVERIFIED.'],
      requestedHardwareVerified: false,
    };
  }

  if (!receipt.payload || receipt.payload.lifecycle !== 'FINALIZED') {
    reasons.push('Receipt is not FINALIZED.');
  }
  if (receipt.algorithm !== 'HMAC-SHA256') {
    reasons.push('Unsupported receiptSignature algorithm.');
  }
  if (!isNonEmpty(receipt.receiptSignature)) {
    reasons.push('receiptSignature is required.');
  }
  if (receipt.payload?.hiddenChainOfThought != null) {
    reasons.push('hiddenChainOfThought must be null on receipts.');
  }

  if (receipt.payload) {
    reasons.push(...validateDraftShape(receipt.payload));
    if (isEvidenceStale(receipt.payload, now)) {
      reasons.push(
        'Stale runtime evidence cannot promote hardware capability.',
      );
    }
  }

  if (origin && receipt.payload) {
    if (receipt.payload.requestId !== origin.requestId) {
      reasons.push('Receipt requestId does not match originating request.');
    }
    if (receipt.payload.agentId !== origin.agentId) {
      reasons.push('Receipt agentId does not match originating request.');
    }
    if (receipt.payload.taskId !== origin.taskId) {
      reasons.push('Receipt taskId does not match originating request.');
    }
    if (receipt.payload.homeUniverseId !== origin.homeUniverseId) {
      reasons.push(
        'Receipt homeUniverseId does not match originating request.',
      );
    }
    if (receipt.payload.tenantId !== origin.tenantId) {
      reasons.push('Receipt tenantId does not match originating request.');
    }
    if (receipt.payload.requestedDevice !== origin.requestedDevice) {
      reasons.push(
        'Receipt requestedDevice does not match originating request.',
      );
    }
  }

  if (receipt.payload && isNonEmpty(receipt.receiptSignature)) {
    const expected = createHmac('sha256', secret)
      .update(
        `${receipt.keyId}\n${receipt.signedAt}\n${canonicalPayload(receipt.payload)}`,
      )
      .digest('hex');
    try {
      const a = Buffer.from(expected, 'hex');
      const b = Buffer.from(receipt.receiptSignature, 'hex');
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        reasons.push('receiptSignature mismatch.');
      }
    } catch {
      reasons.push('receiptSignature malformed.');
    }
  }

  const honesty = receipt.payload
    ? deriveDeviceHonesty(
        receipt.payload.requestedDevice,
        receipt.payload.actualDevice,
      )
    : { requestedHardwareVerified: false, fallbackUsed: true, failureClassHint: null };

  // Stale evidence never promotes hardware even if devices matched.
  const requestedHardwareVerified =
    reasons.length === 0 &&
    honesty.requestedHardwareVerified &&
    !isEvidenceStale(receipt.payload, now);

  return {
    ok: reasons.length === 0,
    reasons,
    requestedHardwareVerified,
  };
}

/**
 * Classify compute outcome for Home Base when receipt is missing/malformed.
 */
export function classifyReceiptOrUnverified(
  receipt: SignedComputeReturnReceipt | null | undefined,
  secret: string,
  origin?: OriginatingComputeRequest,
): {
  verificationStatus: 'VERIFIED_RECEIPT' | 'UNVERIFIED';
  reasons: string[];
  requestedHardwareVerified: false | boolean;
} {
  if (receipt == null) {
    return {
      verificationStatus: 'UNVERIFIED',
      reasons: ['Missing compute return receipt → results UNVERIFIED.'],
      requestedHardwareVerified: false,
    };
  }
  const verified = verifySignedReceipt(receipt, secret, origin);
  if (!verified.ok) {
    return {
      verificationStatus: 'UNVERIFIED',
      reasons: [
        'Malformed or invalid compute return receipt → results UNVERIFIED.',
        ...verified.reasons,
      ],
      requestedHardwareVerified: false,
    };
  }
  return {
    verificationStatus: 'VERIFIED_RECEIPT',
    reasons: ['Signed compute return receipt verified.'],
    requestedHardwareVerified: verified.requestedHardwareVerified,
  };
}
