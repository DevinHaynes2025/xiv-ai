import type {
  AttestationState,
  Placement,
  TrustLevel,
  WorkloadClassification,
  WorkloadRecord,
} from './types';
import { requiresAccelerator } from './xhal';

/**
 * The scheduler ladder from story section 7, evaluated in order:
 * task, latency, compute requirement, memory, security classification, data
 * location, cost, energy, available hardware, authorized runtime.
 *
 * This step is advisory. It produces a preferred placement and a security
 * floor; `eligibility.ts` then applies the floor as a hard filter, because
 * security overrides performance (section 8).
 */

const TINY_COMPUTE_UNITS = 4;
const TINY_MEMORY_MB = 512;
const LATENCY_SENSITIVE_MS = 150;
const PARALLEL_COMPUTE_UNITS = 64;

type SecurityFloor = WorkloadClassification['securityFloor'];

function securityFloorFor(workload: WorkloadRecord): SecurityFloor {
  switch (workload.classification) {
    case 'restricted':
      return { minTrust: 'protected', minAttestation: 'attested', requiresDedicatedTenancy: true };
    case 'confidential':
      return { minTrust: 'trusted', minAttestation: 'attested', requiresDedicatedTenancy: false };
    case 'internal':
      return { minTrust: 'verified', minAttestation: 'verified', requiresDedicatedTenancy: false };
    default:
      return { minTrust: 'basic', minAttestation: 'registered', requiresDedicatedTenancy: false };
  }
}

function preferredPlacementFor(workload: WorkloadRecord, floor: SecurityFloor): Placement {
  if (floor.requiresDedicatedTenancy) return 'private';
  if (requiresAccelerator(workload.requestedCapability)) return 'gpu';
  if (
    workload.estimate.computeUnits <= TINY_COMPUTE_UNITS &&
    workload.estimate.memoryMb <= TINY_MEMORY_MB &&
    workload.classification !== 'confidential'
  ) {
    return 'device';
  }
  if (workload.latencyBudgetMs <= LATENCY_SENSITIVE_MS) return 'edge';
  if (workload.estimate.computeUnits >= PARALLEL_COMPUTE_UNITS) return 'gpu';
  return 'cpu';
}

export function classifyWorkload(workload: WorkloadRecord): WorkloadClassification {
  const securityFloor = securityFloorFor(workload);
  const preferredPlacement = preferredPlacementFor(workload, securityFloor);

  const ladder = [
    `task=${workload.kind}`,
    `latency=${workload.latencyBudgetMs}ms`,
    `compute=${workload.estimate.computeUnits}u`,
    `memory=${workload.estimate.memoryMb}MB`,
    `classification=${workload.classification}`,
    `data_location=${workload.dataResidency.join('|') || 'unrestricted'}`,
    `cost_sensitive=${workload.estimate.tokens > 0 ? 'tokens' : 'compute'}`,
    'energy=scheduler_checks_node_state',
    'hardware=capability_registry',
    `authorized_runtime=min_trust:${securityFloor.minTrust}/min_attestation:${securityFloor.minAttestation}`,
  ];

  return {
    workloadId: workload.workloadId,
    preferredPlacement,
    securityFloor,
    requiresAccelerator: requiresAccelerator(workload.requestedCapability),
    ladder,
  };
}

export function minTrustRankLabel(trust: TrustLevel): string {
  return `min_trust:${trust}`;
}

export function minAttestationLabel(state: AttestationState): string {
  return `min_attestation:${state}`;
}
