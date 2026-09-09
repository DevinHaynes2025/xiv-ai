import { randomUUID } from 'node:crypto';

import { registerDeviceNode, type DeviceNode } from './device-node-runtime';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { enterEmergencyIsolation } from './emergency-isolation';
import type { NodeProfile } from './distributed-app-network-types';

export const APP_NETWORK_NODES_FILE = 'app-network-nodes.json';

export type AppNetworkNode = {
  id: string;
  tenantId: string;
  universeId: string;
  profile: NodeProfile;
  deviceNodeId: string;
  osClass: DeviceNode['osClass'];
  lifecycle: 'registered' | 'configured' | 'authorized' | 'verified' | 'quarantined' | 'revoked';
  trustedForRouting: boolean;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  online: boolean;
  quarantineReason?: string;
  productionAuthorization: false;
  l4AutonomyEnabled: false;
  authorityFromInstall: false;
  authorityFromSync: false;
  physicalControl: false;
  createdAt: string;
  updatedAt: string;
};

type NodeStore = { nodes: AppNetworkNode[] };

function storePath(root: string) {
  return xivLocalPath(root, APP_NETWORK_NODES_FILE);
}

async function load(root: string) {
  const parsed = await readJsonFile<NodeStore>(storePath(root), { nodes: [] });
  return Array.isArray(parsed.nodes) ? parsed.nodes : [];
}

async function save(root: string, nodes: AppNetworkNode[]) {
  await writeJsonFileAtomic(storePath(root), { nodes: nodes.slice(-1_000) });
}

function deviceClassFor(profile: NodeProfile): DeviceNode['deviceClass'] {
  return profile === 'mobile' ? 'android_class' : 'laptop';
}

export function isPeerAuthorized(node: AppNetworkNode) {
  return (
    node.lifecycle === 'verified' &&
    node.authorized &&
    node.verified &&
    node.configured &&
    node.trustedForRouting
  );
}

export function isPeerEligible(node: AppNetworkNode) {
  return isPeerAuthorized(node) && node.online;
}

export async function registerAppNetworkNode(input: {
  tenantId: string;
  universeId: string;
  profile: NodeProfile;
  osClass?: DeviceNode['osClass'];
  online?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const device = await registerDeviceNode({
    tenantId: input.tenantId,
    universeId: input.universeId,
    deviceClass: deviceClassFor(input.profile),
    osClass: input.osClass,
    online: input.online,
    root,
  });
  const now = new Date().toISOString();
  const node: AppNetworkNode = {
    id: `anet_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    profile: input.profile,
    deviceNodeId: device.id,
    osClass: device.osClass,
    lifecycle: 'registered',
    trustedForRouting: false,
    configured: false,
    authorized: false,
    verified: false,
    online: input.online !== false,
    productionAuthorization: false,
    l4AutonomyEnabled: false,
    authorityFromInstall: false,
    authorityFromSync: false,
    physicalControl: false,
    createdAt: now,
    updatedAt: now,
  };
  const nodes = await load(root);
  nodes.push(node);
  await save(root, nodes);
  return node;
}

export async function configureAppNetworkNode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  note: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('APP_NETWORK_NODE_NOT_FOUND');
  if (node.lifecycle === 'revoked' || node.lifecycle === 'quarantined') {
    throw new Error('NODE_NOT_CONFIGURABLE');
  }
  if (!input.note.trim()) throw new Error('NODE_CONFIG_REQUIRED');
  node.configured = true;
  node.lifecycle = 'configured';
  node.trustedForRouting = false;
  node.updatedAt = new Date().toISOString();
  await save(root, nodes);
  return node;
}

export async function authorizeAppNetworkNode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  explicit: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('APP_NETWORK_NODE_NOT_FOUND');
  if (!input.explicit) {
    return { authorized: false as const, node, reason: 'Authorization requires an explicit local grant. Install/sync never grants authority.' };
  }
  if (!node.configured) {
    return { authorized: false as const, node, reason: 'Node must be configured before authorization.' };
  }
  if (node.lifecycle === 'quarantined' || node.lifecycle === 'revoked') {
    return { authorized: false as const, node, reason: 'Quarantined or revoked nodes cannot be authorized.' };
  }
  node.authorized = true;
  node.lifecycle = 'authorized';
  node.trustedForRouting = false;
  node.updatedAt = new Date().toISOString();
  await save(root, nodes);
  return { authorized: true as const, node, reason: 'Explicit authorization recorded. Still unverified.' };
}

export async function verifyAppNetworkNode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  evidenceRef: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('APP_NETWORK_NODE_NOT_FOUND');
  if (!node.authorized || !input.evidenceRef.trim()) {
    return { verified: false as const, node, reason: 'Verification requires prior authorization plus evidence. Registered ≠ trusted.' };
  }
  node.verified = true;
  node.trustedForRouting = true;
  node.lifecycle = 'verified';
  node.updatedAt = new Date().toISOString();
  await save(root, nodes);
  return { verified: true as const, node, reason: 'Node verified with evidence. Distributed ≠ uncontrolled.' };
}

export async function setAppNetworkNodeOnline(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  online: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('APP_NETWORK_NODE_NOT_FOUND');
  node.online = input.online;
  node.updatedAt = new Date().toISOString();
  await save(root, nodes);
  return node;
}

export async function quarantineCompromisedNode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  reason: string;
  isolate?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('APP_NETWORK_NODE_NOT_FOUND');
  node.lifecycle = 'quarantined';
  node.trustedForRouting = false;
  node.authorized = false;
  node.verified = false;
  node.quarantineReason = input.reason;
  node.updatedAt = new Date().toISOString();
  await save(root, nodes);
  const isolation = input.isolate
    ? await enterEmergencyIsolation({ reason: `compromised:${input.nodeId}`, root })
    : null;
  return { node, isolation, routingTrusted: false as const };
}

export async function getAppNetworkNode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const nodes = await load(input.root ?? process.cwd());
  return nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId) ?? null;
}

export async function listAppNetworkNodes(input: { tenantId: string; universeId: string; root?: string }) {
  const nodes = await load(input.root ?? process.cwd());
  return nodes.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}

export async function markInstallOrSync(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  kind: 'install' | 'sync';
  root?: string;
}) {
  const node = await getAppNetworkNode(input);
  if (!node) throw new Error('APP_NETWORK_NODE_NOT_FOUND');
  return {
    nodeId: node.id,
    kind: input.kind,
    authorityGranted: false as const,
    l4AutonomyEnabled: false as const,
    trustedForRouting: node.trustedForRouting,
    reason: 'Package installation and Universe sync never grant routing authority or L4 autonomy.',
  };
}
