import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  exchangeSkillWithEvidence,
  agentSkillExchangeNetworkHonesty,
} from './agent-skill-exchange-network';
import {
  adaptiveOfflineCloudWorkloadBrainHonesty,
  planWorkload,
} from './adaptive-offline-cloud-workload-brain';
import {
  bootstrapDistributedCognitiveRuntimePluginMesh,
  distributedCognitiveRuntimePluginMeshHonesty,
} from './distributed-cognitive-runtime-plugin-mesh';
import {
  DISTRIBUTED_COGNITIVE_RUNTIME_PLUGIN_MESH_CYCLE,
  DO_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PLUGIN_CATEGORIES,
  PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED,
  PLUGIN_TRUST_MODEL,
  predecessorMap,
  type DoActor,
} from './distributed-cognitive-runtime-plugin-mesh-types';
import {
  buildDistributedCognitiveRuntimePluginMeshHealthReport,
  runDistributedCognitiveRuntimePluginMeshCycle,
} from './distributed-cognitive-runtime-plugin-mesh-runtime';
import {
  globalCivilizationInnovationMemoryLakeHonesty,
  intakeMemoryLakeEntry,
} from './global-civilization-innovation-memory-lake';
import {
  buildPluginHealthDashboard,
  composePlugins,
  createAgentBuiltSandboxAdapter,
  invokePlugin,
  killSwitchPlugin,
  listPluginAuditLog,
  probeOfflineFallback,
  probeRegistrationAuthority,
  promoteAgentBuiltAdapter,
  registerPluginManifest,
  reportPluginDrift,
  resolvePluginConflict,
  routeAgentToPlugin,
  xivVerifyPlugin,
  pluginIntelligenceMeshHonesty,
} from './plugin-intelligence-mesh';
import {
  lookupDeviceChipCapability,
  registerDeviceChipCapability,
  universalDeviceChipCapabilityGraphHonesty,
} from './universal-device-chip-capability-graph';
import {
  openZeroTrustRoute,
  zeroTrustDataHighwayHonesty,
} from './zero-trust-data-highway';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldo-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DoActor = {
  kind: 'plugin_mesh_curator',
  id: 'curator-do-1',
  orgId: 'org-do',
  tenantId: 'tenant-do',
  universeId: 'univ-do',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DO1-cycle',
    DISTRIBUTED_COGNITIVE_RUNTIME_PLUGIN_MESH_CYCLE.join(' → ') ===
      'honesty_locks → distributed_cognitive_runtime_fabric_bootstrap → installed_configured_plugin_not_trusted_until_verified → missing_scope_denied_deny_by_default → unverified_plugin_cannot_receive_sealed_data → kill_switch_revocation_stops_invocations → drift_detected_not_silently_trusted → agent_built_adapter_sandbox_until_gates → composition_unapproved_plugins_denied → offline_fallback_no_invented_cloud_availability → skill_exchange_no_permission_escalation → unverified_device_chip_capability_unavailable → memory_lake_unauthorized_intake_denied → zero_trust_highway_sealed_silent_route_denied → registration_neq_billing_credentials_deploy → evidence → learning',
    'Distributed Cognitive Runtime Plugin Mesh cycle recorded in order.',
  );

  check(
    'US-DO-locks',
    DO_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DO_LOCKS.INSTALLED_EQ_TRUSTED === false &&
      DO_LOCKS.CONFIGURED_EQ_TRUSTED === false &&
      DO_LOCKS.MISSING_SCOPE_ALLOWED === false &&
      DO_LOCKS.UNVERIFIED_PLUGIN_RECEIVES_SEALED_DATA === false &&
      DO_LOCKS.DRIFT_SILENTLY_TRUSTED === false &&
      DO_LOCKS.AGENT_BUILT_SELF_PROMOTE_PRODUCTION === false &&
      DO_LOCKS.COMPOSITION_UNAPPROVED_ALLOWED === false &&
      DO_LOCKS.OFFLINE_FALLBACK_INVENTS_CLOUD_AVAILABILITY === false &&
      DO_LOCKS.SKILL_EXCHANGE_ESCALATES_PERMISSIONS === false &&
      DO_LOCKS.UNVERIFIED_DEVICE_CHIP_AVAILABLE === false &&
      DO_LOCKS.MEMORY_LAKE_UNAUTHORIZED_INTAKE === false &&
      DO_LOCKS.SEALED_SILENT_ROUTE === false &&
      DO_LOCKS.REGISTRATION_GRANTS_BILLING === false &&
      DO_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DO_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-DO-honesty-surfaces',
    distributedCognitiveRuntimePluginMeshHonesty().l4AutonomyEnabled === false &&
      pluginIntelligenceMeshHonesty().installedEqTrusted === false &&
      universalDeviceChipCapabilityGraphHonesty().unverifiedAvailable === false &&
      globalCivilizationInnovationMemoryLakeHonesty().unauthorizedIntake === false &&
      agentSkillExchangeNetworkHonesty().skillExchangeEscalatesPermissions === false &&
      adaptiveOfflineCloudWorkloadBrainHonesty().offlineInventsCloud === false &&
      zeroTrustDataHighwayHonesty().sealedSilentRoute === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DO-plugin-trust-model',
    PLUGIN_TRUST_MODEL.installed_or_configured_not_trusted.includes('NOT trusted') &&
      PLUGIN_TRUST_MODEL.registration_neq_authority.includes('Registration ≠') &&
      PLUGIN_TRUST_MODEL.skill_neq_permission.includes('Skill exchange ≠'),
    'Plugin trust model section present.',
  );

  check(
    'US-DO-plugin-categories',
    PLUGIN_CATEGORIES.includes('ai_models') &&
      PLUGIN_CATEGORIES.includes('cloud') &&
      PLUGIN_CATEGORIES.includes('crm_erp') &&
      PLUGIN_CATEGORIES.includes('media_community') &&
      PLUGIN_CATEGORIES.length === 13,
    `categories=${PLUGIN_CATEGORIES.length}`,
  );

  check(
    'US-DO-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DP —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DO-predecessor-DK-or-better',
    preds.DK.tipProbe === 'PRESENT' ||
      preds.DN.tipProbe === 'PRESENT' ||
      preds.DM.tipProbe === 'PRESENT' ||
      preds.DL.tipProbe === 'PRESENT' ||
      preds.DJ.tipProbe === 'PRESENT' ||
      preds.CP.tipProbe === 'PRESENT',
    `DN=${preds.DN.tipProbe}/${preds.DN.report}; DM=${preds.DM.tipProbe}/${preds.DM.report}; DL=${preds.DL.tipProbe}/${preds.DL.report}; DK=${preds.DK.tipProbe}/${preds.DK.report}`,
  );

  const mesh = await bootstrapDistributedCognitiveRuntimePluginMesh({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'US-DO-bootstrap',
    mesh.l4AutonomyEnabled === false &&
      mesh.productionAuthorized === false &&
      mesh.tipLand === false &&
      mesh.fullProductionPluginMeshShipped === false,
    `predecessor=${mesh.predecessorLayer}`,
  );

  // 1) Installed/configured plugin not trusted until verified
  const installed = await registerPluginManifest({
    name: 'installed-cloud-connector',
    version: '1.0.0',
    category: 'cloud',
    scopes: ['invoke', 'read_public'],
    installed: true,
    configured: true,
    verified: false,
    root,
    actor,
  });
  const untrusted = await invokePlugin({
    pluginId: installed.id,
    requestedScope: 'invoke',
    root,
    actor,
  });
  check(
    'US-DO-installed-configured-not-trusted-until-verified',
    untrusted.status === 'denied' &&
      untrusted.reason === PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED &&
      installed.verified === false &&
      (installed.trustState === 'configured' || installed.trustState === 'sandbox'),
    `${untrusted.reason}; trust=${installed.trustState}`,
  );

  // 2) Missing scope DENIED
  const narrow = await registerPluginManifest({
    name: 'narrow-verified',
    version: '1.0.0',
    category: 'security',
    scopes: ['invoke'],
    installed: true,
    configured: true,
    verified: true,
    approved: true,
    root,
    actor,
  });
  const missing = await invokePlugin({
    pluginId: narrow.id,
    requestedScope: 'network_egress',
    root,
    actor,
  });
  check(
    'US-DO-missing-scope-denied',
    missing.status === 'denied' && missing.reason.includes('MISSING_SCOPE'),
    missing.reason,
  );

  // 3) Unverified plugin cannot receive sealed data
  const sealed = await invokePlugin({
    pluginId: installed.id,
    requestedScope: 'read_sealed',
    sealedData: true,
    root,
    actor,
  });
  check(
    'US-DO-unverified-cannot-receive-sealed',
    sealed.status === 'denied',
    sealed.reason,
  );

  // 4) Kill switch / revocation stops further invocations
  const killable = await registerPluginManifest({
    name: 'killable-plugin',
    version: '1.0.0',
    category: 'analytics',
    scopes: ['invoke'],
    installed: true,
    configured: true,
    verified: true,
    approved: true,
    root,
    actor,
  });
  const beforeKill = await invokePlugin({
    pluginId: killable.id,
    requestedScope: 'invoke',
    root,
    actor,
  });
  await killSwitchPlugin({ pluginId: killable.id, root, actor });
  const afterKill = await invokePlugin({
    pluginId: killable.id,
    requestedScope: 'invoke',
    root,
    actor,
  });
  const killedRoute = await routeAgentToPlugin({
    agentId: 'agent-1',
    pluginId: killable.id,
    root,
    actor,
  });
  check(
    'US-DO-kill-switch-stops-invocations',
    beforeKill.status === 'allowed' &&
      afterKill.status === 'denied' &&
      killedRoute.status === 'denied',
    afterKill.reason,
  );

  // 5) Drift detected → not silently trusted
  const driftPlugin = await registerPluginManifest({
    name: 'drift-plugin',
    version: '2.0.0',
    schemaVersion: '1.0.0',
    category: 'databases',
    scopes: ['invoke'],
    installed: true,
    configured: true,
    verified: true,
    approved: true,
    root,
    actor,
  });
  const drift = await reportPluginDrift({
    pluginId: driftPlugin.id,
    observedVersion: '2.1.0',
    observedSchemaVersion: '1.0.0',
    root,
    actor,
  });
  const afterDrift = await invokePlugin({
    pluginId: driftPlugin.id,
    requestedScope: 'invoke',
    root,
    actor,
  });
  check(
    'US-DO-drift-not-silently-trusted',
    drift.reason.includes('DRIFT') && afterDrift.status === 'denied',
    afterDrift.reason,
  );

  // 6) Agent-built adapter remains sandbox until gates
  const adapter = await createAgentBuiltSandboxAdapter({
    name: 'agent-built-email-adapter',
    category: 'email_calendar_messaging',
    scopes: ['invoke', 'compose'],
    root,
    actor,
  });
  const selfPromote = await promoteAgentBuiltAdapter({
    pluginId: adapter.id,
    unitTestsPass: true,
    integrationTestsPass: false,
    securityTestsPass: true,
    humanReviewPass: true,
    root,
    actor,
  });
  check(
    'US-DO-agent-built-sandbox-until-gates',
    adapter.sandbox === true &&
      adapter.agentBuilt === true &&
      selfPromote.accepted === false &&
      adapter.trustState === 'sandbox',
    selfPromote.reason,
  );

  // 7) Composition of unapproved plugins DENIED
  const composition = await composePlugins({
    pluginIds: [installed.id, adapter.id],
    root,
    actor,
  });
  check(
    'US-DO-composition-unapproved-denied',
    composition.status === 'denied',
    composition.reason,
  );

  // Approved composition path (positive control)
  const a = await registerPluginManifest({
    name: 'compose-a',
    version: '1.0.0',
    category: 'productivity',
    scopes: ['invoke', 'compose'],
    installed: true,
    configured: true,
    verified: true,
    approved: true,
    root,
    actor,
  });
  const b = await registerPluginManifest({
    name: 'compose-b',
    version: '1.0.0',
    category: 'translation',
    scopes: ['invoke', 'compose'],
    installed: true,
    configured: true,
    verified: true,
    approved: true,
    root,
    actor,
  });
  const okCompose = await composePlugins({ pluginIds: [a.id, b.id], root, actor });
  check(
    'US-DO-composition-approved-allowed',
    okCompose.status === 'allowed',
    okCompose.reason,
  );

  // 8) Offline fallback does not invent live cloud availability
  const offline = await probeOfflineFallback({
    pluginId: installed.id,
    claimLiveCloudAvailable: true,
    root,
    actor,
  });
  const cloudPlan = await planWorkload({
    taskId: 'cloud-task',
    requestedTarget: 'cloud',
    cloudConfigured: false,
    root,
    actor,
  });
  check(
    'US-DO-offline-fallback-no-invented-cloud',
    offline.status === 'denied' &&
      offline.cloudAvailability === 'UNAVAILABLE' &&
      cloudPlan.status === 'denied' &&
      cloudPlan.resolvedTarget === 'UNAVAILABLE',
    `${offline.reason}; ${cloudPlan.reason}`,
  );

  // 9) Skill exchange does not escalate permissions
  const skill = await exchangeSkillWithEvidence({
    fromAgentId: 'senior-agent',
    toAgentId: 'junior-agent',
    skillId: 'crm-triage',
    evidenceRef: 'ev-skill-1',
    fromPermissionLevel: 9,
    toPermissionLevel: 2,
    attemptEscalateTo: 9,
    root,
    actor,
  });
  const skillOk = await exchangeSkillWithEvidence({
    fromAgentId: 'senior-agent',
    toAgentId: 'junior-agent',
    skillId: 'crm-triage',
    evidenceRef: 'ev-skill-2',
    fromPermissionLevel: 9,
    toPermissionLevel: 2,
    root,
    actor,
  });
  check(
    'US-DO-skill-exchange-no-permission-escalation',
    skill.status === 'denied' &&
      skill.permissionEscalated === false &&
      skillOk.status === 'exchanged' &&
      skillOk.toPermissionLevelAfter === 2 &&
      skillOk.permissionEscalated === false,
    skill.reason,
  );

  // 10) Unverified device/chip capability → UNAVAILABLE
  await registerDeviceChipCapability({
    deviceId: 'edge-phone',
    chipId: 'npu-x1',
    capability: 'on_device_llm',
    verified: false,
    root,
    actor,
  });
  const chip = await lookupDeviceChipCapability({
    deviceId: 'edge-phone',
    chipId: 'npu-x1',
    capability: 'on_device_llm',
    root,
    actor,
  });
  await registerDeviceChipCapability({
    deviceId: 'edge-phone',
    chipId: 'npu-x1',
    capability: 'sensor_fusion',
    verified: true,
    root,
    actor,
  });
  const chipOk = await lookupDeviceChipCapability({
    deviceId: 'edge-phone',
    chipId: 'npu-x1',
    capability: 'sensor_fusion',
    root,
    actor,
  });
  check(
    'US-DO-unverified-device-chip-unavailable',
    chip.status === 'UNAVAILABLE' && chipOk.status === 'VERIFIED',
    chip.reason,
  );

  // 11) Memory lake unauthorized intake DENIED
  const memDenied = await intakeMemoryLakeEntry({
    kind: 'civilization',
    title: 'unproven-claim',
    provenance: null,
    rightsAuthorized: false,
    root,
    actor,
  });
  const memOk = await intakeMemoryLakeEntry({
    kind: 'innovation',
    title: 'authorized-patent-note',
    provenance: 'archive://rights/ok-1',
    rightsAuthorized: true,
    root,
    actor,
  });
  check(
    'US-DO-memory-lake-unauthorized-denied',
    memDenied.status === 'denied' && memOk.status === 'accepted',
    memDenied.reason,
  );

  // 12) Zero-trust highway sealed silent route DENIED
  const sealedSilent = await openZeroTrustRoute({
    fromNode: 'tenant-a',
    toNode: 'tenant-b',
    sealed: true,
    silent: true,
    authorized: true,
    root,
    actor,
  });
  const sealedOk = await openZeroTrustRoute({
    fromNode: 'tenant-a',
    toNode: 'tenant-b',
    sealed: true,
    silent: false,
    authorized: true,
    root,
    actor,
  });
  const rawPool = await openZeroTrustRoute({
    fromNode: 'tenant-a',
    toNode: 'pool',
    sealed: false,
    silent: false,
    authorized: true,
    rawPrivatePooling: true,
    root,
    actor,
  });
  check(
    'US-DO-sealed-silent-route-denied',
    sealedSilent.status === 'denied' &&
      sealedOk.status === 'allowed' &&
      rawPool.status === 'denied',
    sealedSilent.reason,
  );

  // 13) Registration ≠ billing/credentials/deploy
  const reg = await probeRegistrationAuthority({
    pluginId: installed.id,
    claimBilling: true,
    claimCredentials: true,
    claimDeploy: true,
    root,
    actor,
  });
  check(
    'US-DO-registration-neq-billing-credentials-deploy',
    reg.status === 'denied' &&
      reg.grantsBilling === false &&
      reg.grantsCredentials === false &&
      reg.grantsDeploy === false &&
      installed.grantsAuthority === false,
    reg.reason,
  );

  // Conflict resolution prefers verified/approved
  const conflict = await resolvePluginConflict({
    pluginIds: [a.id, installed.id],
    root,
    actor,
  });
  check(
    'US-DO-conflict-prefer-verified-approved',
    conflict.status === 'resolved' && conflict.winnerId === a.id,
    conflict.reason,
  );

  // XIV verify path for installed plugin
  const verify = await xivVerifyPlugin({
    pluginId: installed.id,
    approve: true,
    root,
    actor,
  });
  const afterVerify = await invokePlugin({
    pluginId: installed.id,
    requestedScope: 'invoke',
    root,
    actor,
  });
  check(
    'US-DO-xiv-verify-then-invoke',
    verify.accepted === true && afterVerify.status === 'allowed',
    afterVerify.reason,
  );

  const dashboard = await buildPluginHealthDashboard({ root });
  const audits = await listPluginAuditLog({ root });
  check(
    'US-DO-health-dashboard-and-audit',
    dashboard.denyByDefault === true &&
      dashboard.total > 0 &&
      audits.length > 0,
    `plugins=${dashboard.total}; audits=${audits.length}`,
  );

  const cycle = await runDistributedCognitiveRuntimePluginMeshCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'US-DO-cycle-runtime',
    cycle.tipLand === false &&
      cycle.productionAuthorized === false &&
      cycle.hops.length === DISTRIBUTED_COGNITIVE_RUNTIME_PLUGIN_MESH_CYCLE.length &&
      cycle.hops.every((h) => h.state !== 'FAIL'),
    `hops=${cycle.hops.length}`,
  );

  const health = await buildDistributedCognitiveRuntimePluginMeshHealthReport({
    root: repoRoot,
    repoRoot,
  });
  check(
    'US-DO-health-report',
    health.phase === '62L-DO' &&
      health.githubSotIssue === 132 &&
      health.gitlabCoordinationIssue === 66 &&
      health.liveSupabaseApply === false &&
      health.dbCandidatesApplied === false,
    'Health report honesty intact.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DO stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log(
  'OK 62L-DO Distributed Cognitive Runtime Fabric + Plugin Intelligence Mesh stories passed.',
);
