/**
 * Dimension-ladder benchmark stubs for research fabric.
 * Placeholders return NOT_RUN until an execution harness fills metrics.
 */

export const DIMENSION_LADDER = [3, 6, 12, 24, 50, 100] as const;
export type LadderDimension = (typeof DIMENSION_LADDER)[number];

export type BenchmarkStatus = 'NOT_RUN' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';

export type BenchmarkMetrics = {
  latencyMs: number | null;
  throughputOps: number | null;
  memoryBytes: number | null;
  evidenceCoverage: number | null;
  falseLinkRate: number | null;
  reproducibility: number | null;
};

export type DimensionBenchmarkResult = {
  dimensions: LadderDimension;
  status: BenchmarkStatus;
  metrics: BenchmarkMetrics;
  executedAt: string | null;
  notes: string;
};

const EMPTY_METRICS: BenchmarkMetrics = Object.freeze({
  latencyMs: null,
  throughputOps: null,
  memoryBytes: null,
  evidenceCoverage: null,
  falseLinkRate: null,
  reproducibility: null,
});

export function createBenchmarkStub(dimensions: LadderDimension): DimensionBenchmarkResult {
  if (!DIMENSION_LADDER.includes(dimensions)) {
    throw new RangeError(`dimensions must be one of ${DIMENSION_LADDER.join(',')}`);
  }
  return {
    dimensions,
    status: 'NOT_RUN',
    metrics: { ...EMPTY_METRICS },
    executedAt: null,
    notes: 'stub — metrics placeholders until harness executes',
  };
}

export function createDimensionLadderBenchmarks(): DimensionBenchmarkResult[] {
  return DIMENSION_LADDER.map((dimensions) => createBenchmarkStub(dimensions));
}

/**
 * Execution entry point reserved for a future harness.
 * Until wired, always returns NOT_RUN stubs (no fake PASS).
 */
export function runDimensionBenchmarks(_options?: {
  dimensions?: readonly LadderDimension[];
}): DimensionBenchmarkResult[] {
  const selected = _options?.dimensions ?? DIMENSION_LADDER;
  return selected.map((dimensions) => {
    if (!DIMENSION_LADDER.includes(dimensions as LadderDimension)) {
      throw new RangeError(`unsupported ladder dimension: ${dimensions}`);
    }
    return createBenchmarkStub(dimensions as LadderDimension);
  });
}