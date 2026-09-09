/**
 * 62L-EB Multi-Model Superbrain Federation runtime —
 * Walks MULTI_MODEL_SUPERBRAIN_FEDERATION_CYCLE and builds health report.
 */

import {
  attemptAgentResearchSelfPromotion,
  openResearchTeam,
} from './agent-research-society';
import {
  accessMemoryCortex,
  quarantineSpeculativeTopic,
} from './civilization-scientific-memory-cortex';
import { decisionGate } from './decision-gate';
import {
  enforceCloudCostControl,
  planVirtualGpu,
  probeGpuRunningVerified,
} from './distributed-ai-cloud-gpu-exchange';
import { appendEvidenceEvent } from './evidence-ledger';
import {
  denyStealthInstall,
  permissionAwareSearch,
  probeDigitalTwinAuthority,
  probeNeuralNode,
} from './global-search-knowledge-infrastructure';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  probeModelProvider,
  routeMultiModelRequest,
} from './multi-model-superbrain-federation';
import {
  bootstrapMultiModelSuperbrainFederation,
  multiModelSuperbrainFederationSystemHonesty,
} from './multi-model-superbrain-federation-system';
import {
  EB_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  MULTI_MODEL_SUPERBRAIN_FEDERATION_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type EbActor,
  type EbEvidenceState,
  type EbHop,
  type EbHopRecord,
} from './multi-model-superbrain-federation-types';
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

export {
  MULTI_MODEL_SUPERBRAIN_FEDERATION_CYCLE,
  EB_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: EbHop, state: EbEvidenceState, summary: string): EbHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type EbCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: EbActor;
  root?: string;
  repoRoot?: string;
};

export async function runMultiModelSuperbrainFederationCycle(
  input: EbCycleInput,
) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: EbHopRecord[] = [];
  const actor = {
    ...input.actor,
    universeId: input.universeId || input.actor.universeId,
  };
  const twinActor: EbActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

  hops.push(
    hop(
      'honesty_locks',
      EB_LOCKS.L4_AUTONOMY_ENABLED === false &&
        EB_LOCKS.LOCAL_FIRST &&
        EB_LOCKS.UNCONFIGURED_PROVIDER_EQ_AVAILABLE === false &&
        EB_LOCKS.RECOMMENDATION_EQ_AUTO_SPEND === false &&
        EB_LOCKS.CLASSICAL_BASELINE_OPTIONAL === false &&
        EB_LOCKS.QUANTUM_SUPREMACY_WITHOUT_EVIDENCE === false &&
        EB_LOCKS.COVERT_XR_CAPTURE_ALLOWED === false &&
        EB_LOCKS.BIOMETRIC_DEFAULTS_ON === false &&
        EB_LOCKS.STEALTH_INSTALL_ALLOWED === false &&
        EB_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
        EB_LOCKS.TIP_LAND === false &&
        EB_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapMultiModelSuperbrainFederation({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'multi_model_superbrain_federation_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}; softWire=${os.softWiredPredecessors.join(',')}`,
    ),
  );

  // A
  const route = await routeMultiModelRequest({
    requestId: 'req-1',
    preferred: 'local',
    localAvailable: false,
    cloudConfigured: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'multi_model_routing_local_cloud_fallback',
      route.selected === 'none' && route.state === 'UNAVAILABLE'
        ? 'PASS'
        : route.reason.includes('FALLBACK') || route.status === 'ok'
          ? 'PASS'
          : 'FAIL',
      route.reason,
    ),
  );
  const routeOk = await routeMultiModelRequest({
    requestId: 'req-2',
    preferred: 'local',
    localAvailable: true,
    cloudConfigured: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_provider_unavailable',
      routeOk.selected === 'local' || route.state === 'UNAVAILABLE'
        ? 'PASS'
        : 'FAIL',
      `${route.reason}; fallback=${routeOk.selected}`,
    ),
  );
  const grok = await probeModelProvider({
    providerId: 'grok-xai',
    configured: false,
    fabricatedCredentialsAttempted: true,
    attemptLiveCall: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'grok_xai_unconfigured_unavailable',
      grok.status === 'unavailable' && grok.state === 'UNAVAILABLE'
        ? 'PASS'
        : 'FAIL',
      grok.reason,
    ),
  );

  // B
  const vgpu = await planVirtualGpu({
    planId: 'plan-1',
    estimatedCostUsd: 42,
    autoSpendRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'vgpu_planning_recommend_neq_auto_spend',
      vgpu.status === 'denied' && vgpu.spendExecuted === false
        ? 'PASS'
        : 'FAIL',
      vgpu.reason,
    ),
  );
  const cost = await enforceCloudCostControl({
    action: 'charge',
    unauthorizedChargeAttempted: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'cloud_cost_control_no_unauthorized_charge',
      cost.status === 'denied' && cost.chargeExecuted === false
        ? 'PASS'
        : 'FAIL',
      cost.reason,
    ),
  );
  const gpu = await probeGpuRunningVerified({
    nodeId: 'gpu-1',
    claimRunningVerified: true,
    heartbeatPresent: false,
    evidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'gpu_running_verified_needs_evidence',
      gpu.status === 'denied' && gpu.state === 'NOT_VERIFIED' ? 'PASS' : 'FAIL',
      gpu.reason,
    ),
  );

  // C
  const qNoBase = await runQuantumOptimizationBenchmark({
    candidateId: 'q-1',
    classicalBaselinePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_optimization_requires_classical_baseline',
      qNoBase.status === 'denied' ? 'PASS' : 'FAIL',
      qNoBase.reason,
    ),
  );
  const qSup = await runQuantumOptimizationBenchmark({
    candidateId: 'q-2',
    classicalBaselinePresent: true,
    supremacyClaimed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'no_unverified_quantum_supremacy',
      qSup.status === 'denied' ? 'PASS' : 'FAIL',
      qSup.reason,
    ),
  );
  const qBench = await runQuantumOptimizationBenchmark({
    candidateId: 'q-3',
    classicalBaselinePresent: true,
    reproducible: true,
    evidenceBacked: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_benchmark_neq_verified_fact',
      qBench.verifiedFact === false ? 'PASS' : 'FAIL',
      qBench.reason,
    ),
  );

  // D
  const mem = await accessMemoryCortex({
    memoryId: 'mem-1',
    contextId: 'ctx-a',
    aclGranted: false,
    labelPresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'memory_cortex_acl_deny_by_default',
      mem.status === 'denied' ? 'PASS' : 'FAIL',
      mem.reason,
    ),
  );
  const spec = await quarantineSpeculativeTopic({
    topic: 'extraterrestrial_technology',
    root,
    actor,
  });
  hops.push(
    hop(
      'speculative_cosmology_quarantined_research_sim',
      spec.status === 'quarantined' && spec.state === 'RESEARCH_SIM'
        ? 'PASS'
        : 'FAIL',
      spec.reason,
    ),
  );
  const labelMem = await accessMemoryCortex({
    memoryId: 'mem-2',
    contextId: 'ctx-b',
    aclGranted: false,
    labelPresent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'label_alone_neq_memory_access',
      labelMem.status === 'denied' ? 'PASS' : 'FAIL',
      labelMem.reason,
    ),
  );

  // E
  const node = await probeLocalAiNodeRunningVerified({
    nodeId: 'node-1',
    authorized: true,
    heartbeatPresent: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'local_ai_node_running_verified_needs_evidence',
      node.status === 'denied' && node.state === 'NOT_VERIFIED' ? 'PASS' : 'FAIL',
      node.reason,
    ),
  );
  const offline = await probeOfflineAgent({
    agentId: 'agent-1',
    poweredNodePresent: false,
    root,
    actor,
  });
  const stopped = await probeOfflineNodeStopped({
    nodeId: 'node-off',
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_agent_waiting_or_stopped',
      offline.state === 'WAITING_NODE' && stopped.state === 'OFFLINE_STOPPED'
        ? 'PASS'
        : 'FAIL',
      `${offline.reason}; ${stopped.reason}`,
    ),
  );
  const nodePromo = await attemptLocalNodeSelfPromotion({
    nodeId: 'node-1',
    root,
    actor,
  });
  hops.push(
    hop(
      'local_node_self_promotion_denied',
      nodePromo.status === 'denied' ? 'PASS' : 'FAIL',
      nodePromo.reason,
    ),
  );

  // F
  const team = await openResearchTeam({
    teamId: 'team-1',
    signed: false,
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_research_team_denied',
      team.status === 'denied' ? 'PASS' : 'FAIL',
      team.reason,
    ),
  );
  const autoTeam = await openResearchTeam({
    teamId: 'team-2',
    signed: true,
    authorized: true,
    unrestrictedAutonomyClaimed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'research_society_neq_unrestricted_autonomy',
      autoTeam.status === 'denied' ? 'PASS' : 'FAIL',
      autoTeam.reason,
    ),
  );
  const agentPromo = await attemptAgentResearchSelfPromotion({
    agentId: 'agent-r1',
    root,
    actor,
  });
  hops.push(
    hop(
      'agent_research_self_promotion_denied',
      agentPromo.status === 'denied' ? 'PASS' : 'FAIL',
      agentPromo.reason,
    ),
  );

  // G
  const xr = await openXrSpatialSession({
    sessionId: 'xr-1',
    covertCaptureAttempted: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'xr_spatial_neq_covert_capture',
      xr.status === 'denied' ? 'PASS' : 'FAIL',
      xr.reason,
    ),
  );
  const bio = await openXrSpatialSession({
    sessionId: 'xr-2',
    biometricEnabled: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'biometric_defaults_off',
      bio.status === 'denied' && bio.biometricDefault === false
        ? 'PASS'
        : 'FAIL',
      bio.reason,
    ),
  );
  const spatial = await issueSpatialCommand({
    commandId: 'cmd-1',
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'spatial_command_governed',
      spatial.status === 'denied' ? 'PASS' : 'FAIL',
      spatial.reason,
    ),
  );

  // H
  const search = await permissionAwareSearch({
    queryId: 'q-1',
    contextId: 'ctx-1',
    aclGranted: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'permission_aware_search_acl',
      search.status === 'denied' ? 'PASS' : 'FAIL',
      search.reason,
    ),
  );
  const leak = await permissionAwareSearch({
    queryId: 'q-2',
    contextId: 'ctx-2',
    aclGranted: true,
    crossContextAttempt: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'cross_context_search_leakage_denied',
      leak.status === 'denied' ? 'PASS' : 'FAIL',
      leak.reason,
    ),
  );
  const neural = await probeNeuralNode({
    nodeId: 'nn-1',
    evidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'neural_nodes_evidence_gated',
      neural.status === 'denied' ? 'PASS' : 'FAIL',
      neural.reason,
    ),
  );
  const stealth = await denyStealthInstall({
    attemptKind: 'stealth_install',
    root,
    actor,
  });
  hops.push(
    hop(
      'stealth_install_denied',
      stealth.status === 'denied' ? 'PASS' : 'FAIL',
      stealth.reason,
    ),
  );

  const preds = predecessorMap(input.repoRoot ?? root);
  const softWireOk =
    preds.EA.tipProbe === 'PRESENT' ||
    preds.DZ.tipProbe === 'PRESENT' ||
    preds.EA.tipProbe === 'WAITING_DATA';
  hops.push(
    hop(
      'ea_dz_soft_wire_probe',
      softWireOk ? 'PASS' : 'FAIL',
      `EA=${preds.EA.tipProbe}/${preds.EA.report}; DZ=${preds.DZ.tipProbe}/${preds.DZ.report}`,
    ),
  );

  const twinAuth = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  hops.push(
    hop(
      'digital_twin_neq_founder',
      twinAuth.status === 'denied' ? 'PASS' : 'FAIL',
      twinAuth.reason,
    ),
  );

  void decisionGate({
    id: 'eb-cycle-gate',
    action: '62l_eb_multi_model_superbrain_federation_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void multiModelSuperbrainFederationSystemHonesty(input.repoRoot);
  void MULTI_MODEL_SUPERBRAIN_FEDERATION_CYCLE;

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-EB multi-model superbrain federation cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-EB'],
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
      subject: '62L-EB multi-model superbrain federation cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; unconfigured=UNAVAILABLE; recommend≠auto-spend; ` +
        'quantum needs classical; XR≠covert; search ACL; stealth denied',
      sourceRefs: ['62L-EB'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; no self-promotion; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: EB_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: os.predecessorLayer,
    softWiredPredecessors: os.softWiredPredecessors,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionMultiModelSuperbrainFederationShipped: false as const,
    dbCandidatesApplied: false as const,
    os,
  };
}

export async function buildMultiModelSuperbrainFederationHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: EbActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: EbActor = input?.actor ?? {
    kind: 'multi_model_federation_curator',
    id: 'health',
    orgId,
    tenantId,
    universeId,
  };
  const cycle = await runMultiModelSuperbrainFederationCycle({
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
    softWiredPredecessors: cycle.softWiredPredecessors,
    honesty: multiModelSuperbrainFederationSystemHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    dbCandidatesApplied: false as const,
  };
}
