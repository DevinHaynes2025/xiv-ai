/**
 * 62L-EX5 — Isolated future provider adapter stubs.
 * No embedded credentials. No autonomous purchase. No proprietary IP reverse-engineering.
 */

import type { QpuProviderAdapter } from '../qpu-router.ts';
import type { QpuProviderCandidate } from '../qpu-types.ts';

export const PROVIDER_ADAPTER_CANDIDATES: ReadonlyArray<{
  candidate: QpuProviderCandidate;
  adapterId: string;
  providerId: string;
}> = [
  {
    candidate: 'IBM_QUANTUM_CANDIDATE',
    adapterId: 'adapter-ibm-quantum',
    providerId: 'ibm-quantum-candidate',
  },
  {
    candidate: 'AWS_BRAKET_CANDIDATE',
    adapterId: 'adapter-aws-braket',
    providerId: 'aws-braket-candidate',
  },
  {
    candidate: 'AZURE_QUANTUM_CANDIDATE',
    adapterId: 'adapter-azure-quantum',
    providerId: 'azure-quantum-candidate',
  },
  {
    candidate: 'GOOGLE_QUANTUM_CANDIDATE',
    adapterId: 'adapter-google-quantum',
    providerId: 'google-quantum-candidate',
  },
  {
    candidate: 'OTHER_AUTHORIZED_QPU_PROVIDER',
    adapterId: 'adapter-other-authorized-qpu',
    providerId: 'other-authorized-qpu-provider',
  },
] as const;

/** Build a stub adapter — discovery/submit disabled until authorized + configured. */
export function createStubProviderAdapter(
  candidate: QpuProviderCandidate,
): QpuProviderAdapter | null {
  const spec = PROVIDER_ADAPTER_CANDIDATES.find((c) => c.candidate === candidate);
  if (!spec) return null;
  return {
    adapterId: spec.adapterId,
    providerId: spec.providerId,
    embedsCredentials: false,
    supportsDiscovery: false,
    supportsSubmit: false,
  };
}

export function listStubAdapters(): QpuProviderAdapter[] {
  return PROVIDER_ADAPTER_CANDIDATES.map((spec) => ({
    adapterId: spec.adapterId,
    providerId: spec.providerId,
    embedsCredentials: false as const,
    supportsDiscovery: false,
    supportsSubmit: false,
  }));
}
