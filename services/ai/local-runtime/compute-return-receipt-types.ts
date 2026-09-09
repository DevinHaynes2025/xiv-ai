/**
 * 62L-EM8 — Compute Return Receipt types
 *
 * Every compute execution returns a structured receipt so Home Base knows
 * exactly what device, runtime, model, and fallback path actually handled
 * the task.
 *
 * Hard rule: requestedDevice ≠ actualDevice must be recorded honestly.
 * CPU result after NPU request may be valid; it does NOT verify the NPU.
 */

export type ComputeDeviceKind = 'CPU' | 'GPU' | 'NPU' | 'EDGE' | 'CLOUD_AUTHORIZED';

/**
 * Receipt result states (EM8 contract).
 * UNVERIFIED is an ingest/verification outcome for missing/malformed receipts,
 * not a successful compute resultState.
 */
export type ComputeReceiptResultState =
  | 'PASS'
  | 'FAIL'
  | 'PARTIAL'
  | 'DEGRADED'
  | 'TIMEOUT'
  | 'RESOURCE_LIMIT'
  | 'PROVIDER_UNAVAILABLE'
  | 'POLICY_DENIED';

export type ComputeReceiptFailureClass =
  | null
  | 'NONE'
  | 'EXECUTION_ERROR'
  | 'TIMEOUT'
  | 'RESOURCE_LIMIT'
  | 'PROVIDER_UNAVAILABLE'
  | 'POLICY_DENIED'
  | 'SILENT_FALLBACK_TO_CPU'
  | 'DEVICE_MISMATCH'
  | 'TENANT_MISMATCH'
  | 'UNIVERSE_MISMATCH'
  | 'SCHEMA_INVALID'
  | 'SIGNATURE_INVALID'
  | 'RECEIPT_MUTATION_DENIED'
  | 'STALE_EVIDENCE'
  | 'HIDDEN_COT_FORBIDDEN'
  | 'HIGH_CONSEQUENCE_NEEDS_HUMAN'
  | 'MISSING_RECEIPT'
  | 'MALFORMED_RECEIPT';

export type ResourceUsageSnapshot = {
  cpuPercentObserved: number | null;
  memoryMbObserved: number | null;
  gpuMemoryMbObserved: number | null;
  npuMemoryMbObserved: number | null;
  concurrencyObserved: number | null;
  notes: readonly string[];
};

export type ModelIdentity = {
  modelId: string;
  /** Version string and/or content hash — required for audit. */
  modelVersionOrHash: string;
};

/**
 * Draft (mutable) receipt fields before finalize.
 * Must not include hidden chain-of-thought.
 */
export type ComputeReturnReceiptDraft = {
  requestId: string;
  agentId: string;
  taskId: string;
  homeUniverseId: string;
  tenantId: string;
  requestedDevice: ComputeDeviceKind;
  actualDevice: ComputeDeviceKind;
  nodeId: string;
  /** Runtime / provider that executed (e.g. onnxruntime-cpu, windows-ml, cuda-candidate). */
  runtimeProvider: string;
  model: ModelIdentity;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  resourceUsage: ResourceUsageSnapshot;
  fallbackUsed: boolean;
  resultState: ComputeReceiptResultState;
  failureClass: ComputeReceiptFailureClass;
  evidenceRefs: readonly string[];
  /** High-consequence flag — Home Base still requires human approval on PASS. */
  highConsequence: boolean;
  humanAuthorized: boolean;
  /** Explicit forbid: never store raw CoT. */
  hiddenChainOfThought: null;
  /** Optional evidence freshness timestamp (ISO). */
  evidenceObservedAt: string | null;
  /** Max age in ms before evidence is stale (null = no staleness check). */
  evidenceMaxAgeMs: number | null;
};

export type ReceiptLifecycle = 'DRAFT' | 'FINALIZED';

/**
 * Finalized immutable receipt payload (pre-signature body).
 */
export type ComputeReturnReceiptPayload = Readonly<ComputeReturnReceiptDraft> & {
  readonly lifecycle: 'FINALIZED';
  readonly finalizedAt: string;
  /** Whether requested accelerator hardware was verified by this execution. */
  readonly requestedHardwareVerified: boolean;
};

export type SignedComputeReturnReceipt = {
  readonly payload: ComputeReturnReceiptPayload;
  readonly receiptSignature: string;
  readonly algorithm: 'HMAC-SHA256';
  readonly signedAt: string;
  readonly keyId: string;
};

/** Originating request identity used for tenant/universe match checks. */
export type OriginatingComputeRequest = {
  requestId: string;
  agentId: string;
  taskId: string;
  homeUniverseId: string;
  tenantId: string;
  requestedDevice: ComputeDeviceKind;
  highConsequence?: boolean;
};

export type ReceiptVerificationStatus =
  | 'VERIFIED_RECEIPT'
  | 'UNVERIFIED'
  | 'REJECTED';

export type HomeBaseIngestDecision = {
  accepted: boolean;
  verificationStatus: ReceiptVerificationStatus;
  reasons: string[];
  receiptRef: string | null;
  requestedHardwareVerified: boolean;
  requiresHumanApproval: boolean;
  softWireEm1Gate: boolean;
};

export type NeuralPathwayIngestRecord = {
  pathwayId: string;
  receiptRef: string;
  requestId: string;
  agentId: string;
  preservedAt: string;
  verificationStatus: ReceiptVerificationStatus;
};
