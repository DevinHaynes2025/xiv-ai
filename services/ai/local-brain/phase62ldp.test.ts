import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  ACTION_RISK_CLASSES,
  ACTION_RISK_MATRIX,
  AGENT_BUILT_SANDBOX_UNTIL_GATES,
  CAPABILITY_GROWTH_NO_AUTO_GRANT,
  CONSEQUENTIAL_WRITE_GATE_REQUIRED,
  DP_LOCKS,
  DRIFT_NOT_SILENTLY_TRUSTED,
  EXTERNAL_ACTION_GATE_REQUIRED,
  HONESTY_BANNER,
  KILL_SWITCH_INVOCATION_STOPPED,
  MARKETPLACE_LISTING_NOT_TRUSTED,
  NEXT_PHASE_TITLE,
  OFFLINE_NO_INVENTED_CLOUD,
  PERMISSION_UPGRADE_DIFF_REQUIRED,
  PLUGIN_CIVILIZATION_OS_CYCLE,
  READ_ONLY_ESCALATION_DENIED,
  REGISTRATION_NO_BILLING_CREDS_DEPLOY,
  UNENROLLED_ENTERPRISE_UNAVAILABLE,
  UNVERIFIED_SEALED_DATA_DENIED,
  predecessorMap,
  type DpActor,
} from './plugin-civilization-os-types';
import {
  buildPluginCivilizationOsHealthReport,
  runPluginCivilizationOsCycle,
} from './plugin-civilization-os-runtime';
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

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldp-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DpActor = {
  kind: 'plugin_civilization_curator',
  id: 'test-curator',
  orgId: 'org-dp',
  tenantId: 'tenant-dp',
  universeId: 'universe-dp',
};
const agentActor: DpActor = { ...actor, kind: 'agent', id: 'agent-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      DP_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DP_LOCKS.TIP_LAND === false &&
      ACTION_RISK_CLASSES.length === 5 &&
      ACTION_RISK_MATRIX.CONSEQUENTIAL_WRITE.selfApproveAllowed === false &&
      ACTION_RISK_MATRIX.EXTERNAL_ACTION.humanGateRequired === true &&
      PLUGIN_CIVILIZATION_OS_CYCLE.includes('kill_switch_stops_invocations'),
    'locks + risk matrix present',
  );

  const os = await bootstrapPluginCivilizationOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_plugin_civilization_os',
    Boolean(os.id) && os.l4AutonomyEnabled === false && os.tipLand === false,
    `os=${os.id}; predecessor=${os.predecessorLayer}`,
  );

  const listing = await listConnectorOnMarketplace({
    name: 'stripe-like',
    version: '0.1.0',
    category: 'payments',
    scopes: ['read'],
    tags: ['payments'],
    root,
    actor,
  });
  const hits = await searchMarketplace({ query: 'stripe', root });
  const auth = await probeMarketplaceAuthority({
    manifestId: listing.id,
    claimAuthority: true,
    root,
    actor,
  });
  check(
    'marketplace_listing_not_trusted_not_authority',
    listing.reason === MARKETPLACE_LISTING_NOT_TRUSTED &&
      hits.every((h) => h.trusted === false && h.authority === false) &&
      auth.trusted === false &&
      auth.authority === false,
    auth.reason,
  );

  const fed = await registerFederatedPlugin({
    verified: true,
    approved: true,
    scopes: ['read'],
    root,
    actor,
  });
  const upgrade = await requestPermissionUpgrade({
    pluginId: fed.pluginId,
    toScopes: ['write_reversible'],
    explicitDiffPresented: false,
    root,
    actor,
  });
  check(
    'permission_upgrade_without_explicit_diff_denied',
    upgrade.status === 'denied' && upgrade.reason === PERMISSION_UPGRADE_DIFF_REQUIRED,
    upgrade.reason,
  );

  const consequential = await evaluateActionRisk({
    pluginId: fed.pluginId,
    actionId: 'consequential',
    scope: 'write_consequential',
    grantedScopes: ['write_consequential'],
    humanGatePresent: false,
    actor: agentActor,
    root,
  });
  check(
    'consequential_write_without_human_gate_denied',
    consequential.status === 'denied' &&
      consequential.reason === CONSEQUENTIAL_WRITE_GATE_REQUIRED,
    consequential.reason,
  );

  const external = await evaluateActionRisk({
    pluginId: fed.pluginId,
    actionId: 'external',
    scope: 'external_action',
    grantedScopes: ['external_action'],
    humanGatePresent: false,
    actor: agentActor,
    root,
  });
  check(
    'external_action_without_human_gate_denied',
    external.status === 'denied' && external.reason === EXTERNAL_ACTION_GATE_REQUIRED,
    external.reason,
  );

  const escalate = await evaluateActionRisk({
    pluginId: fed.pluginId,
    actionId: 'escalate',
    scope: 'write_reversible',
    grantedScopes: ['read'],
    priorRiskClass: 'READ_ONLY',
    actor: agentActor,
    root,
  });
  check(
    'read_only_cannot_escalate_silently_to_write',
    escalate.status === 'denied' && escalate.reason === READ_ONLY_ESCALATION_DENIED,
    escalate.reason,
  );

  const sec = await registerSecOpsPlugin({
    name: 'kill-me',
    version: '1.0.0',
    verified: true,
    root,
    actor,
  });
  await killSwitchPlugin({ pluginId: sec.id, root, actor });
  const killed = await invokeUnderSecOps({ pluginId: sec.id, root, actor });
  check(
    'kill_switch_stops_invocations',
    killed.status === 'denied' && killed.reason === KILL_SWITCH_INVOCATION_STOPPED,
    killed.reason,
  );

  const driftPlug = await registerSecOpsPlugin({
    name: 'drift-me',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    verified: true,
    root,
    actor,
  });
  await reportSchemaDrift({
    pluginId: driftPlug.id,
    observedVersion: '2.0.0',
    observedSchemaVersion: '1.0.0',
    root,
    actor,
  });
  const drifted = await invokeUnderSecOps({ pluginId: driftPlug.id, root, actor });
  check(
    'schema_drift_not_silently_trusted',
    drifted.status === 'denied' && drifted.reason === DRIFT_NOT_SILENTLY_TRUSTED,
    drifted.reason,
  );

  const agentBuilt = await registerFederatedPlugin({
    agentBuilt: true,
    verified: false,
    approved: false,
    scopes: ['invoke'],
    root,
    actor,
  });
  const tc = await createToolchain({
    name: 'sandbox-tc',
    pluginIds: [agentBuilt.pluginId],
    root,
    actor,
  });
  const sandInv = await invokeFederatedPlugin({
    toolchainId: tc.id,
    pluginId: agentBuilt.pluginId,
    root,
    actor,
  });
  check(
    'agent_built_connector_remains_sandbox',
    (sandInv.status === 'sandbox' || tc.status === 'sandbox') &&
      sandInv.reason === AGENT_BUILT_SANDBOX_UNTIL_GATES,
    sandInv.reason,
  );

  const growth = await growCapabilityGraph({
    capability: 'compose-connectors',
    evidenceRef: 'ev-1',
    requestedAutoGrantScopes: ['write_consequential'],
    root,
    actor,
  });
  check(
    'capability_graph_growth_no_auto_grant_permissions',
    growth.node.grantsPermissions === false &&
      growth.growth.grantedScopes.length === 0 &&
      growth.growth.reason === CAPABILITY_GROWTH_NO_AUTO_GRANT,
    growth.growth.reason,
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
  check(
    'offline_runtime_no_live_cloud_when_unconfigured',
    offlineProbe.status === 'denied' &&
      offlineProbe.cloudAvailability === 'UNAVAILABLE' &&
      offlineProbe.reason === OFFLINE_NO_INVENTED_CLOUD,
    offlineProbe.reason,
  );

  const sealed = await routeSealedDataViaPlugin({
    pluginId: 'unverified',
    pluginVerified: false,
    root,
    actor,
  });
  const adapter = await registerCloudAdapter({
    name: 'gcs-like',
    provider: 'stub',
    configured: true,
    authorized: true,
    verified: false,
    root,
    actor,
  });
  const sealedRoute = await routeViaAdapter({
    adapterId: adapter.id,
    sealedData: true,
    root,
    actor,
  });
  check(
    'sealed_data_via_unverified_plugin_denied',
    sealed.status === 'denied' &&
      sealed.reason === UNVERIFIED_SEALED_DATA_DENIED &&
      sealedRoute.status === 'denied',
    sealed.reason,
  );

  const ent = await registerEnterpriseConnector({
    name: 'workday-like',
    enrolled: false,
    root,
    actor,
  });
  const entUse = await useEnterpriseConnector({ connectorId: ent.id, root, actor });
  check(
    'unenrolled_enterprise_connector_unavailable',
    entUse.status === 'unavailable' && entUse.reason === UNENROLLED_ENTERPRISE_UNAVAILABLE,
    entUse.reason,
  );

  const reg = await probeMarketplaceAuthority({
    manifestId: listing.id,
    claimBilling: true,
    claimCredentials: true,
    claimDeploy: true,
    root,
    actor,
  });
  check(
    'registration_neq_billing_credentials_deploy',
    reg.grantsBilling === false &&
      reg.grantsCredentials === false &&
      reg.grantsDeploy === false &&
      reg.reason === REGISTRATION_NO_BILLING_CREDS_DEPLOY,
    reg.reason,
  );

  const cycle = await runPluginCivilizationOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle_all_required_stories',
    failedHops.length === 0 && cycle.tipLand === false && cycle.productionAuthorized === false,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildPluginCivilizationOsHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report_healthy',
    health.status === 'HEALTHY' && health.nextPhaseTitle === NEXT_PHASE_TITLE,
    `status=${health.status}`,
  );

  const honesty = pluginCivilizationOsHonesty(repoRoot);
  const preds = predecessorMap(repoRoot);
  check(
    'honesty_and_predecessor_probe',
    honesty.banner === HONESTY_BANNER &&
      honesty.l4AutonomyEnabled === false &&
      preds.DK.tipProbe === 'PRESENT',
    `predecessor=${honesty.predecessorLayer}; DO=${preds.DO.tipProbe}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DP stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DP Plugin Civilization OS stories passed');
