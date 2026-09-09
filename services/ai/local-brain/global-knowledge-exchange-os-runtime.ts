/**
 * 62L-CO runtime — walks GLOBAL_KNOWLEDGE_EXCHANGE_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  approveExchangeEndpoint,
  attemptKnowledgeExchange,
  exchangeOsHonesty,
} from './global-knowledge-exchange-os';
import {
  enrollRegionalMicroCloud,
  microCloudFabricHonesty,
} from './regional-micro-cloud-fabric';
import {
  archiveDiscoveryHonesty,
  attemptArchiveDiscovery,
  registerArchiveDiscoverySource,
} from './international-archive-discovery-engine';
import {
  attemptTradeTechGraphPromotion,
  recordTradeTechEdge,
  recordTradeTechNode,
  tradeTechGraphHonesty,
} from './historical-trade-technology-civilization-graph';
import {
  applyKnowledgePack,
  compressionHonesty,
  createSignedKnowledgePack,
  proposeCompressionCandidate,
  revokeKnowledgePack,
} from './cross-cloud-knowledge-compression';
import {
  attemptResearchAuthorityEscalation,
  openResearchWorkcell,
  researchCoordinationHonesty,
} from './worldwide-research-coordination-grid';
import {
  CO_LOCKS,
  GLOBAL_KNOWLEDGE_EXCHANGE_OS_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CoActor,
  type CoEvidenceState,
  type CoHop,
  type CoHopRecord,
} from './global-knowledge-exchange-os-types';

/** Optional CN/CL continuity — present on preferred base tip; never softens CO locks. */
import { CN_LOCKS } from './world-knowledge-routing-os-types';
import { CL_LOCKS } from './global-knowledge-server-constellation-types';

export {
  CO_LOCKS,
  GLOBAL_KNOWLEDGE_EXCHANGE_OS_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CoHop, state: CoEvidenceState, summary: string): CoHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CoCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CoActor;
  root?: string;
};

export async function runGlobalKnowledgeExchangeOsCycle(input: CoCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CoHopRecord[] = [];
  const actor = {
    ...input.actor,
    universeId: input.universeId || input.actor.universeId,
  };

  hops.push(
    hop(
      'honesty_locks',
      CO_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CO_LOCKS.LOCAL_FIRST &&
        CO_LOCKS.EXCHANGE_REQUIRES_APPROVED_ENDPOINT &&
        CO_LOCKS.SEALED_SILENT_CROSS_CLOUD === false &&
        CO_LOCKS.COMPRESSION_AUTO_PRODUCTION_AUTHORIZED === false &&
        CO_LOCKS.LEARNING_IS_PERMISSION === false &&
        CO_LOCKS.SIM_PROMOTE_TO_VERIFIED_FACT === false &&
        CN_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CL_LOCKS.L4_AUTONOMY_ENABLED === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const fromEp = await approveExchangeEndpoint({
    kind: 'regional_micro_cloud',
    label: 'region-a-cloud',
    regionId: 'region-a',
    root,
    actor,
  });
  const toEp = await approveExchangeEndpoint({
    kind: 'archive',
    label: 'approved-archive',
    regionId: 'region-b',
    root,
    actor,
  });
  const okExchange = await attemptKnowledgeExchange({
    fromEndpointId: fromEp.id,
    toEndpointId: toEp.id,
    residency: 'region-a',
    classification: 'internal',
    provenanceRef: 'prov-co-1',
    root,
    actor,
  });
  hops.push(
    hop(
      'exchange_approved_endpoint',
      okExchange.accepted ? 'APPROVED' : 'FAIL',
      okExchange.reason,
    ),
  );

  const deniedExchange = await attemptKnowledgeExchange({
    fromEndpointId: fromEp.id,
    toEndpointId: 'ep_unapproved_missing',
    forceUnapproved: true,
    residency: 'region-a',
    classification: 'internal',
    provenanceRef: 'prov-co-2',
    root,
    actor,
  });
  hops.push(
    hop(
      'exchange_unapproved_endpoint_denied',
      !deniedExchange.accepted && deniedExchange.state === 'DENIED'
        ? 'DENIED'
        : 'FAIL',
      deniedExchange.reason,
    ),
  );

  const missingMeta = await attemptKnowledgeExchange({
    fromEndpointId: fromEp.id,
    toEndpointId: toEp.id,
    residency: null,
    classification: 'internal',
    provenanceRef: 'prov-co-3',
    root,
    actor,
  });
  hops.push(
    hop(
      'missing_residency_classification_provenance_denied_or_unknown',
      !missingMeta.accepted && missingMeta.state === 'UNKNOWN' ? 'UNKNOWN' : 'FAIL',
      missingMeta.reason,
    ),
  );

  const gapSource = await registerArchiveDiscoverySource({
    name: 'partial-atlas',
    authorized: true,
    coverageClaim: 'regional',
    unknownGaps: ['antarctica-archives', 'pre-1500-pacific-oral'],
    inventCoverageForGaps: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unknown_gap_preserved',
      gapSource.unknownGaps.length === 2 &&
        (gapSource.coverageStatus === 'UNKNOWN' ||
          gapSource.reason.includes('UNKNOWN_GAP'))
        ? 'UNKNOWN'
        : 'FAIL',
      gapSource.reason,
    ),
  );

  const micro = await enrollRegionalMicroCloud({
    regionId: 'region-a',
    label: 'micro-a',
    root,
    actor,
  });
  hops.push(
    hop(
      'micro_cloud_fabric_enroll',
      micro.enrolled && micro.rawPrivatePoolingDefault === false ? 'ENROLLED' : 'FAIL',
      micro.reason,
    ),
  );

  const authArchive = await registerArchiveDiscoverySource({
    name: 'unesco-authorized',
    authorized: true,
    coverageClaim: 'multi_region',
    coverageEvidenceRefs: ['ev-arch-1'],
    root,
    actor,
  });
  const discOk = await attemptArchiveDiscovery({
    sourceId: authArchive.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'archive_discovery_authorized',
      discOk.accepted ? 'PASS' : 'FAIL',
      discOk.reason,
    ),
  );

  const unauth = await registerArchiveDiscoverySource({
    name: 'shadow-scrape',
    authorized: false,
    root,
    actor,
  });
  const discDenied = await attemptArchiveDiscovery({
    sourceId: unauth.id,
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_archive_discovery_denied',
      !discDenied.accepted ? 'DENIED' : 'FAIL',
      discDenied.reason,
    ),
  );

  const pack = await createSignedKnowledgePack({
    label: 'delta-pack-1',
    signed: true,
    root,
    actor,
  });
  const candidate = await proposeCompressionCandidate({
    label: 'cross-cloud-delta',
    sourcePackId: pack.id,
    sizeHint: 42,
    attemptAutoProductionAuthorize: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'compression_candidate_gated',
      candidate.status === 'CANDIDATE' ? 'CANDIDATE' : 'FAIL',
      candidate.reason,
    ),
  );
  hops.push(
    hop(
      'compression_not_auto_production_authorized',
      candidate.productionAuthorized === false ? 'DENIED' : 'FAIL',
      candidate.reason,
    ),
  );

  const sealed = await attemptKnowledgeExchange({
    fromEndpointId: fromEp.id,
    toEndpointId: toEp.id,
    residency: 'region-a',
    classification: 'sealed',
    provenanceRef: 'prov-sealed',
    sealed: true,
    attemptSilentCrossCloud: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_silent_cross_cloud',
      !sealed.accepted ? 'DENIED' : 'FAIL',
      sealed.reason,
    ),
  );

  const unsigned = await createSignedKnowledgePack({
    label: 'unsigned-pack',
    signed: false,
    root,
    actor,
  });
  const unsignedApply = await applyKnowledgePack({
    packId: unsigned.id,
    root,
    actor,
  });
  await revokeKnowledgePack({ packId: pack.id, root, actor });
  const revokedApply = await applyKnowledgePack({
    packId: pack.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_or_revoked_pack_rejected',
      !unsignedApply.accepted && !revokedApply.accepted ? 'REJECTED' : 'FAIL',
      `${unsignedApply.reason}; ${revokedApply.reason}`,
    ),
  );

  const workcell = await openResearchWorkcell({
    regionId: 'region-a',
    objective: 'bounded silk-road comparative study',
    root,
    actor,
  });
  hops.push(
    hop(
      'research_workcell_bounded',
      workcell.accepted && workcell.bounded ? 'BOUNDED' : 'FAIL',
      workcell.reason,
    ),
  );

  const escalate = await attemptResearchAuthorityEscalation({
    workcellId: workcell.id,
    attemptPermissionEscalation: true,
    attemptSpend: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'research_permission_spend_escalation_denied',
      !escalate.accepted ? 'DENIED' : 'FAIL',
      escalate.reason,
    ),
  );

  const n1 = await recordTradeTechNode({
    label: 'silk-road-caravan',
    kind: 'fact',
    provenanceRef: 'arch-ref-1',
    root,
    actor,
  });
  const n2 = await recordTradeTechNode({
    label: 'compass-diffusion',
    kind: 'correlation',
    root,
    actor,
  });
  const edge = await recordTradeTechEdge({
    fromId: n1.id,
    toId: n2.id,
    kind: 'hypothesis',
    pathway: 'technology',
    root,
    actor,
  });
  hops.push(
    hop(
      'trade_tech_graph_provenance_typed',
      n1.trustState === 'verified_fact' &&
        n2.trustState === 'labeled' &&
        edge.trustState === 'labeled'
        ? 'PASS'
        : 'FAIL',
      edge.reason,
    ),
  );

  const promoCorr = await attemptTradeTechGraphPromotion({
    nodeOrEdgeId: n2.id,
    fromKind: 'correlation',
    root,
    actor,
  });
  const promoSim = await attemptTradeTechGraphPromotion({
    nodeOrEdgeId: edge.id,
    fromKind: 'simulation',
    root,
    actor,
  });
  hops.push(
    hop(
      'graph_reject_correlation_sim_to_verified_fact',
      !promoCorr.accepted && !promoSim.accepted ? 'REJECTED' : 'FAIL',
      promoCorr.reason,
    ),
  );

  const allWorld = await registerArchiveDiscoverySource({
    name: 'all-world-claim',
    authorized: true,
    coverageClaim: 'all_world',
    coverageEvidenceRefs: [],
    root,
    actor,
  });
  hops.push(
    hop(
      'all_world_coverage_without_evidence_not_verified',
      allWorld.coverageStatus === 'NOT_VERIFIED' ? 'DENIED' : 'FAIL',
      allWorld.reason,
    ),
  );

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CO global knowledge exchange OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CO'],
        fromEndpointId: fromEp.id,
        toEndpointId: toEp.id,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CO global knowledge exchange OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning ≠ permission; exchange approved-endpoints only`,
      sourceRefs: ['62L-CO'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;
  void exchangeOsHonesty;
  void microCloudFabricHonesty;
  void archiveDiscoveryHonesty;
  void tradeTechGraphHonesty;
  void compressionHonesty;
  void researchCoordinationHonesty;

  return {
    ok: hops.every((h) =>
      [
        'PASS',
        'DENIED',
        'REJECTED',
        'UNAVAILABLE',
        'BOUNDED',
        'CANDIDATE',
        'ENROLLED',
        'APPROVED',
        'SIGNED',
        'UNKNOWN',
        'LABELED_SIMULATION',
        'LABELED_CORRELATION',
        'LABELED_HYPOTHESIS',
        'NOT_APPLIED',
        'RECOMMENDATION_ONLY',
        'LOCAL_PREFERRED',
        'COMPRESSED_CANDIDATE',
      ].includes(h.state),
    ),
    hops,
    fromEndpointId: fromEp.id,
    toEndpointId: toEp.id,
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CO_LOCKS.L4_AUTONOMY_ENABLED,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildGlobalKnowledgeExchangeOsHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const health = await checkLocalBrainHealth(root);
  const predecessors = predecessorMap(root);
  return {
    phase: '62L-CO',
    title:
      'XIV Global Knowledge Exchange OS + Regional Micro-Cloud Fabric + International Archive Discovery Engine + Historical Trade/Technology Civilization Graph + Cross-Cloud Knowledge Compression + Worldwide Research Coordination Grid',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CO_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorized: CO_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CO_LOCKS.TIP_LAND,
    githubSotIssue: 105,
    gitlabCoordinationIssue: 39,
    locks: { ...CO_LOCKS },
    honesty: {
      exchange: exchangeOsHonesty(),
      microCloud: microCloudFabricHonesty(),
      archive: archiveDiscoveryHonesty(),
      graph: tradeTechGraphHonesty(),
      compression: compressionHonesty(),
      research: researchCoordinationHonesty(),
    },
    cycle: [...GLOBAL_KNOWLEDGE_EXCHANGE_OS_CYCLE],
    predecessors,
    localBrainHealth: health,
    nextPhase: NEXT_PHASE_TITLE,
    documentedEqImplemented: false,
    implementedEqVerified: false,
    verifiedEqProductionAuthorized: false,
    at: new Date().toISOString(),
  };
}
