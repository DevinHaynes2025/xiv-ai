/**
 * 62L-DX Module A — Autonomous Supply Chain Operations Brain.
 * Exception handling + recovery planning: analyze / simulate / recommend only.
 * Hard autonomy boundary denies freight / PO / contract / spend / prod-change.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AUTONOMY_BOUNDARY,
  AUTONOMY_BOUNDARY_DENIED_ACTIONS,
  CONTRACT_SIGNING_DENIED,
  EXCEPTION_RECOVERY_ADVISORY_ONLY,
  FREIGHT_BOOKING_DENIED,
  MAX_EXCEPTION_PLANS,
  PRODUCTION_CHANGE_DENIED,
  PURCHASE_ORDER_DENIED,
  SPEND_MONEY_DENIED,
  type AutonomyBoundaryAction,
  type DxActor,
} from './autonomous-supply-chain-ops-types';

export type ExceptionRecoveryPlan = {
  id: string;
  exceptionId: string;
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
  plans: ExceptionRecoveryPlan[];
  denials: AutonomyBoundaryDenial[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-supply-chain-ops-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { plans: [], denials: [] });
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

export function autonomousSupplyChainOpsBrainHonesty() {
  return {
    analyzeSimulateRecommendOnly: true,
    autonomousFreightBooking: false,
    autonomousPurchaseOrder: false,
    autonomousContractSigning: false,
    autonomousSpend: false,
    autonomousProductionChange: false,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    l4AutonomyEnabled: false,
  };
}

export async function planExceptionRecovery(input: {
  exceptionId: string;
  summary: string;
  mode?: 'analyze' | 'simulate' | 'recommend';
  attemptPhysicalExecution?: boolean;
  root: string;
  actor: DxActor;
}): Promise<ExceptionRecoveryPlan> {
  const store = await load(input.root);
  void input.actor;
  if (store.plans.length >= MAX_EXCEPTION_PLANS) {
    throw new Error('MAX_EXCEPTION_PLANS_REACHED');
  }
  const attempting = input.attemptPhysicalExecution === true;
  const plan: ExceptionRecoveryPlan = {
    id: id('dxexc'),
    exceptionId: input.exceptionId,
    summary: input.summary.trim(),
    mode: input.mode ?? 'recommend',
    physicalExecutionAuthorized: false,
    status: attempting ? 'denied' : 'advisory_only',
    reason: attempting
      ? EXCEPTION_RECOVERY_ADVISORY_ONLY
      : 'EXCEPTION_RECOVERY_ADVISORY_RECORDED',
    createdAt: new Date().toISOString(),
  };
  store.plans.push(plan);
  await save(input.root, store);
  return plan;
}

export async function denyAutonomyBoundaryAction(input: {
  action: AutonomyBoundaryAction;
  root: string;
  actor: DxActor;
}): Promise<AutonomyBoundaryDenial> {
  const store = await load(input.root);
  void input.actor;
  if (
    !(AUTONOMY_BOUNDARY_DENIED_ACTIONS as readonly string[]).includes(
      input.action,
    )
  ) {
    throw new Error('UNKNOWN_AUTONOMY_BOUNDARY_ACTION');
  }
  const denial: AutonomyBoundaryDenial = {
    id: id('dxdeny'),
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
