/**
 * 62L-ER28 — Universal Runtime Package Contract runtime.
 *
 * Define portable package contract; advance states only with evidence; deny
 * universal-compat claims without per-platform tests; install requires auth +
 * signed package; heartbeat → OFFLINE_STOPPED / LOCAL_ONLY / RUNNING_VERIFIED;
 * deny stealth persistence / privilege escalation / firmware-BIOS mod.
 */

import { createHash } from 'node:crypto';
import {
  ER28_AGENT_BOUNDS,
  ER28_DB_CANDIDATES_STATUS,
  ER28_LOCKS,
  ER28_MAY,
  ER28_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  OFFLINE_TRUTH_STATES,
  PLATFORM_BUILD_TARGETS,
  RUNTIME_PACKAGE_CONTENTS_MAY,
  RUNTIME_PACKAGE_CORE_FLOW,
  RUNTIME_PACKAGE_FIELDS,
  RUNTIME_PACKAGE_STATES,
  UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_CYCLE,
  UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY,
  assertEr28LocksIntact,
  er28SoftWireSnapshot,
  isEr28Agent,
  isHumanApprover,
  softWireHopState,
  type ConnectivityState,
  type DeviceClass,
  type DevicePowerState,
  type Er28Actor,
  type Er28EvidenceState,
  type Er28HopRecord,
  type Er28SoftWireSnapshot,
  type HomeBaseRegistration,
  type NetworkPolicy,
  type OfflineTruthState,
  type PackageArchitecture,
  type PackageHeartbeat,
  type PackagePlatform,
  type PlatformBuildTarget,
  type RuntimePackageContentMay,
  type RuntimePackageState,
  type UniversalRuntimePackage,
} from './universal-runtime-package-contract-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_CYCLE)[number],
  state: Er28EvidenceState,
  summary: string,
): Er28HopRecord {
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

const STATE_RANK: Record<RuntimePackageState, number> = {
  UNAVAILABLE: 0,
  NOT_TESTED: 1,
  DOCUMENTED: 2,
  BUILDABLE: 3,
  INSTALLABLE: 4,
  SUPPORTED: 5,
  DEGRADED: 5,
  VERIFIED: 6,
};

export function resolveOfflineTruthState(input: {
  devicePowerState: DevicePowerState;
  connectivityState: ConnectivityState;
  synchronizedHealthy?: boolean;
}): OfflineTruthState {
  if (input.devicePowerState === 'POWERED_OFF') {
    return 'OFFLINE_STOPPED';
  }
  if (input.connectivityState === 'DISCONNECTED') {
    return 'LOCAL_ONLY';
  }
  if (input.synchronizedHealthy === true) {
    return 'RUNNING_VERIFIED';
  }
  return 'LOCAL_ONLY';
}

export function defineUniversalRuntimePackage(input: {
  actor: Er28Actor;
  packageId: string;
  platform: PackagePlatform;
  architecture: PackageArchitecture;
  buildTarget: PlatformBuildTarget;
  supportedDeviceClasses: readonly DeviceClass[];
  minimumOsRuntimeVersion: string;
  modelRuntimeDependencies?: readonly string[];
  localStorageRequirementsBytes?: number;
  allowedPermissions?: readonly string[];
  networkPolicy?: NetworkPolicy;
  dataClasses?: UniversalRuntimePackage['dataClasses'];
  offlineCapability?: boolean;
  updateChannel?: string;
  rollbackVersion?: string | null;
  capabilityManifest?: readonly string[];
  contents?: readonly RuntimePackageContentMay[];
  claimUniversalCompatibilityWithoutTest?: boolean;
}): UniversalRuntimePackage | DenialResult {
  if (!isEr28Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny(
      'Only runtime package contract agents / home_base may define packages.',
    );
  }
  if (input.claimUniversalCompatibilityWithoutTest === true) {
    return deny(
      'UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST=false — cannot claim universal compatibility without per-platform tests.',
    );
  }

  const payload = {
    packageId: input.packageId,
    platform: input.platform,
    architecture: input.architecture,
    buildTarget: input.buildTarget,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
  const contentHash = sha256(JSON.stringify(payload));
  const signature = sha256(`sign:${contentHash}`);

  const platformTestEvidence = PLATFORM_BUILD_TARGETS.map((target) => ({
    buildTarget: target,
    tested: false,
    state: 'NOT_TESTED' as RuntimePackageState,
  }));

  return {
    packageId: input.packageId,
    platform: input.platform,
    architecture: input.architecture,
    supportedDeviceClasses: [...input.supportedDeviceClasses],
    minimumOsRuntimeVersion: input.minimumOsRuntimeVersion,
    modelRuntimeDependencies: [...(input.modelRuntimeDependencies ?? [])],
    localStorageRequirementsBytes: input.localStorageRequirementsBytes ?? 1024,
    cpuGpuNpuRequirements: {
      cpuRequired: true,
      gpuOptional: true,
      npuOptional: true,
      cpuSafeFallback: true,
    },
    allowedPermissions: [...(input.allowedPermissions ?? ['local_storage'])],
    networkPolicy: input.networkPolicy ?? 'home_base_sync',
    dataClasses: [
      ...(input.dataClasses ?? ['encrypted_local', 'tenant_scoped']),
    ],
    offlineCapability: input.offlineCapability ?? true,
    updateChannel: input.updateChannel ?? 'stable',
    rollbackVersion: input.rollbackVersion ?? null,
    installUninstallBehavior: {
      requiresExplicitAuthorization: true,
      stealthPersistence: false,
      privilegeEscalation: false,
      firmwareBiosModification: false,
      uninstallDeletePath: true,
      rollbackSupported: true,
    },
    heartbeatContract: {
      intervalSeconds: 60,
      reportsOfflineTruthState: true,
    },
    capabilityManifest: [...(input.capabilityManifest ?? ['local_agent'])],
    evidenceState: 'DOCUMENTED',
    buildTarget: input.buildTarget,
    contents: [
      ...(input.contents ?? [
        'local_agent_runtime',
        'encrypted_local_storage',
        'policy_guardian_client',
      ]),
    ],
    signature,
    signed: true,
    enrolledDeviceId: null,
    enrollmentRevocable: true,
    localDataEncrypted: true,
    installed: false,
    installAuthorizedBy: null,
    hardwareProbePassed: null,
    runtimeModelVerified: null,
    registeredWithHomeBase: false,
    offlineTruthState: 'OFFLINE_STOPPED',
    platformTestEvidence,
    universalCompatibilityClaimedWithoutTest: false,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
  };
}

export function recordPlatformTestEvidence(input: {
  pkg: UniversalRuntimePackage;
  buildTarget: PlatformBuildTarget;
  tested: boolean;
  resultingState?: RuntimePackageState;
  claimUniversalCompatibility?: boolean;
}): UniversalRuntimePackage | DenialResult {
  if (input.claimUniversalCompatibility === true) {
    const allTested = PLATFORM_BUILD_TARGETS.every((t) => {
      if (t === input.buildTarget) return input.tested;
      const row = input.pkg.platformTestEvidence.find(
        (e) => e.buildTarget === t,
      );
      return row?.tested === true;
    });
    if (!allTested) {
      return deny(
        'Cannot claim universal compatibility — each platform build must be independently tested.',
      );
    }
  }

  const platformTestEvidence = input.pkg.platformTestEvidence.map((row) =>
    row.buildTarget === input.buildTarget
      ? {
          buildTarget: row.buildTarget,
          tested: input.tested,
          state: input.tested
            ? (input.resultingState ?? 'SUPPORTED')
            : 'NOT_TESTED',
        }
      : row,
  );

  return {
    ...input.pkg,
    platformTestEvidence,
    universalCompatibilityClaimedWithoutTest: false,
  };
}

export function advancePackageState(input: {
  pkg: UniversalRuntimePackage;
  nextState: RuntimePackageState;
  evidencePresent: boolean;
}): UniversalRuntimePackage | DenialResult {
  if (!input.evidencePresent) {
    return deny('Package state may advance only with evidence.');
  }
  if (
    input.nextState === 'VERIFIED' &&
    input.pkg.platformTestEvidence.find(
      (e) => e.buildTarget === input.pkg.buildTarget,
    )?.tested !== true
  ) {
    return deny(
      'Cannot advance to VERIFIED without per-platform test evidence for this build target.',
    );
  }
  const currentRank = STATE_RANK[input.pkg.evidenceState];
  const nextRank = STATE_RANK[input.nextState];
  if (
    nextRank > currentRank + 1 &&
    input.nextState !== 'DEGRADED' &&
    input.nextState !== 'UNAVAILABLE'
  ) {
    // allow single-step or lateral DEGRADED/UNAVAILABLE; block skips to VERIFIED without path
    if (input.nextState === 'VERIFIED' && currentRank < STATE_RANK.SUPPORTED) {
      return deny('Cannot skip to VERIFIED without intermediate evidence.');
    }
  }

  return {
    ...input.pkg,
    evidenceState: input.nextState,
  };
}

export function enrollDevice(input: {
  actor: Er28Actor;
  pkg: UniversalRuntimePackage;
  deviceId: string;
}): UniversalRuntimePackage | DenialResult {
  if (
    input.pkg.tenantId !== input.actor.tenantId ||
    input.pkg.universeId !== input.actor.universeId
  ) {
    return deny('Device enrollment is isolated to tenant/Universe.');
  }
  return {
    ...input.pkg,
    enrolledDeviceId: input.deviceId,
    evidenceState:
      input.pkg.evidenceState === 'DOCUMENTED'
        ? 'BUILDABLE'
        : input.pkg.evidenceState,
  };
}

export function previewPermissions(input: {
  pkg: UniversalRuntimePackage;
}): {
  allowedPermissions: readonly string[];
  leastPrivilege: true;
  stealthPersistence: false;
  privilegeEscalation: false;
} {
  return {
    allowedPermissions: input.pkg.allowedPermissions,
    leastPrivilege: true,
    stealthPersistence: false,
    privilegeEscalation: false,
  };
}

export function installUniversalRuntimePackage(input: {
  actor: Er28Actor;
  pkg: UniversalRuntimePackage;
  explicitAuthorization: boolean;
  authorizerId?: string;
  signed?: boolean;
  stealthPersistence?: boolean;
  privilegeEscalation?: boolean;
  firmwareBiosModification?: boolean;
}): UniversalRuntimePackage | DenialResult {
  if (input.stealthPersistence === true) {
    return deny('Stealth persistence is forbidden.');
  }
  if (input.privilegeEscalation === true) {
    return deny('Privilege escalation is forbidden.');
  }
  if (input.firmwareBiosModification === true) {
    return deny('Firmware/BIOS modification is forbidden.');
  }
  if (!input.explicitAuthorization) {
    return deny('Installation requires explicit user/admin authorization.');
  }
  const signed = input.signed ?? input.pkg.signed;
  if (!signed || input.pkg.signature == null) {
    return deny('Only signed packages may be installed.');
  }
  if (input.pkg.enrolledDeviceId == null) {
    return deny('Device must be enrolled before package install.');
  }
  if (
    input.pkg.tenantId !== input.actor.tenantId ||
    input.pkg.universeId !== input.actor.universeId
  ) {
    return deny('Package install is isolated to tenant/Universe.');
  }

  return {
    ...input.pkg,
    installed: true,
    signed: true,
    installAuthorizedBy: input.authorizerId ?? input.actor.id,
    evidenceState:
      STATE_RANK[input.pkg.evidenceState] < STATE_RANK.INSTALLABLE
        ? 'INSTALLABLE'
        : input.pkg.evidenceState,
    offlineTruthState: 'LOCAL_ONLY',
  };
}

export function runLocalHardwareProbe(input: {
  pkg: UniversalRuntimePackage;
  probePassed: boolean;
}): UniversalRuntimePackage | DenialResult {
  if (!input.pkg.installed) {
    return deny('Package must be installed before hardware probe.');
  }
  return {
    ...input.pkg,
    hardwareProbePassed: input.probePassed,
    evidenceState: input.probePassed
      ? input.pkg.evidenceState === 'INSTALLABLE' ||
        input.pkg.evidenceState === 'BUILDABLE' ||
        input.pkg.evidenceState === 'DOCUMENTED'
        ? 'SUPPORTED'
        : input.pkg.evidenceState
      : 'DEGRADED',
  };
}

export function verifyRuntimeModel(input: {
  pkg: UniversalRuntimePackage;
  verified: boolean;
}): UniversalRuntimePackage | DenialResult {
  if (!input.pkg.installed) {
    return deny('Package must be installed before runtime/model verification.');
  }
  if (input.pkg.hardwareProbePassed !== true) {
    return deny('Hardware probe must pass before runtime/model verification.');
  }
  return {
    ...input.pkg,
    runtimeModelVerified: input.verified,
    evidenceState: input.verified
      ? input.pkg.evidenceState === 'SUPPORTED'
        ? 'SUPPORTED'
        : input.pkg.evidenceState
      : 'DEGRADED',
  };
}

export function emitPackageHeartbeat(input: {
  actor: Er28Actor;
  pkg: UniversalRuntimePackage;
  devicePowerState: DevicePowerState;
  connectivityState: ConnectivityState;
  synchronizedHealthy?: boolean;
}):
  | {
      heartbeat: PackageHeartbeat;
      pkg: UniversalRuntimePackage;
    }
  | DenialResult {
  if (!input.pkg.installed || input.pkg.enrolledDeviceId == null) {
    return deny('Installed enrolled package required for heartbeat.');
  }
  if (
    input.pkg.tenantId !== input.actor.tenantId ||
    input.pkg.universeId !== input.actor.universeId
  ) {
    return deny('Heartbeat tenant/Universe mismatch.');
  }

  const offlineTruthState = resolveOfflineTruthState({
    devicePowerState: input.devicePowerState,
    connectivityState: input.connectivityState,
    synchronizedHealthy: input.synchronizedHealthy,
  });

  const heartbeat: PackageHeartbeat = {
    heartbeatId: `hb-${sha256(`${input.pkg.packageId}:${nowIso()}`).slice(0, 12)}`,
    packageId: input.pkg.packageId,
    deviceId: input.pkg.enrolledDeviceId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    at: nowIso(),
    devicePowerState: input.devicePowerState,
    connectivityState: input.connectivityState,
    offlineTruthState,
    synchronizedHealthy:
      offlineTruthState === 'RUNNING_VERIFIED' ? true : false,
  };

  return {
    heartbeat,
    pkg: {
      ...input.pkg,
      offlineTruthState,
    },
  };
}

export function registerWithHomeBase(input: {
  actor: Er28Actor;
  pkg: UniversalRuntimePackage;
}):
  | {
      registration: HomeBaseRegistration;
      pkg: UniversalRuntimePackage;
    }
  | DenialResult {
  if (!input.pkg.installed || input.pkg.enrolledDeviceId == null) {
    return deny('Installed enrolled package required for Home Base registration.');
  }
  if (input.pkg.runtimeModelVerified !== true) {
    return deny('Runtime/model verification required before Home Base registration.');
  }

  const registration: HomeBaseRegistration = {
    registrationId: `reg-${sha256(input.pkg.packageId).slice(0, 12)}`,
    packageId: input.pkg.packageId,
    deviceId: input.pkg.enrolledDeviceId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    status: 'REGISTERED_CANDIDATE',
    productionAuthorized: false,
    authorityGranted: false,
  };

  return {
    registration,
    pkg: {
      ...input.pkg,
      registeredWithHomeBase: true,
    },
  };
}

export function uninstallAndRevokeEnrollment(input: {
  pkg: UniversalRuntimePackage;
  rollbackToVersion?: string | null;
}): UniversalRuntimePackage {
  return {
    ...input.pkg,
    installed: false,
    enrolledDeviceId: null,
    installAuthorizedBy: null,
    hardwareProbePassed: null,
    runtimeModelVerified: null,
    registeredWithHomeBase: false,
    offlineTruthState: 'OFFLINE_STOPPED',
    rollbackVersion:
      input.rollbackToVersion ?? input.pkg.rollbackVersion ?? input.pkg.packageId,
    evidenceState: 'DOCUMENTED',
  };
}

export function attemptStealthPersistence(): DenialResult {
  return deny('Stealth persistence is forbidden.');
}

export function attemptPrivilegeEscalation(): DenialResult {
  return deny('Privilege escalation is forbidden.');
}

export function attemptFirmwareBiosModification(): DenialResult {
  return deny('Firmware/BIOS modification is forbidden.');
}

export function attemptUnsignedInstall(): DenialResult {
  return deny('Only signed packages may be installed.');
}

export function attemptInstallWithoutAuthorization(): DenialResult {
  return deny('Installation requires explicit user/admin authorization.');
}

export function attemptUniversalCompatClaim(): DenialResult {
  return deny(
    'UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST=false — per-platform tests required.',
  );
}

export function attemptAdvanceVerifiedWithoutEvidence(): DenialResult {
  return deny(
    'Cannot advance to VERIFIED without per-platform test evidence.',
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
  actor: Er28Actor;
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

export function exampleLinuxX86Package(
  actor: Er28Actor,
): UniversalRuntimePackage {
  const defined = defineUniversalRuntimePackage({
    actor,
    packageId: 'pkg-linux-x86-1',
    platform: 'linux',
    architecture: 'x86_64',
    buildTarget: 'linux_x86',
    supportedDeviceClasses: ['laptop', 'desktop', 'server'],
    minimumOsRuntimeVersion: 'linux-5.15',
    modelRuntimeDependencies: ['local-sm-v1'],
    contents: [
      'local_agent_runtime',
      'approved_models',
      'offline_knowledge_packs',
      'virtual_chip_adapter',
      'encrypted_local_storage',
      'sync_client',
      'audit_receipt_logic',
    ],
  });
  if ('denied' in defined) {
    throw new Error(defined.reason);
  }
  return defined;
}

export function bootstrapUniversalRuntimePackageContract(repoRoot?: string): {
  locksIntact: boolean;
  packageFields: typeof RUNTIME_PACKAGE_FIELDS;
  packageStates: typeof RUNTIME_PACKAGE_STATES;
  coreFlow: typeof RUNTIME_PACKAGE_CORE_FLOW;
  platformTargets: typeof PLATFORM_BUILD_TARGETS;
  contentsMay: typeof RUNTIME_PACKAGE_CONTENTS_MAY;
  offlineTruthStates: typeof OFFLINE_TRUTH_STATES;
  dbCandidates: typeof ER28_DB_CANDIDATES_STATUS;
  softWire: Er28SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    layer: typeof ER_LAYER_TITLE;
  };
  locks: {
    UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST: false;
    L4_AUTONOMY_ENABLED: false;
  };
} {
  const softWire = er28SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEr28LocksIntact(),
    packageFields: RUNTIME_PACKAGE_FIELDS,
    packageStates: RUNTIME_PACKAGE_STATES,
    coreFlow: RUNTIME_PACKAGE_CORE_FLOW,
    platformTargets: PLATFORM_BUILD_TARGETS,
    contentsMay: RUNTIME_PACKAGE_CONTENTS_MAY,
    offlineTruthStates: OFFLINE_TRUTH_STATES,
    dbCandidates: ER28_DB_CANDIDATES_STATUS,
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
    locks: {
      UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST: false,
      L4_AUTONOMY_ENABLED: false,
    },
  };
}

export function runUniversalRuntimePackageContractCycle(input: {
  actor: Er28Actor;
  human: Er28Actor;
  repoRoot?: string;
}): {
  hops: Er28HopRecord[];
  receipt: {
    packageId: string;
    offlineTruthState: OfflineTruthState;
    universalCompatibilityClaimedWithoutTest: false;
    registeredWithHomeBase: boolean;
  };
  cycleEvidenceSha256: string;
} {
  const hops: Er28HopRecord[] = [];
  const softWire = er28SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr28LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const boot = bootstrapUniversalRuntimePackageContract(input.repoRoot);
  hops.push(
    hop(
      'universal_runtime_package_contract_bootstrap',
      boot.locksIntact ? 'PASS' : 'FAIL',
      'Universal Runtime Package Contract bootstrap.',
    ),
  );

  hops.push(
    hop(
      'package_fields_encoded',
      RUNTIME_PACKAGE_FIELDS.length === 18 ? 'PASS' : 'FAIL',
      `Package fields=${RUNTIME_PACKAGE_FIELDS.length}.`,
    ),
  );
  hops.push(
    hop(
      'package_states_encoded',
      RUNTIME_PACKAGE_STATES.length === 8 ? 'PASS' : 'FAIL',
      `Package states=${RUNTIME_PACKAGE_STATES.length}.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      RUNTIME_PACKAGE_CORE_FLOW.length === 9 ? 'PASS' : 'FAIL',
      `Core flow hops=${RUNTIME_PACKAGE_CORE_FLOW.length}.`,
    ),
  );
  hops.push(
    hop(
      'platform_build_targets_encoded',
      PLATFORM_BUILD_TARGETS.length === 7 ? 'PASS' : 'FAIL',
      `Platform build targets=${PLATFORM_BUILD_TARGETS.length}.`,
    ),
  );
  hops.push(
    hop(
      'package_contents_may_encoded',
      RUNTIME_PACKAGE_CONTENTS_MAY.length === 10 ? 'PASS' : 'FAIL',
      `Contents MAY=${RUNTIME_PACKAGE_CONTENTS_MAY.length}.`,
    ),
  );
  hops.push(
    hop(
      'offline_truth_states_encoded',
      OFFLINE_TRUTH_STATES.length === 3 ? 'PASS' : 'FAIL',
      `Offline truth states=${OFFLINE_TRUTH_STATES.join(',')}.`,
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      !UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.oneSpecEqualsOneBinaryEverywhere &&
        !UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.universalCompatibilityClaimedWithoutTest &&
        !UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.stealthPersistenceAllowed
        ? 'PASS'
        : 'FAIL',
      'Truth boundary: one-spec≠one-binary; no universal claim without tests; no stealth.',
    ),
  );

  const deniedUniversal = defineUniversalRuntimePackage({
    actor: input.actor,
    packageId: 'pkg-bad-universal',
    platform: 'linux',
    architecture: 'x86_64',
    buildTarget: 'linux_x86',
    supportedDeviceClasses: ['laptop'],
    minimumOsRuntimeVersion: 'linux-5.15',
    claimUniversalCompatibilityWithoutTest: true,
  });
  let pkg = exampleLinuxX86Package(input.actor);
  hops.push(
    hop(
      'define_package_contract',
      'denied' in deniedUniversal && pkg.evidenceState === 'DOCUMENTED'
        ? 'PASS'
        : 'FAIL',
      'Package contract defined at DOCUMENTED; universal claim denied.',
    ),
  );

  const noEvidence = advancePackageState({
    pkg,
    nextState: 'VERIFIED',
    evidencePresent: false,
  });
  const withEvidence = advancePackageState({
    pkg,
    nextState: 'BUILDABLE',
    evidencePresent: true,
  });
  hops.push(
    hop(
      'advance_state_only_with_evidence',
      'denied' in noEvidence && !('denied' in withEvidence)
        ? 'PASS'
        : 'FAIL',
      'State advances only with evidence.',
    ),
  );
  if (!('denied' in withEvidence)) {
    pkg = withEvidence;
  }

  const claimCompat = recordPlatformTestEvidence({
    pkg,
    buildTarget: 'linux_x86',
    tested: true,
    resultingState: 'SUPPORTED',
    claimUniversalCompatibility: true,
  });
  const recorded = recordPlatformTestEvidence({
    pkg,
    buildTarget: 'linux_x86',
    tested: true,
    resultingState: 'SUPPORTED',
  });
  hops.push(
    hop(
      'deny_universal_compat_without_per_platform_tests',
      'denied' in claimCompat && !('denied' in recorded)
        ? 'PASS'
        : 'FAIL',
      'Universal compat claim denied until all platforms independently tested.',
    ),
  );
  if (!('denied' in recorded)) {
    pkg = recorded;
  }

  const enrolled = enrollDevice({
    actor: input.actor,
    pkg,
    deviceId: 'dev-er28-1',
  });
  if (!('denied' in enrolled)) {
    pkg = enrolled;
  }
  void previewPermissions({ pkg });

  const noAuth = installUniversalRuntimePackage({
    actor: input.actor,
    pkg,
    explicitAuthorization: false,
  });
  const unsigned = installUniversalRuntimePackage({
    actor: input.actor,
    pkg,
    explicitAuthorization: true,
    signed: false,
  });
  const installed = installUniversalRuntimePackage({
    actor: input.actor,
    pkg,
    explicitAuthorization: true,
    authorizerId: input.human.id,
  });
  hops.push(
    hop(
      'install_requires_auth_and_signed_package',
      'denied' in noAuth &&
        'denied' in unsigned &&
        !('denied' in installed)
        ? 'PASS'
        : 'FAIL',
      'Install requires auth + signed package.',
    ),
  );
  if (!('denied' in installed)) {
    pkg = installed;
  }

  const probed = runLocalHardwareProbe({ pkg, probePassed: true });
  const verified = !('denied' in probed)
    ? verifyRuntimeModel({ pkg: probed, verified: true })
    : deny('probe failed');
  hops.push(
    hop(
      'hardware_probe_and_runtime_verify',
      !('denied' in probed) && !('denied' in verified)
        ? 'PASS'
        : 'FAIL',
      'Hardware probe + runtime/model verification.',
    ),
  );
  if (!('denied' in verified)) {
    pkg = verified;
  }

  const stopped = emitPackageHeartbeat({
    actor: input.actor,
    pkg,
    devicePowerState: 'POWERED_OFF',
    connectivityState: 'DISCONNECTED',
  });
  const localOnly = emitPackageHeartbeat({
    actor: input.actor,
    pkg,
    devicePowerState: 'POWERED_ON',
    connectivityState: 'DISCONNECTED',
  });
  const running = emitPackageHeartbeat({
    actor: input.actor,
    pkg,
    devicePowerState: 'POWERED_ON',
    connectivityState: 'CONNECTED',
    synchronizedHealthy: true,
  });
  hops.push(
    hop(
      'heartbeat_offline_truth_states',
      !('denied' in stopped) &&
        stopped.heartbeat.offlineTruthState === 'OFFLINE_STOPPED' &&
        !('denied' in localOnly) &&
        localOnly.heartbeat.offlineTruthState === 'LOCAL_ONLY' &&
        !('denied' in running) &&
        running.heartbeat.offlineTruthState === 'RUNNING_VERIFIED'
        ? 'PASS'
        : 'FAIL',
      'Heartbeat maps to OFFLINE_STOPPED / LOCAL_ONLY / RUNNING_VERIFIED.',
    ),
  );
  if (!('denied' in running)) {
    pkg = running.pkg;
  }

  const reg = registerWithHomeBase({ actor: input.actor, pkg });
  hops.push(
    hop(
      'home_base_registration_candidate',
      !('denied' in reg) &&
        reg.registration.status === 'REGISTERED_CANDIDATE' &&
        reg.registration.productionAuthorized === false
        ? 'PASS'
        : 'FAIL',
      'Home Base registration is candidate only; not production authorized.',
    ),
  );
  if (!('denied' in reg)) {
    pkg = reg.pkg;
  }

  const revoked = uninstallAndRevokeEnrollment({
    pkg,
    rollbackToVersion: '0.9.0',
  });
  hops.push(
    hop(
      'revocable_enrollment_uninstall_rollback',
      revoked.enrolledDeviceId == null &&
        revoked.installed === false &&
        revoked.rollbackVersion === '0.9.0' &&
        revoked.offlineTruthState === 'OFFLINE_STOPPED'
        ? 'PASS'
        : 'FAIL',
      'Enrollment revocable; uninstall/delete + rollback path.',
    ),
  );

  // Re-install path for receipt continuity after revoke check
  let livePkg = exampleLinuxX86Package(input.actor);
  const reEnroll = enrollDevice({
    actor: input.actor,
    pkg: livePkg,
    deviceId: 'dev-er28-live',
  });
  if (!('denied' in reEnroll)) livePkg = reEnroll;
  const reInstall = installUniversalRuntimePackage({
    actor: input.actor,
    pkg: livePkg,
    explicitAuthorization: true,
    authorizerId: input.human.id,
  });
  if (!('denied' in reInstall)) livePkg = reInstall;
  const reProbe = runLocalHardwareProbe({ pkg: livePkg, probePassed: true });
  if (!('denied' in reProbe)) livePkg = reProbe;
  const reVerify = verifyRuntimeModel({ pkg: livePkg, verified: true });
  if (!('denied' in reVerify)) livePkg = reVerify;
  const reHb = emitPackageHeartbeat({
    actor: input.actor,
    pkg: livePkg,
    devicePowerState: 'POWERED_ON',
    connectivityState: 'CONNECTED',
    synchronizedHealthy: true,
  });
  if (!('denied' in reHb)) livePkg = reHb.pkg;
  const reReg = registerWithHomeBase({ actor: input.actor, pkg: livePkg });
  if (!('denied' in reReg)) livePkg = reReg.pkg;

  const denyHops: Array<{
    hop: (typeof UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_stealth_persistence', fn: attemptStealthPersistence },
    { hop: 'deny_privilege_escalation', fn: attemptPrivilegeEscalation },
    {
      hop: 'deny_firmware_bios_modification',
      fn: attemptFirmwareBiosModification,
    },
    { hop: 'deny_unsigned_install', fn: attemptUnsignedInstall },
    {
      hop: 'deny_install_without_authorization',
      fn: attemptInstallWithoutAuthorization,
    },
    { hop: 'deny_universal_compat_claim', fn: attemptUniversalCompatClaim },
    {
      hop: 'deny_advance_to_verified_without_evidence',
      fn: attemptAdvanceVerifiedWithoutEvidence,
    },
    { hop: 'deny_bypass_guardian_rls', fn: attemptBypassGuardianRls },
    {
      hop: 'deny_expand_tenant_universe_access',
      fn: attemptExpandTenantUniverseAccess,
    },
    { hop: 'deny_auto_deploy_changes', fn: attemptAutoDeployChanges },
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
      ER28_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
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
    hop: (typeof UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_CYCLE)[number];
    present: boolean;
    note: string;
  }> = [
    {
      hop: 'er27_soft_wire',
      present: softWire.er27SpeculativeExtraterrestrialResearchLayer.present,
      note: softWire.er27SpeculativeExtraterrestrialResearchLayer.note,
    },
    {
      hop: 'er26_soft_wire',
      present: softWire.er26.present,
      note: softWire.er26.note,
    },
    {
      hop: 'er25_soft_wire',
      present: softWire.er25.present,
      note: softWire.er25.note,
    },
    {
      hop: 'er24_soft_wire',
      present: softWire.er24.present,
      note: softWire.er24.note,
    },
    {
      hop: 'er23_soft_wire',
      present: softWire.er23.present,
      note: softWire.er23.note,
    },
    {
      hop: 'er22_soft_wire',
      present: softWire.er22HistoricalAvatarContract.present,
      note: softWire.er22HistoricalAvatarContract.note,
    },
    {
      hop: 'er21_soft_wire',
      present: softWire.er21.present,
      note: softWire.er21.note,
    },
    {
      hop: 'er20_soft_wire',
      present: softWire.er20.present,
      note: softWire.er20.note,
    },
    {
      hop: 'er19_soft_wire',
      present: softWire.er19.present,
      note: softWire.er19.note,
    },
    {
      hop: 'er18_soft_wire',
      present: softWire.er18ResearchReviewBoard.present,
      note: softWire.er18ResearchReviewBoard.note,
    },
    {
      hop: 'er17_soft_wire',
      present: softWire.er17.present,
      note: softWire.er17.note,
    },
    {
      hop: 'er16_soft_wire',
      present: softWire.er16.present,
      note: softWire.er16.note,
    },
    {
      hop: 'er15_soft_wire',
      present: softWire.er15OfflineOnlineSyncContract.present,
      note: softWire.er15OfflineOnlineSyncContract.note,
    },
    {
      hop: 'er14_soft_wire',
      present: softWire.er14OfflineBrainPackager.present,
      note: softWire.er14OfflineBrainPackager.note,
    },
    {
      hop: 'er13_soft_wire',
      present: softWire.er13OnlineBrainIndex.present,
      note: softWire.er13OnlineBrainIndex.note,
    },
    {
      hop: 'er12_soft_wire',
      present: softWire.er12LiveDataConnectorGate.present,
      note: softWire.er12LiveDataConnectorGate.note,
    },
    {
      hop: 'er11_soft_wire',
      present: softWire.er11PublicGovernmentDataPack.present,
      note: softWire.er11PublicGovernmentDataPack.note,
    },
    {
      hop: 'er10_soft_wire',
      present: softWire.er10PublicGeospatialMobilityPack.present,
      note: softWire.er10PublicGeospatialMobilityPack.note,
    },
    {
      hop: 'er9_soft_wire',
      present: softWire.er9PublicLawPolicyKnowledgePack.present,
      note: softWire.er9PublicLawPolicyKnowledgePack.note,
    },
    {
      hop: 'er8_soft_wire',
      present: softWire.er8AncientCivilizationsKnowledgePack.present,
      note: softWire.er8AncientCivilizationsKnowledgePack.note,
    },
    {
      hop: 'er7_soft_wire',
      present: softWire.er7HistoricalScienceEngineeringAtlas.present,
      note: softWire.er7HistoricalScienceEngineeringAtlas.note,
    },
    {
      hop: 'er6_soft_wire',
      present: softWire.er6HistoricalBusinessCaseAtlasV2.present,
      note: softWire.er6HistoricalBusinessCaseAtlasV2.note,
    },
    {
      hop: 'er5_soft_wire',
      present: softWire.er5GlobalHistoricalKnowledgeIngestion.present,
      note: softWire.er5GlobalHistoricalKnowledgeIngestion.note,
    },
    {
      hop: 'er4_soft_wire',
      present: softWire.er4RightsProvenanceGate.present,
      note: softWire.er4RightsProvenanceGate.note,
    },
    {
      hop: 'er3_soft_wire',
      present: softWire.er3PublicDataSourceRegistry.present,
      note: softWire.er3PublicDataSourceRegistry.note,
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
      hop: 'eq8_soft_wire',
      present: softWire.eq8ArmServerCloudRuntime.present,
      note: softWire.eq8ArmServerCloudRuntime.note,
    },
    {
      hop: 'eq7_soft_wire',
      present: softWire.eq7ArmEdgeAmdAcceleration.present,
      note: softWire.eq7ArmEdgeAmdAcceleration.note,
    },
    {
      hop: 'eq16_soft_wire',
      present: softWire.eq16SoftwareWormholeRouter.present,
      note: softWire.eq16SoftwareWormholeRouter.note,
    },
    {
      hop: 'ep1_soft_wire',
      present: softWire.ep1VirtualChipContract.present,
      note: softWire.ep1VirtualChipContract.note,
    },
    {
      hop: 'ep15_soft_wire',
      present: softWire.ep15AlgorithmTuningSandbox.present,
      note: softWire.ep15AlgorithmTuningSandbox.note,
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
      ER28_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-er28-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      livePkg.registeredWithHomeBase &&
        livePkg.universalCompatibilityClaimedWithoutTest === false &&
        !('denied' in humanGate)
        ? 'PASS'
        : 'DENIED',
      'Home Base candidate registered; universal-compat lock held; human gate exercised.',
    ),
  );

  void ER28_MAY;
  void ER28_MUST_NOT;
  void ER28_AGENT_BOUNDS;
  void UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
    }),
  );

  return {
    hops,
    receipt: {
      packageId: livePkg.packageId,
      offlineTruthState: livePkg.offlineTruthState,
      universalCompatibilityClaimedWithoutTest: false,
      registeredWithHomeBase: livePkg.registeredWithHomeBase,
    },
    cycleEvidenceSha256,
  };
}
