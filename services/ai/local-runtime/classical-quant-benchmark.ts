/**
 * 62L-EM E — Classical Quant Benchmark Suite
 *
 * Classical quantitative baselines (routing / optimization microbench)
 * required before any quantum-inspired comparison.
 * No quantum advantage claims.
 */

import { EM_LOCKS } from './honesty';
import type { CapabilityState } from './types';

export type ClassicalBenchKind =
  | 'fifo_queue'
  | 'priority_queue'
  | 'greedy_assignment'
  | 'weighted_scoring'
  | 'shortest_path'
  | 'route_selection';

export type ClassicalBenchResult = {
  kind: ClassicalBenchKind;
  passed: boolean;
  metric: string;
  value: number;
  unit: string;
  state: CapabilityState | 'PASS' | 'FAIL';
  quantumComparisonAllowed: false;
  quantumAdvantageClaimed: false;
  reason: string;
  at: string;
};

export type ClassicalSuiteReport = {
  suite: 'classical_quant_benchmark';
  results: ClassicalBenchResult[];
  allPassed: boolean;
  quantumInspiredComparisonAllowed: boolean;
  quantumAdvantageClaimed: false;
  reason: string;
  locks: { QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE: false };
};

function now() {
  return new Date().toISOString();
}

/** FIFO microbench — enqueue/dequeue ordering integrity. */
export function benchFifoQueue(n = 500): ClassicalBenchResult {
  const start = performance.now();
  const q: number[] = [];
  for (let i = 0; i < n; i += 1) q.push(i);
  const out: number[] = [];
  while (q.length) out.push(q.shift()!);
  const durationMs = performance.now() - start;
  const ordered = out.every((v, i) => v === i);
  return {
    kind: 'fifo_queue',
    passed: ordered,
    metric: 'fifo_integrity_duration',
    value: Number(durationMs.toFixed(3)),
    unit: 'ms',
    state: ordered ? 'PASS' : 'FAIL',
    quantumComparisonAllowed: false,
    quantumAdvantageClaimed: false,
    reason: ordered ? 'FIFO classical baseline recorded.' : 'FIFO ordering failed.',
    at: now(),
  };
}

/** Priority queue microbench — higher priority dequeued first. */
export function benchPriorityQueue(): ClassicalBenchResult {
  const start = performance.now();
  const items = [
    { id: 'a', priority: 1 },
    { id: 'b', priority: 5 },
    { id: 'c', priority: 3 },
  ];
  items.sort((x, y) => y.priority - x.priority);
  const durationMs = performance.now() - start;
  const passed = items[0]?.id === 'b' && items[1]?.id === 'c' && items[2]?.id === 'a';
  return {
    kind: 'priority_queue',
    passed,
    metric: 'priority_order_check',
    value: Number(durationMs.toFixed(3)),
    unit: 'ms',
    state: passed ? 'PASS' : 'FAIL',
    quantumComparisonAllowed: false,
    quantumAdvantageClaimed: false,
    reason: passed ? 'Priority-queue classical baseline recorded.' : 'Priority ordering failed.',
    at: now(),
  };
}

/** Greedy assignment — assign each task to lowest-load worker. */
export function benchGreedyAssignment(): ClassicalBenchResult {
  const start = performance.now();
  const loads = [0, 0, 0];
  const tasks = [4, 2, 5, 1, 3];
  for (const t of tasks) {
    let best = 0;
    for (let i = 1; i < loads.length; i += 1) {
      if (loads[i]! < loads[best]!) best = i;
    }
    loads[best]! += t;
  }
  const durationMs = performance.now() - start;
  const sum = loads.reduce((a, b) => a + b, 0);
  const passed = sum === 15 && Math.max(...loads) - Math.min(...loads) <= 3;
  return {
    kind: 'greedy_assignment',
    passed,
    metric: 'greedy_load_balance_delta',
    value: Math.max(...loads) - Math.min(...loads),
    unit: 'load_delta',
    state: passed ? 'PASS' : 'FAIL',
    quantumComparisonAllowed: false,
    quantumAdvantageClaimed: false,
    reason: passed
      ? `Greedy assignment baseline recorded (${durationMs.toFixed(3)}ms).`
      : 'Greedy assignment baseline failed.',
    at: now(),
  };
}

/** Weighted scoring route selection. */
export function benchWeightedScoring(): ClassicalBenchResult {
  const start = performance.now();
  const candidates = [
    { id: 'cpu', score: 0.4 * 0.9 + 0.6 * 0.8 },
    { id: 'gpu', score: 0.4 * 0.5 + 0.6 * 0.2 }, // unverified accelerator penalized
    { id: 'cloud', score: 0.4 * 0.7 + 0.6 * 0.5 },
  ];
  candidates.sort((a, b) => b.score - a.score);
  const durationMs = performance.now() - start;
  const passed = candidates[0]?.id === 'cpu';
  return {
    kind: 'weighted_scoring',
    passed,
    metric: 'weighted_route_top',
    value: Number(durationMs.toFixed(3)),
    unit: 'ms',
    state: passed ? 'PASS' : 'FAIL',
    quantumComparisonAllowed: false,
    quantumAdvantageClaimed: false,
    reason: passed
      ? 'Weighted scoring prefers CPU when accelerators are unverified.'
      : 'Weighted scoring baseline failed.',
    at: now(),
  };
}

/** Tiny Dijkstra shortest-path microbench. */
export function benchShortestPath(): ClassicalBenchResult {
  const start = performance.now();
  // Graph: 0-1 (2), 0-2 (5), 1-2 (1), 1-3 (4), 2-3 (1)
  const edges: Array<[number, number, number]> = [
    [0, 1, 2],
    [0, 2, 5],
    [1, 2, 1],
    [1, 3, 4],
    [2, 3, 1],
  ];
  const n = 4;
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[0] = 0;
  const visited = new Set<number>();
  while (visited.size < n) {
    let u = -1;
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < n; i += 1) {
      if (!visited.has(i) && dist[i]! < best) {
        best = dist[i]!;
        u = i;
      }
    }
    if (u < 0) break;
    visited.add(u);
    for (const [a, b, w] of edges) {
      if (a === u && dist[u]! + w < dist[b]!) dist[b] = dist[u]! + w;
      if (b === u && dist[u]! + w < dist[a]!) dist[a] = dist[u]! + w;
    }
  }
  const durationMs = performance.now() - start;
  const passed = dist[3] === 4; // 0→1→2→3 = 2+1+1
  return {
    kind: 'shortest_path',
    passed,
    metric: 'shortest_path_cost',
    value: dist[3] ?? -1,
    unit: 'edge_weight',
    state: passed ? 'PASS' : 'FAIL',
    quantumComparisonAllowed: false,
    quantumAdvantageClaimed: false,
    reason: passed
      ? `Shortest-path classical baseline recorded (${durationMs.toFixed(3)}ms).`
      : 'Shortest-path baseline failed.',
    at: now(),
  };
}

/** Route selection integrity — CPU when accelerator not VERIFIED. */
export function benchRouteSelection(): ClassicalBenchResult {
  const start = performance.now();
  const acceleratorState: CapabilityState = 'DETECTED';
  const selected = acceleratorState === 'VERIFIED' ? 'gpu' : 'cpu';
  const durationMs = performance.now() - start;
  const passed = selected === 'cpu';
  return {
    kind: 'route_selection',
    passed,
    metric: 'safe_route_selection',
    value: Number(durationMs.toFixed(3)),
    unit: 'ms',
    state: passed ? 'PASS' : 'FAIL',
    quantumComparisonAllowed: false,
    quantumAdvantageClaimed: false,
    reason: passed
      ? 'Route selection classical baseline: CPU fallback when accelerator not VERIFIED.'
      : 'Route selection incorrectly chose unverified accelerator.',
    at: now(),
  };
}

/**
 * Run the classical suite. Quantum-inspired comparison is only *allowed as a candidate*
 * after all classical baselines pass — advantage is still never claimed here.
 */
export function runClassicalQuantBenchmarkSuite(): ClassicalSuiteReport {
  const results = [
    benchFifoQueue(),
    benchPriorityQueue(),
    benchGreedyAssignment(),
    benchWeightedScoring(),
    benchShortestPath(),
    benchRouteSelection(),
  ];
  const allPassed = results.every((r) => r.passed);
  return {
    suite: 'classical_quant_benchmark',
    results,
    allPassed,
    quantumInspiredComparisonAllowed:
      allPassed && EM_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE === false
        ? true
        : false,
    quantumAdvantageClaimed: false,
    reason: allPassed
      ? 'Classical baselines recorded. Quantum-inspired comparison may be considered later; quantum advantage is NOT claimed.'
      : 'Classical suite incomplete/failed — quantum-inspired comparison denied.',
    locks: {
      QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE:
        EM_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE,
    },
  };
}

/** Explicit denial helper for advantage claims. */
export function denyQuantumAdvantageClaim(suite: ClassicalSuiteReport): {
  allowed: false;
  reason: string;
} {
  return {
    allowed: false,
    reason: suite.allPassed
      ? 'Classical baselines exist but quantum advantage remains unclaimed (no physical QPU / no proven advantage).'
      : 'Quantum advantage denied — classical baselines required first.',
  };
}
