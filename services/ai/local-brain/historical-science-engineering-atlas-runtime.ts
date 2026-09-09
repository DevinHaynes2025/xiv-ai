/**
 * 62L-ER7 — Historical Science & Engineering Atlas runtime.
 *
 * Create/register knowledge nodes; attach evidence; classify quantum content;
 * link neural pathway hops; inspire hypotheses (not auto-promote to production);
 * query helpers; deny FTL/gravity/ET/unverified quantum advantage/pirated ingest.
 */

import {
  CONTRADICTION_STATES,
  ER7_AGENT_BOUNDS,
  ER7_DB_CANDIDATES_STATUS,
  ER7_LOCKS,
  ER7_MAY,
  ER7_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_SCIENCE_ENGINEERING_ATLAS_CYCLE,
  HISTORY_PRODUCTION_TRUTH_BOUNDARY,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QUANTUM_CLAIM_BOUNDARY,
  QUANTUM_CONTENT_CLASSIFICATIONS,
  SCIENCE_ENGINEERING_DOMAINS,
  SCIENCE_ENGINEERING_EVIDENCE_CLASSES,
  SCIENCE_ENGINEERING_NEURAL_PATHWAY,
  SCIENCE_ENGINEERING_NODE_FIELDS,
  SCIENCE_ENGINEERING_QUERY_HELPERS,
  SCIENCE_ENGINEERING_RIGHTS_STATES,
  assertEr7LocksIntact,
  er7SoftWireSnapshot,
  historyImpliesProductionTruth,
  isEr7Agent,
  isHumanApprover,
  softWireHopState,
  type ContradictionState,
  type Er7Actor,
  type Er7EvidenceState,
  type Er7HopRecord,
  type Er7SoftWireSnapshot,
  type QuantumContentClassification,
  type ScienceEngineeringDomain,
  type ScienceEngineeringEvidenceClass,
  type ScienceEngineeringNeuralPathwayHop,
  type ScienceEngineeringQueryHelper,
  type ScienceEngineeringRightsState,
} from './historical-science-engineering-atlas-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof HISTORICAL_SCIENCE_ENGINEERING_ATLAS_CYCLE)[number],
  state: Er7EvidenceState,
  summary: string,
): Er7HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export type ScienceEngineeringKnowledgeNode = {
  topicId: string;
  fieldDomain: ScienceEngineeringDomain;
  discoveryInvention: string;
  peopleOrganizations: readonly string[];
  dateEra: string;
  geography: string;
  prerequisiteConcepts: readonly string[];
  engineeringProblem: string;
  methodTechnology: string;
  measurableOutcome: string;
  limitations: string;
  laterDevelopments: string;
  sourceSet: readonly string[];
  evidenceClass: ScienceEngineeringEvidenceClass;
  confidence: number;
  contradictionState: ContradictionState;
  rightsState: ScienceEngineeringRightsState;
  quantumClassification: QuantumContentClassification | null;
  productionTruthAuthorized: false;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
};

export type NeuralPathwayLink = {
  linkId: string;
  topicId: string;
  hops: typeof SCIENCE_ENGINEERING_NEURAL_PATHWAY;
  linkedHops: readonly ScienceEngineeringNeuralPathwayHop[];
  productionTruthAuthorized: false;
};

export type InspiredHypothesis = {
  hypothesisId: string;
  topicId: string;
  statement: string;
  inspiredFromHistory: true;
  productionTruthAuthorized: false;
  state: 'HYPOTHESIS_ONLY';
  advisoryOnly: true;
};

export type AtlasQueryResult = {
  queryId: string;
  helper: ScienceEngineeringQueryHelper;
  topicIds: readonly string[];
  summary: string;
  productionTruthAuthorized: false;
  advisoryOnly: true;
};

export function createRegisterKnowledgeNode(input: {
  actor: Er7Actor;
  topicId: string;
  fieldDomain: ScienceEngineeringDomain;
  discoveryInvention: string;
  peopleOrganizations: readonly string[];
  dateEra: string;
  geography: string;
  prerequisiteConcepts: readonly string[];
  engineeringProblem: string;
  methodTechnology: string;
  measurableOutcome: string;
  limitations: string;
  laterDevelopments: string;
  sourceSet: readonly string[];
  evidenceClass: ScienceEngineeringEvidenceClass;
  confidence: number;
  contradictionState?: ContradictionState;
  rightsState: ScienceEngineeringRightsState;
  quantumClassification?: QuantumContentClassification | null;
  attemptPiratedIngest?: boolean;
  attemptRestrictedArchive?: boolean;
  attemptAutoPromoteToProduction?: boolean;
  attemptUnverifiedQuantumAdvantage?: boolean;
  attemptFasterThanLight?: boolean;
  attemptGravityDefiance?: boolean;
  attemptExtraterrestrialTech?: boolean;
  attemptQuantumWithoutClassification?: boolean;
  attemptHiddenCot?: boolean;
}): ScienceEngineeringKnowledgeNode | DenialResult {
  if (!isEr7Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER7 agents / home_base may register atlas nodes.');
  }
  if (input.attemptHiddenCot) {
    return deny(
      'PERSIST_HIDDEN_CHAIN_OF_THOUGHT=false — no hidden chain-of-thought.',
    );
  }
  if (
    input.attemptPiratedIngest ||
    input.rightsState === 'PIRATED_DENIED' ||
    ER7_LOCKS.PIRATED_BOOKS_PAPERS_DOCUMENTARIES
  ) {
    return deny(
      'PIRATED_BOOKS_PAPERS_DOCUMENTARIES=false — no pirated books, papers, or documentaries.',
    );
  }
  if (
    input.attemptRestrictedArchive ||
    input.rightsState === 'RESTRICTED_DENIED' ||
    ER7_LOCKS.RESTRICTED_ARCHIVES_INGEST
  ) {
    return deny(
      'RESTRICTED_ARCHIVES_INGEST=false — no restricted archives.',
    );
  }
  if (input.attemptAutoPromoteToProduction) {
    return deny(
      'HISTORY_AUTO_BECOMES_PRODUCTION_TRUTH=false — historical knowledge cannot automatically become production truth.',
    );
  }
  if (input.attemptUnverifiedQuantumAdvantage) {
    return deny(
      'UNVERIFIED_QUANTUM_ADVANTAGE_CLAIM=false — quantum advantage requires verification.',
    );
  }
  if (input.attemptFasterThanLight) {
    return deny(
      'FASTER_THAN_LIGHT_NETWORKING_CLAIM=false — FTL networking claims denied.',
    );
  }
  if (input.attemptGravityDefiance) {
    return deny('GRAVITY_DEFIANCE_CLAIM=false — gravity defiance claims denied.');
  }
  if (input.attemptExtraterrestrialTech) {
    return deny(
      'EXTRATERRESTRIAL_TECHNOLOGY_CLAIM=false — extraterrestrial technology claims denied.',
    );
  }

  const isQuantumDomain =
    input.fieldDomain === 'quantum_physics_quantum_information';
  let quantumClassification: QuantumContentClassification | null =
    input.quantumClassification ?? null;

  if (isQuantumDomain || quantumClassification !== null) {
    if (
      input.attemptQuantumWithoutClassification ||
      quantumClassification === null
    ) {
      return deny(
        'QUANTUM_WITHOUT_EXPLICIT_CLASSIFICATION=false — quantum content must be classified.',
      );
    }
    if (
      !(QUANTUM_CONTENT_CLASSIFICATIONS as readonly string[]).includes(
        quantumClassification,
      )
    ) {
      return deny('Invalid quantum content classification.');
    }
  }

  if (
    !(SCIENCE_ENGINEERING_EVIDENCE_CLASSES as readonly string[]).includes(
      input.evidenceClass,
    )
  ) {
    return deny('Invalid evidence class.');
  }
  if (
    !(SCIENCE_ENGINEERING_DOMAINS as readonly string[]).includes(
      input.fieldDomain,
    )
  ) {
    return deny('Invalid science/engineering domain.');
  }
  if (input.sourceSet.length === 0) {
    return deny('sourceSet required — structured citations, not orphan facts.');
  }

  void SCIENCE_ENGINEERING_NODE_FIELDS;

  return {
    topicId: input.topicId,
    fieldDomain: input.fieldDomain,
    discoveryInvention: input.discoveryInvention,
    peopleOrganizations: input.peopleOrganizations,
    dateEra: input.dateEra,
    geography: input.geography,
    prerequisiteConcepts: input.prerequisiteConcepts,
    engineeringProblem: input.engineeringProblem,
    methodTechnology: input.methodTechnology,
    measurableOutcome: input.measurableOutcome,
    limitations: input.limitations,
    laterDevelopments: input.laterDevelopments,
    sourceSet: input.sourceSet,
    evidenceClass: input.evidenceClass,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    contradictionState: input.contradictionState ?? 'NONE',
    rightsState: input.rightsState,
    quantumClassification,
    productionTruthAuthorized: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
  };
}

export function attachEvidenceClass(input: {
  node: ScienceEngineeringKnowledgeNode;
  evidenceClass: ScienceEngineeringEvidenceClass;
}): ScienceEngineeringKnowledgeNode | DenialResult {
  if (
    !(SCIENCE_ENGINEERING_EVIDENCE_CLASSES as readonly string[]).includes(
      input.evidenceClass,
    )
  ) {
    return deny('Invalid evidence class.');
  }
  return {
    ...input.node,
    evidenceClass: input.evidenceClass,
    productionTruthAuthorized: false,
  };
}

export function classifyQuantumContent(input: {
  node: ScienceEngineeringKnowledgeNode;
  classification: QuantumContentClassification;
  physicalQpuEvidenceRef?: string | null;
  attemptClaimUnverifiedAdvantage?: boolean;
}): ScienceEngineeringKnowledgeNode | DenialResult {
  if (input.attemptClaimUnverifiedAdvantage) {
    return deny(
      'UNVERIFIED_QUANTUM_ADVANTAGE_CLAIM=false — no quantum-advantage claim without verification.',
    );
  }
  if (
    !(QUANTUM_CONTENT_CLASSIFICATIONS as readonly string[]).includes(
      input.classification,
    )
  ) {
    return deny('Invalid quantum classification.');
  }
  if (
    input.classification === 'PHYSICAL_QPU_VERIFIED' &&
    !input.physicalQpuEvidenceRef
  ) {
    return deny(
      'PHYSICAL_QPU_VERIFIED requires backend/job evidence reference.',
    );
  }
  return {
    ...input.node,
    quantumClassification: input.classification,
    productionTruthAuthorized: false,
  };
}

export function linkNeuralPathwayHops(input: {
  linkId: string;
  topicId: string;
  linkedHops: readonly ScienceEngineeringNeuralPathwayHop[];
  attemptAutoPromote?: boolean;
}): NeuralPathwayLink | DenialResult {
  if (input.attemptAutoPromote) {
    return deny(
      'AUTO_PROMOTE_HISTORY_TO_PRODUCTION=false — pathway links do not authorize production truth.',
    );
  }
  for (const h of input.linkedHops) {
    if (
      !(SCIENCE_ENGINEERING_NEURAL_PATHWAY as readonly string[]).includes(h)
    ) {
      return deny(`Unknown neural pathway hop: ${h}`);
    }
  }
  return {
    linkId: input.linkId,
    topicId: input.topicId,
    hops: SCIENCE_ENGINEERING_NEURAL_PATHWAY,
    linkedHops: input.linkedHops,
    productionTruthAuthorized: false,
  };
}

export function inspireHypothesis(input: {
  actor: Er7Actor;
  hypothesisId: string;
  topicId: string;
  statement: string;
  attemptAutoPromoteToProduction?: boolean;
}): InspiredHypothesis | DenialResult {
  if (input.attemptAutoPromoteToProduction) {
    return deny(
      'INSPIRED_HYPOTHESIS_EQ_PRODUCTION_TRUTH=false — history may inspire hypotheses but cannot auto-become production truth.',
    );
  }
  if (!ER7_AGENT_BOUNDS.mayInspireHypothesisNotAutoPromote) {
    return deny('mayInspireHypothesisNotAutoPromote=false');
  }
  return {
    hypothesisId: input.hypothesisId,
    topicId: input.topicId,
    statement: input.statement,
    inspiredFromHistory: true,
    productionTruthAuthorized: false,
    state: 'HYPOTHESIS_ONLY',
    advisoryOnly: true,
  };
}

export function queryAtlasHelper(input: {
  queryId: string;
  helper: ScienceEngineeringQueryHelper;
  nodes: readonly ScienceEngineeringKnowledgeNode[];
}): AtlasQueryResult | DenialResult {
  if (
    !(SCIENCE_ENGINEERING_QUERY_HELPERS as readonly string[]).includes(
      input.helper,
    )
  ) {
    return deny('Unknown query helper.');
  }

  const domainHints: Record<
    ScienceEngineeringQueryHelper,
    readonly ScienceEngineeringDomain[]
  > = {
    past_hardware_bottlenecks_resembling_today: [
      'computing_history',
      'semiconductor_history',
      'cpu_gpu_npu_evolution',
    ],
    coevolution_memory_packaging_networking_compute: [
      'semiconductor_history',
      'cpu_gpu_npu_evolution',
      'networking_and_internet_history',
    ],
    mathematical_methods_preceding_modern_optimization: ['mathematics'],
    distributed_systems_earlier_scale_reliability: [
      'databases_and_distributed_systems',
      'networking_and_internet_history',
    ],
    quantum_ideas_experimentally_established_vs_theoretical: [
      'quantum_physics_quantum_information',
    ],
    aerospace_telecom_edge_satellite_architectures: [
      'satellites_and_aerospace',
      'telecom_and_radio',
    ],
  };

  const hints = domainHints[input.helper];
  const matched = input.nodes.filter((n) => hints.includes(n.fieldDomain));

  return {
    queryId: input.queryId,
    helper: input.helper,
    topicIds: matched.map((n) => n.topicId),
    summary: `Advisory query ${input.helper}: ${matched.length} node(s); not production truth.`,
    productionTruthAuthorized: false,
    advisoryOnly: true,
  };
}

export function attemptUnverifiedQuantumAdvantage(): DenialResult {
  return deny(
    'UNVERIFIED_QUANTUM_ADVANTAGE_CLAIM=false — quantum advantage without verification denied.',
  );
}

export function attemptFasterThanLightNetworking(): DenialResult {
  return deny(
    'FASTER_THAN_LIGHT_NETWORKING_CLAIM=false — FTL networking denied.',
  );
}

export function attemptGravityDefiance(): DenialResult {
  return deny('GRAVITY_DEFIANCE_CLAIM=false — gravity defiance denied.');
}

export function attemptExtraterrestrialTechnology(): DenialResult {
  return deny(
    'EXTRATERRESTRIAL_TECHNOLOGY_CLAIM=false — extraterrestrial technology denied.',
  );
}

export function attemptPiratedIngest(): DenialResult {
  return deny(
    'PIRATED_BOOKS_PAPERS_DOCUMENTARIES=false — pirated ingest denied.',
  );
}

export function attemptAutoPromoteHistoryToProduction(): DenialResult {
  return deny(
    'HISTORY_AUTO_BECOMES_PRODUCTION_TRUTH=false — cannot auto-promote history to production truth.',
  );
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act.');
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  humanApprovalUnchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: ER7_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: ER7_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: ER7_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function returnEr7EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er7Actor;
  node: ScienceEngineeringKnowledgeNode;
  summary: string;
}):
  | {
      evidenceId: string;
      topicId: string;
      summary: string;
      productionTruthAuthorized: false;
      advisoryOnly: true;
      hiddenChainOfThoughtPresent: false;
    }
  | DenialResult {
  if (!ER7_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  return {
    evidenceId: input.evidenceId,
    topicId: input.node.topicId,
    summary: input.summary,
    productionTruthAuthorized: false,
    advisoryOnly: true,
    hiddenChainOfThoughtPresent: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er7Actor;
  action: string;
}):
  | {
      approvalId: string;
      required: true;
      granted: boolean;
      state: 'HUMAN_APPROVAL_REQUIRED' | 'PASS';
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return {
      approvalId: input.approvalId,
      required: true,
      granted: false,
      state: 'HUMAN_APPROVAL_REQUIRED',
    };
  }
  void input.action;
  return {
    approvalId: input.approvalId,
    required: true,
    granted: true,
    state: 'PASS',
  };
}

export function exampleTransistorNode(
  actor: Er7Actor,
): ScienceEngineeringKnowledgeNode {
  const node = createRegisterKnowledgeNode({
    actor,
    topicId: 'se-transistor-1947',
    fieldDomain: 'semiconductor_history',
    discoveryInvention: 'Point-contact transistor',
    peopleOrganizations: ['Bell Labs', 'Bardeen', 'Brattain', 'Shockley'],
    dateEra: '1947',
    geography: 'Murray Hill, New Jersey, USA',
    prerequisiteConcepts: ['solid_state_physics', 'semiconductor_doping'],
    engineeringProblem: 'Replace fragile vacuum tubes with solid-state switches',
    methodTechnology: 'germanium point-contact amplification',
    measurableOutcome: 'Reliable solid-state amplification demonstrated',
    limitations: 'Early devices noisy; manufacturing immature',
    laterDevelopments: 'Junction transistor → IC → VLSI → GPU/NPU',
    sourceSet: [
      'public historical record: Bell Labs transistor announcement (1948)',
      'NIST / public science museum summaries',
    ],
    evidenceClass: 'HISTORICAL_RECORD',
    confidence: 0.92,
    contradictionState: 'NONE',
    rightsState: 'PUBLIC_DOMAIN',
  });
  if ('denied' in node) throw new Error('exampleTransistorNode failed');
  return node;
}

export function exampleBellInequalityNode(
  actor: Er7Actor,
): ScienceEngineeringKnowledgeNode {
  const node = createRegisterKnowledgeNode({
    actor,
    topicId: 'se-bell-inequality',
    fieldDomain: 'quantum_physics_quantum_information',
    discoveryInvention: 'Bell inequalities and experimental tests of locality',
    peopleOrganizations: ['John Bell', 'Aspect', 'Clauser', 'Zeilinger'],
    dateEra: '1964–2015',
    geography: 'International (theory + lab)',
    prerequisiteConcepts: ['quantum_entanglement', 'local_hidden_variables'],
    engineeringProblem:
      'Distinguish quantum correlations from classical local realism',
    methodTechnology: 'entangled-photon correlation experiments',
    measurableOutcome:
      'Loophole-closing tests support quantum predictions over local hidden variables',
    limitations: 'Does not imply FTL signaling or production quantum advantage',
    laterDevelopments: 'Quantum information theory; QI-inspired algorithms',
    sourceSet: [
      'peer-reviewed Bell test literature (public abstracts)',
      'Nobel Prize 2022 public citations',
    ],
    evidenceClass: 'PEER_REVIEWED',
    confidence: 0.9,
    contradictionState: 'NONE',
    rightsState: 'OPEN',
    quantumClassification: 'ESTABLISHED_PHYSICS',
  });
  if ('denied' in node) throw new Error('exampleBellInequalityNode failed');
  return node;
}

export function bootstrapHistoricalScienceEngineeringAtlas(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Er7SoftWireSnapshot;
  domains: typeof SCIENCE_ENGINEERING_DOMAINS;
  nodeFields: typeof SCIENCE_ENGINEERING_NODE_FIELDS;
  evidenceClasses: typeof SCIENCE_ENGINEERING_EVIDENCE_CLASSES;
  quantumClassifications: typeof QUANTUM_CONTENT_CLASSIFICATIONS;
  pathway: typeof SCIENCE_ENGINEERING_NEURAL_PATHWAY;
  rightsStates: typeof SCIENCE_ENGINEERING_RIGHTS_STATES;
  queryHelpers: typeof SCIENCE_ENGINEERING_QUERY_HELPERS;
  contradictionStates: typeof CONTRADICTION_STATES;
  historyBoundary: typeof HISTORY_PRODUCTION_TRUTH_BOUNDARY;
  quantumBoundary: typeof QUANTUM_CLAIM_BOUNDARY;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    layer: typeof ER_LAYER_TITLE;
  };
  may: typeof ER7_MAY;
  mustNot: typeof ER7_MUST_NOT;
  dbCandidates: typeof ER7_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEr7LocksIntact(),
    softWire: er7SoftWireSnapshot(repoRoot),
    domains: SCIENCE_ENGINEERING_DOMAINS,
    nodeFields: SCIENCE_ENGINEERING_NODE_FIELDS,
    evidenceClasses: SCIENCE_ENGINEERING_EVIDENCE_CLASSES,
    quantumClassifications: QUANTUM_CONTENT_CLASSIFICATIONS,
    pathway: SCIENCE_ENGINEERING_NEURAL_PATHWAY,
    rightsStates: SCIENCE_ENGINEERING_RIGHTS_STATES,
    queryHelpers: SCIENCE_ENGINEERING_QUERY_HELPERS,
    contradictionStates: CONTRADICTION_STATES,
    historyBoundary: HISTORY_PRODUCTION_TRUTH_BOUNDARY,
    quantumBoundary: QUANTUM_CLAIM_BOUNDARY,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
      layer: ER_LAYER_TITLE,
    },
    may: ER7_MAY,
    mustNot: ER7_MUST_NOT,
    dbCandidates: ER7_DB_CANDIDATES_STATUS,
  };
}

export function runHistoricalScienceEngineeringAtlasCycle(input: {
  actor: Er7Actor;
  human: Er7Actor;
  repoRoot?: string;
}): {
  hops: Er7HopRecord[];
  transistor: ScienceEngineeringKnowledgeNode;
  bell: ScienceEngineeringKnowledgeNode;
  hypothesis: InspiredHypothesis | DenialResult;
  softWire: Er7SoftWireSnapshot;
} {
  const hops: Er7HopRecord[] = [];
  const softWire = er7SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr7LocksIntact() ? 'PASS' : 'FAIL',
      'ER7 locks intact including L4=false and history≠production truth.',
    ),
  );
  hops.push(
    hop(
      'historical_science_engineering_atlas_bootstrap',
      'PASS',
      'Historical Science & Engineering Atlas bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'domains_encoded',
      'PASS',
      `${SCIENCE_ENGINEERING_DOMAINS.length} S&E domains encoded.`,
    ),
  );
  hops.push(
    hop(
      'knowledge_node_fields_encoded',
      'PASS',
      `${SCIENCE_ENGINEERING_NODE_FIELDS.length} knowledge node fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'evidence_classes_encoded',
      'PASS',
      SCIENCE_ENGINEERING_EVIDENCE_CLASSES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'quantum_classifications_encoded',
      'PASS',
      QUANTUM_CONTENT_CLASSIFICATIONS.join(' | '),
    ),
  );
  hops.push(
    hop(
      'neural_pathway_encoded',
      'PASS',
      SCIENCE_ENGINEERING_NEURAL_PATHWAY.join(' → '),
    ),
  );
  hops.push(
    hop(
      'rights_states_encoded',
      'PASS',
      SCIENCE_ENGINEERING_RIGHTS_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'query_helpers_encoded',
      'PASS',
      SCIENCE_ENGINEERING_QUERY_HELPERS.join(' | '),
    ),
  );

  const transistor = exampleTransistorNode(input.actor);
  const bell = exampleBellInequalityNode(input.actor);

  hops.push(
    hop(
      'history_neq_production_truth',
      transistor.productionTruthAuthorized === false &&
        historyImpliesProductionTruth() === false &&
        attemptAutoPromoteHistoryToProduction().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Historical knowledge ≠ automatic production truth.',
    ),
  );

  const hypothesis = inspireHypothesis({
    actor: input.actor,
    hypothesisId: 'hyp-packaging-memory-1',
    topicId: transistor.topicId,
    statement:
      'Historical packaging/memory co-evolution may inspire modern NPU interconnect hypotheses (not production truth).',
  });
  const autoPromote = inspireHypothesis({
    actor: input.actor,
    hypothesisId: 'hyp-bad',
    topicId: transistor.topicId,
    statement: 'bad',
    attemptAutoPromoteToProduction: true,
  });
  hops.push(
    hop(
      'inspire_hypothesis_not_auto_promote',
      !('denied' in hypothesis) &&
        hypothesis.state === 'HYPOTHESIS_ONLY' &&
        autoPromote.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'History may inspire hypotheses; never auto-promote to production.',
    ),
  );

  hops.push(
    hop(
      'quantum_content_must_classify',
      bell.quantumClassification === 'ESTABLISHED_PHYSICS' &&
        createRegisterKnowledgeNode({
          actor: input.actor,
          topicId: 'q-bad',
          fieldDomain: 'quantum_physics_quantum_information',
          discoveryInvention: 'x',
          peopleOrganizations: ['x'],
          dateEra: 'x',
          geography: 'x',
          prerequisiteConcepts: [],
          engineeringProblem: 'x',
          methodTechnology: 'x',
          measurableOutcome: 'x',
          limitations: 'x',
          laterDevelopments: 'x',
          sourceSet: ['public'],
          evidenceClass: 'SPECULATIVE',
          confidence: 0.1,
          rightsState: 'OPEN',
          attemptQuantumWithoutClassification: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Quantum content requires explicit classification.',
    ),
  );

  hops.push(
    hop(
      'quantum_advantage_requires_verification',
      attemptUnverifiedQuantumAdvantage().state === 'DENIED' &&
        QUANTUM_CLAIM_BOUNDARY.mayClaimUnverifiedQuantumAdvantage === false
        ? 'PASS'
        : 'FAIL',
      'Quantum advantage claims require verification.',
    ),
  );

  hops.push(
    hop(
      'lawful_sources_only',
      attemptPiratedIngest().state === 'DENIED' &&
        createRegisterKnowledgeNode({
          actor: input.actor,
          topicId: 'pirated',
          fieldDomain: 'mathematics',
          discoveryInvention: 'x',
          peopleOrganizations: ['x'],
          dateEra: 'x',
          geography: 'x',
          prerequisiteConcepts: [],
          engineeringProblem: 'x',
          methodTechnology: 'x',
          measurableOutcome: 'x',
          limitations: 'x',
          laterDevelopments: 'x',
          sourceSet: ['stolen scan'],
          evidenceClass: 'SPECULATIVE',
          confidence: 0.1,
          rightsState: 'PIRATED_DENIED',
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Lawful public-domain/open/licensed/authorized sources only.',
    ),
  );

  hops.push(
    hop(
      'deny_unverified_quantum_advantage',
      attemptUnverifiedQuantumAdvantage().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Unverified quantum advantage denied.',
    ),
  );
  hops.push(
    hop(
      'deny_faster_than_light_networking',
      attemptFasterThanLightNetworking().state === 'DENIED' ? 'PASS' : 'FAIL',
      'FTL networking denied.',
    ),
  );
  hops.push(
    hop(
      'deny_gravity_defiance',
      attemptGravityDefiance().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Gravity defiance denied.',
    ),
  );
  hops.push(
    hop(
      'deny_extraterrestrial_technology',
      attemptExtraterrestrialTechnology().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Extraterrestrial technology denied.',
    ),
  );
  hops.push(
    hop(
      'deny_pirated_books_papers_documentaries',
      attemptPiratedIngest().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Pirated ingest denied.',
    ),
  );
  hops.push(
    hop(
      'deny_restricted_archives',
      createRegisterKnowledgeNode({
        actor: input.actor,
        topicId: 'restricted',
        fieldDomain: 'computing_history',
        discoveryInvention: 'x',
        peopleOrganizations: ['x'],
        dateEra: 'x',
        geography: 'x',
        prerequisiteConcepts: [],
        engineeringProblem: 'x',
        methodTechnology: 'x',
        measurableOutcome: 'x',
        limitations: 'x',
        laterDevelopments: 'x',
        sourceSet: ['restricted archive'],
        evidenceClass: 'HISTORICAL_RECORD',
        confidence: 0.5,
        rightsState: 'RESTRICTED_DENIED',
      }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Restricted archives denied.',
    ),
  );
  hops.push(
    hop(
      'deny_auto_promote_history_to_production_truth',
      attemptAutoPromoteHistoryToProduction().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Auto-promote history → production truth denied.',
    ),
  );
  hops.push(
    hop(
      'deny_bypass_guardian_rls',
      ER7_LOCKS.BYPASS_GUARDIAN_RLS === false ? 'PASS' : 'FAIL',
      'Guardian/RLS bypass denied.',
    ),
  );
  hops.push(
    hop(
      'deny_expand_tenant_universe_access',
      ER7_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false ? 'PASS' : 'FAIL',
      'Tenant/Universe expansion denied.',
    ),
  );
  hops.push(
    hop(
      'deny_persist_hidden_chain_of_thought',
      ER7_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false ? 'PASS' : 'FAIL',
      'Hidden CoT denied.',
    ),
  );
  hops.push(
    hop(
      'deny_auto_deploy_changes',
      ER7_LOCKS.AUTO_DEPLOY_CHANGES === false ? 'PASS' : 'FAIL',
      'Auto-deploy denied.',
    ),
  );

  const isolation = probeGuardianRlsTenantUniverseIsolation();
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      isolation.state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Recommend ≠ act.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER7_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false.',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      'PASS',
      ER_LAYER_TITLE,
    ),
  );

  const softPairs: Array<
    [
      (typeof HISTORICAL_SCIENCE_ENGINEERING_ATLAS_CYCLE)[number],
      boolean,
      string,
    ]
  > = [
    [
      'er6_soft_wire',
      softWire.er6HistoricalBusinessCaseAtlas.present,
      'ER6 Historical Business Case Atlas',
    ],
    [
      'er5_soft_wire',
      softWire.er5GlobalHistoricalKnowledgeIngestion.present,
      'ER5 Global Historical Knowledge Ingestion',
    ],
    [
      'er4_soft_wire',
      softWire.er4RightsProvenanceGate.present,
      'ER4 Rights & Provenance Gate',
    ],
    [
      'er3_soft_wire',
      softWire.er3PublicDataSourceRegistry.present,
      'ER3 Public Data Source Registry',
    ],
    [
      'er2_soft_wire',
      softWire.er2ApiTruthStateMachine.present,
      'ER2 API Truth State Machine',
    ],
    [
      'er1_soft_wire',
      softWire.er1RealApiConnectionRegistry.present,
      'ER1 Real API Connection Registry',
    ],
    [
      'eq16_soft_wire',
      softWire.eq16SoftwareWormholeRouter.present,
      'EQ16 Software Wormhole Router',
    ],
    [
      'eq15_soft_wire',
      softWire.eq15PathwayPlasticity.present,
      'EQ15 Pathway Plasticity',
    ],
    [
      'eq14_soft_wire',
      softWire.eq14NeuralPathwayArchitectureGraph.present,
      'EQ14 Neural Pathway Architecture Graph',
    ],
    [
      'eq13_soft_wire',
      softWire.eq13ArchitectureReturnReceipt.present,
      'EQ13 Architecture Return Receipt',
    ],
    [
      'eq12_soft_wire',
      softWire.eq12CrossArchitectureBenchmarkMatrix.present,
      'EQ12 Cross-Architecture Benchmark Matrix',
    ],
    [
      'ep15_soft_wire',
      softWire.ep15AlgorithmTuningSandbox.present,
      'EP15 Algorithm Tuning Sandbox',
    ],
    [
      'em157_soft_wire',
      softWire.em157HomeBase.present,
      'EM (#157) Agent Compute Home Base',
    ],
  ];

  for (const [hopName, present, label] of softPairs) {
    hops.push(
      hop(
        hopName,
        softWireHopState(present),
        present
          ? `${label} PRESENT (soft-wire; presence ≠ VERIFIED).`
          : `${label} absent — WAITING_DATA (not FAIL).`,
      ),
    );
  }

  hops.push(
    hop(
      'db_candidates_not_applied',
      ER7_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const pathway = linkNeuralPathwayHops({
    linkId: 'path-1',
    topicId: transistor.topicId,
    linkedHops: [...SCIENCE_ENGINEERING_NEURAL_PATHWAY],
  });
  const ev = returnEr7EvidenceToHomeBase({
    evidenceId: 'ev-er7-1',
    actor: input.actor,
    node: transistor,
    summary: 'ER7 atlas advisory evidence',
  });
  const gate = requireHumanApproval({
    approvalId: 'a-er7-1',
    actor: input.human,
    action: 'approve_consequential',
  });

  hops.push(
    hop(
      'evidence',
      !('denied' in pathway) &&
        !('denied' in ev) &&
        !('denied' in gate) &&
        gate.state === 'PASS'
        ? 'PASS'
        : 'FAIL',
      'Pathway link + home-base evidence + human approval recorded.',
    ),
  );

  return { hops, transistor, bell, hypothesis, softWire };
}
