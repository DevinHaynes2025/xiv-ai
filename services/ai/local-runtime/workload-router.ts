import type { ComputeCapability, HardwareSnapshot, RouteDecision, WorkloadRequirements } from './types';

function bestVerifiedAccelerator(snapshot: HardwareSnapshot): ComputeCapability | undefined {
  return [...snapshot.npus, ...snapshot.gpus].find((item) => item.state === 'VERIFIED');
}

export function routeWorkload(
  snapshot: HardwareSnapshot,
  requirements: WorkloadRequirements = {},
): RouteDecision {
  const accelerator = bestVerifiedAccelerator(snapshot);

  if (requirements.requiresVerifiedAccelerator) {
    if (accelerator) {
      return {
        mode: 'LOCAL',
        compute: accelerator.kind,
        capabilityState: accelerator.state,
        reason: `Verified local ${accelerator.kind.toUpperCase()} selected.`,
      };
    }

    if (requirements.allowCloud) {
      return {
        mode: 'CLOUD',
        compute: 'cpu',
        capabilityState: 'NOT_TESTED',
        reason: 'No verified local accelerator exists; cloud execution is only a candidate and requires a separately authorized provider.',
      };
    }

    return {
      mode: 'LOCAL',
      compute: 'cpu',
      capabilityState: snapshot.cpu.state,
      reason: 'No verified accelerator exists. Safe CPU fallback selected; accelerator-only execution must remain blocked by the caller.',
    };
  }

  if (requirements.preferLocal !== false && accelerator) {
    return {
      mode: 'LOCAL',
      compute: accelerator.kind,
      capabilityState: accelerator.state,
      reason: `Verified local ${accelerator.kind.toUpperCase()} is available.`,
    };
  }

  return {
    mode: 'LOCAL',
    compute: 'cpu',
    capabilityState: snapshot.cpu.state,
    reason: 'CPU-first local route is the deterministic safe default until an accelerator is VERIFIED.',
  };
}
