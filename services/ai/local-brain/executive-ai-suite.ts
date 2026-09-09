/**
 * 62L-DR Executive AI Suite —
 * CFO, COO, DevOps, CISO, CoS, Product/UX, Partnerships, Data/Quant, Virtual CEO, Business-Law.
 * Recommendation-only; Virtual CEO ≠ founder; Business Law ≠ attorney.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BUSINESS_LAW_DISCLAIMER,
  BUSINESS_LAW_NOT_LEGAL_ADVICE,
  CFO_LIVE_MUTATION_DENIED,
  DR_LOCKS,
  HONESTY_BANNER,
  LEGALSHIELD_UNAVAILABLE,
  VIRTUAL_CEO_IMPERSONATION_DENIED,
  isFounderOrHumanApprover,
  type DealAction,
  type DrActor,
  type ExecutiveAgentRole,
} from './enterprise-nervous-revenue-command-types';

export type ExecutiveSuiteAgent = {
  id: string;
  role: ExecutiveAgentRole;
  orgId: string;
  tenantId: string;
  recommendationOnly: true;
  isFounder: false;
  isAttorney: false;
  createdAt: string;
};

export type ExecutiveActionAttempt = {
  id: string;
  agentId: string;
  role: ExecutiveAgentRole;
  action: DealAction | 'impersonate_founder' | 'approve_consequential' | 'legal_research' | 'legalshield_probe';
  status: 'allowed' | 'denied' | 'advisory' | 'unavailable';
  reason: string;
  disclaimer?: string;
  at: string;
};

type Store = {
  agents: ExecutiveSuiteAgent[];
  attempts: ExecutiveActionAttempt[];
  legalShieldConfigured: boolean;
};

function storePath(root: string) {
  return xivLocalPath(root, 'executive-ai-suite.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    agents: [],
    attempts: [],
    legalShieldConfigured: false,
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function executiveAiSuiteHonesty() {
  return {
    banner: HONESTY_BANNER,
    virtualCeoEqFounder: DR_LOCKS.VIRTUAL_CEO_EQ_FOUNDER,
    virtualCeoSelfApprove: DR_LOCKS.VIRTUAL_CEO_SELF_APPROVE_CONSEQUENTIAL,
    businessLawEqAttorney: DR_LOCKS.BUSINESS_LAW_EQ_ATTORNEY,
    businessLawSubstitute: DR_LOCKS.BUSINESS_LAW_SUBSTITUTE_FOR_COUNSEL,
    cfoLiveBank: DR_LOCKS.CFO_LIVE_BANK_MUTATIONS,
    cfoLiveCharge: DR_LOCKS.CFO_LIVE_CHARGE_MUTATIONS,
    legalShieldClaimedLiveWithoutConfig: DR_LOCKS.LEGALSHIELD_CLAIMED_LIVE_WITHOUT_CONFIG,
    disclaimer: BUSINESS_LAW_DISCLAIMER,
  };
}

export async function registerExecutiveAgent(input: {
  role: ExecutiveAgentRole;
  root: string;
  actor: DrActor;
}): Promise<ExecutiveSuiteAgent> {
  const store = await load(input.root);
  const agent: ExecutiveSuiteAgent = {
    id: id('exec'),
    role: input.role,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    recommendationOnly: true,
    isFounder: false,
    isAttorney: false,
    createdAt: new Date().toISOString(),
  };
  store.agents.push(agent);
  await save(input.root, store);
  return agent;
}

export async function setLegalShieldConfigured(input: {
  configured: boolean;
  root: string;
  actor: DrActor;
}): Promise<{ legalShieldConfigured: boolean }> {
  const store = await load(input.root);
  void input.actor;
  store.legalShieldConfigured = input.configured;
  await save(input.root, store);
  return { legalShieldConfigured: store.legalShieldConfigured };
}

export async function attemptExecutiveAction(input: {
  agentId: string;
  action:
    | DealAction
    | 'impersonate_founder'
    | 'approve_consequential'
    | 'legal_research'
    | 'legalshield_probe';
  root: string;
  actor: DrActor;
}): Promise<ExecutiveActionAttempt> {
  const store = await load(input.root);
  const agent = store.agents.find((a) => a.id === input.agentId);
  const role = agent?.role ?? (input.actor.kind as ExecutiveAgentRole);

  let status: ExecutiveActionAttempt['status'] = 'advisory';
  let reason = 'RECOMMENDATION_ONLY';
  let disclaimer: string | undefined;

  if (input.action === 'impersonate_founder' || input.action === 'approve_consequential') {
    status = 'denied';
    reason = VIRTUAL_CEO_IMPERSONATION_DENIED;
  } else if (input.action === 'legal_research') {
    status = 'advisory';
    reason = BUSINESS_LAW_NOT_LEGAL_ADVICE;
    disclaimer = BUSINESS_LAW_DISCLAIMER;
  } else if (input.action === 'legalshield_probe') {
    status = 'unavailable';
    reason = LEGALSHIELD_UNAVAILABLE;
  } else if (
    role === 'cfo' &&
    (input.action === 'bank_transfer' ||
      input.action === 'live_charge' ||
      input.action === 'charge_customer')
  ) {
    status = 'denied';
    reason = CFO_LIVE_MUTATION_DENIED;
  } else if (
    (input.action === 'sign_contract' ||
      input.action === 'deploy_production' ||
      input.action === 'close_deal') &&
    !isFounderOrHumanApprover(input.actor)
  ) {
    status = 'denied';
    reason = VIRTUAL_CEO_IMPERSONATION_DENIED;
  }

  const attempt: ExecutiveActionAttempt = {
    id: id('exat'),
    agentId: input.agentId,
    role: role as ExecutiveAgentRole,
    action: input.action,
    status,
    reason,
    disclaimer,
    at: new Date().toISOString(),
  };
  store.attempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
