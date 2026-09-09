/**
 * 62L-DH Autonomous Research/Workforce Planner —
 * Research campaigns + overnight work planning.
 * Overnight requires authorized powered node; else WAITING_NODE / OFFLINE_STOPPED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DH_LOCKS,
  HONESTY_BANNER,
  MAX_OVERNIGHT_PLANS,
  MAX_RESEARCH_CAMPAIGNS,
  OVERNIGHT_OFFLINE_STOPPED,
  OVERNIGHT_WAITING_NODE,
  type DhActor,
  type OvernightPlanStatus,
} from './adaptive-life-business-intelligence-os-types';

export type ResearchWorkforcePlanner = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type ResearchCampaign = {
  id: string;
  plannerId: string;
  campaignId: string;
  objective: string;
  status: 'PLAN_ONLY' | 'SCHEDULED' | 'DENIED';
  reason: string;
  at: string;
};

export type OvernightPlan = {
  id: string;
  plannerId: string;
  planId: string;
  poweredNodePresent: boolean;
  authorizedNode: boolean;
  status: OvernightPlanStatus;
  reason: string;
  at: string;
};

type Store = {
  planners: ResearchWorkforcePlanner[];
  campaigns: ResearchCampaign[];
  overnightPlans: OvernightPlan[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-research-workforce-planner.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    planners: [],
    campaigns: [],
    overnightPlans: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function autonomousResearchWorkforcePlannerHonesty() {
  return {
    banner: HONESTY_BANNER,
    overnightWithoutPoweredNode: DH_LOCKS.OVERNIGHT_WITHOUT_POWERED_AUTHORIZED_NODE,
    overnightRequiresAuthorizedPoweredNode:
      DH_LOCKS.OVERNIGHT_REQUIRES_AUTHORIZED_POWERED_NODE,
    l4AutonomyEnabled: DH_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export async function bootstrapAutonomousResearchWorkforcePlanner(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DhActor;
}): Promise<ResearchWorkforcePlanner> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.planners.find(
    (p) =>
      p.orgId === input.orgId &&
      p.tenantId === input.tenantId &&
      p.universeId === input.universeId,
  );
  if (existing) return existing;
  const planner: ResearchWorkforcePlanner = {
    id: id('dhrp'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.planners.push(planner);
  await save(input.root, store);
  return planner;
}

export async function planResearchCampaign(input: {
  plannerId: string;
  campaignId: string;
  objective: string;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; campaign?: ResearchCampaign; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const planner = store.planners.find((p) => p.id === input.plannerId);
  if (!planner) return { accepted: false, reason: 'RESEARCH_PLANNER_NOT_FOUND', at: now };
  if (store.campaigns.length >= MAX_RESEARCH_CAMPAIGNS) {
    return { accepted: false, reason: 'MAX_RESEARCH_CAMPAIGNS_BOUNDED', at: now };
  }
  const campaign: ResearchCampaign = {
    id: id('dhcamp'),
    plannerId: planner.id,
    campaignId: (input.campaignId ?? '').trim() || 'unnamed-campaign',
    objective: (input.objective ?? '').trim() || 'research-plan',
    status: 'PLAN_ONLY',
    reason: 'RESEARCH_CAMPAIGN_PLAN_ONLY_NOT_PRODUCTION_AUTHORIZED',
    at: now,
  };
  store.campaigns.push(campaign);
  await save(input.root, store);
  return { accepted: true, reason: campaign.reason, campaign, at: now };
}

export async function scheduleOvernightWorkPlan(input: {
  plannerId: string;
  planId: string;
  poweredNodePresent?: boolean;
  authorizedNode?: boolean;
  stopMode?: 'WAITING_NODE' | 'OFFLINE_STOPPED';
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; plan?: OvernightPlan; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const planner = store.planners.find((p) => p.id === input.plannerId);
  if (!planner) return { accepted: false, reason: 'RESEARCH_PLANNER_NOT_FOUND', at: now };
  if (store.overnightPlans.length >= MAX_OVERNIGHT_PLANS) {
    return { accepted: false, reason: 'MAX_OVERNIGHT_PLANS_BOUNDED', at: now };
  }

  const poweredNodePresent = input.poweredNodePresent === true;
  const authorizedNode = input.authorizedNode === true;

  if (!poweredNodePresent || !authorizedNode) {
    const status: OvernightPlanStatus =
      input.stopMode === 'OFFLINE_STOPPED' ? OVERNIGHT_OFFLINE_STOPPED : OVERNIGHT_WAITING_NODE;
    const plan: OvernightPlan = {
      id: id('dhon'),
      plannerId: planner.id,
      planId: (input.planId ?? '').trim() || 'unnamed-overnight',
      poweredNodePresent,
      authorizedNode,
      status,
      reason:
        status === OVERNIGHT_OFFLINE_STOPPED
          ? OVERNIGHT_OFFLINE_STOPPED
          : OVERNIGHT_WAITING_NODE,
      at: now,
    };
    store.overnightPlans.push(plan);
    await save(input.root, store);
    return { accepted: false, reason: plan.reason, plan, at: now };
  }

  const plan: OvernightPlan = {
    id: id('dhon'),
    plannerId: planner.id,
    planId: (input.planId ?? '').trim() || 'unnamed-overnight',
    poweredNodePresent: true,
    authorizedNode: true,
    status: 'SCHEDULED',
    reason: 'OVERNIGHT_PLAN_SCHEDULED_ON_AUTHORIZED_POWERED_NODE_PLAN_ONLY',
    at: now,
  };
  store.overnightPlans.push(plan);
  await save(input.root, store);
  return { accepted: true, reason: plan.reason, plan, at: now };
}
