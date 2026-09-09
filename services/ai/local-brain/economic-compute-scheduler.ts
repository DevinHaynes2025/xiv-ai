/**
 * 62L-BY Economic Compute Scheduler — placement using latency, cost proxies,
 * trust, locality, residency, business priority, resource pressure.
 * Agents have NO purchasing / billing / charge authority.
 * Recommendation ≠ charge/buy/deploy; cost proxy ≠ live invoice.
 * Cheaper/faster cannot bypass sealed/trust deny.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BY_LOCKS,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  COST_PROXY_NOT_INVOICE,
  RECOMMENDATION_NOT_CHARGE,
  SCHEDULER_NO_PURCHASE,
  SEALED_TRUST_DENY_BEATS_COST,
  containsForbiddenPrivateFields,
  type ByActor,
} from './hardware-cortex-synapse-compiler-types';

export type PlacementCandidate = {
  id: string;
  nodeId: string;
  latencyMs: number;
  /** Cost proxy units — NOT a live invoice. */
  costProxy: number;
  trustScore: number;
  localityScore: number;
  residencyOk: boolean;
  businessPriority: number;
  resourcePressure: number;
  sealedDenied: boolean;
  trustDenied: boolean;
};

export type PlacementDecision = {
  id: string;
  selectedNodeId: string | null;
  ranked: Array<{ nodeId: string; score: number; eliminatedReason?: string }>;
  recommendationOnly: true;
  purchaseAuthority: false;
  billingAuthority: false;
  chargeAuthority: false;
  costProxyIsLiveInvoice: false;
  charged: false;
  purchased: false;
  deployed: false;
  status: 'recommended' | 'denied' | 'unavailable';
  createdAt: string;
  actorId: string;
  reason: string;
};

type Store = { decisions: PlacementDecision[] };

function storePath(root: string) {
  return xivLocalPath(root, 'economic-compute-scheduler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { decisions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function economicSchedulerHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4: BY_LOCKS.L4_AUTONOMY_ENABLED,
    purchasing: BY_LOCKS.AGENT_PURCHASING_AUTHORITY,
    billing: BY_LOCKS.AGENT_BILLING_AUTHORITY,
    charge: BY_LOCKS.AGENT_CHARGE_AUTHORITY,
    costProxyIsInvoice: BY_LOCKS.COST_PROXY_IS_LIVE_INVOICE,
    cheaperBypassesSealed: BY_LOCKS.CHEAPER_FASTER_BYPASSES_SEALED_TRUST,
    recommendationOnly: BY_LOCKS.SCHEDULER_RECOMMENDATION_ONLY,
  };
}

function scoreCandidate(c: PlacementCandidate): number {
  // Higher is better. Latency/cost/pressure lower is better; trust/locality/priority higher.
  const latencyTerm = 1000 / Math.max(1, c.latencyMs);
  const costTerm = 100 / Math.max(0.01, c.costProxy);
  const pressureTerm = 1 / Math.max(0.01, c.resourcePressure + 0.1);
  return (
    latencyTerm * 0.2 +
    costTerm * 0.2 +
    c.trustScore * 0.25 +
    c.localityScore * 0.15 +
    c.businessPriority * 0.1 +
    pressureTerm * 0.1 +
    (c.residencyOk ? 5 : -50)
  );
}

/**
 * Place work across candidates. Sealed/trust deny eliminates even cheaper/faster nodes.
 * Never grants purchase/bill/charge authority.
 */
export async function placeEconomicCompute(input: {
  candidates: PlacementCandidate[];
  attemptPurchase?: boolean;
  attemptBill?: boolean;
  attemptCharge?: boolean;
  attemptBypassSealedWithCheaper?: boolean;
  payload?: Record<string, unknown>;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (containsForbiddenPrivateFields(input.payload)) {
    return {
      accepted: false as const,
      status: 'denied' as const,
      reason: HIDDEN_REASONING_TRACE_REJECTED,
      decision: null,
      purchaseAuthority: false as const,
      billingAuthority: false as const,
      chargeAuthority: false as const,
    };
  }

  if (input.attemptPurchase || input.attemptBill || input.attemptCharge) {
    const decision: PlacementDecision = {
      id: id('plc'),
      selectedNodeId: null,
      ranked: [],
      recommendationOnly: true,
      purchaseAuthority: false,
      billingAuthority: false,
      chargeAuthority: false,
      costProxyIsLiveInvoice: false,
      charged: false,
      purchased: false,
      deployed: false,
      status: 'denied',
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
      reason: SCHEDULER_NO_PURCHASE,
    };
    const store = await load(root);
    store.decisions.push(decision);
    await save(root, store);
    return {
      accepted: false as const,
      status: 'denied' as const,
      reason: SCHEDULER_NO_PURCHASE,
      decision,
      purchaseAuthority: false as const,
      billingAuthority: false as const,
      chargeAuthority: false as const,
      charged: false as const,
      purchased: false as const,
    };
  }

  const ranked: PlacementDecision['ranked'] = [];
  const eligible: Array<{ nodeId: string; score: number; candidate: PlacementCandidate }> = [];

  for (const c of input.candidates) {
    if (c.sealedDenied || c.trustDenied) {
      ranked.push({
        nodeId: c.nodeId,
        score: scoreCandidate(c),
        eliminatedReason: SEALED_TRUST_DENY_BEATS_COST,
      });
      continue;
    }
    if (!c.residencyOk) {
      ranked.push({
        nodeId: c.nodeId,
        score: scoreCandidate(c),
        eliminatedReason: 'RESIDENCY_CONSTRAINT_DENIED',
      });
      continue;
    }
    const score = scoreCandidate(c);
    eligible.push({ nodeId: c.nodeId, score, candidate: c });
    ranked.push({ nodeId: c.nodeId, score });
  }

  // Attempt to pick a sealed-denied cheaper/faster node → still DENIED for that node.
  if (input.attemptBypassSealedWithCheaper) {
    const sealed = input.candidates
      .filter((c) => c.sealedDenied || c.trustDenied)
      .sort((a, b) => a.costProxy - b.costProxy || a.latencyMs - b.latencyMs)[0];
    if (sealed) {
      const decision: PlacementDecision = {
        id: id('plc'),
        selectedNodeId: null,
        ranked: ranked.sort((a, b) => b.score - a.score),
        recommendationOnly: true,
        purchaseAuthority: false,
        billingAuthority: false,
        chargeAuthority: false,
        costProxyIsLiveInvoice: false,
        charged: false,
        purchased: false,
        deployed: false,
        status: 'denied',
        createdAt: new Date().toISOString(),
        actorId: input.actor.id,
        reason: SEALED_TRUST_DENY_BEATS_COST,
      };
      // If other eligible nodes exist, still may recommend them — but sealed bypass fails.
      eligible.sort((a, b) => b.score - a.score);
      if (eligible[0]) {
        decision.selectedNodeId = eligible[0].nodeId;
        decision.status = 'recommended';
        decision.reason = `${SEALED_TRUST_DENY_BEATS_COST};FALLBACK_ELIGIBLE_RECOMMENDED`;
      }
      const store = await load(root);
      store.decisions.push(decision);
      await save(root, store);
      return {
        accepted: decision.status === 'recommended',
        status: decision.status,
        reason: decision.reason,
        decision,
        sealedBypassDenied: true as const,
        purchaseAuthority: false as const,
        billingAuthority: false as const,
        chargeAuthority: false as const,
        costProxyIsLiveInvoice: false as const,
        recommendationOnly: true as const,
      };
    }
  }

  eligible.sort((a, b) => b.score - a.score);
  ranked.sort((a, b) => b.score - a.score);
  const best = eligible[0] ?? null;

  const decision: PlacementDecision = {
    id: id('plc'),
    selectedNodeId: best?.nodeId ?? null,
    ranked,
    recommendationOnly: true,
    purchaseAuthority: false,
    billingAuthority: false,
    chargeAuthority: false,
    costProxyIsLiveInvoice: false,
    charged: false,
    purchased: false,
    deployed: false,
    status: best ? 'recommended' : 'unavailable',
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: best
      ? `${RECOMMENDATION_NOT_CHARGE};${COST_PROXY_NOT_INVOICE}`
      : 'NO_ELIGIBLE_PLACEMENT_CANDIDATE',
  };

  const store = await load(root);
  store.decisions.push(decision);
  await save(root, store);

  return {
    accepted: Boolean(best),
    status: decision.status,
    reason: decision.reason,
    decision,
    purchaseAuthority: false as const,
    billingAuthority: false as const,
    chargeAuthority: false as const,
    costProxyIsLiveInvoice: false as const,
    recommendationOnly: true as const,
    charged: false as const,
    purchased: false as const,
    deployed: false as const,
  };
}

/**
 * Explicit purchase/bill/charge attempt — always DENIED.
 */
export async function attemptSchedulerPurchaseOrCharge(input: {
  decisionId?: string;
  action: 'purchase' | 'bill' | 'charge';
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const decision: PlacementDecision = {
    id: id('plc'),
    selectedNodeId: null,
    ranked: [],
    recommendationOnly: true,
    purchaseAuthority: false,
    billingAuthority: false,
    chargeAuthority: false,
    costProxyIsLiveInvoice: false,
    charged: false,
    purchased: false,
    deployed: false,
    status: 'denied',
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: SCHEDULER_NO_PURCHASE,
  };
  const store = await load(root);
  store.decisions.push(decision);
  await save(root, store);
  return {
    accepted: false as const,
    action: input.action,
    reason: SCHEDULER_NO_PURCHASE,
    purchaseAuthority: false as const,
    billingAuthority: false as const,
    chargeAuthority: false as const,
    charged: false as const,
    purchased: false as const,
    decision,
  };
}

export async function listPlacementDecisions(root = process.cwd()) {
  return (await load(root)).decisions;
}
