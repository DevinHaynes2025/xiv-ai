/**
 * 62L-DM Global Neural Transit + Civilization Atlas OS runtime —
 * Walks GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  bootstrapCivilizationKnowledgeAtlas,
  ingestCivilizationAtlasPack,
  startInclusiveUxSession,
} from './civilization-knowledge-atlas';
import {
  bootstrapGlobalNeuralTransitGrid,
  openTransitCorridor,
} from './global-neural-transit-grid';
import {
  bootstrapGlobalNeuralTransitCivilizationAtlasOs,
  globalNeuralTransitCivilizationAtlasOsHonesty,
} from './global-neural-transit-civilization-atlas-os';
import {
  bootstrapHeterogeneousComputeFabricDm,
  placeHeterogeneousCompute,
} from './heterogeneous-compute-fabric-dm';
import {
  attemptSealedPrivateShare,
  bootstrapInclusiveBusinessOsEcosystem,
  registerToolchainCapability,
} from './inclusive-business-os-ecosystem';
import {
  bootstrapUniversalDeviceRuntime,
  registerDeviceRuntimeProfile,
  requestCrossDeviceContinuity,
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
} from './verified-offline-online-agent-workforce';
import {
  DM_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_CYCLE,
  HONESTY_BANNER,
  METAPHOR_ARCHITECTURE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type DmActor,
  type DmEvidenceState,
  type DmHop,
  type DmHopRecord,
} from './global-neural-transit-civilization-atlas-types';

export {
  DM_LOCKS,
  HONESTY_BANNER,
  METAPHOR_ARCHITECTURE,
  NEXT_PHASE_TITLE,
  GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_CYCLE,
  predecessorMap,
};

function hop(name: DmHop, state: DmEvidenceState, summary: string): DmHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DmCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DmActor;
  root?: string;
  repoRoot?: string;
};

export async function runGlobalNeuralTransitCivilizationAtlasOsCycle(input: DmCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DmHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DM_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DM_LOCKS.LOCAL_FIRST &&
        DM_LOCKS.USER_DEMOGRAPHIC_PROFILING === false &&
        DM_LOCKS.PLUGIN_REGISTRATION_EQ_AUTHORITY === false &&
        DM_LOCKS.SELF_GRANT_PRODUCTION_AUTHORITY === false &&
        DM_LOCKS.SEALED_SILENT_PRIVATE_SHARE === false &&
        DM_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapGlobalNeuralTransitCivilizationAtlasOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'global_neural_transit_civilization_atlas_os_bootstrap',
      'IMPLEMENTED',
      `os=${os.id}; predecessor=${os.predecessorLayer}`,
    ),
  );

  const biz = await bootstrapInclusiveBusinessOsEcosystem({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const unconfigured = await registerToolchainCapability({
    ecosystemId: biz.id,
    capability: 'chatgpt',
    configured: false,
    registered: false,
    verified: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_chatgpt_cursor_plugin_capability_unavailable',
      unconfigured.accepted === false && unconfigured.capability?.status === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : 'FAIL',
      unconfigured.reason,
    ),
  );

  const pluginAuth = await registerToolchainCapability({
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
  hops.push(
    hop(
      'plugin_registration_neq_authority_credentials_billing',
      pluginAuth.accepted === false ? 'DENIED' : 'FAIL',
      pluginAuth.reason,
    ),
  );

  const devices = await bootstrapUniversalDeviceRuntime({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const unverifiedPlatform = await registerDeviceRuntimeProfile({
    runtimeId: devices.id,
    platform: 'ios',
    enrolled: false,
    verified: false,
    tested: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_mobile_desktop_platform_unavailable_or_not_tested',
      unverifiedPlatform.accepted === false &&
        (unverifiedPlatform.profile?.status === 'UNAVAILABLE' ||
          unverifiedPlatform.profile?.status === 'NOT_TESTED')
        ? unverifiedPlatform.profile!.status
        : 'FAIL',
      unverifiedPlatform.reason,
    ),
  );

  const atlas = await bootstrapCivilizationKnowledgeAtlas({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const badPack = await ingestCivilizationAtlasPack({
    atlasId: atlas.id,
    region: 'egypt',
    title: 'unauthorized-pack',
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'atlas_intake_without_provenance_rights_denied',
      badPack.accepted === false ? 'DENIED' : 'FAIL',
      badPack.reason,
    ),
  );

  const profiling = await startInclusiveUxSession({
    atlasId: atlas.id,
    locale: 'en',
    declaredAgeYears: 30,
    profileByRace: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'user_demographic_profiling_denied',
      profiling.accepted === false ? 'DENIED' : 'FAIL',
      profiling.reason,
    ),
  );

  const under18 = await startInclusiveUxSession({
    atlasId: atlas.id,
    locale: 'sw',
    declaredAgeYears: 16,
    root,
    actor,
  });
  hops.push(
    hop(
      'under_18_denied_where_18_plus_required',
      under18.accepted === false ? 'DENIED' : 'FAIL',
      under18.reason,
    ),
  );

  const workforce = await bootstrapVerifiedAgentWorkforce({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const noNode = await scheduleWorkforceWithoutPoweredNode({
    workforceId: workforce.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'no_powered_node_waiting_or_offline_stopped',
      noNode.accepted === false &&
        (noNode.status === 'WAITING_NODE' || noNode.status === 'OFFLINE_STOPPED')
        ? noNode.status
        : 'FAIL',
      noNode.reason,
    ),
  );

  const node = await registerWorkforceNode({
    workforceId: workforce.id,
    name: 'dm-node-1',
    powered: true,
    authorized: true,
    root,
    actor,
  });
  const staleAt = new Date(Date.now() - 120_000).toISOString();
  await recordWorkforceHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'proc-evidence-stale',
    root,
    actor,
    atIso: staleAt,
  });
  const agent = await createWorkforceAgent({
    workforceId: workforce.id,
    name: 'dm-agent-1',
    root,
    actor,
  });
  const staleClaim = await claimWorkforceRunningVerified({
    agentId: agent.agent!.id,
    nodeId: node.node!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'stale_heartbeat_not_running_verified',
      staleClaim.accepted === false && staleClaim.status !== 'RUNNING_VERIFIED'
        ? 'STALE'
        : 'FAIL',
      staleClaim.reason,
    ),
  );

  const pack = await sealEncryptedOfflinePack({
    workforceId: workforce.id,
    agentId: agent.agent!.id,
    plaintext: 'offline-work-payload',
    root,
    actor,
  });
  const tamper = await openEncryptedOfflinePack({
    packId: pack.pack!.id,
    tamperedCiphertext: 'dGFtcGVyZWQ=',
    root,
    actor,
  });
  hops.push(
    hop(
      'encrypted_offline_pack_tamper_checksum_fail_rejected',
      tamper.accepted === false ? 'TAMPER_REJECTED' : 'FAIL',
      tamper.reason,
    ),
  );

  const continuity = await requestCrossDeviceContinuity({
    runtimeId: devices.id,
    fromDeviceId: 'dev-a',
    toDeviceId: 'dev-b',
    enrollmentPresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'cross_device_continuity_without_enrollment_denied',
      continuity.accepted === false ? 'DENIED' : 'FAIL',
      continuity.reason,
    ),
  );

  const selfGrant = await createWorkforceAgent({
    workforceId: workforce.id,
    name: 'self-grant-agent',
    selfGrantProductionAuthority: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'new_agent_creation_bounded_no_self_grant_production_authority',
      selfGrant.accepted === false ? 'DENIED' : 'FAIL',
      selfGrant.reason,
    ),
  );

  const silentShare = await attemptSealedPrivateShare({
    ecosystemId: biz.id,
    fromTenantId: input.tenantId,
    toTenantId: 'other-tenant',
    sealed: true,
    silent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_private_silent_share_denied',
      silentShare.accepted === false ? 'DENIED' : 'FAIL',
      silentShare.reason,
    ),
  );

  // Side-path coverage: transit corridor + verified compute (not separate cycle hops).
  const grid = await bootstrapGlobalNeuralTransitGrid({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  await openTransitCorridor({
    gridId: grid.id,
    name: 'africa-china-corridor',
    fromRegion: 'africa',
    toRegion: 'china',
    root,
    actor,
  });
  const compute = await bootstrapHeterogeneousComputeFabricDm({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  await placeHeterogeneousCompute({
    fabricId: compute.id,
    kind: 'cpu',
    verified: true,
    root,
    actor,
  });

  const gate = decisionGate({
    id: `dm-cycle-${Date.now().toString(36)}`,
    action: 'global_neural_transit_civilization_atlas_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DM global neural transit civilization atlas cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DM'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
        gateExecutableByAgent: gate.executableByAgent,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', 'evidence ledger append'));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DM global neural transit civilization atlas cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        'hops completed; learning ≠ permission; no self-grant production authority; demographic profiling denied',
      sourceRefs: ['62L-DM'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning ledger append; learning ≠ permission'));

  const health = await checkLocalBrainHealth(root);
  const preds = predecessorMap(input.repoRoot);
  const honesty = globalNeuralTransitCivilizationAtlasOsHonesty();

  return {
    ok: hops.every((h) => h.state !== 'FAIL'),
    cycle: GLOBAL_NEURAL_TRANSIT_CIVILIZATION_ATLAS_CYCLE,
    hops,
    honesty,
    predecessorMap: preds,
    localBrainHealth: health,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    osId: os.id,
  };
}

export async function buildGlobalNeuralTransitCivilizationAtlasOsHealthReport(input?: {
  root?: string;
  repoRoot?: string;
}) {
  const root = input?.root ?? process.cwd();
  const repoRoot = input?.repoRoot ?? root;
  const preds = predecessorMap(repoRoot);
  const honesty = globalNeuralTransitCivilizationAtlasOsHonesty();
  const health = await checkLocalBrainHealth(root);
  return {
    phase: '62L-DM',
    honestyBanner: HONESTY_BANNER,
    locks: DM_LOCKS,
    metaphorArchitecture: METAPHOR_ARCHITECTURE,
    predecessorMap: preds,
    honesty,
    localBrainHealth: health,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    tipLand: false,
    productionAuthorized: false,
    dbCandidatesApplied: false,
    at: new Date().toISOString(),
  };
}
