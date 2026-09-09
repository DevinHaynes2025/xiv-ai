/**
 * Compute / GPU / NVIDIA connector foundation.
 * Extends OptimizationProvider. NVIDIA remains not_configured until real infra exists.
 */
export type ComputeProviderKind = 'nvidia' | 'cpu' | 'gpu' | 'distributed' | 'specialized';
export type ComputeProviderStatus = 'not_configured' | 'configured' | 'connected' | 'degraded' | 'unavailable';

export type ComputeProvider = { kind: ComputeProviderKind; status: ComputeProviderStatus; live: false };
export type GpuProvider = ComputeProvider & { kind: 'gpu' | 'nvidia' };
export type InferenceProvider = { status: ComputeProviderStatus; live: false };
export type EmbeddingProvider = { status: ComputeProviderStatus; live: false };
export type VisionProvider = { status: ComputeProviderStatus; live: false };
export type SpeechProvider = { status: ComputeProviderStatus; live: false };
export type SimulationProvider = { status: ComputeProviderStatus; live: false };

export function createComputeProvider(kind: ComputeProviderKind): ComputeProvider {
  return { kind, status: 'not_configured', live: false };
}

export function nvidiaProvider() {
  return createComputeProvider('nvidia');
}

export function nvidiaInfrastructureLive() {
  return false;
}
