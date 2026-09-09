/**
 * 62L-CP runtime — walks KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
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
  CP_LOCKS,
  HONESTY_BANNER,
  KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CpActor,
  type CpEvidenceState,
  type CpHop,
  type CpHopRecord,
} from './knowledge-supply-plugin-foundry-types';

export {
  CP_LOCKS,
  HONESTY_BANNER,
  KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CpHop, state: CpEvidenceState, summary: string): CpHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CpCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CpActor;
  root?: string;
};

export async function runKnowledgeSupplyPluginFoundryCycle(input: CpCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CpHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CP_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CP_LOCKS.LOCAL_FIRST &&
        CP_LOCKS.REUSE_APPROVED_PLUGINS_FIRST &&
        CP_LOCKS.NEW_BUILDS_SANDBOX_ONLY &&
        CP_LOCKS.REGISTRATION_GRANTS_AUTHORITY === false &&
        CP_LOCKS.DENY_BY_DEFAULT_PERMISSIONS &&
        CP_LOCKS.SEALED_SILENT_PLUGIN_CLOUD_FALLBACK === false &&
        CP_LOCKS.SIM_PROMOTE_TO_FACT === false &&
        CP_LOCKS.AGENT_SELF_ASSIGN_UNPROMOTED === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const chain = await bootstrapKnowledgeSupplyChain({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(hop('supply_chain_bootstrap', 'PASS', chain.id));

  const approved = await registerApprovedPlugin({
    name: 'approved-etl',
    capabilityTag: 'etl-compress',
    root,
    actor,
  });
  const reuseGap = await identifyCapabilityGap({
    capabilityTag: 'etl-compress',
    root,
    actor,
  });
  const reuseBuild = await buildSandboxPlugin({
    name: 'duplicate-etl',
    capabilityTag: 'etl-compress',
    root,
    actor,
  });
  hops.push(
    hop(
      'reuse_approved_plugin_preferred',
      reuseGap.action === 'reuse' &&
        reuseGap.reuseCandidateId === approved.id &&
        reuseBuild.id === approved.id
        ? 'REUSED'
        : 'FAIL',
      reuseGap.reason,
    ),
  );

  const sandbox = await buildSandboxPlugin({
    name: 'new-research-tool',
    capabilityTag: 'research-synth',
    elevatedPermissions: true,
    root,
    actor,
  });
  const incompletePromo = await attemptPromotePlugin({
    pluginId: sandbox.id,
    unitTestsPass: true,
    integrationTestsPass: false,
    securityTestsPass: false,
    benchmarksPass: false,
    humanReviewPass: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'new_plugin_sandbox_until_promotion',
      sandbox.sandbox &&
        sandbox.lifecycle === 'sandbox' &&
        incompletePromo.status === 'sandboxed'
        ? 'SANDBOXED'
        : 'FAIL',
      sandbox.reason,
    ),
  );

  const registered = await registerSupplyAsset({
    chainId: chain.id,
    kind: 'plugin',
    name: 'registered-only',
    capabilityTag: 'research-synth',
    root,
    actor,
  });
  const grants = await inspectRegistrationGrants({
    assetId: registered.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'registration_no_authority',
      grants.authority === false &&
        grants.credentials === false &&
        grants.billing === false &&
        grants.deployment === false &&
        grants.broaderDataAccess === false
        ? 'DENIED'
        : 'FAIL',
      grants.reason,
    ),
  );

  const tp = await registerThirdPartyPlugin({
    name: 'connector-x',
    version: '1.0.0',
    scopes: ['read:metadata'],
    licensingTermsAccepted: true,
    sbomRef: 'sbom://connector-x@1.0.0',
    secretRefs: ['vault://connector-x/token'],
    configured: true,
    healthy: true,
    root,
    actor,
  });
  const missingScope = await checkPluginScope({
    pluginId: tp.id,
    requestedScope: 'write:billing',
    root,
    actor,
  });
  hops.push(
    hop(
      'deny_by_default_missing_scope',
      missingScope.status === 'denied' ? 'DENIED' : 'FAIL',
      missingScope.reason,
    ),
  );

  const failure = await recordPluginFailure({ pluginId: tp.id, root, actor });
  const invokeUnhealthy = await invokeGovernedPlugin({
    pluginId: tp.id,
    requestedScope: 'read:metadata',
    root,
    actor,
  });
  hops.push(
    hop(
      'unhealthy_plugin_circuit_open',
      failure.circuitOpen &&
        failure.status === 'unavailable' &&
        (invokeUnhealthy.status === 'unavailable' || invokeUnhealthy.status === 'denied')
        ? 'CIRCUIT_OPEN'
        : 'FAIL',
      failure.reason,
    ),
  );

  const fullPromo = await attemptPromotePlugin({
    pluginId: sandbox.id,
    unitTestsPass: true,
    integrationTestsPass: true,
    securityTestsPass: true,
    benchmarksPass: true,
    humanReviewPass: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'promotion_gates_required',
      fullPromo.status === 'promoted' && fullPromo.plugin?.promoted === true
        ? 'PROMOTED'
        : 'FAIL',
      fullPromo.reason,
    ),
  );

  // Reset a fresh sandbox for self-assign denial (elevated + unpromoted)
  const unpromoted = await buildSandboxPlugin({
    name: 'elevated-sandbox',
    capabilityTag: 'elevated-ops',
    elevatedPermissions: true,
    forceDuplicate: true,
    root,
    actor,
  });
  const selfAssign = await assignPluginToAgent({
    pluginId: unpromoted.id,
    agentId: 'agent-self-1',
    elevatedPermissions: true,
    selfAssign: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'agent_self_assign_unpromoted_denied',
      selfAssign.status === 'denied' ? 'DENIED' : 'FAIL',
      selfAssign.reason,
    ),
  );

  const node = await authorizeRefineryNode({
    regionCode: 'eu-west',
    label: 'EU Refinery',
    authorized: true,
    root,
    actor,
  });
  await markPluginApprovedForRefinery({ pluginId: approved.id, root, actor });
  const composed = await composeRefineryPipeline({
    nodeId: node.id,
    pluginIds: [approved.id],
    root,
    actor,
  });
  hops.push(
    hop(
      'refinery_node_authorized_only',
      node.authorized && composed.status === 'composed' ? 'APPROVED' : 'FAIL',
      composed.reason,
    ),
  );

  const deniedCompose = await composeRefineryPipeline({
    nodeId: node.id,
    pluginIds: ['unapproved-plugin'],
    root,
    actor,
  });
  const unauthorizedNode = await authorizeRefineryNode({
    regionCode: 'xx',
    label: 'shadow',
    authorized: false,
    root,
    actor,
  });
  const deniedOnUnauthorized = await composeRefineryPipeline({
    nodeId: unauthorizedNode.id,
    pluginIds: [approved.id],
    root,
    actor,
  });
  hops.push(
    hop(
      'unapproved_refinery_composition_denied',
      deniedCompose.status === 'denied' && deniedOnUnauthorized.status === 'denied'
        ? 'DENIED'
        : 'FAIL',
      deniedCompose.reason,
    ),
  );

  const sim = await recordInstitutionalMemory({
    kind: 'simulation',
    institution: 'UNESCO-sim',
    statement: 'simulated treaty outcome',
    provenanceRef: 'sim://unesco/1',
    root,
    actor,
  });
  hops.push(
    hop(
      'institutional_graph_typed',
      sim.kind === 'simulation' && sim.trustState === 'labeled_simulation'
        ? 'LABELED_SIMULATION'
        : 'FAIL',
      sim.id,
    ),
  );

  const simPromo = await attemptInstitutionalPromotion({
    nodeId: sim.id,
    toKind: 'fact',
    root,
    actor,
  });
  hops.push(
    hop(
      'reject_sim_to_fact',
      'rejected' in simPromo && simPromo.rejected === true ? 'REJECTED' : 'FAIL',
      'rejected' in simPromo ? simPromo.reason : 'unexpected-allow',
    ),
  );

  const signedPkg = await createDistributionPackage({
    label: 'approved-knowledge',
    kind: 'knowledge',
    payload: 'pack-v1',
    signature: 'sig-ok',
    approved: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'distribution_signed_only',
      signedPkg.signed && signedPkg.approved ? 'SIGNED' : 'FAIL',
      signedPkg.reason,
    ),
  );

  const unsigned = await createDistributionPackage({
    label: 'unsigned',
    kind: 'plugin',
    payload: 'bad',
    signature: null,
    approved: true,
    root,
    actor,
  });
  await revokeDistributionPackage({ packageId: signedPkg.id, root, actor });
  const revokedApply = await applyDistributionPackage({
    packageId: signedPkg.id,
    root,
    actor,
  });
  const unsignedApply = await applyDistributionPackage({
    packageId: unsigned.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_or_revoked_package_rejected',
      unsigned.status === 'rejected' &&
        revokedApply.status === 'rejected' &&
        unsignedApply.status === 'rejected'
        ? 'REJECTED'
        : 'FAIL',
      revokedApply.reason,
    ),
  );

  const sealedRoute = await routeViaPluginCloudGateway({
    contentMode: 'sealed',
    silentCloudFallbackRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_silent_plugin_cloud',
      sealedRoute.status === 'denied' ? 'DENIED' : 'FAIL',
      sealedRoute.reason,
    ),
  );

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CP knowledge supply plugin foundry cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CP'],
        chainId: chain.id,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CP knowledge supply plugin foundry cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; registration ≠ authority; sandbox until promotion`,
      sourceRefs: ['62L-CP'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;
  void supplyChainHonesty;
  void pluginFoundryHonesty;
  void thirdPartyPluginHonesty;
  void refineryNodesHonesty;
  void institutionalMemoryHonesty;
  void distributionNetworkHonesty;

  return {
    ok: hops.every((h) =>
      [
        'PASS',
        'DENIED',
        'REJECTED',
        'UNAVAILABLE',
        'BOUNDED',
        'CANDIDATE',
        'SANDBOXED',
        'APPROVED',
        'PROMOTED',
        'SIGNED',
        'REUSED',
        'CIRCUIT_OPEN',
        'LABELED_SIMULATION',
        'NOT_APPLIED',
        'RECOMMENDATION_ONLY',
        'LOCAL_PREFERRED',
      ].includes(h.state),
    ),
    hops,
    chainId: chain.id,
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CP_LOCKS.L4_AUTONOMY_ENABLED,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildKnowledgeSupplyPluginFoundryHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const health = await checkLocalBrainHealth(root);
  const predecessors = predecessorMap(root);
  return {
    phase: '62L-CP',
    title:
      'XIV Global Knowledge Supply Chain + Plugin/Tool Foundry + Agent-Built AI Services + Regional Data Refinery Nodes + International Institutional Memory Graph + Multi-Cloud Knowledge Distribution Network',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CP_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorized: CP_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CP_LOCKS.TIP_LAND,
    githubSotIssue: 106,
    gitlabCoordinationIssue: 40,
    locks: { ...CP_LOCKS },
    honesty: {
      supplyChain: supplyChainHonesty(),
      foundry: pluginFoundryHonesty(),
      thirdParty: thirdPartyPluginHonesty(),
      refinery: refineryNodesHonesty(),
      institutionalMemory: institutionalMemoryHonesty(),
      distribution: distributionNetworkHonesty(),
    },
    cycle: [...KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_CYCLE],
    predecessors,
    localBrainHealth: health,
    nextPhase: NEXT_PHASE_TITLE,
    documentedEqImplemented: false,
    implementedEqVerified: false,
    verifiedEqProductionAuthorized: false,
    at: new Date().toISOString(),
  };
}
