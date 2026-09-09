import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { sealCeoRecord, SEALED_REDACTION } from './ceo-sealed-vault';
import {
  approveDataExchangeContract,
  denyRawPool,
  exchangePrivacyPreservingAggregate,
  exchangeSupplyChainCapability,
  proposeEnterpriseExchange,
} from './enterprise-data-exchange';
import {
  INFORMATION_CONTROL_TOWER_LOCKS,
  INFORMATION_ROUTING_LOOP,
  type InformationRoot,
  type SemanticQuery,
} from './information-control-tower-types';
import {
  benchmarkSemanticInternet,
  buildInformationControlTowerHealthReport,
  runInformationControlTowerCycle,
} from './information-control-tower-runtime';
import { detectNamespaceCollisions, registerSemanticNamespace } from './semantic-namespaces';
import {
  admitWithBackpressure,
  analyzeVendorLockIn,
  detectRouteLoop,
  failoverRoute,
  freshnessFromSla,
  rankRoutes,
  releaseCongestion,
  resetRouterCongestion,
  routeOfflineFirst,
  scoreInformationRoute,
  selectMultiPathRoutes,
  translateFederatedQuery,
} from './semantic-internet-router';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lan-'));
const tenantId = '62lan-tenant';
const universeId = '62lan-universe';
const ceo = { kind: 'ceo_principal' as const, id: 'ceo-principal-sim' };
const ordinary = { kind: 'ordinary_agent' as const, id: 'router-agent', role: 'knowledge_curator' };
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

function rootOf(partial: Partial<InformationRoot> & Pick<InformationRoot, 'id' | 'kind'>): InformationRoot {
  return {
    namespaceId: 'xiv://t/u/business/control-tower',
    tenantId,
    universeId,
    label: partial.id,
    configured: true,
    authorized: true,
    verified: true,
    offlineAvailable: true,
    partnershipInvented: false,
    metrics: {},
    productionAuthorization: false,
    ...partial,
  };
}

const query: SemanticQuery = {
  need: 'supplier capability latency aggregate',
  namespaceIri: 'xiv://t/u/supply_chain/control-tower',
  predicate: 'capability',
  industry: 'logistics',
  partition: 'business',
  aggregation: 'count',
  minimizeMovement: true,
};

try {
  resetRouterCongestion();

  check(
    'US-AN19',
    INFORMATION_ROUTING_LOOP.join(' → ') ===
      'information_need → intent_resolution → candidate_roots → policy_filter → route_scoring → semantic_translation → authorized_query → evidence_packet → agent_workflow → outcome → route_learning → control_tower',
    'Executable routing loop is recorded in order.',
  );
  check(
    'US-AN30-locks',
    INFORMATION_CONTROL_TOWER_LOCKS.L4_AUTONOMY_ENABLED === false &&
      INFORMATION_CONTROL_TOWER_LOCKS.RAW_CROSS_ENTERPRISE_POOLING === false &&
      INFORMATION_CONTROL_TOWER_LOCKS.FOUNDER_IMPERSONATION === false &&
      INFORMATION_CONTROL_TOWER_LOCKS.INVENT_PARTNERSHIPS === false &&
      INFORMATION_CONTROL_TOWER_LOCKS.TIP_LAND === false,
    'L4, raw pooling, founder impersonation, invented partnerships, and tip-land are false.',
  );

  const ns = await registerSemanticNamespace({
    tenantId,
    universeId,
    domain: 'supply_chain',
    name: 'control-tower',
    label: 'Supply chain tower',
    schemaRef: 'xiv.an.control-tower.v1',
    root,
  });
  check('US-AN1', ns.accepted === true && ns.namespace.iri.includes('/supply_chain/control-tower'), 'Semantic namespace registered.');

  const collision = await registerSemanticNamespace({
    tenantId,
    universeId,
    domain: 'supply_chain',
    name: 'control-tower',
    label: 'Supply chain tower',
    schemaRef: 'xiv.an.control-tower.v2-other-schema',
    root,
  });
  check('US-AN2', collision.accepted === false && collision.collisions.some((item) => item.kind === 'iri_schema_conflict'), 'IRI/schema collision detected and refused.');

  const alias = detectNamespaceCollisions(
    ns.accepted ? [ns.namespace] : [],
    {
      iri: 'xiv://other/iri',
      tenantId,
      universeId,
      label: 'Supply chain tower',
      schemaRef: 'xiv.an.control-tower.v1',
    },
  );
  check('US-AN2-alias', alias.some((item) => item.kind === 'label_alias'), 'Label alias collision is detected without merging raw data.');

  const highQualityLocal = rootOf({
    id: 'local-lake',
    kind: 'knowledge_lake',
    lastVerifiedAt: new Date().toISOString(),
    metrics: {
      freshness: 0.95,
      provenance: 0.9,
      trust: 0.9,
      privacy: 0.95,
      latency: 0.8,
      cost: 0.9,
      offlineAvailability: 1,
      compatibility: 0.9,
      verifiedOutcomeQuality: 0.85,
      popularity: 0.01,
    },
  });
  const popularStale = rootOf({
    id: 'popular-cloud',
    kind: 'provider',
    configured: true,
    authorized: true,
    verified: true,
    offlineAvailable: false,
    vendorId: 'aws',
    lastVerifiedAt: new Date(Date.now() - 40 * 86_400_000).toISOString(),
    maxStalenessMs: 86_400_000,
    metrics: {
      freshness: 0.1,
      provenance: 0.2,
      trust: 0.2,
      privacy: 0.1,
      latency: 0.4,
      cost: 0.2,
      offlineAvailability: 0,
      compatibility: 0.2,
      verifiedOutcomeQuality: 0.1,
      popularity: 0.99,
    },
  });
  const localScore = scoreInformationRoute(highQualityLocal);
  const popularScore = scoreInformationRoute(popularStale);
  check(
    'US-AN3',
    localScore.score > popularScore.score && localScore.usedPopularity === false && popularScore.usedPopularity === false,
    `Route scoring prefers verified local quality (${localScore.score.toFixed(3)}) over popular stale cloud (${popularScore.score.toFixed(3)}).`,
  );

  const ranked = rankRoutes([popularStale, highQualityLocal], query);
  check('US-AN3-rank', ranked.scored[0]?.filter.root.id === 'local-lake', 'Ranked routes put the local quality root first, not the popular one.');

  const unconfigured = rootOf({
    id: 'unconfigured-gcp',
    kind: 'provider',
    configured: false,
    authorized: false,
    verified: false,
    offlineAvailable: false,
    vendorId: 'gcp',
    metrics: { popularity: 1, verifiedOutcomeQuality: 0 },
  });
  const filtered = rankRoutes([unconfigured, highQualityLocal], query);
  check(
    'US-AN21',
    filtered.filtered.some((item) => item.root.id === 'unconfigured-gcp' && item.admitted === false && item.state === 'UNAVAILABLE'),
    'Unconfigured providers are UNAVAILABLE and are not candidate winners.',
  );

  const multi = selectMultiPathRoutes([highQualityLocal, rootOf({ id: 'ledger', kind: 'learning_ledger', lastVerifiedAt: new Date().toISOString(), metrics: highQualityLocal.metrics }), popularStale], query, 3);
  check('US-AN4', multi.paths.length >= 2 && multi.pooledRaw === false && multi.paths.every((item) => item.filter.root.id !== 'popular-cloud' || item.score.score < localScore.score), 'Multi-path retrieval returns multiple eligible roots without pooling raw data.');

  const translated = translateFederatedQuery(highQualityLocal, query);
  check('US-AN5', translated.dialect === 'knowledge_lake' && translated.returnsRawRows === false && translated.minimizeMovement === true, 'Federated query translation maps to a lake dialect without raw rows.');
  check('US-AN6', translated.pushdown.industry === 'logistics' && translated.pushdown.partition === 'business', 'Query pushdown carries industry/partition predicates to the source.');

  const sla = freshnessFromSla(popularStale);
  check('US-AN7', sla.slaBreached === true && sla.freshness === 0, 'Freshness SLA breaches zero the freshness score.');

  const failover = failoverRoute([highQualityLocal, popularStale], query, 'popular-cloud');
  check('US-AN8', failover.selected?.filter.root.id === 'local-lake', 'Failover routing selects the next scored eligible root.');

  const offline = routeOfflineFirst([highQualityLocal, popularStale, unconfigured], query);
  check('US-AN9', offline.state === 'PASS' && offline.selected.every((item) => item.filter.root.offlineAvailable), 'Offline-first routing selects only offline-available roots.');

  resetRouterCongestion();
  const first = admitWithBackpressure('busy-root', 1);
  const second = admitWithBackpressure('busy-root', 1);
  check('US-AN10', first.admitted === true && second.admitted === false && second.reason.includes('BACKPRESSURE'), 'Congestion/backpressure refuses overflow instead of dumping into a raw pool.');
  releaseCongestion('busy-root');

  const loop = detectRouteLoop(['lake', 'peer', 'lake']);
  check('US-AN11', loop.loop === true && loop.state === 'FAIL' && loop.repeatedNode === 'lake', 'Route-loop detection refuses cyclic retrieval.');
  const noloop = detectRouteLoop(['lake', 'ledger', 'tower']);
  check('US-AN11-clear', noloop.loop === false && noloop.state === 'PASS', 'Acyclic hop paths are accepted.');

  const lockin = analyzeVendorLockIn(popularStale);
  check('US-AN12', lockin.popularityUsed === false && lockin.singleVendor === true && lockin.recommendation === 'prefer_portable_or_local', 'Vendor-lock-in analysis prefers portable/local over a popular single vendor.');

  const raw = denyRawPool('raw_pool');
  check('US-AN30-raw', raw?.allowed === false && raw.state === 'FAIL' && raw.rawPooled === false, 'Raw pool exchange is DENIED by default.');
  const rawCross = await proposeEnterpriseExchange({
    kind: 'raw_cross_enterprise',
    tenantId,
    universeId,
    counterpartyId: 'acme',
    actor: ordinary,
    payload: { originalText: 'secret invoices' },
    root,
  });
  check('US-AN30-raw-cross', rawCross.allowed === false && rawCross.state === 'FAIL', 'Raw cross-enterprise pooling is DENIED.');

  const noContract = await exchangePrivacyPreservingAggregate({
    tenantId,
    universeId,
    counterpartyId: 'acme',
    count: 12,
    contentHash: 'abc',
    actor: ordinary,
    root,
  });
  check('US-AN13-uninvented', noContract.allowed === false && noContract.state === 'UNAVAILABLE', 'Aggregate exchange without a contract is UNAVAILABLE; partnership is not invented.');

  await approveDataExchangeContract({
    tenantId,
    universeId,
    counterpartyId: 'acme',
    kind: 'aggregate',
    schemaRef: 'xiv.an.aggregate.v1',
    root,
  });
  await approveDataExchangeContract({
    tenantId,
    universeId,
    counterpartyId: 'acme',
    kind: 'capability',
    schemaRef: 'xiv.an.capability.v1',
    root,
  });
  const aggregate = await exchangePrivacyPreservingAggregate({
    tenantId,
    universeId,
    counterpartyId: 'acme',
    count: 12,
    contentHash: 'abc',
    actor: ordinary,
    root,
  });
  check('US-AN14', aggregate.allowed === true && aggregate.body?.originalTextMoved === false && aggregate.rawPooled === false, 'Privacy-preserving aggregate exchange moves counts/hashes, not original text.');

  const dump = await proposeEnterpriseExchange({
    kind: 'aggregate',
    tenantId,
    universeId,
    counterpartyId: 'acme',
    actor: ordinary,
    payload: { originalText: 'raw company dump' },
    root,
  });
  check('US-AN13-no-raw-under-contract', dump.allowed === false && dump.state === 'FAIL', 'Approved contracts still refuse raw private dumps.');

  const supply = await exchangeSupplyChainCapability({
    tenantId,
    universeId,
    counterpartyId: 'acme',
    capability: 'fulfill-widget',
    latencyMs: 40,
    actor: ordinary,
    root,
  });
  check('US-AN15', supply.allowed === true && (supply.body?.capability as { invoicesMoved?: boolean } | undefined)?.invoicesMoved === false, 'Supply-chain exchange shares capability, not raw invoices.');

  const sealed = await sealCeoRecord({
    tenantId,
    universeId,
    label: 'founder-priority-note',
    payload: 'SEALED_FOUNDER_PRIORITY_TOKEN',
    actor: ceo,
    root,
  });
  const sealedExchange = await proposeEnterpriseExchange({
    kind: 'permissioned_intelligence',
    tenantId,
    universeId,
    counterpartyId: 'acme',
    classification: 'sealed_founder_priority',
    sealedRecordId: sealed.record?.id,
    actor: ordinary,
    payload: { permissionedIntelligence: 'should-not-leak' },
    root,
  });
  check(
    'US-AN30-sealed',
    sealed.accepted === true &&
      sealedExchange.allowed === false &&
      sealedExchange.sealedLeaked === false &&
      JSON.stringify(sealedExchange.body).includes(SEALED_REDACTION) &&
      !JSON.stringify(sealedExchange.body).includes('SEALED_FOUNDER_PRIORITY_TOKEN'),
    'CEO-sealed records stay outside ordinary enterprise exchange and remain redacted.',
  );

  const cycle = await runInformationControlTowerCycle({
    tenantId,
    universeId,
    need: 'count supplier capability evidence without moving raw company files',
    domain: 'supply_chain',
    industry: 'logistics',
    partition: 'business',
    actor: ordinary,
    consequence: 'LOW',
    root,
  });
  check('US-AN20', cycle.query.aggregation === 'count' && cycle.query.minimizeMovement === true, 'Intent resolution selects count aggregation and minimize-movement.');
  check('US-AN22', cycle.hops.find((item) => item.hop === 'policy_filter')?.state === 'PASS', 'Policy filter hop executed.');
  check('US-AN23', cycle.translation.returnsRawRows === false, 'Semantic translation does not return raw rows.');
  check('US-AN24', cycle.hops.find((item) => item.hop === 'authorized_query')?.state === 'PASS', 'Authorized query hop executed locally.');
  check('US-AN25', cycle.packet.rawPooled === false && cycle.packet.originalTextMoved === false && cycle.packet.inventedPass === false, 'Evidence packet does not pool raw data or invent PASS.');
  check('US-AN26', cycle.gate.executableByAgent === true && cycle.hops.find((item) => item.hop === 'agent_workflow')?.state === 'PASS', 'Agent/workflow hop reuses the Decision Gate.');
  check('US-AN27', cycle.hops.find((item) => item.hop === 'outcome')?.state === 'PASS', 'Outcome hop recorded.');
  check('US-AN28', cycle.hops.find((item) => item.hop === 'route_learning')?.state === 'PASS', 'Route learning hop wrote the Learning Ledger.');
  check(
    'US-AN16',
    cycle.twins.some((item) => item.fastest) && cycle.twins.every((item) => item.usefulnessIsPopularity === false && item.usefulnessIsTruth === false),
    'Control-tower digital twins mark fastest/useful sources without treating usefulness as truth or popularity.',
  );
  check(
    'US-AN17',
    cycle.neuralStats.logicalPathways >= 1 && cycle.hops.map((item) => item.hop).join(',') === INFORMATION_ROUTING_LOOP.join(','),
    'Source-to-decision traceability walks every routing hop.',
  );
  check('US-AN29', cycle.hops.at(-1)?.hop === 'control_tower', 'Control tower is the terminal hop.');
  check('US-AN30-am', cycle.predecessorWaiting['62L-AM'] === 'WAITING_DATA', 'AM Data Fabric predecessor is WAITING_DATA on this parent.');
  check('US-AN30-al', cycle.predecessorWaiting['62L-AL'] === 'WAITING_DATA', 'AL Edge Sync predecessor is WAITING_DATA on this parent.');
  check('US-AN9-cycle', cycle.offline.selected.some((item) => item.filter.root.id === 'root-knowledge-lake'), 'Cycle offline routing keeps the Knowledge Lake.');
  check('US-AN8-cycle', cycle.failover.selected?.filter.root.kind !== 'provider' || cycle.failover.selected.filter.root.configured, 'Cycle failover does not invent an unconfigured provider.');
  check('US-AN3-cycle', cycle.multiPath[0]?.id === 'root-knowledge-lake' || cycle.multiPath[0]?.id === 'root-learning-ledger', 'Cycle scoring selected a local quality root, not the popular cloud.');
  check('US-AN3-cycle-pop', cycle.multiPath.every((item) => item.usedPopularity === false), 'Cycle scoring never used popularity.');

  const looped = await runInformationControlTowerCycle({
    tenantId,
    universeId,
    need: 'detect a retrieval loop',
    domain: 'supply_chain',
    injectLoopPath: ['root-knowledge-lake', 'peer', 'root-knowledge-lake'],
    actor: ordinary,
    root,
  });
  check('US-AN11-cycle', looped.loop.loop === true && looped.hops.find((item) => item.hop === 'authorized_query')?.state === 'FAIL', 'Injected route loop fails authorized query.');

  const bench = await benchmarkSemanticInternet({
    tenantId,
    universeId,
    roots: [highQualityLocal, popularStale],
    query,
  });
  check(
    'US-AN18',
    bench.winner === 'local-lake' && bench.popularityUsed === false && bench.inventedPass === false && bench.liveInternetBenchmark === 'NOT_TESTED',
    'Semantic-internet benchmark prefers the local quality root and does not invent a live-internet PASS.',
  );

  const health = await buildInformationControlTowerHealthReport(root);
  check(
    'US-AN29-health',
    health.productionAuthorization === false &&
      health.inventedPass === false &&
      health.rawCrossEnterprisePooling === false &&
      health.githubIssue52 === 'UNAVAILABLE' &&
      health.providers.every((item) => item.state === 'UNAVAILABLE') &&
      health.next.startsWith('62L-AO'),
    'Health report keeps locks false, providers UNAVAILABLE, and names 62L-AO only.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AN safety tests FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('62L-AN safety tests PASS');
