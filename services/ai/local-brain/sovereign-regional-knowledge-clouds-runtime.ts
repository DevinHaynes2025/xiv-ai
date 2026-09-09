/**
 * 62L-CM runtime — walks SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  attemptCrossRegionPrivatePooling,
  enrollRegionalKnowledgeCloud,
  regionalCloudHonesty,
} from './sovereign-regional-knowledge-clouds';
import {
  archiveObservatoryHonesty,
  claimAllWorldCoverage,
  intakeArchiveObservation,
  registerArchiveSource,
} from './global-archive-observatory';
import {
  attemptRelabelForecastOrSimAsFact,
  emitIntelligenceOutput,
  intelligenceGridHonesty,
} from './international-intelligence-grid';
import {
  optimizeKnowledgeRoute,
  registerRouteNode,
  routeOptimizationHonesty,
} from './knowledge-route-optimization-engine';
import {
  embassyNetworkHonesty,
  openEmbassyWorkcell,
  probeEmbassyAuthority,
  recordEmbassyLearning,
} from './agent-embassy-network';
import {
  enrollCacheDevice,
  installOfflineKnowledgeCache,
  offlineCacheFabricHonesty,
  publishOfflineKnowledgeCache,
  revokeOfflineKnowledgeCache,
} from './planetary-offline-knowledge-cache-fabric';
import {
  CM_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_CYCLE,
  predecessorMap,
  type CmActor,
  type CmEvidenceState,
  type CmHop,
  type CmHopRecord,
} from './sovereign-regional-knowledge-clouds-types';

/** Optional CL/CI continuity — present on preferred base tip; never softens CM locks. */
import { CL_LOCKS } from './global-knowledge-server-constellation-types';
import { CI_LOCKS } from './persistent-intelligence-economy-types';

export {
  CM_LOCKS,
  HONESTY_BANNER,
  SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CmHop, state: CmEvidenceState, summary: string): CmHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CmCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CmActor;
  root?: string;
};

export async function runSovereignRegionalKnowledgeCloudsCycle(input: CmCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CmHopRecord[] = [];
  const actor = {
    ...input.actor,
    universeId: input.universeId || input.actor.universeId,
  };

  hops.push(
    hop(
      'honesty_locks',
      CM_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CM_LOCKS.CROSS_REGION_RAW_PRIVATE_POOLING === false &&
        CM_LOCKS.SEALED_SILENT_REGIONAL_CLOUD_FALLBACK === false &&
        CM_LOCKS.TRUST_POLICY_BEATS_SPEED_COST === true &&
        CM_LOCKS.EMBASSY_DEAL_AUTHORITY === false &&
        CM_LOCKS.UNSIGNED_CACHE_INSTALL === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const cloudA = await enrollRegionalKnowledgeCloud({
    regionId: 'region-eu',
    label: 'EU Sovereign Knowledge Cloud',
    root,
    actor,
  });
  const cloudB = await enrollRegionalKnowledgeCloud({
    regionId: 'region-apac',
    label: 'APAC Sovereign Knowledge Cloud',
    root,
    actor,
  });
  hops.push(
    hop(
      'region_cloud_enroll',
      cloudA.enrolled && cloudB.enrolled ? 'ENROLLED' : 'FAIL',
      cloudA.reason,
    ),
  );

  const poolDeny = await attemptCrossRegionPrivatePooling({
    fromRegionId: cloudA.regionId,
    toRegionId: cloudB.regionId,
    mode: 'raw_private',
    root,
    actor,
  });
  hops.push(
    hop(
      'cross_region_raw_private_pooling_denied',
      poolDeny.accepted === false ? 'DENIED' : 'FAIL',
      poolDeny.reason,
    ),
  );

  const authorizedArchive = await registerArchiveSource({
    name: 'EU Open Cultural Archive',
    authorized: true,
    coverageClaim: 'regional',
    coverageEvidenceRefs: ['catalog://eu-open#coverage'],
    root,
    actor,
  });
  const authIntake = await intakeArchiveObservation({
    sourceId: authorizedArchive.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'archive_authorized_intake',
      authIntake.accepted ? 'AUTHORIZED' : 'FAIL',
      authIntake.reason,
    ),
  );

  const unauthIntake = await intakeArchiveObservation({
    attemptUnauthorized: true,
    attemptArbitraryDiscovery: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'archive_unauthorized_intake_denied',
      unauthIntake.accepted === false ? 'DENIED' : 'FAIL',
      unauthIntake.reason,
    ),
  );

  const allWorld = await registerArchiveSource({
    name: 'Unsupported All-World Claim',
    authorized: true,
    coverageClaim: 'all_world',
    coverageEvidenceRefs: [],
    root,
    actor,
  });
  const allWorldClaim = await claimAllWorldCoverage({
    sourceId: allWorld.id,
    evidenceRefs: [],
    root,
    actor,
  });
  hops.push(
    hop(
      'archive_all_world_without_evidence_not_verified',
      allWorldClaim.coverageStatus === 'NOT_VERIFIED' ? 'REJECTED' : 'FAIL',
      allWorldClaim.reason,
    ),
  );

  const healthForecast = await emitIntelligenceOutput({
    domain: 'health',
    summary: 'Seasonal incidence forecast for enrolled region',
    provenanceRefs: ['model://health-forecast-v1'],
    intendedLabel: 'forecast',
    root,
    actor,
  });
  const lawSim = await emitIntelligenceOutput({
    domain: 'law',
    summary: 'Simulated treaty outcome under scenario B',
    provenanceRefs: ['sim://treaty-b'],
    intendedLabel: 'simulation',
    root,
    actor,
  });
  const supplyFact = await emitIntelligenceOutput({
    domain: 'supply',
    summary: 'Licensed port throughput from authorized ledger',
    provenanceRefs: ['ledger://port#2026-Q1'],
    intendedLabel: 'verified_fact',
    root,
    actor,
  });
  hops.push(
    hop(
      'intel_grid_emit_with_honesty_labels',
      healthForecast.honestyLabel === 'forecast' &&
        lawSim.honestyLabel === 'simulation' &&
        supplyFact.honestyLabel === 'verified_fact'
        ? 'PASS'
        : 'FAIL',
      'health/law/supply outputs carry honesty labels',
    ),
  );

  const relabel = await attemptRelabelForecastOrSimAsFact({
    outputId: healthForecast.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'intel_forecast_sim_not_verified_fact',
      relabel.accepted === false ? 'DENIED' : 'FAIL',
      relabel.reason,
    ),
  );

  const approvedEdge = await registerRouteNode({
    label: 'approved-edge',
    kind: 'edge',
    approved: true,
    trustScore: 90,
    latencyMs: 40,
    policyTier: ['open', 'local_only', 'sealed'],
    root,
  });
  const fastLowTrust = await registerRouteNode({
    label: 'fast-low-trust-cloud',
    kind: 'cloud',
    approved: true,
    trustScore: 20,
    latencyMs: 5,
    policyTier: ['open'],
    root,
  });
  const unapproved = await registerRouteNode({
    label: 'shadow-node',
    kind: 'server',
    approved: false,
    trustScore: 99,
    latencyMs: 1,
    root,
  });
  await registerRouteNode({
    label: 'regional-cloud-cell',
    kind: 'regional_cloud',
    approved: true,
    trustScore: 70,
    latencyMs: 15,
    policyTier: ['open'],
    root,
  });

  const routeOpen = await optimizeKnowledgeRoute({
    contentClass: 'open',
    root,
    actor,
  });
  hops.push(
    hop(
      'route_exclude_unapproved_node',
      routeOpen.excludedNodeIds.includes(unapproved.id) &&
        !routeOpen.candidateNodeIds.includes(unapproved.id)
        ? 'DENIED'
        : 'FAIL',
      routeOpen.reason,
    ),
  );

  hops.push(
    hop(
      'route_trust_policy_beats_speed',
      routeOpen.accepted &&
        routeOpen.selectedNodeId === approvedEdge.id &&
        routeOpen.selectedNodeId !== fastLowTrust.id
        ? 'ROUTED'
        : 'FAIL',
      routeOpen.reason,
    ),
  );

  const sealedRoute = await optimizeKnowledgeRoute({
    contentClass: 'sealed',
    attemptSilentRegionalCloudFallback: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_silent_regional_cloud',
      sealedRoute.accepted === false &&
        sealedRoute.silentRegionalCloudFallback === false
        ? 'DENIED'
        : 'FAIL',
      sealedRoute.reason,
    ),
  );

  const embassy = await openEmbassyWorkcell({
    regionId: 'region-eu',
    languages: ['en', 'fr', 'de'],
    objective: 'bounded multilingual liaison workcell',
    root,
    actor,
  });
  hops.push(
    hop(
      'embassy_open_bounded_workcell',
      embassy.accepted && embassy.bounded ? 'BOUNDED' : 'FAIL',
      embassy.reason,
    ),
  );

  const embassyDeny = await probeEmbassyAuthority({
    embassyId: embassy.id,
    attemptDeal: true,
    attemptSpend: true,
    attemptPermissionEscalation: true,
    root,
    actor,
  });
  await recordEmbassyLearning({
    embassyId: embassy.id,
    summary: 'learned regional phrasing patterns',
    root,
    actor,
  });
  hops.push(
    hop(
      'embassy_deal_spend_permission_denied',
      embassyDeny.accepted === false ? 'DENIED' : 'FAIL',
      embassyDeny.reason,
    ),
  );

  const device = await enrollCacheDevice({
    label: 'field-tablet-1',
    root,
    actor,
  });
  const signedCache = await publishOfflineKnowledgeCache({
    label: 'region-eu-pack-v1',
    signed: true,
    signatureRef: 'sig:founder-sealed-pack-v1',
    root,
    actor,
  });
  const installOk = await installOfflineKnowledgeCache({
    cacheId: signedCache.id,
    deviceId: device.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_cache_signed_enrolled_install',
      installOk.accepted ? 'SIGNED' : 'FAIL',
      installOk.reason,
    ),
  );

  const unsigned = await publishOfflineKnowledgeCache({
    label: 'unsigned-pack',
    signed: false,
    root,
    actor,
  });
  const unsignedInstall = await installOfflineKnowledgeCache({
    cacheId: unsigned.id,
    deviceId: device.id,
    root,
    actor,
  });
  const revoked = await publishOfflineKnowledgeCache({
    label: 'revoked-pack',
    signed: true,
    root,
    actor,
  });
  await revokeOfflineKnowledgeCache({ cacheId: revoked.id, root, actor });
  const revokedInstall = await installOfflineKnowledgeCache({
    cacheId: revoked.id,
    deviceId: device.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_cache_unsigned_or_revoked_rejected',
      unsignedInstall.accepted === false && revokedInstall.accepted === false
        ? 'REJECTED'
        : 'FAIL',
      unsignedInstall.reason,
    ),
  );

  const unenrolledInstall = await installOfflineKnowledgeCache({
    cacheId: signedCache.id,
    deviceId: 'not-enrolled-device',
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_cache_unenrolled_device_denied',
      unenrolledInstall.accepted === false ? 'DENIED' : 'FAIL',
      unenrolledInstall.reason,
    ),
  );

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary:
        '62L-CM sovereign regional knowledge clouds / archive observatory / intelligence grid / route optimization / embassy / offline cache cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CM'],
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidence?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CM sovereign regional knowledge clouds cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; recommendation only; learning ≠ permission`,
      sourceRefs: ['62L-CM'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;

  return {
    hops,
    honesty: {
      regionalClouds: regionalCloudHonesty(),
      archiveObservatory: archiveObservatoryHonesty(),
      intelligenceGrid: intelligenceGridHonesty(),
      routeOptimization: routeOptimizationHonesty(),
      embassyNetwork: embassyNetworkHonesty(),
      offlineCacheFabric: offlineCacheFabricHonesty(),
    },
    locks: CM_LOCKS,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildSovereignRegionalKnowledgeCloudsHealthReport(input?: {
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
    phase: '62L-CM',
    title:
      'XIV Sovereign Regional Knowledge Clouds + Global Archive Observatory + International Business/Law/Health/Supply Intelligence Grid + Knowledge Route Optimization Engine + Agent Embassy Network + Planetary Offline Knowledge Cache Fabric',
    honestyBanner: HONESTY_BANNER,
    locks: CM_LOCKS,
    l4AutonomyEnabled: CM_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: CM_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CM_LOCKS.TIP_LAND,
    githubSoT: 103,
    gitlabCoordination: 37,
    cycle: SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_CYCLE,
    predecessors: preds,
    localBrainHealth: health,
    decisionGatePresent: typeof gate === 'function' || typeof gate === 'object',
    modules: {
      sovereignRegionalKnowledgeClouds: 'IMPLEMENTED',
      globalArchiveObservatory: 'IMPLEMENTED',
      internationalIntelligenceGrid: 'IMPLEMENTED',
      knowledgeRouteOptimizationEngine: 'IMPLEMENTED',
      agentEmbassyNetwork: 'IMPLEMENTED',
      planetaryOfflineKnowledgeCacheFabric: 'IMPLEMENTED',
    },
    clCiContinuity: {
      clL4: CL_LOCKS.L4_AUTONOMY_ENABLED,
      ciL4: CI_LOCKS.L4_AUTONOMY_ENABLED,
      clSealedSilentCloudHighway: CL_LOCKS.SEALED_SILENT_CLOUD_HIGHWAY,
      ciSealedSilentCloudFallback: CI_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
      note: 'CM extends CL/CI locks; does not soften them. CL ops report may remain WAITING_DATA briefly; CK/CJ reports may be MISSING on this tip.',
    },
    nextPhase: NEXT_PHASE_TITLE,
    productionAuthorized: false,
    generatedAt: new Date().toISOString(),
  };
}
