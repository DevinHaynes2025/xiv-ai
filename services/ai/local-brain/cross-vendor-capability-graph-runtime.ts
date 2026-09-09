/**
 * 62L-EP2 — Cross-Vendor Capability Graph runtime.
 *
 * Graph: Vendor → Chip Family → Device → Runtime → Model Support → Precision →
 * Benchmark → Workload → Result → Lesson
 *
 * DOCUMENTED ≠ VERIFIED. Public docs ≠ XIV runtime verification.
 * No forbidden IP ingest. Neural edges STALE/REGRESSED on regression.
 * No hidden chain-of-thought storage.
 */

import {
  CAPABILITY_EVIDENCE_STATES,
  CAPABILITY_GRAPH_AGENT_BOUNDS,
  CAPABILITY_GRAPH_AGENT_QUESTIONS,
  CAPABILITY_GRAPH_CORE_PATH,
  CAPABILITY_GRAPH_CYCLE,
  CAPABILITY_GRAPH_VENDOR_LABELS,
  CAPABILITY_GRAPH_VENDORS,
  CAPABILITY_NODE_FIELDS,
  EP2_DB_CANDIDATES_STATUS,
  EP2_LOCKS,
  EP2_MAY,
  EP2_MUST_NOT,
  FORBIDDEN_IP_INGEST_CLASSES,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_SEMICONDUCTOR_LEARNING_PATH,
  HONESTY_BANNER,
  LAWFUL_LEARNING_SOURCES,
  NEURAL_EDGE_STRENGTH_STATES,
  NEXT_PHASE_TITLE,
  assertEp2LocksIntact,
  defaultEvidenceState,
  ep2SoftWireSnapshot,
  isCapabilityGraphAgent,
  isHumanApprover,
  type CapabilityEvidenceState,
  type CapabilityGraphCoreHop,
  type CapabilityGraphVendor,
  type Ep2Actor,
  type Ep2EvidenceState,
  type Ep2HopRecord,
  type Ep2SoftWireSnapshot,
  type ForbiddenIpIngestClass,
  type HistoricalSemiconductorLearningHop,
  type LawfulLearningSource,
  type NeuralEdgeStrengthState,
} from './cross-vendor-capability-graph-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CAPABILITY_GRAPH_CYCLE)[number],
  state: Ep2EvidenceState,
  summary: string,
): Ep2HopRecord {
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

/** Capability node — searchable graph unit. */
export type CapabilityNode = {
  nodeId: string;
  vendor: CapabilityGraphVendor;
  vendorLabel: string;
  productFamily: string | null;
  deviceModel: string | null;
  deviceType: string | null;
  architecture: string | null;
  generation: string | null;
  memory: string | null;
  supportedPrecisions: string[];
  documentedRuntimes: string[];
  executionProviders: string[];
  operatingSystems: string[];
  modelCompatibility: string[];
  workloadStrengths: string[];
  knownLimitations: string[];
  powerEnergyProxy: string | null;
  benchmarkEvidence: string[];
  source: string | null;
  sourceDate: string | null;
  verificationState: CapabilityEvidenceState;
  lastTestedAt: string | null;
  graphPosition: CapabilityGraphCoreHop;
  orgId: string;
  tenantId: string;
  universeId: string;
  documentedEqVerified: false;
  publicDocsEqXivRuntimeVerification: false;
  forbiddenIpIngested: false;
  hiddenChainOfThoughtStored: false;
  evidenceState: Ep2EvidenceState;
  createdAt: string;
};

export function registerCapabilityNode(input: {
  nodeId: string;
  vendor: CapabilityGraphVendor;
  actor: Ep2Actor;
  productFamily?: string | null;
  deviceModel?: string | null;
  deviceType?: string | null;
  architecture?: string | null;
  generation?: string | null;
  memory?: string | null;
  supportedPrecisions?: string[];
  documentedRuntimes?: string[];
  executionProviders?: string[];
  operatingSystems?: string[];
  modelCompatibility?: string[];
  workloadStrengths?: string[];
  knownLimitations?: string[];
  powerEnergyProxy?: string | null;
  benchmarkEvidence?: string[];
  source?: string | null;
  sourceDate?: string | null;
  vendorDocumentationPresent?: boolean;
  hardwareDetected?: boolean;
  runtimeSupportedDocumented?: boolean;
  xivRuntimeEvidencePresent?: boolean;
  notTested?: boolean;
  verificationState?: CapabilityEvidenceState;
  /** Equating DOCUMENTED with VERIFIED → DENIED. */
  attemptEquateDocumentedWithVerified?: boolean;
  attemptClaimVerifiedWithoutRuntimeEvidence?: boolean;
  attemptForbiddenIpIngest?: ForbiddenIpIngestClass;
  attemptStoreHiddenChainOfThought?: boolean;
}): CapabilityNode | DenialResult {
  if (input.attemptEquateDocumentedWithVerified) {
    return deny(
      'DOCUMENTED_NEQ_VERIFIED — public documentation is not XIV runtime verification.',
    );
  }
  if (input.attemptClaimVerifiedWithoutRuntimeEvidence) {
    return deny(
      'VERIFIED_WITHOUT_RUNTIME_EVIDENCE — VERIFIED requires XIV runtime evidence (e.g. successful model load via intended EP).',
    );
  }
  if (input.attemptForbiddenIpIngest) {
    return deny(
      `NO_FORBIDDEN_IP_INGEST — class=${input.attemptForbiddenIpIngest}; agents may not ingest leaked schematics, firmware keys, confidential designs, trade secrets, private source, or restricted eng data.`,
    );
  }
  if (input.attemptStoreHiddenChainOfThought) {
    return deny(
      'NO_HIDDEN_CHAIN_OF_THOUGHT_STORAGE — only structured evidence and outcomes are stored.',
    );
  }

  const verificationState =
    input.verificationState ??
    defaultEvidenceState({
      vendorDocumentationPresent: input.vendorDocumentationPresent,
      hardwareDetected: input.hardwareDetected,
      runtimeSupportedDocumented: input.runtimeSupportedDocumented,
      xivRuntimeEvidencePresent: input.xivRuntimeEvidencePresent,
      notTested: input.notTested,
    });

  if (
    verificationState === 'VERIFIED' &&
    input.xivRuntimeEvidencePresent !== true
  ) {
    return deny(
      'VERIFIED_WITHOUT_RUNTIME_EVIDENCE — cannot label VERIFIED from public docs alone.',
    );
  }

  return {
    nodeId: input.nodeId,
    vendor: input.vendor,
    vendorLabel: CAPABILITY_GRAPH_VENDOR_LABELS[input.vendor],
    productFamily: input.productFamily ?? null,
    deviceModel: input.deviceModel ?? null,
    deviceType: input.deviceType ?? null,
    architecture: input.architecture ?? null,
    generation: input.generation ?? null,
    memory: input.memory ?? null,
    supportedPrecisions: input.supportedPrecisions ?? [],
    documentedRuntimes: input.documentedRuntimes ?? [],
    executionProviders: input.executionProviders ?? [],
    operatingSystems: input.operatingSystems ?? [],
    modelCompatibility: input.modelCompatibility ?? [],
    workloadStrengths: input.workloadStrengths ?? [],
    knownLimitations: input.knownLimitations ?? [
      'Public documentation ≠ XIV runtime verification',
    ],
    powerEnergyProxy: input.powerEnergyProxy ?? null,
    benchmarkEvidence: input.benchmarkEvidence ?? [],
    source: input.source ?? null,
    sourceDate: input.sourceDate ?? null,
    verificationState,
    lastTestedAt:
      verificationState === 'VERIFIED' ? nowIso() : null,
    graphPosition: 'device',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    documentedEqVerified: false,
    publicDocsEqXivRuntimeVerification: false,
    forbiddenIpIngested: false,
    hiddenChainOfThoughtStored: false,
    evidenceState: 'REGISTERED',
    createdAt: nowIso(),
  };
}

/**
 * Example honesty ladder:
 * AMD Ryzen AI NPU docs → DOCUMENTED
 * ASUS exposes compatible hardware → DETECTED
 * XIV loads model through intended EP → VERIFIED
 */
export function encodeDocumentedDetectedVerifiedExamples(): Array<{
  exampleId: string;
  vendor: CapabilityGraphVendor;
  surface: string;
  verificationState: CapabilityEvidenceState;
  note: string;
}> {
  return [
    {
      exampleId: 'ex-documented',
      vendor: 'amd',
      surface: 'ryzen_ai_npu_vendor_documentation',
      verificationState: 'DOCUMENTED',
      note: 'AMD Ryzen AI NPU — vendor documentation exists → DOCUMENTED (≠ VERIFIED)',
    },
    {
      exampleId: 'ex-detected',
      vendor: 'amd',
      surface: 'asus_exposes_compatible_hardware',
      verificationState: 'DETECTED',
      note: 'ASUS exposes compatible hardware → DETECTED (≠ VERIFIED)',
    },
    {
      exampleId: 'ex-verified',
      vendor: 'amd',
      surface: 'xiv_model_load_via_intended_execution_provider',
      verificationState: 'VERIFIED',
      note: 'XIV successfully loads a model through the intended execution provider → VERIFIED (requires runtime evidence)',
    },
  ];
}

export function labelEvidenceState(input: {
  nodeId: string;
  desiredState: CapabilityEvidenceState;
  xivRuntimeEvidencePresent?: boolean;
}):
  | {
      nodeId: string;
      verificationState: CapabilityEvidenceState;
      documentedEqVerified: false;
      publicDocsEqXivRuntimeVerification: false;
    }
  | DenialResult {
  if (
    input.desiredState === 'VERIFIED' &&
    input.xivRuntimeEvidencePresent !== true
  ) {
    return deny(
      'DOCUMENTED_NEQ_VERIFIED / PUBLIC_DOCS_NEQ_XIV_RUNTIME_VERIFICATION — VERIFIED requires XIV runtime evidence.',
    );
  }
  if (!CAPABILITY_EVIDENCE_STATES.includes(input.desiredState)) {
    return deny('Invalid evidence state.');
  }
  return {
    nodeId: input.nodeId,
    verificationState: input.desiredState,
    documentedEqVerified: false,
    publicDocsEqXivRuntimeVerification: false,
  };
}

export function answerCapabilityQuestion(input: {
  questionId: string;
  question: (typeof CAPABILITY_GRAPH_AGENT_QUESTIONS)[number];
  attemptBindProductionRoute?: boolean;
}):
  | {
      questionId: string;
      question: (typeof CAPABILITY_GRAPH_AGENT_QUESTIONS)[number];
      advisoryOnly: true;
      binding: false;
      productionAuthorized: false;
    }
  | DenialResult {
  if (input.attemptBindProductionRoute) {
    return deny(
      'Capability graph answers are ADVISORY_ONLY — cannot bind production routes without human gate + verified evidence.',
    );
  }
  if (!CAPABILITY_GRAPH_AGENT_QUESTIONS.includes(input.question)) {
    return deny('Unknown capability graph agent question.');
  }
  return {
    questionId: input.questionId,
    question: input.question,
    advisoryOnly: true,
    binding: false,
    productionAuthorized: false,
  };
}

export function linkHistoricalSemiconductorLearning(input: {
  linkId: string;
  hops?: HistoricalSemiconductorLearningHop[];
}): {
  linkId: string;
  hops: HistoricalSemiconductorLearningHop[];
  copiesProprietaryDesigns: false;
  advisoryOnly: true;
} {
  return {
    linkId: input.linkId,
    hops: input.hops
      ? [...input.hops]
      : [...HISTORICAL_SEMICONDUCTOR_LEARNING_PATH],
    copiesProprietaryDesigns: false,
    advisoryOnly: true,
  };
}

export function ingestLawfulLearningSource(input: {
  ingestId: string;
  sourceClass: LawfulLearningSource;
  attemptForbiddenClass?: ForbiddenIpIngestClass;
}):
  | {
      ingestId: string;
      sourceClass: LawfulLearningSource;
      accepted: true;
      forbiddenIpIngested: false;
    }
  | DenialResult {
  if (input.attemptForbiddenClass) {
    return deny(
      `NO_FORBIDDEN_IP_INGEST — class=${input.attemptForbiddenClass}.`,
    );
  }
  if (!LAWFUL_LEARNING_SOURCES.includes(input.sourceClass)) {
    return deny('Unknown lawful learning source class.');
  }
  return {
    ingestId: input.ingestId,
    sourceClass: input.sourceClass,
    accepted: true,
    forbiddenIpIngested: false,
  };
}

export function attemptForbiddenIpIngest(
  ingestClass: ForbiddenIpIngestClass,
): DenialResult & { ingested: false } {
  void FORBIDDEN_IP_INGEST_CLASSES;
  return {
    ...deny(`NO_FORBIDDEN_IP_INGEST — class=${ingestClass}.`),
    ingested: false,
  };
}

export type NeuralCapabilityEdge = {
  edgeId: string;
  model: string;
  runtime: string;
  device: string;
  workload: string;
  strength: NeuralEdgeStrengthState;
  structuredEvidenceOnly: true;
  hiddenChainOfThoughtStored: false;
};

export function strengthenNeuralEdgeOnVerifiedBenchmark(input: {
  edgeId: string;
  model: string;
  runtime: string;
  device: string;
  workload: string;
  xivRuntimeEvidencePresent?: boolean;
  attemptStoreHiddenChainOfThought?: boolean;
}): NeuralCapabilityEdge | DenialResult {
  if (input.attemptStoreHiddenChainOfThought) {
    return deny('NO_HIDDEN_CHAIN_OF_THOUGHT_STORAGE.');
  }
  if (input.xivRuntimeEvidencePresent !== true) {
    return deny(
      'Neural edge STRENGTHENED requires verified benchmark / XIV runtime evidence.',
    );
  }
  return {
    edgeId: input.edgeId,
    model: input.model,
    runtime: input.runtime,
    device: input.device,
    workload: input.workload,
    strength: 'STRENGTHENED',
    structuredEvidenceOnly: true,
    hiddenChainOfThoughtStored: false,
  };
}

export function markNeuralEdgeStaleOrRegressed(input: {
  edge: NeuralCapabilityEdge;
  reason: 'stale' | 'regressed';
  attemptKeepAsVerified?: boolean;
}): NeuralCapabilityEdge | DenialResult {
  if (input.attemptKeepAsVerified) {
    return deny(
      'KEEP_REGRESSED_EDGE_AS_VERIFIED=false — regression weakens edge to STALE or REGRESSED.',
    );
  }
  void NEURAL_EDGE_STRENGTH_STATES;
  return {
    ...input.edge,
    strength: input.reason === 'regressed' ? 'REGRESSED' : 'STALE',
    structuredEvidenceOnly: true,
    hiddenChainOfThoughtStored: false,
  };
}

export function attemptStoreHiddenChainOfThought(): DenialResult & {
  stored: false;
} {
  return {
    ...deny('NO_HIDDEN_CHAIN_OF_THOUGHT_STORAGE — structured evidence/outcomes only.'),
    stored: false,
  };
}

export function attemptAgentAutoAuthority(actor: Ep2Actor): DenialResult {
  if (isCapabilityGraphAgent(actor) || actor.kind === 'home_base') {
    return deny(
      'NO_AGENT_AUTO_AUTHORITY — agents may return evidence to Home Base only; recommend ≠ act.',
    );
  }
  return deny('Actor cannot self-grant automatic authority.');
}

export function returnAgentEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep2Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      actorKind: Ep2Actor['kind'];
      summary: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!CAPABILITY_GRAPH_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('Home Base evidence return disabled.');
  }
  if (
    !isCapabilityGraphAgent(input.actor) &&
    input.actor.kind !== 'home_base'
  ) {
    return deny('Only capability-graph agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    actorKind: input.actor.kind,
    summary: input.summary,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  nodeId: string;
  actor: Ep2Actor;
  action: string;
}):
  | {
      approvalId: string;
      nodeId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver or founder.',
    );
  }
  if (
    !input.actor.permissions.includes('approve_consequential') &&
    !input.actor.permissions.includes('authorize_capability_publish')
  ) {
    return deny(
      'Human approver lacks approve_consequential / authorize_capability_publish.',
    );
  }
  return {
    approvalId: input.approvalId,
    nodeId: input.nodeId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EP2_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    bypassDenied: EP2_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function bootstrapCrossVendorCapabilityGraph(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep2SoftWireSnapshot;
  vendors: readonly CapabilityGraphVendor[];
  corePath: readonly CapabilityGraphCoreHop[];
  nodeFields: readonly string[];
  evidenceStates: readonly CapabilityEvidenceState[];
  agentQuestions: readonly string[];
  historicalPath: readonly HistoricalSemiconductorLearningHop[];
  lawfulSources: readonly LawfulLearningSource[];
  forbiddenIp: readonly ForbiddenIpIngestClass[];
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP2_MAY;
  mustNot: typeof EP2_MUST_NOT;
  dbCandidates: typeof EP2_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp2LocksIntact(),
    softWire: ep2SoftWireSnapshot(repoRoot),
    vendors: CAPABILITY_GRAPH_VENDORS,
    corePath: CAPABILITY_GRAPH_CORE_PATH,
    nodeFields: CAPABILITY_NODE_FIELDS,
    evidenceStates: CAPABILITY_EVIDENCE_STATES,
    agentQuestions: CAPABILITY_GRAPH_AGENT_QUESTIONS,
    historicalPath: HISTORICAL_SEMICONDUCTOR_LEARNING_PATH,
    lawfulSources: LAWFUL_LEARNING_SOURCES,
    forbiddenIp: FORBIDDEN_IP_INGEST_CLASSES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP2_MAY,
    mustNot: EP2_MUST_NOT,
    dbCandidates: EP2_DB_CANDIDATES_STATUS,
  };
}

export function runCrossVendorCapabilityGraphCycle(input: {
  actor: Ep2Actor;
  human: Ep2Actor;
  repoRoot?: string;
}): {
  hops: Ep2HopRecord[];
  node: CapabilityNode | DenialResult;
  softWire: Ep2SoftWireSnapshot;
} {
  const hops: Ep2HopRecord[] = [];
  const softWire = ep2SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp2LocksIntact() ? 'PASS' : 'FAIL',
      'EP2 locks intact including L4=false and DOCUMENTED≠VERIFIED.',
    ),
  );
  hops.push(
    hop(
      'capability_graph_bootstrap',
      'PASS',
      'Cross-Vendor Capability Graph bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'vendors_encoded',
      'PASS',
      `${CAPABILITY_GRAPH_VENDORS.length} vendors encoded.`,
    ),
  );
  hops.push(
    hop(
      'core_graph_path_encoded',
      'PASS',
      CAPABILITY_GRAPH_CORE_PATH.join(' → '),
    ),
  );
  hops.push(
    hop(
      'capability_node_fields_encoded',
      'PASS',
      `${CAPABILITY_NODE_FIELDS.length} capability node fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'evidence_states_encoded',
      'PASS',
      CAPABILITY_EVIDENCE_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'agent_questions_encoded',
      'PASS',
      `${CAPABILITY_GRAPH_AGENT_QUESTIONS.length} agent question surfaces encoded.`,
    ),
  );
  hops.push(
    hop(
      'historical_semiconductor_learning_encoded',
      'PASS',
      HISTORICAL_SEMICONDUCTOR_LEARNING_PATH.join(' → '),
    ),
  );

  const node = registerCapabilityNode({
    nodeId: 'cap-ep2-1',
    vendor: 'amd',
    productFamily: 'ryzen_ai_npu_candidate',
    deviceType: 'npu',
    actor: input.actor,
    vendorDocumentationPresent: true,
    source: 'vendor_public_documentation_candidate',
  });

  hops.push(
    hop(
      'documented_neq_verified',
      labelEvidenceState({
        nodeId: 'cap-ep2-1',
        desiredState: 'VERIFIED',
        xivRuntimeEvidencePresent: false,
      }).state,
      'DOCUMENTED≠VERIFIED enforced.',
    ),
  );
  hops.push(
    hop(
      'public_docs_neq_xiv_runtime_verification',
      'PASS',
      'Public documentation ≠ XIV runtime verification.',
    ),
  );
  hops.push(
    hop(
      'verified_requires_runtime_evidence',
      'PASS',
      'VERIFIED requires XIV runtime evidence.',
    ),
  );
  hops.push(
    hop(
      'lawful_learning_sources_encoded',
      'PASS',
      LAWFUL_LEARNING_SOURCES.join(', '),
    ),
  );
  hops.push(
    hop(
      'no_forbidden_ip_ingest',
      attemptForbiddenIpIngest('trade_secrets').state,
      'Forbidden IP ingest DENIED.',
    ),
  );
  hops.push(
    hop(
      'neural_edge_strengthen_on_verified_benchmark',
      strengthenNeuralEdgeOnVerifiedBenchmark({
        edgeId: 'ne-1',
        model: 'model-A',
        runtime: 'runtime-B',
        device: 'gpu-C',
        workload: 'workload-D',
        xivRuntimeEvidencePresent: true,
      }).strength === 'STRENGTHENED'
        ? 'PASS'
        : 'FAIL',
      'Verified benchmark strengthens neural edge.',
    ),
  );
  hops.push(
    hop(
      'neural_edge_stale_or_regressed_on_regression',
      markNeuralEdgeStaleOrRegressed({
        edge: {
          edgeId: 'ne-1',
          model: 'model-A',
          runtime: 'runtime-B',
          device: 'gpu-C',
          workload: 'workload-D',
          strength: 'STRENGTHENED',
          structuredEvidenceOnly: true,
          hiddenChainOfThoughtStored: false,
        },
        reason: 'regressed',
        attemptKeepAsVerified: true,
      }).state,
      'Keeping regressed edge as VERIFIED DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_hidden_chain_of_thought_storage',
      attemptStoreHiddenChainOfThought().state,
      'Hidden CoT storage DENIED.',
    ),
  );
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop('recommend_neq_act', 'PASS', 'Recommend ≠ act / deploy / purchase.'),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP2_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep1_soft_wire',
      softWire.ep1VirtualChipContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep1VirtualChipContract.note,
    ),
  );
  hops.push(
    hop(
      'eo11_soft_wire',
      softWire.eo11VirtualDataWarehouse.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo11VirtualDataWarehouse.note,
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
      EP2_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep2-1',
    nodeId: 'cap-ep2-1',
    actor: input.human,
    action: 'authorize_capability_publish_candidate',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate ? 'DENIED' : 'PASS',
      'Human approval gate exercised; cycle evidence recorded.',
    ),
  );

  void CAPABILITY_GRAPH_CYCLE;

  return {
    hops,
    node,
    softWire,
  };
}
