/**
 * 62L-DR Negotiation & Sales Agent Corps —
 * CRO, SDR, AE, Negotiation, CS (+ sales ops). Bounded roles; no sign/charge/deploy without founder.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DR_LOCKS,
  HONESTY_BANNER,
  SALES_SIGN_CHARGE_DEPLOY_DENIED,
  CONSEQUENTIAL_DEAL_DENIED,
  isConsequentialDealAction,
  isFounderOrHumanApprover,
  isSalesCorpsRole,
  type DealAction,
  type DrActor,
  type SalesAgentRole,
} from './enterprise-nervous-revenue-command-types';

export type SalesCorpsAgent = {
  id: string;
  role: SalesAgentRole;
  orgId: string;
  tenantId: string;
  canSignContracts: false;
  canCharge: false;
  canDeployProduction: false;
  recommendationOnly: true;
  createdAt: string;
};

export type SalesActionAttempt = {
  id: string;
  agentId: string;
  action: DealAction;
  status: 'allowed' | 'denied' | 'advisory';
  reason: string;
  founderGatePresent: boolean;
  at: string;
};

type Store = {
  agents: SalesCorpsAgent[];
  attempts: SalesActionAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'negotiation-sales-agent-corps.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { agents: [], attempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function negotiationSalesAgentCorpsHonesty() {
  return {
    banner: HONESTY_BANNER,
    agentsCanCharge: DR_LOCKS.AGENTS_CAN_CHARGE,
    agentsCanSignContracts: DR_LOCKS.AGENTS_CAN_SIGN_CONTRACTS,
    agentsCanDeployProduction: DR_LOCKS.AGENTS_CAN_DEPLOY_PRODUCTION,
    consequentialWithoutFounder: DR_LOCKS.CONSEQUENTIAL_DEAL_WITHOUT_FOUNDER_APPROVAL,
  };
}

export async function registerSalesCorpsAgent(input: {
  role: SalesAgentRole;
  root: string;
  actor: DrActor;
}): Promise<SalesCorpsAgent> {
  const store = await load(input.root);
  const agent: SalesCorpsAgent = {
    id: id('sales'),
    role: input.role,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    canSignContracts: false,
    canCharge: false,
    canDeployProduction: false,
    recommendationOnly: true,
    createdAt: new Date().toISOString(),
  };
  store.agents.push(agent);
  await save(input.root, store);
  return agent;
}

export async function attemptSalesCorpsAction(input: {
  agentId: string;
  action: DealAction;
  founderGatePresent?: boolean;
  root: string;
  actor: DrActor;
}): Promise<SalesActionAttempt> {
  const store = await load(input.root);
  const agent = store.agents.find((a) => a.id === input.agentId);
  void agent;
  void isSalesCorpsRole;

  let status: SalesActionAttempt['status'] = 'advisory';
  let reason = 'RECOMMENDATION_ONLY';

  if (isConsequentialDealAction(input.action)) {
    if (!(Boolean(input.founderGatePresent) && isFounderOrHumanApprover(input.actor))) {
      status = 'denied';
      reason =
        input.action === 'sign_contract' ||
        input.action === 'charge_customer' ||
        input.action === 'deploy_production'
          ? SALES_SIGN_CHARGE_DEPLOY_DENIED
          : CONSEQUENTIAL_DEAL_DENIED;
    } else {
      status = 'allowed';
      reason = 'FOUNDER_GATE_APPROVED_ADVISORY_EXECUTION_STILL_LOCAL_ONLY';
    }
  } else {
    status = 'advisory';
    reason = 'RECOMMENDATION_ONLY_NOT_EXECUTABLE_CLOSE';
  }

  const attempt: SalesActionAttempt = {
    id: id('saat'),
    agentId: input.agentId,
    action: input.action,
    status,
    reason,
    founderGatePresent: Boolean(input.founderGatePresent) && isFounderOrHumanApprover(input.actor),
    at: new Date().toISOString(),
  };
  store.attempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
