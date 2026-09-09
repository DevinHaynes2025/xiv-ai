/**
 * 62L-EL — Workload router.
 * AMD GPU/NPU routing DENIED until EL1–EL4 pass; afterwards still need probe flags.
 */

import type { CapabilityRegistry, AmdRouteTarget, RouteDecision } from './types';
import type { LocalRuntimeState } from './runtime-state';
import { assertEl1El4Pass } from './runtime-state';

export type RouteRequest = {
  target: AmdRouteTarget | 'cpu_baseline';
  runtime: LocalRuntimeState;
  registry: CapabilityRegistry;
};

function deny(
  target: RouteDecision['target'],
  reason: string,
  state: RouteDecision['state'],
  requiresProbeFlags: RouteDecision['requiresProbeFlags'] = [],
): RouteDecision {
  return {
    allowed: false,
    target,
    reason,
    state,
    requiresProbeFlags,
    el1El4Required: true,
    amdInferenceClaimed: false,
  };
}

function allow(
  target: RouteDecision['target'],
  reason: string,
  requiresProbeFlags: RouteDecision['requiresProbeFlags'] = [],
): RouteDecision {
  return {
    allowed: true,
    target,
    reason,
    state: 'PASS',
    requiresProbeFlags,
    el1El4Required: true,
    amdInferenceClaimed: false,
  };
}

export function routeWorkload(request: RouteRequest): RouteDecision {
  const { target, runtime, registry } = request;

  if (target === 'cpu_baseline') {
    return allow('cpu_baseline', 'CPU_BASELINE_PATH_ALLOWED_FOR_EL4');
  }

  if (!assertEl1El4Pass(runtime) || !runtime.amdGpuNpuRoutingEligible) {
    return deny(
      target,
      'AMD_GPU_NPU_ROUTE_DENIED_BEFORE_EL1_EL4_PASS',
      'DENIED',
      ['GPU_DETECTED', 'NPU_DETECTED', 'AMD_EP_SUPPORTED', 'MODEL_LOAD_VERIFIED'],
    );
  }

  if (target === 'amd_cpu') {
    if (registry.flags.CPU_DETECTED !== true) {
      return deny(target, 'CPU_NOT_DETECTED', 'NOT_TESTED', ['CPU_DETECTED']);
    }
    return allow(target, 'AMD_CPU_SCHEDULING_CANDIDATE_AFTER_EL1_EL4', ['CPU_DETECTED']);
  }

  if (target === 'amd_gpu') {
    const required = ['GPU_DETECTED', 'AMD_EP_SUPPORTED'] as const;
    if (registry.flags.GPU_DETECTED !== true) {
      return deny(target, 'GPU_DETECTED_REQUIRED', 'UNAVAILABLE', [...required]);
    }
    if (registry.flags.AMD_EP_SUPPORTED !== true) {
      return deny(target, 'AMD_EP_SUPPORTED_REQUIRED', 'NOT_TESTED', [...required]);
    }
    if (registry.flags.MODEL_LOAD_VERIFIED !== true) {
      return {
        ...allow(target, 'AMD_GPU_SCHEDULING_CANDIDATE_MODEL_LOAD_NOT_VERIFIED', [
          'GPU_DETECTED',
          'AMD_EP_SUPPORTED',
          'MODEL_LOAD_VERIFIED',
        ]),
        state: 'NOT_TESTED',
      };
    }
    return allow(target, 'AMD_GPU_SCHEDULING_CANDIDATE_WITH_PROBE_EVIDENCE', [
      'GPU_DETECTED',
      'AMD_EP_SUPPORTED',
      'MODEL_LOAD_VERIFIED',
    ]);
  }

  if (target === 'amd_npu') {
    const required = ['NPU_DETECTED', 'AMD_EP_SUPPORTED'] as const;
    if (registry.flags.NPU_DETECTED !== true) {
      return deny(target, 'NPU_DETECTED_REQUIRED', 'UNAVAILABLE', [...required]);
    }
    if (registry.flags.AMD_EP_SUPPORTED !== true) {
      return deny(target, 'AMD_EP_SUPPORTED_REQUIRED', 'NOT_TESTED', [...required]);
    }
    if (registry.flags.MODEL_LOAD_VERIFIED !== true) {
      return {
        ...allow(target, 'AMD_NPU_SCHEDULING_CANDIDATE_MODEL_LOAD_NOT_VERIFIED', [
          'NPU_DETECTED',
          'AMD_EP_SUPPORTED',
          'MODEL_LOAD_VERIFIED',
        ]),
        state: 'NOT_TESTED',
      };
    }
    return allow(target, 'AMD_NPU_SCHEDULING_CANDIDATE_WITH_PROBE_EVIDENCE', [
      'NPU_DETECTED',
      'AMD_EP_SUPPORTED',
      'MODEL_LOAD_VERIFIED',
    ]);
  }

  return deny('none', 'UNKNOWN_TARGET', 'DENIED');
}
