/**
 * 62L-EX2 — Quantum comparison gate + performance claim rule.
 *
 * Require same problem definition/input/constraints/success criteria,
 * equivalent accuracy/tolerance/output objective, comparable runtime accounting.
 * Material differences → comparisonState=NOT_COMPARABLE.
 *
 * Never claim quantum faster/cheaper/superior/advantage from one isolated result.
 */

import { baselineSupportsStrongClaim } from './baseline.ts';
import {
  EX2_LOCKS,
  type AdvantageClaimDecision,
  type AdvantageClaimInput,
  type BaselineState,
  type CandidateReceipt,
  type ClassicalBaselineReceipt,
  type ComparabilityReceipt,
  type ComparisonState,
  type RepeatabilitySummary,
} from './types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function criteriaEqual(
  a: ClassicalBaselineReceipt['successCriteria'],
  b: CandidateReceipt['successCriteria'],
): boolean {
  return (
    a.criteriaId === b.criteriaId &&
    a.objective === b.objective &&
    a.accuracyTolerance === b.accuracyTolerance &&
    a.mustSatisfyConstraints === b.mustSatisfyConstraints &&
    a.outputObjective === b.outputObjective
  );
}

export type CompareGateInput = {
  comparisonId: string;
  baseline: ClassicalBaselineReceipt;
  candidate: CandidateReceipt;
  actorTenantId: string;
  actorUniverseId: string;
  networkOnline?: boolean;
  externalDataRequired?: boolean;
};

/**
 * Enforce tenant/Universe isolation before any comparison.
 */
export function assertBaselineScope(
  baseline: ClassicalBaselineReceipt,
  actorTenantId: string,
  actorUniverseId: string,
): { ok: true } | { ok: false; state: 'DENIED'; reason: string } {
  if (baseline.tenantId !== actorTenantId) {
    return {
      ok: false,
      state: 'DENIED',
      reason: 'CROSS_TENANT_BASELINE_DENIED',
    };
  }
  if (baseline.universeId !== actorUniverseId) {
    return {
      ok: false,
      state: 'DENIED',
      reason: 'CROSS_UNIVERSE_BASELINE_DENIED',
    };
  }
  if (
    baseline.tenantId !== baseline.tenantId ||
    actorTenantId.length === 0 ||
    actorUniverseId.length === 0
  ) {
    return { ok: false, state: 'DENIED', reason: 'SCOPE_REQUIRED' };
  }
  return { ok: true };
}

/**
 * Quantum comparison gate.
 */
export function evaluateComparability(
  input: CompareGateInput,
): ComparabilityReceipt {
  const reasons: string[] = [];
  let comparisonState: ComparisonState = 'ELIGIBLE';

  if (input.externalDataRequired && input.networkOnline === false) {
    return {
      comparisonId: input.comparisonId,
      comparisonState: 'WAITING_DATA',
      reasons: ['OFFLINE_EXTERNAL_DATA_WAITING_DATA'],
      sameProblemDefinition: false,
      sameInput: false,
      sameConstraints: false,
      sameSuccessCriteria: false,
      equivalentAccuracyTolerance: false,
      equivalentOutputObjective: false,
      comparableRuntimeAccounting: false,
      confidence: 0,
      evidenceRefs: [],
      freshness: 'UNKNOWN',
      reproducibility: 'NOT_EVALUATED',
      createdAt: nowIso(),
    };
  }

  const scope = assertBaselineScope(
    input.baseline,
    input.actorTenantId,
    input.actorUniverseId,
  );
  if (!scope.ok) {
    return {
      comparisonId: input.comparisonId,
      comparisonState: 'DENIED',
      reasons: [scope.reason],
      sameProblemDefinition: false,
      sameInput: false,
      sameConstraints: false,
      sameSuccessCriteria: false,
      equivalentAccuracyTolerance: false,
      equivalentOutputObjective: false,
      comparableRuntimeAccounting: false,
      confidence: 0,
      evidenceRefs: input.baseline.evidenceRefs,
      freshness: 'UNKNOWN',
      reproducibility: input.baseline.reproducibilityState,
      createdAt: nowIso(),
    };
  }

  if (
    input.candidate.tenantId !== input.actorTenantId ||
    input.candidate.universeId !== input.actorUniverseId
  ) {
    return {
      comparisonId: input.comparisonId,
      comparisonState: 'DENIED',
      reasons: [
        input.candidate.tenantId !== input.actorTenantId
          ? 'CROSS_TENANT_CANDIDATE_DENIED'
          : 'CROSS_UNIVERSE_CANDIDATE_DENIED',
      ],
      sameProblemDefinition: false,
      sameInput: false,
      sameConstraints: false,
      sameSuccessCriteria: false,
      equivalentAccuracyTolerance: false,
      equivalentOutputObjective: false,
      comparableRuntimeAccounting: false,
      confidence: 0,
      evidenceRefs: [],
      freshness: 'UNKNOWN',
      reproducibility: 'NOT_EVALUATED',
      createdAt: nowIso(),
    };
  }

  if (input.baseline.baselineState === 'FAILED') {
    comparisonState = 'BLOCKED';
    reasons.push('FAILED_BASELINE_COMPARISON_BLOCKED');
  }

  const strong = baselineSupportsStrongClaim(input.baseline);
  if (!strong.ok && input.baseline.baselineState === 'STALE') {
    comparisonState = 'BLOCKED';
    reasons.push(strong.reason);
  } else if (!strong.ok && input.baseline.baselineState === 'FAILED') {
    // already blocked
  } else if (!strong.ok) {
    comparisonState = 'BLOCKED';
    reasons.push(strong.reason);
  }

  const sameProblemDefinition =
    input.baseline.problemClass === input.candidate.problemClass &&
    input.baseline.problemVersion === input.candidate.problemVersion;
  if (!sameProblemDefinition) {
    comparisonState = 'NOT_COMPARABLE';
    reasons.push('PROBLEM_DEFINITION_MISMATCH');
  }

  const sameInput =
    input.baseline.inputHash === input.candidate.inputHash &&
    input.baseline.datasetVersion === input.candidate.datasetVersion;
  if (!sameInput) {
    comparisonState = 'NOT_COMPARABLE';
    reasons.push('INPUT_OR_DATASET_MISMATCH');
  }

  if (input.baseline.problemSize !== input.candidate.problemSize) {
    comparisonState = 'NOT_COMPARABLE';
    reasons.push('PROBLEM_SIZE_MISMATCH');
  }

  const sameSuccessCriteria = criteriaEqual(
    input.baseline.successCriteria,
    input.candidate.successCriteria,
  );
  if (!sameSuccessCriteria) {
    comparisonState = 'NOT_COMPARABLE';
    reasons.push('SUCCESS_CRITERIA_MISMATCH');
  }

  const equivalentAccuracyTolerance =
    input.baseline.tolerance === input.candidate.tolerance &&
    input.baseline.successCriteria.accuracyTolerance ===
      input.candidate.successCriteria.accuracyTolerance;
  if (!equivalentAccuracyTolerance) {
    comparisonState = 'NOT_COMPARABLE';
    reasons.push('TOLERANCE_MISMATCH');
  }

  const equivalentOutputObjective =
    input.baseline.successCriteria.outputObjective ===
    input.candidate.successCriteria.outputObjective;
  if (!equivalentOutputObjective) {
    comparisonState = 'NOT_COMPARABLE';
    reasons.push('OUTPUT_OBJECTIVE_MISMATCH');
  }

  // Runtime accounting comparable when both have runtimeMs or both null (pre-run).
  const comparableRuntimeAccounting =
    (input.baseline.runtimeMs === null && input.candidate.runtimeMs === null) ||
    (typeof input.baseline.runtimeMs === 'number' &&
      typeof input.candidate.runtimeMs === 'number');
  if (!comparableRuntimeAccounting) {
    comparisonState = 'NOT_COMPARABLE';
    reasons.push('RUNTIME_ACCOUNTING_NOT_COMPARABLE');
  }

  const sameConstraints =
    input.baseline.successCriteria.mustSatisfyConstraints ===
    input.candidate.successCriteria.mustSatisfyConstraints;

  const freshness =
    input.baseline.baselineState === 'STALE' ||
    input.baseline.staleTriggers.length > 0
      ? 'STALE'
      : 'FRESH';

  // DENIED / WAITING_DATA / BLOCKED / NOT_COMPARABLE win over ELIGIBLE.
  if (
    comparisonState === 'ELIGIBLE' &&
    sameProblemDefinition &&
    sameInput &&
    sameConstraints &&
    sameSuccessCriteria &&
    equivalentAccuracyTolerance &&
    equivalentOutputObjective &&
    comparableRuntimeAccounting &&
    input.baseline.problemSize === input.candidate.problemSize
  ) {
    comparisonState = 'ELIGIBLE';
    reasons.push('COMPARISON_ELIGIBLE');
  }

  const confidence =
    comparisonState === 'ELIGIBLE'
      ? 0.85
      : comparisonState === 'NOT_COMPARABLE'
        ? 0.95
        : 0.2;

  return {
    comparisonId: input.comparisonId,
    comparisonState,
    reasons,
    sameProblemDefinition,
    sameInput,
    sameConstraints,
    sameSuccessCriteria,
    equivalentAccuracyTolerance,
    equivalentOutputObjective,
    comparableRuntimeAccounting,
    confidence,
    evidenceRefs: [
      ...input.baseline.evidenceRefs,
      ...input.candidate.evidenceRefs,
    ],
    freshness,
    reproducibility: input.baseline.reproducibilityState as
      | BaselineState
      | 'NOT_EVALUATED',
    createdAt: nowIso(),
  };
}

const ADVANTAGE_CLAIM_PATTERNS = [
  /quantum\s+(faster|cheaper|superior|advantage)/i,
  /\bquantum advantage\b/i,
  /\bfaster than classical\b/i,
  /\bsuperior to classical\b/i,
];

export function looksLikeAdvantageClaim(text: string): boolean {
  return ADVANTAGE_CLAIM_PATTERNS.some((re) => re.test(text));
}

/**
 * Performance claim rule — all receipts + repeats + variance + review required.
 */
export function evaluateAdvantageClaim(
  input: AdvantageClaimInput,
): AdvantageClaimDecision {
  const reasons: string[] = [];

  if (EX2_LOCKS.CLAIM_ADVANTAGE_FROM_ISOLATED_RESULT) {
    return {
      allowed: false,
      decision: 'DENIED',
      reasons: ['LOCK_VIOLATION_ISOLATED_CLAIM'],
    };
  }

  if (!input.baselineReceipt) {
    reasons.push('MISSING_BASELINE_RECEIPT');
  }
  if (!input.candidateReceipt) {
    reasons.push('MISSING_CANDIDATE_RECEIPT');
  }
  if (!input.comparabilityReceipt) {
    reasons.push('MISSING_COMPARABILITY_RECEIPT');
  }
  if (!input.repeatRunSummary) {
    reasons.push('MISSING_REPEAT_RUN_SUMMARY');
  }
  if (!input.reviewResult || input.reviewResult === 'PENDING') {
    reasons.push('MISSING_OR_PENDING_REVIEW_RESULT');
  }
  if (input.reviewResult === 'DENIED') {
    reasons.push('REVIEW_DENIED');
  }

  if (!input.baselineReceipt) {
    return {
      allowed: false,
      decision: 'DENIED',
      reasons: ['QUANTUM_CANDIDATE_WITHOUT_BASELINE_ADVANTAGE_DENIED', ...reasons],
    };
  }

  const strong = baselineSupportsStrongClaim(input.baselineReceipt);
  if (!strong.ok) {
    reasons.push(strong.reason);
  }

  if (
    input.comparabilityReceipt &&
    input.comparabilityReceipt.comparisonState !== 'ELIGIBLE'
  ) {
    reasons.push(
      `COMPARABILITY_${input.comparabilityReceipt.comparisonState}`,
    );
  }

  if (input.repeatRunSummary) {
    if (input.repeatRunSummary.runCount < 2) {
      reasons.push('INSUFFICIENT_REPEAT_RUNS');
    }
    if (input.repeatRunSummary.varianceRuntimeMs === null) {
      reasons.push('MISSING_VARIANCE');
    }
  }

  // Hardware/runtime identity must be present on baseline.
  if (
    !input.baselineReceipt.runtimeId ||
    !input.baselineReceipt.deviceId ||
    !input.baselineReceipt.deviceClass
  ) {
    reasons.push('MISSING_HARDWARE_RUNTIME_IDENTITY');
  }

  const blocking = reasons.filter(
    (r) =>
      r.startsWith('MISSING_') ||
      r.includes('DENIED') ||
      r.includes('BLOCKED') ||
      r.includes('STALE') ||
      r.includes('INSUFFICIENT') ||
      r.includes('COMPARABILITY_') ||
      r.includes('FAILED'),
  );

  if (blocking.length > 0 || input.reviewResult !== 'APPROVED') {
    return {
      allowed: false,
      decision: 'DENIED',
      reasons:
        reasons.length > 0
          ? reasons
          : ['ADVANTAGE_CLAIM_DENIED_INCOMPLETE_EVIDENCE'],
    };
  }

  return {
    allowed: true,
    decision: 'ALLOWED_WITH_EVIDENCE',
    reasons: ['ALL_RECEIPTS_PRESENT_REVIEW_APPROVED'],
  };
}

export function denyAdvantageWithoutBaseline(input: {
  claimText: string;
  candidateReceipt: CandidateReceipt | null;
}): AdvantageClaimDecision {
  return evaluateAdvantageClaim({
    claimText: input.claimText,
    baselineReceipt: null,
    candidateReceipt: input.candidateReceipt,
    comparabilityReceipt: null,
    repeatRunSummary: null as RepeatabilitySummary | null,
    reviewResult: null,
  });
}
