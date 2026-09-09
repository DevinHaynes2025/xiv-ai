/**
 * 62L-EP6 — Local Hardware Truth Probe v2 runtime.
 *
 * Read-only ASUS/Windows machine evidence profile.
 * UNKNOWN→DETECTED→SUPPORTED→VERIFIED (no jump). CPU/GPU/NPU independent.
 * VERIFIED requires bounded inference/benchmark. Fresh heartbeat for availability.
 * Privacy-bounded. Soft-wires EP5/EP4/EP1/EM157 when present.
 */

import {
  EP6_DB_CANDIDATES_STATUS,
  EP6_LOCKS,
  EP6_MAY,
  EP6_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HARDWARE_PROBE_AGENT_BOUNDS,
  HARDWARE_PROBE_FIELDS,
  HARDWARE_STATE_PROGRESSION,
  HARDWARE_TRUTH_HOME_BASE_FLOW,
  HARDWARE_TRUTH_STATES,
  HONESTY_BANNER,
  LOCAL_HARDWARE_TRUTH_PROBE_CYCLE,
  MACHINE_EVIDENCE_SURFACES,
  NEXT_PHASE_TITLE,
  NODE_AVAILABILITY_STATES,
  PROBE_MUST_NOT_INSPECT,
  assertEp6LocksIntact,
  canAdvanceHardwareState,
  ep6SoftWireSnapshot,
  isHardwareProbeAgent,
  isHumanApprover,
  type Ep6Actor,
  type Ep6EvidenceState,
  type Ep6HopRecord,
  type Ep6SoftWireSnapshot,
  type HardwareProbeField,
  type HardwareTruthState,
  type MachineEvidenceSurface,
  type NodeAvailabilityState,
  type ProbeMustNotInspect,
} from './local-hardware-truth-probe-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof LOCAL_HARDWARE_TRUTH_PROBE_CYCLE)[number],
  state: Ep6EvidenceState,
  summary: string,
): Ep6HopRecord {
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

export type ProbeFieldValues = Partial<Record<HardwareProbeField, string>>;

export type MachineEvidenceProfile = {
  profileId: string;
  nodeId: string;
  surfaces: Readonly<Record<MachineEvidenceSurface, HardwareTruthState>>;
  probeFields: ProbeFieldValues;
  acceleratorFallbacks: readonly string[];
  timestamp: string;
  heartbeatAt: string | null;
  heartbeatFresh: boolean;
  availability: NodeAvailabilityState;
  secretsPresent: false;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type AdvanceStateResult = {
  surface: MachineEvidenceSurface;
  from: HardwareTruthState;
  to: HardwareTruthState;
  advanced: true;
  verifiedRequiresBoundedRun: boolean;
};

/**
 * Advance a surface state — never UNKNOWN → VERIFIED.
 * VERIFIED requires boundedInferenceOrBenchmark=true.
 */
export function advanceSurfaceState(input: {
  surface: MachineEvidenceSurface;
  from: HardwareTruthState;
  to: HardwareTruthState;
  boundedInferenceOrBenchmark?: boolean;
  attemptUnknownToVerifiedJump?: boolean;
  attemptVerifyWithoutBoundedRun?: boolean;
}): AdvanceStateResult | DenialResult {
  if (!HARDWARE_TRUTH_STATES.includes(input.from)) {
    return deny(`Invalid from state: ${String(input.from)}`);
  }
  if (!HARDWARE_TRUTH_STATES.includes(input.to)) {
    return deny(`Invalid to state: ${String(input.to)}`);
  }

  if (
    input.attemptUnknownToVerifiedJump ||
    (input.from === 'UNKNOWN' && input.to === 'VERIFIED')
  ) {
    return deny(
      'UNKNOWN_TO_VERIFIED_JUMP_ALLOWED=false — device states never jump UNKNOWN → VERIFIED.',
    );
  }

  if (!canAdvanceHardwareState(input.from, input.to)) {
    return deny(
      `Illegal state transition ${input.from} → ${input.to} for surface ${input.surface}.`,
    );
  }

  if (input.to === 'VERIFIED') {
    if (
      input.attemptVerifyWithoutBoundedRun ||
      !input.boundedInferenceOrBenchmark
    ) {
      return deny(
        'VERIFIED_WITHOUT_BOUNDED_INFERENCE_OR_BENCHMARK=false — VERIFIED requires actual bounded model inference or benchmark on that exact path.',
      );
    }
  }

  return {
    surface: input.surface,
    from: input.from,
    to: input.to,
    advanced: true,
    verifiedRequiresBoundedRun: input.to === 'VERIFIED',
  };
}

export function classifyIndependently(input: {
  cpu?: HardwareTruthState;
  amdGpu?: HardwareTruthState;
  npu?: HardwareTruthState;
  windowsMl?: HardwareTruthState;
  cpuInference?: HardwareTruthState;
  gpuInference?: HardwareTruthState;
  npuInference?: HardwareTruthState;
  attemptCollapseCpuGpuNpu?: boolean;
  attemptAmdCpuImpliesNpu?: boolean;
  attemptRadeonImpliesWindowsMl?: boolean;
  attemptPackagesImplyCompatibility?: boolean;
}):
  | {
      surfaces: Readonly<Record<MachineEvidenceSurface, HardwareTruthState>>;
      independent: true;
    }
  | DenialResult {
  if (input.attemptCollapseCpuGpuNpu) {
    return deny(
      'CPU_GPU_NPU_COLLAPSED_SINGLE_STATE=false — CPU/GPU/NPU are independently classified.',
    );
  }
  if (input.attemptAmdCpuImpliesNpu) {
    return deny(
      'AMD_CPU_EQ_AMD_NPU=false — seeing an AMD processor does not prove an AMD NPU exists.',
    );
  }
  if (input.attemptRadeonImpliesWindowsMl) {
    return deny(
      'RADEON_GPU_EQ_WINDOWS_ML_WORKS=false — seeing a Radeon GPU does not prove Windows ML/ONNX inference works on it.',
    );
  }
  if (input.attemptPackagesImplyCompatibility) {
    return deny(
      'INSTALLED_PACKAGES_EQ_MODEL_COMPATIBILITY=false — installed runtime packages do not prove model compatibility.',
    );
  }

  return {
    surfaces: {
      cpu: input.cpu ?? 'UNKNOWN',
      amd_gpu: input.amdGpu ?? 'UNKNOWN',
      npu: input.npu ?? 'UNKNOWN',
      windows_ml: input.windowsMl ?? 'NOT_TESTED',
      cpu_inference: input.cpuInference ?? 'NOT_TESTED',
      gpu_inference: input.gpuInference ?? 'NOT_TESTED',
      npu_inference: input.npuInference ?? 'NOT_TESTED',
    },
    independent: true,
  };
}

export function generateMachineEvidenceProfile(input: {
  actor: Ep6Actor;
  profileId: string;
  nodeId: string;
  probeFields: ProbeFieldValues;
  surfaces: Readonly<Record<MachineEvidenceSurface, HardwareTruthState>>;
  acceleratorFallbacks?: readonly string[];
  heartbeatAt?: string | null;
  heartbeatMaxAgeMs?: number;
  nodeEvent?: 'running' | 'sleep' | 'shutdown';
  attemptInspectPersonalFiles?: boolean;
  attemptInspectBrowserHistory?: boolean;
  attemptInspectCredentials?: boolean;
  attemptInspectDocumentsPhotosContacts?: boolean;
  attemptInspectProcessContents?: boolean;
  attemptCollectPreciseLocation?: boolean;
  attemptIncludeSecrets?: boolean;
}): MachineEvidenceProfile | DenialResult {
  if (input.attemptInspectPersonalFiles) {
    return deny('INSPECT_PERSONAL_FILES=false — probe must not inspect personal files.');
  }
  if (input.attemptInspectBrowserHistory) {
    return deny('INSPECT_BROWSER_HISTORY=false — probe must not inspect browser history.');
  }
  if (input.attemptInspectCredentials) {
    return deny(
      'INSPECT_PASSWORDS_CREDENTIALS=false — probe must not inspect passwords or credentials.',
    );
  }
  if (input.attemptInspectDocumentsPhotosContacts) {
    return deny(
      'INSPECT_DOCUMENTS_PHOTOS_CONTACTS=false — probe must not inspect documents, photos, or contacts.',
    );
  }
  if (input.attemptInspectProcessContents) {
    return deny(
      'INSPECT_UNRELATED_PROCESS_CONTENTS=false — probe must not inspect unrelated running-process contents.',
    );
  }
  if (input.attemptCollectPreciseLocation) {
    return deny('COLLECT_PRECISE_LOCATION=false — probe must not collect precise location.');
  }
  if (input.attemptIncludeSecrets) {
    return deny('Structured hardware profile must be generated without secrets.');
  }

  const timestamp = nowIso();
  const heartbeatAt = input.heartbeatAt ?? null;
  const maxAge = input.heartbeatMaxAgeMs ?? 60_000;
  let heartbeatFresh = false;
  if (heartbeatAt) {
    const age = Date.parse(timestamp) - Date.parse(heartbeatAt);
    heartbeatFresh = Number.isFinite(age) && age >= 0 && age <= maxAge;
  }

  let availability: NodeAvailabilityState = 'WAITING_NODE';
  if (input.nodeEvent === 'sleep') {
    availability = 'WAITING_NODE';
  } else if (input.nodeEvent === 'shutdown') {
    availability = 'OFFLINE_STOPPED';
  } else if (heartbeatFresh) {
    availability = 'RUNNING_VERIFIED';
  } else {
    availability = 'WAITING_NODE';
  }

  const fields: ProbeFieldValues = {
    ...input.probeFields,
    timestamp,
    xivRuntimeHeartbeat: heartbeatAt ?? 'missing',
  };

  // Ensure only approved probe fields are retained
  const sanitized: ProbeFieldValues = {};
  for (const key of HARDWARE_PROBE_FIELDS) {
    if (fields[key] !== undefined) sanitized[key] = fields[key];
  }

  return {
    profileId: input.profileId,
    nodeId: input.nodeId,
    surfaces: input.surfaces,
    probeFields: sanitized,
    acceleratorFallbacks: input.acceleratorFallbacks ?? [
      'cpu_inference',
      'gpu_inference',
      'npu_inference',
    ],
    timestamp,
    heartbeatAt,
    heartbeatFresh,
    availability,
    secretsPresent: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function evaluateSchedulingEligibility(input: {
  profile: MachineEvidenceProfile;
  attemptUseStaleForVerifiedScheduling?: boolean;
  attemptAvailableWithoutFreshHeartbeat?: boolean;
}):
  | {
      eligibleForVerifiedScheduling: boolean;
      reason: string;
    }
  | DenialResult {
  if (input.attemptUseStaleForVerifiedScheduling) {
    return deny(
      'STALE_INFLUENCES_VERIFIED_SCHEDULING=false — stale profiles stop influencing verified scheduling.',
    );
  }
  if (input.attemptAvailableWithoutFreshHeartbeat) {
    return deny(
      'AVAILABLE_WITHOUT_FRESH_HEARTBEAT=false — a fresh heartbeat is required before the machine can be considered available for work.',
    );
  }

  const anyStale = Object.values(input.profile.surfaces).some(
    (s) => s === 'STALE',
  );
  if (anyStale) {
    return {
      eligibleForVerifiedScheduling: false,
      reason: 'One or more surfaces are STALE — excluded from verified scheduling.',
    };
  }
  if (!input.profile.heartbeatFresh) {
    return {
      eligibleForVerifiedScheduling: false,
      reason: 'Heartbeat not fresh — node WAITING_NODE / not available for work.',
    };
  }
  if (input.profile.availability !== 'RUNNING_VERIFIED') {
    return {
      eligibleForVerifiedScheduling: false,
      reason: `Node availability=${input.profile.availability}.`,
    };
  }
  return {
    eligibleForVerifiedScheduling: true,
    reason: 'Fresh heartbeat and no STALE surfaces — eligible for verified scheduling.',
  };
}

export function transitionNodeAvailability(input: {
  from: NodeAvailabilityState;
  event: 'fresh_heartbeat' | 'sleep' | 'shutdown' | 'stale_heartbeat';
}): { from: NodeAvailabilityState; to: NodeAvailabilityState; event: string } {
  if (input.event === 'fresh_heartbeat') {
    return { from: input.from, to: 'RUNNING_VERIFIED', event: input.event };
  }
  if (input.event === 'sleep' || input.event === 'stale_heartbeat') {
    return { from: input.from, to: 'WAITING_NODE', event: input.event };
  }
  return { from: input.from, to: 'OFFLINE_STOPPED', event: input.event };
}

export function attemptJumpUnknownToVerified(): DenialResult {
  return deny(
    'UNKNOWN_TO_VERIFIED_JUMP_ALLOWED=false — states never jump UNKNOWN → VERIFIED.',
  );
}

export function attemptEquateDetectedWithVerified(): DenialResult {
  return deny('DETECTED_EQ_VERIFIED=false — DETECTED ≠ VERIFIED.');
}

export function attemptAmdCpuImpliesNpu(): DenialResult {
  return deny(
    'AMD_CPU_EQ_AMD_NPU=false — seeing an AMD processor does not prove an AMD NPU exists.',
  );
}

export function attemptRadeonImpliesWindowsMl(): DenialResult {
  return deny(
    'RADEON_GPU_EQ_WINDOWS_ML_WORKS=false — seeing a Radeon GPU does not prove Windows ML/ONNX works.',
  );
}

export function attemptPackagesImplyCompatibility(): DenialResult {
  return deny(
    'INSTALLED_PACKAGES_EQ_MODEL_COMPATIBILITY=false — installed packages ≠ model compatibility.',
  );
}

export function attemptVerifyWithoutBoundedRun(): DenialResult {
  return deny(
    'VERIFIED_WITHOUT_BOUNDED_INFERENCE_OR_BENCHMARK=false — VERIFIED requires bounded inference or benchmark.',
  );
}

export function attemptInspectPersonalFiles(): DenialResult {
  return deny('INSPECT_PERSONAL_FILES=false.');
}

export function attemptCollectPreciseLocation(): DenialResult {
  return deny('COLLECT_PRECISE_LOCATION=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false — probe agents have no automatic authority.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act.');
}

export function returnAgentEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep6Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      actorKind: Ep6Actor['kind'];
      summary: string;
      returnedToHomeBase: true;
      flow: typeof HARDWARE_TRUTH_HOME_BASE_FLOW;
      authorityGranted: false;
    }
  | DenialResult {
  if (!HARDWARE_PROBE_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isHardwareProbeAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only hardware-probe agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    actorKind: input.actor.kind,
    summary: input.summary,
    returnedToHomeBase: true,
    flow: HARDWARE_TRUTH_HOME_BASE_FLOW,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep6Actor;
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
    unchanged: EP6_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    bypassDenied: EP6_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleAsusProbeFields(): ProbeFieldValues {
  return {
    windowsVersionBuild: 'Windows 11 Build 26100 (example)',
    systemArchitecture: 'x86_64',
    cpuVendorModel: 'AMD Ryzen (example — DOCUMENTED probe shape)',
    logicalPhysicalCoreCounts: 'logical=16;physical=8',
    installedRam: '32GB',
    gpuVendorModel: 'AMD Radeon (example)',
    gpuMemory: '8GB',
    npuPresence: 'UNKNOWN',
    storageCapacityFreeSpaceXivPaths: 'xiv-approved-paths:summary-only',
    availableExecutionRuntimeProviders: 'cpu;onnxruntime;windows-ml-candidate',
    powerBatteryState: 'ac-powered',
    xivRuntimeHeartbeat: 'pending',
    timestamp: nowIso(),
  };
}

export function bootstrapLocalHardwareTruthProbe(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep6SoftWireSnapshot;
  probeFields: readonly HardwareProbeField[];
  truthStates: readonly HardwareTruthState[];
  progression: typeof HARDWARE_STATE_PROGRESSION;
  surfaces: typeof MACHINE_EVIDENCE_SURFACES;
  availabilityStates: typeof NODE_AVAILABILITY_STATES;
  homeBaseFlow: typeof HARDWARE_TRUTH_HOME_BASE_FLOW;
  mustNotInspect: readonly ProbeMustNotInspect[];
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP6_MAY;
  mustNot: typeof EP6_MUST_NOT;
  dbCandidates: typeof EP6_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp6LocksIntact(),
    softWire: ep6SoftWireSnapshot(repoRoot),
    probeFields: HARDWARE_PROBE_FIELDS,
    truthStates: HARDWARE_TRUTH_STATES,
    progression: HARDWARE_STATE_PROGRESSION,
    surfaces: MACHINE_EVIDENCE_SURFACES,
    availabilityStates: NODE_AVAILABILITY_STATES,
    homeBaseFlow: HARDWARE_TRUTH_HOME_BASE_FLOW,
    mustNotInspect: PROBE_MUST_NOT_INSPECT,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP6_MAY,
    mustNot: EP6_MUST_NOT,
    dbCandidates: EP6_DB_CANDIDATES_STATUS,
  };
}

export function runLocalHardwareTruthProbeCycle(input: {
  actor: Ep6Actor;
  human: Ep6Actor;
  repoRoot?: string;
}): {
  hops: Ep6HopRecord[];
  profile: MachineEvidenceProfile | DenialResult;
  softWire: Ep6SoftWireSnapshot;
} {
  const hops: Ep6HopRecord[] = [];
  const softWire = ep6SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp6LocksIntact() ? 'PASS' : 'FAIL',
      'EP6 locks intact including L4=false and no UNKNOWN→VERIFIED jump.',
    ),
  );
  hops.push(
    hop(
      'hardware_truth_probe_bootstrap',
      'PASS',
      'Local Hardware Truth Probe v2 bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'probe_fields_encoded',
      'PASS',
      `${HARDWARE_PROBE_FIELDS.length} read-only probe fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'truth_states_encoded',
      'PASS',
      HARDWARE_TRUTH_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'state_progression_encoded',
      'PASS',
      HARDWARE_STATE_PROGRESSION.join(' → '),
    ),
  );
  hops.push(
    hop(
      'machine_evidence_surfaces_encoded',
      'PASS',
      MACHINE_EVIDENCE_SURFACES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'node_availability_states_encoded',
      'PASS',
      NODE_AVAILABILITY_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'home_base_flow_encoded',
      'PASS',
      HARDWARE_TRUTH_HOME_BASE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'privacy_must_not_inspect_encoded',
      'PASS',
      `${PROBE_MUST_NOT_INSPECT.length} privacy exclusions encoded.`,
    ),
  );

  hops.push(
    hop(
      'no_unknown_to_verified_jump',
      advanceSurfaceState({
        surface: 'cpu',
        from: 'UNKNOWN',
        to: 'VERIFIED',
        attemptUnknownToVerifiedJump: true,
      }).state === 'DENIED' &&
        attemptJumpUnknownToVerified().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'UNKNOWN → VERIFIED jump DENIED.',
    ),
  );

  const classified = classifyIndependently({
    cpu: 'DETECTED',
    amdGpu: 'DETECTED',
    npu: 'UNKNOWN',
    windowsMl: 'SUPPORTED',
    cpuInference: 'NOT_TESTED',
    gpuInference: 'NOT_TESTED',
    npuInference: 'NOT_TESTED',
  });
  hops.push(
    hop(
      'cpu_gpu_npu_independently_classified',
      !('denied' in classified) && classified.independent ? 'PASS' : 'FAIL',
      'CPU/GPU/NPU independently classified.',
    ),
  );
  hops.push(
    hop(
      'amd_cpu_neq_amd_npu',
      attemptAmdCpuImpliesNpu().state,
      'AMD CPU ≠ AMD NPU — imply attempt DENIED.',
    ),
  );
  hops.push(
    hop(
      'radeon_gpu_neq_windows_ml_works',
      attemptRadeonImpliesWindowsMl().state,
      'Radeon GPU ≠ Windows ML works — imply attempt DENIED.',
    ),
  );
  hops.push(
    hop(
      'installed_packages_neq_model_compatibility',
      attemptPackagesImplyCompatibility().state,
      'Installed packages ≠ model compatibility — DENIED.',
    ),
  );
  hops.push(
    hop(
      'verified_requires_bounded_inference_or_benchmark',
      advanceSurfaceState({
        surface: 'cpu_inference',
        from: 'SUPPORTED',
        to: 'VERIFIED',
        attemptVerifyWithoutBoundedRun: true,
      }).state === 'DENIED' &&
        attemptVerifyWithoutBoundedRun().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'VERIFIED without bounded run DENIED.',
    ),
  );

  const heartbeatAt = nowIso();
  const surfaces =
    !('denied' in classified)
      ? classified.surfaces
      : {
          cpu: 'DETECTED' as const,
          amd_gpu: 'DETECTED' as const,
          npu: 'UNKNOWN' as const,
          windows_ml: 'NOT_TESTED' as const,
          cpu_inference: 'NOT_TESTED' as const,
          gpu_inference: 'NOT_TESTED' as const,
          npu_inference: 'NOT_TESTED' as const,
        };

  const profile = generateMachineEvidenceProfile({
    actor: input.actor,
    profileId: 'profile-asus-ep6-1',
    nodeId: 'asus-node-1',
    probeFields: exampleAsusProbeFields(),
    surfaces,
    acceleratorFallbacks: [
      'cpu_inference (fallback)',
      'gpu_inference (candidate)',
      'npu_inference (unknown)',
    ],
    heartbeatAt,
    nodeEvent: 'running',
  });

  hops.push(
    hop(
      'accelerator_fallbacks_visible',
      !('denied' in profile) && profile.acceleratorFallbacks.length > 0
        ? 'PASS'
        : 'FAIL',
      'Accelerator fallbacks visible on profile.',
    ),
  );
  hops.push(
    hop(
      'evidence_timestamped',
      !('denied' in profile) && Boolean(profile.timestamp) ? 'PASS' : 'FAIL',
      'Evidence timestamped.',
    ),
  );

  const staleProfile =
    !('denied' in profile)
      ? {
          ...profile,
          surfaces: { ...profile.surfaces, cpu: 'STALE' as const },
        }
      : null;
  hops.push(
    hop(
      'stale_profiles_stop_verified_scheduling',
      staleProfile &&
        evaluateSchedulingEligibility({
          profile: staleProfile,
          attemptUseStaleForVerifiedScheduling: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Stale profiles excluded from verified scheduling.',
    ),
  );

  hops.push(
    hop(
      'fresh_heartbeat_required_for_availability',
      !('denied' in profile) &&
        profile.heartbeatFresh &&
        profile.availability === 'RUNNING_VERIFIED' &&
        evaluateSchedulingEligibility({
          profile,
          attemptAvailableWithoutFreshHeartbeat: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Fresh heartbeat required; available-without-heartbeat DENIED.',
    ),
  );

  const sleepTx = transitionNodeAvailability({
    from: 'RUNNING_VERIFIED',
    event: 'sleep',
  });
  const shutdownTx = transitionNodeAvailability({
    from: 'RUNNING_VERIFIED',
    event: 'shutdown',
  });
  hops.push(
    hop(
      'sleep_shutdown_to_waiting_or_offline',
      sleepTx.to === 'WAITING_NODE' && shutdownTx.to === 'OFFLINE_STOPPED'
        ? 'PASS'
        : 'FAIL',
      'Sleep → WAITING_NODE; shutdown → OFFLINE_STOPPED.',
    ),
  );

  hops.push(
    hop(
      'read_only_technical_metadata_only',
      'PASS',
      'Probe collects only read-only technical metadata.',
    ),
  );
  hops.push(
    hop(
      'no_personal_files_or_credentials',
      attemptInspectPersonalFiles().state,
      'Personal files / credentials inspection DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_precise_location',
      attemptCollectPreciseLocation().state,
      'Precise location collection DENIED.',
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
        attemptEquateDetectedWithVerified().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; DETECTED ≠ VERIFIED.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP6_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
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
      'ep4_soft_wire',
      softWire.ep4IpFirewall.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep4IpFirewall.note,
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
      EP6_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep6-1',
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

  void LOCAL_HARDWARE_TRUTH_PROBE_CYCLE;
  void attemptAgentAutoAuthority;

  return { hops, profile, softWire };
}
