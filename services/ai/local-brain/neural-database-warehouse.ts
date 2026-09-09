import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { federateAgenticQuery } from './agentic-database';
import type { SealedActor } from './hybrid-edge-cloud-types';
import {
  FEDERATION_PERMISSION_REQUIRED,
  type BaActor,
  type DataTier,
} from './neural-database-types';
import { federationPermissionGate, planReplication } from './neural-database-planning';
import { guardSealedDataPlacement, syncPolicyAcrossTiers } from './neural-database-guards';

export type LineageEdge = {
  id: string;
  from: string;
  to: string;
  transform: string;
  at: string;
  productionAuthorization: false;
};

export type LineageGraph = {
  entity: string;
  edges: LineageEdge[];
  notes: string;
};

export function recordLineage(input: {
  entity: string;
  from: string;
  to: string;
  transform: string;
}): LineageEdge {
  return {
    id: `lin_${randomUUID()}`,
    from: input.from,
    to: input.to,
    transform: input.transform,
    at: new Date().toISOString(),
    productionAuthorization: false,
  };
}

export function buildLineageGraph(input: { entity: string; edges: LineageEdge[] }): LineageGraph {
  return {
    entity: input.entity,
    edges: input.edges,
    notes: 'Lineage is advisory provenance. Label ≠ access; recommendation ≠ deploy.',
  };
}

export type FederatedQueryResult = {
  state: 'AVAILABLE' | 'DENIED';
  reason: string;
  rows: unknown[];
  productionWrite: false;
};

export async function runPermissionedFederatedQuery(input: {
  tenantId: string;
  authorizedUniverses: string[];
  requestedUniverses: string[];
  table?: string;
  actor: BaActor;
  federated: boolean;
  root?: string;
}): Promise<FederatedQueryResult> {
  const gate = federationPermissionGate({
    federated: input.federated,
    authorizedUniverses: input.authorizedUniverses,
    requestedUniverses: input.requestedUniverses,
  });
  if (!gate.allowed) {
    return { state: 'DENIED', reason: gate.reason, rows: [], productionWrite: false };
  }
  const sealedActor: SealedActor =
    input.actor.kind === 'ceo_principal'
      ? { kind: 'ceo_principal', id: input.actor.id }
      : { kind: 'ordinary_agent', id: input.actor.id, role: input.actor.role };
  const result = await federateAgenticQuery({
    tenantId: input.tenantId,
    universeIds: input.requestedUniverses,
    table: input.table,
    actor: sealedActor,
    federated: true,
    root: input.root,
  });
  if (result.state === 'DENIED') {
    return {
      state: 'DENIED',
      reason: result.reason ?? FEDERATION_PERMISSION_REQUIRED,
      rows: [],
      productionWrite: false,
    };
  }
  return {
    state: 'AVAILABLE',
    reason: 'Permissioned federation within authorized Universes.',
    rows: result.rows,
    productionWrite: false,
  };
}

export type OfflineReconciliation = {
  id: string;
  pending: number;
  reconciled: number;
  conflicts: number;
  sealedPreserved: true;
  productionMutated: false;
  notes: string;
};

type OfflineStore = { pending: Array<{ id: string; tenantId: string; payload: unknown }> };

export async function reconcileOffline(input: {
  tenantId: string;
  root?: string;
  maxItems?: number;
}): Promise<OfflineReconciliation> {
  const path = xivLocalPath(input.root ?? process.cwd(), 'neural-db-offline-queue.json');
  const store = await readJsonFile<OfflineStore>(path, { pending: [] });
  const scoped = store.pending.filter((p) => p.tenantId === input.tenantId);
  const max = input.maxItems ?? scoped.length;
  const batch = scoped.slice(0, max);
  const remaining = store.pending.filter((p) => !batch.some((b) => b.id === p.id));
  await writeJsonFileAtomic(path, { pending: remaining });
  return {
    id: `off_${randomUUID()}`,
    pending: remaining.filter((p) => p.tenantId === input.tenantId).length,
    reconciled: batch.length,
    conflicts: 0,
    sealedPreserved: true,
    productionMutated: false,
    notes: 'Offline reconciliation is local/logical only. No production DML.',
  };
}

export async function enqueueOfflineItem(input: {
  tenantId: string;
  payload: unknown;
  root?: string;
}) {
  const path = xivLocalPath(input.root ?? process.cwd(), 'neural-db-offline-queue.json');
  const store = await readJsonFile<OfflineStore>(path, { pending: [] });
  store.pending.push({ id: `oq_${randomUUID()}`, tenantId: input.tenantId, payload: input.payload });
  await writeJsonFileAtomic(path, store);
}

export type WarehousePlacementRule = {
  id: string;
  dataset: string;
  tier: DataTier;
  allowed: boolean;
  reason: string;
  sealedWeakened: false;
};

export type DistributedKnowledgeWarehousePlan = {
  id: string;
  placements: WarehousePlacementRule[];
  sync: ReturnType<typeof syncPolicyAcrossTiers>;
  replication: ReturnType<typeof planReplication>;
  productionApplied: false;
  notes: string;
};

export function planDistributedKnowledgeWarehouse(input: {
  datasets: Array<{ name: string; sealed: boolean; preferredTier: DataTier }>;
}): DistributedKnowledgeWarehousePlan {
  const placements: WarehousePlacementRule[] = input.datasets.map((ds) => {
    const guard = guardSealedDataPlacement({ sealed: ds.sealed, tier: ds.preferredTier });
    return {
      id: `wh_${randomUUID()}`,
      dataset: ds.name,
      tier: ds.preferredTier,
      allowed: guard.allowed,
      reason: guard.reason,
      sealedWeakened: false,
    };
  });
  const anySealed = input.datasets.some((d) => d.sealed);
  return {
    id: `whp_${randomUUID()}`,
    placements,
    sync: syncPolicyAcrossTiers({ includeSealed: anySealed }),
    replication: planReplication({
      sealed: anySealed,
      targets: ['local_device', 'enterprise_system', 'edge_node', 'cloud_storage'],
    }),
    productionApplied: false,
    notes:
      'Distributed knowledge warehouse placement rules are recommendations. Sealed boundaries must not weaken.',
  };
}
