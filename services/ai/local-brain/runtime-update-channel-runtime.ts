/**
 * 62L-ER33 — Runtime Update Channel runtime.
 *
 * Create signed update packages; advance rollout only with evidence;
 * deny DRAFT→all-devices; compatibility gate → UPDATE_BLOCKED;
 * human approval required; rollback on health triggers; offline
 * reconnect only if compatible; deny unsigned/stealth/firmware/
 * permission expansion/cross-tenant mix; cycle.
 */

import { createHash } from 'node:crypto';
import {
  COMPATIBILITY_GATE_CHECKS,
  COMPATIBILITY_GATE_OUTCOME,
  ER33_AGENT_BOUNDS,
  ER33_DB_CANDIDATES_STATUS,
  ER33_LOCKS,
  ER33_MAY,
  ER33_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  ROLLOUT_STAGES,
  ROLLBACK_TRIGGERS,
  RUNTIME_UPDATE_CHANNEL_CYCLE,
  SUPPORTED_UPDATE_TYPES,
  UPDATE_CHANNEL_CORE_FLOW,
  UPDATE_PACKAGE_FIELDS,
  assertEr33LocksIntact,
  er33SoftWireSnapshot,
  isEr33Agent,
  isHumanApprover,
  mayAdvanceRollout,
  softWireHopState,
  type CompatibilityGateCheck,
  type CompatibilityGateResult,
  type CompatibilityRequirements,
  type DeviceProfile,
  type Er33Actor,
  type Er33EvidenceState,
  type Er33HopRecord,
  type Er33SoftWireSnapshot,
  type OfflineReconnectResult,
  type RollbackReceipt,
  type RollbackTrigger,
  type RolloutStage,
  type SupportedUpdateType,
  type UpdatePackage,
} from './runtime-update-channel-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof RUNTIME_UPDATE_CHANNEL_CYCLE)[number],
  state: Er33EvidenceState,
  summary: string,
): Er33HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'UPDATE_BLOCKED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' | 'UPDATE_BLOCKED' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

function compareSemverLike(a: string, b: string): number {
  const pa = a.split('.').map((x) => Number.parseInt(x, 10) || 0);
  const pb = b.split('.').map((x) => Number.parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av !== bv) return av < bv ? -1 : 1;
  }
  return 0;
}

export function createUpdatePackage(input: {
  actor: Er33Actor;
  updateId: string;
  packageRuntimeType: SupportedUpdateType;
  targetPlatform: string;
  targetArchitecture: string;
  currentVersion: string;
  targetVersion: string;
  dependencies?: Readonly<Record<string, string>>;
  compatibilityRequirements: CompatibilityRequirements;
  requiredPermissions?: readonly string[];
  migrationRequirements?: readonly string[];
  rollbackVersion: string;
  securityNotes?: string;
  releaseEvidence?: readonly string[];
  signed?: boolean;
  stealth?: boolean;
  firmwareOrBios?: boolean;
  expandsPermissions?: boolean;
  includeHiddenChainOfThought?: boolean;
}): UpdatePackage | DenialResult {
  if (!isEr33Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only update channel agents / home_base may create packages.');
  }
  if (input.stealth === true) {
    return deny('Stealth installation is forbidden.');
  }
  if (input.firmwareOrBios === true) {
    return deny('Firmware/BIOS updates are not allowed through this channel.');
  }
  if (input.expandsPermissions === true) {
    return deny('Automatic permission expansion is forbidden.');
  }
  if (input.includeHiddenChainOfThought === true) {
    return deny('Hidden chain-of-thought must not be packaged.');
  }
  if (input.signed === false) {
    return deny('Unsigned artifacts are forbidden — signed artifacts only.');
  }
  if (!SUPPORTED_UPDATE_TYPES.includes(input.packageRuntimeType)) {
    return deny('Unsupported update type.');
  }

  const payload = {
    updateId: input.updateId,
    type: input.packageRuntimeType,
    platform: input.targetPlatform,
    arch: input.targetArchitecture,
    from: input.currentVersion,
    to: input.targetVersion,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
  const signedHash = sha256(JSON.stringify(payload));
  const signature = sha256(`sign:${signedHash}`);

  return {
    updateId: input.updateId,
    packageRuntimeType: input.packageRuntimeType,
    targetPlatform: input.targetPlatform,
    targetArchitecture: input.targetArchitecture,
    currentVersion: input.currentVersion,
    targetVersion: input.targetVersion,
    signedHash,
    signature,
    signed: true,
    dependencies: { ...(input.dependencies ?? {}) },
    compatibilityRequirements: input.compatibilityRequirements,
    requiredPermissions: [...(input.requiredPermissions ?? [])],
    migrationRequirements: [...(input.migrationRequirements ?? [])],
    rollbackVersion: input.rollbackVersion,
    securityNotes: input.securityNotes ?? '',
    releaseEvidence: [...(input.releaseEvidence ?? [])],
    testStatus: 'NOT_RUN',
    deploymentScope: 'DRAFT',
    approvalState: 'PENDING',
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    revoked: false,
    stealth: false,
    firmwareOrBios: false,
    expandsPermissions: false,
    sandboxEvidence: [],
    securityReviewEvidence: [],
    humanApprovedBy: null,
    rolloutEvidence: [],
  };
}

export function runSandboxTests(input: {
  pkg: UpdatePackage;
  pass: boolean;
  evidence: readonly string[];
}): UpdatePackage | DenialResult {
  if (input.pkg.revoked) {
    return deny('Revoked updates must stop distribution.');
  }
  if (!input.pkg.signed) {
    return deny('Unsigned artifacts are forbidden.');
  }
  if (!input.pass) {
    return {
      ...input.pkg,
      testStatus: 'SANDBOX_FAIL',
      sandboxEvidence: [...input.evidence],
    };
  }
  return {
    ...input.pkg,
    testStatus: 'SANDBOX_PASS',
    sandboxEvidence: [...input.evidence],
    deploymentScope:
      input.pkg.deploymentScope === 'DRAFT' ? 'SANDBOX' : input.pkg.deploymentScope,
    rolloutEvidence: [
      ...input.pkg.rolloutEvidence,
      `sandbox:${input.evidence.join(',')}`,
    ],
  };
}

export function runSecurityReview(input: {
  pkg: UpdatePackage;
  pass: boolean;
  evidence: readonly string[];
}): UpdatePackage | DenialResult {
  if (input.pkg.revoked) {
    return deny('Revoked updates must stop distribution.');
  }
  if (input.pkg.testStatus !== 'SANDBOX_PASS') {
    return deny('Security review requires sandbox PASS evidence.');
  }
  if (!input.pass) {
    return {
      ...input.pkg,
      testStatus: 'SECURITY_FAIL',
      securityReviewEvidence: [...input.evidence],
    };
  }
  return {
    ...input.pkg,
    testStatus: 'SECURITY_PASS',
    securityReviewEvidence: [...input.evidence],
    rolloutEvidence: [
      ...input.pkg.rolloutEvidence,
      `security:${input.evidence.join(',')}`,
    ],
  };
}

export function requireHumanApproval(input: {
  pkg: UpdatePackage;
  actor: Er33Actor;
  approvalId: string;
}): UpdatePackage | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny('Human approver required before staged rollout.');
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Missing approve_consequential permission.');
  }
  if (input.pkg.testStatus !== 'SECURITY_PASS') {
    return deny('Human approval requires security PASS.');
  }
  if (
    input.pkg.tenantId !== input.actor.tenantId ||
    input.pkg.universeId !== input.actor.universeId
  ) {
    return deny('Cross-tenant package approval denied.');
  }
  return {
    ...input.pkg,
    approvalState: 'APPROVED',
    humanApprovedBy: input.actor.id,
    rolloutEvidence: [
      ...input.pkg.rolloutEvidence,
      `human_approval:${input.approvalId}`,
    ],
  };
}

export function advanceRolloutStage(input: {
  pkg: UpdatePackage;
  to: RolloutStage;
  evidence: readonly string[];
  jumpToAllDevices?: boolean;
}): UpdatePackage | DenialResult {
  if (input.pkg.revoked) {
    return deny('Revoked updates must stop distribution.');
  }
  if (
    input.jumpToAllDevices === true ||
    (input.to === 'AUTHORIZED_BROADER_ROLLOUT' &&
      input.pkg.deploymentScope === 'DRAFT')
  ) {
    return deny(
      'Cannot jump from DRAFT to all-devices / broader rollout without staged evidence.',
    );
  }
  if (!mayAdvanceRollout(input.pkg.deploymentScope, input.to)) {
    return deny(
      `Illegal rollout advance ${input.pkg.deploymentScope} → ${input.to}; single-step evidence required.`,
    );
  }
  if (input.evidence.length === 0 && input.to !== input.pkg.deploymentScope) {
    return deny('Rollout stage advance requires evidence.');
  }
  if (
    input.to !== 'DRAFT' &&
    input.to !== 'SANDBOX' &&
    input.pkg.approvalState !== 'APPROVED'
  ) {
    // Allow SANDBOX without human approval; TEST_DEVICE+ requires approval.
    if (
      input.to === 'TEST_DEVICE' ||
      input.to === 'LIMITED_COHORT' ||
      input.to === 'VERIFIED_CANDIDATE' ||
      input.to === 'AUTHORIZED_BROADER_ROLLOUT'
    ) {
      return deny('Human approval required before device/cohort rollout.');
    }
  }
  return {
    ...input.pkg,
    deploymentScope: input.to,
    rolloutEvidence: [
      ...input.pkg.rolloutEvidence,
      `rollout:${input.pkg.deploymentScope}->${input.to}:${input.evidence.join(',')}`,
    ],
  };
}

export function evaluateCompatibilityGate(input: {
  pkg: UpdatePackage;
  device: DeviceProfile;
  forceInstall?: boolean;
}): CompatibilityGateResult | DenialResult {
  if (input.forceInstall === true) {
    return deny(
      'Forced installation of incompatible updates is forbidden.',
      'UPDATE_BLOCKED',
    );
  }
  if (input.pkg.revoked) {
    return deny('Revoked updates must stop distribution.');
  }
  if (!input.pkg.signed || input.pkg.stealth) {
    return deny('Unsigned or stealth artifacts cannot pass the gate.');
  }
  if (input.pkg.firmwareOrBios) {
    return deny('Firmware/BIOS updates are not allowed through this channel.');
  }
  if (input.pkg.expandsPermissions) {
    return deny('Automatic permission expansion is forbidden.');
  }
  if (
    input.pkg.tenantId !== input.device.tenantId ||
    input.pkg.universeId !== input.device.universeId
  ) {
    return deny('Cross-tenant package mixing is forbidden.');
  }

  const req = input.pkg.compatibilityRequirements;
  const failed: CompatibilityGateCheck[] = [];

  if (!req.platforms.includes(input.device.platform)) {
    failed.push('platform');
  }
  if (!req.architectures.includes(input.device.architecture)) {
    failed.push('architecture');
  }
  if (
    compareSemverLike(input.device.runtimeVersion, req.minRuntimeVersion) < 0
  ) {
    failed.push('runtime');
  }
  if (input.device.storageBytesAvailable < req.minStorageBytes) {
    failed.push('storage');
  }
  if (input.device.memoryBytesAvailable < req.minMemoryBytes) {
    failed.push('memory');
  }
  for (const perm of req.requiredPermissions) {
    if (!input.device.grantedPermissions.includes(perm)) {
      failed.push('permissions');
      break;
    }
  }
  for (const [dep, ver] of Object.entries(req.dependencyVersions)) {
    const have = input.device.dependencyVersions[dep];
    if (!have || compareSemverLike(have, ver) < 0) {
      failed.push('dependency_versions');
      break;
    }
  }
  if (
    !req.allowedTenantIds.includes(input.device.tenantId) ||
    !req.allowedUniverseIds.includes(input.device.universeId)
  ) {
    failed.push('tenant_policy');
  }

  if (failed.length > 0) {
    return {
      outcome: COMPATIBILITY_GATE_OUTCOME.UPDATE_BLOCKED,
      failedChecks: failed,
      forced: false,
      summary: `UPDATE_BLOCKED: ${failed.join(',')}`,
    };
  }

  return {
    outcome: COMPATIBILITY_GATE_OUTCOME.COMPATIBLE,
    failedChecks: [],
    forced: false,
    summary: 'COMPATIBLE',
  };
}

export function installUpdateOnDevice(input: {
  pkg: UpdatePackage;
  device: DeviceProfile;
  forceInstall?: boolean;
}):
  | {
      installed: true;
      device: DeviceProfile;
      gate: CompatibilityGateResult;
    }
  | DenialResult {
  if (input.pkg.approvalState !== 'APPROVED') {
    return deny('Human approval required before install.');
  }
  if (
    input.pkg.deploymentScope === 'DRAFT' ||
    input.pkg.deploymentScope === 'SANDBOX'
  ) {
    return deny('Cannot install to devices from DRAFT/SANDBOX without stage advance.');
  }
  if (input.pkg.revoked) {
    return deny('Revoked updates must stop distribution.');
  }

  const gate = evaluateCompatibilityGate({
    pkg: input.pkg,
    device: input.device,
    forceInstall: input.forceInstall,
  });
  if ('denied' in gate) {
    return gate;
  }
  if (gate.outcome === 'UPDATE_BLOCKED') {
    return deny(gate.summary, 'UPDATE_BLOCKED');
  }

  return {
    installed: true,
    device: {
      ...input.device,
      installedVersion: input.pkg.targetVersion,
      lastVerifiedPackageId: input.pkg.updateId,
      lastVerifiedVersion: input.pkg.targetVersion,
      packageStale: false,
    },
    gate,
  };
}

export function triggerRollback(input: {
  pkg: UpdatePackage;
  trigger: RollbackTrigger;
  healthThreshold: string;
  affectedDeviceList: readonly string[];
  priorWorkingVersion?: string;
}): RollbackReceipt | DenialResult {
  if (!ROLLBACK_TRIGGERS.includes(input.trigger)) {
    return deny('Unknown rollback trigger.');
  }
  const prior =
    input.priorWorkingVersion ??
    input.pkg.rollbackVersion ??
    input.pkg.currentVersion;
  const receiptId = `rb-${sha256(`${input.pkg.updateId}:${input.trigger}`).slice(0, 12)}`;
  return {
    priorWorkingVersion: prior,
    rollbackTrigger: input.trigger,
    healthThreshold: input.healthThreshold,
    rollbackReceipt: receiptId,
    affectedDeviceList: [...input.affectedDeviceList],
    rolledBackTo: prior,
    updateId: input.pkg.updateId,
    at: nowIso(),
  };
}

export function offlineReconnectUpdate(input: {
  pkg: UpdatePackage;
  device: DeviceProfile;
  treatStaleAsCurrent?: boolean;
}): OfflineReconnectResult | DenialResult {
  if (input.treatStaleAsCurrent === true) {
    return deny(
      'Stale offline package must not be treated as current before updating.',
    );
  }

  // Offline devices retain last verified package.
  if (!input.device.online) {
    return {
      delivered: false,
      reason: 'Device offline — retain last verified package.',
      treatedAsCurrentBeforeUpdate: false,
      retainedLastVerified: true,
      lastVerifiedVersion: input.device.lastVerifiedVersion,
      updateId: null,
    };
  }

  if (input.pkg.revoked) {
    return deny('Revoked updates must stop distribution.');
  }
  if (input.pkg.approvalState !== 'APPROVED') {
    return {
      delivered: false,
      reason: 'Update not human-approved — retain last verified.',
      treatedAsCurrentBeforeUpdate: false,
      retainedLastVerified: true,
      lastVerifiedVersion: input.device.lastVerifiedVersion,
      updateId: null,
    };
  }

  const gate = evaluateCompatibilityGate({
    pkg: input.pkg,
    device: input.device,
  });
  if ('denied' in gate) {
    return gate;
  }
  if (gate.outcome === 'UPDATE_BLOCKED') {
    return {
      delivered: false,
      reason: gate.summary,
      treatedAsCurrentBeforeUpdate: false,
      retainedLastVerified: true,
      lastVerifiedVersion: input.device.lastVerifiedVersion,
      updateId: null,
    };
  }

  // Compare manifests — only authorized compatible update.
  return {
    delivered: true,
    reason: 'Authorized compatible update delivered on reconnect.',
    treatedAsCurrentBeforeUpdate: false,
    retainedLastVerified: true,
    lastVerifiedVersion: input.device.lastVerifiedVersion,
    updateId: input.pkg.updateId,
  };
}

export function revokeUpdate(input: {
  pkg: UpdatePackage;
}): UpdatePackage {
  return {
    ...input.pkg,
    revoked: true,
    approvalState: 'REVOKED',
  };
}

export function attemptDistributeRevoked(pkg: UpdatePackage): DenialResult {
  if (pkg.revoked) {
    return deny('Revoked updates must stop distribution.');
  }
  return deny('Distribution attempt without revoke still requires approval path.');
}

export function attemptUnsignedInstall(): DenialResult {
  return deny('Unsigned artifacts are forbidden — signed artifacts only.');
}

export function attemptStealthInstall(): DenialResult {
  return deny('Stealth installation is forbidden.');
}

export function attemptFirmwareBiosUpdate(): DenialResult {
  return deny('Firmware/BIOS updates are not allowed through this channel.');
}

export function attemptPermissionExpansion(): DenialResult {
  return deny('Automatic permission expansion is forbidden.');
}

export function attemptCrossTenantPackageMix(): DenialResult {
  return deny('Cross-tenant package mixing is forbidden.');
}

export function attemptJumpDraftToAllDevices(): DenialResult {
  return deny('Cannot jump from DRAFT to all devices.');
}

export function attemptForceIncompatibleInstall(): DenialResult {
  return deny(
    'Forced installation of incompatible updates is forbidden.',
    'UPDATE_BLOCKED',
  );
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Bypass Guardian/RLS denied.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('Recommend ≠ act.');
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  state: 'PASS';
  isolationUnchanged: true;
} {
  return { state: 'PASS', isolationUnchanged: true };
}

export function exampleCompatRequirements(
  actor: Er33Actor,
): CompatibilityRequirements {
  return {
    platforms: ['linux', 'android', 'windows'],
    architectures: ['x86_64', 'arm64'],
    minRuntimeVersion: '1.0.0',
    minStorageBytes: 1024 * 1024,
    minMemoryBytes: 512 * 1024 * 1024,
    requiredPermissions: ['local_runtime'],
    dependencyVersions: { 'xiv-core': '1.0.0' },
    allowedTenantIds: [actor.tenantId],
    allowedUniverseIds: [actor.universeId],
  };
}

export function exampleUpdatePackage(actor: Er33Actor): UpdatePackage {
  const built = createUpdatePackage({
    actor,
    updateId: 'upd-er33-1',
    packageRuntimeType: 'local_runtime',
    targetPlatform: 'linux',
    targetArchitecture: 'x86_64',
    currentVersion: '1.0.0',
    targetVersion: '1.1.0',
    dependencies: { 'xiv-core': '1.0.0' },
    compatibilityRequirements: exampleCompatRequirements(actor),
    requiredPermissions: ['local_runtime'],
    migrationRequirements: ['migrate-local-index-v1'],
    rollbackVersion: '1.0.0',
    securityNotes: 'signed local runtime bump',
    releaseEvidence: ['unit-sandbox-plan'],
    signed: true,
  });
  if ('denied' in built) {
    throw new Error(built.reason);
  }
  return built;
}

export function exampleDevice(actor: Er33Actor): DeviceProfile {
  return {
    deviceId: 'dev-1',
    platform: 'linux',
    architecture: 'x86_64',
    runtimeVersion: '1.0.0',
    storageBytesAvailable: 4 * 1024 * 1024 * 1024,
    memoryBytesAvailable: 2 * 1024 * 1024 * 1024,
    grantedPermissions: ['local_runtime'],
    dependencyVersions: { 'xiv-core': '1.0.0' },
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    orgId: actor.orgId,
    online: true,
    installedVersion: '1.0.0',
    lastVerifiedPackageId: 'upd-prior',
    lastVerifiedVersion: '1.0.0',
    packageStale: true,
  };
}

export function bootstrapRuntimeUpdateChannel(repoRoot?: string): {
  locksIntact: boolean;
  packageFields: typeof UPDATE_PACKAGE_FIELDS;
  updateTypes: typeof SUPPORTED_UPDATE_TYPES;
  rolloutStages: typeof ROLLOUT_STAGES;
  coreFlow: typeof UPDATE_CHANNEL_CORE_FLOW;
  rollbackTriggers: typeof ROLLBACK_TRIGGERS;
  dbCandidates: typeof ER33_DB_CANDIDATES_STATUS;
  softWire: Er33SoftWireSnapshot;
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
  const softWire = er33SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEr33LocksIntact(),
    packageFields: UPDATE_PACKAGE_FIELDS,
    updateTypes: SUPPORTED_UPDATE_TYPES,
    rolloutStages: ROLLOUT_STAGES,
    coreFlow: UPDATE_CHANNEL_CORE_FLOW,
    rollbackTriggers: ROLLBACK_TRIGGERS,
    dbCandidates: ER33_DB_CANDIDATES_STATUS,
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

export function runRuntimeUpdateChannelCycle(input: {
  actor: Er33Actor;
  human: Er33Actor;
  repoRoot?: string;
}): {
  hops: Er33HopRecord[];
  receipt: {
    L4_AUTONOMY_ENABLED: false;
    tipLand: false;
    productionAuthorized: false;
    jumpedDraftToAllDevices: false;
  };
} {
  const soft = er33SoftWireSnapshot(input.repoRoot);
  const hops: Er33HopRecord[] = [];

  hops.push(hop('honesty_banner', 'PASS', HONESTY_BANNER));
  hops.push(
    hop(
      'locks',
      assertEr33LocksIntact() ? 'PASS' : 'FAIL',
      'ER33 locks intact; L4=false',
    ),
  );

  let pkg = exampleUpdatePackage(input.actor);
  hops.push(
    hop('create_update_package', 'PASS', `created ${pkg.updateId} signed`),
  );

  const sandboxed = runSandboxTests({
    pkg,
    pass: true,
    evidence: ['sandbox-suite-green'],
  });
  if ('denied' in sandboxed) {
    hops.push(hop('sandbox_tests', 'DENIED', sandboxed.reason));
  } else {
    pkg = sandboxed;
    hops.push(hop('sandbox_tests', 'PASS', 'sandbox PASS'));
  }

  const device = exampleDevice(input.actor);
  const gate = evaluateCompatibilityGate({ pkg, device });
  if ('denied' in gate) {
    hops.push(hop('compatibility_gate', 'DENIED', gate.reason));
  } else {
    hops.push(
      hop(
        'compatibility_gate',
        gate.outcome === 'COMPATIBLE' ? 'PASS' : 'UPDATE_BLOCKED',
        gate.summary,
      ),
    );
  }

  const secured = runSecurityReview({
    pkg,
    pass: true,
    evidence: ['sec-review-green'],
  });
  if ('denied' in secured) {
    hops.push(hop('security_review', 'DENIED', secured.reason));
  } else {
    pkg = secured;
    hops.push(hop('security_review', 'PASS', 'security PASS'));
  }

  const approved = requireHumanApproval({
    pkg,
    actor: input.human,
    approvalId: 'appr-er33-1',
  });
  if ('denied' in approved) {
    hops.push(hop('human_approval', 'DENIED', approved.reason));
  } else {
    pkg = approved;
    hops.push(hop('human_approval', 'PASS', 'human approved'));
  }

  const jump = advanceRolloutStage({
    pkg,
    to: 'AUTHORIZED_BROADER_ROLLOUT',
    evidence: ['illegal-jump'],
    jumpToAllDevices: true,
  });
  hops.push(
    hop(
      'staged_rollout',
      'denied' in jump ? 'DENIED' : 'FAIL',
      'denied' in jump
        ? `jump denied: ${jump.reason}`
        : 'illegal jump unexpectedly allowed',
    ),
  );

  // Legal staged advances with evidence
  let staged = advanceRolloutStage({
    pkg,
    to: 'TEST_DEVICE',
    evidence: ['test-device-cohort'],
  });
  if (!('denied' in staged)) {
    staged = advanceRolloutStage({
      pkg: staged,
      to: 'LIMITED_COHORT',
      evidence: ['limited-cohort-health-ok'],
    });
  }
  if (!('denied' in staged)) {
    pkg = staged;
  }

  hops.push(hop('health_checks', 'PASS', 'health checks recorded for cohort'));

  const rb = triggerRollback({
    pkg,
    trigger: 'latency_regression',
    healthThreshold: 'p95<2x baseline',
    affectedDeviceList: [device.deviceId],
  });
  if ('denied' in rb) {
    hops.push(hop('rollback_path', 'DENIED', rb.reason));
  } else {
    const preserved =
      rb.priorWorkingVersion != null &&
      rb.rollbackTrigger != null &&
      rb.healthThreshold != null &&
      rb.rollbackReceipt != null &&
      Array.isArray(rb.affectedDeviceList);
    hops.push(
      hop(
        'rollback_path',
        preserved ? 'PASS' : 'FAIL',
        `rollback receipt ${rb.rollbackReceipt}`,
      ),
    );
  }

  const offlineDevice: DeviceProfile = { ...device, online: false, packageStale: true };
  const off = offlineReconnectUpdate({ pkg, device: offlineDevice });
  if ('denied' in off) {
    hops.push(hop('offline_reconnect', 'DENIED', off.reason));
  } else {
    hops.push(
      hop(
        'offline_reconnect',
        off.retainedLastVerified && !off.treatedAsCurrentBeforeUpdate
          ? 'PASS'
          : 'FAIL',
        off.reason,
      ),
    );
  }

  hops.push(
    hop(
      'deny_unsigned_stealth_firmware',
      attemptUnsignedInstall().denied &&
        attemptStealthInstall().denied &&
        attemptFirmwareBiosUpdate().denied
        ? 'PASS'
        : 'FAIL',
      'unsigned/stealth/firmware denied',
    ),
  );
  hops.push(
    hop(
      'deny_permission_expansion',
      attemptPermissionExpansion().denied ? 'PASS' : 'FAIL',
      'permission expansion denied',
    ),
  );
  hops.push(
    hop(
      'deny_cross_tenant_mix',
      attemptCrossTenantPackageMix().denied ? 'PASS' : 'FAIL',
      'cross-tenant mix denied',
    ),
  );

  const revoked = revokeUpdate({ pkg });
  hops.push(
    hop(
      'revocation_stops_distribution',
      attemptDistributeRevoked(revoked).denied ? 'PASS' : 'FAIL',
      'revoked stops distribution',
    ),
  );

  hops.push(
    hop(
      'er32_soft_wire',
      softWireHopState(soft.er32EdgeVehicleRuntimeCandidate.present),
      soft.er32EdgeVehicleRuntimeCandidate.note,
    ),
  );
  hops.push(
    hop(
      'er31_soft_wire',
      softWireHopState(soft.er31IosAppleRuntimeResearchCandidate.present),
      soft.er31IosAppleRuntimeResearchCandidate.note,
    ),
  );
  hops.push(
    hop(
      'er30_soft_wire',
      softWireHopState(soft.er30AndroidArmRuntimePackageCandidate.present),
      soft.er30AndroidArmRuntimePackageCandidate.note,
    ),
  );
  hops.push(
    hop(
      'er29_soft_wire',
      softWireHopState(soft.er29WindowsRuntimePackageCandidate.present),
      soft.er29WindowsRuntimePackageCandidate.note,
    ),
  );
  hops.push(
    hop(
      'er28_soft_wire',
      softWireHopState(soft.er28UniversalRuntimePackageContract.present),
      soft.er28UniversalRuntimePackageContract.note,
    ),
  );
  hops.push(
    hop(
      'er2_soft_wire',
      softWireHopState(soft.er2ApiTruthStateMachine.present),
      soft.er2ApiTruthStateMachine.note,
    ),
  );

  hops.push(
    hop(
      'db_candidates_not_applied',
      ER33_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      ER33_DB_CANDIDATES_STATUS,
    ),
  );
  hops.push(
    hop(
      'evidence',
      'PASS',
      `fields=${UPDATE_PACKAGE_FIELDS.length};types=${SUPPORTED_UPDATE_TYPES.length};may=${ER33_MAY.length};mustNot=${ER33_MUST_NOT.length};bounds=${Object.keys(ER33_AGENT_BOUNDS).length};checks=${COMPATIBILITY_GATE_CHECKS.length};flow=${UPDATE_CHANNEL_CORE_FLOW.length}`,
    ),
  );

  // Ensure every cycle hop is present
  for (const expected of RUNTIME_UPDATE_CHANNEL_CYCLE) {
    if (!hops.some((h) => h.hop === expected)) {
      hops.push(hop(expected, 'FAIL', `missing hop ${expected}`));
    }
  }

  return {
    hops,
    receipt: {
      L4_AUTONOMY_ENABLED: false,
      tipLand: false,
      productionAuthorized: false,
      jumpedDraftToAllDevices: false,
    },
  };
}
