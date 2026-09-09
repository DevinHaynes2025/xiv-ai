import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resetAgentPopulation } from './agent-population';
import { sealCeoRecord, SEALED_REDACTION, readCeoSealedRecord } from './ceo-sealed-vault';
import { getRuntime } from './hybrid-runtime';
import { providerSlots } from './provider-fabric';
import { searchLearning } from './learning-ledger';
import { getIndustryTwin } from './industry-digital-twins';
import { SUPPLY_CHAIN_CYCLE, SUPPLY_CHAIN_LOCKS, NETWORK_ENTITY_KINDS, ANTI_COLLUSION_BOUNDARY } from './supply-chain-types';
import {
  allNetworkEntityKinds,
  entityHonesty,
  listNetworkEntities,
  readNetworkEntityAcrossUniverses,
  upsertNetworkEntity,
} from './supply-network-twins';
import { detectCollusionPattern, evaluateShareRequest, grantOperationalShare, probeInformationControlTower } from './sc-sharing-gate';
import { matchDemandToCapacity, runMultiEchelonScenario } from './demand-capacity';
import { proposeAlternateRoutes, proposeAlternateSources } from './source-route-planning';
import { carrierIntelligence, supplierIntelligence } from './supplier-carrier-intel';
import { probeInformationSupplyChain, probeKnowledgeLake, traceAcrossUniverses, traceEndToEnd } from './sc-traceability';
import { analyzeCostToServe, stressTestNetwork } from './sc-stress-cost';
import {
  buildControlTower,
  buildSupplyChainHealth,
  runSupplyChainCycle,
  seedSupplyNetwork,
} from './supply-chain-runtime';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lao-'));
const tenantId = '62lao-tenant';
const universeId = '62lao-universe-a';
const universeB = '62lao-universe-b';
const tenantB = '62lao-tenant-b';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

resetAgentPopulation();

try {
  check(
    'US-AO-cycle',
    SUPPLY_CHAIN_CYCLE.join(' → ') ===
      'business_need → supply_demand_capacity_signals → sharing_gate → network_twin → bottleneck_risk_analysis → agent_council → scenario → human_gate → recommendation → outcome → sla_cost_resilience_learning',
    'Operating loop hops are recorded in founder order.',
  );
  check(
    'US-AO-locks',
    SUPPLY_CHAIN_LOCKS.l4AutonomyEnabled === false &&
      SUPPLY_CHAIN_LOCKS.autoPurchase === false &&
      SUPPLY_CHAIN_LOCKS.autoContract === false &&
      SUPPLY_CHAIN_LOCKS.autoTrade === false &&
      SUPPLY_CHAIN_LOCKS.collusionAllowed === false &&
      SUPPLY_CHAIN_LOCKS.coordinatedPricing === false &&
      SUPPLY_CHAIN_LOCKS.bidRigging === false &&
      SUPPLY_CHAIN_LOCKS.marketAllocation === false &&
      SUPPLY_CHAIN_LOCKS.csiExchange === false &&
      SUPPLY_CHAIN_LOCKS.rawPrivateDbMerge === false &&
      SUPPLY_CHAIN_LOCKS.inventedPartnership === false &&
      SUPPLY_CHAIN_LOCKS.simulationIsReality === false &&
      SUPPLY_CHAIN_LOCKS.ceoSealedReplicating === false &&
      SUPPLY_CHAIN_LOCKS.tipLand === false &&
      SUPPLY_CHAIN_LOCKS.guardianRlsWeaken === false,
    'Honesty locks remain false. L4=false. Tip-land=NO.',
  );

  const denied = await runSupplyChainCycle({
    id: 'story-unapproved',
    tenantId,
    universeId,
    title: 'Unapproved SC story',
    need: 'replenish sku',
    approved: false,
    root,
  });
  check('US-AO-approved', denied.state === 'denied' && denied.hops[0]?.state === 'DENIED', 'Unapproved stories are denied before the network twin.');

  const seeded = await seedSupplyNetwork({ tenantId, universeId, root });
  const kinds = new Set(seeded.map((entity) => entity.kind));
  check('US-AO1', kinds.has('supplier') && seeded.filter((entity) => entity.kind === 'supplier').length >= 2, 'Supplier twins exist as governed network entities.');
  check('US-AO2', kinds.has('carrier'), 'Carrier twins exist as governed network entities.');
  check('US-AO3', kinds.has('warehouse'), 'Warehouse twins exist as governed network entities.');
  check('US-AO4', kinds.has('plant'), 'Plant twins exist as governed network entities.');
  check('US-AO5', kinds.has('inventory'), 'Inventory twins exist as governed network entities.');
  check('US-AO6', kinds.has('order'), 'Order twins exist as governed network entities.');
  check('US-AO7', kinds.has('shipment'), 'Shipment twins exist as governed network entities.');
  check('US-AO8', kinds.has('demand'), 'Demand twins exist as governed network entities.');
  check('US-AO9', kinds.has('capacity'), 'Capacity twins exist as governed network entities.');
  check('US-AO10', kinds.has('exception'), 'Exception twins exist as governed network entities.');
  check('US-AO11', kinds.has('lead_time'), 'Lead-time twins exist as governed network entities.');
  check('US-AO12', kinds.has('service_level'), 'Service-level twins exist as governed network entities.');
  check('US-AO13', kinds.has('risk') && allNetworkEntityKinds().length === NETWORK_ENTITY_KINDS.length, 'Risk twins exist; all 13 entity kinds are registered.');

  const honesty = entityHonesty(seeded[0]);
  check(
    'US-AO-sim-not-fact',
    honesty.isReality === false &&
      honesty.physicalControl === false &&
      honesty.epistemicClass !== 'VERIFIED_FACT' &&
      honesty.partnershipClaimed === false &&
      seeded.every((entity) => entity.epistemicClass !== 'VERIFIED_FACT' && entity.partnershipClaimed === false),
    'Network twins are not reality, not physical control, and do not invent partnerships.',
  );

  const factDeny = await upsertNetworkEntity({
    tenantId,
    universeId,
    kind: 'inventory',
    label: 'cannot-be-fact',
    epistemicClass: 'FORECAST',
    root,
  })
    .then((entity) => entity.epistemicClass === 'FORECAST')
    .catch(() => false);
  let selfCertifyDenied = false;
  try {
    await upsertNetworkEntity({
      tenantId,
      universeId,
      kind: 'inventory',
      label: 'self-fact',
      epistemicClass: 'VERIFIED_FACT',
      root,
    });
  } catch (error) {
    selfCertifyDenied = error instanceof Error && error.message === 'NETWORK_TWIN_CANNOT_SELF_CERTIFY_AS_FACT';
  }
  check('US-AO-sim-gate', factDeny && selfCertifyDenied, 'Forecast stays forecast; twins cannot self-certify as verified fact.');

  const other = await upsertNetworkEntity({
    tenantId: tenantB,
    universeId: universeB,
    kind: 'supplier',
    label: 'secret-supplier-b',
    attributes: { fillRate: 0.99, unit_cost: 12 },
    root,
  });
  const listedA = await listNetworkEntities({ tenantId, universeId, root });
  const listedB = await listNetworkEntities({ tenantId: tenantB, universeId: universeB, root });
  const leaked = listedA.some((entity) => entity.id === other.id || entity.label === 'secret-supplier-b');
  const cross = await readNetworkEntityAcrossUniverses({
    id: other.id,
    fromTenantId: tenantId,
    fromUniverseId: universeId,
    targetTenantId: tenantB,
    targetUniverseId: universeB,
    root,
  });
  check(
    'US-AO27',
    leaked === false &&
      listedB.length === 1 &&
      'allowed' in cross &&
      cross.allowed === false &&
      cross.reason === 'UNIVERSE_ISOLATION' &&
      cross.leaked === false &&
      cross.rawDbMerge === false,
    'Enterprise universes stay isolated. Private entities do not leak. Raw DB merge is false.',
  );

  const merge = await evaluateShareRequest({
    fromTenantId: tenantB,
    fromUniverseId: universeB,
    toTenantId: tenantId,
    toUniverseId: universeId,
    purpose: 'copy private supplier tables',
    fields: ['shipment_status'],
    rawDbMerge: true,
    root,
  });
  check('US-AO27-merge', merge.allowed === false && merge.state === 'DENIED' && merge.reason === 'RAW_PRIVATE_DB_MERGE_DENIED' && merge.rawPrivateDbMerge === false, 'Raw private DB merge is denied at the sharing gate.');

  const price = await evaluateShareRequest({
    fromTenantId: tenantB,
    fromUniverseId: universeB,
    toTenantId: tenantId,
    toUniverseId: universeId,
    purpose: 'coordinate prices with the other enterprise',
    fields: ['price'],
    root,
  });
  const bids = await evaluateShareRequest({
    fromTenantId: tenantB,
    fromUniverseId: universeB,
    toTenantId: tenantId,
    toUniverseId: universeId,
    purpose: 'share cover bid with rival for the same RFP',
    fields: ['cover_bid'],
    root,
  });
  const alloc = await evaluateShareRequest({
    fromTenantId: tenantB,
    fromUniverseId: universeB,
    toTenantId: tenantId,
    toUniverseId: universeId,
    purpose: 'split the market by territory; you take west',
    fields: ['territory_split'],
    root,
  });
  const csi = await evaluateShareRequest({
    fromTenantId: tenantB,
    fromUniverseId: universeB,
    toTenantId: tenantId,
    toUniverseId: universeId,
    purpose: 'exchange competitor cost and unused capacity detail',
    fields: ['unit_cost', 'unused_capacity_detail'],
    root,
  });
  check(
    'US-AO28',
    price.allowed === false &&
      price.collusionPattern === 'coordinated_pricing' &&
      bids.allowed === false &&
      bids.collusionPattern === 'bid_rigging' &&
      alloc.allowed === false &&
      alloc.collusionPattern === 'market_allocation' &&
      csi.allowed === false &&
      csi.collusionPattern === 'csi_exchange' &&
      ANTI_COLLUSION_BOUNDARY.includes('coordinated pricing'),
    'Anti-collusion boundary denies coordinated pricing, bid rigging, market allocation, and CSI exchange.',
  );
  check(
    'US-AO28-detect',
    detectCollusionPattern({ purpose: 'price fixing cartel' }) === 'coordinated_pricing' &&
      detectCollusionPattern({ purpose: 'bid rotation scheme' }) === 'bid_rigging' &&
      detectCollusionPattern({ purpose: 'allocate customers between us' }) === 'market_allocation',
    'Collusion detectors fire on language, not only explicit pattern flags.',
  );

  const grant = await grantOperationalShare({
    fromTenantId: tenantB,
    fromUniverseId: universeB,
    toTenantId: tenantId,
    toUniverseId: universeId,
    fields: ['shipment_status', 'public_delay_reason'],
    purpose: 'notify inbound delay on a shared shipment',
    root,
  });
  assert.ok('id' in grant && !('allowed' in grant && grant.allowed === false), 'operational grant should be accepted');
  const operational = await evaluateShareRequest({
    fromTenantId: tenantB,
    fromUniverseId: universeB,
    toTenantId: tenantId,
    toUniverseId: universeId,
    purpose: 'notify inbound delay on a shared shipment',
    fields: ['shipment_status', 'public_delay_reason'],
    values: { shipment_status: 'delayed', public_delay_reason: 'port congestion' },
    grantId: 'id' in grant ? grant.id : undefined,
    root,
  });
  check(
    'US-AO27-ops',
    operational.allowed === true &&
      operational.leakedPrivateRecords === false &&
      operational.fieldsReleased.includes('shipment_status') &&
      !operational.fieldsReleased.includes('price' as never),
    'Sharing gate may release allowlisted operational summaries after an explicit grant. CSI is not included.',
  );

  const demand = seeded.find((entity) => entity.kind === 'demand')!;
  const capacity = seeded.find((entity) => entity.kind === 'capacity')!;
  const match = await matchDemandToCapacity({
    tenantId,
    universeId,
    demandId: demand.id,
    capacityId: capacity.id,
    root,
  });
  check(
    'US-AO14',
    'id' in match &&
      match.epistemicClass === 'SIMULATION' &&
      match.isVerifiedFact === false &&
      match.purchaseExecuted === false &&
      match.coveredUnits === 70 &&
      match.shortfallUnits === 20,
    'Demand-capacity matching is a simulation recommendation. No purchase executed. Observed cover 70 / shortfall 20.',
  );

  const crossMatch = await matchDemandToCapacity({
    tenantId,
    universeId,
    demandId: demand.id,
    capacityId: capacity.id,
    counterpartyTenantId: tenantB,
    counterpartyUniverseId: universeB,
    root,
  });
  check('US-AO14-iso', 'allowed' in crossMatch && crossMatch.allowed === false && crossMatch.purchaseExecuted === false, 'Cross-enterprise unused-capacity matching is denied (CSI / collusion risk).');

  const sources = await proposeAlternateSources({ tenantId, universeId, root });
  const routes = await proposeAlternateRoutes({ tenantId, universeId, root });
  check('US-AO15', sources.kind === 'source' && sources.options.length >= 2 && sources.selected === null && sources.purchaseExecuted === false, 'Alternate source planning recommends options. Nothing is selected or purchased.');
  check('US-AO16', routes.kind === 'route' && routes.options.length >= 2 && routes.bookingExecuted === false && routes.isVerifiedFact === false, 'Alternate route planning is a simulation. No booking executed.');

  const echelons = await runMultiEchelonScenario({ tenantId, universeId, root });
  check('US-AO17', echelons.echelons.length >= 4 && echelons.epistemicClass === 'SIMULATION' && echelons.isVerifiedFact === false, 'Multi-echelon scenario walks supplier→plant→warehouse→carrier without claiming fact.');

  const suppliers = await supplierIntelligence({ tenantId, universeId, root });
  const carriers = await carrierIntelligence({ tenantId, universeId, root });
  check('US-AO18', suppliers.length >= 2 && suppliers.every((row) => row.partnershipClaimed === false && row.inventedPartnership === false && row.isVerifiedFact === false), 'Supplier intelligence does not invent partnerships or verified facts.');
  check('US-AO19', carriers.length >= 2 && carriers.every((row) => row.kind === 'carrier' && row.partnershipClaimed === false), 'Carrier intelligence is hypothesis/unknown, not a partnership claim.');

  const warehouse = seeded.find((entity) => entity.kind === 'warehouse')!;
  const plant = seeded.find((entity) => entity.kind === 'plant')!;
  const warehouseTwin = await getIndustryTwin(warehouse.twinId, tenantId, universeId, root);
  const plantTwin = await getIndustryTwin(plant.twinId, tenantId, universeId, root);
  check(
    'US-AO20',
    warehouse.twinKind === 'supply_chain' &&
      warehouseTwin?.kind === 'supply_chain' &&
      warehouseTwin.isReality === false &&
      warehouseTwin.physicalControl === false,
    'Warehouse twin reuses AH supply_chain industry twin highway. Simulation, not physical control.',
  );
  check(
    'US-AO21',
    plant.twinKind === 'manufacturing' &&
      plantTwin?.kind === 'manufacturing' &&
      plant.physicalControl === false &&
      plantTwin?.epistemicClass === 'SIMULATION',
    'Manufacturing/plant twin reuses AH manufacturing highway. No physical control.',
  );

  const trace = await traceEndToEnd({ tenantId, universeId, root });
  const am = probeInformationSupplyChain();
  const lake = probeKnowledgeLake();
  check(
    'US-AO22',
    trace.stages.length === 12 &&
      trace.amModule === 'WAITING_DATA' &&
      am.state === 'WAITING_DATA' &&
      lake.state === 'WAITING_DATA' &&
      !am.modulePresent &&
      !lake.modulePresent,
    'Information-supply-chain overlay records AM stages. 62L-AM/AB remain WAITING_DATA (not invented PASS).',
  );
  check('US-AO23', trace.chain.length >= 4 && trace.isVerifiedFact === false, 'End-to-end traceability walks in-universe echelons. Trace is not a verified fact.');

  const crossTrace = await traceAcrossUniverses({
    fromTenantId: tenantId,
    fromUniverseId: universeId,
    toTenantId: tenantB,
    toUniverseId: universeB,
    entityId: other.id,
    root,
  });
  check('US-AO23-iso', crossTrace.allowed === false && crossTrace.leaked === false && crossTrace.share.reason === 'RAW_PRIVATE_DB_MERGE_DENIED', 'Cross-universe traceability cannot merge private DBs.');

  const stress = await stressTestNetwork({ tenantId, universeId, shock: 'carrier outage (simulation)', root });
  check('US-AO24', stress.epistemicClass === 'SIMULATION' && stress.isVerifiedFact === false && stress.physicalControl === false, 'Stress testing is a simulation. It does not actuate the physical network.');

  const cost = await analyzeCostToServe({ tenantId, universeId, root });
  check('US-AO25', cost.verifiedSavings === false && cost.projectedSavingsAreNotMeasured === true && cost.purchaseExecuted === false && cost.isVerifiedFact === false, 'Cost-to-serve is a simulation. Projected savings are not measured.');

  const tower = await buildControlTower({ tenantId, universeId, root });
  check(
    'US-AO26',
    tower.liveTms === false &&
      tower.liveWms === false &&
      tower.isVerifiedFact === false &&
      tower.entityCounts.supplier >= 2 &&
      tower.entityCounts.warehouse >= 1,
    'Global supply-chain control tower is a simulated overlay. Live TMS/WMS are not claimed.',
  );

  const purchase = await runSupplyChainCycle({
    id: 'story-purchase',
    tenantId,
    universeId,
    title: 'Buy more units',
    need: 'cover simulated shortfall',
    approved: true,
    commercialAction: 'purchase',
    seedNetwork: false,
    root,
  });
  const contract = await runSupplyChainCycle({
    id: 'story-contract',
    tenantId,
    universeId,
    title: 'Sign carrier contract',
    need: 'lock capacity',
    approved: true,
    commercialAction: 'contract',
    seedNetwork: false,
    root,
  });
  const trade = await runSupplyChainCycle({
    id: 'story-trade',
    tenantId,
    universeId,
    title: 'Trade inventory position',
    need: 'hedge',
    approved: true,
    commercialAction: 'trade',
    seedNetwork: false,
    root,
  });
  const humanHop = purchase.hops.find((item) => item.hop === 'human_gate');
  check(
    'US-AO29',
    purchase.state === 'denied' &&
      contract.state === 'denied' &&
      trade.state === 'denied' &&
      humanHop?.state === 'DENIED' &&
      purchase.recommendation?.executableByAgent === false &&
      purchase.recommendation?.purchaseExecuted === false &&
      contract.recommendation?.contractExecuted === false &&
      trade.recommendation?.tradeExecuted === false,
    'Human gate blocks autonomous purchase, contract, and trade. Agents recommend only.',
  );

  const collusiveCycle = await runSupplyChainCycle({
    id: 'story-collude',
    tenantId,
    universeId,
    title: 'Align prices',
    need: 'stabilize market',
    approved: true,
    shareWith: {
      tenantId: tenantB,
      universeId: universeB,
      purpose: 'coordinate prices with the other enterprise',
      fields: ['price'],
    },
    seedNetwork: false,
    root,
  });
  check(
    'US-AO28-cycle',
    collusiveCycle.state === 'denied' && collusiveCycle.hops.some((item) => item.hop === 'sharing_gate' && item.state === 'DENIED'),
    'Operating loop denies collusive sharing at the sharing-gate hop.',
  );

  const happy = await runSupplyChainCycle({
    id: 'story-ok',
    tenantId,
    universeId,
    title: 'Cover shortfall with alternate source (recommendation)',
    need: 'cover simulated shortfall without purchasing',
    approved: true,
    commercialAction: 'none',
    seedNetwork: false,
    root,
  });
  const hopNames = happy.hops.map((item) => item.hop);
  check(
    'US-AO30',
    happy.state === 'completed' &&
      hopNames.join(',') === SUPPLY_CHAIN_CYCLE.join(',') &&
      happy.hops.every((item) => item.hop === 'outcome' || item.hop === 'human_gate' || item.state === 'PASS' || item.state === 'WAITING_DATA') &&
      happy.recommendation?.executableByAgent === false &&
      happy.controlTower?.liveTms === false,
    'Full operating loop ran. Outcome is WAITING_DATA until independently observed. Recommendation is not executable by agent.',
  );

  const learned = await searchLearning('sc-cycle', root);
  check('US-AO30-learn', learned.some((entry) => entry.domain === 'supply_chain' && entry.permissionChange === false && entry.productionChange === false), 'SLA/cost/resilience learning writes to the Learning Ledger without permission or production changes.');

  const an = probeInformationControlTower();
  check('US-AO-AN', an.state === 'WAITING_DATA' && an.modulePresent === false, '62L-AN Information Control Tower is WAITING_DATA on this AH parent. Not invented PASS.');

  const sealed = await sealCeoRecord({
    tenantId,
    universeId,
    label: 'CEO sealed freight strategy',
    payload: 'CEO_SEALED_SECRET_do_not_replicate',
    actor: { kind: 'ceo_principal', id: 'ceo-test' },
    root,
  });
  const peerRead = await readCeoSealedRecord({
    recordId: sealed.record?.id ?? 'missing',
    tenantId,
    universeId,
    actor: { kind: 'peer', id: 'mesh-peer' },
    root,
  });
  check(
    'US-AO-sealed',
    sealed.accepted === true &&
      sealed.record?.sealedPayload === SEALED_REDACTION &&
      peerRead.allowed === false &&
      SUPPLY_CHAIN_LOCKS.ceoSealedReplicating === false,
    'CEO-sealed records stay non-replicating. Ordinary mesh peers cannot read the payload.',
  );

  const providers = providerSlots();
  const aws = getRuntime('aws');
  check(
    'US-AO-providers',
    providers.every((slot) => slot.state === 'UNAVAILABLE' || slot.configured) &&
      aws.state === 'UNAVAILABLE' &&
      aws.configured === false,
    'Unconfigured providers remain UNAVAILABLE. None were invented as verified.',
  );

  const health = await buildSupplyChainHealth({ tenantId, universeId, root });
  check(
    'US-AO-health',
    health.phase === '62L-AO' &&
      health.tipLand === false &&
      health.inventedPass === false &&
      health.productionAuthorization === false &&
      health.predecessors['62L-AN'].state === 'WAITING_DATA' &&
      health.predecessors['62L-AM'].state === 'WAITING_DATA' &&
      health.predecessors['62L-AH'].present === true &&
      health.liveTms === false,
    'Health report records WAITING_DATA for AN/AM, parent AH present, tip-land=NO, no invented PASS.',
  );

  const ids = [
    'US-AO1', 'US-AO2', 'US-AO3', 'US-AO4', 'US-AO5', 'US-AO6', 'US-AO7', 'US-AO8', 'US-AO9', 'US-AO10',
    'US-AO11', 'US-AO12', 'US-AO13', 'US-AO14', 'US-AO15', 'US-AO16', 'US-AO17', 'US-AO18', 'US-AO19', 'US-AO20',
    'US-AO21', 'US-AO22', 'US-AO23', 'US-AO24', 'US-AO25', 'US-AO26', 'US-AO27', 'US-AO28', 'US-AO29', 'US-AO30',
  ];
  check('US-AO-ids', ids.length === 30, 'Thirty founder-paste story IDs are assigned (GitHub issue #53 was unreadable).');
} catch (error) {
  failures.push(`UNCAUGHT: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AO safety tests FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('62L-AO safety tests PASS');
