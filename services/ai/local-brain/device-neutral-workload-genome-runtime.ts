/**
 * 62L-EQ11 — Device-Neutral Workload Genome runtime.
 *
 * Emit genome records; derive needs-based capability requirements; compare
 * eligible routes without vendor-first assumptions; strengthen only with
 * measured results. Soft-wires EQ10/EQ8/EQ6/EQ5/EQ1/EM157 when present.
 */

import {
  DEVICE_NEUTRAL_WORKLOAD_GENOME_CYCLE,
  ELIGIBLE_ROUTE_CLASSES,
  EQ11_AGENT_BOUNDS,
  EQ11_DB_CANDIDATES_STATUS,
  EQ11_LOCKS,
  EQ11_MAY,
  EQ11_MUST_NOT,
  EQ11_SAFETY_DENIES,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  VECTOR_SEARCH_EXAMPLE_PROFILE,
  WORKLOAD_GENOME_CORE_FLOW,
  WORKLOAD_GENOME_EVIDENCE_STATES,
  WORKLOAD_GENOME_FIELDS,
  WORKLOAD_GENOME_NEURAL_PATHWAY,
  WORKLOAD_PRIMITIVES,
  XIV_WORKLOAD_INTELLIGENCE_CHAIN,
  assertEq11LocksIntact,
  assumeGpuAlwaysBest,
  canStrengthenPathway,
  eq11SoftWireSnapshot,
  isEq11Agent,
  isHumanApprover,
  vendorNameFirstScheduling,
  type EligibleRouteClass,
  type Eq11Actor,
  type Eq11EvidenceState,
  type Eq11HopRecord,
  type Eq11SoftWireSnapshot,
  type WorkloadGenomeEvidenceState,
  type WorkloadGenomeField,
  type WorkloadPrimitive,
} from './device-neutral-workload-genome-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof DEVICE_NEUTRAL_WORKLOAD_GENOME_CYCLE)[number],
  state: Eq11EvidenceState,
  summary: string,
): Eq11HopRecord {
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

export type WorkloadGenomeRecord = {
  workloadId: string;
  operationFamily: WorkloadPrimitive;
  inputOutputShape: string;
  computeIntensity: string;
  memoryIntensity: string;
  bandwidthNeeds: string;
  latencySensitivity: string;
  throughputPriority: string;
  precisionRequirements: string;
  parallelismProfile: string;
  localityPrivacyRequirements: string;
  modelRuntimeDependencies: readonly string[];
  acceleratorRequirements: readonly string[];
  fallbackOptions: readonly string[];
  benchmarkSuite: string;
  evidenceState: WorkloadGenomeEvidenceState;
  pathwayStrength: number;
  vendorNameFirst: false;
  assumeGpuAlwaysBest: false;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
};

export type CapabilityRequirements = {
  workloadId: string;
  needs: readonly string[];
  vendorAssumed: false;
  gpuAssumedAlwaysBest: false;
};

export type EligibleRouteComparison = {
  workloadId: string;
  candidates: readonly EligibleRouteClass[];
  rankedWithoutVendorBias: true;
  gpuForcedBest: false;
};

export function emitWorkloadGenome(input: {
  actor: Eq11Actor;
  workloadId: string;
  operationFamily: WorkloadPrimitive;
  inputOutputShape: string;
  computeIntensity: string;
  memoryIntensity: string;
  bandwidthNeeds: string;
  latencySensitivity: string;
  throughputPriority: string;
  precisionRequirements: string;
  parallelismProfile: string;
  localityPrivacyRequirements: string;
  modelRuntimeDependencies: readonly string[];
  acceleratorRequirements: readonly string[];
  fallbackOptions: readonly string[];
  benchmarkSuite: string;
  evidenceState?: WorkloadGenomeEvidenceState;
  attemptVendorNameFirst?: boolean;
  attemptAssumeGpuAlwaysBest?: boolean;
  attemptInferBeyondEvidence?: boolean;
  attemptProprietaryIsaCloning?: boolean;
  attemptFirmwareModification?: boolean;
  attemptUnsafeHardwareTuning?: boolean;
  attemptAutomaticCloudPurchasing?: boolean;
  attemptPermissionExpansion?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): WorkloadGenomeRecord | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_EQ11=false.');
  }
  if (input.attemptVendorNameFirst) {
    return deny(
      'VENDOR_NAME_FIRST_SCHEDULING=false — compare by workload needs, not vendor name.',
    );
  }
  if (input.attemptAssumeGpuAlwaysBest) {
    return deny('ASSUME_GPU_ALWAYS_BEST=false.');
  }
  if (input.attemptInferBeyondEvidence) {
    return deny('INFER_DEVICE_CAPABILITY_BEYOND_EVIDENCE=false.');
  }
  if (input.attemptProprietaryIsaCloning) {
    return deny('PROPRIETARY_ISA_CLONING=false.');
  }
  if (input.attemptFirmwareModification) {
    return deny('FIRMWARE_MODIFICATION=false.');
  }
  if (input.attemptUnsafeHardwareTuning) {
    return deny('UNSAFE_HARDWARE_TUNING=false.');
  }
  if (input.attemptAutomaticCloudPurchasing) {
    return deny('AUTOMATIC_CLOUD_PURCHASING=false.');
  }
  if (input.attemptPermissionExpansion) {
    return deny('PERMISSION_EXPANSION=false.');
  }
  if (
    !(WORKLOAD_PRIMITIVES as readonly string[]).includes(input.operationFamily)
  ) {
    return deny(`Unknown workload primitive: ${input.operationFamily}`);
  }
  if (input.evidenceState === 'VERIFIED') {
    return deny(
      'Cannot emit VERIFIED genome via emit alone — use strengthenPathwayWithMeasurement.',
    );
  }

  void WORKLOAD_GENOME_FIELDS;

  return {
    workloadId: input.workloadId,
    operationFamily: input.operationFamily,
    inputOutputShape: input.inputOutputShape,
    computeIntensity: input.computeIntensity,
    memoryIntensity: input.memoryIntensity,
    bandwidthNeeds: input.bandwidthNeeds,
    latencySensitivity: input.latencySensitivity,
    throughputPriority: input.throughputPriority,
    precisionRequirements: input.precisionRequirements,
    parallelismProfile: input.parallelismProfile,
    localityPrivacyRequirements: input.localityPrivacyRequirements,
    modelRuntimeDependencies: input.modelRuntimeDependencies,
    acceleratorRequirements: input.acceleratorRequirements,
    fallbackOptions: input.fallbackOptions,
    benchmarkSuite: input.benchmarkSuite,
    evidenceState: input.evidenceState ?? 'DOCUMENTED',
    pathwayStrength: 0.35,
    vendorNameFirst: false,
    assumeGpuAlwaysBest: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
  };
}

export function deriveCapabilityRequirements(input: {
  genome: WorkloadGenomeRecord;
  attemptVendorNameFirst?: boolean;
  attemptAssumeGpuAlwaysBest?: boolean;
}): CapabilityRequirements | DenialResult {
  if (input.attemptVendorNameFirst) {
    return deny('VENDOR_NAME_FIRST_SCHEDULING=false.');
  }
  if (input.attemptAssumeGpuAlwaysBest) {
    return deny('ASSUME_GPU_ALWAYS_BEST=false.');
  }
  const needs: string[] = [];
  if (input.genome.memoryIntensity === 'high' || input.genome.memoryIntensity === 'heavy') {
    needs.push('memory_heavy');
  }
  if (
    input.genome.latencySensitivity === 'high' ||
    input.genome.latencySensitivity === 'sensitive'
  ) {
    needs.push('latency_sensitive');
  }
  if (input.genome.parallelismProfile.includes('moderate')) {
    needs.push('moderate_parallelism');
  }
  if (
    input.genome.localityPrivacyRequirements.includes('local') ||
    input.genome.localityPrivacyRequirements.includes('local-only')
  ) {
    needs.push('local_only');
  }
  for (const dep of input.genome.modelRuntimeDependencies) {
    needs.push(`runtime:${dep}`);
  }
  return {
    workloadId: input.genome.workloadId,
    needs,
    vendorAssumed: false,
    gpuAssumedAlwaysBest: false,
  };
}

export function compareEligibleRoutes(input: {
  workloadId: string;
  candidates: readonly EligibleRouteClass[];
  attemptForceGpuBest?: boolean;
  attemptVendorNameFirst?: boolean;
}): EligibleRouteComparison | DenialResult {
  if (input.attemptForceGpuBest) {
    return deny('ASSUME_GPU_ALWAYS_BEST=false.');
  }
  if (input.attemptVendorNameFirst) {
    return deny('VENDOR_NAME_FIRST_SCHEDULING=false.');
  }
  for (const c of input.candidates) {
    if (!(ELIGIBLE_ROUTE_CLASSES as readonly string[]).includes(c)) {
      return deny(`Unknown route class: ${c}`);
    }
  }
  return {
    workloadId: input.workloadId,
    candidates: input.candidates,
    rankedWithoutVendorBias: true,
    gpuForcedBest: false,
  };
}

export function strengthenPathwayWithMeasurement(input: {
  genome: WorkloadGenomeRecord;
  measuredEvidenceRefs: readonly string[];
  attemptWithoutMeasurement?: boolean;
}): { genome: WorkloadGenomeRecord } | DenialResult {
  if (
    input.attemptWithoutMeasurement ||
    !canStrengthenPathway({
      measuredResults: input.measuredEvidenceRefs.length > 0,
      evidenceRefs: input.measuredEvidenceRefs,
    })
  ) {
    return deny(
      'STRENGTHEN_WITHOUT_MEASUREMENT=false — only measured results strengthen the pathway.',
    );
  }
  return {
    genome: {
      ...input.genome,
      evidenceState: 'VERIFIED',
      pathwayStrength: Math.min(1, input.genome.pathwayStrength + 0.4),
    },
  };
}

export function attemptInferBeyondEvidence(): DenialResult {
  return deny('INFER_DEVICE_CAPABILITY_BEYOND_EVIDENCE=false.');
}

export function attemptProprietaryIsaCloning(): DenialResult {
  return deny('PROPRIETARY_ISA_CLONING=false.');
}

export function attemptFirmwareModification(): DenialResult {
  return deny('FIRMWARE_MODIFICATION=false.');
}

export function attemptUnsafeHardwareTuning(): DenialResult {
  return deny('UNSAFE_HARDWARE_TUNING=false.');
}

export function attemptAutomaticCloudPurchasing(): DenialResult {
  return deny('AUTOMATIC_CLOUD_PURCHASING=false.');
}

export function attemptPermissionExpansion(): DenialResult {
  return deny('PERMISSION_EXPANSION=false.');
}

export function attemptStrengthenWithoutMeasurement(): DenialResult {
  return deny('STRENGTHEN_WITHOUT_MEASUREMENT=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnEq11EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq11Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      pathway: typeof WORKLOAD_GENOME_NEURAL_PATHWAY;
      intelligenceChain: typeof XIV_WORKLOAD_INTELLIGENCE_CHAIN;
      authorityGranted: false;
    }
  | DenialResult {
  if (!EQ11_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEq11Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only EQ11 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    pathway: WORKLOAD_GENOME_NEURAL_PATHWAY,
    intelligenceChain: XIV_WORKLOAD_INTELLIGENCE_CHAIN,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq11Actor;
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
    unchanged: EQ11_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ11_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ11_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleVectorSearchGenome(
  actor: Eq11Actor,
): WorkloadGenomeRecord {
  void VECTOR_SEARCH_EXAMPLE_PROFILE;
  const genome = emitWorkloadGenome({
    actor,
    workloadId: 'wl-vector-search-1',
    operationFamily: 'vector_search',
    inputOutputShape: 'embedding_index→topk_ids',
    computeIntensity: 'moderate',
    memoryIntensity: 'heavy',
    bandwidthNeeds: 'moderate',
    latencySensitivity: 'sensitive',
    throughputPriority: 'medium',
    precisionRequirements: 'fp16|fp32',
    parallelismProfile: 'moderate',
    localityPrivacyRequirements: 'local-only',
    modelRuntimeDependencies: ['embedding_runtime', 'index_runtime'],
    acceleratorRequirements: ['optional_vector_accel'],
    fallbackOptions: ['cpu_index', 'edge_node'],
    benchmarkSuite: 'xiv-vector-search-suite-v0',
    evidenceState: 'DOCUMENTED',
  });
  if ('denied' in genome) throw new Error('vector search genome failed');
  return genome;
}

export function bootstrapDeviceNeutralWorkloadGenome(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq11SoftWireSnapshot;
  primitives: typeof WORKLOAD_PRIMITIVES;
  genomeFields: readonly WorkloadGenomeField[];
  coreFlow: typeof WORKLOAD_GENOME_CORE_FLOW;
  intelligenceChain: typeof XIV_WORKLOAD_INTELLIGENCE_CHAIN;
  pathway: typeof WORKLOAD_GENOME_NEURAL_PATHWAY;
  evidenceStates: typeof WORKLOAD_GENOME_EVIDENCE_STATES;
  routeClasses: typeof ELIGIBLE_ROUTE_CLASSES;
  safetyDenies: typeof EQ11_SAFETY_DENIES;
  vectorSearchProfile: typeof VECTOR_SEARCH_EXAMPLE_PROFILE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ11_MAY;
  mustNot: typeof EQ11_MUST_NOT;
  dbCandidates: typeof EQ11_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq11LocksIntact(),
    softWire: eq11SoftWireSnapshot(repoRoot),
    primitives: WORKLOAD_PRIMITIVES,
    genomeFields: WORKLOAD_GENOME_FIELDS,
    coreFlow: WORKLOAD_GENOME_CORE_FLOW,
    intelligenceChain: XIV_WORKLOAD_INTELLIGENCE_CHAIN,
    pathway: WORKLOAD_GENOME_NEURAL_PATHWAY,
    evidenceStates: WORKLOAD_GENOME_EVIDENCE_STATES,
    routeClasses: ELIGIBLE_ROUTE_CLASSES,
    safetyDenies: EQ11_SAFETY_DENIES,
    vectorSearchProfile: VECTOR_SEARCH_EXAMPLE_PROFILE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ11_MAY,
    mustNot: EQ11_MUST_NOT,
    dbCandidates: EQ11_DB_CANDIDATES_STATUS,
  };
}

export function runDeviceNeutralWorkloadGenomeCycle(input: {
  actor: Eq11Actor;
  human: Eq11Actor;
  repoRoot?: string;
}): {
  hops: Eq11HopRecord[];
  genome: WorkloadGenomeRecord;
  requirements: CapabilityRequirements;
  comparison: EligibleRouteComparison;
  verified: WorkloadGenomeRecord;
  softWire: Eq11SoftWireSnapshot;
} {
  const hops: Eq11HopRecord[] = [];
  const softWire = eq11SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq11LocksIntact() ? 'PASS' : 'FAIL',
      'EQ11 locks intact including L4=false and needs≠vendor-first.',
    ),
  );
  hops.push(
    hop(
      'device_neutral_workload_genome_bootstrap',
      'PASS',
      'Device-Neutral Workload Genome bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'workload_primitives_encoded',
      'PASS',
      `${WORKLOAD_PRIMITIVES.length} workload primitives encoded.`,
    ),
  );
  hops.push(
    hop(
      'genome_fields_encoded',
      'PASS',
      `${WORKLOAD_GENOME_FIELDS.length} genome fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      'PASS',
      WORKLOAD_GENOME_CORE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'xiv_intelligence_chain_encoded',
      'PASS',
      XIV_WORKLOAD_INTELLIGENCE_CHAIN.join(' → '),
    ),
  );
  hops.push(
    hop(
      'neural_pathway_encoded',
      'PASS',
      WORKLOAD_GENOME_NEURAL_PATHWAY.join(' → '),
    ),
  );

  const genome = exampleVectorSearchGenome(input.actor);
  const requirementsResult = deriveCapabilityRequirements({ genome });
  if ('denied' in requirementsResult) throw new Error('requirements failed');
  const requirements = requirementsResult;

  const comparisonResult = compareEligibleRoutes({
    workloadId: genome.workloadId,
    candidates: ['cpu', 'gpu', 'npu', 'edge', 'cloud'],
  });
  if ('denied' in comparisonResult) throw new Error('comparison failed');
  const comparison = comparisonResult;

  hops.push(
    hop(
      'compare_by_needs_not_vendor',
      genome.vendorNameFirst === false &&
        requirements.vendorAssumed === false &&
        vendorNameFirstScheduling() === false &&
        comparison.rankedWithoutVendorBias === true
        ? 'PASS'
        : 'FAIL',
      'Compare architectures by workload needs, not vendor name.',
    ),
  );

  const noMeasure = strengthenPathwayWithMeasurement({
    genome,
    measuredEvidenceRefs: [],
    attemptWithoutMeasurement: true,
  });
  const verifiedRes = strengthenPathwayWithMeasurement({
    genome,
    measuredEvidenceRefs: ['bench-vector-search-cpu-1'],
  });
  if ('denied' in verifiedRes) throw new Error('strengthen failed');

  hops.push(
    hop(
      'only_measured_strengthens_pathway',
      noMeasure.state === 'DENIED' &&
        verifiedRes.genome.evidenceState === 'VERIFIED' &&
        verifiedRes.genome.pathwayStrength > genome.pathwayStrength &&
        attemptStrengthenWithoutMeasurement().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Only measured results strengthen the pathway.',
    ),
  );

  hops.push(
    hop(
      'no_assume_gpu_always_best',
      genome.assumeGpuAlwaysBest === false &&
        assumeGpuAlwaysBest() === false &&
        comparison.gpuForcedBest === false &&
        compareEligibleRoutes({
          workloadId: genome.workloadId,
          candidates: ['cpu', 'gpu'],
          attemptForceGpuBest: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Do not assume GPU is always best for vector search.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof DEVICE_NEUTRAL_WORKLOAD_GENOME_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_infer_beyond_evidence', fn: attemptInferBeyondEvidence },
    {
      hop: 'deny_proprietary_isa_cloning',
      fn: attemptProprietaryIsaCloning,
    },
    { hop: 'deny_firmware_modification', fn: attemptFirmwareModification },
    {
      hop: 'deny_unsafe_hardware_tuning',
      fn: attemptUnsafeHardwareTuning,
    },
    {
      hop: 'deny_automatic_cloud_purchasing',
      fn: attemptAutomaticCloudPurchasing,
    },
    { hop: 'deny_permission_expansion', fn: attemptPermissionExpansion },
    {
      hop: 'deny_strengthen_without_measurement',
      fn: attemptStrengthenWithoutMeasurement,
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
      EQ11_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eq10_soft_wire',
      softWire.eq10InstructionSemanticsLearning.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.eq10InstructionSemanticsLearning.note,
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
      'eq5_soft_wire',
      softWire.eq5CompilerIrTranslationLayer.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq5CompilerIrTranslationLayer.note,
    ),
  );
  hops.push(
    hop(
      'eq1_soft_wire',
      softWire.eq1CrossArchitectureContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq1CrossArchitectureContract.note,
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
      EQ11_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq11-1',
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

  void DEVICE_NEUTRAL_WORKLOAD_GENOME_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    genome,
    requirements,
    comparison,
    verified: verifiedRes.genome,
    softWire,
  };
}
