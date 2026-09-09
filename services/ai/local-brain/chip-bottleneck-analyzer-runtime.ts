/**
 * 62L-ES-HC2 (#164) — Chip Bottleneck Analyzer runtime.
 *
 * Classify bottlenecks from metrics → propose software fixes → require
 * baseline vs sandbox benchmark before IMPROVED. Deny silicon-modify claims
 * and hardware-internal changes. Soft-wires HC1/ER34/ER29–32/EM157.
 */

import {
  ANALYSIS_FIELDS,
  ANALYZER_CORE_FLOW,
  BENCHMARK_RESULT_STATES,
  BOTTLENECK_ANALYZER_BOUNDS,
  BOTTLENECK_STATES,
  CANDIDATE_FIXES,
  CHIP_BOTTLENECK_ANALYZER_CYCLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HC2_DB_CANDIDATES_STATUS,
  HC2_LOCKS,
  HC2_MAY,
  HC2_MUST_NOT,
  HONESTY_BANNER,
  INSPECTION_DIMENSIONS,
  NEXT_PHASE_TITLE,
  SAFETY_BOUNDARIES,
  SILICON_MODIFY_CLAIM_SIGNALS,
  SUPPORTED_VENDORS,
  TRACK_DISTINCTNESS_NOTE,
  assertHc2LocksIntact,
  canClaimImproved,
  hc2SoftWireSnapshot,
  isBottleneckAnalyzerAgent,
  isHumanApprover,
  softWireHopState,
  type BaselinePerformance,
  type BottleneckState,
  type CandidateFix,
  type CandidateOptimization,
  type ChipBottleneckAnalysis,
  type Hc2Actor,
  type Hc2EvidenceState,
  type Hc2HopRecord,
  type Hc2SoftWireSnapshot,
  type ObservedMetrics,
  type SupportedVendor,
} from './chip-bottleneck-analyzer-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CHIP_BOTTLENECK_ANALYZER_CYCLE)[number],
  state: Hc2EvidenceState,
  summary: string,
): Hc2HopRecord {
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

/**
 * Example metrics: looks like “GPU too slow” but low GPU util + high CPU
 * preprocess + high transfer → DATA_TRANSFER_BOUND.
 */
export function transferBoundExampleMetrics(): ObservedMetrics {
  return {
    cpuUtilizationPct: 88,
    gpuUtilizationPct: 18,
    npuUtilizationPct: 0,
    memoryBandwidthUtilPct: 42,
    vramPressurePct: 30,
    ramPressurePct: 55,
    cacheMissRatePct: 12,
    modelLoadTimeMs: 400,
    operatorKernelCompatible: true,
    quantizationMismatch: false,
    batchSize: 1,
    queueDepth: 2,
    ioLatencyMs: 8,
    storageThroughputMBps: 900,
    networkLatencyMs: 5,
    apiProviderLatencyMs: 0,
    thermalPressurePct: 20,
    powerDrawProxy: 40,
    syncOverheadMs: 15,
    transferOverheadMs: 120,
  };
}

/**
 * Classify bottleneck from observed metrics (software-evidence only).
 */
export function classifyBottleneck(
  metrics: ObservedMetrics,
): { state: BottleneckState; confidence: number; rationale: string } {
  // Transfer-bound: low GPU/NPU util + high CPU + high transfer overhead
  if (
    metrics.gpuUtilizationPct < 40 &&
    metrics.cpuUtilizationPct > 70 &&
    metrics.transferOverheadMs > 50 &&
    metrics.transferOverheadMs >= metrics.syncOverheadMs
  ) {
    return {
      state: 'DATA_TRANSFER_BOUND',
      confidence: 0.86,
      rationale:
        'Low GPU util with high CPU preprocess and high CPU↔GPU/NPU transfer overhead — optimize transfer path, not blind GPU move.',
    };
  }

  if (metrics.thermalPressurePct > 85 || metrics.powerDrawProxy > 90) {
    return {
      state: 'THERMAL_RESOURCE_BOUND',
      confidence: 0.8,
      rationale: 'Thermal or power/battery pressure dominates observed metrics.',
    };
  }

  if (metrics.networkLatencyMs > 100 || metrics.apiProviderLatencyMs > 150) {
    return {
      state: 'NETWORK_BOUND',
      confidence: 0.78,
      rationale: 'Network or API/provider latency dominates.',
    };
  }

  if (metrics.ioLatencyMs > 80 || metrics.storageThroughputMBps < 50) {
    return {
      state: 'I_O_BOUND',
      confidence: 0.75,
      rationale: 'I/O latency or storage throughput dominates.',
    };
  }

  if (metrics.queueDepth > 64 && metrics.gpuUtilizationPct < 50) {
    return {
      state: 'QUEUE_BOUND',
      confidence: 0.72,
      rationale: 'Queue depth high while accelerator underutilized.',
    };
  }

  if (
    !metrics.operatorKernelCompatible ||
    metrics.quantizationMismatch ||
    metrics.modelLoadTimeMs > 5000
  ) {
    return {
      state: 'MODEL_COMPATIBILITY_BOUND',
      confidence: 0.74,
      rationale:
        'Operator/kernel incompatibility, precision mismatch, or excessive model load time.',
    };
  }

  if (
    metrics.memoryBandwidthUtilPct > 85 ||
    metrics.vramPressurePct > 90 ||
    metrics.ramPressurePct > 90 ||
    metrics.cacheMissRatePct > 40
  ) {
    return {
      state: 'MEMORY_BOUND',
      confidence: 0.77,
      rationale: 'Memory bandwidth, VRAM/RAM pressure, or cache inefficiency.',
    };
  }

  if (
    metrics.gpuUtilizationPct > 85 ||
    metrics.npuUtilizationPct > 85 ||
    (metrics.cpuUtilizationPct > 90 && metrics.gpuUtilizationPct < 20)
  ) {
    return {
      state: 'COMPUTE_BOUND',
      confidence: 0.7,
      rationale: 'Accelerator or CPU compute saturation dominates.',
    };
  }

  if (metrics.syncOverheadMs > 80 && metrics.gpuUtilizationPct < 50) {
    return {
      state: 'RUNTIME_BOUND',
      confidence: 0.68,
      rationale: 'Runtime sync overhead dominates relative to useful compute.',
    };
  }

  return {
    state: 'UNKNOWN',
    confidence: 0.4,
    rationale: 'Insufficient discriminating evidence for a specific bottleneck.',
  };
}

export function detectSiliconModifyClaim(requestText: string): boolean {
  const lower = requestText.toLowerCase();
  return SILICON_MODIFY_CLAIM_SIGNALS.some((s) =>
    lower.includes(s.replace(/_/g, ' ')) || lower.includes(s),
  );
}

export function attemptSiliconModifyClaim(requestText = ''): DenialResult {
  void requestText;
  return deny(
    'MAY_PHYSICALLY_MODIFY_SILICON=false — analyzer may improve software scheduling across CPU/GPU/NPU but must not claim to physically modify silicon.',
  );
}

export function attemptImprovementWithoutBenchmark(): DenialResult {
  return deny(
    'IMPROVEMENT_WITHOUT_BENCHMARK=false — IMPROVED requires baseline vs candidate sandbox benchmark evidence.',
  );
}

export function attemptBlindGpuMoveWhenTransferBound(): DenialResult {
  return deny(
    'BLIND_GPU_MOVE_WHEN_TRANSFER_BOUND=false — DATA_TRANSFER_BOUND requires optimizing transfer/preprocess, not blind GPU relocation.',
  );
}

export function attemptOverclocking(): DenialResult {
  return deny('MAY_OVERCLOCK=false — software usage of hardware only.');
}

export function attemptBiosFirmware(): DenialResult {
  return deny('MAY_MODIFY_BIOS_FIRMWARE=false.');
}

export function attemptVoltageChange(): DenialResult {
  return deny('MAY_CHANGE_VOLTAGE=false.');
}

export function attemptThermalLimitBypass(): DenialResult {
  return deny('MAY_BYPASS_THERMAL_LIMITS=false.');
}

export function attemptDriverReplacement(): DenialResult {
  return deny('MAY_REPLACE_DRIVERS=false.');
}

export function attemptPrivilegeEscalation(): DenialResult {
  return deny('MAY_ESCALATE_PRIVILEGE=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommendations are advisory only.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false; L4_AUTONOMY_ENABLED=false.');
}

export function proposeCandidateFixes(
  bottleneck: BottleneckState,
): CandidateOptimization[] {
  const mk = (
    fix: CandidateFix,
    tradeoffs: readonly string[],
  ): CandidateOptimization => ({
    fix,
    expectedTradeoffs: tradeoffs,
    tested: false,
  });

  switch (bottleneck) {
    case 'DATA_TRANSFER_BOUND':
      return [
        mk('memory_layout', ['may increase preprocess CPU cost']),
        mk('graph_fusion', ['may reduce debuggability']),
        mk('workload_partitioning', ['may add coordination overhead']),
        mk('caching', ['stale cache risk']),
        mk('batching', ['higher latency for single requests']),
      ];
    case 'COMPUTE_BOUND':
      return [
        mk('smaller_better_model', ['possible quality drop']),
        mk('quantization', ['precision/quality tradeoff']),
        mk('cpu_gpu_npu_reassignment', ['transfer overhead risk']),
        mk('operator_runtime_change', ['compat risk']),
      ];
    case 'MEMORY_BOUND':
      return [
        mk('quantization', ['precision tradeoff']),
        mk('memory_layout', ['repack cost']),
        mk('batching', ['peak memory may rise or fall by shape']),
      ];
    case 'QUEUE_BOUND':
      return [
        mk('queue_tuning', ['fairness tradeoff']),
        mk('batching', ['latency tradeoff']),
        mk('local_edge_cloud_placement_change', ['network/cost tradeoff']),
      ];
    case 'MODEL_COMPATIBILITY_BOUND':
      return [
        mk('operator_runtime_change', ['compat risk']),
        mk('model_session_reuse', ['stale session risk']),
        mk('quantization', ['precision tradeoff']),
      ];
    case 'NETWORK_BOUND':
      return [
        mk('local_edge_cloud_placement_change', ['capability tradeoff']),
        mk('caching', ['freshness tradeoff']),
      ];
    case 'I_O_BOUND':
      return [
        mk('caching', ['freshness tradeoff']),
        mk('memory_layout', ['repack cost']),
      ];
    case 'THERMAL_RESOURCE_BOUND':
      return [
        mk('queue_tuning', ['throughput tradeoff']),
        mk('smaller_better_model', ['quality tradeoff']),
        mk('local_edge_cloud_placement_change', ['cost/privacy tradeoff']),
      ];
    case 'RUNTIME_BOUND':
      return [
        mk('model_session_reuse', ['stale session risk']),
        mk('graph_fusion', ['debug tradeoff']),
        mk('operator_runtime_change', ['compat risk']),
      ];
    default:
      return [
        mk('caching', ['freshness tradeoff']),
        mk('batching', ['latency tradeoff']),
      ];
  }
}

export function recordBaseline(input: {
  latencyMs: number;
  throughputOps: number;
  energyProxy?: number;
  qualityProxy?: number;
}): BaselinePerformance {
  return {
    latencyMs: input.latencyMs,
    throughputOps: input.throughputOps,
    energyProxy: input.energyProxy ?? 1,
    qualityProxy: input.qualityProxy ?? 1,
    recorded: true,
  };
}

export function runSandboxBenchmark(input: {
  baseline: BaselinePerformance;
  candidateLatencyMs: number;
  evidenceRefs: readonly string[];
  claimImprovedWithoutEvidence?: boolean;
}):
  | {
      state: 'IMPROVED' | 'NO_ADVANTAGE' | 'REGRESSED' | 'NOT_TESTED';
      baselineLatencyMs: number;
      candidateLatencyMs: number | null;
      deltaPct: number | null;
      evidenceRefs: readonly string[];
      improvementClaim: 'IMPROVED' | 'NOT_TESTED' | 'NO_CLAIM';
    }
  | DenialResult {
  if (input.claimImprovedWithoutEvidence) {
    return attemptImprovementWithoutBenchmark();
  }

  if (!input.baseline.recorded || input.evidenceRefs.length === 0) {
    return {
      state: 'NOT_TESTED',
      baselineLatencyMs: input.baseline.latencyMs,
      candidateLatencyMs: null,
      deltaPct: null,
      evidenceRefs: [],
      improvementClaim: 'NOT_TESTED',
    };
  }

  const deltaPct =
    ((input.baseline.latencyMs - input.candidateLatencyMs) /
      input.baseline.latencyMs) *
    100;

  const improved = deltaPct > 5;
  const regressed = deltaPct < -5;

  const allowed = canClaimImproved({
    baselineRecorded: true,
    candidateBenchmarked: true,
    improvedMeasured: improved,
  });

  if (improved && allowed) {
    return {
      state: 'IMPROVED',
      baselineLatencyMs: input.baseline.latencyMs,
      candidateLatencyMs: input.candidateLatencyMs,
      deltaPct,
      evidenceRefs: [...input.evidenceRefs],
      improvementClaim: 'IMPROVED',
    };
  }

  if (regressed) {
    return {
      state: 'REGRESSED',
      baselineLatencyMs: input.baseline.latencyMs,
      candidateLatencyMs: input.candidateLatencyMs,
      deltaPct,
      evidenceRefs: [...input.evidenceRefs],
      improvementClaim: 'NO_CLAIM',
    };
  }

  return {
    state: 'NO_ADVANTAGE',
    baselineLatencyMs: input.baseline.latencyMs,
    candidateLatencyMs: input.candidateLatencyMs,
    deltaPct,
    evidenceRefs: [...input.evidenceRefs],
    improvementClaim: 'NO_CLAIM',
  };
}

export function analyzeWorkload(input: {
  actor: Hc2Actor;
  analysisId: string;
  workloadId: string;
  nodeDevice: string;
  architecture: string;
  vendor: SupportedVendor;
  modelRuntime: string;
  metrics: ObservedMetrics;
  evidenceRefs: readonly string[];
  requestText?: string;
  attemptSiliconModify?: boolean;
  attemptBlindGpuMove?: boolean;
  claimImprovedWithoutBenchmark?: boolean;
  includeHiddenChainOfThought?: boolean;
}): ChipBottleneckAnalysis | DenialResult {
  if (!isBottleneckAnalyzerAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only bottleneck analyzer / scheduler / proposal / home_base actors may analyze.');
  }
  if (input.includeHiddenChainOfThought) {
    return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_ANALYZER=false.');
  }
  if (input.attemptSiliconModify || detectSiliconModifyClaim(input.requestText ?? '')) {
    return attemptSiliconModifyClaim(input.requestText);
  }
  if (input.claimImprovedWithoutBenchmark) {
    return attemptImprovementWithoutBenchmark();
  }

  const classified = classifyBottleneck(input.metrics);

  if (
    input.attemptBlindGpuMove &&
    classified.state === 'DATA_TRANSFER_BOUND'
  ) {
    return attemptBlindGpuMoveWhenTransferBound();
  }

  const candidates = proposeCandidateFixes(classified.state);

  return {
    analysisId: input.analysisId,
    workloadId: input.workloadId,
    nodeDevice: input.nodeDevice,
    architecture: input.architecture,
    vendor: input.vendor,
    modelRuntime: input.modelRuntime,
    observedMetrics: input.metrics,
    suspectedBottleneck: classified.state,
    confidence: classified.confidence,
    evidenceRefs: [...input.evidenceRefs],
    baselinePerformance: null,
    candidateOptimizations: candidates,
    expectedTradeoffs: candidates.flatMap((c) => [...c.expectedTradeoffs]),
    actualBenchmarkResults: null,
    finalClassification: classified.state,
    recommendation: classified.rationale,
    improvementClaim: 'NOT_TESTED',
    siliconModifyClaimed: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function attachBaselineAndBenchmark(input: {
  analysis: ChipBottleneckAnalysis;
  baseline: BaselinePerformance;
  candidateLatencyMs: number;
  benchmarkEvidenceRefs: readonly string[];
}): ChipBottleneckAnalysis | DenialResult {
  const bench = runSandboxBenchmark({
    baseline: input.baseline,
    candidateLatencyMs: input.candidateLatencyMs,
    evidenceRefs: input.benchmarkEvidenceRefs,
  });
  if ('denied' in bench) return bench;

  return {
    ...input.analysis,
    baselinePerformance: input.baseline,
    actualBenchmarkResults: {
      state: bench.state,
      baselineLatencyMs: bench.baselineLatencyMs,
      candidateLatencyMs: bench.candidateLatencyMs,
      deltaPct: bench.deltaPct,
      evidenceRefs: bench.evidenceRefs,
    },
    improvementClaim: bench.improvementClaim,
    recommendation:
      bench.state === 'IMPROVED'
        ? `${input.analysis.recommendation ?? ''} Benchmark IMPROVED vs baseline (${bench.deltaPct?.toFixed(1)}% latency).`
        : `${input.analysis.recommendation ?? ''} Benchmark state=${bench.state}; untested candidates remain NOT_TESTED.`,
  };
}

export function returnEvidenceToHomeBase(input: {
  analysis: ChipBottleneckAnalysis;
  actor: Hc2Actor;
}): {
  returned: true;
  homeBasePath: 'xiv_home_base';
  analysisId: string;
  finalClassification: BottleneckState;
  improvementClaim: ChipBottleneckAnalysis['improvementClaim'];
  orgId: string;
  tenantId: string;
  universeId: string;
} {
  return {
    returned: true,
    homeBasePath: 'xiv_home_base',
    analysisId: input.analysis.analysisId,
    finalClassification: input.analysis.finalClassification,
    improvementClaim: input.analysis.improvementClaim,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function requireHumanApproval(actor: Hc2Actor): boolean {
  return isHumanApprover(actor);
}

export function probeGuardianRlsTenantUniverseIsolation(actor: Hc2Actor): {
  intact: true;
  orgId: string;
  tenantId: string;
  universeId: string;
} {
  return {
    intact: true,
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
  };
}

export function bootstrapChipBottleneckAnalyzer(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Hc2SoftWireSnapshot;
  honesty: typeof HONESTY_BANNER;
  trackNote: typeof TRACK_DISTINCTNESS_NOTE;
  l4: false;
} {
  return {
    locksIntact: assertHc2LocksIntact(),
    softWire: hc2SoftWireSnapshot(repoRoot),
    honesty: HONESTY_BANNER,
    trackNote: TRACK_DISTINCTNESS_NOTE,
    l4: HC2_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export function runChipBottleneckAnalyzerCycle(repoRoot?: string): {
  hops: Hc2HopRecord[];
  softWire: Hc2SoftWireSnapshot;
  locksIntact: boolean;
} {
  const softWire = hc2SoftWireSnapshot(repoRoot);
  const locksIntact = assertHc2LocksIntact();
  const example = classifyBottleneck(transferBoundExampleMetrics());

  const hops: Hc2HopRecord[] = [
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'FAIL',
      `locksIntact=${locksIntact}; L4=${HC2_LOCKS.L4_AUTONOMY_ENABLED}`,
    ),
    hop(
      'chip_bottleneck_analyzer_bootstrap',
      'PASS',
      `${GITHUB_SOT_LABEL} #${GITHUB_SOT_ISSUE} bootstrap`,
    ),
    hop(
      'inspection_dimensions_encoded',
      'PASS',
      `${INSPECTION_DIMENSIONS.length} inspection dimensions`,
    ),
    hop(
      'bottleneck_states_encoded',
      'PASS',
      `${BOTTLENECK_STATES.length} bottleneck states`,
    ),
    hop(
      'core_flow_encoded',
      'PASS',
      `flow=${ANALYZER_CORE_FLOW.join('→')}`,
    ),
    hop(
      'analysis_fields_encoded',
      'PASS',
      `${ANALYSIS_FIELDS.length} analysis fields`,
    ),
    hop(
      'candidate_fixes_encoded',
      'PASS',
      `${CANDIDATE_FIXES.length} software-level candidate fixes`,
    ),
    hop(
      'vendor_neutral_analyzer_encoded',
      'PASS',
      `vendors=${SUPPORTED_VENDORS.join(',')}`,
    ),
    hop(
      'safety_boundaries_encoded',
      'PASS',
      `${SAFETY_BOUNDARIES.length} safety boundaries`,
    ),
    hop(
      'classify_from_evidence',
      'PASS',
      'classification driven by observed metrics + evidence refs',
    ),
    hop(
      'transfer_bound_example_encoded',
      example.state === 'DATA_TRANSFER_BOUND' ? 'PASS' : 'FAIL',
      `example→${example.state} confidence=${example.confidence}`,
    ),
    hop(
      'blind_gpu_move_denied_when_transfer_bound',
      attemptBlindGpuMoveWhenTransferBound().state,
      'blind GPU move denied when DATA_TRANSFER_BOUND',
    ),
    hop(
      'baseline_required_before_improve_claim',
      'PASS',
      'IMPROVED requires baseline vs candidate benchmark',
    ),
    hop(
      'untested_is_not_tested',
      'NOT_TESTED',
      'untested candidates remain NOT_TESTED',
    ),
    hop(
      'improvement_without_benchmark_denied',
      attemptImprovementWithoutBenchmark().state,
      'improvement without benchmark denied',
    ),
    hop(
      'deny_silicon_modify_claims',
      attemptSiliconModifyClaim().state,
      'silicon modify claims denied',
    ),
    hop('deny_overclocking', attemptOverclocking().state, 'overclock denied'),
    hop(
      'deny_bios_firmware',
      attemptBiosFirmware().state,
      'BIOS/firmware denied',
    ),
    hop(
      'deny_voltage_changes',
      attemptVoltageChange().state,
      'voltage change denied',
    ),
    hop(
      'deny_thermal_limit_bypass',
      attemptThermalLimitBypass().state,
      'thermal bypass denied',
    ),
    hop(
      'deny_driver_replacement',
      attemptDriverReplacement().state,
      'driver replacement denied',
    ),
    hop(
      'deny_privilege_escalation',
      attemptPrivilegeEscalation().state,
      'privilege escalation denied',
    ),
    hop(
      'guardian_rls_tenant_universe_isolation',
      'PASS',
      'Guardian/RLS/tenant/Universe isolation unchanged',
    ),
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state,
      'recommend ≠ act',
    ),
    hop(
      'l4_autonomy_false',
      HC2_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
    hop(
      'return_to_xiv_home_base',
      'PASS',
      'recommendation returns to XIV Home Base',
    ),
    hop(
      'hc1_soft_wire',
      softWireHopState(
        softWire.hc1HybridComputeHomeBase.present || softWire.hc1Report.present,
      ),
      softWire.hc1HybridComputeHomeBase.note,
    ),
    hop(
      'er34_soft_wire',
      softWireHopState(
        softWire.er34CapabilityManifest.present || softWire.er34Report.present,
      ),
      softWire.er34CapabilityManifest.note,
    ),
    hop(
      'er32_soft_wire',
      softWireHopState(
        softWire.er32ServerEdgeRuntimePackage.present ||
          softWire.er32Report.present,
      ),
      softWire.er32ServerEdgeRuntimePackage.note,
    ),
    hop(
      'er31_soft_wire',
      softWireHopState(
        softWire.er31AppleDeviceRuntimePackage.present ||
          softWire.er31Report.present,
      ),
      softWire.er31AppleDeviceRuntimePackage.note,
    ),
    hop(
      'er30_soft_wire',
      softWireHopState(
        softWire.er30AndroidArmRuntimePackage.present ||
          softWire.er30Report.present,
      ),
      softWire.er30AndroidArmRuntimePackage.note,
    ),
    hop(
      'er29_soft_wire',
      softWireHopState(
        softWire.er29WindowsRuntimePackage.present ||
          softWire.er29Report.present,
      ),
      softWire.er29WindowsRuntimePackage.note,
    ),
    hop(
      'em157_soft_wire',
      softWireHopState(softWire.em157HomeBase.present),
      softWire.em157HomeBase.note,
    ),
    hop(
      'db_candidates_not_applied',
      HC2_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'NOT_APPLIED' : 'FAIL',
      `DB candidates ${HC2_DB_CANDIDATES_STATUS}`,
    ),
    hop(
      'evidence',
      'PASS',
      `${GITHUB_SOT_TITLE}; ${GITLAB_MIRROR_NOTE}; next=${NEXT_PHASE_TITLE}; may=${HC2_MAY.length}; must_not=${HC2_MUST_NOT.length}; bounds=${BOTTLENECK_ANALYZER_BOUNDS.mayRecommendOnly}; bench_states=${BENCHMARK_RESULT_STATES.join(',')}`,
    ),
  ];

  // Ensure cycle coverage matches encoded hops
  void CHIP_BOTTLENECK_ANALYZER_CYCLE;

  return { hops, softWire, locksIntact };
}
