/**
 * 62L-DJ Decision/Scenario Control Tower —
 * Scenario control tower surfaces.
 * Recommendation ≠ charge / deploy / publish.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONTROL_TOWER_ACTION_DENIED,
  DJ_LOCKS,
  HONESTY_BANNER,
  MAX_SCENARIOS,
  type DjActor,
} from './personal-intelligence-command-os-types';

export type DecisionScenarioControlTower = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type ScenarioRecommendation = {
  id: string;
  towerId: string;
  scenarioId: string;
  recommendation: string;
  label: 'RECOMMENDATION_ONLY' | 'LABELED_SCENARIO';
  attemptedCharge: boolean;
  attemptedDeploy: boolean;
  attemptedPublish: boolean;
  status: 'RECORDED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  towers: DecisionScenarioControlTower[];
  recommendations: ScenarioRecommendation[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'decision-scenario-control-tower.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { towers: [], recommendations: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function decisionScenarioControlTowerHonesty() {
  return {
    banner: HONESTY_BANNER,
    recommendationCharges: DJ_LOCKS.CONTROL_TOWER_RECOMMENDATION_CHARGES,
    recommendationDeploys: DJ_LOCKS.CONTROL_TOWER_RECOMMENDATION_DEPLOYS,
    recommendationPublishes: DJ_LOCKS.CONTROL_TOWER_RECOMMENDATION_PUBLISHES,
    recommendationOnly: DJ_LOCKS.CONTROL_TOWER_RECOMMENDATION_ONLY,
    productionAuthorization: DJ_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function bootstrapDecisionScenarioControlTower(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DjActor;
}): Promise<DecisionScenarioControlTower> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.towers.find(
    (t) =>
      t.orgId === input.orgId &&
      t.tenantId === input.tenantId &&
      t.universeId === input.universeId,
  );
  if (existing) return existing;
  const tower: DecisionScenarioControlTower = {
    id: id('djtower'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.towers.push(tower);
  await save(input.root, store);
  return tower;
}

export async function submitScenarioRecommendation(input: {
  towerId: string;
  scenarioId: string;
  recommendation: string;
  charge?: boolean;
  deploy?: boolean;
  publish?: boolean;
  root: string;
  actor: DjActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  recommendation?: ScenarioRecommendation;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const tower = store.towers.find((t) => t.id === input.towerId);
  if (!tower) return { accepted: false, reason: 'CONTROL_TOWER_NOT_FOUND', at: now };
  if (store.recommendations.length >= MAX_SCENARIOS) {
    return { accepted: false, reason: 'MAX_SCENARIOS_BOUNDED', at: now };
  }

  if (input.charge === true || input.deploy === true || input.publish === true) {
    const rec: ScenarioRecommendation = {
      id: id('djrec'),
      towerId: tower.id,
      scenarioId: input.scenarioId,
      recommendation: input.recommendation.trim() || 'empty',
      label: 'RECOMMENDATION_ONLY',
      attemptedCharge: input.charge === true,
      attemptedDeploy: input.deploy === true,
      attemptedPublish: input.publish === true,
      status: 'DENIED',
      reason: CONTROL_TOWER_ACTION_DENIED,
      at: now,
    };
    store.recommendations.push(rec);
    await save(input.root, store);
    return { accepted: false, reason: CONTROL_TOWER_ACTION_DENIED, recommendation: rec, at: now };
  }

  const rec: ScenarioRecommendation = {
    id: id('djrec'),
    towerId: tower.id,
    scenarioId: input.scenarioId,
    recommendation: input.recommendation.trim() || 'empty',
    label: 'RECOMMENDATION_ONLY',
    attemptedCharge: false,
    attemptedDeploy: false,
    attemptedPublish: false,
    status: 'RECORDED',
    reason: 'CONTROL_TOWER_RECOMMENDATION_RECORDED_NO_SIDE_EFFECTS',
    at: now,
  };
  store.recommendations.push(rec);
  await save(input.root, store);
  return { accepted: true, reason: rec.reason, recommendation: rec, at: now };
}
