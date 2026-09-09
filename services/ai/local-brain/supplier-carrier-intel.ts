import { listNetworkEntities, type NetworkEntity } from './supply-network-twins';
import { retrieveEvidencePathway } from './cortex-evidence';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { SIMULATION_IS_NOT_FACT, SUPPLY_CHAIN_LOCKS } from './supply-chain-types';

export type NodeIntelligence = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: 'supplier' | 'carrier';
  entityId: string;
  label: string;
  score: number;
  evidenceRefs: string[];
  partnershipClaimed: false;
  inventedPartnership: false;
  epistemicClass: 'HYPOTHESIS' | 'UNKNOWN';
  isVerifiedFact: false;
  notes: string[];
  createdAt: string;
};

type Store = { intel: NodeIntelligence[] };

function storePath(root: string) {
  return xivLocalPath(root, 'sc-node-intel.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { intel: [] });
  return { intel: Array.isArray(parsed.intel) ? parsed.intel : [] };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), { intel: store.intel.slice(-2_000) });
}

function scoreEntity(entity: NetworkEntity, evidenceCount: number) {
  const fill = typeof entity.attributes.fillRate === 'number' ? entity.attributes.fillRate : 0.5;
  const onTime = typeof entity.attributes.onTimeRatio === 'number' ? entity.attributes.onTimeRatio : 0.5;
  const base = entity.kind === 'carrier' ? onTime : fill;
  return Math.max(0, Math.min(1, 0.4 * base + 0.2 * Math.min(1, evidenceCount / 3) + 0.1));
}

async function scoreKind(input: {
  tenantId: string;
  universeId: string;
  kind: 'supplier' | 'carrier';
  root?: string;
}): Promise<NodeIntelligence[]> {
  const root = input.root ?? process.cwd();
  const entities = await listNetworkEntities({ tenantId: input.tenantId, universeId: input.universeId, kind: input.kind, root });
  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: `${input.kind} performance`,
    root,
  });
  const store = await load(root);
  const rows: NodeIntelligence[] = entities.map((entity) => {
    const row: NodeIntelligence = {
      id: cortexId('scint'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: input.kind,
      entityId: entity.id,
      label: entity.label,
      score: scoreEntity(entity, evidence.evidenceRefs.length),
      evidenceRefs: evidence.evidenceRefs.slice(0, 8),
      partnershipClaimed: false,
      inventedPartnership: false,
      epistemicClass: evidence.evidenceRefs.length ? 'HYPOTHESIS' : 'UNKNOWN',
      isVerifiedFact: false,
      notes: [
        SIMULATION_IS_NOT_FACT,
        'Supplier/carrier record is not a partnership. Partnerships are never invented.',
        `inventedFacts=${evidence.inventedFacts}; locks.inventedPartnership=${SUPPLY_CHAIN_LOCKS.inventedPartnership}`,
      ],
      createdAt: new Date().toISOString(),
    };
    store.intel.push(row);
    return row;
  });
  await save(root, store);
  return rows;
}

export function supplierIntelligence(input: { tenantId: string; universeId: string; root?: string }) {
  return scoreKind({ ...input, kind: 'supplier' });
}

export function carrierIntelligence(input: { tenantId: string; universeId: string; root?: string }) {
  return scoreKind({ ...input, kind: 'carrier' });
}
