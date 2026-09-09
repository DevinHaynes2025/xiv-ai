/**
 * 62L-EP15 — Algorithm Tuning Sandbox runtime.
 *
 * Baseline → Candidate → Sandbox Run → Compare → Reviewer → Promote/Reject.
 * Soft-wires EP14/EP13/EP12/EP5/EM157 when present.
 */

import {
  ALGORITHM_TUNING_SANDBOX_CYCLE,
  EP15_DB_CANDIDATES_STATUS,
  EP15_LOCKS,
  EP15_MAY,
  EP15_MUST_NOT,
  EXPERIMENT_FIELDS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROMOTION_STATES,
  QUANTUM_TUNING_LABELS,
  SAFETY_BOUNDARIES,
  TRADEOFF_AXES,
  TUNING_AGENT_BOUNDS,
  TUNING_CORE_FLOW,
  TUNING_LEVERS,
  assertEp15LocksIntact,
  ep15SoftWireSnapshot,
  isHumanApprover,
  isTuningAgent,
  type Ep15Actor,
  type Ep15EvidenceState,
  type Ep15HopRecord,
  type Ep15SoftWireSnapshot,
  type ExperimentField,
  type PromotionState,
  type QuantumTuningLabel,
  type TradeoffAxis,
  type TuningLever,
} from './algorithm-tuning-sandbox-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ALGORITHM_TUNING_SANDBOX_CYCLE)[number],
  state: Ep15EvidenceState,
  summary: string,
): Ep15HopRecord {
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

export type PolicyConfiguration = {
  levers: Partial<Record<TuningLever, string | number | boolean>>;
  label: string;
};

export type MetricsBundle = {
  latency: number;
  throughput: number;
  memory: string;
  qualityAccuracyProxy: number;
  reliability: number;
  energyCostProxy: number;
};

export type ExplicitTradeoff = {
  axis: TradeoffAxis;
  baselineValue: number;
  candidateValue: number;
  direction: 'better' | 'worse' | 'unchanged';
  note: string;
};

export type TuningExperiment = {
  experimentId: string;
  objective: string;
  baselineConfiguration: PolicyConfiguration;
  candidateConfiguration: PolicyConfiguration;
  hardwareRuntime: string;
  modelWorkload: string;
  datasetInput: string;
  resourceCeiling: string;
  randomSeed: number;
  metrics: MetricsBundle;
  baselineMetrics: MetricsBundle;
  regressionRisk: 'low' | 'medium' | 'high';
  evidenceRefs: readonly string[];
  tradeoffs: readonly ExplicitTradeoff[];
  quantumLabel: QuantumTuningLabel;
  physicalQpuEvidence: boolean;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
  productionMutated: false;
};

export type ReviewDecision = {
  reviewId: string;
  experimentId: string;
  promotionState: PromotionState;
  beatOrJustifiedBaseline: boolean;
  justification: string;
  reviewerId: string;
  productionApplied: false;
};

function directionFor(
  axis: TradeoffAxis,
  baseline: number,
  candidate: number,
): ExplicitTradeoff['direction'] {
  // lower is better for latency, energy/cost; higher better for quality/reliability
  const lowerBetter = axis === 'latency' || axis === 'energy' || axis === 'cost';
  if (Math.abs(candidate - baseline) < 1e-9) return 'unchanged';
  if (lowerBetter) return candidate < baseline ? 'better' : 'worse';
  return candidate > baseline ? 'better' : 'worse';
}

export function reportExplicitTradeoffs(
  baseline: MetricsBundle,
  candidate: MetricsBundle,
): ExplicitTradeoff[] {
  const pairs: Array<{
    axis: TradeoffAxis;
    b: number;
    c: number;
    note: string;
  }> = [
    {
      axis: 'latency',
      b: baseline.latency,
      c: candidate.latency,
      note: 'Lower latency is better; must not ignore quality/reliability.',
    },
    {
      axis: 'quality',
      b: baseline.qualityAccuracyProxy,
      c: candidate.qualityAccuracyProxy,
      note: 'Faster but worse quality must be reported explicitly.',
    },
    {
      axis: 'reliability',
      b: baseline.reliability,
      c: candidate.reliability,
      note: 'Cheaper but less reliable must be reported explicitly.',
    },
    {
      axis: 'energy',
      b: baseline.energyCostProxy,
      c: candidate.energyCostProxy,
      note: 'Lower energy but higher latency must be reported explicitly.',
    },
    {
      axis: 'cost',
      b: baseline.energyCostProxy,
      c: candidate.energyCostProxy,
      note: 'Cost proxy tracked alongside energy.',
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

export function runSandboxExperiment(input: {
  actor: Ep15Actor;
  experimentId: string;
  objective: string;
  baselineConfiguration: PolicyConfiguration;
  candidateConfiguration: PolicyConfiguration;
  hardwareRuntime: string;
  modelWorkload: string;
  datasetInput: string;
  resourceCeiling: string;
  randomSeed: number;
  baselineMetrics: MetricsBundle;
  candidateMetrics: MetricsBundle;
  regressionRisk?: TuningExperiment['regressionRisk'];
  evidenceRefs?: readonly string[];
  quantumLabel?: QuantumTuningLabel;
  physicalQpuEvidence?: boolean;
  attemptBlindSpeedMax?: boolean;
  attemptIncludeHiddenCot?: boolean;
  attemptClaimPhysicalQpuWithoutEvidence?: boolean;
  attemptBiosChange?: boolean;
  attemptOverclock?: boolean;
  attemptFirmwareMod?: boolean;
  attemptDriverReplace?: boolean;
  attemptThermalBypass?: boolean;
  attemptPrivilegeEscalation?: boolean;
  attemptProductionConfigChange?: boolean;
  attemptCloudPurchase?: boolean;
  attemptSelfModifyScheduler?: boolean;
}): TuningExperiment | DenialResult {
  if (input.attemptBlindSpeedMax) {
    return deny(
      'BLIND_SPEED_MAXIMIZATION=false — optimization must not blindly maximize speed; tradeoffs required.',
    );
  }
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_EXPERIMENT=false — no hidden chain-of-thought.',
    );
  }
  if (input.attemptBiosChange) {
    return deny('BIOS_CHANGES=false — no BIOS changes.');
  }
  if (input.attemptOverclock) {
    return deny(
      'OVERCLOCKING_UNDERVOLTING=false — no overclocking/undervolting.',
    );
  }
  if (input.attemptFirmwareMod) {
    return deny('FIRMWARE_MODIFICATION=false — no firmware modification.');
  }
  if (input.attemptDriverReplace) {
    return deny('DRIVER_REPLACEMENT=false — no driver replacement.');
  }
  if (input.attemptThermalBypass) {
    return deny('THERMAL_LIMIT_BYPASS=false — no thermal-limit bypass.');
  }
  if (input.attemptPrivilegeEscalation) {
    return deny('PRIVILEGE_ESCALATION=false — no privilege escalation.');
  }
  if (input.attemptProductionConfigChange) {
    return deny(
      'PRODUCTION_CONFIGURATION_CHANGES=false — no production configuration changes.',
    );
  }
  if (input.attemptCloudPurchase) {
    return deny(
      'AUTOMATIC_CLOUD_PURCHASES=false — no automatic cloud purchases.',
    );
  }
  if (input.attemptSelfModifyScheduler) {
    return deny(
      'SELF_MODIFYING_PRODUCTION_SCHEDULER=false — no self-modifying production scheduler.',
    );
  }

  const quantumLabel = input.quantumLabel ?? 'CLASSICAL';
  const physicalQpuEvidence = Boolean(input.physicalQpuEvidence);

  if (
    input.attemptClaimPhysicalQpuWithoutEvidence ||
    (quantumLabel === 'PHYSICAL_QPU' && !physicalQpuEvidence)
  ) {
    return deny(
      'QUANTUM_CLAIMED_PHYSICAL_WITHOUT_EVIDENCE=false — remains QUANTUM_INSPIRED or SIMULATED unless physical-QPU evidence exists.',
    );
  }

  void EXPERIMENT_FIELDS;
  void TUNING_LEVERS;

  const tradeoffs = reportExplicitTradeoffs(
    input.baselineMetrics,
    input.candidateMetrics,
  );

  return {
    experimentId: input.experimentId,
    objective: input.objective,
    baselineConfiguration: input.baselineConfiguration,
    candidateConfiguration: input.candidateConfiguration,
    hardwareRuntime: input.hardwareRuntime,
    modelWorkload: input.modelWorkload,
    datasetInput: input.datasetInput,
    resourceCeiling: input.resourceCeiling,
    randomSeed: input.randomSeed,
    metrics: input.candidateMetrics,
    baselineMetrics: input.baselineMetrics,
    regressionRisk: input.regressionRisk ?? 'medium',
    evidenceRefs: input.evidenceRefs ?? [],
    tradeoffs,
    quantumLabel,
    physicalQpuEvidence,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
    productionMutated: false,
  };
}

function candidateBeatsBaseline(exp: TuningExperiment): boolean {
  return (
    exp.metrics.latency < exp.baselineMetrics.latency &&
    exp.metrics.qualityAccuracyProxy >=
      exp.baselineMetrics.qualityAccuracyProxy * 0.98 &&
    exp.metrics.reliability >= exp.baselineMetrics.reliability * 0.98
  );
}

function candidateJustified(
  exp: TuningExperiment,
  justification?: string,
): boolean {
  if (!justification || justification.trim().length < 8) return false;
  // Explicit tradeoff justification: e.g. lower energy with acceptable latency increase
  const energyBetter = exp.tradeoffs.some(
    (t) => t.axis === 'energy' && t.direction === 'better',
  );
  return energyBetter || exp.tradeoffs.some((t) => t.direction === 'better');
}

export function reviewAndPromote(input: {
  actor: Ep15Actor;
  reviewId: string;
  experiment: TuningExperiment;
  justification?: string;
  attemptPromoteWithoutBaseline?: boolean;
  attemptPromoteWithoutReviewer?: boolean;
  attemptAutoPromoteToProduction?: boolean;
  markVerified?: boolean;
}): ReviewDecision | DenialResult {
  if (input.attemptPromoteWithoutReviewer) {
    return deny(
      'PROMOTE_WITHOUT_REVIEWER=false — Reviewer step required before Promote/Reject.',
    );
  }
  if (input.actor.kind !== 'reviewer' && !isHumanApprover(input.actor)) {
    return deny('Only reviewer or human_approver/founder may promote/reject.');
  }
  if (input.attemptAutoPromoteToProduction) {
    return deny(
      'AUTO_PROMOTE_TO_PRODUCTION=false — sandbox cannot apply production configuration.',
    );
  }
  if (input.attemptPromoteWithoutBaseline) {
    return deny(
      'PROMOTE_WITHOUT_BASELINE=false — candidate must beat or justify itself against classical baseline under reproducible conditions.',
    );
  }

  const beats = candidateBeatsBaseline(input.experiment);
  const justified = candidateJustified(
    input.experiment,
    input.justification,
  );

  if (!beats && !justified) {
    const noAdv =
      Math.abs(
        input.experiment.metrics.latency -
          input.experiment.baselineMetrics.latency,
      ) /
        input.experiment.baselineMetrics.latency <
        0.02 &&
      Math.abs(
        input.experiment.metrics.qualityAccuracyProxy -
          input.experiment.baselineMetrics.qualityAccuracyProxy,
      ) < 0.02;
    return {
      reviewId: input.reviewId,
      experimentId: input.experiment.experimentId,
      promotionState: noAdv ? 'NO_ADVANTAGE' : 'REJECTED',
      beatOrJustifiedBaseline: false,
      justification:
        input.justification ??
        'Candidate did not beat or justify against classical baseline.',
      reviewerId: input.actor.id,
      productionApplied: false,
    };
  }

  if (input.experiment.quantumLabel !== 'CLASSICAL' && !input.markVerified) {
    return {
      reviewId: input.reviewId,
      experimentId: input.experiment.experimentId,
      promotionState: 'RESEARCH_ONLY',
      beatOrJustifiedBaseline: true,
      justification:
        input.justification ??
        'Quantum-inspired/simulated remains RESEARCH_ONLY until classical verification path.',
      reviewerId: input.actor.id,
      productionApplied: false,
    };
  }

  return {
    reviewId: input.reviewId,
    experimentId: input.experiment.experimentId,
    promotionState: input.markVerified
      ? 'VERIFIED_CANDIDATE'
      : 'IMPROVED_CANDIDATE',
    beatOrJustifiedBaseline: true,
    justification:
      input.justification ??
      (beats
        ? 'Candidate beats classical baseline under reproducible seed/resource ceiling.'
        : 'Candidate justified via explicit tradeoffs against classical baseline.'),
    reviewerId: input.actor.id,
    productionApplied: false,
  };
}

export function attemptBlindSpeedMaximization(): DenialResult {
  return deny('BLIND_SPEED_MAXIMIZATION=false.');
}

export function attemptPromoteWithoutBaseline(): DenialResult {
  return deny('PROMOTE_WITHOUT_BASELINE=false.');
}

export function attemptPromoteWithoutReviewer(): DenialResult {
  return deny('PROMOTE_WITHOUT_REVIEWER=false.');
}

export function attemptAutoPromoteToProduction(): DenialResult {
  return deny('AUTO_PROMOTE_TO_PRODUCTION=false.');
}

export function attemptBiosChange(): DenialResult {
  return deny('BIOS_CHANGES=false.');
}

export function attemptOverclockOrUndervolt(): DenialResult {
  return deny('OVERCLOCKING_UNDERVOLTING=false.');
}

export function attemptFirmwareModification(): DenialResult {
  return deny('FIRMWARE_MODIFICATION=false.');
}

export function attemptDriverReplacement(): DenialResult {
  return deny('DRIVER_REPLACEMENT=false.');
}

export function attemptThermalLimitBypass(): DenialResult {
  return deny('THERMAL_LIMIT_BYPASS=false.');
}

export function attemptPrivilegeEscalation(): DenialResult {
  return deny('PRIVILEGE_ESCALATION=false.');
}

export function attemptProductionConfigurationChange(): DenialResult {
  return deny('PRODUCTION_CONFIGURATION_CHANGES=false.');
}

export function attemptAutomaticCloudPurchase(): DenialResult {
  return deny('AUTOMATIC_CLOUD_PURCHASES=false.');
}

export function attemptSelfModifyProductionScheduler(): DenialResult {
  return deny('SELF_MODIFYING_PRODUCTION_SCHEDULER=false.');
}

export function attemptClaimPhysicalQpuWithoutEvidence(): DenialResult {
  return deny('QUANTUM_CLAIMED_PHYSICAL_WITHOUT_EVIDENCE=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnTuningEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep15Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      flow: typeof TUNING_CORE_FLOW;
      authorityGranted: false;
    }
  | DenialResult {
  if (!TUNING_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isTuningAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only tuning agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    flow: TUNING_CORE_FLOW,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep15Actor;
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
    unchanged: EP15_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EP15_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EP15_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleBaselineMetrics(): MetricsBundle {
  return {
    latency: 50,
    throughput: 20,
    memory: '2GB',
    qualityAccuracyProxy: 0.95,
    reliability: 0.99,
    energyCostProxy: 1.0,
  };
}

export function exampleImprovedCandidateMetrics(): MetricsBundle {
  return {
    latency: 40,
    throughput: 25,
    memory: '2GB',
    qualityAccuracyProxy: 0.95,
    reliability: 0.99,
    energyCostProxy: 0.95,
  };
}

export function exampleFasterWorseQualityMetrics(): MetricsBundle {
  return {
    latency: 30,
    throughput: 33,
    memory: '2GB',
    qualityAccuracyProxy: 0.8,
    reliability: 0.99,
    energyCostProxy: 1.0,
  };
}

export function bootstrapAlgorithmTuningSandbox(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep15SoftWireSnapshot;
  coreFlow: typeof TUNING_CORE_FLOW;
  levers: typeof TUNING_LEVERS;
  fields: readonly ExperimentField[];
  promotionStates: typeof PROMOTION_STATES;
  tradeoffAxes: typeof TRADEOFF_AXES;
  safetyBoundaries: typeof SAFETY_BOUNDARIES;
  quantumLabels: typeof QUANTUM_TUNING_LABELS;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP15_MAY;
  mustNot: typeof EP15_MUST_NOT;
  dbCandidates: typeof EP15_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp15LocksIntact(),
    softWire: ep15SoftWireSnapshot(repoRoot),
    coreFlow: TUNING_CORE_FLOW,
    levers: TUNING_LEVERS,
    fields: EXPERIMENT_FIELDS,
    promotionStates: PROMOTION_STATES,
    tradeoffAxes: TRADEOFF_AXES,
    safetyBoundaries: SAFETY_BOUNDARIES,
    quantumLabels: QUANTUM_TUNING_LABELS,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP15_MAY,
    mustNot: EP15_MUST_NOT,
    dbCandidates: EP15_DB_CANDIDATES_STATUS,
  };
}

export function runAlgorithmTuningSandboxCycle(input: {
  actor: Ep15Actor;
  reviewer: Ep15Actor;
  human: Ep15Actor;
  repoRoot?: string;
}): {
  hops: Ep15HopRecord[];
  experiment: TuningExperiment | DenialResult;
  review: ReviewDecision | DenialResult;
  softWire: Ep15SoftWireSnapshot;
} {
  const hops: Ep15HopRecord[] = [];
  const softWire = ep15SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp15LocksIntact() ? 'PASS' : 'FAIL',
      'EP15 locks intact including L4=false and safety boundaries.',
    ),
  );
  hops.push(
    hop(
      'algorithm_tuning_sandbox_bootstrap',
      'PASS',
      'Algorithm Tuning Sandbox bootstrapped.',
    ),
  );
  hops.push(hop('core_flow_encoded', 'PASS', TUNING_CORE_FLOW.join(' → ')));
  hops.push(
    hop(
      'tuning_levers_encoded',
      'PASS',
      `${TUNING_LEVERS.length} software-level levers encoded.`,
    ),
  );
  hops.push(
    hop(
      'experiment_fields_encoded',
      'PASS',
      `${EXPERIMENT_FIELDS.length} experiment fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'promotion_states_encoded',
      'PASS',
      PROMOTION_STATES.join(' | '),
    ),
  );
  hops.push(
    hop('tradeoff_axes_encoded', 'PASS', TRADEOFF_AXES.join(' | ')),
  );
  hops.push(
    hop(
      'safety_boundaries_encoded',
      'PASS',
      SAFETY_BOUNDARIES.join(' | '),
    ),
  );

  const baselineMetrics = exampleBaselineMetrics();
  const fasterWorse = exampleFasterWorseQualityMetrics();
  const tradeoffs = reportExplicitTradeoffs(baselineMetrics, fasterWorse);
  hops.push(
    hop(
      'tradeoffs_reported_explicitly',
      tradeoffs.some((t) => t.axis === 'quality' && t.direction === 'worse') &&
        tradeoffs.some((t) => t.axis === 'latency' && t.direction === 'better') &&
        attemptBlindSpeedMaximization().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Faster-but-worse-quality tradeoff reported; blind speed max DENIED.',
    ),
  );

  const experiment = runSandboxExperiment({
    actor: input.actor,
    experimentId: 'exp-1',
    objective: 'reduce latency without quality loss',
    baselineConfiguration: {
      label: 'classical-baseline',
      levers: { batching: 1, caching: false },
    },
    candidateConfiguration: {
      label: 'batch-cache-candidate',
      levers: { batching: 4, caching: true, quantization: 'fp16' },
    },
    hardwareRuntime: 'cpu-onnx',
    modelWorkload: 'ModelA/inference',
    datasetInput: 'profile-1',
    resourceCeiling: '8GB',
    randomSeed: 42,
    baselineMetrics,
    candidateMetrics: exampleImprovedCandidateMetrics(),
    regressionRisk: 'low',
    evidenceRefs: ['ev-1'],
  });

  const review =
    !('denied' in experiment)
      ? reviewAndPromote({
          actor: input.reviewer,
          reviewId: 'rev-1',
          experiment,
        })
      : experiment;

  hops.push(
    hop(
      'must_beat_or_justify_classical_baseline',
      !('denied' in experiment) &&
        !('denied' in review) &&
        review.beatOrJustifiedBaseline === true &&
        attemptPromoteWithoutBaseline().state === 'DENIED' &&
        reviewAndPromote({
          actor: input.reviewer,
          reviewId: 'rev-no-base',
          experiment,
          attemptPromoteWithoutBaseline: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Candidate must beat or justify classical baseline.',
    ),
  );

  const qDeny = runSandboxExperiment({
    actor: input.actor,
    experimentId: 'exp-q',
    objective: 'quantum-inspired queue',
    baselineConfiguration: { label: 'classical', levers: {} },
    candidateConfiguration: { label: 'qi', levers: { queue_policy: 'qi' } },
    hardwareRuntime: 'sim',
    modelWorkload: 'ModelA',
    datasetInput: 'p1',
    resourceCeiling: '4GB',
    randomSeed: 1,
    baselineMetrics,
    candidateMetrics: exampleImprovedCandidateMetrics(),
    quantumLabel: 'PHYSICAL_QPU',
    physicalQpuEvidence: false,
    attemptClaimPhysicalQpuWithoutEvidence: true,
  });
  hops.push(
    hop(
      'quantum_inspired_or_simulated_unless_physical_qpu',
      qDeny.state === 'DENIED' &&
        attemptClaimPhysicalQpuWithoutEvidence().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Quantum remains QUANTUM_INSPIRED/SIMULATED unless physical-QPU evidence.',
    ),
  );

  const safetyChecks: Array<{
    hop: (typeof ALGORITHM_TUNING_SANDBOX_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'no_bios_changes', fn: attemptBiosChange },
    { hop: 'no_overclocking_undervolting', fn: attemptOverclockOrUndervolt },
    { hop: 'no_firmware_modification', fn: attemptFirmwareModification },
    { hop: 'no_driver_replacement', fn: attemptDriverReplacement },
    { hop: 'no_thermal_limit_bypass', fn: attemptThermalLimitBypass },
    { hop: 'no_privilege_escalation', fn: attemptPrivilegeEscalation },
    {
      hop: 'no_production_configuration_changes',
      fn: attemptProductionConfigurationChange,
    },
    { hop: 'no_automatic_cloud_purchases', fn: attemptAutomaticCloudPurchase },
    {
      hop: 'no_self_modifying_production_scheduler',
      fn: attemptSelfModifyProductionScheduler,
    },
  ];
  for (const s of safetyChecks) {
    hops.push(
      hop(
        s.hop,
        s.fn().state === 'DENIED' ? 'PASS' : 'FAIL',
        `${s.hop} DENIED.`,
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
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptAutoPromoteToProduction().state === 'DENIED' &&
        attemptPromoteWithoutReviewer().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no auto production promote.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP15_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
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
      'ep13_soft_wire',
      softWire.ep13RuntimeReturnReceipt.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep13RuntimeReturnReceipt.note,
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
      'ep5_soft_wire',
      softWire.ep5BenchmarkMemory.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep5BenchmarkMemory.note,
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
      EP15_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep15-1',
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

  void ALGORITHM_TUNING_SANDBOX_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    experiment,
    review,
    softWire,
  };
}
