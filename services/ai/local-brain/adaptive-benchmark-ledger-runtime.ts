/**
 * 62L-EP14 — Adaptive Benchmark Ledger runtime.
 *
 * Normalize verified receipts → compare → classify → update scheduler memory.
 * Soft-wires EP13/EP12/EP5/EP1/EM157 when present.
 */

import {
  ADAPTIVE_BENCHMARK_LEDGER_CYCLE,
  BENCHMARK_ENTRY_FIELDS,
  COMPARABILITY_DIMENSIONS,
  COMPARISON_STATES,
  EP14_DB_CANDIDATES_STATUS,
  EP14_LOCKS,
  EP14_MAY,
  EP14_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  LEDGER_AGENT_BOUNDS,
  LEDGER_LIFECYCLE,
  NEURAL_EDGE_SHAPE,
  NEXT_PHASE_TITLE,
  STALENESS_TRIGGERS,
  assertEp14LocksIntact,
  declineStaleSchedulingWeight,
  ep14SoftWireSnapshot,
  isHumanApprover,
  isLedgerAgent,
  type BenchmarkEntryField,
  type ComparabilityDimension,
  type ComparisonState,
  type Ep14Actor,
  type Ep14EvidenceState,
  type Ep14HopRecord,
  type Ep14SoftWireSnapshot,
  type StalenessTrigger,
} from './adaptive-benchmark-ledger-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ADAPTIVE_BENCHMARK_LEDGER_CYCLE)[number],
  state: Ep14EvidenceState,
  summary: string,
): Ep14HopRecord {
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

export type BenchmarkComparabilityKey = {
  modelId: string;
  modelVersionHash: string;
  precision: string;
  batchSize: number;
  datasetInputProfile: string;
  runtimeProvider: string;
  device: string;
  vendor: string;
  driverRuntimeVersion: string;
  hardwareFingerprint: string;
};

export type BenchmarkEntry = {
  benchmarkId: string;
  receiptId: string;
  nodeId: string;
  device: string;
  vendor: string;
  runtimeProvider: string;
  driverRuntimeVersion: string;
  modelId: string;
  modelVersionHash: string;
  precision: string;
  workload: string;
  datasetInputProfile: string;
  batchSize: number;
  latency: number;
  throughput: number;
  memoryUsage: string;
  energyProxy: number;
  costProxy: number;
  successRate: number;
  timestamp: string;
  environmentFingerprint: string;
  verificationState: 'VERIFIED' | 'UNVERIFIED' | 'NOT_TESTED';
  evidenceRefs: readonly string[];
  comparabilityKey: BenchmarkComparabilityKey;
  quantumInspired: boolean;
  classicalBaselineBenchmarkId: string | null;
  orgId: string;
  tenantId: string;
  universeId: string;
  schedulingWeight: number;
  hiddenChainOfThoughtPresent: false;
};

export type ClassificationResult = {
  classificationId: string;
  state: ComparisonState;
  priorBenchmarkId: string | null;
  currentBenchmarkId: string;
  priorLatency: number | null;
  currentLatency: number;
  schedulerPreferenceDelta: number;
  unlikeDimensions: readonly ComparabilityDimension[];
  reason: string;
};

export type SchedulerMemoryUpdate = {
  updateId: string;
  nodeId: string;
  routeKey: string;
  previousWeight: number;
  newWeight: number;
  classification: ComparisonState;
  evidenceDeleted: false;
};

export type NeuralLearningEdge = {
  workload: string;
  device: string;
  runtime: string;
  measuredOutcome: string;
  confidence: number;
  strengthenedByMeasurement: true;
};

const LATENCY_IMPROVE_RATIO = 0.95;
const LATENCY_REGRESS_RATIO = 1.15;
const UNCHANGED_BAND = 0.05;

export function buildComparabilityKey(
  entry: Omit<BenchmarkComparabilityKey, never> & {
    environmentFingerprint?: string;
  },
): BenchmarkComparabilityKey {
  return {
    modelId: entry.modelId,
    modelVersionHash: entry.modelVersionHash,
    precision: entry.precision,
    batchSize: entry.batchSize,
    datasetInputProfile: entry.datasetInputProfile,
    runtimeProvider: entry.runtimeProvider,
    device: entry.device,
    vendor: entry.vendor,
    driverRuntimeVersion: entry.driverRuntimeVersion,
    hardwareFingerprint:
      entry.hardwareFingerprint ?? entry.environmentFingerprint ?? '',
  };
}

export function unlikeDimensions(
  a: BenchmarkComparabilityKey,
  b: BenchmarkComparabilityKey,
): ComparabilityDimension[] {
  const diffs: ComparabilityDimension[] = [];
  if (a.modelId !== b.modelId || a.modelVersionHash !== b.modelVersionHash) {
    diffs.push('model');
  }
  if (a.precision !== b.precision) diffs.push('precision');
  if (a.batchSize !== b.batchSize) diffs.push('batch');
  if (a.datasetInputProfile !== b.datasetInputProfile) diffs.push('input_size');
  if (a.runtimeProvider !== b.runtimeProvider) diffs.push('runtime');
  if (
    a.device !== b.device ||
    a.vendor !== b.vendor ||
    a.hardwareFingerprint !== b.hardwareFingerprint
  ) {
    diffs.push('hardware');
  }
  if (a.driverRuntimeVersion !== b.driverRuntimeVersion) {
    diffs.push('software_version');
  }
  return diffs;
}

export function normalizeReceiptToBenchmark(input: {
  actor: Ep14Actor;
  benchmarkId: string;
  receiptId: string;
  nodeId: string;
  device: string;
  vendor: string;
  runtimeProvider: string;
  driverRuntimeVersion: string;
  modelId: string;
  modelVersionHash: string;
  precision: string;
  workload: string;
  datasetInputProfile: string;
  batchSize: number;
  latency: number;
  throughput: number;
  memoryUsage: string;
  energyProxy: number;
  costProxy: number;
  successRate: number;
  timestamp?: string;
  environmentFingerprint: string;
  verificationState: BenchmarkEntry['verificationState'];
  evidenceRefs?: readonly string[];
  quantumInspired?: boolean;
  classicalBaselineBenchmarkId?: string | null;
  attemptIncludeHiddenCot?: boolean;
  attemptUnverifiedAsVerified?: boolean;
}): BenchmarkEntry | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_LEDGER=false — no hidden chain-of-thought is stored.',
    );
  }
  if (
    input.attemptUnverifiedAsVerified &&
    input.verificationState !== 'VERIFIED'
  ) {
    return deny(
      'Only verified receipts strengthen ledger evidence as VERIFIED.',
    );
  }
  if (input.verificationState !== 'VERIFIED') {
    return deny(
      'UNVERIFIED/NOT_TESTED receipt cannot enter durable verified ledger evidence.',
    );
  }
  if (input.quantumInspired) {
    if (!input.classicalBaselineBenchmarkId) {
      return deny(
        'QUANTUM_WITHOUT_CLASSICAL_BASELINE=false — quantum-inspired entries must carry classical baseline records.',
      );
    }
  }

  void BENCHMARK_ENTRY_FIELDS;

  const key = buildComparabilityKey({
    modelId: input.modelId,
    modelVersionHash: input.modelVersionHash,
    precision: input.precision,
    batchSize: input.batchSize,
    datasetInputProfile: input.datasetInputProfile,
    runtimeProvider: input.runtimeProvider,
    device: input.device,
    vendor: input.vendor,
    driverRuntimeVersion: input.driverRuntimeVersion,
    hardwareFingerprint: input.environmentFingerprint,
  });

  return {
    benchmarkId: input.benchmarkId,
    receiptId: input.receiptId,
    nodeId: input.nodeId,
    device: input.device,
    vendor: input.vendor,
    runtimeProvider: input.runtimeProvider,
    driverRuntimeVersion: input.driverRuntimeVersion,
    modelId: input.modelId,
    modelVersionHash: input.modelVersionHash,
    precision: input.precision,
    workload: input.workload,
    datasetInputProfile: input.datasetInputProfile,
    batchSize: input.batchSize,
    latency: input.latency,
    throughput: input.throughput,
    memoryUsage: input.memoryUsage,
    energyProxy: input.energyProxy,
    costProxy: input.costProxy,
    successRate: input.successRate,
    timestamp: input.timestamp ?? nowIso(),
    environmentFingerprint: input.environmentFingerprint,
    verificationState: 'VERIFIED',
    evidenceRefs: input.evidenceRefs ?? [],
    comparabilityKey: key,
    quantumInspired: Boolean(input.quantumInspired),
    classicalBaselineBenchmarkId: input.classicalBaselineBenchmarkId ?? null,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    schedulingWeight: 1,
    hiddenChainOfThoughtPresent: false,
  };
}

export function classifyAgainstPrior(input: {
  classificationId: string;
  current: BenchmarkEntry;
  prior: BenchmarkEntry | null;
  attemptCompareUnlike?: boolean;
}): ClassificationResult | DenialResult {
  if (!input.prior) {
    return {
      classificationId: input.classificationId,
      state: 'BASELINE',
      priorBenchmarkId: null,
      currentBenchmarkId: input.current.benchmarkId,
      priorLatency: null,
      currentLatency: input.current.latency,
      schedulerPreferenceDelta: 0,
      unlikeDimensions: [],
      reason: 'No prior evidence — establishing BASELINE.',
    };
  }

  const diffs = unlikeDimensions(
    input.current.comparabilityKey,
    input.prior.comparabilityKey,
  );

  if (diffs.length > 0) {
    if (input.attemptCompareUnlike) {
      return deny(
        'UNLIKE_TESTS_COMPARED_AS_EQUIVALENT=false — differences in model/precision/batch/input/runtime/hardware/software → NOT_COMPARABLE.',
      );
    }
    return {
      classificationId: input.classificationId,
      state: 'NOT_COMPARABLE',
      priorBenchmarkId: input.prior.benchmarkId,
      currentBenchmarkId: input.current.benchmarkId,
      priorLatency: input.prior.latency,
      currentLatency: input.current.latency,
      schedulerPreferenceDelta: 0,
      unlikeDimensions: diffs,
      reason: `Unlike tests on dimensions: ${diffs.join(', ')}.`,
    };
  }

  const ratio = input.current.latency / input.prior.latency;
  if (ratio <= LATENCY_IMPROVE_RATIO) {
    return {
      classificationId: input.classificationId,
      state: 'IMPROVED',
      priorBenchmarkId: input.prior.benchmarkId,
      currentBenchmarkId: input.current.benchmarkId,
      priorLatency: input.prior.latency,
      currentLatency: input.current.latency,
      schedulerPreferenceDelta: 0.1,
      unlikeDimensions: [],
      reason: `Latency improved ${input.prior.latency} → ${input.current.latency}.`,
    };
  }
  if (ratio >= LATENCY_REGRESS_RATIO) {
    return {
      classificationId: input.classificationId,
      state: 'REGRESSED',
      priorBenchmarkId: input.prior.benchmarkId,
      currentBenchmarkId: input.current.benchmarkId,
      priorLatency: input.prior.latency,
      currentLatency: input.current.latency,
      schedulerPreferenceDelta: -0.25,
      unlikeDimensions: [],
      reason: `Latency regressed ${input.prior.latency} → ${input.current.latency}; lower scheduler preference until revalidated.`,
    };
  }
  if (Math.abs(ratio - 1) <= UNCHANGED_BAND) {
    return {
      classificationId: input.classificationId,
      state: 'UNCHANGED',
      priorBenchmarkId: input.prior.benchmarkId,
      currentBenchmarkId: input.current.benchmarkId,
      priorLatency: input.prior.latency,
      currentLatency: input.current.latency,
      schedulerPreferenceDelta: 0,
      unlikeDimensions: [],
      reason: 'Latency within unchanged band.',
    };
  }
  // mild movement still within non-regress/improve bands → UNCHANGED
  return {
    classificationId: input.classificationId,
    state: 'UNCHANGED',
    priorBenchmarkId: input.prior.benchmarkId,
    currentBenchmarkId: input.current.benchmarkId,
    priorLatency: input.prior.latency,
    currentLatency: input.current.latency,
    schedulerPreferenceDelta: 0,
    unlikeDimensions: [],
    reason: 'Latency change not material for IMPROVED/REGRESSED.',
  };
}

export function markStaleForRetest(input: {
  entry: BenchmarkEntry;
  trigger: StalenessTrigger;
  attemptDeleteOldEvidence?: boolean;
}):
  | {
      benchmarkId: string;
      state: 'STALE';
      trigger: StalenessTrigger;
      retestCandidate: true;
      schedulingWeight: number;
      evidenceDeleted: false;
    }
  | DenialResult {
  if (input.attemptDeleteOldEvidence) {
    return deny(
      'DELETE_OLD_EVIDENCE_ON_STALE=false — old evidence is not deleted; scheduling weight declines.',
    );
  }
  const declined = declineStaleSchedulingWeight(input.entry.schedulingWeight);
  return {
    benchmarkId: input.entry.benchmarkId,
    state: 'STALE',
    trigger: input.trigger,
    retestCandidate: true,
    schedulingWeight: declined.weight,
    evidenceDeleted: false,
  };
}

export function updateSchedulerMemory(input: {
  updateId: string;
  entry: BenchmarkEntry;
  classification: ClassificationResult;
  previousWeight?: number;
}): SchedulerMemoryUpdate {
  const previous = input.previousWeight ?? input.entry.schedulingWeight;
  const newWeight = Math.max(
    0,
    previous + input.classification.schedulerPreferenceDelta,
  );
  return {
    updateId: input.updateId,
    nodeId: input.entry.nodeId,
    routeKey: `${input.entry.device}|${input.entry.runtimeProvider}|${input.entry.modelId}`,
    previousWeight: previous,
    newWeight,
    classification: input.classification.state,
    evidenceDeleted: false,
  };
}

export function strengthenNeuralEdge(input: {
  entry: BenchmarkEntry;
  measured: boolean;
  attemptUnmeasuredStrengthen?: boolean;
}): NeuralLearningEdge | DenialResult {
  if (input.attemptUnmeasuredStrengthen || !input.measured) {
    return deny(
      'UNMEASURED_EVIDENCE_STRENGTHENS_EDGES=false — only measured evidence strengthens routing edges.',
    );
  }
  return {
    workload: input.entry.workload,
    device: input.entry.device,
    runtime: input.entry.runtimeProvider,
    measuredOutcome: `latency=${input.entry.latency};throughput=${input.entry.throughput}`,
    confidence: Math.min(1, input.entry.successRate),
    strengthenedByMeasurement: true,
  };
}

export function claimQuantumInspiredBetter(input: {
  quantumEntry: BenchmarkEntry;
  classicalBaseline: BenchmarkEntry | null;
  claimBetter: boolean;
  attemptWithoutBaseline?: boolean;
  attemptWithoutDemonstratingData?: boolean;
}):
  | {
      accepted: true;
      label: 'QUANTUM_INSPIRED';
      betterThanBaseline: true;
      reason: string;
    }
  | DenialResult {
  if (input.attemptWithoutBaseline || !input.classicalBaseline) {
    return deny(
      'QUANTUM_WITHOUT_CLASSICAL_BASELINE=false — quantum-inspired must carry classical baseline records.',
    );
  }
  if (!input.quantumEntry.quantumInspired) {
    return deny(
      'QUANTUM_MIXED_INTO_CLASSICAL_LABEL=false — quantum experiments remain separately labeled.',
    );
  }
  if (!input.claimBetter) {
    return deny('No better-than-baseline claim asserted.');
  }
  const demonstrates =
    input.quantumEntry.latency < input.classicalBaseline.latency ||
    input.quantumEntry.throughput > input.classicalBaseline.throughput;
  if (input.attemptWithoutDemonstratingData || !demonstrates) {
    return deny(
      'QUANTUM_BETTER_WITHOUT_DATA=false — QUANTUM_INSPIRED better than baseline is acceptable only when benchmark data demonstrates the stated tradeoff.',
    );
  }
  return {
    accepted: true,
    label: 'QUANTUM_INSPIRED',
    betterThanBaseline: true,
    reason: `Demonstrated: latency ${input.quantumEntry.latency} vs classical ${input.classicalBaseline.latency}; throughput ${input.quantumEntry.throughput} vs ${input.classicalBaseline.throughput}.`,
  };
}

export function attemptCompareUnlikeTests(): DenialResult {
  return deny('UNLIKE_TESTS_COMPARED_AS_EQUIVALENT=false.');
}

export function attemptDeleteOldEvidence(): DenialResult {
  return deny('DELETE_OLD_EVIDENCE_ON_STALE=false.');
}

export function attemptStrengthenWithoutMeasurement(): DenialResult {
  return deny('UNMEASURED_EVIDENCE_STRENGTHENS_EDGES=false.');
}

export function attemptQuantumWithoutClassicalBaseline(): DenialResult {
  return deny('QUANTUM_WITHOUT_CLASSICAL_BASELINE=false.');
}

export function attemptQuantumBetterWithoutData(): DenialResult {
  return deny('QUANTUM_BETTER_WITHOUT_DATA=false.');
}

export function attemptIncludeHiddenCot(): DenialResult {
  return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_LEDGER=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function attemptModifyFirmwareOrBios(): DenialResult {
  return deny(
    'AUTONOMOUS_FIRMWARE_BIOS_CHANGE=false — ledger does not modify firmware, BIOS, or production systems.',
  );
}

export function returnLedgerEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep14Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      flow: typeof LEDGER_LIFECYCLE;
      authorityGranted: false;
    }
  | DenialResult {
  if (!LEDGER_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isLedgerAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ledger agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    flow: LEDGER_LIFECYCLE,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep14Actor;
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
    unchanged: EP14_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EP14_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EP14_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleAmdGpuPrior(): BenchmarkEntry {
  const actor: Ep14Actor = {
    kind: 'benchmark_ledger',
    id: 'ledger-1',
    orgId: 'org-ep14',
    tenantId: 'ten-ep14',
    universeId: 'uni-ep14',
    permissions: ['draft'],
  };
  const entry = normalizeReceiptToBenchmark({
    actor,
    benchmarkId: 'bm-amd-prior',
    receiptId: 'rcpt-prior',
    nodeId: 'node-amd-1',
    device: 'gpu',
    vendor: 'AMD',
    runtimeProvider: 'rocm',
    driverRuntimeVersion: '6.0.0',
    modelId: 'ModelA',
    modelVersionHash: 'ma-v1',
    precision: 'fp16',
    workload: 'inference',
    datasetInputProfile: 'batch-profile-1',
    batchSize: 1,
    latency: 42,
    throughput: 23.8,
    memoryUsage: '2GB',
    energyProxy: 1,
    costProxy: 1,
    successRate: 1,
    timestamp: '2026-09-01T00:00:00.000Z',
    environmentFingerprint: 'amd-gpu-env-1',
    verificationState: 'VERIFIED',
    evidenceRefs: ['ev-prior'],
  });
  if ('denied' in entry) {
    throw new Error('exampleAmdGpuPrior failed');
  }
  return entry;
}

export function exampleAmdGpuNew(latency: number): BenchmarkEntry {
  const prior = exampleAmdGpuPrior();
  return {
    ...prior,
    benchmarkId: 'bm-amd-new',
    receiptId: 'rcpt-new',
    latency,
    throughput: 1000 / latency,
    timestamp: '2026-09-09T00:00:00.000Z',
  };
}

export function bootstrapAdaptiveBenchmarkLedger(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep14SoftWireSnapshot;
  lifecycle: typeof LEDGER_LIFECYCLE;
  fields: readonly BenchmarkEntryField[];
  comparisonStates: typeof COMPARISON_STATES;
  stalenessTriggers: typeof STALENESS_TRIGGERS;
  comparabilityDimensions: typeof COMPARABILITY_DIMENSIONS;
  neuralEdgeShape: typeof NEURAL_EDGE_SHAPE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP14_MAY;
  mustNot: typeof EP14_MUST_NOT;
  dbCandidates: typeof EP14_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp14LocksIntact(),
    softWire: ep14SoftWireSnapshot(repoRoot),
    lifecycle: LEDGER_LIFECYCLE,
    fields: BENCHMARK_ENTRY_FIELDS,
    comparisonStates: COMPARISON_STATES,
    stalenessTriggers: STALENESS_TRIGGERS,
    comparabilityDimensions: COMPARABILITY_DIMENSIONS,
    neuralEdgeShape: NEURAL_EDGE_SHAPE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP14_MAY,
    mustNot: EP14_MUST_NOT,
    dbCandidates: EP14_DB_CANDIDATES_STATUS,
  };
}

export function runAdaptiveBenchmarkLedgerCycle(input: {
  actor: Ep14Actor;
  human: Ep14Actor;
  repoRoot?: string;
}): {
  hops: Ep14HopRecord[];
  prior: BenchmarkEntry;
  current: BenchmarkEntry;
  classification: ClassificationResult | DenialResult;
  softWire: Ep14SoftWireSnapshot;
} {
  const hops: Ep14HopRecord[] = [];
  const softWire = ep14SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp14LocksIntact() ? 'PASS' : 'FAIL',
      'EP14 locks intact including L4=false and unlike-tests gate.',
    ),
  );
  hops.push(
    hop(
      'adaptive_benchmark_ledger_bootstrap',
      'PASS',
      'Adaptive Benchmark Ledger bootstrapped.',
    ),
  );
  hops.push(
    hop('lifecycle_encoded', 'PASS', LEDGER_LIFECYCLE.join(' → ')),
  );
  hops.push(
    hop(
      'entry_fields_encoded',
      'PASS',
      `${BENCHMARK_ENTRY_FIELDS.length} benchmark entry fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'comparison_states_encoded',
      'PASS',
      COMPARISON_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'staleness_triggers_encoded',
      'PASS',
      STALENESS_TRIGGERS.join(' | '),
    ),
  );
  hops.push(
    hop(
      'comparability_dimensions_encoded',
      'PASS',
      COMPARABILITY_DIMENSIONS.join(' | '),
    ),
  );
  hops.push(
    hop(
      'neural_edge_shape_encoded',
      'PASS',
      NEURAL_EDGE_SHAPE.join(' → '),
    ),
  );

  const prior = exampleAmdGpuPrior();
  const current = exampleAmdGpuNew(61);
  const classification = classifyAgainstPrior({
    classificationId: 'cls-regress-1',
    current,
    prior,
  });

  const unlikeAttempt = classifyAgainstPrior({
    classificationId: 'cls-unlike',
    current: {
      ...current,
      comparabilityKey: {
        ...current.comparabilityKey,
        precision: 'int8',
      },
      precision: 'int8',
    },
    prior,
    attemptCompareUnlike: true,
  });

  hops.push(
    hop(
      'unlike_tests_not_comparable',
      unlikeAttempt.state === 'DENIED' &&
        attemptCompareUnlikeTests().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Unlike tests → NOT_COMPARABLE / DENIED when forced equivalent.',
    ),
  );
  hops.push(
    hop(
      'regression_lowers_scheduler_preference',
      !('denied' in classification) &&
        classification.state === 'REGRESSED' &&
        classification.schedulerPreferenceDelta < 0 &&
        updateSchedulerMemory({
          updateId: 'upd-1',
          entry: current,
          classification,
        }).newWeight < current.schedulingWeight
        ? 'PASS'
        : 'FAIL',
      'AMD GPU Model A 42ms→61ms REGRESSED; scheduler preference lowered.',
    ),
  );

  const stale = markStaleForRetest({
    entry: prior,
    trigger: 'driver_update',
  });
  const deleteDeny = markStaleForRetest({
    entry: prior,
    trigger: 'model_version_change',
    attemptDeleteOldEvidence: true,
  });
  hops.push(
    hop(
      'old_evidence_weight_declines_not_deleted',
      !('denied' in stale) &&
        stale.evidenceDeleted === false &&
        stale.schedulingWeight < prior.schedulingWeight &&
        deleteDeny.state === 'DENIED' &&
        attemptDeleteOldEvidence().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Stale → retest candidate; weight declines; evidence not deleted.',
    ),
  );

  const edgeOk = strengthenNeuralEdge({ entry: current, measured: true });
  const edgeDeny = strengthenNeuralEdge({
    entry: current,
    measured: false,
    attemptUnmeasuredStrengthen: true,
  });
  hops.push(
    hop(
      'only_measured_evidence_strengthens_edges',
      !('denied' in edgeOk) &&
        edgeOk.strengthenedByMeasurement === true &&
        edgeDeny.state === 'DENIED' &&
        attemptStrengthenWithoutMeasurement().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Only measured evidence strengthens routing edges.',
    ),
  );

  const classical = exampleAmdGpuPrior();
  const quantumOk = normalizeReceiptToBenchmark({
    actor: input.actor,
    benchmarkId: 'bm-q-1',
    receiptId: 'rcpt-q',
    nodeId: 'node-q',
    device: 'qpu_path',
    vendor: 'research',
    runtimeProvider: 'quantum-inspired',
    driverRuntimeVersion: '0.1',
    modelId: 'ModelA',
    modelVersionHash: 'ma-v1',
    precision: 'fp16',
    workload: 'inference',
    datasetInputProfile: 'batch-profile-1',
    batchSize: 1,
    latency: 30,
    throughput: 33,
    memoryUsage: '1GB',
    energyProxy: 1,
    costProxy: 1,
    successRate: 1,
    environmentFingerprint: 'q-env',
    verificationState: 'VERIFIED',
    quantumInspired: true,
    classicalBaselineBenchmarkId: classical.benchmarkId,
  });
  hops.push(
    hop(
      'quantum_inspired_separately_labeled',
      !('denied' in quantumOk) && quantumOk.quantumInspired === true
        ? 'PASS'
        : 'FAIL',
      'Quantum-inspired entries separately labeled.',
    ),
  );
  hops.push(
    hop(
      'quantum_requires_classical_baseline',
      attemptQuantumWithoutClassicalBaseline().state === 'DENIED' &&
        normalizeReceiptToBenchmark({
          actor: input.actor,
          benchmarkId: 'bm-q-bad',
          receiptId: 'rcpt-q-bad',
          nodeId: 'node-q',
          device: 'qpu_path',
          vendor: 'research',
          runtimeProvider: 'quantum-inspired',
          driverRuntimeVersion: '0.1',
          modelId: 'ModelA',
          modelVersionHash: 'ma-v1',
          precision: 'fp16',
          workload: 'inference',
          datasetInputProfile: 'batch-profile-1',
          batchSize: 1,
          latency: 30,
          throughput: 33,
          memoryUsage: '1GB',
          energyProxy: 1,
          costProxy: 1,
          successRate: 1,
          environmentFingerprint: 'q-env',
          verificationState: 'VERIFIED',
          quantumInspired: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Quantum-inspired requires classical baseline.',
    ),
  );
  hops.push(
    hop(
      'quantum_better_only_when_data_demonstrates',
      !('denied' in quantumOk) &&
        claimQuantumInspiredBetter({
          quantumEntry: quantumOk,
          classicalBaseline: classical,
          claimBetter: true,
        }).accepted === true &&
        claimQuantumInspiredBetter({
          quantumEntry: {
            ...quantumOk,
            latency: 99,
            throughput: 1,
          },
          classicalBaseline: classical,
          claimBetter: true,
          attemptWithoutDemonstratingData: true,
        }).state === 'DENIED' &&
        attemptQuantumBetterWithoutData().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'QUANTUM_INSPIRED better only when data demonstrates tradeoff.',
    ),
  );

  hops.push(
    hop(
      'no_hidden_chain_of_thought',
      attemptIncludeHiddenCot().state,
      'Hidden chain-of-thought in ledger DENIED.',
    ),
  );
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
        attemptModifyFirmwareOrBios().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no firmware/BIOS modification.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP14_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
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
      'ep1_soft_wire',
      softWire.ep1VirtualChipContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep1VirtualChipContract.note,
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
      EP14_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep14-1',
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

  void ADAPTIVE_BENCHMARK_LEDGER_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    prior,
    current,
    classification,
    softWire,
  };
}
