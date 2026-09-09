/**
 * 62L-EX3 — Experiment contract + result states.
 * Comparison gate: reuses EX2 evaluateComparability / denyAdvantageWithoutBaseline.
 * classification=QUANTUM_INSPIRED for classical QI runs.
 */

import {
  denyAdvantageWithoutBaseline,
  evaluateComparability,
} from './comparison.ts';
import {
  EX3_LOCKS,
  ex3Deny,
  type Ex3Denial,
  type Ex3TenantScope,
  type QiExecutionClass,
} from './ex3-types.ts';
import type { WorkloadGenome } from './problem-genome.ts';
import { genomesComparable } from './problem-genome.ts';
import type { QiHardwareRoute } from './quantum-inspired.ts';
import { classifyClassicalQiRun } from './quantum-inspired.ts';
import type {
  CandidateReceipt,
  ClassicalBaselineReceipt,
  ComparabilityReceipt,
} from './types.ts';

export const EXPERIMENT_RESULT_STATES = [
  'CANDIDATE',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'REPRODUCIBLE',
  'NON_REPRODUCIBLE',
  'NOT_COMPARABLE',
  'REGRESSED',
  'STALE',
  'REJECTED',
  'PROMOTION_CANDIDATE',
] as const;

export type ExperimentResultState = (typeof EXPERIMENT_RESULT_STATES)[number];

export type ExperimentMetrics = {
  latencyMs: number;
  solutionQuality: number;
  memoryMb: number;
  reliability: number;
  costEnergyProxy: number;
};

export type QiExperiment = {
  experimentId: string;
  algorithmId: string;
  candidateId: string | null;
  classification: QiExecutionClass;
  physicalQpuVerified: false;
  quantumAdvantageVerified: false;
  genome: WorkloadGenome;
  baseline: ClassicalBaselineReceipt | null;
  route: QiHardwareRoute;
  metrics: ExperimentMetrics;
  seed: number;
  deterministic: boolean;
  datasetVersion: string;
  state: ExperimentResultState;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenCotPresent: false;
  productionDeploy: false;
  financialAutonomousTrading: false;
  createdAt: string;
};

export type QiComparisonResult = {
  experimentId: string;
  state: ExperimentResultState;
  superiorityClaimAllowed: boolean;
  reason: string;
  ex2Comparability: ComparabilityReceipt | null;
};

export function runQiExperiment(input: {
  experimentId: string;
  algorithmId: string;
  candidateId?: string | null;
  genome: WorkloadGenome;
  baseline: ClassicalBaselineReceipt | null;
  route: QiHardwareRoute;
  metrics: ExperimentMetrics;
  seed: number;
  deterministic?: boolean;
  datasetVersion: string;
  scope: Ex3TenantScope;
  forceFail?: boolean;
  requireExternalDataOffline?: boolean;
  claimPhysicalQpu?: boolean;
  claimQuantumAdvantage?: boolean;
}): QiExperiment | Ex3Denial {
  if (input.requireExternalDataOffline) {
    return ex3Deny('WAITING_DATA — offline and required external data unavailable.');
  }
  if (input.claimPhysicalQpu || input.route.physicalQpuVerified) {
    return ex3Deny(
      'PHYSICAL_QPU_WITHOUT_EVIDENCE=false — classical CPU/GPU/NPU QI runs cannot be PHYSICAL_QPU_VERIFIED.',
    );
  }
  if (input.claimQuantumAdvantage) {
    return ex3Deny(
      'QUANTUM_ADVANTAGE_VERIFIED requires separate physical-QPU evidence + classical baseline superiority — denied.',
    );
  }

  const classification = classifyClassicalQiRun(input.route.actual);
  if (classification !== 'QUANTUM_INSPIRED') {
    return ex3Deny('CLASSIFICATION_INTEGRITY — classical QI must remain QUANTUM_INSPIRED.');
  }

  return {
    experimentId: input.experimentId,
    algorithmId: input.algorithmId,
    candidateId: input.candidateId ?? null,
    classification: 'QUANTUM_INSPIRED',
    physicalQpuVerified: false,
    quantumAdvantageVerified: false,
    genome: input.genome,
    baseline: input.baseline,
    route: {
      ...input.route,
      classification: 'QUANTUM_INSPIRED',
      physicalQpuVerified: false,
      quantumAdvantageVerified: false,
    },
    metrics: input.metrics,
    seed: input.seed,
    deterministic: input.deterministic ?? true,
    datasetVersion: input.datasetVersion,
    state: input.forceFail ? 'FAILED' : 'COMPLETED',
    orgId: input.scope.orgId,
    tenantId: input.scope.tenantId,
    universeId: input.scope.universeId,
    hiddenCotPresent: false,
    productionDeploy: false,
    financialAutonomousTrading: false,
    createdAt: new Date().toISOString(),
  };
}

function toCandidateReceipt(
  experiment: QiExperiment,
  overrides?: Partial<CandidateReceipt>,
): CandidateReceipt {
  const criteria = experiment.baseline?.successCriteria ?? {
    criteriaId: 'qi-default',
    objective: 'min_cost',
    accuracyTolerance: 1e-6,
    mustSatisfyConstraints: true,
    outputObjective: 'minimize',
  };
  return {
    candidateId: experiment.candidateId ?? experiment.experimentId,
    missionId: experiment.baseline?.missionId ?? 'mission-qi',
    taskId: experiment.baseline?.taskId ?? 'task-qi',
    tenantId: experiment.tenantId,
    universeId: experiment.universeId,
    problemClass: experiment.genome.problemClass,
    problemVersion: experiment.baseline?.problemVersion ?? 'v1',
    inputHash: experiment.baseline?.inputHash ?? 'hash-unknown',
    datasetVersion: experiment.datasetVersion,
    problemSize: experiment.genome.problemSize,
    seed: experiment.seed,
    precision: experiment.baseline?.precision ?? 'float64',
    tolerance: experiment.baseline?.tolerance ?? 1e-6,
    successCriteria: criteria,
    runtimeMs: experiment.metrics.latencyMs,
    deviceClass: experiment.route.ex2DeviceClass,
    deviceEvidenceState: 'VERIFIED',
    methodFamily: 'quantum_inspired',
    evidenceRefs: [],
    completed: experiment.state === 'COMPLETED' || experiment.state === 'FAILED',
    ...overrides,
  };
}

/**
 * EX2 comparison gate wrapper for QI experiments.
 */
export function compareQiWithBaseline(
  experiment: QiExperiment,
  options?: { claimSuperiority?: boolean; claimText?: string },
): QiComparisonResult {
  if (!experiment.baseline) {
    if (options?.claimSuperiority || options?.claimText) {
      const decision = denyAdvantageWithoutBaseline({
        claimText: options.claimText ?? 'superiority claim',
        candidateReceipt: toCandidateReceipt(experiment),
      });
      return {
        experimentId: experiment.experimentId,
        state: 'REJECTED',
        superiorityClaimAllowed: decision.allowed,
        reason: 'MISSING_BASELINE — superiority claim blocked (EX2 comparison gate).',
        ex2Comparability: null,
      };
    }
    return {
      experimentId: experiment.experimentId,
      state: 'REJECTED',
      superiorityClaimAllowed: false,
      reason: 'MISSING_BASELINE — superiority claim blocked (EX2 comparison gate).',
      ex2Comparability: null,
    };
  }

  if (
    !genomesComparable(
      {
        problemClass: experiment.genome.problemClass,
        problemSize: experiment.genome.problemSize,
      },
      {
        problemClass: experiment.baseline.problemClass as WorkloadGenome['problemClass'],
        problemSize: experiment.baseline.problemSize,
      },
    )
  ) {
    const candidate = toCandidateReceipt(experiment);
    const cmp = evaluateComparability({
      comparisonId: `cmp-${experiment.experimentId}`,
      baseline: experiment.baseline,
      candidate,
      actorTenantId: experiment.tenantId,
      actorUniverseId: experiment.universeId,
    });
    return {
      experimentId: experiment.experimentId,
      state: 'NOT_COMPARABLE',
      superiorityClaimAllowed: false,
      reason: 'MISMATCHED_PROBLEM_SIZE_OR_CLASS — NOT_COMPARABLE (EX2 gate).',
      ex2Comparability: cmp,
    };
  }

  const candidate = toCandidateReceipt(experiment);
  const cmp = evaluateComparability({
    comparisonId: `cmp-${experiment.experimentId}`,
    baseline: experiment.baseline,
    candidate,
    actorTenantId: experiment.tenantId,
    actorUniverseId: experiment.universeId,
  });

  if (cmp.comparisonState === 'NOT_COMPARABLE') {
    return {
      experimentId: experiment.experimentId,
      state: 'NOT_COMPARABLE',
      superiorityClaimAllowed: false,
      reason: cmp.reasons.join('; ') || 'NOT_COMPARABLE',
      ex2Comparability: cmp,
    };
  }
  if (cmp.comparisonState === 'DENIED') {
    return {
      experimentId: experiment.experimentId,
      state: 'REJECTED',
      superiorityClaimAllowed: false,
      reason: cmp.reasons.join('; ') || 'DENIED',
      ex2Comparability: cmp,
    };
  }

  const baselineLatency = experiment.baseline.latency ?? experiment.baseline.runtimeMs ?? 0;
  const regressed =
    experiment.metrics.latencyMs > baselineLatency * 1.05 &&
    experiment.metrics.solutionQuality <
      (typeof experiment.baseline.qualityMetrics.objectiveValue === 'number'
        ? experiment.baseline.qualityMetrics.objectiveValue
        : 1);

  if (regressed) {
    return {
      experimentId: experiment.experimentId,
      state: 'REGRESSED',
      superiorityClaimAllowed: false,
      reason: 'REGRESSION vs classical baseline — route confidence should lower.',
      ex2Comparability: cmp,
    };
  }

  const improved =
    experiment.metrics.latencyMs < baselineLatency ||
    experiment.metrics.solutionQuality >
      (typeof experiment.baseline.qualityMetrics.objectiveValue === 'number'
        ? experiment.baseline.qualityMetrics.objectiveValue
        : 0);

  if (improved && cmp.comparisonState === 'ELIGIBLE') {
    return {
      experimentId: experiment.experimentId,
      state: 'PROMOTION_CANDIDATE',
      superiorityClaimAllowed: true,
      reason:
        'Measured improvement vs classical baseline — PROMOTION_CANDIDATE ≠ production deploy.',
      ex2Comparability: cmp,
    };
  }

  return {
    experimentId: experiment.experimentId,
    state: 'COMPLETED',
    superiorityClaimAllowed: false,
    reason: 'No clear superiority; research-only completion.',
    ex2Comparability: cmp,
  };
}

export function checkReproducibility(
  a: ExperimentMetrics,
  b: ExperimentMetrics,
  tolerance = 1e-6,
): {
  reproducible: boolean;
  state: 'REPRODUCIBLE' | 'NON_REPRODUCIBLE';
  maxAbsDelta: number;
  tolerance: number;
} {
  const deltas = [
    Math.abs(a.latencyMs - b.latencyMs),
    Math.abs(a.solutionQuality - b.solutionQuality),
    Math.abs(a.memoryMb - b.memoryMb),
    Math.abs(a.reliability - b.reliability),
    Math.abs(a.costEnergyProxy - b.costEnergyProxy),
  ];
  const maxAbsDelta = Math.max(...deltas);
  const reproducible = maxAbsDelta <= tolerance;
  return {
    reproducible,
    state: reproducible ? 'REPRODUCIBLE' : 'NON_REPRODUCIBLE',
    maxAbsDelta,
    tolerance,
  };
}

export function runDeterministicQiKernel(input: {
  seed: number;
  problemSize: number;
  iterations?: number;
}): ExperimentMetrics {
  let state = input.seed >>> 0;
  const next = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
  const iterations = input.iterations ?? 64;
  let best = Number.POSITIVE_INFINITY;
  let quality = 0;
  for (let i = 0; i < iterations; i++) {
    const energy = next() * input.problemSize + next();
    if (energy < best) {
      best = energy;
      quality = 1 / (1 + best);
    }
  }
  return {
    latencyMs: 10 + (input.seed % 7) + input.problemSize * 0.01,
    solutionQuality: quality,
    memoryMb: 32 + input.problemSize * 0.001,
    reliability: 0.99,
    costEnergyProxy: 1 + input.problemSize * 0.0001,
  };
}

export function assertEx3Scope(
  actor: Ex3TenantScope,
  resource: Ex3TenantScope,
  kind: 'tenant' | 'universe' | 'both' = 'both',
): true | Ex3Denial {
  if (
    (kind === 'tenant' || kind === 'both') &&
    (actor.tenantId !== resource.tenantId || actor.orgId !== resource.orgId)
  ) {
    return ex3Deny('CROSS_TENANT_DENIED — EX3 experiment/brain access.');
  }
  if ((kind === 'universe' || kind === 'both') && actor.universeId !== resource.universeId) {
    return ex3Deny('CROSS_UNIVERSE_DENIED — EX3 experiment/brain access.');
  }
  return true;
}

export function attemptChildPermissionExpansion(): Ex3Denial {
  void EX3_LOCKS.CHILD_PERMISSION_EXPANSION;
  return ex3Deny('CHILD_PERMISSION_EXPANSION=false — child tasks cannot expand permissions.');
}

export function attemptOfflineExternalKnowledge(input: {
  offline: boolean;
  externalRequired: boolean;
  localAvailable: boolean;
}): { state: 'WAITING_DATA' | 'AVAILABLE'; reason: string } {
  if (input.offline && input.externalRequired && !input.localAvailable) {
    return {
      state: 'WAITING_DATA',
      reason: 'Offline and external lawful knowledge required but unavailable.',
    };
  }
  return { state: 'AVAILABLE', reason: 'Local lawful knowledge available.' };
}
