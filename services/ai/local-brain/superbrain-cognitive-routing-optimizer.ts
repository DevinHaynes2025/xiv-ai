/**
 * 62L-BZ Superbrain Cognitive Routing Optimizer — sparse route optimization across
 * trust, latency, locality, freshness, cost, consequence, evidence.
 * Congestion detection; recompilation on hardware/device/source/cache change.
 * Cannot self-expand permissions; cannot purchase/bill; trust/policy beat speed.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BZ_LOCKS,
  HONESTY_BANNER,
  OPTIMIZER_NO_PURCHASE,
  ROUTE_RECOMPILED,
  SEALED_TRUST_BEATS_SPEED,
  SELF_PERMISSION_EXPANSION_DENIED,
  type BzActor,
} from './global-compute-nervous-routing-types';

export type RouteWeights = {
  trust: number;
  latency: number;
  locality: number;
  freshness: number;
  cost: number;
  consequence: number;
  evidence: number;
};

export type CognitiveRouteCandidate = {
  id: string;
  label: string;
  trust: number; // 0..1
  latencyMs: number;
  localityScore: number;
  freshnessScore: number;
  costProxy: number;
  consequenceWeight: number;
  evidenceScore: number;
  sealedPolicyOk: boolean;
  lowTrust: boolean;
};

export type OptimizedRoute = {
  id: string;
  selectedCandidateId: string | null;
  rejectedFasterLowTrustId: string | null;
  score: number;
  status: 'selected' | 'denied' | 'congested' | 'recompiled';
  reason: string;
  recommendationOnly: true;
  purchaseAuthority: false;
  billingAuthority: false;
  mutatesInfrastructure: false;
  weights: RouteWeights;
  compiledAt: string;
  compileGeneration: number;
};

type Store = {
  candidates: CognitiveRouteCandidate[];
  routes: OptimizedRoute[];
  congestionEvents: Array<{
    id: string;
    routeId: string;
    detected: true;
    at: string;
  }>;
  purchaseAttempts: Array<{
    id: string;
    denied: true;
    reason: string;
    at: string;
  }>;
  compileGeneration: number;
  changeLog: Array<{
    id: string;
    changeKind: 'hardware' | 'device' | 'source' | 'cache' | 'other';
    at: string;
  }>;
};

const DEFAULT_WEIGHTS: RouteWeights = {
  trust: 0.35,
  latency: 0.1,
  locality: 0.1,
  freshness: 0.15,
  cost: 0.05,
  consequence: 0.1,
  evidence: 0.15,
};

function storePath(root: string) {
  return xivLocalPath(root, 'superbrain-cognitive-routing-optimizer.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    candidates: [],
    routes: [],
    congestionEvents: [],
    purchaseAttempts: [],
    compileGeneration: 1,
    changeLog: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function scoreCandidate(c: CognitiveRouteCandidate, w: RouteWeights): number {
  // Higher trust/freshness/evidence/locality better; lower latency/cost/consequence better.
  const latencyNorm = 1 / (1 + c.latencyMs / 100);
  const costNorm = 1 / (1 + c.costProxy);
  const consequenceNorm = 1 / (1 + c.consequenceWeight);
  return (
    w.trust * c.trust +
    w.latency * latencyNorm +
    w.locality * c.localityScore +
    w.freshness * c.freshnessScore +
    w.cost * costNorm +
    w.consequence * consequenceNorm +
    w.evidence * c.evidenceScore
  );
}

export function cognitiveRoutingHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BZ_LOCKS.L4_AUTONOMY_ENABLED,
    speedOverridesSealedTrust: BZ_LOCKS.SPEED_OVERRIDES_SEALED_TRUST,
    trustPolicyBeatsSpeed: BZ_LOCKS.TRUST_POLICY_BEATS_SPEED,
    costIsPurchaseAuthority: BZ_LOCKS.COST_WEIGHT_IS_PURCHASE_AUTHORITY,
    consequenceIsBillingAuthority: BZ_LOCKS.CONSEQUENCE_WEIGHT_IS_BILLING_AUTHORITY,
    optimizerPurchaseBillCharge: BZ_LOCKS.OPTIMIZER_PURCHASE_BILL_CHARGE,
    selfPermissionExpansion: BZ_LOCKS.SELF_PERMISSION_EXPANSION,
    routeRecompileOnChange: BZ_LOCKS.ROUTE_RECOMPILE_ON_CHANGE,
  };
}

export async function registerRouteCandidate(input: {
  label: string;
  trust: number;
  latencyMs: number;
  localityScore: number;
  freshnessScore: number;
  costProxy: number;
  consequenceWeight: number;
  evidenceScore: number;
  sealedPolicyOk: boolean;
  root: string;
}): Promise<CognitiveRouteCandidate> {
  const store = await load(input.root);
  const candidate: CognitiveRouteCandidate = {
    id: id('rcand'),
    label: input.label,
    trust: input.trust,
    latencyMs: input.latencyMs,
    localityScore: input.localityScore,
    freshnessScore: input.freshnessScore,
    costProxy: input.costProxy,
    consequenceWeight: input.consequenceWeight,
    evidenceScore: input.evidenceScore,
    sealedPolicyOk: input.sealedPolicyOk === true,
    lowTrust: input.trust < 0.5,
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return candidate;
}

export async function optimizeCognitiveRoute(input: {
  candidateIds?: string[];
  weights?: Partial<RouteWeights>;
  root: string;
  actor: BzActor;
}): Promise<OptimizedRoute> {
  const store = await load(input.root);
  const weights: RouteWeights = { ...DEFAULT_WEIGHTS, ...input.weights };
  // Cost/consequence weights never grant purchase/billing authority.
  void weights.cost;
  void weights.consequence;

  let pool = store.candidates;
  if (input.candidateIds?.length) {
    pool = pool.filter((c) => input.candidateIds!.includes(c.id));
  }

  const sealedOk = pool.filter((c) => c.sealedPolicyOk);
  const eligible = sealedOk.length ? sealedOk : [];

  // Faster low-trust routes that fail sealed policy lose.
  const fasterLowTrust = pool
    .filter((c) => c.lowTrust || !c.sealedPolicyOk)
    .sort((a, b) => a.latencyMs - b.latencyMs)[0];

  if (!eligible.length) {
    const denied: OptimizedRoute = {
      id: id('route'),
      selectedCandidateId: null,
      rejectedFasterLowTrustId: fasterLowTrust?.id ?? null,
      score: 0,
      status: 'denied',
      reason: SEALED_TRUST_BEATS_SPEED,
      recommendationOnly: true,
      purchaseAuthority: false,
      billingAuthority: false,
      mutatesInfrastructure: false,
      weights,
      compiledAt: new Date().toISOString(),
      compileGeneration: store.compileGeneration,
    };
    store.routes.push(denied);
    await save(input.root, store);
    return denied;
  }

  const ranked = eligible
    .map((c) => ({ c, score: scoreCandidate(c, weights) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]!;
  // If a faster low-trust candidate exists outside sealed set, record rejection.
  const rejectedFaster =
    fasterLowTrust &&
    (!fasterLowTrust.sealedPolicyOk || fasterLowTrust.lowTrust) &&
    fasterLowTrust.latencyMs < best.c.latencyMs
      ? fasterLowTrust.id
      : null;

  const selected: OptimizedRoute = {
    id: id('route'),
    selectedCandidateId: best.c.id,
    rejectedFasterLowTrustId: rejectedFaster,
    score: best.score,
    status: 'selected',
    reason: rejectedFaster ? SEALED_TRUST_BEATS_SPEED : 'SPARSE_ROUTE_OPTIMIZED_RECOMMENDATION',
    recommendationOnly: true,
    purchaseAuthority: false,
    billingAuthority: false,
    mutatesInfrastructure: false,
    weights,
    compiledAt: new Date().toISOString(),
    compileGeneration: store.compileGeneration,
  };
  store.routes.push(selected);
  await save(input.root, store);
  return selected;
}

export async function detectRouteCongestion(input: {
  routeId: string;
  activeCount: number;
  capacity: number;
  root: string;
}): Promise<{ congested: boolean; reason: string }> {
  const store = await load(input.root);
  const congested = input.activeCount > input.capacity;
  if (congested) {
    store.congestionEvents.push({
      id: id('cong'),
      routeId: input.routeId,
      detected: true,
      at: new Date().toISOString(),
    });
    await save(input.root, store);
  }
  return {
    congested,
    reason: congested ? 'ROUTE_CONGESTION_DETECTED' : 'ROUTE_WITHIN_CAPACITY',
  };
}

export async function noteTopologyChange(input: {
  changeKind: 'hardware' | 'device' | 'source' | 'cache' | 'other';
  root: string;
  actor: BzActor;
}): Promise<{ compileGeneration: number; reason: typeof ROUTE_RECOMPILED }> {
  const store = await load(input.root);
  store.compileGeneration += 1;
  store.changeLog.push({
    id: id('chg'),
    changeKind: input.changeKind,
    at: new Date().toISOString(),
  });
  await save(input.root, store);
  return { compileGeneration: store.compileGeneration, reason: ROUTE_RECOMPILED };
}

export async function recompileRoutesOnChange(input: {
  changeKind: 'hardware' | 'device' | 'source' | 'cache' | 'other';
  candidateIds?: string[];
  root: string;
  actor: BzActor;
}): Promise<OptimizedRoute> {
  await noteTopologyChange({
    changeKind: input.changeKind,
    root: input.root,
    actor: input.actor,
  });
  const route = await optimizeCognitiveRoute({
    candidateIds: input.candidateIds,
    root: input.root,
    actor: input.actor,
  });
  route.status = 'recompiled';
  route.reason = ROUTE_RECOMPILED;
  const store = await load(input.root);
  const last = store.routes[store.routes.length - 1];
  if (last) {
    last.status = 'recompiled';
    last.reason = ROUTE_RECOMPILED;
    await save(input.root, store);
  }
  return { ...route, status: 'recompiled', reason: ROUTE_RECOMPILED };
}

export async function attemptOptimizerPurchaseOrBill(input: {
  action: 'purchase' | 'bill' | 'charge';
  amount: number;
  root: string;
  actor: BzActor;
}): Promise<{ accepted: false; denied: true; reason: typeof OPTIMIZER_NO_PURCHASE }> {
  const store = await load(input.root);
  store.purchaseAttempts.push({
    id: id('buy'),
    denied: true,
    reason: OPTIMIZER_NO_PURCHASE,
    at: new Date().toISOString(),
  });
  await save(input.root, store);
  return { accepted: false, denied: true, reason: OPTIMIZER_NO_PURCHASE };
}

export async function attemptOptimizerSelfPermissionExpansion(input: {
  actor: BzActor;
  requestedLevel: number;
  root: string;
}): Promise<{
  accepted: false;
  denied: true;
  reason: typeof SELF_PERMISSION_EXPANSION_DENIED;
}> {
  void input.requestedLevel;
  return {
    accepted: false,
    denied: true,
    reason: SELF_PERMISSION_EXPANSION_DENIED,
  };
}

export async function listRouteCandidates(root: string) {
  return (await load(root)).candidates;
}

export async function getCompileGeneration(root: string) {
  return (await load(root)).compileGeneration;
}
