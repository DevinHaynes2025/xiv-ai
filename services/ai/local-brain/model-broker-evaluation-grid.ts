/**
 * 62L-DC Model Broker & Evaluation Grid —
 * Local-first model brokering with continuous evaluation.
 * Unconfigured providers → UNAVAILABLE.
 * Broker consensus-only ≠ verified proof.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BROKER_CONSENSUS_NOT_VERIFIED_PROOF,
  DC_LOCKS,
  HONESTY_BANNER,
  MAX_BROKER_EVALS,
  MAX_MODEL_PROVIDERS,
  UNCONFIGURED_MODEL_PROVIDER_UNAVAILABLE,
  type DcActor,
} from './superbrain-service-fabric-types';

export type ModelProvider = {
  id: string;
  name: string;
  localPreferred: boolean;
  configured: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

export type BrokerEvaluation = {
  id: string;
  topic: string;
  providerIds: string[];
  votes: string[];
  consensusReached: boolean;
  labeledVerifiedProof: false;
  status: 'CONSENSUS_ONLY' | 'EVALUATED' | 'DENIED' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

export type BrokerResult = {
  accepted: boolean;
  reason: string;
  provider?: ModelProvider;
  evaluation?: BrokerEvaluation;
  at: string;
};

type Store = {
  providers: ModelProvider[];
  evaluations: BrokerEvaluation[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'model-broker-evaluation-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { providers: [], evaluations: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function modelBrokerEvaluationHonesty() {
  return {
    banner: HONESTY_BANNER,
    localFirst: DC_LOCKS.LOCAL_FIRST,
    unconfiguredAvailable: DC_LOCKS.UNCONFIGURED_MODEL_PROVIDER_AVAILABLE,
    consensusEqVerifiedProof: DC_LOCKS.CONSENSUS_EQ_VERIFIED_PROOF,
  };
}

export async function registerModelProvider(input: {
  name: string;
  configured?: boolean;
  localPreferred?: boolean;
  root: string;
  actor: DcActor;
}): Promise<ModelProvider> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.providers.length >= MAX_MODEL_PROVIDERS) {
    return {
      id: id('mbeg'),
      name: input.name,
      localPreferred: true,
      configured: false,
      status: 'UNAVAILABLE',
      reason: 'MAX_MODEL_PROVIDERS_BOUNDED',
      createdAt: now,
    };
  }
  const configured = input.configured === true;
  const provider: ModelProvider = {
    id: id('mbeg'),
    name: input.name.trim() || 'unnamed-provider',
    localPreferred: input.localPreferred !== false,
    configured,
    status: configured ? 'AVAILABLE' : 'UNAVAILABLE',
    reason: configured
      ? 'MODEL_PROVIDER_CONFIGURED_LOCAL_PREFERRED'
      : UNCONFIGURED_MODEL_PROVIDER_UNAVAILABLE,
    createdAt: now,
  };
  store.providers.push(provider);
  await save(input.root, store);
  return provider;
}

export async function brokerModelRoute(input: {
  providerId: string;
  root: string;
  actor: DcActor;
}): Promise<BrokerResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const provider = store.providers.find((p) => p.id === input.providerId);
  if (!provider || provider.status !== 'AVAILABLE' || !provider.configured) {
    return {
      accepted: false,
      reason: UNCONFIGURED_MODEL_PROVIDER_UNAVAILABLE,
      provider,
      at: now,
    };
  }
  return {
    accepted: true,
    reason: 'LOCAL_FIRST_MODEL_ROUTE_AVAILABLE',
    provider,
    at: now,
  };
}

export async function evaluateBrokerConsensus(input: {
  topic: string;
  providerIds: string[];
  votes: string[];
  claimConsensusIsProof?: boolean;
  root: string;
  actor: DcActor;
}): Promise<BrokerResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.evaluations.length >= MAX_BROKER_EVALS) {
    return { accepted: false, reason: 'MAX_BROKER_EVALS_BOUNDED', at: now };
  }

  const votes = (input.votes ?? []).map((v) => v.trim()).filter(Boolean);
  const consensusReached = votes.length >= 2 && new Set(votes).size === 1;

  if (input.claimConsensusIsProof === true && consensusReached) {
    const evaluation: BrokerEvaluation = {
      id: id('eval'),
      topic: input.topic.trim() || 'untitled',
      providerIds: input.providerIds,
      votes,
      consensusReached: true,
      labeledVerifiedProof: false,
      status: 'DENIED',
      reason: BROKER_CONSENSUS_NOT_VERIFIED_PROOF,
      createdAt: now,
    };
    store.evaluations.push(evaluation);
    await save(input.root, store);
    return {
      accepted: false,
      reason: BROKER_CONSENSUS_NOT_VERIFIED_PROOF,
      evaluation,
      at: now,
    };
  }

  const evaluation: BrokerEvaluation = {
    id: id('eval'),
    topic: input.topic.trim() || 'untitled',
    providerIds: input.providerIds,
    votes,
    consensusReached,
    labeledVerifiedProof: false,
    status: consensusReached ? 'CONSENSUS_ONLY' : 'EVALUATED',
    reason: consensusReached
      ? BROKER_CONSENSUS_NOT_VERIFIED_PROOF
      : 'BROKER_CONTINUOUS_EVALUATION_WITHOUT_PROOF_CLAIM',
    createdAt: now,
  };
  store.evaluations.push(evaluation);
  await save(input.root, store);
  return {
    accepted: true,
    reason: evaluation.reason,
    evaluation,
    at: now,
  };
}
