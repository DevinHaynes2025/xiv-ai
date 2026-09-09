/**
 * 62L-EL — Resource governor.
 */

import { EL_LOCKS } from './types';
import type { LocalRuntimeState } from './runtime-state';
import { assertEl1El4Pass } from './runtime-state';
import { agentsMayClaimWorking, classifyHeartbeat, type HeartbeatInput } from './heartbeat';

export type ResourceRequest = {
  kind: 'cpu_baseline' | 'amd_gpu' | 'amd_npu' | 'onnx_load' | 'agent_batch';
  requestedMemoryBytes?: number;
  maxMemoryBytes?: number;
  runtime: LocalRuntimeState;
  heartbeat?: HeartbeatInput;
};

export type ResourceDecision = {
  allowed: boolean;
  reason: string;
  l4AutonomyEnabled: false;
  stealthPersistence: false;
  privilegeEscalation: false;
};

export function governResources(request: ResourceRequest): ResourceDecision {
  const maxMem = request.maxMemoryBytes ?? 2 * 1024 * 1024 * 1024;
  const asked = request.requestedMemoryBytes ?? 0;

  if (asked > maxMem) {
    return {
      allowed: false,
      reason: 'RESOURCE_MEMORY_LIMIT_EXCEEDED',
      l4AutonomyEnabled: EL_LOCKS.L4_AUTONOMY_ENABLED,
      stealthPersistence: false,
      privilegeEscalation: false,
    };
  }

  if (request.kind === 'cpu_baseline') {
    return {
      allowed: true,
      reason: 'CPU_BASELINE_BOUNDED_OK',
      l4AutonomyEnabled: false,
      stealthPersistence: false,
      privilegeEscalation: false,
    };
  }

  if (request.heartbeat) {
    const hb = classifyHeartbeat(request.heartbeat);
    if (!agentsMayClaimWorking(hb)) {
      return {
        allowed: false,
        reason: `NODE_NOT_RUNNING_VERIFIED:${hb.state}`,
        l4AutonomyEnabled: false,
        stealthPersistence: false,
        privilegeEscalation: false,
      };
    }
  }

  if (request.kind === 'amd_gpu' || request.kind === 'amd_npu') {
    if (!assertEl1El4Pass(request.runtime)) {
      return {
        allowed: false,
        reason: 'AMD_ACCELERATOR_DENIED_BEFORE_EL1_EL4_PASS',
        l4AutonomyEnabled: false,
        stealthPersistence: false,
        privilegeEscalation: false,
      };
    }
    return {
      allowed: true,
      reason: 'AMD_ACCELERATOR_CANDIDATE_BOUNDED_AFTER_EL1_EL4',
      l4AutonomyEnabled: false,
      stealthPersistence: false,
      privilegeEscalation: false,
    };
  }

  if (request.kind === 'onnx_load') {
    return {
      allowed: false,
      reason: 'ONNX_MODEL_LOAD_NOT_TESTED_UNTIL_LOCAL_EVIDENCE',
      l4AutonomyEnabled: false,
      stealthPersistence: false,
      privilegeEscalation: false,
    };
  }

  return {
    allowed: false,
    reason: 'RESOURCE_REQUEST_DENIED',
    l4AutonomyEnabled: false,
    stealthPersistence: false,
    privilegeEscalation: false,
  };
}
