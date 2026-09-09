import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ATTRACTOR_SOFTWARE_ONLY,
  BL_LOCKS,
  GRAVITATIONAL_PULL_GLOSSARY,
  SEALED_ROUTE_DENIED,
  SPEED_LOSES_TO_TRUST,
  UNVERIFIED_ROUTE_UNAVAILABLE,
  type BlActor,
} from './org-agent-universe-types';

export const SYNAPSE_FABRIC_FILE = 'hybrid-synapse-fabric.json';

/**
 * Routing attractors ("gravitational pull") are **software weights only** —
 * not literal astronomy/physics gravity. See GRAVITATIONAL_PULL_GLOSSARY.
 */
export type RoutingAttractorWeights = {
  trust: number;
  latency: number;
  locality: number;
  freshness: number;
  cost: number;
  resourceAvailability: number;
  /** Always false — metaphor lock. */
  literalGravity: false;
};

export type SynapseRouteKind = 'local' | 'cloud' | 'peer' | 'telemetry' | 'global_ops';

export type SynapseRoute = {
  id: string;
  orgId: string;
  universeId: string;
  kind: SynapseRouteKind;
  label: string;
  verified: boolean;
  sealed: boolean;
  /** Milliseconds — lower is faster; never overrides sealed/trust deny. */
  latencyMs: number;
  costScore: number;
  localityScore: number;
  freshnessScore: number;
  trustScore: number;
  resourceScore: number;
  state: 'AVAILABLE' | 'UNAVAILABLE' | 'DENIED';
  createdAt: string;
};

export type SynapseSelection = {
  id: string;
  at: string;
  orgId: string;
  selectedRouteId: string | null;
  candidates: string[];
  reason: string;
  /** Attractors used — software weights, not literal gravity. */
  attractorNote: typeof ATTRACTOR_SOFTWARE_ONLY;
  speedOverrodeSecurity: false;
  costOverrodeSecurity: false;
};

type FabricStore = {
  routes: SynapseRoute[];
  selections: SynapseSelection[];
};

const MAX_ROUTES = 5_000;
const MAX_SELECTIONS = 10_000;

/** Default attractor weights — software only. Trust dominates; speed cannot bypass sealed deny. */
export const DEFAULT_ATTRACTORS: RoutingAttractorWeights = {
  trust: 100,
  latency: 10,
  locality: 20,
  freshness: 15,
  cost: 5,
  resourceAvailability: 10,
  literalGravity: false,
};

function storePath(root: string) {
  return xivLocalPath(root, SYNAPSE_FABRIC_FILE);
}

async function load(root: string): Promise<FabricStore> {
  const parsed = await readJsonFile<FabricStore>(storePath(root), { routes: [], selections: [] });
  return {
    routes: Array.isArray(parsed.routes) ? parsed.routes : [],
    selections: Array.isArray(parsed.selections) ? parsed.selections : [],
  };
}

async function save(root: string, store: FabricStore) {
  await writeJsonFileAtomic(storePath(root), {
    routes: store.routes.slice(-MAX_ROUTES),
    selections: store.selections.slice(-MAX_SELECTIONS),
  });
}

function clamp01to100(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/**
 * Score a route with software attractor weights ("gravitational pull" metaphor).
 * Sealed/unverified routes are never scored into selection winners.
 */
export function scoreRouteAttractors(
  route: SynapseRoute,
  weights: RoutingAttractorWeights = DEFAULT_ATTRACTORS,
): number {
  // Latency: invert so lower latency contributes positively — but trust still dominates.
  const latencyAttract = Math.max(0, 100 - Math.min(route.latencyMs / 10, 100));
  return (
    weights.trust * clamp01to100(route.trustScore) +
    weights.latency * latencyAttract +
    weights.locality * clamp01to100(route.localityScore) +
    weights.freshness * clamp01to100(route.freshnessScore) +
    weights.cost * (100 - clamp01to100(route.costScore)) +
    weights.resourceAvailability * clamp01to100(route.resourceScore)
  );
}

export function gravitationalPullHonesty() {
  return {
    ...GRAVITATIONAL_PULL_GLOSSARY,
    defaultAttractors: DEFAULT_ATTRACTORS,
    note: ATTRACTOR_SOFTWARE_ONLY,
    locks: {
      GRAVITATIONAL_PULL_IS_LITERAL: BL_LOCKS.GRAVITATIONAL_PULL_IS_LITERAL,
      GRAVITATIONAL_PULL_IS_SOFTWARE_WEIGHTS: BL_LOCKS.GRAVITATIONAL_PULL_IS_SOFTWARE_WEIGHTS,
      SPEED_OVERRIDES_SECURITY: BL_LOCKS.SPEED_OVERRIDES_SECURITY,
    },
  };
}

export async function declareSynapseRoute(input: {
  orgId: string;
  universeId: string;
  kind: SynapseRouteKind;
  label: string;
  verified: boolean;
  sealed?: boolean;
  latencyMs: number;
  costScore?: number;
  localityScore?: number;
  freshnessScore?: number;
  trustScore?: number;
  resourceScore?: number;
  actor: BlActor;
  root?: string;
  now?: number;
}) {
  if (!input.orgId || !input.universeId) {
    return { accepted: false as const, reason: 'ORG_AND_UNIVERSE_REQUIRED' };
  }
  if (input.actor.orgId !== input.orgId) {
    return { accepted: false as const, reason: 'CROSS_ORG_ROUTE_DECLARE_DENIED' };
  }

  const verified = input.verified === true;
  const sealed = input.sealed === true;
  let state: SynapseRoute['state'] = 'AVAILABLE';
  if (!verified) state = 'UNAVAILABLE';
  if (sealed && input.kind !== 'local') state = 'DENIED';

  const route: SynapseRoute = {
    id: `syn_${randomUUID()}`,
    orgId: input.orgId,
    universeId: input.universeId,
    kind: input.kind,
    label: input.label,
    verified,
    sealed,
    latencyMs: Math.max(0, input.latencyMs),
    costScore: clamp01to100(input.costScore ?? 50),
    localityScore: clamp01to100(input.localityScore ?? (input.kind === 'local' ? 100 : 40)),
    freshnessScore: clamp01to100(input.freshnessScore ?? 50),
    trustScore: clamp01to100(input.trustScore ?? (verified ? 80 : 0)),
    resourceScore: clamp01to100(input.resourceScore ?? 50),
    state,
    createdAt: new Date(input.now ?? Date.now()).toISOString(),
  };

  const root = input.root ?? process.cwd();
  const store = await load(root);
  store.routes.push(route);
  await save(root, store);

  return {
    accepted: true as const,
    route,
    reason: verified
      ? sealed
        ? 'Sealed route declared; ordinary/cloud/peer/telemetry access remains denied.'
        : 'Verified synapse route declared.'
      : UNVERIFIED_ROUTE_UNAVAILABLE,
    attractorNote: ATTRACTOR_SOFTWARE_ONLY,
  };
}

/**
 * Select the fastest **safe** path among verified routes.
 * Unverified → UNAVAILABLE. Sealed deny cannot be bypassed by speed/cost.
 * Attractors are software weights — not literal gravity.
 */
export async function selectSynapseRoute(input: {
  orgId: string;
  universeId: string;
  actor: BlActor;
  /** Prefer kinds; sealed surfaces always denied for ordinary actors. */
  allowKinds?: SynapseRouteKind[];
  requireSealedAccess?: boolean;
  surface?: 'ordinary_org' | 'cloud' | 'peer' | 'telemetry' | 'global_ops';
  weights?: RoutingAttractorWeights;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const weights = input.weights ?? DEFAULT_ATTRACTORS;
  const surface = input.surface ?? 'ordinary_org';
  const allowKinds = new Set(input.allowKinds ?? ['local', 'cloud', 'peer', 'global_ops']);

  // Sealed-route denial from ordinary org / cloud / peer / telemetry
  if (
    (surface === 'ordinary_org' || surface === 'cloud' || surface === 'peer' || surface === 'telemetry') &&
    input.requireSealedAccess
  ) {
    const selection: SynapseSelection = {
      id: `sel_${randomUUID()}`,
      at: new Date().toISOString(),
      orgId: input.orgId,
      selectedRouteId: null,
      candidates: [],
      reason: SEALED_ROUTE_DENIED,
      attractorNote: ATTRACTOR_SOFTWARE_ONLY,
      speedOverrodeSecurity: false,
      costOverrodeSecurity: false,
    };
    store.selections.push(selection);
    await save(root, store);
    return {
      selected: false as const,
      reason: SEALED_ROUTE_DENIED,
      selection,
      state: 'DENIED' as const,
      speedOverrodeSecurity: false as const,
    };
  }

  const candidates = store.routes.filter(
    (route) =>
      route.orgId === input.orgId &&
      route.universeId === input.universeId &&
      allowKinds.has(route.kind),
  );

  // Unverified cloud routes are UNAVAILABLE
  const unverifiedCloud = candidates.filter((route) => route.kind === 'cloud' && !route.verified);
  if (candidates.every((route) => !route.verified) && unverifiedCloud.length > 0) {
    const selection: SynapseSelection = {
      id: `sel_${randomUUID()}`,
      at: new Date().toISOString(),
      orgId: input.orgId,
      selectedRouteId: null,
      candidates: unverifiedCloud.map((route) => route.id),
      reason: UNVERIFIED_ROUTE_UNAVAILABLE,
      attractorNote: ATTRACTOR_SOFTWARE_ONLY,
      speedOverrodeSecurity: false,
      costOverrodeSecurity: false,
    };
    store.selections.push(selection);
    await save(root, store);
    return {
      selected: false as const,
      reason: UNVERIFIED_ROUTE_UNAVAILABLE,
      selection,
      state: 'UNAVAILABLE' as const,
      speedOverrodeSecurity: false as const,
    };
  }

  // Eligible: verified, not sealed (unless principal), not DENIED
  const eligible = candidates.filter((route) => {
    if (!route.verified) return false;
    if (route.state === 'DENIED' || route.state === 'UNAVAILABLE') return false;
    if (route.sealed) return false; // sealed never selected for ordinary path
    return true;
  });

  if (eligible.length === 0) {
    const hasUnverifiedOnly = candidates.some((route) => !route.verified);
    const reason = hasUnverifiedOnly ? UNVERIFIED_ROUTE_UNAVAILABLE : 'NO_VERIFIED_SAFE_ROUTE';
    const selection: SynapseSelection = {
      id: `sel_${randomUUID()}`,
      at: new Date().toISOString(),
      orgId: input.orgId,
      selectedRouteId: null,
      candidates: candidates.map((route) => route.id),
      reason,
      attractorNote: ATTRACTOR_SOFTWARE_ONLY,
      speedOverrodeSecurity: false,
      costOverrodeSecurity: false,
    };
    store.selections.push(selection);
    await save(root, store);
    return {
      selected: false as const,
      reason,
      selection,
      state: hasUnverifiedOnly ? ('UNAVAILABLE' as const) : ('DENIED' as const),
      speedOverrodeSecurity: false as const,
    };
  }

  // Faster-but-untrusted must lose to sealed/trust policy.
  // Any unverified/low-trust "fast" candidate is excluded from eligible above;
  // among eligible, trust weight dominates DEFAULT_ATTRACTORS.
  const ranked = [...eligible].sort((a, b) => scoreRouteAttractors(b, weights) - scoreRouteAttractors(a, weights));
  const winner = ranked[0];

  // Explicit hard rule: if a faster candidate had lower trust, it still loses.
  const fasterUntrusted = candidates.find(
    (route) =>
      route.id !== winner.id &&
      route.latencyMs < winner.latencyMs &&
      (route.trustScore < winner.trustScore || !route.verified || route.sealed),
  );

  const selection: SynapseSelection = {
    id: `sel_${randomUUID()}`,
    at: new Date().toISOString(),
    orgId: input.orgId,
    selectedRouteId: winner.id,
    candidates: ranked.map((route) => route.id),
    reason: fasterUntrusted
      ? SPEED_LOSES_TO_TRUST
      : 'Selected fastest safe verified route via software attractor weights (not literal gravity).',
    attractorNote: ATTRACTOR_SOFTWARE_ONLY,
    speedOverrodeSecurity: false,
    costOverrodeSecurity: false,
  };
  store.selections.push(selection);
  await save(root, store);

  return {
    selected: true as const,
    route: winner,
    selection,
    reason: selection.reason,
    score: scoreRouteAttractors(winner, weights),
    speedOverrodeSecurity: false as const,
    costOverrodeSecurity: false as const,
    attractorNote: ATTRACTOR_SOFTWARE_ONLY,
    glossary: GRAVITATIONAL_PULL_GLOSSARY,
  };
}

/**
 * Probe: prefer a faster untrusted route over a sealed/trusted one — must fail.
 */
export async function probeSpeedOverrideSecurity(input: {
  orgId: string;
  universeId: string;
  actor: BlActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  // Ensure probe routes exist
  const fastUntrusted: SynapseRoute = {
    id: `probe_fast_${randomUUID()}`,
    orgId: input.orgId,
    universeId: input.universeId,
    kind: 'cloud',
    label: 'fast-untrusted-cloud',
    verified: false,
    sealed: false,
    latencyMs: 1,
    costScore: 1,
    localityScore: 10,
    freshnessScore: 90,
    trustScore: 0,
    resourceScore: 90,
    state: 'UNAVAILABLE',
    createdAt: new Date().toISOString(),
  };
  const slowTrusted: SynapseRoute = {
    id: `probe_slow_${randomUUID()}`,
    orgId: input.orgId,
    universeId: input.universeId,
    kind: 'local',
    label: 'slow-trusted-local',
    verified: true,
    sealed: false,
    latencyMs: 500,
    costScore: 40,
    localityScore: 100,
    freshnessScore: 70,
    trustScore: 95,
    resourceScore: 80,
    state: 'AVAILABLE',
    createdAt: new Date().toISOString(),
  };
  store.routes.push(fastUntrusted, slowTrusted);
  await save(root, store);

  const result = await selectSynapseRoute({
    orgId: input.orgId,
    universeId: input.universeId,
    actor: input.actor,
    allowKinds: ['local', 'cloud'],
    root,
  });

  const pickedFastUntrusted =
    result.selected === true && result.route?.id === fastUntrusted.id;

  return {
    allowedSpeedOverride: false as const,
    pickedFastUntrusted: pickedFastUntrusted === true,
    selectedRouteId: result.selected ? result.route.id : null,
    preferredTrustedId: slowTrusted.id,
    fastUntrustedId: fastUntrusted.id,
    reason: SPEED_LOSES_TO_TRUST,
    speedOverrodeSecurity: false as const,
    locks: {
      SPEED_OVERRIDES_SECURITY: BL_LOCKS.SPEED_OVERRIDES_SECURITY,
      COST_OVERRIDES_SECURITY: BL_LOCKS.COST_OVERRIDES_SECURITY,
    },
    attractorNote: ATTRACTOR_SOFTWARE_ONLY,
  };
}

export async function listSynapseRoutes(orgId: string, root = process.cwd()) {
  return (await load(root)).routes.filter((route) => route.orgId === orgId);
}

export function synapseFabricHonesty() {
  return {
    unverifiedRouteState: 'UNAVAILABLE' as const,
    speedOverridesSecurity: false as const,
    costOverridesSecurity: false as const,
    gravitationalPullIsLiteral: false as const,
    gravitationalPullIsSoftwareWeights: true as const,
    attractorNote: ATTRACTOR_SOFTWARE_ONLY,
    glossary: GRAVITATIONAL_PULL_GLOSSARY,
    productionAuthorization: false as const,
    locks: BL_LOCKS,
  };
}
