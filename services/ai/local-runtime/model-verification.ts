/**
 * 62L-EM A — Local Model Verification
 *
 * Default: NOT_TESTED. MODEL_LOAD_VERIFIED only with measured load + inference evidence.
 * Fake / claimed success without evidence is denied.
 */

import type { CapabilityState } from './types';
import { EM_LOCKS } from './honesty';

export type ModelVerificationInput = {
  modelId: string;
  /** Provider/runtime configured (not proof of load). */
  configured?: boolean;
  /** Measured successful model load. */
  loadSucceeded?: boolean;
  /** Measured successful inference (bounded probe). */
  inferenceSucceeded?: boolean;
  /** Optional latency/bytes evidence strings from a real probe. */
  evidence?: string[];
  /** Caller claims MODEL_LOAD_VERIFIED without evidence — must be denied. */
  claimVerifiedWithoutEvidence?: boolean;
};

export type ModelVerificationResult = {
  modelId: string;
  state: CapabilityState;
  modelLoadVerified: boolean;
  inferenceVerified: boolean;
  evidence: string[];
  reason: string;
  locks: { L4_AUTONOMY_ENABLED: false; MODEL_LOAD_VERIFIED_WITHOUT_EVIDENCE: false };
};

/**
 * Verify local model load/inference contracts.
 * Without measured evidence, remains NOT_TESTED (or UNAVAILABLE if unconfigured).
 */
export function verifyLocalModel(input: ModelVerificationInput): ModelVerificationResult {
  const locks = {
    L4_AUTONOMY_ENABLED: EM_LOCKS.L4_AUTONOMY_ENABLED,
    MODEL_LOAD_VERIFIED_WITHOUT_EVIDENCE: EM_LOCKS.MODEL_LOAD_VERIFIED_WITHOUT_EVIDENCE,
  };

  if (input.claimVerifiedWithoutEvidence === true) {
    return {
      modelId: input.modelId,
      state: 'NOT_TESTED',
      modelLoadVerified: false,
      inferenceVerified: false,
      evidence: input.evidence ?? [],
      reason: 'DENIED: MODEL_LOAD_VERIFIED requires measured load+inference evidence.',
      locks,
    };
  }

  if (input.configured === false) {
    return {
      modelId: input.modelId,
      state: 'UNAVAILABLE',
      modelLoadVerified: false,
      inferenceVerified: false,
      evidence: input.evidence ?? [],
      reason: 'Model/runtime is not configured.',
      locks,
    };
  }

  const evidence = [...(input.evidence ?? [])];
  const loadOk = input.loadSucceeded === true;
  const inferenceOk = input.inferenceSucceeded === true;

  if (loadOk && inferenceOk && evidence.length > 0) {
    return {
      modelId: input.modelId,
      state: 'VERIFIED',
      modelLoadVerified: true,
      inferenceVerified: true,
      evidence,
      reason: 'MODEL_LOAD_VERIFIED: measured load and inference evidence present.',
      locks,
    };
  }

  if (loadOk && !inferenceOk) {
    return {
      modelId: input.modelId,
      state: 'SUPPORTED',
      modelLoadVerified: false,
      inferenceVerified: false,
      evidence,
      reason: 'Model load reported but inference not measured — MODEL_LOAD_VERIFIED remains false.',
      locks,
    };
  }

  if (input.configured === true) {
    return {
      modelId: input.modelId,
      state: 'DETECTED',
      modelLoadVerified: false,
      inferenceVerified: false,
      evidence,
      reason: 'Configured/detected only — DETECTED ≠ VERIFIED; default remains unproven.',
      locks,
    };
  }

  return {
    modelId: input.modelId,
    state: 'NOT_TESTED',
    modelLoadVerified: false,
    inferenceVerified: false,
    evidence,
    reason: 'No measured model load/inference evidence — NOT_TESTED.',
    locks,
  };
}

export function defaultModelVerificationState(modelId = 'unspecified'): ModelVerificationResult {
  return verifyLocalModel({ modelId });
}
