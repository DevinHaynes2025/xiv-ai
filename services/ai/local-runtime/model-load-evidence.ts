/**
 * 62L-EL8 — Model-load evidence schema.
 *
 * Configuration ≠ working inference. Evidence records capture concrete proof
 * that a local model/provider combination actually loaded and ran.
 */

import type { CapabilityState, ComputeKind } from './types';

/** Hard verification progression — no skipping. */
export const VERIFICATION_PROGRESSION = [
  'AVAILABLE',
  'CONFIGURED',
  'SUPPORTED',
  'MODEL_LOADED',
  'INFERENCE_PASSED',
  'VERIFIED',
] as const;

export type VerificationStage = (typeof VERIFICATION_PROGRESSION)[number];

export type ExecutionProviderKind = 'CPU' | 'GPU' | 'NPU';

export type DeviceTruthState =
  | CapabilityState
  | 'DETECTED'
  | 'SUPPORTED'
  | 'NOT_TESTED'
  | 'DEGRADED'
  | 'UNAVAILABLE';

export type FailureClass =
  | 'NONE'
  | 'MODEL_FILE_MISSING'
  | 'PROVIDER_INIT_FAILED'
  | 'SILENT_FALLBACK_TO_CPU'
  | 'INFERENCE_TIMEOUT'
  | 'OUTPUT_INVALID'
  | 'RESOURCE_CEILING_EXCEEDED'
  | 'EVIDENCE_STALE'
  | 'COMBINATION_NOT_RUN'
  | 'SESSION_INIT_FAILED'
  | 'CLAIM_WITHOUT_EVIDENCE';

export type SoftwareRuntimeVersions = {
  node?: string;
  onnxRuntime?: string;
  windowsMl?: string;
  platform?: string;
  arch?: string;
  additional?: Record<string, string>;
};

export type MemoryResourceObservation = {
  rssBytes?: number;
  heapUsedBytes?: number;
  modelBytes?: number;
  peakWorkingSetBytes?: number;
  notes?: string[];
};

export type BoundedTestInput = {
  kind: 'text' | 'tensor' | 'tokens' | 'bytes';
  payload: string | number[];
  maxTokens?: number;
  timeoutMs?: number;
};

/**
 * Concrete evidence required before VERIFIED.
 * All fields are representable in evidence/ledger records.
 */
export type ModelLoadEvidence = {
  /** Exact model ID. */
  modelId: string;
  /** Version string and/or content hash. */
  modelVersionOrHash: string;
  /** Provider the caller requested. */
  requestedProvider: ExecutionProviderKind;
  /** Provider that actually executed (after EP selection). */
  actualProvider: ExecutionProviderKind | null;
  /** Device truth at test time (probe/registry state). */
  deviceTruthState: DeviceTruthState;
  /** Model-load wall-clock window. */
  loadStartedAt: string | null;
  loadEndedAt: string | null;
  /** Successful session/runtime initialization. */
  sessionInitialized: boolean;
  /** Bounded test input used for inference. */
  boundedTestInput: BoundedTestInput | null;
  /** Successful inference output (stringified / summarized). */
  inferenceOutput: string | null;
  /** End-to-end inference latency in ms. */
  latencyMs: number | null;
  /** Memory/resource observations where available. */
  memoryObservations: MemoryResourceObservation | null;
  /** Failure class if anything breaks. */
  failureClass: FailureClass;
  /** Software/runtime versions observed. */
  softwareRuntimeVersions: SoftwareRuntimeVersions;
  /** Machine/runtime timestamp for the evidence sample. */
  machineRuntimeTimestamp: string;
  /** Reference stored in the audit/runtime ledger. */
  evidenceRef: string | null;
  /** Whether the model file was present. */
  modelFilePresent: boolean;
  /** Whether provider initialize succeeded for the *requested* EP. */
  providerInitialized: boolean;
  /** Whether inference completed within timeout. */
  inferenceTimedOut: boolean;
  /** Whether inference output passed validity checks. */
  outputValid: boolean | null;
  /** Whether resource ceilings were respected. */
  resourceCeilingsOk: boolean;
  /** Whether this evidence sample is considered fresh. */
  evidenceFresh: boolean;
  /** Whether the model/provider combination actually ran. */
  combinationRan: boolean;
};

export type AcceleratorVerificationOutcome = {
  /** Requested accelerator (GPU/NPU) verification state — never VERIFIED on silent CPU fallback. */
  acceleratorState: CapabilityState;
  /** CPU fallback may be verified independently when actualProvider === CPU. */
  cpuFallbackState: CapabilityState | null;
  silentFallbackDetected: boolean;
  reason: string;
};

export function computeKindToProvider(kind: ComputeKind): ExecutionProviderKind {
  if (kind === 'gpu') return 'GPU';
  if (kind === 'npu') return 'NPU';
  return 'CPU';
}

export function providerToComputeKind(provider: ExecutionProviderKind): ComputeKind {
  if (provider === 'GPU') return 'gpu';
  if (provider === 'NPU') return 'npu';
  return 'cpu';
}

/** Empty / default evidence — combination has not run. */
export function createEmptyEvidence(
  partial: Partial<ModelLoadEvidence> & Pick<ModelLoadEvidence, 'modelId' | 'requestedProvider'>,
): ModelLoadEvidence {
  const now = new Date().toISOString();
  return {
    modelId: partial.modelId,
    modelVersionOrHash: partial.modelVersionOrHash ?? '',
    requestedProvider: partial.requestedProvider,
    actualProvider: partial.actualProvider ?? null,
    deviceTruthState: partial.deviceTruthState ?? 'NOT_TESTED',
    loadStartedAt: partial.loadStartedAt ?? null,
    loadEndedAt: partial.loadEndedAt ?? null,
    sessionInitialized: partial.sessionInitialized ?? false,
    boundedTestInput: partial.boundedTestInput ?? null,
    inferenceOutput: partial.inferenceOutput ?? null,
    latencyMs: partial.latencyMs ?? null,
    memoryObservations: partial.memoryObservations ?? null,
    failureClass: partial.failureClass ?? 'COMBINATION_NOT_RUN',
    softwareRuntimeVersions: partial.softwareRuntimeVersions ?? {},
    machineRuntimeTimestamp: partial.machineRuntimeTimestamp ?? now,
    evidenceRef: partial.evidenceRef ?? null,
    modelFilePresent: partial.modelFilePresent ?? false,
    providerInitialized: partial.providerInitialized ?? false,
    inferenceTimedOut: partial.inferenceTimedOut ?? false,
    outputValid: partial.outputValid ?? null,
    resourceCeilingsOk: partial.resourceCeilingsOk ?? true,
    evidenceFresh: partial.evidenceFresh ?? true,
    combinationRan: partial.combinationRan ?? false,
  };
}

/** Detect silent accelerator→CPU fallback. */
export function detectSilentFallback(evidence: ModelLoadEvidence): boolean {
  const requestedAccel =
    evidence.requestedProvider === 'GPU' || evidence.requestedProvider === 'NPU';
  if (!requestedAccel) return false;
  if (evidence.actualProvider == null) return false;
  return evidence.actualProvider === 'CPU';
}

/**
 * Silent fallback cannot count as accelerator verification.
 * CPU fallback may verify CPU only; accelerator remains NOT_TESTED / DETECTED / SUPPORTED.
 */
export function resolveAcceleratorVerification(
  evidence: ModelLoadEvidence,
  options: {
    deviceDetected?: boolean;
    deviceSupported?: boolean;
    /** When true and no silent fallback, full VERIFIED path allowed for requested EP. */
    allowAcceleratorVerified?: boolean;
  } = {},
): AcceleratorVerificationOutcome {
  const silent = detectSilentFallback(evidence) || evidence.failureClass === 'SILENT_FALLBACK_TO_CPU';

  if (silent) {
    let acceleratorState: CapabilityState = 'NOT_TESTED';
    if (options.deviceSupported) acceleratorState = 'SUPPORTED';
    else if (options.deviceDetected) acceleratorState = 'DETECTED';

    const cpuOk =
      evidence.combinationRan &&
      evidence.sessionInitialized &&
      evidence.inferenceOutput != null &&
      evidence.outputValid === true &&
      !evidence.inferenceTimedOut &&
      evidence.resourceCeilingsOk &&
      evidence.evidenceFresh &&
      evidence.modelFilePresent;

    return {
      acceleratorState,
      cpuFallbackState: cpuOk ? 'VERIFIED' : evidence.modelFilePresent ? 'DEGRADED' : 'NOT_TESTED',
      silentFallbackDetected: true,
      reason:
        'SILENT_FALLBACK: requested accelerator executed on CPU — accelerator remains unverified; CPU fallback may verify separately.',
    };
  }

  if (evidence.requestedProvider === 'CPU') {
    return {
      acceleratorState: 'NOT_TESTED',
      cpuFallbackState: null,
      silentFallbackDetected: false,
      reason: 'CPU was requested; no accelerator verification claim.',
    };
  }

  if (options.allowAcceleratorVerified === true) {
    return {
      acceleratorState: 'VERIFIED',
      cpuFallbackState: null,
      silentFallbackDetected: false,
      reason: 'Requested accelerator executed on requested EP with full evidence.',
    };
  }

  let acceleratorState: CapabilityState = 'NOT_TESTED';
  if (options.deviceSupported) acceleratorState = 'SUPPORTED';
  else if (options.deviceDetected) acceleratorState = 'DETECTED';

  return {
    acceleratorState,
    cpuFallbackState: null,
    silentFallbackDetected: false,
    reason: 'Accelerator not yet VERIFIED — evidence incomplete or combination not run on requested EP.',
  };
}
