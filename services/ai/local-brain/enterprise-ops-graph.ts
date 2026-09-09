import { evaluateKpi, type KpiObservation, type KpiResult } from './kpi-engine';
import type { OpsDepartment } from './enterprise-ops-types';

export type WorkflowNode = {
  id: string;
  department: OpsDepartment;
  title: string;
  duration: number;
  kpiKeys: string[];
  waitsFor: string[];
};

export type WorkflowEdge = {
  from: string;
  to: string;
};

export type WorkflowGraph = {
  id: string;
  tenantId: string;
  universeId: string;
  enterpriseId: string;
  needId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  productionEffect: false;
};

export type DeadlockResult = {
  deadlocked: boolean;
  cycles: string[][];
  waitForGraph: Record<string, string[]>;
};

export type BottleneckResult = {
  bottlenecks: Array<{
    nodeId: string;
    department: OpsDepartment;
    fanIn: number;
    onCriticalPath: boolean;
    duration: number;
  }>;
  criticalPath: string[];
  criticalPathDuration: number;
};

export type KpiWorkflowLink = {
  nodeId: string;
  kpiKey: string;
  kpi: KpiResult | null;
  state: KpiResult['state'] | 'UNKNOWN';
  productionEffect: false;
};

export function buildWorkflowGraph(input: {
  id: string;
  tenantId: string;
  universeId: string;
  enterpriseId: string;
  needId: string;
  nodes: WorkflowNode[];
}): WorkflowGraph {
  if (!input.tenantId || !input.universeId || !input.enterpriseId) {
    throw new Error('TENANT_UNIVERSE_ENTERPRISE_REQUIRED');
  }
  const ids = new Set(input.nodes.map((node) => node.id));
  if (ids.size !== input.nodes.length) throw new Error('DUPLICATE_WORKFLOW_NODE');
  const edges: WorkflowEdge[] = [];
  for (const node of input.nodes) {
    for (const pred of node.waitsFor) {
      if (!ids.has(pred)) throw new Error(`UNKNOWN_DEPENDENCY:${pred}`);
      edges.push({ from: pred, to: node.id });
    }
  }
  return {
    id: input.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    enterpriseId: input.enterpriseId,
    needId: input.needId,
    nodes: input.nodes.map((node) => ({ ...node, waitsFor: [...node.waitsFor], kpiKeys: [...node.kpiKeys] })),
    edges,
    productionEffect: false,
  };
}

export function waitForAdjacency(graph: WorkflowGraph): Record<string, string[]> {
  const adj: Record<string, string[]> = {};
  for (const node of graph.nodes) adj[node.id] = [];
  for (const edge of graph.edges) adj[edge.from].push(edge.to);
  return adj;
}

export function detectDependencies(graph: WorkflowGraph) {
  return {
    nodes: graph.nodes.length,
    edges: graph.edges.map((edge) => ({ ...edge })),
    adjacency: waitForAdjacency(graph),
    productionEffect: false as const,
  };
}

function tarjanCycles(adj: Record<string, string[]>): string[][] {
  const nodes = Object.keys(adj);
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  let i = 0;

  const strong = (v: string) => {
    index.set(v, i);
    low.set(v, i);
    i += 1;
    stack.push(v);
    onStack.add(v);
    for (const w of adj[v] ?? []) {
      if (!index.has(w)) {
        strong(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v)!, index.get(w)!));
      }
    }
    if (low.get(v) === index.get(v)) {
      const component: string[] = [];
      let w: string | undefined;
      do {
        w = stack.pop();
        if (!w) break;
        onStack.delete(w);
        component.push(w);
      } while (w !== v);
      const hasInternalEdge = component.length > 1
        || (component.length === 1 && (adj[component[0]] ?? []).includes(component[0]));
      if (hasInternalEdge) cycles.push(component.reverse());
    }
  };

  for (const node of nodes) {
    if (!index.has(node)) strong(node);
  }
  return cycles;
}

export function detectDeadlock(graph: WorkflowGraph): DeadlockResult {
  const waitForGraph = waitForAdjacency(graph);
  const cycles = tarjanCycles(waitForGraph);
  return {
    deadlocked: cycles.length > 0,
    cycles,
    waitForGraph,
  };
}

export function analyzeBottlenecks(graph: WorkflowGraph): BottleneckResult {
  const deadlock = detectDeadlock(graph);
  if (deadlock.deadlocked) {
    return { bottlenecks: [], criticalPath: [], criticalPathDuration: 0 };
  }
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const fanIn = new Map<string, number>();
  for (const node of graph.nodes) fanIn.set(node.id, 0);
  for (const edge of graph.edges) fanIn.set(edge.to, (fanIn.get(edge.to) ?? 0) + 1);

  const memo = new Map<string, { duration: number; path: string[] }>();
  const longest = (id: string): { duration: number; path: string[] } => {
    const cached = memo.get(id);
    if (cached) return cached;
    const node = byId.get(id);
    if (!node) return { duration: 0, path: [] };
    if (node.waitsFor.length === 0) {
      const result = { duration: node.duration, path: [id] };
      memo.set(id, result);
      return result;
    }
    let best = { duration: -1, path: [] as string[] };
    for (const pred of node.waitsFor) {
      const prior = longest(pred);
      if (prior.duration > best.duration) best = prior;
    }
    const result = { duration: best.duration + node.duration, path: [...best.path, id] };
    memo.set(id, result);
    return result;
  };

  let critical = { duration: 0, path: [] as string[] };
  for (const node of graph.nodes) {
    const candidate = longest(node.id);
    if (candidate.duration > critical.duration) critical = candidate;
  }
  const onPath = new Set(critical.path);
  const bottlenecks = graph.nodes
    .map((node) => ({
      nodeId: node.id,
      department: node.department,
      fanIn: fanIn.get(node.id) ?? 0,
      onCriticalPath: onPath.has(node.id),
      duration: node.duration,
    }))
    .filter((item) => item.onCriticalPath || item.fanIn >= 2)
    .sort((a, b) => b.fanIn - a.fanIn || b.duration - a.duration);

  return {
    bottlenecks,
    criticalPath: critical.path,
    criticalPathDuration: critical.duration,
  };
}

export function linkKpisToWorkflow(graph: WorkflowGraph, observations: KpiObservation[]): KpiWorkflowLink[] {
  const byMetric = new Map(observations.map((item) => [item.metric, evaluateKpi(item)]));
  const links: KpiWorkflowLink[] = [];
  for (const node of graph.nodes) {
    if (node.kpiKeys.length === 0) {
      links.push({ nodeId: node.id, kpiKey: '', kpi: null, state: 'UNKNOWN', productionEffect: false });
      continue;
    }
    for (const kpiKey of node.kpiKeys) {
      const kpi = byMetric.get(kpiKey) ?? null;
      links.push({
        nodeId: node.id,
        kpiKey,
        kpi,
        state: kpi?.state ?? 'UNKNOWN',
        productionEffect: false,
      });
    }
  }
  return links;
}
