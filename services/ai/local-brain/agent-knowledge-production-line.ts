/**
 * 62L-EE Module F — Agent Knowledge Production Line.
 * Knowledge production + peer review.
 * ≠ auto-permission grant / ≠ auto-prod publish.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  KNOWLEDGE_NEQ_AUTO_PUBLISH,
  MAX_KNOWLEDGE_ITEMS,
  PEER_REVIEW_NEQ_GRANT,
  PEER_REVIEW_REQUIRED,
  type EeActor,
  type EeEvidenceState,
} from './data-nervous-system-types';

export type KnowledgeCandidate = {
  id: string;
  title: string;
  peerReviewed: boolean;
  status: 'candidate' | 'denied';
  state: EeEvidenceState;
  reason: string;
  published: false;
  permissionGranted: false;
  at: string;
};

export type PeerReviewEvent = {
  id: string;
  knowledgeId: string;
  autoGrantPermissionRequested: boolean;
  autoPublishRequested: boolean;
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  permissionGranted: false;
  published: false;
  at: string;
};

type Store = {
  candidates: KnowledgeCandidate[];
  reviews: PeerReviewEvent[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-knowledge-production-line.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    candidates: [],
    reviews: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentKnowledgeProductionLineHonesty() {
  return {
    peerReviewRequired: true,
    peerReviewNeqAutoPermissionGrant: true,
    knowledgeNeqAutoProdPublish: true,
    published: false,
    permissionGranted: false,
  };
}

export async function produceKnowledgeCandidate(input: {
  title: string;
  peerReviewed?: boolean;
  root: string;
  actor: EeActor;
}): Promise<KnowledgeCandidate> {
  const store = await load(input.root);
  void input.actor;
  if (store.candidates.length >= MAX_KNOWLEDGE_ITEMS) {
    throw new Error('MAX_KNOWLEDGE_ITEMS_REACHED');
  }
  const reviewed = Boolean(input.peerReviewed);
  const candidate: KnowledgeCandidate = {
    id: id('eeknow'),
    title: input.title.trim(),
    peerReviewed: reviewed,
    status: reviewed ? 'candidate' : 'denied',
    state: reviewed ? 'CANDIDATE' : 'DENIED',
    reason: PEER_REVIEW_REQUIRED,
    published: false,
    permissionGranted: false,
    at: new Date().toISOString(),
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return candidate;
}

export async function peerReviewKnowledge(input: {
  knowledgeId: string;
  autoGrantPermissionRequested?: boolean;
  autoPublishRequested?: boolean;
  root: string;
  actor: EeActor;
}): Promise<PeerReviewEvent> {
  const store = await load(input.root);
  void input.actor;
  if (store.reviews.length >= MAX_KNOWLEDGE_ITEMS) {
    throw new Error('MAX_KNOWLEDGE_ITEMS_REACHED');
  }
  const grant = Boolean(input.autoGrantPermissionRequested);
  const publish = Boolean(input.autoPublishRequested);
  let status: PeerReviewEvent['status'] = 'ok';
  let state: EeEvidenceState = 'BOUNDED';
  let reason = PEER_REVIEW_REQUIRED;
  if (grant) {
    status = 'denied';
    state = 'DENIED';
    reason = PEER_REVIEW_NEQ_GRANT;
  } else if (publish) {
    status = 'denied';
    state = 'DENIED';
    reason = KNOWLEDGE_NEQ_AUTO_PUBLISH;
  }
  const review: PeerReviewEvent = {
    id: id('eerev'),
    knowledgeId: input.knowledgeId.trim(),
    autoGrantPermissionRequested: grant,
    autoPublishRequested: publish,
    status,
    state,
    reason,
    permissionGranted: false,
    published: false,
    at: new Date().toISOString(),
  };
  store.reviews.push(review);
  await save(input.root, store);
  return review;
}
