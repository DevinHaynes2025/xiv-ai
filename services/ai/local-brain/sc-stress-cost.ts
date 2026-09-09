import { listNetworkEntities } from './supply-network-twins';
import { runMonteCarlo, runSensitivity } from './causal-simulation';
import { runOptimizationWorkcell } from './optimization-workcells';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { SIMULATION_IS_NOT_FACT, SUPPLY_CHAIN_LOCKS } from './supply-chain-types';

export type StressTestResult = {
  id: string;
  tenantId: string;
  universeId: string;
  shock: string;
  survivingEchelons: number;
  bottleneckLabel: string | null;
  epistemicClass: 'SIMULATION';
  isVerifiedFact: false;
  physicalControl: false;
  simulationId?: string;
  notes: string[];
  createdAt: string;
};

export type CostToServeResult = {
  id: string;
  tenantId: string;
  universeId: string;
  estimatedCostIndex: number;
  epistemicClass: 'SIMULATION';
  isVerifiedFact: false;
  verifiedSavings: false;
  projectedSavingsAreNotMeasured: true;
  purchaseExecuted: false;
  notes: string[];
  createdAt: string;
};

type Store = { stress: StressTestResult[]; costs: CostToServeResult[] };

function storePath(root: string) {
  return xivLocalPath(root, 'sc-stress-cost.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { stress: [], costs: [] });
  return {
    stress: Array.isArray(parsed.stress) ? parsed.stress : [],
    costs: Array.isArray(parsed.costs) ? parsed.costs : [],
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), {
    stress: store.stress.slice(-2_000),
    costs: store.costs.slice(-2_000),
  });
}

export async function stressTestNetwork(input: {
  tenantId: string;
  universeId: string;
  shock?: string;
  root?: string;
}): Promise<StressTestResult> {
  const root = input.root ?? process.cwd();
  const entities = await listNetworkEntities({ tenantId: input.tenantId, universeId: input.universeId, root });
  const plant = entities.find((entity) => entity.kind === 'plant' || entity.kind === 'warehouse' || entity.kind === 'supplier');
  let simulationId: string | undefined;
  if (plant) {
    const monte = await runMonteCarlo({
      tenantId: input.tenantId,
      universeId: input.universeId,
      twinId: plant.twinId,
      hypothesisIds: [],
      seed: 62062,
      root,
    });
    simulationId = monte.id;
  }
  const risk = entities.find((entity) => entity.kind === 'risk' || entity.kind === 'exception');
  const result: StressTestResult = {
    id: cortexId('scstress'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    shock: input.shock ?? 'lead-time +40% (simulation)',
    survivingEchelons: entities.length,
    bottleneckLabel: risk?.label ?? plant?.label ?? null,
    epistemicClass: 'SIMULATION',
    isVerifiedFact: false,
    physicalControl: false,
    simulationId,
    notes: [SIMULATION_IS_NOT_FACT, 'Stress test does not actuate plants, carriers, or warehouses.'],
    createdAt: new Date().toISOString(),
  };
  const store = await load(root);
  store.stress.push(result);
  await save(root, store);
  return result;
}

export async function analyzeCostToServe(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}): Promise<CostToServeResult> {
  const root = input.root ?? process.cwd();
  const entities = await listNetworkEntities({ tenantId: input.tenantId, universeId: input.universeId, root });
  const order = entities.find((entity) => entity.kind === 'order' || entity.kind === 'shipment' || entity.kind === 'warehouse');
  let estimatedCostIndex = 1;
  if (order) {
    const sensitivity = await runSensitivity({
      tenantId: input.tenantId,
      universeId: input.universeId,
      twinId: order.twinId,
      hypothesisIds: [],
      root,
    });
    estimatedCostIndex = 1 + Math.abs(sensitivity.sensitivity?.[0]?.outputDelta ?? 0.05);
    await runOptimizationWorkcell({
      tenantId: input.tenantId,
      universeId: input.universeId,
      twinId: order.twinId,
      objective: 'Minimize simulated cost-to-serve without actuation or purchase',
      consequence: 'HIGH',
      production: false,
      root,
    });
  }
  const result: CostToServeResult = {
    id: cortexId('sccost'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    estimatedCostIndex,
    epistemicClass: 'SIMULATION',
    isVerifiedFact: false,
    verifiedSavings: false,
    projectedSavingsAreNotMeasured: true,
    purchaseExecuted: false,
    notes: [
      SIMULATION_IS_NOT_FACT,
      'Projected cost-to-serve is not measured savings. Humans own commercial actions.',
      `autoPurchase=${SUPPLY_CHAIN_LOCKS.autoPurchase}`,
    ],
    createdAt: new Date().toISOString(),
  };
  const store = await load(root);
  store.costs.push(result);
  await save(root, store);
  return result;
}
