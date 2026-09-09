/**
 * 62L-EX16 — Provider-neutral XivCircuitIR.
 * Circuit IR ≠ physical-QPU execution. No credentials embedded.
 */

import { createHash } from 'node:crypto';

import {
  EX16_LOCKS,
  PHYSICAL_QPU_VERIFIED,
  type ExecutionClass,
} from './types.ts';
import type { XivProblemIR } from './problem-ir.ts';

export type CircuitGate = {
  id: string;
  name: string;
  qubits: number[];
  params?: number[];
};

export type XivCircuitIR = {
  circuitId: string;
  sourceIrId: string;
  providerNeutral: true;
  embedsCredentials: false;
  qubitCount: number;
  depth: number;
  gates: CircuitGate[];
  measurements: string[];
  executionClass: 'SIMULATED_QUANTUM' | 'QUANTUM_INSPIRED' | 'PHYSICAL_QPU_CANDIDATE';
  /** Always false from translation alone. */
  physicalQpuVerified: false;
  /** Circuit IR never equals physical execution. */
  impliesPhysicalQpuExecution: false;
  notes: string[];
};

export function buildXivCircuitIR(input: {
  problem: XivProblemIR;
  qubitCount: number;
  gates?: CircuitGate[];
  executionClass?: XivCircuitIR['executionClass'];
}): XivCircuitIR {
  const gates = input.gates ?? [
    { id: 'g0', name: 'H', qubits: [0] },
    { id: 'g1', name: 'CX', qubits: [0, Math.min(1, Math.max(0, input.qubitCount - 1))] },
  ];
  const circuitId = `cir_${createHash('sha256')
    .update(JSON.stringify([input.problem.irId, input.qubitCount, gates]))
    .digest('hex')
    .slice(0, 20)}`;

  return {
    circuitId,
    sourceIrId: input.problem.irId,
    providerNeutral: true,
    embedsCredentials: false,
    qubitCount: input.qubitCount,
    depth: gates.length,
    gates,
    measurements: gates.flatMap((g) => g.qubits.map((q) => `q${q}`)),
    executionClass: input.executionClass ?? 'SIMULATED_QUANTUM',
    physicalQpuVerified: PHYSICAL_QPU_VERIFIED,
    impliesPhysicalQpuExecution: false,
    notes: [
      'XivCircuitIR is provider-neutral syntax only.',
      'Circuit IR ≠ physical-QPU execution.',
      `credentials_embedded=${EX16_LOCKS.EMBED_PROVIDER_CREDENTIALS}`,
    ],
  };
}

export function circuitImpliesPhysicalQpu(_circuit: XivCircuitIR): false {
  return false;
}

export function circuitExecutionClass(circuit: XivCircuitIR): ExecutionClass {
  return circuit.executionClass;
}
