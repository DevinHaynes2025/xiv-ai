/**
 * 62L-CY Multi-Model Intelligence Compiler —
 * Compiles multi-model evidence packs.
 * Consensus among models is NEVER treated as verified proof.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONSENSUS_NOT_VERIFIED_PROOF,
  CY_LOCKS,
  HONESTY_BANNER,
  MAX_COMPILER_ARTIFACTS,
  type CyActor,
} from './knowledge-colony-operating-system-types';

export type IntelligenceCompileArtifact = {
  id: string;
  topic: string;
  modelVotes: string[];
  consensusReached: boolean;
  labeledVerifiedProof: false;
  status: 'CONSENSUS_ONLY' | 'EVIDENCE_COMPILED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type CompilerResult = {
  accepted: boolean;
  reason: string;
  artifact?: IntelligenceCompileArtifact;
  at: string;
};

type Store = { artifacts: IntelligenceCompileArtifact[] };

function storePath(root: string) {
  return xivLocalPath(root, 'multi-model-intelligence-compiler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { artifacts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function multiModelIntelligenceCompilerHonesty() {
  return {
    banner: HONESTY_BANNER,
    consensusEqVerifiedProof: CY_LOCKS.CONSENSUS_EQ_VERIFIED_PROOF,
    evidenceFirst: CY_LOCKS.EVIDENCE_FIRST,
  };
}

export async function compileMultiModelEvidence(input: {
  topic: string;
  modelVotes: string[];
  claimConsensusIsProof?: boolean;
  root: string;
  actor: CyActor;
}): Promise<CompilerResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.artifacts.length >= MAX_COMPILER_ARTIFACTS) {
    return {
      accepted: false,
      reason: 'MAX_COMPILER_ARTIFACTS_BOUNDED',
      at: now,
    };
  }

  const votes = (input.modelVotes ?? []).map((v) => v.trim()).filter(Boolean);
  const consensusReached = votes.length >= 2 && new Set(votes).size === 1;

  if (input.claimConsensusIsProof === true && consensusReached) {
    const artifact: IntelligenceCompileArtifact = {
      id: id('mmic'),
      topic: input.topic.trim() || 'untitled',
      modelVotes: votes,
      consensusReached: true,
      labeledVerifiedProof: false,
      status: 'DENIED',
      reason: CONSENSUS_NOT_VERIFIED_PROOF,
      createdAt: now,
    };
    store.artifacts.push(artifact);
    await save(input.root, store);
    return {
      accepted: false,
      reason: CONSENSUS_NOT_VERIFIED_PROOF,
      artifact,
      at: now,
    };
  }

  const artifact: IntelligenceCompileArtifact = {
    id: id('mmic'),
    topic: input.topic.trim() || 'untitled',
    modelVotes: votes,
    consensusReached,
    labeledVerifiedProof: false,
    status: consensusReached ? 'CONSENSUS_ONLY' : 'EVIDENCE_COMPILED',
    reason: consensusReached
      ? CONSENSUS_NOT_VERIFIED_PROOF
      : 'MULTI_MODEL_EVIDENCE_COMPILED_WITHOUT_PROOF_CLAIM',
    createdAt: now,
  };
  store.artifacts.push(artifact);
  await save(input.root, store);
  return {
    accepted: true,
    reason: artifact.reason,
    artifact,
    at: now,
  };
}
