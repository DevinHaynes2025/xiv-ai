import { listNetworkEntities } from './supply-network-twins';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { SIMULATION_IS_NOT_FACT, SUPPLY_CHAIN_LOCKS } from './supply-chain-types';

export type AlternatePlan = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: 'source' | 'route';
  options: Array<{ label: string; entityId: string; score: number }>;
  selected: null;
  epistemicClass: 'SIMULATION';
  isVerifiedFact: false;
  bookingExecuted: false;
  purchaseExecuted: false;
  notes: string[];
  createdAt: string;
};

type Store = { plans: AlternatePlan[] };

function storePath(root: string) {
  return xivLocalPath(root, 'sc-source-route.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { plans: [] });
  return { plans: Array.isArray(parsed.plans) ? parsed.plans : [] };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), { plans: store.plans.slice(-2_000) });
}

async function plan(input: {
  tenantId: string;
  universeId: string;
  kind: 'source' | 'route';
  root?: string;
}): Promise<AlternatePlan> {
  const root = input.root ?? process.cwd();
  const kind = input.kind === 'source' ? 'supplier' : 'carrier';
  const entities = await listNetworkEntities({ tenantId: input.tenantId, universeId: input.universeId, kind, root });
  const options = entities.map((entity, index) => ({
    label: entity.label,
    entityId: entity.id,
    score: Math.max(0, 1 - index * 0.1),
  }));
  const record: AlternatePlan = {
    id: cortexId('scplan'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    options,
    selected: null,
    epistemicClass: 'SIMULATION',
    isVerifiedFact: false,
    bookingExecuted: false,
    purchaseExecuted: false,
    notes: [
      SIMULATION_IS_NOT_FACT,
      'Agents recommend alternates. Humans own source/route selection, purchases, and bookings.',
      `autoPurchase=${SUPPLY_CHAIN_LOCKS.autoPurchase}`,
    ],
    createdAt: new Date().toISOString(),
  };
  const store = await load(root);
  store.plans.push(record);
  await save(root, store);
  return record;
}

export function proposeAlternateSources(input: { tenantId: string; universeId: string; root?: string }) {
  return plan({ ...input, kind: 'source' });
}

export function proposeAlternateRoutes(input: { tenantId: string; universeId: string; root?: string }) {
  return plan({ ...input, kind: 'route' });
}
