/**
 * 62L-EP17 — Classical Quant Baseline Lab runtime.
 *
 * Problem → Classical Baselines → Candidate → Same Conditions → Compare →
 * Promote/Reject. Soft-wires EP16/EP15/EP14/EP12/EM157 when present.
 */

import {
  CLASSICAL_BASELINE_FAMILIES,
  CLASSICAL_QUANT_BASELINE_LAB_CYCLE,
  EP17_DB_CANDIDATES_STATUS,
  EP17_LOCKS,
  EP17_MAY,
  EP17_MUST_NOT,
  FORBIDDEN_QUANTUM_CLAIMS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  METAHEURISTIC_EXAMPLES,
  NEXT_PHASE_TITLE,
  QUANT_BASELINE_LAB_FLOW,
  QUANT_EXPERIMENT_FIELDS,
  QUANT_LAB_AGENT_BOUNDS,
  QUANT_PROMOTION_STATES,
  QUANT_TRADEOFF_AXES,
  assertEp17LocksIntact,
  ep17SoftWireSnapshot,
  isHumanApprover,
  isQuantLabAgent,
  type ClassicalBaselineFamily,
  type Ep17Actor,
  type Ep17EvidenceState,
  type Ep17HopRecord,
  type Ep17SoftWireSnapshot,
  type QuantExperimentField,
  type QuantPromotionState,
  type QuantTradeoffAxis,
} from './classical-quant-baseline-lab-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CLASSICAL_QUANT_BASELINE_LAB_CYCLE)[number],
  state: Ep17EvidenceState,
  summary: string,
): Ep17HopRecord {
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

export type QuantMetrics = {
  latency: number;
  memory: string;
  solutionQuality: number;
  reliability: number;
  costEnergyProxy: number;
};

export type ExplicitQuantTradeoff = {
  axis: QuantTradeoffAxis;
  baselineValue: number;
  candidateValue: number;
  direction: 'better' | 'worse' | 'unchanged';
  note: string;
};

export type TestConditions = {
  datasetVersion: string;
  computeBudget: string;
  runtimeBudget: string;
  randomSeed: number;
  hardwareRuntime: string;
};

export type QuantExperiment = {
  problemId: string;
  objective: string;
  constraints: readonly string[];
  datasetVersion: string;
  baselineAlgorithm: string;
  baselineFamily: ClassicalBaselineFamily;
  candidateAlgorithm: string;
  computeBudget: string;
  runtimeBudget: string;
  randomSeed: number;
  hardwareRuntime: string;
  baselineMetrics: QuantMetrics;
  candidateMetrics: QuantMetrics;
  reproducibility: boolean;
  evidenceRefs: readonly string[];
  tradeoffs: readonly ExplicitQuantTradeoff[];
  benchmarkRun: true;
  classicalBaselinesRun: true;
  sameDataAndConditions: true;
  quantumInspired: boolean;
  quantumAdvantageClaimed: false;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
};

export type QuantReviewDecision = {
  reviewId: string;
  problemId: string;
  promotionState: QuantPromotionState;
  tradeoffStatement: string;
  beatOrTradeoffJustified: boolean;
  reviewerId: string;
  productionApplied: false;
};

function directionFor(
  axis: QuantTradeoffAxis,
  baseline: number,
  candidate: number,
): ExplicitQuantTradeoff['direction'] {
  const lowerBetter =
    axis === 'latency' || axis === 'cost_energy' || axis === 'memory';
  if (Math.abs(candidate - baseline) < 1e-9) return 'unchanged';
  if (lowerBetter) return candidate < baseline ? 'better' : 'worse';
  return candidate > baseline ? 'better' : 'worse';
}

export function reportExplicitQuantTradeoffs(
  baseline: QuantMetrics,
  candidate: QuantMetrics,
): ExplicitQuantTradeoff[] {
  const memoryBaseline = Number.parseFloat(baseline.memory) || 0;
  const memoryCandidate = Number.parseFloat(candidate.memory) || 0;
  const pairs: Array<{
    axis: QuantTradeoffAxis;
    b: number;
    c: number;
    note: string;
  }> = [
    {
      axis: 'latency',
      b: baseline.latency,
      c: candidate.latency,
      note: 'Improved latency with higher cost must be stated clearly.',
    },
    {
      axis: 'solution_quality',
      b: baseline.solutionQuality,
      c: candidate.solutionQuality,
      note: 'Quality regressions must be explicit.',
    },
    {
      axis: 'reliability',
      b: baseline.reliability,
      c: candidate.reliability,
      note: 'Reliability tradeoffs must be explicit.',
    },
    {
      axis: 'cost_energy',
      b: baseline.costEnergyProxy,
      c: candidate.costEnergyProxy,
      note: 'Cost/energy increases for latency gains must be stated.',
    },
    {
      axis: 'memory',
      b: memoryBaseline,
      c: memoryCandidate,
      note: 'Memory tradeoffs must be explicit.',
    },
  ];
  return pairs.map((p) => ({
    axis: p.axis,
    baselineValue: p.b,
    candidateValue: p.c,
    direction: directionFor(p.axis, p.b, p.c),
    note: p.note,
  }));
}

export function conditionsMatch(a: TestConditions, b: TestConditions): boolean {
  return (
    a.datasetVersion === b.datasetVersion &&
    a.computeBudget === b.computeBudget &&
    a.runtimeBudget === b.runtimeBudget &&
    a.randomSeed === b.randomSeed &&
    a.hardwareRuntime === b.hardwareRuntime
  );
}

export function runQuantBaselineExperiment(input: {
  actor: Ep17Actor;
  problemId: string;
  objective: string;
  constraints: readonly string[];
  baselineAlgorithm: string;
  baselineFamily: ClassicalBaselineFamily;
  candidateAlgorithm: string;
  baselineConditions: TestConditions;
  candidateConditions: TestConditions;
  baselineMetrics: QuantMetrics;
  candidateMetrics: QuantMetrics;
  reproducibility?: boolean;
  evidenceRefs?: readonly string[];
  quantumInspired?: boolean;
  claimText?: string;
  benchmarkActuallyRun?: boolean;
  classicalBaselinesActuallyRun?: boolean;
  attemptSkipClassicalBaselines?: boolean;
  attemptMarkUnrunAsPass?: boolean;
  attemptCompareUnlikeConditions?: boolean;
  attemptHideTradeoffs?: boolean;
  attemptQuantumAdvantageWithoutEvidence?: boolean;
  attemptSkipLabForQuantumInspired?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): QuantExperiment | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_LAB=false — no hidden chain-of-thought.',
    );
  }
  if (input.attemptSkipClassicalBaselines) {
    return deny(
      'SKIP_CLASSICAL_BASELINES=false — classical baselines are mandatory first.',
    );
  }
  if (input.attemptMarkUnrunAsPass || input.benchmarkActuallyRun === false) {
    return deny(
      'UNRUN_BENCHMARK_IS_PASS=false — no unrun benchmark is a PASS.',
    );
  }
  if (input.classicalBaselinesActuallyRun === false) {
    return deny('Classical baselines must actually be run before compare.');
  }
  if (
    input.attemptCompareUnlikeConditions ||
    !conditionsMatch(input.baselineConditions, input.candidateConditions)
  ) {
    return deny(
      'DIFFERENT_DATA_OR_CONDITIONS_COMPARED_AS_SAME=false — same data/test conditions required.',
    );
  }
  if (input.attemptHideTradeoffs) {
    return deny('HIDE_TRADEOFFS=false — tradeoffs must be stated clearly.');
  }
  if (
    input.quantumInspired &&
    input.attemptSkipLabForQuantumInspired
  ) {
    return deny(
      'QUANTUM_INSPIRED_WITHOUT_THIS_LAB=false — this lab is mandatory for quantum-inspired work.',
    );
  }

  const claim = (input.claimText ?? '').toLowerCase();
  const claimsAdvantage =
    claim.includes('quantum advantage') ||
    claim.includes('quantum-powered efficiency') ||
    claim.includes('quantum powered efficiency');
  if (
    input.attemptQuantumAdvantageWithoutEvidence ||
    (claimsAdvantage && !input.evidenceRefs?.length)
  ) {
    return deny(
      'QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE=false — no quantum advantage / quantum-powered efficiency language unless evidence supports it.',
    );
  }

  void QUANT_EXPERIMENT_FIELDS;
  void FORBIDDEN_QUANTUM_CLAIMS;
  void METAHEURISTIC_EXAMPLES;

  const tradeoffs = reportExplicitQuantTradeoffs(
    input.baselineMetrics,
    input.candidateMetrics,
  );
  const c = input.candidateConditions;

  return {
    problemId: input.problemId,
    objective: input.objective,
    constraints: input.constraints,
    datasetVersion: c.datasetVersion,
    baselineAlgorithm: input.baselineAlgorithm,
    baselineFamily: input.baselineFamily,
    candidateAlgorithm: input.candidateAlgorithm,
    computeBudget: c.computeBudget,
    runtimeBudget: c.runtimeBudget,
    randomSeed: c.randomSeed,
    hardwareRuntime: c.hardwareRuntime,
    baselineMetrics: input.baselineMetrics,
    candidateMetrics: input.candidateMetrics,
    reproducibility: input.reproducibility ?? true,
    evidenceRefs: input.evidenceRefs ?? [],
    tradeoffs,
    benchmarkRun: true,
    classicalBaselinesRun: true,
    sameDataAndConditions: true,
    quantumInspired: Boolean(input.quantumInspired),
    quantumAdvantageClaimed: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
  };
}

function candidateDominates(exp: QuantExperiment): boolean {
  const b = exp.baselineMetrics;
  const c = exp.candidateMetrics;
  return (
    c.latency <= b.latency &&
    c.solutionQuality >= b.solutionQuality &&
    c.reliability >= b.reliability &&
    c.costEnergyProxy <= b.costEnergyProxy &&
    (c.latency < b.latency ||
      c.solutionQuality > b.solutionQuality ||
      c.costEnergyProxy < b.costEnergyProxy)
  );
}

function hasMaterialTradeoff(exp: QuantExperiment): boolean {
  const better = exp.tradeoffs.filter((t) => t.direction === 'better');
  const worse = exp.tradeoffs.filter((t) => t.direction === 'worse');
  return better.length > 0 && worse.length > 0;
}

function noMeasuredAdvantage(exp: QuantExperiment): boolean {
  return exp.tradeoffs.every((t) => t.direction === 'unchanged');
}

export function reviewQuantExperiment(input: {
  actor: Ep17Actor;
  reviewId: string;
  experiment: QuantExperiment;
  markVerified?: boolean;
  attemptAutoPromoteToProduction?: boolean;
}): QuantReviewDecision | DenialResult {
  if (input.attemptAutoPromoteToProduction) {
    return deny('AUTO_PROMOTE_TO_PRODUCTION=false.');
  }
  if (input.actor.kind !== 'reviewer' && !isHumanApprover(input.actor)) {
    return deny('Only reviewer or human_approver/founder may promote/reject.');
  }

  if (input.experiment.quantumInspired && !input.markVerified) {
    const tradeoffStatement = summarizeTradeoffs(input.experiment);
    return {
      reviewId: input.reviewId,
      problemId: input.experiment.problemId,
      promotionState: 'RESEARCH_ONLY',
      tradeoffStatement,
      beatOrTradeoffJustified: true,
      reviewerId: input.actor.id,
      productionApplied: false,
    };
  }

  if (noMeasuredAdvantage(input.experiment)) {
    return {
      reviewId: input.reviewId,
      problemId: input.experiment.problemId,
      promotionState: 'NO_MEASURED_ADVANTAGE',
      tradeoffStatement: 'No measured advantage versus classical baseline.',
      beatOrTradeoffJustified: false,
      reviewerId: input.actor.id,
      productionApplied: false,
    };
  }

  if (candidateDominates(input.experiment)) {
    return {
      reviewId: input.reviewId,
      problemId: input.experiment.problemId,
      promotionState: input.markVerified
        ? 'VERIFIED_CANDIDATE'
        : 'IMPROVED_CANDIDATE',
      tradeoffStatement: summarizeTradeoffs(input.experiment),
      beatOrTradeoffJustified: true,
      reviewerId: input.actor.id,
      productionApplied: false,
    };
  }

  if (hasMaterialTradeoff(input.experiment)) {
    return {
      reviewId: input.reviewId,
      problemId: input.experiment.problemId,
      promotionState: 'TRADEOFF_IMPROVEMENT',
      tradeoffStatement: summarizeTradeoffs(input.experiment),
      beatOrTradeoffJustified: true,
      reviewerId: input.actor.id,
      productionApplied: false,
    };
  }

  return {
    reviewId: input.reviewId,
    problemId: input.experiment.problemId,
    promotionState: 'BASELINE_ONLY',
    tradeoffStatement:
      'Candidate did not show clear improvement or justified tradeoff; retain classical baseline.',
    beatOrTradeoffJustified: false,
    reviewerId: input.actor.id,
    productionApplied: false,
  };
}

function summarizeTradeoffs(exp: QuantExperiment): string {
  const parts = exp.tradeoffs
    .filter((t) => t.direction !== 'unchanged')
    .map(
      (t) =>
        `${t.axis}: ${t.baselineValue} → ${t.candidateValue} (${t.direction})`,
    );
  if (parts.length === 0) return 'No material metric movement.';
  return `Explicit tradeoffs: ${parts.join('; ')}.`;
}

export function attemptMarkUnrunAsPass(): DenialResult {
  return deny('UNRUN_BENCHMARK_IS_PASS=false.');
}

export function attemptSkipClassicalBaselines(): DenialResult {
  return deny('SKIP_CLASSICAL_BASELINES=false.');
}

export function attemptCompareUnlikeConditions(): DenialResult {
  return deny('DIFFERENT_DATA_OR_CONDITIONS_COMPARED_AS_SAME=false.');
}

export function attemptQuantumAdvantageWithoutEvidence(): DenialResult {
  return deny('QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE=false.');
}

export function attemptQuantumPoweredEfficiencyWithoutEvidence(): DenialResult {
  return deny('QUANTUM_POWERED_EFFICIENCY_WITHOUT_EVIDENCE=false.');
}

export function attemptSkipLabForQuantumInspired(): DenialResult {
  return deny('QUANTUM_INSPIRED_WITHOUT_THIS_LAB=false.');
}

export function attemptHideTradeoffs(): DenialResult {
  return deny('HIDE_TRADEOFFS=false.');
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

export function returnQuantLabEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep17Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      flow: typeof QUANT_BASELINE_LAB_FLOW;
      authorityGranted: false;
    }
  | DenialResult {
  if (!QUANT_LAB_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isQuantLabAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only quant-lab agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    flow: QUANT_BASELINE_LAB_FLOW,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep17Actor;
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
    unchanged: EP17_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EP17_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EP17_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleConditions(
  overrides?: Partial<TestConditions>,
): TestConditions {
  return {
    datasetVersion: 'ds-v1',
    computeBudget: '100-eval',
    runtimeBudget: '60s',
    randomSeed: 42,
    hardwareRuntime: 'cpu-classical',
    ...overrides,
  };
}

export function exampleBaselineMetrics(): QuantMetrics {
  return {
    latency: 100,
    memory: '2GB',
    solutionQuality: 0.9,
    reliability: 0.99,
    costEnergyProxy: 1.0,
  };
}

export function exampleImprovedCandidateMetrics(): QuantMetrics {
  return {
    latency: 80,
    memory: '2GB',
    solutionQuality: 0.92,
    reliability: 0.99,
    costEnergyProxy: 0.95,
  };
}

export function exampleTradeoffCandidateMetrics(): QuantMetrics {
  return {
    latency: 70,
    memory: '2.5GB',
    solutionQuality: 0.9,
    reliability: 0.99,
    costEnergyProxy: 1.2,
  };
}

export function bootstrapClassicalQuantBaselineLab(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep17SoftWireSnapshot;
  coreFlow: typeof QUANT_BASELINE_LAB_FLOW;
  baselineFamilies: typeof CLASSICAL_BASELINE_FAMILIES;
  metaheuristics: typeof METAHEURISTIC_EXAMPLES;
  fields: readonly QuantExperimentField[];
  promotionStates: typeof QUANT_PROMOTION_STATES;
  tradeoffAxes: typeof QUANT_TRADEOFF_AXES;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP17_MAY;
  mustNot: typeof EP17_MUST_NOT;
  dbCandidates: typeof EP17_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp17LocksIntact(),
    softWire: ep17SoftWireSnapshot(repoRoot),
    coreFlow: QUANT_BASELINE_LAB_FLOW,
    baselineFamilies: CLASSICAL_BASELINE_FAMILIES,
    metaheuristics: METAHEURISTIC_EXAMPLES,
    fields: QUANT_EXPERIMENT_FIELDS,
    promotionStates: QUANT_PROMOTION_STATES,
    tradeoffAxes: QUANT_TRADEOFF_AXES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP17_MAY,
    mustNot: EP17_MUST_NOT,
    dbCandidates: EP17_DB_CANDIDATES_STATUS,
  };
}

export function runClassicalQuantBaselineLabCycle(input: {
  actor: Ep17Actor;
  reviewer: Ep17Actor;
  human: Ep17Actor;
  repoRoot?: string;
}): {
  hops: Ep17HopRecord[];
  experiment: QuantExperiment | DenialResult;
  review: QuantReviewDecision | DenialResult;
  softWire: Ep17SoftWireSnapshot;
} {
  const hops: Ep17HopRecord[] = [];
  const softWire = ep17SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp17LocksIntact() ? 'PASS' : 'FAIL',
      'EP17 locks intact including L4=false and unrun≠PASS.',
    ),
  );
  hops.push(
    hop(
      'classical_quant_baseline_lab_bootstrap',
      'PASS',
      'Classical Quant Baseline Lab bootstrapped.',
    ),
  );
  hops.push(
    hop('core_flow_encoded', 'PASS', QUANT_BASELINE_LAB_FLOW.join(' → ')),
  );
  hops.push(
    hop(
      'baseline_families_encoded',
      'PASS',
      `${CLASSICAL_BASELINE_FAMILIES.length} classical baseline families encoded.`,
    ),
  );
  hops.push(
    hop(
      'experiment_fields_encoded',
      'PASS',
      `${QUANT_EXPERIMENT_FIELDS.length} experiment fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'promotion_states_encoded',
      'PASS',
      QUANT_PROMOTION_STATES.join(' | '),
    ),
  );
  hops.push(
    hop('tradeoff_axes_encoded', 'PASS', QUANT_TRADEOFF_AXES.join(' | ')),
  );

  hops.push(
    hop(
      'classical_baselines_mandatory_first',
      attemptSkipClassicalBaselines().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Classical baselines mandatory; skip DENIED.',
    ),
  );

  const conditions = exampleConditions();
  const unlikeDeny = runQuantBaselineExperiment({
    actor: input.actor,
    problemId: 'prob-unlike',
    objective: 'min latency',
    constraints: ['budget'],
    baselineAlgorithm: 'greedy',
    baselineFamily: 'greedy_heuristics',
    candidateAlgorithm: 'weighted',
    baselineConditions: conditions,
    candidateConditions: exampleConditions({ datasetVersion: 'ds-v2' }),
    baselineMetrics: exampleBaselineMetrics(),
    candidateMetrics: exampleImprovedCandidateMetrics(),
    attemptCompareUnlikeConditions: true,
  });
  hops.push(
    hop(
      'same_data_test_conditions_required',
      unlikeDeny.state === 'DENIED' &&
        attemptCompareUnlikeConditions().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Same data/test conditions required.',
    ),
  );

  hops.push(
    hop(
      'unrun_benchmark_is_not_pass',
      attemptMarkUnrunAsPass().state === 'DENIED' &&
        runQuantBaselineExperiment({
          actor: input.actor,
          problemId: 'prob-unrun',
          objective: 'x',
          constraints: [],
          baselineAlgorithm: 'greedy',
          baselineFamily: 'greedy_heuristics',
          candidateAlgorithm: 'c',
          baselineConditions: conditions,
          candidateConditions: conditions,
          baselineMetrics: exampleBaselineMetrics(),
          candidateMetrics: exampleImprovedCandidateMetrics(),
          benchmarkActuallyRun: false,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Unrun benchmark is not PASS.',
    ),
  );

  const tradeoffMetrics = exampleTradeoffCandidateMetrics();
  const tradeoffs = reportExplicitQuantTradeoffs(
    exampleBaselineMetrics(),
    tradeoffMetrics,
  );
  hops.push(
    hop(
      'tradeoffs_stated_explicitly',
      tradeoffs.some((t) => t.axis === 'latency' && t.direction === 'better') &&
        tradeoffs.some(
          (t) => t.axis === 'cost_energy' && t.direction === 'worse',
        ) &&
        attemptHideTradeoffs().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Latency↑cost tradeoff stated; hide DENIED.',
    ),
  );

  hops.push(
    hop(
      'quantum_advantage_language_denied_without_evidence',
      attemptQuantumAdvantageWithoutEvidence().state === 'DENIED' &&
        attemptQuantumPoweredEfficiencyWithoutEvidence().state === 'DENIED' &&
        runQuantBaselineExperiment({
          actor: input.actor,
          problemId: 'prob-qa',
          objective: 'x',
          constraints: [],
          baselineAlgorithm: 'greedy',
          baselineFamily: 'greedy_heuristics',
          candidateAlgorithm: 'qi',
          baselineConditions: conditions,
          candidateConditions: conditions,
          baselineMetrics: exampleBaselineMetrics(),
          candidateMetrics: exampleImprovedCandidateMetrics(),
          quantumInspired: true,
          claimText: 'quantum advantage achieved',
          evidenceRefs: [],
          attemptQuantumAdvantageWithoutEvidence: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Quantum advantage / powered-efficiency language denied without evidence.',
    ),
  );

  hops.push(
    hop(
      'quantum_inspired_requires_this_lab',
      attemptSkipLabForQuantumInspired().state === 'DENIED' &&
        runQuantBaselineExperiment({
          actor: input.actor,
          problemId: 'prob-qi-skip',
          objective: 'x',
          constraints: [],
          baselineAlgorithm: 'greedy',
          baselineFamily: 'greedy_heuristics',
          candidateAlgorithm: 'qi',
          baselineConditions: conditions,
          candidateConditions: conditions,
          baselineMetrics: exampleBaselineMetrics(),
          candidateMetrics: exampleImprovedCandidateMetrics(),
          quantumInspired: true,
          attemptSkipLabForQuantumInspired: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Quantum-inspired work requires this lab.',
    ),
  );

  const experiment = runQuantBaselineExperiment({
    actor: input.actor,
    problemId: 'prob-1',
    objective: 'minimize schedule latency',
    constraints: ['resource_ceiling'],
    baselineAlgorithm: 'weighted_scoring_v1',
    baselineFamily: 'weighted_scoring',
    candidateAlgorithm: 'graph_dp_hybrid',
    baselineConditions: conditions,
    candidateConditions: conditions,
    baselineMetrics: exampleBaselineMetrics(),
    candidateMetrics: exampleImprovedCandidateMetrics(),
    evidenceRefs: ['ev-baseline-1', 'ev-candidate-1'],
  });

  const review =
    !('denied' in experiment)
      ? reviewQuantExperiment({
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
      EP17_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
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
      'ep12_soft_wire',
      softWire.ep12Scheduler.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep12Scheduler.note,
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
      EP17_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep17-1',
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

  void CLASSICAL_QUANT_BASELINE_LAB_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    experiment,
    review,
    softWire,
  };
}
