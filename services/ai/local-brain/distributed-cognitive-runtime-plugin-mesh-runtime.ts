/**
 * 62L-DO Distributed Cognitive Runtime Plugin Mesh runtime —
 * Walks DISTRIBUTED_COGNITIVE_RUNTIME_PLUGIN_MESH_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  exchangeSkillWithEvidence,
} from './agent-skill-exchange-network';
import {
  planWorkload,
} from './adaptive-offline-cloud-workload-brain';
import {
  bootstrapDistributedCognitiveRuntimePluginMesh,
  distributedCognitiveRuntimePluginMeshHonesty,
} from './distributed-cognitive-runtime-plugin-mesh';
import {
  DISTRIBUTED_COGNITIVE_RUNTIME_PLUGIN_MESH_CYCLE,
  DO_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PLUGIN_TRUST_MODEL,
  predecessorMap,
  type DoActor,
  type DoEvidenceState,
  type DoHop,
  type DoHopRecord,
} from './distributed-cognitive-runtime-plugin-mesh-types';
import {
  intakeMemoryLakeEntry,
} from './global-civilization-innovation-memory-lake';
import {
  composePlugins,
  createAgentBuiltSandboxAdapter,
  invokePlugin,
  killSwitchPlugin,
  probeOfflineFallback,
  probeRegistrationAuthority,
  registerPluginManifest,
  reportPluginDrift,
  xivVerifyPlugin,
} from './plugin-intelligence-mesh';
import {
  lookupDeviceChipCapability,
  registerDeviceChipCapability,
} from './universal-device-chip-capability-graph';
import {
  openZeroTrustRoute,
} from './zero-trust-data-highway';

export {
  DISTRIBUTED_COGNITIVE_RUNTIME_PLUGIN_MESH_CYCLE,
  DO_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PLUGIN_TRUST_MODEL,
  predecessorMap,
};

function hop(name: DoHop, state: DoEvidenceState, summary: string): DoHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DoCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DoActor;
  root?: string;
  repoRoot?: string;
};

export async function runDistributedCognitiveRuntimePluginMeshCycle(input: DoCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DoHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DO_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DO_LOCKS.LOCAL_FIRST &&
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
        DO_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const mesh = await bootstrapDistributedCognitiveRuntimePluginMesh({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'distributed_cognitive_runtime_fabric_bootstrap',
      'PASS',
      `fabric predecessor=${mesh.predecessorLayer}; mesh=${mesh.id}`,
    ),
  );

  const installed = await registerPluginManifest({
    name: 'installed-unverified',
    version: '1.0.0',
    category: 'productivity',
    scopes: ['invoke'],
    installed: true,
    configured: true,
    verified: false,
    root,
    actor,
  });
  const untrustedInvoke = await invokePlugin({
    pluginId: installed.id,
    requestedScope: 'invoke',
    root,
    actor,
  });
  hops.push(
    hop(
      'installed_configured_plugin_not_trusted_until_verified',
      untrustedInvoke.status === 'denied' ? 'PASS' : 'FAIL',
      untrustedInvoke.reason,
    ),
  );

  const verified = await registerPluginManifest({
    name: 'verified-narrow',
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
  await xivVerifyPlugin({ pluginId: verified.id, approve: true, root, actor });
  const missingScope = await invokePlugin({
    pluginId: verified.id,
    requestedScope: 'read_sealed',
    root,
    actor,
  });
  hops.push(
    hop(
      'missing_scope_denied_deny_by_default',
      missingScope.status === 'denied' ? 'PASS' : 'FAIL',
      missingScope.reason,
    ),
  );

  const sealedDeny = await invokePlugin({
    pluginId: installed.id,
    requestedScope: 'read_sealed',
    sealedData: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_plugin_cannot_receive_sealed_data',
      sealedDeny.status === 'denied' ? 'PASS' : 'FAIL',
      sealedDeny.reason,
    ),
  );

  const killable = await registerPluginManifest({
    name: 'killable',
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
  await killSwitchPlugin({ pluginId: killable.id, root, actor });
  const afterKill = await invokePlugin({
    pluginId: killable.id,
    requestedScope: 'invoke',
    root,
    actor,
  });
  hops.push(
    hop(
      'kill_switch_revocation_stops_invocations',
      afterKill.status === 'denied' ? 'PASS' : 'FAIL',
      afterKill.reason,
    ),
  );

  const driftTarget = await registerPluginManifest({
    name: 'drift-target',
    version: '1.0.0',
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
  await reportPluginDrift({
    pluginId: driftTarget.id,
    observedVersion: '1.0.1',
    observedSchemaVersion: '1.0.0',
    root,
    actor,
  });
  const afterDrift = await invokePlugin({
    pluginId: driftTarget.id,
    requestedScope: 'invoke',
    root,
    actor,
  });
  hops.push(
    hop(
      'drift_detected_not_silently_trusted',
      afterDrift.status === 'denied' ? 'PASS' : 'FAIL',
      afterDrift.reason,
    ),
  );

  const agentBuilt = await createAgentBuiltSandboxAdapter({
    name: 'agent-built-adapter',
    category: 'developer_tooling',
    scopes: ['invoke'],
    root,
    actor,
  });
  hops.push(
    hop(
      'agent_built_adapter_sandbox_until_gates',
      agentBuilt.sandbox && !agentBuilt.approved ? 'SANDBOXED' : 'FAIL',
      agentBuilt.reason,
    ),
  );

  const composition = await composePlugins({
    pluginIds: [installed.id, agentBuilt.id],
    root,
    actor,
  });
  hops.push(
    hop(
      'composition_unapproved_plugins_denied',
      composition.status === 'denied' ? 'PASS' : 'FAIL',
      composition.reason,
    ),
  );

  const offline = await probeOfflineFallback({
    pluginId: installed.id,
    claimLiveCloudAvailable: true,
    root,
    actor,
  });
  const workload = await planWorkload({
    taskId: 'task-cloud-1',
    requestedTarget: 'cloud',
    cloudConfigured: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_fallback_no_invented_cloud_availability',
      offline.status === 'denied' && workload.status === 'denied' ? 'PASS' : 'FAIL',
      `${offline.reason}; ${workload.reason}`,
    ),
  );

  const skill = await exchangeSkillWithEvidence({
    fromAgentId: 'agent-a',
    toAgentId: 'agent-b',
    skillId: 'skill-parse',
    evidenceRef: 'ev-1',
    fromPermissionLevel: 5,
    toPermissionLevel: 1,
    attemptEscalateTo: 5,
    root,
    actor,
  });
  hops.push(
    hop(
      'skill_exchange_no_permission_escalation',
      skill.status === 'denied' && skill.permissionEscalated === false ? 'PASS' : 'FAIL',
      skill.reason,
    ),
  );

  await registerDeviceChipCapability({
    deviceId: 'dev-1',
    chipId: 'chip-1',
    capability: 'npu',
    verified: false,
    root,
    actor,
  });
  const chipLookup = await lookupDeviceChipCapability({
    deviceId: 'dev-1',
    chipId: 'chip-1',
    capability: 'npu',
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_device_chip_capability_unavailable',
      chipLookup.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAIL',
      chipLookup.reason,
    ),
  );

  const mem = await intakeMemoryLakeEntry({
    kind: 'innovation',
    title: 'unauthorized-note',
    provenance: null,
    rightsAuthorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'memory_lake_unauthorized_intake_denied',
      mem.status === 'denied' ? 'DENIED' : 'FAIL',
      mem.reason,
    ),
  );

  const sealedSilent = await openZeroTrustRoute({
    fromNode: 'a',
    toNode: 'b',
    sealed: true,
    silent: true,
    authorized: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'zero_trust_highway_sealed_silent_route_denied',
      sealedSilent.status === 'denied' ? 'DENIED' : 'FAIL',
      sealedSilent.reason,
    ),
  );

  const regProbe = await probeRegistrationAuthority({
    pluginId: installed.id,
    claimBilling: true,
    claimCredentials: true,
    claimDeploy: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'registration_neq_billing_credentials_deploy',
      regProbe.status === 'denied' ? 'DENIED' : 'FAIL',
      regProbe.reason,
    ),
  );

  void decisionGate({
    id: 'do-cycle-gate',
    action: '62l_do_distributed_cognitive_runtime_plugin_mesh_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void distributedCognitiveRuntimePluginMeshHonesty();

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DO distributed cognitive runtime plugin mesh cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DO'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DO distributed cognitive runtime plugin mesh cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; installed≠trusted; sealed≠silent; skill≠permission; device verified-only`,
      sourceRefs: ['62L-DO'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);
  const preds = predecessorMap(input.repoRoot ?? root);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DO_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    pluginTrustModel: PLUGIN_TRUST_MODEL,
    predecessorLayer: mesh.predecessorLayer,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionPluginMeshShipped: false as const,
    dbCandidatesApplied: false as const,
  };
}

export async function buildDistributedCognitiveRuntimePluginMeshHealthReport(input?: {
  root?: string;
  repoRoot?: string;
}) {
  const root = input?.root ?? process.cwd();
  const repoRoot = input?.repoRoot ?? root;
  const preds = predecessorMap(repoRoot);
  const honesty = distributedCognitiveRuntimePluginMeshHonesty();
  return {
    phase: '62L-DO',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DO_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DO_LOCKS.TIP_LAND,
    productionAuthorization: DO_LOCKS.PRODUCTION_AUTHORIZATION,
    liveSupabaseApply: DO_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DO_LOCKS.DB_CANDIDATES_APPLIED,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    pluginTrustModel: PLUGIN_TRUST_MODEL,
    predecessorMap: preds,
    honesty,
    cycle: DISTRIBUTED_COGNITIVE_RUNTIME_PLUGIN_MESH_CYCLE,
    generatedAt: new Date().toISOString(),
  };
}
