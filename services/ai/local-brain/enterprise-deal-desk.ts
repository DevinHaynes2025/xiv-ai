/**
 * 62L-DT Module C — Enterprise Deal Desk.
 * Deal approval gates; negotiation memory ≠ auto-sign.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DEAL_GATE_REQUIRED,
  isHumanOrFounder,
  MAX_DEALS,
  NEGOTIATION_NEQ_AUTO_SIGN,
  type DtActor,
} from './growth-operating-system-types';

export type DealRecord = {
  id: string;
  counterparty: string;
  stage: 'draft' | 'negotiation' | 'pending_approval' | 'approved_candidate' | 'denied';
  autoSigned: false;
  reason: string;
  createdAt: string;
};

export type DealApproval = {
  id: string;
  dealId: string;
  status: 'approved_candidate' | 'denied';
  autoSigned: false;
  reason: string;
  at: string;
};

export type NegotiationMemoryAction = {
  id: string;
  dealId: string;
  memoryRef: string;
  attemptAutoSign: boolean;
  status: 'recorded' | 'denied';
  autoSigned: false;
  reason: string;
  at: string;
};

type Store = {
  deals: DealRecord[];
  approvals: DealApproval[];
  negotiationActions: NegotiationMemoryAction[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'enterprise-deal-desk.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    deals: [],
    approvals: [],
    negotiationActions: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function enterpriseDealDeskHonesty() {
  return {
    dealApprovalAutoSign: false,
    negotiationMemoryAutoSign: false,
    recommendationEqContract: false,
    recommendationEqPayment: false,
    humanFounderGateRequired: true,
  };
}

export async function openDeal(input: {
  counterparty: string;
  root: string;
  actor: DtActor;
}): Promise<DealRecord> {
  const store = await load(input.root);
  void input.actor;
  if (store.deals.length >= MAX_DEALS) throw new Error('MAX_DEALS_REACHED');
  const deal: DealRecord = {
    id: id('dtdeal'),
    counterparty: input.counterparty.trim(),
    stage: 'draft',
    autoSigned: false,
    reason: 'DEAL_DRAFT_NOT_SIGNED',
    createdAt: new Date().toISOString(),
  };
  store.deals.push(deal);
  await save(input.root, store);
  return deal;
}

export async function approveDeal(input: {
  dealId: string;
  humanGatePresent: boolean;
  actor: DtActor;
  root: string;
}): Promise<DealApproval> {
  const store = await load(input.root);
  const gated = input.humanGatePresent && isHumanOrFounder(input.actor);
  const approval: DealApproval = {
    id: id('dtappr'),
    dealId: input.dealId,
    status: gated ? 'approved_candidate' : 'denied',
    autoSigned: false,
    reason: gated ? 'DEAL_APPROVED_CANDIDATE_NOT_AUTO_SIGNED' : DEAL_GATE_REQUIRED,
    at: new Date().toISOString(),
  };
  const deal = store.deals.find((d) => d.id === input.dealId);
  if (deal) {
    deal.stage = gated ? 'approved_candidate' : 'denied';
    deal.reason = approval.reason;
  }
  store.approvals.push(approval);
  await save(input.root, store);
  return approval;
}

export async function applyNegotiationMemory(input: {
  dealId: string;
  memoryRef: string;
  attemptAutoSign?: boolean;
  root: string;
  actor: DtActor;
}): Promise<NegotiationMemoryAction> {
  const store = await load(input.root);
  void input.actor;
  const action: NegotiationMemoryAction = {
    id: id('dtneg'),
    dealId: input.dealId,
    memoryRef: input.memoryRef,
    attemptAutoSign: input.attemptAutoSign === true,
    status: input.attemptAutoSign ? 'denied' : 'recorded',
    autoSigned: false,
    reason: input.attemptAutoSign
      ? NEGOTIATION_NEQ_AUTO_SIGN
      : 'NEGOTIATION_MEMORY_RECORDED_NOT_SIGNED',
    at: new Date().toISOString(),
  };
  store.negotiationActions.push(action);
  await save(input.root, store);
  return action;
}
