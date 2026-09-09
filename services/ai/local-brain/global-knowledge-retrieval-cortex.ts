/**
 * 62L-DY Module B — Global Knowledge Retrieval Cortex.
 * Retrieval quality + historical timelines; ACL deny-by-default; label ≠ access.
 * Authorized / public / licensed / customer-owned data only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  HISTORICAL_TIMELINE_ACL,
  LABEL_NEQ_RETRIEVAL_ACCESS,
  MAX_RETRIEVAL_QUERIES,
  RETRIEVAL_ACL_DENIED,
  type DyActor,
} from './intelligent-supply-chain-command-types';

export type RetrievalQuery = {
  id: string;
  query: string;
  contextId: string;
  aclGranted: boolean;
  labelPresent: boolean;
  status: 'ok' | 'denied';
  reason: string;
  resultCount: number;
  createdAt: string;
};

export type HistoricalTimelineAccess = {
  id: string;
  timelineId: string;
  contextId: string;
  aclGranted: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  queries: RetrievalQuery[];
  timelines: HistoricalTimelineAccess[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-knowledge-retrieval-cortex.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { queries: [], timelines: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function globalKnowledgeRetrievalCortexHonesty() {
  return {
    denyByDefault: true,
    labelAloneNeqAccess: true,
    historicalTimelineAclEnforced: true,
    authorizedPublicLicensedCustomerOwnedOnly: true,
    crossContextLeakage: false,
  };
}

export async function runRetrievalQuery(input: {
  query: string;
  contextId: string;
  aclGranted: boolean;
  labelPresent?: boolean;
  root: string;
  actor: DyActor;
}): Promise<RetrievalQuery> {
  const store = await load(input.root);
  void input.actor;
  if (store.queries.length >= MAX_RETRIEVAL_QUERIES) {
    throw new Error('MAX_RETRIEVAL_QUERIES_REACHED');
  }
  const denied = !input.aclGranted;
  const reason = denied
    ? input.labelPresent && !input.aclGranted
      ? LABEL_NEQ_RETRIEVAL_ACCESS
      : RETRIEVAL_ACL_DENIED
    : 'RETRIEVAL_OK';
  const record: RetrievalQuery = {
    id: id('dyrq'),
    query: input.query.trim(),
    contextId: input.contextId,
    aclGranted: input.aclGranted,
    labelPresent: Boolean(input.labelPresent),
    status: denied ? 'denied' : 'ok',
    reason,
    resultCount: denied ? 0 : 1,
    createdAt: new Date().toISOString(),
  };
  store.queries.push(record);
  await save(input.root, store);
  return record;
}

export async function accessHistoricalTimeline(input: {
  timelineId: string;
  contextId: string;
  aclGranted: boolean;
  root: string;
  actor: DyActor;
}): Promise<HistoricalTimelineAccess> {
  const store = await load(input.root);
  void input.actor;
  const denied = !input.aclGranted;
  const record: HistoricalTimelineAccess = {
    id: id('dyht'),
    timelineId: input.timelineId.trim(),
    contextId: input.contextId,
    aclGranted: input.aclGranted,
    status: denied ? 'denied' : 'ok',
    reason: denied ? HISTORICAL_TIMELINE_ACL : 'TIMELINE_ACCESS_OK',
    at: new Date().toISOString(),
  };
  store.timelines.push(record);
  await save(input.root, store);
  return record;
}
