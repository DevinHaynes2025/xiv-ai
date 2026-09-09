/**
 * 62L-BZ Global Compute Nervous System — authorized node topology, compute health,
 * placement firewalls, failover planning (plans/recommendations only).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BZ_LOCKS,
  FAILOVER_PLAN_ONLY,
  HONESTY_BANNER,
  PLACEMENT_FIREWALL_BLOCKED,
  SELF_PERMISSION_EXPANSION_DENIED,
  UNCONFIGURED_NODE_UNAVAILABLE,
  type BzActor,
} from './global-compute-nervous-routing-types';

export type ComputeLocality = 'device' | 'edge' | 'cloud' | 'research' | 'sealed';

export type NervousNode = {
  id: string;
  label: string;
  locality: ComputeLocality;
  configured: boolean;
  authorized: boolean;
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  sealed: boolean;
  productionAuthorized: false;
  createdAt: string;
};

export type PlacementFirewallRule = {
  id: string;
  name: string;
  denyLocalities: ComputeLocality[];
  denySealedBypass: true;
  allowCloud: boolean;
};

export type PlacementDecision = {
  id: string;
  nodeId: string | null;
  workloadId: string;
  allowed: boolean;
  status: 'plan' | 'denied' | 'unavailable';
  reason: string;
  mutatesInfrastructure: false;
  recommendationOnly: true;
};

export type FailoverPlan = {
  id: string;
  primaryNodeId: string;
  candidateNodeIds: string[];
  status: 'recommendation_only';
  mutatesInfrastructure: false;
  reason: string;
};

type Store = {
  nodes: NervousNode[];
  firewalls: PlacementFirewallRule[];
  placements: PlacementDecision[];
  failovers: FailoverPlan[];
  permissionExpansionAttempts: Array<{
    id: string;
    actorId: string;
    denied: true;
    reason: string;
    at: string;
  }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-compute-nervous-system.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
    firewalls: [],
    placements: [],
    failovers: [],
    permissionExpansionAttempts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nervousSystemHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BZ_LOCKS.L4_AUTONOMY_ENABLED,
    unconfiguredNodeAvailable: BZ_LOCKS.UNCONFIGURED_NODE_AVAILABLE,
    placementFailoverPlanOnly: BZ_LOCKS.PLACEMENT_FAILOVER_PLAN_ONLY,
    selfPermissionExpansion: BZ_LOCKS.SELF_PERMISSION_EXPANSION,
    silentInfraMutation: BZ_LOCKS.SILENT_PRODUCTION_INFRA_MUTATION,
  };
}

export async function registerNervousNode(input: {
  label: string;
  locality: ComputeLocality;
  configured: boolean;
  authorized: boolean;
  sealed?: boolean;
  health?: NervousNode['health'];
  root: string;
  actor: BzActor;
}): Promise<{ node: NervousNode; unavailable: boolean; reason: string }> {
  const store = await load(input.root);
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const unavailable = !configured || !authorized;
  const node: NervousNode = {
    id: id('node'),
    label: input.label,
    locality: input.locality,
    configured,
    authorized,
    health: unavailable ? 'unknown' : (input.health ?? 'healthy'),
    status: unavailable ? 'unavailable' : 'available',
    reason: unavailable ? UNCONFIGURED_NODE_UNAVAILABLE : 'AUTHORIZED_CONFIGURED_NODE',
    sealed: input.sealed === true,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { node, unavailable, reason: node.reason };
}

export async function getNervousNode(nodeId: string, root: string) {
  const store = await load(root);
  return store.nodes.find((n) => n.id === nodeId) ?? null;
}

export async function observeComputeHealth(input: {
  nodeId: string;
  health: NervousNode['health'];
  root: string;
}) {
  const store = await load(input.root);
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node) return { ok: false as const, reason: 'NODE_NOT_FOUND' };
  if (!node.configured || !node.authorized) {
    node.status = 'unavailable';
    node.reason = UNCONFIGURED_NODE_UNAVAILABLE;
    await save(input.root, store);
    return { ok: false as const, node, reason: UNCONFIGURED_NODE_UNAVAILABLE };
  }
  node.health = input.health;
  if (input.health === 'unhealthy') node.status = 'unavailable';
  else if (input.health === 'degraded') node.status = 'available';
  else node.status = 'available';
  await save(input.root, store);
  return { ok: true as const, node, reason: 'HEALTH_OBSERVED' };
}

export async function declarePlacementFirewall(input: {
  name: string;
  denyLocalities: ComputeLocality[];
  allowCloud: boolean;
  root: string;
}) {
  const store = await load(input.root);
  const rule: PlacementFirewallRule = {
    id: id('fw'),
    name: input.name,
    denyLocalities: [...input.denyLocalities],
    denySealedBypass: true,
    allowCloud: input.allowCloud === true,
  };
  store.firewalls.push(rule);
  await save(input.root, store);
  return rule;
}

export async function evaluatePlacement(input: {
  workloadId: string;
  nodeId: string;
  firewallId?: string;
  root: string;
  actor: BzActor;
}): Promise<PlacementDecision> {
  const store = await load(input.root);
  const node = store.nodes.find((n) => n.id === input.nodeId);
  if (!node || node.status === 'unavailable' || !node.configured || !node.authorized) {
    const decision: PlacementDecision = {
      id: id('place'),
      nodeId: node?.id ?? null,
      workloadId: input.workloadId,
      allowed: false,
      status: 'unavailable',
      reason: UNCONFIGURED_NODE_UNAVAILABLE,
      mutatesInfrastructure: false,
      recommendationOnly: true,
    };
    store.placements.push(decision);
    await save(input.root, store);
    return decision;
  }

  const firewall =
    (input.firewallId
      ? store.firewalls.find((f) => f.id === input.firewallId)
      : store.firewalls[store.firewalls.length - 1]) ?? null;

  let blocked = false;
  let reason = FAILOVER_PLAN_ONLY;
  if (firewall) {
    if (firewall.denyLocalities.includes(node.locality)) {
      blocked = true;
      reason = PLACEMENT_FIREWALL_BLOCKED;
    }
    if (node.locality === 'cloud' && !firewall.allowCloud) {
      blocked = true;
      reason = PLACEMENT_FIREWALL_BLOCKED;
    }
    if (node.sealed && firewall.denySealedBypass) {
      // sealed nodes require explicit sealed-capable placement; default deny bypass
      if (node.locality === 'sealed' || node.sealed) {
        // Allow sealed locality only when not in deny list; still no silent bypass of sealed policy
        if (firewall.denyLocalities.includes('sealed') || firewall.denyLocalities.includes(node.locality)) {
          blocked = true;
          reason = PLACEMENT_FIREWALL_BLOCKED;
        }
      }
    }
  }

  const decision: PlacementDecision = {
    id: id('place'),
    nodeId: node.id,
    workloadId: input.workloadId,
    allowed: !blocked,
    status: blocked ? 'denied' : 'plan',
    reason: blocked ? reason : FAILOVER_PLAN_ONLY,
    mutatesInfrastructure: false,
    recommendationOnly: true,
  };
  store.placements.push(decision);
  await save(input.root, store);
  return decision;
}

export async function planFailover(input: {
  primaryNodeId: string;
  candidateNodeIds: string[];
  root: string;
  actor: BzActor;
}): Promise<FailoverPlan> {
  const store = await load(input.root);
  const eligible = input.candidateNodeIds.filter((cid) => {
    const n = store.nodes.find((x) => x.id === cid);
    return n && n.configured && n.authorized && n.status === 'available';
  });
  const plan: FailoverPlan = {
    id: id('fail'),
    primaryNodeId: input.primaryNodeId,
    candidateNodeIds: eligible,
    status: 'recommendation_only',
    mutatesInfrastructure: false,
    reason: FAILOVER_PLAN_ONLY,
  };
  store.failovers.push(plan);
  await save(input.root, store);
  return plan;
}

/** Hard deny: nervous system / optimizer cannot expand its own permissions. */
export async function attemptSelfPermissionExpansion(input: {
  actor: BzActor;
  requestedLevel: number;
  root: string;
}): Promise<{ accepted: false; denied: true; reason: typeof SELF_PERMISSION_EXPANSION_DENIED }> {
  const store = await load(input.root);
  store.permissionExpansionAttempts.push({
    id: id('perm'),
    actorId: input.actor.id,
    denied: true,
    reason: SELF_PERMISSION_EXPANSION_DENIED,
    at: new Date().toISOString(),
  });
  await save(input.root, store);
  return {
    accepted: false,
    denied: true,
    reason: SELF_PERMISSION_EXPANSION_DENIED,
  };
}

export async function listNervousNodes(root: string) {
  return (await load(root)).nodes;
}
