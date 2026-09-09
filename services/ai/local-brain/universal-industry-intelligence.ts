/**
 * 62L-DU Module A — Universal Industry Intelligence OS.
 * Supply chain / logistics / WMS/TMS / hospital logistics —
 * planning & intelligence with human gates; ≠ unauthorized physical control.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  HOSPITAL_HUMAN_GATE_REQUIRED,
  INDUSTRY_PLAN_NEQ_CONTROL,
  MAX_INDUSTRY_PLANS,
  UNCONFIGURED_INDUSTRY_PROVIDER,
  type DuActor,
} from './universal-industry-intelligence-os-types';

export type IndustryDomain =
  | 'supply_chain'
  | 'logistics'
  | 'wms'
  | 'tms'
  | 'hospital_logistics';

export type IndustryPlan = {
  id: string;
  domain: IndustryDomain;
  summary: string;
  physicalControlAuthorized: false;
  humanGateRequired: boolean;
  status: 'plan_only' | 'denied';
  reason: string;
  createdAt: string;
};

export type HospitalLogisticsGate = {
  id: string;
  planId: string;
  humanGatePresent: boolean;
  status: 'allowed_plan' | 'denied';
  physicalControl: false;
  reason: string;
  at: string;
};

export type IndustryProviderProbe = {
  providerId: string;
  configured: boolean;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  plans: IndustryPlan[];
  hospitalGates: HospitalLogisticsGate[];
  providerProbes: IndustryProviderProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-industry-intelligence.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    plans: [],
    hospitalGates: [],
    providerProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalIndustryIntelligenceHonesty() {
  return {
    planEqPhysicalControl: false,
    hospitalRequiresHumanGate: true,
    unconfiguredProviderInventedAvailable: false,
    l4AutonomyEnabled: false,
  };
}

export async function createIndustryPlan(input: {
  domain: IndustryDomain;
  summary: string;
  attemptPhysicalControl?: boolean;
  root: string;
  actor: DuActor;
}): Promise<IndustryPlan> {
  const store = await load(input.root);
  void input.actor;
  if (store.plans.length >= MAX_INDUSTRY_PLANS) {
    throw new Error('MAX_INDUSTRY_PLANS_REACHED');
  }
  const attempting = input.attemptPhysicalControl === true;
  const plan: IndustryPlan = {
    id: id('duplan'),
    domain: input.domain,
    summary: input.summary.trim(),
    physicalControlAuthorized: false,
    humanGateRequired: true,
    status: attempting ? 'denied' : 'plan_only',
    reason: attempting ? INDUSTRY_PLAN_NEQ_CONTROL : 'INDUSTRY_PLAN_RECORDED_PLAN_ONLY',
    createdAt: new Date().toISOString(),
  };
  store.plans.push(plan);
  await save(input.root, store);
  return plan;
}

export async function gateHospitalLogistics(input: {
  planId: string;
  humanGatePresent: boolean;
  attemptPhysicalControl?: boolean;
  root: string;
  actor: DuActor;
}): Promise<HospitalLogisticsGate> {
  const store = await load(input.root);
  void input.actor;
  const allowed = input.humanGatePresent && input.attemptPhysicalControl !== true;
  const gate: HospitalLogisticsGate = {
    id: id('duhosp'),
    planId: input.planId,
    humanGatePresent: input.humanGatePresent,
    status: allowed ? 'allowed_plan' : 'denied',
    physicalControl: false,
    reason: allowed
      ? 'HOSPITAL_LOGISTICS_PLAN_WITH_HUMAN_GATE'
      : HOSPITAL_HUMAN_GATE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.hospitalGates.push(gate);
  await save(input.root, store);
  return gate;
}

export async function probeIndustryProvider(input: {
  providerId: string;
  configured: boolean;
  claimAvailable?: boolean;
  root: string;
  actor: DuActor;
}): Promise<IndustryProviderProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: IndustryProviderProbe = input.configured
    ? {
        providerId: input.providerId,
        configured: true,
        availability: 'AVAILABLE',
        status: 'ok',
        reason: 'INDUSTRY_PROVIDER_CONFIGURED_NOT_PRODUCTION_AUTHORIZED',
        at: new Date().toISOString(),
      }
    : {
        providerId: input.providerId,
        configured: false,
        availability: 'UNAVAILABLE',
        status: 'denied',
        reason: UNCONFIGURED_INDUSTRY_PROVIDER,
        at: new Date().toISOString(),
      };
  if (!input.configured && input.claimAvailable) {
    probe.status = 'denied';
    probe.availability = 'UNAVAILABLE';
    probe.reason = UNCONFIGURED_INDUSTRY_PROVIDER;
  }
  store.providerProbes.push(probe);
  await save(input.root, store);
  return probe;
}
