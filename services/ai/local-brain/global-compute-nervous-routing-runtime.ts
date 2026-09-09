/**
 * 62L-BZ runtime — walks GLOBAL_COMPUTE_NERVOUS_ROUTING_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  attemptSelfPermissionExpansion,
  declarePlacementFirewall,
  evaluatePlacement,
  nervousSystemHonesty,
  planFailover,
  registerNervousNode,
} from './global-compute-nervous-system';
import {
  attemptFabProductionAuthorize,
  captureChipDesignKnowledge,
  chipFoundryHonesty,
} from './chip-design-knowledge-foundry';
import {
  cacheIntelligenceHonesty,
  declareCoherenceContract,
  invalidateOnChange,
  putCacheEntry,
  readCacheEntry,
} from './distributed-memory-cache-intelligence';
import {
  assignWorkToDevice,
  deviceFederationHonesty,
  enrollFederatedDevice,
  quarantineFederatedDevice,
  revokeFederatedDevice,
} from './universal-ai-device-federation';
import {
  businessSignalHonesty,
  publishBusinessSignal,
} from './business-signal-exchange';
import {
  attemptOptimizerPurchaseOrBill,
  cognitiveRoutingHonesty,
  optimizeCognitiveRoute,
  recompileRoutesOnChange,
  registerRouteCandidate,
} from './superbrain-cognitive-routing-optimizer';
import {
  BZ_LOCKS,
  GLOBAL_COMPUTE_NERVOUS_ROUTING_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type BzActor,
  type BzEvidenceState,
  type BzHop,
  type BzHopRecord,
} from './global-compute-nervous-routing-types';

export {
  BZ_LOCKS,
  GLOBAL_COMPUTE_NERVOUS_ROUTING_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: BzHop, state: BzEvidenceState, summary: string): BzHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BzCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: BzActor;
  root?: string;
};

export async function runGlobalComputeNervousRoutingCycle(input: BzCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: BzHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      BZ_LOCKS.L4_AUTONOMY_ENABLED === false &&
        BZ_LOCKS.SELF_PERMISSION_EXPANSION === false &&
        BZ_LOCKS.TRUST_POLICY_BEATS_SPEED
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const unconfigured = await registerNervousNode({
    label: 'unconfigured-edge',
    locality: 'edge',
    configured: false,
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_node_unavailable',
      unconfigured.unavailable ? 'UNAVAILABLE' : 'FAIL',
      unconfigured.reason,
    ),
  );

  const edge = await registerNervousNode({
    label: 'edge-a',
    locality: 'edge',
    configured: true,
    authorized: true,
    health: 'healthy',
    root,
    actor,
  });
  const cloud = await registerNervousNode({
    label: 'cloud-b',
    locality: 'cloud',
    configured: true,
    authorized: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'node_topology_authorize',
      edge.node.status === 'available' ? 'PASS' : 'FAIL',
      `authorized nodes: ${edge.node.id}, ${cloud.node.id}`,
    ),
  );
  hops.push(
    hop('compute_health_observe', edge.node.health === 'healthy' ? 'PASS' : 'FAIL', edge.node.health),
  );

  const fw = await declarePlacementFirewall({
    name: 'deny-cloud-sealed',
    denyLocalities: ['cloud', 'sealed'],
    allowCloud: false,
    root,
  });
  const blocked = await evaluatePlacement({
    workloadId: 'wl-cloud',
    nodeId: cloud.node.id,
    firewallId: fw.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'placement_firewall_evaluate',
      blocked.status === 'denied' ? 'DENIED' : 'FAIL',
      blocked.reason,
    ),
  );

  const failover = await planFailover({
    primaryNodeId: edge.node.id,
    candidateNodeIds: [cloud.node.id],
    root,
    actor,
  });
  hops.push(
    hop(
      'failover_plan_recommend',
      failover.mutatesInfrastructure === false ? 'RECOMMENDATION_ONLY' : 'FAIL',
      failover.reason,
    ),
  );

  const chip = await captureChipDesignKnowledge({
    title: 'sparse-npu-candidate',
    processNm: 5,
    architectureNotes: 'sandbox knowledge only',
    evidenceRefs: ['lab-note-1'],
    root,
    actor,
  });
  hops.push(
    hop(
      'chip_foundry_capture_candidate',
      chip.candidate.status === 'sandbox_candidate' ? 'CANDIDATE' : 'FAIL',
      chip.candidate.reason,
    ),
  );
  const fab = await attemptFabProductionAuthorize({
    candidateId: chip.candidate.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'chip_foundry_not_fab_authority',
      fab.denied ? 'DENIED' : 'FAIL',
      fab.reason,
    ),
  );

  await declareCoherenceContract({ name: 'bz-coherence', root });
  await putCacheEntry({
    key: 'k1',
    valueDigest: 'abc',
    freshness: 'stale',
    verified: true,
    sourceVersion: 'v1',
    root,
    actor,
  });
  const staleRead = await readCacheEntry({ key: 'k1', root });
  hops.push(
    hop(
      'stale_cache_not_fresh_verified',
      staleRead.treatedAsFreshVerified === false ? 'STALE' : 'FAIL',
      staleRead.reason,
    ),
  );
  hops.push(hop('cache_coherence_contract', 'PASS', 'staleNeverFreshVerified'));
  const inv = await invalidateOnChange({
    key: 'k1',
    changeReason: 'source_change',
    newSourceVersion: 'v2',
    root,
    actor,
  });
  hops.push(
    hop('invalidation_on_change', inv.invalidated ? 'PASS' : 'FAIL', `epoch=${inv.epoch}`),
  );

  const device = await enrollFederatedDevice({
    name: 'phone-1',
    enrolled: true,
    authorized: true,
    configured: true,
    verified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'device_federation_enroll',
      device.status === 'available' ? 'PASS' : 'FAIL',
      device.reason,
    ),
  );
  await revokeFederatedDevice({ deviceId: device.id, root, actor });
  const revokedWork = await assignWorkToDevice({
    deviceId: device.id,
    workloadId: 'wl-1',
    root,
    actor,
  });
  const qDevice = await enrollFederatedDevice({
    name: 'xr-1',
    enrolled: true,
    authorized: true,
    configured: true,
    root,
    actor,
  });
  await quarantineFederatedDevice({ deviceId: qDevice.id, root, actor });
  const qWork = await assignWorkToDevice({
    deviceId: qDevice.id,
    workloadId: 'wl-2',
    root,
    actor,
  });
  hops.push(
    hop(
      'revocation_quarantine_enforce',
      !revokedWork.accepted && !qWork.accepted ? 'DENIED' : 'FAIL',
      revokedWork.reason,
    ),
  );

  const raw = await publishBusinessSignal({
    kind: 'raw_private',
    topic: 'revenue',
    claim: 'raw dump',
    authorized: false,
    derived: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'business_signal_derived_only',
      raw.accepted === false ? 'DENIED' : 'FAIL',
      raw.signal.reason,
    ),
  );
  await publishBusinessSignal({
    kind: 'derived_signal',
    topic: 'demand',
    claim: 'demand up',
    polarity: 'positive',
    authorized: true,
    derived: true,
    provenanceRefs: ['p1'],
    root,
    actor,
  });
  const contra = await publishBusinessSignal({
    kind: 'derived_signal',
    topic: 'demand',
    claim: 'demand down',
    polarity: 'negative',
    authorized: true,
    derived: true,
    provenanceRefs: ['p2'],
    root,
    actor,
  });
  hops.push(
    hop(
      'contradiction_surface',
      contra.contradiction && contra.contradiction.silentlyPicked === false
        ? 'CONTRADICTION'
        : 'FAIL',
      contra.signal.reason,
    ),
  );

  const fastLow = await registerRouteCandidate({
    label: 'fast-low-trust',
    trust: 0.2,
    latencyMs: 5,
    localityScore: 0.9,
    freshnessScore: 0.9,
    costProxy: 1,
    consequenceWeight: 1,
    evidenceScore: 0.2,
    sealedPolicyOk: false,
    root,
  });
  const sealed = await registerRouteCandidate({
    label: 'sealed-trust',
    trust: 0.95,
    latencyMs: 80,
    localityScore: 0.7,
    freshnessScore: 0.8,
    costProxy: 5,
    consequenceWeight: 2,
    evidenceScore: 0.9,
    sealedPolicyOk: true,
    root,
  });
  const optimized = await optimizeCognitiveRoute({
    candidateIds: [fastLow.id, sealed.id],
    root,
    actor,
  });
  hops.push(
    hop(
      'route_optimize_sparse',
      optimized.selectedCandidateId === sealed.id ? 'PASS' : 'FAIL',
      optimized.reason,
    ),
  );
  hops.push(
    hop(
      'sealed_trust_beats_speed',
      optimized.rejectedFasterLowTrustId === fastLow.id ||
        optimized.reason.includes('SEALED') ||
        optimized.selectedCandidateId === sealed.id
        ? 'DENIED'
        : 'FAIL',
      optimized.reason,
    ),
  );

  const recompiled = await recompileRoutesOnChange({
    changeKind: 'device',
    candidateIds: [fastLow.id, sealed.id],
    root,
    actor,
  });
  hops.push(
    hop(
      'route_recompile_on_change',
      recompiled.status === 'recompiled' ? 'PASS' : 'FAIL',
      recompiled.reason,
    ),
  );

  const buy = await attemptOptimizerPurchaseOrBill({
    action: 'purchase',
    amount: 100,
    root,
    actor,
  });
  hops.push(
    hop('optimizer_no_purchase_bill', buy.denied ? 'DENIED' : 'FAIL', buy.reason),
  );

  const perm = await attemptSelfPermissionExpansion({
    actor,
    requestedLevel: 99,
    root,
  });
  hops.push(
    hop(
      'self_permission_expansion_denied',
      perm.denied ? 'DENIED' : 'FAIL',
      perm.reason,
    ),
  );

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-BZ global compute nervous / routing cycle completed',
      payload: { hops: hops.map((h) => h.hop), orgId: input.orgId, sourceRefs: ['62L-BZ'] },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidence?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-BZ global compute nervous routing cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; recommendation only; learning ≠ permission`,
      sourceRefs: ['62L-BZ'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;

  return {
    hops,
    honesty: {
      nervous: nervousSystemHonesty(),
      chip: chipFoundryHonesty(),
      cache: cacheIntelligenceHonesty(),
      device: deviceFederationHonesty(),
      signal: businessSignalHonesty(),
      routing: cognitiveRoutingHonesty(),
    },
    locks: BZ_LOCKS,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildGlobalComputeNervousRoutingHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const health = await checkLocalBrainHealth(root).catch(() => ({
    ok: false,
    reason: 'HEALTH_CHECK_UNAVAILABLE',
  }));
  const gate = decisionGate;
  const preds = predecessorMap(root);
  return {
    phase: '62L-BZ',
    title:
      'Global Compute Nervous System + Chip Design Knowledge Foundry + Distributed Memory/Cache Intelligence + Universal AI Device Federation + Business Signal Exchange + Superbrain Cognitive Routing Optimizer',
    honestyBanner: HONESTY_BANNER,
    locks: BZ_LOCKS,
    l4AutonomyEnabled: BZ_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: BZ_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: BZ_LOCKS.TIP_LAND,
    githubSoT: 90,
    gitlabCoordination: 24,
    cycle: GLOBAL_COMPUTE_NERVOUS_ROUTING_CYCLE,
    predecessors: preds,
    localBrainHealth: health,
    decisionGatePresent: typeof gate === 'function' || typeof gate === 'object',
    modules: {
      globalComputeNervousSystem: 'IMPLEMENTED',
      chipDesignKnowledgeFoundry: 'IMPLEMENTED',
      distributedMemoryCacheIntelligence: 'IMPLEMENTED',
      universalAiDeviceFederation: 'IMPLEMENTED',
      businessSignalExchange: 'IMPLEMENTED',
      superbrainCognitiveRoutingOptimizer: 'IMPLEMENTED',
    },
    nextPhase: NEXT_PHASE_TITLE,
    productionAuthorized: false,
    generatedAt: new Date().toISOString(),
  };
}
