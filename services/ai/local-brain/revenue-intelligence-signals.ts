/**
 * 62L-DS Revenue Intelligence OS — governed revenue signals.
 * Recommendation ≠ charge / deploy / spend / sign / publish.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DS_LOCKS,
  GOVERNED_METRIC_KINDS,
  HONESTY_BANNER,
  MAX_REVENUE_SIGNALS,
  REVENUE_RECOMMENDATION_NEQ_CHARGE,
  type ConsequentialCommercialAction,
  type DsActor,
  type GovernedMetricKind,
  isFounderOrHumanApprover,
} from './revenue-intelligence-os-types';

export type RevenueSignal = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  metricKind: GovernedMetricKind;
  label: string;
  value: number;
  unit: string;
  recommendationOnly: true;
  correlationEqCausation: false;
  forecastEqVerifiedFact: false;
  createdAt: string;
};

export type ChargeAttempt = {
  id: string;
  signalId: string;
  action: ConsequentialCommercialAction;
  status: 'denied' | 'allowed_advisory' | 'founder_gated';
  reason: string;
  at: string;
};

type Store = { signals: RevenueSignal[]; charges: ChargeAttempt[] };

function storePath(root: string) {
  return xivLocalPath(root, 'revenue-intelligence-signals.json');
}
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { signals: [], charges: [] });
}
async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}
function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function revenueIntelligenceSignalsHonesty() {
  return {
    banner: HONESTY_BANNER,
    recommendationEqCharge: DS_LOCKS.RECOMMENDATION_EQ_CHARGE,
    correlationEqCausation: DS_LOCKS.CORRELATION_EQ_CAUSATION,
    forecastEqVerifiedFact: DS_LOCKS.FORECAST_EQ_VERIFIED_FACT,
    governedMetricKinds: GOVERNED_METRIC_KINDS,
    l4AutonomyEnabled: DS_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export async function recordRevenueSignal(input: {
  metricKind: GovernedMetricKind;
  label: string;
  value: number;
  unit?: string;
  root: string;
  actor: DsActor;
}): Promise<RevenueSignal> {
  const store = await load(input.root);
  if (store.signals.length >= MAX_REVENUE_SIGNALS) throw new Error('MAX_REVENUE_SIGNALS_REACHED');
  const signal: RevenueSignal = {
    id: id('rvisig'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    metricKind: input.metricKind,
    label: input.label,
    value: input.value,
    unit: input.unit ?? 'usd',
    recommendationOnly: true,
    correlationEqCausation: false,
    forecastEqVerifiedFact: false,
    createdAt: new Date().toISOString(),
  };
  store.signals.push(signal);
  await save(input.root, store);
  return signal;
}

export async function attemptChargeFromRecommendation(input: {
  signalId: string;
  action?: ConsequentialCommercialAction;
  root: string;
  actor: DsActor;
}): Promise<ChargeAttempt> {
  const store = await load(input.root);
  const action = input.action ?? 'charge';
  void isFounderOrHumanApprover;
  const attempt: ChargeAttempt = {
    id: id('rvichg'),
    signalId: input.signalId,
    action,
    status: 'denied',
    reason: REVENUE_RECOMMENDATION_NEQ_CHARGE,
    at: new Date().toISOString(),
  };
  store.charges.push(attempt);
  await save(input.root, store);
  return attempt;
}
