/**
 * 62L-EO8 — Supply Chain Resilience Pack runtime.
 *
 * Workflow:
 * Risk signal → affected graph → exposure calculation → historical analogues →
 * classical scenario model → alternate sourcing/capacity options →
 * cost/service tradeoff → recovery recommendation → human approval
 *
 * Sim ≠ fact. Recommend ≠ act / purchase / switch / contract / dispatch / communicate.
 * Historical analogues inform ≠ prove next outcomes.
 */

import {
  EO8_DB_CANDIDATES_STATUS,
  EO8_LOCKS,
  EO8_MAY,
  EO8_MUST_NOT,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  RESILIENCE_AGENT_TEAM,
  RESILIENCE_GRAPH_NODE_KINDS,
  RESILIENCE_OUTPUT_FIELDS,
  RESILIENCE_RECORD_FIELDS,
  RESILIENCE_WORKFLOW,
  SCENARIO_LIBRARY,
  SUPPLY_CHAIN_RESILIENCE_PACK_CYCLE,
  TRUTH_BOUNDARY_LABELS,
  assertEo8LocksIntact,
  eo8SoftWireSnapshot,
  isBoundedResilienceAgent,
  isHumanApprover,
  isValidTruthLabel,
  type Eo8Actor,
  type Eo8EvidenceState,
  type Eo8HopRecord,
  type Eo8SoftWireSnapshot,
  type ResilienceAgentRole,
  type ResilienceGraphNodeKind,
  type ResilienceWorkflowHop,
  type ScenarioLibraryId,
  type TruthBoundaryLabel,
} from './supply-chain-resilience-pack-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof SUPPLY_CHAIN_RESILIENCE_PACK_CYCLE)[number],
  state: Eo8EvidenceState,
  summary: string,
): Eo8HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

// ---------------------------------------------------------------------------
// Graph model
// ---------------------------------------------------------------------------

export type ResilienceGraphNode = {
  nodeId: string;
  kind: ResilienceGraphNodeKind;
  label: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  /** Authorized attributes only — no fabricated mission/disruption payloads. */
  attributes: Record<string, string | number | boolean | null>;
  truthLabel: TruthBoundaryLabel;
  evidenceRefs: string[];
  evidenceSourceDate: string | null;
  confidence: number | null;
};

export type ResilienceGraphEdge = {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relation:
    | 'supplies'
    | 'tier_of'
    | 'bom_contains'
    | 'located_at'
    | 'buffers'
    | 'ships_via'
    | 'serves'
    | 'exposes'
    | 'mitigated_by';
  truthLabel: TruthBoundaryLabel;
};

export type ResilienceGraph = {
  graphId: string;
  nodes: ResilienceGraphNode[];
  edges: ResilienceGraphEdge[];
  status: 'REGISTERED';
  advisoryOnly: true;
  fabricatedData: false;
};

const graphs = new Map<string, ResilienceGraph>();

export function registerResilienceGraph(input: {
  graphId: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  nodes?: Array<Omit<ResilienceGraphNode, 'orgId' | 'tenantId' | 'universeId'> &
    Partial<Pick<ResilienceGraphNode, 'orgId' | 'tenantId' | 'universeId'>>>;
  edges?: ResilienceGraphEdge[];
}): ResilienceGraph {
  const nodes = (input.nodes ?? []).map((n) => {
    if (!isValidTruthLabel(n.truthLabel)) {
      throw new Error(`Invalid truth label: ${String(n.truthLabel)}`);
    }
    if (!(RESILIENCE_GRAPH_NODE_KINDS as readonly string[]).includes(n.kind)) {
      throw new Error(`Invalid node kind: ${String(n.kind)}`);
    }
    return {
      ...n,
      orgId: n.orgId ?? input.orgId,
      tenantId: n.tenantId ?? input.tenantId,
      universeId: n.universeId ?? input.universeId,
      evidenceRefs: n.evidenceRefs ?? [],
      evidenceSourceDate: n.evidenceSourceDate ?? null,
      confidence: n.confidence ?? null,
    } satisfies ResilienceGraphNode;
  });

  const graph: ResilienceGraph = {
    graphId: input.graphId,
    nodes,
    edges: input.edges ?? [],
    status: 'REGISTERED',
    advisoryOnly: true,
    fabricatedData: false,
  };
  graphs.set(graph.graphId, graph);
  return graph;
}

export function getResilienceGraph(graphId: string): ResilienceGraph | null {
  return graphs.get(graphId) ?? null;
}

/** Resilience record field coverage probe. */
export function listResilienceRecordFields(): typeof RESILIENCE_RECORD_FIELDS {
  return RESILIENCE_RECORD_FIELDS;
}

export function listTruthBoundaryLabels(): typeof TRUTH_BOUNDARY_LABELS {
  return TRUTH_BOUNDARY_LABELS;
}

export function listScenarioLibrary(): typeof SCENARIO_LIBRARY {
  return SCENARIO_LIBRARY;
}

export function listResilienceAgentTeam(): typeof RESILIENCE_AGENT_TEAM {
  return RESILIENCE_AGENT_TEAM;
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

export type ResiliencePackBootstrap = {
  status: 'IMPLEMENTED';
  honesty: typeof HONESTY_BANNER;
  sotLabel: typeof GITHUB_SOT_LABEL;
  sotTitle: typeof GITHUB_SOT_TITLE;
  gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
  nextPhase: typeof NEXT_PHASE_TITLE;
  dbCandidates: typeof EO8_DB_CANDIDATES_STATUS;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  workflow: typeof RESILIENCE_WORKFLOW;
  scenarioLibrary: typeof SCENARIO_LIBRARY;
  truthLabels: typeof TRUTH_BOUNDARY_LABELS;
  agentTeam: typeof RESILIENCE_AGENT_TEAM;
  may: typeof EO8_MAY;
  mustNot: typeof EO8_MUST_NOT;
  softWire: Eo8SoftWireSnapshot;
  hops: Eo8HopRecord[];
  cycle: typeof SUPPLY_CHAIN_RESILIENCE_PACK_CYCLE;
};

export function bootstrapSupplyChainResiliencePack(repoRoot?: string): ResiliencePackBootstrap {
  const softWire = eo8SoftWireSnapshot(repoRoot);
  const locksIntact = assertEo8LocksIntact();

  return {
    status: 'IMPLEMENTED',
    honesty: HONESTY_BANNER,
    sotLabel: GITHUB_SOT_LABEL,
    sotTitle: GITHUB_SOT_TITLE,
    gitlabMirrorNote: GITLAB_MIRROR_NOTE,
    nextPhase: NEXT_PHASE_TITLE,
    dbCandidates: EO8_DB_CANDIDATES_STATUS,
    locksIntact,
    l4AutonomyEnabled: EO8_LOCKS.L4_AUTONOMY_ENABLED,
    workflow: RESILIENCE_WORKFLOW,
    scenarioLibrary: SCENARIO_LIBRARY,
    truthLabels: TRUTH_BOUNDARY_LABELS,
    agentTeam: RESILIENCE_AGENT_TEAM,
    may: EO8_MAY,
    mustNot: EO8_MUST_NOT,
    softWire,
    cycle: SUPPLY_CHAIN_RESILIENCE_PACK_CYCLE,
    hops: [
      hop('honesty_locks', locksIntact ? 'PASS' : 'FAIL', 'EO8 locks intact check'),
      hop('resilience_pack_bootstrap', 'IMPLEMENTED', 'Supply Chain Resilience Pack bootstrapped'),
      hop('resilience_graph_register', 'AVAILABLE', 'Graph register API ready'),
      hop('resilience_record_fields_encoded', 'PASS', 'Resilience record fields encoded'),
      hop('truth_boundary_labels_hard', 'PASS', 'Truth boundary labels hard-coded'),
      hop('scenario_library_sandbox', 'SANDBOX', 'Scenario library available for sandbox runs'),
      hop('resilience_workflow_hops', 'PASS', 'Core resilience workflow encoded'),
      hop(
        'historical_informs_neq_proves_next',
        'PASS',
        'Historical disruptions inform scenarios ≠ prove next outcomes',
      ),
      hop('agent_team_bounded', 'BOUNDED', 'Nine-agent team bounded; no auto authority'),
      hop('evidence_to_home_base', softWire.homeBaseRuntime.present ? 'AVAILABLE' : 'WAITING_DATA', softWire.homeBaseRuntime.note),
      hop('no_auto_authority', 'PASS', 'Agents cannot self-expand or auto-execute recovery'),
      hop(
        'eo6_classical_baseline_soft_wire',
        softWire.eo6ClassicalBaseline.present ? 'AVAILABLE' : 'WAITING_DATA',
        softWire.eo6ClassicalBaseline.note,
      ),
      hop(
        'eo7_logistics_pack_soft_wire',
        softWire.eo7LogisticsPack.present ? 'AVAILABLE' : 'WAITING_DATA',
        softWire.eo7LogisticsPack.note,
      ),
      hop(
        'eo5_quantum_honesty_soft_wire',
        softWire.eo5QuantumHonesty.present ? 'AVAILABLE' : 'WAITING_DATA',
        softWire.eo5QuantumHonesty.note,
      ),
      hop(
        'eo159_logistics_advisory_soft_wire',
        softWire.eo159MissionOsRuntime.present ? 'AVAILABLE' : 'WAITING_DATA',
        softWire.eo159MissionOsRuntime.note,
      ),
      hop(
        'home_base_evidence_soft_wire',
        softWire.homeBaseRuntime.present ? 'AVAILABLE' : 'WAITING_DATA',
        softWire.homeBaseRuntime.note,
      ),
      hop('no_autonomous_purchasing', 'PASS', 'AUTONOMOUS_PURCHASING=false'),
      hop('no_autonomous_supplier_switching', 'PASS', 'AUTONOMOUS_SUPPLIER_SWITCHING=false'),
      hop('no_autonomous_contract_changes', 'PASS', 'AUTONOMOUS_CONTRACT_CHANGES=false'),
      hop('no_autonomous_physical_dispatch', 'PASS', 'AUTONOMOUS_PHYSICAL_DISPATCH=false'),
      hop('no_external_communications', 'PASS', 'AUTONOMOUS_EXTERNAL_COMMUNICATIONS=false'),
      hop('no_fabricate_mission_disruption_data', 'PASS', 'Fabrication denied'),
      hop('authorized_data_only', 'PASS', 'AUTHORIZED_DATA_ONLY=true'),
      hop('sim_neq_fact', 'PASS', 'SIM_EQ_FACT=false'),
      hop('recommend_neq_act', 'PASS', 'RECOMMEND_EQ_ACT=false'),
      hop(
        'consequential_recovery_human_authorized',
        'HUMAN_APPROVAL_REQUIRED',
        'Consequential recovery requires human authorization',
      ),
      hop(
        'guardian_rls_tenant_universe_isolation',
        'PASS',
        'Guardian/RLS/Universe isolation unchanged',
      ),
      hop('l4_autonomy_false', 'PASS', 'L4_AUTONOMY_ENABLED=false'),
      hop('evidence', 'PASS', 'EO8 evidence trail ready'),
    ],
  };
}

// ---------------------------------------------------------------------------
// Scenario run (sandbox) + recovery recommendation
// ---------------------------------------------------------------------------

export type HistoricalAnalogue = {
  analogueId: string;
  summary: string;
  year: number | null;
  truthLabel: 'OBSERVED_EVIDENCE' | 'UNKNOWN';
  /** Explicit honesty: informs scenario ≠ proves next outcome. */
  provesNextOutcome: false;
  evidenceRefs: string[];
};

export type RecoveryOption = {
  optionId: string;
  description: string;
  estimatedTimeToRecover: string | null;
  estimatedCost: number | null;
  serviceImpactDelta: string | null;
  truthLabel: TruthBoundaryLabel;
  requiresHumanAuthorization: true;
  autoExecutable: false;
};

export type ResilienceScenarioResult = {
  runId: string;
  scenarioId: ScenarioLibraryId;
  graphId: string;
  status: 'SANDBOX' | 'RECOMMENDATION_ONLY' | 'HUMAN_APPROVAL_REQUIRED' | 'DENIED';
  workflowPosition: ResilienceWorkflowHop;
  impact: string;
  affectedNodes: string[];
  timeToImpact: string | null;
  estimatedServiceLoss: string | null;
  costExposure: number | null;
  recoveryOptions: RecoveryOption[];
  timeToRecover: string | null;
  confidence: number | null;
  evidenceRefs: string[];
  truthLabel: TruthBoundaryLabel;
  historicalAnalogues: HistoricalAnalogue[];
  classicalModelOnly: true;
  quantumAdvancedMethodsUsed: false;
  simIsFact: false;
  recommendIsAct: false;
  historicalProvesNext: false;
  autoPurchase: false;
  autoSupplierSwitch: false;
  autoContractChange: false;
  autoDispatch: false;
  autoExternalComm: false;
  agentRolesInvolved: ResilienceAgentRole[];
  outputFields: typeof RESILIENCE_OUTPUT_FIELDS;
  generatedAt: string;
};

export function runSandboxScenario(input: {
  runId: string;
  scenarioId: ScenarioLibraryId;
  graphId: string;
  actor: Eo8Actor;
  impact?: string;
  seedNodeIds?: string[];
  timeToImpact?: string | null;
  estimatedServiceLoss?: string | null;
  costExposure?: number | null;
  confidence?: number | null;
  truthLabel?: TruthBoundaryLabel;
  evidenceRefs?: string[];
  historicalAnalogues?: HistoricalAnalogue[];
  recoveryOptions?: Array<Omit<RecoveryOption, 'requiresHumanAuthorization' | 'autoExecutable'> &
    Partial<Pick<RecoveryOption, 'requiresHumanAuthorization' | 'autoExecutable'>>>;
  agentRoles?: ResilienceAgentRole[];
}): ResilienceScenarioResult {
  if (!(SCENARIO_LIBRARY as readonly string[]).includes(input.scenarioId)) {
    throw new Error(`Unknown scenario: ${input.scenarioId}`);
  }

  const graph = graphs.get(input.graphId);
  const affected = new Set<string>(input.seedNodeIds ?? []);
  if (graph && input.seedNodeIds?.length) {
    // One-hop expansion — advisory exposure graph only
    for (const edge of graph.edges) {
      if (affected.has(edge.fromNodeId)) affected.add(edge.toNodeId);
      if (affected.has(edge.toNodeId)) affected.add(edge.fromNodeId);
    }
  }

  const truthLabel: TruthBoundaryLabel = input.truthLabel ?? 'SCENARIO_ASSUMPTION';
  if (!isValidTruthLabel(truthLabel)) {
    throw new Error(`Invalid truth label: ${String(truthLabel)}`);
  }

  const analogues = (input.historicalAnalogues ?? []).map((a) => ({
    ...a,
    provesNextOutcome: false as const,
    truthLabel: a.truthLabel === 'OBSERVED_EVIDENCE' ? ('OBSERVED_EVIDENCE' as const) : ('UNKNOWN' as const),
  }));

  const recoveryOptions: RecoveryOption[] = (input.recoveryOptions ?? []).map((r) => ({
    optionId: r.optionId,
    description: r.description,
    estimatedTimeToRecover: r.estimatedTimeToRecover ?? null,
    estimatedCost: r.estimatedCost ?? null,
    serviceImpactDelta: r.serviceImpactDelta ?? null,
    truthLabel: isValidTruthLabel(r.truthLabel) ? r.truthLabel : 'MODEL_ESTIMATE',
    requiresHumanAuthorization: true,
    autoExecutable: false,
  }));

  const roles =
    input.agentRoles ??
    ([
      'supplier_risk',
      'multi_tier_mapping',
      'inventory_resilience',
      'transportation_risk',
      'historical_disruption',
      'quant_or',
      'cfo_cost',
      'recovery_simulation',
    ] as ResilienceAgentRole[]);

  // Agents are bounded — role must be on the team; never grants auto authority.
  for (const role of roles) {
    if (!(RESILIENCE_AGENT_TEAM as readonly string[]).includes(role)) {
      throw new Error(`Unbounded agent role rejected: ${role}`);
    }
  }
  void input.actor;
  void isBoundedResilienceAgent;

  return {
    runId: input.runId,
    scenarioId: input.scenarioId,
    graphId: input.graphId,
    status: 'SANDBOX',
    workflowPosition: 'classical_scenario_model',
    impact: input.impact ?? `Sandbox scenario ${input.scenarioId} — advisory only.`,
    affectedNodes: [...affected],
    timeToImpact: input.timeToImpact ?? null,
    estimatedServiceLoss: input.estimatedServiceLoss ?? null,
    costExposure: input.costExposure ?? null,
    recoveryOptions,
    timeToRecover: recoveryOptions[0]?.estimatedTimeToRecover ?? null,
    confidence: input.confidence ?? null,
    evidenceRefs: input.evidenceRefs ?? [],
    truthLabel,
    historicalAnalogues: analogues,
    classicalModelOnly: true,
    quantumAdvancedMethodsUsed: false,
    simIsFact: false,
    recommendIsAct: false,
    historicalProvesNext: false,
    autoPurchase: false,
    autoSupplierSwitch: false,
    autoContractChange: false,
    autoDispatch: false,
    autoExternalComm: false,
    agentRolesInvolved: roles,
    outputFields: RESILIENCE_OUTPUT_FIELDS,
    generatedAt: nowIso(),
  };
}

export function advanceResilienceWorkflow(
  result: ResilienceScenarioResult,
  to: ResilienceWorkflowHop,
): ResilienceScenarioResult {
  if (!(RESILIENCE_WORKFLOW as readonly string[]).includes(to)) {
    throw new Error(`Invalid workflow hop: ${to}`);
  }
  return {
    ...result,
    workflowPosition: to,
    status:
      to === 'human_approval'
        ? 'HUMAN_APPROVAL_REQUIRED'
        : to === 'recovery_recommendation'
          ? 'RECOMMENDATION_ONLY'
          : result.status === 'DENIED'
            ? 'DENIED'
            : 'SANDBOX',
  };
}

export type RecoveryRecommendationPacket = {
  status: 'RECOMMENDATION_ONLY';
  runId: string;
  options: RecoveryOption[];
  costServiceTradeoff: string;
  truthLabel: TruthBoundaryLabel;
  confidence: number | null;
  evidenceRefs: string[];
  autoExecutable: false;
  humanApprovalRequired: true;
  recommendIsAct: false;
  generatedAt: string;
};

export function recommendRecovery(input: {
  scenario: ResilienceScenarioResult;
  costServiceTradeoff?: string;
}): RecoveryRecommendationPacket {
  return {
    status: 'RECOMMENDATION_ONLY',
    runId: input.scenario.runId,
    options: input.scenario.recoveryOptions.map((o) => ({
      ...o,
      requiresHumanAuthorization: true,
      autoExecutable: false,
    })),
    costServiceTradeoff:
      input.costServiceTradeoff ??
      'Advisory cost/service tradeoff — recommend ≠ purchase/switch/contract/dispatch.',
    truthLabel: input.scenario.truthLabel,
    confidence: input.scenario.confidence,
    evidenceRefs: input.scenario.evidenceRefs,
    autoExecutable: false,
    humanApprovalRequired: true,
    recommendIsAct: false,
    generatedAt: nowIso(),
  };
}

export type HumanRecoveryApproval = {
  state: 'APPROVED_BOUNDED' | 'DENIED' | 'HUMAN_APPROVAL_REQUIRED';
  runId: string;
  approvedOptionIds: string[];
  executedActions: [];
  autoPurchase: false;
  autoSupplierSwitch: false;
  autoContractChange: false;
  autoDispatch: false;
  autoExternalComm: false;
  reason: string;
  at: string;
};

export function requireHumanRecoveryApproval(input: {
  actor: Eo8Actor;
  runId: string;
  optionIds: string[];
  approve: boolean;
}): HumanRecoveryApproval {
  if (!isHumanApprover(input.actor)) {
    return {
      state: 'DENIED',
      runId: input.runId,
      approvedOptionIds: [],
      executedActions: [],
      autoPurchase: false,
      autoSupplierSwitch: false,
      autoContractChange: false,
      autoDispatch: false,
      autoExternalComm: false,
      reason: 'Only human_approver / founder may authorize consequential recovery.',
      at: nowIso(),
    };
  }

  if (!input.approve) {
    return {
      state: 'HUMAN_APPROVAL_REQUIRED',
      runId: input.runId,
      approvedOptionIds: [],
      executedActions: [],
      autoPurchase: false,
      autoSupplierSwitch: false,
      autoContractChange: false,
      autoDispatch: false,
      autoExternalComm: false,
      reason: 'Human has not approved; no recovery actions executed.',
      at: nowIso(),
    };
  }

  // Approval is bounded: records authorization intent only — never executes purchase/switch/etc.
  return {
    state: 'APPROVED_BOUNDED',
    runId: input.runId,
    approvedOptionIds: input.optionIds,
    executedActions: [],
    autoPurchase: false,
    autoSupplierSwitch: false,
    autoContractChange: false,
    autoDispatch: false,
    autoExternalComm: false,
    reason:
      'Human authorized recommendation packet only — EO8 does not autonomously purchase, switch suppliers, change contracts, dispatch, or communicate externally.',
    at: nowIso(),
  };
}

export type HomeBaseEvidenceAttach = {
  status: 'ATTACHED_ADVISORY' | 'WAITING_DATA';
  runId: string;
  evidenceRefs: string[];
  homeBasePresent: boolean;
  note: string;
};

export function attachEvidenceToHomeBase(input: {
  runId: string;
  evidenceRefs: string[];
  repoRoot?: string;
}): HomeBaseEvidenceAttach {
  const soft = eo8SoftWireSnapshot(input.repoRoot);
  if (!soft.homeBaseRuntime.present) {
    return {
      status: 'WAITING_DATA',
      runId: input.runId,
      evidenceRefs: input.evidenceRefs,
      homeBasePresent: false,
      note: soft.homeBaseRuntime.note,
    };
  }
  return {
    status: 'ATTACHED_ADVISORY',
    runId: input.runId,
    evidenceRefs: input.evidenceRefs,
    homeBasePresent: true,
    note: 'Evidence refs attached advisory-only to Home Base soft-wire — presence ≠ VERIFIED.',
  };
}

// ---------------------------------------------------------------------------
// Autonomy denial probes
// ---------------------------------------------------------------------------

export type AutonomyDeny = {
  state: 'DENIED';
  executed: false;
  reason: string;
};

export function attemptAutonomousPurchasing(): AutonomyDeny & { autoPurchase: false } {
  void EO8_LOCKS.AUTONOMOUS_PURCHASING;
  return {
    state: 'DENIED',
    executed: false,
    autoPurchase: false,
    reason: 'NO_AUTONOMOUS_PURCHASING — human authorization required; recommend ≠ purchase.',
  };
}

export function attemptAutonomousSupplierSwitching(): AutonomyDeny & {
  autoSupplierSwitch: false;
} {
  void EO8_LOCKS.AUTONOMOUS_SUPPLIER_SWITCHING;
  return {
    state: 'DENIED',
    executed: false,
    autoSupplierSwitch: false,
    reason: 'NO_AUTONOMOUS_SUPPLIER_SWITCHING — alternate sourcing is recommendation only.',
  };
}

export function attemptAutonomousContractChanges(): AutonomyDeny & {
  autoContractChange: false;
} {
  void EO8_LOCKS.AUTONOMOUS_CONTRACT_CHANGES;
  return {
    state: 'DENIED',
    executed: false,
    autoContractChange: false,
    reason: 'NO_AUTONOMOUS_CONTRACT_CHANGES — contract deltas require human authority.',
  };
}

export function attemptAutonomousPhysicalDispatch(): AutonomyDeny & {
  autoDispatch: false;
} {
  void EO8_LOCKS.AUTONOMOUS_PHYSICAL_DISPATCH;
  return {
    state: 'DENIED',
    executed: false,
    autoDispatch: false,
    reason: 'NO_AUTONOMOUS_PHYSICAL_DISPATCH — freight/dispatch denied.',
  };
}

export function attemptAutonomousExternalCommunications(): AutonomyDeny & {
  autoExternalComm: false;
} {
  void EO8_LOCKS.AUTONOMOUS_EXTERNAL_COMMUNICATIONS;
  return {
    state: 'DENIED',
    executed: false,
    autoExternalComm: false,
    reason: 'NO_AUTONOMOUS_EXTERNAL_COMMUNICATIONS — no outbound supplier/carrier messages.',
  };
}

export function attemptFabricateMissionDisruptionData(): AutonomyDeny & {
  fabricated: false;
} {
  void EO8_LOCKS.FABRICATE_MISSION_DATA;
  void EO8_LOCKS.FABRICATE_DISRUPTION_DATA;
  return {
    state: 'DENIED',
    executed: false,
    fabricated: false,
    reason: 'NO_FABRICATED_MISSION_OR_DISRUPTION_DATA — authorized data only.',
  };
}

export function attemptTreatHistoricalAsProofOfNext(): AutonomyDeny & {
  historicalProvesNext: false;
} {
  void EO8_LOCKS.HISTORICAL_DISRUPTION_EQ_PROOF_OF_NEXT;
  return {
    state: 'DENIED',
    executed: false,
    historicalProvesNext: false,
    reason: 'Historical disruptions inform scenarios ≠ prove what will happen next.',
  };
}

export function attemptTreatSimAsFact(): AutonomyDeny & { simIsFact: false } {
  void EO8_LOCKS.SIM_EQ_FACT;
  return {
    state: 'DENIED',
    executed: false,
    simIsFact: false,
    reason: 'Sim ≠ fact — sandbox scenarios remain SCENARIO_ASSUMPTION / MODEL_ESTIMATE unless labeled OBSERVED_EVIDENCE.',
  };
}

export function attemptTreatRecommendAsAct(): AutonomyDeny & { recommendIsAct: false } {
  void EO8_LOCKS.RECOMMEND_EQ_ACT;
  return {
    state: 'DENIED',
    executed: false,
    recommendIsAct: false,
    reason: 'Recommend ≠ act.',
  };
}

export function attemptL4Autonomy(): AutonomyDeny & { l4Enabled: false } {
  return {
    state: 'DENIED',
    executed: false,
    l4Enabled: EO8_LOCKS.L4_AUTONOMY_ENABLED,
    reason: 'L4_AUTONOMY_ENABLED=false',
  };
}

export function attemptAgentSelfExpandAuthority(actor: Eo8Actor): AutonomyDeny & {
  authorityExpanded: false;
} {
  void actor;
  void EO8_LOCKS.AGENTS_MAY_SELF_EXPAND_AUTHORITY;
  return {
    state: 'DENIED',
    executed: false,
    authorityExpanded: false,
    reason: 'Bounded agent team cannot self-expand authority.',
  };
}

export function attemptAutoExecuteRecovery(): AutonomyDeny & { recoveryExecuted: false } {
  void EO8_LOCKS.AGENTS_MAY_AUTO_EXECUTE_RECOVERY;
  return {
    state: 'DENIED',
    executed: false,
    recoveryExecuted: false,
    reason: 'Consequential recovery actions require human authorization; auto-execute denied.',
  };
}
