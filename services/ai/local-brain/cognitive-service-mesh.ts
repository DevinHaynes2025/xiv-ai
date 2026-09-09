/**
 * 62L-DD Cognitive Service Mesh façade —
 * Service mesh layer over Superbrain service fabric (or CY sealed tip when DC WAITING).
 * Mesh nodes require heartbeat + powered authorized node for RUNNING_VERIFIED.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DD_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  MAX_MESH_NODES,
  NEXT_PHASE_TITLE,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  type DdActor,
  type MeshNodeStatus,
} from './cognitive-service-mesh-types';
import { departmentAgentGatewayHonesty } from './department-agent-gateway-network';
import { lakehouseFederationHonesty } from './distributed-knowledge-lakehouse-federation';
import { modelEvaluationRoutingHonesty } from './model-evaluation-routing-brain';
import { computeResourceExchangeHonesty } from './adaptive-compute-resource-exchange';
import { ventureStudioHonesty } from './autonomous-ai-venture-studio-system';
import { continuityGridHonesty } from './multi-universe-backup-restore-continuity-grid';

export type CognitiveServiceMesh = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: 'DC' | 'DB' | 'DA' | 'CZ' | 'CY' | 'CX' | 'CW' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  createdAt: string;
};

export type MeshNode = {
  id: string;
  meshId: string;
  name: string;
  status: MeshNodeStatus;
  authorizedNodePowered: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  logical: true;
  createdAt: string;
  updatedAt: string;
};

type Store = { meshes: CognitiveServiceMesh[]; nodes: MeshNode[] };

function storePath(root: string) {
  return xivLocalPath(root, 'cognitive-service-mesh.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { meshes: [], nodes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveBrainPath(repoRoot?: string): string {
  if (repoRoot) return join(repoRoot, 'services/ai/local-brain');
  return join(process.cwd(), 'services/ai/local-brain');
}

export function detectPredecessorLayer(
  repoRoot?: string,
): CognitiveServiceMesh['predecessorLayer'] {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'superbrain-service-fabric-types.ts'))) return 'DC';
  if (existsSync(join(brain, 'superbrain-control-plane-types.ts'))) return 'DB';
  if (
    existsSync(join(brain, 'superbrain-runtime-kernel-types.ts')) ||
    existsSync(join(brain, 'superbrain-os-types.ts'))
  ) {
    return 'DA';
  }
  if (existsSync(join(brain, 'intelligence-civilization-kernel-types.ts'))) return 'CZ';
  if (existsSync(join(brain, 'knowledge-colony-operating-system-types.ts'))) return 'CY';
  if (existsSync(join(brain, 'persistent-knowledge-civilization-types.ts'))) return 'CX';
  if (existsSync(join(brain, 'autonomous-research-infrastructure-os-types.ts'))) {
    return 'CW';
  }
  return 'NONE';
}

export function cognitiveServiceMeshHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DD_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DD_LOCKS.TIP_LAND,
    productionAuthorization: DD_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DD_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DD_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      departmentGateway: departmentAgentGatewayHonesty(),
      lakehouseFederation: lakehouseFederationHonesty(),
      modelEvaluation: modelEvaluationRoutingHonesty(),
      computeExchange: computeResourceExchangeHonesty(),
      ventureStudio: ventureStudioHonesty(),
      continuityGrid: continuityGridHonesty(),
    },
  };
}

export async function bootstrapCognitiveServiceMesh(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DdActor;
  repoRoot?: string;
}): Promise<CognitiveServiceMesh> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.meshes.find(
    (m) =>
      m.orgId === input.orgId &&
      m.tenantId === input.tenantId &&
      m.universeId === input.universeId,
  );
  if (existing) return existing;

  const predecessorLayer = detectPredecessorLayer(input.repoRoot);
  const brain = resolveBrainPath(input.repoRoot);

  // Soft-wire preferred predecessor façades when PRESENT (coexistence; not prod auth).
  if (predecessorLayer === 'DC') {
    try {
      const dcMod = join(brain, 'superbrain-service-fabric.ts');
      if (existsSync(dcMod)) {
        const dc = await import(dcMod);
        if (typeof dc.bootstrapSuperbrainServiceFabric === 'function') {
          await dc.bootstrapSuperbrainServiceFabric({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: input.actor,
            repoRoot: input.repoRoot,
          });
        }
      }
    } catch {
      // Soft-wire optional.
    }
  } else if (predecessorLayer === 'DA') {
    try {
      const daMod = join(brain, 'superbrain-runtime-kernel.ts');
      if (existsSync(daMod)) {
        const da = await import(daMod);
        if (typeof da.bootstrapSuperbrainRuntimeKernel === 'function') {
          await da.bootstrapSuperbrainRuntimeKernel({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'superbrain_kernel_curator',
              id: input.actor.id,
              orgId: input.orgId,
              tenantId: input.tenantId,
              universeId: input.universeId,
              role: input.actor.role,
              permissionLevel: input.actor.permissionLevel,
              authorityLevel: input.actor.authorityLevel,
            },
            repoRoot: input.repoRoot,
          });
        }
      }
    } catch {
      // Soft-wire optional; mesh still bootstraps.
    }
  } else if (predecessorLayer === 'CY') {
    try {
      const cyMod = join(brain, 'knowledge-colony-operating-system.ts');
      if (existsSync(cyMod)) {
        const cy = await import(cyMod);
        if (typeof cy.bootstrapKnowledgeColonyOperatingSystem === 'function') {
          await cy.bootstrapKnowledgeColonyOperatingSystem({
            orgId: input.orgId,
            tenantId: input.tenantId,
            universeId: input.universeId,
            root: input.root,
            actor: {
              kind: 'colony_os_curator',
              id: input.actor.id,
              orgId: input.orgId,
              tenantId: input.tenantId,
              universeId: input.universeId,
              role: input.actor.role,
              permissionLevel: input.actor.permissionLevel,
              authorityLevel: input.actor.authorityLevel,
            },
            repoRoot: input.repoRoot,
          });
        }
      }
    } catch {
      // Soft-wire optional; mesh still bootstraps.
    }
  }

  const mesh: CognitiveServiceMesh = {
    id: id('csm'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    createdAt: new Date().toISOString(),
  };
  store.meshes.push(mesh);
  await save(input.root, store);
  return mesh;
}

export async function registerMeshNode(input: {
  meshId: string;
  name: string;
  authorizedNodePowered?: boolean;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; node?: MeshNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.nodes.length >= MAX_MESH_NODES) {
    return { accepted: false, reason: 'MAX_MESH_NODES_BOUNDED', at: now };
  }
  const mesh = store.meshes.find((m) => m.id === input.meshId);
  if (!mesh) {
    return { accepted: false, reason: 'MESH_NOT_FOUND', at: now };
  }
  const powered = input.authorizedNodePowered === true;
  const node: MeshNode = {
    id: id('csmn'),
    meshId: mesh.id,
    name: input.name.trim() || 'unnamed-node',
    status: powered ? 'LOGICAL' : 'WAITING_NODE',
    authorizedNodePowered: powered,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    logical: true,
    createdAt: now,
    updatedAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'MESH_NODE_REGISTERED_LOGICAL_NOT_RUNNING_VERIFIED',
    node,
    at: now,
  };
}

export async function recordMeshNodeHeartbeat(input: {
  nodeId: string;
  runtimeEvidence: string;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; node?: MeshNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) {
    return { accepted: false, reason: 'MESH_NODE_NOT_FOUND', at: now };
  }
  if (!node.authorizedNodePowered) {
    node.status = 'WAITING_NODE';
    node.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      node,
      at: now,
    };
  }
  node.lastHeartbeatAt = now;
  node.runtimeEvidence = input.runtimeEvidence.trim() || null;
  node.status = 'RUNNING_VERIFIED';
  node.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'MESH_NODE_HEARTBEAT_RECORDED_RUNNING_VERIFIED',
    node,
    at: now,
  };
}

export async function claimMeshNodeRunningVerified(input: {
  nodeId: string;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; node?: MeshNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const nowIso = new Date().toISOString();
  const now = Date.now();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) {
    return { accepted: false, reason: 'MESH_NODE_NOT_FOUND', at: nowIso };
  }
  if (!node.authorizedNodePowered) {
    if (node.status !== 'OFFLINE_STOPPED') node.status = 'WAITING_NODE';
    node.updatedAt = nowIso;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      node,
      at: nowIso,
    };
  }
  if (!node.lastHeartbeatAt || !node.runtimeEvidence) {
    node.status = 'LOGICAL';
    node.updatedAt = nowIso;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      node,
      at: nowIso,
    };
  }
  const age = now - Date.parse(node.lastHeartbeatAt);
  if (Number.isNaN(age) || age > HEARTBEAT_TTL_MS) {
    node.status = 'HEARTBEAT_STALE';
    node.updatedAt = nowIso;
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      node,
      at: nowIso,
    };
  }
  node.status = 'RUNNING_VERIFIED';
  node.updatedAt = nowIso;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'MESH_NODE_RUNNING_VERIFIED',
    node,
    at: nowIso,
  };
}

export async function setMeshNodePower(input: {
  nodeId: string;
  powered: boolean;
  stopMode?: 'WAITING_NODE' | 'OFFLINE_STOPPED';
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; node?: MeshNode; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) {
    return { accepted: false, reason: 'MESH_NODE_NOT_FOUND', at: now };
  }
  node.authorizedNodePowered = input.powered === true;
  if (!node.authorizedNodePowered) {
    node.status = input.stopMode === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    node.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: true,
      reason: NO_POWERED_NODE_WAITING_OR_STOPPED,
      node,
      at: now,
    };
  }
  node.status = node.lastHeartbeatAt ? 'RUNNING_VERIFIED' : 'LOGICAL';
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'MESH_NODE_POWER_RESTORED', node, at: now };
}
