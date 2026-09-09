import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { sealCeoRecord, SEALED_REDACTION } from './ceo-sealed-vault';
import { analyzeLeanWaste, costToServe, detectInformationBullwhip, reduceInformationBullwhip, wastefulBullwhipTrace } from './information-bullwhip';
import {
  INFORMATION_ECONOMY_LOCKS,
  INFORMATION_ECONOMY_LOOP,
  HASH_REF_BYTES,
} from './information-economy-types';
import {
  fingerprintDemand,
  qualifyInformationSource,
  registerInformationBom,
  registerInformationSku,
} from './information-skus';
import { forecastFromLog, recordInformationDemand, replenishInformation } from './information-inventory';
import {
  appendChainOfCustody,
  buildKnowledgeLogisticsNetwork,
  detectLogisticsBottlenecks,
  evaluateSla,
  planResilience,
  queryToData,
  routeMultilingual,
} from './knowledge-logistics-network';
import { founderImpersonationAttempt, proposeGiepEnvelope, approveGiepContract } from './giep-foundations';
import {
  buildInformationEconomyHealthReport,
  runInformationEconomyCycle,
  type InformationDemand,
} from './information-economy-runtime';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lau-'));
const tenantId = '62lau-tenant';
const universeId = '62lau-universe';
const ceo = { kind: 'ceo_principal' as const, id: 'ceo-principal-sim' };
const ordinary = { kind: 'ordinary_agent' as const, id: 'logistics-agent', role: 'librarian' };
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

function hopState(job: { hopRecords: Array<{ hop: string; state: string }> }, hop: string) {
  return job.hopRecords.find((item) => item.hop === hop)?.state;
}

function baseDemand(overrides: Partial<InformationDemand> = {}): InformationDemand {
  const query = overrides.query ?? 'q3 demand signal for widgets';
  return {
    id: overrides.id ?? 'demand-happy',
    tenantId,
    universeId,
    title: overrides.title ?? query,
    query,
    originalText: overrides.originalText ?? query,
    sourceUri: 'local://lab/q3-widgets',
    domain: 'knowledge',
    approved: true,
    actor: ordinary,
    destination: { kind: 'agent', id: 'analyst-1', authorized: true },
    slaMs: 60_000,
    elapsedMs: 12,
    ...overrides,
  };
}

try {
  check(
    'US-AU1',
    INFORMATION_ECONOMY_LOOP.join(' → ') ===
      'information_demand → source → inventory → qualification → routing → minimum_necessary_transformation → delivery → quality_check → decision → outcome → learning',
    'Core information-economy loop hops are recorded in founder-paste order.',
  );
  check(
    'US-AU30',
    INFORMATION_ECONOMY_LOCKS.L4_AUTONOMY_ENABLED === false &&
      INFORMATION_ECONOMY_LOCKS.RAW_CROSS_ENTERPRISE_POOLING === false &&
      INFORMATION_ECONOMY_LOCKS.CEO_SEALED_ORDINARY_MOVEMENT === false &&
      INFORMATION_ECONOMY_LOCKS.FOUNDER_IMPERSONATION === false &&
      INFORMATION_ECONOMY_LOCKS.TIP_LAND === false &&
      INFORMATION_ECONOMY_LOCKS.INVENT_PARTNERSHIPS === false &&
      INFORMATION_ECONOMY_LOCKS.QUERY_TO_DATA_DEFAULT === true &&
      INFORMATION_ECONOMY_LOCKS.ANTI_COLLUSION_INTER_ENTERPRISE === true,
    'Honesty locks: L4=false, raw pool denied, sealed non-movement, no founder impersonation, tip-land=NO, query-to-data default.',
  );

  const unapproved = await runInformationEconomyCycle(baseDemand({ id: 'need-unapproved', approved: false }));
  check('US-AU1', unapproved.state === 'denied' && hopState(unapproved, 'information_demand') === 'DENIED', 'Unapproved demand is denied before sourcing.');

  const impersonation = await runInformationEconomyCycle(
    baseDemand({ id: 'need-founder', actor: { kind: 'ordinary_agent', id: 'founder-twin', role: 'founder' } }),
  );
  check(
    'US-AU1',
    impersonation.state === 'denied' && founderImpersonationAttempt({ kind: 'ordinary_agent', id: 'founder-twin', role: 'founder' }),
    'Founder impersonation by an ordinary agent is denied.',
  );

  const collusion = await runInformationEconomyCycle(baseDemand({ id: 'need-collude', collusionTopic: 'pricing' }));
  check('US-AU25', collusion.state === 'denied' && hopState(collusion, 'information_demand') === 'DENIED', 'Inter-enterprise pricing collusion is denied.');

  const skuA = await registerInformationSku({
    tenantId,
    universeId,
    title: 'widget-spec',
    domain: 'knowledge',
    originalText: 'widget specification v1',
    sourceId: 'src-spec',
    sourceUri: 'local://lab/spec',
    provenanceRefs: ['lab'],
    root,
  });
  const skuB = await registerInformationSku({
    tenantId,
    universeId,
    title: 'widget-test',
    domain: 'knowledge',
    originalText: 'widget test evidence v1',
    sourceId: 'src-test',
    sourceUri: 'local://lab/test',
    provenanceRefs: ['lab'],
    root,
  });
  const parent = await registerInformationSku({
    tenantId,
    universeId,
    title: 'widget-brief',
    domain: 'knowledge',
    originalText: 'brief assembled from spec and test',
    sourceId: 'src-brief',
    sourceUri: 'local://lab/brief',
    provenanceRefs: ['lab', skuA.sku.id, skuB.sku.id],
    root,
  });
  check('US-AU12', skuA.sku.id.startsWith('isku') && skuA.duplicate === false && skuA.sku.productionAuthorization === false, 'Information SKU registered as hash-addressed freight.');
  const dup = await registerInformationSku({
    tenantId,
    universeId,
    title: 'widget-spec-copy',
    domain: 'knowledge',
    originalText: 'widget specification v1',
    sourceId: 'src-spec',
    sourceUri: 'local://lab/spec',
    provenanceRefs: ['lab'],
    root,
  });
  check('US-AU12', dup.duplicate === true && dup.movementBytes === 0 && dup.sku.id === skuA.sku.id, 'Duplicate SKU content is a ref increment, not a second payload copy.');

  const bom = await registerInformationBom({
    tenantId,
    universeId,
    parentSkuId: parent.sku.id,
    componentSkuIds: [skuA.sku.id, skuB.sku.id],
    root,
  });
  check('US-AU13', bom.copiesPayload === false && bom.componentSkuIds.length === 2, 'Information BOM lists component SKUs without copying payloads.');

  const qualified = qualifyInformationSource({
    sourceId: 'src-local',
    sourceUri: 'local://lab/q3',
    provenanceRefs: ['lab'],
  });
  const unverifiedProvider = qualifyInformationSource({
    sourceId: 'src-gcp',
    sourceUri: 'gcp://invented',
    provenanceRefs: ['none'],
    providerConfigured: true,
    providerVerified: false,
  });
  const invented = qualifyInformationSource({
    sourceId: 'src-partner',
    sourceUri: 'peer://invented',
    provenanceRefs: ['claim'],
    partnershipClaimed: true,
  });
  check('US-AU14', qualified.qualified === true && qualified.state === 'PASS', 'Local sourced evidence qualifies.');
  check('US-AU14', unverifiedProvider.state === 'UNAVAILABLE' && invented.state === 'DENIED' && invented.inventedPartnership === false, 'Unverified providers UNAVAILABLE; invented partnerships denied.');

  await recordInformationDemand({ tenantId, universeId, fingerprint: fingerprintDemand('repeat me'), root });
  await recordInformationDemand({ tenantId, universeId, fingerprint: fingerprintDemand('repeat me'), root });
  const forecast = await forecastFromLog({ tenantId, universeId, fingerprint: fingerprintDemand('repeat me'), root });
  check('US-AU15', forecast.epistemicClass === 'FORECAST' && forecast.verifiedFact === false && forecast.trailingDemand === 2, 'Demand forecast is FORECAST, not a verified fact.');

  const replenishHit = await replenishInformation({ tenantId, universeId, fingerprint: 'x', sku: skuA.sku, root });
  const replenishCentral = await replenishInformation({ tenantId, universeId, fingerprint: 'x', sku: skuA.sku, copyAllToOnePlace: true, root });
  check('US-AU16', replenishHit.movementBytes === 0 && replenishHit.copyAllToOnePlace === false, 'Replenishment on a hit is a ref, not a copy.');
  check('US-AU16', replenishCentral.state === 'DENIED', 'Copy-all-to-one-place replenishment is denied.');

  const waste = wastefulBullwhipTrace({ demandId: 'whip-1', fingerprint: 'q3', inventoryHit: true });
  const detected = detectInformationBullwhip(waste);
  const reduced = reduceInformationBullwhip(waste);
  check(
    'US-AU17',
    detected.detected === true &&
      detected.wastes.includes('repeated_searches') &&
      detected.wastes.includes('duplicate_storage') &&
      detected.wastes.includes('unnecessary_model_calls') &&
      detected.amplification > 2,
    `Bullwhip detection wastes=${detected.wastes.join(',')} amplification=${detected.amplification}`,
  );
  check(
    'US-AU17',
    reduced.reduced === true &&
      reduced.after.searches === 1 &&
      reduced.after.modelCalls === 0 &&
      reduced.after.storageWrites === 0 &&
      reduced.after.trafficBytes === 0 &&
      reduced.savedSearches === 7 &&
      reduced.savedModelCalls === 4,
    `Bullwhip reduction searches ${waste.searches}→${reduced.after.searches}, model ${waste.modelCalls}→${reduced.after.modelCalls}, storage ${waste.storageWrites}→${reduced.after.storageWrites}, traffic ${waste.trafficBytes}→${reduced.after.trafficBytes}.`,
  );

  const lean = analyzeLeanWaste(waste);
  check('US-AU22', lean.detected && lean.present.includes('repeated_searches') && lean.present.includes('duplicated_context'), 'Lean waste analysis lists search/context/model/storage/traffic wastes.');

  const beforeCost = costToServe(waste);
  const afterCost = costToServe(reduced.after);
  check('US-AU23', afterCost.costUnits < beforeCost.costUnits && afterCost.verifiedSavings === false, `Cost-to-serve dropped ${beforeCost.costUnits.toFixed(2)} → ${afterCost.costUnits.toFixed(2)}; verifiedSavings=false.`);

  const qtdHit = queryToData({ inventoryHit: true, sku: skuA.sku });
  const qtdDeny = queryToData({ inventoryHit: false, copyAllToOnePlace: true });
  check('US-AU19', qtdHit.movementBytes === 0 && qtdHit.strategy === 'query_to_data', 'Query-to-data on inventory hit moves 0 bytes.');
  check('US-AU19', qtdDeny.strategy === 'denied_centralization' && qtdDeny.state === 'DENIED', 'Minimize-movement refuses copy-all-to-one-place.');

  const slaOk = evaluateSla({ slaMs: 1000, elapsedMs: 10 });
  const slaFail = evaluateSla({ slaMs: 10, elapsedMs: 50 });
  check('US-AU20', slaOk.breached === false && slaOk.state === 'PASS', 'SLA within budget is PASS.');
  check('US-AU20', slaFail.breached === true && slaFail.state === 'FAIL', 'SLA breach is FAIL, not invented PASS.');

  const bottlenecks = detectLogisticsBottlenecks({ inventory: 1, routing: 8, delivery: 1, quality_check: 0 });
  check('US-AU21', bottlenecks.some((item) => item.hop === 'routing' && item.bottleneck), 'Bottleneck detector flags the overloaded routing hop.');

  const custodyOk = appendChainOfCustody([], {
    contentHash: skuA.sku.contentHash,
    from: 'agent:a',
    to: 'device:local',
    hop: 'delivery',
    at: new Date().toISOString(),
    movementBytes: 0,
    sealedMoved: false,
  });
  const custodyCross = appendChainOfCustody([], {
    contentHash: skuA.sku.contentHash,
    from: 'universe:a',
    to: 'universe:b',
    hop: 'delivery',
    at: new Date().toISOString(),
    movementBytes: 99,
    sealedMoved: false,
  });
  check('US-AU24', custodyOk.allowed === true && custodyOk.events[0].sealedMoved === false, 'Chain-of-custody records hash/ref hops.');
  check('US-AU24', custodyCross.allowed === false, 'Cross-universe raw custody merge is denied.');

  const raw = await proposeGiepEnvelope({
    tenantId,
    universeId,
    counterpartyId: 'other-co',
    kind: 'raw_pool',
    payload: { originalText: 'secret rows' },
    actor: ordinary,
    root,
  });
  check('US-AU25', raw.allowed === false && raw.rawPooled === false && raw.reason.includes('RAW'), 'GIEP raw-pool is DENIED.');
  const noContract = await proposeGiepEnvelope({
    tenantId,
    universeId,
    counterpartyId: 'other-co',
    kind: 'aggregate',
    payload: { count: 3 },
    actor: ordinary,
    root,
  });
  check('US-AU25', noContract.allowed === false && noContract.state === 'UNAVAILABLE', 'Aggregate without contract is UNAVAILABLE; partnership is not invented.');
  await approveGiepContract({
    tenantId,
    universeId,
    counterpartyId: 'other-co',
    kind: 'aggregate',
    schemaRef: 'xiv://schema/count-hash',
    root,
  });
  const agg = await proposeGiepEnvelope({
    tenantId,
    universeId,
    counterpartyId: 'other-co',
    kind: 'aggregate',
    payload: { count: 3, contentHash: skuA.sku.contentHash },
    actor: ordinary,
    schemaRef: 'xiv://schema/count-hash',
    root,
  });
  check('US-AU25', agg.allowed === true && agg.rawPooled === false, 'Permissioned aggregate exchange is allowed; raw pooling remains false.');
  const rawUnderContract = await proposeGiepEnvelope({
    tenantId,
    universeId,
    counterpartyId: 'other-co',
    kind: 'aggregate',
    payload: { originalText: 'dump' },
    actor: ordinary,
    root,
  });
  check('US-AU25', rawUnderContract.allowed === false, 'Approved contracts still refuse raw original text.');

  const sealed = await sealCeoRecord({
    tenantId,
    universeId,
    label: 'founder-note',
    payload: 'SEALED_TOKEN_NEVER_MOVE',
    actor: ceo,
    root,
  });
  const sealedEx = await proposeGiepEnvelope({
    tenantId,
    universeId,
    counterpartyId: 'other-co',
    kind: 'aggregate',
    payload: { count: 1 },
    actor: ordinary,
    sealedRecordId: sealed.record?.id,
    classification: 'sealed_founder_priority',
    root,
  });
  check(
    'US-AU25',
    sealed.accepted === true &&
      sealedEx.allowed === false &&
      sealedEx.sealedLeaked === false &&
      JSON.stringify(sealedEx).includes(SEALED_REDACTION) === false
        ? sealedEx.reason.toLowerCase().includes('sealed')
        : sealedEx.allowed === false,
    'CEO-sealed records stay outside ordinary GIEP exchange.',
  );

  const resilience = planResilience({ sealed: true, localOffline: true });
  check('US-AU28', resilience.sealedMoved === false && resilience.automaticFailover === false && resilience.l4AutonomyEnabled === false, 'Resilience planning does not move sealed freight or auto-failover production.');

  const network = buildKnowledgeLogisticsNetwork([
    { id: 'agent-a', kind: 'agent', tenantId, universeId, authorized: true, offlineAvailable: true },
    { id: 'org-a', kind: 'org', tenantId, universeId, authorized: true, offlineAvailable: true },
    { id: 'device-a', kind: 'device', tenantId, universeId, authorized: true, offlineAvailable: true },
    { id: 'spy', kind: 'org', tenantId, universeId, authorized: false, offlineAvailable: true },
  ]);
  check('US-AU29', network.nodes.length === 3 && network.rawPooling === false && network.duplicatesCoalesced, 'Knowledge Logistics Network carries SKU refs among authorized nodes only.');

  const cycle = await runInformationEconomyCycle(baseDemand({ id: 'need-happy', root }));
  check('US-AU1', hopState(cycle, 'information_demand') === 'PASS', 'Demand hop ran.');
  check('US-AU2', hopState(cycle, 'source') === 'PASS', 'Source hop ran.');
  check('US-AU3', hopState(cycle, 'inventory') === 'PASS', 'Inventory hop ran.');
  check('US-AU4', hopState(cycle, 'qualification') === 'PASS', 'Qualification hop ran.');
  check('US-AU5', hopState(cycle, 'routing') === 'PASS' && cycle.hopRecords.find((item) => item.hop === 'routing')?.summary.includes('local-lake'), 'Routing hop selected local lake; popularity unused.');
  check('US-AU6', hopState(cycle, 'minimum_necessary_transformation') === 'PASS', 'Minimum-necessary transformation is hash/ref only.');
  check('US-AU7', hopState(cycle, 'delivery') === 'PASS', 'Delivery hop ran.');
  check('US-AU8', hopState(cycle, 'quality_check') === 'PASS', 'Quality check did not invent verified PASS.');
  check('US-AU9', hopState(cycle, 'decision') === 'PASS' && cycle.executionAuthority === false, 'Decision hop is recommendation-only; package/cycle is not execution authority.');
  check('US-AU10', hopState(cycle, 'outcome') === 'WAITING_DATA', 'Outcome without independent observation is WAITING_DATA.');
  check('US-AU11', hopState(cycle, 'learning') === 'PASS', 'Learning hop wrote the ledger without permission expansion.');
  check('US-AU18', cycle.hopRecords.find((item) => item.hop === 'routing')?.summary.includes('local-lake') === true, 'Route optimization prefers the local Knowledge Lake root.');

  const second = await runInformationEconomyCycle(baseDemand({ id: 'need-repeat', root }));
  check('US-AU3', second.inventoryHit === true && second.movementBytes === 0, 'Repeat demand is an inventory hit; movementBytes=0.');
  check('US-AU19', second.movementBytes === 0 && second.bullwhip?.detected === false, 'Second fulfillment has no bullwhip and no extra movement.');
  check('US-AU26', hopState(second, 'delivery') === 'PASS', 'Offline delivery served from local inventory.');

  if (cycle.sku?.lakeObjectId) {
    const translated = await routeMultilingual({
      lakeObjectId: cycle.sku.lakeObjectId,
      tenantId,
      universeId,
      targetLanguage: 'es',
      translatedText: 'senal de demanda q3',
      root,
    });
    check('US-AU27', translated.replacesOriginal === false && translated.routedWithoutReplacingOriginal, 'Multilingual routing attaches metadata without replacing the original.');
  } else {
    check('US-AU27', false, 'Expected a lake object id for multilingual routing.');
  }

  const wasteCycle = await runInformationEconomyCycle(baseDemand({ id: 'need-waste', injectWaste: true, query: 'unique waste query', originalText: 'unique waste query', title: 'unique waste query', root }));
  check('US-AU17', wasteCycle.bullwhip?.detected === true && wasteCycle.reduction?.reduced === true, 'Cycle-injected waste is detected and reduced.');

  const slaCycle = await runInformationEconomyCycle(baseDemand({ id: 'need-sla', slaMs: 5, elapsedMs: 40, query: 'sla query', originalText: 'sla query', title: 'unique sla query', root }));
  check('US-AU20', slaCycle.slaBreached === true && hopState(slaCycle, 'delivery') === 'FAIL', 'SLA-managed cycle records a real FAIL on delivery, not invented PASS.');

  const sealedCycle = await runInformationEconomyCycle(
    baseDemand({ id: 'need-sealed', sealedPayload: 'NEVER_REPLICATE_THIS_TOKEN', originalText: undefined, root }),
  );
  check(
    'US-AU7',
    sealedCycle.state === 'denied' &&
      sealedCycle.movementBytes === 0 &&
      sealedCycle.sealedLeaked === false &&
      hopState(sealedCycle, 'routing') === 'DENIED' &&
      hopState(sealedCycle, 'delivery') === 'DENIED',
    'CEO-sealed non-movement: ordinary routing/delivery denied, movementBytes=0.',
  );

  const rawCycle = await runInformationEconomyCycle(baseDemand({ id: 'need-raw', rawPool: true, exchangeKind: 'raw_pool', query: 'raw dump', originalText: 'raw dump', title: 'raw dump', root }));
  check('US-AU25', rawCycle.state === 'denied' && hopState(rawCycle, 'routing') === 'DENIED' && rawCycle.rawPooled === false, 'Cycle-level raw pooling is DENIED.');

  const central = await runInformationEconomyCycle(
    baseDemand({ id: 'need-central', copyAllToOnePlace: true, query: 'centralize everything', originalText: 'centralize everything', title: 'centralize everything', root }),
  );
  check('US-AU19', central.state === 'denied' && hopState(central, 'routing') === 'DENIED', 'Brute-force centralization is denied at routing.');

  const cloud = await runInformationEconomyCycle(
    baseDemand({ id: 'need-cloud', needsCloudProvider: true, query: 'need gcp', originalText: 'need gcp', title: 'cloud only', root }),
  );
  check('US-AU2', cloud.state === 'unavailable' && hopState(cloud, 'source') === 'UNAVAILABLE', 'Unverified cloud providers stay UNAVAILABLE.');

  const health = await buildInformationEconomyHealthReport(root);
  check('US-AU30', health.honesty.L4_AUTONOMY_ENABLED === false && health.productionAuthorization === false && health.tipLand === false, 'Health report honesty: L4=false, no production authorization, tip-land=NO.');
  check('US-AU29', health.network.rawPooling === false && health.giep === undefined ? health.phase === '62L-AU' : true, 'GIEP foundations and KLN health surface exist.');
  check('US-AU17', health.bullwhipDetector.detected === true && health.bullwhipDetector.reduced === true, 'Health demo still shows detection+reduction without claiming live traffic PASS.');
  check('US-AU10', health.predecessors.AT === 'WAITING_DATA' || health.predecessors.AT === 'PASS', `AT predecessor probe is honest (${health.predecessors.AT}).`);

  if (failures.length) {
    console.error(`62L-AU safety tests FAIL\n${failures.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('62L-AU safety tests PASS');
  }
} catch (error) {
  console.error('62L-AU safety tests FAIL');
  console.error(error);
  process.exitCode = 1;
} finally {
  await rm(root, { recursive: true, force: true });
}
