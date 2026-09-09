/**
 * 62L-DG Personal Agent Economy —
 * Personal agent teams; overnight shift planning; resource accounting ≠ spend authority.
 * Cannot purchase/bill. Overnight requires authorized powered node.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AGENT_ECONOMY_PURCHASE_BILL_DENIED,
  DG_LOCKS,
  HONESTY_BANNER,
  MAX_AGENT_TEAMS,
  MAX_OVERNIGHT_SHIFTS,
  OVERNIGHT_OFFLINE_STOPPED,
  OVERNIGHT_WAITING_NODE,
  type DgActor,
  type OvernightShiftStatus,
} from './universal-personal-business-ai-os-types';

export type PersonalAgentEconomy = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  accountingOnly: true;
  canPurchase: false;
  canBill: false;
  createdAt: string;
};

export type AgentTeam = {
  id: string;
  economyId: string;
  teamId: string;
  status: 'REGISTERED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type OvernightShift = {
  id: string;
  economyId: string;
  shiftId: string;
  teamId: string;
  poweredAuthorizedNode: boolean;
  nodeOnline: boolean;
  status: OvernightShiftStatus;
  reason: string;
  at: string;
};

export type EconomySpendAttempt = {
  id: string;
  economyId: string;
  kind: 'purchase' | 'bill';
  amount: number;
  status: 'DENIED';
  reason: string;
  accountingOnly: true;
  at: string;
};

type Store = {
  economies: PersonalAgentEconomy[];
  teams: AgentTeam[];
  shifts: OvernightShift[];
  spends: EconomySpendAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'personal-agent-economy.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    economies: [],
    teams: [],
    shifts: [],
    spends: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function personalAgentEconomyHonesty() {
  return {
    banner: HONESTY_BANNER,
    canPurchase: DG_LOCKS.AGENT_ECONOMY_CAN_PURCHASE,
    canBill: DG_LOCKS.AGENT_ECONOMY_CAN_BILL,
    accountingOnly: DG_LOCKS.AGENT_ECONOMY_ACCOUNTING_ONLY,
    resourceAccountingEqSpendAuthority: DG_LOCKS.RESOURCE_ACCOUNTING_EQ_SPEND_AUTHORITY,
    overnightRequiresAuthorizedPoweredNode:
      DG_LOCKS.OVERNIGHT_REQUIRES_AUTHORIZED_POWERED_NODE,
  };
}

export async function bootstrapPersonalAgentEconomy(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DgActor;
}): Promise<PersonalAgentEconomy> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.economies.find(
    (e) =>
      e.orgId === input.orgId &&
      e.tenantId === input.tenantId &&
      e.universeId === input.universeId,
  );
  if (existing) return existing;
  const economy: PersonalAgentEconomy = {
    id: id('dgae'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    accountingOnly: true,
    canPurchase: false,
    canBill: false,
    createdAt: new Date().toISOString(),
  };
  store.economies.push(economy);
  await save(input.root, store);
  return economy;
}

export async function registerPersonalAgentTeam(input: {
  economyId: string;
  teamId: string;
  root: string;
  actor: DgActor;
}): Promise<{ accepted: boolean; reason: string; team?: AgentTeam }> {
  void input.actor;
  const store = await load(input.root);
  if (store.teams.filter((t) => t.economyId === input.economyId).length >= MAX_AGENT_TEAMS) {
    return { accepted: false, reason: 'MAX_AGENT_TEAMS' };
  }
  const team: AgentTeam = {
    id: id('dgteam'),
    economyId: input.economyId,
    teamId: input.teamId,
    status: 'REGISTERED',
    reason: 'PERSONAL_AGENT_TEAM_REGISTERED',
    createdAt: new Date().toISOString(),
  };
  store.teams.push(team);
  await save(input.root, store);
  return { accepted: true, reason: team.reason, team };
}

export async function planOvernightShift(input: {
  economyId: string;
  shiftId: string;
  teamId: string;
  poweredAuthorizedNode: boolean;
  nodeOnline?: boolean;
  root: string;
  actor: DgActor;
}): Promise<{ accepted: boolean; status: OvernightShiftStatus; reason: string; shift: OvernightShift }> {
  void input.actor;
  const store = await load(input.root);
  if (store.shifts.filter((s) => s.economyId === input.economyId).length >= MAX_OVERNIGHT_SHIFTS) {
    const denied: OvernightShift = {
      id: id('dgshift'),
      economyId: input.economyId,
      shiftId: input.shiftId,
      teamId: input.teamId,
      poweredAuthorizedNode: input.poweredAuthorizedNode,
      nodeOnline: input.nodeOnline === true,
      status: 'DENIED',
      reason: 'MAX_OVERNIGHT_SHIFTS',
      at: new Date().toISOString(),
    };
    store.shifts.push(denied);
    await save(input.root, store);
    return { accepted: false, status: denied.status, reason: denied.reason, shift: denied };
  }

  let status: OvernightShiftStatus = 'SCHEDULED';
  let reason = 'OVERNIGHT_SHIFT_SCHEDULED_ON_AUTHORIZED_POWERED_NODE';

  if (!input.poweredAuthorizedNode) {
    status = input.nodeOnline === false ? OVERNIGHT_OFFLINE_STOPPED : OVERNIGHT_WAITING_NODE;
    reason =
      status === OVERNIGHT_OFFLINE_STOPPED
        ? 'OVERNIGHT_NO_POWERED_AUTHORIZED_NODE_OFFLINE_STOPPED'
        : 'OVERNIGHT_NO_POWERED_AUTHORIZED_NODE_WAITING_NODE';
  } else if (input.nodeOnline === false) {
    status = OVERNIGHT_OFFLINE_STOPPED;
    reason = 'OVERNIGHT_AUTHORIZED_NODE_OFFLINE_STOPPED';
  } else {
    status = 'RUNNING_VERIFIED';
    reason = 'OVERNIGHT_SHIFT_RUNNING_ON_AUTHORIZED_POWERED_NODE';
  }

  const shift: OvernightShift = {
    id: id('dgshift'),
    economyId: input.economyId,
    shiftId: input.shiftId,
    teamId: input.teamId,
    poweredAuthorizedNode: input.poweredAuthorizedNode,
    nodeOnline: input.nodeOnline !== false,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.shifts.push(shift);
  await save(input.root, store);
  return {
    accepted: status === 'RUNNING_VERIFIED' || status === 'SCHEDULED',
    status,
    reason,
    shift,
  };
}

export async function attemptAgentEconomySpend(input: {
  economyId: string;
  kind: 'purchase' | 'bill';
  amount: number;
  root: string;
  actor: DgActor;
}): Promise<{ accepted: false; reason: string; spend: EconomySpendAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const spend: EconomySpendAttempt = {
    id: id('dgspend'),
    economyId: input.economyId,
    kind: input.kind,
    amount: input.amount,
    status: 'DENIED',
    reason: AGENT_ECONOMY_PURCHASE_BILL_DENIED,
    accountingOnly: true,
    at: new Date().toISOString(),
  };
  store.spends.push(spend);
  await save(input.root, store);
  return { accepted: false, reason: spend.reason, spend };
}
