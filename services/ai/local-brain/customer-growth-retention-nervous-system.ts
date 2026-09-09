/**
 * 62L-DS Customer Growth & Retention Nervous System —
 * Onboarding/renewal/expansion intelligence; ≠ auto-renew/charge without gates.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DS_LOCKS,
  HONESTY_BANNER,
  MAX_RETENTION_SIGNALS,
  RETENTION_NEQ_AUTO_RENEW_CHARGE,
  type DsActor,
  isFounderOrHumanApprover,
} from './revenue-intelligence-os-types';

export type RetentionSignalKind =
  | 'onboarding'
  | 'health'
  | 'renewal'
  | 'expansion'
  | 'churn_risk';

export type RetentionSignal = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  kind: RetentionSignalKind;
  customerLabel: string;
  score: number;
  recommendationOnly: true;
  autoRenew: false;
  autoCharge: false;
  createdAt: string;
};

export type RenewChargeAttempt = {
  id: string;
  signalId: string;
  action: 'auto_renew' | 'auto_charge' | 'expansion_charge';
  status: 'denied' | 'founder_gated_advisory';
  reason: string;
  at: string;
};

type Store = { signals: RetentionSignal[]; attempts: RenewChargeAttempt[] };

function storePath(root: string) {
  return xivLocalPath(root, 'customer-growth-retention-nervous-system.json');
}
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { signals: [], attempts: [] });
}
async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}
function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function customerGrowthRetentionHonesty() {
  return {
    banner: HONESTY_BANNER,
    retentionAutoCharge: DS_LOCKS.RETENTION_AUTO_CHARGE,
    expansionAutoCharge: DS_LOCKS.EXPANSION_AUTO_CHARGE,
    recommendationEqAutoRenew: DS_LOCKS.RECOMMENDATION_EQ_AUTO_RENEW,
  };
}

export async function recordRetentionSignal(input: {
  kind: RetentionSignalKind;
  customerLabel: string;
  score: number;
  root: string;
  actor: DsActor;
}): Promise<RetentionSignal> {
  const store = await load(input.root);
  if (store.signals.length >= MAX_RETENTION_SIGNALS) throw new Error('MAX_RETENTION_SIGNALS_REACHED');
  const signal: RetentionSignal = {
    id: id('ret'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    kind: input.kind,
    customerLabel: input.customerLabel,
    score: input.score,
    recommendationOnly: true,
    autoRenew: false,
    autoCharge: false,
    createdAt: new Date().toISOString(),
  };
  store.signals.push(signal);
  await save(input.root, store);
  return signal;
}

export async function attemptAutoRenewOrCharge(input: {
  signalId: string;
  action: 'auto_renew' | 'auto_charge' | 'expansion_charge';
  root: string;
  actor: DsActor;
}): Promise<RenewChargeAttempt> {
  const store = await load(input.root);
  const founderOk = isFounderOrHumanApprover(input.actor);
  const attempt: RenewChargeAttempt = {
    id: id('ren'),
    signalId: input.signalId,
    action: input.action,
    status: founderOk ? 'founder_gated_advisory' : 'denied',
    reason: founderOk
      ? 'FOUNDER_GATE_ADVISORY_NOT_AUTO_RENEW_OR_CHARGE'
      : RETENTION_NEQ_AUTO_RENEW_CHARGE,
    at: new Date().toISOString(),
  };
  store.attempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
