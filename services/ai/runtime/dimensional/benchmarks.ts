/**
 * Dimension-ladder benchmark runner for research fabric.
 * Local CPU-only harness measures projectPoint / pathway search latency.
 * Never claims GPU/NPU/QPU VERIFIED without a device receipt.
 */

import { createPoint, projectPoint, PRODUCTION_DIMENSIONAL_FABRIC_ENABLED } from './fabric';
import { findPathway } from './pathways';
import type { PathwayEdge } from './types';

export const DIMENSION_LADDER = [3, 6, 12, 24, 50, 100] as const;
export type LadderDimension = (typeof DIMENSION_LADDER)[number];

/** RUN = executed locally with timings; not a production quality gate PASS. */
export type BenchmarkStatus = 'NOT_RUN' | 'RUNNING' | 'RUN' | 'PASSED' | 'FAILED' | 'SKIPPED';

export type BenchmarkBackendClaim =
  | 'cpu'
  | 'gpu_unverified'
  | 'npu_unverified'
  | 'qpu_waiting';

export type BenchmarkMetrics = {
  latencyMs: number | null;
  throughputOps: number | null;
  memoryBytes: number | null;
  evidenceCoverage: number | null;
  falseLinkRate: number | null;
  reproducibility: number | null;
};

/**
 * Lean Six Sigma quality counters — honest zeros / WAITING where unknown.
 * Never invent coverage or defect rates without measurement.
 */
export type LeanSixSigmaCounters = {
  defects: number;
  latencyMs: number | null;
  throughputOps: number | null;
  evidenceCoverage: number | 'WAITING';
  falseLinkRate: number | 'WAITING';
  reproducibility: number | 'WAITING';
};

export type DimensionBenchmarkResult = {
  dimensions: LadderDimension;
  status: BenchmarkStatus;
  metrics: BenchmarkMetrics;
  quality: LeanSixSigmaCounters;
  backend: BenchmarkBackendClaim;
  executedAt: string | null;
  notes: string;
  /** Wall iterations performed for project + pathway microbench. */
  iterations: number;
};

const EMPTY_METRICS: BenchmarkMetrics = Object.freeze({
  latencyMs: null,
  throughputOps: null,
  memoryBytes: null,
  evidenceCoverage: null,
  falseLinkRate: null,
  reproducibility: null,
});

const WAITING_QUALITY: LeanSixSigmaCounters = Object.freeze({
  defects: 0,
  latencyMs: null,
  throughputOps: null,
  evidenceCoverage: 'WAITING',
  falseLinkRate: 'WAITING',
  reproducibility: 'WAITING',
});

/** Bounded defaults — keep local runs cheap and deterministic. */
export const DEFAULT_BENCHMARK_ITERATIONS = 64 as const;
export const DEFAULT_PATHWAY_NODES = 48 as const;
export const DEFAULT_MAX_VISITED = 10_000 as const;

export function createBenchmarkStub(dimensions: LadderDimension): DimensionBenchmarkResult {
  if (!DIMENSION_LADDER.includes(dimensions)) {
    throw new RangeError(`dimensions must be one of ${DIMENSION_LADDER.join(',')}`);
  }
  return {
    dimensions,
    status: 'NOT_RUN',
    metrics: { ...EMPTY_METRICS },
    quality: { ...WAITING_QUALITY },
    backend: 'cpu',
    executedAt: null,
    notes: 'stub — metrics placeholders until harness executes',
    iterations: 0,
  };
}

export function createDimensionLadderBenchmarks(): DimensionBenchmarkResult[] {
  return DIMENSION_LADDER.map((dimensions) => createBenchmarkStub(dimensions));
}

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function buildSyntheticPathway(dimensions: number): PathwayEdge[] {
  const nodeCount = Math.min(DEFAULT_PATHWAY_NODES, Math.max(8, dimensions));
  const edges: PathwayEdge[] = [];
  for (let i = 0; i < nodeCount - 1; i += 1) {
    edges.push({
      from: `n${i}`,
      to: `n${i + 1}`,
      weight: 1 + (i % 3),
      evidenceScore: 0.55 + ((i % 5) * 0.08),
    });
    if (i + 2 < nodeCount) {
      edges.push({
        from: `n${i}`,
        to: `n${i + 2}`,
        weight: 2 + (i % 2),
        evidenceScore: 0.5 + ((i % 4) * 0.1),
      });
    }
  }
  return edges;
}

/**
 * Bounded local CPU microbench for one ladder dimension.
 * Measures projectPoint + findPathway only — no GPU/NPU/QPU paths.
 */
export function runSingleDimensionBenchmark(
  dimensions: LadderDimension,
  options?: {
    iterations?: number;
    maxVisited?: number;
  },
): DimensionBenchmarkResult {
  if (PRODUCTION_DIMENSIONAL_FABRIC_ENABLED) {
    throw new Error('PRODUCTION_DIMENSIONAL_FABRIC_ENABLED must remain false for research benchmarks');
  }
  if (!DIMENSION_LADDER.includes(dimensions)) {
    throw new RangeError(`unsupported ladder dimension: ${dimensions}`);
  }

  const iterations = Math.max(1, Math.min(options?.iterations ?? DEFAULT_BENCHMARK_ITERATIONS, 512));
  const maxVisited = options?.maxVisited ?? DEFAULT_MAX_VISITED;
  const coords = Array.from({ length: dimensions }, (_, i) => (i + 1) * 0.1);
  const point = createPoint(coords);
  const target = Math.max(1, Math.floor(dimensions / 2));
  const edges = buildSyntheticPathway(dimensions);
  const start = 'n0';
  const goal = `n${Math.min(DEFAULT_PATHWAY_NODES, Math.max(8, dimensions)) - 1}`;

  let defects = 0;
  const t0 = nowMs();
  for (let i = 0; i < iterations; i += 1) {
    const projected = projectPoint(point, target);
    if (projected.coordinates.length !== target) defects += 1;
    const pathway = findPathway(edges, start, goal, 0.5, maxVisited);
    if (!pathway || pathway.path[0] !== start || pathway.path[pathway.path.length - 1] !== goal) {
      defects += 1;
    }
  }
  const elapsedMs = nowMs() - t0;
  const latencyMs = elapsedMs / iterations;
  const throughputOps = elapsedMs > 0 ? (iterations * 2) / (elapsedMs / 1000) : null;

  const quality: LeanSixSigmaCounters = {
    defects,
    latencyMs,
    throughputOps,
    // Pathway evidence coverage not measured end-to-end in this microbench.
    evidenceCoverage: 'WAITING',
    falseLinkRate: 'WAITING',
    reproducibility: 'WAITING',
  };

  return {
    dimensions,
    status: 'RUN',
    metrics: {
      latencyMs,
      throughputOps,
      memoryBytes: null,
      evidenceCoverage: null,
      falseLinkRate: null,
      reproducibility: null,
    },
    quality,
    backend: 'cpu',
    executedAt: new Date().toISOString(),
    notes:
      'local CPU-only microbench (projectPoint + findPathway); GPU/NPU/QPU unverified — no device receipt; research fabric only',
    iterations,
  };
}

/**
 * Execute ladder benchmarks on CPU. Marks results RUN with timings.
 * Stubs (createDimensionLadderBenchmarks) remain NOT_RUN until this harness runs.
 */
export function runDimensionBenchmarks(options?: {
  dimensions?: readonly LadderDimension[];
  iterations?: number;
  maxVisited?: number;
}): DimensionBenchmarkResult[] {
  const selected = options?.dimensions ?? DIMENSION_LADDER;
  return selected.map((dimensions) => {
    if (!DIMENSION_LADDER.includes(dimensions as LadderDimension)) {
      throw new RangeError(`unsupported ladder dimension: ${dimensions}`);
    }
    return runSingleDimensionBenchmark(dimensions as LadderDimension, {
      iterations: options?.iterations,
      maxVisited: options?.maxVisited,
    });
  });
}