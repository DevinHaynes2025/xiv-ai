/**
 * 62L-EX12 — Quantum Pathway Graph store.
 * Software knowledge/decision graph — not biological consciousness.
 * Soft-wires EX1–EX11; does not duplicate Agent Mesh / Evidence Ledger /
 * Benchmark / Guardian / identity / tenant-Universe policy.
 */

import { createHash } from 'node:crypto';

import {
  EX12_LOCKS,
  type AccessQuery,
  type GraphScaleBand,
  type GraphScaleReport,
  type PathwayDenial,
  type PathwayEdge,
  type PathwayEdgeType,
  type PathwayNode,
  type PathwayNodeType,
  type QuantumTruthLabel,
  type SoftwareWormholeChecks,
  type TenantScope,
} from './pathway-types.ts';
import { edgeSatisfiesVerifiedRoute } from './pathway-weight.ts';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function computeEdgeIntegrityHash(
  edge: Omit<PathwayEdge, 'integrityHash'>,
): string {
  const payload = JSON.stringify({
    edgeId: edge.edgeId,
    source: edge.source,
    target: edge.target,
    edgeType: edge.edgeType,
    tenantId: edge.tenantId,
    universeId: edge.universeId,
    evidenceState: edge.evidenceState,
    version: edge.version,
    weight: edge.weight,
    evidenceRefs: edge.evidenceRefs,
  });
  return sha256(payload);
}

export type PathwayGraph = {
  tenantId: string;
  universeId: string;
  nodes: Map<string, PathwayNode>;
  edges: Map<string, PathwayEdge>;
  createdAt: string;
};

export function createPathwayGraph(scope: TenantScope, nowIso: string): PathwayGraph {
  return {
    tenantId: scope.tenantId,
    universeId: scope.universeId,
    nodes: new Map(),
    edges: new Map(),
    createdAt: nowIso,
  };
}

function assertScope(
  graph: PathwayGraph,
  query: AccessQuery,
): PathwayDenial | null {
  if (EX12_LOCKS.CROSS_TENANT_GRAPH_ACCESS) {
    return { ok: false, denied: true, reason: 'LOCK_VIOLATION' };
  }
  if (query.tenantId !== graph.tenantId) {
    return { ok: false, denied: true, reason: 'CROSS_TENANT_DENIED' };
  }
  if (EX12_LOCKS.CROSS_UNIVERSE_GRAPH_ACCESS) {
    return { ok: false, denied: true, reason: 'LOCK_VIOLATION' };
  }
  if (query.universeId !== graph.universeId) {
    return { ok: false, denied: true, reason: 'CROSS_UNIVERSE_DENIED' };
  }
  if (query.guardianActive === false) {
    return { ok: false, denied: true, reason: 'GUARDIAN_REQUIRED' };
  }
  return null;
}

export function upsertNode(
  graph: PathwayGraph,
  node: PathwayNode,
  query: AccessQuery,
): PathwayNode | PathwayDenial {
  const denied = assertScope(graph, query);
  if (denied) return denied;
  if (node.tenantId !== graph.tenantId) {
    return { ok: false, denied: true, reason: 'CROSS_TENANT_DENIED' };
  }
  if (node.universeId !== graph.universeId) {
    return { ok: false, denied: true, reason: 'CROSS_UNIVERSE_DENIED' };
  }
  graph.nodes.set(node.nodeId, node);
  return node;
}

export function upsertEdge(
  graph: PathwayGraph,
  edgeInput: Omit<PathwayEdge, 'integrityHash'>,
  query: AccessQuery,
): PathwayEdge | PathwayDenial {
  const denied = assertScope(graph, query);
  if (denied) return denied;
  if (edgeInput.tenantId !== graph.tenantId) {
    return { ok: false, denied: true, reason: 'CROSS_TENANT_DENIED' };
  }
  if (edgeInput.universeId !== graph.universeId) {
    return { ok: false, denied: true, reason: 'CROSS_UNIVERSE_DENIED' };
  }
  if (!graph.nodes.has(edgeInput.source) || !graph.nodes.has(edgeInput.target)) {
    return { ok: false, denied: true, reason: 'MISSING_ENDPOINT_NODE' };
  }
  const integrityHash = computeEdgeIntegrityHash(edgeInput);
  const edge: PathwayEdge = { ...edgeInput, integrityHash };
  graph.edges.set(edge.edgeId, edge);
  return edge;
}

export function createNode(input: {
  nodeId: string;
  nodeType: PathwayNodeType;
  label: string;
  tenantId: string;
  universeId: string;
  quantumTruthLabel: QuantumTruthLabel;
  evidenceState?: PathwayNode['evidenceState'];
  nowIso: string;
  evidenceRefs?: readonly string[];
  metadata?: PathwayNode['metadata'];
}): PathwayNode {
  return {
    nodeId: input.nodeId,
    nodeType: input.nodeType,
    label: input.label,
    tenantId: input.tenantId,
    universeId: input.universeId,
    quantumTruthLabel: input.quantumTruthLabel,
    evidenceState: input.evidenceState ?? 'HYPOTHESIS',
    confidence: 0,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    createdAt: input.nowIso,
    lastObservedAt: input.nowIso,
    lastVerifiedAt: null,
    freshnessState: 'UNKNOWN',
    metadata: { ...(input.metadata ?? {}) },
  };
}

export function createEdgeDraft(input: {
  edgeId: string;
  source: string;
  target: string;
  edgeType: PathwayEdgeType;
  tenantId: string;
  universeId: string;
  evidenceState?: PathwayEdge['evidenceState'];
  quantumTruthLabel: QuantumTruthLabel;
  nowIso: string;
  weight?: number;
  weightReason?: string;
  evidenceRefs?: readonly string[];
  benchmarkRefs?: readonly string[];
  comparisonRefs?: readonly string[];
  sourceClass?: PathwayEdge['sourceClass'];
  rightsClass?: PathwayEdge['rightsClass'];
  preferred?: boolean;
  localPromotion?: PathwayEdge['localPromotion'];
  expiresAt?: string | null;
  revoked?: boolean;
  version?: string;
}): Omit<PathwayEdge, 'integrityHash'> {
  return {
    edgeId: input.edgeId,
    source: input.source,
    target: input.target,
    edgeType: input.edgeType,
    tenantId: input.tenantId,
    universeId: input.universeId,
    evidenceState: input.evidenceState ?? 'HYPOTHESIS',
    confidence: 0,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    benchmarkRefs: [...(input.benchmarkRefs ?? [])],
    comparisonRefs: [...(input.comparisonRefs ?? [])],
    sourceClass: input.sourceClass ?? 'LAB',
    rightsClass: input.rightsClass ?? 'XIV_OWNED',
    createdAt: input.nowIso,
    lastObservedAt: input.nowIso,
    lastVerifiedAt: null,
    freshnessState: 'UNKNOWN',
    weight: input.weight ?? 0.5,
    weightReason: input.weightReason ?? 'initial',
    version: input.version ?? '1',
    quantumTruthLabel: input.quantumTruthLabel,
    preferred: input.preferred ?? false,
    localPromotion: input.localPromotion ?? null,
    expiresAt: input.expiresAt ?? null,
    revoked: input.revoked ?? false,
  };
}

/** Failed experiment → FAILED_ON edge (preserved). */
export function recordFailedOnEdge(
  graph: PathwayGraph,
  input: {
    edgeId: string;
    source: string;
    target: string;
    nowIso: string;
    evidenceRefs?: readonly string[];
    quantumTruthLabel: QuantumTruthLabel;
  },
  query: AccessQuery,
): PathwayEdge | PathwayDenial {
  return upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: input.edgeId,
      source: input.source,
      target: input.target,
      edgeType: 'FAILED_ON',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      evidenceState: 'DOCUMENTED',
      quantumTruthLabel: input.quantumTruthLabel,
      nowIso: input.nowIso,
      evidenceRefs: input.evidenceRefs,
      weight: 0.2,
      weightReason: 'failed_experiment',
    }),
    query,
  );
}

/** Contradiction edge — preserved, never deleted to hide conflict. */
export function recordContradictionEdge(
  graph: PathwayGraph,
  input: {
    edgeId: string;
    source: string;
    target: string;
    nowIso: string;
    evidenceRefs?: readonly string[];
  },
  query: AccessQuery,
): PathwayEdge | PathwayDenial {
  return upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: input.edgeId,
      source: input.source,
      target: input.target,
      edgeType: 'CONTRADICTS',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      evidenceState: 'CONTRADICTED',
      quantumTruthLabel: 'NOT_TESTED',
      nowIso: input.nowIso,
      evidenceRefs: input.evidenceRefs,
      weight: 0.1,
      weightReason: 'contradiction_preserved',
    }),
    query,
  );
}

export function replaceEdge(
  graph: PathwayGraph,
  edge: PathwayEdge,
  query: AccessQuery,
): PathwayEdge | PathwayDenial {
  const denied = assertScope(graph, query);
  if (denied) return denied;
  if (edge.tenantId !== graph.tenantId) {
    return { ok: false, denied: true, reason: 'CROSS_TENANT_DENIED' };
  }
  if (edge.universeId !== graph.universeId) {
    return { ok: false, denied: true, reason: 'CROSS_UNIVERSE_DENIED' };
  }
  const integrityHash = computeEdgeIntegrityHash(edge);
  const next = { ...edge, integrityHash };
  graph.edges.set(next.edgeId, next);
  return next;
}

export function getEdge(graph: PathwayGraph, edgeId: string): PathwayEdge | undefined {
  return graph.edges.get(edgeId);
}

export function getNode(graph: PathwayGraph, nodeId: string): PathwayNode | undefined {
  return graph.nodes.get(nodeId);
}

export function listVerifiedRouteEdges(
  graph: PathwayGraph,
  query: AccessQuery,
  nowIso: string,
): PathwayEdge[] | PathwayDenial {
  const denied = assertScope(graph, query);
  if (denied) return denied;
  return [...graph.edges.values()].filter((e) => edgeSatisfiesVerifiedRoute(e, nowIso));
}

/** Explicit classical fallback path — never silent. */
export function createExplicitFallbackEdge(
  graph: PathwayGraph,
  input: {
    edgeId: string;
    fromDevice: string;
    toDevice: string;
    fallbackKind: 'CPU' | 'GPU' | 'NPU';
    nowIso: string;
  },
  query: AccessQuery,
): PathwayEdge | PathwayDenial {
  return upsertEdge(
    graph,
    createEdgeDraft({
      edgeId: input.edgeId,
      source: input.fromDevice,
      target: input.toDevice,
      edgeType: 'FALLBACK_TO',
      tenantId: graph.tenantId,
      universeId: graph.universeId,
      evidenceState: 'DOCUMENTED',
      quantumTruthLabel: 'CLASSICAL',
      nowIso: input.nowIso,
      weightReason: `explicit_${input.fallbackKind}_fallback`,
    }),
    query,
  );
}

/** Simulator execution pathway must remain SIMULATED_QUANTUM. */
export function assertSimulatorTruthLabel(label: QuantumTruthLabel): boolean {
  if (EX12_LOCKS.PRESENT_SIMULATION_AS_PHYSICAL_QPU) return false;
  if (EX12_LOCKS.COLLAPSE_TO_GENERIC_QUANTUM) return false;
  return label === 'SIMULATED_QUANTUM';
}

export function classifySimulatorPath(): QuantumTruthLabel {
  return 'SIMULATED_QUANTUM';
}

/** Software wormhole — still must pass identity/tenant/Universe/Guardian/privacy/data-class/runtime checks. */
export function authorizeSoftwareWormhole(
  checks: SoftwareWormholeChecks,
): { allowed: boolean; reason: string } {
  if (EX12_LOCKS.WORMHOLE_BYPASS_IDENTITY || EX12_LOCKS.WORMHOLE_BYPASS_GUARDIAN) {
    return { allowed: false, reason: 'LOCK_VIOLATION' };
  }
  if (!checks.identityOk) return { allowed: false, reason: 'IDENTITY_CHECK_FAILED' };
  if (!checks.tenantOk) return { allowed: false, reason: 'TENANT_CHECK_FAILED' };
  if (!checks.universeOk) return { allowed: false, reason: 'UNIVERSE_CHECK_FAILED' };
  if (!checks.guardianOk) return { allowed: false, reason: 'GUARDIAN_CHECK_FAILED' };
  if (!checks.privacyOk) return { allowed: false, reason: 'PRIVACY_CHECK_FAILED' };
  if (!checks.dataClassOk) return { allowed: false, reason: 'DATA_CLASS_CHECK_FAILED' };
  if (!checks.runtimeOk) return { allowed: false, reason: 'RUNTIME_CHECK_FAILED' };
  return { allowed: true, reason: 'SOFTWARE_WORMHOLE_AUTHORIZED_CHECKS_PASSED' };
}

function scaleBandFromCounts(nodeCount: number, edgeCount: number): GraphScaleBand {
  const n = Math.max(nodeCount, edgeCount);
  if (n <= 50) return 'LAB';
  if (n <= 500) return 'LOCAL';
  if (n <= 5000) return 'DISTRIBUTED';
  if (n <= 50000) return 'ENTERPRISE';
  return 'ENGINEERING_SCALE_TARGET';
}

/** Measured counts only — never invent millions/billions/trillions. */
export function reportGraphScale(graph: PathwayGraph): GraphScaleReport {
  const edges = [...graph.edges.values()];
  const verifiedEdgeCount = edges.filter(
    (e) => e.evidenceState === 'VERIFIED' || e.evidenceState === 'REPRODUCIBLE',
  ).length;
  const staleEdgeCount = edges.filter(
    (e) => e.freshnessState === 'STALE' || e.evidenceState === 'STALE',
  ).length;
  const contradictionCount = edges.filter((e) => e.edgeType === 'CONTRADICTS').length;
  const nodeCount = graph.nodes.size;
  const edgeCount = graph.edges.size;
  if (EX12_LOCKS.FAKE_GRAPH_SCALE) {
    throw new Error('EX12_LOCK_VIOLATION_FAKE_SCALE');
  }
  return {
    nodeCount,
    edgeCount,
    verifiedEdgeCount,
    staleEdgeCount,
    contradictionCount,
    scaleBand: scaleBandFromCounts(nodeCount, edgeCount),
    measuredOnly: true,
    fabricatedScaleClaim: false,
  };
}

export function seedCanonicalSkeleton(
  graph: PathwayGraph,
  query: AccessQuery,
  nowIso: string,
): { nodes: number; edges: number } | PathwayDenial {
  const hops: Array<{ id: string; type: PathwayNodeType; label: string }> = [
    { id: 'n-mission', type: 'MISSION', label: 'Mission' },
    { id: 'n-problem', type: 'PROBLEM', label: 'Problem' },
    { id: 'n-genome', type: 'WORKLOAD_GENOME', label: 'Workload Genome' },
    { id: 'n-primitive', type: 'PRIMITIVE', label: 'Problem Primitive' },
    { id: 'n-algorithm', type: 'ALGORITHM', label: 'Algorithm' },
    { id: 'n-repr', type: 'REPRESENTATION', label: 'Representation' },
    { id: 'n-runtime', type: 'RUNTIME', label: 'Runtime' },
    { id: 'n-arch', type: 'ARCHITECTURE', label: 'Architecture' },
    { id: 'n-device', type: 'DEVICE', label: 'Device' },
    { id: 'n-bench', type: 'BENCHMARK', label: 'Benchmark' },
    { id: 'n-evidence', type: 'EVIDENCE', label: 'Evidence' },
    { id: 'n-compare', type: 'COMPARISON', label: 'Comparison' },
    { id: 'n-outcome', type: 'OUTCOME', label: 'Outcome' },
    { id: 'n-lesson', type: 'LESSON', label: 'Lesson' },
  ];

  for (const h of hops) {
    const node = upsertNode(
      graph,
      createNode({
        nodeId: h.id,
        nodeType: h.type,
        label: h.label,
        tenantId: graph.tenantId,
        universeId: graph.universeId,
        quantumTruthLabel: 'NOT_TESTED',
        nowIso,
      }),
      query,
    );
    if ('denied' in node) return node;
  }

  const chain: Array<[string, string]> = [
    ['n-mission', 'n-problem'],
    ['n-problem', 'n-genome'],
    ['n-genome', 'n-primitive'],
    ['n-primitive', 'n-algorithm'],
    ['n-algorithm', 'n-repr'],
    ['n-repr', 'n-runtime'],
    ['n-runtime', 'n-arch'],
    ['n-arch', 'n-device'],
    ['n-device', 'n-bench'],
    ['n-bench', 'n-evidence'],
    ['n-evidence', 'n-compare'],
    ['n-compare', 'n-outcome'],
    ['n-outcome', 'n-lesson'],
  ];

  let i = 0;
  for (const [source, target] of chain) {
    const edge = upsertEdge(
      graph,
      createEdgeDraft({
        edgeId: `e-canon-${i++}`,
        source,
        target,
        edgeType: 'DECOMPOSED_INTO',
        tenantId: graph.tenantId,
        universeId: graph.universeId,
        evidenceState: 'HYPOTHESIS',
        quantumTruthLabel: 'NOT_TESTED',
        nowIso,
        weightReason: 'canonical_skeleton_hypothesis',
      }),
      query,
    );
    if ('denied' in edge) return edge;
  }

  return { nodes: graph.nodes.size, edges: graph.edges.size };
}

/** Consciousness / superintelligence are never claimed as verified by this graph. */
export function consciousnessClaimedAsVerified(): false {
  return false;
}

export function superintelligenceClaimedAsVerified(): false {
  return false;
}

export function isBiologicalConsciousnessGraph(): false {
  return false;
}
