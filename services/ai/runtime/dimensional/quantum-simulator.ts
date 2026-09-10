/**
 * Local quantum-simulator interface stub.
 * Real QPU adapters remain WAITING_PROVIDER — never fake LIVE QPU.
 */

export type QuantumBackendKind = 'local-simulator' | 'qpu';

export type QuantumProviderStatus =
  | 'AVAILABLE_SIMULATOR'
  | 'WAITING_PROVIDER'
  | 'VERIFIED_QPU'
  | 'UNAVAILABLE';

export type QuantumJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export type QuantumCircuitStub = {
  circuitId: string;
  qubitCount: number;
  depth: number;
  gates: readonly string[];
};

export type QuantumJobResult = {
  jobId: string;
  backend: QuantumBackendKind;
  providerStatus: QuantumProviderStatus;
  status: QuantumJobStatus;
  /** Simulation samples only; never labeled as live QPU output. */
  samples: readonly number[] | null;
  liveQpu: false;
  notes: string;
};

export interface QuantumSimulator {
  readonly kind: 'local-simulator';
  readonly providerStatus: 'AVAILABLE_SIMULATOR';
  submit(circuit: QuantumCircuitStub): QuantumJobResult;
}

export interface QuantumProcessingUnitAdapter {
  readonly kind: 'qpu';
  readonly providerStatus: QuantumProviderStatus;
  submit(circuit: QuantumCircuitStub): QuantumJobResult;
}

function validateCircuit(circuit: QuantumCircuitStub): void {
  if (!circuit.circuitId) throw new TypeError('circuitId is required');
  if (!Number.isInteger(circuit.qubitCount) || circuit.qubitCount < 1) {
    throw new RangeError('qubitCount must be a positive integer');
  }
  if (!Number.isInteger(circuit.depth) || circuit.depth < 0) {
    throw new RangeError('depth must be a non-negative integer');
  }
}

/**
 * Deterministic local classical stand-in for a quantum simulator.
 * Results are labeled simulation-only (liveQpu=false).
 */
export function createLocalQuantumSimulator(maxQubits = 24): QuantumSimulator {
  return {
    kind: 'local-simulator',
    providerStatus: 'AVAILABLE_SIMULATOR',
    submit(circuit: QuantumCircuitStub): QuantumJobResult {
      validateCircuit(circuit);
      if (circuit.qubitCount > maxQubits) {
        return {
          jobId: `sim-reject-${circuit.circuitId}`,
          backend: 'local-simulator',
          providerStatus: 'AVAILABLE_SIMULATOR',
          status: 'REJECTED',
          samples: null,
          liveQpu: false,
          notes: `local simulator qubit cap ${maxQubits}; classical stub only`,
        };
      }
      // Tiny deterministic placeholder samples — not quantum advantage.
      const samples = Object.freeze(
        Array.from({ length: Math.min(8, 2 ** Math.min(circuit.qubitCount, 3)) }, (_, i) =>
          (circuit.qubitCount * 17 + circuit.depth * 3 + i) % 2,
        ),
      );
      return {
        jobId: `sim-${circuit.circuitId}`,
        backend: 'local-simulator',
        providerStatus: 'AVAILABLE_SIMULATOR',
        status: 'COMPLETED',
        samples,
        liveQpu: false,
        notes: 'local classical simulator stub; not a QPU; no quantum advantage claimed',
      };
    },
  };
}

/**
 * QPU adapter placeholder — waits for a verified provider.
 * Never reports LIVE / VERIFIED_QPU until real verification lands.
 */
export function createWaitingQpuAdapter(providerName = 'unspecified'): QuantumProcessingUnitAdapter {
  return {
    kind: 'qpu',
    providerStatus: 'WAITING_PROVIDER',
    submit(circuit: QuantumCircuitStub): QuantumJobResult {
      validateCircuit(circuit);
      return {
        jobId: `qpu-wait-${circuit.circuitId}`,
        backend: 'qpu',
        providerStatus: 'WAITING_PROVIDER',
        status: 'REJECTED',
        samples: null,
        liveQpu: false,
        notes: `QPU provider "${providerName}" is WAITING_PROVIDER; no fake LIVE QPU`,
      };
    },
  };
}

export const DEFAULT_QPU_STATUS: QuantumProviderStatus = 'WAITING_PROVIDER';