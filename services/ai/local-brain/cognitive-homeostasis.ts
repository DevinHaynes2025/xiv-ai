import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BP_LOCKS,
  HIGH_PRESSURE_HIBERNATE,
  HIGH_PRESSURE_THROTTLE,
  HOMEOSTASIS_L4_EXPAND_DENIED,
  HOMEOSTASIS_PERM_EXPAND_DENIED,
  type HomeostasisAction,
  type HomeostasisMetricKey,
} from './cognitive-homeostasis-types';

/**
 * Superbrain Cognitive Homeostasis — samples operational pressure and chooses
 * stabilize actions (throttle / rebalance / quarantine / hibernate / recover).
 * Never unbounded-spawns agents and never expands L4 or permissions.
 */

export const HOMEOSTASIS_STORE = 'cognitive-homeostasis.json';

export type HomeostasisMetrics = Record<HomeostasisMetricKey, number>;

export type HomeostasisDecision = {
  id: string;
  at: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  metrics: HomeostasisMetrics;
  action: HomeostasisAction;
  reason: string;
  spawnedAgents: 0;
  l4Expanded: false;
  permissionsExpanded: false;
  productionAuthorized: false;
};

type HomeostasisStore = {
  decisions: HomeostasisDecision[];
  denials: Array<{ id: string; at: string; reason: string }>;
};

const MAX_DECISIONS = 5_000;
const MAX_DENIALS = 10_000;

/** Queue pressure at/above this triggers throttle rather than spawn. */
export const QUEUE_PRESSURE_THROTTLE_THRESHOLD = 0.7;
/** Queue pressure at/above this triggers hibernate of non-critical work. */
export const QUEUE_PRESSURE_HIBERNATE_THRESHOLD = 0.9;

function storePath(root: string) {
  return xivLocalPath(root, HOMEOSTASIS_STORE);
}

async function load(root: string): Promise<HomeostasisStore> {
  const parsed = await readJsonFile<HomeostasisStore>(storePath(root), {
    decisions: [],
    denials: [],
  });
  return {
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: HomeostasisStore) {
  await writeJsonFileAtomic(storePath(root), {
    decisions: store.decisions.slice(-MAX_DECISIONS),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export function defaultMetrics(overrides: Partial<HomeostasisMetrics> = {}): HomeostasisMetrics {
  return {
    queuePressure: 0,
    activeAgents: 0,
    memory: 0,
    modelCalls: 0,
    network: 0,
    latency: 0,
    storage: 0,
    cost: 0,
    staleKnowledge: 0,
    conflicts: 0,
    policyIncidents: 0,
    ...overrides,
  };
}

export type HomeostasisEvaluateInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  metrics: Partial<HomeostasisMetrics>;
  /** Probe: request unbounded agent spawn under pressure. */
  attemptUnboundedSpawn?: boolean;
  /** Probe: request L4 autonomy enable via homeostasis. */
  attemptExpandL4?: boolean;
  /** Probe: request permission expansion via homeostasis. */
  attemptExpandPermissions?: boolean;
  /** Prefer recover when pressure is low and a prior quarantine exists. */
  priorQuarantine?: boolean;
  root?: string;
};

export type HomeostasisEvaluateResult = {
  accepted: boolean;
  reason: string;
  decision: HomeostasisDecision | null;
  spawnedAgents: 0;
  l4Expanded: false;
  permissionsExpanded: false;
  productionAuthorization: false;
};

export async function evaluateCognitiveHomeostasis(
  input: HomeostasisEvaluateInput,
): Promise<HomeostasisEvaluateResult> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const metrics = defaultMetrics(input.metrics);

  const deny = async (reason: string): Promise<HomeostasisEvaluateResult> => {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason,
    });
    await save(root, store);
    return {
      accepted: false,
      reason,
      decision: null,
      spawnedAgents: 0,
      l4Expanded: false,
      permissionsExpanded: false,
      productionAuthorization: false,
    };
  };

  if (!input.orgId || !input.tenantId || !input.universeId) {
    return deny('ORG_TENANT_UNIVERSE_REQUIRED');
  }

  if (input.attemptExpandL4 === true || BP_LOCKS.HOMEOSTASIS_CAN_EXPAND_L4 === true) {
    return deny(HOMEOSTASIS_L4_EXPAND_DENIED);
  }
  if (input.attemptExpandPermissions === true) {
    return deny(HOMEOSTASIS_PERM_EXPAND_DENIED);
  }
  if (input.attemptUnboundedSpawn === true) {
    return deny(HIGH_PRESSURE_THROTTLE);
  }

  let action: HomeostasisAction = 'rebalance';
  let reason = 'Pressure within bounds — bounded rebalance preferred over expand.';

  if (metrics.policyIncidents >= 1 || metrics.conflicts >= 3) {
    action = 'quarantine';
    reason = 'Policy incidents / conflicts — quarantine unsafe work units.';
  } else if (metrics.queuePressure >= QUEUE_PRESSURE_HIBERNATE_THRESHOLD) {
    action = 'hibernate';
    reason = HIGH_PRESSURE_HIBERNATE;
  } else if (metrics.queuePressure >= QUEUE_PRESSURE_THROTTLE_THRESHOLD) {
    action = 'throttle';
    reason = HIGH_PRESSURE_THROTTLE;
  } else if (input.priorQuarantine && metrics.queuePressure < 0.3 && metrics.policyIncidents === 0) {
    action = 'recover';
    reason = 'Verified low pressure after quarantine — recover bounded units only.';
  }

  const decision: HomeostasisDecision = {
    id: randomUUID(),
    at: new Date().toISOString(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    metrics,
    action,
    reason,
    spawnedAgents: 0,
    l4Expanded: false,
    permissionsExpanded: false,
    productionAuthorized: false,
  };

  store.decisions.push(decision);
  await save(root, store);

  return {
    accepted: true,
    reason,
    decision,
    spawnedAgents: 0,
    l4Expanded: false,
    permissionsExpanded: false,
    productionAuthorization: false,
  };
}

export async function listHomeostasisDecisions(root = process.cwd()) {
  const store = await load(root);
  return store.decisions;
}

export function cognitiveHomeostasisHonesty() {
  return {
    locks: BP_LOCKS,
    preferStabilizeOverExpand: BP_LOCKS.PREFER_STABILIZE_OVER_EXPAND,
    unboundedExpand: BP_LOCKS.HOMEOSTASIS_UNBOUNDED_EXPAND,
    canExpandL4: BP_LOCKS.HOMEOSTASIS_CAN_EXPAND_L4,
    canExpandPermissions: BP_LOCKS.HOMEOSTASIS_CAN_EXPAND_PERMISSIONS,
    l4AutonomyEnabled: BP_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: false as const,
  };
}
