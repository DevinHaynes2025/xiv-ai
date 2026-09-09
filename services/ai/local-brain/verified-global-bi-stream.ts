/**
 * 62L-BY Verified Global Business Intelligence Stream — provenance-aware
 * verified BI streams (not raw private pooling by default).
 * Unverified → DENIED / not labeled VERIFIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BY_LOCKS,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  UNVERIFIED_BI_DENIED,
  containsForbiddenPrivateFields,
  type ByActor,
  type ConfidenceLabel,
} from './hardware-cortex-synapse-compiler-types';

export type BiStreamItem = {
  id: string;
  streamId: string;
  title: string;
  summary: string;
  provenanceRefs: string[];
  confidence: ConfidenceLabel;
  labeledVerified: boolean;
  rawPrivatePooling: false;
  status: 'verified' | 'denied' | 'unavailable' | 'documented';
  createdAt: string;
  actorId: string;
  reason: string;
};

type Store = { items: BiStreamItem[] };

function storePath(root: string) {
  return xivLocalPath(root, 'verified-global-bi-stream.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { items: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function biStreamHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4: BY_LOCKS.L4_AUTONOMY_ENABLED,
    unverifiedLabeledVerified: BY_LOCKS.UNVERIFIED_BI_LABELED_VERIFIED,
    rawPrivatePoolingDefault: BY_LOCKS.RAW_PRIVATE_BI_POOLING_DEFAULT,
    verifiedProvenanceRequired: BY_LOCKS.BI_VERIFIED_PROVENANCE_REQUIRED,
  };
}

/**
 * Ingest a BI stream item. Unverified / no provenance → DENIED or not VERIFIED.
 * Raw private pooling is denied by default.
 */
export async function ingestBiStreamItem(input: {
  streamId: string;
  title: string;
  summary: string;
  provenanceRefs?: string[];
  evidenceBacked?: boolean;
  forceVerified?: boolean;
  rawPrivatePooling?: boolean;
  payload?: Record<string, unknown>;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (containsForbiddenPrivateFields(input.payload)) {
    return {
      accepted: false as const,
      status: 'denied' as const,
      labeledVerified: false,
      reason: HIDDEN_REASONING_TRACE_REJECTED,
      item: null,
    };
  }

  if (input.rawPrivatePooling) {
    return {
      accepted: false as const,
      status: 'denied' as const,
      labeledVerified: false,
      reason: UNVERIFIED_BI_DENIED,
      item: null,
    };
  }

  const provenance = input.provenanceRefs ?? [];
  const evidenceBacked = Boolean(input.evidenceBacked && provenance.length > 0);

  if ((input.forceVerified && !evidenceBacked) || !evidenceBacked) {
    const item: BiStreamItem = {
      id: id('bi'),
      streamId: input.streamId,
      title: input.title.trim(),
      summary: input.summary.trim(),
      provenanceRefs: provenance,
      confidence: 'unverified',
      labeledVerified: false,
      rawPrivatePooling: false,
      status: 'denied',
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
      reason: UNVERIFIED_BI_DENIED,
    };
    const store = await load(root);
    store.items.push(item);
    await save(root, store);
    return {
      accepted: false as const,
      status: 'denied' as const,
      labeledVerified: false,
      reason: UNVERIFIED_BI_DENIED,
      item,
    };
  }

  const item: BiStreamItem = {
    id: id('bi'),
    streamId: input.streamId,
    title: input.title.trim(),
    summary: input.summary.trim(),
    provenanceRefs: provenance,
    confidence: 'evidence_backed',
    labeledVerified: true,
    rawPrivatePooling: false,
    status: 'verified',
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: 'BI_STREAM_ITEM_VERIFIED_WITH_PROVENANCE',
  };
  const store = await load(root);
  store.items.push(item);
  await save(root, store);
  return {
    accepted: true as const,
    status: 'verified' as const,
    labeledVerified: true,
    reason: item.reason,
    item,
  };
}

export async function listBiStreamItems(root = process.cwd()) {
  return (await load(root)).items;
}

export async function getVerifiedBiItems(streamId: string, root = process.cwd()) {
  const items = await listBiStreamItems(root);
  return items.filter((i) => i.streamId === streamId && i.labeledVerified && i.status === 'verified');
}
