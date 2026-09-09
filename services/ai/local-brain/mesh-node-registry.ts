import { probeHardware } from './hardware-probe';
import { localModelStatus } from './local-model';
import { snapshotChipComputeGraph } from './chip-compute-graph';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  DEFAULT_CAPABILITY_TTL_MS,
  MESH_HONESTY,
  type MeshCapability,
  type MeshNodeKind,
  type MeshNodeLifecycle,
} from './distributed-mesh-types';

export type MeshNodeRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: MeshNodeKind;
  displayName: string;
  lifecycle: MeshNodeLifecycle;
  trustedForRouting: boolean;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  capabilities: MeshCapability[];
  capabilitiesObservedAt: string | null;
  evidenceRefs: string[];
  quarantineReason?: string;
  revokedReason?: string;
  productionAuthorization: false;
  l4AutonomyEnabled: false;
  physicalDeviceControl: false;
  createdAt: string;
  updatedAt: string;
};

type Store = { nodes: MeshNodeRecord[] };

function storePath(root: string) {
  return xivLocalPath(root, 'mesh-nodes.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(storePath(root), { nodes: [] });
  return Array.isArray(parsed.nodes) ? parsed.nodes : [];
}

async function save(root: string, nodes: MeshNodeRecord[]) {
  await writeJsonFileAtomic(storePath(root), { nodes: nodes.slice(-2_000) });
}

function requireScope(tenantId: string, universeId: string) {
  if (!tenantId || !universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
}

export async function detectMeshNode(input: {
  tenantId: string;
  universeId: string;
  kind: MeshNodeKind;
  displayName: string;
  nodeId?: string;
  root?: string;
  now?: number;
}): Promise<MeshNodeRecord> {
  requireScope(input.tenantId, input.universeId);
  if (!input.displayName.trim()) throw new Error('MESH_NODE_NAME_REQUIRED');
  const now = new Date(input.now ?? Date.now()).toISOString();
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  if (input.nodeId) {
    const existing = nodes.find((node) => node.id === input.nodeId);
    if (existing) {
      if (existing.lifecycle === 'revoked') throw new Error('REVOKED_NODE_CANNOT_REENTER');
      return existing;
    }
  }
  const record: MeshNodeRecord = {
    id: input.nodeId ?? cortexId('meshnode'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    displayName: input.displayName.trim(),
    lifecycle: 'detected',
    trustedForRouting: false,
    configured: false,
    authorized: false,
    verified: false,
    capabilities: [],
    capabilitiesObservedAt: null,
    evidenceRefs: [],
    productionAuthorization: false,
    l4AutonomyEnabled: false,
    physicalDeviceControl: false,
    createdAt: now,
    updatedAt: now,
  };
  nodes.push(record);
  await save(root, nodes);
  return record;
}

export async function configureMeshNode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  configNote: string;
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('MESH_NODE_NOT_FOUND');
  if (node.lifecycle === 'revoked') throw new Error('REVOKED_NODE_CANNOT_BE_CONFIGURED');
  if (node.lifecycle === 'quarantined') throw new Error('QUARANTINED_NODE_CANNOT_BE_CONFIGURED');
  if (node.lifecycle !== 'detected' && node.lifecycle !== 'configured') {
    throw new Error('MESH_NODE_NOT_IN_CONFIGURE_STAGE');
  }
  if (!input.configNote.trim()) throw new Error('MESH_NODE_CONFIG_REQUIRED');
  node.configured = true;
  node.lifecycle = 'configured';
  node.trustedForRouting = false;
  node.updatedAt = new Date(input.now ?? Date.now()).toISOString();
  await save(root, nodes);
  return node;
}

export async function authorizeMeshNode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  approved: boolean;
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('MESH_NODE_NOT_FOUND');
  if (node.lifecycle === 'revoked') throw new Error('REVOKED_NODE_CANNOT_BE_AUTHORIZED');
  if (node.lifecycle === 'quarantined') throw new Error('QUARANTINED_NODE_CANNOT_BE_AUTHORIZED');
  if (!node.configured || (node.lifecycle !== 'configured' && node.lifecycle !== 'authorized')) {
    throw new Error('MESH_NODE_MUST_BE_CONFIGURED_BEFORE_AUTHORIZATION');
  }
  if (!input.approved) {
    node.authorized = false;
    node.trustedForRouting = false;
    node.updatedAt = new Date(input.now ?? Date.now()).toISOString();
    await save(root, nodes);
    return node;
  }
  node.authorized = true;
  node.lifecycle = 'authorized';
  node.trustedForRouting = false;
  node.updatedAt = new Date(input.now ?? Date.now()).toISOString();
  await save(root, nodes);
  return node;
}

export async function verifyMeshNode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  evidenceRefs: string[];
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('MESH_NODE_NOT_FOUND');
  if (node.lifecycle === 'revoked') throw new Error('REVOKED_NODE_CANNOT_BE_VERIFIED');
  if (node.lifecycle === 'quarantined') throw new Error('QUARANTINED_NODE_CANNOT_BE_VERIFIED');
  if (!node.authorized || node.lifecycle !== 'authorized') {
    throw new Error('MESH_NODE_MUST_BE_AUTHORIZED_BEFORE_VERIFICATION');
  }
  if (input.evidenceRefs.length === 0) throw new Error('MESH_NODE_VERIFICATION_EVIDENCE_REQUIRED');
  node.verified = true;
  node.lifecycle = 'verified';
  node.evidenceRefs = [...new Set([...node.evidenceRefs, ...input.evidenceRefs])];
  node.trustedForRouting = true;
  node.updatedAt = new Date(input.now ?? Date.now()).toISOString();
  await save(root, nodes);
  return node;
}

export async function discoverNodeCapabilities(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
  ttlMs?: number;
}) {
  const root = input.root ?? process.cwd();
  const nowMs = input.now ?? Date.now();
  const observedAt = new Date(nowMs).toISOString();
  const ttlMs = input.ttlMs ?? DEFAULT_CAPABILITY_TTL_MS;
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('MESH_NODE_NOT_FOUND');

  const hardware = await probeHardware();
  const model = await localModelStatus();
  const chips = snapshotChipComputeGraph({
    tenantId: input.tenantId,
    universeId: input.universeId,
  });

  const capabilities: MeshCapability[] = hardware.map((item) => ({
    kind: item.kind === 'cpu' ? 'cpu' : 'accelerator',
    label: `${item.vendor}:${item.model}`,
    availability: item.availability,
    evidenceRefs: [...item.evidence],
    observedAt,
    ttlMs,
  }));

  capabilities.push({
    kind: 'local_model',
    label: model.model ?? 'unconfigured',
    availability: model.availability === 'AVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE',
    evidenceRefs: [model.reason],
    observedAt,
    ttlMs,
  });

  capabilities.push({
    kind: 'chip',
    label: `chip-graph:${chips.nodes.length}`,
    availability: chips.nodes.some((item) => item.state === 'AVAILABLE') ? 'AVAILABLE' : 'UNAVAILABLE',
    evidenceRefs: chips.honesty.productionAuthorization ? ['chip:production'] : ['chip:sandbox'],
    observedAt,
    ttlMs,
  });

  for (const kind of ['coding', 'research', 'quant', 'knowledge_pack', 'edge'] as const) {
    capabilities.push({
      kind,
      label: `local:${kind}`,
      availability: 'AVAILABLE',
      evidenceRefs: [`capability:${kind}:local-sandbox`],
      observedAt,
      ttlMs,
    });
  }

  node.capabilities = capabilities;
  node.capabilitiesObservedAt = observedAt;
  node.updatedAt = observedAt;
  await save(root, nodes);
  return { node, capabilities, honesty: MESH_HONESTY };
}

export function capabilityFreshness(capability: MeshCapability, now = Date.now()) {
  const observed = Date.parse(capability.observedAt);
  if (!Number.isFinite(observed)) return 'STALE' as const;
  if (now - observed > capability.ttlMs) return 'STALE' as const;
  return capability.availability;
}

export function nodeCapabilitiesStale(node: MeshNodeRecord, now = Date.now()) {
  if (!node.capabilitiesObservedAt || node.capabilities.length === 0) return true;
  return node.capabilities.every((capability) => capabilityFreshness(capability, now) === 'STALE')
    || now - Date.parse(node.capabilitiesObservedAt) > (node.capabilities[0]?.ttlMs ?? DEFAULT_CAPABILITY_TTL_MS);
}

export async function getMeshNode(nodeId: string, tenantId: string, universeId: string, root?: string) {
  const nodes = await load(root ?? process.cwd());
  return nodes.find((node) => node.id === nodeId && node.tenantId === tenantId && node.universeId === universeId) ?? null;
}

export async function listMeshNodes(input: { tenantId: string; universeId: string; root?: string }) {
  const nodes = await load(input.root ?? process.cwd());
  return nodes.filter((node) => node.tenantId === input.tenantId && node.universeId === input.universeId);
}

export function isRoutingEligible(node: MeshNodeRecord, now = Date.now()) {
  if (node.lifecycle !== 'verified') return false;
  if (!node.trustedForRouting || !node.verified || !node.authorized || !node.configured) return false;
  if (nodeCapabilitiesStale(node, now)) return false;
  if (node.evidenceRefs.length === 0) return false;
  return true;
}

export async function expireNodeCapabilities(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  root?: string;
  observedAt: number;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('MESH_NODE_NOT_FOUND');
  const observedAt = new Date(input.observedAt).toISOString();
  node.capabilities = node.capabilities.map((capability) => ({ ...capability, observedAt }));
  node.capabilitiesObservedAt = observedAt;
  node.updatedAt = observedAt;
  await save(root, nodes);
  return node;
}

export async function quarantineMeshNode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  reason: string;
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('MESH_NODE_NOT_FOUND');
  if (node.lifecycle === 'revoked') throw new Error('REVOKED_NODE_ALREADY_TERMINAL');
  node.lifecycle = 'quarantined';
  node.trustedForRouting = false;
  node.quarantineReason = input.reason;
  node.updatedAt = new Date(input.now ?? Date.now()).toISOString();
  await save(root, nodes);
  return node;
}

export async function revokeMeshNode(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  reason: string;
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await load(root);
  const node = nodes.find((item) => item.id === input.nodeId && item.tenantId === input.tenantId && item.universeId === input.universeId);
  if (!node) throw new Error('MESH_NODE_NOT_FOUND');
  node.lifecycle = 'revoked';
  node.trustedForRouting = false;
  node.authorized = false;
  node.verified = false;
  node.revokedReason = input.reason;
  node.updatedAt = new Date(input.now ?? Date.now()).toISOString();
  await save(root, nodes);
  return node;
}
