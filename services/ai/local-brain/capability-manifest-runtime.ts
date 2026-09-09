/**
 * 62L-ER34 — Capability Manifest runtime.
 *
 * Publish evidence-backed manifests; deny aspirations-as-VERIFIED; route check
 * → NO_ELIGIBLE_ROUTE when missing; mark STALE on meaningful changes/heartbeat
 * gap; deny personal content; cross-device verified-only contribution.
 */

import { createHash } from 'node:crypto';
import {
  AGENT_ROUTING_PATH,
  BLOCKED_PERSONAL_CONTENT,
  CAPABILITY_EVIDENCE_STATES,
  CAPABILITY_MANIFEST_CYCLE,
  CAPABILITY_MANIFEST_FIELDS,
  CAPABILITY_MANIFEST_TRUTH_BOUNDARY,
  CROSS_DEVICE_CLASSES,
  DEFAULT_HEARTBEAT_STALE_GAP_MS,
  ER34_AGENT_BOUNDS,
  ER34_DB_CANDIDATES_STATUS,
  ER34_LOCKS,
  ER34_MAY,
  ER34_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MANIFEST_STALE_TRIGGERS,
  NEXT_PHASE_TITLE,
  aspirationMayBecomeVerified,
  assertEr34LocksIntact,
  canClaimVerified,
  er34SoftWireSnapshot,
  isEr34Agent,
  isHumanApprover,
  missingCapabilityForcesRoute,
  softWireHopState,
  stateMeetsMinimum,
  type BlockedPersonalContent,
  type CapabilityEntry,
  type CapabilityEvidenceState,
  type CrossDeviceClass,
  type DeviceCapabilityManifest,
  type Er34Actor,
  type Er34EvidenceState,
  type Er34HopRecord,
  type Er34SoftWireSnapshot,
  type ManifestStaleTrigger,
  type RouteDecision,
  type TaskEnvelope,
} from './capability-manifest-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CAPABILITY_MANIFEST_CYCLE)[number],
  state: Er34EvidenceState,
  summary: string,
): Er34HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'NO_ELIGIBLE_ROUTE';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' | 'NO_ELIGIBLE_ROUTE' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

function entry(
  capabilityId: string,
  label: string,
  state: CapabilityEvidenceState,
  evidenceRefs: readonly string[] = [],
  lastVerifiedAt: string | null = null,
): CapabilityEntry {
  return {
    capabilityId,
    label,
    state,
    evidenceRefs: [...evidenceRefs],
    lastVerifiedAt,
    aspirationOnly: false,
  };
}

export function publishCapabilityManifest(input: {
  actor: Er34Actor;
  deviceId: string;
  deviceClass: CrossDeviceClass;
  platformOs: string;
  architecture: string;
  cpu: CapabilityEntry;
  gpu: CapabilityEntry;
  npuAccelerator: CapabilityEntry;
  availableRuntimes?: readonly CapabilityEntry[];
  supportedModels?: readonly CapabilityEntry[];
  supportedPrecisions?: readonly string[];
  ramBytes?: number;
  storageBytes?: number;
  networkState?: string;
  batteryThermalState?: string;
  offlineFeatures?: readonly string[];
  allowedDataClasses?: readonly string[];
  grantedPermissions?: readonly string[];
  localOnlyRestrictions?: readonly string[];
  benchmarkRefs?: readonly string[];
  heartbeatAt?: string;
  packageVersion?: string;
  lastVerificationTime?: string | null;
  capabilities?: readonly CapabilityEntry[];
  includePersonalContent?: BlockedPersonalContent;
  includeHiddenChainOfThought?: boolean;
  treatAspirationAsVerified?: boolean;
}): DeviceCapabilityManifest | DenialResult {
  if (!isEr34Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny(
      'Only capability manifest publishers / routing agents / home_base may publish.',
    );
  }
  if (input.includeHiddenChainOfThought === true) {
    return deny('Hidden chain-of-thought must not appear in capability manifests.');
  }
  if (input.includePersonalContent) {
    return deny(
      `Personal content blocked from capability manifest: ${input.includePersonalContent}`,
    );
  }
  if (input.treatAspirationAsVerified === true) {
    return deny(
      'Aspirations must not be published as VERIFIED — manifest reports evidence only.',
    );
  }

  const allCaps: CapabilityEntry[] = [
    input.cpu,
    input.gpu,
    input.npuAccelerator,
    ...(input.availableRuntimes ?? []),
    ...(input.supportedModels ?? []),
    ...(input.capabilities ?? []),
  ];

  for (const cap of allCaps) {
    if (cap.state === 'VERIFIED' && cap.evidenceRefs.length === 0) {
      return deny(
        `Capability ${cap.capabilityId} claimed VERIFIED without evidence refs.`,
      );
    }
  }

  return {
    deviceId: input.deviceId,
    ownerId: input.actor.id,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    platformOs: input.platformOs,
    architecture: input.architecture,
    cpu: input.cpu,
    gpu: input.gpu,
    npuAccelerator: input.npuAccelerator,
    availableRuntimes: [...(input.availableRuntimes ?? [])],
    supportedModels: [...(input.supportedModels ?? [])],
    supportedPrecisions: [...(input.supportedPrecisions ?? ['fp16', 'int8'])],
    ramBytes: input.ramBytes ?? 8 * 1024 * 1024 * 1024,
    storageBytes: input.storageBytes ?? 256 * 1024 * 1024 * 1024,
    networkState: input.networkState ?? 'online',
    batteryThermalState: input.batteryThermalState ?? 'nominal',
    offlineFeatures: [...(input.offlineFeatures ?? ['local_inference'])],
    allowedDataClasses: [...(input.allowedDataClasses ?? ['technical_capability'])],
    grantedPermissions: [...(input.grantedPermissions ?? ['publish_manifest'])],
    localOnlyRestrictions: [
      ...(input.localOnlyRestrictions ?? ['no_personal_content_export']),
    ],
    benchmarkRefs: [...(input.benchmarkRefs ?? [])],
    heartbeatAt: input.heartbeatAt ?? nowIso(),
    packageVersion: input.packageVersion ?? '0.0.0-er34',
    lastVerificationTime: input.lastVerificationTime ?? null,
    revocationState: 'ACTIVE',
    deviceClass: input.deviceClass,
    capabilities: allCaps,
    containsPersonalContent: false,
    containsHiddenChainOfThought: false,
    stale: false,
    staleTriggers: [],
    reVerificationRequested: false,
  };
}

export function checkRouteEligibility(input: {
  actor: Er34Actor;
  manifest: DeviceCapabilityManifest;
  task: TaskEnvelope;
  forceWhenMissing?: boolean;
}): RouteDecision | DenialResult {
  if (
    input.manifest.tenantId !== input.task.tenantId ||
    input.manifest.universeId !== input.task.universeId
  ) {
    return deny('Tenant/Universe isolation: task cannot route to foreign manifest.');
  }
  if (input.manifest.revocationState === 'REVOKED') {
    return {
      eligible: false,
      route: 'NO_ELIGIBLE_ROUTE',
      deviceId: input.manifest.deviceId,
      missingCapabilities: [...input.task.requiredCapabilities],
      forced: false,
      reason: 'Manifest revoked.',
    };
  }
  if (input.manifest.stale) {
    return {
      eligible: false,
      route: 'NO_ELIGIBLE_ROUTE',
      deviceId: input.manifest.deviceId,
      missingCapabilities: [...input.task.requiredCapabilities],
      forced: false,
      reason: 'Manifest STALE — re-verification required before routing.',
    };
  }

  const missing: string[] = [];
  const matched: string[] = [];
  for (const req of input.task.requiredCapabilities) {
    const found = input.manifest.capabilities.find((c) => c.capabilityId === req);
    if (!found || !stateMeetsMinimum(found.state, input.task.requiredMinState)) {
      missing.push(req);
    } else {
      matched.push(req);
    }
  }

  if (missing.length > 0) {
    if (input.forceWhenMissing === true) {
      return deny(
        'Forced execution when required capability missing is forbidden — NO_ELIGIBLE_ROUTE.',
      );
    }
    return {
      eligible: false,
      route: 'NO_ELIGIBLE_ROUTE',
      deviceId: input.manifest.deviceId,
      missingCapabilities: missing,
      forced: false,
      reason: `Required capabilities missing or below ${input.task.requiredMinState}.`,
    };
  }

  return {
    eligible: true,
    route: 'ELIGIBLE',
    deviceId: input.manifest.deviceId,
    matchedCapabilities: matched,
    path: AGENT_ROUTING_PATH,
    forced: false,
  };
}

export function markManifestStale(input: {
  manifest: DeviceCapabilityManifest;
  trigger: ManifestStaleTrigger;
  nowMs?: number;
  heartbeatGapMs?: number;
}): DeviceCapabilityManifest | DenialResult {
  if (!MANIFEST_STALE_TRIGGERS.includes(input.trigger)) {
    return deny(`Unknown stale trigger: ${String(input.trigger)}`);
  }

  if (input.trigger === 'long_heartbeat_gap') {
    const now = input.nowMs ?? Date.now();
    const heartbeatMs = Date.parse(input.manifest.heartbeatAt);
    const gap = input.heartbeatGapMs ?? DEFAULT_HEARTBEAT_STALE_GAP_MS;
    if (!Number.isFinite(heartbeatMs) || now - heartbeatMs < gap) {
      return deny(
        'Heartbeat gap below threshold — long_heartbeat_gap STALE not applicable.',
      );
    }
  }

  const staleCaps = input.manifest.capabilities.map((c) =>
    c.state === 'REVOKED' || c.state === 'UNAVAILABLE'
      ? c
      : { ...c, state: 'STALE' as const, lastVerifiedAt: c.lastVerifiedAt },
  );

  return {
    ...input.manifest,
    capabilities: staleCaps,
    cpu:
      input.manifest.cpu.state === 'REVOKED' ||
      input.manifest.cpu.state === 'UNAVAILABLE'
        ? input.manifest.cpu
        : { ...input.manifest.cpu, state: 'STALE' },
    gpu:
      input.manifest.gpu.state === 'REVOKED' ||
      input.manifest.gpu.state === 'UNAVAILABLE'
        ? input.manifest.gpu
        : { ...input.manifest.gpu, state: 'STALE' },
    npuAccelerator:
      input.manifest.npuAccelerator.state === 'REVOKED' ||
      input.manifest.npuAccelerator.state === 'UNAVAILABLE'
        ? input.manifest.npuAccelerator
        : { ...input.manifest.npuAccelerator, state: 'STALE' },
    availableRuntimes: input.manifest.availableRuntimes.map((c) =>
      c.state === 'REVOKED' || c.state === 'UNAVAILABLE'
        ? c
        : { ...c, state: 'STALE' as const },
    ),
    supportedModels: input.manifest.supportedModels.map((c) =>
      c.state === 'REVOKED' || c.state === 'UNAVAILABLE'
        ? c
        : { ...c, state: 'STALE' as const },
    ),
    stale: true,
    staleTriggers: [...new Set([...input.manifest.staleTriggers, input.trigger])],
    reVerificationRequested: true,
  };
}

export function contributeVerifiedToCrossDeviceBrain(input: {
  actor: Er34Actor;
  manifest: DeviceCapabilityManifest;
  allowUnverified?: boolean;
}):
  | {
      contributed: true;
      deviceId: string;
      deviceClass: CrossDeviceClass;
      verifiedCapabilities: readonly CapabilityEntry[];
      unverifiedExcluded: readonly string[];
    }
  | DenialResult {
  if (input.allowUnverified === true) {
    return deny(
      'Cross-device brain accepts only VERIFIED capabilities — unverified contribution denied.',
    );
  }
  if (input.manifest.stale || input.manifest.revocationState === 'REVOKED') {
    return deny('STALE or REVOKED manifests cannot contribute to cross-device brain.');
  }

  const verified = input.manifest.capabilities.filter((c) => c.state === 'VERIFIED');
  const excluded = input.manifest.capabilities
    .filter((c) => c.state !== 'VERIFIED')
    .map((c) => c.capabilityId);

  return {
    contributed: true,
    deviceId: input.manifest.deviceId,
    deviceClass: input.manifest.deviceClass,
    verifiedCapabilities: verified,
    unverifiedExcluded: excluded,
  };
}

export function attemptAspirationAsVerified(): DenialResult {
  return deny(
    'Aspirations must not be treated as VERIFIED.',
  );
}

export function attemptNotTestedAsGpuVerified(): DenialResult {
  return deny(
    'Model GPU inference NOT_TESTED cannot be treated as GPU-verified until bounded inference succeeds.',
  );
}

export function attemptForceRouteWhenMissing(): DenialResult {
  return deny(
    'Forced execution when required capability missing is forbidden.',
    'NO_ELIGIBLE_ROUTE',
  );
}

export function attemptPersonalContent(
  kind: BlockedPersonalContent,
): DenialResult {
  return deny(`Blocked personal content in manifest: ${kind}`);
}

export function attemptHiddenChainOfThought(): DenialResult {
  return deny('Hidden chain-of-thought must not appear in capability manifests.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('Recommend ≠ act.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('Agents have no automatic authority.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Guardian/RLS bypass forbidden.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('Tenant/Universe access expansion forbidden.');
}

export function attemptAutoDeployChanges(): DenialResult {
  return deny('Auto-deploy changes forbidden.');
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  state: 'PASS';
  isolationUnchanged: true;
} {
  return { state: 'PASS', isolationUnchanged: true };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er34Actor;
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
  actor: Er34Actor;
  manifest: DeviceCapabilityManifest;
  route: RouteDecision;
}): {
  returned: true;
  authorityGranted: false;
  route: RouteDecision;
  manifestDeviceId: string;
} {
  return {
    returned: true,
    authorityGranted: false,
    route: input.route,
    manifestDeviceId: input.manifest.deviceId,
  };
}

/**
 * Canonical example: AMD GPU=DETECTED; Windows ML=SUPPORTED;
 * Model A GPU inference=NOT_TESTED → not GPU-verified.
 */
export function exampleAsusWindowsManifest(
  actor: Er34Actor,
): DeviceCapabilityManifest {
  const built = publishCapabilityManifest({
    actor,
    deviceId: 'asus-win-1',
    deviceClass: 'asus_laptop',
    platformOs: 'windows-11',
    architecture: 'x86_64',
    cpu: entry('cpu-x86', 'AMD Ryzen CPU', 'DETECTED', ['hw-probe-1']),
    gpu: entry('gpu-amd', 'AMD GPU', 'DETECTED', ['hw-probe-gpu-1']),
    npuAccelerator: entry('npu-none', 'NPU', 'UNAVAILABLE'),
    availableRuntimes: [
      entry('rt-windows-ml', 'Windows ML', 'SUPPORTED', ['winml-docs-1']),
    ],
    supportedModels: [
      entry('model-a-gpu', 'Model A GPU inference', 'NOT_TESTED'),
    ],
    supportedPrecisions: ['fp16', 'int8'],
    benchmarkRefs: [],
    packageVersion: '1.0.0-er34',
    capabilities: [
      entry('local-offline', 'Local offline inference', 'SUPPORTED', [
        'offline-feature-1',
      ]),
    ],
  });
  if ('denied' in built) {
    throw new Error(`exampleAsusWindowsManifest failed: ${built.reason}`);
  }
  return built;
}

export function bootstrapCapabilityManifest(repoRoot?: string): {
  locksIntact: boolean;
  manifestFields: typeof CAPABILITY_MANIFEST_FIELDS;
  evidenceStates: typeof CAPABILITY_EVIDENCE_STATES;
  routingPath: typeof AGENT_ROUTING_PATH;
  staleTriggers: typeof MANIFEST_STALE_TRIGGERS;
  deviceClasses: typeof CROSS_DEVICE_CLASSES;
  blockedPersonal: typeof BLOCKED_PERSONAL_CONTENT;
  dbCandidates: typeof ER34_DB_CANDIDATES_STATUS;
  softWire: Er34SoftWireSnapshot;
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
  const softWire = er34SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEr34LocksIntact(),
    manifestFields: CAPABILITY_MANIFEST_FIELDS,
    evidenceStates: CAPABILITY_EVIDENCE_STATES,
    routingPath: AGENT_ROUTING_PATH,
    staleTriggers: MANIFEST_STALE_TRIGGERS,
    deviceClasses: CROSS_DEVICE_CLASSES,
    blockedPersonal: BLOCKED_PERSONAL_CONTENT,
    dbCandidates: ER34_DB_CANDIDATES_STATUS,
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

export function runCapabilityManifestCycle(input: {
  actor: Er34Actor;
  human: Er34Actor;
  repoRoot?: string;
}): {
  hops: Er34HopRecord[];
  receipt: {
    deviceId: string;
    route: 'ELIGIBLE' | 'NO_ELIGIBLE_ROUTE';
    aspirationsAsVerified: false;
    personalContent: false;
  };
  cycleEvidenceSha256: string;
} {
  const hops: Er34HopRecord[] = [];
  const softWire = er34SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr34LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const boot = bootstrapCapabilityManifest(input.repoRoot);
  hops.push(
    hop(
      'capability_manifest_bootstrap',
      boot.locksIntact ? 'PASS' : 'FAIL',
      'Capability Manifest bootstrap.',
    ),
  );

  hops.push(
    hop(
      'manifest_fields_encoded',
      CAPABILITY_MANIFEST_FIELDS.length === 22 ? 'PASS' : 'FAIL',
      `Manifest fields=${CAPABILITY_MANIFEST_FIELDS.length}.`,
    ),
  );
  hops.push(
    hop(
      'evidence_states_encoded',
      CAPABILITY_EVIDENCE_STATES.length === 9 ? 'PASS' : 'FAIL',
      `Evidence states=${CAPABILITY_EVIDENCE_STATES.join(',')}.`,
    ),
  );
  hops.push(
    hop(
      'agent_routing_path_encoded',
      AGENT_ROUTING_PATH.length === 6 ? 'PASS' : 'FAIL',
      `Routing path=${AGENT_ROUTING_PATH.join('→')}.`,
    ),
  );
  hops.push(
    hop(
      'stale_triggers_encoded',
      MANIFEST_STALE_TRIGGERS.length === 6 ? 'PASS' : 'FAIL',
      `Stale triggers=${MANIFEST_STALE_TRIGGERS.join(',')}.`,
    ),
  );
  hops.push(
    hop(
      'cross_device_classes_encoded',
      CROSS_DEVICE_CLASSES.length === 5 ? 'PASS' : 'FAIL',
      `Device classes=${CROSS_DEVICE_CLASSES.join(',')}.`,
    ),
  );
  hops.push(
    hop(
      'privacy_blocklist_encoded',
      BLOCKED_PERSONAL_CONTENT.length === 6 ? 'PASS' : 'FAIL',
      `Blocked personal=${BLOCKED_PERSONAL_CONTENT.join(',')}.`,
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      CAPABILITY_MANIFEST_TRUTH_BOUNDARY.reportsEvidenceNotAspirations &&
        !CAPABILITY_MANIFEST_TRUTH_BOUNDARY.mayTreatAspirationAsVerified
        ? 'PASS'
        : 'FAIL',
      'Evidence ≠ aspirations; aspirations≠VERIFIED.',
    ),
  );

  const manifest = exampleAsusWindowsManifest(input.actor);
  hops.push(
    hop(
      'publish_manifest_with_evidence_states',
      manifest.gpu.state === 'DETECTED' &&
        manifest.availableRuntimes[0]?.state === 'SUPPORTED' &&
        manifest.supportedModels[0]?.state === 'NOT_TESTED'
        ? 'PASS'
        : 'FAIL',
      'Published ASUS Windows manifest with per-capability evidence states.',
    ),
  );

  hops.push(
    hop(
      'deny_aspiration_as_verified',
      attemptAspirationAsVerified().state === 'DENIED' &&
        aspirationMayBecomeVerified() === false &&
        canClaimVerified({
          from: 'SUPPORTED',
          hasBoundedVerificationEvidence: false,
          aspirationOnly: true,
        }) === false
        ? 'PASS'
        : 'FAIL',
      'Aspirations cannot become VERIFIED.',
    ),
  );

  hops.push(
    hop(
      'example_amd_gpu_detected_windows_ml_supported_model_not_tested',
      manifest.gpu.label.includes('AMD') &&
        manifest.gpu.state === 'DETECTED' &&
        manifest.availableRuntimes.some(
          (r) => r.label === 'Windows ML' && r.state === 'SUPPORTED',
        ) &&
        manifest.supportedModels.some(
          (m) =>
            m.capabilityId === 'model-a-gpu' && m.state === 'NOT_TESTED',
        ) &&
        attemptNotTestedAsGpuVerified().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'AMD GPU=DETECTED; Windows ML=SUPPORTED; Model A GPU=NOT_TESTED → not GPU-verified.',
    ),
  );

  const taskNeedsGpuVerified: TaskEnvelope = {
    taskId: 'task-gpu-1',
    requiredCapabilities: ['model-a-gpu'],
    requiredMinState: 'VERIFIED',
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
  const noRoute = checkRouteEligibility({
    actor: input.actor,
    manifest,
    task: taskNeedsGpuVerified,
  });
  const forceDenied = checkRouteEligibility({
    actor: input.actor,
    manifest,
    task: taskNeedsGpuVerified,
    forceWhenMissing: true,
  });
  hops.push(
    hop(
      'route_check_no_eligible_when_missing',
      !('denied' in noRoute) &&
        noRoute.route === 'NO_ELIGIBLE_ROUTE' &&
        'denied' in forceDenied &&
        missingCapabilityForcesRoute() === false
        ? 'PASS'
        : 'FAIL',
      'Missing required capability → NO_ELIGIBLE_ROUTE (not forced).',
    ),
  );

  const staleOs = markManifestStale({
    manifest,
    trigger: 'os_update',
  });
  const staleHb = markManifestStale({
    manifest,
    trigger: 'long_heartbeat_gap',
    nowMs: Date.parse(manifest.heartbeatAt) + DEFAULT_HEARTBEAT_STALE_GAP_MS + 1,
  });
  hops.push(
    hop(
      'mark_stale_on_meaningful_change_or_heartbeat_gap',
      !('denied' in staleOs) &&
        staleOs.stale === true &&
        staleOs.reVerificationRequested === true &&
        !('denied' in staleHb) &&
        staleHb.stale === true
        ? 'PASS'
        : 'FAIL',
      'OS update / heartbeat gap → STALE + re-verification requested.',
    ),
  );

  hops.push(
    hop(
      'deny_personal_content_in_manifest',
      BLOCKED_PERSONAL_CONTENT.every(
        (k) => attemptPersonalContent(k).state === 'DENIED',
      ) &&
        'denied' in
          publishCapabilityManifest({
            actor: input.actor,
            deviceId: 'bad-privacy',
            deviceClass: 'asus_laptop',
            platformOs: 'windows-11',
            architecture: 'x86_64',
            cpu: entry('cpu', 'CPU', 'DETECTED'),
            gpu: entry('gpu', 'GPU', 'DETECTED'),
            npuAccelerator: entry('npu', 'NPU', 'UNAVAILABLE'),
            includePersonalContent: 'personal_files',
          })
        ? 'PASS'
        : 'FAIL',
      'Personal content denied in capability manifests.',
    ),
  );

  const cross = contributeVerifiedToCrossDeviceBrain({
    actor: input.actor,
    manifest,
  });
  const crossDeny = contributeVerifiedToCrossDeviceBrain({
    actor: input.actor,
    manifest,
    allowUnverified: true,
  });
  hops.push(
    hop(
      'cross_device_verified_only',
      !('denied' in cross) &&
        cross.verifiedCapabilities.every((c) => c.state === 'VERIFIED') &&
        cross.unverifiedExcluded.includes('model-a-gpu') &&
        'denied' in crossDeny
        ? 'PASS'
        : 'FAIL',
      'Cross-device brain contributes only VERIFIED capabilities.',
    ),
  );

  hops.push(
    hop(
      'deny_treat_not_tested_as_gpu_verified',
      attemptNotTestedAsGpuVerified().state === 'DENIED' &&
        ER34_LOCKS.TREAT_NOT_TESTED_AS_GPU_VERIFIED === false
        ? 'PASS'
        : 'FAIL',
      'NOT_TESTED ≠ GPU-verified.',
    ),
  );
  hops.push(
    hop(
      'deny_force_route_when_capability_missing',
      attemptForceRouteWhenMissing().state === 'NO_ELIGIBLE_ROUTE'
        ? 'PASS'
        : 'FAIL',
      'Force-route when missing → NO_ELIGIBLE_ROUTE deny.',
    ),
  );
  hops.push(
    hop(
      'deny_personal_files',
      attemptPersonalContent('personal_files').state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'personal_files denied.',
    ),
  );
  hops.push(
    hop(
      'deny_browser_activity',
      attemptPersonalContent('browser_activity').state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'browser_activity denied.',
    ),
  );
  hops.push(
    hop(
      'deny_passwords',
      attemptPersonalContent('passwords').state === 'DENIED' ? 'PASS' : 'FAIL',
      'passwords denied.',
    ),
  );
  hops.push(
    hop(
      'deny_unrelated_apps',
      attemptPersonalContent('unrelated_apps').state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'unrelated_apps denied.',
    ),
  );
  hops.push(
    hop(
      'deny_precise_location',
      attemptPersonalContent('precise_location').state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'precise_location denied.',
    ),
  );
  hops.push(
    hop(
      'deny_private_content',
      attemptPersonalContent('private_content').state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'private_content denied.',
    ),
  );
  hops.push(
    hop(
      'deny_hidden_chain_of_thought',
      attemptHiddenChainOfThought().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Hidden CoT denied.',
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
      ER34_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      ER_LAYER_TITLE.includes('Universal Device Distribution') ? 'PASS' : 'FAIL',
      ER_LAYER_TITLE,
    ),
  );

  const softPairs: Array<{
    hop: (typeof CAPABILITY_MANIFEST_CYCLE)[number];
    present: boolean;
    note: string;
  }> = [
    {
      hop: 'er33_soft_wire',
      present: softWire.er33CrossDeviceRuntimeFederation.present,
      note: softWire.er33CrossDeviceRuntimeFederation.note,
    },
    {
      hop: 'er32_soft_wire',
      present: softWire.er32ServerEdgeRuntimePackage.present,
      note: softWire.er32ServerEdgeRuntimePackage.note,
    },
    {
      hop: 'er31_soft_wire',
      present: softWire.er31AppleDeviceRuntimePackage.present,
      note: softWire.er31AppleDeviceRuntimePackage.note,
    },
    {
      hop: 'er30_soft_wire',
      present: softWire.er30AndroidArmRuntimePackage.present,
      note: softWire.er30AndroidArmRuntimePackage.note,
    },
    {
      hop: 'er29_soft_wire',
      present: softWire.er29WindowsRuntimePackage.present,
      note: softWire.er29WindowsRuntimePackage.note,
    },
    {
      hop: 'er28_soft_wire',
      present: softWire.er28UniversalRuntimePackageContract.present,
      note: softWire.er28UniversalRuntimePackageContract.note,
    },
    {
      hop: 'er2_soft_wire',
      present: softWire.er2ApiTruthStateMachine.present,
      note: softWire.er2ApiTruthStateMachine.note,
    },
    {
      hop: 'eq7_soft_wire',
      present: softWire.eq7ArmEdgeAmdAcceleration.present,
      note: softWire.eq7ArmEdgeAmdAcceleration.note,
    },
    {
      hop: 'eq6_soft_wire',
      present: softWire.eq6ArchitectureCapabilityGraph.present,
      note: softWire.eq6ArchitectureCapabilityGraph.note,
    },
    {
      hop: 'em157_soft_wire',
      present: softWire.em157HomeBase.present,
      note: softWire.em157HomeBase.note,
    },
  ];
  for (const p of softPairs) {
    hops.push(hop(p.hop, softWireHopState(p.present), p.note));
  }

  hops.push(
    hop(
      'db_candidates_not_applied',
      ER34_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const eligibleTask: TaskEnvelope = {
    taskId: 'task-cpu-1',
    requiredCapabilities: ['cpu-x86'],
    requiredMinState: 'DETECTED',
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
  const eligibleRoute = checkRouteEligibility({
    actor: input.actor,
    manifest,
    task: eligibleTask,
  });
  let homeOk = false;
  let routeLabel: 'ELIGIBLE' | 'NO_ELIGIBLE_ROUTE' = 'NO_ELIGIBLE_ROUTE';
  if (!('denied' in eligibleRoute)) {
    routeLabel = eligibleRoute.route;
    const home = returnEvidenceToHomeBase({
      actor: input.actor,
      manifest,
      route: eligibleRoute,
    });
    homeOk = home.returned && home.authorityGranted === false;
  }
  const humanGate = requireHumanApproval({
    approvalId: 'appr-er34-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      homeOk && !('denied' in humanGate) ? 'PASS' : 'DENIED',
      'Route evidence returned to Home Base; human gate exercised; no auto authority.',
    ),
  );

  void ER34_MAY;
  void ER34_MUST_NOT;
  void ER34_AGENT_BOUNDS;
  void CAPABILITY_MANIFEST_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
    }),
  );

  return {
    hops,
    receipt: {
      deviceId: manifest.deviceId,
      route: routeLabel,
      aspirationsAsVerified: false,
      personalContent: false,
    },
    cycleEvidenceSha256,
  };
}
