import { evaluateQuantSignals } from './quant-logic';
import { ALGORITHM_NO_INVENTED_OPTIMALITY, type EpistemicClass } from './universal-runtime-types';

export type AlgorithmFamily =
  | 'graph'
  | 'constrained_routing'
  | 'network_flow'
  | 'scheduling'
  | 'inventory'
  | 'lp'
  | 'milp'
  | 'statistics'
  | 'probability'
  | 'anomaly_detection'
  | 'forecasting'
  | 'ranking'
  | 'compression'
  | 'deduplication';

export type AlgorithmSelection = {
  family: AlgorithmFamily;
  algorithm: string;
  baseline: string;
  exactForProblemClass: boolean;
  exactClass: string | null;
  optimalClaimed: false;
  inventedOptimality: false;
  epistemicClass: EpistemicClass;
  notes: string[];
};

export type WeightedEdge = { from: string; to: string; weight: number };
export type FlowEdge = { from: number; to: number; capacity: number };

export type AlgorithmResult<T> = AlgorithmSelection & {
  value: T;
  state: 'PASS' | 'UNAVAILABLE' | 'DENIED';
};

const HONESTY_NOTES = [
  ALGORITHM_NO_INVENTED_OPTIMALITY,
  'Classical baseline only. Do not treat a selected method as globally optimal unless a named problem class is proven exact.',
];

function selection(
  family: AlgorithmFamily,
  algorithm: string,
  baseline: string,
  exact: { exactForProblemClass: boolean; exactClass: string | null },
  epistemicClass: EpistemicClass,
  extraNotes: string[] = [],
): AlgorithmSelection {
  return {
    family,
    algorithm,
    baseline,
    exactForProblemClass: exact.exactForProblemClass,
    exactClass: exact.exactClass,
    optimalClaimed: false,
    inventedOptimality: false,
    epistemicClass,
    notes: [...HONESTY_NOTES, ...extraNotes],
  };
}

export const ALGORITHM_CATALOG: Record<AlgorithmFamily, AlgorithmSelection> = {
  graph: selection('graph', 'dijkstra_nonnegative', 'dijkstra_1959', { exactForProblemClass: true, exactClass: 'nonnegative_weighted_shortest_path' }, 'VERIFIED_FACT', ['Exact for nonnegative edge weights. Negative cycles are out of class.']),
  constrained_routing: selection('constrained_routing', 'constrained_dijkstra_feasible_subgraph', 'dijkstra_on_feasible_edges', { exactForProblemClass: true, exactClass: 'shortest_path_on_feasible_nonnegative_subgraph' }, 'VERIFIED_FACT', ['Exact on the remaining feasible subgraph. Not a claim of optimality for arbitrary side constraints.']),
  network_flow: selection('network_flow', 'edmonds_karp', 'edmonds_karp_1972', { exactForProblemClass: true, exactClass: 'integral_max_flow' }, 'VERIFIED_FACT', ['Exact max-flow for finite directed graphs with nonnegative integer capacities.']),
  scheduling: selection('scheduling', 'list_scheduling', 'graham_list_scheduling', { exactForProblemClass: false, exactClass: null }, 'HYPOTHESIS', ['Heuristic. Makespan is not claimed optimal.']),
  inventory: selection('inventory', 'eoq', 'harris_wilson_eoq', { exactForProblemClass: true, exactClass: 'deterministic_eoq_with_constant_demand' }, 'HYPOTHESIS', ['Exact for the classical EOQ assumptions. Not multi-echelon stochastic optimality.']),
  lp: selection('lp', 'two_variable_vertex_enumeration', 'graphical_lp', { exactForProblemClass: true, exactClass: 'two_variable_linear_program_enumerated_vertices' }, 'VERIFIED_FACT', ['Exact for 2-variable LPs with enumerated vertices. General LP solver is UNAVAILABLE.']),
  milp: selection('milp', 'zero_one_knapsack_dp', 'knapsack_dp', { exactForProblemClass: true, exactClass: 'zero_one_knapsack' }, 'VERIFIED_FACT', ['Exact for 0-1 knapsack DP. General MILP solver is UNAVAILABLE.']),
  statistics: selection('statistics', 'sample_moments', 'classical_sample_moments', { exactForProblemClass: true, exactClass: 'finite_sample_mean_variance' }, 'VERIFIED_FACT'),
  probability: selection('probability', 'independent_product', 'classical_independent_events', { exactForProblemClass: true, exactClass: 'independent_event_product' }, 'HYPOTHESIS'),
  anomaly_detection: selection('anomaly_detection', 'zscore_threshold', 'three_sigma_zscore', { exactForProblemClass: false, exactClass: null }, 'HYPOTHESIS', ['Classical z-score flag. Not a claim of optimal detection.']),
  forecasting: selection('forecasting', 'simple_moving_average', 'sma', { exactForProblemClass: false, exactClass: null }, 'FORECAST', ['FORECAST is not a verified fact.']),
  ranking: selection('ranking', 'linear_score_sort', 'weighted_linear_score', { exactForProblemClass: false, exactClass: null }, 'HYPOTHESIS', ['Ranking by declared score. Not claimed NDCG-optimal.']),
  compression: selection('compression', 'run_length_encoding', 'rle', { exactForProblemClass: false, exactClass: null }, 'VERIFIED_FACT', ['RLE is a classical baseline. Not claimed entropy-optimal.']),
  deduplication: selection('deduplication', 'sha256_exact', 'cryptographic_hash_exact_match', { exactForProblemClass: true, exactClass: 'exact_byte_duplicate' }, 'VERIFIED_FACT', ['Exact-match dedup only. Fuzzy/near-duplicate is out of class.']),
};

export function selectAlgorithm(family: AlgorithmFamily): AlgorithmSelection {
  return { ...ALGORITHM_CATALOG[family], notes: [...ALGORITHM_CATALOG[family].notes] };
}

export function shortestPath(graph: WeightedEdge[], source: string, target: string): AlgorithmResult<{
  path: string[];
  distance: number | null;
  reachable: boolean;
}> {
  const spec = selectAlgorithm('graph');
  const nodes = new Set<string>();
  const adj = new Map<string, Array<{ to: string; weight: number }>>();
  for (const edge of graph) {
    if (edge.weight < 0) {
      return {
        ...spec,
        state: 'DENIED',
        value: { path: [], distance: null, reachable: false },
        notes: [...spec.notes, 'Negative weights are outside Dijkstra class. Not invented as optimal.'],
      };
    }
    nodes.add(edge.from);
    nodes.add(edge.to);
    const list = adj.get(edge.from) ?? [];
    list.push({ to: edge.to, weight: edge.weight });
    adj.set(edge.from, list);
  }
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  for (const node of nodes) dist.set(node, Number.POSITIVE_INFINITY);
  dist.set(source, 0);
  const pending = new Set(nodes);
  if (!pending.has(source)) {
    return { ...spec, state: 'UNAVAILABLE', value: { path: [], distance: null, reachable: false }, notes: [...spec.notes, 'Source not in graph.'] };
  }
  while (pending.size) {
    let best: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const node of pending) {
      const d = dist.get(node) ?? Number.POSITIVE_INFINITY;
      if (d < bestDist) {
        best = node;
        bestDist = d;
      }
    }
    if (best === null || !Number.isFinite(bestDist)) break;
    pending.delete(best);
    for (const edge of adj.get(best) ?? []) {
      const next = bestDist + edge.weight;
      if (next < (dist.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        dist.set(edge.to, next);
        prev.set(edge.to, best);
      }
    }
  }
  const distance = dist.get(target);
  if (distance === undefined || !Number.isFinite(distance)) {
    return { ...spec, state: 'PASS', value: { path: [], distance: null, reachable: false } };
  }
  const path = [target];
  while (path[0] !== source) {
    const parent = prev.get(path[0]);
    if (!parent) break;
    path.unshift(parent);
  }
  return { ...spec, state: 'PASS', value: { path, distance, reachable: path[0] === source } };
}

export function constrainedRoute(
  graph: WeightedEdge[],
  source: string,
  target: string,
  forbidden: string[] = [],
  maxWeight = Number.POSITIVE_INFINITY,
): AlgorithmResult<{ path: string[]; distance: number | null; reachable: boolean }> {
  const spec = selectAlgorithm('constrained_routing');
  const blocked = new Set(forbidden);
  const feasible = graph.filter((edge) => !blocked.has(edge.from) && !blocked.has(edge.to) && edge.weight <= maxWeight);
  const inner = shortestPath(feasible, source, target);
  return {
    ...spec,
    state: inner.state === 'DENIED' ? 'DENIED' : 'PASS',
    value: inner.value,
  };
}

export function edmondsKarp(n: number, edges: FlowEdge[], source: number, sink: number): AlgorithmResult<{ flow: number }> {
  const spec = selectAlgorithm('network_flow');
  if (n < 2 || source < 0 || sink >= n || source === sink) {
    return { ...spec, state: 'UNAVAILABLE', value: { flow: 0 }, notes: [...spec.notes, 'Invalid terminals.'] };
  }
  const capacity: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (const edge of edges) {
    if (edge.capacity < 0) {
      return { ...spec, state: 'DENIED', value: { flow: 0 }, notes: [...spec.notes, 'Negative capacity is outside the integral max-flow class.'] };
    }
    capacity[edge.from][edge.to] += edge.capacity;
  }
  const residual = capacity.map((row) => [...row]);
  let flow = 0;
  const bfs = () => {
    const parent = Array(n).fill(-1);
    parent[source] = source;
    const queue = [source];
    for (let i = 0; i < queue.length; i += 1) {
      const u = queue[i];
      for (let v = 0; v < n; v += 1) {
        if (parent[v] === -1 && residual[u][v] > 0) {
          parent[v] = u;
          queue.push(v);
        }
      }
    }
    return parent;
  };
  for (;;) {
    const parent = bfs();
    if (parent[sink] === -1) break;
    let increment = Number.POSITIVE_INFINITY;
    for (let v = sink; v !== source; v = parent[v]) increment = Math.min(increment, residual[parent[v]][v]);
    for (let v = sink; v !== source; v = parent[v]) {
      const u = parent[v];
      residual[u][v] -= increment;
      residual[v][u] += increment;
    }
    flow += increment;
  }
  return { ...spec, state: 'PASS', value: { flow } };
}

export function listSchedule(jobs: Array<{ id: string; duration: number }>, machines: number): AlgorithmResult<{
  makespan: number;
  assignment: Array<{ id: string; machine: number; start: number; end: number }>;
}> {
  const spec = selectAlgorithm('scheduling');
  if (machines < 1 || jobs.some((job) => job.duration < 0)) {
    return { ...spec, state: 'UNAVAILABLE', value: { makespan: 0, assignment: [] } };
  }
  const load = Array.from({ length: machines }, () => 0);
  const assignment: Array<{ id: string; machine: number; start: number; end: number }> = [];
  for (const job of jobs) {
    let machine = 0;
    for (let i = 1; i < machines; i += 1) if (load[i] < load[machine]) machine = i;
    const start = load[machine];
    const end = start + job.duration;
    load[machine] = end;
    assignment.push({ id: job.id, machine, start, end });
  }
  return { ...spec, state: 'PASS', value: { makespan: Math.max(0, ...load), assignment } };
}

export function economicOrderQuantity(demand: number, setupCost: number, holdingCost: number): AlgorithmResult<{
  q: number | null;
}> {
  const spec = selectAlgorithm('inventory');
  if (!(demand > 0 && setupCost > 0 && holdingCost > 0)) {
    return { ...spec, state: 'UNAVAILABLE', value: { q: null }, notes: [...spec.notes, 'EOQ requires positive demand, setup, and holding cost.'] };
  }
  return { ...spec, state: 'PASS', value: { q: Math.sqrt((2 * demand * setupCost) / holdingCost) } };
}

export function solveTwoVariableLp(input: {
  c: [number, number];
  constraints: Array<{ a: [number, number]; b: number }>;
}): AlgorithmResult<{ x: number; y: number; objective: number } | null> {
  const spec = selectAlgorithm('lp');
  const vertices: Array<[number, number]> = [[0, 0]];
  const feasible = (x: number, y: number) =>
    x >= -1e-9 && y >= -1e-9 && input.constraints.every((row) => input.c && row.a[0] * x + row.a[1] * y <= row.b + 1e-9);

  for (const row of input.constraints) {
    if (row.a[1] !== 0) vertices.push([0, row.b / row.a[1]]);
    if (row.a[0] !== 0) vertices.push([row.b / row.a[0], 0]);
  }
  for (let i = 0; i < input.constraints.length; i += 1) {
    for (let j = i + 1; j < input.constraints.length; j += 1) {
      const [a1, b1] = [input.constraints[i].a, input.constraints[i].b];
      const [a2, b2] = [input.constraints[j].a, input.constraints[j].b];
      const det = a1[0] * a2[1] - a1[1] * a2[0];
      if (Math.abs(det) < 1e-12) continue;
      const x = (b1 * a2[1] - b2 * a1[1]) / det;
      const y = (a1[0] * b2 - a2[0] * b1) / det;
      vertices.push([x, y]);
    }
  }

  let best: { x: number; y: number; objective: number } | null = null;
  for (const [x, y] of vertices) {
    if (!feasible(x, y)) continue;
    const objective = input.c[0] * x + input.c[1] * y;
    if (!best || objective > best.objective + 1e-12) best = { x, y, objective };
  }
  return { ...spec, state: best ? 'PASS' : 'UNAVAILABLE', value: best };
}

export function generalLpUnavailable(variableCount: number): AlgorithmResult<null> {
  const spec = selectAlgorithm('lp');
  if (variableCount <= 2) {
    return { ...spec, state: 'UNAVAILABLE', value: null, notes: [...spec.notes, 'Call solveTwoVariableLp for the 2-variable class.'] };
  }
  return {
    ...spec,
    exactForProblemClass: false,
    exactClass: null,
    state: 'UNAVAILABLE',
    value: null,
    notes: [...spec.notes, 'General LP/MILP solver is UNAVAILABLE. No invented optimality.'],
  };
}

export function knapsack01(items: Array<{ id: string; value: number; weight: number }>, capacity: number): AlgorithmResult<{
  value: number;
  picked: string[];
}> {
  const spec = selectAlgorithm('milp');
  if (capacity < 0 || items.some((item) => item.weight < 0 || item.value < 0 || !Number.isInteger(item.weight))) {
    return { ...spec, state: 'UNAVAILABLE', value: { value: 0, picked: [] }, notes: [...spec.notes, 'Knapsack DP requires nonnegative integer weights.'] };
  }
  const cap = Math.floor(capacity);
  const dp = Array.from({ length: items.length + 1 }, () => Array(cap + 1).fill(0));
  for (let i = 1; i <= items.length; i += 1) {
    for (let w = 0; w <= cap; w += 1) {
      dp[i][w] = dp[i - 1][w];
      if (items[i - 1].weight <= w) dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - items[i - 1].weight] + items[i - 1].value);
    }
  }
  const picked: string[] = [];
  let w = cap;
  for (let i = items.length; i >= 1; i -= 1) {
    if (dp[i][w] !== dp[i - 1][w]) {
      picked.push(items[i - 1].id);
      w -= items[i - 1].weight;
    }
  }
  return { ...spec, state: 'PASS', value: { value: dp[items.length][cap], picked: picked.reverse() } };
}

export function generalMilpUnavailable(): AlgorithmResult<null> {
  const spec = selectAlgorithm('milp');
  return {
    ...spec,
    exactForProblemClass: false,
    exactClass: null,
    state: 'UNAVAILABLE',
    value: null,
    notes: [...spec.notes, 'General MILP solver is UNAVAILABLE. Knapsack DP is the exact subclass offered.'],
  };
}

export function sampleMoments(values: number[]): AlgorithmResult<{ n: number; mean: number; variance: number; stdev: number }> {
  const spec = selectAlgorithm('statistics');
  if (!values.length) return { ...spec, state: 'UNAVAILABLE', value: { n: 0, mean: 0, variance: 0, stdev: 0 } };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return { ...spec, state: 'PASS', value: { n: values.length, mean, variance, stdev: Math.sqrt(variance) } };
}

export function independentProbability(events: number[]): AlgorithmResult<{ probability: number }> {
  const spec = selectAlgorithm('probability');
  if (events.some((p) => p < 0 || p > 1)) {
    return { ...spec, state: 'DENIED', value: { probability: 0 }, notes: [...spec.notes, 'Probabilities must be in [0,1].'] };
  }
  const quant = evaluateQuantSignals(events.map((p, i) => ({
    id: `p${i}`,
    weight: 1,
    confidence: p,
    direction: 1 as const,
    evidenceRefs: ['classical_independent_product'],
  })));
  const probability = events.reduce((prod, p) => prod * p, 1);
  return {
    ...spec,
    state: 'PASS',
    value: { probability },
    notes: [...spec.notes, `Quant fabric reused as bounded confidence mass=${quant.confidence}. Product assumes independence.`],
  };
}

export function detectAnomalies(values: number[], threshold = 3): AlgorithmResult<{ flags: boolean[]; z: number[] }> {
  const spec = selectAlgorithm('anomaly_detection');
  const moments = sampleMoments(values);
  if (moments.state !== 'PASS' || moments.value.stdev === 0) {
    return { ...spec, state: 'UNAVAILABLE', value: { flags: [], z: [] } };
  }
  const z = values.map((value) => (value - moments.value.mean) / moments.value.stdev);
  return { ...spec, state: 'PASS', value: { z, flags: z.map((item) => Math.abs(item) > threshold) } };
}

export function movingAverageForecast(values: number[], window: number): AlgorithmResult<{ forecast: number | null }> {
  const spec = selectAlgorithm('forecasting');
  if (window < 1 || values.length < window) {
    return { ...spec, state: 'UNAVAILABLE', value: { forecast: null } };
  }
  const slice = values.slice(-window);
  return { ...spec, state: 'PASS', value: { forecast: slice.reduce((sum, value) => sum + value, 0) / window } };
}

export function rankByLinearScore(items: Array<{ id: string; features: number[] }>, weights: number[]): AlgorithmResult<{
  order: string[];
}> {
  const spec = selectAlgorithm('ranking');
  if (!items.length || weights.some((w) => !Number.isFinite(w))) {
    return { ...spec, state: 'UNAVAILABLE', value: { order: [] } };
  }
  const scored = items.map((item) => ({
    id: item.id,
    score: weights.reduce((sum, weight, i) => sum + weight * (item.features[i] ?? 0), 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  return { ...spec, state: 'PASS', value: { order: scored.map((item) => item.id) } };
}

export function runLengthEncode(input: string): AlgorithmResult<{ encoded: string; lossless: true }> {
  const spec = selectAlgorithm('compression');
  let encoded = '';
  for (let i = 0; i < input.length; ) {
    let j = i + 1;
    while (j < input.length && input[j] === input[i]) j += 1;
    encoded += `${j - i}${input[i]}`;
    i = j;
  }
  return { ...spec, state: 'PASS', value: { encoded, lossless: true } };
}

export async function deduplicateBytes(parts: string[]): Promise<AlgorithmResult<{ unique: string[]; dropped: number }>> {
  const spec = selectAlgorithm('deduplication');
  const { createHash } = await import('node:crypto');
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const digest = createHash('sha256').update(part).digest('hex');
    if (seen.has(digest)) continue;
    seen.add(digest);
    unique.push(part);
  }
  return { ...spec, state: 'PASS', value: { unique, dropped: parts.length - unique.length } };
}

export function algorithmHonestyLocks(selection: AlgorithmSelection) {
  return {
    inventedOptimality: selection.inventedOptimality,
    optimalClaimed: selection.optimalClaimed,
    exactForProblemClass: selection.exactForProblemClass,
    reason: ALGORITHM_NO_INVENTED_OPTIMALITY,
  };
}
