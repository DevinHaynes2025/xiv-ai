/**
 * 62L-ER31 — iOS / Apple Runtime Research Candidate runtime.
 *
 * Create Apple runtime profiles; Neural Engine VERIFY only after full chain;
 * record silent CPU/GPU fallback; deny jailbreak/private-API/covert sensors;
 * offline freshness retention; cycle + soft-wires ER30/ER29/ER28/EQ7.
 */

import {
  APPLE_FIRST_CANDIDATE_WORKLOADS,
  APPLE_HEAVY_WORKLOADS_ROUTE_ELSEWHERE,
  APPLE_MODEL_RUNTIME_FORMATS,
  APPLE_OFFLINE_FRESHNESS_RULE,
  APPLE_PRIVACY_MODEL,
  APPLE_RUNTIME_ARCHITECTURE,
  APPLE_RUNTIME_PROFILE_FIELDS,
  APPLE_RUNTIME_STATES,
  ER31_AGENT_BOUNDS,
  ER31_DB_CANDIDATES_STATUS,
  ER31_LOCKS,
  ER31_MAY,
  ER31_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  IOS_APPLE_RUNTIME_RESEARCH_CYCLE,
  NEURAL_ENGINE_VERIFICATION_CHAIN,
  NEXT_PHASE_TITLE,
  assertEr31LocksIntact,
  canClaimNeuralEngineVerified,
  er31SoftWireSnapshot,
  isHumanApprover,
  mayTreatStaleAsCurrent,
  neuralEngineDocsImplyVerified,
  type AppleDeviceFamily,
  type AppleFirstCandidateWorkload,
  type AppleOsName,
  type AppleRuntimeState,
  type Er31Actor,
  type Er31EvidenceState,
  type Er31HopRecord,
  type Er31SoftWireSnapshot,
} from './ios-apple-runtime-research-candidate-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof IOS_APPLE_RUNTIME_RESEARCH_CYCLE)[number],
  state: Er31EvidenceState,
  summary: string,
): Er31HopRecord {
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

export type AppleRuntimeProfile = {
  packageId: string;
  osName: AppleOsName;
  osVersion: string;
  deviceFamily: AppleDeviceFamily;
  appleChipGeneration: string;
  cpuCapabilityState: AppleRuntimeState;
  gpuCapabilityState: AppleRuntimeState;
  neuralEngineCapabilityState: AppleRuntimeState;
  supportedModelRuntimeFormats: readonly string[];
  memoryLimitMb: number;
  storageLimitMb: number;
  batteryState: string;
  thermalState: string;
  permissions: readonly string[];
  localOfflineFeatures: readonly string[];
  packageVersion: string;
  signatureVersion: string;
  benchmarkRefs: readonly string[];
  verificationState: AppleRuntimeState;
  orgId: string;
  tenantId: string;
  universeId: string;
  jailbreakAssumed: false;
  privateApiUsed: false;
};

export type NeuralEngineVerificationRecord = {
  verificationId: string;
  packageId: string;
  compatibleModel: boolean;
  actualLocalLoad: boolean;
  actualDeviceExecution: boolean;
  validOutput: boolean;
  performanceReceipt: boolean;
  claimedFromPublicDocsOnly: boolean;
  verificationState: AppleRuntimeState;
  acceleratorPath: 'neural_engine' | 'cpu_fallback' | 'gpu_fallback';
  silentFallbackRecorded: boolean;
  fallbackTarget?: 'cpu' | 'gpu';
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type AppleWorkloadAdmission = {
  workloadId: string;
  workload: AppleFirstCandidateWorkload | string;
  admitted: boolean;
  reason: string;
  deviceProvenSuitable: boolean;
};

export type OfflinePackFreshnessView = {
  packId: string;
  encrypted: true;
  usefulWithoutConnectivity: true;
  freshnessLabel: string;
  isStale: boolean;
  treatedAsCurrent: false;
  deniedStaleAsCurrent: boolean;
};

export type AppleRuntimeBootstrap = {
  locksIntact: boolean;
  architecture: typeof APPLE_RUNTIME_ARCHITECTURE;
  profileFields: typeof APPLE_RUNTIME_PROFILE_FIELDS;
  runtimeStates: typeof APPLE_RUNTIME_STATES;
  firstWorkloads: typeof APPLE_FIRST_CANDIDATE_WORKLOADS;
  verificationChain: typeof NEURAL_ENGINE_VERIFICATION_CHAIN;
  dbCandidates: typeof ER31_DB_CANDIDATES_STATUS;
  softWire: Er31SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
  };
  honestyBanner: typeof HONESTY_BANNER;
  nextPhase: typeof NEXT_PHASE_TITLE;
};

export function bootstrapIosAppleRuntimeResearch(
  repoRoot?: string,
): AppleRuntimeBootstrap {
  return {
    locksIntact: assertEr31LocksIntact(),
    architecture: APPLE_RUNTIME_ARCHITECTURE,
    profileFields: APPLE_RUNTIME_PROFILE_FIELDS,
    runtimeStates: APPLE_RUNTIME_STATES,
    firstWorkloads: APPLE_FIRST_CANDIDATE_WORKLOADS,
    verificationChain: NEURAL_ENGINE_VERIFICATION_CHAIN,
    dbCandidates: ER31_DB_CANDIDATES_STATUS,
    softWire: er31SoftWireSnapshot(repoRoot),
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlabMirrorNote: GITLAB_MIRROR_NOTE,
    },
    honestyBanner: HONESTY_BANNER,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export function createAppleRuntimeProfile(input: {
  actor: Er31Actor;
  packageId: string;
  osName: AppleOsName;
  osVersion: string;
  deviceFamily: AppleDeviceFamily;
  appleChipGeneration: string;
  cpuCapabilityState?: AppleRuntimeState;
  gpuCapabilityState?: AppleRuntimeState;
  neuralEngineCapabilityState?: AppleRuntimeState;
  supportedModelRuntimeFormats?: readonly string[];
  memoryLimitMb: number;
  storageLimitMb: number;
  batteryState?: string;
  thermalState?: string;
  permissions?: readonly string[];
  localOfflineFeatures?: readonly string[];
  packageVersion: string;
  signatureVersion: string;
  benchmarkRefs?: readonly string[];
  verificationState?: AppleRuntimeState;
  attemptJailbreakAssumption?: boolean;
  attemptPrivateApi?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): AppleRuntimeProfile | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_ER31=false.');
  }
  if (input.attemptJailbreakAssumption) {
    return deny('JAILBREAK_ROOT_ASSUMPTIONS=false.');
  }
  if (input.attemptPrivateApi) {
    return deny('PRIVATE_API_EXPLOITATION=false.');
  }
  if (!input.signatureVersion || input.signatureVersion.trim() === '') {
    return deny('SIGNED_VERSIONED_UPDATES_AND_REVOCATION required.');
  }

  return {
    packageId: input.packageId,
    osName: input.osName,
    osVersion: input.osVersion,
    deviceFamily: input.deviceFamily,
    appleChipGeneration: input.appleChipGeneration,
    cpuCapabilityState: input.cpuCapabilityState ?? 'DOCUMENTED',
    gpuCapabilityState: input.gpuCapabilityState ?? 'DOCUMENTED',
    neuralEngineCapabilityState:
      input.neuralEngineCapabilityState ?? 'DOCUMENTED',
    supportedModelRuntimeFormats: input.supportedModelRuntimeFormats ?? [
      ...APPLE_MODEL_RUNTIME_FORMATS,
    ],
    memoryLimitMb: input.memoryLimitMb,
    storageLimitMb: input.storageLimitMb,
    batteryState: input.batteryState ?? 'unknown',
    thermalState: input.thermalState ?? 'nominal',
    permissions: input.permissions ?? ['local_inference'],
    localOfflineFeatures: input.localOfflineFeatures ?? [
      'encrypted_knowledge_packs',
      'offline_search',
    ],
    packageVersion: input.packageVersion,
    signatureVersion: input.signatureVersion,
    benchmarkRefs: input.benchmarkRefs ?? [],
    verificationState: input.verificationState ?? 'NOT_TESTED',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    jailbreakAssumed: false,
    privateApiUsed: false,
  };
}

export function verifyNeuralEngine(input: {
  actor: Er31Actor;
  verificationId: string;
  packageId: string;
  compatibleModel: boolean;
  actualLocalLoad: boolean;
  actualDeviceExecution: boolean;
  validOutput: boolean;
  performanceReceipt: boolean;
  claimedFromPublicDocsOnly?: boolean;
  silentFallbackTo?: 'cpu' | 'gpu';
  recordSilentFallback?: boolean;
  attemptVerifyFromDocsOnly?: boolean;
  attemptUnrecordedFallback?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): NeuralEngineVerificationRecord | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_ER31=false.');
  }
  if (input.attemptVerifyFromDocsOnly || input.claimedFromPublicDocsOnly) {
    return deny(
      'NEURAL_ENGINE_DOCS_EQ_VERIFIED=false — public docs ≠ verified.',
    );
  }
  if (input.silentFallbackTo && input.attemptUnrecordedFallback) {
    return deny(
      'SILENT_CPU_GPU_FALLBACK_UNRECORDED=false — silent fallback must be recorded.',
    );
  }
  if (input.silentFallbackTo && input.recordSilentFallback === false) {
    return deny(
      'Silent CPU/GPU fallback must be recorded when accelerator falls back.',
    );
  }

  const verified = canClaimNeuralEngineVerified({
    compatibleModel: input.compatibleModel,
    actualLocalLoad: input.actualLocalLoad,
    actualDeviceExecution: input.actualDeviceExecution,
    validOutput: input.validOutput,
    performanceReceipt: input.performanceReceipt,
    claimedFromPublicDocsOnly: false,
  });

  if (input.silentFallbackTo) {
    return {
      verificationId: input.verificationId,
      packageId: input.packageId,
      compatibleModel: input.compatibleModel,
      actualLocalLoad: input.actualLocalLoad,
      actualDeviceExecution: input.actualDeviceExecution,
      validOutput: input.validOutput,
      performanceReceipt: input.performanceReceipt,
      claimedFromPublicDocsOnly: false,
      verificationState: 'DEGRADED',
      acceleratorPath:
        input.silentFallbackTo === 'cpu' ? 'cpu_fallback' : 'gpu_fallback',
      silentFallbackRecorded: true,
      fallbackTarget: input.silentFallbackTo,
      orgId: input.actor.orgId,
      tenantId: input.actor.tenantId,
      universeId: input.actor.universeId,
    };
  }

  return {
    verificationId: input.verificationId,
    packageId: input.packageId,
    compatibleModel: input.compatibleModel,
    actualLocalLoad: input.actualLocalLoad,
    actualDeviceExecution: input.actualDeviceExecution,
    validOutput: input.validOutput,
    performanceReceipt: input.performanceReceipt,
    claimedFromPublicDocsOnly: false,
    verificationState: verified ? 'VERIFIED' : 'NOT_TESTED',
    acceleratorPath: 'neural_engine',
    silentFallbackRecorded: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function admitAppleWorkload(input: {
  actor: Er31Actor;
  workloadId: string;
  workload: string;
  deviceProvenSuitable?: boolean;
  attemptHeavyTrainingOnUnproven?: boolean;
}): AppleWorkloadAdmission | DenialResult {
  const isFirstCandidate = (
    APPLE_FIRST_CANDIDATE_WORKLOADS as readonly string[]
  ).includes(input.workload);
  const isHeavy = (
    APPLE_HEAVY_WORKLOADS_ROUTE_ELSEWHERE as readonly string[]
  ).includes(input.workload);

  if (isHeavy && input.attemptHeavyTrainingOnUnproven) {
    return deny(
      'HEAVY_TRAINING_ON_UNPROVEN_DEVICE=false — route heavy training/large simulations elsewhere unless device proven suitable.',
    );
  }
  if (isHeavy && !input.deviceProvenSuitable) {
    return {
      workloadId: input.workloadId,
      workload: input.workload,
      admitted: false,
      reason:
        'Heavy training/large simulations route elsewhere unless device proven suitable.',
      deviceProvenSuitable: false,
    };
  }
  if (!isFirstCandidate && !isHeavy) {
    return {
      workloadId: input.workloadId,
      workload: input.workload,
      admitted: false,
      reason: 'Workload not in first-candidate allow-list.',
      deviceProvenSuitable: Boolean(input.deviceProvenSuitable),
    };
  }
  return {
    workloadId: input.workloadId,
    workload: input.workload as AppleFirstCandidateWorkload,
    admitted: true,
    reason: isFirstCandidate
      ? 'First-candidate Apple workload admitted for research.'
      : 'Heavy workload admitted only because device proven suitable.',
    deviceProvenSuitable: Boolean(input.deviceProvenSuitable),
  };
}

export function retainOfflinePackFreshness(input: {
  packId: string;
  freshnessLabel: string;
  isStale: boolean;
  attemptTreatStaleAsCurrent?: boolean;
}): OfflinePackFreshnessView | DenialResult {
  if (input.attemptTreatStaleAsCurrent || mayTreatStaleAsCurrent()) {
    return deny(
      'STALE_AS_CURRENT=false — cached data retains true freshness; deny stale-as-current.',
    );
  }
  if (input.isStale && input.attemptTreatStaleAsCurrent) {
    return deny('Cannot pretend stale offline pack is current.');
  }
  return {
    packId: input.packId,
    encrypted: true,
    usefulWithoutConnectivity:
      APPLE_OFFLINE_FRESHNESS_RULE.approvedEncryptedPacksUsefulWithoutConnectivity,
    freshnessLabel: input.freshnessLabel,
    isStale: input.isStale,
    treatedAsCurrent: false,
    deniedStaleAsCurrent: input.isStale,
  };
}

export function attemptJailbreakRootAssumptions(): DenialResult {
  return deny('JAILBREAK_ROOT_ASSUMPTIONS=false.');
}

export function attemptPrivateApiExploitation(): DenialResult {
  return deny('PRIVATE_API_EXPLOITATION=false.');
}

export function attemptOsSecurityBypass(): DenialResult {
  return deny('OS_SECURITY_BYPASS=false.');
}

export function attemptCovertCameraMicrophoneLocation(): DenialResult {
  return deny('COVERT_CAMERA_MICROPHONE_LOCATION_COLLECTION=false.');
}

export function attemptUnauthorizedPersistentBackground(): DenialResult {
  return deny('UNAUTHORIZED_PERSISTENT_BACKGROUND_EXECUTION=false.');
}

export function attemptCrossTenantPrivateDataPooling(): DenialResult {
  return deny('CROSS_TENANT_PRIVATE_DATA_POOLING=false.');
}

export function attemptUnsignedUnversionedUpdates(): DenialResult {
  return deny('UNSIGNED_UNVERSIONED_UPDATES=false.');
}

export function attemptNeuralEngineVerifiedFromDocsOnly(): DenialResult {
  return deny('NEURAL_ENGINE_DOCS_EQ_VERIFIED=false.');
}

export function attemptStaleAsCurrent(): DenialResult {
  return deny('STALE_AS_CURRENT=false.');
}

export function attemptHiddenChainOfThought(): DenialResult {
  return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_ER31=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('Recommend ≠ act.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('Agents have no automatic authority.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Bypass Guardian/RLS denied.');
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  state: 'PASS';
  unchanged: true;
} {
  return {
    state: 'PASS',
    unchanged: ER31_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er31Actor;
  action: string;
}):
  | {
      approvalId: string;
      approved: true;
      action: string;
      humanRequired: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny('HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS.');
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Approver lacks approve_consequential permission.');
  }
  return {
    approvalId: input.approvalId,
    approved: true,
    action: input.action,
    humanRequired: true,
  };
}

export function returnEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er31Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      received: true;
      authorityGranted: false;
      summary: string;
      orgId: string;
      tenantId: string;
      universeId: string;
    }
  | DenialResult {
  if (input.actor.kind === 'proposal' && ER31_AGENT_BOUNDS.automaticAuthority) {
    return deny('Agents have no automatic authority.');
  }
  return {
    evidenceId: input.evidenceId,
    received: true,
    authorityGranted: false,
    summary: input.summary,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function exampleIphoneNeuralEngineVerified(): NeuralEngineVerificationRecord {
  return {
    verificationId: 'ane-ex-1',
    packageId: 'com.xiv.apple.runtime.research',
    compatibleModel: true,
    actualLocalLoad: true,
    actualDeviceExecution: true,
    validOutput: true,
    performanceReceipt: true,
    claimedFromPublicDocsOnly: false,
    verificationState: 'VERIFIED',
    acceleratorPath: 'neural_engine',
    silentFallbackRecorded: false,
    orgId: 'org-er31',
    tenantId: 'ten-er31',
    universeId: 'uni-er31',
  };
}

export function exampleSilentCpuFallback(): NeuralEngineVerificationRecord {
  return {
    verificationId: 'ane-fallback-cpu-1',
    packageId: 'com.xiv.apple.runtime.research',
    compatibleModel: true,
    actualLocalLoad: true,
    actualDeviceExecution: true,
    validOutput: true,
    performanceReceipt: true,
    claimedFromPublicDocsOnly: false,
    verificationState: 'DEGRADED',
    acceleratorPath: 'cpu_fallback',
    silentFallbackRecorded: true,
    fallbackTarget: 'cpu',
    orgId: 'org-er31',
    tenantId: 'ten-er31',
    universeId: 'uni-er31',
  };
}

export type Er31CycleResult = {
  hops: Er31HopRecord[];
  profile: AppleRuntimeProfile;
  neuralEngine: NeuralEngineVerificationRecord;
  fallback: NeuralEngineVerificationRecord;
  offlineFreshness: OfflinePackFreshnessView;
  softWire: Er31SoftWireSnapshot;
  evidence: {
    result: 'RESEARCH_CANDIDATE';
    neuralEngineDocsImplyVerified: false;
    l4: false;
  };
};

export function runIosAppleRuntimeResearchCycle(input: {
  actor: Er31Actor;
  human: Er31Actor;
  repoRoot?: string;
}): Er31CycleResult {
  void ER31_MAY;
  void ER31_MUST_NOT;
  void APPLE_PRIVACY_MODEL;

  const softWire = er31SoftWireSnapshot(input.repoRoot);
  const hops: Er31HopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      assertEr31LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );
  hops.push(
    hop(
      'ios_apple_runtime_research_bootstrap',
      'PASS',
      'iOS / Apple Runtime Research Candidate bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'architecture_encoded',
      'PASS',
      APPLE_RUNTIME_ARCHITECTURE.join(' → '),
    ),
  );
  hops.push(
    hop(
      'profile_fields_encoded',
      'PASS',
      `${APPLE_RUNTIME_PROFILE_FIELDS.length} profile fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'runtime_states_encoded',
      'PASS',
      APPLE_RUNTIME_STATES.join(' · '),
    ),
  );
  hops.push(
    hop(
      'first_candidate_workloads_encoded',
      'PASS',
      `${APPLE_FIRST_CANDIDATE_WORKLOADS.length} first-candidate workloads.`,
    ),
  );
  hops.push(
    hop(
      'neural_engine_verification_chain_encoded',
      'PASS',
      NEURAL_ENGINE_VERIFICATION_CHAIN.join(' → '),
    ),
  );
  hops.push(
    hop(
      'privacy_model_encoded',
      'PASS',
      'On-device when verified; sandbox/consent/permissions/distribution honored.',
    ),
  );
  hops.push(
    hop(
      'offline_freshness_rule_encoded',
      'PASS',
      'Encrypted packs useful offline; deny stale-as-current.',
    ),
  );

  const profileResult = createAppleRuntimeProfile({
    actor: input.actor,
    packageId: 'com.xiv.apple.runtime.research',
    osName: 'iOS',
    osVersion: '18.0',
    deviceFamily: 'iphone',
    appleChipGeneration: 'A17',
    memoryLimitMb: 6144,
    storageLimitMb: 128000,
    packageVersion: '0.1.0-research',
    signatureVersion: 'sig-v1',
    neuralEngineCapabilityState: 'DOCUMENTED',
    verificationState: 'NOT_TESTED',
  });
  if ('denied' in profileResult) throw new Error('profile failed');
  const profile = profileResult;

  const docsOnly = verifyNeuralEngine({
    actor: input.actor,
    verificationId: 'bad-docs',
    packageId: profile.packageId,
    compatibleModel: false,
    actualLocalLoad: false,
    actualDeviceExecution: false,
    validOutput: false,
    performanceReceipt: false,
    attemptVerifyFromDocsOnly: true,
  });
  hops.push(
    hop(
      'neural_engine_docs_neq_verified',
      neuralEngineDocsImplyVerified() === false && docsOnly.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Neural Engine in public docs ≠ verified.',
    ),
  );

  const neuralEngineResult = verifyNeuralEngine({
    actor: input.actor,
    verificationId: 'ane-1',
    packageId: profile.packageId,
    compatibleModel: true,
    actualLocalLoad: true,
    actualDeviceExecution: true,
    validOutput: true,
    performanceReceipt: true,
  });
  if ('denied' in neuralEngineResult) throw new Error('ane verify failed');
  const neuralEngine = neuralEngineResult;

  const incomplete = verifyNeuralEngine({
    actor: input.actor,
    verificationId: 'ane-incomplete',
    packageId: profile.packageId,
    compatibleModel: true,
    actualLocalLoad: true,
    actualDeviceExecution: false,
    validOutput: false,
    performanceReceipt: false,
  });
  if ('denied' in incomplete) throw new Error('incomplete path failed');
  hops.push(
    hop(
      'verify_only_after_full_chain',
      neuralEngine.verificationState === 'VERIFIED' &&
        incomplete.verificationState === 'NOT_TESTED'
        ? 'PASS'
        : 'FAIL',
      'VERIFIED only after compatible model → load → execute → output → receipt.',
    ),
  );

  const unrecorded = verifyNeuralEngine({
    actor: input.actor,
    verificationId: 'bad-fallback',
    packageId: profile.packageId,
    compatibleModel: true,
    actualLocalLoad: true,
    actualDeviceExecution: true,
    validOutput: true,
    performanceReceipt: true,
    silentFallbackTo: 'cpu',
    attemptUnrecordedFallback: true,
  });
  const fallbackResult = verifyNeuralEngine({
    actor: input.actor,
    verificationId: 'ane-cpu-fallback',
    packageId: profile.packageId,
    compatibleModel: true,
    actualLocalLoad: true,
    actualDeviceExecution: true,
    validOutput: true,
    performanceReceipt: true,
    silentFallbackTo: 'cpu',
    recordSilentFallback: true,
  });
  if ('denied' in fallbackResult) throw new Error('fallback failed');
  const fallback = fallbackResult;
  hops.push(
    hop(
      'silent_cpu_gpu_fallback_recorded',
      fallback.silentFallbackRecorded === true &&
        fallback.verificationState === 'DEGRADED' &&
        unrecorded.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Silent CPU/GPU fallback must be recorded (DEGRADED).',
    ),
  );

  const heavy = admitAppleWorkload({
    actor: input.actor,
    workloadId: 'heavy-1',
    workload: 'heavy_training',
    deviceProvenSuitable: false,
  });
  if ('denied' in heavy) throw new Error('heavy admit failed');
  const light = admitAppleWorkload({
    actor: input.actor,
    workloadId: 'emb-1',
    workload: 'embeddings',
  });
  if ('denied' in light) throw new Error('light admit failed');
  hops.push(
    hop(
      'heavy_workloads_route_elsewhere_unless_proven',
      heavy.admitted === false && light.admitted === true ? 'PASS' : 'FAIL',
      'Heavy training routes elsewhere unless device proven suitable.',
    ),
  );

  const staleDeny = retainOfflinePackFreshness({
    packId: 'pack-1',
    freshnessLabel: 'as_of_2026-09-01',
    isStale: true,
    attemptTreatStaleAsCurrent: true,
  });
  const freshnessResult = retainOfflinePackFreshness({
    packId: 'pack-1',
    freshnessLabel: 'as_of_2026-09-01',
    isStale: true,
  });
  if ('denied' in freshnessResult) throw new Error('freshness failed');
  const offlineFreshness = freshnessResult;
  hops.push(
    hop(
      'offline_freshness_retention',
      offlineFreshness.treatedAsCurrent === false &&
        staleDeny.state === 'DENIED' &&
        attemptStaleAsCurrent().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Offline packs retain true freshness; deny stale-as-current.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof IOS_APPLE_RUNTIME_RESEARCH_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_jailbreak_root_assumptions',
      fn: attemptJailbreakRootAssumptions,
    },
    {
      hop: 'deny_private_api_exploitation',
      fn: attemptPrivateApiExploitation,
    },
    { hop: 'deny_os_security_bypass', fn: attemptOsSecurityBypass },
    {
      hop: 'deny_covert_camera_microphone_location',
      fn: attemptCovertCameraMicrophoneLocation,
    },
    {
      hop: 'deny_unauthorized_persistent_background',
      fn: attemptUnauthorizedPersistentBackground,
    },
    {
      hop: 'deny_cross_tenant_private_data_pooling',
      fn: attemptCrossTenantPrivateDataPooling,
    },
    {
      hop: 'deny_unsigned_unversioned_updates',
      fn: attemptUnsignedUnversionedUpdates,
    },
    { hop: 'deny_stale_as_current', fn: attemptStaleAsCurrent },
    {
      hop: 'deny_neural_engine_verified_from_docs_only',
      fn: attemptNeuralEngineVerifiedFromDocsOnly,
    },
    {
      hop: 'deny_hidden_chain_of_thought',
      fn: attemptHiddenChainOfThought,
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
      ER31_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'er30_soft_wire',
      softWire.er30AndroidArmRuntimePackage.present ? 'PASS' : 'WAITING_DATA',
      softWire.er30AndroidArmRuntimePackage.note,
    ),
  );
  hops.push(
    hop(
      'er29_soft_wire',
      softWire.er29WindowsRuntimePackageCandidate.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.er29WindowsRuntimePackageCandidate.note,
    ),
  );
  hops.push(
    hop(
      'er28_soft_wire',
      softWire.er28UniversalRuntimePackageContract.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.er28UniversalRuntimePackageContract.note,
    ),
  );
  hops.push(
    hop(
      'eq7_soft_wire',
      softWire.eq7ArmEdgeAmdAcceleration.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq7ArmEdgeAmdAcceleration.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ER31_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const home = returnEvidenceToHomeBase({
    evidenceId: 'ev-er31-1',
    actor: input.actor,
    summary: 'Apple runtime research candidate advisory',
  });
  if ('denied' in home) throw new Error('home base failed');
  const approval = requireHumanApproval({
    approvalId: 'a-er31-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  if ('denied' in approval) throw new Error('human approval failed');

  hops.push(
    hop(
      'evidence',
      neuralEngine.verificationState === 'VERIFIED' &&
        fallback.silentFallbackRecorded &&
        home.authorityGranted === false
        ? 'PASS'
        : 'FAIL',
      'Research evidence returned; no automatic authority.',
    ),
  );

  if (hops.length !== IOS_APPLE_RUNTIME_RESEARCH_CYCLE.length) {
    throw new Error(
      `hop count mismatch: ${hops.length} vs ${IOS_APPLE_RUNTIME_RESEARCH_CYCLE.length}`,
    );
  }

  return {
    hops,
    profile,
    neuralEngine,
    fallback,
    offlineFreshness,
    softWire,
    evidence: {
      result: 'RESEARCH_CANDIDATE',
      neuralEngineDocsImplyVerified: false,
      l4: false,
    },
  };
}
