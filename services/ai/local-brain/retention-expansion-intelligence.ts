/**
 * 62L-DT Module F — Retention / Expansion Intelligence.
 * Renewal risk / expansion ≠ auto-renew or auto-charge.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  EXPANSION_NEQ_AUTO_CHARGE,
  MAX_RETENTION_SIGNALS,
  RENEWAL_NEQ_AUTO_RENEW,
  type DtActor,
} from './growth-operating-system-types';

export type RenewalRiskSignal = {
  id: string;
  customerId: string;
  riskScore: number;
  autoRenewed: false;
  autoCharged: false;
  status: 'signal_only' | 'denied';
  reason: string;
  proofRefs: string[];
  createdAt: string;
};

export type ExpansionSignal = {
  id: string;
  customerId: string;
  opportunity: string;
  autoCharged: false;
  autoRenewed: false;
  status: 'signal_only' | 'denied';
  reason: string;
  proofRefs: string[];
  createdAt: string;
};

type Store = {
  renewals: RenewalRiskSignal[];
  expansions: ExpansionSignal[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'retention-expansion-intelligence.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { renewals: [], expansions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function retentionExpansionIntelligenceHonesty() {
  return {
    renewalRiskAutoRenew: false,
    expansionSignalAutoCharge: false,
    customerProofRequired: true,
  };
}

export async function recordRenewalRisk(input: {
  customerId: string;
  riskScore: number;
  proofRefs?: string[];
  attemptAutoRenew?: boolean;
  root: string;
  actor: DtActor;
}): Promise<RenewalRiskSignal> {
  const store = await load(input.root);
  void input.actor;
  if (store.renewals.length >= MAX_RETENTION_SIGNALS) {
    throw new Error('MAX_RETENTION_SIGNALS_REACHED');
  }
  const signal: RenewalRiskSignal = {
    id: id('dtrenew'),
    customerId: input.customerId.trim(),
    riskScore: Math.max(0, Math.min(1, input.riskScore)),
    autoRenewed: false,
    autoCharged: false,
    status: input.attemptAutoRenew ? 'denied' : 'signal_only',
    reason: RENEWAL_NEQ_AUTO_RENEW,
    proofRefs: input.proofRefs ?? [],
    createdAt: new Date().toISOString(),
  };
  store.renewals.push(signal);
  await save(input.root, store);
  return signal;
}

export async function recordExpansionSignal(input: {
  customerId: string;
  opportunity: string;
  proofRefs?: string[];
  attemptAutoCharge?: boolean;
  root: string;
  actor: DtActor;
}): Promise<ExpansionSignal> {
  const store = await load(input.root);
  void input.actor;
  const signal: ExpansionSignal = {
    id: id('dtexpand'),
    customerId: input.customerId.trim(),
    opportunity: input.opportunity.trim(),
    autoCharged: false,
    autoRenewed: false,
    status: input.attemptAutoCharge ? 'denied' : 'signal_only',
    reason: EXPANSION_NEQ_AUTO_CHARGE,
    proofRefs: input.proofRefs ?? [],
    createdAt: new Date().toISOString(),
  };
  store.expansions.push(signal);
  await save(input.root, store);
  return signal;
}
