/**
 * 62L-DQ Global Business Systems Interoperability Layer —
 * Interoperability + signed cross-system events + Integration Operations Center contracts.
 * Unsigned cross-system events rejected.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DQ_LOCKS,
  MAX_CROSS_SYSTEM_EVENTS,
  UNSIGNED_EVENT_REJECTED,
  type DqActor,
} from './universal-integration-brain-types';

export type CrossSystemEvent = {
  id: string;
  sourceSystem: string;
  targetSystem: string;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  status: 'accepted' | 'rejected';
  reason: string;
  at: string;
};

export type IntegrationOpsCenterContract = {
  id: string;
  name: string;
  requiresSignedEvents: true;
  productionAuthorized: false;
  reason: string;
  createdAt: string;
};

type Store = {
  events: CrossSystemEvent[];
  contracts: IntegrationOpsCenterContract[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-business-systems-interop-layer.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { events: [], contracts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function digest(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

export function globalBusinessSystemsInteropLayerHonesty() {
  return {
    unsignedAccepted: DQ_LOCKS.UNSIGNED_CROSS_SYSTEM_EVENT_ACCEPTED,
    signedRequired: DQ_LOCKS.SIGNED_CROSS_SYSTEM_EVENTS_REQUIRED,
  };
}

export async function registerInteropContract(input: {
  name: string;
  root: string;
  actor: DqActor;
}): Promise<IntegrationOpsCenterContract> {
  const store = await load(input.root);
  void input.actor;
  const contract: IntegrationOpsCenterContract = {
    id: id('dqioc'),
    name: input.name.trim(),
    requiresSignedEvents: true,
    productionAuthorized: false,
    reason: 'INTEGRATION_OPS_CENTER_CONTRACT_SIGNED_EVENTS_REQUIRED',
    createdAt: new Date().toISOString(),
  };
  store.contracts.push(contract);
  await save(input.root, store);
  return contract;
}

export async function ingestCrossSystemEvent(input: {
  sourceSystem: string;
  targetSystem: string;
  payload: string;
  signature?: string | null;
  root: string;
  actor: DqActor;
}): Promise<CrossSystemEvent> {
  const store = await load(input.root);
  void input.actor;
  if (store.events.length >= MAX_CROSS_SYSTEM_EVENTS) {
    throw new Error('MAX_CROSS_SYSTEM_EVENTS');
  }
  const payloadDigest = digest(input.payload);
  const signature = (input.signature ?? '').trim() || null;
  const signed =
    Boolean(signature) &&
    signature === digest(`${payloadDigest}:${input.sourceSystem}:${input.targetSystem}`);

  const event: CrossSystemEvent = {
    id: id('dqevt'),
    sourceSystem: input.sourceSystem,
    targetSystem: input.targetSystem,
    payloadDigest,
    signature,
    signed,
    status: signed ? 'accepted' : 'rejected',
    reason: signed ? 'SIGNED_CROSS_SYSTEM_EVENT_ACCEPTED' : UNSIGNED_EVENT_REJECTED,
    at: new Date().toISOString(),
  };
  store.events.push(event);
  await save(input.root, store);
  return event;
}

export function signCrossSystemPayload(input: {
  payload: string;
  sourceSystem: string;
  targetSystem: string;
}): string {
  const payloadDigest = digest(input.payload);
  return digest(`${payloadDigest}:${input.sourceSystem}:${input.targetSystem}`);
}
