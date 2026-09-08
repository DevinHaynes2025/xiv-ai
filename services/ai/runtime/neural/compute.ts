import type { ComputeBackendV3, ConnectorState } from './types';
import { COMPUTE_BACKENDS_V3 } from './types';

export type QuantumReadyGateway = {
  QuantumProvider: ConnectorState;
  QuantumExecution: 'NOT_PROVEN';
  QuantumSecurity: 'NOT_PROVEN';
};

export function openQuantumReadyGateway(): QuantumReadyGateway {
  void COMPUTE_BACKENDS_V3;
  return {
    QuantumProvider: 'NOT_CONFIGURED',
    QuantumExecution: 'NOT_PROVEN',
    QuantumSecurity: 'NOT_PROVEN',
  };
}

export function routeCompute(input: {
  backend: ComputeBackendV3;
  guardianApproved: boolean;
  quantumProven?: boolean;
}) {
  if (!input.guardianApproved) return { allowed: false as const, reason: 'compute_requires_guardian' };
  if (input.backend === 'QUANTUM_FUTURE' && !input.quantumProven) {
    return { allowed: false as const, reason: 'quantum_backend_unavailable_without_evidence' };
  }
  return { allowed: true as const, createsAuthority: false as const };
}

export function quantumOverridesGuardian(): false {
  return false;
}

export function partnershipClaimedWithVendor(): false {
  return false;
}
