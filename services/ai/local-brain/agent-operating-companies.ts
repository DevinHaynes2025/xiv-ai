/**
 * 62L-CK Agent Operating Companies —
 * Bounded org/agent structures (sandboxed/gated).
 * No autonomous spend/bill; learning ≠ permission; no self-escalation.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AGENT_CO_PERMISSION_DENIED,
  AGENT_CO_SPEND_DENIED,
  CK_LOCKS,
  HONESTY_BANNER,
  type CkActor,
} from './cognitive-infra-mini-cloud-history-types';

export type AgentOperatingCompany = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  bounded: true;
  sandboxed: true;
  permissionLevel: number;
  authorityLevel: number;
  spendAuthority: false;
  billingAuthority: false;
  purchaseAuthority: false;
  status: 'registered' | 'denied';
  reason: string;
  productionAuthorized: false;
  at: string;
};

export type AgentCoAction = {
  id: string;
  companyId: string;
  action:
    | 'register'
    | 'spend'
    | 'bill'
    | 'purchase'
    | 'escalate_permission'
    | 'escalate_authority'
    | 'learn_skill';
  accepted: boolean;
  status: 'ok' | 'denied' | 'bounded';
  reason: string;
  permissionIncreased: boolean;
  authorityIncreased: boolean;
  at: string;
};

type Store = {
  companies: AgentOperatingCompany[];
  actions: AgentCoAction[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-operating-companies.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { companies: [], actions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentOperatingCompaniesHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CK_LOCKS.L4_AUTONOMY_ENABLED,
    autonomousSpend: CK_LOCKS.AGENT_CO_AUTONOMOUS_SPEND,
    billingAuthority: CK_LOCKS.AGENT_CO_BILLING_AUTHORITY,
    purchaseAuthority: CK_LOCKS.AGENT_CO_PURCHASE_AUTHORITY,
    selfPermissionEscalation: CK_LOCKS.AGENT_CO_SELF_PERMISSION_ESCALATION,
    learningIsPermission: CK_LOCKS.LEARNING_IS_PERMISSION,
    productionAuthorization: CK_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function registerAgentOperatingCompany(input: {
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissionLevel?: number;
  authorityLevel?: number;
  attemptSpendAuthority?: boolean;
  root: string;
  actor: CkActor;
}): Promise<{ company: AgentOperatingCompany; action: AgentCoAction }> {
  const store = await load(input.root);

  if (input.attemptSpendAuthority === true) {
    const action: AgentCoAction = {
      id: id('acoa'),
      companyId: 'none',
      action: 'spend',
      accepted: false,
      status: 'denied',
      reason: AGENT_CO_SPEND_DENIED,
      permissionIncreased: false,
      authorityIncreased: false,
      at: new Date().toISOString(),
    };
    const company: AgentOperatingCompany = {
      id: id('agco'),
      name: input.name,
      orgId: input.orgId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      bounded: true,
      sandboxed: true,
      permissionLevel: input.permissionLevel ?? 0,
      authorityLevel: input.authorityLevel ?? 0,
      spendAuthority: false,
      billingAuthority: false,
      purchaseAuthority: false,
      status: 'denied',
      reason: AGENT_CO_SPEND_DENIED,
      productionAuthorized: false,
      at: new Date().toISOString(),
    };
    store.companies.push(company);
    action.companyId = company.id;
    store.actions.push(action);
    await save(input.root, store);
    return { company, action };
  }

  const company: AgentOperatingCompany = {
    id: id('agco'),
    name: input.name,
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    bounded: true,
    sandboxed: true,
    permissionLevel: input.permissionLevel ?? 0,
    authorityLevel: input.authorityLevel ?? 0,
    spendAuthority: false,
    billingAuthority: false,
    purchaseAuthority: false,
    status: 'registered',
    reason: 'AGENT_OPERATING_COMPANY_BOUNDED_SANDBOXED',
    productionAuthorized: false,
    at: new Date().toISOString(),
  };
  const action: AgentCoAction = {
    id: id('acoa'),
    companyId: company.id,
    action: 'register',
    accepted: true,
    status: 'bounded',
    reason: 'AGENT_OPERATING_COMPANY_BOUNDED_SANDBOXED',
    permissionIncreased: false,
    authorityIncreased: false,
    at: new Date().toISOString(),
  };
  store.companies.push(company);
  store.actions.push(action);
  await save(input.root, store);
  return { company, action };
}

export async function attemptAgentCoAction(input: {
  companyId: string;
  action: AgentCoAction['action'];
  root: string;
  actor: CkActor;
}): Promise<AgentCoAction> {
  const store = await load(input.root);
  const company = store.companies.find((c) => c.id === input.companyId);

  if (!company || company.status !== 'registered') {
    const action: AgentCoAction = {
      id: id('acoa'),
      companyId: input.companyId,
      action: input.action,
      accepted: false,
      status: 'denied',
      reason: AGENT_CO_PERMISSION_DENIED,
      permissionIncreased: false,
      authorityIncreased: false,
      at: new Date().toISOString(),
    };
    store.actions.push(action);
    await save(input.root, store);
    return action;
  }

  if (
    input.action === 'spend' ||
    input.action === 'bill' ||
    input.action === 'purchase'
  ) {
    const action: AgentCoAction = {
      id: id('acoa'),
      companyId: company.id,
      action: input.action,
      accepted: false,
      status: 'denied',
      reason: AGENT_CO_SPEND_DENIED,
      permissionIncreased: false,
      authorityIncreased: false,
      at: new Date().toISOString(),
    };
    store.actions.push(action);
    await save(input.root, store);
    return action;
  }

  if (
    input.action === 'escalate_permission' ||
    input.action === 'escalate_authority'
  ) {
    const action: AgentCoAction = {
      id: id('acoa'),
      companyId: company.id,
      action: input.action,
      accepted: false,
      status: 'denied',
      reason: AGENT_CO_PERMISSION_DENIED,
      permissionIncreased: false,
      authorityIncreased: false,
      at: new Date().toISOString(),
    };
    store.actions.push(action);
    await save(input.root, store);
    return action;
  }

  // learn_skill: bounded; learning ≠ permission
  const action: AgentCoAction = {
    id: id('acoa'),
    companyId: company.id,
    action: 'learn_skill',
    accepted: true,
    status: 'bounded',
    reason: 'LEARNING_RECORDED_NOT_PERMISSION_GRANT',
    permissionIncreased: false,
    authorityIncreased: false,
    at: new Date().toISOString(),
  };
  store.actions.push(action);
  await save(input.root, store);
  return action;
}
