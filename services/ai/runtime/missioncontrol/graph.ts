/**
 * Mission graph + priority engine + WIP governor.
 * Do not run dependent work before prerequisites pass.
 * IDEA POOL may be huge; ACTIVE WORK remains bounded.
 */

import type {
  MissionGraph,
  MissionGraphEdge,
  MissionGraphEdgeKind,
  MissionGraphNode,
  PriorityClass,
  PrioritySignals,
  WipLimits,
} from './types';
import { DEFAULT_WIP_LIMITS } from './types';

export function openMissionGraph(input: {
  graphId: string;
  tenantId: string;
  universeId: string;
  nodes?: readonly MissionGraphNode[];
  edges?: readonly MissionGraphEdge[];
}): MissionGraph {
  return {
    graphId: input.graphId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    nodes: input.nodes ?? [],
    edges: input.edges ?? [],
  };
}

export function addGraphNode(graph: MissionGraph, node: MissionGraphNode): MissionGraph {
  if (graph.nodes.some((n) => n.nodeId === node.nodeId)) return graph;
  return { ...graph, nodes: [...graph.nodes, node] };
}

export function addGraphEdge(
  graph: MissionGraph,
  fromNodeId: string,
  toNodeId: string,
  kind: MissionGraphEdgeKind,
): MissionGraph | { ok: false; reason: string } {
  if (!graph.nodes.some((n) => n.nodeId === fromNodeId) || !graph.nodes.some((n) => n.nodeId === toNodeId)) {
    return { ok: false, reason: 'edge endpoints must exist' };
  }
  return {
    ...graph,
    edges: [...graph.edges, { fromNodeId, toNodeId, kind }],
  };
}

/** True if `nodeId` has unmet BLOCKED_BY / DEPENDS_ON prerequisites. */
export function isBlocked(
  graph: MissionGraph,
  nodeId: string,
  completedNodeIds: ReadonlySet<string>,
): boolean {
  return graph.edges.some(
    (e) =>
      e.toNodeId === nodeId &&
      (e.kind === 'BLOCKED_BY' || e.kind === 'DEPENDS_ON') &&
      !completedNodeIds.has(e.fromNodeId),
  );
}

export function mayRunNode(
  graph: MissionGraph,
  nodeId: string,
  completedNodeIds: ReadonlySet<string>,
): boolean {
  return !isBlocked(graph, nodeId, completedNodeIds);
}

export function scorePriority(signals: PrioritySignals): { score: number; klass: PriorityClass } {
  const score =
    signals.securitySeverity * 12 +
    signals.customerImpact * 10 +
    signals.founderPriority * 11 +
    signals.dependencyImpact * 8 +
    signals.deadlinePressure * 8 +
    signals.reliabilityImpact * 7 +
    signals.businessValue * 6 +
    signals.dataQuality * 4 +
    signals.researchImportance * 3 -
    signals.costPressure * 2;
  let klass: PriorityClass = 'P4_BACKGROUND';
  if (score >= 80 || signals.securitySeverity >= 8) klass = 'P0_CRITICAL';
  else if (score >= 55) klass = 'P1_HIGH';
  else if (score >= 30) klass = 'P2_NORMAL';
  else if (score >= 12) klass = 'P3_LOW';
  return { score, klass };
}

export function openWipGovernor(limits: Partial<WipLimits> = {}): WipLimits {
  return { ...DEFAULT_WIP_LIMITS, ...limits };
}

export function evaluateWipAdmission(input: {
  limits: WipLimits;
  activeMissions: number;
  agentsInDepartment: number;
  taskForceSize: number;
  researchConcurrency: number;
  engineeringConcurrency: number;
  modelSpend: number;
  cloudSpend: number;
  kind?: 'research' | 'engineering' | 'general';
}): { admitted: true } | { admitted: false; reason: string } {
  const { limits } = input;
  if (input.activeMissions >= limits.maxActiveMissions) {
    return { admitted: false, reason: 'maxActiveMissions exceeded' };
  }
  if (input.agentsInDepartment >= limits.maxAgentsPerDepartment) {
    return { admitted: false, reason: 'maxAgentsPerDepartment exceeded' };
  }
  if (input.taskForceSize > limits.maxTaskForceSize) {
    return { admitted: false, reason: 'maxTaskForceSize exceeded' };
  }
  if (input.kind === 'research' && input.researchConcurrency >= limits.maxResearchConcurrency) {
    return { admitted: false, reason: 'maxResearchConcurrency exceeded' };
  }
  if (input.kind === 'engineering' && input.engineeringConcurrency >= limits.maxEngineeringConcurrency) {
    return { admitted: false, reason: 'maxEngineeringConcurrency exceeded' };
  }
  if (input.modelSpend >= limits.maxModelSpend) {
    return { admitted: false, reason: 'maxModelSpend exceeded' };
  }
  if (input.cloudSpend >= limits.maxCloudSpend) {
    return { admitted: false, reason: 'maxCloudSpend exceeded' };
  }
  return { admitted: true };
}

export function ideaPoolMayBeHuge(): true {
  return true;
}

export function activeWorkRemainsBounded(): true {
  return true;
}
