/**
 * 62L-CV Scientific Knowledge Expansion Engine —
 * Lawful scientific/technical knowledge-expansion with provenance.
 * Unauthorized sources DENIED. Hypothesis ≠ verified. No unsupported claims.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CV_LOCKS,
  HONESTY_BANNER,
  HYPOTHESIS_NOT_VERIFIED,
  UNAUTHORIZED_KNOWLEDGE_DENIED,
  type CvActor,
  type KnowledgeSourceAuthorization,
} from './distributed-intelligence-laboratory-os-types';

export type KnowledgeClaimKind = 'fact_candidate' | 'hypothesis' | 'correlation' | 'unsupported';

export type KnowledgeExpansionRecord = {
  id: string;
  sourceId: string;
  sourceAuthorization: KnowledgeSourceAuthorization;
  claimKind: KnowledgeClaimKind;
  claimText: string;
  provenance: string;
  verified: boolean;
  status: 'ACCEPTED_CANDIDATE' | 'HYPOTHESIS' | 'DENIED' | 'REJECTED';
  reason: string;
  createdAt: string;
};

export type KnowledgeResult = {
  accepted: boolean;
  reason: string;
  record?: KnowledgeExpansionRecord;
  at: string;
};

type Store = { records: KnowledgeExpansionRecord[] };

function storePath(root: string) {
  return xivLocalPath(root, 'scientific-knowledge-expansion-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { records: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function knowledgeExpansionHonesty() {
  return {
    banner: HONESTY_BANNER,
    unauthorizedAllowed: CV_LOCKS.UNAUTHORIZED_KNOWLEDGE_SOURCE_ALLOWED,
    hypothesisEqVerified: CV_LOCKS.HYPOTHESIS_EQ_VERIFIED,
  };
}

export async function expandKnowledgeFromSource(input: {
  sourceId: string;
  sourceAuthorization: KnowledgeSourceAuthorization;
  claimKind: KnowledgeClaimKind;
  claimText: string;
  provenance?: string;
  root: string;
  actor: CvActor;
}): Promise<KnowledgeResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const provenance = input.provenance?.trim() || '';

  if (
    input.sourceAuthorization === 'unauthorized' ||
    input.sourceAuthorization === 'unknown'
  ) {
    const denied: KnowledgeExpansionRecord = {
      id: id('skee'),
      sourceId: input.sourceId,
      sourceAuthorization: input.sourceAuthorization,
      claimKind: input.claimKind,
      claimText: input.claimText,
      provenance,
      verified: false,
      status: 'DENIED',
      reason: UNAUTHORIZED_KNOWLEDGE_DENIED,
      createdAt: now,
    };
    store.records.push(denied);
    await save(input.root, store);
    return { accepted: false, reason: UNAUTHORIZED_KNOWLEDGE_DENIED, record: denied, at: now };
  }

  if (input.claimKind === 'unsupported') {
    const rejected: KnowledgeExpansionRecord = {
      id: id('skee'),
      sourceId: input.sourceId,
      sourceAuthorization: input.sourceAuthorization,
      claimKind: 'unsupported',
      claimText: input.claimText,
      provenance,
      verified: false,
      status: 'REJECTED',
      reason: 'UNSUPPORTED_CLAIM_REJECTED',
      createdAt: now,
    };
    store.records.push(rejected);
    await save(input.root, store);
    return { accepted: false, reason: rejected.reason, record: rejected, at: now };
  }

  if (input.claimKind === 'hypothesis') {
    const hyp: KnowledgeExpansionRecord = {
      id: id('skee'),
      sourceId: input.sourceId,
      sourceAuthorization: input.sourceAuthorization,
      claimKind: 'hypothesis',
      claimText: input.claimText,
      provenance,
      verified: false,
      status: 'HYPOTHESIS',
      reason: HYPOTHESIS_NOT_VERIFIED,
      createdAt: now,
    };
    store.records.push(hyp);
    await save(input.root, store);
    return { accepted: true, reason: HYPOTHESIS_NOT_VERIFIED, record: hyp, at: now };
  }

  const candidate: KnowledgeExpansionRecord = {
    id: id('skee'),
    sourceId: input.sourceId,
    sourceAuthorization: input.sourceAuthorization,
    claimKind: input.claimKind,
    claimText: input.claimText,
    provenance,
    verified: false, // never auto-verified without separate evidence path
    status: 'ACCEPTED_CANDIDATE',
    reason: 'AUTHORIZED_SOURCE_CANDIDATE_NOT_AUTO_VERIFIED',
    createdAt: now,
  };
  store.records.push(candidate);
  await save(input.root, store);
  return { accepted: true, reason: candidate.reason, record: candidate, at: now };
}
