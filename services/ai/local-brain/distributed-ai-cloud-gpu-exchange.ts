/**
 * 62L-EB Module B — Distributed AI Cloud & GPU Exchange.
 * Virtual GPU planning; cloud cost controls.
 * Recommendation ≠ auto-spend; scheduling ≠ unauthorized charge.
 * RUNNING_VERIFIED / GPU claims need real evidence.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CLOUD_COST_NO_UNAUTHORIZED_CHARGE,
  GPU_EVIDENCE_REQUIRED,
  MAX_GPU_PLANS,
  VGPU_RECOMMEND_NEQ_AUTO_SPEND,
  type EbActor,
  type EbEvidenceState,
} from './multi-model-superbrain-federation-types';

export type VgpuPlan = {
  id: string;
  planId: string;
  estimatedCostUsd: number;
  autoSpendRequested: boolean;
  chargeAuthorized: boolean;
  status: 'recommendation_only' | 'denied' | 'plan_only';
  state: EbEvidenceState;
  reason: string;
  spendExecuted: false;
  at: string;
};

export type CloudCostControl = {
  id: string;
  action: 'schedule' | 'charge' | 'recommend';
  unauthorizedChargeAttempted: boolean;
  status: 'ok' | 'denied';
  reason: string;
  chargeExecuted: false;
  at: string;
};

export type GpuEvidenceProbe = {
  id: string;
  nodeId: string;
  claimRunningVerified: boolean;
  heartbeatPresent: boolean;
  evidencePresent: boolean;
  status: 'ok' | 'denied';
  state: EbEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  plans: VgpuPlan[];
  costs: CloudCostControl[];
  gpuProbes: GpuEvidenceProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-ai-cloud-gpu-exchange.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    plans: [],
    costs: [],
    gpuProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function distributedAiCloudGpuExchangeHonesty() {
  return {
    vgpuPlanningRecommendationOnly: true,
    recommendNeqAutoSpend: true,
    schedulingNeqUnauthorizedCharge: true,
    gpuRunningVerifiedNeedsEvidence: true,
    spendExecuted: false,
    chargeExecuted: false,
  };
}

export async function planVirtualGpu(input: {
  planId: string;
  estimatedCostUsd: number;
  autoSpendRequested?: boolean;
  chargeAuthorized?: boolean;
  root: string;
  actor: EbActor;
}): Promise<VgpuPlan> {
  const store = await load(input.root);
  void input.actor;
  if (store.plans.length >= MAX_GPU_PLANS) {
    throw new Error('MAX_GPU_PLANS_REACHED');
  }
  const autoSpend = Boolean(input.autoSpendRequested);
  const plan: VgpuPlan = {
    id: id('ebvgpu'),
    planId: input.planId.trim(),
    estimatedCostUsd: input.estimatedCostUsd,
    autoSpendRequested: autoSpend,
    chargeAuthorized: Boolean(input.chargeAuthorized),
    status: autoSpend ? 'denied' : 'recommendation_only',
    state: autoSpend ? 'DENIED' : 'RECOMMENDATION_ONLY',
    reason: VGPU_RECOMMEND_NEQ_AUTO_SPEND,
    spendExecuted: false,
    at: new Date().toISOString(),
  };
  store.plans.push(plan);
  await save(input.root, store);
  return plan;
}

export async function enforceCloudCostControl(input: {
  action: 'schedule' | 'charge' | 'recommend';
  unauthorizedChargeAttempted?: boolean;
  root: string;
  actor: EbActor;
}): Promise<CloudCostControl> {
  const store = await load(input.root);
  void input.actor;
  const unauthorized =
    Boolean(input.unauthorizedChargeAttempted) || input.action === 'charge';
  const control: CloudCostControl = {
    id: id('ebccc'),
    action: input.action,
    unauthorizedChargeAttempted: unauthorized,
    status: unauthorized ? 'denied' : 'ok',
    reason: unauthorized
      ? CLOUD_COST_NO_UNAUTHORIZED_CHARGE
      : input.action === 'recommend'
        ? 'CLOUD_COST_RECOMMENDATION_ONLY'
        : 'CLOUD_COST_SCHEDULE_PLAN_ONLY',
    chargeExecuted: false,
    at: new Date().toISOString(),
  };
  store.costs.push(control);
  await save(input.root, store);
  return control;
}

export async function probeGpuRunningVerified(input: {
  nodeId: string;
  claimRunningVerified: boolean;
  heartbeatPresent: boolean;
  evidencePresent: boolean;
  root: string;
  actor: EbActor;
}): Promise<GpuEvidenceProbe> {
  const store = await load(input.root);
  void input.actor;
  const verified =
    input.claimRunningVerified &&
    input.heartbeatPresent &&
    input.evidencePresent;
  const probe: GpuEvidenceProbe = {
    id: id('ebgpu'),
    nodeId: input.nodeId.trim(),
    claimRunningVerified: input.claimRunningVerified,
    heartbeatPresent: input.heartbeatPresent,
    evidencePresent: input.evidencePresent,
    status: verified ? 'ok' : 'denied',
    state: verified ? 'RUNNING_VERIFIED' : 'NOT_VERIFIED',
    reason: verified ? 'GPU_RUNNING_VERIFIED' : GPU_EVIDENCE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.gpuProbes.push(probe);
  await save(input.root, store);
  return probe;
}
