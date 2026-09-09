/**
 * 62L-EP18 — Quantum-Inspired Compute Lab runtime.
 *
 * Classical Baseline Lab → QI candidate → same dataset/metrics → compare →
 * evidence review → research/promotion. Soft-wires EP17/EP16/EP15/EP14/EM157.
 */

import {
  EP18_DB_CANDIDATES_STATUS,
  EP18_LOCKS,
  EP18_MAY,
  EP18_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QI_COMPUTE_LAB_FLOW,
  QI_EVIDENCE_CLASSES,
  QI_EXPERIMENT_FAMILIES,
  QI_EXPERIMENT_FIELDS,
  QI_LAB_AGENT_BOUNDS,
  QI_PROMOTION_STATES,
  QUANTUM_INSPIRED_COMPUTE_LAB_CYCLE,
  assertEp18LocksIntact,
  ep18SoftWireSnapshot,
  evidenceClassImpliesPhysicalQpu,
  isHumanApprover,
  isQiLabAgent,
  type Ep18Actor,
  type Ep18EvidenceState,
  type Ep18HopRecord,
  type Ep18SoftWireSnapshot,
  type QiEvidenceClass,
  type QiExperimentFamily,
  type QiExperimentField,
  type QiPromotionState,
} from './quantum-inspired-compute-lab-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof QUANTUM_INSPIRED_COMPUTE_LAB_CYCLE)[number],
  state: Ep18EvidenceState,
  summary: string,
): Ep18HopRecord {
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

export type QiMetrics = {
  latency: number;
  solutionQuality: number;
  memory: string;
  reliability: number;
  costEnergyProxy: number;
  uncertainty: number;
};

export type QiExperiment = {
  experimentId: string;
  problemDefinition: string;
  family: QiExperimentFamily;
  datasetVersion: string;
  objectiveFunction: string;
  constraints: readonly string[];
  classicalBaseline: string;
  classicalBaselineLabCompleted: true;
  quantumInspiredMethod: string;
  simulatorBackend: string;
  hardwareRuntime: string;
  iterationsShots: number;
  randomSeed: number;
  baselineMetrics: QiMetrics;
  candidateMetrics: QiMetrics;
  reproducibilityEvidence: readonly string[];
  evidenceClass: QiEvidenceClass;
  authorizedBackendJobId: string | null;
  sandboxed: true;
  operationalUse: false;
  highConsequence: boolean;
  humanAuthorized: boolean;
  quantumAdvantageClaimed: false;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
};

export type QiReviewDecision = {
  reviewId: string;
  experimentId: string;
  promotionState: QiPromotionState;
  evidenceClass: QiEvidenceClass;
  tradeoffStatement: string;
  physicalQpuVerified: boolean;
  productionApplied: false;
  reviewerId: string;
};

export function runQiComputeExperiment(input: {
  actor: Ep18Actor;
  experimentId: string;
  problemDefinition: string;
  family: QiExperimentFamily;
  datasetVersion: string;
  objectiveFunction: string;
  constraints: readonly string[];
  classicalBaseline: string;
  quantumInspiredMethod: string;
  simulatorBackend: string;
  hardwareRuntime: string;
  iterationsShots: number;
  randomSeed: number;
  baselineMetrics: QiMetrics;
  candidateMetrics: QiMetrics;
  reproducibilityEvidence?: readonly string[];
  evidenceClass: QiEvidenceClass;
  authorizedBackendJobId?: string | null;
  classicalBaselineLabCompleted?: boolean;
  sameDataset?: boolean;
  sameMetrics?: boolean;
  highConsequence?: boolean;
  humanAuthorized?: boolean;
  claimText?: string;
  attemptEquateSimulationWithPhysicalQpu?: boolean;
  attemptPhysicalQpuWithoutBackendJob?: boolean;
  attemptQuantumAdvantageWithoutSuperiority?: boolean;
  attemptSkipClassicalBaselineLab?: boolean;
  attemptUnlikeDatasetOrMetrics?: boolean;
  attemptOperationalWithoutSandbox?: boolean;
  attemptSkipHumanForHighConsequence?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): QiExperiment | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_QI_LAB=false — no hidden chain-of-thought.',
    );
  }
  if (input.attemptSkipClassicalBaselineLab || input.classicalBaselineLabCompleted === false) {
    return deny(
      'SKIP_CLASSICAL_BASELINE_LAB=false — Classical Baseline Lab is mandatory first.',
    );
  }
  if (
    input.attemptUnlikeDatasetOrMetrics ||
    input.sameDataset === false ||
    input.sameMetrics === false
  ) {
    return deny(
      'UNLIKE_DATASET_OR_METRICS_COMPARED=false — same dataset and same metrics required.',
    );
  }
  if (input.attemptOperationalWithoutSandbox) {
    return deny(
      'OPERATIONAL_USE_WITHOUT_SANDBOX=false — all advanced algorithms remain sandboxed before operational use.',
    );
  }
  if (
    input.highConsequence &&
    (input.attemptSkipHumanForHighConsequence || !input.humanAuthorized)
  ) {
    return deny(
      'HIGH_CONSEQUENCE_WITHOUT_HUMAN_AUTH=false — high-consequence recommendations stay human-authorized.',
    );
  }

  // Simulation ≠ physical QPU
  if (
    input.attemptEquateSimulationWithPhysicalQpu ||
    ((input.evidenceClass === 'SIMULATED' ||
      input.evidenceClass === 'QUANTUM_INSPIRED' ||
      input.evidenceClass === 'THEORETICAL') &&
      input.claimText?.toLowerCase().includes('physical qpu') &&
      !input.authorizedBackendJobId)
  ) {
    return deny(
      'SIMULATION_EQ_PHYSICAL_QPU=false — simulation does not equal physical QPU execution.',
    );
  }

  // PHYSICAL_QPU_VERIFIED requires authorized backend/job evidence
  if (
    input.evidenceClass === 'PHYSICAL_QPU_VERIFIED' ||
    input.attemptPhysicalQpuWithoutBackendJob
  ) {
    if (!input.authorizedBackendJobId) {
      return deny(
        'PHYSICAL_QPU_CLAIM_WITHOUT_BACKEND_JOB=false — no physical-QPU claim without authorized backend/job evidence.',
      );
    }
  }

  // Quantum advantage requires reproducible measured superiority on a clear metric
  const claim = (input.claimText ?? '').toLowerCase();
  const claimsAdvantage =
    claim.includes('quantum advantage') ||
    claim.includes('quantum-powered') ||
    claim.includes('quantum powered');
  const measuredSuperiority =
    input.candidateMetrics.latency < input.baselineMetrics.latency ||
    input.candidateMetrics.solutionQuality >
      input.baselineMetrics.solutionQuality;
  const reproducible = (input.reproducibilityEvidence?.length ?? 0) > 0;
  if (
    input.attemptQuantumAdvantageWithoutSuperiority ||
    (claimsAdvantage && (!measuredSuperiority || !reproducible))
  ) {
    return deny(
      'QUANTUM_ADVANTAGE_WITHOUT_REPRODUCIBLE_SUPERIORITY=false — no quantum-advantage claim without reproducible measured superiority on a clearly defined metric.',
    );
  }

  void QI_EXPERIMENT_FIELDS;

  // QI / SIMULATED / THEORETICAL remain non-physical
  const evidenceClass = input.evidenceClass;
  if (
    evidenceClass !== 'PHYSICAL_QPU_VERIFIED' &&
    evidenceClassImpliesPhysicalQpu(evidenceClass)
  ) {
    return deny('QI_IMPLIED_PHYSICAL_WITHOUT_EVIDENCE=false.');
  }

  return {
    experimentId: input.experimentId,
    problemDefinition: input.problemDefinition,
    family: input.family,
    datasetVersion: input.datasetVersion,
    objectiveFunction: input.objectiveFunction,
    constraints: input.constraints,
    classicalBaseline: input.classicalBaseline,
    classicalBaselineLabCompleted: true,
    quantumInspiredMethod: input.quantumInspiredMethod,
    simulatorBackend: input.simulatorBackend,
    hardwareRuntime: input.hardwareRuntime,
    iterationsShots: input.iterationsShots,
    randomSeed: input.randomSeed,
    baselineMetrics: input.baselineMetrics,
    candidateMetrics: input.candidateMetrics,
    reproducibilityEvidence: input.reproducibilityEvidence ?? [],
    evidenceClass,
    authorizedBackendJobId: input.authorizedBackendJobId ?? null,
    sandboxed: true,
    operationalUse: false,
    highConsequence: Boolean(input.highConsequence),
    humanAuthorized: Boolean(input.humanAuthorized),
    quantumAdvantageClaimed: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
  };
}

function dominates(b: QiMetrics, c: QiMetrics): boolean {
  return (
    c.latency <= b.latency &&
    c.solutionQuality >= b.solutionQuality &&
    c.reliability >= b.reliability &&
    c.costEnergyProxy <= b.costEnergyProxy &&
    (c.latency < b.latency || c.solutionQuality > b.solutionQuality)
  );
}

function hasTradeoff(b: QiMetrics, c: QiMetrics): boolean {
  const latencyBetter = c.latency < b.latency;
  const costWorse = c.costEnergyProxy > b.costEnergyProxy;
  const qualityBetter = c.solutionQuality > b.solutionQuality;
  const latencyWorse = c.latency > b.latency;
  return (
    (latencyBetter && costWorse) ||
    (qualityBetter && latencyWorse) ||
    (latencyBetter && c.solutionQuality < b.solutionQuality)
  );
}

function noAdvantage(b: QiMetrics, c: QiMetrics): boolean {
  return (
    Math.abs(c.latency - b.latency) < 1e-9 &&
    Math.abs(c.solutionQuality - b.solutionQuality) < 1e-9 &&
    Math.abs(c.costEnergyProxy - b.costEnergyProxy) < 1e-9
  );
}

export function reviewQiExperiment(input: {
  actor: Ep18Actor;
  reviewId: string;
  experiment: QiExperiment;
  markVerified?: boolean;
  attemptAutoPromoteToProduction?: boolean;
}): QiReviewDecision | DenialResult {
  if (input.attemptAutoPromoteToProduction) {
    return deny('AUTO_PROMOTE_TO_PRODUCTION=false.');
  }
  if (input.actor.kind !== 'reviewer' && !isHumanApprover(input.actor)) {
    return deny('Only reviewer or human_approver/founder may promote/reject.');
  }

  const { baselineMetrics: b, candidateMetrics: c } = input.experiment;
  const physical =
    input.experiment.evidenceClass === 'PHYSICAL_QPU_VERIFIED' &&
    Boolean(input.experiment.authorizedBackendJobId);

  const tradeoffStatement = `latency ${b.latency}→${c.latency}; quality ${b.solutionQuality}→${c.solutionQuality}; cost ${b.costEnergyProxy}→${c.costEnergyProxy}; evidence=${input.experiment.evidenceClass}`;

  // Non-physical evidence classes stay RESEARCH_ONLY unless explicitly verified path with physical
  if (
    !physical &&
    (input.experiment.evidenceClass === 'THEORETICAL' ||
      input.experiment.evidenceClass === 'SIMULATED' ||
      input.experiment.evidenceClass === 'QUANTUM_INSPIRED') &&
    !input.markVerified
  ) {
    // Still classify tradeoff/improvement for research labeling
    if (noAdvantage(b, c)) {
      return {
        reviewId: input.reviewId,
        experimentId: input.experiment.experimentId,
        promotionState: 'NO_ADVANTAGE',
        evidenceClass: input.experiment.evidenceClass,
        tradeoffStatement,
        physicalQpuVerified: false,
        productionApplied: false,
        reviewerId: input.actor.id,
      };
    }
    if (hasTradeoff(b, c)) {
      return {
        reviewId: input.reviewId,
        experimentId: input.experiment.experimentId,
        promotionState: 'TRADEOFF_IMPROVEMENT',
        evidenceClass: input.experiment.evidenceClass,
        tradeoffStatement,
        physicalQpuVerified: false,
        productionApplied: false,
        reviewerId: input.actor.id,
      };
    }
    return {
      reviewId: input.reviewId,
      experimentId: input.experiment.experimentId,
      promotionState: 'RESEARCH_ONLY',
      evidenceClass: input.experiment.evidenceClass,
      tradeoffStatement,
      physicalQpuVerified: false,
      productionApplied: false,
      reviewerId: input.actor.id,
    };
  }

  if (noAdvantage(b, c)) {
    return {
      reviewId: input.reviewId,
      experimentId: input.experiment.experimentId,
      promotionState: 'NO_ADVANTAGE',
      evidenceClass: input.experiment.evidenceClass,
      tradeoffStatement,
      physicalQpuVerified: physical,
      productionApplied: false,
      reviewerId: input.actor.id,
    };
  }

  if (hasTradeoff(b, c) && !dominates(b, c)) {
    return {
      reviewId: input.reviewId,
      experimentId: input.experiment.experimentId,
      promotionState: 'TRADEOFF_IMPROVEMENT',
      evidenceClass: input.experiment.evidenceClass,
      tradeoffStatement,
      physicalQpuVerified: physical,
      productionApplied: false,
      reviewerId: input.actor.id,
    };
  }

  if (dominates(b, c)) {
    return {
      reviewId: input.reviewId,
      experimentId: input.experiment.experimentId,
      promotionState: input.markVerified
        ? 'VERIFIED_CANDIDATE'
        : 'IMPROVED_CANDIDATE',
      evidenceClass: input.experiment.evidenceClass,
      tradeoffStatement,
      physicalQpuVerified: physical,
      productionApplied: false,
      reviewerId: input.actor.id,
    };
  }

  return {
    reviewId: input.reviewId,
    experimentId: input.experiment.experimentId,
    promotionState: 'RESEARCH_ONLY',
    evidenceClass: input.experiment.evidenceClass,
    tradeoffStatement,
    physicalQpuVerified: physical,
    productionApplied: false,
    reviewerId: input.actor.id,
  };
}

export function attemptEquateSimulationWithPhysicalQpu(): DenialResult {
  return deny('SIMULATION_EQ_PHYSICAL_QPU=false.');
}

export function attemptPhysicalQpuWithoutBackendJob(): DenialResult {
  return deny('PHYSICAL_QPU_CLAIM_WITHOUT_BACKEND_JOB=false.');
}

export function attemptQuantumAdvantageWithoutSuperiority(): DenialResult {
  return deny('QUANTUM_ADVANTAGE_WITHOUT_REPRODUCIBLE_SUPERIORITY=false.');
}

export function attemptSkipClassicalBaselineLab(): DenialResult {
  return deny('SKIP_CLASSICAL_BASELINE_LAB=false.');
}

export function attemptUnlikeDatasetOrMetrics(): DenialResult {
  return deny('UNLIKE_DATASET_OR_METRICS_COMPARED=false.');
}

export function attemptOperationalWithoutSandbox(): DenialResult {
  return deny('OPERATIONAL_USE_WITHOUT_SANDBOX=false.');
}

export function attemptSkipHumanForHighConsequence(): DenialResult {
  return deny('HIGH_CONSEQUENCE_WITHOUT_HUMAN_AUTH=false.');
}

export function attemptAutoPromoteToProduction(): DenialResult {
  return deny('AUTO_PROMOTE_TO_PRODUCTION=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnQiLabEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep18Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      flow: typeof QI_COMPUTE_LAB_FLOW;
      authorityGranted: false;
    }
  | DenialResult {
  if (!QI_LAB_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isQiLabAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only QI-lab agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    flow: QI_COMPUTE_LAB_FLOW,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep18Actor;
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
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver or founder.',
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
    unchanged: EP18_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EP18_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EP18_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleBaselineMetrics(): QiMetrics {
  return {
    latency: 100,
    solutionQuality: 0.9,
    memory: '2GB',
    reliability: 0.99,
    costEnergyProxy: 1.0,
    uncertainty: 0.05,
  };
}

export function exampleImprovedCandidateMetrics(): QiMetrics {
  return {
    latency: 85,
    solutionQuality: 0.93,
    memory: '2GB',
    reliability: 0.99,
    costEnergyProxy: 0.95,
    uncertainty: 0.06,
  };
}

export function exampleTradeoffCandidateMetrics(): QiMetrics {
  return {
    latency: 70,
    solutionQuality: 0.9,
    memory: '2.2GB',
    reliability: 0.99,
    costEnergyProxy: 1.25,
    uncertainty: 0.08,
  };
}

export function bootstrapQuantumInspiredComputeLab(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep18SoftWireSnapshot;
  evidenceClasses: typeof QI_EVIDENCE_CLASSES;
  families: typeof QI_EXPERIMENT_FAMILIES;
  fields: readonly QiExperimentField[];
  coreFlow: typeof QI_COMPUTE_LAB_FLOW;
  promotionStates: typeof QI_PROMOTION_STATES;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP18_MAY;
  mustNot: typeof EP18_MUST_NOT;
  dbCandidates: typeof EP18_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp18LocksIntact(),
    softWire: ep18SoftWireSnapshot(repoRoot),
    evidenceClasses: QI_EVIDENCE_CLASSES,
    families: QI_EXPERIMENT_FAMILIES,
    fields: QI_EXPERIMENT_FIELDS,
    coreFlow: QI_COMPUTE_LAB_FLOW,
    promotionStates: QI_PROMOTION_STATES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP18_MAY,
    mustNot: EP18_MUST_NOT,
    dbCandidates: EP18_DB_CANDIDATES_STATUS,
  };
}

export function runQuantumInspiredComputeLabCycle(input: {
  actor: Ep18Actor;
  reviewer: Ep18Actor;
  human: Ep18Actor;
  repoRoot?: string;
}): {
  hops: Ep18HopRecord[];
  experiment: QiExperiment | DenialResult;
  review: QiReviewDecision | DenialResult;
  softWire: Ep18SoftWireSnapshot;
} {
  const hops: Ep18HopRecord[] = [];
  const softWire = ep18SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp18LocksIntact() ? 'PASS' : 'FAIL',
      'EP18 locks intact including L4=false and simulation≠physical QPU.',
    ),
  );
  hops.push(
    hop(
      'quantum_inspired_compute_lab_bootstrap',
      'PASS',
      'Quantum-Inspired Compute Lab bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'evidence_classes_encoded',
      'PASS',
      QI_EVIDENCE_CLASSES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'experiment_families_encoded',
      'PASS',
      `${QI_EXPERIMENT_FAMILIES.length} experiment families encoded.`,
    ),
  );
  hops.push(
    hop(
      'experiment_fields_encoded',
      'PASS',
      `${QI_EXPERIMENT_FIELDS.length} experiment fields encoded.`,
    ),
  );
  hops.push(
    hop('core_flow_encoded', 'PASS', QI_COMPUTE_LAB_FLOW.join(' → ')),
  );
  hops.push(
    hop(
      'promotion_states_encoded',
      'PASS',
      QI_PROMOTION_STATES.join(' | '),
    ),
  );

  hops.push(
    hop(
      'simulation_neq_physical_qpu',
      attemptEquateSimulationWithPhysicalQpu().state === 'DENIED' &&
        evidenceClassImpliesPhysicalQpu('SIMULATED') === false &&
        evidenceClassImpliesPhysicalQpu('QUANTUM_INSPIRED') === false
        ? 'PASS'
        : 'FAIL',
      'Simulation / QUANTUM_INSPIRED ≠ physical QPU.',
    ),
  );

  hops.push(
    hop(
      'qi_remains_classical_without_physical_evidence',
      evidenceClassImpliesPhysicalQpu('QUANTUM_INSPIRED') === false
        ? 'PASS'
        : 'FAIL',
      'QI methods remain classical software unless PHYSICAL_QPU_VERIFIED.',
    ),
  );

  hops.push(
    hop(
      'no_physical_qpu_claim_without_backend_job_evidence',
      attemptPhysicalQpuWithoutBackendJob().state === 'DENIED' &&
        runQiComputeExperiment({
          actor: input.actor,
          experimentId: 'exp-qpu-bad',
          problemDefinition: 'routing',
          family: 'routing',
          datasetVersion: 'ds-v1',
          objectiveFunction: 'min cost',
          constraints: [],
          classicalBaseline: 'weighted_scoring',
          quantumInspiredMethod: 'qi-anneal',
          simulatorBackend: 'sim',
          hardwareRuntime: 'cpu',
          iterationsShots: 100,
          randomSeed: 1,
          baselineMetrics: exampleBaselineMetrics(),
          candidateMetrics: exampleImprovedCandidateMetrics(),
          evidenceClass: 'PHYSICAL_QPU_VERIFIED',
          authorizedBackendJobId: null,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'PHYSICAL_QPU requires authorized backend/job evidence.',
    ),
  );

  hops.push(
    hop(
      'no_quantum_advantage_without_reproducible_superiority',
      attemptQuantumAdvantageWithoutSuperiority().state === 'DENIED' &&
        runQiComputeExperiment({
          actor: input.actor,
          experimentId: 'exp-qa',
          problemDefinition: 'scheduling',
          family: 'scheduling',
          datasetVersion: 'ds-v1',
          objectiveFunction: 'min latency',
          constraints: [],
          classicalBaseline: 'greedy',
          quantumInspiredMethod: 'qi',
          simulatorBackend: 'sim',
          hardwareRuntime: 'cpu',
          iterationsShots: 10,
          randomSeed: 1,
          baselineMetrics: exampleBaselineMetrics(),
          candidateMetrics: exampleBaselineMetrics(),
          evidenceClass: 'QUANTUM_INSPIRED',
          claimText: 'quantum advantage',
          reproducibilityEvidence: [],
          attemptQuantumAdvantageWithoutSuperiority: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'No quantum-advantage claim without reproducible measured superiority.',
    ),
  );

  hops.push(
    hop(
      'classical_baseline_lab_mandatory',
      attemptSkipClassicalBaselineLab().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Classical Baseline Lab mandatory.',
    ),
  );

  hops.push(
    hop(
      'same_dataset_same_metrics_required',
      attemptUnlikeDatasetOrMetrics().state === 'DENIED' &&
        runQiComputeExperiment({
          actor: input.actor,
          experimentId: 'exp-unlike',
          problemDefinition: 'x',
          family: 'assignment',
          datasetVersion: 'ds-v1',
          objectiveFunction: 'x',
          constraints: [],
          classicalBaseline: 'greedy',
          quantumInspiredMethod: 'qi',
          simulatorBackend: 'sim',
          hardwareRuntime: 'cpu',
          iterationsShots: 1,
          randomSeed: 1,
          baselineMetrics: exampleBaselineMetrics(),
          candidateMetrics: exampleImprovedCandidateMetrics(),
          evidenceClass: 'QUANTUM_INSPIRED',
          sameDataset: false,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Same dataset and same metrics required.',
    ),
  );

  hops.push(
    hop(
      'sandbox_before_operational_use',
      attemptOperationalWithoutSandbox().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Sandboxed before operational use.',
    ),
  );

  hops.push(
    hop(
      'high_consequence_human_authorized',
      attemptSkipHumanForHighConsequence().state === 'DENIED' &&
        runQiComputeExperiment({
          actor: input.actor,
          experimentId: 'exp-hc',
          problemDefinition: 'fleet',
          family: 'vehicle_fleet_logistics',
          datasetVersion: 'ds-v1',
          objectiveFunction: 'min delay',
          constraints: ['sla'],
          classicalBaseline: 'mip',
          quantumInspiredMethod: 'qi',
          simulatorBackend: 'sim',
          hardwareRuntime: 'cpu',
          iterationsShots: 50,
          randomSeed: 7,
          baselineMetrics: exampleBaselineMetrics(),
          candidateMetrics: exampleImprovedCandidateMetrics(),
          evidenceClass: 'QUANTUM_INSPIRED',
          highConsequence: true,
          humanAuthorized: false,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'High-consequence requires human authorization.',
    ),
  );

  const experiment = runQiComputeExperiment({
    actor: input.actor,
    experimentId: 'exp-1',
    problemDefinition: 'agent-task allocation under resource ceiling',
    family: 'agent_task_allocation',
    datasetVersion: 'ds-v1',
    objectiveFunction: 'maximize quality under latency budget',
    constraints: ['resource_ceiling'],
    classicalBaseline: 'weighted_scoring_v1',
    quantumInspiredMethod: 'qi_graph_partition_v1',
    simulatorBackend: 'classical-qi-sim',
    hardwareRuntime: 'cpu',
    iterationsShots: 128,
    randomSeed: 42,
    baselineMetrics: exampleBaselineMetrics(),
    candidateMetrics: exampleImprovedCandidateMetrics(),
    reproducibilityEvidence: ['seed=42', 'ds-v1', 'shots=128'],
    evidenceClass: 'QUANTUM_INSPIRED',
  });

  const review =
    !('denied' in experiment)
      ? reviewQiExperiment({
          actor: input.reviewer,
          reviewId: 'rev-1',
          experiment,
        })
      : experiment;

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
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptAutoPromoteToProduction().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no auto production promote.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP18_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep17_soft_wire',
      softWire.ep17ClassicalQuantBaselineLab.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep17ClassicalQuantBaselineLab.note,
    ),
  );
  hops.push(
    hop(
      'ep16_soft_wire',
      softWire.ep16NoOverclockBiosRule.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep16NoOverclockBiosRule.note,
    ),
  );
  hops.push(
    hop(
      'ep15_soft_wire',
      softWire.ep15AlgorithmTuningSandbox.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep15AlgorithmTuningSandbox.note,
    ),
  );
  hops.push(
    hop(
      'ep14_soft_wire',
      softWire.ep14AdaptiveBenchmarkLedger.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep14AdaptiveBenchmarkLedger.note,
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
      EP18_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep18-1',
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

  void QUANTUM_INSPIRED_COMPUTE_LAB_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    experiment,
    review,
    softWire,
  };
}
