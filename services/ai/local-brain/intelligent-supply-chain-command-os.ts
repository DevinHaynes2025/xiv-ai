/**
 * 62L-DY Module A — Intelligent Supply Chain Command OS.
 * Recovery playbooks: analyze / simulate / recommend only.
 * Hard autonomy boundary denies freight / PO / contract / spend / prod-change.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AUTONOMY_BOUNDARY,
  AUTONOMY_BOUNDARY_DENIED_ACTIONS,
  CONTRACT_SIGNING_DENIED,
  FREIGHT_BOOKING_DENIED,
  MAX_RECOVERY_PLAYBOOKS,
  PRODUCTION_CHANGE_DENIED,
  PURCHASE_ORDER_DENIED,
  RECOVERY_PLAYBOOK_ADVISORY_ONLY,
  SPEND_MONEY_DENIED,
  type AutonomyBoundaryAction,
  type DyActor,
} from './intelligent-supply-chain-command-types';

export type RecoveryPlaybook = {
  id: string;
  incidentId: string;
  summary: string;
  mode: 'analyze' | 'simulate' | 'recommend';
  physicalExecutionAuthorized: false;
  status: 'advisory_only' | 'denied';
  reason: string;
  createdAt: string;
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
  playbooks: RecoveryPlaybook[];
  denials: AutonomyBoundaryDenial[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'intelligent-supply-chain-command-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { playbooks: [], denials: [] });
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

export function intelligentSupplyChainCommandOsHonesty() {
  return {
    recoveryPlaybooksAdvisoryOnly: true,
    physicalExecutionAuthorized: false,
    l4AutonomyEnabled: false,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    recommendEqCharge: false,
    recommendEqDeploy: false,
    recommendEqSpend: false,
    recommendEqSign: false,
  };
}

export async function createRecoveryPlaybook(input: {
  incidentId: string;
  summary: string;
  mode?: 'analyze' | 'simulate' | 'recommend';
  attemptPhysicalExecution?: boolean;
  root: string;
  actor: DyActor;
}): Promise<RecoveryPlaybook> {
  const store = await load(input.root);
  void input.actor;
  if (store.playbooks.length >= MAX_RECOVERY_PLAYBOOKS) {
    throw new Error('MAX_RECOVERY_PLAYBOOKS_REACHED');
  }
  const playbook: RecoveryPlaybook = {
    id: id('dypb'),
    incidentId: input.incidentId.trim(),
    summary: input.summary.trim(),
    mode: input.mode ?? 'recommend',
    physicalExecutionAuthorized: false,
    status: 'advisory_only',
    reason: RECOVERY_PLAYBOOK_ADVISORY_ONLY,
    createdAt: new Date().toISOString(),
  };
  store.playbooks.push(playbook);
  await save(input.root, store);
  return playbook;
}

export async function denyAutonomyBoundaryAction(input: {
  action: AutonomyBoundaryAction;
  root: string;
  actor: DyActor;
}): Promise<AutonomyBoundaryDenial> {
  const store = await load(input.root);
  void input.actor;
  if (!AUTONOMY_BOUNDARY_DENIED_ACTIONS.includes(input.action)) {
    throw new Error('UNKNOWN_AUTONOMY_BOUNDARY_ACTION');
  }
  const denial: AutonomyBoundaryDenial = {
    id: id('dyabd'),
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
