/**
 * 62L-EL8 — Verification graduation gate.
 *
 * Progression (hard, no skip):
 * AVAILABLE → CONFIGURED → SUPPORTED → MODEL_LOADED → INFERENCE_PASSED → VERIFIED
 *
 * Configuration ≠ working inference. No unrun test is PASS.
 * Silent CPU fallback cannot VERIFIED the requested accelerator.
 */

import {
  VERIFICATION_PROGRESSION,
  createEmptyEvidence,
  detectSilentFallback,
  resolveAcceleratorVerification,
  type FailureClass,
  type ModelLoadEvidence,
  type VerificationStage,
  type AcceleratorVerificationOutcome,
} from './model-load-evidence';
import {
  appendEvidenceToLedger,
  type EvidenceLedgerEntry,
  type RuntimeEvidenceLedger,
} from './evidence-ledger';
import { EL8_LOCKS } from './el8-honesty';
import { softWireRunLocalInference } from './el7-soft-wire';

export type GraduationAdvanceResult = {
  allowed: boolean;
  from: VerificationStage;
  to: VerificationStage;
  resultingStage: VerificationStage;
  skippedStages: VerificationStage[];
  reason: string;
};

export type VerificationGateResult = {
  stage: VerificationStage;
  verified: boolean;
  modelLoadVerified: boolean;
  inferencePassed: boolean;
  failureClass: FailureClass;
  evidence: ModelLoadEvidence;
  accelerator: AcceleratorVerificationOutcome;
  ledgerEntry: EvidenceLedgerEntry | null;
  locks: typeof EL8_LOCKS;
  reason: string;
  softWire: ReturnType<typeof softWireRunLocalInference>;
};

function stageIndex(stage: VerificationStage): number {
  return VERIFICATION_PROGRESSION.indexOf(stage);
}

export function skippedGraduationStages(
  from: VerificationStage,
  to: VerificationStage,
): VerificationStage[] {
  const fromIdx = stageIndex(from);
  const toIdx = stageIndex(to);
  if (fromIdx < 0 || toIdx < 0 || toIdx <= fromIdx + 1) return [];
  return [...VERIFICATION_PROGRESSION.slice(fromIdx + 1, toIdx)];
}

/**
 * Encode + enforce deny-skip on the verification progression.
 * CONFIGURED → VERIFIED (and any non-adjacent jump) is denied.
 */
export function advanceVerificationStage(
  from: VerificationStage,
  to: VerificationStage,
): GraduationAdvanceResult {
  if (from === to) {
    return {
      allowed: true,
      from,
      to,
      resultingStage: from,
      skippedStages: [],
      reason: 'NO_OP_SAME_STAGE',
    };
  }

  const fromIdx = stageIndex(from);
  const toIdx = stageIndex(to);

  if (toIdx < fromIdx) {
    return {
      allowed: true,
      from,
      to,
      resultingStage: to,
      skippedStages: [],
      reason: 'DOWNGRADE_OR_RECLASSIFY_ALLOWED',
    };
  }

  const skipped = skippedGraduationStages(from, to);
  if (skipped.length > 0) {
    return {
      allowed: false,
      from,
      to,
      resultingStage: from,
      skippedStages: skipped,
      reason: 'DENY_SKIP_IN_VERIFICATION_PROGRESSION',
    };
  }

  return {
    allowed: true,
    from,
    to,
    resultingStage: to,
    skippedStages: [],
    reason: 'ADJACENT_PROMOTION_ALLOWED',
  };
}

function classifyFailure(evidence: ModelLoadEvidence): FailureClass {
  if (evidence.failureClass !== 'NONE' && evidence.failureClass !== 'COMBINATION_NOT_RUN') {
    return evidence.failureClass;
  }
  if (!evidence.modelFilePresent) return 'MODEL_FILE_MISSING';
  if (!evidence.providerInitialized) return 'PROVIDER_INIT_FAILED';
  if (detectSilentFallback(evidence)) return 'SILENT_FALLBACK_TO_CPU';
  if (evidence.inferenceTimedOut) return 'INFERENCE_TIMEOUT';
  if (evidence.outputValid === false) return 'OUTPUT_INVALID';
  if (!evidence.resourceCeilingsOk) return 'RESOURCE_CEILING_EXCEEDED';
  if (!evidence.evidenceFresh) return 'EVIDENCE_STALE';
  if (!evidence.combinationRan) return 'COMBINATION_NOT_RUN';
  return 'NONE';
}

/**
 * Derive the highest honest stage from evidence. Never skips.
 * VERIFIED requires full chain + matching EP (no silent fallback for accelerator claim).
 */
export function deriveStageFromEvidence(evidence: ModelLoadEvidence): {
  stage: VerificationStage;
  failureClass: FailureClass;
  reason: string;
} {
  const failureClass = classifyFailure(evidence);

  // Remain NOT_TESTED / DEGRADED / UNAVAILABLE style outcomes map to early stages.
  if (!evidence.modelFilePresent || failureClass === 'MODEL_FILE_MISSING') {
    return {
      stage: 'AVAILABLE',
      failureClass: 'MODEL_FILE_MISSING',
      reason: 'Model file missing — cannot leave AVAILABLE toward CONFIGURED.',
    };
  }

  // File present → at least AVAILABLE; configuration claimed?
  // CONFIGURED requires model present + provider declared.
  if (!evidence.providerInitialized && failureClass === 'PROVIDER_INIT_FAILED') {
    return {
      stage: 'CONFIGURED',
      failureClass: 'PROVIDER_INIT_FAILED',
      reason: 'Provider cannot initialize — stays CONFIGURED / DEGRADED, not SUPPORTED.',
    };
  }

  if (!evidence.combinationRan || failureClass === 'COMBINATION_NOT_RUN') {
    let notRunStage: VerificationStage = 'AVAILABLE';
    if (evidence.modelFilePresent && evidence.modelVersionOrHash) notRunStage = 'CONFIGURED';
    if (evidence.providerInitialized && evidence.deviceTruthState !== 'UNAVAILABLE') {
      notRunStage = 'SUPPORTED';
    }
    return {
      stage: notRunStage,
      failureClass: failureClass === 'NONE' ? 'COMBINATION_NOT_RUN' : failureClass,
      reason: 'Model/provider combination has not actually run — NOT_TESTED for inference.',
    };
  }

  if (!evidence.evidenceFresh || failureClass === 'EVIDENCE_STALE') {
    return {
      stage: 'SUPPORTED',
      failureClass: 'EVIDENCE_STALE',
      reason: 'Runtime evidence stale — cannot graduate to MODEL_LOADED/VERIFIED.',
    };
  }

  if (!evidence.resourceCeilingsOk || failureClass === 'RESOURCE_CEILING_EXCEEDED') {
    return {
      stage: 'SUPPORTED',
      failureClass: 'RESOURCE_CEILING_EXCEEDED',
      reason: 'Resource ceilings exceeded — DEGRADED; not VERIFIED.',
    };
  }

  // Silent fallback: may reach CPU-side inference but accelerator path denied VERIFIED.
  const silent = detectSilentFallback(evidence) || failureClass === 'SILENT_FALLBACK_TO_CPU';
  if (silent) {
    // CPU path can still show MODEL_LOADED / INFERENCE_PASSED on the CPU EP,
    // but overall gate for *requested* accelerator stops before VERIFIED.
    if (
      evidence.sessionInitialized &&
      evidence.loadStartedAt &&
      evidence.loadEndedAt &&
      evidence.inferenceOutput != null &&
      evidence.outputValid === true &&
      !evidence.inferenceTimedOut
    ) {
      return {
        stage: 'INFERENCE_PASSED',
        failureClass: 'SILENT_FALLBACK_TO_CPU',
        reason:
          'Silent fallback to CPU — inference may pass on CPU but requested accelerator cannot be VERIFIED.',
      };
    }
    if (evidence.sessionInitialized && evidence.loadStartedAt && evidence.loadEndedAt) {
      return {
        stage: 'MODEL_LOADED',
        failureClass: 'SILENT_FALLBACK_TO_CPU',
        reason: 'Silent fallback — model loaded on CPU; accelerator unverified.',
      };
    }
    return {
      stage: 'SUPPORTED',
      failureClass: 'SILENT_FALLBACK_TO_CPU',
      reason: 'Silent fallback detected — accelerator remains SUPPORTED/NOT_TESTED.',
    };
  }

  if (failureClass === 'INFERENCE_TIMEOUT' || evidence.inferenceTimedOut) {
    if (evidence.sessionInitialized && evidence.loadStartedAt && evidence.loadEndedAt) {
      return {
        stage: 'MODEL_LOADED',
        failureClass: 'INFERENCE_TIMEOUT',
        reason: 'Inference timed out — MODEL_LOADED but not INFERENCE_PASSED.',
      };
    }
    return {
      stage: 'SUPPORTED',
      failureClass: 'INFERENCE_TIMEOUT',
      reason: 'Inference timed out before model-load evidence completed.',
    };
  }

  if (failureClass === 'OUTPUT_INVALID' || evidence.outputValid === false) {
    if (evidence.sessionInitialized && evidence.loadStartedAt && evidence.loadEndedAt) {
      return {
        stage: 'MODEL_LOADED',
        failureClass: 'OUTPUT_INVALID',
        reason: 'Inference output invalid — cannot reach INFERENCE_PASSED/VERIFIED.',
      };
    }
    return {
      stage: 'SUPPORTED',
      failureClass: 'OUTPUT_INVALID',
      reason: 'Output invalid and load incomplete.',
    };
  }

  // Positive path — walk the chain without skipping.
  let stage: VerificationStage = 'AVAILABLE';

  // AVAILABLE → CONFIGURED
  if (evidence.modelFilePresent && evidence.modelVersionOrHash) {
    stage = 'CONFIGURED';
  } else {
    return { stage: 'AVAILABLE', failureClass, reason: 'Not configured.' };
  }

  // CONFIGURED → SUPPORTED
  if (evidence.providerInitialized && evidence.deviceTruthState !== 'UNAVAILABLE') {
    stage = 'SUPPORTED';
  } else {
    return { stage: 'CONFIGURED', failureClass, reason: 'Provider not supported/initialized.' };
  }

  // SUPPORTED → MODEL_LOADED
  if (
    evidence.sessionInitialized &&
    evidence.loadStartedAt &&
    evidence.loadEndedAt &&
    evidence.actualProvider === evidence.requestedProvider
  ) {
    stage = 'MODEL_LOADED';
  } else {
    return { stage: 'SUPPORTED', failureClass, reason: 'Model not loaded on requested provider.' };
  }

  // MODEL_LOADED → INFERENCE_PASSED
  if (
    evidence.boundedTestInput &&
    evidence.inferenceOutput != null &&
    evidence.outputValid === true &&
    !evidence.inferenceTimedOut &&
    evidence.latencyMs != null
  ) {
    stage = 'INFERENCE_PASSED';
  } else {
    return { stage: 'MODEL_LOADED', failureClass, reason: 'Inference not passed.' };
  }

  // INFERENCE_PASSED → VERIFIED
  if (
    evidence.evidenceFresh &&
    evidence.resourceCeilingsOk &&
    evidence.combinationRan &&
    evidence.evidenceRef &&
    failureClass === 'NONE'
  ) {
    stage = 'VERIFIED';
    return { stage, failureClass: 'NONE', reason: 'Full evidence chain present — VERIFIED.' };
  }

  return {
    stage: 'INFERENCE_PASSED',
    failureClass,
    reason: evidence.evidenceRef
      ? 'Inference passed but freshness/resources incomplete — not VERIFIED.'
      : 'Inference passed but evidence ledger reference missing — not VERIFIED.',
  };
}

export type RunVerificationGateInput = {
  evidence: ModelLoadEvidence;
  ledger?: RuntimeEvidenceLedger;
  /** Claim VERIFIED without evidence — must be denied. */
  claimVerifiedWithoutEvidence?: boolean;
  deviceDetected?: boolean;
  deviceSupported?: boolean;
};

/**
 * Primary EL8 gate: evaluate evidence, enforce progression, record ledger ref,
 * apply silent-fallback accelerator deny.
 */
export function runVerificationGate(input: RunVerificationGateInput): VerificationGateResult {
  const softWire = softWireRunLocalInference();
  const locks = EL8_LOCKS;

  if (input.claimVerifiedWithoutEvidence === true) {
    const evidence = {
      ...input.evidence,
      failureClass: 'CLAIM_WITHOUT_EVIDENCE' as const,
    };
    const accelerator = resolveAcceleratorVerification(evidence, {
      deviceDetected: input.deviceDetected,
      deviceSupported: input.deviceSupported,
    });
    return {
      stage: 'AVAILABLE',
      verified: false,
      modelLoadVerified: false,
      inferencePassed: false,
      failureClass: 'CLAIM_WITHOUT_EVIDENCE',
      evidence,
      accelerator,
      ledgerEntry: null,
      locks,
      reason: 'DENIED: VERIFIED requires measured load+inference evidence; claim without evidence rejected.',
      softWire,
    };
  }

  let evidence = { ...input.evidence };
  let ledgerEntry: EvidenceLedgerEntry | null = null;

  // First pass — may stop at INFERENCE_PASSED when ledger ref is still missing.
  let derived = deriveStageFromEvidence(evidence);

  if (input.ledger) {
    ledgerEntry = appendEvidenceToLedger(input.ledger, {
      evidence: { ...evidence, failureClass: derived.failureClass },
      stage: derived.stage,
      reason: derived.reason,
    });
    evidence = {
      ...evidence,
      evidenceRef: ledgerEntry.evidenceRef,
      failureClass: derived.failureClass,
    };
    // Second pass — ledger ref can unlock VERIFIED when the rest of the chain is clean.
    derived = deriveStageFromEvidence(evidence);
    if (ledgerEntry) {
      ledgerEntry = {
        ...ledgerEntry,
        stage: derived.stage,
        failureClass: derived.failureClass,
        reason: derived.reason,
        evidence: { ...evidence, failureClass: derived.failureClass },
      };
      // Keep ledger array entry in sync.
      const idx = input.ledger.entries.findIndex((e) => e.evidenceRef === ledgerEntry!.evidenceRef);
      if (idx >= 0) input.ledger.entries[idx] = ledgerEntry;
    }
  } else {
    evidence = { ...evidence, failureClass: derived.failureClass };
  }

  const allowAccelVerified =
    derived.stage === 'VERIFIED' &&
    evidence.requestedProvider !== 'CPU' &&
    evidence.actualProvider === evidence.requestedProvider &&
    !detectSilentFallback(evidence);

  const accelerator = resolveAcceleratorVerification(evidence, {
    deviceDetected: input.deviceDetected,
    deviceSupported: input.deviceSupported,
    allowAcceleratorVerified: allowAccelVerified,
  });

  // Hard rule: silent fallback never counts as accelerator VERIFIED.
  const verified =
    derived.stage === 'VERIFIED' &&
    derived.failureClass === 'NONE' &&
    !accelerator.silentFallbackDetected &&
    evidence.actualProvider === evidence.requestedProvider;

  return {
    stage: derived.stage,
    verified,
    modelLoadVerified:
      stageIndex(derived.stage) >= stageIndex('MODEL_LOADED') &&
      (!accelerator.silentFallbackDetected
        ? evidence.actualProvider === evidence.requestedProvider
        : false),
    inferencePassed: stageIndex(derived.stage) >= stageIndex('INFERENCE_PASSED'),
    failureClass: derived.failureClass,
    evidence,
    accelerator,
    ledgerEntry,
    locks,
    reason: derived.reason,
    softWire,
  };
}

/** Helper: build a fully successful CPU evidence fixture (for tests / local harness). */
export function buildSuccessfulEvidence(
  overrides: Partial<ModelLoadEvidence> & Pick<ModelLoadEvidence, 'modelId'>,
): ModelLoadEvidence {
  const now = Date.now();
  const requested = overrides.requestedProvider ?? 'CPU';
  const actual = overrides.actualProvider ?? requested;
  return createEmptyEvidence({
    modelId: overrides.modelId,
    modelVersionOrHash: overrides.modelVersionOrHash ?? 'sha256:fixture',
    requestedProvider: requested,
    actualProvider: actual,
    deviceTruthState: overrides.deviceTruthState ?? 'SUPPORTED',
    loadStartedAt: overrides.loadStartedAt ?? new Date(now - 50).toISOString(),
    loadEndedAt: overrides.loadEndedAt ?? new Date(now - 20).toISOString(),
    sessionInitialized: overrides.sessionInitialized ?? true,
    boundedTestInput: overrides.boundedTestInput ?? {
      kind: 'text',
      payload: 'ping',
      maxTokens: 8,
      timeoutMs: 5_000,
    },
    inferenceOutput: overrides.inferenceOutput ?? 'pong',
    latencyMs: overrides.latencyMs ?? 12,
    memoryObservations: overrides.memoryObservations ?? { heapUsedBytes: 1_024_000 },
    failureClass: overrides.failureClass ?? 'NONE',
    softwareRuntimeVersions: overrides.softwareRuntimeVersions ?? {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    machineRuntimeTimestamp: overrides.machineRuntimeTimestamp ?? new Date(now).toISOString(),
    evidenceRef: overrides.evidenceRef ?? null,
    modelFilePresent: overrides.modelFilePresent ?? true,
    providerInitialized: overrides.providerInitialized ?? true,
    inferenceTimedOut: overrides.inferenceTimedOut ?? false,
    outputValid: overrides.outputValid ?? true,
    resourceCeilingsOk: overrides.resourceCeilingsOk ?? true,
    evidenceFresh: overrides.evidenceFresh ?? true,
    combinationRan: overrides.combinationRan ?? true,
  });
}
