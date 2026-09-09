/**
 * 62L-CN World Knowledge Routing OS — policy-aware façade under Superbrain.
 * Routes approved knowledge only among configured endpoints.
 * Unconfigured → DENIED/UNAVAILABLE; sealed never silent international corridor;
 * policy/trust beat speed/cost; arbitrary discovery DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARBITRARY_DISCOVERY_DENIED,
  CN_LOCKS,
  HONESTY_BANNER,
  POLICY_BEATS_SPEED,
  SEALED_CORRIDOR_DENIED,
  UNAPPROVED_KNOWLEDGE_CORRIDOR_DENIED,
  UNCONFIGURED_ENDPOINT_DENIED,
  type CnActor,
  type CnEndpointKind,
  type CnKnowledgeClass,
} from './world-knowledge-routing-os-types';

export type ConfiguredEndpoint = {
  id: string;
  label: string;
  kind: CnEndpointKind;
  region: string;
  configured: boolean;
  authorized: boolean;
  trustScore: number;
  sealedCapable: boolean;
  createdAt: string;
};

export type KnowledgePacket = {
  id: string;
  class: CnKnowledgeClass;
  approved: boolean;
  sealed: boolean;
  summary: string;
  createdAt: string;
};

export type RouteDecision = {
  id: string;
  endpointId: string | null;
  packetId: string | null;
  accepted: boolean;
  reason: string;
  selectedBy: 'policy_trust' | 'denied' | 'unavailable' | 'none';
  silentCorridorFallback: false;
  latencyMsHint: number | null;
  trustScoreUsed: number | null;
  at: string;
};

type Store = {
  endpoints: ConfiguredEndpoint[];
  packets: KnowledgePacket[];
  routes: RouteDecision[];
  discoveryDenials: Array<{ id: string; at: string; reason: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'world-knowledge-routing-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    endpoints: [],
    packets: [],
    routes: [],
    discoveryDenials: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function worldKnowledgeRoutingHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CN_LOCKS.L4_AUTONOMY_ENABLED,
    localFirst: CN_LOCKS.LOCAL_FIRST,
    sealedSilentInternationalCorridor: CN_LOCKS.SEALED_SILENT_INTERNATIONAL_CORRIDOR,
    unconfiguredEndpointAvailable: CN_LOCKS.UNCONFIGURED_ENDPOINT_AVAILABLE,
    arbitraryEndpointDiscovery: CN_LOCKS.ARBITRARY_ENDPOINT_DISCOVERY,
    approvedKnowledgeOnly: CN_LOCKS.APPROVED_KNOWLEDGE_ONLY,
    configuredEndpointsOnly: CN_LOCKS.CONFIGURED_ENDPOINTS_ONLY,
    policyTrustBeatsSpeedCost: CN_LOCKS.POLICY_TRUST_BEATS_SPEED_COST,
  };
}

export async function configureEndpoint(input: {
  label: string;
  kind: CnEndpointKind;
  region: string;
  configured?: boolean;
  authorized?: boolean;
  trustScore?: number;
  sealedCapable?: boolean;
  root: string;
  actor: CnActor;
}): Promise<ConfiguredEndpoint> {
  void input.actor;
  const store = await load(input.root);
  const endpoint: ConfiguredEndpoint = {
    id: id('ep'),
    label: input.label,
    kind: input.kind,
    region: input.region,
    configured: input.configured !== false,
    authorized: input.authorized !== false,
    trustScore: Math.max(0, Math.min(100, input.trustScore ?? 50)),
    sealedCapable: input.sealedCapable === true,
    createdAt: new Date().toISOString(),
  };
  store.endpoints.push(endpoint);
  await save(input.root, store);
  return endpoint;
}

export async function registerKnowledgePacket(input: {
  class: CnKnowledgeClass;
  approved?: boolean;
  sealed?: boolean;
  summary: string;
  root: string;
  actor: CnActor;
}): Promise<KnowledgePacket> {
  void input.actor;
  const store = await load(input.root);
  const sealed = input.sealed === true || input.class === 'sealed';
  const approved =
    input.approved === true ||
    input.class === 'approved' ||
    (input.class === 'open' && input.approved !== false);
  const packet: KnowledgePacket = {
    id: id('pkt'),
    class: input.class,
    approved: sealed ? false : approved && input.class !== 'unapproved' && input.class !== 'raw_private',
    sealed,
    summary: input.summary,
    createdAt: new Date().toISOString(),
  };
  if (input.class === 'unapproved' || input.class === 'raw_private') {
    packet.approved = false;
  }
  if (sealed) {
    packet.approved = false;
    packet.class = 'sealed';
  }
  store.packets.push(packet);
  await save(input.root, store);
  return packet;
}

export async function routeKnowledge(input: {
  endpointId?: string;
  packetId?: string;
  /** Probe: attempt silent international corridor for sealed content. */
  attemptSilentInternationalCorridor?: boolean;
  /** Competing corridors: prefer faster low-trust vs policy/trust. */
  candidates?: Array<{ endpointId: string; latencyMs: number }>;
  attemptArbitraryDiscovery?: boolean;
  root: string;
  actor: CnActor;
}): Promise<RouteDecision> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (input.attemptArbitraryDiscovery === true) {
    const denial = {
      id: id('disc'),
      at: now,
      reason: ARBITRARY_DISCOVERY_DENIED,
    };
    store.discoveryDenials.push(denial);
    const route: RouteDecision = {
      id: id('route'),
      endpointId: null,
      packetId: input.packetId ?? null,
      accepted: false,
      reason: ARBITRARY_DISCOVERY_DENIED,
      selectedBy: 'denied',
      silentCorridorFallback: false,
      latencyMsHint: null,
      trustScoreUsed: null,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  const packet = input.packetId
    ? store.packets.find((p) => p.id === input.packetId)
    : undefined;

  if (packet && (packet.sealed || packet.class === 'sealed')) {
    if (input.attemptSilentInternationalCorridor === true) {
      const route: RouteDecision = {
        id: id('route'),
        endpointId: null,
        packetId: packet.id,
        accepted: false,
        reason: SEALED_CORRIDOR_DENIED,
        selectedBy: 'denied',
        silentCorridorFallback: false,
        latencyMsHint: null,
        trustScoreUsed: null,
        at: now,
      };
      store.routes.push(route);
      await save(input.root, store);
      return route;
    }
    const route: RouteDecision = {
      id: id('route'),
      endpointId: null,
      packetId: packet.id,
      accepted: false,
      reason: SEALED_CORRIDOR_DENIED,
      selectedBy: 'denied',
      silentCorridorFallback: false,
      latencyMsHint: null,
      trustScoreUsed: null,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  if (packet && !packet.approved) {
    const route: RouteDecision = {
      id: id('route'),
      endpointId: null,
      packetId: packet.id,
      accepted: false,
      reason: UNAPPROVED_KNOWLEDGE_CORRIDOR_DENIED,
      selectedBy: 'denied',
      silentCorridorFallback: false,
      latencyMsHint: null,
      trustScoreUsed: null,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  if (input.candidates && input.candidates.length > 0) {
    const scored = input.candidates
      .map((c) => {
        const ep = store.endpoints.find((e) => e.id === c.endpointId);
        return { c, ep };
      })
      .filter((x) => x.ep && x.ep.configured && x.ep.authorized);

    if (scored.length === 0) {
      const route: RouteDecision = {
        id: id('route'),
        endpointId: null,
        packetId: packet?.id ?? null,
        accepted: false,
        reason: UNCONFIGURED_ENDPOINT_DENIED,
        selectedBy: 'unavailable',
        silentCorridorFallback: false,
        latencyMsHint: null,
        trustScoreUsed: null,
        at: now,
      };
      store.routes.push(route);
      await save(input.root, store);
      return route;
    }

    // Policy/trust beat speed/cost: maximize trust, then prefer lower latency only as tie-break.
    scored.sort((a, b) => {
      const trustDiff = (b.ep!.trustScore ?? 0) - (a.ep!.trustScore ?? 0);
      if (trustDiff !== 0) return trustDiff;
      return a.c.latencyMs - b.c.latencyMs;
    });
    const best = scored[0]!;
    const fastest = [...scored].sort((a, b) => a.c.latencyMs - b.c.latencyMs)[0]!;
    const chosePolicyOverSpeed =
      best.ep!.id !== fastest.ep!.id &&
      best.ep!.trustScore > fastest.ep!.trustScore;

    const route: RouteDecision = {
      id: id('route'),
      endpointId: best.ep!.id,
      packetId: packet?.id ?? null,
      accepted: true,
      reason: chosePolicyOverSpeed ? POLICY_BEATS_SPEED : 'ROUTE_ACCEPTED_POLICY_TRUST',
      selectedBy: 'policy_trust',
      silentCorridorFallback: false,
      latencyMsHint: best.c.latencyMs,
      trustScoreUsed: best.ep!.trustScore,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  const endpoint = input.endpointId
    ? store.endpoints.find((e) => e.id === input.endpointId)
    : undefined;

  if (!endpoint || !endpoint.configured || !endpoint.authorized) {
    const route: RouteDecision = {
      id: id('route'),
      endpointId: endpoint?.id ?? input.endpointId ?? null,
      packetId: packet?.id ?? null,
      accepted: false,
      reason: UNCONFIGURED_ENDPOINT_DENIED,
      selectedBy: 'unavailable',
      silentCorridorFallback: false,
      latencyMsHint: null,
      trustScoreUsed: endpoint?.trustScore ?? null,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  const route: RouteDecision = {
    id: id('route'),
    endpointId: endpoint.id,
    packetId: packet?.id ?? null,
    accepted: true,
    reason: 'ROUTE_ACCEPTED_CONFIGURED_APPROVED',
    selectedBy: 'policy_trust',
    silentCorridorFallback: false,
    latencyMsHint: null,
    trustScoreUsed: endpoint.trustScore,
    at: now,
  };
  store.routes.push(route);
  await save(input.root, store);
  return route;
}
