/**
 * 62L-CW Global Knowledge Lakehouse —
 * Governed knowledge lakehouse; authorized sources only; unknown-rights DENIED.
 * No raw private pooling by default.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CW_LOCKS,
  HONESTY_BANNER,
  MAX_LAKEHOUSE_OBJECTS,
  UNKNOWN_RIGHTS_LAKEHOUSE_DENIED,
  type CwActor,
  type RightsClass,
} from './autonomous-research-infrastructure-os-types';

export type LakehouseObject = {
  id: string;
  sourceId: string;
  rightsClass: RightsClass;
  contentSummary: string;
  searchableNegative: boolean;
  status: 'ACCEPTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type LakehouseResult = {
  accepted: boolean;
  reason: string;
  object?: LakehouseObject;
  at: string;
};

type Store = { objects: LakehouseObject[] };

function storePath(root: string) {
  return xivLocalPath(root, 'global-knowledge-lakehouse.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { objects: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const ALLOWED_RIGHTS: RightsClass[] = [
  'authorized_owned',
  'authorized_licensed',
  'public_domain',
];

export function knowledgeLakehouseHonesty() {
  return {
    banner: HONESTY_BANNER,
    unknownRightsIntake: CW_LOCKS.UNKNOWN_RIGHTS_LAKEHOUSE_INTAKE,
    rawPrivatePoolingByDefault: CW_LOCKS.RAW_PRIVATE_POOLING_BY_DEFAULT,
  };
}

export async function intakeLakehouseObject(input: {
  sourceId: string;
  rightsClass: RightsClass;
  contentSummary: string;
  kind?: 'result' | 'negative' | 'artifact';
  root: string;
  actor: CwActor;
}): Promise<LakehouseResult> {
  void input.actor;
  const now = new Date().toISOString();
  if (
    input.rightsClass === 'unknown_rights' ||
    input.rightsClass === 'stolen_or_leaked' ||
    input.rightsClass === 'restricted' ||
    !ALLOWED_RIGHTS.includes(input.rightsClass)
  ) {
    return {
      accepted: false,
      reason: UNKNOWN_RIGHTS_LAKEHOUSE_DENIED,
      at: now,
    };
  }
  const store = await load(input.root);
  if (store.objects.length >= MAX_LAKEHOUSE_OBJECTS) {
    return {
      accepted: false,
      reason: 'MAX_LAKEHOUSE_OBJECTS_BOUNDED',
      at: now,
    };
  }
  const object: LakehouseObject = {
    id: id('lkho'),
    sourceId: input.sourceId.trim(),
    rightsClass: input.rightsClass,
    contentSummary: input.contentSummary.trim() || 'lakehouse-object',
    searchableNegative: input.kind === 'negative',
    status: 'ACCEPTED',
    reason: 'LAKEHOUSE_OBJECT_ACCEPTED',
    createdAt: now,
  };
  store.objects.push(object);
  await save(input.root, store);
  return { accepted: true, reason: object.reason, object, at: now };
}

export async function searchLakehouseNegatives(input: {
  root: string;
  query?: string;
}): Promise<LakehouseObject[]> {
  const store = await load(input.root);
  const q = (input.query ?? '').trim().toLowerCase();
  return store.objects.filter(
    (o) =>
      o.searchableNegative &&
      o.status === 'ACCEPTED' &&
      (!q ||
        o.sourceId.toLowerCase().includes(q) ||
        o.contentSummary.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)),
  );
}
