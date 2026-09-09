/**
 * 62L-BU Superbrain Engineering Strategy Cortex — turns measured results into
 * engineering priorities/recommendations. Not auto-deploy / not production mandate.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BU_LOCKS,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  STRATEGY_RECOMMENDATION_ONLY,
  containsForbiddenPrivateFields,
  type BuActor,
  type StrategyPriority,
} from './code-research-benchmark-strategy-types';

export type StrategyCortexOutput = {
  id: string;
  title: string;
  priorities: StrategyPriority[];
  evidenceRefs: string[];
  recommendationOnly: true;
  productionMandate: false;
  autoDeploy: false;
  deployAttempted: false;
  deployAuthorized: false;
  createdAt: string;
  actorId: string;
  reason: typeof STRATEGY_RECOMMENDATION_ONLY;
};

type Store = {
  outputs: StrategyCortexOutput[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'superbrain-engineering-strategy-cortex.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { outputs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Produce strategy recommendations from measured/evidence refs.
 * Explicitly not a deploy mandate.
 */
export async function produceEngineeringStrategy(input: {
  title: string;
  priorities: Array<{
    title: string;
    rationale: string;
    evidenceRefs?: string[];
    priority?: number;
  }>;
  evidenceRefs?: string[];
  /** Attempt to treat as auto-deploy — refused. */
  requestAutoDeploy?: boolean;
  payload?: Record<string, unknown>;
  actor: BuActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (containsForbiddenPrivateFields(input.payload)) {
    return {
      accepted: false as const,
      reason: HIDDEN_REASONING_TRACE_REJECTED,
      autoDeploy: false as const,
    };
  }

  if (input.requestAutoDeploy) {
    return {
      accepted: false as const,
      reason: STRATEGY_RECOMMENDATION_ONLY,
      recommendationOnly: true as const,
      productionMandate: false as const,
      autoDeploy: false as const,
      deployAuthorized: false as const,
      locks: {
        strategyIsAutoDeploy: BU_LOCKS.STRATEGY_IS_AUTO_DEPLOY,
        measuredResultIsProductionMandate: BU_LOCKS.MEASURED_RESULT_IS_PRODUCTION_MANDATE,
      },
    };
  }

  const priorities: StrategyPriority[] = input.priorities.map((p, i) => ({
    id: id('prio'),
    title: p.title,
    rationale: p.rationale,
    evidenceRefs: p.evidenceRefs ?? input.evidenceRefs ?? [],
    recommendationOnly: true as const,
    productionMandate: false as const,
    autoDeploy: false as const,
    priority: p.priority ?? i + 1,
  }));

  const output: StrategyCortexOutput = {
    id: id('strat'),
    title: input.title,
    priorities,
    evidenceRefs: input.evidenceRefs ?? [],
    recommendationOnly: true,
    productionMandate: false,
    autoDeploy: false,
    deployAttempted: false,
    deployAuthorized: false,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: STRATEGY_RECOMMENDATION_ONLY,
  };

  const store = await load(root);
  store.outputs.push(output);
  await save(root, store);

  return {
    accepted: true as const,
    output,
    recommendationOnly: true as const,
    productionMandate: false as const,
    autoDeploy: false as const,
    reason: STRATEGY_RECOMMENDATION_ONLY,
  };
}

/**
 * Explicit deploy attempt from strategy output — always DENIED.
 */
export async function attemptStrategyAutoDeploy(input: {
  strategyOutputId: string;
  actor: BuActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const output = store.outputs.find((o) => o.id === input.strategyOutputId);

  return {
    accepted: false as const,
    deployAuthorized: false as const,
    autoDeploy: false as const,
    productionMandate: false as const,
    recommendationOnly: true as const,
    outputFound: !!output,
    reason: STRATEGY_RECOMMENDATION_ONLY,
    locks: {
      strategyIsAutoDeploy: BU_LOCKS.STRATEGY_IS_AUTO_DEPLOY,
      autoProductionDeploy: BU_LOCKS.AUTO_PRODUCTION_DEPLOY,
    },
  };
}

export async function listStrategyOutputs(root = process.cwd()) {
  return (await load(root)).outputs;
}

export function strategyCortexHonesty() {
  return {
    banner: HONESTY_BANNER,
    strategyRecommendationOnly: BU_LOCKS.STRATEGY_RECOMMENDATION_ONLY,
    strategyIsAutoDeploy: BU_LOCKS.STRATEGY_IS_AUTO_DEPLOY,
    measuredResultIsProductionMandate: BU_LOCKS.MEASURED_RESULT_IS_PRODUCTION_MANDATE,
    productionAuthorization: BU_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
