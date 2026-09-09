import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { conveneDepartmentCouncil } from './department-councils';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { rememberCortexTrace } from './memory-cortex';
import { getRuntime } from './hybrid-runtime';
import { providerSlots } from './provider-fabric';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  SUPPLY_CHAIN_CYCLE,
  SUPPLY_CHAIN_LOCKS,
  type EvidenceState,
  type SupplyChainHop,
} from './supply-chain-types';
import { allNetworkEntityKinds, listNetworkEntities, upsertNetworkEntity, type NetworkEntity } from './supply-network-twins';
import { evaluateShareRequest, probeInformationControlTower, type ShareDecision } from './sc-sharing-gate';
import { matchDemandToCapacity, runMultiEchelonScenario } from './demand-capacity';
import { proposeAlternateRoutes, proposeAlternateSources } from './source-route-planning';
import { carrierIntelligence, supplierIntelligence } from './supplier-carrier-intel';
import { probeInformationSupplyChain, probeKnowledgeLake, traceEndToEnd } from './sc-traceability';
import { analyzeCostToServe, stressTestNetwork } from './sc-stress-cost';

export { SUPPLY_CHAIN_CYCLE, SUPPLY_CHAIN_LOCKS };

export type CommercialAction = 'none' | 'purchase' | 'contract' | 'trade' | 'book_carrier';

export type SupplyChainStory = {
  id: string;
  tenantId: string;
  universeId: string;
  title: string;
  need: string;
  approved: boolean;
  commercialAction?: CommercialAction;
  consequence?: ConsequenceClass;
  production?: boolean;
  permissionChange?: boolean;
  shareWith?: { tenantId: string; universeId: string; purpose: string; fields: string[]; rawDbMerge?: boolean };
  seedNetwork?: boolean;
};

export type SupplyHopRecord = {
  hop: SupplyChainHop;
  state: EvidenceState | 'DENIED';
  summary: string;
  at: string;
};

export type SupplyRecommendation = {
  id: string;
  text: string;
  executableByAgent: false;
  purchaseExecuted: false;
  contractExecuted: false;
  tradeExecuted: false;
  epistemicClass: 'SIMULATION' | 'HYPOTHESIS';
};

export type ControlTowerView = {
  tenantId: string;
  universeId: string;
  entityCounts: Record<string, number>;
  exceptionCount: number;
  bottleneck: string | null;
  liveTms: false;
  liveWms: false;
  epistemicClass: 'SIMULATION';
  isVerifiedFact: false;
};

export type SupplyCycleRecord = {
  id: string;
  storyId: string;
  tenantId: string;
  universeId: string;
  hops: SupplyHopRecord[];
  entityIds: string[];
  shareDecisionId?: string;
  matchId?: string;
  scenarioId?: string;
  recommendation: SupplyRecommendation | null;
  controlTower: ControlTowerView | null;
  founderImpersonation: false;
  l4AutonomyEnabled: false;
  productionAuthorization: false;
  state: 'completed' | 'denied' | 'waiting_data' | 'unavailable';
  createdAt: string;
  updatedAt: string;
};

type Store = { cycles: SupplyCycleRecord[] };

function storePath(root: string) {
  return xivLocalPath(root, 'supply-chain-runtime.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { cycles: [] });
  return { cycles: Array.isArray(parsed.cycles) ? parsed.cycles : [] };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), { cycles: store.cycles.slice(-2_000) });
}

function hop(name: SupplyChainHop, state: SupplyHopRecord['state'], summary: string): SupplyHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

function modulePresent(file: string) {
  return existsSync(join(dirname(fileURLToPath(import.meta.url)), file));
}

const SEED: Array<{ kind: NetworkEntity['kind']; label: string; attributes: Record<string, number | string> }> = [
  { kind: 'supplier', label: 'primary-supplier', attributes: { fillRate: 0.93 } },
  { kind: 'supplier', label: 'alternate-supplier', attributes: { fillRate: 0.81 } },
  { kind: 'carrier', label: 'primary-carrier', attributes: { onTimeRatio: 0.91 } },
  { kind: 'carrier', label: 'alternate-carrier', attributes: { onTimeRatio: 0.84 } },
  { kind: 'warehouse', label: 'dc-east', attributes: { utilization: 0.72 } },
  { kind: 'plant', label: 'plant-a', attributes: { throughput: 100 } },
  { kind: 'inventory', label: 'sku-100', attributes: { onHand: 250 } },
  { kind: 'order', label: 'order-1', attributes: { quantity: 80 } },
  { kind: 'shipment', label: 'ship-1', attributes: { units: 80, shipment_status: 'in_transit' } },
  { kind: 'demand', label: 'demand-1', attributes: { units: 90 } },
  { kind: 'capacity', label: 'capacity-1', attributes: { availableUnits: 110, committedUnits: 40 } },
  { kind: 'exception', label: 'port-delay', attributes: { severity: 0.4 } },
  { kind: 'lead_time', label: 'inbound-lt', attributes: { leadTimeDays: 12 } },
  { kind: 'service_level', label: 'otif-target', attributes: { otif: 0.88 } },
  { kind: 'risk', label: 'single-source-risk', attributes: { riskIndex: 0.3 } },
];

export async function seedSupplyNetwork(input: { tenantId: string; universeId: string; root?: string }) {
  const created: NetworkEntity[] = [];
  for (const item of SEED) {
    created.push(
      await upsertNetworkEntity({
        tenantId: input.tenantId,
        universeId: input.universeId,
        kind: item.kind,
        label: item.label,
        attributes: item.attributes,
        root: input.root,
      }),
    );
  }
  return created;
}

export async function buildControlTower(input: { tenantId: string; universeId: string; root?: string }): Promise<ControlTowerView> {
  const entities = await listNetworkEntities(input);
  const entityCounts: Record<string, number> = {};
  for (const kind of allNetworkEntityKinds()) {
    entityCounts[kind] = entities.filter((entity) => entity.kind === kind).length;
  }
  const exceptionCount = entityCounts.exception ?? 0;
  const risk = entities.find((entity) => entity.kind === 'risk' || entity.kind === 'exception');
  return {
    tenantId: input.tenantId,
    universeId: input.universeId,
    entityCounts,
    exceptionCount,
    bottleneck: risk?.label ?? null,
    liveTms: false,
    liveWms: false,
    epistemicClass: 'SIMULATION',
    isVerifiedFact: false,
  };
}

function commercialGate(action: CommercialAction, consequence: ConsequenceClass, production: boolean, permissionChange: boolean) {
  const financial = action === 'purchase' || action === 'trade' || action === 'book_carrier';
  const legal = action === 'contract';
  return decisionGate({
    id: cortexId('sc-gate'),
    action: `supply-chain ${action}`,
    consequence: financial || legal ? 'HIGH' : consequence,
    production,
    financialCommitment: financial,
    legalCommitment: legal,
    permissionChange,
    externalPublication: false,
  });
}

export async function runSupplyChainCycle(input: SupplyChainStory & { root?: string }): Promise<SupplyCycleRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const cycle: SupplyCycleRecord = {
    id: cortexId('sccycle'),
    storyId: input.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    hops: [],
    entityIds: [],
    recommendation: null,
    controlTower: null,
    founderImpersonation: false,
    l4AutonomyEnabled: false,
    productionAuthorization: false,
    state: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const persist = async () => {
    cycle.updatedAt = new Date().toISOString();
    const store = await load(root);
    const index = store.cycles.findIndex((item) => item.id === cycle.id);
    if (index >= 0) store.cycles[index] = cycle;
    else store.cycles.push(cycle);
    await save(root, store);
  };

  if (!input.approved || input.production === true || input.permissionChange === true) {
    cycle.hops.push(hop('business_need', 'DENIED', 'Story was not approved, or requested production/permission change.'));
    cycle.state = 'denied';
    await persist();
    return cycle;
  }
  cycle.hops.push(hop('business_need', 'PASS', `Approved business need: ${input.need}`));

  const seeded = input.seedNetwork === false ? [] : await seedSupplyNetwork({ tenantId: input.tenantId, universeId: input.universeId, root });
  const existing = seeded.length ? seeded : await listNetworkEntities({ tenantId: input.tenantId, universeId: input.universeId, root });
  cycle.entityIds = existing.map((entity) => entity.id);
  const demand = existing.find((entity) => entity.kind === 'demand');
  const capacity = existing.find((entity) => entity.kind === 'capacity');
  cycle.hops.push(
    hop(
      'supply_demand_capacity_signals',
      demand && capacity ? 'PASS' : 'WAITING_DATA',
      `signals demand=${demand?.id ?? 'none'} capacity=${capacity?.id ?? 'none'}; epistemicClass=SIMULATION`,
    ),
  );

  let share: ShareDecision;
  if (input.shareWith) {
    share = await evaluateShareRequest({
      fromTenantId: input.tenantId,
      fromUniverseId: input.universeId,
      toTenantId: input.shareWith.tenantId,
      toUniverseId: input.shareWith.universeId,
      purpose: input.shareWith.purpose,
      fields: input.shareWith.fields,
      rawDbMerge: input.shareWith.rawDbMerge,
      root,
    });
  } else {
    share = await evaluateShareRequest({
      fromTenantId: input.tenantId,
      fromUniverseId: input.universeId,
      toTenantId: input.tenantId,
      toUniverseId: input.universeId,
      purpose: 'same-universe operational signals',
      fields: ['shipment_status'],
      values: { shipment_status: 'in_transit' },
      root,
    });
  }
  cycle.shareDecisionId = share.id;
  cycle.hops.push(hop('sharing_gate', share.state, share.reason));
  if (!share.allowed && input.shareWith) {
    cycle.state = 'denied';
    await persist();
    return cycle;
  }

  const tower = await buildControlTower({ tenantId: input.tenantId, universeId: input.universeId, root });
  cycle.controlTower = tower;
  cycle.hops.push(
    hop(
      'network_twin',
      existing.length >= 13 && tower.isVerifiedFact === false ? 'PASS' : 'FAIL',
      `entities=${existing.length}; kinds=${allNetworkEntityKinds().length}; liveTms=${tower.liveTms}; sim≠fact`,
    ),
  );

  const stress = await stressTestNetwork({ tenantId: input.tenantId, universeId: input.universeId, root });
  const cost = await analyzeCostToServe({ tenantId: input.tenantId, universeId: input.universeId, root });
  const scenario = await runMultiEchelonScenario({ tenantId: input.tenantId, universeId: input.universeId, root });
  cycle.scenarioId = scenario.id;
  cycle.hops.push(
    hop(
      'bottleneck_risk_analysis',
      stress.isVerifiedFact || cost.isVerifiedFact ? 'FAIL' : 'PASS',
      `stress=${stress.id}; costIndex=${cost.estimatedCostIndex}; bottleneck=${scenario.bottleneck?.label ?? 'none'}; verifiedSavings=${cost.verifiedSavings}`,
    ),
  );

  const council = await conveneDepartmentCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'business',
    topic: `Supply-chain recommendation for ${input.need}. Do not coordinate prices, bids, or market allocation. Do not invent partnerships.`,
    maxRounds: 1,
    root,
  });
  cycle.hops.push(
    hop(
      'agent_council',
      council.consensusForced === false && council.productionAuthorized === false ? 'PASS' : 'FAIL',
      `council=${council.id}; consensusForced=${council.consensusForced}; productionAuthorized=${council.productionAuthorized}`,
    ),
  );

  const sources = await proposeAlternateSources({ tenantId: input.tenantId, universeId: input.universeId, root });
  const routes = await proposeAlternateRoutes({ tenantId: input.tenantId, universeId: input.universeId, root });
  const match =
    demand && capacity
      ? await matchDemandToCapacity({
          tenantId: input.tenantId,
          universeId: input.universeId,
          demandId: demand.id,
          capacityId: capacity.id,
          root,
        })
      : { allowed: false as const, reason: 'NO_DEMAND_CAPACITY', purchaseExecuted: false as const };
  if ('id' in match) cycle.matchId = match.id;
  await supplierIntelligence({ tenantId: input.tenantId, universeId: input.universeId, root });
  await carrierIntelligence({ tenantId: input.tenantId, universeId: input.universeId, root });
  const trace = await traceEndToEnd({ tenantId: input.tenantId, universeId: input.universeId, root });
  cycle.hops.push(
    hop(
      'scenario',
      sources.bookingExecuted === false && routes.purchaseExecuted === false && trace.isVerifiedFact === false ? 'PASS' : 'FAIL',
      `sources=${sources.options.length}; routes=${routes.options.length}; echelons=${scenario.echelons.length}; traceLinks=${trace.chain.length}`,
    ),
  );

  const action = input.commercialAction ?? 'none';
  const gate = commercialGate(action, input.consequence ?? 'LOW', false, false);
  cycle.hops.push(hop('human_gate', gate.executableByAgent ? 'PASS' : 'DENIED', `${gate.reason} action=${action}`));

  const recommendation: SupplyRecommendation = {
    id: cortexId('screc'),
    text: `Recommend humans review demand-capacity match, alternate sources (${sources.options.length}), and routes (${routes.options.length}). No autonomous purchase/contract/trade.`,
    executableByAgent: false,
    purchaseExecuted: false,
    contractExecuted: false,
    tradeExecuted: false,
    epistemicClass: 'HYPOTHESIS',
  };
  cycle.recommendation = recommendation;
  const recState = action === 'none' || !gate.executableByAgent ? 'PASS' : 'FAIL';
  cycle.hops.push(
    hop(
      'recommendation',
      recState,
      `${recommendation.text} executableByAgent=${recommendation.executableByAgent}`,
    ),
  );

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: `Supply-chain cycle ${cycle.id} recorded a recommendation, not a commercial execution.`,
      payload: { cycleId: cycle.id, action, purchaseExecuted: false },
    },
    root,
  );
  cycle.hops.push(hop('outcome', 'WAITING_DATA', 'No independently observed commercial outcome was supplied. UNKNOWN/WAITING_DATA is valid.'));

  const learning = await appendLearning({
    domain: 'supply_chain',
    subject: `sc-cycle:${cycle.id}`,
    claimState: 'MODEL_INFERENCE',
    summary: `SLA/cost/resilience learning from simulated cycle ${cycle.id}; costIndex=${cost.estimatedCostIndex}; stress=${stress.shock}; purchaseExecuted=false`,
    sourceRefs: [`cycle:${cycle.id}`],
    evidence: [stress.id, cost.id],
    taskId: cycle.id,
  }, root);
  await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'lesson',
    claimState: 'MODEL_INFERENCE',
    label: `sc-cycle ${cycle.id}`,
    summary: learning.summary,
    evidenceRefs: [learning.id],
    classification: 'internal',
    root,
  });
  cycle.hops.push(
    hop(
      'sla_cost_resilience_learning',
      learning.permissionChange === false && learning.productionChange === false ? 'PASS' : 'FAIL',
      `learning=${learning.id}; permissionChange=${learning.permissionChange}; productionChange=${learning.productionChange}`,
    ),
  );

  if (action !== 'none') cycle.state = 'denied';
  await persist();
  return cycle;
}

export async function listSupplyCycles(input: { tenantId: string; universeId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return store.cycles.filter((cycle) => cycle.tenantId === input.tenantId && cycle.universeId === input.universeId);
}

export type SupplyChainHealth = {
  phase: '62L-AO';
  parent: string;
  hops: typeof SUPPLY_CHAIN_CYCLE;
  locks: typeof SUPPLY_CHAIN_LOCKS;
  predecessors: Record<string, { state: EvidenceState; present: boolean; reason: string }>;
  providers: Array<{ provider: string; state: string; configured: boolean }>;
  cycles: number;
  completed: number;
  denied: number;
  liveTms: false;
  liveWms: false;
  productionAuthorization: false;
  inventedPass: false;
  tipLand: false;
};

export async function buildSupplyChainHealth(input: { tenantId: string; universeId: string; root?: string }): Promise<SupplyChainHealth> {
  const cycles = await listSupplyCycles(input);
  const an = probeInformationControlTower();
  const am = probeInformationSupplyChain();
  const lake = probeKnowledgeLake();
  const providers = [
    ...providerSlots().map((slot) => ({ provider: slot.provider, state: slot.state, configured: slot.configured })),
    { provider: 'aws-runtime', state: getRuntime('aws').state, configured: getRuntime('aws').configured },
  ];
  return {
    phase: '62L-AO',
    parent: '62L-AH',
    hops: SUPPLY_CHAIN_CYCLE,
    locks: SUPPLY_CHAIN_LOCKS,
    predecessors: {
      '62L-AN': { state: 'WAITING_DATA', present: an.modulePresent, reason: an.reason },
      '62L-AM': { state: 'WAITING_DATA', present: am.modulePresent, reason: am.reason },
      '62L-AB': { state: 'WAITING_DATA', present: lake.modulePresent, reason: 'Knowledge Lake module is not on this AH parent; knowledge-graph overlay used.' },
      '62L-AH': { state: modulePresent('industry-digital-twins.ts') ? 'PASS' : 'WAITING_DATA', present: modulePresent('industry-digital-twins.ts'), reason: 'Causal world / industry twins are the parent of this child.' },
      '62L-AG': { state: modulePresent('department-councils.ts') ? 'PASS' : 'WAITING_DATA', present: modulePresent('department-councils.ts'), reason: 'Agent society department councils reused for the SC council hop.' },
    },
    providers,
    cycles: cycles.length,
    completed: cycles.filter((cycle) => cycle.state === 'completed').length,
    denied: cycles.filter((cycle) => cycle.state === 'denied').length,
    liveTms: false,
    liveWms: false,
    productionAuthorization: false,
    inventedPass: false,
    tipLand: false,
  };
}

export async function writeSupplyChainHealth(root = process.cwd()) {
  const tenantId = process.env.XIV_TENANT_ID ?? 'local-tenant';
  const universeId = process.env.XIV_UNIVERSE_ID ?? 'local-universe';
  const report = await buildSupplyChainHealth({ tenantId, universeId, root });
  const path = xivLocalPath(root, 'supply-chain-health.json');
  await writeJsonFileAtomic(path, report);
  return { path, report };
}
