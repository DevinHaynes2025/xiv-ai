/**
 * 62L-EX4 — Simulation resource estimator.
 * Decisions: ALLOW | QUEUE | REDUCE_SCOPE | FALLBACK | DENY
 * Oversized → DENY_RESOURCE_LIMIT. Offline network sims → WAITING_*.
 */

import type { CircuitModelIR } from './circuit-ir.ts';
import type { SimulatorRegistryEntry } from './types.ts';
import type {
  ResourceDecision,
  ResourceDenyReason,
  SimulationRequest,
  WorkState,
} from './types.ts';

export type ResourceEstimate = {
  decision: ResourceDecision;
  reason: string | ResourceDenyReason;
  workStateHint: WorkState | null;
  estimatedMemoryMb: number;
  estimatedStateVectorCells: number;
  recommendedRuntimeType: SimulatorRegistryEntry['runtimeType'] | null;
  recommendedDeviceClass: 'CPU' | 'GPU' | 'NPU' | null;
  fallbackDeviceClass: 'CPU' | null;
  reduceToMaxQubits: number | null;
  notes: readonly string[];
};

/** Rough state-vector memory: 16 bytes/complex128 amplitude * 2^n. */
export function estimateStateVectorMemoryMb(qubitCount: number): number {
  if (qubitCount < 0) return 0;
  if (qubitCount > 40) return Number.POSITIVE_INFINITY;
  const cells = 2 ** qubitCount;
  const bytes = cells * 16;
  return bytes / (1024 * 1024);
}

export function estimateResources(input: {
  request: SimulationRequest;
  circuit: CircuitModelIR;
  simulator: SimulatorRegistryEntry | null;
  gpuAccelVerified?: boolean;
}): ResourceEstimate {
  const { request, circuit, simulator } = input;
  const notes: string[] = [];

  if (request.poweredOff) {
    return {
      decision: 'DENY',
      reason: 'OFFLINE_STOPPED',
      workStateHint: 'OFFLINE_STOPPED',
      estimatedMemoryMb: 0,
      estimatedStateVectorCells: 0,
      recommendedRuntimeType: null,
      recommendedDeviceClass: null,
      fallbackDeviceClass: null,
      reduceToMaxQubits: null,
      notes: ['Node powered off — no continued simulation.'],
    };
  }

  if (Date.parse(request.expiresAt) <= Date.now()) {
    return {
      decision: 'DENY',
      reason: 'DENY_EXPIRED',
      workStateHint: 'EXPIRED',
      estimatedMemoryMb: 0,
      estimatedStateVectorCells: 0,
      recommendedRuntimeType: null,
      recommendedDeviceClass: null,
      fallbackDeviceClass: null,
      reduceToMaxQubits: null,
      notes: ['Request expired.'],
    };
  }

  if (!simulator) {
    return {
      decision: 'DENY',
      reason: 'DENY_NOT_VERIFIED_FOR_CLAIM',
      workStateHint: 'WAITING_DATA',
      estimatedMemoryMb: 0,
      estimatedStateVectorCells: 0,
      recommendedRuntimeType: null,
      recommendedDeviceClass: null,
      fallbackDeviceClass: null,
      reduceToMaxQubits: null,
      notes: ['No eligible simulator.'],
    };
  }

  if (simulator.verificationState === 'REVOKED') {
    return {
      decision: 'DENY',
      reason: 'DENY_REVOKED',
      workStateHint: 'REVOKED',
      estimatedMemoryMb: 0,
      estimatedStateVectorCells: 0,
      recommendedRuntimeType: null,
      recommendedDeviceClass: null,
      fallbackDeviceClass: null,
      reduceToMaxQubits: null,
      notes: ['Simulator revoked.'],
    };
  }

  if (
    simulator.networkRequired &&
    (request.offlineDisconnected || !request.networkAvailable)
  ) {
    const waiting: WorkState =
      simulator.runtimeType === 'CLOUD_SIMULATOR'
        ? 'WAITING_PROVIDER'
        : 'WAITING_DATA';
    return {
      decision: 'DENY',
      reason: 'DENY_OFFLINE_NETWORK_REQUIRED',
      workStateHint: waiting,
      estimatedMemoryMb: 0,
      estimatedStateVectorCells: 0,
      recommendedRuntimeType: null,
      recommendedDeviceClass: null,
      fallbackDeviceClass: null,
      reduceToMaxQubits: null,
      notes: [
        waiting === 'WAITING_PROVIDER'
          ? 'Cloud simulator offline → WAITING_PROVIDER.'
          : 'Web/network-required data unavailable → WAITING_DATA.',
      ],
    };
  }

  if (simulator.adapterEnabled !== true || !simulator.licenseReviewed) {
    return {
      decision: 'DENY',
      reason: 'DENY_LICENSE',
      workStateHint: 'WAITING_DATA',
      estimatedMemoryMb: 0,
      estimatedStateVectorCells: 0,
      recommendedRuntimeType: null,
      recommendedDeviceClass: null,
      fallbackDeviceClass: null,
      reduceToMaxQubits: null,
      notes: ['Adapter disabled pending license/repo review.'],
    };
  }

  const qubits = Math.max(circuit.qubitCount, request.maxQubits);
  const memMb = estimateStateVectorMemoryMb(circuit.qubitCount);
  const cells = circuit.qubitCount <= 40 ? 2 ** circuit.qubitCount : Infinity;

  if (
    circuit.qubitCount > simulator.maxQubitsEvidence ||
    circuit.qubitCount > request.maxQubits ||
    memMb > request.maxMemoryMb
  ) {
    const reduceTo = Math.min(
      simulator.maxQubitsEvidence,
      request.maxQubits,
      maxQubitsForMemory(request.maxMemoryMb),
    );
    if (reduceTo >= 1 && reduceTo < circuit.qubitCount) {
      return {
        decision: 'REDUCE_SCOPE',
        reason: 'DENY_RESOURCE_LIMIT',
        workStateHint: 'REVIEW_REQUIRED',
        estimatedMemoryMb: memMb,
        estimatedStateVectorCells: cells,
        recommendedRuntimeType: 'LOCAL_CPU',
        recommendedDeviceClass: 'CPU',
        fallbackDeviceClass: 'CPU',
        reduceToMaxQubits: reduceTo,
        notes: [
          `Oversized circuit (${circuit.qubitCount}q, ~${memMb.toFixed(2)}MB) — reduce scope or DENY.`,
        ],
      };
    }
    return {
      decision: 'DENY',
      reason: 'DENY_RESOURCE_LIMIT',
      workStateHint: 'FAILED',
      estimatedMemoryMb: memMb,
      estimatedStateVectorCells: cells,
      recommendedRuntimeType: null,
      recommendedDeviceClass: null,
      fallbackDeviceClass: null,
      reduceToMaxQubits: null,
      notes: [
        `Resource limit exceeded: qubits=${circuit.qubitCount} memMb≈${memMb}`,
      ],
    };
  }

  // Preferred GPU without independent accel proof → FALLBACK to CPU (must record).
  if (
    request.preferredDeviceClass === 'GPU' ||
    request.preferredRuntimeType === 'LOCAL_GPU' ||
    simulator.runtimeType === 'LOCAL_GPU'
  ) {
    const gpuOk =
      input.gpuAccelVerified === true || simulator.gpuAccelerationVerified;
    if (!gpuOk) {
      notes.push(
        'GPU preferred but acceleration not independently proven — FALLBACK to CPU; record actual device.',
      );
      return {
        decision: 'FALLBACK',
        reason: 'GPU_EXISTS_NE_ACCEL_EXISTS',
        workStateHint: 'LOCAL_READY',
        estimatedMemoryMb: memMb,
        estimatedStateVectorCells: cells,
        recommendedRuntimeType: 'LOCAL_CPU',
        recommendedDeviceClass: 'CPU',
        fallbackDeviceClass: 'CPU',
        reduceToMaxQubits: null,
        notes,
      };
    }
  }

  if (request.requireVerifiedSimulator && simulator.verificationState !== 'VERIFIED') {
    return {
      decision: 'DENY',
      reason: 'DENY_NOT_VERIFIED_FOR_CLAIM',
      workStateHint: 'WAITING_DATA',
      estimatedMemoryMb: memMb,
      estimatedStateVectorCells: cells,
      recommendedRuntimeType: simulator.runtimeType,
      recommendedDeviceClass: 'CPU',
      fallbackDeviceClass: 'CPU',
      reduceToMaxQubits: null,
      notes: [
        `Simulator verificationState=${simulator.verificationState} cannot satisfy VERIFIED requirement.`,
      ],
    };
  }

  void qubits;
  return {
    decision: 'ALLOW',
    reason: 'WITHIN_BOUNDS',
    workStateHint: 'LOCAL_READY',
    estimatedMemoryMb: memMb,
    estimatedStateVectorCells: cells,
    recommendedRuntimeType: simulator.runtimeType === 'LOCAL_GPU' &&
      (input.gpuAccelVerified || simulator.gpuAccelerationVerified)
      ? 'LOCAL_GPU'
      : 'LOCAL_CPU',
    recommendedDeviceClass:
      simulator.runtimeType === 'LOCAL_GPU' &&
      (input.gpuAccelVerified || simulator.gpuAccelerationVerified)
        ? 'GPU'
        : 'CPU',
    fallbackDeviceClass: 'CPU',
    reduceToMaxQubits: null,
    notes,
  };
}

function maxQubitsForMemory(maxMemoryMb: number): number {
  for (let q = 40; q >= 0; q--) {
    if (estimateStateVectorMemoryMb(q) <= maxMemoryMb) return q;
  }
  return 0;
}
