import { existsSync } from 'node:fs';

import { publishAgentMessage } from './agent-bus';
import { LocalCheckpointStore } from './checkpoint-store';
import { xivLocalPath } from './durable-json';
import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { promoteLakeClaim } from './evidence-graph';
import {
  approveDataExchangeContract,
  exchangePrivacyPreservingAggregate,
  exchangeSupplyChainCapability,
  proposeEnterpriseExchange,
} from './enterprise-data-exchange';
import { checkLocalBrainHealth } from './health-check';
import { getRuntime } from './hybrid-runtime';
import {
  INFORMATION_CONTROL_TOWER_LOCKS,
  INFORMATION_ROUTING_LOOP,
  type ControlTowerObservation,
  type EvidenceState,
  type InformationRoot,
  type SemanticQuery,
} from './information-control-tower-types';
import { hashLakeContent, ingestLakeSource, knowledgeLakeStats, listLakeObjects } from './knowledge-lake';
import { appendLearning } from './learning-ledger';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';
import { NeuralFabric } from './neural-fabric';
import { evaluateOfflineTask } from './offline-policy';
import { providerSlots } from './provider-fabric';
import { registerSemanticNamespace } from './semantic-namespaces';
import {
  admitWithBackpressure,
  analyzeVendorLockIn,
  detectRouteLoop,
  failoverRoute,
  releaseCongestion,
  routeOfflineFirst,
  selectMultiPathRoutes,
  translateFederatedQuery,
} from './semantic-internet-router';
import { runDecisionCouncil } from './workcells';
import { sealedVaultStats } from './ceo-sealed-vault';
import type { SealedActor } from './hybrid-edge-cloud-types';

export { INFORMATION_CONTROL_TOWER_LOCKS, INFORMATION_ROUTING_LOOP };

export type RoutingHopRecord = {
  hop: (typeof INFORMATION_ROUTING_LOOP)[number];
  state: EvidenceState;
  summary: string;
  refs: string[];
};

export type InformationNeed = {
  tenantId: string;
  universeId: string;
  need: string;
  domain: string;
  industry?: string;
  partition?: SemanticQuery['partition'];
  sealedPayload?: string;
  sealedRecordId?: string;
  counterpartyId?: string;
  actor?: SealedActor;
  consequence?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  needsExternalFreshness?: boolean;
  needsCloudProvider?: boolean;
  injectLoopPath?: string[];
  congestRootId?: string;
  root?: string;
};

function hop(name: RoutingHopRecord['hop'], state: EvidenceState, summary: string, refs: string[] = []): RoutingHopRecord {
  return { hop: name, state, summary, refs };
}

function predecessorReportState(root: string, file: string): EvidenceState {
  return existsSync(`${root}/docs/operations/${file}`) ? 'PASS' : 'WAITING_DATA';
}

export function resolveInformationIntent(need: string) {
  const text = need.trim().toLowerCase();
  const aggregation: SemanticQuery['aggregation'] =
    text.includes('benchmark') ? 'benchmark' : text.includes('count') || text.includes('aggregate') ? 'count' : 'hash';
  return {
    intent: text.slice(0, 240),
    aggregation,
    minimizeMovement: true as const,
    inventedFacts: false as const,
  };
}

export function buildControlTowerTwins(
  roots: InformationRoot[],
  contradictions: number,
  inflightBottlenecks: string[],
): ControlTowerObservation[] {
  const scoredUsefulness = [...roots].sort(
    (a, b) => (b.metrics.verifiedOutcomeQuality ?? 0) - (a.metrics.verifiedOutcomeQuality ?? 0),
  );
  const fastest = [...roots].sort((a, b) => (b.metrics.latency ?? 0) - (a.metrics.latency ?? 0))[0]?.id;
  return roots.map((root) => ({
    sourceId: root.id,
    fastest: root.id === fastest,
    usefulness: root.metrics.verifiedOutcomeQuality ?? 0,
    usefulnessIsPopularity: false,
    stale: (root.metrics.freshness ?? 0) < 0.3,
    contradictions,
    bottleneck: inflightBottlenecks.includes(root.id),
    stockout: (root.metrics.verifiedOutcomeQuality ?? 0) === 0 && !root.offlineAvailable,
    usefulnessIsTruth: false,
  }));
}

export async function runInformationControlTowerCycle(input: InformationNeed) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const actor: SealedActor = input.actor ?? { kind: 'ordinary_agent', id: 'router-agent', role: 'knowledge_curator' };
  const hops: RoutingHopRecord[] = [];
  const fabric = new NeuralFabric();

  hops.push(hop('information_need', 'PASS', `Need captured: ${input.need.slice(0, 160)}`, []));

  const intent = resolveInformationIntent(input.need);
  hops.push(hop('intent_resolution', 'PASS', `Intent resolved with aggregation=${intent.aggregation}.`, []));

  const ns = await registerSemanticNamespace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    domain: input.domain,
    name: 'control-tower',
    label: `${input.domain} control tower`,
    schemaRef: 'xiv.an.control-tower.v1',
    root,
  });
  const namespaceIri = ns.accepted ? ns.namespace.iri : `xiv://${input.tenantId}/${input.universeId}/${input.domain}/control-tower`;

  const lakeRoot: InformationRoot = {
    id: 'root-knowledge-lake',
    kind: 'knowledge_lake',
    namespaceId: namespaceIri,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: 'Knowledge Lake',
    configured: true,
    authorized: true,
    verified: true,
    offlineAvailable: true,
    partnershipInvented: false,
    lastVerifiedAt: new Date().toISOString(),
    maxStalenessMs: 86_400_000,
    metrics: {
      freshness: 0.9,
      provenance: 0.9,
      trust: 0.85,
      privacy: 0.9,
      latency: 0.8,
      cost: 0.9,
      offlineAvailability: 1,
      compatibility: 0.85,
      verifiedOutcomeQuality: 0.7,
      popularity: 0.05,
    },
    hopPath: input.injectLoopPath,
    productionAuthorization: false,
  };
  const ledgerRoot: InformationRoot = {
    id: 'root-learning-ledger',
    kind: 'learning_ledger',
    namespaceId: namespaceIri,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: 'Learning Ledger',
    configured: true,
    authorized: true,
    verified: true,
    offlineAvailable: true,
    partnershipInvented: false,
    lastVerifiedAt: new Date().toISOString(),
    metrics: {
      freshness: 0.8,
      provenance: 0.8,
      trust: 0.8,
      privacy: 0.95,
      latency: 0.9,
      cost: 1,
      offlineAvailability: 1,
      compatibility: 0.9,
      verifiedOutcomeQuality: 0.6,
    },
    productionAuthorization: false,
  };
  const popularCloud: InformationRoot = {
    id: 'root-unconfigured-cloud',
    kind: 'provider',
    namespaceId: namespaceIri,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: 'Unconfigured popular cloud',
    configured: false,
    authorized: false,
    verified: false,
    offlineAvailable: false,
    partnershipInvented: false,
    vendorId: 'aws',
    metrics: {
      freshness: 0.2,
      provenance: 0.2,
      trust: 0.2,
      privacy: 0.1,
      latency: 0.4,
      cost: 0.3,
      offlineAvailability: 0,
      compatibility: 0.2,
      verifiedOutcomeQuality: 0,
      popularity: 0.99,
    },
    productionAuthorization: false,
  };
  const amFabric: InformationRoot = {
    id: 'root-data-fabric-am',
    kind: 'data_fabric',
    namespaceId: namespaceIri,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: '62L-AM Data Fabric',
    configured: false,
    authorized: false,
    verified: false,
    offlineAvailable: false,
    partnershipInvented: false,
    metrics: {},
    productionAuthorization: false,
  };
  const alEdge: InformationRoot = {
    id: 'root-edge-sync-al',
    kind: 'edge_sync',
    namespaceId: namespaceIri,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: '62L-AL Edge Sync',
    configured: false,
    authorized: false,
    verified: false,
    offlineAvailable: false,
    partnershipInvented: false,
    metrics: {},
    productionAuthorization: false,
  };

  const candidates = [lakeRoot, ledgerRoot, popularCloud, amFabric, alEdge];
  hops.push(hop('candidate_roots', 'PASS', `Candidate roots: ${candidates.map((item) => item.id).join(', ')}`, candidates.map((item) => item.id)));

  const query: SemanticQuery = {
    need: input.need,
    namespaceIri,
    predicate: input.need,
    industry: input.industry,
    partition: input.partition ?? 'business',
    aggregation: intent.aggregation,
    minimizeMovement: true,
  };

  const loopCheck = detectRouteLoop(input.injectLoopPath ?? [lakeRoot.id, ledgerRoot.id]);
  const multi = selectMultiPathRoutes(candidates, query);
  const policyDenied = multi.filtered.filter((item) => !item.admitted);
  const amDenied = policyDenied.find((item) => item.root.kind === 'data_fabric');
  hops.push(
    hop(
      'policy_filter',
      multi.scored.length > 0 ? 'PASS' : 'FAIL',
      `Admitted ${multi.scored.length}; denied ${policyDenied.map((item) => `${item.root.id}:${item.state}`).join(', ') || 'none'}. AM=${amDenied?.state ?? 'absent'}.`,
      policyDenied.map((item) => item.root.id),
    ),
  );

  hops.push(
    hop(
      'route_scoring',
      multi.paths[0]?.score.usedPopularity === false ? 'PASS' : 'FAIL',
      `Top route ${multi.paths[0]?.filter.root.id ?? 'none'} score=${multi.paths[0]?.score.score.toFixed(3) ?? 'n/a'}. Popularity ignored.`,
      multi.paths.map((item) => item.filter.root.id),
    ),
  );

  const selected = multi.paths[0]?.filter.root ?? lakeRoot;
  const translated = translateFederatedQuery(selected, query);
  hops.push(hop('semantic_translation', translated.state, translated.reason, [selected.id]));

  const congestion = admitWithBackpressure(input.congestRootId ?? selected.id, 2);
  const offlinePolicy = evaluateOfflineTask({
    needsInternet: input.needsExternalFreshness === true,
    needsCloudProvider: input.needsCloudProvider === true,
    needsExternalFreshness: input.needsExternalFreshness === true,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });

  let queryState: EvidenceState = 'PASS';
  let querySummary = 'Authorized local query-to-data executed.';
  let evidenceRefs: string[] = [];
  let lakeHash: string | undefined;
  let lakeCount = 0;

  if (loopCheck.loop) {
    queryState = 'FAIL';
    querySummary = loopCheck.reason;
  } else if (!congestion.admitted) {
    queryState = 'WAITING_DATA';
    querySummary = congestion.reason;
  } else if (!offlinePolicy.allowed) {
    queryState = offlinePolicy.state === 'DENIED' ? 'FAIL' : offlinePolicy.state;
    querySummary = offlinePolicy.reason;
  } else {
    const ingested = await ingestLakeSource({
      tenantId: input.tenantId,
      universeId: input.universeId,
      industry: input.industry ?? input.domain,
      partition: input.partition === 'world' || input.partition === 'personal' || input.partition === 'company' ? input.partition : 'business',
      sourceUri: `xiv://local/${input.domain}/need`,
      sourceLanguage: 'en',
      originalText: input.need,
      provenanceRefs: ['62L-AN:control-tower'],
      classification: 'internal',
      root,
    });
    lakeHash = ingested.object.contentHash;
    const objects = await listLakeObjects({
      tenantId: input.tenantId,
      universeId: input.universeId,
      industry: ingested.object.industry,
      partition: ingested.object.partition,
      root,
    });
    lakeCount = objects.length;
    const knowledge = await retrieveOfflineKnowledge(input.need, {
      tenantId: input.tenantId,
      universeId: input.universeId,
      root,
      needsExternalFreshness: input.needsExternalFreshness,
    });
    evidenceRefs = [...knowledge.evidenceRefs, `lake:${ingested.object.id}`];
    querySummary = `Pushdown retrieved ${lakeCount} lake object(s); inventedFacts=${knowledge.inventedFacts}.`;
    queryState = knowledge.state === 'WAITING_DATA' ? 'WAITING_DATA' : 'PASS';
  }
  hops.push(hop('authorized_query', queryState, querySummary, evidenceRefs));

  const promotion = await promoteLakeClaim({
    text: input.need,
    tenantId: input.tenantId,
    universeId: input.universeId,
    needsExternalFreshness: input.needsExternalFreshness,
    needsCloudProvider: input.needsCloudProvider,
    aiAgreementOnly: true,
    root,
  });
  const packet = {
    need: input.need,
    namespaceIri,
    routeId: selected.id,
    evidenceRefs,
    lakeCount,
    contentHash: lakeHash ?? hashLakeContent('en', input.need),
    originalTextMoved: false as const,
    rawPooled: false as const,
    promotionState: promotion.state,
    promotedToVerified: promotion.promotedToVerified,
    inventedPass: false as const,
  };
  hops.push(
    hop(
      'evidence_packet',
      promotion.inventedPass === false ? (queryState === 'FAIL' ? 'FAIL' : promotion.state === 'WAITING_DATA' ? 'WAITING_DATA' : 'PASS') : 'FAIL',
      `Evidence packet assembled. Promotion=${promotion.state}. Raw pooled=false.`,
      evidenceRefs,
    ),
  );

  const gate = decisionGate({
    id: `an-gate-${input.need.slice(0, 24)}`,
    action: `route:${input.need}`,
    consequence: input.consequence ?? 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  const council = await runDecisionCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    action: `control-tower:${input.need.slice(0, 80)}`,
    consequence: input.consequence ?? 'LOW',
    root,
  });
  hops.push(
    hop(
      'agent_workflow',
      'PASS',
      `Decision gate executable=${gate.executableByAgent}; council dissent=${council.dissent.length}. Smarter highways, not more agents.`,
      [council.gate.reason],
    ),
  );

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: `62L-AN evidence packet for ${selected.id}`,
      payload: { packet, hopCount: hops.length },
    },
    root,
  );
  const outcomeState: EvidenceState = queryState === 'FAIL' ? 'FAIL' : queryState === 'WAITING_DATA' ? 'WAITING_DATA' : 'PASS';
  hops.push(hop('outcome', outcomeState, `Outcome recorded with source-to-decision refs on ${selected.id}.`, evidenceRefs));

  await appendLearning(
    {
      domain: input.domain,
      subject: selected.id,
      claimState: 'MODEL_INFERENCE',
      summary: `Route ${selected.id} outcome=${outcomeState}; popularity unused.`,
      sourceRefs: evidenceRefs,
      evidence: evidenceRefs,
      confidence: multi.paths[0]?.score.score,
    },
    root,
  );
  hops.push(hop('route_learning', 'PASS', 'Route learning appended to the Learning Ledger. Permissions unchanged.', []));

  fabric.registerNode({
    id: `tower:${input.tenantId}:${input.universeId}:need`,
    kind: 'knowledge',
    label: 'Information need',
    tenantId: input.tenantId,
    universeId: input.universeId,
    trust: 'SYNTHETIC',
    provenanceRefs: ['62L-AN:need'],
  });
  fabric.registerNode({
    id: `tower:${input.tenantId}:${input.universeId}:decision`,
    kind: 'decision',
    label: 'Control tower decision',
    tenantId: input.tenantId,
    universeId: input.universeId,
    trust: 'SYNTHETIC',
    provenanceRefs: ['62L-AN:decision'],
  });
  fabric.connect({
    from: `tower:${input.tenantId}:${input.universeId}:need`,
    to: `tower:${input.tenantId}:${input.universeId}:decision`,
    relation: 'source_to_decision',
    weight: 0.5,
    confidence: 0.5,
    evidenceRefs,
  });

  const twins = buildControlTowerTwins(
    [lakeRoot, ledgerRoot, popularCloud],
    0,
    congestion.admitted ? [] : [selected.id],
  );
  publishAgentMessage({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromRole: 'knowledge_curator',
    toRole: 'executive_synthesizer',
    kind: 'status',
    body: `Control tower twins: fastest=${twins.find((item) => item.fastest)?.sourceId ?? 'none'}`,
    evidenceRefs: twins.map((item) => item.sourceId),
    requiresHumanApproval: false,
    ttlMs: 3_600_000,
  });

  hops.push(
    hop(
      'control_tower',
      'PASS',
      'Control tower recorded fastest/useful/stale/bottleneck/stockout twins. Usefulness ≠ truth.',
      twins.map((item) => item.sourceId),
    ),
  );

  releaseCongestion(input.congestRootId ?? selected.id);
  const checkpoints = new LocalCheckpointStore(xivLocalPath(root, 'brain-state.json'));
  await checkpoints.checkpoint({
    taskId: `an-${input.tenantId}`,
    at: new Date().toISOString(),
    state: outcomeState === 'FAIL' ? 'failed' : outcomeState === 'WAITING_DATA' ? 'waiting_data' : 'completed',
    attempt: 1,
    summary: `62L-AN cycle selected=${selected.id}`,
    nextAction: '62L-AO',
    evidence: evidenceRefs,
  });

  return {
    hops,
    architecture: INFORMATION_ROUTING_LOOP,
    namespace: ns,
    query,
    multiPath: multi.paths.map((item) => ({ id: item.filter.root.id, score: item.score.score, usedPopularity: item.score.usedPopularity })),
    failover: failoverRoute(candidates, query, popularCloud.id),
    offline: routeOfflineFirst(candidates, query),
    loop: loopCheck,
    congestion,
    translation: translated,
    vendorLockIn: candidates.map(analyzeVendorLockIn),
    packet,
    twins,
    gate,
    promotion,
    locks: INFORMATION_CONTROL_TOWER_LOCKS,
    predecessorWaiting: {
      '62L-AM': predecessorReportState(root, '62L_AM_INFORMATION_SUPPLY_CHAIN_DATA_FABRIC_REPORT.md'),
      '62L-AL': predecessorReportState(root, '62L_AL_DISTRIBUTED_APP_NETWORK_EDGE_SYNC_REPORT.md'),
    },
    neuralStats: fabric.stats(),
    productionAuthorization: false as const,
    inventedPass: false as const,
    rawPooled: false as const,
    founderImpersonation: false as const,
  };
}

export async function benchmarkSemanticInternet(input: {
  tenantId: string;
  universeId: string;
  roots: InformationRoot[];
  query: SemanticQuery;
}) {
  const multi = selectMultiPathRoutes(input.roots, input.query);
  return {
    tenantId: input.tenantId,
    universeId: input.universeId,
    compared: multi.scored.map((item) => ({
      rootId: item.filter.root.id,
      score: item.score.score,
      state: item.score.state,
      usedPopularity: item.score.usedPopularity,
      slaBreached: item.score.slaBreached,
    })),
    winner: multi.paths[0]?.filter.root.id ?? null,
    popularityUsed: false as const,
    inventedPass: false as const,
    liveInternetBenchmark: 'NOT_TESTED' as const,
  };
}

export async function buildInformationControlTowerHealthReport(root = process.cwd()) {
  const health = await checkLocalBrainHealth(root);
  const lake = await knowledgeLakeStats(root);
  const sealed = await sealedVaultStats(root);
  const am = predecessorReportState(root, '62L_AM_INFORMATION_SUPPLY_CHAIN_DATA_FABRIC_REPORT.md');
  const al = predecessorReportState(root, '62L_AL_DISTRIBUTED_APP_NETWORK_EDGE_SYNC_REPORT.md');
  const ad = predecessorReportState(root, '62L_AD_DISTRIBUTED_OFFLINE_AGENT_MESH_REPORT.md');
  return {
    generatedAt: new Date().toISOString(),
    architecture: INFORMATION_ROUTING_LOOP,
    localHealth: health,
    lake,
    sealedVault: sealed,
    predecessors: {
      '62L-AM': am,
      '62L-AL': al,
      '62L-AD': ad,
      '62L-AB': 'PRESENT' as const,
      '62L-AE': 'PRESENT' as const,
    },
    githubIssue52: 'UNAVAILABLE' as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
    liveSemanticInternet: 'NOT_TESTED' as const,
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
    })),
    localRuntime: getRuntime('local').configured ? getRuntime('local').state : 'UNAVAILABLE',
    locks: INFORMATION_CONTROL_TOWER_LOCKS,
    productionAuthorization: false as const,
    inventedPass: false as const,
    rawCrossEnterprisePooling: false as const,
    next: '62L-AO — Global Agentic Supply Chain Network + Inter-Enterprise Coordination + Demand/Capacity Intelligence',
  };
}

export {
  approveDataExchangeContract,
  exchangePrivacyPreservingAggregate,
  exchangeSupplyChainCapability,
  proposeEnterpriseExchange,
};
