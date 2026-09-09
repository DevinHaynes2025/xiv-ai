/**
 * 62L-EW8 — Independent NVIDIA truth layers.
 *
 * NVIDIA_GPU, NVIDIA_DRIVER, CUDA_RUNTIME, TENSORRT, TENSORRT_LLM,
 * ONNX_NVIDIA_PROVIDER, MODEL_COMPATIBILITY are tracked separately.
 * Never infer across layers.
 */

import {
  EW8_LOCKS,
  NVIDIA_TRUTH_LAYERS,
  nvidiaEnvironmentHonesty,
  satisfiesMinimumState,
  type NvidiaTruthLayer,
  type TruthState,
} from './ew8-types.ts';

export type LayerEvidence = {
  layer: NvidiaTruthLayer;
  state: TruthState;
  observedAt: string | null;
  evidenceRefs: readonly string[];
  staleAfterMs: number;
  notes: readonly string[];
};

export type NvidiaCapabilitySnapshot = {
  layers: Readonly<Record<NvidiaTruthLayer, LayerEvidence>>;
  /** GPU detected ≠ CUDA verified (lock-enforced). */
  gpuDetectedImpliesCudaVerified: false;
  /** CUDA installed ≠ TensorRT verified. */
  cudaInstalledImpliesTensorRtVerified: false;
  /** TensorRT available ≠ Model X verified. */
  tensorRtAvailableImpliesModelVerified: false;
};

const DEFAULT_STALE_MS = 24 * 60 * 60 * 1000;

export function emptyLayer(
  layer: NvidiaTruthLayer,
  state: TruthState = 'UNKNOWN',
  notes: readonly string[] = [],
): LayerEvidence {
  return {
    layer,
    state,
    observedAt: null,
    evidenceRefs: [],
    staleAfterMs: DEFAULT_STALE_MS,
    notes: [...notes],
  };
}

/** Honest default snapshot for this environment — no fabricated VERIFIED. */
export function defaultNvidiaCapabilitySnapshot(): NvidiaCapabilitySnapshot {
  const honesty = nvidiaEnvironmentHonesty();
  const now = new Date().toISOString();
  const layers = {
    NVIDIA_GPU: emptyLayer('NVIDIA_GPU', honesty.gpuState, [honesty.note]),
    NVIDIA_DRIVER: emptyLayer(
      'NVIDIA_DRIVER',
      honesty.driverState,
      ['Driver not auto-installed; NOT_CONFIGURED until observed.'],
    ),
    CUDA_RUNTIME: emptyLayer(
      'CUDA_RUNTIME',
      honesty.cudaState,
      ['CUDA missing → NOT_CONFIGURED / UNAVAILABLE.'],
    ),
    TENSORRT: emptyLayer(
      'TENSORRT',
      honesty.tensorRtState,
      ['TensorRT missing → NOT_CONFIGURED / UNAVAILABLE.'],
    ),
    TENSORRT_LLM: emptyLayer(
      'TENSORRT_LLM',
      honesty.tensorRtLlmState,
      ['TensorRT-LLM candidate only until evidenced.'],
    ),
    ONNX_NVIDIA_PROVIDER: emptyLayer(
      'ONNX_NVIDIA_PROVIDER',
      honesty.onnxNvidiaState,
      ['ONNX Runtime NVIDIA provider documented candidate only.'],
    ),
    MODEL_COMPATIBILITY: emptyLayer(
      'MODEL_COMPATIBILITY',
      honesty.modelCompatibilityState,
      ['Model compatibility independent of TensorRT availability.'],
    ),
  } as const;

  // Stamp observedAt only for DOCUMENTED catalog awareness — still not VERIFIED.
  for (const layer of NVIDIA_TRUTH_LAYERS) {
    if (layers[layer].state === 'DOCUMENTED') {
      (layers[layer] as { observedAt: string | null }).observedAt = now;
    }
  }

  return {
    layers: layers as Readonly<Record<NvidiaTruthLayer, LayerEvidence>>,
    gpuDetectedImpliesCudaVerified: false,
    cudaInstalledImpliesTensorRtVerified: false,
    tensorRtAvailableImpliesModelVerified: false,
  };
}

export function setLayerState(
  snapshot: NvidiaCapabilitySnapshot,
  layer: NvidiaTruthLayer,
  state: TruthState,
  evidenceRefs: readonly string[] = [],
  notes: readonly string[] = [],
): NvidiaCapabilitySnapshot {
  // Refuse fabricated VERIFIED without going through verification gate.
  if (
    state === 'VERIFIED' &&
    EW8_LOCKS.FABRICATE_NVIDIA_GPU_VERIFIED === false &&
    layer === 'NVIDIA_GPU' &&
    evidenceRefs.length === 0
  ) {
    return snapshot;
  }

  const next: LayerEvidence = {
    layer,
    state,
    observedAt: new Date().toISOString(),
    evidenceRefs: [...evidenceRefs],
    staleAfterMs: DEFAULT_STALE_MS,
    notes: [...notes],
  };

  return {
    ...snapshot,
    layers: { ...snapshot.layers, [layer]: next },
  };
}

/** DOCUMENTED / DETECTED never satisfy VERIFIED minimum. */
export function layerSatisfiesMinimum(
  snapshot: NvidiaCapabilitySnapshot,
  layer: NvidiaTruthLayer,
  minimum: TruthState,
): boolean {
  return satisfiesMinimumState(snapshot.layers[layer].state, minimum);
}

export function isLayerStale(
  layer: LayerEvidence,
  nowMs: number = Date.now(),
): boolean {
  if (!layer.observedAt) return layer.state === 'VERIFIED'; // unverified freshness
  if (layer.state === 'STALE') return true;
  const observed = Date.parse(layer.observedAt);
  if (!Number.isFinite(observed)) return true;
  return nowMs - observed > layer.staleAfterMs;
}

/**
 * Mark VERIFIED evidence STALE when past freshness window.
 * Stale evidence never keeps VERIFIED (lock).
 */
export function rejectStaleVerified(
  snapshot: NvidiaCapabilitySnapshot,
  nowMs: number = Date.now(),
): NvidiaCapabilitySnapshot {
  let layers = { ...snapshot.layers };
  for (const key of NVIDIA_TRUTH_LAYERS) {
    const layer = layers[key];
    if (layer.state === 'VERIFIED' && isLayerStale(layer, nowMs)) {
      layers = {
        ...layers,
        [key]: {
          ...layer,
          state: 'STALE',
          notes: [
            ...layer.notes,
            'STALE_EVIDENCE — VERIFIED revoked; retest required.',
          ],
        },
      };
    }
  }
  return { ...snapshot, layers };
}

export function markCudaMissing(
  snapshot: NvidiaCapabilitySnapshot,
): NvidiaCapabilitySnapshot {
  return setLayerState(
    snapshot,
    'CUDA_RUNTIME',
    'NOT_CONFIGURED',
    [],
    ['CUDA runtime missing — NOT_CONFIGURED / UNAVAILABLE. No auto-install.'],
  );
}

export function markTensorRtMissing(
  snapshot: NvidiaCapabilitySnapshot,
): NvidiaCapabilitySnapshot {
  let next = setLayerState(
    snapshot,
    'TENSORRT',
    'NOT_CONFIGURED',
    [],
    ['TensorRT missing — NOT_CONFIGURED / UNAVAILABLE. No auto-install.'],
  );
  next = setLayerState(
    next,
    'TENSORRT_LLM',
    'NOT_CONFIGURED',
    [],
    ['TensorRT-LLM missing — NOT_CONFIGURED.'],
  );
  return next;
}

/**
 * Documented GPU catalog entry — cannot satisfy VERIFIED.
 */
export function documentedGpuOnly(
  gpuModel: string,
): NvidiaCapabilitySnapshot {
  let snap = defaultNvidiaCapabilitySnapshot();
  snap = setLayerState(
    snap,
    'NVIDIA_GPU',
    'DOCUMENTED',
    [`catalog:${gpuModel}`],
    ['DOCUMENTED catalog entry — not runtime DETECTED or VERIFIED.'],
  );
  return snap;
}

/**
 * Detected GPU probe — still cannot satisfy VERIFIED / CUDA / TensorRT.
 */
export function detectedGpuOnly(
  gpuModel: string,
  evidenceRef: string,
): NvidiaCapabilitySnapshot {
  let snap = defaultNvidiaCapabilitySnapshot();
  snap = setLayerState(
    snap,
    'NVIDIA_GPU',
    'DETECTED',
    [evidenceRef],
    [
      `GPU DETECTED (${gpuModel}) — does NOT imply CUDA or TensorRT verified.`,
    ],
  );
  // Explicitly keep CUDA / TensorRT independent.
  snap = markCudaMissing(snap);
  snap = markTensorRtMissing(snap);
  return snap;
}

export function attemptAssumeCudaFromGpuDetection(): {
  denied: true;
  reason: string;
} {
  return {
    denied: true,
    reason:
      'GPU_DETECTED_EQ_CUDA_VERIFIED=false — detecting NVIDIA GPU ≠ CUDA verified.',
  };
}

export function attemptAssumeTensorRtFromCuda(): {
  denied: true;
  reason: string;
} {
  return {
    denied: true,
    reason:
      'CUDA_INSTALLED_EQ_TENSORRT_VERIFIED=false — CUDA installed ≠ TensorRT verified.',
  };
}

export function attemptAssumeModelFromTensorRt(): {
  denied: true;
  reason: string;
} {
  return {
    denied: true,
    reason:
      'TENSORRT_AVAILABLE_EQ_MODEL_VERIFIED=false — TensorRT available ≠ Model X verified.',
  };
}
