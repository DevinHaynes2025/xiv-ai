import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptAgentResearchSelfPromotion,
  openResearchTeam,
} from './agent-research-society';
import {
  accessMemoryCortex,
  quarantineSpeculativeTopic,
} from './civilization-scientific-memory-cortex';
import {
  enforceCloudCostControl,
  planVirtualGpu,
  probeGpuRunningVerified,
} from './distributed-ai-cloud-gpu-exchange';
import {
  denyStealthInstall,
  permissionAwareSearch,
  probeDigitalTwinAuthority,
  probeNeuralNode,
} from './global-search-knowledge-infrastructure';
import {
  probeModelProvider,
  routeMultiModelRequest,
} from './multi-model-superbrain-federation';
import {
  bootstrapMultiModelSuperbrainFederation,
  multiModelSuperbrainFederationSystemHonesty,
} from './multi-model-superbrain-federation-system';
import {
  AGENT_RESEARCH_SELF_PROMOTION_DENIED,
  BIOMETRIC_DEFAULTS_OFF,
  CLOUD_COST_NO_UNAUTHORIZED_CHARGE,
  EB_LOCKS,
  GPU_EVIDENCE_REQUIRED,
  GROK_XAI_UNCONFIGURED_UNAVAILABLE,
  HONESTY_BANNER,
  LABEL_NEQ_MEMORY_ACCESS,
  LEARNING_LOOP_RULES,
  LOCAL_CLOUD_FALLBACK_ROUTED,
  LOCAL_NODE_EVIDENCE_REQUIRED,
  LOCAL_NODE_SELF_PROMOTION_DENIED,
  MEMORY_CORTEX_ACL_DENIED,
  MULTI_MODEL_SUPERBRAIN_FEDERATION_CYCLE,
  NEURAL_NODES_EVIDENCE_GATED,
  NEXT_PHASE_TITLE,
  NO_UNVERIFIED_SUPREMACY,
  OFFLINE_WAITING_OR_STOPPED,
  PRODUCT_PHILOSOPHY,
  QUANTUM_BENCHMARK_NEQ_FACT,
  QUANTUM_NEEDS_CLASSICAL,
  RESEARCH_NEQ_AUTONOMY,
  SEARCH_ACL_DENIED,
  SEARCH_CROSS_CONTEXT_DENIED,
  SPATIAL_COMMAND_GOVERNED,
  SPECULATIVE_QUARANTINED,
  STEALTH_INSTALL_DENIED,
  TWIN_NEQ_FOUNDER,
  UNAUTHORIZED_RESEARCH_TEAM,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  VGPU_RECOMMEND_NEQ_AUTO_SPEND,
  XR_NEQ_COVERT_CAPTURE,
  predecessorMap,
  type EbActor,
} from './multi-model-superbrain-federation-types';
import {
  buildMultiModelSuperbrainFederationHealthReport,
  runMultiModelSuperbrainFederationCycle,
} from './multi-model-superbrain-federation-runtime';
import { runQuantumOptimizationBenchmark } from './quantum-optimization-highway';
import {
  issueSpatialCommand,
  openXrSpatialSession,
} from './spatial-xr-command-universe';
import {
  attemptLocalNodeSelfPromotion,
  probeLocalAiNodeRunningVerified,
  probeOfflineAgent,
  probeOfflineNodeStopped,
} from './universal-local-ai-node-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62leb-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: EbActor = {
  kind: 'multi_model_federation_curator',
  id: 'test-curator',
  orgId: 'org-eb',
  tenantId: 'tenant-eb',
  universeId: 'universe-eb',
};
const twinActor: EbActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      EB_LOCKS.L4_AUTONOMY_ENABLED === false &&
      EB_LOCKS.TIP_LAND === false &&
      EB_LOCKS.UNCONFIGURED_PROVIDER_EQ_AVAILABLE === false &&
      EB_LOCKS.RECOMMENDATION_EQ_AUTO_SPEND === false &&
      EB_LOCKS.CLASSICAL_BASELINE_OPTIONAL === false &&
      EB_LOCKS.QUANTUM_SUPREMACY_WITHOUT_EVIDENCE === false &&
      EB_LOCKS.COVERT_XR_CAPTURE_ALLOWED === false &&
      EB_LOCKS.BIOMETRIC_DEFAULTS_ON === false &&
      EB_LOCKS.STEALTH_INSTALL_ALLOWED === false &&
      EB_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
      EB_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
      PRODUCT_PHILOSOPHY.unconfiguredProvidersUnavailable === true &&
      LEARNING_LOOP_RULES.noSelfPromotionToProduction === true &&
      MULTI_MODEL_SUPERBRAIN_FEDERATION_CYCLE.includes(
        'unconfigured_provider_unavailable',
      ) &&
      NEXT_PHASE_TITLE.includes('62L-EC'),
    'locks + philosophy + cycle + next EC present',
  );

  const os = await bootstrapMultiModelSuperbrainFederation({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_multi_model_superbrain_federation',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.publicLaunchAuthorized === false &&
      (os.predecessorLayer === 'EA' || os.predecessorLayer === 'DZ') &&
      (os.softWiredPredecessors.includes('EA') ||
        os.softWiredPredecessors.includes('DZ')),
    `os=${os.id}; predecessor=${os.predecessorLayer}; soft=${os.softWiredPredecessors.join(',')}`,
  );

  // A — multi-model routing
  const localRoute = await routeMultiModelRequest({
    requestId: 'req-local',
    preferred: 'local',
    localAvailable: true,
    cloudConfigured: false,
    root,
    actor,
  });
  check(
    'multi_model_routing_local_cloud_fallback',
    localRoute.selected === 'local' &&
      localRoute.reason === LOCAL_CLOUD_FALLBACK_ROUTED,
    localRoute.reason,
  );
  const unavail = await routeMultiModelRequest({
    requestId: 'req-none',
    preferred: 'cloud',
    localAvailable: false,
    cloudConfigured: false,
    root,
    actor,
  });
  check(
    'unconfigured_provider_unavailable',
    unavail.status === 'unavailable' &&
      unavail.state === 'UNAVAILABLE' &&
      unavail.reason === UNCONFIGURED_PROVIDER_UNAVAILABLE,
    unavail.reason,
  );
  const grok = await probeModelProvider({
    providerId: 'grok-xai',
    configured: false,
    fabricatedCredentialsAttempted: true,
    attemptLiveCall: true,
    root,
    actor,
  });
  check(
    'grok_xai_unconfigured_unavailable',
    grok.status === 'unavailable' &&
      grok.reason === GROK_XAI_UNCONFIGURED_UNAVAILABLE,
    grok.reason,
  );

  // B — GPU exchange / cost
  const vgpu = await planVirtualGpu({
    planId: 'plan-auto',
    estimatedCostUsd: 99,
    autoSpendRequested: true,
    root,
    actor,
  });
  check(
    'vgpu_planning_recommend_neq_auto_spend',
    vgpu.status === 'denied' &&
      vgpu.spendExecuted === false &&
      vgpu.reason === VGPU_RECOMMEND_NEQ_AUTO_SPEND,
    vgpu.reason,
  );
  const cost = await enforceCloudCostControl({
    action: 'charge',
    unauthorizedChargeAttempted: true,
    root,
    actor,
  });
  check(
    'cloud_cost_control_no_unauthorized_charge',
    cost.status === 'denied' &&
      cost.chargeExecuted === false &&
      cost.reason === CLOUD_COST_NO_UNAUTHORIZED_CHARGE,
    cost.reason,
  );
  const gpu = await probeGpuRunningVerified({
    nodeId: 'gpu-1',
    claimRunningVerified: true,
    heartbeatPresent: false,
    evidencePresent: false,
    root,
    actor,
  });
  check(
    'gpu_running_verified_needs_evidence',
    gpu.status === 'denied' && gpu.reason === GPU_EVIDENCE_REQUIRED,
    gpu.reason,
  );

  // C — quantum highway
  const qBase = await runQuantumOptimizationBenchmark({
    candidateId: 'q-nobase',
    classicalBaselinePresent: false,
    root,
    actor,
  });
  check(
    'quantum_optimization_requires_classical_baseline',
    qBase.status === 'denied' && qBase.reason === QUANTUM_NEEDS_CLASSICAL,
    qBase.reason,
  );
  const qSup = await runQuantumOptimizationBenchmark({
    candidateId: 'q-sup',
    classicalBaselinePresent: true,
    supremacyClaimed: true,
    root,
    actor,
  });
  check(
    'no_unverified_quantum_supremacy',
    qSup.status === 'denied' && qSup.reason === NO_UNVERIFIED_SUPREMACY,
    qSup.reason,
  );
  const qBench = await runQuantumOptimizationBenchmark({
    candidateId: 'q-ok',
    classicalBaselinePresent: true,
    reproducible: true,
    evidenceBacked: true,
    root,
    actor,
  });
  check(
    'quantum_benchmark_neq_verified_fact',
    qBench.verifiedFact === false &&
      qBench.reason === QUANTUM_BENCHMARK_NEQ_FACT,
    qBench.reason,
  );

  // D — memory cortex
  const mem = await accessMemoryCortex({
    memoryId: 'mem-1',
    contextId: 'ctx-a',
    aclGranted: false,
    root,
    actor,
  });
  check(
    'memory_cortex_acl_deny_by_default',
    mem.status === 'denied' && mem.reason === MEMORY_CORTEX_ACL_DENIED,
    mem.reason,
  );
  const label = await accessMemoryCortex({
    memoryId: 'mem-2',
    contextId: 'ctx-b',
    aclGranted: false,
    labelPresent: true,
    root,
    actor,
  });
  check(
    'label_alone_neq_memory_access',
    label.status === 'denied' && label.reason === LABEL_NEQ_MEMORY_ACCESS,
    label.reason,
  );
  const spec = await quarantineSpeculativeTopic({
    topic: 'extraterrestrial_technology',
    root,
    actor,
  });
  check(
    'speculative_cosmology_quarantined_research_sim',
    spec.status === 'quarantined' &&
      spec.state === 'RESEARCH_SIM' &&
      spec.reason === SPECULATIVE_QUARANTINED,
    spec.reason,
  );

  // E — local AI nodes
  const node = await probeLocalAiNodeRunningVerified({
    nodeId: 'node-1',
    authorized: true,
    heartbeatPresent: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  check(
    'local_ai_node_running_verified_needs_evidence',
    node.status === 'denied' && node.reason === LOCAL_NODE_EVIDENCE_REQUIRED,
    node.reason,
  );
  const offline = await probeOfflineAgent({
    agentId: 'agent-off',
    poweredNodePresent: false,
    root,
    actor,
  });
  const stopped = await probeOfflineNodeStopped({
    nodeId: 'node-off',
    root,
    actor,
  });
  check(
    'offline_agent_waiting_or_stopped',
    offline.state === 'WAITING_NODE' &&
      stopped.state === 'OFFLINE_STOPPED' &&
      offline.reason === OFFLINE_WAITING_OR_STOPPED,
    `${offline.reason}; ${stopped.reason}`,
  );
  const nodePromo = await attemptLocalNodeSelfPromotion({
    nodeId: 'node-1',
    root,
    actor,
  });
  check(
    'local_node_self_promotion_denied',
    nodePromo.status === 'denied' &&
      nodePromo.reason === LOCAL_NODE_SELF_PROMOTION_DENIED,
    nodePromo.reason,
  );

  // F — research society
  const team = await openResearchTeam({
    teamId: 'team-1',
    signed: false,
    authorized: false,
    root,
    actor,
  });
  check(
    'unauthorized_research_team_denied',
    team.status === 'denied' && team.reason === UNAUTHORIZED_RESEARCH_TEAM,
    team.reason,
  );
  const auto = await openResearchTeam({
    teamId: 'team-2',
    signed: true,
    authorized: true,
    unrestrictedAutonomyClaimed: true,
    root,
    actor,
  });
  check(
    'research_society_neq_unrestricted_autonomy',
    auto.status === 'denied' && auto.reason === RESEARCH_NEQ_AUTONOMY,
    auto.reason,
  );
  const agentPromo = await attemptAgentResearchSelfPromotion({
    agentId: 'agent-r1',
    root,
    actor,
  });
  check(
    'agent_research_self_promotion_denied',
    agentPromo.status === 'denied' &&
      agentPromo.reason === AGENT_RESEARCH_SELF_PROMOTION_DENIED,
    agentPromo.reason,
  );

  // G — XR/spatial
  const xr = await openXrSpatialSession({
    sessionId: 'xr-1',
    covertCaptureAttempted: true,
    root,
    actor,
  });
  check(
    'xr_spatial_neq_covert_capture',
    xr.status === 'denied' && xr.reason === XR_NEQ_COVERT_CAPTURE,
    xr.reason,
  );
  const bio = await openXrSpatialSession({
    sessionId: 'xr-2',
    biometricEnabled: true,
    root,
    actor,
  });
  check(
    'biometric_defaults_off',
    bio.status === 'denied' &&
      bio.biometricDefault === false &&
      bio.reason === BIOMETRIC_DEFAULTS_OFF,
    bio.reason,
  );
  const spatial = await issueSpatialCommand({
    commandId: 'cmd-1',
    authorized: false,
    root,
    actor,
  });
  check(
    'spatial_command_governed',
    spatial.status === 'denied' && spatial.reason === SPATIAL_COMMAND_GOVERNED,
    spatial.reason,
  );

  // H — global search + soft-wire + anti-malware
  const search = await permissionAwareSearch({
    queryId: 'q-1',
    contextId: 'ctx-1',
    aclGranted: false,
    root,
    actor,
  });
  check(
    'permission_aware_search_acl',
    search.status === 'denied' && search.reason === SEARCH_ACL_DENIED,
    search.reason,
  );
  const leak = await permissionAwareSearch({
    queryId: 'q-2',
    contextId: 'ctx-2',
    aclGranted: true,
    crossContextAttempt: true,
    root,
    actor,
  });
  check(
    'cross_context_search_leakage_denied',
    leak.status === 'denied' && leak.reason === SEARCH_CROSS_CONTEXT_DENIED,
    leak.reason,
  );
  const neural = await probeNeuralNode({
    nodeId: 'nn-1',
    evidencePresent: false,
    root,
    actor,
  });
  check(
    'neural_nodes_evidence_gated',
    neural.status === 'denied' && neural.reason === NEURAL_NODES_EVIDENCE_GATED,
    neural.reason,
  );
  const stealth = await denyStealthInstall({
    attemptKind: 'stealth_install',
    root,
    actor,
  });
  check(
    'stealth_install_denied',
    stealth.status === 'denied' && stealth.reason === STEALTH_INSTALL_DENIED,
    stealth.reason,
  );
  const twin = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  check(
    'digital_twin_neq_founder',
    twin.status === 'denied' && twin.reason === TWIN_NEQ_FOUNDER,
    twin.reason,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'ea_dz_soft_wire_probe',
    preds.EA.tipProbe === 'PRESENT' || preds.DZ.tipProbe === 'PRESENT',
    `EA=${preds.EA.tipProbe}/${preds.EA.report}; DZ=${preds.DZ.tipProbe}/${preds.DZ.report}`,
  );

  const honesty = multiModelSuperbrainFederationSystemHonesty(repoRoot);
  check(
    'system_honesty_report',
    honesty.l4AutonomyEnabled === false &&
      honesty.dbCandidatesApplied === false &&
      honesty.tipLand === false &&
      honesty.nextPhaseTitle.includes('62L-EC'),
    `pred=${honesty.predecessorLayer}; soft=${honesty.softWiredPredecessors.join(',')}`,
  );

  const cycle = await runMultiModelSuperbrainFederationCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle_all_hops',
    failedHops.length === 0 &&
      cycle.productionAuthorized === false &&
      cycle.tipLand === false &&
      cycle.dbCandidatesApplied === false &&
      cycle.githubSotIssue === 146 &&
      cycle.gitlabCoordinationIssue === 80,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildMultiModelSuperbrainFederationHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report',
    health.status === 'HEALTHY' &&
      health.productionAuthorized === false &&
      health.dbCandidatesApplied === false,
    `status=${health.status}; hops=${health.hopCount}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} stories:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('PASS npm run test:62leb — all denial/honesty stories');
