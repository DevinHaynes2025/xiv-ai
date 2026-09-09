import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  denyFounderSealedSurface,
  scanXivLocalForToken,
  type FabricActor,
} from './sovereign-sealed-fabric';
import { CEO_SEALED_VAULT_FILE, SEALED_REDACTION } from './ceo-sealed-vault';
import {
  BD_LOCKS,
  FOUNDER_SEALED_DENY_DEFAULT,
  WORMHOLE_NO_TRUST_BYPASS,
  type BdActor,
  type BdActorKind,
} from './cognitive-memory-types';

export const KNOWLEDGE_ROUTER_FILE = 'universe-knowledge-router.json';

export type KnowledgeRoute = {
  id: string;
  fromUniverseId: string;
  toUniverseId: string;
  tenantId: string;
  label: string;
  permissioned: boolean;
  founderSealed: boolean;
  /** Logical wormhole = optimized permissioned route — never a trust/auth bypass. */
  logicalWormhole: boolean;
  trustBypass: false;
  authBypass: false;
  createdAt: string;
};

export type RouteAttempt = {
  id: string;
  at: string;
  routeId?: string;
  fromUniverseId: string;
  toUniverseId: string;
  tenantId: string;
  actorId: string;
  actorKind: BdActorKind;
  surface:
    | 'ordinary_universe'
    | 'cloud'
    | 'peer'
    | 'telemetry'
    | 'training'
    | 'wormhole'
    | 'founder_sealed';
  allowed: boolean;
  reason: string;
  payloadWritten: boolean;
  trustBypass: false;
  authBypass: false;
};

type RouterStore = {
  routes: KnowledgeRoute[];
  attempts: RouteAttempt[];
};

const MAX_ROUTES = 2_000;
const MAX_ATTEMPTS = 10_000;

function routerPath(root: string) {
  return xivLocalPath(root, KNOWLEDGE_ROUTER_FILE);
}

async function load(root: string): Promise<RouterStore> {
  const parsed = await readJsonFile<RouterStore>(routerPath(root), { routes: [], attempts: [] });
  return {
    routes: Array.isArray(parsed.routes) ? parsed.routes : [],
    attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
  };
}

async function save(root: string, store: RouterStore) {
  await writeJsonFileAtomic(routerPath(root), {
    routes: store.routes.slice(-MAX_ROUTES),
    attempts: store.attempts.slice(-MAX_ATTEMPTS),
  });
}

const DENY_KINDS = new Set<BdActorKind>([
  'ordinary_agent',
  'cloud_peer',
  'telemetry',
  'training_pipeline',
  'tool',
]);

/**
 * Declare a permission-controlled logical wormhole between Universes.
 * Wormholes optimize routes; they never bypass trust or auth.
 */
export async function declareKnowledgeRoute(input: {
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  label: string;
  permissioned: boolean;
  founderSealed?: boolean;
  logicalWormhole?: boolean;
  actor: BdActor;
  root?: string;
  now?: number;
}) {
  if (!input.tenantId || !input.fromUniverseId || !input.toUniverseId) {
    return { accepted: false as const, reason: 'TENANT_AND_UNIVERSES_REQUIRED' };
  }
  if (input.fromUniverseId === input.toUniverseId) {
    return { accepted: false as const, reason: 'SAME_UNIVERSE_ROUTE_NOT_WORMHOLE' };
  }
  if (input.founderSealed && !input.permissioned) {
    return { accepted: false as const, reason: FOUNDER_SEALED_DENY_DEFAULT };
  }
  if (input.logicalWormhole && !input.permissioned) {
    return {
      accepted: false as const,
      reason: WORMHOLE_NO_TRUST_BYPASS,
      note: 'Logical wormholes require explicit permission; they are not trust/auth bypasses.',
    };
  }

  const route: KnowledgeRoute = {
    id: `route_${randomUUID()}`,
    fromUniverseId: input.fromUniverseId,
    toUniverseId: input.toUniverseId,
    tenantId: input.tenantId,
    label: input.label,
    permissioned: input.permissioned === true,
    founderSealed: input.founderSealed === true,
    logicalWormhole: input.logicalWormhole === true,
    trustBypass: false,
    authBypass: false,
    createdAt: new Date(input.now ?? Date.now()).toISOString(),
  };

  const root = input.root ?? process.cwd();
  const store = await load(root);
  store.routes.push(route);
  await save(root, store);
  return {
    accepted: true as const,
    route,
    reason: route.logicalWormhole
      ? 'Logical wormhole declared as optimized permissioned route (no trust/auth bypass).'
      : 'Permission-controlled knowledge route declared.',
  };
}

export async function routeKnowledge(input: {
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  actor: BdActor;
  surface: RouteAttempt['surface'];
  routeId?: string;
  payload?: string;
  claimTrustBypass?: boolean;
  claimAuthBypass?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const attemptBase = {
    id: `attempt_${randomUUID()}`,
    at: new Date().toISOString(),
    routeId: input.routeId,
    fromUniverseId: input.fromUniverseId,
    toUniverseId: input.toUniverseId,
    tenantId: input.tenantId,
    actorId: input.actor.id,
    actorKind: input.actor.kind,
    surface: input.surface,
    trustBypass: false as const,
    authBypass: false as const,
  };

  // Founder-sealed deny-by-default from ordinary Universes / cloud / peers / telemetry / training
  if (
    input.surface === 'founder_sealed' ||
    input.surface === 'cloud' ||
    input.surface === 'peer' ||
    input.surface === 'telemetry' ||
    input.surface === 'training' ||
    (input.surface === 'ordinary_universe' && DENY_KINDS.has(input.actor.kind))
  ) {
    const fabricActor: FabricActor = {
      kind:
        input.actor.kind === 'ceo_principal'
          ? 'ceo_principal'
          : input.actor.kind === 'ordinary_agent' || input.actor.kind === 'specialized_agent'
            ? 'ordinary_agent'
            : input.actor.kind === 'tool'
              ? 'tool'
              : 'other_user',
      id: input.actor.id,
      tenantId: input.tenantId,
      universeId: input.fromUniverseId,
      role: input.actor.role,
    };
    if (input.payload) {
      await denyFounderSealedSurface({
        actor: fabricActor,
        surface:
          input.surface === 'cloud'
            ? 'cloud_route'
            : input.surface === 'peer'
              ? 'peer_sync'
              : input.surface === 'telemetry'
                ? 'telemetry'
                : input.surface === 'training'
                  ? 'replication'
                  : 'ordinary_cache',
        payload: input.payload,
        root,
      });
    }
    const attempt: RouteAttempt = {
      ...attemptBase,
      allowed: false,
      reason: FOUNDER_SEALED_DENY_DEFAULT,
      payloadWritten: false,
    };
    store.attempts.push(attempt);
    await save(root, store);
    return {
      allowed: false as const,
      reason: FOUNDER_SEALED_DENY_DEFAULT,
      attempt,
      redacted: SEALED_REDACTION,
      locks: { FOUNDER_SEALED_DENY_BY_DEFAULT: BD_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT },
    };
  }

  // Wormhole path: must be permissioned; never trust/auth bypass
  if (input.surface === 'wormhole' || input.claimTrustBypass || input.claimAuthBypass) {
    const route = store.routes.find(
      (item) =>
        item.id === input.routeId ||
        (item.tenantId === input.tenantId &&
          item.fromUniverseId === input.fromUniverseId &&
          item.toUniverseId === input.toUniverseId &&
          item.logicalWormhole),
    );

    if (input.claimTrustBypass || input.claimAuthBypass || !route || !route.permissioned) {
      const attempt: RouteAttempt = {
        ...attemptBase,
        allowed: false,
        reason: WORMHOLE_NO_TRUST_BYPASS,
        payloadWritten: false,
      };
      store.attempts.push(attempt);
      await save(root, store);
      return {
        allowed: false as const,
        reason: WORMHOLE_NO_TRUST_BYPASS,
        attempt,
        note: 'Logical wormholes are optimized permissioned routes — not trust/auth bypasses.',
      };
    }

    if (route.founderSealed && input.actor.kind !== 'ceo_principal' && input.actor.kind !== 'human_operator') {
      const attempt: RouteAttempt = {
        ...attemptBase,
        routeId: route.id,
        allowed: false,
        reason: FOUNDER_SEALED_DENY_DEFAULT,
        payloadWritten: false,
      };
      store.attempts.push(attempt);
      await save(root, store);
      return { allowed: false as const, reason: FOUNDER_SEALED_DENY_DEFAULT, attempt };
    }

    const attempt: RouteAttempt = {
      ...attemptBase,
      routeId: route.id,
      allowed: true,
      reason: 'Permissioned logical wormhole route accepted; trustBypass=false authBypass=false.',
      payloadWritten: false,
    };
    store.attempts.push(attempt);
    await save(root, store);
    return {
      allowed: true as const,
      reason: attempt.reason,
      attempt,
      route,
      trustBypass: false as const,
      authBypass: false as const,
    };
  }

  // Default: same-tenant permissioned non-wormhole routes
  const route = store.routes.find(
    (item) =>
      item.tenantId === input.tenantId &&
      item.fromUniverseId === input.fromUniverseId &&
      item.toUniverseId === input.toUniverseId &&
      item.permissioned &&
      !item.founderSealed,
  );
  if (!route) {
    const attempt: RouteAttempt = {
      ...attemptBase,
      allowed: false,
      reason: 'NO_PERMISSIONED_ROUTE',
      payloadWritten: false,
    };
    store.attempts.push(attempt);
    await save(root, store);
    return { allowed: false as const, reason: attempt.reason, attempt };
  }

  const attempt: RouteAttempt = {
    ...attemptBase,
    routeId: route.id,
    allowed: true,
    reason: 'Permission-controlled knowledge route accepted.',
    payloadWritten: false,
  };
  store.attempts.push(attempt);
  await save(root, store);
  return { allowed: true as const, reason: attempt.reason, attempt, route };
}

export async function assertSealedNonLeak(token: string, root = process.cwd()) {
  const scan = await scanXivLocalForToken({
    root,
    token,
    allowFiles: [CEO_SEALED_VAULT_FILE],
  });
  return {
    leaked: scan.leaked,
    hits: scan.leaks.map((item) => item.file),
    allowlist: [CEO_SEALED_VAULT_FILE],
    reason: scan.leaked ? 'SEALED_TOKEN_LEAK' : 'SEALED_NON_LEAK',
  };
}

export async function listKnowledgeRoutes(root = process.cwd()) {
  return (await load(root)).routes;
}

export function knowledgeRouterHonesty() {
  return {
    founderSealedDenyByDefault: true as const,
    wormholeIsTrustBypass: false as const,
    wormholeIsAuthBypass: false as const,
    locks: {
      TRUST_AUTH_BYPASS_VIA_WORMHOLE: BD_LOCKS.TRUST_AUTH_BYPASS_VIA_WORMHOLE,
      FOUNDER_SEALED_DENY_BY_DEFAULT: BD_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    },
    productionAuthorization: false as const,
  };
}
