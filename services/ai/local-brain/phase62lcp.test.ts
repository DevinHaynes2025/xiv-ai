import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bootstrapKnowledgeSupplyChain,
  inspectRegistrationGrants,
  registerSupplyAsset,
  supplyChainHonesty,
} from './global-knowledge-supply-chain';
import {
  assignPluginToAgent,
  attemptPromotePlugin,
  buildSandboxPlugin,
  identifyCapabilityGap,
  pluginFoundryHonesty,
  registerApprovedPlugin,
} from './plugin-tool-foundry';
import {
  checkPluginScope,
  invokeGovernedPlugin,
  recordPluginFailure,
  registerThirdPartyPlugin,
  thirdPartyPluginHonesty,
} from './third-party-plugin-governance';
import {
  authorizeRefineryNode,
  attemptArbitraryRefineryDiscovery,
  composeRefineryPipeline,
  markPluginApprovedForRefinery,
  refineryNodesHonesty,
} from './plugin-composed-regional-data-refinery-nodes';
import {
  attemptInstitutionalPromotion,
  institutionalMemoryHonesty,
  recordInstitutionalMemory,
} from './international-institutional-memory-graph';
import {
  applyDistributionPackage,
  createDistributionPackage,
  distributionNetworkHonesty,
  revokeDistributionPackage,
  routeViaPluginCloudGateway,
} from './multi-cloud-knowledge-distribution-network';
import {
  AGENT_SELF_ASSIGN_DENIED,
  ARBITRARY_REFINERY_DISCOVERY_DENIED,
  CP_LOCKS,
  HONESTY_BANNER,
  KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_CYCLE,
  MISSING_SCOPE_DENIED,
  NEXT_PHASE_TITLE,
  REGISTRATION_NO_AUTHORITY,
  REUSE_PREFERRED,
  SANDBOX_UNTIL_PROMOTION,
  SEALED_SILENT_PLUGIN_CLOUD_DENIED,
  SIM_TO_FACT_REJECTED,
  UNAPPROVED_REFINERY_DENIED,
  UNHEALTHY_PLUGIN_CIRCUIT_OPEN,
  UNSIGNED_OR_REVOKED_PACKAGE_REJECTED,
  predecessorMap,
  type CpActor,
} from './knowledge-supply-plugin-foundry-types';
import {
  buildKnowledgeSupplyPluginFoundryHealthReport,
  runKnowledgeSupplyPluginFoundryCycle,
} from './knowledge-supply-plugin-foundry-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcp-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CpActor = {
  kind: 'supply_chain_curator',
  id: 'curator-cp-1',
  orgId: 'org-cp',
  tenantId: 'tenant-cp',
  universeId: 'univ-cp',
  role: 'curator',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CP1-cycle',
    KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_CYCLE.join(' → ') ===
      'honesty_locks → supply_chain_bootstrap → reuse_approved_plugin_preferred → new_plugin_sandbox_until_promotion → registration_no_authority → deny_by_default_missing_scope → unhealthy_plugin_circuit_open → promotion_gates_required → agent_self_assign_unpromoted_denied → refinery_node_authorized_only → unapproved_refinery_composition_denied → institutional_graph_typed → reject_sim_to_fact → distribution_signed_only → unsigned_or_revoked_package_rejected → sealed_no_silent_plugin_cloud → evidence → learning',
    'Knowledge Supply Plugin Foundry cycle recorded in order.',
  );

  check(
    'US-CP-locks',
    CP_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CP_LOCKS.REUSE_APPROVED_PLUGINS_FIRST &&
      CP_LOCKS.NEW_BUILDS_SANDBOX_ONLY &&
      CP_LOCKS.REGISTRATION_GRANTS_AUTHORITY === false &&
      CP_LOCKS.REGISTRATION_GRANTS_CREDENTIALS === false &&
      CP_LOCKS.REGISTRATION_GRANTS_BILLING === false &&
      CP_LOCKS.REGISTRATION_GRANTS_DEPLOYMENT === false &&
      CP_LOCKS.REGISTRATION_GRANTS_BROADER_DATA_ACCESS === false &&
      CP_LOCKS.DENY_BY_DEFAULT_PERMISSIONS &&
      CP_LOCKS.MISSING_SCOPE_ALLOWED === false &&
      CP_LOCKS.UNHEALTHY_PLUGIN_AVAILABLE === false &&
      CP_LOCKS.CIRCUIT_OPENS_ON_FAILURE &&
      CP_LOCKS.AGENT_SELF_ASSIGN_UNPROMOTED === false &&
      CP_LOCKS.ARBITRARY_REFINERY_DISCOVERY === false &&
      CP_LOCKS.UNAPPROVED_REFINERY_COMPOSITION === false &&
      CP_LOCKS.SEALED_SILENT_PLUGIN_CLOUD_FALLBACK === false &&
      CP_LOCKS.SIM_PROMOTE_TO_FACT === false &&
      CP_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CP_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-CP-honesty-surfaces',
    supplyChainHonesty().registrationGrantsAuthority === false &&
      pluginFoundryHonesty().reuseApprovedFirst === true &&
      thirdPartyPluginHonesty().denyByDefault === true &&
      refineryNodesHonesty().arbitraryDiscovery === false &&
      institutionalMemoryHonesty().simPromoteToFact === false &&
      distributionNetworkHonesty().sealedSilentPluginCloud === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  const chain = await bootstrapKnowledgeSupplyChain({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });

  // Prefer reuse of approved plugin over duplicate build
  const approved = await registerApprovedPlugin({
    name: 'approved-etl',
    capabilityTag: 'etl-compress',
    root,
    actor,
  });
  const gap = await identifyCapabilityGap({
    capabilityTag: 'etl-compress',
    root,
    actor,
  });
  const reuse = await buildSandboxPlugin({
    name: 'dup-etl',
    capabilityTag: 'etl-compress',
    root,
    actor,
  });
  check(
    'US-CP-reuse-approved-preferred',
    gap.action === 'reuse' &&
      gap.reuseCandidateId === approved.id &&
      reuse.id === approved.id &&
      reuse.reason === REUSE_PREFERRED,
    gap.reason,
  );

  // New plugin remains sandbox until promotion gates pass
  const sandbox = await buildSandboxPlugin({
    name: 'new-tool',
    capabilityTag: 'research-synth',
    elevatedPermissions: true,
    root,
    actor,
  });
  const incomplete = await attemptPromotePlugin({
    pluginId: sandbox.id,
    unitTestsPass: true,
    integrationTestsPass: true,
    securityTestsPass: false,
    benchmarksPass: true,
    humanReviewPass: false,
    root,
    actor,
  });
  check(
    'US-CP-sandbox-until-promotion',
    sandbox.sandbox === true &&
      sandbox.lifecycle === 'sandbox' &&
      incomplete.status === 'sandboxed' &&
      incomplete.plugin?.sandbox === true &&
      sandbox.reason === SANDBOX_UNTIL_PROMOTION,
    incomplete.reason,
  );

  // Registration alone does not grant credentials/billing/deploy/broader data access
  const asset = await registerSupplyAsset({
    chainId: chain.id,
    kind: 'plugin',
    name: 'reg-only',
    capabilityTag: 'research-synth',
    root,
    actor,
  });
  const grants = await inspectRegistrationGrants({
    assetId: asset.id,
    root,
    actor,
  });
  check(
    'US-CP-registration-no-authority',
    asset.grantsAuthority === false &&
      asset.grantsCredentials === false &&
      asset.grantsBilling === false &&
      asset.grantsDeployment === false &&
      asset.grantsBroaderDataAccess === false &&
      grants.authority === false &&
      grants.credentials === false &&
      grants.billing === false &&
      grants.deployment === false &&
      grants.broaderDataAccess === false &&
      grants.reason === REGISTRATION_NO_AUTHORITY,
    grants.reason,
  );

  // Deny-by-default: missing scope DENIED
  const tp = await registerThirdPartyPlugin({
    name: 'connector-x',
    version: '1.0.0',
    scopes: ['read:metadata'],
    licensingTermsAccepted: true,
    sbomRef: 'sbom://x',
    secretRefs: ['vault://x'],
    configured: true,
    healthy: true,
    root,
    actor,
  });
  const missing = await checkPluginScope({
    pluginId: tp.id,
    requestedScope: 'admin:all',
    root,
    actor,
  });
  check(
    'US-CP-deny-by-default-missing-scope',
    missing.status === 'denied' && missing.reason === MISSING_SCOPE_DENIED,
    missing.reason,
  );

  // Unhealthy plugin → circuit open / UNAVAILABLE
  const fail = await recordPluginFailure({ pluginId: tp.id, root, actor });
  const invoke = await invokeGovernedPlugin({
    pluginId: tp.id,
    requestedScope: 'read:metadata',
    root,
    actor,
  });
  check(
    'US-CP-unhealthy-circuit-open',
    fail.circuitOpen === true &&
      fail.status === 'unavailable' &&
      fail.reason === UNHEALTHY_PLUGIN_CIRCUIT_OPEN &&
      (invoke.status === 'unavailable' || invoke.status === 'denied'),
    fail.reason,
  );

  // Agent cannot self-assign unpromoted plugin with elevated permissions
  const self = await assignPluginToAgent({
    pluginId: sandbox.id,
    agentId: 'agent-1',
    elevatedPermissions: true,
    selfAssign: true,
    root,
    actor,
  });
  check(
    'US-CP-agent-self-assign-unpromoted-denied',
    self.status === 'denied' && self.reason === AGENT_SELF_ASSIGN_DENIED,
    self.reason,
  );

  // Promotion with full gates succeeds; then bounded assign allowed
  const promoted = await attemptPromotePlugin({
    pluginId: sandbox.id,
    unitTestsPass: true,
    integrationTestsPass: true,
    securityTestsPass: true,
    benchmarksPass: true,
    humanReviewPass: true,
    root,
    actor,
  });
  const assignOk = await assignPluginToAgent({
    pluginId: sandbox.id,
    agentId: 'agent-2',
    elevatedPermissions: false,
    selfAssign: false,
    root,
    actor,
  });
  check(
    'US-CP-promotion-gates-then-assign',
    promoted.status === 'promoted' &&
      promoted.plugin?.promoted === true &&
      assignOk.status === 'allowed',
    promoted.reason,
  );

  // Unapproved refinery node composition DENIED
  const discovery = await attemptArbitraryRefineryDiscovery({
    target: 'scan://all-refineries',
    root,
    actor,
  });
  const unauthNode = await authorizeRefineryNode({
    regionCode: 'xx',
    label: 'shadow',
    authorized: false,
    root,
    actor,
  });
  const deniedCompose = await composeRefineryPipeline({
    nodeId: unauthNode.id,
    pluginIds: [approved.id],
    root,
    actor,
  });
  const authNode = await authorizeRefineryNode({
    regionCode: 'eu-west',
    label: 'EU',
    authorized: true,
    root,
    actor,
  });
  await markPluginApprovedForRefinery({ pluginId: approved.id, root, actor });
  const badPlugins = await composeRefineryPipeline({
    nodeId: authNode.id,
    pluginIds: ['not-approved'],
    root,
    actor,
  });
  const okCompose = await composeRefineryPipeline({
    nodeId: authNode.id,
    pluginIds: [approved.id],
    root,
    actor,
  });
  check(
    'US-CP-unapproved-refinery-denied',
    discovery.status === 'denied' &&
      discovery.reason === ARBITRARY_REFINERY_DISCOVERY_DENIED &&
      deniedCompose.status === 'denied' &&
      deniedCompose.reason === UNAPPROVED_REFINERY_DENIED &&
      badPlugins.status === 'denied' &&
      okCompose.status === 'composed',
    deniedCompose.reason,
  );

  // Institutional graph rejects sim→fact promotion
  const sim = await recordInstitutionalMemory({
    kind: 'simulation',
    institution: 'WHO-sim',
    statement: 'simulated outbreak',
    provenanceRef: 'sim://who/1',
    root,
    actor,
  });
  const simPromo = await attemptInstitutionalPromotion({
    nodeId: sim.id,
    toKind: 'fact',
    root,
    actor,
  });
  check(
    'US-CP-sim-to-fact-rejected',
    'rejected' in simPromo &&
      simPromo.rejected === true &&
      simPromo.reason === SIM_TO_FACT_REJECTED,
    'rejected' in simPromo ? simPromo.reason : 'allowed-unexpected',
  );

  // Unsigned/revoked distribution package rejected
  const unsigned = await createDistributionPackage({
    label: 'unsigned',
    kind: 'plugin',
    payload: 'x',
    signature: null,
    approved: true,
    root,
    actor,
  });
  const signed = await createDistributionPackage({
    label: 'signed',
    kind: 'knowledge',
    payload: 'y',
    signature: 'sig-y',
    approved: true,
    root,
    actor,
  });
  await revokeDistributionPackage({ packageId: signed.id, root, actor });
  const unsignedApply = await applyDistributionPackage({
    packageId: unsigned.id,
    root,
    actor,
  });
  const revokedApply = await applyDistributionPackage({
    packageId: signed.id,
    root,
    actor,
  });
  check(
    'US-CP-unsigned-revoked-rejected',
    unsigned.status === 'rejected' &&
      unsignedApply.status === 'rejected' &&
      revokedApply.status === 'rejected' &&
      unsignedApply.reason === UNSIGNED_OR_REVOKED_PACKAGE_REJECTED &&
      revokedApply.reason === UNSIGNED_OR_REVOKED_PACKAGE_REJECTED,
    revokedApply.reason,
  );

  // Sealed content cannot silent-route via plugin cloud gateway
  const sealed = await routeViaPluginCloudGateway({
    contentMode: 'sealed',
    silentCloudFallbackRequested: true,
    root,
    actor,
  });
  const localOnly = await routeViaPluginCloudGateway({
    contentMode: 'local_only',
    silentCloudFallbackRequested: true,
    root,
    actor,
  });
  check(
    'US-CP-sealed-no-silent-plugin-cloud',
    sealed.status === 'denied' &&
      sealed.reason === SEALED_SILENT_PLUGIN_CLOUD_DENIED &&
      localOnly.status === 'denied',
    sealed.reason,
  );

  const cycleRoot = await mkdtemp(join(tmpdir(), 'xiv-62lcp-cycle-'));
  try {
    const cycle = await runKnowledgeSupplyPluginFoundryCycle({
      orgId: actor.orgId,
      tenantId: actor.tenantId,
      universeId: actor.universeId,
      actor,
      root: cycleRoot,
    });
    check(
      'US-CP-cycle-runtime',
      cycle.ok === true &&
        cycle.hops.length === KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_CYCLE.length &&
        cycle.l4AutonomyEnabled === false &&
        cycle.nextPhase === NEXT_PHASE_TITLE,
      `hops=${cycle.hops.length} ok=${cycle.ok}`,
    );
  } finally {
    await rm(cycleRoot, { recursive: true, force: true });
  }

  const health = await buildKnowledgeSupplyPluginFoundryHealthReport({ root: repoRoot });
  check(
    'US-CP-health-report',
    health.phase === '62L-CP' &&
      health.githubSotIssue === 106 &&
      health.gitlabCoordinationIssue === 40 &&
      health.tipLand === false &&
      health.productionAuthorized === false &&
      health.documentedEqImplemented === false,
    health.honestyBanner,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CP-predecessors',
    preds.CL.tipProbe === 'PRESENT' &&
      (preds.CO.tipProbe === 'WAITING_DATA' || preds.CO.tipProbe === 'PRESENT') &&
      (preds.CN.tipProbe === 'WAITING_DATA' || preds.CN.tipProbe === 'PRESENT') &&
      (preds.CM.tipProbe === 'WAITING_DATA' || preds.CM.tipProbe === 'PRESENT'),
    `CO=${preds.CO.tipProbe} CN=${preds.CN.tipProbe} CM=${preds.CM.tipProbe} CL=${preds.CL.tipProbe}`,
  );

  check(
    'US-CP-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CQ —'),
    NEXT_PHASE_TITLE,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} stories:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK phase62lcp — all required stories passed');
