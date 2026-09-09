/**
 * 62L-DD Model Evaluation & Routing Brain —
 * Continuous local/cloud model evaluation and routing.
 * Local-first; consensus ≠ proof; unconfigured → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONSENSUS_NOT_VERIFIED_PROOF,
  DD_LOCKS,
  HONESTY_BANNER,
  MAX_EVAL_ARTIFACTS,
  MAX_MODEL_TARGETS,
  UNCONFIGURED_MODEL_UNAVAILABLE,
  type DdActor,
} from './cognitive-service-mesh-types';

export type ModelTargetKind = 'local' | 'cloud';

export type ModelTarget = {
  id: string;
  kind: ModelTargetKind;
  name: string;
  configured: boolean;
  authorized: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

export type EvaluationArtifact = {
  id: string;
  topic: string;
  modelVotes: string[];
  consensusReached: boolean;
  labeledVerifiedProof: false;
  preferredLocal: true;
  status: 'CONSENSUS_ONLY' | 'EVIDENCE_COMPILED' | 'DENIED' | 'UNAVAILABLE';
  reason: string;
  createdAt: string;
};

type Store = { targets: ModelTarget[]; artifacts: EvaluationArtifact[] };

function storePath(root: string) {
  return xivLocalPath(root, 'model-evaluation-routing-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { targets: [], artifacts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function modelEvaluationRoutingHonesty() {
  return {
    banner: HONESTY_BANNER,
    localFirst: DD_LOCKS.LOCAL_FIRST,
    consensusEqVerifiedProof: DD_LOCKS.CONSENSUS_EQ_VERIFIED_PROOF,
    unconfiguredModelAvailable: DD_LOCKS.UNCONFIGURED_MODEL_AVAILABLE,
    unconfiguredCloudAvailable: DD_LOCKS.UNCONFIGURED_CLOUD_AVAILABLE,
  };
}

export async function registerModelTarget(input: {
  kind: ModelTargetKind;
  name: string;
  configured?: boolean;
  authorized?: boolean;
  root: string;
  actor: DdActor;
}): Promise<ModelTarget> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.targets.length >= MAX_MODEL_TARGETS) {
    return {
      id: id('merb'),
      kind: input.kind,
      name: input.name,
      configured: false,
      authorized: false,
      status: 'UNAVAILABLE',
      reason: 'MAX_MODEL_TARGETS_BOUNDED',
      createdAt: now,
    };
  }
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const ok = configured && authorized;
  const target: ModelTarget = {
    id: id('merb'),
    kind: input.kind,
    name: input.name.trim() || 'unnamed-model',
    configured,
    authorized,
    status: ok ? 'AVAILABLE' : 'UNAVAILABLE',
    reason: ok ? 'MODEL_TARGET_AVAILABLE' : UNCONFIGURED_MODEL_UNAVAILABLE,
    createdAt: now,
  };
  store.targets.push(target);
  await save(input.root, store);
  return target;
}

export async function routeModelEvaluation(input: {
  preferredKind?: ModelTargetKind;
  root: string;
  actor: DdActor;
}): Promise<{ status: 'AVAILABLE' | 'UNAVAILABLE'; reason: string; target?: ModelTarget }> {
  void input.actor;
  const store = await load(input.root);
  const preferred = input.preferredKind ?? 'local';
  const local = store.targets.find(
    (t) => t.kind === 'local' && t.status === 'AVAILABLE',
  );
  if (DD_LOCKS.LOCAL_FIRST && local) {
    return { status: 'AVAILABLE', reason: 'LOCAL_PREFERRED_ROUTE', target: local };
  }
  const match = store.targets.find(
    (t) => t.kind === preferred && t.status === 'AVAILABLE',
  );
  if (match) {
    return { status: 'AVAILABLE', reason: 'MODEL_ROUTE_AVAILABLE', target: match };
  }
  return { status: 'UNAVAILABLE', reason: UNCONFIGURED_MODEL_UNAVAILABLE };
}

export async function evaluateModelConsensus(input: {
  topic: string;
  modelVotes: string[];
  claimConsensusIsProof?: boolean;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; artifact?: EvaluationArtifact; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.artifacts.length >= MAX_EVAL_ARTIFACTS) {
    return { accepted: false, reason: 'MAX_EVAL_ARTIFACTS_BOUNDED', at: now };
  }

  const votes = (input.modelVotes ?? []).map((v) => v.trim()).filter(Boolean);
  const consensusReached = votes.length >= 2 && new Set(votes).size === 1;

  if (input.claimConsensusIsProof === true || DD_LOCKS.CONSENSUS_EQ_VERIFIED_PROOF) {
    const artifact: EvaluationArtifact = {
      id: id('meva'),
      topic: input.topic.trim() || 'untitled',
      modelVotes: votes,
      consensusReached,
      labeledVerifiedProof: false,
      preferredLocal: true,
      status: 'DENIED',
      reason: CONSENSUS_NOT_VERIFIED_PROOF,
      createdAt: now,
    };
    store.artifacts.push(artifact);
    await save(input.root, store);
    return { accepted: false, reason: artifact.reason, artifact, at: now };
  }

  const artifact: EvaluationArtifact = {
    id: id('meva'),
    topic: input.topic.trim() || 'untitled',
    modelVotes: votes,
    consensusReached,
    labeledVerifiedProof: false,
    preferredLocal: true,
    status: consensusReached ? 'CONSENSUS_ONLY' : 'EVIDENCE_COMPILED',
    reason: consensusReached
      ? CONSENSUS_NOT_VERIFIED_PROOF
      : 'MODEL_EVALUATION_EVIDENCE_COMPILED_NOT_PROOF',
    createdAt: now,
  };
  store.artifacts.push(artifact);
  await save(input.root, store);
  return { accepted: true, reason: artifact.reason, artifact, at: now };
}
