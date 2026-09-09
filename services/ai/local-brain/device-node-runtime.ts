import { randomUUID } from 'node:crypto';
import { platform as nodePlatform } from 'node:os';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { hostOsClass, type DeviceClass, type OsClass } from './hybrid-edge-cloud-types';

export type DeviceNode = {
  id: string;
  tenantId: string;
  universeId: string;
  deviceClass: DeviceClass;
  osClass: OsClass;
  locality: 'device';
  hostOs: OsClass;
  online: boolean;
  physicalControl: false;
  productionAuthorization: false;
  createdAt: string;
};

type NodeStore = { nodes: DeviceNode[] };

const MAX_NODES = 256;

function nodesPath(root: string) {
  return xivLocalPath(root, 'device-nodes.json');
}

function osForDevice(deviceClass: DeviceClass, requested?: OsClass): OsClass {
  if (deviceClass === 'android_class') return 'android';
  if (deviceClass === 'ios_class') return 'ios';
  return requested ?? hostOsClass();
}

export async function registerDeviceNode(input: {
  tenantId: string;
  universeId: string;
  deviceClass: DeviceClass;
  osClass?: OsClass;
  online?: boolean;
  root?: string;
}): Promise<DeviceNode> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<NodeStore>(nodesPath(root), { nodes: [] });
  const nodes = Array.isArray(store.nodes) ? store.nodes : [];
  const node: DeviceNode = {
    id: `dnode_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    deviceClass: input.deviceClass,
    osClass: osForDevice(input.deviceClass, input.osClass),
    locality: 'device',
    hostOs: hostOsClass(nodePlatform()),
    online: input.online !== false,
    physicalControl: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  nodes.push(node);
  await writeJsonFileAtomic(nodesPath(root), { nodes: nodes.slice(-MAX_NODES) });
  return node;
}

export async function listDeviceNodes(input: {
  tenantId: string;
  universeId: string;
  deviceClass?: DeviceClass;
  root?: string;
}) {
  const store = await readJsonFile<NodeStore>(nodesPath(input.root ?? process.cwd()), { nodes: [] });
  const nodes = Array.isArray(store.nodes) ? store.nodes : [];
  return nodes.filter(
    (node) =>
      node.tenantId === input.tenantId &&
      node.universeId === input.universeId &&
      (!input.deviceClass || node.deviceClass === input.deviceClass),
  );
}

export async function setDeviceNodeOnline(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  online: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<NodeStore>(nodesPath(root), { nodes: [] });
  const nodes = Array.isArray(store.nodes) ? store.nodes : [];
  const node = nodes.find(
    (item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!node) throw new Error('DEVICE_NODE_NOT_FOUND');
  node.online = input.online;
  await writeJsonFileAtomic(nodesPath(root), { nodes });
  return node;
}

export function normalizeCrossOsPath(path: string, target: OsClass) {
  const posix = path.replaceAll('\\', '/');
  if (target === 'windows') return posix.replaceAll('/', '\\');
  return posix;
}

export function crossOsCompatibility(from: OsClass, to: OsClass) {
  const pathSep = {
    linux: '/',
    macos: '/',
    android: '/',
    ios: '/',
    windows: '\\',
  } as const;
  return {
    from,
    to,
    compatible: true as const,
    physicalControl: false as const,
    pathSeparatorFrom: pathSep[from],
    pathSeparatorTo: pathSep[to],
    lineEnding: to === 'windows' ? '\r\n' : '\n',
    envHome: to === 'windows' ? 'USERPROFILE' : 'HOME',
    notes: 'Logical OS-class adapter only. Does not control physical phones, laptops, or satellites.',
  };
}

export async function federateCrossOsAgents(input: {
  tenantId: string;
  universeId: string;
  fromNodeId: string;
  toNodeId: string;
  root?: string;
}) {
  const nodes = await listDeviceNodes(input);
  const from = nodes.find((node) => node.id === input.fromNodeId);
  const to = nodes.find((node) => node.id === input.toNodeId);
  if (!from || !to) {
    return { federated: false as const, reason: 'Both device nodes must belong to the same tenant/Universe.' };
  }
  return {
    federated: true as const,
    from: from.osClass,
    to: to.osClass,
    compatibility: crossOsCompatibility(from.osClass, to.osClass),
    physicalControl: false as const,
  };
}
