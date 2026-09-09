/**
 * 62L-EL — ONNX / local-runtime adapter (stub/contract).
 * Loading stays NOT_TESTED until local evidence.
 */

import type { OnnxAdapterStatus } from './types';

export type OnnxLoadRequest = {
  modelPath?: string;
  claimVerified?: boolean;
  evidencePresent?: boolean;
};

export function getOnnxAdapterStatus(): OnnxAdapterStatus {
  return {
    adapter: 'onnx_local_runtime',
    contractReady: true,
    loadState: 'NOT_TESTED',
    reason: 'ONNX_ADAPTER_CONTRACT_ONLY_LOAD_NOT_TESTED',
    modelLoadVerified: false,
  };
}

export function attemptOnnxModelLoad(request: OnnxLoadRequest = {}): OnnxAdapterStatus {
  if (request.claimVerified && !request.evidencePresent) {
    return {
      adapter: 'onnx_local_runtime',
      contractReady: true,
      loadState: 'DENIED',
      reason: 'MODEL_LOAD_CLAIM_WITHOUT_EVIDENCE_DENIED',
      modelLoadVerified: false,
    };
  }

  if (request.evidencePresent && request.claimVerified && request.modelPath) {
    return {
      adapter: 'onnx_local_runtime',
      contractReady: true,
      loadState: 'NOT_TESTED',
      reason: 'ONNX_LOAD_PATH_ACCEPTED_BUT_RUNTIME_EVIDENCE_NOT_TESTED_IN_THIS_ENVIRONMENT',
      modelLoadVerified: false,
    };
  }

  return getOnnxAdapterStatus();
}

export function onnxAdapterHonesty() {
  return {
    contractReady: true as const,
    loadVerifiedByDefault: false as const,
    windowsLocalInferenceVerified: false as const,
    amdEpExecutionVerified: false as const,
  };
}
