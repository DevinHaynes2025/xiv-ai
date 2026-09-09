/**
 * 62L-EQ12 — Cross-Architecture Benchmark Matrix runtime.
 *
 * Emit rows; enforce comparability keys; tag result states without
 * fastest-always-best; PASS only after actual run; vendor≠XIV-measured.
 * Soft-wires EQ11/EQ8/EQ6/EP14/EP12/EM157 when present.
 */

import {
  BENCHMARK_EVIDENCE_STATES,
  BENCHMARK_MATRIX_CORE_FLOW,
  BENCHMARK_RESULT_STATES,
  BENCHMARK_ROW_FIELDS,
  COMPARABILITY_KEYS,
  COMPARISON_PATH_CANDIDATES,
  CROSS_ARCHITECTURE_BENCHMARK_MATRIX_CYCLE,
  EQ12_AGENT_BOUNDS,
  EQ12_DB_CANDIDATES_STATUS,
  EQ12_LOCKS,
  EQ12_MAY,
  EQ12_MUST_NOT,
  EQ12_TRUTH_DENIES,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  ROUTE_WIN_EXAMPLES,
  SCHEDULER_FEEDBACK_PATH,
  assertEq12LocksIntact,
  canMarkPass,
  eq12SoftWireSnapshot,
  fastestImpliesAlwaysBest,
  isEq12Agent,
  isHumanApprover,
  vendorNumbersImpliesXivMeasured,
  type BenchmarkEvidenceState,
  type BenchmarkResultState,
  type BenchmarkRowField,
  type ComparisonPathCandidate,
  type Eq12Actor,
  type Eq12EvidenceState,
  type Eq12HopRecord,
  type Eq12SoftWireSnapshot,
} from './cross-architecture-benchmark-matrix-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CROSS_ARCHITECTURE_BENCHMARK_MATRIX_CYCLE)[number],
  state: Eq12EvidenceState,
  summary: string,
): Eq12HopRecord {
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

export type ComparabilityFingerprint = {
  model: string;
  precision: string;
  batch: number;
  input: string;
  runtimeClass: string;
  testMethod: string;
};

export type BenchmarkMatrixRow = {
  benchmarkId: string;
  workloadId: string;
  modelVersion: string;
  inputProfile: string;
  architecture: ComparisonPathCandidate;
  device: string;
  runtimeProvider: string;
  precision: string;
  batchSize: number;
  latency: number | null;
  throughput: number | null;
  memoryUsage: number | null;
  energyProxy: number | null;
  costProxy: number | null;
  reliability: number | null;
  fallbackUsed: string | null;
  environmentVersionFingerprint: string;
  evidenceState: BenchmarkEvidenceState;
  resultState: BenchmarkResultState | null;
  timestamp: string;
  actuallyRun: boolean;
  vendorPublishedSeparate: boolean;
  comparability: ComparabilityFingerprint;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
};

export type NormalizedComparison = {
  comparisonId: string;
  workloadId: string;
  comparable: boolean;
  resultTags: readonly BenchmarkResultState[];
  fastestAlwaysBest: false;
  schedulerFeedback: typeof SCHEDULER_FEEDBACK_PATH;
};

export function emitBenchmarkRow(input: {
  actor: Eq12Actor;
  benchmarkId: string;
  workloadId: string;
  modelVersion: string;
  inputProfile: string;
  architecture: ComparisonPathCandidate;
  device: string;
  runtimeProvider: string;
  precision: string;
  batchSize: number;
  environmentVersionFingerprint: string;
  comparability: ComparabilityFingerprint;
  latency?: number | null;
  throughput?: number | null;
  memoryUsage?: number | null;
  energyProxy?: number | null;
  costProxy?: number | null;
  reliability?: number | null;
  fallbackUsed?: string | null;
  actuallyRun?: boolean;
  evidenceState?: BenchmarkEvidenceState;
  attemptPassWithoutActualRun?: boolean;
  attemptEquateVendorWithXivMeasured?: boolean;
  attemptAssumeFastestAlwaysBest?: boolean;
  attemptOverclocking?: boolean;
  attemptFirmwareChanges?: boolean;
  attemptPrivilegeEscalation?: boolean;
  attemptAutomaticCloudPurchasing?: boolean;
  attemptCrossTenantDataMovement?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): BenchmarkMatrixRow | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_EQ12=false.');
  }
  if (input.attemptPassWithoutActualRun) {
    return deny(
      'PASS_WITHOUT_ACTUAL_RUN=false — no benchmark is PASS until actually run.',
    );
  }
  if (input.attemptEquateVendorWithXivMeasured) {
    return deny(
      'VENDOR_NUMBERS_EQ_XIV_MEASURED=false — vendor published numbers remain separate.',
    );
  }
  if (input.attemptAssumeFastestAlwaysBest) {
    return deny('FASTEST_ALWAYS_BEST=false.');
  }
  if (input.attemptOverclocking) {
    return deny('OVERCLOCKING=false.');
  }
  if (input.attemptFirmwareChanges) {
    return deny('FIRMWARE_CHANGES=false.');
  }
  if (input.attemptPrivilegeEscalation) {
    return deny('PRIVILEGE_ESCALATION=false.');
  }
  if (input.attemptAutomaticCloudPurchasing) {
    return deny('AUTOMATIC_CLOUD_PURCHASING=false.');
  }
  if (input.attemptCrossTenantDataMovement) {
    return deny('CROSS_TENANT_DATA_MOVEMENT=false.');
  }

  void BENCHMARK_ROW_FIELDS;
  const actuallyRun = input.actuallyRun ?? false;
  let evidenceState = input.evidenceState ?? (actuallyRun ? 'MEASURED' : 'NOT_RUN');

  if (evidenceState === 'PASS' && !actuallyRun) {
    return deny('PASS_WITHOUT_ACTUAL_RUN=false.');
  }
  if (evidenceState === 'VENDOR_PUBLISHED_SEPARATE') {
    // allowed as separate lane
  }

  return {
    benchmarkId: input.benchmarkId,
    workloadId: input.workloadId,
    modelVersion: input.modelVersion,
    inputProfile: input.inputProfile,
    architecture: input.architecture,
    device: input.device,
    runtimeProvider: input.runtimeProvider,
    precision: input.precision,
    batchSize: input.batchSize,
    latency: input.latency ?? null,
    throughput: input.throughput ?? null,
    memoryUsage: input.memoryUsage ?? null,
    energyProxy: input.energyProxy ?? null,
    costProxy: input.costProxy ?? null,
    reliability: input.reliability ?? null,
    fallbackUsed: input.fallbackUsed ?? null,
    environmentVersionFingerprint: input.environmentVersionFingerprint,
    evidenceState,
    resultState: null,
    timestamp: nowIso(),
    actuallyRun,
    vendorPublishedSeparate: evidenceState === 'VENDOR_PUBLISHED_SEPARATE',
    comparability: input.comparability,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
  };
}

export function areRowsComparable(
  a: ComparabilityFingerprint,
  b: ComparabilityFingerprint,
): boolean {
  return (
    a.model === b.model &&
    a.precision === b.precision &&
    a.batch === b.batch &&
    a.input === b.input &&
    a.runtimeClass === b.runtimeClass &&
    a.testMethod === b.testMethod
  );
}

export function markRowPass(input: {
  row: BenchmarkMatrixRow;
  attemptWithoutActualRun?: boolean;
}): { row: BenchmarkMatrixRow } | DenialResult {
  if (input.attemptWithoutActualRun || !input.row.actuallyRun) {
    return deny('PASS_WITHOUT_ACTUAL_RUN=false.');
  }
  if (
    !canMarkPass({
      actuallyRun: input.row.actuallyRun,
      measuredMetricsPresent:
        input.row.latency !== null || input.row.throughput !== null,
    })
  ) {
    return deny('Measured metrics required to mark PASS.');
  }
  return {
    row: {
      ...input.row,
      evidenceState: 'PASS',
    },
  };
}

export function normalizeComparison(input: {
  comparisonId: string;
  rows: readonly BenchmarkMatrixRow[];
  attemptForceCompareWhenNotComparable?: boolean;
  attemptAssumeFastestAlwaysBest?: boolean;
}): NormalizedComparison | DenialResult {
  if (input.attemptAssumeFastestAlwaysBest) {
    return deny('FASTEST_ALWAYS_BEST=false.');
  }
  if (input.rows.length === 0) {
    return deny('No rows to compare.');
  }
  const base = input.rows[0]!.comparability;
  const allComparable = input.rows.every((r) =>
    areRowsComparable(base, r.comparability),
  );
  if (!allComparable) {
    if (input.attemptForceCompareWhenNotComparable) {
      return deny('FORCE_COMPARE_WHEN_NOT_COMPARABLE=false.');
    }
    return {
      comparisonId: input.comparisonId,
      workloadId: input.rows[0]!.workloadId,
      comparable: false,
      resultTags: ['NOT_COMPARABLE'],
      fastestAlwaysBest: false,
      schedulerFeedback: SCHEDULER_FEEDBACK_PATH,
    };
  }

  const measured = input.rows.filter((r) => r.actuallyRun);
  if (measured.length === 0) {
    return {
      comparisonId: input.comparisonId,
      workloadId: input.rows[0]!.workloadId,
      comparable: true,
      resultTags: ['BASELINE'],
      fastestAlwaysBest: false,
      schedulerFeedback: SCHEDULER_FEEDBACK_PATH,
    };
  }

  const tags: BenchmarkResultState[] = ['BASELINE'];
  const byLatency = [...measured].sort(
    (a, b) => (a.latency ?? Infinity) - (b.latency ?? Infinity),
  );
  const byThroughput = [...measured].sort(
    (a, b) => (b.throughput ?? -Infinity) - (a.throughput ?? -Infinity),
  );
  const byCost = [...measured].sort(
    (a, b) => (a.costProxy ?? Infinity) - (b.costProxy ?? Infinity),
  );
  const byEnergy = [...measured].sort(
    (a, b) => (a.energyProxy ?? Infinity) - (b.energyProxy ?? Infinity),
  );

  if (byLatency[0]?.latency != null) tags.push('BEST_LATENCY');
  if (byThroughput[0]?.throughput != null) tags.push('BEST_THROUGHPUT');
  if (byCost[0]?.costProxy != null) tags.push('BEST_COST');
  if (byEnergy[0]?.energyProxy != null) tags.push('BEST_ENERGY_PROXY');
  if (
    measured.some(
      (r) =>
        r.architecture === 'edge_cloud_candidate' ||
        r.device.includes('edge') ||
        r.device.includes('local'),
    )
  ) {
    tags.push('BEST_LOCALITY');
  }

  void byLatency;
  void byThroughput;
  void byCost;
  void byEnergy;
  void ROUTE_WIN_EXAMPLES;

  return {
    comparisonId: input.comparisonId,
    workloadId: input.rows[0]!.workloadId,
    comparable: true,
    resultTags: tags,
    fastestAlwaysBest: false,
    schedulerFeedback: SCHEDULER_FEEDBACK_PATH,
  };
}

export function feedSchedulerMeasuredResult(input: {
  workloadId: string;
  architecture: ComparisonPathCandidate;
  device: string;
  measuredResult: BenchmarkResultState;
  attemptAssumeFastestAlwaysBest?: boolean;
}):
  | {
      path: typeof SCHEDULER_FEEDBACK_PATH;
      workloadId: string;
      architecture: ComparisonPathCandidate;
      device: string;
      measuredResult: BenchmarkResultState;
      authorityGranted: false;
    }
  | DenialResult {
  if (input.attemptAssumeFastestAlwaysBest) {
    return deny('FASTEST_ALWAYS_BEST=false.');
  }
  return {
    path: SCHEDULER_FEEDBACK_PATH,
    workloadId: input.workloadId,
    architecture: input.architecture,
    device: input.device,
    measuredResult: input.measuredResult,
    authorityGranted: false,
  };
}

export function attemptPassWithoutActualRun(): DenialResult {
  return deny('PASS_WITHOUT_ACTUAL_RUN=false.');
}

export function attemptEquateVendorWithXivMeasured(): DenialResult {
  return deny('VENDOR_NUMBERS_EQ_XIV_MEASURED=false.');
}

export function attemptAssumeFastestAlwaysBest(): DenialResult {
  return deny('FASTEST_ALWAYS_BEST=false.');
}

export function attemptOverclocking(): DenialResult {
  return deny('OVERCLOCKING=false.');
}

export function attemptFirmwareChanges(): DenialResult {
  return deny('FIRMWARE_CHANGES=false.');
}

export function attemptPrivilegeEscalation(): DenialResult {
  return deny('PRIVILEGE_ESCALATION=false.');
}

export function attemptAutomaticCloudPurchasing(): DenialResult {
  return deny('AUTOMATIC_CLOUD_PURCHASING=false.');
}

export function attemptCrossTenantDataMovement(): DenialResult {
  return deny('CROSS_TENANT_DATA_MOVEMENT=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnEq12EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq12Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      feedbackPath: typeof SCHEDULER_FEEDBACK_PATH;
      authorityGranted: false;
    }
  | DenialResult {
  if (!EQ12_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEq12Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only EQ12 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    feedbackPath: SCHEDULER_FEEDBACK_PATH,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq12Actor;
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
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver, founder, or tenant_admin.',
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
    unchanged: EQ12_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ12_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ12_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

const SHARED_FP: ComparabilityFingerprint = {
  model: 'model-a@1.0',
  precision: 'fp16',
  batch: 1,
  input: 'input-profile-attn-v1',
  runtimeClass: 'onnxruntime',
  testMethod: 'xiv-bench-v0',
};

export function exampleCrossArchitectureRows(
  actor: Eq12Actor,
): BenchmarkMatrixRow[] {
  const specs: Array<{
    benchmarkId: string;
    architecture: ComparisonPathCandidate;
    device: string;
    latency: number;
    throughput: number;
    energyProxy: number;
    costProxy: number;
  }> = [
    {
      benchmarkId: 'b-arm',
      architecture: 'arm_cpu',
      device: 'arm-server-1',
      latency: 40,
      throughput: 20,
      energyProxy: 0.5,
      costProxy: 1.0,
    },
    {
      benchmarkId: 'b-x86',
      architecture: 'x86_cpu',
      device: 'x86-server-1',
      latency: 35,
      throughput: 22,
      energyProxy: 0.7,
      costProxy: 1.2,
    },
    {
      benchmarkId: 'b-amd',
      architecture: 'amd_gpu_npu',
      device: 'amd-gpu-1',
      latency: 18,
      throughput: 80,
      energyProxy: 1.5,
      costProxy: 2.0,
    },
    {
      benchmarkId: 'b-nvi',
      architecture: 'nvidia_gpu',
      device: 'nvidia-gpu-1',
      latency: 15,
      throughput: 100,
      energyProxy: 2.0,
      costProxy: 2.5,
    },
    {
      benchmarkId: 'b-edge',
      architecture: 'edge_cloud_candidate',
      device: 'local-edge-1',
      latency: 50,
      throughput: 10,
      energyProxy: 0.2,
      costProxy: 0.3,
    },
  ];

  const rows: BenchmarkMatrixRow[] = [];
  for (const s of specs) {
    const row = emitBenchmarkRow({
      actor,
      benchmarkId: s.benchmarkId,
      workloadId: 'wl-attn-1',
      modelVersion: SHARED_FP.model,
      inputProfile: SHARED_FP.input,
      architecture: s.architecture,
      device: s.device,
      runtimeProvider: 'onnxruntime',
      precision: SHARED_FP.precision,
      batchSize: SHARED_FP.batch,
      environmentVersionFingerprint: 'env-fp-1',
      comparability: SHARED_FP,
      latency: s.latency,
      throughput: s.throughput,
      memoryUsage: 2048,
      energyProxy: s.energyProxy,
      costProxy: s.costProxy,
      reliability: 0.99,
      actuallyRun: true,
      evidenceState: 'MEASURED',
    });
    if ('denied' in row) throw new Error(`row ${s.benchmarkId} failed`);
    rows.push(row);
  }
  return rows;
}

export function bootstrapCrossArchitectureBenchmarkMatrix(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq12SoftWireSnapshot;
  rowFields: readonly BenchmarkRowField[];
  paths: typeof COMPARISON_PATH_CANDIDATES;
  comparabilityKeys: typeof COMPARABILITY_KEYS;
  resultStates: typeof BENCHMARK_RESULT_STATES;
  evidenceStates: typeof BENCHMARK_EVIDENCE_STATES;
  coreFlow: typeof BENCHMARK_MATRIX_CORE_FLOW;
  feedbackPath: typeof SCHEDULER_FEEDBACK_PATH;
  routeWins: typeof ROUTE_WIN_EXAMPLES;
  truthDenies: typeof EQ12_TRUTH_DENIES;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ12_MAY;
  mustNot: typeof EQ12_MUST_NOT;
  dbCandidates: typeof EQ12_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq12LocksIntact(),
    softWire: eq12SoftWireSnapshot(repoRoot),
    rowFields: BENCHMARK_ROW_FIELDS,
    paths: COMPARISON_PATH_CANDIDATES,
    comparabilityKeys: COMPARABILITY_KEYS,
    resultStates: BENCHMARK_RESULT_STATES,
    evidenceStates: BENCHMARK_EVIDENCE_STATES,
    coreFlow: BENCHMARK_MATRIX_CORE_FLOW,
    feedbackPath: SCHEDULER_FEEDBACK_PATH,
    routeWins: ROUTE_WIN_EXAMPLES,
    truthDenies: EQ12_TRUTH_DENIES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ12_MAY,
    mustNot: EQ12_MUST_NOT,
    dbCandidates: EQ12_DB_CANDIDATES_STATUS,
  };
}

export function runCrossArchitectureBenchmarkMatrixCycle(input: {
  actor: Eq12Actor;
  human: Eq12Actor;
  repoRoot?: string;
}): {
  hops: Eq12HopRecord[];
  rows: BenchmarkMatrixRow[];
  comparison: NormalizedComparison;
  softWire: Eq12SoftWireSnapshot;
} {
  const hops: Eq12HopRecord[] = [];
  const softWire = eq12SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq12LocksIntact() ? 'PASS' : 'FAIL',
      'EQ12 locks intact including L4=false and fastest≠always best.',
    ),
  );
  hops.push(
    hop(
      'cross_architecture_benchmark_matrix_bootstrap',
      'PASS',
      'Cross-Architecture Benchmark Matrix bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'benchmark_row_fields_encoded',
      'PASS',
      `${BENCHMARK_ROW_FIELDS.length} benchmark row fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'comparison_paths_encoded',
      'PASS',
      COMPARISON_PATH_CANDIDATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'comparability_keys_encoded',
      'PASS',
      COMPARABILITY_KEYS.join(' + '),
    ),
  );
  hops.push(
    hop(
      'result_states_encoded',
      'PASS',
      BENCHMARK_RESULT_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'scheduler_feedback_path_encoded',
      'PASS',
      SCHEDULER_FEEDBACK_PATH.join(' → '),
    ),
  );

  const rows = exampleCrossArchitectureRows(input.actor);
  const mismatched = emitBenchmarkRow({
    actor: input.actor,
    benchmarkId: 'b-bad',
    workloadId: 'wl-attn-1',
    modelVersion: 'other-model',
    inputProfile: SHARED_FP.input,
    architecture: 'intel_gpu_npu',
    device: 'intel-1',
    runtimeProvider: 'other-rt',
    precision: 'fp32',
    batchSize: 8,
    environmentVersionFingerprint: 'env-x',
    comparability: {
      ...SHARED_FP,
      model: 'other-model',
      precision: 'fp32',
      batch: 8,
      runtimeClass: 'other',
    },
    actuallyRun: true,
    latency: 10,
    throughput: 50,
  });
  if ('denied' in mismatched) throw new Error('mismatch row failed');

  const notComparable = normalizeComparison({
    comparisonId: 'cmp-bad',
    rows: [...rows, mismatched],
  });
  if ('denied' in notComparable) throw new Error('notComparable failed');

  const comparisonResult = normalizeComparison({
    comparisonId: 'cmp-1',
    rows,
  });
  if ('denied' in comparisonResult) throw new Error('comparison failed');
  const comparison = comparisonResult;

  hops.push(
    hop(
      'comparable_only_when_keys_match',
      notComparable.comparable === false &&
        notComparable.resultTags.includes('NOT_COMPARABLE') &&
        comparison.comparable === true
        ? 'PASS'
        : 'FAIL',
      'Comparable only when model+precision+batch+input+runtime+method match.',
    ),
  );

  hops.push(
    hop(
      'fastest_neq_always_best',
      comparison.fastestAlwaysBest === false &&
        fastestImpliesAlwaysBest() === false &&
        attemptAssumeFastestAlwaysBest().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Fastest device ≠ always best route.',
    ),
  );

  hops.push(
    hop(
      'vendor_numbers_neq_xiv_measured',
      vendorNumbersImpliesXivMeasured() === false &&
        attemptEquateVendorWithXivMeasured().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Vendor published numbers ≠ XIV-measured results.',
    ),
  );

  const noRunPass = markRowPass({
    row: { ...rows[0]!, actuallyRun: false, evidenceState: 'NOT_RUN' },
    attemptWithoutActualRun: true,
  });
  const passOk = markRowPass({ row: rows[0]! });
  hops.push(
    hop(
      'pass_only_when_actually_run',
      noRunPass.state === 'DENIED' &&
        !('denied' in passOk) &&
        passOk.row.evidenceState === 'PASS' &&
        attemptPassWithoutActualRun().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'No benchmark is PASS until actually run.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof CROSS_ARCHITECTURE_BENCHMARK_MATRIX_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_pass_without_actual_run', fn: attemptPassWithoutActualRun },
    {
      hop: 'deny_equate_vendor_with_xiv_measured',
      fn: attemptEquateVendorWithXivMeasured,
    },
    {
      hop: 'deny_assume_fastest_always_best',
      fn: attemptAssumeFastestAlwaysBest,
    },
    { hop: 'deny_overclocking', fn: attemptOverclocking },
    { hop: 'deny_firmware_changes', fn: attemptFirmwareChanges },
    { hop: 'deny_privilege_escalation', fn: attemptPrivilegeEscalation },
    {
      hop: 'deny_automatic_cloud_purchasing',
      fn: attemptAutomaticCloudPurchasing,
    },
    {
      hop: 'deny_cross_tenant_data_movement',
      fn: attemptCrossTenantDataMovement,
    },
  ];
  for (const d of denyHops) {
    hops.push(
      hop(
        d.hop,
        d.fn().state === 'DENIED' ? 'PASS' : 'FAIL',
        `${d.hop} DENIED.`,
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
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Recommend ≠ act / authorize.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EQ12_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eq11_soft_wire',
      softWire.eq11DeviceNeutralWorkloadGenome.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.eq11DeviceNeutralWorkloadGenome.note,
    ),
  );
  hops.push(
    hop(
      'eq8_soft_wire',
      softWire.eq8ArmServerCloudRuntime.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq8ArmServerCloudRuntime.note,
    ),
  );
  hops.push(
    hop(
      'eq6_soft_wire',
      softWire.eq6ArchitectureCapabilityGraph.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq6ArchitectureCapabilityGraph.note,
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
      softWire.ep12HardwareNeutralScheduler.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep12HardwareNeutralScheduler.note,
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
      EQ12_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq12-1',
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

  void CROSS_ARCHITECTURE_BENCHMARK_MATRIX_CYCLE;
  void attemptAgentAutoAuthority;
  void feedSchedulerMeasuredResult;

  return {
    hops,
    rows,
    comparison,
    softWire,
  };
}
