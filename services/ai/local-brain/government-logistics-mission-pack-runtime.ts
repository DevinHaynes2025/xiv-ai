/**
 * 62L-EO7 — Government Logistics Mission Pack runtime.
 *
 * Mission registration → evidence intake → baseline → bottleneck → classical OR →
 * simulation → scenario compare → recommendation → human authorization.
 * Agents return evidence to Home Base; no purchasing/dispatch/contract authority.
 */

import {
  EO7_DB_CANDIDATES_STATUS,
  EO7_LOCKS,
  EO7_MAY,
  EO7_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOVERNMENT_LOGISTICS_MISSION_PACK_CYCLE,
  HONESTY_BANNER,
  LOGISTICS_AGENT_BOUNDS,
  LOGISTICS_AGENT_TEAM,
  LOGISTICS_KPI_KEYS,
  LOGISTICS_MISSION_AREAS,
  LOGISTICS_MISSION_CORE_FLOW,
  LOGISTICS_PROBLEM_FIELDS,
  NEXT_PHASE_TITLE,
  QUANTUM_CLAIM_STATES,
  QUANTUM_COMPARISON_LADDER,
  assertEo7LocksIntact,
  eo7SoftWireSnapshot,
  isHumanApprover,
  isLogisticsAgent,
  type Eo7Actor,
  type Eo7EvidenceState,
  type Eo7HopRecord,
  type Eo7SoftWireSnapshot,
  type LogisticsAgentRole,
  type LogisticsKpiKey,
  type LogisticsKpiValue,
  type LogisticsMissionArea,
  type LogisticsMissionFlowHop,
  type QuantumClaimState,
  type QuantumComparisonRung,
} from './government-logistics-mission-pack-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof GOVERNMENT_LOGISTICS_MISSION_PACK_CYCLE)[number],
  state: Eo7EvidenceState,
  summary: string,
): Eo7HopRecord {
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

// ---------------------------------------------------------------------------
// Isolation / guardian
// ---------------------------------------------------------------------------

export function assertTenantUniverseIsolation(input: {
  actor: Eo7Actor;
  missionTenantId: string;
  missionUniverseId: string;
}): true | DenialResult {
  if (
    input.actor.tenantId !== input.missionTenantId ||
    input.actor.universeId !== input.missionUniverseId
  ) {
    return deny(
      'GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION — cross-tenant/universe logistics access DENIED.',
    );
  }
  void EO7_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE;
  return true;
}

// ---------------------------------------------------------------------------
// A — Mission registration (no fabricated / classified assumptions)
// ---------------------------------------------------------------------------

export type LogisticsProblemRecord = {
  missionId: string;
  agencyOrganizationScope: string;
  assetsFacilities: string[];
  suppliers: string[];
  inventory: string[];
  routes: string[];
  capacity: string[];
  leadTimes: string[];
  serviceTargets: string[];
  costConstraints: string[];
  riskFactors: string[];
  dataRights: string;
  baselineKpis: LogisticsKpiValue[];
  scenarioAssumptions: string[];
  approvalState: 'draft' | 'awaiting_human' | 'human_authorized' | 'denied';
  missionAreas: LogisticsMissionArea[];
  evidenceClass: 'authorized_public' | 'licensed' | 'operator_provided' | 'unknown';
  fabricated: false;
  classifiedAssumed: false;
  assumptionsExposed: string[];
  uncertaintyNotes: string[];
  complianceNote: 'solicitation_specific';
  orgId: string;
  tenantId: string;
  universeId: string;
  state: 'REGISTERED';
};

export function registerLogisticsMission(input: {
  actor: Eo7Actor;
  missionId: string;
  agencyOrganizationScope: string;
  missionAreas: LogisticsMissionArea[];
  assetsFacilities?: string[];
  suppliers?: string[];
  inventory?: string[];
  routes?: string[];
  capacity?: string[];
  leadTimes?: string[];
  serviceTargets?: string[];
  costConstraints?: string[];
  riskFactors?: string[];
  dataRights?: string;
  scenarioAssumptions?: string[];
  evidenceClass?: LogisticsProblemRecord['evidenceClass'];
  fabricateMissionData?: boolean;
  assumeClassifiedData?: boolean;
  hideAssumptions?: boolean;
  claimUniversalCompliance?: boolean;
}): LogisticsProblemRecord | DenialResult {
  const iso = assertTenantUniverseIsolation({
    actor: input.actor,
    missionTenantId: input.actor.tenantId,
    missionUniverseId: input.actor.universeId,
  });
  if (iso !== true) return iso;

  if (input.fabricateMissionData === true) {
    void EO7_LOCKS.FABRICATE_MISSION_DATA;
    return deny(
      'NO_FABRICATED_MISSION_DATA — logistics missions require real or labeled fixture evidence.',
    );
  }
  if (input.assumeClassifiedData === true) {
    void EO7_LOCKS.CLASSIFIED_DATA_ASSUMPTIONS;
    return deny(
      'NO_CLASSIFIED_DATA_ASSUMPTIONS — classified logistics data excluded unless separately authorized.',
    );
  }
  if (input.hideAssumptions === true) {
    void EO7_LOCKS.HIDE_ASSUMPTIONS_OR_UNCERTAINTY;
    return deny(
      'ASSUMPTIONS_AND_UNCERTAINTY_MUST_BE_EXPOSED — hidden assumptions DENIED.',
    );
  }
  if (input.claimUniversalCompliance === true) {
    void EO7_LOCKS.UNIVERSAL_COMPLIANCE_WITHOUT_SOLICITATION;
    return deny(
      'COMPLIANCE_SOLICITATION_SPECIFIC — government compliance requirements remain solicitation-specific.',
    );
  }
  if (!input.missionId?.trim() || !input.agencyOrganizationScope?.trim()) {
    return deny('missionId and agencyOrganizationScope are required.');
  }
  if (!input.missionAreas?.length) {
    return deny('At least one logistics mission area is required.');
  }
  for (const area of input.missionAreas) {
    if (!(LOGISTICS_MISSION_AREAS as readonly string[]).includes(area)) {
      return deny(`Unknown logistics mission area: ${area}`);
    }
  }

  const assumptions = [
    ...(input.scenarioAssumptions ?? []),
    'Baseline KPIs may be incomplete until evidence intake completes.',
  ];

  return {
    missionId: input.missionId,
    agencyOrganizationScope: input.agencyOrganizationScope,
    assetsFacilities: [...(input.assetsFacilities ?? [])],
    suppliers: [...(input.suppliers ?? [])],
    inventory: [...(input.inventory ?? [])],
    routes: [...(input.routes ?? [])],
    capacity: [...(input.capacity ?? [])],
    leadTimes: [...(input.leadTimes ?? [])],
    serviceTargets: [...(input.serviceTargets ?? [])],
    costConstraints: [...(input.costConstraints ?? [])],
    riskFactors: [...(input.riskFactors ?? [])],
    dataRights: input.dataRights ?? 'operator_provided_rights_pending_review',
    baselineKpis: [],
    scenarioAssumptions: assumptions,
    approvalState: 'draft',
    missionAreas: [...input.missionAreas],
    evidenceClass: input.evidenceClass ?? 'operator_provided',
    fabricated: false,
    classifiedAssumed: false,
    assumptionsExposed: assumptions,
    uncertaintyNotes: [
      'Uncertainty remains until baselines and evidence provenance are attached.',
    ],
    complianceNote: 'solicitation_specific',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    state: 'REGISTERED',
  };
}

// ---------------------------------------------------------------------------
// Evidence intake + KPI baseline
// ---------------------------------------------------------------------------

export type EvidenceIntakeResult = {
  missionId: string;
  accepted: true;
  evidenceRefs: string[];
  flowHop: LogisticsMissionFlowHop;
  state: 'REGISTERED';
};

export function intakeLogisticsEvidence(input: {
  mission: LogisticsProblemRecord;
  evidenceRefs: string[];
  unauthorized?: boolean;
  classifiedUnauthorized?: boolean;
}): EvidenceIntakeResult | DenialResult {
  if (input.unauthorized === true || input.classifiedUnauthorized === true) {
    return deny(
      'AUTHORIZED_EVIDENCE_ONLY — unauthorized or classified-unauthorized intake DENIED.',
    );
  }
  if (!input.evidenceRefs?.length) {
    return deny('Evidence intake requires at least one evidence reference.');
  }
  return {
    missionId: input.mission.missionId,
    accepted: true,
    evidenceRefs: [...input.evidenceRefs],
    flowHop: 'data_evidence_intake',
    state: 'REGISTERED',
  };
}

export function attachBaselineKpis(input: {
  mission: LogisticsProblemRecord;
  kpis: Array<{
    key: LogisticsKpiKey;
    value: number | null;
    unit: string;
    uncertaintyNote: string;
  }>;
}): LogisticsProblemRecord | DenialResult {
  for (const k of input.kpis) {
    if (!(LOGISTICS_KPI_KEYS as readonly string[]).includes(k.key)) {
      return deny(`Unknown KPI key: ${k.key}`);
    }
  }
  const baselineKpis: LogisticsKpiValue[] = input.kpis.map((k) => ({
    key: k.key,
    value: k.value,
    unit: k.unit,
    source: 'baseline',
    uncertaintyNote: k.uncertaintyNote,
    isSimulated: false,
  }));
  return {
    ...input.mission,
    baselineKpis,
    uncertaintyNotes: [
      ...input.mission.uncertaintyNotes,
      ...baselineKpis.map((k) => `${k.key}: ${k.uncertaintyNote}`),
    ],
  };
}

// ---------------------------------------------------------------------------
// Bottleneck / root cause — correlation ≠ causation
// ---------------------------------------------------------------------------

export type BottleneckAnalysis = {
  missionId: string;
  observedCorrelation: string;
  causalClaimAllowed: false;
  labeledAs: 'correlation_hypothesis';
  uncertaintyNote: string;
  flowHop: LogisticsMissionFlowHop;
  state: 'ADVISORY_ONLY';
};

export function analyzeBottleneckRootCause(input: {
  missionId: string;
  observedCorrelation: string;
  assertCausation?: boolean;
}): BottleneckAnalysis | DenialResult {
  if (input.assertCausation === true) {
    void EO7_LOCKS.CORRELATION_EQ_CAUSATION;
    return deny(
      'CORRELATION_NEQ_CAUSATION — root-cause pathways must remain labeled hypotheses unless separately evidenced.',
    );
  }
  return {
    missionId: input.missionId,
    observedCorrelation: input.observedCorrelation,
    causalClaimAllowed: false,
    labeledAs: 'correlation_hypothesis',
    uncertaintyNote:
      'Observed association is not proof of causation; treat as hypothesis for classical OR follow-up.',
    flowHop: 'bottleneck_root_cause',
    state: 'ADVISORY_ONLY',
  };
}

// ---------------------------------------------------------------------------
// Classical optimization + simulation (sim ≠ fact)
// ---------------------------------------------------------------------------

export type ClassicalOrResult = {
  missionId: string;
  method: 'classical_or';
  objective: string;
  recommendationSummary: string;
  assumptionsExposed: string[];
  uncertaintyNotes: string[];
  flowHop: LogisticsMissionFlowHop;
  state: 'ADVISORY_ONLY';
  autoApplied: false;
};

export function runClassicalOptimization(input: {
  missionId: string;
  objective: string;
  assumptions: string[];
}): ClassicalOrResult {
  return {
    missionId: input.missionId,
    method: 'classical_or',
    objective: input.objective,
    recommendationSummary: `Classical OR advisory for ${input.objective} — recommend only; not auto-applied.`,
    assumptionsExposed: [...input.assumptions],
    uncertaintyNotes: [
      'Classical OR outputs are model-dependent; human authorization required before action.',
    ],
    flowHop: 'classical_optimization',
    state: 'ADVISORY_ONLY',
    autoApplied: false,
  };
}

export type SimulationResult = {
  missionId: string;
  method: 'advanced_agentic_simulation';
  scenarioId: string;
  simulatedKpis: LogisticsKpiValue[];
  simEqFact: false;
  assumptionsExposed: string[];
  flowHop: LogisticsMissionFlowHop;
  state: 'SIMULATED';
};

export function runAgenticSimulation(input: {
  missionId: string;
  scenarioId: string;
  simulatedKpis: Array<{
    key: LogisticsKpiKey;
    value: number | null;
    unit: string;
    uncertaintyNote: string;
  }>;
  treatSimAsFact?: boolean;
}): SimulationResult | DenialResult {
  if (input.treatSimAsFact === true) {
    void EO7_LOCKS.SIM_EQ_FACT;
    return deny(
      'SIM_NEQ_FACT — simulation outputs are labeled SIMULATED and are not measured fact.',
    );
  }
  return {
    missionId: input.missionId,
    method: 'advanced_agentic_simulation',
    scenarioId: input.scenarioId,
    simulatedKpis: input.simulatedKpis.map((k) => ({
      key: k.key,
      value: k.value,
      unit: k.unit,
      source: 'simulated' as const,
      uncertaintyNote: k.uncertaintyNote,
      isSimulated: true,
    })),
    simEqFact: false,
    assumptionsExposed: [
      `Scenario ${input.scenarioId} assumptions must remain visible to approvers.`,
    ],
    flowHop: 'advanced_agentic_simulation',
    state: 'SIMULATED',
  };
}

export type ScenarioComparison = {
  missionId: string;
  scenarioIds: string[];
  comparisonNotes: string[];
  assumptionsExposed: string[];
  flowHop: LogisticsMissionFlowHop;
  state: 'ADVISORY_ONLY';
};

export function compareScenarios(input: {
  missionId: string;
  scenarioIds: string[];
  notes?: string[];
}): ScenarioComparison | DenialResult {
  if (!input.scenarioIds?.length || input.scenarioIds.length < 2) {
    return deny('Scenario comparison requires at least two scenarioIds.');
  }
  return {
    missionId: input.missionId,
    scenarioIds: [...input.scenarioIds],
    comparisonNotes: input.notes ?? [
      'Scenario comparison is advisory; ranking ≠ authorization to act.',
    ],
    assumptionsExposed: [
      'Each scenario retains its own uncertainty and data-rights constraints.',
    ],
    flowHop: 'scenario_comparison',
    state: 'ADVISORY_ONLY',
  };
}

// ---------------------------------------------------------------------------
// Recommendation → human authorization (recommend ≠ act)
// ---------------------------------------------------------------------------

export type LogisticsRecommendation = {
  missionId: string;
  summary: string;
  assumptionsExposed: string[];
  uncertaintyNotes: string[];
  recommendEqAct: false;
  autoDispatch: false;
  autoPurchase: false;
  autoCommit: false;
  approvalState: 'awaiting_human';
  flowHop: LogisticsMissionFlowHop;
  state: 'ADVISORY_ONLY';
};

export function issueLogisticsRecommendation(input: {
  missionId: string;
  summary: string;
  assumptionsExposed: string[];
  uncertaintyNotes: string[];
  treatRecommendAsAct?: boolean;
}): LogisticsRecommendation | DenialResult {
  if (input.treatRecommendAsAct === true) {
    void EO7_LOCKS.RECOMMEND_EQ_ACT;
    return deny(
      'RECOMMEND_NEQ_ACT — recommendations require explicit human authorization before dispatch/purchase/commit.',
    );
  }
  if (!input.assumptionsExposed?.length || !input.uncertaintyNotes?.length) {
    return deny(
      'ASSUMPTIONS_AND_UNCERTAINTY_MUST_BE_EXPOSED — recommendation packets incomplete.',
    );
  }
  return {
    missionId: input.missionId,
    summary: input.summary,
    assumptionsExposed: [...input.assumptionsExposed],
    uncertaintyNotes: [...input.uncertaintyNotes],
    recommendEqAct: false,
    autoDispatch: false,
    autoPurchase: false,
    autoCommit: false,
    approvalState: 'awaiting_human',
    flowHop: 'recommendation',
    state: 'ADVISORY_ONLY',
  };
}

export type HumanAuthorizationResult =
  | {
      missionId: string;
      authorized: true;
      approvalState: 'human_authorized';
      flowHop: LogisticsMissionFlowHop;
      state: 'HUMAN_GATE';
      stillNoAutoDispatch: true;
      stillNoAutoPurchase: true;
      stillNoAutoCommit: true;
    }
  | DenialResult;

export function requireHumanAuthorization(input: {
  actor: Eo7Actor;
  missionId: string;
  recommendation: LogisticsRecommendation;
}): HumanAuthorizationResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_AUTHORIZATION_REQUIRED — logistics agents cannot self-authorize consequential actions.',
    );
  }
  void input.recommendation;
  void EO7_LOCKS.HUMAN_AUTHORIZATION_REQUIRED_FOR_DISPATCH_PURCHASE_COMMIT;
  return {
    missionId: input.missionId,
    authorized: true,
    approvalState: 'human_authorized',
    flowHop: 'human_authorization',
    state: 'HUMAN_GATE',
    stillNoAutoDispatch: true,
    stillNoAutoPurchase: true,
    stillNoAutoCommit: true,
  };
}

// ---------------------------------------------------------------------------
// Agent team — evidence to Home Base; no authority
// ---------------------------------------------------------------------------

export type AgentEvidencePacket = {
  agentRole: LogisticsAgentRole;
  missionId: string;
  evidenceSummary: string;
  returnedToHomeBase: true;
  automaticPurchasing: false;
  automaticDispatch: false;
  automaticContractAuthority: false;
  state: 'ADVISORY_ONLY';
};

export function returnAgentEvidenceToHomeBase(input: {
  actor: Eo7Actor;
  missionId: string;
  evidenceSummary: string;
  attemptPurchase?: boolean;
  attemptDispatch?: boolean;
  attemptContract?: boolean;
}): AgentEvidencePacket | DenialResult {
  if (!isLogisticsAgent(input.actor)) {
    return deny('Only bounded logistics agents may return pack evidence via this path.');
  }
  if (input.attemptPurchase === true) {
    void EO7_LOCKS.AGENT_AUTO_PURCHASING;
    return deny(
      'NO_AGENT_PURCHASING_AUTHORITY — Logistics agents cannot autonomously purchase.',
    );
  }
  if (input.attemptDispatch === true) {
    void EO7_LOCKS.AGENT_AUTO_DISPATCH;
    return deny(
      'NO_AGENT_DISPATCH_AUTHORITY — Logistics agents cannot autonomously dispatch shipments.',
    );
  }
  if (input.attemptContract === true) {
    void EO7_LOCKS.AGENT_AUTO_CONTRACT;
    return deny(
      'NO_AGENT_CONTRACT_AUTHORITY — Logistics agents cannot make supplier/contract commitments.',
    );
  }

  void LOGISTICS_AGENT_BOUNDS;
  return {
    agentRole: input.actor.kind as LogisticsAgentRole,
    missionId: input.missionId,
    evidenceSummary: input.evidenceSummary,
    returnedToHomeBase: true,
    automaticPurchasing: false,
    automaticDispatch: false,
    automaticContractAuthority: false,
    state: 'ADVISORY_ONLY',
  };
}

// ---------------------------------------------------------------------------
// Quantum / EO6 classical-baseline gate
// ---------------------------------------------------------------------------

export type QuantumComparisonRequest = {
  missionId: string;
  rung: QuantumComparisonRung;
  claimState: QuantumClaimState;
  eo6ClassicalBaselineVerified: boolean;
  physicalQpuVerified?: boolean;
};

export type QuantumComparisonResult = {
  missionId: string;
  rung: QuantumComparisonRung;
  claimState: QuantumClaimState;
  allowed: true;
  classicalBaselineAttached: true;
  note: string;
  state: 'ADVISORY_ONLY' | 'THEORETICAL' | 'SIMULATED';
};

export function compareQuantumLadder(
  input: QuantumComparisonRequest,
): QuantumComparisonResult | DenialResult {
  if (!(QUANTUM_COMPARISON_LADDER as readonly string[]).includes(input.rung)) {
    return deny(`Unknown quantum comparison rung: ${input.rung}`);
  }
  if (!(QUANTUM_CLAIM_STATES as readonly string[]).includes(input.claimState)) {
    return deny(`Unknown quantum claim state: ${input.claimState}`);
  }

  // Classical OR / heuristics / ML never require QPU verification, but still
  // cannot claim quantum advantage without EO6 baseline when rung is quantum-*.
  const quantumRung =
    input.rung === 'quantum_inspired' || input.rung === 'physical_qpu';

  if (quantumRung && input.eo6ClassicalBaselineVerified !== true) {
    void EO7_LOCKS.QUANTUM_WITHOUT_EO6_CLASSICAL_BASELINE;
    return deny(
      'EO6_CLASSICAL_BASELINE_REQUIRED — no quantum claim can bypass the EO6 classical-baseline gate.',
    );
  }

  if (input.rung === 'physical_qpu') {
    if (input.physicalQpuVerified !== true) {
      void EO7_LOCKS.PHYSICAL_QPU_WITHOUT_VERIFICATION;
      return deny(
        'PHYSICAL_QPU_ONLY_IF_VERIFIED — physical QPU comparison denied without verified backend evidence.',
      );
    }
    if (input.claimState !== 'PHYSICAL_QPU_VERIFIED') {
      return deny(
        'PHYSICAL_QPU_CLAIM_MISMATCH — rung physical_qpu requires claimState PHYSICAL_QPU_VERIFIED.',
      );
    }
  }

  if (
    input.claimState === 'PHYSICAL_QPU_VERIFIED' &&
    input.physicalQpuVerified !== true
  ) {
    return deny(
      'PHYSICAL_QPU_VERIFIED claim denied without verified physical QPU evidence.',
    );
  }

  return {
    missionId: input.missionId,
    rung: input.rung,
    claimState: input.claimState,
    allowed: true,
    classicalBaselineAttached: true,
    note:
      input.rung === 'classical_or'
        ? 'Classical OR comparison allowed (EO6-aligned baseline path).'
        : 'Non-classical comparison allowed only with EO6 classical baseline attached; advisory only.',
    state:
      input.claimState === 'THEORETICAL'
        ? 'THEORETICAL'
        : input.claimState === 'SIMULATED'
          ? 'SIMULATED'
          : 'ADVISORY_ONLY',
  };
}

// ---------------------------------------------------------------------------
// Autonomy denial helpers (tested)
// ---------------------------------------------------------------------------

export function attemptAutonomousShipmentDispatch(): DenialResult {
  void EO7_LOCKS.AUTO_SHIPMENT_DISPATCH;
  return deny(
    'NO_AUTONOMOUS_SHIPMENT_DISPATCH — logistics recommendations require human authorization.',
  );
}

export function attemptAutonomousPurchasing(): DenialResult {
  void EO7_LOCKS.AUTO_PURCHASING;
  return deny(
    'NO_AUTONOMOUS_PURCHASING — purchasing authority is human-gated.',
  );
}

export function attemptAutonomousSupplierCommitment(): DenialResult {
  void EO7_LOCKS.AUTO_SUPPLIER_COMMITMENT;
  return deny(
    'NO_AUTONOMOUS_SUPPLIER_COMMITMENTS — supplier commitments require human authorization.',
  );
}

export function attemptFabricateMissionData(): DenialResult {
  void EO7_LOCKS.FABRICATE_MISSION_DATA;
  return deny('NO_FABRICATED_MISSION_DATA — fabrication denied.');
}

export function attemptClassifiedAssumption(): DenialResult {
  void EO7_LOCKS.CLASSIFIED_DATA_ASSUMPTIONS;
  return deny('NO_CLASSIFIED_DATA_ASSUMPTIONS — classified assumptions denied.');
}

// ---------------------------------------------------------------------------
// Bootstrap + demo cycle
// ---------------------------------------------------------------------------

export function bootstrapGovernmentLogisticsMissionPack(repoRoot?: string): {
  sotIssue: typeof GITHUB_SOT_ISSUE;
  sotLabel: typeof GITHUB_SOT_LABEL;
  sotTitle: typeof GITHUB_SOT_TITLE;
  gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
  banner: typeof HONESTY_BANNER;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  dbCandidates: typeof EO7_DB_CANDIDATES_STATUS;
  softWire: Eo7SoftWireSnapshot;
  missionAreas: typeof LOGISTICS_MISSION_AREAS;
  problemFields: typeof LOGISTICS_PROBLEM_FIELDS;
  kpiKeys: typeof LOGISTICS_KPI_KEYS;
  coreFlow: typeof LOGISTICS_MISSION_CORE_FLOW;
  agentTeam: typeof LOGISTICS_AGENT_TEAM;
  agentBounds: typeof LOGISTICS_AGENT_BOUNDS;
  quantumLadder: typeof QUANTUM_COMPARISON_LADDER;
  may: typeof EO7_MAY;
  mustNot: typeof EO7_MUST_NOT;
  hops: Eo7HopRecord[];
  next: typeof NEXT_PHASE_TITLE;
} {
  const locksIntact = assertEo7LocksIntact();
  const softWire = eo7SoftWireSnapshot(repoRoot);
  const hops: Eo7HopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'FAIL',
      locksIntact ? 'EO7 locks intact; L4=false.' : 'EO7 locks broken.',
    ),
  );
  hops.push(
    hop(
      'logistics_mission_pack_bootstrap',
      'PASS',
      'Government Logistics Mission Pack bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'mission_areas_encoded',
      'PASS',
      `${LOGISTICS_MISSION_AREAS.length} mission areas encoded.`,
    ),
  );
  hops.push(
    hop(
      'problem_fields_encoded',
      'PASS',
      `${LOGISTICS_PROBLEM_FIELDS.length} problem fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'kpi_schema_encoded',
      'PASS',
      `${LOGISTICS_KPI_KEYS.length} KPI keys encoded.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      'PASS',
      `Core flow: ${LOGISTICS_MISSION_CORE_FLOW.join(' → ')}`,
    ),
  );
  hops.push(
    hop(
      'agent_team_bounded',
      'PASS',
      `${LOGISTICS_AGENT_TEAM.length} agents bounded; no purchasing/dispatch/contract authority.`,
    ),
  );
  hops.push(
    hop(
      'classical_or_baseline_required',
      'PASS',
      'Classical OR baseline required before quantum-inspired / QPU claims.',
    ),
  );
  hops.push(
    hop(
      'eo6_classical_baseline_gate',
      softWire.eo6ClassicalBaselineGate.present ||
        softWire.classicalQuantBenchmark.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.eo6ClassicalBaselineGate.present
        ? softWire.eo6ClassicalBaselineGate.note
        : softWire.classicalQuantBenchmark.present
          ? softWire.classicalQuantBenchmark.note
          : 'EO6 gate absent — quantum claims still DENIED without classical baseline.',
    ),
  );
  hops.push(
    hop(
      'em1_home_base_soft_wire',
      softWire.em1HomeBaseContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.em1HomeBaseContract.note,
    ),
  );
  hops.push(
    hop(
      'eo5_quantum_evidence_boundary_soft_wire',
      softWire.eo5QuantumEvidenceBoundary.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo5QuantumEvidenceBoundary.note,
    ),
  );
  hops.push(
    hop(
      'eo6_classical_baseline_soft_wire',
      softWire.eo6ClassicalBaselineGate.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo6ClassicalBaselineGate.note,
    ),
  );
  hops.push(
    hop(
      'eo_159_mission_os_soft_wire',
      softWire.eo159MissionOsTypes.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo159MissionOsTypes.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      'NOT_APPLIED',
      `DB candidates status: ${EO7_DB_CANDIDATES_STATUS}`,
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      'PASS',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );
  hops.push(
    hop(
      'evidence',
      'PASS',
      'EO7 Government Logistics Mission Pack contracts + denial gates registered.',
    ),
  );

  return {
    sotIssue: GITHUB_SOT_ISSUE,
    sotLabel: GITHUB_SOT_LABEL,
    sotTitle: GITHUB_SOT_TITLE,
    gitlabMirrorNote: GITLAB_MIRROR_NOTE,
    banner: HONESTY_BANNER,
    locksIntact,
    l4AutonomyEnabled: false,
    dbCandidates: EO7_DB_CANDIDATES_STATUS,
    softWire,
    missionAreas: LOGISTICS_MISSION_AREAS,
    problemFields: LOGISTICS_PROBLEM_FIELDS,
    kpiKeys: LOGISTICS_KPI_KEYS,
    coreFlow: LOGISTICS_MISSION_CORE_FLOW,
    agentTeam: LOGISTICS_AGENT_TEAM,
    agentBounds: LOGISTICS_AGENT_BOUNDS,
    quantumLadder: QUANTUM_COMPARISON_LADDER,
    may: EO7_MAY,
    mustNot: EO7_MUST_NOT,
    hops,
    next: NEXT_PHASE_TITLE,
  };
}

export function runGovernmentLogisticsMissionPackDemoCycle(input: {
  actor: Eo7Actor;
  human: Eo7Actor;
}): {
  mission: LogisticsProblemRecord | DenialResult;
  evidence: EvidenceIntakeResult | DenialResult;
  baseline: LogisticsProblemRecord | DenialResult;
  bottleneck: BottleneckAnalysis | DenialResult;
  classical: ClassicalOrResult;
  simulation: SimulationResult | DenialResult;
  comparison: ScenarioComparison | DenialResult;
  recommendation: LogisticsRecommendation | DenialResult;
  authorization: HumanAuthorizationResult;
  agentEvidence: AgentEvidencePacket | DenialResult;
  quantumDenied: DenialResult | QuantumComparisonResult;
  quantumClassical: QuantumComparisonResult | DenialResult;
  dispatchDeny: DenialResult;
  purchaseDeny: DenialResult;
  commitDeny: DenialResult;
  hops: Eo7HopRecord[];
} {
  const hops: Eo7HopRecord[] = [];

  const mission = registerLogisticsMission({
    actor: input.actor,
    missionId: 'gov-log-demo-001',
    agencyOrganizationScope: 'Demo Public Logistics Agency / Region East',
    missionAreas: [
      'transportation_routing',
      'warehousing',
      'inventory_positioning',
      'spare_parts_availability',
      'readiness_service_level_analysis',
    ],
    assetsFacilities: ['Depot-A', 'Warehouse-B'],
    suppliers: ['Supplier-Public-1'],
    inventory: ['SKU-SPARE-100'],
    routes: ['Lane-East-1'],
    capacity: ['Fleet-12 trucks'],
    leadTimes: ['spare_parts_lead_time_days=14'],
    serviceTargets: ['OTIF>=0.95', 'readiness_rate>=0.90'],
    costConstraints: ['transportation_cost_cap=advisory'],
    riskFactors: ['single_source_supplier'],
    scenarioAssumptions: [
      'Fixture mission for denial/gate tests — not live operational data.',
    ],
    evidenceClass: 'operator_provided',
  });
  hops.push(
    hop(
      'mission_requirement',
      'denied' in mission ? 'DENIED' : 'REGISTERED',
      'denied' in mission ? mission.reason : mission.missionId,
    ),
  );

  const evidence =
    'denied' in mission
      ? mission
      : intakeLogisticsEvidence({
          mission,
          evidenceRefs: ['fixture://evidence/baseline-otif-2026-09'],
        });
  hops.push(
    hop(
      'data_evidence_intake',
      'denied' in evidence ? 'DENIED' : 'REGISTERED',
      'denied' in evidence ? evidence.reason : evidence.evidenceRefs.join(','),
    ),
  );

  const baseline =
    'denied' in mission
      ? mission
      : attachBaselineKpis({
          mission,
          kpis: [
            {
              key: 'otif',
              value: 0.88,
              unit: 'ratio',
              uncertaintyNote: 'Sample window uncertainty ±0.03',
            },
            {
              key: 'fill_rate',
              value: 0.91,
              unit: 'ratio',
              uncertaintyNote: 'SKU coverage incomplete',
            },
            {
              key: 'readiness_rate',
              value: 0.84,
              unit: 'ratio',
              uncertaintyNote: 'Spare-parts backlog may understate readiness',
            },
          ],
        });
  hops.push(
    hop(
      'current_state_baseline',
      'denied' in baseline ? 'DENIED' : 'REGISTERED',
      'denied' in baseline
        ? baseline.reason
        : `${baseline.baselineKpis.length} baseline KPIs`,
    ),
  );

  const bottleneck = analyzeBottleneckRootCause({
    missionId: 'gov-log-demo-001',
    observedCorrelation:
      'Higher stockout_rate correlates with single-source spare-parts lead times',
  });
  hops.push(
    hop(
      'bottleneck_root_cause',
      'denied' in bottleneck ? 'DENIED' : 'ADVISORY_ONLY',
      'denied' in bottleneck ? bottleneck.reason : bottleneck.labeledAs,
    ),
  );

  const classical = runClassicalOptimization({
    missionId: 'gov-log-demo-001',
    objective: 'improve_otif_and_readiness_under_cost_cap',
    assumptions: [
      'Demand stationary over planning horizon',
      'Fleet capacity fixed unless human-authorized change',
    ],
  });
  hops.push(
    hop('classical_optimization', 'ADVISORY_ONLY', classical.recommendationSummary),
  );

  const simulation = runAgenticSimulation({
    missionId: 'gov-log-demo-001',
    scenarioId: 'alt-sourcing-sim-1',
    simulatedKpis: [
      {
        key: 'otif',
        value: 0.94,
        unit: 'ratio',
        uncertaintyNote: 'Simulated only — not measured fact',
      },
      {
        key: 'recovery_time',
        value: 5,
        unit: 'days',
        uncertaintyNote: 'Disruption recovery under synthetic demand',
      },
    ],
  });
  hops.push(
    hop(
      'advanced_agentic_simulation',
      'denied' in simulation ? 'DENIED' : 'SIMULATED',
      'denied' in simulation ? simulation.reason : simulation.scenarioId,
    ),
  );

  const comparison = compareScenarios({
    missionId: 'gov-log-demo-001',
    scenarioIds: ['baseline-hold', 'alt-sourcing-sim-1'],
  });
  hops.push(
    hop(
      'scenario_comparison',
      'denied' in comparison ? 'DENIED' : 'ADVISORY_ONLY',
      'denied' in comparison
        ? comparison.reason
        : comparison.scenarioIds.join(' vs '),
    ),
  );

  const recommendation = issueLogisticsRecommendation({
    missionId: 'gov-log-demo-001',
    summary:
      'Recommend dual-source spare parts + rebalance warehouse safety stock; human authorization required before purchase or dispatch.',
    assumptionsExposed: [
      'Fixture assumptions only',
      'Supplier capacity unverified beyond public/operator inputs',
    ],
    uncertaintyNotes: [
      'Simulated OTIF uplift is not fact',
      'Cost-to-serve sensitivity ±15%',
    ],
  });
  hops.push(
    hop(
      'recommendation',
      'denied' in recommendation ? 'DENIED' : 'ADVISORY_ONLY',
      'denied' in recommendation ? recommendation.reason : recommendation.summary,
    ),
  );

  const authorization =
    'denied' in recommendation
      ? recommendation
      : requireHumanAuthorization({
          actor: input.human,
          missionId: 'gov-log-demo-001',
          recommendation,
        });
  hops.push(
    hop(
      'human_authorization',
      'denied' in authorization ? 'DENIED' : 'HUMAN_GATE',
      'denied' in authorization
        ? authorization.reason
        : authorization.approvalState,
    ),
  );

  const agentEvidence = returnAgentEvidenceToHomeBase({
    actor: input.actor,
    missionId: 'gov-log-demo-001',
    evidenceSummary:
      'Inventory Analyst: baseline OTIF/fill/readiness packet returned to Home Base.',
  });
  hops.push(
    hop(
      'agent_evidence_to_home_base',
      'denied' in agentEvidence ? 'DENIED' : 'ADVISORY_ONLY',
      'denied' in agentEvidence
        ? agentEvidence.reason
        : agentEvidence.agentRole,
    ),
  );

  const quantumDenied = compareQuantumLadder({
    missionId: 'gov-log-demo-001',
    rung: 'quantum_inspired',
    claimState: 'QUANTUM_INSPIRED',
    eo6ClassicalBaselineVerified: false,
  });
  hops.push(
    hop(
      'deny_quantum_without_eo6_baseline',
      'denied' in quantumDenied ? 'DENIED' : 'FAIL',
      'denied' in quantumDenied
        ? quantumDenied.reason
        : 'expected denial missing',
    ),
  );

  const quantumClassical = compareQuantumLadder({
    missionId: 'gov-log-demo-001',
    rung: 'classical_or',
    claimState: 'THEORETICAL',
    eo6ClassicalBaselineVerified: true,
  });
  hops.push(
    hop(
      'quantum_comparison_ladder',
      'denied' in quantumClassical ? 'DENIED' : 'ADVISORY_ONLY',
      'denied' in quantumClassical
        ? quantumClassical.reason
        : quantumClassical.rung,
    ),
  );

  const dispatchDeny = attemptAutonomousShipmentDispatch();
  hops.push(hop('no_autonomous_shipment_dispatch', 'DENIED', dispatchDeny.reason));
  const purchaseDeny = attemptAutonomousPurchasing();
  hops.push(hop('no_autonomous_purchasing', 'DENIED', purchaseDeny.reason));
  const commitDeny = attemptAutonomousSupplierCommitment();
  hops.push(
    hop('no_autonomous_supplier_commitments', 'DENIED', commitDeny.reason),
  );

  return {
    mission,
    evidence,
    baseline,
    bottleneck,
    classical,
    simulation,
    comparison,
    recommendation,
    authorization,
    agentEvidence,
    quantumDenied,
    quantumClassical,
    dispatchDeny,
    purchaseDeny,
    commitDeny,
    hops,
  };
}
