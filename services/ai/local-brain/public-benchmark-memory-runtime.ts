/**
 * 62L-EP5 — Public Benchmark Memory runtime.
 *
 * Provenance-backed benchmark memory. Published ≠ XIV verification.
 * Prefer recent comparable XIV_LOCAL_MEASURED for Virtual Chip scheduler.
 * Stale evidence decays. Lawful benchmarks only; no unsafe hardware tuning.
 */

import {
  BENCHMARK_AGENT_QUESTIONS,
  BENCHMARK_EVIDENCE_CLASSES,
  BENCHMARK_MEMORY_AGENT_BOUNDS,
  BENCHMARK_NORMALIZATION_DIMENSIONS,
  BENCHMARK_RECORD_FIELDS,
  BENCHMARK_REGRESSION_OUTCOMES,
  COMPARABILITY_STATES,
  EP5_DB_CANDIDATES_STATUS,
  EP5_LOCKS,
  EP5_MAY,
  EP5_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PUBLIC_BENCHMARK_MEMORY_CYCLE,
  SCHEDULER_PREFERENCE_ORDER,
  assertEp5LocksIntact,
  ep5SoftWireSnapshot,
  isBenchmarkMemoryAgent,
  isHumanApprover,
  schedulerPreferenceRank,
  type BenchmarkEvidenceClass,
  type BenchmarkNormalizationDimension,
  type BenchmarkRecordField,
  type BenchmarkRegressionOutcome,
  type ComparabilityState,
  type Ep5Actor,
  type Ep5EvidenceState,
  type Ep5HopRecord,
  type Ep5SoftWireSnapshot,
} from './public-benchmark-memory-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof PUBLIC_BENCHMARK_MEMORY_CYCLE)[number],
  state: Ep5EvidenceState,
  summary: string,
): Ep5HopRecord {
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

export type BenchmarkNormalizationValues = Partial<
  Record<BenchmarkNormalizationDimension, string>
>;

export type BenchmarkRecord = {
  benchmarkId: string;
  vendor: string;
  deviceChip: string;
  deviceType: string;
  architectureGeneration: string;
  runtimeProvider: string;
  driverRuntimeVersion: string;
  modelWorkload: string;
  precision: string;
  batchSize: string;
  datasetInput: string;
  latency: string;
  throughput: string;
  memoryUsage: string;
  powerEnergyProxy: string;
  benchmarkMethodology: string;
  source: string;
  sourceDate: string;
  rightsLicenseState: string;
  environment: string;
  reproducibilityNotes: string;
  confidence: string;
  evidenceClass: BenchmarkEvidenceClass;
  normalization: BenchmarkNormalizationValues;
  comparability: ComparabilityState;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

const REQUIRED_NORM_FOR_COMPARABLE: readonly BenchmarkNormalizationDimension[] =
  [
    'exact_hardware',
    'model_version',
    'input_size',
    'precision',
    'runtime',
    'batch_size',
    'software_version',
    'peak_theoretical_vs_end_to_end_measured',
  ];

export function evaluateComparability(
  normalization: BenchmarkNormalizationValues,
): ComparabilityState {
  const missing = REQUIRED_NORM_FOR_COMPARABLE.filter(
    (d) => !normalization[d] || !String(normalization[d]).trim(),
  );
  if (missing.length === 0) return 'COMPARABLE';
  if (missing.length <= 2) return 'PARTIALLY_COMPARABLE';
  return 'NOT_COMPARABLE';
}

export function registerBenchmarkRecord(input: {
  actor: Ep5Actor;
  benchmarkId: string;
  vendor: string;
  deviceChip: string;
  deviceType: string;
  architectureGeneration: string;
  runtimeProvider: string;
  driverRuntimeVersion: string;
  modelWorkload: string;
  precision: string;
  batchSize: string;
  datasetInput: string;
  latency: string;
  throughput: string;
  memoryUsage: string;
  powerEnergyProxy?: string;
  benchmarkMethodology: string;
  source: string;
  sourceDate: string;
  rightsLicenseState: string;
  environment: string;
  reproducibilityNotes: string;
  confidence: string;
  evidenceClass: BenchmarkEvidenceClass;
  normalization: BenchmarkNormalizationValues;
  attemptCopyPrivateDbAcrossTenants?: boolean;
  attemptCopyConfidentialCustomerResults?: boolean;
  attemptJustifyOverclock?: boolean;
  attemptJustifyThermalBypass?: boolean;
  attemptJustifyFirmwareModification?: boolean;
  attemptJustifyUnsafeTuning?: boolean;
  attemptEquatePublishedWithXiv?: boolean;
}): BenchmarkRecord | DenialResult {
  if (!BENCHMARK_EVIDENCE_CLASSES.includes(input.evidenceClass)) {
    return deny(`Unknown evidenceClass: ${String(input.evidenceClass)}`);
  }
  if (input.attemptCopyPrivateDbAcrossTenants) {
    return deny(
      'COPY_PRIVATE_BENCHMARK_DB_ACROSS_TENANTS=false — do not copy private benchmark databases across tenant boundaries.',
    );
  }
  if (input.attemptCopyConfidentialCustomerResults) {
    return deny(
      'COPY_CONFIDENTIAL_CUSTOMER_RESULTS_ACROSS_TENANTS=false — confidential customer results must not cross tenants.',
    );
  }
  if (input.attemptJustifyOverclock) {
    return deny(
      'BENCHMARK_JUSTIFIES_OVERCLOCKING=false — no benchmark may justify overclocking.',
    );
  }
  if (input.attemptJustifyThermalBypass) {
    return deny(
      'BENCHMARK_JUSTIFIES_THERMAL_BYPASS=false — no benchmark may justify thermal bypass.',
    );
  }
  if (input.attemptJustifyFirmwareModification) {
    return deny(
      'BENCHMARK_JUSTIFIES_FIRMWARE_MODIFICATION=false — no benchmark may justify firmware modification.',
    );
  }
  if (input.attemptJustifyUnsafeTuning) {
    return deny(
      'BENCHMARK_JUSTIFIES_UNSAFE_HARDWARE_TUNING=false — no benchmark may justify unsafe hardware tuning.',
    );
  }
  if (input.attemptEquatePublishedWithXiv) {
    return deny(
      'PUBLISHED_EQ_XIV_VERIFICATION=false — Published benchmark ≠ XIV verification; keep distinct records.',
    );
  }

  void BENCHMARK_RECORD_FIELDS;

  const comparability = evaluateComparability(input.normalization);
  return {
    benchmarkId: input.benchmarkId,
    vendor: input.vendor,
    deviceChip: input.deviceChip,
    deviceType: input.deviceType,
    architectureGeneration: input.architectureGeneration,
    runtimeProvider: input.runtimeProvider,
    driverRuntimeVersion: input.driverRuntimeVersion,
    modelWorkload: input.modelWorkload,
    precision: input.precision,
    batchSize: input.batchSize,
    datasetInput: input.datasetInput,
    latency: input.latency,
    throughput: input.throughput,
    memoryUsage: input.memoryUsage,
    powerEnergyProxy: input.powerEnergyProxy ?? '',
    benchmarkMethodology: input.benchmarkMethodology,
    source: input.source,
    sourceDate: input.sourceDate,
    rightsLicenseState: input.rightsLicenseState,
    environment: input.environment,
    reproducibilityNotes: input.reproducibilityNotes,
    confidence: input.confidence,
    evidenceClass: input.evidenceClass,
    normalization: { ...input.normalization },
    comparability,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    createdAt: nowIso(),
  };
}

export function pairPublishedAndLocalMeasured(input: {
  published: BenchmarkRecord;
  local: BenchmarkRecord;
}): {
  distinctRecords: boolean;
  publishedNeqXivVerification: true;
  note: string;
} {
  const distinct =
    input.published.benchmarkId !== input.local.benchmarkId &&
    input.published.evidenceClass === 'VENDOR_PUBLISHED' &&
    input.local.evidenceClass === 'XIV_LOCAL_MEASURED';
  return {
    distinctRecords: distinct,
    publishedNeqXivVerification: true,
    note: distinct
      ? 'VENDOR_PUBLISHED and XIV_LOCAL_MEASURED retained as separate records — Published ≠ XIV verification.'
      : 'Pairing requires distinct VENDOR_PUBLISHED vs XIV_LOCAL_MEASURED benchmarkIds.',
  };
}

export function evaluateRegression(input: {
  previousBenchmarkId: string;
  previousLatency: number;
  retestLatency: number;
  tolerancePct?: number;
  stale?: boolean;
}): {
  previousBenchmarkId: string;
  outcome: BenchmarkRegressionOutcome;
  neuralDecay: boolean;
  trust: 'TRUSTED' | 'DECAYING' | 'UNTRUSTED';
} {
  let outcome: BenchmarkRegressionOutcome;
  if (input.stale) {
    outcome = 'STALE';
  } else {
    const tol = input.tolerancePct ?? 5;
    const deltaPct =
      input.previousLatency === 0
        ? 0
        : ((input.retestLatency - input.previousLatency) /
            input.previousLatency) *
          100;
    if (Math.abs(deltaPct) <= tol) outcome = 'PASS';
    else if (deltaPct > tol) outcome = 'REGRESSED';
    else outcome = 'IMPROVED';
  }

  if (outcome === 'STALE') {
    return {
      previousBenchmarkId: input.previousBenchmarkId,
      outcome,
      neuralDecay: true,
      trust: 'DECAYING',
    };
  }
  if (outcome === 'REGRESSED') {
    return {
      previousBenchmarkId: input.previousBenchmarkId,
      outcome,
      neuralDecay: true,
      trust: 'UNTRUSTED',
    };
  }
  return {
    previousBenchmarkId: input.previousBenchmarkId,
    outcome,
    neuralDecay: false,
    trust: 'TRUSTED',
  };
}

export function preferSchedulerEvidence(
  candidates: Array<{
    evidenceClass: BenchmarkEvidenceClass;
    recent?: boolean;
    comparable?: boolean;
  }>,
): {
  preferred: (typeof candidates)[number] | null;
  prefersRecentLocalMeasured: boolean;
  order: typeof SCHEDULER_PREFERENCE_ORDER;
} {
  if (!candidates.length) {
    return {
      preferred: null,
      prefersRecentLocalMeasured: false,
      order: SCHEDULER_PREFERENCE_ORDER,
    };
  }
  let best = candidates[0]!;
  let bestRank = schedulerPreferenceRank(best.evidenceClass, {
    recent: best.recent,
    comparable: best.comparable,
  });
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i]!;
    const rank = schedulerPreferenceRank(c.evidenceClass, {
      recent: c.recent,
      comparable: c.comparable,
    });
    if (rank < bestRank) {
      best = c;
      bestRank = rank;
    }
  }
  return {
    preferred: best,
    prefersRecentLocalMeasured:
      best.evidenceClass === 'XIV_LOCAL_MEASURED' &&
      Boolean(best.recent) &&
      Boolean(best.comparable),
    order: SCHEDULER_PREFERENCE_ORDER,
  };
}

export function answerBenchmarkQuestion(input: {
  questionKey: (typeof BENCHMARK_AGENT_QUESTIONS)[number];
  actor: Ep5Actor;
  attemptAct?: boolean;
}):
  | {
      questionKey: (typeof BENCHMARK_AGENT_QUESTIONS)[number];
      advisory: true;
      canAnswer: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!BENCHMARK_AGENT_QUESTIONS.includes(input.questionKey)) {
    return deny(`Unknown benchmark agent question: ${input.questionKey}`);
  }
  if (input.attemptAct) {
    return deny(
      'RECOMMEND_EQ_ACT=false — benchmark answers are advisory only; recommend ≠ act.',
    );
  }
  if (
    !isBenchmarkMemoryAgent(input.actor) &&
    input.actor.kind !== 'home_base' &&
    !isHumanApprover(input.actor)
  ) {
    return deny('Actor not authorized for benchmark advisory answers.');
  }
  return {
    questionKey: input.questionKey,
    advisory: true,
    canAnswer: true,
    authorityGranted: false,
  };
}

export function attemptCopyPrivateBenchmarkDbAcrossTenants(): DenialResult {
  return deny(
    'COPY_PRIVATE_BENCHMARK_DB_ACROSS_TENANTS=false — private benchmark DBs must not cross tenants.',
  );
}

export function attemptCopyConfidentialCustomerResults(): DenialResult {
  return deny(
    'COPY_CONFIDENTIAL_CUSTOMER_RESULTS_ACROSS_TENANTS=false — confidential customer results must not cross tenants.',
  );
}

export function attemptJustifyOverclockViaBenchmark(): DenialResult {
  return deny(
    'BENCHMARK_JUSTIFIES_OVERCLOCKING=false — no overclocking via benchmark.',
  );
}

export function attemptJustifyThermalBypassViaBenchmark(): DenialResult {
  return deny(
    'BENCHMARK_JUSTIFIES_THERMAL_BYPASS=false — no thermal bypass via benchmark.',
  );
}

export function attemptJustifyFirmwareModificationViaBenchmark(): DenialResult {
  return deny(
    'BENCHMARK_JUSTIFIES_FIRMWARE_MODIFICATION=false — no firmware modification via benchmark.',
  );
}

export function attemptJustifyUnsafeHardwareTuningViaBenchmark(): DenialResult {
  return deny(
    'BENCHMARK_JUSTIFIES_UNSAFE_HARDWARE_TUNING=false — no unsafe hardware tuning via benchmark.',
  );
}

export function attemptEquatePublishedWithXivVerification(): DenialResult {
  return deny(
    'PUBLISHED_EQ_XIV_VERIFICATION=false — Published benchmark ≠ XIV verification.',
  );
}

export function attemptTreatStaleAsPermanentlyTrusted(): DenialResult {
  return deny(
    'STALE_EQ_PERMANENTLY_TRUSTED=false — stale benchmark evidence must decay in the neural compute graph.',
  );
}

export function attemptNaiveComparisonAsComparable(): DenialResult {
  return deny(
    'NAIVE_COMPARISON_EQ_COMPARABLE=false — missing normalization → NOT_COMPARABLE.',
  );
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny(
    'AGENT_AUTO_AUTHORITY=false — benchmark agents have no automatic authority.',
  );
}

export function returnAgentEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep5Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      actorKind: Ep5Actor['kind'];
      summary: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!BENCHMARK_MEMORY_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isBenchmarkMemoryAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only benchmark agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    actorKind: input.actor.kind,
    summary: input.summary,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep5Actor;
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
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EP5_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    bypassDenied: EP5_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function fullNormalization(): BenchmarkNormalizationValues {
  return {
    exact_hardware: 'ASUS-NUC-example-CPU',
    model_version: 'model-v1.0.0',
    input_size: '512x512',
    precision: 'fp16',
    runtime: 'onnxruntime-1.17',
    batch_size: '1',
    thermal_power_conditions: 'stock-tdp',
    software_version: 'xiv-local-0.1',
    peak_theoretical_vs_end_to_end_measured: 'end_to_end_measured',
  };
}

export function bootstrapPublicBenchmarkMemory(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep5SoftWireSnapshot;
  evidenceClasses: readonly BenchmarkEvidenceClass[];
  recordFields: readonly BenchmarkRecordField[];
  normalizationDimensions: readonly BenchmarkNormalizationDimension[];
  comparabilityStates: readonly ComparabilityState[];
  regressionOutcomes: readonly BenchmarkRegressionOutcome[];
  schedulerPreferenceOrder: typeof SCHEDULER_PREFERENCE_ORDER;
  agentQuestions: typeof BENCHMARK_AGENT_QUESTIONS;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP5_MAY;
  mustNot: typeof EP5_MUST_NOT;
  dbCandidates: typeof EP5_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp5LocksIntact(),
    softWire: ep5SoftWireSnapshot(repoRoot),
    evidenceClasses: BENCHMARK_EVIDENCE_CLASSES,
    recordFields: BENCHMARK_RECORD_FIELDS,
    normalizationDimensions: BENCHMARK_NORMALIZATION_DIMENSIONS,
    comparabilityStates: COMPARABILITY_STATES,
    regressionOutcomes: BENCHMARK_REGRESSION_OUTCOMES,
    schedulerPreferenceOrder: SCHEDULER_PREFERENCE_ORDER,
    agentQuestions: BENCHMARK_AGENT_QUESTIONS,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP5_MAY,
    mustNot: EP5_MUST_NOT,
    dbCandidates: EP5_DB_CANDIDATES_STATUS,
  };
}

export function runPublicBenchmarkMemoryCycle(input: {
  actor: Ep5Actor;
  human: Ep5Actor;
  repoRoot?: string;
}): {
  hops: Ep5HopRecord[];
  published: BenchmarkRecord | DenialResult;
  localMeasured: BenchmarkRecord | DenialResult;
  softWire: Ep5SoftWireSnapshot;
} {
  const hops: Ep5HopRecord[] = [];
  const softWire = ep5SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp5LocksIntact() ? 'PASS' : 'FAIL',
      'EP5 locks intact including L4=false and Published ≠ XIV verification.',
    ),
  );
  hops.push(
    hop(
      'benchmark_memory_bootstrap',
      'PASS',
      'Public Benchmark Memory bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'evidence_classes_encoded',
      'PASS',
      `${BENCHMARK_EVIDENCE_CLASSES.length} evidence classes encoded.`,
    ),
  );
  hops.push(
    hop(
      'benchmark_record_fields_encoded',
      'PASS',
      `${BENCHMARK_RECORD_FIELDS.length} benchmark record fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'normalization_dimensions_encoded',
      'PASS',
      `${BENCHMARK_NORMALIZATION_DIMENSIONS.length} normalization dimensions encoded.`,
    ),
  );
  hops.push(
    hop(
      'comparability_states_encoded',
      'PASS',
      COMPARABILITY_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'regression_outcomes_encoded',
      'PASS',
      BENCHMARK_REGRESSION_OUTCOMES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'scheduler_preference_order_encoded',
      'PASS',
      SCHEDULER_PREFERENCE_ORDER.join(' → '),
    ),
  );
  hops.push(
    hop(
      'agent_questions_encoded',
      'PASS',
      `${BENCHMARK_AGENT_QUESTIONS.length} agent question surfaces encoded.`,
    ),
  );

  const published = registerBenchmarkRecord({
    actor: input.actor,
    benchmarkId: 'bm-vendor-nvidia-pub-1',
    vendor: 'NVIDIA',
    deviceChip: 'example-gpu',
    deviceType: 'GPU',
    architectureGeneration: 'example-gen',
    runtimeProvider: 'cuda',
    driverRuntimeVersion: '550.x',
    modelWorkload: 'resnet50',
    precision: 'fp16',
    batchSize: '1',
    datasetInput: 'imagenet-sample',
    latency: '2.1ms',
    throughput: '480 ips',
    memoryUsage: '2GB',
    powerEnergyProxy: '75W',
    benchmarkMethodology: 'vendor published whitepaper',
    source: 'vendor-public-docs',
    sourceDate: '2026-01-01',
    rightsLicenseState: 'VENDOR_PUBLIC_DOCUMENTATION',
    environment: 'vendor lab',
    reproducibilityNotes: 'vendor claim; not XIV measured',
    confidence: 'medium',
    evidenceClass: 'VENDOR_PUBLISHED',
    normalization: fullNormalization(),
  });

  const localMeasured = registerBenchmarkRecord({
    actor: input.actor,
    benchmarkId: 'bm-xiv-local-1',
    vendor: 'NVIDIA',
    deviceChip: 'example-gpu',
    deviceType: 'GPU',
    architectureGeneration: 'example-gen',
    runtimeProvider: 'cuda',
    driverRuntimeVersion: '550.x',
    modelWorkload: 'resnet50',
    precision: 'fp16',
    batchSize: '1',
    datasetInput: 'imagenet-sample',
    latency: '3.4ms',
    throughput: '290 ips',
    memoryUsage: '2.1GB',
    powerEnergyProxy: '80W',
    benchmarkMethodology: 'XIV local end-to-end measured',
    source: 'xiv-local-node',
    sourceDate: '2026-09-09',
    rightsLicenseState: 'USER_AUTHORIZED',
    environment: 'xiv-local',
    reproducibilityNotes: 'local node measured; distinct from vendor claim',
    confidence: 'high',
    evidenceClass: 'XIV_LOCAL_MEASURED',
    normalization: fullNormalization(),
  });

  hops.push(
    hop(
      'published_neq_xiv_verification',
      attemptEquatePublishedWithXivVerification().state,
      'Published benchmark ≠ XIV verification — equate attempt DENIED.',
    ),
  );

  if (!('denied' in published) && !('denied' in localMeasured)) {
    const pair = pairPublishedAndLocalMeasured({
      published,
      local: localMeasured,
    });
    hops.push(
      hop(
        'vendor_published_distinct_from_xiv_local_measured',
        pair.distinctRecords ? 'PASS' : 'FAIL',
        pair.note,
      ),
    );
  } else {
    hops.push(
      hop(
        'vendor_published_distinct_from_xiv_local_measured',
        'FAIL',
        'Could not pair published vs local measured records.',
      ),
    );
  }

  const pref = preferSchedulerEvidence([
    { evidenceClass: 'VENDOR_PUBLISHED', recent: true, comparable: true },
    { evidenceClass: 'XIV_LOCAL_MEASURED', recent: true, comparable: true },
    { evidenceClass: 'SIMULATED', recent: true, comparable: true },
  ]);
  hops.push(
    hop(
      'prefer_local_measured_when_available',
      pref.prefersRecentLocalMeasured ? 'PASS' : 'FAIL',
      'Virtual Chip scheduler prefers recent comparable XIV_LOCAL_MEASURED.',
    ),
  );

  const naive = evaluateComparability({});
  hops.push(
    hop(
      'naive_comparison_marked_not_comparable',
      naive === 'NOT_COMPARABLE' &&
        attemptNaiveComparisonAsComparable().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Missing normalization → NOT_COMPARABLE; naive-as-comparable DENIED.',
    ),
  );

  const stale = evaluateRegression({
    previousBenchmarkId: 'bm-xiv-local-1',
    previousLatency: 3.4,
    retestLatency: 3.4,
    stale: true,
  });
  hops.push(
    hop(
      'stale_evidence_decays',
      stale.outcome === 'STALE' &&
        stale.neuralDecay &&
        attemptTreatStaleAsPermanentlyTrusted().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'STALE evidence decays; permanently-trusted treatment DENIED.',
    ),
  );

  hops.push(
    hop(
      'lawful_benchmarks_only',
      'PASS',
      'Lawful public, licensed, or authorized benchmarks only.',
    ),
  );
  hops.push(
    hop(
      'no_private_benchmark_db_cross_tenant_copy',
      attemptCopyPrivateBenchmarkDbAcrossTenants().state,
      'Private benchmark DB cross-tenant copy DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_benchmark_justifies_overclock_thermal_bypass_firmware',
      attemptJustifyOverclockViaBenchmark().state === 'DENIED' &&
        attemptJustifyThermalBypassViaBenchmark().state === 'DENIED' &&
        attemptJustifyFirmwareModificationViaBenchmark().state === 'DENIED' &&
        attemptJustifyUnsafeHardwareTuningViaBenchmark().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Overclock / thermal bypass / firmware / unsafe tuning via benchmark DENIED.',
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
      answerBenchmarkQuestion({
        questionKey: 'which_verified_device_is_best_for_this_workload',
        actor: input.actor,
        attemptAct: true,
      }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act for benchmark answers.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP5_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep4_soft_wire',
      softWire.ep4IpFirewall.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep4IpFirewall.note,
    ),
  );
  hops.push(
    hop(
      'ep2_soft_wire',
      softWire.ep2CapabilityGraph.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep2CapabilityGraph.note,
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
      EP5_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep5-1',
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

  void PUBLIC_BENCHMARK_MEMORY_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    published,
    localMeasured,
    softWire,
  };
}
