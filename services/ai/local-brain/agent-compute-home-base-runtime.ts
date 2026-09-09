/**
 * 62L-EM (#157) — Agent Compute Home Base runtime.
 *
 * Architecture:
 * XIV Home Base → agent mission → CPU/GPU/NPU or simulation route →
 * research/analysis → evidence → neural pathway update →
 * CFO/operations/strategy review → human decision → XIV Home Base
 *
 * Governed recommend ≠ charge/sign. Child agents do not auto-inherit
 * broader permissions. Starlink remains UNCONNECTED until credentials.
 */

import {
  AGENT_COMPUTE_HOME_BASE_CYCLE,
  EM157_DB_CANDIDATES_STATUS,
  EM157_LOCKS,
  EM157_NOT_TESTED_CLAIMS,
  ENTERPRISE_TIER_EXAMPLE_USD_PER_MONTH,
  FOUNDER_AMBITION_TRACKER,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  HONESTY_BANNER,
  LETTER_COLLISION_NOTE,
  NEXT_PHASE_AWAIT,
  assertEm157LocksIntact,
  em157SoftWireSnapshot,
  type AccessTier,
  type Em157Actor,
  type Em157EvidenceState,
  type Em157HopRecord,
  type Em157SoftWireSnapshot,
  type EvidenceClass,
  type FabricRouteKind,
  type FabricTruthState,
  type MissionKind,
  type MissionStatus,
} from './agent-compute-home-base-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(hopName: (typeof AGENT_COMPUTE_HOME_BASE_CYCLE)[number], state: Em157EvidenceState, summary: string): Em157HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

// ---------------------------------------------------------------------------
// A — Agent Compute Home Base
// ---------------------------------------------------------------------------

export type MissionRecord = {
  missionId: string;
  kind: MissionKind;
  status: MissionStatus;
  parentPermissions: readonly string[];
  childPermissions: readonly string[];
  inheritedBroaderPermissions: false;
  objective: string;
  evidence: string[];
  results: Record<string, unknown>;
  createdAt: string;
  returnedAt?: string;
};

export type BranchMissionInput = {
  missionId: string;
  kind: MissionKind;
  objective: string;
  parent: Em157Actor;
  /** Explicit subset — must not exceed parent permissions. */
  requestedChildPermissions: readonly string[];
  /** Attempt to grant permissions parent does not have → DENIED. */
  attemptBroaderInheritance?: boolean;
};

export type BranchMissionResult = {
  allowed: boolean;
  state: Em157EvidenceState;
  mission?: MissionRecord;
  reason: string;
};

export function branchMission(input: BranchMissionInput): BranchMissionResult {
  if (input.attemptBroaderInheritance === true || EM157_LOCKS.CHILD_AUTO_INHERIT_BROADER_PERMISSIONS) {
    return {
      allowed: false,
      state: 'DENIED',
      reason:
        'Child agents do NOT automatically inherit broader permissions (EM157_LOCKS.CHILD_AUTO_INHERIT_BROADER_PERMISSIONS=false).',
    };
  }

  const parentSet = new Set(input.parent.permissions);
  const illicit = input.requestedChildPermissions.filter((p) => !parentSet.has(p));
  if (illicit.length > 0) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: `Requested child permissions exceed parent set: ${illicit.join(', ')}.`,
    };
  }

  const mission: MissionRecord = {
    missionId: input.missionId,
    kind: input.kind,
    status: 'BRANCHED',
    parentPermissions: [...input.parent.permissions],
    childPermissions: [...input.requestedChildPermissions],
    inheritedBroaderPermissions: false,
    objective: input.objective,
    evidence: [],
    results: {},
    createdAt: nowIso(),
  };

  return {
    allowed: true,
    state: 'BOUNDED',
    mission,
    reason: 'Mission branched with explicit bounded child permissions; evidence return required.',
  };
}

export type ReturnEvidenceInput = {
  mission: MissionRecord;
  evidence: string[];
  results: Record<string, unknown>;
};

export function returnMissionEvidence(input: ReturnEvidenceInput): MissionRecord {
  return {
    ...input.mission,
    status: 'RETURNED',
    evidence: [...input.evidence],
    results: { ...input.results },
    returnedAt: nowIso(),
  };
}

// ---------------------------------------------------------------------------
// B — Universal CPU/GPU/NPU Fabric
// ---------------------------------------------------------------------------

export type FabricRouteRequest = {
  preferred: FabricRouteKind;
  detected?: boolean;
  runtimeEvidence?: string[];
  silentCpuFallbackOccurred?: boolean;
  claimVerifiedWithoutEvidence?: boolean;
  claimAmdVerified?: boolean;
  claimNvidiaVerified?: boolean;
  tensorrtClaimVerified?: boolean;
};

export type FabricRouteDecision = {
  route: FabricRouteKind;
  truthState: FabricTruthState;
  verified: boolean;
  cpuFallbackAvailable: true;
  tensorrtPathway: 'CANDIDATE' | 'DENIED' | 'NOT_TESTED';
  reasons: string[];
  elCeilingsApply: true;
};

export function routeComputeFabric(req: FabricRouteRequest): FabricRouteDecision {
  const reasons: string[] = [];
  const cpuFallbackAvailable = true as const;
  const elCeilingsApply = true as const;

  if (req.claimVerifiedWithoutEvidence || req.claimAmdVerified || req.claimNvidiaVerified || req.tensorrtClaimVerified) {
    reasons.push('DETECTED ≠ VERIFIED; accelerator VERIFIED denied without runtime evidence.');
    return {
      route: 'cpu_fallback',
      truthState: 'DENIED',
      verified: false,
      cpuFallbackAvailable,
      tensorrtPathway: req.preferred === 'tensorrt_candidate' ? 'DENIED' : 'NOT_TESTED',
      reasons,
      elCeilingsApply,
    };
  }

  if (req.silentCpuFallbackOccurred) {
    reasons.push('Silent CPU fallback ≠ accelerator verification (EL8 soft-wire rule).');
    return {
      route: 'cpu_fallback',
      truthState: 'NOT_TESTED',
      verified: false,
      cpuFallbackAvailable,
      tensorrtPathway: 'NOT_TESTED',
      reasons,
      elCeilingsApply,
    };
  }

  const evidence = req.runtimeEvidence ?? [];
  if (req.preferred === 'cpu') {
    return {
      route: 'cpu',
      truthState: evidence.length > 0 ? 'VERIFIED' : 'SUPPORTED',
      verified: evidence.length > 0,
      cpuFallbackAvailable,
      tensorrtPathway: 'NOT_TESTED',
      reasons: ['CPU route allowed; EL9 resource governor ceilings apply.'],
      elCeilingsApply,
    };
  }

  if (req.preferred === 'simulation_route') {
    return {
      route: 'simulation_route',
      truthState: 'CANDIDATE',
      verified: false,
      cpuFallbackAvailable,
      tensorrtPathway: 'NOT_TESTED',
      reasons: ['Simulation route is isolated; sim ≠ fact ≠ physical control.'],
      elCeilingsApply,
    };
  }

  if (req.preferred === 'tensorrt_candidate') {
    reasons.push('NVIDIA TensorRT is a candidate pathway only — NOT_TESTED until verified NVIDIA GPU + runtime evidence.');
    return {
      route: 'cpu_fallback',
      truthState: req.detected ? 'DETECTED' : 'CANDIDATE',
      verified: false,
      cpuFallbackAvailable,
      tensorrtPathway: 'CANDIDATE',
      reasons,
      elCeilingsApply,
    };
  }

  // GPU/NPU/ONNX candidates: DETECTED at most without evidence
  if (req.detected && evidence.length === 0) {
    reasons.push(`${req.preferred} DETECTED only — not VERIFIED without measured runtime evidence.`);
    return {
      route: 'cpu_fallback',
      truthState: 'DETECTED',
      verified: false,
      cpuFallbackAvailable,
      tensorrtPathway: 'NOT_TESTED',
      reasons,
      elCeilingsApply,
    };
  }

  if (evidence.length > 0) {
    return {
      route: req.preferred,
      truthState: 'VERIFIED',
      verified: true,
      cpuFallbackAvailable,
      tensorrtPathway: 'NOT_TESTED',
      reasons: [`Runtime evidence accepted for ${req.preferred}: ${evidence.join('; ')}`],
      elCeilingsApply,
    };
  }

  return {
    route: 'cpu_fallback',
    truthState: 'NOT_TESTED',
    verified: false,
    cpuFallbackAvailable,
    tensorrtPathway: 'NOT_TESTED',
    reasons: [`${req.preferred} remains NOT_TESTED; CPU fallback available; EL9 ceilings apply.`],
    elCeilingsApply,
  };
}

// ---------------------------------------------------------------------------
// C — Pricing & Negotiation Council
// ---------------------------------------------------------------------------

export type PricingRecommendation = {
  tier: AccessTier;
  monthlyUsd: number;
  costToServeUsd: number;
  measurableCustomerValueUsd: number;
  justifiedByCostAndValue: boolean;
  state: 'RECOMMENDATION_ONLY';
  autoCharge: false;
  autoSign: false;
  humanDecisionRequired: true;
  reasons: string[];
};

export type AffordabilityGuardResult = {
  allowedToRecommend: boolean;
  state: Em157EvidenceState;
  reasons: string[];
};

export function affordabilityGuard(input: {
  proposedMonthlyUsd: number;
  customerBudgetUsd: number;
  costToServeUsd: number;
}): AffordabilityGuardResult {
  const reasons: string[] = [];
  if (input.proposedMonthlyUsd > input.customerBudgetUsd) {
    reasons.push('Proposed price exceeds customer budget — affordability guard DENY recommend.');
    return { allowedToRecommend: false, state: 'DENIED', reasons };
  }
  if (input.proposedMonthlyUsd < input.costToServeUsd) {
    reasons.push('Proposed price below cost-to-serve — affordability/margin guard DENY recommend.');
    return { allowedToRecommend: false, state: 'DENIED', reasons };
  }
  return {
    allowedToRecommend: true,
    state: 'RECOMMENDATION_ONLY',
    reasons: ['Within budget and above cost-to-serve — recommendation only; human decision required.'],
  };
}

export function pricingCouncilRecommend(input: {
  tier: AccessTier;
  monthlyUsd: number;
  costToServeUsd: number;
  measurableCustomerValueUsd: number;
  customerBudgetUsd: number;
  attemptAutoCharge?: boolean;
  attemptAutoSign?: boolean;
}): PricingRecommendation | { denied: true; state: 'DENIED'; reasons: string[] } {
  if (input.attemptAutoCharge || input.attemptAutoSign) {
    return {
      denied: true,
      state: 'DENIED',
      reasons: [
        'Recommend ≠ charge/sign. AUTO_BILLING and AUTO_SIGN_CONTRACT remain false; autonomous contracts DENIED.',
      ],
    };
  }

  const guard = affordabilityGuard({
    proposedMonthlyUsd: input.monthlyUsd,
    customerBudgetUsd: input.customerBudgetUsd,
    costToServeUsd: input.costToServeUsd,
  });
  if (!guard.allowedToRecommend) {
    return { denied: true, state: 'DENIED', reasons: guard.reasons };
  }

  const justified =
    input.tier !== 'enterprise' ||
    (input.costToServeUsd > 0 &&
      input.measurableCustomerValueUsd > input.costToServeUsd &&
      input.monthlyUsd <= input.measurableCustomerValueUsd);

  if (input.tier === 'enterprise' && input.monthlyUsd >= ENTERPRISE_TIER_EXAMPLE_USD_PER_MONTH && !justified) {
    return {
      denied: true,
      state: 'DENIED',
      reasons: [
        `Enterprise tier (e.g. $${ENTERPRISE_TIER_EXAMPLE_USD_PER_MONTH}/mo) only when cost-to-serve + measurable customer value justify — gated recommendation denied.`,
      ],
    };
  }

  return {
    tier: input.tier,
    monthlyUsd: input.monthlyUsd,
    costToServeUsd: input.costToServeUsd,
    measurableCustomerValueUsd: input.measurableCustomerValueUsd,
    justifiedByCostAndValue: justified,
    state: 'RECOMMENDATION_ONLY',
    autoCharge: false,
    autoSign: false,
    humanDecisionRequired: true,
    reasons: [
      'CFO pricing council recommendation only — human decision required for consequential pricing/contract/spend.',
    ],
  };
}

export type NegotiationStrategy = {
  strategyId: string;
  posture: 'collaborative' | 'competitive' | 'principled';
  levers: string[];
  state: 'ADVISORY_ONLY';
  autoExecute: false;
};

export function negotiateStrategy(input: {
  strategyId: string;
  posture: NegotiationStrategy['posture'];
  levers: string[];
}): NegotiationStrategy {
  return {
    strategyId: input.strategyId,
    posture: input.posture,
    levers: [...input.levers],
    state: 'ADVISORY_ONLY',
    autoExecute: false,
  };
}

export type ContractScenario = {
  scenarioId: string;
  labeledSimulation: true;
  isBindingContract: false;
  autoSign: false;
  outcomeSummary: string;
  state: 'LABELED_SIMULATION';
};

export function simulateContractScenario(input: {
  scenarioId: string;
  outcomeSummary: string;
  attemptAutoSign?: boolean;
}): ContractScenario | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptAutoSign) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Autonomous contract signing DENIED (EM157_LOCKS.AUTONOMOUS_CONTRACTS=false).',
    };
  }
  return {
    scenarioId: input.scenarioId,
    labeledSimulation: true,
    isBindingContract: false,
    autoSign: false,
    outcomeSummary: input.outcomeSummary,
    state: 'LABELED_SIMULATION',
  };
}

export function ambitionTrackerSnapshot(): typeof FOUNDER_AMBITION_TRACKER & {
  isValuation: false;
  claimOrgsSaveTrillions: false;
} {
  return {
    ...FOUNDER_AMBITION_TRACKER,
    isValuation: false,
    claimOrgsSaveTrillions: false,
  };
}

// ---------------------------------------------------------------------------
// D — Accountant cost ledger + free-to-premium
// ---------------------------------------------------------------------------

export type LedgerEntry = {
  entryId: string;
  category: 'compute' | 'research' | 'simulation' | 'telecom' | 'ops' | 'other';
  amountUsd: number;
  missionId?: string;
  note: string;
  at: string;
};

export type CostLedger = {
  entries: LedgerEntry[];
  totalUsd: number;
};

export function createCostLedger(): CostLedger {
  return { entries: [], totalUsd: 0 };
}

export function recordCost(ledger: CostLedger, entry: Omit<LedgerEntry, 'at'> & { at?: string }): CostLedger {
  const full: LedgerEntry = { ...entry, at: entry.at ?? nowIso() };
  const entries = [...ledger.entries, full];
  const totalUsd = entries.reduce((s, e) => s + e.amountUsd, 0);
  return { entries, totalUsd };
}

export type AccessGateResult = {
  tier: AccessTier;
  allowed: boolean;
  state: Em157EvidenceState;
  reason: string;
  autoUpgrade: false;
};

export function freeToPremiumGate(input: {
  currentTier: AccessTier;
  requestedFeature: 'basic_research' | 'premium_analytics' | 'enterprise_council';
  attemptAutoUpgrade?: boolean;
  humanApprovedUpgrade?: boolean;
}): AccessGateResult {
  if (input.attemptAutoUpgrade) {
    return {
      tier: input.currentTier,
      allowed: false,
      state: 'DENIED',
      reason: 'Auto-upgrade / auto-billing DENIED — free-to-premium requires human decision.',
      autoUpgrade: false,
    };
  }

  const needs: Record<typeof input.requestedFeature, AccessTier[]> = {
    basic_research: ['free', 'premium', 'enterprise'],
    premium_analytics: ['premium', 'enterprise'],
    enterprise_council: ['enterprise'],
  };

  const allowedTiers = needs[input.requestedFeature];
  if (!allowedTiers.includes(input.currentTier)) {
    if (input.humanApprovedUpgrade) {
      return {
        tier: input.requestedFeature === 'enterprise_council' ? 'enterprise' : 'premium',
        allowed: true,
        state: 'HUMAN_APPROVAL_REQUIRED',
        reason: 'Upgrade path acknowledged after human approval — still recommendation/gated access, not auto-charge.',
        autoUpgrade: false,
      };
    }
    return {
      tier: input.currentTier,
      allowed: false,
      state: 'DENIED',
      reason: `Feature ${input.requestedFeature} requires higher tier than ${input.currentTier}.`,
      autoUpgrade: false,
    };
  }

  return {
    tier: input.currentTier,
    allowed: true,
    state: 'BOUNDED',
    reason: 'Access within current tier gates.',
    autoUpgrade: false,
  };
}

// ---------------------------------------------------------------------------
// E — Historical Business Intelligence
// ---------------------------------------------------------------------------

export type HistoricalLesson = {
  lessonId: string;
  title: string;
  domain:
    | 'pricing'
    | 'procurement'
    | 'operations'
    | 'negotiation'
    | 'tech_adoption'
    | 'failures'
    | 'turnarounds'
    | 'manufacturing'
    | 'international_business';
  evidenceClass: EvidenceClass;
  provenance: string;
  lessonSummary: string;
  provesStrategyWorksToday: false;
  correlationEqualsCausation: false;
  state: 'PROVENANCE_LABELED';
};

export function registerHistoricalLesson(input: {
  lessonId: string;
  title: string;
  domain: HistoricalLesson['domain'];
  evidenceClass: EvidenceClass;
  provenance: string;
  lessonSummary: string;
  claimProofWorksToday?: boolean;
  claimCausationFromCorrelation?: boolean;
}): HistoricalLesson | { denied: true; state: 'DENIED'; reason: string } {
  if (!input.provenance.trim()) {
    return { denied: true, state: 'DENIED', reason: 'Historical lesson requires provenance.' };
  }
  if (input.claimProofWorksToday) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'HBR-style cases = structured lessons with provenance ≠ proof the same strategy works today.',
    };
  }
  if (input.claimCausationFromCorrelation) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Correlation ≠ causation (EM157_LOCKS.CORRELATION_EQ_CAUSATION=false).',
    };
  }
  return {
    lessonId: input.lessonId,
    title: input.title,
    domain: input.domain,
    evidenceClass: input.evidenceClass,
    provenance: input.provenance,
    lessonSummary: input.lessonSummary,
    provesStrategyWorksToday: false,
    correlationEqualsCausation: false,
    state: 'PROVENANCE_LABELED',
  };
}

// ---------------------------------------------------------------------------
// F — Telecom / Satellite research adapters
// ---------------------------------------------------------------------------

export type StarlinkAdapterStatus = {
  adapterKind: 'starlink_management_telemetry_api_candidate';
  connectionState: 'UNCONNECTED' | 'UNAVAILABLE' | 'NOT_TESTED';
  eligibility: 'unknown' | 'ineligible' | 'eligible_authorized_reseller_or_enterprise';
  serviceAccountAuthPresent: boolean;
  satelliteControlEnabled: false;
  liveApiConnected: false;
  reasons: string[];
};

export function evaluateStarlinkAdapter(input?: {
  claimConnectedWithoutCredentials?: boolean;
  attemptSatelliteControl?: boolean;
  eligibilityEvidence?: boolean;
  serviceAccountAuthPresent?: boolean;
}): StarlinkAdapterStatus | { denied: true; state: 'DENIED'; reason: string } {
  if (input?.attemptSatelliteControl) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Satellite control is forbidden (EM157_LOCKS.SATELLITE_CONTROL=false).',
    };
  }
  if (input?.claimConnectedWithoutCredentials) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Starlink remains UNCONNECTED without legitimate credentials + eligibility evidence.',
    };
  }

  const eligible = input?.eligibilityEvidence === true;
  const auth = input?.serviceAccountAuthPresent === true;
  if (eligible && auth) {
    // Still NOT_TESTED / no live connect in this phase — credentials evidence alone ≠ connected
    return {
      adapterKind: 'starlink_management_telemetry_api_candidate',
      connectionState: 'NOT_TESTED',
      eligibility: 'eligible_authorized_reseller_or_enterprise',
      serviceAccountAuthPresent: true,
      satelliteControlEnabled: false,
      liveApiConnected: false,
      reasons: [
        'Eligibility + service-account auth evidence recorded — live Starlink API still NOT_TESTED / unconnected in this phase.',
      ],
    };
  }

  return {
    adapterKind: 'starlink_management_telemetry_api_candidate',
    connectionState: 'UNCONNECTED',
    eligibility: 'unknown',
    serviceAccountAuthPresent: false,
    satelliteControlEnabled: false,
    liveApiConnected: false,
    reasons: [
      'Starlink Management/Telemetry API = adapter candidate only; UNCONNECTED / UNAVAILABLE / NOT_TESTED until legitimate credentials + eligibility evidence.',
    ],
  };
}

export function denyVehicleControl(): { denied: true; state: 'DENIED'; reason: string } {
  return {
    denied: true,
    state: 'DENIED',
    reason: 'Live vehicle control is forbidden (EM157_LOCKS.LIVE_VEHICLE_CONTROL=false).',
  };
}

export function denyQuantumAdvantageWithoutEvidence(): {
  denied: true;
  state: 'DENIED';
  reason: string;
} {
  return {
    denied: true,
    state: 'DENIED',
    reason:
      'Physical quantum advantage without evidence is forbidden (EM157_LOCKS.PHYSICAL_QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE=false).',
  };
}

// ---------------------------------------------------------------------------
// G — Simulation Worlds
// ---------------------------------------------------------------------------

export type SimulationWorld = {
  worldId: string;
  isolated: true;
  isFact: false;
  physicalControlEnabled: false;
  label: 'LABELED_SIMULATION';
  scenario: string;
  results: Record<string, unknown>;
};

export function openSimulationWorld(input: {
  worldId: string;
  scenario: string;
  attemptPhysicalControl?: boolean;
  claimAsFact?: boolean;
}): SimulationWorld | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptPhysicalControl) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Simulation ≠ physical control (EM157_LOCKS.SIM_EQ_PHYSICAL_CONTROL=false).',
    };
  }
  if (input.claimAsFact) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Simulation ≠ fact (EM157_LOCKS.SIM_EQ_FACT=false).',
    };
  }
  return {
    worldId: input.worldId,
    isolated: true,
    isFact: false,
    physicalControlEnabled: false,
    label: 'LABELED_SIMULATION',
    scenario: input.scenario,
    results: {},
  };
}

export function closeSimulationWithResults(
  world: SimulationWorld,
  results: Record<string, unknown>,
): SimulationWorld {
  return { ...world, results: { ...results } };
}

// ---------------------------------------------------------------------------
// H — Home-base pathway + human decision gate
// ---------------------------------------------------------------------------

export type HumanDecisionRequest = {
  decisionId: string;
  kind: 'pricing' | 'contract' | 'spend' | 'enterprise_tier' | 'starlink_connect' | 'other_consequential';
  recommendationSummary: string;
  attemptAutonomousExecute?: boolean;
};

export type HumanDecisionResult = {
  decisionId: string;
  state: 'HUMAN_APPROVAL_REQUIRED' | 'DENIED' | 'APPROVED_BOUNDED';
  executed: false;
  autoSigned: false;
  autoCharged: false;
  reason: string;
};

export function requireHumanDecision(input: HumanDecisionRequest): HumanDecisionResult {
  if (input.attemptAutonomousExecute) {
    return {
      decisionId: input.decisionId,
      state: 'DENIED',
      executed: false,
      autoSigned: false,
      autoCharged: false,
      reason: `Autonomous execution DENIED for ${input.kind}; human decision required.`,
    };
  }
  return {
    decisionId: input.decisionId,
    state: 'HUMAN_APPROVAL_REQUIRED',
    executed: false,
    autoSigned: false,
    autoCharged: false,
    reason: `Consequential ${input.kind} path gated for human decision — recommendation held, not executed.`,
  };
}

export type NeuralPathwayUpdate = {
  pathwayId: string;
  missionId: string;
  evidenceRefs: string[];
  state: 'REGISTERED';
  strengthensAuthorityAutomatically: false;
};

export function updateNeuralPathway(input: {
  pathwayId: string;
  missionId: string;
  evidenceRefs: string[];
}): NeuralPathwayUpdate {
  return {
    pathwayId: input.pathwayId,
    missionId: input.missionId,
    evidenceRefs: [...input.evidenceRefs],
    state: 'REGISTERED',
    strengthensAuthorityAutomatically: false,
  };
}

export type ReviewPacket = {
  missionId: string;
  cfoNotes: string;
  operationsNotes: string;
  strategyNotes: string;
  humanDecisionRequired: true;
  state: 'ADVISORY_ONLY';
};

export function buildCfoOpsStrategyReview(input: {
  missionId: string;
  cfoNotes: string;
  operationsNotes: string;
  strategyNotes: string;
}): ReviewPacket {
  return {
    missionId: input.missionId,
    cfoNotes: input.cfoNotes,
    operationsNotes: input.operationsNotes,
    strategyNotes: input.strategyNotes,
    humanDecisionRequired: true,
    state: 'ADVISORY_ONLY',
  };
}

export type HomeBaseRunResult = {
  sotIssue: typeof GITHUB_SOT_ISSUE;
  sotTitle: typeof GITHUB_SOT_TITLE;
  letterCollisionNote: typeof LETTER_COLLISION_NOTE;
  banner: typeof HONESTY_BANNER;
  locksIntact: boolean;
  dbCandidates: typeof EM157_DB_CANDIDATES_STATUS;
  softWire: Em157SoftWireSnapshot;
  hops: Em157HopRecord[];
  ambition: ReturnType<typeof ambitionTrackerSnapshot>;
  starlinkDefault: StarlinkAdapterStatus | { denied: true; state: 'DENIED'; reason: string };
  next: typeof NEXT_PHASE_AWAIT;
  nonClaims: typeof EM157_NOT_TESTED_CLAIMS;
};

/**
 * Bootstrap home-base honesty + soft-wire pathway (does not execute live systems).
 */
export function bootstrapHomeBase(): HomeBaseRunResult {
  const softWire = em157SoftWireSnapshot();
  const locksIntact = assertEm157LocksIntact();
  const hops: Em157HopRecord[] = [
    hop('honesty_locks', locksIntact ? 'PASS' : 'FAIL', HONESTY_BANNER),
    hop('home_base_bootstrap', 'IMPLEMENTED', 'XIV Agent Compute Home Base contracts loaded.'),
    hop('child_permission_isolation', 'PASS', 'Child auto-inherit broader permissions = false.'),
    hop('el_truth_state_gate', 'PASS', 'DETECTED ≠ VERIFIED; silent CPU fallback ≠ accelerator VERIFIED.'),
    hop('tensorrt_candidate_only', 'CANDIDATE', 'NVIDIA TensorRT = candidate pathway only.'),
    hop('ambition_neq_valuation', 'PASS', '400T goal = founder ambition tracker only.'),
    hop('starlink_unconnected_default', 'UNCONNECTED', 'Starlink adapter candidate UNCONNECTED.'),
    hop('satellite_control_deny', 'DENIED', 'Satellite control locked false.'),
    hop('sim_neq_fact', 'PASS', 'Simulation worlds labeled; sim ≠ fact.'),
    hop('human_decision_gate', 'HUMAN_APPROVAL_REQUIRED', 'Consequential pricing/contract/spend require human.'),
    hop(
      'el9_el8_em_soft_wire',
      softWire.el9ResourceGovernor.present && softWire.priorEmLocalModelHonesty.present
        ? 'IMPLEMENTED'
        : 'WAITING_DATA',
      `EL9=${softWire.el9ResourceGovernor.present}; EL8=${softWire.el8Honesty.present}; priorEM=${softWire.priorEmLocalModelHonesty.present}; EK=${softWire.ekCognitiveOsTypes.present}`,
    ),
    hop('explicit_non_claims', 'NOT_TESTED', EM157_NOT_TESTED_CLAIMS.join(', ')),
    hop('evidence', 'IMPLEMENTED', 'Structured evidence return path ready for mission branches.'),
  ];

  return {
    sotIssue: GITHUB_SOT_ISSUE,
    sotTitle: GITHUB_SOT_TITLE,
    letterCollisionNote: LETTER_COLLISION_NOTE,
    banner: HONESTY_BANNER,
    locksIntact,
    dbCandidates: EM157_DB_CANDIDATES_STATUS,
    softWire,
    hops,
    ambition: ambitionTrackerSnapshot(),
    starlinkDefault: evaluateStarlinkAdapter(),
    next: NEXT_PHASE_AWAIT,
    nonClaims: EM157_NOT_TESTED_CLAIMS,
  };
}

/** Full mission pathway (bounded) — returns evidence to home base; never auto-executes consequential actions. */
export function runHomeBaseMissionPathway(input: {
  parent: Em157Actor;
  missionId: string;
  kind: MissionKind;
  objective: string;
  childPermissions: readonly string[];
  fabricPreferred: FabricRouteKind;
  evidence: string[];
  results: Record<string, unknown>;
}): {
  branch: BranchMissionResult;
  fabric: FabricRouteDecision;
  returned?: MissionRecord;
  pathway?: NeuralPathwayUpdate;
  review?: ReviewPacket;
  humanGate: HumanDecisionResult;
  hops: Em157HopRecord[];
} {
  const hops: Em157HopRecord[] = [];
  const branch = branchMission({
    missionId: input.missionId,
    kind: input.kind,
    objective: input.objective,
    parent: input.parent,
    requestedChildPermissions: input.childPermissions,
  });
  hops.push(
    hop(
      'mission_branch',
      branch.state,
      branch.reason,
    ),
  );

  const fabric = routeComputeFabric({ preferred: input.fabricPreferred });
  hops.push(hop('fabric_route_candidate', fabric.truthState, fabric.reasons.join(' ')));

  if (!branch.allowed || !branch.mission) {
    return {
      branch,
      fabric,
      humanGate: requireHumanDecision({
        decisionId: `${input.missionId}-gate`,
        kind: 'other_consequential',
        recommendationSummary: 'Mission denied before execution.',
      }),
      hops,
    };
  }

  const returned = returnMissionEvidence({
    mission: branch.mission,
    evidence: input.evidence,
    results: input.results,
  });
  hops.push(hop('mission_return_evidence', 'PASS', `Evidence count=${returned.evidence.length}`));

  const pathway = updateNeuralPathway({
    pathwayId: `path-${input.missionId}`,
    missionId: input.missionId,
    evidenceRefs: returned.evidence,
  });
  hops.push(hop('neural_pathway_update', 'REGISTERED', pathway.pathwayId));

  const review = buildCfoOpsStrategyReview({
    missionId: input.missionId,
    cfoNotes: 'Advisory cost/pricing review only.',
    operationsNotes: 'Ops notes advisory; no live control.',
    strategyNotes: 'Strategy advisory; human decision required for consequential paths.',
  });
  hops.push(hop('cfo_ops_strategy_review', 'ADVISORY_ONLY', 'CFO/ops/strategy packet built.'));

  const humanGate = requireHumanDecision({
    decisionId: `${input.missionId}-human`,
    kind: 'spend',
    recommendationSummary: input.objective,
  });
  hops.push(hop('human_decision_gate', humanGate.state, humanGate.reason));

  return { branch, fabric, returned, pathway, review, humanGate, hops };
}
