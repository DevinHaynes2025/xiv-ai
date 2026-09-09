/**
 * 62L-EX4 — Provider-neutral Circuit / Model IR.
 * Shared path: Problem → Quantum Formulation → Circuit/Model IR →
 * Simulator Adapter → Runtime → Device.
 *
 * XIV-owned schemas only — no proprietary QPU/chip IP clone.
 */

import { createHash } from 'node:crypto';

import { SHARED_IR_PATH, type SharedIrHop } from './types.ts';

export const SUPPORTED_GATES = [
  'I',
  'X',
  'Y',
  'Z',
  'H',
  'S',
  'T',
  'RX',
  'RY',
  'RZ',
  'CX',
  'CZ',
  'SWAP',
  'MEASURE',
] as const;

export type SupportedGate = (typeof SUPPORTED_GATES)[number];

export type CircuitGate = {
  op: SupportedGate | string;
  qubits: readonly number[];
  params?: readonly number[];
};

export type CircuitModelIR = {
  irId: string;
  problemId: string;
  formulationId: string;
  qubitCount: number;
  depth: number;
  gates: readonly CircuitGate[];
  measurements: readonly number[];
  metadata: Record<string, string | number | boolean | null>;
  circuitHash: string;
  irPath: readonly SharedIrHop[];
  xivOwnedSchema: true;
  proprietaryClone: false;
};

export type CircuitBuildInput = {
  irId: string;
  problemId: string;
  formulationId: string;
  qubitCount: number;
  gates: readonly CircuitGate[];
  measurements?: readonly number[];
  metadata?: Record<string, string | number | boolean | null>;
};

export function hashCircuitPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function estimateDepth(gates: readonly CircuitGate[]): number {
  return gates.filter((g) => g.op !== 'MEASURE').length;
}

export function buildCircuitModelIR(input: CircuitBuildInput): CircuitModelIR {
  const measurements =
    input.measurements ??
    Array.from({ length: input.qubitCount }, (_, i) => i);
  const depth = estimateDepth(input.gates);
  const body = {
    irId: input.irId,
    problemId: input.problemId,
    formulationId: input.formulationId,
    qubitCount: input.qubitCount,
    depth,
    gates: input.gates,
    measurements,
  };
  return {
    ...body,
    metadata: input.metadata ?? {},
    circuitHash: hashCircuitPayload(body),
    irPath: [...SHARED_IR_PATH],
    xivOwnedSchema: true,
    proprietaryClone: false,
  };
}

/** Bell-pair fixture for bounded verification. */
export function buildBellPairIR(irId = 'ir-bell-pair'): CircuitModelIR {
  return buildCircuitModelIR({
    irId,
    problemId: 'problem-bell',
    formulationId: 'formulation-entangle-2q',
    qubitCount: 2,
    gates: [
      { op: 'H', qubits: [0] },
      { op: 'CX', qubits: [0, 1] },
      { op: 'MEASURE', qubits: [0] },
      { op: 'MEASURE', qubits: [1] },
    ],
  });
}

/** Oversized fixture used for resource denial tests. */
export function buildOversizedIR(
  qubitCount: number,
  irId = 'ir-oversized',
): CircuitModelIR {
  const gates: CircuitGate[] = [];
  for (let q = 0; q < qubitCount; q++) {
    gates.push({ op: 'H', qubits: [q] });
  }
  for (let q = 0; q < qubitCount - 1; q++) {
    gates.push({ op: 'CX', qubits: [q, q + 1] });
  }
  return buildCircuitModelIR({
    irId,
    problemId: 'problem-oversized',
    formulationId: 'formulation-sv-large',
    qubitCount,
    gates,
  });
}

export function assertXivOwnedIr(ir: CircuitModelIR): boolean {
  return ir.xivOwnedSchema === true && ir.proprietaryClone === false;
}
