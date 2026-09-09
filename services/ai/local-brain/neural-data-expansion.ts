/**
 * 62L-EI Module F — Neural Data Expansion.
 * Business-system translation; signed event interoperability; lineage tracking.
 * Unsigned / unenrolled sealed deny.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BUSINESS_SYSTEM_TRANSLATION,
  LINEAGE_TRACKING,
  MAX_NEURAL_EVENTS,
  SIGNED_EVENT_INTEROP,
  UNSIGNED_UNENROLLED_DENY,
  type EiActor,
  type EiEvidenceState,
} from './chip-to-cloud-cognitive-fabric-types';

export type BusinessSystemTranslation = {
  id: string;
  translationId: string;
  sourceSystem: string;
  targetSystem: string;
  status: 'ok';
  state: EiEvidenceState;
  reason: string;
  at: string;
};

export type SignedEventRecord = {
  id: string;
  eventId: string;
  signed: boolean;
  enrolled: boolean;
  status: 'ok' | 'denied';
  state: EiEvidenceState;
  reason: string;
  accepted: boolean;
  at: string;
};

export type LineageRecord = {
  id: string;
  lineageId: string;
  eventId: string;
  status: 'ok';
  state: EiEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  translations: BusinessSystemTranslation[];
  events: SignedEventRecord[];
  lineage: LineageRecord[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'neural-data-expansion.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    translations: [],
    events: [],
    lineage: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function neuralDataExpansionHonesty() {
  return {
    businessSystemTranslation: true,
    signedEventInteropRequired: true,
    unsignedUnenrolledSealedDeny: true,
    lineageTrackingRequired: true,
    l4AutonomyEnabled: false,
  };
}

export async function translateBusinessSystem(input: {
  translationId: string;
  sourceSystem: string;
  targetSystem: string;
  root: string;
  actor: EiActor;
}): Promise<BusinessSystemTranslation> {
  const store = await load(input.root);
  void input.actor;
  if (store.translations.length >= MAX_NEURAL_EVENTS) {
    throw new Error('MAX_NEURAL_EVENTS');
  }
  const rec: BusinessSystemTranslation = {
    id: id('eixlate'),
    translationId: input.translationId.trim(),
    sourceSystem: input.sourceSystem.trim(),
    targetSystem: input.targetSystem.trim(),
    status: 'ok',
    state: 'BOUNDED',
    reason: BUSINESS_SYSTEM_TRANSLATION,
    at: new Date().toISOString(),
  };
  store.translations.push(rec);
  await save(input.root, store);
  return rec;
}

export async function ingestSignedEvent(input: {
  eventId: string;
  signed: boolean;
  enrolled: boolean;
  root: string;
  actor: EiActor;
}): Promise<SignedEventRecord> {
  const store = await load(input.root);
  void input.actor;
  const ok = input.signed && input.enrolled;
  const rec: SignedEventRecord = {
    id: id('eiev'),
    eventId: input.eventId.trim(),
    signed: input.signed,
    enrolled: input.enrolled,
    status: ok ? 'ok' : 'denied',
    state: ok ? 'AUTHORIZED' : 'UNSIGNED_DENIED',
    reason: ok ? SIGNED_EVENT_INTEROP : UNSIGNED_UNENROLLED_DENY,
    accepted: ok,
    at: new Date().toISOString(),
  };
  store.events.push(rec);
  await save(input.root, store);
  return rec;
}

export async function recordEventLineage(input: {
  lineageId: string;
  eventId: string;
  root: string;
  actor: EiActor;
}): Promise<LineageRecord> {
  const store = await load(input.root);
  void input.actor;
  const rec: LineageRecord = {
    id: id('eilin'),
    lineageId: input.lineageId.trim(),
    eventId: input.eventId.trim(),
    status: 'ok',
    state: 'LINEAGE_RECORDED',
    reason: LINEAGE_TRACKING,
    at: new Date().toISOString(),
  };
  store.lineage.push(rec);
  await save(input.root, store);
  return rec;
}
