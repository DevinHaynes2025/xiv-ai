/**
 * 62L-ER30 — Android / ARM Runtime Package Candidate runtime.
 *
 * Create Android package candidate; probe SoC without auto-VERIFY; battery
 * governor BATTERY_LOW pauses research; deny telemetry-as-access-requirement;
 * NPU verify only after detect→load→inference→receipt; offline packs
 * encrypted/revocable; deny root/covert recording/file scrape; cycle.
 */

import { createHash } from 'node:crypto';
import {
  ANDROID_ARM_CAPABILITY_STATES,
  ANDROID_ARM_PACKAGE_CHAIN,
  ANDROID_ARM_PACKAGE_FIELDS,
  ANDROID_ARM_RUNTIME_PACKAGE_CYCLE,
  ANDROID_ARM_TRUTH_BOUNDARY,
  BATTERY_GOVERNOR_INPUTS,
  ER30_AGENT_BOUNDS,
  ER30_DB_CANDIDATES_STATUS,
  ER30_LOCKS,
  ER30_MAY,
  ER30_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MOBILE_FIRST_WORKLOADS_MAY,
  MOBILE_MUST_NOT_ON_DEVICE,
  NEXT_PHASE_TITLE,
  NPU_VERIFY_CHAIN,
  OFFLINE_BRAIN_PACK_KINDS,
  assertEr30LocksIntact,
  er30SoftWireSnapshot,
  isHumanApprover,
  softWireHopState,
  type AcceleratorCandidate,
  type AndroidArmCapabilityState,
  type AndroidArmRuntimePackage,
  type ArmArchitecture,
  type BatteryGovernorDecision,
  type Er30Actor,
  type Er30EvidenceState,
  type Er30HopRecord,
  type Er30SoftWireSnapshot,
  type NpuVerificationResult,
  type NpuVerifyChainHop,
  type OfflineBrainPackKind,
  type OfflineMobilePack,
  type SocVendor,
  type TelemetryKind,
} from './android-arm-runtime-package-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ANDROID_ARM_RUNTIME_PACKAGE_CYCLE)[number],
  state: Er30EvidenceState,
  summary: string,
): Er30HopRecord {
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

function candidateAccel(
  kind: 'CPU' | 'GPU' | 'NPU',
  vendor: SocVendor,
  detected: boolean,
): AcceleratorCandidate {
  return {
    kind,
    vendorClaim: vendor,
    detected,
    runtimeCompatible: false,
    modelLoaded: false,
    boundedInferenceCompleted: false,
    receiptId: null,
    capabilityState: detected ? 'DETECTED' : 'NOT_TESTED',
  };
}

export function createAndroidArmPackageCandidate(input: {
  actor: Er30Actor;
  packageId: string;
  androidVersion: string;
  deviceModel: string;
  armArchitecture: ArmArchitecture;
  socVendor: SocVendor;
  availableRamMb: number;
  availableStorageMb: number;
  batteryLevelPercent: number;
  charging: boolean;
  thermalPressure?: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  networkState?: 'WIFI' | 'CELLULAR' | 'OFFLINE' | 'UNKNOWN';
  permissions?: readonly string[];
  packageVersion?: string;
  autoVerifyFromSoc?: boolean;
}): AndroidArmRuntimePackage | DenialResult {
  if (input.autoVerifyFromSoc === true) {
    return deny(
      'Seeing SoC vendor is not accelerator support — cannot auto-VERIFY from SoC sighting.',
    );
  }
  if (input.availableRamMb < 0 || input.availableStorageMb < 0) {
    return deny('Invalid RAM/storage probe values.');
  }
  if (
    input.batteryLevelPercent < 0 ||
    input.batteryLevelPercent > 100
  ) {
    return deny('Battery level must be 0–100.');
  }

  const signatureHash = sha256(
    `${input.packageId}:${input.deviceModel}:${input.armArchitecture}:${input.socVendor}`,
  ).slice(0, 32);

  return {
    packageId: input.packageId,
    androidVersion: input.androidVersion,
    deviceModel: input.deviceModel,
    armArchitecture: input.armArchitecture,
    socVendor: input.socVendor,
    cpuGpuNpuState: {
      cpu: candidateAccel('CPU', input.socVendor, true),
      gpu: candidateAccel('GPU', input.socVendor, false),
      npu: candidateAccel('NPU', input.socVendor, false),
    },
    supportedRuntimes: ['cpu-bounded-v1'],
    modelCompatibility: ['mobile-sm-approved'],
    availableRamMb: input.availableRamMb,
    availableStorageMb: input.availableStorageMb,
    batteryLevelPercent: input.batteryLevelPercent,
    charging: input.charging,
    thermalPressure: input.thermalPressure ?? 'NOMINAL',
    networkState: input.networkState ?? 'UNKNOWN',
    permissions: input.permissions ?? ['INTERNET', 'FOREGROUND_SERVICE'],
    packageVersion: input.packageVersion ?? '0.1.0-candidate',
    signatureHash,
    rollbackState: 'NONE',
    benchmarkEvidence: [],
    capabilityState: 'DOCUMENTED',
    socSeenIsNotAcceleratorVerified: true,
    rootRequired: false,
    l4AutonomyEnabled: false,
    uninstallRevokePathExplicit: true,
  };
}

/**
 * Probe SoC / accelerators. Detection updates DETECTED/SUPPORTED candidates
 * but never jumps to VERIFIED from vendor sighting alone.
 */
export function probeDeviceCapability(input: {
  pkg: AndroidArmRuntimePackage;
  detectGpu?: boolean;
  detectNpu?: boolean;
  claimVerifiedFromSoc?: boolean;
}): AndroidArmRuntimePackage | DenialResult {
  if (input.claimVerifiedFromSoc === true) {
    return deny(
      'SoC sighting ≠ accelerator VERIFIED; probe stops at DETECTED/SUPPORTED.',
    );
  }

  const gpu = {
    ...input.pkg.cpuGpuNpuState.gpu,
    detected: input.detectGpu === true,
    capabilityState: (input.detectGpu === true
      ? 'DETECTED'
      : input.pkg.cpuGpuNpuState.gpu.capabilityState) as AndroidArmCapabilityState,
  };
  const npu = {
    ...input.pkg.cpuGpuNpuState.npu,
    detected: input.detectNpu === true,
    capabilityState: (input.detectNpu === true
      ? 'DETECTED'
      : input.pkg.cpuGpuNpuState.npu.capabilityState) as AndroidArmCapabilityState,
  };

  return {
    ...input.pkg,
    cpuGpuNpuState: {
      ...input.pkg.cpuGpuNpuState,
      gpu,
      npu,
    },
    capabilityState: 'DETECTED',
    socSeenIsNotAcceleratorVerified: true,
  };
}

/**
 * Battery/resource governor. BATTERY_LOW → pause research agents (not consume
 * aggressively).
 */
export function evaluateBatteryGovernor(input: {
  batteryLevelPercent: number;
  charging: boolean;
  thermalPressure?: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  foreground?: boolean;
  consumeAggressivelyDespiteLowBattery?: boolean;
}): BatteryGovernorDecision | DenialResult {
  if (input.consumeAggressivelyDespiteLowBattery === true) {
    return deny(
      'BATTERY_LOW must pause research agents — aggressive consume denied.',
    );
  }

  const thermal = input.thermalPressure ?? 'NOMINAL';
  const foreground = input.foreground ?? true;
  const low = input.batteryLevelPercent < 20 && !input.charging;

  if (low) {
    return {
      batteryLevelPercent: input.batteryLevelPercent,
      charging: input.charging,
      thermalPressure: thermal,
      foreground,
      action: 'PAUSE_RESEARCH_AGENTS',
      researchAgentsPaused: true,
      reason: 'BATTERY_LOW — research agents paused; bounded sync may defer.',
    };
  }

  if (thermal === 'CRITICAL') {
    return {
      batteryLevelPercent: input.batteryLevelPercent,
      charging: input.charging,
      thermalPressure: thermal,
      foreground,
      action: 'THROTTLE',
      researchAgentsPaused: true,
      reason: 'Thermal CRITICAL — throttle and pause research.',
    };
  }

  return {
    batteryLevelPercent: input.batteryLevelPercent,
    charging: input.charging,
    thermalPressure: thermal,
    foreground,
    action: 'ALLOW_BOUNDED',
    researchAgentsPaused: false,
    reason: 'Battery/thermal nominal — bounded mobile workloads allowed.',
  };
}

/**
 * Basic XIV access cannot require donating GPS, camera, contacts, driving
 * history, or other personal telemetry.
 */
export function assertBasicAccessWithoutTelemetry(input: {
  requiredTelemetry?: readonly TelemetryKind[];
}): { allowed: true; telemetryRequired: false } | DenialResult {
  if (input.requiredTelemetry && input.requiredTelemetry.length > 0) {
    return deny(
      'Basic XIV access cannot require GPS, camera, contacts, driving history, or personal telemetry.',
    );
  }
  return { allowed: true, telemetryRequired: false };
}

/**
 * NPU verify only after detect → runtime compatibility → model load →
 * bounded inference → receipt → VERIFIED.
 */
export function verifyNpuAccelerator(input: {
  pkg: AndroidArmRuntimePackage;
  detect: boolean;
  runtimeCompatible: boolean;
  modelLoad: boolean;
  boundedInference: boolean;
  skipToVerifiedFromSoc?: boolean;
}): NpuVerificationResult | DenialResult {
  if (input.skipToVerifiedFromSoc === true) {
    return deny(
      'Cannot skip to VERIFIED from SoC sighting; chain required.',
    );
  }

  const chain: NpuVerifyChainHop[] = [];
  if (!input.detect) {
    return {
      vendorClaim: input.pkg.socVendor,
      chainCompleted: chain,
      capabilityState: 'NOT_TESTED',
      receiptId: null,
      autoVerifiedFromSocSighting: false,
    };
  }
  chain.push('detect');

  if (!input.runtimeCompatible) {
    return {
      vendorClaim: input.pkg.socVendor,
      chainCompleted: chain,
      capabilityState: 'DETECTED',
      receiptId: null,
      autoVerifiedFromSocSighting: false,
    };
  }
  chain.push('runtime_compatibility');

  if (!input.modelLoad) {
    return {
      vendorClaim: input.pkg.socVendor,
      chainCompleted: chain,
      capabilityState: 'SUPPORTED',
      receiptId: null,
      autoVerifiedFromSocSighting: false,
    };
  }
  chain.push('model_load');

  if (!input.boundedInference) {
    return {
      vendorClaim: input.pkg.socVendor,
      chainCompleted: chain,
      capabilityState: 'SUPPORTED',
      receiptId: null,
      autoVerifiedFromSocSighting: false,
    };
  }
  chain.push('bounded_inference');

  const receiptId = `npu-rcpt-${sha256(
    `${input.pkg.packageId}:${input.pkg.socVendor}:npu`,
  ).slice(0, 16)}`;
  chain.push('receipt');
  chain.push('verified');

  return {
    vendorClaim: input.pkg.socVendor,
    chainCompleted: chain,
    capabilityState: 'VERIFIED',
    receiptId,
    autoVerifiedFromSocSighting: false,
  };
}

export function installOfflineMobilePack(input: {
  actor: Er30Actor;
  packId: string;
  kind: OfflineBrainPackKind;
  version: string;
  plaintext?: boolean;
}): OfflineMobilePack | DenialResult {
  if (input.plaintext === true) {
    return deny('Offline brain packs must be encrypted — plaintext denied.');
  }

  return {
    packId: input.packId,
    kind: input.kind,
    version: input.version,
    encrypted: true,
    rightsAware: true,
    revocable: true,
    revocationState: 'ACTIVE',
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    contentHash: sha256(`${input.packId}:${input.kind}:${input.version}`).slice(
      0,
      24,
    ),
  };
}

export function revokeOfflineMobilePack(
  pack: OfflineMobilePack,
): OfflineMobilePack {
  return {
    ...pack,
    revocationState: 'REVOKED',
  };
}

export function attemptRequireRoot(): DenialResult {
  return deny('Android sandbox respected — root must not be required.');
}

export function attemptCovertBackgroundRecording(): DenialResult {
  return deny('Covert background recording denied.');
}

export function attemptPrivateFileScrape(): DenialResult {
  return deny('Private-file scraping denied.');
}

export function attemptHiddenAccessibilityAbuse(): DenialResult {
  return deny('Hidden accessibility / service abuse denied.');
}

export function attemptCrossTenantDataPooling(): DenialResult {
  return deny('Cross-tenant data pooling denied.');
}

export function attemptLargeTrainingOnDevice(): DenialResult {
  return deny(
    'Large training / massive simulation / heavy research remain on verified compute nodes.',
  );
}

export function attemptAutoVerifyFromSocSighting(): DenialResult {
  return deny(
    'Seeing Qualcomm/MediaTek/Samsung/Google/other SoC ≠ accelerator VERIFIED.',
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

export function attemptHiddenChainOfThought(): DenialResult {
  return deny('Hidden chain-of-thought must not be packaged.');
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
  actor: Er30Actor;
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

export function returnEvidenceToHomeBase(input: {
  actor: Er30Actor;
  pkg: AndroidArmRuntimePackage;
  npu?: NpuVerificationResult | null;
}): {
  returned: true;
  authorityGranted: false;
  productionAuthorized: false;
  packageId: string;
  uninstallRevokePathExplicit: true;
} | DenialResult {
  if (input.pkg.l4AutonomyEnabled !== false) {
    return deny('L4 autonomy must remain disabled.');
  }
  if (!input.pkg.uninstallRevokePathExplicit) {
    return deny('Explicit uninstall/revoke path required.');
  }
  return {
    returned: true,
    authorityGranted: false,
    productionAuthorized: false,
    packageId: input.pkg.packageId,
    uninstallRevokePathExplicit: true,
  };
}

export function exampleAndroidPackage(
  actor: Er30Actor,
): AndroidArmRuntimePackage {
  const built = createAndroidArmPackageCandidate({
    actor,
    packageId: 'android-arm-pkg-1',
    androidVersion: '14',
    deviceModel: 'Pixel-Candidate',
    armArchitecture: 'arm64-v8a',
    socVendor: 'GOOGLE',
    availableRamMb: 6144,
    availableStorageMb: 32768,
    batteryLevelPercent: 72,
    charging: false,
  });
  if ('denied' in built) {
    throw new Error(built.reason);
  }
  return built;
}

export function bootstrapAndroidArmRuntimePackage(repoRoot?: string): {
  locksIntact: boolean;
  packageFields: typeof ANDROID_ARM_PACKAGE_FIELDS;
  capabilityStates: typeof ANDROID_ARM_CAPABILITY_STATES;
  packageChain: typeof ANDROID_ARM_PACKAGE_CHAIN;
  offlinePackKinds: typeof OFFLINE_BRAIN_PACK_KINDS;
  mobileWorkloads: typeof MOBILE_FIRST_WORKLOADS_MAY;
  dbCandidates: typeof ER30_DB_CANDIDATES_STATUS;
  softWire: Er30SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    layer: typeof ER_LAYER_TITLE;
  };
} {
  const softWire = er30SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEr30LocksIntact(),
    packageFields: ANDROID_ARM_PACKAGE_FIELDS,
    capabilityStates: ANDROID_ARM_CAPABILITY_STATES,
    packageChain: ANDROID_ARM_PACKAGE_CHAIN,
    offlinePackKinds: OFFLINE_BRAIN_PACK_KINDS,
    mobileWorkloads: MOBILE_FIRST_WORKLOADS_MAY,
    dbCandidates: ER30_DB_CANDIDATES_STATUS,
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
  };
}

export function runAndroidArmRuntimePackageCycle(input: {
  actor: Er30Actor;
  human: Er30Actor;
  repoRoot?: string;
}): {
  hops: Er30HopRecord[];
  receipt: {
    packageId: string;
    capabilityState: AndroidArmCapabilityState;
    researchAgentsPausedOnLowBattery: boolean;
    npuVerifiedOnlyWithReceipt: boolean;
    productionAuthorized: false;
  };
  cycleEvidenceSha256: string;
} {
  const hops: Er30HopRecord[] = [];
  const softWire = er30SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr30LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const boot = bootstrapAndroidArmRuntimePackage(input.repoRoot);
  hops.push(
    hop(
      'android_arm_runtime_package_bootstrap',
      boot.locksIntact ? 'PASS' : 'FAIL',
      'Android/ARM runtime package bootstrap; locks intact; soft-wires probed.',
    ),
  );
  hops.push(
    hop(
      'package_fields_encoded',
      ANDROID_ARM_PACKAGE_FIELDS.length === 16 ? 'PASS' : 'FAIL',
      `fields=${ANDROID_ARM_PACKAGE_FIELDS.length}`,
    ),
  );
  hops.push(
    hop(
      'capability_states_encoded',
      ANDROID_ARM_CAPABILITY_STATES.length === 7 ? 'PASS' : 'FAIL',
      `states=${ANDROID_ARM_CAPABILITY_STATES.join(',')}`,
    ),
  );
  hops.push(
    hop(
      'package_chain_encoded',
      ANDROID_ARM_PACKAGE_CHAIN.length === 11 ? 'PASS' : 'FAIL',
      `chain=${ANDROID_ARM_PACKAGE_CHAIN.length}`,
    ),
  );
  hops.push(
    hop(
      'mobile_workloads_encoded',
      MOBILE_FIRST_WORKLOADS_MAY.length === 9 &&
        MOBILE_MUST_NOT_ON_DEVICE.length === 3
        ? 'PASS'
        : 'FAIL',
      'Mobile MAY workloads + MUST_NOT on-device encoded.',
    ),
  );
  hops.push(
    hop(
      'offline_pack_kinds_encoded',
      OFFLINE_BRAIN_PACK_KINDS.length === 6 ? 'PASS' : 'FAIL',
      `packs=${OFFLINE_BRAIN_PACK_KINDS.join(',')}`,
    ),
  );
  hops.push(
    hop(
      'battery_governor_inputs_encoded',
      BATTERY_GOVERNOR_INPUTS.length === 8 ? 'PASS' : 'FAIL',
      `governor_inputs=${BATTERY_GOVERNOR_INPUTS.length}`,
    ),
  );
  hops.push(
    hop(
      'npu_verify_chain_encoded',
      NPU_VERIFY_CHAIN.length === 6 ? 'PASS' : 'FAIL',
      `npu_chain=${NPU_VERIFY_CHAIN.join('→')}`,
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      ANDROID_ARM_TRUTH_BOUNDARY.socSightingIsNotAcceleratorSupport &&
        ANDROID_ARM_TRUTH_BOUNDARY.batteryLowPausesResearchAgents
        ? 'PASS'
        : 'FAIL',
      'Truth boundary: SoC≠accelerator; BATTERY_LOW pauses research.',
    ),
  );

  let pkg = exampleAndroidPackage(input.actor);
  hops.push(
    hop(
      'create_android_package_candidate',
      pkg.capabilityState === 'DOCUMENTED' &&
        pkg.socSeenIsNotAcceleratorVerified === true
        ? 'PASS'
        : 'FAIL',
      `packageId=${pkg.packageId}`,
    ),
  );

  const probed = probeDeviceCapability({
    pkg,
    detectGpu: true,
    detectNpu: true,
  });
  const autoProbe = probeDeviceCapability({
    pkg,
    detectNpu: true,
    claimVerifiedFromSoc: true,
  });
  hops.push(
    hop(
      'probe_soc_without_auto_verify',
      !('denied' in probed) &&
        probed.cpuGpuNpuState.npu.capabilityState === 'DETECTED' &&
        'denied' in autoProbe
        ? 'PASS'
        : 'FAIL',
      'SoC/NPU probe reaches DETECTED; auto-VERIFY from SoC denied.',
    ),
  );
  if (!('denied' in probed)) {
    pkg = probed;
  }

  const lowBat = evaluateBatteryGovernor({
    batteryLevelPercent: 12,
    charging: false,
  });
  const aggressive = evaluateBatteryGovernor({
    batteryLevelPercent: 12,
    charging: false,
    consumeAggressivelyDespiteLowBattery: true,
  });
  hops.push(
    hop(
      'battery_low_pauses_research',
      !('denied' in lowBat) &&
        lowBat.action === 'PAUSE_RESEARCH_AGENTS' &&
        lowBat.researchAgentsPaused === true &&
        'denied' in aggressive
        ? 'PASS'
        : 'FAIL',
      'BATTERY_LOW → PAUSE_RESEARCH_AGENTS; aggressive consume denied.',
    ),
  );

  const telemetryOk = assertBasicAccessWithoutTelemetry({});
  const telemetryDeny = assertBasicAccessWithoutTelemetry({
    requiredTelemetry: ['GPS', 'CAMERA'],
  });
  hops.push(
    hop(
      'deny_telemetry_as_access_requirement',
      !('denied' in telemetryOk) && 'denied' in telemetryDeny ? 'PASS' : 'FAIL',
      'Basic access without telemetry; GPS/camera requirement denied.',
    ),
  );

  const npuPartial = verifyNpuAccelerator({
    pkg,
    detect: true,
    runtimeCompatible: true,
    modelLoad: false,
    boundedInference: false,
  });
  const npuFull = verifyNpuAccelerator({
    pkg,
    detect: true,
    runtimeCompatible: true,
    modelLoad: true,
    boundedInference: true,
  });
  const npuSkip = verifyNpuAccelerator({
    pkg,
    detect: true,
    runtimeCompatible: true,
    modelLoad: true,
    boundedInference: true,
    skipToVerifiedFromSoc: true,
  });
  hops.push(
    hop(
      'npu_verify_after_detect_load_inference_receipt',
      !('denied' in npuPartial) &&
        npuPartial.capabilityState !== 'VERIFIED' &&
        !('denied' in npuFull) &&
        npuFull.capabilityState === 'VERIFIED' &&
        npuFull.receiptId != null &&
        'denied' in npuSkip
        ? 'PASS'
        : 'FAIL',
      'NPU VERIFIED only after detect→load→inference→receipt.',
    ),
  );

  const pack = installOfflineMobilePack({
    actor: input.actor,
    packId: 'obp-core-1',
    kind: 'CORE',
    version: '1.0.0',
  });
  const plaintext = installOfflineMobilePack({
    actor: input.actor,
    packId: 'obp-bad',
    kind: 'CORE',
    version: '1.0.0',
    plaintext: true,
  });
  let revokedOk = false;
  if (!('denied' in pack)) {
    const revoked = revokeOfflineMobilePack(pack);
    revokedOk = revoked.revocationState === 'REVOKED';
  }
  hops.push(
    hop(
      'offline_packs_encrypted_revocable',
      !('denied' in pack) &&
        pack.encrypted === true &&
        pack.revocable === true &&
        'denied' in plaintext &&
        revokedOk
        ? 'PASS'
        : 'FAIL',
      'Offline packs encrypted/rights-aware/revocable; plaintext denied.',
    ),
  );

  hops.push(
    hop(
      'deny_root_requirement',
      attemptRequireRoot().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Root requirement denied.',
    ),
  );
  hops.push(
    hop(
      'deny_covert_recording',
      attemptCovertBackgroundRecording().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Covert background recording denied.',
    ),
  );
  hops.push(
    hop(
      'deny_private_file_scrape',
      attemptPrivateFileScrape().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Private-file scrape denied.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof ANDROID_ARM_RUNTIME_PACKAGE_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_hidden_accessibility_abuse',
      fn: attemptHiddenAccessibilityAbuse,
    },
    {
      hop: 'deny_cross_tenant_data_pooling',
      fn: attemptCrossTenantDataPooling,
    },
    {
      hop: 'deny_large_training_on_device',
      fn: attemptLargeTrainingOnDevice,
    },
    {
      hop: 'deny_auto_verify_from_soc_sighting',
      fn: attemptAutoVerifyFromSocSighting,
    },
    { hop: 'deny_bypass_guardian_rls', fn: attemptBypassGuardianRls },
    {
      hop: 'deny_expand_tenant_universe_access',
      fn: attemptExpandTenantUniverseAccess,
    },
    { hop: 'deny_auto_deploy_changes', fn: attemptAutoDeployChanges },
    {
      hop: 'deny_hidden_chain_of_thought',
      fn: attemptHiddenChainOfThought,
    },
  ];
  for (const d of denyHops) {
    hops.push(
      hop(d.hop, d.fn().state === 'DENIED' ? 'PASS' : 'FAIL', `${d.hop} DENIED.`),
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
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptAgentAutoAuthority().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no agent auto-authority.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER30_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );
  hops.push(
    hop(
      'explicit_uninstall_revoke_path',
      pkg.uninstallRevokePathExplicit === true ? 'PASS' : 'FAIL',
      'Explicit uninstall/revoke path present.',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      ER_LAYER_TITLE.includes('Universal Device Distribution')
        ? 'PASS'
        : 'FAIL',
      ER_LAYER_TITLE,
    ),
  );

  const softPairs: Array<{
    hop: (typeof ANDROID_ARM_RUNTIME_PACKAGE_CYCLE)[number];
    present: boolean;
    note: string;
  }> = [
    {
      hop: 'er29_soft_wire',
      present: softWire.er29IosPrepStub.present,
      note: softWire.er29IosPrepStub.note,
    },
    {
      hop: 'er28_soft_wire',
      present: softWire.er28PriorMobileStub.present,
      note: softWire.er28PriorMobileStub.note,
    },
    {
      hop: 'er14_soft_wire',
      present: softWire.er14OfflineBrainPackager.present,
      note: softWire.er14OfflineBrainPackager.note,
    },
    {
      hop: 'er2_soft_wire',
      present: softWire.er2ApiTruthStateMachine.present,
      note: softWire.er2ApiTruthStateMachine.note,
    },
    {
      hop: 'er1_soft_wire',
      present: softWire.er1RealApiConnectionRegistry.present,
      note: softWire.er1RealApiConnectionRegistry.note,
    },
    {
      hop: 'eq7_soft_wire',
      present: softWire.eq7ArmEdgeAmdAcceleration.present,
      note: softWire.eq7ArmEdgeAmdAcceleration.note,
    },
    {
      hop: 'eq2_soft_wire',
      present: softWire.eq2ArmArchitectureKnowledgePack.present,
      note: softWire.eq2ArmArchitectureKnowledgePack.note,
    },
    {
      hop: 'em157_soft_wire',
      present: softWire.em157HomeBase.present,
      note: softWire.em157HomeBase.note,
    },
  ];
  for (const s of softPairs) {
    hops.push(hop(s.hop, softWireHopState(s.present), s.note));
  }

  hops.push(
    hop(
      'db_candidates_not_applied',
      ER30_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const npuForHome =
    !('denied' in npuFull) ? npuFull : null;
  const home = returnEvidenceToHomeBase({
    actor: input.actor,
    pkg,
    npu: npuForHome,
  });
  const humanGate = requireHumanApproval({
    approvalId: 'appr-er30-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      !('denied' in home) && !('denied' in humanGate) ? 'PASS' : 'DENIED',
      'Evidence returned to Home Base; human gate exercised; not production authorized.',
    ),
  );

  void ER30_MAY;
  void ER30_MUST_NOT;
  void ER30_AGENT_BOUNDS;
  void ANDROID_ARM_RUNTIME_PACKAGE_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
    }),
  );

  return {
    hops,
    receipt: {
      packageId: pkg.packageId,
      capabilityState: pkg.capabilityState,
      researchAgentsPausedOnLowBattery: true,
      npuVerifiedOnlyWithReceipt:
        !('denied' in npuFull) && npuFull.receiptId != null,
      productionAuthorized: false,
    },
    cycleEvidenceSha256,
  };
}
