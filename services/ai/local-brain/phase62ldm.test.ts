import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bootstrapCivilizationKnowledgeAtlas,
  civilizationKnowledgeAtlasHonesty,
  ingestCivilizationAtlasPack,
  startInclusiveUxSession,
} from './civilization-knowledge-atlas';
import {
  bootstrapGlobalNeuralTransitCivilizationAtlasOs,
  globalNeuralTransitCivilizationAtlasOsHonesty,
} from './global-neural-transit-civilization-atlas-os';
import {
  bootstrapGlobalNeuralTransitGrid,
  globalNeuralTransitGridHonesty,
  openTransitCorridor,
} from './global-neural-transit-grid';
import {
  ATLAS_WITHOUT_PROVENANCE_DENIED,
  CROSS_DEVICE_WITHOUT_ENROLLMENT_DENIED,
  DEMOGRAPHIC_PROFILING_DENIED,
  DM_LOCKS,
  GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_CYCLE,
  HONESTY_BANNER,
  NEW_AGENT_BOUNDED_NO_SELF_GRANT,
  NEXT_PHASE_TITLE,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  OFFLINE_PACK_TAMPER_REJECTED,
  PLUGIN_REGISTRATION_NEQ_AUTHORITY,
  SEALED_PRIVATE_SILENT_SHARE_DENIED,
  STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
  UNCONFIGURED_CAPABILITY_UNAVAILABLE,
  UNDER_18_DENIED,
  UNVERIFIED_PLATFORM_UNAVAILABLE_OR_NOT_TESTED,
  predecessorMap,
  type DmActor,
} from './global-neural-transit-civilization-atlas-types';
import {
  bootstrapHeterogeneousComputeFabricDm,
  heterogeneousComputeFabricDmHonesty,
  placeHeterogeneousCompute,
} from './heterogeneous-compute-fabric-dm';
import {
  attemptSealedPrivateShare,
  bootstrapInclusiveBusinessOsEcosystem,
  inclusiveBusinessOsEcosystemHonesty,
  registerToolchainCapability,
} from './inclusive-business-os-ecosystem';
import {
  bootstrapUniversalDeviceRuntime,
  registerDeviceRuntimeProfile,
  requestCrossDeviceContinuity,
  universalDeviceRuntimeHonesty,
} from './universal-device-runtime-dm';
import {
  bootstrapVerifiedAgentWorkforce,
  claimWorkforceRunningVerified,
  createWorkforceAgent,
  openEncryptedOfflinePack,
  recordWorkforceHeartbeat,
  registerWorkforceNode,
  scheduleWorkforceWithoutPoweredNode,
  sealEncryptedOfflinePack,
  verifiedAgentWorkforceHonesty,
} from './verified-offline-online-agent-workforce';
import {
  buildGlobalNeuralTransitCivilizationAtlasOsHealthReport,
  runGlobalNeuralTransitCivilizationAtlasOsCycle,
} from './global-neural-transit-civilization-atlas-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldm-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DmActor = {
  kind: 'transit_grid_governor',
  id: 'governor-dm-1',
  orgId: 'org-dm',
  tenantId: 'tenant-dm',
  universeId: 'univ-dm',
  role: 'governor',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DM1-cycle',
    GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_CYCLE.join(' → ') ===
      'honesty_locks → global_neural_transit_civilization_atlas_os_bootstrap → unconfigured_chatgpt_cursor_plugin_capability_unavailable → plugin_registration_neq_authority_credentials_billing → unverified_mobile_desktop_platform_unavailable_or_not_tested → atlas_intake_without_provenance_rights_denied → user_demographic_profiling_denied → under_18_denied_where_18_plus_required → no_powered_node_waiting_or_offline_stopped → stale_heartbeat_not_running_verified → encrypted_offline_pack_tamper_checksum_fail_rejected → cross_device_continuity_without_enrollment_denied → new_agent_creation_bounded_no_self_grant_production_authority → sealed_private_silent_share_denied → evidence → learning',
    'Global Neural Transit Civilization Atlas cycle recorded in order.',
  );

  check(
    'US-DM-locks',
    DM_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DM_LOCKS.USER_DEMOGRAPHIC_PROFILING === false &&
      DM_LOCKS.PLUGIN_REGISTRATION_EQ_AUTHORITY === false &&
      DM_LOCKS.PLUGIN_REGISTRATION_EQ_CREDENTIALS === false &&
      DM_LOCKS.PLUGIN_REGISTRATION_EQ_BILLING === false &&
      DM_LOCKS.SELF_GRANT_PRODUCTION_AUTHORITY === false &&
      DM_LOCKS.SEALED_SILENT_PRIVATE_SHARE === false &&
      DM_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DM_LOCKS.TIP_LAND === false &&
      DM_LOCKS.MEGA_PR_BULK_INCLUDED === false,
    HONESTY_BANNER,
  );

  check(
    'US-DM-honesty-surfaces',
    globalNeuralTransitCivilizationAtlasOsHonesty().l4AutonomyEnabled === false &&
      globalNeuralTransitGridHonesty().physicalVehicleControl === false &&
      civilizationKnowledgeAtlasHonesty().demographicProfiling === false &&
      verifiedAgentWorkforceHonesty().logicalAgentEqRunningVerified === false &&
      universalDeviceRuntimeHonesty().crossDeviceWithoutEnrollment === false &&
      heterogeneousComputeFabricDmHonesty().cpuGpuNpuVerifiedOnly === true &&
      inclusiveBusinessOsEcosystemHonesty().pluginRegistrationEqAuthority === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DM-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DN —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DM-predecessor-DK-or-better',
    preds.DK.tipProbe === 'PRESENT' ||
      preds.DL.tipProbe === 'PRESENT' ||
      preds.DJ.tipProbe === 'PRESENT' ||
      preds.DH.tipProbe === 'PRESENT' ||
      preds.DG.tipProbe === 'PRESENT',
    `DL=${preds.DL.tipProbe}/${preds.DL.report}; DK=${preds.DK.tipProbe}/${preds.DK.report}; DJ=${preds.DJ.tipProbe}/${preds.DJ.report}; DI=${preds.DI.tipProbe}/${preds.DI.report}; DH=${preds.DH.tipProbe}/${preds.DH.report}`,
  );

  const os = await bootstrapGlobalNeuralTransitCivilizationAtlasOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });

  const biz = await bootstrapInclusiveBusinessOsEcosystem({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });

  const unconfigured = await registerToolchainCapability({
    ecosystemId: biz.id,
    capability: 'cursor',
    configured: false,
    registered: false,
    verified: false,
    root,
    actor,
  });
  check(
    'US-DM-unconfigured-chatgpt-cursor-plugin-unavailable',
    unconfigured.accepted === false &&
      unconfigured.reason === UNCONFIGURED_CAPABILITY_UNAVAILABLE &&
      unconfigured.capability?.status === 'UNAVAILABLE',
    unconfigured.reason,
  );

  const pluginReg = await registerToolchainCapability({
    ecosystemId: biz.id,
    capability: 'plugin',
    configured: true,
    registered: true,
    verified: true,
    claimAuthority: true,
    claimCredentials: true,
    claimBilling: true,
    root,
    actor,
  });
  check(
    'US-DM-plugin-registration-neq-authority-credentials-billing',
    pluginReg.accepted === false && pluginReg.reason === PLUGIN_REGISTRATION_NEQ_AUTHORITY,
    pluginReg.reason,
  );

  const devices = await bootstrapUniversalDeviceRuntime({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const unverifiedMobile = await registerDeviceRuntimeProfile({
    runtimeId: devices.id,
    platform: 'android',
    enrolled: false,
    verified: false,
    tested: false,
    root,
    actor,
  });
  check(
    'US-DM-unverified-mobile-desktop-unavailable-or-not-tested',
    unverifiedMobile.accepted === false &&
      (unverifiedMobile.profile?.status === 'UNAVAILABLE' ||
        unverifiedMobile.profile?.status === 'NOT_TESTED') &&
      unverifiedMobile.reason === UNVERIFIED_PLATFORM_UNAVAILABLE_OR_NOT_TESTED,
    `${unverifiedMobile.profile?.status}:${unverifiedMobile.reason}`,
  );

  const unverifiedDesktop = await registerDeviceRuntimeProfile({
    runtimeId: devices.id,
    platform: 'desktop',
    enrolled: true,
    verified: false,
    tested: false,
    root,
    actor,
  });
  check(
    'US-DM-unverified-desktop-honest',
    unverifiedDesktop.accepted === false &&
      (unverifiedDesktop.profile?.status === 'UNAVAILABLE' ||
        unverifiedDesktop.profile?.status === 'NOT_TESTED'),
    unverifiedDesktop.reason,
  );

  const atlas = await bootstrapCivilizationKnowledgeAtlas({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const noProv = await ingestCivilizationAtlasPack({
    atlasId: atlas.id,
    region: 'africa',
    title: 'no-rights-pack',
    authorized: true,
    provenanceRef: '',
    rightsCleared: false,
    root,
    actor,
  });
  check(
    'US-DM-atlas-intake-without-provenance-rights-denied',
    noProv.accepted === false && noProv.reason === ATLAS_WITHOUT_PROVENANCE_DENIED,
    noProv.reason,
  );

  const goodPack = await ingestCivilizationAtlasPack({
    atlasId: atlas.id,
    region: 'china',
    title: 'lawful-china-pack',
    authorized: true,
    provenanceRef: 'prov://museum/china-tech-archive/1',
    rightsCleared: true,
    root,
    actor,
  });
  check(
    'US-DM-atlas-lawful-provenance-accepted',
    goodPack.accepted === true,
    goodPack.reason,
  );

  const profiling = await startInclusiveUxSession({
    atlasId: atlas.id,
    locale: 'ar',
    declaredAgeYears: 25,
    profileByCulture: true,
    root,
    actor,
  });
  check(
    'US-DM-user-demographic-profiling-denied',
    profiling.accepted === false && profiling.reason === DEMOGRAPHIC_PROFILING_DENIED,
    profiling.reason,
  );

  const under18 = await startInclusiveUxSession({
    atlasId: atlas.id,
    locale: 'en',
    declaredAgeYears: 17,
    root,
    actor,
  });
  check(
    'US-DM-under-18-denied',
    under18.accepted === false && under18.reason === UNDER_18_DENIED,
    under18.reason,
  );

  const workforce = await bootstrapVerifiedAgentWorkforce({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const noNode = await scheduleWorkforceWithoutPoweredNode({
    workforceId: workforce.id,
    root,
    actor,
  });
  check(
    'US-DM-no-powered-node-waiting-or-offline-stopped',
    noNode.accepted === false &&
      noNode.reason === NO_POWERED_NODE_WAITING_OR_STOPPED &&
      (noNode.status === 'WAITING_NODE' || noNode.status === 'OFFLINE_STOPPED'),
    `${noNode.status}:${noNode.reason}`,
  );

  const node = await registerWorkforceNode({
    workforceId: workforce.id,
    name: 'dm-test-node',
    powered: true,
    authorized: true,
    root,
    actor,
  });
  await recordWorkforceHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'pid-evidence',
    root,
    actor,
    atIso: new Date(Date.now() - 90_000).toISOString(),
  });
  const agent = await createWorkforceAgent({
    workforceId: workforce.id,
    name: 'dm-test-agent',
    root,
    actor,
  });
  const stale = await claimWorkforceRunningVerified({
    agentId: agent.agent!.id,
    nodeId: node.node!.id,
    root,
    actor,
  });
  check(
    'US-DM-stale-heartbeat-not-running-verified',
    stale.accepted === false &&
      stale.status !== 'RUNNING_VERIFIED' &&
      stale.reason === STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
    `${stale.status}:${stale.reason}`,
  );

  await recordWorkforceHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'pid-evidence-fresh',
    root,
    actor,
  });
  const fresh = await claimWorkforceRunningVerified({
    agentId: agent.agent!.id,
    nodeId: node.node!.id,
    root,
    actor,
  });
  check(
    'US-DM-fresh-heartbeat-running-verified-evidence-path',
    fresh.accepted === true && fresh.status === 'RUNNING_VERIFIED',
    fresh.reason,
  );

  const pack = await sealEncryptedOfflinePack({
    workforceId: workforce.id,
    agentId: agent.agent!.id,
    plaintext: 'secret-offline-work',
    root,
    actor,
  });
  const tamper = await openEncryptedOfflinePack({
    packId: pack.pack!.id,
    tamperedCiphertext: 'YmFkLWNoZWNrc3Vt',
    root,
    actor,
  });
  check(
    'US-DM-encrypted-offline-pack-tamper-rejected',
    tamper.accepted === false && tamper.reason === OFFLINE_PACK_TAMPER_REJECTED,
    tamper.reason,
  );

  const continuity = await requestCrossDeviceContinuity({
    runtimeId: devices.id,
    fromDeviceId: 'phone-1',
    toDeviceId: 'desktop-1',
    enrollmentPresent: false,
    root,
    actor,
  });
  check(
    'US-DM-cross-device-continuity-without-enrollment-denied',
    continuity.accepted === false &&
      continuity.reason === CROSS_DEVICE_WITHOUT_ENROLLMENT_DENIED,
    continuity.reason,
  );

  const selfGrant = await createWorkforceAgent({
    workforceId: workforce.id,
    name: 'rogue-self-grant',
    selfGrantProductionAuthority: true,
    root,
    actor,
  });
  check(
    'US-DM-new-agent-bounded-no-self-grant',
    selfGrant.accepted === false && selfGrant.reason === NEW_AGENT_BOUNDED_NO_SELF_GRANT,
    selfGrant.reason,
  );

  const silent = await attemptSealedPrivateShare({
    ecosystemId: biz.id,
    fromTenantId: actor.tenantId,
    toTenantId: 'tenant-other',
    sealed: true,
    silent: true,
    root,
    actor,
  });
  check(
    'US-DM-sealed-private-silent-share-denied',
    silent.accepted === false && silent.reason === SEALED_PRIVATE_SILENT_SHARE_DENIED,
    silent.reason,
  );

  const grid = await bootstrapGlobalNeuralTransitGrid({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  const bypass = await openTransitCorridor({
    gridId: grid.id,
    name: 'bypass-attempt',
    fromRegion: 'europe',
    toRegion: 'americas',
    attemptSealedBypass: true,
    root,
    actor,
  });
  check(
    'US-DM-transit-sealed-bypass-denied',
    bypass.accepted === false,
    bypass.reason,
  );

  const compute = await bootstrapHeterogeneousComputeFabricDm({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const unverifiedGpu = await placeHeterogeneousCompute({
    fabricId: compute.id,
    kind: 'gpu',
    verified: false,
    root,
    actor,
  });
  check(
    'US-DM-unverified-gpu-placement-denied',
    unverifiedGpu.accepted === false,
    unverifiedGpu.reason,
  );
  const verifiedNpu = await placeHeterogeneousCompute({
    fabricId: compute.id,
    kind: 'npu',
    verified: true,
    root,
    actor,
  });
  check(
    'US-DM-verified-npu-placement',
    verifiedNpu.accepted === true,
    verifiedNpu.reason,
  );

  const cycleRoot = await mkdtemp(join(tmpdir(), 'xiv-62ldm-cycle-'));
  try {
    const cycle = await runGlobalNeuralTransitCivilizationAtlasOsCycle({
      orgId: 'org-dm-cycle',
      tenantId: 'tenant-dm-cycle',
      universeId: 'univ-dm-cycle',
      actor: { ...actor, orgId: 'org-dm-cycle', tenantId: 'tenant-dm-cycle', universeId: 'univ-dm-cycle' },
      root: cycleRoot,
      repoRoot,
    });
    check(
      'US-DM-cycle-runtime',
      cycle.ok === true && cycle.hops.length === GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_CYCLE.length,
      `ok=${cycle.ok}; hops=${cycle.hops.length}; failed=${cycle.hops
        .filter((h) => h.state === 'FAIL')
        .map((h) => h.hop)
        .join(',')}; predecessor=${os.predecessorLayer}`,
    );
  } finally {
    await rm(cycleRoot, { recursive: true, force: true });
  }

  const health = await buildGlobalNeuralTransitCivilizationAtlasOsHealthReport({
    root: repoRoot,
    repoRoot,
  });
  check(
    'US-DM-health-report',
    health.honestyBanner === HONESTY_BANNER &&
      health.tipLand === false &&
      health.productionAuthorized === false &&
      health.dbCandidatesApplied === false &&
      health.githubSotIssue === 130 &&
      health.gitlabCoordinationIssue === 64,
    `phase=${health.phase}`,
  );

  check(
    'US-DM-os-id-present',
    typeof os.id === 'string' && os.id.startsWith('dmos_') && os.tipLand === false,
    os.id,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log('OK 62L-DM Global Neural Transit Civilization Atlas stories passed');
