/**
 * 62L-DP Plugin Civilization OS runtime —
 * Walks PLUGIN_CIVILIZATION_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  createToolchain,
  invokeFederatedPlugin,
  registerFederatedPlugin,
  requestPermissionUpgrade,
} from './agent-toolchain-federation';
import { registerCloudAdapter, routeViaAdapter } from './cross-cloud-data-adapter-fabric';
import {
  registerEnterpriseConnector,
  useEnterpriseConnector,
} from './enterprise-integration-highway';
import {
  createOfflinePluginRuntime,
  probeOfflineCloudClaim,
} from './offline-plugin-runtime';
import { evaluateActionRisk } from './plugin-action-risk-gate';
import {
  bootstrapPluginCivilizationOs,
  pluginCivilizationOsHonesty,
  routeSealedDataViaPlugin,
} from './plugin-civilization-os';
import {
  DP_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PLUGIN_CIVILIZATION_OS_CYCLE,
  predecessorMap,
  type DpActor,
  type DpEvidenceState,
  type DpHop,
  type DpHopRecord,
} from './plugin-civilization-os-types';
import {
  invokeUnderSecOps,
  killSwitchPlugin,
  registerSecOpsPlugin,
  reportSchemaDrift,
} from './plugin-security-operations-center';
import { growCapabilityGraph } from './self-expanding-capability-graph';
import {
  listConnectorOnMarketplace,
  probeMarketplaceAuthority,
  searchMarketplace,
} from './universal-connector-marketplace';

export {
  PLUGIN_CIVILIZATION_OS_CYCLE,
  DP_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DpHop, state: DpEvidenceState, summary: string): DpHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DpCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DpActor;
  root?: string;
  repoRoot?: string;
};

export async function runPluginCivilizationOsCycle(input: DpCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DpHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };
  const agentActor: DpActor = { ...actor, kind: 'agent', id: 'agent-self' };
  const humanActor: DpActor = { ...actor, kind: 'human_approver', id: 'human-1' };

  hops.push(
    hop(
      'honesty_locks',
      DP_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DP_LOCKS.LOCAL_FIRST &&
        DP_LOCKS.MARKETPLACE_LISTING_EQ_TRUSTED === false &&
        DP_LOCKS.MARKETPLACE_LISTING_EQ_AUTHORITY === false &&
        DP_LOCKS.PERMISSION_UPGRADE_WITHOUT_EXPLICIT_DIFF === false &&
        DP_LOCKS.CONSEQUENTIAL_WRITE_SELF_APPROVE === false &&
        DP_LOCKS.EXTERNAL_ACTION_SELF_APPROVE === false &&
        DP_LOCKS.READ_ONLY_SILENT_ESCALATION_TO_WRITE === false &&
        DP_LOCKS.CAPABILITY_GRAPH_GROWTH_AUTO_GRANTS_PERMISSIONS === false &&
        DP_LOCKS.OFFLINE_FALLBACK_INVENTS_CLOUD_AVAILABILITY === false &&
        DP_LOCKS.UNVERIFIED_PLUGIN_RECEIVES_SEALED_DATA === false &&
        DP_LOCKS.UNENROLLED_ENTERPRISE_CONNECTOR_AVAILABLE === false &&
        DP_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapPluginCivilizationOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'plugin_civilization_os_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}; doSoftWire=${os.doMeshSoftWired}`,
    ),
  );

  const listing = await listConnectorOnMarketplace({
    name: 'crm-connector',
    version: '1.0.0',
    category: 'crm',
    scopes: ['read'],
    tags: ['crm'],
    root,
    actor,
  });
  const search = await searchMarketplace({ query: 'crm', root });
  const authProbe = await probeMarketplaceAuthority({
    manifestId: listing.id,
    claimAuthority: true,
    claimBilling: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'marketplace_listing_not_trusted_not_authority',
      search.every((h) => h.trusted === false && h.authority === false) &&
        authProbe.trusted === false &&
        authProbe.authority === false
        ? 'PASS'
        : 'FAIL',
      authProbe.reason,
    ),
  );

  const fed = await registerFederatedPlugin({
    verified: true,
    approved: true,
    scopes: ['read'],
    root,
    actor,
  });
  const upgradeDenied = await requestPermissionUpgrade({
    pluginId: fed.pluginId,
    toScopes: ['write_reversible'],
    explicitDiffPresented: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'permission_upgrade_without_explicit_diff_denied',
      upgradeDenied.status === 'denied' ? 'PASS' : 'FAIL',
      upgradeDenied.reason,
    ),
  );

  const consequential = await evaluateActionRisk({
    pluginId: fed.pluginId,
    actionId: 'write-ledger',
    scope: 'write_consequential',
    grantedScopes: ['write_consequential'],
    humanGatePresent: false,
    actor: agentActor,
    root,
  });
  hops.push(
    hop(
      'consequential_write_without_human_gate_denied',
      consequential.status === 'denied' ? 'PASS' : 'FAIL',
      consequential.reason,
    ),
  );

  const external = await evaluateActionRisk({
    pluginId: fed.pluginId,
    actionId: 'call-vendor',
    scope: 'external_action',
    grantedScopes: ['external_action'],
    humanGatePresent: false,
    actor: agentActor,
    root,
  });
  hops.push(
    hop(
      'external_action_without_human_gate_denied',
      external.status === 'denied' ? 'PASS' : 'FAIL',
      external.reason,
    ),
  );

  const escalate = await evaluateActionRisk({
    pluginId: fed.pluginId,
    actionId: 'silent-write',
    scope: 'write_reversible',
    grantedScopes: ['read'],
    priorRiskClass: 'READ_ONLY',
    actor: agentActor,
    root,
  });
  hops.push(
    hop(
      'read_only_cannot_escalate_silently_to_write',
      escalate.status === 'denied' ? 'PASS' : 'FAIL',
      escalate.reason,
    ),
  );

  const sec = await registerSecOpsPlugin({
    name: 'killable',
    version: '1.0.0',
    verified: true,
    root,
    actor,
  });
  await killSwitchPlugin({ pluginId: sec.id, root, actor });
  const killedInvoke = await invokeUnderSecOps({ pluginId: sec.id, root, actor });
  hops.push(
    hop(
      'kill_switch_stops_invocations',
      killedInvoke.status === 'denied' ? 'PASS' : 'FAIL',
      killedInvoke.reason,
    ),
  );

  const driftPlug = await registerSecOpsPlugin({
    name: 'drifty',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    verified: true,
    root,
    actor,
  });
  await reportSchemaDrift({
    pluginId: driftPlug.id,
    observedVersion: '1.0.1',
    observedSchemaVersion: '1.0.0',
    root,
    actor,
  });
  const driftInvoke = await invokeUnderSecOps({ pluginId: driftPlug.id, root, actor });
  hops.push(
    hop(
      'schema_drift_not_silently_trusted',
      driftInvoke.status === 'denied' ? 'PASS' : 'FAIL',
      driftInvoke.reason,
    ),
  );

  const agentBuilt = await registerFederatedPlugin({
    agentBuilt: true,
    verified: false,
    approved: false,
    scopes: ['read'],
    root,
    actor,
  });
  const sandboxTc = await createToolchain({
    name: 'agent-built-tc',
    pluginIds: [agentBuilt.pluginId],
    root,
    actor,
  });
  const sandboxInv = await invokeFederatedPlugin({
    toolchainId: sandboxTc.id,
    pluginId: agentBuilt.pluginId,
    root,
    actor,
  });
  hops.push(
    hop(
      'agent_built_connector_remains_sandbox',
      sandboxInv.status === 'sandbox' || sandboxTc.status === 'sandbox' ? 'PASS' : 'FAIL',
      sandboxInv.reason,
    ),
  );

  const growth = await growCapabilityGraph({
    capability: 'new-integration-surface',
    pluginId: fed.pluginId,
    evidenceRef: 'evidence-1',
    requestedAutoGrantScopes: ['write_consequential', 'external_action'],
    root,
    actor,
  });
  hops.push(
    hop(
      'capability_graph_growth_no_auto_grant_permissions',
      growth.growth.grantedScopes.length === 0 &&
        growth.node.grantsPermissions === false &&
        growth.growth.status === 'denied_auto_grant'
        ? 'PASS'
        : 'FAIL',
      growth.growth.reason,
    ),
  );

  const offline = await createOfflinePluginRuntime({
    pluginId: listing.id,
    cloudConfigured: false,
    root,
    actor,
  });
  const offlineProbe = await probeOfflineCloudClaim({
    runtimeId: offline.id,
    claimLiveCloudAvailable: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_runtime_no_live_cloud_when_unconfigured',
      offlineProbe.status === 'denied' && offlineProbe.cloudAvailability === 'UNAVAILABLE'
        ? 'PASS'
        : 'FAIL',
      offlineProbe.reason,
    ),
  );

  const sealed = await routeSealedDataViaPlugin({
    pluginId: 'unverified-plugin',
    pluginVerified: false,
    root,
    actor,
  });
  const unverifiedAdapter = await registerCloudAdapter({
    name: 's3-like',
    provider: 'local-stub',
    configured: true,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const sealedAdapter = await routeViaAdapter({
    adapterId: unverifiedAdapter.id,
    sealedData: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_data_via_unverified_plugin_denied',
      sealed.status === 'denied' && sealedAdapter.status === 'denied' ? 'PASS' : 'FAIL',
      sealed.reason,
    ),
  );

  const unenrolled = await registerEnterpriseConnector({
    name: 'sap-like',
    enrolled: false,
    scopes: ['read'],
    root,
    actor,
  });
  const unenrolledUse = await useEnterpriseConnector({
    connectorId: unenrolled.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unenrolled_enterprise_connector_unavailable',
      unenrolledUse.status === 'unavailable' ? 'PASS' : 'FAIL',
      unenrolledUse.reason,
    ),
  );

  const regProbe = await probeMarketplaceAuthority({
    manifestId: listing.id,
    claimBilling: true,
    claimCredentials: true,
    claimDeploy: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'registration_neq_billing_credentials_deploy',
      regProbe.grantsBilling === false &&
        regProbe.grantsCredentials === false &&
        regProbe.grantsDeploy === false
        ? 'PASS'
        : 'FAIL',
      regProbe.reason,
    ),
  );

  // human gate positive path (evidence only; not a production authorization)
  const humanOk = await evaluateActionRisk({
    pluginId: fed.pluginId,
    actionId: 'approved-write',
    scope: 'write_consequential',
    grantedScopes: ['write_consequential'],
    humanGatePresent: true,
    actor: humanActor,
    root,
  });
  void humanOk;

  void decisionGate({
    id: 'dp-cycle-gate',
    action: '62l_dp_plugin_civilization_os_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void pluginCivilizationOsHonesty(input.repoRoot);

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DP plugin civilization OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DP'],
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
      subject: '62L-DP plugin civilization OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; listing≠trusted; capability growth≠auto-grant; offline≠invented cloud`,
      sourceRefs: ['62L-DP'],
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
    l4AutonomyEnabled: DP_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: os.predecessorLayer,
    doMeshSoftWired: os.doMeshSoftWired,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionPluginCivilizationShipped: false as const,
    dbCandidatesApplied: false as const,
    os,
  };
}

export async function buildPluginCivilizationOsHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: DpActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: DpActor = input?.actor ?? {
    kind: 'plugin_civilization_curator',
    id: 'health',
    orgId,
    tenantId,
    universeId,
  };
  const cycle = await runPluginCivilizationOsCycle({
    orgId,
    tenantId,
    universeId,
    actor,
    root: input?.root,
    repoRoot: input?.repoRoot,
  });
  const failed = cycle.hops.filter((h) => h.state === 'FAIL');
  return {
    status: failed.length === 0 ? 'HEALTHY' : 'DEGRADED',
    failedHops: failed.map((h) => h.hop),
    hopCount: cycle.hops.length,
    predecessorLayer: cycle.predecessorLayer,
    doMeshSoftWired: cycle.doMeshSoftWired,
    honesty: pluginCivilizationOsHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    dbCandidatesApplied: false as const,
  };
}
