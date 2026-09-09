/**
 * 62L-BQ Problem Decomposition Puzzle Engine —
 * detect bottlenecks, break hard problems into smaller pieces,
 * construct/disassemble constraint/puzzle graphs.
 * Successful solutions → candidate logical neural pathways (proposal only).
 * Decomposition is bounded — not infinite split.
 */

import { randomUUID } from 'node:crypto';

import {
  BQ_BOUNDS,
  BQ_LOCKS,
  PUZZLE_SPLIT_BOUNDED,
} from './polyglot-coding-civilization-types';

export type BottleneckKind =
  | 'compute'
  | 'memory'
  | 'io'
  | 'authority'
  | 'dependency'
  | 'ambiguity'
  | 'verification';

export type PuzzleNode = {
  id: string;
  label: string;
  depth: number;
  parentId: string | null;
  bottlenecks: BottleneckKind[];
  constraints: string[];
  status: 'open' | 'decomposed' | 'solved_candidate' | 'blocked';
  solutionEvidenceRefs: string[];
};

export type PuzzleGraph = {
  id: string;
  rootId: string;
  nodes: Map<string, PuzzleNode>;
  edges: Array<{ from: string; to: string; kind: 'decomposes_to' | 'constrains' | 'depends_on' }>;
  totalSubproblems: number;
  bounded: true;
};

export type DecomposeResult =
  | {
      accepted: true;
      graph: PuzzleGraphSnapshot;
      created: PuzzleNode[];
      reason: typeof PUZZLE_SPLIT_BOUNDED;
    }
  | {
      accepted: false;
      graph: PuzzleGraphSnapshot | null;
      reason: string;
      created: PuzzleNode[];
    };

export type PuzzleGraphSnapshot = {
  id: string;
  rootId: string;
  nodes: PuzzleNode[];
  edges: Array<{ from: string; to: string; kind: 'decomposes_to' | 'constrains' | 'depends_on' }>;
  totalSubproblems: number;
  bounded: true;
  maxSplitDepth: number;
  maxSubproblemsPerNode: number;
  maxTotalSubproblems: number;
};

const graphs = new Map<string, PuzzleGraph>();

export function resetPuzzleEngine() {
  graphs.clear();
}

function snapshot(graph: PuzzleGraph): PuzzleGraphSnapshot {
  return {
    id: graph.id,
    rootId: graph.rootId,
    nodes: [...graph.nodes.values()].map((n) => ({
      ...n,
      bottlenecks: [...n.bottlenecks],
      constraints: [...n.constraints],
      solutionEvidenceRefs: [...n.solutionEvidenceRefs],
    })),
    edges: graph.edges.map((e) => ({ ...e })),
    totalSubproblems: graph.totalSubproblems,
    bounded: true,
    maxSplitDepth: BQ_BOUNDS.MAX_PUZZLE_SPLIT_DEPTH,
    maxSubproblemsPerNode: BQ_BOUNDS.MAX_SUBPROBLEMS_PER_NODE,
    maxTotalSubproblems: BQ_BOUNDS.MAX_TOTAL_SUBPROBLEMS,
  };
}

export function detectBottlenecks(input: {
  description: string;
  signals?: Partial<Record<BottleneckKind, boolean>>;
}): BottleneckKind[] {
  const found: BottleneckKind[] = [];
  const text = input.description.toLowerCase();
  const signals = input.signals ?? {};
  const heuristics: Array<[BottleneckKind, RegExp]> = [
    ['compute', /cpu|compute|latency|slow|throughput/],
    ['memory', /memory|oom|heap|ram/],
    ['io', /\bio\b|disk|network|bandwidth/],
    ['authority', /permission|authority|sealed|deny|auth/],
    ['dependency', /depend|blocked.?by|waiting|upstream/],
    ['ambiguity', /unclear|ambiguous|unknown|underspec/],
    ['verification', /verify|test|evidence|proof/],
  ];
  for (const [kind, re] of heuristics) {
    if (signals[kind] === true || re.test(text)) found.push(kind);
  }
  if (found.length === 0) found.push('ambiguity');
  return found;
}

export function createPuzzleGraph(input: {
  label: string;
  description?: string;
  constraints?: string[];
}): PuzzleGraphSnapshot {
  const id = randomUUID();
  const rootId = randomUUID();
  const bottlenecks = detectBottlenecks({ description: input.description ?? input.label });
  const root: PuzzleNode = {
    id: rootId,
    label: input.label.trim(),
    depth: 0,
    parentId: null,
    bottlenecks,
    constraints: [...(input.constraints ?? [])],
    status: 'open',
    solutionEvidenceRefs: [],
  };
  const graph: PuzzleGraph = {
    id,
    rootId,
    nodes: new Map([[rootId, root]]),
    edges: [],
    totalSubproblems: 0,
    bounded: true,
  };
  graphs.set(id, graph);
  return snapshot(graph);
}

/**
 * Decompose a node into bounded subproblems. Refuses infinite / over-bound splits.
 */
export function decomposePuzzleNode(input: {
  graphId: string;
  nodeId: string;
  subproblemLabels: string[];
  constraints?: string[];
}): DecomposeResult {
  if (BQ_LOCKS.UNBOUNDED_PUZZLE_SPLIT) {
    return {
      accepted: false,
      graph: null,
      reason: 'LOCK_VIOLATION_UNBOUNDED_SPLIT',
      created: [],
    };
  }

  const graph = graphs.get(input.graphId);
  if (!graph) {
    return { accepted: false, graph: null, reason: 'GRAPH_NOT_FOUND', created: [] };
  }
  const node = graph.nodes.get(input.nodeId);
  if (!node) {
    return { accepted: false, graph: snapshot(graph), reason: 'NODE_NOT_FOUND', created: [] };
  }

  const nextDepth = node.depth + 1;
  if (nextDepth > BQ_BOUNDS.MAX_PUZZLE_SPLIT_DEPTH) {
    return {
      accepted: false,
      graph: snapshot(graph),
      reason: PUZZLE_SPLIT_BOUNDED,
      created: [],
    };
  }

  const labels = input.subproblemLabels.map((l) => l.trim()).filter(Boolean);
  if (labels.length === 0) {
    return {
      accepted: false,
      graph: snapshot(graph),
      reason: 'NO_SUBPROBLEMS_PROVIDED',
      created: [],
    };
  }
  if (labels.length > BQ_BOUNDS.MAX_SUBPROBLEMS_PER_NODE) {
    return {
      accepted: false,
      graph: snapshot(graph),
      reason: PUZZLE_SPLIT_BOUNDED,
      created: [],
    };
  }
  if (graph.totalSubproblems + labels.length > BQ_BOUNDS.MAX_TOTAL_SUBPROBLEMS) {
    return {
      accepted: false,
      graph: snapshot(graph),
      reason: PUZZLE_SPLIT_BOUNDED,
      created: [],
    };
  }

  const created: PuzzleNode[] = [];
  for (const label of labels) {
    const child: PuzzleNode = {
      id: randomUUID(),
      label,
      depth: nextDepth,
      parentId: node.id,
      bottlenecks: detectBottlenecks({ description: label }),
      constraints: [...(input.constraints ?? node.constraints)],
      status: 'open',
      solutionEvidenceRefs: [],
    };
    graph.nodes.set(child.id, child);
    graph.edges.push({ from: node.id, to: child.id, kind: 'decomposes_to' });
    created.push(child);
  }
  graph.totalSubproblems += created.length;
  node.status = 'decomposed';
  graphs.set(graph.id, graph);

  return {
    accepted: true,
    graph: snapshot(graph),
    created,
    reason: PUZZLE_SPLIT_BOUNDED,
  };
}

export function markPuzzleSolved(input: {
  graphId: string;
  nodeId: string;
  evidenceRefs: string[];
}): { ok: boolean; node: PuzzleNode | null; reason: string } {
  const graph = graphs.get(input.graphId);
  if (!graph) return { ok: false, node: null, reason: 'GRAPH_NOT_FOUND' };
  const node = graph.nodes.get(input.nodeId);
  if (!node) return { ok: false, node: null, reason: 'NODE_NOT_FOUND' };
  if (!input.evidenceRefs.length) {
    return { ok: false, node, reason: 'EVIDENCE_REQUIRED' };
  }
  node.status = 'solved_candidate';
  node.solutionEvidenceRefs = [...input.evidenceRefs];
  graphs.set(graph.id, graph);
  return { ok: true, node: { ...node }, reason: 'SOLVED_CANDIDATE_RECORDED' };
}

export function getPuzzleGraph(graphId: string) {
  const graph = graphs.get(graphId);
  return graph ? snapshot(graph) : null;
}

export function disassemblePuzzleGraph(graphId: string): boolean {
  return graphs.delete(graphId);
}

export function puzzleEngineHonesty() {
  return {
    locks: BQ_LOCKS,
    maxSplitDepth: BQ_BOUNDS.MAX_PUZZLE_SPLIT_DEPTH,
    maxSubproblemsPerNode: BQ_BOUNDS.MAX_SUBPROBLEMS_PER_NODE,
    maxTotalSubproblems: BQ_BOUNDS.MAX_TOTAL_SUBPROBLEMS,
    unboundedSplit: BQ_LOCKS.UNBOUNDED_PUZZLE_SPLIT,
    productionAuthorization: false as const,
  };
}
