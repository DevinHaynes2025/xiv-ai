/**
 * 62L-EM B — ONNX / Windows ML Adapter
 *
 * Contract path: Windows ML → ONNX Runtime → AMD EP.
 * Unconfigured / unproven → UNAVAILABLE / NOT_TESTED.
 * Never fabricates successful inference.
 */

import type { CapabilityState } from './types';
import { EM_LOCKS } from './honesty';

export type OnnxAdapterLayer = 'windows_ml' | 'onnx_runtime' | 'amd_ep';

export type OnnxAdapterConfig = {
  windowsMlAvailable?: boolean | 'unknown';
  onnxRuntimeInstalled?: boolean | 'unknown';
  amdExecutionProviderConfigured?: boolean | 'unknown';
  /** Measured session create + run succeeded. */
  inferenceBenchmarkSucceeded?: boolean;
  evidence?: string[];
  /** Fake success claim without run — denied. */
  claimSuccessfulInferenceWithoutRun?: boolean;
};

export type OnnxLayerStatus = {
  layer: OnnxAdapterLayer;
  state: CapabilityState;
  detail: string;
};

export type OnnxAdapterStatus = {
  path: OnnxAdapterLayer[];
  layers: OnnxLayerStatus[];
  overallState: CapabilityState;
  inferenceVerified: boolean;
  fakeSuccessDenied: boolean;
  reason: string;
  locks: { ONNX_SUCCESS_WITHOUT_INFERENCE: false; L4_AUTONOMY_ENABLED: false };
};

function layerState(
  available: boolean | 'unknown' | undefined,
  label: string,
): { state: CapabilityState; detail: string } {
  if (available === true) {
    return { state: 'DETECTED', detail: `${label} reported present — DETECTED ≠ VERIFIED.` };
  }
  if (available === false) {
    return { state: 'UNAVAILABLE', detail: `${label} not available in this environment.` };
  }
  return { state: 'NOT_TESTED', detail: `${label} not probed — NOT_TESTED.` };
}

/**
 * Build ONNX/Windows ML adapter status. Successful inference requires a measured run.
 */
export function evaluateOnnxWindowsMlAdapter(config: OnnxAdapterConfig = {}): OnnxAdapterStatus {
  const locks = {
    ONNX_SUCCESS_WITHOUT_INFERENCE: EM_LOCKS.ONNX_SUCCESS_WITHOUT_INFERENCE,
    L4_AUTONOMY_ENABLED: EM_LOCKS.L4_AUTONOMY_ENABLED,
  };

  if (config.claimSuccessfulInferenceWithoutRun === true) {
    return {
      path: ['windows_ml', 'onnx_runtime', 'amd_ep'],
      layers: [
        { layer: 'windows_ml', state: 'NOT_TESTED', detail: 'Fake success denied.' },
        { layer: 'onnx_runtime', state: 'NOT_TESTED', detail: 'Fake success denied.' },
        { layer: 'amd_ep', state: 'NOT_TESTED', detail: 'Fake success denied.' },
      ],
      overallState: 'NOT_TESTED',
      inferenceVerified: false,
      fakeSuccessDenied: true,
      reason: 'DENIED: cannot claim successful ONNX/Windows ML inference without a measured run.',
      locks,
    };
  }

  const win = layerState(config.windowsMlAvailable, 'Windows ML');
  const ort = layerState(config.onnxRuntimeInstalled, 'ONNX Runtime');
  const amd = layerState(config.amdExecutionProviderConfigured, 'AMD Execution Provider');

  const layers: OnnxLayerStatus[] = [
    { layer: 'windows_ml', ...win },
    { layer: 'onnx_runtime', ...ort },
    { layer: 'amd_ep', ...amd },
  ];

  const anyUnavailable = layers.some((l) => l.state === 'UNAVAILABLE');
  const allDetected = layers.every((l) => l.state === 'DETECTED');
  const anyNotTested = layers.some((l) => l.state === 'NOT_TESTED');

  if (config.inferenceBenchmarkSucceeded === true && (config.evidence?.length ?? 0) > 0 && allDetected) {
    return {
      path: ['windows_ml', 'onnx_runtime', 'amd_ep'],
      layers: layers.map((l) => ({ ...l, state: 'VERIFIED' as const, detail: `${l.layer} path measured.` })),
      overallState: 'VERIFIED',
      inferenceVerified: true,
      fakeSuccessDenied: false,
      reason: 'Measured ONNX/Windows ML → AMD EP inference evidence present.',
      locks,
    };
  }

  if (anyUnavailable) {
    return {
      path: ['windows_ml', 'onnx_runtime', 'amd_ep'],
      layers,
      overallState: 'UNAVAILABLE',
      inferenceVerified: false,
      fakeSuccessDenied: false,
      reason: 'One or more adapter layers UNAVAILABLE — no successful inference claimed.',
      locks,
    };
  }

  if (allDetected) {
    return {
      path: ['windows_ml', 'onnx_runtime', 'amd_ep'],
      layers: layers.map((l) => ({
        ...l,
        state: 'SUPPORTED' as const,
        detail: `${l.detail} Compatibility indicated only — inference NOT_TESTED.`,
      })),
      overallState: 'SUPPORTED',
      inferenceVerified: false,
      fakeSuccessDenied: false,
      reason: 'Stack detected/supported but inference benchmark not measured — NOT VERIFIED.',
      locks,
    };
  }

  return {
    path: ['windows_ml', 'onnx_runtime', 'amd_ep'],
    layers,
    overallState: anyNotTested ? 'NOT_TESTED' : 'UNKNOWN',
    inferenceVerified: false,
    fakeSuccessDenied: false,
    reason: 'Adapter unconfigured/unproven — UNAVAILABLE/NOT_TESTED until measured.',
    locks,
  };
}

export function defaultOnnxAdapterStatus(): OnnxAdapterStatus {
  return evaluateOnnxWindowsMlAdapter({});
}
