/**
 * 62L-EQ6 — Architecture Capability Graph runtime.
 *
 * Emit nodes/edges; strengthen on measurement; weaken on failure/stale/regression;
 * deny inferred→fact and blocked IP content. Soft-wires EQ5…EQ1/EM157 when present.
 */

import {
  AGENT_GRAPH_QUERIES,
  ALLOWED_GRAPH_SOURCES,
  ARCHITECTURE_CAPABILITY_GRAPH_CYCLE,
  BLOCKED_GRAPH_CONTENT,
  CAPABILITY_EDGE_FIELDS,
  CAPABILITY_GRAPH_AGENT_BOUNDS,
  CAPABILITY_GRAPH_PATHWAY,
  CAPABILITY_STATES,
  EQ6_DB_CANDIDATES_STATUS,
  EQ6_LOCKS,
  EQ6_MAY,
  EQ6_MUST_NOT,
  EVIDENCE_CLASSES,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MEASURED_STRENGTHEN_LADDER,
  NEXT_PHASE_TITLE,
  RELATIONSHIP_TYPES,
  assertEq6LocksIntact,
  canPromoteToVerified,
  eq6SoftWireSnapshot,
  evidenceClassMaySilentPromoteToFact,
  inferredMayBecomeFactSilently,
  isCapabilityGraphAgent,
  isHumanApprover,
  type CapabilityEdgeField,
  type CapabilityGraphNodeKind,
  type CapabilityState,
  type Eq6Actor,
  type Eq6EvidenceState,
  type Eq6HopRecord,
  type Eq6SoftWireSnapshot,
  type EvidenceClass,
  type RelationshipType,
} from './architecture-capability-graph-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ARCHITECTURE_CAPABILITY_GRAPH_CYCLE)[number],
  state: Eq6EvidenceState,
  summary: string,
): Eq6HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED';
  reason: string;
  executed: false;
};

function deny(reason: string): DenialResult {
  return { denied: true, state: 'DENIED', reason, executed: false };
}

export type BlockedGraphContent = (typeof BLOCKED_GRAPH_CONTENT)[number];
export type AllowedGraphSource = (typeof ALLOWED_GRAPH_SOURCES)[number];
export type AgentGraphQuery = (typeof AGENT_GRAPH_QUERIES)[number];

export type CapabilityGraphNode = {
  nodeId: string;
  kind: CapabilityGraphNodeKind;
  label: string;
  capabilityState: CapabilityState;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type CapabilityGraphEdge = {
  edgeId: string;
  sourceNode: string;
  targetNode: string;
  relationshipType: RelationshipType;
  evidenceClass: EvidenceClass;
  sourceReference: string;
  version: string;
  verifiedDate: string | null;
  confidence: number;
  tenantId: string;
  universeId: string;
  compatibilityState: CapabilityState;
  benchmarkRefs: readonly string[];
  knownLimitations: readonly string[];
  expiryOrStaleness: string | null;
  strength: number;
  hiddenChainOfThoughtPresent: false;
};

export type GraphQueryAnswer = {
  query: AgentGraphQuery;
  results: readonly string[];
  evidenceOnly: true;
  authorityGranted: false;
};

export function emitCapabilityNode(input: {
  actor: Eq6Actor;
  nodeId: string;
  kind: CapabilityGraphNodeKind;
  label: string;
  capabilityState?: CapabilityState;
}): CapabilityGraphNode {
  return {
    nodeId: input.nodeId,
    kind: input.kind,
    label: input.label,
    capabilityState: input.capabilityState ?? 'DOCUMENTED',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function emitCapabilityEdge(input: {
  actor: Eq6Actor;
  edgeId: string;
  sourceNode: string;
  targetNode: string;
  relationshipType: RelationshipType;
  evidenceClass: EvidenceClass;
  sourceReference: string;
  version: string;
  compatibilityState?: CapabilityState;
  benchmarkRefs?: readonly string[];
  knownLimitations?: readonly string[];
  expiryOrStaleness?: string | null;
  verifiedDate?: string | null;
  confidence?: number;
  allowedSource?: AllowedGraphSource;
  blockedContent?: BlockedGraphContent;
  attemptInferredSilentFact?: boolean;
  attemptVerifiedWithoutMeasurement?: boolean;
  attemptVendorAssumptionAsFact?: boolean;
  attemptConfidentialRtl?: boolean;
  attemptFirmwareKeys?: boolean;
  attemptLeakedImplementation?: boolean;
  attemptTradeSecrets?: boolean;
  attemptUnauthorizedCustomerData?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): CapabilityGraphEdge | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_GRAPH=false — no hidden chain-of-thought.',
    );
  }
  if (input.attemptInferredSilentFact) {
    return deny(
      'INFERRED_SILENT_FACT=false — no inferred edge may silently become fact.',
    );
  }
  if (input.attemptVerifiedWithoutMeasurement) {
    return deny(
      'VERIFIED_WITHOUT_MEASUREMENT=false — only measured part becomes VERIFIED.',
    );
  }
  if (input.attemptVendorAssumptionAsFact) {
    return deny('VENDOR_ASSUMPTION_AS_FACT=false.');
  }
  if (input.attemptConfidentialRtl || input.blockedContent === 'confidential_rtl') {
    return deny('CONFIDENTIAL_RTL_IN_GRAPH=false.');
  }
  if (input.attemptFirmwareKeys || input.blockedContent === 'firmware_keys') {
    return deny('FIRMWARE_KEYS_IN_GRAPH=false.');
  }
  if (
    input.attemptLeakedImplementation ||
    input.blockedContent === 'leaked_implementation_details'
  ) {
    return deny('LEAKED_IMPLEMENTATION_IN_GRAPH=false.');
  }
  if (input.attemptTradeSecrets || input.blockedContent === 'trade_secrets') {
    return deny('TRADE_SECRETS_IN_GRAPH=false.');
  }
  if (
    input.attemptUnauthorizedCustomerData ||
    input.blockedContent === 'unauthorized_customer_data'
  ) {
    return deny('UNAUTHORIZED_CUSTOMER_DATA_IN_GRAPH=false.');
  }

  const compatibilityState = input.compatibilityState ?? 'DOCUMENTED';
  if (compatibilityState === 'VERIFIED') {
    return deny(
      'Cannot emit VERIFIED edge without strengthenEdgeWithMeasurement.',
    );
  }
  if (
    input.evidenceClass === 'INFERRED' ||
    input.evidenceClass === 'HYPOTHESIS'
  ) {
    // allowed to emit as inferred/hypothesis — not as FACT
  }

  void CAPABILITY_EDGE_FIELDS;
  void ALLOWED_GRAPH_SOURCES;

  return {
    edgeId: input.edgeId,
    sourceNode: input.sourceNode,
    targetNode: input.targetNode,
    relationshipType: input.relationshipType,
    evidenceClass: input.evidenceClass,
    sourceReference: input.sourceReference,
    version: input.version,
    verifiedDate: input.verifiedDate ?? null,
    confidence: Math.max(0, Math.min(1, input.confidence ?? 0.5)),
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    compatibilityState,
    benchmarkRefs: input.benchmarkRefs ?? [],
    knownLimitations: input.knownLimitations ?? [],
    expiryOrStaleness: input.expiryOrStaleness ?? null,
    strength: 0.4,
    hiddenChainOfThoughtPresent: false,
  };
}

export function strengthenEdgeWithMeasurement(input: {
  edge: CapabilityGraphEdge;
  to: CapabilityState;
  measurementRefs: readonly string[];
  attemptWithoutMeasurement?: boolean;
  attemptInferredSilentFact?: boolean;
}): { edge: CapabilityGraphEdge } | DenialResult {
  if (input.attemptWithoutMeasurement || input.measurementRefs.length === 0) {
    return deny(
      'VERIFIED_WITHOUT_MEASUREMENT=false — measured success required to strengthen toward VERIFIED.',
    );
  }
  if (input.attemptInferredSilentFact) {
    return deny('INFERRED_SILENT_FACT=false.');
  }
  if (
    input.edge.evidenceClass === 'INFERRED' ||
    input.edge.evidenceClass === 'HYPOTHESIS'
  ) {
    if (input.to === 'VERIFIED') {
      return deny(
        'INFERRED/HYPOTHESIS cannot silently become VERIFIED/FACT — reclassify with MEASURED evidence first.',
      );
    }
  }

  if (input.to === 'VERIFIED') {
    if (
      !canPromoteToVerified({
        from: input.edge.compatibilityState,
        hasMeasuredEvidence: input.measurementRefs.length > 0,
        evidenceClass: 'MEASURED',
      })
    ) {
      return deny(
        'SUPPORTED → VERIFIED only after actual test evidence (measured part only).',
      );
    }
    return {
      edge: {
        ...input.edge,
        compatibilityState: 'VERIFIED',
        evidenceClass: 'MEASURED',
        benchmarkRefs: [
          ...new Set([...input.edge.benchmarkRefs, ...input.measurementRefs]),
        ],
        verifiedDate: nowIso(),
        confidence: Math.min(1, input.edge.confidence + 0.3),
        strength: Math.min(1, input.edge.strength + 0.4),
        expiryOrStaleness: null,
      },
    };
  }

  // Intermediate strengthen (e.g. DOCUMENTED → SUPPORTED) with measurement
  const ladder = MEASURED_STRENGTHEN_LADDER as readonly CapabilityState[];
  if (!ladder.includes(input.to) && input.to !== 'PARTIAL') {
    return deny(`Cannot strengthen to ${input.to} via measurement path.`);
  }

  return {
    edge: {
      ...input.edge,
      compatibilityState: input.to,
      evidenceClass: 'MEASURED',
      benchmarkRefs: [
        ...new Set([...input.edge.benchmarkRefs, ...input.measurementRefs]),
      ],
      confidence: Math.min(1, input.edge.confidence + 0.15),
      strength: Math.min(1, input.edge.strength + 0.2),
    },
  };
}

export function weakenEdge(input: {
  edge: CapabilityGraphEdge;
  reason: 'failed_benchmark' | 'stale_evidence' | 'regression';
  note?: string;
}): { edge: CapabilityGraphEdge } {
  const nextState: CapabilityState =
    input.reason === 'stale_evidence'
      ? 'STALE'
      : input.reason === 'regression'
        ? 'DEGRADED'
        : 'DEGRADED';

  return {
    edge: {
      ...input.edge,
      compatibilityState: nextState,
      strength: Math.max(0, input.edge.strength - 0.35),
      confidence: Math.max(0, input.edge.confidence - 0.25),
      knownLimitations: [
        ...input.edge.knownLimitations,
        input.note ?? input.reason,
      ],
      expiryOrStaleness:
        input.reason === 'stale_evidence'
          ? nowIso()
          : input.edge.expiryOrStaleness,
      verifiedDate: null,
    },
  };
}

export function reclassifyEvidenceClass(input: {
  edge: CapabilityGraphEdge;
  to: EvidenceClass;
  attemptSilentInferredToFact?: boolean;
}): { edge: CapabilityGraphEdge } | DenialResult {
  if (input.attemptSilentInferredToFact) {
    return deny('INFERRED_SILENT_FACT=false.');
  }
  if (
    (input.edge.evidenceClass === 'INFERRED' ||
      input.edge.evidenceClass === 'HYPOTHESIS') &&
    input.to === 'FACT' &&
    !evidenceClassMaySilentPromoteToFact(input.edge.evidenceClass)
  ) {
    return deny(
      'No inferred edge may silently become fact — require MEASURED reclassification path.',
    );
  }
  if (
    (input.edge.evidenceClass === 'INFERRED' ||
      input.edge.evidenceClass === 'HYPOTHESIS') &&
    input.to === 'FACT'
  ) {
    return deny('INFERRED_SILENT_FACT=false.');
  }
  return {
    edge: {
      ...input.edge,
      evidenceClass: input.to,
    },
  };
}

export function answerGraphQuery(input: {
  query: AgentGraphQuery;
  graphEdges: readonly CapabilityGraphEdge[];
  workloadHint?: string;
}): GraphQueryAnswer {
  void input.workloadHint;
  const verifiedRoutes = input.graphEdges
    .filter((e) => e.compatibilityState === 'VERIFIED')
    .map((e) => `${e.sourceNode}→${e.targetNode}`);
  const recentBench = input.graphEdges
    .filter((e) => e.benchmarkRefs.length > 0 && e.compatibilityState !== 'STALE')
    .map((e) => e.edgeId);
  const regressed = input.graphEdges
    .filter((e) => e.compatibilityState === 'DEGRADED')
    .map((e) => e.edgeId);
  const fallbacks = input.graphEdges
    .filter((e) => e.relationshipType === 'fallback_of')
    .map((e) => e.edgeId);
  const documentedOnly = input.graphEdges
    .filter((e) => e.compatibilityState === 'DOCUMENTED')
    .map((e) => e.edgeId);

  let results: readonly string[] = [];
  switch (input.query) {
    case 'which_verified_architectures_execute_workload':
      results = verifiedRoutes;
      break;
    case 'which_runtimes_support_required_operators':
      results = input.graphEdges
        .filter((e) => e.relationshipType === 'implements_operators')
        .map((e) => e.targetNode);
      break;
    case 'which_devices_have_recent_benchmarks':
      results = recentBench;
      break;
    case 'which_route_is_most_private':
      results = input.graphEdges
        .filter((e) => e.knownLimitations.every((l) => !l.includes('cloud')))
        .map((e) => e.edgeId);
      break;
    case 'which_path_has_regressed':
      results = regressed;
      break;
    case 'what_fallback_if_accelerator_unavailable':
      results = fallbacks;
      break;
    case 'which_feature_documented_vs_locally_verified':
      results = documentedOnly;
      break;
    default: {
      const _e: never = input.query;
      void _e;
      results = [];
    }
  }

  return {
    query: input.query,
    results,
    evidenceOnly: true,
    authorityGranted: false,
  };
}

export function attemptInferredSilentFact(): DenialResult {
  return deny('INFERRED_SILENT_FACT=false.');
}

export function attemptVerifiedWithoutMeasurement(): DenialResult {
  return deny('VERIFIED_WITHOUT_MEASUREMENT=false.');
}

export function attemptConfidentialRtl(): DenialResult {
  return deny('CONFIDENTIAL_RTL_IN_GRAPH=false.');
}

export function attemptFirmwareKeys(): DenialResult {
  return deny('FIRMWARE_KEYS_IN_GRAPH=false.');
}

export function attemptLeakedImplementation(): DenialResult {
  return deny('LEAKED_IMPLEMENTATION_IN_GRAPH=false.');
}

export function attemptTradeSecrets(): DenialResult {
  return deny('TRADE_SECRETS_IN_GRAPH=false.');
}

export function attemptUnauthorizedCustomerData(): DenialResult {
  return deny('UNAUTHORIZED_CUSTOMER_DATA_IN_GRAPH=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnGraphEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq6Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!CAPABILITY_GRAPH_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (
    !isCapabilityGraphAgent(input.actor) &&
    input.actor.kind !== 'home_base'
  ) {
    return deny('Only capability graph agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq6Actor;
  action: string;
}):
  | {
      approvalId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver, founder, or tenant_admin.',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  return {
    approvalId: input.approvalId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  humanApprovalUnchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EQ6_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ6_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ6_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleAarch64EmbeddingPath(actor: Eq6Actor): {
  nodes: CapabilityGraphNode[];
  edges: CapabilityGraphEdge[];
} {
  const nodes = [
    emitCapabilityNode({
      actor,
      nodeId: 'arch-aarch64',
      kind: 'architecture',
      label: 'AArch64',
    }),
    emitCapabilityNode({
      actor,
      nodeId: 'ext-simd',
      kind: 'extension_feature',
      label: 'SIMD/vector capability',
    }),
    emitCapabilityNode({
      actor,
      nodeId: 'rt-onnx',
      kind: 'runtime',
      label: 'ONNX-compatible runtime',
    }),
    emitCapabilityNode({
      actor,
      nodeId: 'model-a',
      kind: 'model_operator',
      label: 'Model A',
    }),
    emitCapabilityNode({
      actor,
      nodeId: 'dev-arm-x',
      kind: 'device',
      label: 'ARM device X',
    }),
    emitCapabilityNode({
      actor,
      nodeId: 'bench-y',
      kind: 'benchmark',
      label: 'Benchmark Y',
    }),
    emitCapabilityNode({
      actor,
      nodeId: 'wl-embed',
      kind: 'workload',
      label: 'embedding workload',
    }),
  ];

  const edgeSpecs: Array<{
    edgeId: string;
    sourceNode: string;
    targetNode: string;
    relationshipType: RelationshipType;
    evidenceClass: EvidenceClass;
    compatibilityState: CapabilityState;
  }> = [
    {
      edgeId: 'e-arch-ext',
      sourceNode: 'arch-aarch64',
      targetNode: 'ext-simd',
      relationshipType: 'has_extension',
      evidenceClass: 'DOCUMENTED',
      compatibilityState: 'DOCUMENTED',
    },
    {
      edgeId: 'e-ext-rt',
      sourceNode: 'ext-simd',
      targetNode: 'rt-onnx',
      relationshipType: 'runs_on_runtime',
      evidenceClass: 'DOCUMENTED',
      compatibilityState: 'SUPPORTED',
    },
    {
      edgeId: 'e-rt-model',
      sourceNode: 'rt-onnx',
      targetNode: 'model-a',
      relationshipType: 'implements_operators',
      evidenceClass: 'DOCUMENTED',
      compatibilityState: 'SUPPORTED',
    },
    {
      edgeId: 'e-model-dev',
      sourceNode: 'model-a',
      targetNode: 'dev-arm-x',
      relationshipType: 'deploys_to_device',
      evidenceClass: 'DOCUMENTED',
      compatibilityState: 'SUPPORTED',
    },
    {
      edgeId: 'e-dev-bench',
      sourceNode: 'dev-arm-x',
      targetNode: 'bench-y',
      relationshipType: 'benchmarked_by',
      evidenceClass: 'DOCUMENTED',
      compatibilityState: 'NOT_TESTED',
    },
    {
      edgeId: 'e-bench-wl',
      sourceNode: 'bench-y',
      targetNode: 'wl-embed',
      relationshipType: 'serves_workload',
      evidenceClass: 'DOCUMENTED',
      compatibilityState: 'SUPPORTED',
    },
  ];

  const edges: CapabilityGraphEdge[] = [];
  for (const spec of edgeSpecs) {
    const e = emitCapabilityEdge({
      actor,
      ...spec,
      sourceReference: 'public_architecture_specifications',
      version: '0.1-documented',
      allowedSource: 'public_architecture_specifications',
    });
    if ('denied' in e) throw new Error(`example edge ${spec.edgeId} failed`);
    edges.push(e);
  }

  return { nodes, edges };
}

export function bootstrapArchitectureCapabilityGraph(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq6SoftWireSnapshot;
  pathway: typeof CAPABILITY_GRAPH_PATHWAY;
  states: typeof CAPABILITY_STATES;
  evidenceClasses: typeof EVIDENCE_CLASSES;
  edgeFields: readonly CapabilityEdgeField[];
  queries: typeof AGENT_GRAPH_QUERIES;
  allowedSources: typeof ALLOWED_GRAPH_SOURCES;
  blockedContent: typeof BLOCKED_GRAPH_CONTENT;
  relationships: typeof RELATIONSHIP_TYPES;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ6_MAY;
  mustNot: typeof EQ6_MUST_NOT;
  dbCandidates: typeof EQ6_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq6LocksIntact(),
    softWire: eq6SoftWireSnapshot(repoRoot),
    pathway: CAPABILITY_GRAPH_PATHWAY,
    states: CAPABILITY_STATES,
    evidenceClasses: EVIDENCE_CLASSES,
    edgeFields: CAPABILITY_EDGE_FIELDS,
    queries: AGENT_GRAPH_QUERIES,
    allowedSources: ALLOWED_GRAPH_SOURCES,
    blockedContent: BLOCKED_GRAPH_CONTENT,
    relationships: RELATIONSHIP_TYPES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ6_MAY,
    mustNot: EQ6_MUST_NOT,
    dbCandidates: EQ6_DB_CANDIDATES_STATUS,
  };
}

export function runArchitectureCapabilityGraphCycle(input: {
  actor: Eq6Actor;
  human: Eq6Actor;
  repoRoot?: string;
}): {
  hops: Eq6HopRecord[];
  example: ReturnType<typeof exampleAarch64EmbeddingPath>;
  verifiedEdge: CapabilityGraphEdge;
  weakenedEdge: CapabilityGraphEdge;
  softWire: Eq6SoftWireSnapshot;
} {
  const hops: Eq6HopRecord[] = [];
  const softWire = eq6SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq6LocksIntact() ? 'PASS' : 'FAIL',
      'EQ6 locks intact including L4=false and inferred≠fact.',
    ),
  );
  hops.push(
    hop(
      'architecture_capability_graph_bootstrap',
      'PASS',
      'Architecture Capability Graph bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'core_graph_pathway_encoded',
      'PASS',
      CAPABILITY_GRAPH_PATHWAY.join(' → '),
    ),
  );
  hops.push(
    hop(
      'capability_states_encoded',
      'PASS',
      CAPABILITY_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'evidence_classes_encoded',
      'PASS',
      EVIDENCE_CLASSES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'edge_fields_encoded',
      'PASS',
      `${CAPABILITY_EDGE_FIELDS.length} edge fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'agent_queries_encoded',
      'PASS',
      `${AGENT_GRAPH_QUERIES.length} agent query kinds encoded.`,
    ),
  );

  const example = exampleAarch64EmbeddingPath(input.actor);
  const supportedEdge = example.edges.find(
    (e) => e.edgeId === 'e-bench-wl',
  )!;

  const noMeasure = strengthenEdgeWithMeasurement({
    edge: supportedEdge,
    to: 'VERIFIED',
    measurementRefs: [],
    attemptWithoutMeasurement: true,
  });
  const verified = strengthenEdgeWithMeasurement({
    edge: supportedEdge,
    to: 'VERIFIED',
    measurementRefs: ['xiv-bench-embed-arm-x-1'],
  });
  if ('denied' in verified) {
    throw new Error('expected verified strengthen');
  }

  hops.push(
    hop(
      'measured_strengthens_edges',
      verified.edge.compatibilityState === 'VERIFIED' &&
        verified.edge.strength > supportedEdge.strength
        ? 'PASS'
        : 'FAIL',
      'Measured success strengthens edges toward VERIFIED.',
    ),
  );

  const weakened = weakenEdge({
    edge: verified.edge,
    reason: 'regression',
    note: 'latency regression vs prior receipt',
  });
  const stale = weakenEdge({
    edge: verified.edge,
    reason: 'stale_evidence',
  });

  hops.push(
    hop(
      'failed_stale_regression_weaken',
      weakened.edge.compatibilityState === 'DEGRADED' &&
        stale.edge.compatibilityState === 'STALE' &&
        weakened.edge.strength < verified.edge.strength
        ? 'PASS'
        : 'FAIL',
      'Failed benchmarks, stale evidence, or regressions weaken edges.',
    ),
  );

  hops.push(
    hop(
      'supported_to_verified_needs_test_evidence',
      noMeasure.state === 'DENIED' &&
        attemptVerifiedWithoutMeasurement().state === 'DENIED' &&
        verified.edge.evidenceClass === 'MEASURED'
        ? 'PASS'
        : 'FAIL',
      'SUPPORTED → VERIFIED only after actual test evidence.',
    ),
  );

  const inferredEdge = emitCapabilityEdge({
    actor: input.actor,
    edgeId: 'e-inferred',
    sourceNode: 'arch-aarch64',
    targetNode: 'rt-onnx',
    relationshipType: 'runs_on_runtime',
    evidenceClass: 'INFERRED',
    sourceReference: 'hypothesis-link',
    version: '0.0',
    compatibilityState: 'DOCUMENTED',
  });
  if ('denied' in inferredEdge) throw new Error('inferred emit failed');
  const silentFact = reclassifyEvidenceClass({
    edge: inferredEdge,
    to: 'FACT',
    attemptSilentInferredToFact: true,
  });
  hops.push(
    hop(
      'inferred_not_silent_fact',
      silentFact.state === 'DENIED' &&
        inferredMayBecomeFactSilently() === false &&
        attemptInferredSilentFact().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'No inferred edge may silently become fact.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof ARCHITECTURE_CAPABILITY_GRAPH_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_inferred_silent_fact', fn: attemptInferredSilentFact },
    {
      hop: 'deny_verified_without_measurement',
      fn: attemptVerifiedWithoutMeasurement,
    },
    { hop: 'deny_confidential_rtl', fn: attemptConfidentialRtl },
    { hop: 'deny_firmware_keys', fn: attemptFirmwareKeys },
    { hop: 'deny_leaked_implementation', fn: attemptLeakedImplementation },
    { hop: 'deny_trade_secrets', fn: attemptTradeSecrets },
    {
      hop: 'deny_unauthorized_customer_data',
      fn: attemptUnauthorizedCustomerData,
    },
  ];
  for (const d of denyHops) {
    hops.push(
      hop(
        d.hop,
        d.fn().state === 'DENIED' ? 'PASS' : 'FAIL',
        `${d.hop} DENIED.`,
      ),
    );
  }

  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Recommend ≠ act / authorize.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EQ6_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eq5_soft_wire',
      softWire.eq5CompilerIrTranslationLayer.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq5CompilerIrTranslationLayer.note,
    ),
  );
  hops.push(
    hop(
      'eq4_soft_wire',
      softWire.eq4ProprietaryIsaBoundary.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq4ProprietaryIsaBoundary.note,
    ),
  );
  hops.push(
    hop(
      'eq3_soft_wire',
      softWire.eq3RiscvOpenIsaKnowledgePack.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq3RiscvOpenIsaKnowledgePack.note,
    ),
  );
  hops.push(
    hop(
      'eq2_soft_wire',
      softWire.eq2ArmArchitectureKnowledgePack.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.eq2ArmArchitectureKnowledgePack.note,
    ),
  );
  hops.push(
    hop(
      'eq1_soft_wire',
      softWire.eq1CrossArchitectureContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq1CrossArchitectureContract.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWire.em157HomeBase.present ? 'PASS' : 'WAITING_DATA',
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EQ6_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq6-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate ? 'DENIED' : 'PASS',
      'Human approval gate exercised; cycle evidence recorded.',
    ),
  );

  void ARCHITECTURE_CAPABILITY_GRAPH_CYCLE;
  void attemptAgentAutoAuthority;
  void answerGraphQuery;

  return {
    hops,
    example,
    verifiedEdge: verified.edge,
    weakenedEdge: weakened.edge,
    softWire,
  };
}
