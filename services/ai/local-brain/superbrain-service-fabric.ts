/**
 * 62L-DC Superbrain Service Fabric façade —
 * Formal service fabric around the Superbrain with truthful fabric-node
 * heartbeat / WAITING_NODE / OFFLINE_STOPPED realism.
 * Soft-wires DA Superbrain Runtime Kernel when PRESENT (coexistence).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DC_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  MAX_FABRIC_SERVICES,
  NEXT_PHASE_TITLE,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  type DcActor,
  type FabricNodeStatus,
} from './superbrain-service-fabric-types';
import { agentDepartmentApiMeshHonesty } from './agent-department-api-mesh';
import { memoryLakeStreamingHonesty } from './distributed-memory-lake-streaming';
import { modelBrokerEvaluationHonesty } from './model-broker-evaluation-grid';
import { adaptiveAcceleratorFederationHonesty } from './adaptive-accelerator-federation';
import { aiProductStudioNetworkHonesty } from './autonomous-ai-product-studio-network';
import { multiUniverseStateCompilerDrHonesty } from './multi-universe-state-compiler-dr-fabric';

export type SuperbrainServiceFabric = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  predecessorLayer: 'DB' | 'DA' | 'CZ' | 'CY' | 'CX' | 'CW' | 'NONE';
  l4AutonomyEnabled: false;
  productionAuthorized: false;
  tipLand: false;
  publicExposureAuthorized: false;
  createdAt: string;
};

export type FabricNode = {
  id: string;
  fabricId: string;
  name: string;
  status: FabricNodeStatus;
  logical: boolean;
  authorizedNodePowered: boolean;
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type FabricNodeResult = {
  accepted: boolean;
  reason: string;
  node?: FabricNode;
  fabric?: SuperbrainServiceFabric;
  at: string;
};

type Store = {
  fabrics: SuperbrainServiceFabric[];
  nodes: FabricNode[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'superbrain-service-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { fabrics: [], nodes: [] });
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
): SuperbrainServiceFabric['predecessorLayer'] {
  const brain = resolveBrainPath(repoRoot);
  if (existsSync(join(brain, 'distributed-superbrain-runtime-mesh-types.ts'))) {
    return 'DB';
  }
  if (existsSync(join(brain, 'superbrain-runtime-kernel-types.ts'))) return 'DA';
  if (existsSync(join(brain, 'intelligence-civilization-kernel-types.ts'))) {
    return 'CZ';
  }
  if (existsSync(join(brain, 'knowledge-colony-operating-system-types.ts'))) {
    return 'CY';
  }
  if (existsSync(join(brain, 'persistent-knowledge-civilization-types.ts'))) {
    return 'CX';
  }
  if (existsSync(join(brain, 'autonomous-research-infrastructure-os-types.ts'))) {
    return 'CW';
  }
  return 'NONE';
}

export function superbrainServiceFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DC_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DC_LOCKS.TIP_LAND,
    productionAuthorization: DC_LOCKS.PRODUCTION_AUTHORIZATION,
    localFirst: DC_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: DC_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    publicExposureWithoutGates: DC_LOCKS.SERVICE_FABRIC_PUBLIC_EXPOSURE_WITHOUT_GATES,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    subsystems: {
      apiMesh: agentDepartmentApiMeshHonesty(),
      memoryLakeStreaming: memoryLakeStreamingHonesty(),
      modelBroker: modelBrokerEvaluationHonesty(),
      acceleratorFederation: adaptiveAcceleratorFederationHonesty(),
      productStudios: aiProductStudioNetworkHonesty(),
      stateCompilerDr: multiUniverseStateCompilerDrHonesty(),
    },
  };
}

export async function bootstrapSuperbrainServiceFabric(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DcActor;
  repoRoot?: string;
}): Promise<SuperbrainServiceFabric> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.fabrics.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;

  const predecessorLayer = detectPredecessorLayer(input.repoRoot);
  const brain = resolveBrainPath(input.repoRoot);

  // Soft-wire DA Superbrain Runtime Kernel when PRESENT (coexistence; not production auth).
  if (predecessorLayer === 'DA' || predecessorLayer === 'DB') {
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
              kind: 'ceo_principal',
              id: input.actor.id,
              orgId: input.orgId,
              tenantId: input.tenantId,
              universeId: input.universeId,
              role: input.actor.role,
              permissionLevel: input.actor.permissionLevel,
              authorityLevel: input.actor.authorityLevel,
            },
          });
        }
      }
    } catch {
      // DA wire optional — WAITING_DATA / partial tip tolerated
    }
  } else if (predecessorLayer === 'CY' || predecessorLayer === 'CZ') {
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
      // CY wire optional
    }
  }

  if (store.fabrics.length >= MAX_FABRIC_SERVICES) {
    return {
      id: id('ssf'),
      orgId: input.orgId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      predecessorLayer,
      l4AutonomyEnabled: false,
      productionAuthorized: false,
      tipLand: false,
      publicExposureAuthorized: false,
      createdAt: new Date().toISOString(),
    };
  }

  const fabric: SuperbrainServiceFabric = {
    id: id('ssf'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    predecessorLayer,
    l4AutonomyEnabled: false,
    productionAuthorized: false,
    tipLand: false,
    publicExposureAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.fabrics.push(fabric);
  await save(input.root, store);
  return fabric;
}

export async function registerFabricNode(input: {
  fabricId: string;
  name: string;
  authorizedNodePowered?: boolean;
  root: string;
  actor: DcActor;
}): Promise<FabricNodeResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) {
    return { accepted: false, reason: 'SERVICE_FABRIC_NOT_FOUND', at: now };
  }
  const powered = input.authorizedNodePowered === true;
  const node: FabricNode = {
    id: id('node'),
    fabricId: fabric.id,
    name: input.name.trim() || 'unnamed-node',
    status: powered ? 'LOGICAL' : 'WAITING_NODE',
    logical: true,
    authorizedNodePowered: powered,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    reason: powered
      ? 'FABRIC_NODE_LOGICAL_NOT_RUNNING_VERIFIED'
      : NO_POWERED_NODE_WAITING_OR_STOPPED,
    createdAt: now,
    updatedAt: now,
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node, fabric, at: now };
}

export async function setFabricNodePower(input: {
  nodeId: string;
  powered: boolean;
  stopMode?: 'WAITING_NODE' | 'OFFLINE_STOPPED';
  root: string;
  actor: DcActor;
}): Promise<FabricNodeResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) {
    return { accepted: false, reason: 'FABRIC_NODE_NOT_FOUND', at: now };
  }
  node.authorizedNodePowered = input.powered;
  node.updatedAt = now;
  if (!input.powered) {
    node.status = input.stopMode === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    node.reason = NO_POWERED_NODE_WAITING_OR_STOPPED;
    node.lastHeartbeatAt = null;
    node.runtimeEvidence = null;
  } else if (node.status === 'WAITING_NODE' || node.status === 'OFFLINE_STOPPED') {
    node.status = 'LOGICAL';
    node.reason = 'FABRIC_NODE_POWERED_LOGICAL_AWAITING_HEARTBEAT';
  }
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node, at: now };
}

export async function recordFabricNodeHeartbeat(input: {
  nodeId: string;
  runtimeEvidence: string;
  root: string;
  actor: DcActor;
}): Promise<FabricNodeResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) {
    return { accepted: false, reason: 'FABRIC_NODE_NOT_FOUND', at: now };
  }
  if (!node.authorizedNodePowered) {
    node.status = 'WAITING_NODE';
    node.reason = NO_POWERED_NODE_WAITING_OR_STOPPED;
    node.updatedAt = now;
    await save(input.root, store);
    return { accepted: false, reason: node.reason, node, at: now };
  }
  if (!input.runtimeEvidence?.trim()) {
    node.status = 'LOGICAL';
    node.reason = NO_HEARTBEAT_NOT_RUNNING_VERIFIED;
    node.updatedAt = now;
    await save(input.root, store);
    return { accepted: false, reason: node.reason, node, at: now };
  }
  node.lastHeartbeatAt = now;
  node.runtimeEvidence = input.runtimeEvidence.trim();
  node.status = 'RUNNING_VERIFIED';
  node.reason = 'FABRIC_NODE_RUNNING_VERIFIED_WITH_HEARTBEAT';
  node.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node, at: now };
}

export async function claimFabricNodeRunningVerified(input: {
  nodeId: string;
  root: string;
  actor: DcActor;
}): Promise<FabricNodeResult> {
  void input.actor;
  const store = await load(input.root);
  const nowIso = new Date().toISOString();
  const now = Date.now();
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) {
    return { accepted: false, reason: 'FABRIC_NODE_NOT_FOUND', at: nowIso };
  }
  if (!node.authorizedNodePowered) {
    node.status =
      node.status === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    node.reason = NO_POWERED_NODE_WAITING_OR_STOPPED;
    node.updatedAt = nowIso;
    await save(input.root, store);
    return { accepted: false, reason: node.reason, node, at: nowIso };
  }
  if (!node.lastHeartbeatAt || !node.runtimeEvidence) {
    node.status = 'LOGICAL';
    node.reason = NO_HEARTBEAT_NOT_RUNNING_VERIFIED;
    node.updatedAt = nowIso;
    await save(input.root, store);
    return { accepted: false, reason: node.reason, node, at: nowIso };
  }
  const age = now - Date.parse(node.lastHeartbeatAt);
  if (Number.isNaN(age) || age > HEARTBEAT_TTL_MS) {
    node.status = 'HEARTBEAT_STALE';
    node.reason = NO_HEARTBEAT_NOT_RUNNING_VERIFIED;
    node.updatedAt = nowIso;
    await save(input.root, store);
    return { accepted: false, reason: node.reason, node, at: nowIso };
  }
  node.status = 'RUNNING_VERIFIED';
  node.reason = 'FABRIC_NODE_RUNNING_VERIFIED_WITH_HEARTBEAT';
  node.updatedAt = nowIso;
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node, at: nowIso };
}
