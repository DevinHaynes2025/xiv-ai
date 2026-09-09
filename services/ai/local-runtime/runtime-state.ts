/**
 * 62L-EL — Runtime gate state for EL1–EL4 pass tracking.
 * AMD GPU/NPU scheduling candidates are DENIED until all four gates PASS.
 */

import type { ElGateId, ElGateStatus, EvidenceState } from './types';
import { EL_GATES } from './types';

export type LocalRuntimeState = {
  gates: Record<ElGateId, ElGateStatus>;
  el1El4Complete: boolean;
  amdGpuNpuRoutingEligible: boolean;
  reason: string;
  state: EvidenceState;
  updatedAt: string;
};

function pending(gate: ElGateId): ElGateStatus {
  return {
    gate,
    status: 'PENDING',
    evidence: 'NOT_YET_EVALUATED',
    at: new Date().toISOString(),
  };
}

export function createInitialRuntimeState(): LocalRuntimeState {
  return {
    gates: {
      EL1: pending('EL1'),
      EL2: pending('EL2'),
      EL3: pending('EL3'),
      EL4: pending('EL4'),
    },
    el1El4Complete: false,
    amdGpuNpuRoutingEligible: false,
    reason: 'EL1_EL4_PENDING',
    state: 'NOT_TESTED',
    updatedAt: new Date().toISOString(),
  };
}

export function recordGateResult(
  state: LocalRuntimeState,
  gate: ElGateId,
  status: 'PASS' | 'FAIL',
  evidence: string,
): LocalRuntimeState {
  const next: LocalRuntimeState = {
    ...state,
    gates: {
      ...state.gates,
      [gate]: {
        gate,
        status,
        evidence,
        at: new Date().toISOString(),
      },
    },
    updatedAt: new Date().toISOString(),
  };

  const allPass = EL_GATES.every((g) => next.gates[g].status === 'PASS');
  next.el1El4Complete = allPass;
  next.amdGpuNpuRoutingEligible = allPass;
  next.reason = allPass ? 'EL1_EL4_PASS' : 'EL1_EL4_INCOMPLETE_OR_FAILED';
  next.state = allPass ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'NOT_TESTED';
  return next;
}

export function assertEl1El4Pass(state: LocalRuntimeState): boolean {
  return EL_GATES.every((g) => state.gates[g].status === 'PASS') && state.el1El4Complete;
}

export const DEFAULT_HEARTBEAT_STALE_MS = 2 * 60 * 1000;
