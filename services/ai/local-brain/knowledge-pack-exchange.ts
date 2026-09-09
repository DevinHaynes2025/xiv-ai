import { listKnowledgePacks, registerKnowledgePack, type KnowledgePack } from './knowledge-packs';
import { getMeshNode, isRoutingEligible } from './mesh-node-registry';
import { listMeshPartitions, nodesPartitioned, publishMeshEnvelope } from './partition-safe-bus';
import { MESH_HONESTY, type MeshEvidenceState } from './distributed-mesh-types';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type PackTransfer = {
  id: string;
  packId: string;
  fromNodeId: string;
  toNodeId: string;
  tenantId: string;
  universeId: string;
  state: MeshEvidenceState | 'queued' | 'duplicate_skipped';
  ingestedOnDestination: boolean;
  reason: string;
  createdAt: string;
};

type Store = { transfers: PackTransfer[]; receivedPackIds: string[] };

function storePath(root: string) {
  return xivLocalPath(root, 'mesh-pack-exchange.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { transfers: [], receivedPackIds: [] });
  return {
    transfers: Array.isArray(parsed.transfers) ? parsed.transfers : [],
    receivedPackIds: Array.isArray(parsed.receivedPackIds) ? parsed.receivedPackIds : [],
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), {
    transfers: store.transfers.slice(-5_000),
    receivedPackIds: store.receivedPackIds.slice(-10_000),
  });
}

export async function transferKnowledgePack(input: {
  packId: string;
  fromNodeId: string;
  toNodeId: string;
  tenantId: string;
  universeId: string;
  failTransfer?: boolean;
  root?: string;
  now?: number;
}): Promise<{ transfer: PackTransfer; pack?: KnowledgePack }> {
  const root = input.root ?? process.cwd();
  const now = input.now ?? Date.now();
  const from = await getMeshNode(input.fromNodeId, input.tenantId, input.universeId, root);
  const to = await getMeshNode(input.toNodeId, input.tenantId, input.universeId, root);
  if (!from || !to) throw new Error('MESH_NODE_NOT_FOUND');
  if (from.tenantId !== to.tenantId || from.universeId !== to.universeId) {
    throw new Error('CROSS_UNIVERSE_PACK_TRANSFER_DENIED');
  }

  const packs = await listKnowledgePacks({ tenantId: input.tenantId, universeId: input.universeId, root });
  const pack = packs.find((item) => item.id === input.packId);
  const store = await load(root);

  const transfer: PackTransfer = {
    id: cortexId('packtx'),
    packId: input.packId,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    state: 'FAIL',
    ingestedOnDestination: false,
    reason: '',
    createdAt: new Date(now).toISOString(),
  };

  if (!pack) {
    transfer.state = 'FAIL';
    transfer.reason = 'Source knowledge pack was not found.';
    store.transfers.push(transfer);
    await save(root, store);
    return { transfer };
  }

  if (!isRoutingEligible(from, now) || !isRoutingEligible(to, now)) {
    transfer.state = 'UNAVAILABLE';
    transfer.reason = 'Source or destination node is not verified for routing.';
    store.transfers.push(transfer);
    await save(root, store);
    return { transfer, pack };
  }

  const receiptKey = `${input.toNodeId}::${pack.id}`;
  if (store.receivedPackIds.includes(receiptKey)) {
    transfer.state = 'duplicate_skipped';
    transfer.ingestedOnDestination = true;
    transfer.reason = 'Destination already ingested this pack; duplicate consequential ingest skipped.';
    store.transfers.push(transfer);
    await save(root, store);
    return { transfer, pack };
  }

  const partitions = await listMeshPartitions(root);
  if (nodesPartitioned(partitions, from.id, to.id)) {
    transfer.state = 'queued';
    transfer.reason = 'Network partition: pack transfer queued until reconnect.';
    await publishMeshEnvelope({
      idempotencyKey: `pack:${transfer.id}`,
      fromNodeId: from.id,
      toNodeId: to.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: 'pack_transfer',
      body: `queued pack ${pack.id}`,
      evidenceRefs: pack.sourceRefs,
      workId: pack.id,
      root,
      now,
    });
    store.transfers.push(transfer);
    await save(root, store);
    return { transfer, pack };
  }

  if (input.failTransfer) {
    transfer.state = 'FAIL';
    transfer.ingestedOnDestination = false;
    transfer.reason = 'Transfer failed; destination did not ingest the pack.';
    await publishMeshEnvelope({
      idempotencyKey: `pack:${transfer.id}`,
      fromNodeId: from.id,
      toNodeId: to.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: 'pack_transfer',
      body: `failed pack ${pack.id}`,
      evidenceRefs: pack.sourceRefs,
      workId: pack.id,
      failDelivery: true,
      root,
      now,
    });
    store.transfers.push(transfer);
    await save(root, store);
    return { transfer, pack };
  }

  await registerKnowledgePack({
    tenantId: pack.tenantId,
    universeId: pack.universeId,
    partition: pack.partition,
    domain: pack.domain,
    title: `${pack.title} [replica:${to.id}]`,
    claims: pack.claims.map((claim) => ({
      ...claim,
      id: `${claim.id}::${to.id}`,
    })),
    scale: pack.scale,
    root,
  });
  store.receivedPackIds.push(receiptKey);
  transfer.state = 'PASS';
  transfer.ingestedOnDestination = true;
  transfer.reason = 'Pack transferred to an authorized verified peer.';
  store.transfers.push(transfer);
  await save(root, store);
  return { transfer, pack };
}

export async function retryFailedPackTransfers(input: {
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const retried: PackTransfer[] = [];
  for (const transfer of store.transfers) {
    if (transfer.tenantId !== input.tenantId || transfer.universeId !== input.universeId) continue;
    if (transfer.state !== 'queued') continue;
    if (transfer.ingestedOnDestination) continue;
    const result = await transferKnowledgePack({
      packId: transfer.packId,
      fromNodeId: transfer.fromNodeId,
      toNodeId: transfer.toNodeId,
      tenantId: transfer.tenantId,
      universeId: transfer.universeId,
      root,
      now: input.now,
    });
    retried.push(result.transfer);
  }
  return { retried, honesty: MESH_HONESTY };
}

export async function listPackTransfers(root?: string) {
  return (await load(root ?? process.cwd())).transfers;
}
