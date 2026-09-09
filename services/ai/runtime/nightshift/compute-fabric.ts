/**
 * Advanced Compute Fabric routing — CPU/GPU/NPU/distributed/simulation.
 * QUANTUM_FUTURE stays NOT_CONFIGURED without proof.
 */
import type { CapabilityLifecycle, ComputeBackendV4 } from './types';
import { COMPUTE_BACKENDS_V4 } from './types';

export type AdvancedComputeFabric = {
  fabricId: string;
  backends: readonly ComputeBackendV4[];
  QuantumProvider: CapabilityLifecycle;
  productionLive: false;
  createsAuthority: false;
};

export function openAdvancedComputeFabric(): AdvancedComputeFabric {
  return {
    fabricId: 'advanced-compute-fabric',
    backends: COMPUTE_BACKENDS_V4,
    QuantumProvider: 'NOT_CONFIGURED',
    productionLive: false,
    createsAuthority: false,
  };
}

export function routeAdvancedCompute(input: {
  backend: ComputeBackendV4;
  guardianApproved: boolean;
  quantumProven?: boolean;
}) {
  if (!input.guardianApproved) {
    return { allowed: false as const, reason: 'compute_requires_guardian' };
  }
  if (input.backend === 'QUANTUM_FUTURE' && !input.quantumProven) {
    return { allowed: false as const, reason: 'quantum_future_not_configured' };
  }
  return { allowed: true as const, createsAuthority: false as const, QuantumProvider: 'NOT_CONFIGURED' as const };
}

export function quantumFutureConfiguredWithoutProof(): false {
  return false;
}

export function quantumProviderState(): CapabilityLifecycle {
  return 'NOT_CONFIGURED';
}

export function computeCreatesAuthority(): false {
  return false;
}
