import { localModelStatus } from './local-model';
import { getMeshNode, isRoutingEligible, listMeshNodes } from './mesh-node-registry';
import { listMeshPartitions, nodesPartitioned } from './partition-safe-bus';
import { MESH_HONESTY, type MeshEvidenceState } from './distributed-mesh-types';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type FederatedModelSlot = {
  id: string;
  nodeId: string;
  tenantId: string;
  universeId: string;
  model: string | null;
  provider: string;
  availability: MeshEvidenceState;
  localPreferred: true;
  authorized: boolean;
  verified: boolean;
  reason: string;
};

type Store = { slots: FederatedModelSlot[] };

function storePath(root: string) {
  return xivLocalPath(root, 'mesh-model-federation.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(storePath(root), { slots: [] });
  return Array.isArray(parsed.slots) ? parsed.slots : [];
}

async function save(root: string, slots: FederatedModelSlot[]) {
  await writeJsonFileAtomic(storePath(root), { slots: slots.slice(-2_000) });
}

export async function publishLocalModelSlot(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
}) {
  const node = await getMeshNode(input.nodeId, input.tenantId, input.universeId, input.root);
  if (!node) throw new Error('MESH_NODE_NOT_FOUND');
  const status = await localModelStatus();
  const eligible = isRoutingEligible(node, input.now ?? Date.now());
  const availability: MeshEvidenceState = !eligible
    ? 'UNAVAILABLE'
    : status.availability === 'AVAILABLE'
      ? 'PASS'
      : 'UNAVAILABLE';
  const slot: FederatedModelSlot = {
    id: cortexId('modelslot'),
    nodeId: input.nodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    model: status.model,
    provider: status.provider,
    availability,
    localPreferred: true,
    authorized: node.authorized,
    verified: node.verified && eligible,
    reason: !eligible
      ? 'Node is not verified for routing; local model remains UNAVAILABLE to the mesh.'
      : status.reason,
  };
  const root = input.root ?? process.cwd();
  const slots = await load(root);
  const next = slots.filter((item) => item.nodeId !== input.nodeId);
  next.push(slot);
  await save(root, next);
  return slot;
}

export async function selectFederatedModel(input: {
  localNodeId: string;
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
}) {
  const local = await getMeshNode(input.localNodeId, input.tenantId, input.universeId, input.root);
  if (!local) throw new Error('MESH_NODE_NOT_FOUND');
  const root = input.root ?? process.cwd();
  await publishLocalModelSlot({ ...input, nodeId: input.localNodeId });
  const nodes = await listMeshNodes({ tenantId: input.tenantId, universeId: input.universeId, root });
  for (const node of nodes) {
    if (node.id === input.localNodeId) continue;
    await publishLocalModelSlot({ ...input, nodeId: node.id });
  }
  const slots = await load(root);
  const localSlot = slots.find((slot) => slot.nodeId === input.localNodeId);
  if (localSlot && localSlot.availability === 'PASS') {
    return { slot: localSlot, mode: 'local' as const, honesty: MESH_HONESTY };
  }
  const partitions = await listMeshPartitions(root);
  const peer = slots.find((slot) =>
    slot.nodeId !== input.localNodeId &&
    slot.availability === 'PASS' &&
    slot.verified &&
    !nodesPartitioned(partitions, input.localNodeId, slot.nodeId),
  );
  if (peer) {
    return { slot: peer, mode: 'authorized_peer' as const, honesty: MESH_HONESTY };
  }
  return {
    slot: localSlot ?? null,
    mode: 'none' as const,
    honesty: MESH_HONESTY,
    state: 'UNAVAILABLE' as const,
    reason: 'No verified local or federated model is AVAILABLE.',
  };
}
