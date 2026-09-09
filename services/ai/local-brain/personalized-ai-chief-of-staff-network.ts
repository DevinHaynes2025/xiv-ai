/**
 * 62L-DH Personalized AI Chief-of-Staff Network —
 * Bounded recommendations / coordination only.
 * Cannot approve spend, deploy, or publish alone.
 * Digital Twin ≠ founder; recommendation ≠ charge/deploy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CHIEF_OF_STAFF_SPEND_DEPLOY_PUBLISH_DENIED,
  DH_LOCKS,
  HONESTY_BANNER,
  MAX_COS_RECOMMENDATIONS,
  type CosActionKind,
  type DhActor,
} from './adaptive-life-business-intelligence-os-types';

export type ChiefOfStaffNetwork = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type CosRecommendation = {
  id: string;
  networkId: string;
  action: CosActionKind;
  summary: string;
  status: 'RECOMMENDATION_ONLY' | 'DENIED' | 'COORDINATION_ONLY';
  reason: string;
  digitalTwinIsFounder: false;
  recommendationIsChargeOrDeploy: false;
  at: string;
};

type Store = { networks: ChiefOfStaffNetwork[]; recommendations: CosRecommendation[] };

function storePath(root: string) {
  return xivLocalPath(root, 'personalized-ai-chief-of-staff-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { networks: [], recommendations: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const FORBIDDEN_ALONE: CosActionKind[] = [
  'approve_spend',
  'approve_deploy',
  'approve_publish',
  'charge',
  'impersonate_founder',
];

export function personalizedAiChiefOfStaffHonesty() {
  return {
    banner: HONESTY_BANNER,
    canApproveSpend: DH_LOCKS.CHIEF_OF_STAFF_CAN_APPROVE_SPEND,
    canApproveDeploy: DH_LOCKS.CHIEF_OF_STAFF_CAN_APPROVE_DEPLOY,
    canApprovePublish: DH_LOCKS.CHIEF_OF_STAFF_CAN_APPROVE_PUBLISH,
    recommendationOnly: DH_LOCKS.CHIEF_OF_STAFF_RECOMMENDATION_ONLY,
    digitalTwinEqFounder: DH_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    recommendationEqChargeOrDeploy: DH_LOCKS.RECOMMENDATION_EQ_CHARGE_OR_DEPLOY,
  };
}

export async function bootstrapPersonalizedAiChiefOfStaffNetwork(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DhActor;
}): Promise<ChiefOfStaffNetwork> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.networks.find(
    (n) =>
      n.orgId === input.orgId &&
      n.tenantId === input.tenantId &&
      n.universeId === input.universeId,
  );
  if (existing) return existing;
  const network: ChiefOfStaffNetwork = {
    id: id('dhcos'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.networks.push(network);
  await save(input.root, store);
  return network;
}

export async function submitChiefOfStaffAction(input: {
  networkId: string;
  action: CosActionKind;
  summary: string;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; recommendation?: CosRecommendation; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const network = store.networks.find((n) => n.id === input.networkId);
  if (!network) return { accepted: false, reason: 'CHIEF_OF_STAFF_NETWORK_NOT_FOUND', at: now };
  if (store.recommendations.length >= MAX_COS_RECOMMENDATIONS) {
    return { accepted: false, reason: 'MAX_COS_RECOMMENDATIONS_BOUNDED', at: now };
  }

  if (FORBIDDEN_ALONE.includes(input.action)) {
    const recommendation: CosRecommendation = {
      id: id('dhcr'),
      networkId: network.id,
      action: input.action,
      summary: (input.summary ?? '').trim() || 'forbidden-alone-action',
      status: 'DENIED',
      reason: CHIEF_OF_STAFF_SPEND_DEPLOY_PUBLISH_DENIED,
      digitalTwinIsFounder: false,
      recommendationIsChargeOrDeploy: false,
      at: now,
    };
    store.recommendations.push(recommendation);
    await save(input.root, store);
    return { accepted: false, reason: recommendation.reason, recommendation, at: now };
  }

  const recommendation: CosRecommendation = {
    id: id('dhcr'),
    networkId: network.id,
    action: input.action,
    summary: (input.summary ?? '').trim() || 'bounded-recommendation',
    status: input.action === 'coordinate' ? 'COORDINATION_ONLY' : 'RECOMMENDATION_ONLY',
    reason: 'CHIEF_OF_STAFF_BOUNDED_RECOMMENDATION_OR_COORDINATION',
    digitalTwinIsFounder: false,
    recommendationIsChargeOrDeploy: false,
    at: now,
  };
  store.recommendations.push(recommendation);
  await save(input.root, store);
  return { accepted: true, reason: recommendation.reason, recommendation, at: now };
}
