/**
 * 62L-EX10 — Comparability Gate + Difference Classification.
 *
 * Critical mismatches → NOT_COMPARABLE.
 * Timing scopes must match (or be explicitly normalized) — never silently equate.
 * Quality must pass before speed can produce a winner.
 * Multi-run preferred; single lucky run ≠ high-confidence pathway.
 * Simulator ≠ physical QPU performance representation.
 */

import { normalizePair } from './benchmark-normalizer.ts';
import type {
  ComparabilityState,
  DifferenceClass,
  ExperimentSide,
  MatchFlags,
  NeuralLearningUpdate,
  ObjectiveWinner,
  WinnerState,
} from './types.ts';
import { EX10_LOCKS } from './types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

export type ComparabilityGateInput = {
  comparisonId: string;
  baseline: ExperimentSide;
  candidate: ExperimentSide;
  actorTenantId: string;
  actorUniverseId: string;
  networkOnline?: boolean;
  externalDataRequired?: boolean;
  waitingProvider?: boolean;
  /** Explicit timing-scope normalization authorization. */
  timingScopeNormalized?: boolean;
};

export type ComparabilityGateResult = {
  comparisonId: string;
  state: ComparabilityState;
  reasons: string[];
  differenceClasses: DifferenceClass[];
  matchFlags: MatchFlags;
  winnerState: WinnerState;
  objectiveWinners: Partial<Record<ObjectiveWinner, 'BASELINE' | 'CANDIDATE' | 'TIE' | 'NA'>>;
  confidence: number;
  highConfidenceWinner: boolean;
  preciseCostComparison: boolean;
  preciseEnergyComparison: boolean;
  neuralUpdate: NeuralLearningUpdate;
  createdAt: string;
};

function criteriaEqual(
  a: ExperimentSide['successCriteria'],
  b: ExperimentSide['successCriteria'],
): boolean {
  return (
    a.criteriaId === b.criteriaId &&
    a.objective === b.objective &&
    a.qualityTarget === b.qualityTarget &&
    a.accuracyTolerance === b.accuracyTolerance &&
    a.mustSatisfyConstraints === b.mustSatisfyConstraints &&
    a.outputObjective === b.outputObjective
  );
}

function hardwareComparable(a: ExperimentSide, b: ExperimentSide): {
  ok: boolean;
  partial: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const ha = a.hardware;
  const hb = b.hardware;

  // Cross class classical devices: require same class + model/version/precision/batch for full compare
  if (
    (ha.deviceClass === 'CPU' ||
      ha.deviceClass === 'GPU' ||
      ha.deviceClass === 'NPU') &&
    (hb.deviceClass === 'CPU' ||
      hb.deviceClass === 'GPU' ||
      hb.deviceClass === 'NPU')
  ) {
    if (ha.deviceClass !== hb.deviceClass) {
      reasons.push('DEVICE_CLASS_MISMATCH');
      return { ok: false, partial: false, reasons };
    }
    const vendorMismatch =
      ha.deviceVendor !== null &&
      hb.deviceVendor !== null &&
      ha.deviceVendor !== hb.deviceVendor;
    const modelMismatch =
      ha.modelVersion !== null &&
      hb.modelVersion !== null &&
      ha.modelVersion !== hb.modelVersion;
    if (vendorMismatch || modelMismatch) {
      if (
        a.precision === b.precision &&
        a.batchSize === b.batchSize &&
        a.algorithmVersion === b.algorithmVersion &&
        a.inputHash === b.inputHash
      ) {
        reasons.push('CROSS_VENDOR_SAME_INPUT_PARTIAL');
        return { ok: true, partial: true, reasons };
      }
      reasons.push('CROSS_VENDOR_NOT_COMPARABLE');
      return { ok: false, partial: false, reasons };
    }
  }

  if (ha.runtimeVersion !== hb.runtimeVersion) {
    reasons.push('RUNTIME_VERSION_MISMATCH');
    return { ok: false, partial: false, reasons };
  }

  return { ok: true, partial: false, reasons };
}

function classHonesty(
  baseline: ExperimentSide,
  candidate: ExperimentSide,
): { ok: boolean; difference?: DifferenceClass; reasons: string[] } {
  const reasons: string[] = [];
  const classes = new Set([
    baseline.executionClass,
    candidate.executionClass,
  ]);

  // Simulator must never represent physical-QPU performance.
  if (
    (baseline.executionClass === 'SIMULATED_QUANTUM' &&
      candidate.executionClass === 'PHYSICAL_QPU') ||
    (baseline.executionClass === 'PHYSICAL_QPU' &&
      candidate.executionClass === 'SIMULATED_QUANTUM')
  ) {
    return {
      ok: false,
      difference: 'SIMULATOR_VS_PHYSICAL',
      reasons: ['SIMULATOR_CANNOT_REPRESENT_PHYSICAL_QPU_PERFORMANCE'],
    };
  }

  // Cross-class comparisons require honest labels; treated as partial at best.
  if (classes.size > 1) {
    reasons.push('CROSS_CLASS_COMPARISON_REQUIRES_HONEST_LABELS');
    reasons.push(
      `CLASSES:${baseline.executionClass}_vs_${candidate.executionClass}`,
    );
    return { ok: true, difference: 'CLASS_CROSS_LABEL', reasons };
  }

  return { ok: true, reasons };
}

function physicalQpuEvidenceOk(side: ExperimentSide): boolean {
  if (side.executionClass !== 'PHYSICAL_QPU') return true;
  return (
    side.providerContextEvidence === true &&
    side.providerId !== null &&
    side.queueMs !== null &&
    side.submitMs !== null &&
    side.execMs !== null &&
    side.shots !== null &&
    side.preProcessMs !== null &&
    side.postProcessMs !== null &&
    side.qpuTimingScopes.includes('QPU_EXECUTION_ONLY') &&
    side.qpuTimingScopes.includes('END_TO_END_HYBRID_RUNTIME')
  );
}

function buildMatchFlags(
  baseline: ExperimentSide,
  candidate: ExperimentSide,
  hw: ReturnType<typeof hardwareComparable>,
  classResult: ReturnType<typeof classHonesty>,
): MatchFlags {
  return {
    sameProblemDefinition:
      baseline.problemClass === candidate.problemClass &&
      baseline.problemVersion === candidate.problemVersion,
    sameProblemSize: baseline.problemSize === candidate.problemSize,
    sameInput: baseline.inputHash === candidate.inputHash,
    sameDataset:
      baseline.datasetVersion === candidate.datasetVersion &&
      baseline.datasetSize === candidate.datasetSize,
    sameObjective:
      baseline.successCriteria.objective ===
      candidate.successCriteria.objective,
    sameQualityTarget:
      baseline.successCriteria.qualityTarget ===
      candidate.successCriteria.qualityTarget,
    sameQualityMetricSchema:
      baseline.qualityMetricSchema === candidate.qualityMetricSchema,
    sameSuccessCriteria: criteriaEqual(
      baseline.successCriteria,
      candidate.successCriteria,
    ),
    samePrecision: baseline.precision === candidate.precision,
    sameTolerance: baseline.tolerance === candidate.tolerance,
    sameBatchSize: baseline.batchSize === candidate.batchSize,
    sameTimingScope: baseline.timingScope === candidate.timingScope,
    hardwareContextComparable: hw.ok,
    randomnessControlled:
      baseline.seed !== null &&
      candidate.seed !== null &&
      baseline.samplingMethod !== null &&
      candidate.samplingMethod !== null,
    classLabelHonest: classResult.ok && classResult.difference !== 'SIMULATOR_VS_PHYSICAL',
    costMethodsComparable:
      baseline.costMethod === candidate.costMethod &&
      baseline.costMethod !== 'UNKNOWN' &&
      candidate.costMethod !== 'UNKNOWN' &&
      !(
        (baseline.costMethod === 'MEASURED' &&
          candidate.costMethod === 'UNKNOWN') ||
        (candidate.costMethod === 'MEASURED' &&
          baseline.costMethod === 'UNKNOWN')
      ),
    energyMethodsComparable:
      baseline.energyMethod === candidate.energyMethod &&
      baseline.energyMethod !== 'UNKNOWN',
    providerEvidenceAdequate:
      physicalQpuEvidenceOk(baseline) && physicalQpuEvidenceOk(candidate),
  };
}

function decideWinner(
  baseline: ExperimentSide,
  candidate: ExperimentSide,
  state: ComparabilityState,
  statistical: boolean,
): {
  winnerState: WinnerState;
  objectiveWinners: ComparabilityGateResult['objectiveWinners'];
  highConfidenceWinner: boolean;
} {
  const objectiveWinners: ComparabilityGateResult['objectiveWinners'] = {
    BEST_LATENCY: 'NA',
    BEST_THROUGHPUT: 'NA',
    BEST_MEMORY: 'NA',
    BEST_COST: 'NA',
    BEST_LOCAL_PRIVACY: 'NA',
    BEST_QUALITY: 'NA',
    BEST_RELIABILITY: 'NA',
  };

  if (state === 'NOT_COMPARABLE' || state === 'DENIED') {
    return {
      winnerState: 'NOT_COMPARABLE',
      objectiveWinners,
      highConfidenceWinner: false,
    };
  }
  if (
    state === 'INSUFFICIENT_EVIDENCE' ||
    state === 'WAITING_DATA' ||
    state === 'WAITING_PROVIDER' ||
    state === 'STALE_COMPARISON'
  ) {
    return {
      winnerState: 'INSUFFICIENT_EVIDENCE',
      objectiveWinners,
      highConfidenceWinner: false,
    };
  }

  // Quality must pass before speed winner.
  if (!baseline.qualityPassed || !candidate.qualityPassed) {
    return {
      winnerState: 'INSUFFICIENT_EVIDENCE',
      objectiveWinners,
      highConfidenceWinner: false,
    };
  }

  const bLat =
    baseline.runtimesMs.length > 0
      ? baseline.runtimesMs.reduce((a, b) => a + b, 0) /
        baseline.runtimesMs.length
      : baseline.runtimeMs;
  const cLat =
    candidate.runtimesMs.length > 0
      ? candidate.runtimesMs.reduce((a, b) => a + b, 0) /
        candidate.runtimesMs.length
      : candidate.runtimeMs;

  if (bLat !== null && cLat !== null) {
    if (Math.abs(bLat - cLat) < 1e-9) objectiveWinners.BEST_LATENCY = 'TIE';
    else
      objectiveWinners.BEST_LATENCY = bLat < cLat ? 'BASELINE' : 'CANDIDATE';
  }

  if (baseline.qualityScore !== null && candidate.qualityScore !== null) {
    if (baseline.qualityScore === candidate.qualityScore)
      objectiveWinners.BEST_QUALITY = 'TIE';
    else
      objectiveWinners.BEST_QUALITY =
        baseline.qualityScore > candidate.qualityScore
          ? 'BASELINE'
          : 'CANDIDATE';
  }

  if (
    baseline.costMethod !== 'UNKNOWN' &&
    candidate.costMethod !== 'UNKNOWN' &&
    baseline.costMethod === candidate.costMethod &&
    baseline.costValue !== null &&
    candidate.costValue !== null
  ) {
    objectiveWinners.BEST_COST =
      baseline.costValue === candidate.costValue
        ? 'TIE'
        : baseline.costValue < candidate.costValue
          ? 'BASELINE'
          : 'CANDIDATE';
  }

  const lat = objectiveWinners.BEST_LATENCY;
  const qual = objectiveWinners.BEST_QUALITY;
  let winnerState: WinnerState = 'STATISTICAL_TIE';
  if (lat === 'BASELINE' && (qual === 'BASELINE' || qual === 'TIE' || qual === 'NA')) {
    winnerState = 'BASELINE_BETTER';
  } else if (
    lat === 'CANDIDATE' &&
    (qual === 'CANDIDATE' || qual === 'TIE' || qual === 'NA')
  ) {
    winnerState = 'CANDIDATE_BETTER';
  } else if (
    (lat === 'BASELINE' && qual === 'CANDIDATE') ||
    (lat === 'CANDIDATE' && qual === 'BASELINE')
  ) {
    winnerState = 'TRADEOFF';
  } else if (lat === 'TIE') {
    winnerState = 'STATISTICAL_TIE';
  }

  const highConfidenceWinner =
    state === 'COMPARABLE' &&
    statistical &&
    (winnerState === 'BASELINE_BETTER' ||
      winnerState === 'CANDIDATE_BETTER') &&
    !EX10_LOCKS.SINGLE_LUCKY_RUN_HIGH_CONFIDENCE;

  return { winnerState, objectiveWinners, highConfidenceWinner };
}

function neuralFromState(
  state: ComparabilityState,
  highConfidenceWinner: boolean,
): NeuralLearningUpdate {
  const base = {
    permissionsChanged: false as const,
    guardianChanged: false as const,
    rlsChanged: false as const,
  };

  if (state === 'NOT_COMPARABLE' || state === 'DENIED') {
    return {
      ...base,
      strengthen: false,
      strength: 'NONE',
      weightDelta: 0,
      reason: 'NOT_COMPARABLE_NO_WINNER_LEARNING',
    };
  }
  if (state === 'PARTIALLY_COMPARABLE') {
    return {
      ...base,
      strengthen: true,
      strength: 'WEAK',
      weightDelta: 0.001,
      reason: 'PARTIAL_COMPARABLE_WEAK_UPDATE',
    };
  }
  if (state === 'COMPARABLE' && highConfidenceWinner) {
    return {
      ...base,
      strengthen: true,
      strength: 'STRONG',
      weightDelta: 0.01,
      reason: 'COMPARABLE_SUFFICIENT_EVIDENCE_STRONG_UPDATE',
    };
  }
  if (state === 'COMPARABLE') {
    return {
      ...base,
      strengthen: true,
      strength: 'WEAK',
      weightDelta: 0.002,
      reason: 'COMPARABLE_BUT_LOW_CONFIDENCE_WEAK_UPDATE',
    };
  }
  return {
    ...base,
    strengthen: false,
    strength: 'NONE',
    weightDelta: 0,
    reason: 'NO_NEURAL_UPDATE',
  };
}

/**
 * Core comparability gate.
 */
export function evaluateComparabilityGate(
  input: ComparabilityGateInput,
): ComparabilityGateResult {
  const reasons: string[] = [];
  const differenceClasses: DifferenceClass[] = [];
  const { baseline, candidate } = input;

  if (input.waitingProvider) {
    return terminal(
      input.comparisonId,
      'WAITING_PROVIDER',
      ['WAITING_PROVIDER'],
      baseline,
      candidate,
      ['OTHER'],
    );
  }

  if (input.externalDataRequired && input.networkOnline === false) {
    return terminal(
      input.comparisonId,
      'WAITING_DATA',
      ['OFFLINE_EXTERNAL_DATA_WAITING_DATA'],
      baseline,
      candidate,
      ['OTHER'],
    );
  }

  if (
    baseline.tenantId !== input.actorTenantId ||
    candidate.tenantId !== input.actorTenantId
  ) {
    return terminal(
      input.comparisonId,
      'DENIED',
      ['CROSS_TENANT_DENIED'],
      baseline,
      candidate,
      ['OTHER'],
    );
  }
  if (
    baseline.universeId !== input.actorUniverseId ||
    candidate.universeId !== input.actorUniverseId
  ) {
    return terminal(
      input.comparisonId,
      'DENIED',
      ['CROSS_UNIVERSE_DENIED'],
      baseline,
      candidate,
      ['OTHER'],
    );
  }

  if (
    baseline.stale ||
    candidate.stale ||
    baseline.materialChangeSinceComparison ||
    candidate.materialChangeSinceComparison
  ) {
    return terminal(
      input.comparisonId,
      'STALE_COMPARISON',
      ['STALE_RUNTIME_OR_MATERIAL_CHANGE'],
      baseline,
      candidate,
      ['STALE'],
    );
  }

  const hw = hardwareComparable(baseline, candidate);
  const classResult = classHonesty(baseline, candidate);
  const flags = buildMatchFlags(baseline, candidate, hw, classResult);
  const normalized = normalizePair(baseline, candidate);

  let state: ComparabilityState = 'COMPARABLE';

  if (!flags.sameProblemDefinition) {
    state = 'NOT_COMPARABLE';
    reasons.push('PROBLEM_DEFINITION_MISMATCH');
    differenceClasses.push('PROBLEM_MISMATCH');
  }
  if (!flags.sameProblemSize) {
    state = 'NOT_COMPARABLE';
    reasons.push('PROBLEM_SIZE_MISMATCH');
    differenceClasses.push('SIZE_MISMATCH');
  }
  if (!flags.sameInput || !flags.sameDataset) {
    state = 'NOT_COMPARABLE';
    reasons.push('INPUT_OR_DATASET_MISMATCH');
    differenceClasses.push('PROBLEM_MISMATCH');
  }
  if (!flags.sameObjective) {
    state = 'NOT_COMPARABLE';
    reasons.push('OBJECTIVE_MISMATCH');
    differenceClasses.push('OBJECTIVE_MISMATCH');
  }
  if (!flags.sameQualityTarget || !flags.sameQualityMetricSchema) {
    state = 'NOT_COMPARABLE';
    reasons.push('QUALITY_TARGET_OR_SCHEMA_MISMATCH');
    differenceClasses.push('QUALITY_TARGET_MISMATCH');
  }
  if (!flags.sameSuccessCriteria) {
    state = 'NOT_COMPARABLE';
    reasons.push('SUCCESS_CRITERIA_MISMATCH');
    differenceClasses.push('OBJECTIVE_MISMATCH');
  }
  if (!flags.samePrecision || !flags.sameTolerance) {
    state = 'NOT_COMPARABLE';
    reasons.push('PRECISION_OR_TOLERANCE_MISMATCH');
    differenceClasses.push('OTHER');
  }
  if (!flags.sameBatchSize) {
    state = 'NOT_COMPARABLE';
    reasons.push('BATCH_SIZE_MISMATCH');
    differenceClasses.push('OTHER');
  }

  if (!flags.sameTimingScope) {
    if (input.timingScopeNormalized === true) {
      reasons.push('TIMING_SCOPE_NORMALIZED_EXPLICITLY');
      if (state === 'COMPARABLE') state = 'PARTIALLY_COMPARABLE';
      differenceClasses.push('TIMING_SCOPE_MISMATCH');
    } else {
      state = 'NOT_COMPARABLE';
      reasons.push('TIMING_SCOPE_MISMATCH_WITHOUT_NORMALIZATION');
      differenceClasses.push('TIMING_SCOPE_MISMATCH');
    }
  }

  if (!classResult.ok) {
    state = 'NOT_COMPARABLE';
    reasons.push(...classResult.reasons);
    if (classResult.difference) differenceClasses.push(classResult.difference);
  } else if (classResult.difference === 'CLASS_CROSS_LABEL') {
    if (state === 'COMPARABLE') state = 'PARTIALLY_COMPARABLE';
    reasons.push(...classResult.reasons);
    differenceClasses.push('CLASS_CROSS_LABEL');
  }

  if (!hw.ok) {
    state = 'NOT_COMPARABLE';
    reasons.push(...hw.reasons);
    differenceClasses.push('HARDWARE_CONTEXT_MISMATCH');
  } else if (hw.partial) {
    if (state === 'COMPARABLE') state = 'PARTIALLY_COMPARABLE';
    reasons.push(...hw.reasons);
    differenceClasses.push('CROSS_VENDOR_PARTIAL');
  }

  if (!flags.providerEvidenceAdequate) {
    state = 'NOT_COMPARABLE';
    reasons.push('PHYSICAL_QPU_REQUIRES_PROVIDER_CONTEXT_EVIDENCE');
    differenceClasses.push('INSUFFICIENT_PROVIDER_EVIDENCE');
  }

  // Cost: MEASURED vs UNKNOWN → not precise
  const measuredVsUnknownCost =
    (baseline.costMethod === 'MEASURED' &&
      candidate.costMethod === 'UNKNOWN') ||
    (candidate.costMethod === 'MEASURED' &&
      baseline.costMethod === 'UNKNOWN') ||
    (baseline.costMethod === 'UNKNOWN') !==
      (candidate.costMethod === 'UNKNOWN');
  // simplify: any UNKNOWN on either side or method mismatch
  const preciseCostComparison =
    baseline.costMethod === candidate.costMethod &&
    baseline.costMethod === 'MEASURED' &&
    candidate.costMethod === 'MEASURED' &&
    baseline.costValue !== null &&
    candidate.costValue !== null &&
    !EX10_LOCKS.PRECISE_COST_WHEN_UNKNOWN;

  if (
    baseline.costMethod !== candidate.costMethod ||
    baseline.costMethod === 'UNKNOWN' ||
    candidate.costMethod === 'UNKNOWN'
  ) {
    reasons.push('COST_METHODS_NOT_PRECISELY_COMPARABLE');
    differenceClasses.push('COST_METHOD_MISMATCH');
    if (state === 'COMPARABLE') state = 'PARTIALLY_COMPARABLE';
  }
  void measuredVsUnknownCost;

  // Energy mixed → PARTIALLY_COMPARABLE
  const preciseEnergyComparison =
    baseline.energyMethod === candidate.energyMethod &&
    baseline.energyMethod === 'MEASURED';
  if (baseline.energyMethod !== candidate.energyMethod) {
    reasons.push('ENERGY_METHODS_MIXED_PARTIAL');
    differenceClasses.push('ENERGY_METHOD_MIXED');
    if (state === 'COMPARABLE') state = 'PARTIALLY_COMPARABLE';
  }

  if (!flags.randomnessControlled) {
    reasons.push('UNCONTROLLED_RANDOMNESS_LOWERS_CONFIDENCE');
    differenceClasses.push('RANDOMNESS_UNCONTROLLED');
    if (state === 'COMPARABLE') state = 'PARTIALLY_COMPARABLE';
  }

  const statistical =
    normalized.baseline.metrics.statistical &&
    normalized.candidate.metrics.statistical;

  if (!statistical && state === 'COMPARABLE') {
    reasons.push('SINGLE_RUN_CANNOT_CREATE_HIGH_CONFIDENCE_WINNER');
    differenceClasses.push('SINGLE_RUN_LOW_CONFIDENCE');
  }

  if (
    (!baseline.qualityPassed || !candidate.qualityPassed) &&
    (state === 'COMPARABLE' || state === 'PARTIALLY_COMPARABLE')
  ) {
    reasons.push('QUALITY_MUST_PASS_BEFORE_SPEED_WINNER');
    state = 'INSUFFICIENT_EVIDENCE';
  }

  if (state === 'COMPARABLE' && differenceClasses.length === 0) {
    reasons.push('HARD_MATCH_COMPARABLE');
  }

  // Never collapse to generic PASS
  if (EX10_LOCKS.COLLAPSE_TO_GENERIC_PASS) {
    throw new Error('EX10_LOCK_VIOLATION_COLLAPSE_PASS');
  }

  const { winnerState, objectiveWinners, highConfidenceWinner } = decideWinner(
    baseline,
    candidate,
    state,
    statistical,
  );

  // Single-run cannot be high-confidence even if COMPARABLE
  const hc = highConfidenceWinner && statistical;

  const confidence =
    state === 'COMPARABLE' && hc
      ? 0.9
      : state === 'COMPARABLE'
        ? 0.55
        : state === 'PARTIALLY_COMPARABLE'
          ? 0.4
          : state === 'NOT_COMPARABLE'
            ? 0.95
            : 0.2;

  return {
    comparisonId: input.comparisonId,
    state,
    reasons: [...new Set(reasons)],
    differenceClasses: [...new Set(differenceClasses)],
    matchFlags: flags,
    winnerState:
      state === 'NOT_COMPARABLE'
        ? 'NOT_COMPARABLE'
        : !statistical &&
            (winnerState === 'BASELINE_BETTER' ||
              winnerState === 'CANDIDATE_BETTER')
          ? winnerState
          : winnerState,
    objectiveWinners,
    confidence,
    highConfidenceWinner: hc,
    preciseCostComparison,
    preciseEnergyComparison,
    neuralUpdate: neuralFromState(state, hc),
    createdAt: nowIso(),
  };
}

function terminal(
  comparisonId: string,
  state: ComparabilityState,
  reasons: string[],
  baseline: ExperimentSide,
  candidate: ExperimentSide,
  differenceClasses: DifferenceClass[],
): ComparabilityGateResult {
  const hw = hardwareComparable(baseline, candidate);
  const classResult = classHonesty(baseline, candidate);
  return {
    comparisonId,
    state,
    reasons,
    differenceClasses,
    matchFlags: buildMatchFlags(baseline, candidate, hw, classResult),
    winnerState:
      state === 'NOT_COMPARABLE' || state === 'DENIED'
        ? 'NOT_COMPARABLE'
        : 'INSUFFICIENT_EVIDENCE',
    objectiveWinners: {
      BEST_LATENCY: 'NA',
      BEST_THROUGHPUT: 'NA',
      BEST_MEMORY: 'NA',
      BEST_COST: 'NA',
      BEST_LOCAL_PRIVACY: 'NA',
      BEST_QUALITY: 'NA',
      BEST_RELIABILITY: 'NA',
    },
    confidence: 0.2,
    highConfidenceWinner: false,
    preciseCostComparison: false,
    preciseEnergyComparison: false,
    neuralUpdate: neuralFromState(state, false),
    createdAt: nowIso(),
  };
}

/**
 * Learning update helper — ranking/confidence only; never permissions.
 */
export function applyLearningFromGate(
  gate: ComparabilityGateResult,
): NeuralLearningUpdate {
  if (EX10_LOCKS.LEARNING_ALTERS_PERMISSIONS) {
    throw new Error('EX10_LOCK_VIOLATION_LEARNING_PERMISSIONS');
  }
  if (
    gate.state === 'NOT_COMPARABLE' &&
    EX10_LOCKS.WINNER_LEARNING_FROM_NOT_COMPARABLE === false
  ) {
    return gate.neuralUpdate;
  }
  return gate.neuralUpdate;
}
