export interface SimulationScaleManifest {
  mode: 'SIMULATION';
  logicalTargetCells: bigint;
  measuredCells: bigint;
  shardSizeTargetBytes: number;
  maxParallelBranches: number;
  quantumMode: 'CLASSICAL_SIMULATOR' | 'VERIFIED_QPU_ADAPTER';
  evidenceRefs: string[];
}

export function createSimulationScaleManifest(measuredCells = 0n): SimulationScaleManifest {
  return {
    mode: 'SIMULATION',
    logicalTargetCells: 1_000_000_000_000n,
    measuredCells,
    shardSizeTargetBytes: 4096,
    maxParallelBranches: 64,
    quantumMode: 'CLASSICAL_SIMULATOR',
    evidenceRefs: [],
  };
}

export const SIMULATION_SCALE_GUARDRAILS = {
  targetIsNotMeasuredVolume: true,
  simulationIsNotReality: true,
  quantumAdvantageClaimAllowedWithoutBenchmark: false,
  maxParallelBranchesMustBeBounded: true,
};
