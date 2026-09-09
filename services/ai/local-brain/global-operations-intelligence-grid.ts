/**
 * 62L-EA Module A — Global Operations Intelligence Grid.
 * Governed ops intelligence; deny-by-default; recommendation ≠ action.
 * Soft-wire SC autonomy boundary: no freight/PO/contract/spend/prod-change.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AUTONOMY_BOUNDARY,
  AUTONOMY_BOUNDARY_DENIED_ACTIONS,
  CONTRACT_SIGNING_DENIED,
  FREIGHT_BOOKING_DENIED,
  MAX_OPS_EVENTS,
  OPS_DENY_BY_DEFAULT,
  OPS_LABEL_NEQ_ACCESS,
  OPS_RECOMMENDATION_NEQ_ACTION,
  PRODUCTION_CHANGE_DENIED,
  PURCHASE_ORDER_DENIED,
  SPEND_MONEY_DENIED,
  type AutonomyBoundaryAction,
  type EaActor,
} from './global-operations-intelligence-grid-types';

export type OpsIntelligenceProbe = {
  id: string;
  query: string;
  authorized: boolean;
  labeledOnly: boolean;
  status: 'ok' | 'denied';
  reason: string;
  recommendationOnly: true;
  physicalExecutionAuthorized: false;
  at: string;
};

export type OpsRecommendation = {
  id: string;
  summary: string;
  attemptCharge?: boolean;
  attemptDeploy?: boolean;
  attemptSpend?: boolean;
  attemptSign?: boolean;
  attemptPublish?: boolean;
  status: 'recommendation_only' | 'denied';
  reason: string;
  at: string;
};

export type AutonomyBoundaryDenial = {
  id: string;
  action: AutonomyBoundaryAction;
  status: 'denied';
  reason: string;
  founderHumanGateRequired: true;
  at: string;
};

type Store = {
  probes: OpsIntelligenceProbe[];
  recommendations: OpsRecommendation[];
  denials: AutonomyBoundaryDenial[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-operations-intelligence-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    probes: [],
    recommendations: [],
    denials: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const DENIAL_REASON: Record<AutonomyBoundaryAction, string> = {
  book_freight: FREIGHT_BOOKING_DENIED,
  issue_purchase_order: PURCHASE_ORDER_DENIED,
  sign_contract: CONTRACT_SIGNING_DENIED,
  spend_money: SPEND_MONEY_DENIED,
  change_production_system: PRODUCTION_CHANGE_DENIED,
};

export function globalOperationsIntelligenceGridHonesty() {
  return {
    denyByDefault: true,
    recommendationNeqChargeDeploySpendSignPublish: true,
    labelAloneNeqAccess: true,
    physicalExecutionAuthorized: false,
    l4AutonomyEnabled: false,
    autonomyBoundary: AUTONOMY_BOUNDARY,
  };
}

export async function probeOpsIntelligence(input: {
  query: string;
  authorized: boolean;
  labeledOnly?: boolean;
  root: string;
  actor: EaActor;
}): Promise<OpsIntelligenceProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.probes.length >= MAX_OPS_EVENTS) {
    throw new Error('MAX_OPS_EVENTS_REACHED');
  }
  if (!input.authorized) {
    const denied: OpsIntelligenceProbe = {
      id: id('eaops'),
      query: input.query.trim(),
      authorized: false,
      labeledOnly: Boolean(input.labeledOnly),
      status: 'denied',
      reason: OPS_DENY_BY_DEFAULT,
      recommendationOnly: true,
      physicalExecutionAuthorized: false,
      at: new Date().toISOString(),
    };
    store.probes.push(denied);
    await save(input.root, store);
    return denied;
  }
  if (input.labeledOnly) {
    const denied: OpsIntelligenceProbe = {
      id: id('eaops'),
      query: input.query.trim(),
      authorized: true,
      labeledOnly: true,
      status: 'denied',
      reason: OPS_LABEL_NEQ_ACCESS,
      recommendationOnly: true,
      physicalExecutionAuthorized: false,
      at: new Date().toISOString(),
    };
    store.probes.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: OpsIntelligenceProbe = {
    id: id('eaops'),
    query: input.query.trim(),
    authorized: true,
    labeledOnly: false,
    status: 'ok',
    reason: 'OPS_INTELLIGENCE_AUTHORIZED_ADVISORY',
    recommendationOnly: true,
    physicalExecutionAuthorized: false,
    at: new Date().toISOString(),
  };
  store.probes.push(ok);
  await save(input.root, store);
  return ok;
}

export async function issueOpsRecommendation(input: {
  summary: string;
  attemptCharge?: boolean;
  attemptDeploy?: boolean;
  attemptSpend?: boolean;
  attemptSign?: boolean;
  attemptPublish?: boolean;
  root: string;
  actor: EaActor;
}): Promise<OpsRecommendation> {
  const store = await load(input.root);
  void input.actor;
  const actionAttempt =
    Boolean(input.attemptCharge) ||
    Boolean(input.attemptDeploy) ||
    Boolean(input.attemptSpend) ||
    Boolean(input.attemptSign) ||
    Boolean(input.attemptPublish);
  const rec: OpsRecommendation = {
    id: id('earec'),
    summary: input.summary.trim(),
    attemptCharge: Boolean(input.attemptCharge),
    attemptDeploy: Boolean(input.attemptDeploy),
    attemptSpend: Boolean(input.attemptSpend),
    attemptSign: Boolean(input.attemptSign),
    attemptPublish: Boolean(input.attemptPublish),
    status: actionAttempt ? 'denied' : 'recommendation_only',
    reason: actionAttempt
      ? OPS_RECOMMENDATION_NEQ_ACTION
      : 'RECOMMENDATION_ONLY_BOUNDED',
    at: new Date().toISOString(),
  };
  store.recommendations.push(rec);
  await save(input.root, store);
  return rec;
}

export async function denyAutonomyBoundaryAction(input: {
  action: AutonomyBoundaryAction;
  root: string;
  actor: EaActor;
}): Promise<AutonomyBoundaryDenial> {
  const store = await load(input.root);
  void input.actor;
  if (!AUTONOMY_BOUNDARY_DENIED_ACTIONS.includes(input.action)) {
    throw new Error('UNKNOWN_AUTONOMY_BOUNDARY_ACTION');
  }
  const denial: AutonomyBoundaryDenial = {
    id: id('eaabd'),
    action: input.action,
    status: 'denied',
    reason: DENIAL_REASON[input.action],
    founderHumanGateRequired: true,
    at: new Date().toISOString(),
  };
  store.denials.push(denial);
  await save(input.root, store);
  return denial;
}
