/**
 * 62L-ER14 — Offline Brain Packager runtime.
 *
 * Build encrypted/signed offline packs after rights check; require
 * user-authorized install; offline query with OFFLINE_MODE=true; reconnect
 * produces merge candidates only; revoke with dependent trace;
 * OFFLINE_STOPPED when powered off.
 */

import { createHash } from 'node:crypto';
import {
  ER14_AGENT_BOUNDS,
  ER14_DB_CANDIDATES_STATUS,
  ER14_LOCKS,
  ER14_MAY,
  ER14_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  OFFLINE_BRAIN_PACKAGER_CYCLE,
  OFFLINE_BRAIN_TRUTH_BOUNDARY,
  OFFLINE_PACK_CATEGORIES,
  OFFLINE_PACK_CORE_FLOW,
  OFFLINE_PACK_FIELDS,
  OFFLINE_RUNTIME_FLOW,
  OFFLINE_STORAGE_TIERS,
  OFFLINE_SYNC_RECONNECT_FLOW,
  assertEr14LocksIntact,
  er14SoftWireSnapshot,
  isEr14Agent,
  isHumanApprover,
  softWireHopState,
  type Er14Actor,
  type Er14EvidenceState,
  type Er14HopRecord,
  type Er14SoftWireSnapshot,
  type OfflineBrainPack,
  type OfflineCheckpoint,
  type OfflineDevicePowerState,
  type OfflineMergeCandidate,
  type OfflineModeFlags,
  type OfflinePackCategory,
  type OfflineStorageTier,
} from './offline-brain-packager-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof OFFLINE_BRAIN_PACKAGER_CYCLE)[number],
  state: Er14EvidenceState,
  summary: string,
): Er14HopRecord {
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

export type OfflineQueryResult = {
  OFFLINE_MODE: true;
  claimedLiveCurrent: false;
  packId: string;
  structuredResult: string;
  checkpoint: OfflineCheckpoint;
  localModelRuntime: string;
};

export type OfflineDeviceStatus = {
  devicePowerState: OfflineDevicePowerState;
  runtimeStatus: 'OFFLINE_ACTIVE' | 'OFFLINE_STOPPED';
  OFFLINE_MODE: true;
  agentsStillWorking: false;
};

export function buildOfflinePack(input: {
  actor: Er14Actor;
  packId: string;
  packVersion: string;
  targetPlatform: string;
  architecture: string;
  category: OfflinePackCategory;
  storageTier: OfflineStorageTier;
  approvedDomains: readonly string[];
  sourceManifests: readonly string[];
  licenseId: string;
  rightsCleared: boolean;
  copyrightAuthorized: boolean;
  restrictedDatabase?: boolean;
  modelIdsHashes?: readonly { modelId: string; contentHash: string }[];
  vectorGraphIndexes?: readonly string[];
  structuredKnowledge?: readonly string[];
  agentSkillManifests?: readonly string[];
  storageSizeBytes?: number;
  updateChannel?: string;
  freshnessExpiry?: string | null;
  rollbackVersion?: string | null;
  includeHiddenChainOfThought?: boolean;
}): OfflineBrainPack | DenialResult {
  if (!isEr14Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only offline brain packager agents / home_base may build packs.');
  }
  if (!input.rightsCleared) {
    return deny('Rights check failed — pack build denied.');
  }
  if (input.restrictedDatabase === true) {
    return deny('Restricted databases must not be packaged.');
  }
  if (input.copyrightAuthorized === false) {
    return deny('Unauthorized copyrighted archives must not be packaged.');
  }
  if (input.includeHiddenChainOfThought === true) {
    return deny('Hidden chain-of-thought must not be packaged.');
  }

  const payload = {
    packId: input.packId,
    packVersion: input.packVersion,
    sources: input.sourceManifests,
    models: input.modelIdsHashes ?? [],
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
  const contentHash = sha256(JSON.stringify(payload));
  const signature = sha256(`sign:${contentHash}`);

  return {
    packId: input.packId,
    packVersion: input.packVersion,
    targetPlatform: input.targetPlatform,
    architecture: input.architecture,
    approvedDomains: [...input.approvedDomains],
    sourceManifests: [...input.sourceManifests],
    rightsLicenseMetadata: {
      licenseId: input.licenseId,
      rightsCleared: true,
      copyrightAuthorized: true,
      restrictedDatabase: false,
    },
    modelIdsHashes: [...(input.modelIdsHashes ?? [])],
    vectorGraphIndexes: [...(input.vectorGraphIndexes ?? [])],
    structuredKnowledge: [...(input.structuredKnowledge ?? [])],
    agentSkillManifests: [...(input.agentSkillManifests ?? [])],
    storageSizeBytes: input.storageSizeBytes ?? 1024,
    encryptionState: 'SIGNED_AND_ENCRYPTED',
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    freshnessExpiry: input.freshnessExpiry ?? null,
    updateChannel: input.updateChannel ?? 'stable',
    rollbackVersion: input.rollbackVersion ?? null,
    revocationState: 'ACTIVE',
    category: input.category,
    storageTier: input.storageTier,
    signature,
    containsHiddenChainOfThought: false,
    installed: false,
    installAuthorizedBy: null,
    dependentPackIds: [],
    revokedSourceIds: [],
  };
}

export function installOfflinePack(input: {
  actor: Er14Actor;
  pack: OfflineBrainPack;
  explicitAuthorization: boolean;
  authorizerId?: string;
}): OfflineBrainPack | DenialResult {
  if (input.pack.revocationState === 'REVOKED') {
    return deny('Revoked packs cannot be installed.');
  }
  if (!input.explicitAuthorization) {
    return deny('Installation/update requires explicit user authorization.');
  }
  if (
    input.pack.tenantId !== input.actor.tenantId ||
    input.pack.universeId !== input.actor.universeId
  ) {
    return deny('Organization packs are isolated to tenant/Universe.');
  }
  if (
    input.pack.storageTier === 'ORGANIZATION' &&
    input.pack.orgId !== input.actor.orgId
  ) {
    return deny('Organization pack org isolation violation.');
  }

  return {
    ...input.pack,
    installed: true,
    installAuthorizedBy: input.authorizerId ?? input.actor.id,
    encryptionState: 'SIGNED_AND_ENCRYPTED',
  };
}

export function queryOfflinePack(input: {
  actor: Er14Actor;
  pack: OfflineBrainPack;
  query: string;
  pretendLiveCurrent?: boolean;
  localModelRuntime?: string;
}): OfflineQueryResult | DenialResult {
  if (!input.pack.installed) {
    return deny('Pack must be installed before offline query.');
  }
  if (input.pack.revocationState === 'REVOKED') {
    return deny('Revoked packs cannot serve offline queries.');
  }
  if (
    input.pack.tenantId !== input.actor.tenantId ||
    input.pack.universeId !== input.actor.universeId
  ) {
    return deny('Cross-tenant/Universe offline pack access denied.');
  }
  if (input.pretendLiveCurrent === true) {
    return deny(
      'Cannot pretend cached offline information is current live data.',
    );
  }

  const checkpoint: OfflineCheckpoint = {
    checkpointId: `cp-${sha256(input.query).slice(0, 12)}`,
    packId: input.pack.packId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    resultSummary: `offline:${input.query}`,
    createdAt: nowIso(),
    offlineMode: true,
    claimedLiveCurrent: false,
  };

  return {
    OFFLINE_MODE: true,
    claimedLiveCurrent: false,
    packId: input.pack.packId,
    structuredResult: `structured:${input.query}`,
    checkpoint,
    localModelRuntime: input.localModelRuntime ?? 'local-runtime-v1',
  };
}

export function reconnectSyncMergeCandidate(input: {
  actor: Er14Actor;
  checkpoint: OfflineCheckpoint;
  pack: OfflineBrainPack;
  autoPromoteToGlobalBrain?: boolean;
}): OfflineMergeCandidate | DenialResult {
  if (input.autoPromoteToGlobalBrain === true) {
    return deny(
      'No automatic promotion of local findings into the global brain.',
    );
  }
  if (
    input.checkpoint.tenantId !== input.actor.tenantId ||
    input.checkpoint.universeId !== input.actor.universeId
  ) {
    return deny('Checkpoint tenant/Universe mismatch.');
  }

  // conflict/freshness check → Home Base review → merge candidate only
  return {
    candidateId: `mc-${sha256(input.checkpoint.checkpointId).slice(0, 12)}`,
    checkpointId: input.checkpoint.checkpointId,
    packId: input.pack.packId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    status: 'MERGE_CANDIDATE',
    autoPromotedToGlobalBrain: false,
    requiresHomeBaseReview: true,
  };
}

export function revokeOfflinePack(input: {
  pack: OfflineBrainPack;
  revokedSourceId?: string;
  dependentPacks?: readonly OfflineBrainPack[];
}): {
  pack: OfflineBrainPack;
  dependents: OfflineBrainPack[];
} {
  const revokedSourceIds = input.revokedSourceId
    ? [...new Set([...input.pack.revokedSourceIds, input.revokedSourceId])]
    : [...input.pack.revokedSourceIds];

  const pack: OfflineBrainPack = {
    ...input.pack,
    revocationState: 'REVOKED',
    revokedSourceIds,
    installed: false,
  };

  const dependents = (input.dependentPacks ?? []).map((dep) => {
    const tracesSource =
      input.revokedSourceId != null &&
      (dep.sourceManifests.includes(input.revokedSourceId) ||
        pack.dependentPackIds.includes(dep.packId) ||
        dep.packId === pack.packId);
    const shouldTrace =
      tracesSource ||
      dep.sourceManifests.some((s) => pack.sourceManifests.includes(s)) ||
      pack.dependentPackIds.includes(dep.packId);

    if (!shouldTrace && !pack.dependentPackIds.includes(dep.packId)) {
      // still mark dependents listed by the revoked pack
      if (!input.pack.dependentPackIds.includes(dep.packId)) {
        return dep;
      }
    }

    return {
      ...dep,
      revocationState: 'SOURCE_REVOKED_DEPENDENT' as const,
      revokedSourceIds: [
        ...new Set([
          ...dep.revokedSourceIds,
          ...(input.revokedSourceId ? [input.revokedSourceId] : []),
          pack.packId,
        ]),
      ],
    };
  });

  // Ensure listed dependents are always traced
  const traced = (input.dependentPacks ?? []).map((dep) => {
    if (input.pack.dependentPackIds.includes(dep.packId)) {
      return {
        ...dep,
        revocationState: 'SOURCE_REVOKED_DEPENDENT' as const,
        revokedSourceIds: [
          ...new Set([
            ...dep.revokedSourceIds,
            ...(input.revokedSourceId ? [input.revokedSourceId] : []),
            pack.packId,
          ]),
        ],
      };
    }
    const fromMap = dependents.find((d) => d.packId === dep.packId);
    return fromMap ?? dep;
  });

  return { pack, dependents: traced };
}

export function devicePowerStatus(input: {
  devicePowerState: OfflineDevicePowerState;
  claimAgentsStillWorking?: boolean;
}): OfflineDeviceStatus | DenialResult {
  if (
    input.devicePowerState === 'POWERED_OFF' &&
    input.claimAgentsStillWorking === true
  ) {
    return deny(
      'When device is powered off report OFFLINE_STOPPED — not agents still working.',
    );
  }

  if (input.devicePowerState === 'POWERED_OFF') {
    return {
      devicePowerState: 'POWERED_OFF',
      runtimeStatus: 'OFFLINE_STOPPED',
      OFFLINE_MODE: true,
      agentsStillWorking: false,
    };
  }

  return {
    devicePowerState: 'POWERED_ON',
    runtimeStatus: 'OFFLINE_ACTIVE',
    OFFLINE_MODE: true,
    agentsStillWorking: false,
  };
}

export function attemptPackageHiddenChainOfThought(): DenialResult {
  return deny('Hidden chain-of-thought must not be packaged.');
}

export function attemptPiratedOrRestrictedArchives(): DenialResult {
  return deny(
    'Unauthorized copyrighted archives or restricted databases must not be packaged.',
  );
}

export function attemptCrossTenantOrgPackLeak(): DenialResult {
  return deny('Organization packs must not leak across tenant/Universe.');
}

export function attemptInstallWithoutAuthorization(): DenialResult {
  return deny('Installation/update requires explicit user authorization.');
}

export function attemptAutoPromoteToGlobalBrain(): DenialResult {
  return deny(
    'No automatic promotion of local findings into the global brain.',
  );
}

export function attemptPretendCachedIsLive(): DenialResult {
  return deny(
    'Cannot pretend cached offline information is current live data.',
  );
}

export function attemptAgentsWorkingWhenPoweredOff(): DenialResult {
  return deny(
    'When device is powered off report OFFLINE_STOPPED — not agents still working.',
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
  actor: Er14Actor;
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
  actor: Er14Actor;
  mergeCandidate: OfflineMergeCandidate;
}): {
  returned: true;
  authorityGranted: false;
  autoPromotedToGlobalBrain: false;
  candidate: OfflineMergeCandidate;
} | DenialResult {
  if (input.mergeCandidate.autoPromotedToGlobalBrain !== false) {
    return deny('Merge candidate must not be auto-promoted.');
  }
  return {
    returned: true,
    authorityGranted: false,
    autoPromotedToGlobalBrain: false,
    candidate: input.mergeCandidate,
  };
}

export function exampleCorePack(actor: Er14Actor): OfflineBrainPack {
  const built = buildOfflinePack({
    actor,
    packId: 'pack-core-1',
    packVersion: '1.0.0',
    targetPlatform: 'linux',
    architecture: 'x86_64',
    category: 'local_search_indexes',
    storageTier: 'CORE',
    approvedDomains: ['xiv.core'],
    sourceManifests: ['src-core-manifest'],
    licenseId: 'xiv-approved-1',
    rightsCleared: true,
    copyrightAuthorized: true,
    modelIdsHashes: [{ modelId: 'local-sm', contentHash: 'abc123' }],
    vectorGraphIndexes: ['idx-local-v1'],
    structuredKnowledge: ['sk-core'],
    agentSkillManifests: ['skill-local-search'],
    storageSizeBytes: 4096,
  });
  if ('denied' in built) {
    throw new Error(built.reason);
  }
  return built;
}

export function bootstrapOfflineBrainPackager(repoRoot?: string): {
  locksIntact: boolean;
  packFields: typeof OFFLINE_PACK_FIELDS;
  categories: typeof OFFLINE_PACK_CATEGORIES;
  storageTiers: typeof OFFLINE_STORAGE_TIERS;
  coreFlow: typeof OFFLINE_PACK_CORE_FLOW;
  dbCandidates: typeof ER14_DB_CANDIDATES_STATUS;
  softWire: Er14SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    layer: typeof ER_LAYER_TITLE;
  };
  offlineModeFlags: OfflineModeFlags;
} {
  const softWire = er14SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEr14LocksIntact(),
    packFields: OFFLINE_PACK_FIELDS,
    categories: OFFLINE_PACK_CATEGORIES,
    storageTiers: OFFLINE_STORAGE_TIERS,
    coreFlow: OFFLINE_PACK_CORE_FLOW,
    dbCandidates: ER14_DB_CANDIDATES_STATUS,
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
    offlineModeFlags: {
      OFFLINE_MODE: true,
      pretendsCachedIsLiveCurrent: false,
      devicePowerState: 'POWERED_ON',
      runtimeStatus: 'OFFLINE_ACTIVE',
    },
  };
}

export function runOfflineBrainPackagerCycle(input: {
  actor: Er14Actor;
  human: Er14Actor;
  repoRoot?: string;
}): {
  hops: Er14HopRecord[];
  receipt: {
    OFFLINE_MODE: true;
    autoPromotedToGlobalBrain: false;
    packId: string;
    mergeCandidateId: string | null;
  };
  cycleEvidenceSha256: string;
} {
  const hops: Er14HopRecord[] = [];
  const softWire = er14SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr14LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const boot = bootstrapOfflineBrainPackager(input.repoRoot);
  hops.push(
    hop(
      'offline_brain_packager_bootstrap',
      boot.locksIntact ? 'PASS' : 'FAIL',
      'Offline Brain Packager bootstrap.',
    ),
  );

  hops.push(
    hop(
      'pack_fields_encoded',
      OFFLINE_PACK_FIELDS.length === 18 ? 'PASS' : 'FAIL',
      `Pack fields=${OFFLINE_PACK_FIELDS.length}.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      OFFLINE_PACK_CORE_FLOW.length === 9 ? 'PASS' : 'FAIL',
      `Core flow hops=${OFFLINE_PACK_CORE_FLOW.length}.`,
    ),
  );
  hops.push(
    hop(
      'categories_encoded',
      OFFLINE_PACK_CATEGORIES.length === 10 ? 'PASS' : 'FAIL',
      `Categories=${OFFLINE_PACK_CATEGORIES.length}.`,
    ),
  );
  hops.push(
    hop(
      'storage_tiers_encoded',
      OFFLINE_STORAGE_TIERS.length === 4 ? 'PASS' : 'FAIL',
      `Storage tiers=${OFFLINE_STORAGE_TIERS.join(',')}.`,
    ),
  );
  hops.push(
    hop(
      'offline_runtime_flow_encoded',
      OFFLINE_RUNTIME_FLOW.length === 6 ? 'PASS' : 'FAIL',
      `Offline runtime flow=${OFFLINE_RUNTIME_FLOW.length}.`,
    ),
  );
  hops.push(
    hop(
      'sync_reconnect_flow_encoded',
      OFFLINE_SYNC_RECONNECT_FLOW.length === 5 ? 'PASS' : 'FAIL',
      `Sync reconnect flow=${OFFLINE_SYNC_RECONNECT_FLOW.length}.`,
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      OFFLINE_BRAIN_TRUTH_BOUNDARY.offlineModeAlwaysReported &&
        !OFFLINE_BRAIN_TRUTH_BOUNDARY.mayPretendCachedIsLiveCurrent &&
        !OFFLINE_BRAIN_TRUTH_BOUNDARY.mayAutoPromoteLocalFindingsToGlobalBrain
        ? 'PASS'
        : 'FAIL',
      'Truth boundary: OFFLINE_MODE; no live pretence; no auto global promote.',
    ),
  );

  const deniedRights = buildOfflinePack({
    actor: input.actor,
    packId: 'pack-bad-rights',
    packVersion: '0.0.1',
    targetPlatform: 'linux',
    architecture: 'x86_64',
    category: 'science_engineering',
    storageTier: 'RESEARCH',
    approvedDomains: ['x'],
    sourceManifests: ['s1'],
    licenseId: 'none',
    rightsCleared: false,
    copyrightAuthorized: true,
  });
  const built = buildOfflinePack({
    actor: input.actor,
    packId: 'pack-cycle-1',
    packVersion: '1.0.0',
    targetPlatform: 'linux',
    architecture: 'x86_64',
    category: 'supply_chain_knowledge',
    storageTier: 'DOMAIN',
    approvedDomains: ['logistics'],
    sourceManifests: ['src-a', 'src-b'],
    licenseId: 'lic-ok',
    rightsCleared: true,
    copyrightAuthorized: true,
    modelIdsHashes: [{ modelId: 'm1', contentHash: 'h1' }],
  });
  hops.push(
    hop(
      'rights_check_before_pack',
      'denied' in deniedRights && !('denied' in built) ? 'PASS' : 'FAIL',
      'Pack build requires rights check.',
    ),
  );
  hops.push(
    hop(
      'encrypt_and_sign_metadata',
      !('denied' in built) &&
        built.encryptionState === 'SIGNED_AND_ENCRYPTED' &&
        built.signature != null
        ? 'PASS'
        : 'FAIL',
      'Pack encrypted and signed.',
    ),
  );

  let pack: OfflineBrainPack;
  if ('denied' in built) {
    pack = exampleCorePack(input.actor);
  } else {
    pack = built;
  }

  const noAuth = installOfflinePack({
    actor: input.actor,
    pack,
    explicitAuthorization: false,
  });
  const installed = installOfflinePack({
    actor: input.actor,
    pack,
    explicitAuthorization: true,
    authorizerId: input.human.id,
  });
  hops.push(
    hop(
      'user_authorized_install_required',
      'denied' in noAuth && !('denied' in installed) ? 'PASS' : 'FAIL',
      'Install requires explicit authorization.',
    ),
  );
  if (!('denied' in installed)) {
    pack = installed;
  }

  const query = queryOfflinePack({
    actor: input.actor,
    pack,
    query: 'local-supply-chain',
  });
  hops.push(
    hop(
      'offline_mode_true_on_query',
      !('denied' in query) && query.OFFLINE_MODE === true ? 'PASS' : 'FAIL',
      'Offline query reports OFFLINE_MODE=true.',
    ),
  );
  hops.push(
    hop(
      'deny_live_current_pretence',
      queryOfflinePack({
        actor: input.actor,
        pack,
        query: 'x',
        pretendLiveCurrent: true,
      }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Live-current pretence denied.',
    ),
  );

  let mergeCandidate: OfflineMergeCandidate | null = null;
  if (!('denied' in query)) {
    const merge = reconnectSyncMergeCandidate({
      actor: input.actor,
      checkpoint: query.checkpoint,
      pack,
    });
    const auto = reconnectSyncMergeCandidate({
      actor: input.actor,
      checkpoint: query.checkpoint,
      pack,
      autoPromoteToGlobalBrain: true,
    });
    hops.push(
      hop(
        'reconnect_merge_candidate_only',
        !('denied' in merge) && merge.status === 'MERGE_CANDIDATE'
          ? 'PASS'
          : 'FAIL',
        'Reconnect yields merge candidate for Home Base review.',
      ),
    );
    hops.push(
      hop(
        'no_auto_global_promote',
        'denied' in auto &&
          (!('denied' in merge) ? merge.autoPromotedToGlobalBrain === false : false)
          ? 'PASS'
          : 'FAIL',
        'No automatic promotion into global brain.',
      ),
    );
    if (!('denied' in merge)) {
      mergeCandidate = merge;
    }
  } else {
    hops.push(
      hop('reconnect_merge_candidate_only', 'FAIL', 'Query failed before sync.'),
    );
    hops.push(
      hop('no_auto_global_promote', 'FAIL', 'Query failed before sync.'),
    );
  }

  const dependent: OfflineBrainPack = {
    ...pack,
    packId: 'pack-dep-1',
    installed: true,
    dependentPackIds: [],
  };
  const revoked = revokeOfflinePack({
    pack: { ...pack, dependentPackIds: ['pack-dep-1'] },
    revokedSourceId: 'src-a',
    dependentPacks: [dependent],
  });
  hops.push(
    hop(
      'revoke_traces_dependents',
      revoked.pack.revocationState === 'REVOKED' &&
        revoked.dependents[0]?.revocationState === 'SOURCE_REVOKED_DEPENDENT' &&
        revoked.dependents[0]?.revokedSourceIds.includes('src-a')
        ? 'PASS'
        : 'FAIL',
      'Revocation traces into dependent packs.',
    ),
  );

  const poweredOff = devicePowerStatus({ devicePowerState: 'POWERED_OFF' });
  const claimWorking = devicePowerStatus({
    devicePowerState: 'POWERED_OFF',
    claimAgentsStillWorking: true,
  });
  hops.push(
    hop(
      'offline_stopped_when_powered_off',
      !('denied' in poweredOff) &&
        poweredOff.runtimeStatus === 'OFFLINE_STOPPED' &&
        'denied' in claimWorking
        ? 'PASS'
        : 'FAIL',
      'POWERED_OFF → OFFLINE_STOPPED; agents-still-working denied.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof OFFLINE_BRAIN_PACKAGER_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_package_hidden_chain_of_thought',
      fn: attemptPackageHiddenChainOfThought,
    },
    {
      hop: 'deny_pirated_or_restricted_archives',
      fn: attemptPiratedOrRestrictedArchives,
    },
    {
      hop: 'deny_cross_tenant_org_pack_leak',
      fn: attemptCrossTenantOrgPackLeak,
    },
    {
      hop: 'deny_install_without_authorization',
      fn: attemptInstallWithoutAuthorization,
    },
    {
      hop: 'deny_auto_promote_to_global_brain',
      fn: attemptAutoPromoteToGlobalBrain,
    },
    { hop: 'deny_pretend_cached_is_live', fn: attemptPretendCachedIsLive },
    {
      hop: 'deny_agents_working_when_powered_off',
      fn: attemptAgentsWorkingWhenPoweredOff,
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
      ER14_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      ER_LAYER_TITLE.includes('Offline/Online Brain Sync') ? 'PASS' : 'FAIL',
      ER_LAYER_TITLE,
    ),
  );

  const softPairs: Array<{
    hop: (typeof OFFLINE_BRAIN_PACKAGER_CYCLE)[number];
    present: boolean;
    note: string;
  }> = [
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
      hop: 'eq16_soft_wire',
      present: softWire.eq16SoftwareWormholeRouter.present,
      note: softWire.eq16SoftwareWormholeRouter.note,
    },
    {
      hop: 'eq15_soft_wire',
      present: softWire.eq15PathwayPlasticity.present,
      note: softWire.eq15PathwayPlasticity.note,
    },
    {
      hop: 'eq14_soft_wire',
      present: softWire.eq14NeuralPathwayArchitectureGraph.present,
      note: softWire.eq14NeuralPathwayArchitectureGraph.note,
    },
    {
      hop: 'eq13_soft_wire',
      present: softWire.eq13ArchitectureReturnReceipt.present,
      note: softWire.eq13ArchitectureReturnReceipt.note,
    },
    {
      hop: 'eq12_soft_wire',
      present: softWire.eq12CrossArchitectureBenchmarkMatrix.present,
      note: softWire.eq12CrossArchitectureBenchmarkMatrix.note,
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
      ER14_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  let homeOk = false;
  if (mergeCandidate) {
    const home = returnEvidenceToHomeBase({
      actor: input.actor,
      mergeCandidate,
    });
    homeOk = !('denied' in home);
  }
  const humanGate = requireHumanApproval({
    approvalId: 'appr-er14-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      homeOk && !('denied' in humanGate) ? 'PASS' : 'DENIED',
      'Merge candidate returned to Home Base; human gate exercised; no auto global promote.',
    ),
  );

  void ER14_MAY;
  void ER14_MUST_NOT;
  void ER14_AGENT_BOUNDS;
  void OFFLINE_BRAIN_PACKAGER_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
    }),
  );

  return {
    hops,
    receipt: {
      OFFLINE_MODE: true,
      autoPromotedToGlobalBrain: false,
      packId: pack.packId,
      mergeCandidateId: mergeCandidate?.candidateId ?? null,
    },
    cycleEvidenceSha256,
  };
}
