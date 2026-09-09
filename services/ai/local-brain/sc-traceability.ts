import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listNetworkEntities, readNetworkEntityAcrossUniverses, type NetworkEntity } from './supply-network-twins';
import { evaluateShareRequest } from './sc-sharing-gate';
import { upsertKnowledgeNode } from './knowledge-graph';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { SIMULATION_IS_NOT_FACT } from './supply-chain-types';

export const INFO_SUPPLY_STAGES = [
  'SOURCE',
  'INGEST',
  'CLASSIFY',
  'VERIFY',
  'ROUTE',
  'STORE',
  'INDEX',
  'ANALYZE',
  'DECIDE',
  'ACT',
  'MEASURE',
  'LEARN',
] as const;

export type TraceLink = {
  fromId: string;
  toId: string;
  fromKind: string;
  toKind: string;
};

export type TraceabilityRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  chain: TraceLink[];
  stages: typeof INFO_SUPPLY_STAGES;
  epistemicClass: 'SIMULATION';
  isVerifiedFact: false;
  amModule: 'WAITING_DATA';
  knowledgeLake: 'WAITING_DATA' | 'UNAVAILABLE';
  notes: string[];
  createdAt: string;
};

type Store = { traces: TraceabilityRecord[] };

function storePath(root: string) {
  return xivLocalPath(root, 'sc-traceability.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { traces: [] });
  return { traces: Array.isArray(parsed.traces) ? parsed.traces : [] };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), { traces: store.traces.slice(-2_000) });
}

export function probeInformationSupplyChain(): { state: 'WAITING_DATA'; modulePresent: boolean; reason: string } {
  const dir = dirname(fileURLToPath(import.meta.url));
  const present = ['information-supply-chain.ts', 'data-fabric.ts', 'info-supply-chain.ts'].some((file) => existsSync(join(dir, file)));
  return {
    state: 'WAITING_DATA',
    modulePresent: present,
    reason: present
      ? 'AM-named module exists locally but 62L-AM report was not the parent of this child.'
      : '62L-AM Information Supply Chain is not on this AH parent. AO overlays info-supply stages onto the network twin without duplicating AM.',
  };
}

export function probeKnowledgeLake(): { state: 'WAITING_DATA' | 'UNAVAILABLE'; modulePresent: boolean } {
  const present = existsSync(join(dirname(fileURLToPath(import.meta.url)), 'knowledge-lake.ts'));
  return {
    state: present ? 'WAITING_DATA' : 'WAITING_DATA',
    modulePresent: present,
  };
}

const TRACE_ORDER = ['supplier', 'plant', 'inventory', 'warehouse', 'shipment', 'carrier', 'order'] as const;

export async function traceEndToEnd(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}): Promise<TraceabilityRecord> {
  const root = input.root ?? process.cwd();
  const entities = await listNetworkEntities({ tenantId: input.tenantId, universeId: input.universeId, root });
  const ordered = TRACE_ORDER.map((kind) => entities.find((entity) => entity.kind === kind)).filter(
    (entity): entity is NetworkEntity => Boolean(entity),
  );
  const chain: TraceLink[] = [];
  for (let i = 0; i < ordered.length - 1; i += 1) {
    chain.push({
      fromId: ordered[i].id,
      toId: ordered[i + 1].id,
      fromKind: ordered[i].kind,
      toKind: ordered[i + 1].kind,
    });
  }

  const am = probeInformationSupplyChain();
  const lake = probeKnowledgeLake();
  await upsertKnowledgeNode(
    {
      id: `sc-trace-${input.tenantId}-${input.universeId}`,
      type: 'entity',
      domain: 'supply_chain',
      label: 'supply-chain trace overlay',
      summary: `Trace of ${ordered.length} nodes. Info-supply stages recorded. AM=${am.state}. Lake present=${lake.modulePresent}.`,
      claimState: 'MODEL_INFERENCE',
      sourceRefs: ordered.map((entity) => entity.id),
      classification: 'internal',
    },
    root,
  );

  const record: TraceabilityRecord = {
    id: cortexId('sctrace'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    chain,
    stages: INFO_SUPPLY_STAGES,
    epistemicClass: 'SIMULATION',
    isVerifiedFact: false,
    amModule: 'WAITING_DATA',
    knowledgeLake: lake.modulePresent ? 'WAITING_DATA' : 'WAITING_DATA',
    notes: [SIMULATION_IS_NOT_FACT, am.reason, 'Traceability is universe-scoped. Cross-universe raw merge is denied.'],
    createdAt: new Date().toISOString(),
  };
  const store = await load(root);
  store.traces.push(record);
  await save(root, store);
  return record;
}

export async function traceAcrossUniverses(input: {
  fromTenantId: string;
  fromUniverseId: string;
  toTenantId: string;
  toUniverseId: string;
  entityId: string;
  root?: string;
}) {
  const isolated = await readNetworkEntityAcrossUniverses({
    id: input.entityId,
    fromTenantId: input.fromTenantId,
    fromUniverseId: input.fromUniverseId,
    targetTenantId: input.toTenantId,
    targetUniverseId: input.toUniverseId,
    root: input.root,
  });
  if ('allowed' in isolated && isolated.allowed === false) {
    const share = await evaluateShareRequest({
      fromTenantId: input.toTenantId,
      fromUniverseId: input.toUniverseId,
      toTenantId: input.fromTenantId,
      toUniverseId: input.fromUniverseId,
      purpose: 'end-to-end private trace merge',
      fields: ['unit_cost'],
      rawDbMerge: true,
      root: input.root,
    });
    return { allowed: false as const, isolated, share, leaked: false as const };
  }
  return { allowed: true as const, isolated, leaked: false as const };
}
