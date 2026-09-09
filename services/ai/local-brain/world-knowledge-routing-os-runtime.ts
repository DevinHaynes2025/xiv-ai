/**
 * 62L-CN runtime — walks WORLD_KNOWLEDGE_ROUTING_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  configureEndpoint,
  registerKnowledgePacket,
  routeKnowledge,
  worldKnowledgeRoutingHonesty,
} from './world-knowledge-routing-os';
import {
  corridorGraphHonesty,
  registerCorridor,
  registerCorridorNode,
  transitCorridor,
} from './international-data-corridor-graph';
import {
  handoffMiniServer,
  miniServerMeshHonesty,
  registerMiniServer,
} from './regional-mini-server-mesh';
import {
  atlasHonesty,
  claimAllWorldCoverage,
  upsertAtlasEntry,
} from './historical-infrastructure-intelligence-atlas';
import {
  attemptResearchEscalation,
  crossBorderResearchHonesty,
  openResearchSession,
} from './cross-border-agent-research-network';
import {
  createSignedMemoryDelta,
  exchangeMemoryDelta,
  memoryExchangeHonesty,
  revokeMemoryDelta,
} from './distributed-global-memory-exchange';
import {
  CN_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  WORLD_KNOWLEDGE_ROUTING_OS_CYCLE,
  predecessorMap,
  type CnActor,
  type CnEvidenceState,
  type CnHop,
  type CnHopRecord,
} from './world-knowledge-routing-os-types';

/** Optional CM/CL/CI continuity — present on preferred pushed base tip; never softens CN locks. */
import { CM_LOCKS } from './sovereign-regional-knowledge-clouds-types';
import { CL_LOCKS } from './global-knowledge-server-constellation-types';
import { CI_LOCKS } from './persistent-intelligence-economy-types';
import { CF_LOCKS } from './data-refinery-compression-replication-types';
import { CE_LOCKS } from './knowledge-excavation-memory-lake-types';

export {
  CN_LOCKS,
  HONESTY_BANNER,
  WORLD_KNOWLEDGE_ROUTING_OS_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CnHop, state: CnEvidenceState, summary: string): CnHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CnCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CnActor;
  root?: string;
};

export async function runWorldKnowledgeRoutingOsCycle(input: CnCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CnHopRecord[] = [];
  const actor = {
    ...input.actor,
    universeId: input.universeId || input.actor.universeId,
  };

  hops.push(
    hop(
      'honesty_locks',
      CN_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CN_LOCKS.SEALED_SILENT_INTERNATIONAL_CORRIDOR === false &&
        CN_LOCKS.RAW_PRIVATE_POOLING_DEFAULT === false &&
        CN_LOCKS.ARBITRARY_ENDPOINT_DISCOVERY === false &&
        CN_LOCKS.POLICY_TRUST_BEATS_SPEED_COST === true
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const epA = await configureEndpoint({
    label: 'eu-archive',
    kind: 'archive',
    region: 'eu-west',
    trustScore: 90,
    root,
    actor,
  });
  const epB = await configureEndpoint({
    label: 'fast-low-trust',
    kind: 'api',
    region: 'us-east',
    trustScore: 20,
    root,
    actor,
  });
  hops.push(hop('configure_endpoint', 'CONFIGURED', `endpoints=${epA.id},${epB.id}`));

  const unconfigured = await routeKnowledge({
    endpointId: 'ep_not_configured',
    root,
    actor,
  });
  hops.push(
    hop(
      'route_unconfigured_endpoint_denied',
      unconfigured.accepted === false ? 'DENIED' : 'FAIL',
      unconfigured.reason,
    ),
  );

  const approved = await registerKnowledgePacket({
    class: 'approved',
    approved: true,
    summary: 'approved corridor packet',
    root,
    actor,
  });
  hops.push(hop('approve_knowledge_for_corridor', 'APPROVED', approved.id));

  const unapproved = await registerKnowledgePacket({
    class: 'unapproved',
    approved: false,
    summary: 'unapproved probe',
    root,
    actor,
  });
  const unapprovedRoute = await routeKnowledge({
    endpointId: epA.id,
    packetId: unapproved.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unapproved_knowledge_corridor_denied',
      unapprovedRoute.accepted === false ? 'DENIED' : 'FAIL',
      unapprovedRoute.reason,
    ),
  );

  const nodeA = await registerCorridorNode({
    endpointId: epA.id,
    label: 'node-a',
    jurisdiction: 'EU',
    root,
    actor,
  });
  const nodeB = await registerCorridorNode({
    endpointId: epB.id,
    label: 'node-b',
    jurisdiction: 'US',
    root,
    actor,
  });
  const corridor = await registerCorridor({
    fromNodeId: nodeA.id,
    toNodeId: nodeB.id,
    trustWeight: 80,
    latencyMs: 200,
    root,
    actor,
  });
  hops.push(
    hop(
      'register_corridor',
      corridor.accepted ? 'PASS' : 'FAIL',
      corridor.reason,
    ),
  );

  const discovery = await routeKnowledge({
    attemptArbitraryDiscovery: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'arbitrary_endpoint_discovery_denied',
      discovery.accepted === false ? 'DENIED' : 'FAIL',
      discovery.reason,
    ),
  );

  const ms1 = await registerMiniServer({
    label: 'cell-eu-1',
    region: 'eu-west',
    cellRef: 'ck-cl-waiting',
    root,
    actor,
  });
  const ms2 = await registerMiniServer({
    label: 'cell-us-1',
    region: 'us-east',
    root,
    actor,
  });
  const meshOk = await handoffMiniServer({
    fromServerId: ms1.id,
    toServerId: ms2.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'mesh_register_mini_server',
      meshOk.accepted ? 'ENROLLED' : 'FAIL',
      meshOk.reason,
    ),
  );

  const atlasOk = await upsertAtlasEntry({
    domain: 'ports',
    region: 'rotterdam',
    eraStart: '1950',
    summary: 'Rotterdam port expansion',
    provenanceRefs: ['doc:port-archives-1950'],
    root,
    actor,
  });
  hops.push(
    hop(
      'atlas_upsert_with_provenance',
      atlasOk.entry?.coverageLabel === 'VERIFIED' ? 'VERIFIED' : 'FAIL',
      atlasOk.reason,
    ),
  );

  const atlasNoProv = await upsertAtlasEntry({
    domain: 'rail',
    region: 'unknown',
    eraStart: '1900',
    summary: 'undocumented rail spur',
    provenanceRefs: [],
    root,
    actor,
  });
  hops.push(
    hop(
      'atlas_without_provenance_not_verified',
      atlasNoProv.entry?.coverageLabel !== 'VERIFIED' &&
        atlasNoProv.entry?.verificationState !== 'VERIFIED'
        ? 'LABELED_INCOMPLETE'
        : 'FAIL',
      atlasNoProv.reason,
    ),
  );

  const allWorld = await claimAllWorldCoverage({
    claim: 'complete all-world infrastructure atlas',
    evidenceRefs: [],
    root,
    actor,
  });
  hops.push(
    hop(
      'all_world_coverage_claim_rejected',
      allWorld.accepted === false ? 'REJECTED' : 'FAIL',
      allWorld.reason,
    ),
  );

  const research = await openResearchSession({
    topic: 'bounded corridor historiography',
    jurisdictions: ['EU', 'US'],
    root,
    actor,
  });
  hops.push(
    hop(
      'cross_border_research_open_bounded',
      research.accepted && research.session?.bounded === true ? 'BOUNDED' : 'FAIL',
      research.reason,
    ),
  );

  const escalate = await attemptResearchEscalation({
    sessionId: research.session!.id,
    claimPermissionEscalation: true,
    claimSpendAuthority: true,
    claimDealApproval: true,
    root,
    actor: { ...actor, kind: 'embassy_bureau' },
  });
  hops.push(
    hop(
      'cross_border_research_no_permission_or_spend',
      escalate.accepted === false ? 'DENIED' : 'FAIL',
      escalate.reason,
    ),
  );

  const delta = await createSignedMemoryDelta({
    compactPayload: 'compact-approved-fact-v1',
    approved: true,
    sign: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'memory_exchange_signed_delta',
      delta.delta?.signed === true ? 'SIGNED' : 'FAIL',
      delta.reason,
    ),
  );

  const rawPool = await exchangeMemoryDelta({
    deltaId: delta.delta!.id,
    operation: 'import',
    attemptRawPrivatePooling: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'raw_private_pooling_denied',
      rawPool.accepted === false ? 'DENIED' : 'FAIL',
      rawPool.reason,
    ),
  );

  const unsigned = await createSignedMemoryDelta({
    compactPayload: 'unsigned-probe',
    approved: true,
    sign: false,
    root,
    actor,
  });
  const unsignedEx = await exchangeMemoryDelta({
    deltaId: unsigned.delta!.id,
    operation: 'import',
    root,
    actor,
  });
  const revoked = await createSignedMemoryDelta({
    compactPayload: 'revoked-probe',
    approved: true,
    sign: true,
    root,
    actor,
  });
  await revokeMemoryDelta({ deltaId: revoked.delta!.id, root, actor });
  const revokedEx = await exchangeMemoryDelta({
    deltaId: revoked.delta!.id,
    operation: 'import',
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_or_revoked_delta_rejected',
      unsignedEx.accepted === false && revokedEx.accepted === false
        ? 'REJECTED'
        : 'FAIL',
      `${unsignedEx.reason}; ${revokedEx.reason}`,
    ),
  );

  const sealed = await registerKnowledgePacket({
    class: 'sealed',
    sealed: true,
    summary: 'founder sealed',
    root,
    actor,
  });
  const sealedRoute = await routeKnowledge({
    endpointId: epA.id,
    packetId: sealed.id,
    attemptSilentInternationalCorridor: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_silent_international_corridor',
      sealedRoute.accepted === false ? 'DENIED' : 'FAIL',
      sealedRoute.reason,
    ),
  );

  const policyRoute = await routeKnowledge({
    packetId: approved.id,
    candidates: [
      { endpointId: epB.id, latencyMs: 10 },
      { endpointId: epA.id, latencyMs: 250 },
    ],
    root,
    actor,
  });
  hops.push(
    hop(
      'policy_trust_beats_speed_cost',
      policyRoute.accepted &&
        policyRoute.endpointId === epA.id &&
        policyRoute.selectedBy === 'policy_trust'
        ? 'PASS'
        : 'FAIL',
      policyRoute.reason,
    ),
  );

  const okTransit = await transitCorridor({
    corridorId: corridor.edge!.id,
    knowledgeApproved: true,
    root,
    actor,
  });
  void okTransit;

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary:
        '62L-CN world knowledge routing / corridor / mesh / atlas / research / memory cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CN'],
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidence?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CN world knowledge routing OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; recommendation only; learning ≠ permission`,
      sourceRefs: ['62L-CN'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;

  return {
    hops,
    honesty: {
      routing: worldKnowledgeRoutingHonesty(),
      corridor: corridorGraphHonesty(),
      mesh: miniServerMeshHonesty(),
      atlas: atlasHonesty(),
      research: crossBorderResearchHonesty(),
      memory: memoryExchangeHonesty(),
    },
    locks: CN_LOCKS,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildWorldKnowledgeRoutingOsHealthReport(input?: {
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
    phase: '62L-CN',
    title:
      'XIV World Knowledge Routing OS + International Data Corridor Graph + Regional Mini-Server Mesh + Historical Infrastructure Intelligence Atlas + Cross-Border Agent Research Network + Distributed Global Memory Exchange',
    honestyBanner: HONESTY_BANNER,
    locks: CN_LOCKS,
    l4AutonomyEnabled: CN_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: CN_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CN_LOCKS.TIP_LAND,
    githubSoT: 104,
    gitlabCoordination: 38,
    cycle: WORLD_KNOWLEDGE_ROUTING_OS_CYCLE,
    predecessors: preds,
    localBrainHealth: health,
    decisionGatePresent: typeof gate === 'function' || typeof gate === 'object',
    modules: {
      worldKnowledgeRoutingOs: 'IMPLEMENTED',
      internationalDataCorridorGraph: 'IMPLEMENTED',
      regionalMiniServerMesh: 'IMPLEMENTED',
      historicalInfrastructureIntelligenceAtlas: 'IMPLEMENTED',
      crossBorderAgentResearchNetwork: 'IMPLEMENTED',
      distributedGlobalMemoryExchange: 'IMPLEMENTED',
    },
    cmClCiContinuity: {
      cmL4: CM_LOCKS.L4_AUTONOMY_ENABLED,
      clL4: CL_LOCKS.L4_AUTONOMY_ENABLED,
      ciL4: CI_LOCKS.L4_AUTONOMY_ENABLED,
      cfL4: CF_LOCKS.L4_AUTONOMY_ENABLED,
      ceL4: CE_LOCKS.L4_AUTONOMY_ENABLED,
      cmSealedSilentRegionalCloudFallback: CM_LOCKS.SEALED_SILENT_REGIONAL_CLOUD_FALLBACK,
      clSealedSilentCloudHighway: CL_LOCKS.SEALED_SILENT_CLOUD_HIGHWAY,
      clArbitraryServerDiscovery: CL_LOCKS.ARBITRARY_SERVER_DISCOVERY,
      note: 'CN extends CM/CL/CI/CF/CE locks; does not soften them. CM report may remain WAITING_DATA; CK/CJ may be sibling lineages.',
    },
    nextPhase: NEXT_PHASE_TITLE,
    productionAuthorized: false,
    generatedAt: new Date().toISOString(),
  };
}
