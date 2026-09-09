/**
 * 62L-EX10 — Benchmark Comparability Gate facade.
 *
 * Connects to EX1–EX9, Agent Mesh, baselines, hybrid router, simulators,
 * QPU registry/receipts, chipgraph, evidence via soft-wire (existsSync).
 * Presence ≠ VERIFIED. Absent → WAITING_DATA.
 *
 * Not a second orchestration framework.
 */

import {
  applyLearningFromGate,
  evaluateComparabilityGate,
  type ComparabilityGateInput,
  type ComparabilityGateResult,
} from './comparability.ts';
import {
  buildBenchmarkComparisonReceipt,
  requestFromSides,
  type BenchmarkComparisonReceipt,
} from './comparison-receipt.ts';
import { detectAndRecordContradiction } from './contradiction.ts';
import {
  ex10SoftWireSnapshot,
  summarizeSoftWires,
} from './soft-wire.ts';
import {
  BENCHMARK_COMPARISON_REQUEST_FIELDS,
  CANONICAL_PATHWAY,
  EX10_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  assertEx10LocksIntact,
  ex10L4AutonomyEnabled,
  guardianRlsUnchangedByEx10,
  type ContradictionRecord,
  type ExperimentSide,
} from './types.ts';

export * from './types.ts';
export * from './soft-wire.ts';
export * from './benchmark-normalizer.ts';
export * from './comparability.ts';
export * from './comparison-receipt.ts';
export * from './contradiction.ts';

export type Ex10CycleResult = {
  ok: boolean;
  pathway: readonly string[];
  softWires: ReturnType<typeof ex10SoftWireSnapshot>;
  softWireSummary: ReturnType<typeof summarizeSoftWires>;
  locksIntact: boolean;
  l4Enabled: false;
  guardianRlsUnchanged: true;
  honesty: typeof HONESTY_BANNER;
  nextPhase: typeof NEXT_PHASE_TITLE;
  requestFields: typeof BENCHMARK_COMPARISON_REQUEST_FIELDS;
  gate: ComparabilityGateResult | null;
  receipt: BenchmarkComparisonReceipt | null;
  contradiction: ContradictionRecord | null;
  learning: ReturnType<typeof applyLearningFromGate> | null;
};

export function defaultHardware(
  overrides?: Partial<ExperimentSide['hardware']>,
): ExperimentSide['hardware'] {
  return {
    deviceClass: overrides?.deviceClass ?? 'CPU',
    deviceId: overrides?.deviceId ?? 'cpu-local-1',
    deviceVendor: overrides?.deviceVendor ?? 'xiv-test',
    runtimeId: overrides?.runtimeId ?? 'runtime-local-v1',
    runtimeVersion: overrides?.runtimeVersion ?? '1.0.0',
    driverVersion: overrides?.driverVersion ?? '1.0.0',
    modelVersion: overrides?.modelVersion ?? 'model-v1',
    os: overrides?.os ?? 'linux',
    ramMb: overrides?.ramMb ?? 16384,
    vramMb: overrides?.vramMb ?? null,
    thermalState: overrides?.thermalState ?? 'NOMINAL',
    batteryState: overrides?.batteryState ?? 'AC',
    concurrency: overrides?.concurrency ?? 1,
    queueDepth: overrides?.queueDepth ?? 0,
  };
}

export function defaultSuccessCriteria(
  overrides?: Partial<ExperimentSide['successCriteria']>,
): ExperimentSide['successCriteria'] {
  return {
    criteriaId: overrides?.criteriaId ?? 'crit-1',
    objective: overrides?.objective ?? 'minimize_latency',
    qualityTarget: overrides?.qualityTarget ?? 0.95,
    accuracyTolerance: overrides?.accuracyTolerance ?? 0.01,
    mustSatisfyConstraints: overrides?.mustSatisfyConstraints ?? true,
    outputObjective: overrides?.outputObjective ?? 'feasible_solution',
  };
}

export function defaultExperimentSide(
  overrides?: Partial<ExperimentSide>,
): ExperimentSide {
  const now = new Date().toISOString();
  return {
    receiptId: overrides?.receiptId ?? 'rcpt-baseline-1',
    tenantId: overrides?.tenantId ?? 'tenant-a',
    universeId: overrides?.universeId ?? 'universe-a',
    missionId: overrides?.missionId ?? 'mission-ex10-1',
    taskId: overrides?.taskId ?? 'task-ex10-1',
    problemClass: overrides?.problemClass ?? 'maxcut',
    problemVersion: overrides?.problemVersion ?? '1.0.0',
    problemSize: overrides?.problemSize ?? 64,
    inputHash: overrides?.inputHash ?? 'sha256:input-a',
    datasetVersion: overrides?.datasetVersion ?? 'ds-1',
    datasetSize: overrides?.datasetSize ?? 1000,
    algorithmId: overrides?.algorithmId ?? 'classical-greedy',
    algorithmVersion: overrides?.algorithmVersion ?? '1.0.0',
    executionClass: overrides?.executionClass ?? 'CLASSICAL',
    hardware: overrides?.hardware ?? defaultHardware(),
    precision: overrides?.precision ?? 'FLOAT64',
    tolerance: overrides?.tolerance ?? 0.01,
    seed: overrides?.seed ?? 42,
    shots: overrides?.shots ?? null,
    samplingMethod: overrides?.samplingMethod ?? 'deterministic',
    noiseModel: overrides?.noiseModel ?? null,
    initMethod: overrides?.initMethod ?? 'default',
    batchSize: overrides?.batchSize ?? 1,
    timingScope: overrides?.timingScope ?? 'EXECUTION_ONLY',
    successCriteria: overrides?.successCriteria ?? defaultSuccessCriteria(),
    qualityMetricSchema: overrides?.qualityMetricSchema ?? 'quality.v1',
    qualityPassed: overrides?.qualityPassed ?? true,
    qualityScore: overrides?.qualityScore ?? 0.97,
    runtimeMs: overrides?.runtimeMs ?? 100,
    runtimesMs: overrides?.runtimesMs ?? [98, 100, 102],
    memoryPeakMb: overrides?.memoryPeakMb ?? 256,
    throughput: overrides?.throughput ?? 10,
    costMethod: overrides?.costMethod ?? 'MEASURED',
    costValue: overrides?.costValue ?? 0.01,
    energyMethod: overrides?.energyMethod ?? 'MEASURED',
    energyValue: overrides?.energyValue ?? 1.5,
    runCount: overrides?.runCount ?? 3,
    providerId: overrides?.providerId ?? null,
    providerContextEvidence: overrides?.providerContextEvidence ?? false,
    queueMs: overrides?.queueMs ?? null,
    submitMs: overrides?.submitMs ?? null,
    execMs: overrides?.execMs ?? null,
    preProcessMs: overrides?.preProcessMs ?? null,
    postProcessMs: overrides?.postProcessMs ?? null,
    qpuTimingScopes: overrides?.qpuTimingScopes ?? [],
    stale: overrides?.stale ?? false,
    materialChangeSinceComparison:
      overrides?.materialChangeSinceComparison ?? false,
    expiresAt: overrides?.expiresAt ?? null,
    createdAt: overrides?.createdAt ?? now,
  };
}

/**
 * End-to-end comparability cycle returning to XIV Home Base pathway.
 */
export function runEx10ComparabilityCycle(input: {
  baseline?: Partial<ExperimentSide>;
  candidate?: Partial<ExperimentSide>;
  actorTenantId?: string;
  actorUniverseId?: string;
  networkOnline?: boolean;
  externalDataRequired?: boolean;
  waitingProvider?: boolean;
  timingScopeNormalized?: boolean;
  priorClaim?: string | null;
  contradictionId?: string;
}): Ex10CycleResult {
  const softWires = ex10SoftWireSnapshot();
  const softWireSummary = summarizeSoftWires(softWires);

  const actorTenantId = input.actorTenantId ?? 'tenant-a';
  const actorUniverseId = input.actorUniverseId ?? 'universe-a';

  const baseline = defaultExperimentSide({
    receiptId: 'rcpt-baseline-1',
    algorithmId: 'classical-greedy',
    ...input.baseline,
  });
  const candidate = defaultExperimentSide({
    receiptId: 'rcpt-candidate-1',
    algorithmId: 'qi-qaoa-inspired',
    executionClass: 'QUANTUM_INSPIRED',
    runtimeMs: 80,
    runtimesMs: [78, 80, 82],
    qualityScore: 0.96,
    costValue: 0.02,
    ...input.candidate,
  });

  const gateInput: ComparabilityGateInput = {
    comparisonId: 'cmp-ex10-1',
    baseline,
    candidate,
    actorTenantId,
    actorUniverseId,
    networkOnline: input.networkOnline,
    externalDataRequired: input.externalDataRequired,
    waitingProvider: input.waitingProvider,
    timingScopeNormalized: input.timingScopeNormalized,
  };

  const gate = evaluateComparabilityGate(gateInput);
  const request = requestFromSides(
    gate.comparisonId,
    baseline,
    candidate,
    actorTenantId,
    actorUniverseId,
    {
      networkOnline: input.networkOnline,
      externalDataRequired: input.externalDataRequired,
      waitingProvider: input.waitingProvider,
    },
  );

  const receipt = buildBenchmarkComparisonReceipt({
    receiptId: `cmp-rcpt-${gate.comparisonId}`,
    request,
    baseline,
    candidate,
    gate,
    pathway: CANONICAL_PATHWAY,
    honesty: HONESTY_BANNER,
  });

  let contradiction: ContradictionRecord | null = null;
  if (input.priorClaim) {
    contradiction = detectAndRecordContradiction({
      contradictionId: input.contradictionId ?? `contra-${gate.comparisonId}`,
      comparisonId: gate.comparisonId,
      priorClaim: input.priorClaim,
      newClaim: gate.state === 'NOT_COMPARABLE' ? 'NOT_COMPARABLE' : gate.winnerState,
    });
  }

  const learning = applyLearningFromGate(gate);

  return {
    ok:
      gate.state === 'COMPARABLE' ||
      gate.state === 'PARTIALLY_COMPARABLE' ||
      gate.state === 'NOT_COMPARABLE' ||
      gate.state === 'INSUFFICIENT_EVIDENCE' ||
      gate.state === 'STALE_COMPARISON' ||
      gate.state === 'REVIEW_REQUIRED' ||
      gate.state === 'DENIED' ||
      gate.state === 'WAITING_DATA' ||
      gate.state === 'WAITING_PROVIDER',
    pathway: [...CANONICAL_PATHWAY],
    softWires,
    softWireSummary,
    locksIntact: assertEx10LocksIntact(),
    l4Enabled: ex10L4AutonomyEnabled(),
    guardianRlsUnchanged: guardianRlsUnchangedByEx10(),
    honesty: HONESTY_BANNER,
    nextPhase: NEXT_PHASE_TITLE,
    requestFields: BENCHMARK_COMPARISON_REQUEST_FIELDS,
    gate,
    receipt,
    contradiction,
    learning,
  };
}

void EX10_LOCKS;
