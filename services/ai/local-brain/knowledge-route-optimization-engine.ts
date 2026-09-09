/**
 * 62L-CM Knowledge Route Optimization Engine.
 * Optimizes across approved cloud/server/database/edge nodes only.
 * Trust/policy beat speed/cost; sealed never silent regional-cloud fallback.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CM_LOCKS,
  HONESTY_BANNER,
  SEALED_REGIONAL_CLOUD_DENIED,
  TRUST_POLICY_ROUTE_WINS,
  UNAPPROVED_NODE_EXCLUDED,
  type CmActor,
} from './sovereign-regional-knowledge-clouds-types';

export type RouteNodeKind = 'cloud' | 'server' | 'database' | 'edge' | 'regional_cloud';

export type RouteNode = {
  id: string;
  label: string;
  kind: RouteNodeKind;
  approved: boolean;
  trustScore: number;
  latencyMs: number;
  costScore: number;
  localityScore: number;
  freshnessScore: number;
  policyTier: Array<'open' | 'local_only' | 'sealed'>;
  createdAt: string;
};

export type OptimizedRoute = {
  id: string;
  contentClass: 'open' | 'local_only' | 'sealed';
  selectedNodeId: string | null;
  candidateNodeIds: string[];
  excludedNodeIds: string[];
  accepted: boolean;
  reason: string;
  silentRegionalCloudFallback: false;
  trustPolicyBeatsSpeed: true;
  at: string;
};

type Store = {
  nodes: RouteNode[];
  routes: OptimizedRoute[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'knowledge-route-optimization-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function routeOptimizationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CM_LOCKS.L4_AUTONOMY_ENABLED,
    unapprovedNodeInRouteOptimization: CM_LOCKS.UNAPPROVED_NODE_IN_ROUTE_OPTIMIZATION,
    trustPolicyBeatsSpeedCost: CM_LOCKS.TRUST_POLICY_BEATS_SPEED_COST,
    sealedSilentRegionalCloudFallback: CM_LOCKS.SEALED_SILENT_REGIONAL_CLOUD_FALLBACK,
  };
}

export async function registerRouteNode(input: {
  label: string;
  kind: RouteNodeKind;
  approved: boolean;
  trustScore: number;
  latencyMs: number;
  costScore?: number;
  localityScore?: number;
  freshnessScore?: number;
  policyTier?: RouteNode['policyTier'];
  root: string;
}): Promise<RouteNode> {
  const store = await load(input.root);
  const node: RouteNode = {
    id: id('rnode'),
    label: input.label,
    kind: input.kind,
    approved: input.approved === true,
    trustScore: input.trustScore,
    latencyMs: input.latencyMs,
    costScore: input.costScore ?? 50,
    localityScore: input.localityScore ?? 50,
    freshnessScore: input.freshnessScore ?? 50,
    policyTier: input.policyTier ?? ['open'],
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

function scoreNode(node: RouteNode): number {
  // Higher is better. Trust/policy dominate latency/cost.
  return (
    node.trustScore * 1000 +
    node.localityScore * 10 +
    node.freshnessScore * 5 -
    node.latencyMs -
    node.costScore
  );
}

export async function optimizeKnowledgeRoute(input: {
  contentClass: 'open' | 'local_only' | 'sealed';
  /** Probe: attempt silent regional-cloud fallback for sealed content. */
  attemptSilentRegionalCloudFallback?: boolean;
  root: string;
  actor: CmActor;
}): Promise<OptimizedRoute> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const excluded: string[] = [];
  const candidates: RouteNode[] = [];

  for (const node of store.nodes) {
    if (!node.approved) {
      excluded.push(node.id);
      continue;
    }
    if (!node.policyTier.includes(input.contentClass) && input.contentClass !== 'open') {
      // sealed/local_only require explicit policy tier support
      if (input.contentClass === 'sealed' && !node.policyTier.includes('sealed')) {
        excluded.push(node.id);
        continue;
      }
      if (input.contentClass === 'local_only' && !node.policyTier.includes('local_only')) {
        excluded.push(node.id);
        continue;
      }
    }
    candidates.push(node);
  }

  const route: OptimizedRoute = {
    id: id('kroute'),
    contentClass: input.contentClass,
    selectedNodeId: null,
    candidateNodeIds: candidates.map((c) => c.id),
    excludedNodeIds: excluded,
    accepted: false,
    reason: UNAPPROVED_NODE_EXCLUDED,
    silentRegionalCloudFallback: false,
    trustPolicyBeatsSpeed: true,
    at: now,
  };

  // Sealed content must never silent-route to regional cloud.
  if (
    input.contentClass === 'sealed' &&
    input.attemptSilentRegionalCloudFallback === true
  ) {
    const regional =
      store.nodes.find((n) => n.kind === 'regional_cloud' && n.approved) ?? null;
    route.selectedNodeId = regional?.id ?? null;
    route.accepted = false;
    route.reason = SEALED_REGIONAL_CLOUD_DENIED;
    route.silentRegionalCloudFallback = false;
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  if (candidates.length === 0) {
    route.accepted = false;
    route.reason =
      excluded.length > 0
        ? UNAPPROVED_NODE_EXCLUDED
        : 'NO_APPROVED_ROUTE_CANDIDATES';
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  // Prefer trust/policy over raw speed: sort by composite score (trust dominates).
  const ranked = [...candidates].sort((a, b) => scoreNode(b) - scoreNode(a));
  const winner = ranked[0]!;

  // Document that a faster low-trust candidate loses.
  const fasterLowTrust = candidates.find(
    (c) => c.latencyMs < winner.latencyMs && c.trustScore < winner.trustScore,
  );

  route.selectedNodeId = winner.id;
  route.accepted = true;
  route.reason = fasterLowTrust
    ? TRUST_POLICY_ROUTE_WINS
    : 'ROUTE_OPTIMIZED_APPROVED_NODES_TRUST_POLICY_FIRST';
  store.routes.push(route);
  await save(input.root, store);
  return route;
}
