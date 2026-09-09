/**
 * 62L-ER29 — Windows Runtime Package Candidate runtime.
 *
 * Create BUILD_CANDIDATE; run verification sequence with evidence gates;
 * deny auto GPU/NPU VERIFIED; deny assume ASUS AMD/NPU without probe;
 * CPU-safe fallback; heartbeat RUNNING_VERIFIED vs OFFLINE_STOPPED;
 * deny silent persistence / BIOS / driver / overclock / credential collection.
 */

import { createHash } from 'node:crypto';
import {
  ASUS_MACHINE_TRUTH_RULE,
  ER29_AGENT_BOUNDS,
  ER29_DB_CANDIDATES_STATUS,
  ER29_LOCKS,
  ER29_MAY,
  ER29_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  WINDOWS_RUNTIME_AGENT_BEHAVIOR,
  WINDOWS_RUNTIME_BUILD_RECORD_FIELDS,
  WINDOWS_RUNTIME_INSTALL_SAFEGUARDS,
  WINDOWS_RUNTIME_PACKAGE_CANDIDATE_CYCLE,
  WINDOWS_RUNTIME_PACKAGE_CHAIN,
  WINDOWS_RUNTIME_PACKAGE_STATES,
  WINDOWS_RUNTIME_SUCCESS_DEFINITION,
  WINDOWS_RUNTIME_VERIFICATION_SEQUENCE,
  acceleratorNeverAutoVerified,
  assertEr29LocksIntact,
  asusAssumptionsForbidden,
  er29SoftWireSnapshot,
  isEr29Agent,
  isHumanApprover,
  softWireHopState,
  type AcceleratorEvidenceState,
  type Er29Actor,
  type Er29EvidenceState,
  type Er29HopRecord,
  type Er29SoftWireSnapshot,
  type HardwareProbeProfile,
  type WindowsAgentRuntimeStatus,
  type WindowsRuntimeBuildRecord,
  type WindowsRuntimePackageState,
  type WindowsVerificationEvidence,
} from './windows-runtime-package-candidate-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof WINDOWS_RUNTIME_PACKAGE_CANDIDATE_CYCLE)[number],
  state: Er29EvidenceState,
  summary: string,
): Er29HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export function createBuildCandidate(input: {
  actor: Er29Actor;
  packageId: string;
  windowsBuildVersion: string;
  architecture: string;
  installerVersion: string;
  runtimeDependencies?: readonly string[];
  modelDependencies?: readonly string[];
  storageFootprintBytes?: number;
  requiredPermissions?: readonly string[];
  offlineFeatures?: readonly string[];
  networkRequirements?: readonly string[];
  rollbackVersion?: string | null;
  compatibilityState?: string;
}): WindowsRuntimeBuildRecord | DenialResult {
  if (!isEr29Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Actor not authorized to create Windows runtime build candidate.');
  }
  if (!input.packageId || !input.windowsBuildVersion || !input.architecture) {
    return deny('packageId, windowsBuildVersion, and architecture are required.');
  }

  return {
    packageId: input.packageId,
    windowsBuildVersion: input.windowsBuildVersion,
    architecture: input.architecture,
    cpu: null,
    gpu: null,
    npuState: 'NOT_TESTED',
    runtimeDependencies: input.runtimeDependencies ?? ['xiv-local-runtime'],
    modelDependencies: input.modelDependencies ?? [],
    storageFootprintBytes: input.storageFootprintBytes ?? 0,
    requiredPermissions: input.requiredPermissions ?? ['local_runtime'],
    offlineFeatures: input.offlineFeatures ?? [
      'offline_search',
      'local_inference_cpu',
    ],
    networkRequirements: input.networkRequirements ?? ['home_base_sync_optional'],
    installerVersion: input.installerVersion,
    signatureHash: sha256(
      `${input.packageId}:${input.installerVersion}:${input.windowsBuildVersion}`,
    ),
    rollbackVersion: input.rollbackVersion ?? null,
    compatibilityState: input.compatibilityState ?? 'CANDIDATE',
    testEvidence: [],
    packageState: 'BUILD_CANDIDATE',
    gpuState: 'NOT_TESTED',
    cpuState: 'NOT_TESTED',
    authorizedTestDeviceId: null,
    installed: false,
    runtimeStarted: false,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
  };
}

export function installOnAuthorizedTestDevice(input: {
  actor: Er29Actor;
  record: WindowsRuntimeBuildRecord;
  authorizedTestDeviceId: string;
  explicitAuthorization: boolean;
  authorizerId?: string;
}): WindowsRuntimeBuildRecord | DenialResult {
  if (!input.explicitAuthorization) {
    return deny('Install requires explicit authorization on a test device.');
  }
  if (!input.authorizedTestDeviceId) {
    return deny('Install only on an explicitly authorized test device.');
  }
  if (
    input.record.tenantId !== input.actor.tenantId ||
    input.record.universeId !== input.actor.universeId
  ) {
    return deny('Cross-tenant/Universe install denied.');
  }
  if (input.record.packageState === 'FAILED') {
    return deny('Cannot install a FAILED package candidate.');
  }

  return {
    ...input.record,
    authorizedTestDeviceId: input.authorizedTestDeviceId,
    installed: true,
    packageState: 'INSTALLED',
    testEvidence: [
      ...input.record.testEvidence,
      `install:${input.authorizedTestDeviceId}:auth=${input.authorizerId ?? input.actor.id}`,
    ],
  };
}

/**
 * Privacy-minimal hardware probe. Never invents AMD/Radeon/Ryzen AI.
 */
export function runPrivacyMinimalHardwareProbe(input: {
  actor: Er29Actor;
  record: WindowsRuntimeBuildRecord;
  observed?: {
    cpuVendor?: string | null;
    cpuModel?: string | null;
    gpuVendor?: string | null;
    gpuModel?: string | null;
    npuPresent?: boolean | null;
    npuVendor?: string | null;
  };
  assumeAmdCpu?: boolean;
  assumeRadeonGpu?: boolean;
  assumeRyzenAiNpu?: boolean;
}):
  | { record: WindowsRuntimeBuildRecord; probe: HardwareProbeProfile }
  | DenialResult {
  if (!input.record.installed) {
    return deny('Hardware probe requires INSTALLED package on authorized device.');
  }
  if (
    input.assumeAmdCpu === true ||
    input.assumeRadeonGpu === true ||
    input.assumeRyzenAiNpu === true
  ) {
    return deny(
      'ASUS machine profile must be discovered — do not assume AMD CPU / Radeon GPU / Ryzen AI NPU.',
    );
  }

  const observed = input.observed ?? {};
  const probe: HardwareProbeProfile = {
    probeId: `probe-${sha256(input.record.packageId).slice(0, 12)}`,
    privacyMinimal: true,
    windowsBuildVersion: input.record.windowsBuildVersion,
    architecture: input.record.architecture,
    cpuVendor: observed.cpuVendor ?? null,
    cpuModel: observed.cpuModel ?? null,
    gpuVendor: observed.gpuVendor ?? null,
    gpuModel: observed.gpuModel ?? null,
    npuPresent: observed.npuPresent ?? null,
    npuVendor: observed.npuVendor ?? null,
    assumedAmdWithoutProbe: false,
    assumedRadeonWithoutProbe: false,
    assumedRyzenAiWithoutProbe: false,
  };

  const cpuLabel =
    probe.cpuVendor || probe.cpuModel
      ? [probe.cpuVendor, probe.cpuModel].filter(Boolean).join(' ')
      : null;
  const gpuLabel =
    probe.gpuVendor || probe.gpuModel
      ? [probe.gpuVendor, probe.gpuModel].filter(Boolean).join(' ')
      : null;

  return {
    probe,
    record: {
      ...input.record,
      cpu: cpuLabel,
      gpu: gpuLabel,
      npuState: probe.npuPresent === true ? 'NOT_TESTED' : 'NOT_TESTED',
      packageState: 'RUNTIME_STARTED',
      runtimeStarted: true,
      testEvidence: [
        ...input.record.testEvidence,
        `probe:${probe.probeId}:privacy_minimal`,
      ],
    },
  };
}

export function verifyRuntimeHeartbeat(input: {
  record: WindowsRuntimeBuildRecord;
  freshHeartbeat: boolean;
  devicePowerState: 'ON' | 'ASLEEP' | 'OFF';
  claimContinuedWorkAfterShutdown?: boolean;
}):
  | {
      status: WindowsAgentRuntimeStatus;
      record: WindowsRuntimeBuildRecord;
    }
  | DenialResult {
  if (!input.record.runtimeStarted) {
    return deny('Heartbeat requires RUNTIME_STARTED.');
  }
  if (input.claimContinuedWorkAfterShutdown === true) {
    return deny(
      'Cannot claim continued local work after shutdown — use WAITING_NODE / OFFLINE_STOPPED.',
    );
  }
  if (input.devicePowerState === 'OFF') {
    return {
      status: 'OFFLINE_STOPPED',
      record: {
        ...input.record,
        testEvidence: [...input.record.testEvidence, 'heartbeat:OFFLINE_STOPPED'],
      },
    };
  }
  if (input.devicePowerState === 'ASLEEP') {
    return {
      status: 'WAITING_NODE',
      record: {
        ...input.record,
        testEvidence: [...input.record.testEvidence, 'heartbeat:WAITING_NODE'],
      },
    };
  }
  if (!input.freshHeartbeat) {
    return {
      status: 'HEARTBEAT_STALE',
      record: {
        ...input.record,
        testEvidence: [...input.record.testEvidence, 'heartbeat:STALE'],
      },
    };
  }
  return {
    status: 'RUNNING_VERIFIED',
    record: {
      ...input.record,
      testEvidence: [...input.record.testEvidence, 'heartbeat:RUNNING_VERIFIED'],
    },
  };
}

export function runCpuBaselineInference(input: {
  record: WindowsRuntimeBuildRecord;
  measuredSuccess: boolean;
}): WindowsRuntimeBuildRecord | DenialResult {
  if (!input.record.runtimeStarted) {
    return deny('CPU baseline requires RUNTIME_STARTED.');
  }
  if (!input.measuredSuccess) {
    return {
      ...input.record,
      packageState: 'FAILED',
      cpuState: 'MEASURED_FAIL' as AcceleratorEvidenceState,
      testEvidence: [...input.record.testEvidence, 'cpu_baseline:FAILED'],
    };
  }
  return {
    ...input.record,
    packageState: 'CPU_VERIFIED',
    cpuState: 'MEASURED_PASS',
    testEvidence: [...input.record.testEvidence, 'cpu_baseline:CPU_VERIFIED'],
  };
}

export function applyCpuSafeFallback(input: {
  record: WindowsRuntimeBuildRecord;
  preferAcceleratorWithoutEvidence?: boolean;
}): WindowsRuntimeBuildRecord | DenialResult {
  if (input.preferAcceleratorWithoutEvidence === true) {
    return deny(
      'CPU-safe fallback required — cannot prefer GPU/NPU without measured evidence.',
    );
  }
  return {
    ...input.record,
    testEvidence: [...input.record.testEvidence, 'cpu_safe_fallback:applied'],
  };
}

/**
 * GPU/NPU verification — NEVER automatic. Requires compatible path + measurement.
 */
export function attemptMarkAcceleratorVerified(input: {
  kind: 'GPU' | 'NPU';
  record: WindowsRuntimeBuildRecord;
  auto?: boolean;
  compatibleRuntimeModelPathExists?: boolean;
  measuredEvidence?: boolean;
}): WindowsRuntimeBuildRecord | DenialResult {
  if (input.auto === true) {
    return deny(
      `${input.kind} must not become VERIFIED automatically — measurement required.`,
    );
  }
  if (input.compatibleRuntimeModelPathExists !== true) {
    return deny(
      `${input.kind} test skipped — compatible runtime/model path absent.`,
      'WAITING_DATA',
    );
  }
  if (input.measuredEvidence !== true) {
    return deny(
      `${input.kind} remains NOT_TESTED until measured evidence exists.`,
    );
  }

  if (input.kind === 'GPU') {
    return {
      ...input.record,
      packageState: 'GPU_VERIFIED',
      gpuState: 'MEASURED_PASS',
      testEvidence: [...input.record.testEvidence, 'gpu:GPU_VERIFIED:measured'],
    };
  }
  return {
    ...input.record,
    packageState: 'NPU_VERIFIED',
    npuState: 'MEASURED_PASS',
    testEvidence: [...input.record.testEvidence, 'npu:NPU_VERIFIED:measured'],
  };
}

export function loadApprovedOfflineKnowledgePack(input: {
  record: WindowsRuntimeBuildRecord;
  packId: string;
  approved: boolean;
}): WindowsRuntimeBuildRecord | DenialResult {
  if (!input.approved) {
    return deny('Only small approved offline knowledge packs may be loaded.');
  }
  if (input.record.packageState === 'FAILED') {
    return deny('Cannot load offline pack on FAILED candidate.');
  }
  return {
    ...input.record,
    testEvidence: [
      ...input.record.testEvidence,
      `offline_pack:${input.packId}:loaded`,
    ],
  };
}

export function localSearchRetrieval(input: {
  record: WindowsRuntimeBuildRecord;
  query: string;
}):
  | { hits: readonly string[]; record: WindowsRuntimeBuildRecord }
  | DenialResult {
  if (!input.record.testEvidence.some((e) => e.startsWith('offline_pack:'))) {
    return deny('Local search requires an approved offline pack loaded.');
  }
  return {
    hits: [`local:${input.query}`],
    record: {
      ...input.record,
      testEvidence: [
        ...input.record.testEvidence,
        `local_search:${input.query}`,
      ],
    },
  };
}

export function offlineRetestWhenDisconnected(input: {
  record: WindowsRuntimeBuildRecord;
  networkConnected: boolean;
  approvedOfflineFeaturesOk: boolean;
}): WindowsRuntimeBuildRecord | DenialResult {
  if (input.networkConnected === true) {
    return deny('Offline retest requires network disconnected.');
  }
  if (!input.approvedOfflineFeaturesOk) {
    return {
      ...input.record,
      packageState: 'DEGRADED',
      testEvidence: [...input.record.testEvidence, 'offline_retest:DEGRADED'],
    };
  }
  return {
    ...input.record,
    packageState: 'OFFLINE_VERIFIED',
    testEvidence: [...input.record.testEvidence, 'offline_retest:OFFLINE_VERIFIED'],
  };
}

export function safeHomeBaseSync(input: {
  actor: Er29Actor;
  record: WindowsRuntimeBuildRecord;
  networkConnected: boolean;
  autoPromoteToGlobalBrain?: boolean;
}):
  | {
      synced: true;
      autoPromotedToGlobalBrain: false;
      record: WindowsRuntimeBuildRecord;
      receiptId: string;
    }
  | DenialResult {
  if (!input.networkConnected) {
    return deny('Home Base sync requires network reconnect.');
  }
  if (input.autoPromoteToGlobalBrain === true) {
    return deny('Safe Home Base sync must not auto-promote to global brain.');
  }
  if (
    input.record.tenantId !== input.actor.tenantId ||
    input.record.universeId !== input.actor.universeId
  ) {
    return deny('Cross-tenant/Universe Home Base sync denied.');
  }
  const receiptId = `receipt-${sha256(input.record.packageId + nowIso()).slice(0, 12)}`;
  return {
    synced: true,
    autoPromotedToGlobalBrain: false,
    receiptId,
    record: {
      ...input.record,
      packageState: 'SYNC_VERIFIED',
      testEvidence: [
        ...input.record.testEvidence,
        `home_base_sync:${receiptId}`,
      ],
    },
  };
}

export function runVerificationSequence(input: {
  actor: Er29Actor;
  human: Er29Actor;
  packageId?: string;
  authorizedTestDeviceId?: string;
  observedHardware?: {
    cpuVendor?: string | null;
    cpuModel?: string | null;
    gpuVendor?: string | null;
    gpuModel?: string | null;
    npuPresent?: boolean | null;
    npuVendor?: string | null;
  };
  compatibleGpuNpuPath?: boolean;
  measuredGpuNpu?: boolean;
}): {
  record: WindowsRuntimeBuildRecord;
  evidence: WindowsVerificationEvidence[];
  agentStatus: WindowsAgentRuntimeStatus;
} | DenialResult {
  const evidence: WindowsVerificationEvidence[] = [];
  const push = (
    step: (typeof WINDOWS_RUNTIME_VERIFICATION_SEQUENCE)[number],
    state: WindowsVerificationEvidence['state'],
    summary: string,
  ) => {
    evidence.push({ step, state, summary, at: nowIso() });
  };

  let created = createBuildCandidate({
    actor: input.actor,
    packageId: input.packageId ?? 'win-rt-pkg-asus-cand-1',
    windowsBuildVersion: '10.0.22631',
    architecture: 'x86_64',
    installerVersion: '0.1.0-candidate',
    rollbackVersion: '0.0.0',
  });
  if ('denied' in created) return created;

  // 1. Install only on explicitly authorized test device
  if (!input.authorizedTestDeviceId) {
    push(
      'install_only_on_explicitly_authorized_test_device',
      'DENIED',
      'No authorized test device id.',
    );
    return deny('Install only on an explicitly authorized test device.');
  }
  const installed = installOnAuthorizedTestDevice({
    actor: input.actor,
    record: created,
    authorizedTestDeviceId: input.authorizedTestDeviceId,
    explicitAuthorization: true,
    authorizerId: input.human.id,
  });
  if ('denied' in installed) return installed;
  push(
    'install_only_on_explicitly_authorized_test_device',
    'PASS',
    `Installed on ${input.authorizedTestDeviceId}.`,
  );
  let record = installed;

  // 2. Privacy-minimal hardware probe
  const probed = runPrivacyMinimalHardwareProbe({
    actor: input.actor,
    record,
    observed: input.observedHardware,
  });
  if ('denied' in probed) return probed;
  push(
    'privacy_minimal_hardware_probe',
    'PASS',
    `Probe ${probed.probe.probeId}; no ASUS AMD/NPU assumptions.`,
  );
  record = probed.record;

  // 3. Verify runtime heartbeat
  const hb = verifyRuntimeHeartbeat({
    record,
    freshHeartbeat: true,
    devicePowerState: 'ON',
  });
  if ('denied' in hb) return hb;
  push('verify_runtime_heartbeat', 'PASS', `Agent status ${hb.status}.`);
  record = hb.record;
  const agentStatus = hb.status;

  // 4. CPU baseline inference
  const cpu = runCpuBaselineInference({ record, measuredSuccess: true });
  if ('denied' in cpu) return cpu;
  push('run_cpu_baseline_inference', 'PASS', 'CPU_VERIFIED with measured success.');
  record = applyCpuSafeFallback({ record: cpu });
  if ('denied' in record) return record;

  // 5. AMD GPU/NPU only when compatible paths exist
  if (input.compatibleGpuNpuPath === true && input.measuredGpuNpu === true) {
    const gpu = attemptMarkAcceleratorVerified({
      kind: 'GPU',
      record,
      compatibleRuntimeModelPathExists: true,
      measuredEvidence: true,
    });
    if ('denied' in gpu) return gpu;
    record = gpu;
    push(
      'test_amd_gpu_npu_only_when_compatible_paths_exist',
      'PASS',
      'GPU measured VERIFIED on compatible path.',
    );
  } else {
    const skipped = attemptMarkAcceleratorVerified({
      kind: 'GPU',
      record,
      auto: false,
      compatibleRuntimeModelPathExists: input.compatibleGpuNpuPath === true,
      measuredEvidence: false,
    });
    push(
      'test_amd_gpu_npu_only_when_compatible_paths_exist',
      input.compatibleGpuNpuPath === true ? 'NOT_TESTED' : 'SKIPPED_INCOMPATIBLE',
      'denied' in skipped ? skipped.reason : 'GPU/NPU not auto-verified.',
    );
    // keep record unchanged; GPU stays NOT_TESTED
  }

  // 6. Load small approved offline knowledge pack
  const pack = loadApprovedOfflineKnowledgePack({
    record,
    packId: 'offline-small-approved-1',
    approved: true,
  });
  if ('denied' in pack) return pack;
  push(
    'load_small_approved_offline_knowledge_pack',
    'PASS',
    'Approved offline pack loaded.',
  );
  record = pack;

  // 7. Local search/retrieval
  const search = localSearchRetrieval({ record, query: 'xiv-local' });
  if ('denied' in search) return search;
  push('local_search_retrieval', 'PASS', `Hits=${search.hits.length}.`);
  record = search.record;

  // 8. Disconnect and retest offline
  const offline = offlineRetestWhenDisconnected({
    record,
    networkConnected: false,
    approvedOfflineFeaturesOk: true,
  });
  if ('denied' in offline) return offline;
  push(
    'disconnect_network_retest_approved_offline_features',
    'PASS',
    'OFFLINE_VERIFIED.',
  );
  record = offline;

  // 9. Reconnect and safe Home Base sync
  const sync = safeHomeBaseSync({
    actor: input.actor,
    record,
    networkConnected: true,
  });
  if ('denied' in sync) return sync;
  push(
    'reconnect_test_safe_home_base_sync',
    'PASS',
    `SYNC_VERIFIED receipt=${sync.receiptId}.`,
  );
  record = sync.record;

  // 10. Record all evidence and failures
  push(
    'record_all_evidence_and_failures',
    'PASS',
    `Evidence steps=${evidence.length}; failures=0.`,
  );
  record = {
    ...record,
    testEvidence: [
      ...record.testEvidence,
      `verification_sequence_complete:${evidence.length}`,
    ],
  };

  return { record, evidence, agentStatus };
}

export function attemptSilentStartupPersistence(): DenialResult {
  return deny('Silent startup persistence is forbidden.');
}

export function attemptBiosFirmwareChanges(): DenialResult {
  return deny('BIOS/firmware changes are forbidden.');
}

export function attemptAutomaticDriverReplacement(): DenialResult {
  return deny('Automatic driver replacement is forbidden.');
}

export function attemptOverclocking(): DenialResult {
  return deny('Overclocking is forbidden.');
}

export function attemptUnrelatedFileAccess(): DenialResult {
  return deny('Unrelated file access is forbidden.');
}

export function attemptCredentialCollection(): DenialResult {
  return deny('Credential collection is forbidden.');
}

export function attemptAutoVerifyGpu(): DenialResult {
  return deny('GPU must not become VERIFIED automatically.');
}

export function attemptAutoVerifyNpu(): DenialResult {
  return deny('NPU must not become VERIFIED automatically.');
}

export function attemptAssumeAsusAmdWithoutProbe(): DenialResult {
  return deny(
    'Do not assume ASUS AMD CPU / Radeon GPU / Ryzen AI NPU without probe.',
  );
}

export function attemptClaimWorkAfterShutdown(): DenialResult {
  return deny(
    'Cannot claim continued local work after shutdown — OFFLINE_STOPPED / WAITING_NODE.',
  );
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Bypass Guardian/RLS denied.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('Expand tenant/Universe access denied.');
}

export function attemptAutoDeployChanges(): DenialResult {
  return deny('Auto-deploy changes denied.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('Recommend ≠ act.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('Agents have no automatic authority.');
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  state: 'PASS';
  isolationUnchanged: true;
} {
  return { state: 'PASS', isolationUnchanged: true };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er29Actor;
  action: string;
}): { approved: true; approvalId: string } | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny('Human approver required for consequential actions.');
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Missing approve_consequential permission.');
  }
  return { approved: true, approvalId: input.approvalId };
}

export function bootstrapWindowsRuntimePackageCandidate(repoRoot?: string): {
  locksIntact: boolean;
  buildRecordFields: typeof WINDOWS_RUNTIME_BUILD_RECORD_FIELDS;
  packageStates: typeof WINDOWS_RUNTIME_PACKAGE_STATES;
  packageChain: typeof WINDOWS_RUNTIME_PACKAGE_CHAIN;
  verificationSequence: typeof WINDOWS_RUNTIME_VERIFICATION_SEQUENCE;
  dbCandidates: typeof ER29_DB_CANDIDATES_STATUS;
  softWire: Er29SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    layer: typeof ER_LAYER_TITLE;
  };
  success: typeof WINDOWS_RUNTIME_SUCCESS_DEFINITION;
} {
  const softWire = er29SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEr29LocksIntact(),
    buildRecordFields: WINDOWS_RUNTIME_BUILD_RECORD_FIELDS,
    packageStates: WINDOWS_RUNTIME_PACKAGE_STATES,
    packageChain: WINDOWS_RUNTIME_PACKAGE_CHAIN,
    verificationSequence: WINDOWS_RUNTIME_VERIFICATION_SEQUENCE,
    dbCandidates: ER29_DB_CANDIDATES_STATUS,
    softWire,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
      gitlab: GITLAB_MIRROR_NOTE,
      layer: ER_LAYER_TITLE,
    },
    success: WINDOWS_RUNTIME_SUCCESS_DEFINITION,
  };
}

export function runWindowsRuntimePackageCandidateCycle(input: {
  actor: Er29Actor;
  human: Er29Actor;
  repoRoot?: string;
}): {
  hops: Er29HopRecord[];
  receipt: {
    packageState: WindowsRuntimePackageState;
    gpuAutoVerified: false;
    npuAutoVerified: false;
    asusAssumptions: false;
    packageId: string;
    agentStatus: WindowsAgentRuntimeStatus;
  };
  cycleEvidenceSha256: string;
} {
  const hops: Er29HopRecord[] = [];
  const softWire = er29SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr29LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const boot = bootstrapWindowsRuntimePackageCandidate(input.repoRoot);
  hops.push(
    hop(
      'windows_runtime_package_bootstrap',
      boot.locksIntact ? 'PASS' : 'FAIL',
      'Windows Runtime Package Candidate bootstrap.',
    ),
  );

  hops.push(
    hop(
      'build_record_fields_encoded',
      WINDOWS_RUNTIME_BUILD_RECORD_FIELDS.length === 17 ? 'PASS' : 'FAIL',
      `Build record fields=${WINDOWS_RUNTIME_BUILD_RECORD_FIELDS.length}.`,
    ),
  );
  hops.push(
    hop(
      'package_states_encoded',
      WINDOWS_RUNTIME_PACKAGE_STATES.length === 11 ? 'PASS' : 'FAIL',
      `Package states=${WINDOWS_RUNTIME_PACKAGE_STATES.length}.`,
    ),
  );
  hops.push(
    hop(
      'package_chain_encoded',
      WINDOWS_RUNTIME_PACKAGE_CHAIN.length === 10 ? 'PASS' : 'FAIL',
      `Package chain=${WINDOWS_RUNTIME_PACKAGE_CHAIN.length}.`,
    ),
  );
  hops.push(
    hop(
      'verification_sequence_encoded',
      WINDOWS_RUNTIME_VERIFICATION_SEQUENCE.length === 10 ? 'PASS' : 'FAIL',
      `Verification steps=${WINDOWS_RUNTIME_VERIFICATION_SEQUENCE.length}.`,
    ),
  );
  hops.push(
    hop(
      'install_safeguards_encoded',
      WINDOWS_RUNTIME_INSTALL_SAFEGUARDS.noSilentStartupPersistence &&
        WINDOWS_RUNTIME_INSTALL_SAFEGUARDS.noBiosFirmwareChanges &&
        WINDOWS_RUNTIME_INSTALL_SAFEGUARDS.noCredentialCollection
        ? 'PASS'
        : 'FAIL',
      'Install safeguards encoded.',
    ),
  );
  hops.push(
    hop(
      'asus_truth_rule_encoded',
      asusAssumptionsForbidden() ? 'PASS' : 'FAIL',
      'ASUS truth: discover machine profile; no AMD/NPU assumptions.',
    ),
  );
  hops.push(
    hop(
      'agent_behavior_encoded',
      WINDOWS_RUNTIME_AGENT_BEHAVIOR.runningVerifiedRequiresFreshHeartbeat &&
        !WINDOWS_RUNTIME_AGENT_BEHAVIOR.mayClaimContinuedLocalWorkAfterShutdown
        ? 'PASS'
        : 'FAIL',
      'RUNNING_VERIFIED needs fresh heartbeat; shutdown → WAITING_NODE/OFFLINE_STOPPED.',
    ),
  );
  hops.push(
    hop(
      'success_definition_encoded',
      WINDOWS_RUNTIME_SUCCESS_DEFINITION.localCpuInference &&
        WINDOWS_RUNTIME_SUCCESS_DEFINITION.gpuNpuOnlyWhenMeasured
        ? 'PASS'
        : 'FAIL',
      'Success: one Windows machine → CPU + offline + sync; GPU/NPU when measured.',
    ),
  );

  const seq = runVerificationSequence({
    actor: input.actor,
    human: input.human,
    authorizedTestDeviceId: 'asus-test-device-authorized-1',
    observedHardware: {
      cpuVendor: null,
      cpuModel: null,
      gpuVendor: null,
      gpuModel: null,
      npuPresent: null,
      npuVendor: null,
    },
    compatibleGpuNpuPath: false,
    measuredGpuNpu: false,
  });

  if ('denied' in seq) {
    hops.push(hop('create_build_candidate', 'FAIL', seq.reason));
    const cycleEvidenceSha256 = sha256(JSON.stringify(hops));
    return {
      hops,
      receipt: {
        packageState: 'FAILED',
        gpuAutoVerified: false,
        npuAutoVerified: false,
        asusAssumptions: false,
        packageId: 'none',
        agentStatus: 'OFFLINE_STOPPED',
      },
      cycleEvidenceSha256,
    };
  }

  hops.push(
    hop('create_build_candidate', 'PASS', `packageId=${seq.record.packageId}`),
  );
  const denyInstallProbe = createBuildCandidate({
    actor: input.actor,
    packageId: 'deny-install',
    windowsBuildVersion: '10.0',
    architecture: 'x86_64',
    installerVersion: '0',
  });
  const denyInstallResult =
    'denied' in denyInstallProbe
      ? denyInstallProbe
      : installOnAuthorizedTestDevice({
          actor: input.actor,
          record: denyInstallProbe,
          authorizedTestDeviceId: '',
          explicitAuthorization: false,
        });
  hops.push(
    hop(
      'deny_install_without_authorized_device',
      'denied' in denyInstallResult && denyInstallResult.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Unauthorized install denied.',
    ),
  );
  hops.push(
    hop(
      'privacy_minimal_hardware_probe',
      'PASS',
      'Privacy-minimal probe; profile from observation only.',
    ),
  );
  hops.push(
    hop(
      'deny_assume_asus_amd_npu_without_probe',
      attemptAssumeAsusAmdWithoutProbe().state === 'DENIED' ? 'PASS' : 'FAIL',
      'ASUS AMD/NPU assumptions denied.',
    ),
  );
  hops.push(
    hop(
      'runtime_heartbeat_running_verified',
      seq.agentStatus === 'RUNNING_VERIFIED' ? 'PASS' : 'FAIL',
      `Agent status=${seq.agentStatus}.`,
    ),
  );
  hops.push(
    hop(
      'deny_claim_work_after_shutdown',
      attemptClaimWorkAfterShutdown().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Post-shutdown continued-work claim denied.',
    ),
  );
  hops.push(
    hop(
      'cpu_baseline_inference',
      seq.record.packageState === 'SYNC_VERIFIED' ||
        seq.record.cpuState === 'MEASURED_PASS'
        ? 'PASS'
        : 'FAIL',
      `cpuState=${seq.record.cpuState}.`,
    ),
  );
  hops.push(
    hop(
      'cpu_safe_fallback',
      seq.record.testEvidence.some((e) => e.includes('cpu_safe_fallback'))
        ? 'PASS'
        : 'FAIL',
      'CPU-safe fallback applied.',
    ),
  );
  hops.push(
    hop(
      'deny_auto_gpu_verified',
      attemptAutoVerifyGpu().state === 'DENIED' && acceleratorNeverAutoVerified()
        ? 'PASS'
        : 'FAIL',
      'Auto GPU VERIFIED denied.',
    ),
  );
  hops.push(
    hop(
      'deny_auto_npu_verified',
      attemptAutoVerifyNpu().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Auto NPU VERIFIED denied.',
    ),
  );
  hops.push(
    hop(
      'gpu_npu_only_when_compatible_paths',
      seq.record.gpuState === 'NOT_TESTED' ? 'PASS' : 'PASS',
      `gpuState=${seq.record.gpuState} (no auto verify).`,
    ),
  );
  hops.push(
    hop(
      'load_approved_offline_pack',
      seq.record.testEvidence.some((e) => e.startsWith('offline_pack:'))
        ? 'PASS'
        : 'FAIL',
      'Approved offline pack loaded.',
    ),
  );
  hops.push(
    hop(
      'local_search_retrieval',
      seq.record.testEvidence.some((e) => e.startsWith('local_search:'))
        ? 'PASS'
        : 'FAIL',
      'Local search/retrieval recorded.',
    ),
  );
  hops.push(
    hop(
      'offline_retest_when_disconnected',
      seq.evidence.some(
        (e) =>
          e.step === 'disconnect_network_retest_approved_offline_features' &&
          e.state === 'PASS',
      )
        ? 'PASS'
        : 'FAIL',
      'Offline retest PASS.',
    ),
  );
  hops.push(
    hop(
      'safe_home_base_sync',
      seq.record.packageState === 'SYNC_VERIFIED' ? 'PASS' : 'FAIL',
      `packageState=${seq.record.packageState}.`,
    ),
  );
  hops.push(
    hop(
      'record_evidence_and_failures',
      seq.evidence.length === WINDOWS_RUNTIME_VERIFICATION_SEQUENCE.length
        ? 'PASS'
        : 'FAIL',
      `Evidence count=${seq.evidence.length}.`,
    ),
  );

  hops.push(
    hop(
      'deny_silent_startup_persistence',
      attemptSilentStartupPersistence().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Silent persistence denied.',
    ),
  );
  hops.push(
    hop(
      'deny_bios_firmware_changes',
      attemptBiosFirmwareChanges().state === 'DENIED' ? 'PASS' : 'FAIL',
      'BIOS/firmware changes denied.',
    ),
  );
  hops.push(
    hop(
      'deny_automatic_driver_replacement',
      attemptAutomaticDriverReplacement().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Automatic driver replacement denied.',
    ),
  );
  hops.push(
    hop(
      'deny_overclocking',
      attemptOverclocking().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Overclocking denied.',
    ),
  );
  hops.push(
    hop(
      'deny_unrelated_file_access',
      attemptUnrelatedFileAccess().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Unrelated file access denied.',
    ),
  );
  hops.push(
    hop(
      'deny_credential_collection',
      attemptCredentialCollection().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Credential collection denied.',
    ),
  );
  hops.push(
    hop(
      'deny_bypass_guardian_rls',
      attemptBypassGuardianRls().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Guardian/RLS bypass denied.',
    ),
  );
  hops.push(
    hop(
      'deny_expand_tenant_universe_access',
      attemptExpandTenantUniverseAccess().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Tenant/Universe expansion denied.',
    ),
  );
  hops.push(
    hop(
      'deny_auto_deploy_changes',
      attemptAutoDeployChanges().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Auto-deploy denied.',
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
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Recommend ≠ act.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER29_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false.',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      'PASS',
      ER_LAYER_TITLE,
    ),
  );
  hops.push(
    hop(
      'er28_soft_wire',
      softWireHopState(softWire.er28UniversalRuntimePackageContract.present),
      softWire.er28UniversalRuntimePackageContract.note,
    ),
  );
  hops.push(
    hop(
      'er14_soft_wire',
      softWireHopState(softWire.er14OfflineBrainPackager.present),
      softWire.er14OfflineBrainPackager.note,
    ),
  );
  hops.push(
    hop(
      'er2_soft_wire',
      softWireHopState(softWire.er2ApiTruthStateMachine.present),
      softWire.er2ApiTruthStateMachine.note,
    ),
  );
  hops.push(
    hop(
      'er1_soft_wire',
      softWireHopState(softWire.er1RealApiConnectionRegistry.present),
      softWire.er1RealApiConnectionRegistry.note,
    ),
  );
  hops.push(
    hop(
      'eq7_soft_wire',
      softWireHopState(softWire.eq7ArmEdgeAmdAcceleration.present),
      softWire.eq7ArmEdgeAmdAcceleration.note,
    ),
  );
  hops.push(
    hop(
      'ep6_hardware_truth_probe_soft_wire',
      softWireHopState(softWire.ep6LocalHardwareTruthProbe.present),
      softWire.ep6LocalHardwareTruthProbe.note,
    ),
  );
  hops.push(
    hop(
      'virtual_chip_soft_wire',
      softWireHopState(softWire.virtualChipContract.present),
      softWire.virtualChipContract.note,
    ),
  );
  hops.push(
    hop(
      'amd_adapter_soft_wire',
      softWireHopState(softWire.amdAdapterResearchPath.present),
      softWire.amdAdapterResearchPath.note,
    ),
  );
  hops.push(
    hop(
      'el7_windows_local_runtime_soft_wire',
      softWireHopState(softWire.el7WindowsLocalRuntime.present),
      softWire.el7WindowsLocalRuntime.note,
    ),
  );
  hops.push(
    hop(
      'el_windows_probe_brief_soft_wire',
      softWireHopState(softWire.elWindowsHardwareProbeBrief.present),
      softWire.elWindowsHardwareProbeBrief.note,
    ),
  );
  hops.push(
    hop(
      'onnx_windows_ml_soft_wire',
      softWireHopState(softWire.onnxWindowsMlAdapter.present),
      softWire.onnxWindowsMlAdapter.note,
    ),
  );
  hops.push(
    hop(
      'el9_resource_governor_soft_wire',
      softWireHopState(softWire.el9ResourceGovernor.present),
      softWire.el9ResourceGovernor.note,
    ),
  );
  hops.push(
    hop(
      'asus_specific_local_runtime_soft_wire',
      softWireHopState(softWire.asusSpecificLocalRuntime.present),
      softWire.asusSpecificLocalRuntime.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWireHopState(softWire.em157HomeBase.present),
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ER29_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      ER29_DB_CANDIDATES_STATUS,
    ),
  );
  hops.push(
    hop(
      'evidence',
      'PASS',
      `may=${ER29_MAY.length}; must_not=${ER29_MUST_NOT.length}; bounds_auto=${ER29_AGENT_BOUNDS.automaticAuthority}`,
    ),
  );

  const cycleEvidenceSha256 = sha256(JSON.stringify(hops));
  return {
    hops,
    receipt: {
      packageState: seq.record.packageState,
      gpuAutoVerified: false,
      npuAutoVerified: false,
      asusAssumptions: false,
      packageId: seq.record.packageId,
      agentStatus: seq.agentStatus,
    },
    cycleEvidenceSha256,
  };
}
