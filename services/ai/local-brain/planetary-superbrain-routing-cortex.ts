/**
 * 62L-BX Planetary Superbrain Routing Cortex —
 * Sparse routes connecting chips, devices, agents, tools, workflows, knowledge, Universes.
 * Weights: trust, latency, cost, freshness, policy — speed never overrides sealed/trust.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BX_LOCKS,
  HONESTY_BANNER,
  SEALED_TRUST_BEATS_SPEED,
  type BxActor,
  type RouteEndpointKind,
} from './neural-chip-os-semiconductor-twin-types';

export type RouteEndpoint = {
  id: string;
  kind: RouteEndpointKind;
  label: string;
  trust: number;
  latencyMs: number;
  costUnits: number;
  freshnessScore: number;
  sealed: boolean;
  policyDeny: boolean;
};

export type ScoredRoute = {
  id: string;
  fromId: string;
  toId: string;
  trust: number;
  latencyMs: number;
  costUnits: number;
  freshnessScore: number;
  policyWeight: number;
  compositeScore: number;
  selected: boolean;
  rejectedReason: string | null;
  sealedProtected: boolean;
};

type Store = {
  endpoints: RouteEndpoint[];
  decisions: ScoredRoute[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'planetary-superbrain-routing.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { endpoints: [], decisions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Composite score: trust and policy dominate; latency/cost/freshness are secondary.
 * Sealed or policy-deny endpoints cannot be overridden by speed.
 */
export function scoreRouteCandidate(endpoint: RouteEndpoint): {
  compositeScore: number;
  policyWeight: number;
  eligible: boolean;
  rejectedReason: string | null;
} {
  if (endpoint.policyDeny) {
    return {
      compositeScore: -Infinity,
      policyWeight: 0,
      eligible: false,
      rejectedReason: 'POLICY_DENY',
    };
  }

  const trust = clamp01(endpoint.trust);
  const freshness = clamp01(endpoint.freshnessScore);
  // Lower latency/cost → higher secondary score (0..1)
  const latencyScore = 1 / (1 + Math.max(0, endpoint.latencyMs) / 100);
  const costScore = 1 / (1 + Math.max(0, endpoint.costUnits));

  // Sealed endpoints get absolute policy weight; speed cannot override.
  const policyWeight = endpoint.sealed ? 1 : 0.5 + 0.5 * trust;

  if (endpoint.sealed && trust < 0.85) {
    return {
      compositeScore: -Infinity,
      policyWeight,
      eligible: false,
      rejectedReason: SEALED_TRUST_BEATS_SPEED,
    };
  }

  // Trust * 10 + policy * 5 + freshness + latency + cost — speed never dominates trust.
  const compositeScore =
    trust * 10 + policyWeight * 5 + freshness * 1.5 + latencyScore * 0.5 + costScore * 0.5;

  return {
    compositeScore,
    policyWeight,
    eligible: true,
    rejectedReason: null,
  };
}

export async function registerRouteEndpoint(input: RouteEndpoint & { root?: string }) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const endpoint: RouteEndpoint = {
    id: input.id,
    kind: input.kind,
    label: input.label,
    trust: clamp01(input.trust),
    latencyMs: Math.max(0, input.latencyMs),
    costUnits: Math.max(0, input.costUnits),
    freshnessScore: clamp01(input.freshnessScore),
    sealed: Boolean(input.sealed),
    policyDeny: Boolean(input.policyDeny),
  };
  const idx = store.endpoints.findIndex((e) => e.id === endpoint.id);
  if (idx >= 0) store.endpoints[idx] = endpoint;
  else store.endpoints.push(endpoint);
  await save(root, store);
  return endpoint;
}

/**
 * Choose sparse route among candidates. Faster low-trust loses to sealed/high-trust/policy.
 */
export async function selectSparseRoute(input: {
  fromId: string;
  candidates: RouteEndpoint[];
  actor: BxActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  const scored: ScoredRoute[] = input.candidates.map((c) => {
    const s = scoreRouteCandidate(c);
    return {
      id: id('route'),
      fromId: input.fromId,
      toId: c.id,
      trust: c.trust,
      latencyMs: c.latencyMs,
      costUnits: c.costUnits,
      freshnessScore: c.freshnessScore,
      policyWeight: s.policyWeight,
      compositeScore: s.compositeScore,
      selected: false,
      rejectedReason: s.rejectedReason,
      sealedProtected: c.sealed,
    };
  });

  const eligible = scored.filter((s) => s.rejectedReason === null);
  eligible.sort((a, b) => b.compositeScore - a.compositeScore);

  let winner: ScoredRoute | null = eligible[0] ?? null;
  if (winner) winner.selected = true;

  // Explicit check: if a faster low-trust candidate exists but lost, stamp reason.
  const fasterLowTrust = scored.find(
    (s) =>
      !s.selected &&
      s.latencyMs < (winner?.latencyMs ?? Infinity) &&
      s.trust < (winner?.trust ?? 0),
  );
  if (fasterLowTrust && winner && fasterLowTrust.trust < 0.5 && winner.trust >= 0.8) {
    fasterLowTrust.rejectedReason = fasterLowTrust.rejectedReason ?? SEALED_TRUST_BEATS_SPEED;
  }

  store.decisions.push(...scored);
  if (store.decisions.length > 5_000) store.decisions = store.decisions.slice(-5_000);
  await save(root, store);

  return {
    selected: winner,
    scored,
    speedOverrideDenied: BX_LOCKS.SPEED_OVERRIDES_SEALED_TRUST === false,
    actorId: input.actor.id,
  };
}

export function routingCortexHonesty() {
  return {
    banner: HONESTY_BANNER,
    L4_AUTONOMY_ENABLED: BX_LOCKS.L4_AUTONOMY_ENABLED,
    speedOverridesSealedTrust: BX_LOCKS.SPEED_OVERRIDES_SEALED_TRUST,
    sparseRoutingWeighted: BX_LOCKS.SPARSE_ROUTING_WEIGHTED,
    founderSealedDenyByDefault: BX_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    productionAuthorization: BX_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
