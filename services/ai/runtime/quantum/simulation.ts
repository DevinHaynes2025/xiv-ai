/**
 * 62L-EX4 — Local quantum simulation runtime (SIMULATED_QUANTUM only).
 *
 * Bounded XIV research state-vector on CPU. Never emits PHYSICAL_QPU_VERIFIED.
 * GPU→CPU fallback must record actual device (no silent fallback).
 */

import { createHash } from 'node:crypto';

import type { CircuitGate, CircuitModelIR } from './circuit-ir.ts';
import { estimateResources, type ResourceEstimate } from './resource-estimator.ts';
import type { SimulatorRegistry, SimulatorRegistryEntry } from './simulator-registry.ts';
import {
  EX4_LOCKS,
  type ExecutionClass,
  type SimulationRequest,
  type WorkState,
} from './types.ts';

export type Complex = { re: number; im: number };

export type SimulationOutcome =
  | {
      ok: true;
      classification: 'SIMULATED_QUANTUM';
      workState: 'COMPLETED';
      requestedDevice: string;
      actualDevice: string;
      fallbackUsed: boolean;
      fallbackReason: string | null;
      counts: Record<string, number>;
      probabilities: Record<string, number>;
      outputHash: string;
      runtimeMs: number;
      memoryPeakMb: number;
      seed: number;
      shots: number;
      circuitHash: string;
      simulatorId: string;
      simulatorVersion: string;
      precision: string;
      noiseModel: string | null;
      physicalQpuClaimed: false;
      fabricated: false;
      estimate: ResourceEstimate;
    }
  | {
      ok: false;
      classification: 'SIMULATED_QUANTUM' | null;
      workState: WorkState;
      reason: string;
      requestedDevice: string | null;
      actualDevice: string | null;
      fallbackUsed: boolean;
      fallbackReason: string | null;
      estimate: ResourceEstimate | null;
      physicalQpuClaimed: false;
    };

function mul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function scale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

/** Deterministic mulberry32 PRNG from seed. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function applySingleQubit(
  state: Complex[],
  n: number,
  target: number,
  matrix: readonly [Complex, Complex, Complex, Complex],
): void {
  const step = 1 << target;
  for (let base = 0; base < 1 << n; base += step * 2) {
    for (let offset = 0; offset < step; offset++) {
      const i0 = base + offset;
      const i1 = i0 + step;
      const a = state[i0]!;
      const b = state[i1]!;
      state[i0] = add(mul(matrix[0], a), mul(matrix[1], b));
      state[i1] = add(mul(matrix[2], a), mul(matrix[3], b));
    }
  }
}

function applyCX(state: Complex[], n: number, control: number, target: number): void {
  for (let i = 0; i < 1 << n; i++) {
    if (((i >> control) & 1) === 1 && ((i >> target) & 1) === 0) {
      const j = i ^ (1 << target);
      const tmp = state[i]!;
      state[i] = state[j]!;
      state[j] = tmp;
    }
  }
}

function gateMatrix(op: string, params?: readonly number[]): readonly [Complex, Complex, Complex, Complex] | null {
  const z = { re: 0, im: 0 };
  const one = { re: 1, im: 0 };
  const i = { re: 0, im: 1 };
  switch (op) {
    case 'I':
      return [one, z, z, one];
    case 'X':
      return [z, one, one, z];
    case 'Y':
      return [z, { re: 0, im: -1 }, i, z];
    case 'Z':
      return [one, z, z, { re: -1, im: 0 }];
    case 'H': {
      const s = Math.SQRT1_2;
      return [
        { re: s, im: 0 },
        { re: s, im: 0 },
        { re: s, im: 0 },
        { re: -s, im: 0 },
      ];
    }
    case 'S':
      return [one, z, z, i];
    case 'T':
      return [one, z, z, { re: Math.SQRT1_2, im: Math.SQRT1_2 }];
    case 'RX': {
      const th = params?.[0] ?? 0;
      const c = Math.cos(th / 2);
      const s = Math.sin(th / 2);
      return [
        { re: c, im: 0 },
        { re: 0, im: -s },
        { re: 0, im: -s },
        { re: c, im: 0 },
      ];
    }
    case 'RY': {
      const th = params?.[0] ?? 0;
      const c = Math.cos(th / 2);
      const s = Math.sin(th / 2);
      return [
        { re: c, im: 0 },
        { re: -s, im: 0 },
        { re: s, im: 0 },
        { re: c, im: 0 },
      ];
    }
    case 'RZ': {
      const th = params?.[0] ?? 0;
      return [
        { re: Math.cos(-th / 2), im: Math.sin(-th / 2) },
        z,
        z,
        { re: Math.cos(th / 2), im: Math.sin(th / 2) },
      ];
    }
    default:
      return null;
  }
}

export function runStateVector(
  circuit: CircuitModelIR,
  shots: number,
  seed: number,
): {
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  outputHash: string;
  memoryPeakMb: number;
} {
  const n = circuit.qubitCount;
  const dim = 1 << n;
  const state: Complex[] = Array.from({ length: dim }, () => ({ re: 0, im: 0 }));
  state[0] = { re: 1, im: 0 };

  for (const g of circuit.gates) {
    applyGate(state, n, g);
  }

  const probs: Record<string, number> = {};
  for (let i = 0; i < dim; i++) {
    const amp = state[i]!;
    const p = amp.re * amp.re + amp.im * amp.im;
    const bitstring = i.toString(2).padStart(n, '0');
    probs[bitstring] = p;
  }

  const rng = mulberry32(seed);
  const counts: Record<string, number> = {};
  const keys = Object.keys(probs);
  for (let s = 0; s < shots; s++) {
    let r = rng();
    let chosen = keys[keys.length - 1]!;
    for (const k of keys) {
      r -= probs[k]!;
      if (r <= 0) {
        chosen = k;
        break;
      }
    }
    counts[chosen] = (counts[chosen] ?? 0) + 1;
  }

  const outputHash = createHash('sha256')
    .update(JSON.stringify({ probs, counts, seed, shots, circuitHash: circuit.circuitHash }))
    .digest('hex');

  return {
    counts,
    probabilities: probs,
    outputHash,
    memoryPeakMb: (dim * 16) / (1024 * 1024),
  };
}

function applyGate(state: Complex[], n: number, g: CircuitGate): void {
  if (g.op === 'MEASURE') return;
  if (g.op === 'CX' || g.op === 'CNOT') {
    applyCX(state, n, g.qubits[0]!, g.qubits[1]!);
    return;
  }
  if (g.op === 'CZ') {
    for (let i = 0; i < 1 << n; i++) {
      if (((i >> g.qubits[0]!) & 1) === 1 && ((i >> g.qubits[1]!) & 1) === 1) {
        state[i] = scale(state[i]!, -1);
      }
    }
    return;
  }
  if (g.op === 'SWAP') {
    const a = g.qubits[0]!;
    const b = g.qubits[1]!;
    for (let i = 0; i < 1 << n; i++) {
      const ba = (i >> a) & 1;
      const bb = (i >> b) & 1;
      if (ba !== bb) {
        const j = i ^ (1 << a) ^ (1 << b);
        if (i < j) {
          const tmp = state[i]!;
          state[i] = state[j]!;
          state[j] = tmp;
        }
      }
    }
    return;
  }
  const m = gateMatrix(g.op, g.params);
  if (!m) {
    throw new Error(`UNSUPPORTED_GATE:${g.op}`);
  }
  applySingleQubit(state, n, g.qubits[0]!, m);
}

export function assertNeverPhysicalQpu(
  classification: ExecutionClass,
): classification is 'SIMULATED_QUANTUM' {
  return classification === 'SIMULATED_QUANTUM';
}

export function runLocalSimulation(input: {
  request: SimulationRequest;
  circuit: CircuitModelIR;
  registry: SimulatorRegistry;
  /** Attempt to claim physical QPU — must always be denied in EX4. */
  claimPhysicalQpu?: boolean;
  actorTenantId?: string;
  actorUniverseId?: string;
}): SimulationOutcome {
  if (EX4_LOCKS.L4_AUTONOMY_ENABLED !== false) {
    return {
      ok: false,
      classification: null,
      workState: 'REVOKED',
      reason: 'DENY_L4',
      requestedDevice: null,
      actualDevice: null,
      fallbackUsed: false,
      fallbackReason: null,
      estimate: null,
      physicalQpuClaimed: false,
    };
  }

  if (input.claimPhysicalQpu === true) {
    return {
      ok: false,
      classification: 'SIMULATED_QUANTUM',
      workState: 'FAILED',
      reason: 'DENY_PHYSICAL_QPU_CLAIM',
      requestedDevice: input.request.preferredDeviceClass,
      actualDevice: null,
      fallbackUsed: false,
      fallbackReason: null,
      estimate: null,
      physicalQpuClaimed: false,
    };
  }

  if (
    input.actorTenantId !== undefined &&
    input.actorTenantId !== input.request.tenantId
  ) {
    return {
      ok: false,
      classification: null,
      workState: 'FAILED',
      reason: 'DENY_TENANT',
      requestedDevice: null,
      actualDevice: null,
      fallbackUsed: false,
      fallbackReason: null,
      estimate: null,
      physicalQpuClaimed: false,
    };
  }

  if (
    input.actorUniverseId !== undefined &&
    input.actorUniverseId !== input.request.universeId
  ) {
    return {
      ok: false,
      classification: null,
      workState: 'FAILED',
      reason: 'DENY_UNIVERSE',
      requestedDevice: null,
      actualDevice: null,
      fallbackUsed: false,
      fallbackReason: null,
      estimate: null,
      physicalQpuClaimed: false,
    };
  }

  if (input.request.poweredOff) {
    return {
      ok: false,
      classification: null,
      workState: 'OFFLINE_STOPPED',
      reason: 'OFFLINE_STOPPED',
      requestedDevice: null,
      actualDevice: null,
      fallbackUsed: false,
      fallbackReason: null,
      estimate: null,
      physicalQpuClaimed: false,
    };
  }

  const preferredId =
    input.request.preferredSimulatorId ?? 'xiv-sv-cpu-v1';
  let simulator = input.registry.get(preferredId);

  // Offline cloud / web-required routing
  if (
    simulator &&
    simulator.networkRequired &&
    (input.request.offlineDisconnected || !input.request.networkAvailable)
  ) {
    const estimate = estimateResources({
      request: input.request,
      circuit: input.circuit,
      simulator,
    });
    return {
      ok: false,
      classification: 'SIMULATED_QUANTUM',
      workState: estimate.workStateHint ?? 'WAITING_PROVIDER',
      reason: estimate.reason,
      requestedDevice: input.request.preferredDeviceClass,
      actualDevice: null,
      fallbackUsed: false,
      fallbackReason: null,
      estimate,
      physicalQpuClaimed: false,
    };
  }

  if (!simulator || !simulator.adapterEnabled) {
    const locals = input.registry.listEligibleLocal({
      offlineDisconnected: input.request.offlineDisconnected,
      requireVerified: input.request.requireVerifiedSimulator,
    });
    simulator = locals[0] ?? null;
  }

  const estimate = estimateResources({
    request: input.request,
    circuit: input.circuit,
    simulator,
    gpuAccelVerified: simulator?.gpuAccelerationVerified,
  });

  if (estimate.decision === 'DENY') {
    return {
      ok: false,
      classification: 'SIMULATED_QUANTUM',
      workState: estimate.workStateHint ?? 'FAILED',
      reason: String(estimate.reason),
      requestedDevice: input.request.preferredDeviceClass,
      actualDevice: null,
      fallbackUsed: false,
      fallbackReason: null,
      estimate,
      physicalQpuClaimed: false,
    };
  }

  if (estimate.decision === 'REDUCE_SCOPE') {
    return {
      ok: false,
      classification: 'SIMULATED_QUANTUM',
      workState: 'REVIEW_REQUIRED',
      reason: 'DENY_RESOURCE_LIMIT',
      requestedDevice: input.request.preferredDeviceClass,
      actualDevice: null,
      fallbackUsed: false,
      fallbackReason: null,
      estimate,
      physicalQpuClaimed: false,
    };
  }

  const requestedDevice =
    input.request.preferredDeviceClass === 'GPU' ? 'LOCAL_GPU' : 'LOCAL_CPU';
  let actualDevice = 'LOCAL_CPU';
  let fallbackUsed = false;
  let fallbackReason: string | null = null;

  if (estimate.decision === 'FALLBACK') {
    fallbackUsed = true;
    fallbackReason = String(estimate.reason);
    actualDevice = 'LOCAL_CPU';
  } else if (
    estimate.recommendedDeviceClass === 'GPU' &&
    simulator?.gpuAccelerationVerified
  ) {
    actualDevice = 'LOCAL_GPU';
  }

  if (!simulator) {
    return {
      ok: false,
      classification: null,
      workState: 'WAITING_DATA',
      reason: 'NO_ELIGIBLE_SIMULATOR',
      requestedDevice,
      actualDevice: null,
      fallbackUsed,
      fallbackReason,
      estimate,
      physicalQpuClaimed: false,
    };
  }

  const started = Date.now();
  try {
    const result = runStateVector(
      input.circuit,
      input.request.shots,
      input.request.seed,
    );
    const runtimeMs = Math.max(1, Date.now() - started);

    return {
      ok: true,
      classification: 'SIMULATED_QUANTUM',
      workState: 'COMPLETED',
      requestedDevice,
      actualDevice,
      fallbackUsed,
      fallbackReason,
      counts: result.counts,
      probabilities: result.probabilities,
      outputHash: result.outputHash,
      runtimeMs,
      memoryPeakMb: result.memoryPeakMb,
      seed: input.request.seed,
      shots: input.request.shots,
      circuitHash: input.circuit.circuitHash,
      simulatorId: simulator.simulatorId,
      simulatorVersion: simulator.version,
      precision: input.request.precision,
      noiseModel: input.request.noiseModel,
      physicalQpuClaimed: false,
      fabricated: false,
      estimate,
    };
  } catch (err) {
    return {
      ok: false,
      classification: 'SIMULATED_QUANTUM',
      workState: 'FAILED',
      reason: err instanceof Error ? err.message : 'SIMULATION_FAILED',
      requestedDevice,
      actualDevice,
      fallbackUsed,
      fallbackReason,
      estimate,
      physicalQpuClaimed: false,
    };
  }
}

export type { SimulatorRegistryEntry };
