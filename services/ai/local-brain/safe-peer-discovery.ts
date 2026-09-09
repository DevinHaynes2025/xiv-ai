import { detectMeshNode, getMeshNode, listMeshNodes, type MeshNodeRecord } from './mesh-node-registry';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { MESH_HONESTY } from './distributed-mesh-types';

export type PeerAdvertisement = {
  id: string;
  fromNodeId: string;
  advertisedNodeId: string;
  tenantId: string;
  universeId: string;
  adapter: 'simulated_local';
  address: string;
  discoveredAt: string;
  autoTrusted: false;
  physicalDeviceControl: false;
};

type Store = { advertisements: PeerAdvertisement[] };

function storePath(root: string) {
  return xivLocalPath(root, 'mesh-peer-discovery.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(storePath(root), { advertisements: [] });
  return Array.isArray(parsed.advertisements) ? parsed.advertisements : [];
}

async function save(root: string, advertisements: PeerAdvertisement[]) {
  await writeJsonFileAtomic(storePath(root), { advertisements: advertisements.slice(-5_000) });
}

export async function advertisePeer(input: {
  fromNodeId: string;
  advertisedNodeId: string;
  tenantId: string;
  universeId: string;
  address?: string;
  root?: string;
  now?: number;
}) {
  if (input.fromNodeId === input.advertisedNodeId) throw new Error('PEER_CANNOT_ADVERTISE_SELF_AS_FOREIGN');
  const from = await getMeshNode(input.fromNodeId, input.tenantId, input.universeId, input.root);
  if (!from) throw new Error('MESH_NODE_NOT_FOUND');
  const advertised = await getMeshNode(input.advertisedNodeId, input.tenantId, input.universeId, input.root);
  if (!advertised) throw new Error('ADVERTISED_PEER_NOT_IN_REGISTRY');
  if (advertised.tenantId !== from.tenantId || advertised.universeId !== from.universeId) {
    throw new Error('CROSS_UNIVERSE_PEER_DISCOVERY_DENIED');
  }
  const advertisement: PeerAdvertisement = {
    id: cortexId('peeradv'),
    fromNodeId: input.fromNodeId,
    advertisedNodeId: input.advertisedNodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    adapter: 'simulated_local',
    address: input.address ?? `sim://local/${input.advertisedNodeId}`,
    discoveredAt: new Date(input.now ?? Date.now()).toISOString(),
    autoTrusted: false,
    physicalDeviceControl: false,
  };
  const root = input.root ?? process.cwd();
  const advertisements = await load(root);
  advertisements.push(advertisement);
  await save(root, advertisements);
  return advertisement;
}

export async function discoverPeers(input: {
  fromNodeId: string;
  tenantId: string;
  universeId: string;
  root?: string;
}): Promise<{
  peers: Array<{ advertisement: PeerAdvertisement; node: MeshNodeRecord; trustedForRouting: boolean }>;
  autoTrustRegisteredNode: false;
  honesty: typeof MESH_HONESTY;
}> {
  const from = await getMeshNode(input.fromNodeId, input.tenantId, input.universeId, input.root);
  if (!from) throw new Error('MESH_NODE_NOT_FOUND');
  const advertisements = (await load(input.root ?? process.cwd()))
    .filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId)
    .filter((item) => item.fromNodeId === input.fromNodeId || item.advertisedNodeId === input.fromNodeId);
  const peers = [];
  for (const advertisement of advertisements) {
    const peerId = advertisement.advertisedNodeId === input.fromNodeId ? advertisement.fromNodeId : advertisement.advertisedNodeId;
    const node = await getMeshNode(peerId, input.tenantId, input.universeId, input.root);
    if (!node) continue;
    peers.push({
      advertisement,
      node,
      trustedForRouting: node.trustedForRouting && node.lifecycle === 'verified',
    });
  }
  return {
    peers,
    autoTrustRegisteredNode: false,
    honesty: MESH_HONESTY,
  };
}

export async function ingestUntrustedDetection(input: {
  observerNodeId: string;
  tenantId: string;
  universeId: string;
  kind: MeshNodeRecord['kind'];
  displayName: string;
  root?: string;
  now?: number;
}) {
  const observer = await getMeshNode(input.observerNodeId, input.tenantId, input.universeId, input.root);
  if (!observer) throw new Error('MESH_NODE_NOT_FOUND');
  const detected = await detectMeshNode({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    displayName: input.displayName,
    root: input.root,
    now: input.now,
  });
  await advertisePeer({
    fromNodeId: input.observerNodeId,
    advertisedNodeId: detected.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
    now: input.now,
  });
  return {
    detected,
    trustedForRouting: false as const,
    lifecycle: detected.lifecycle,
    note: 'Discovered peers remain untrusted until configured, authorized, and verified.',
  };
}

export async function censusDiscoveredNodes(input: { tenantId: string; universeId: string; root?: string }) {
  const nodes = await listMeshNodes(input);
  return {
    detected: nodes.length,
    routingEligible: nodes.filter((node) => node.trustedForRouting && node.lifecycle === 'verified').length,
    autoTrusted: 0,
    honesty: MESH_HONESTY,
  };
}
