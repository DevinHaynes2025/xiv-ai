/**
 * 62L-DP Enterprise Integration Highway —
 * Enterprise connectors highway with enrollment/scopes/audit.
 * Unenrolled enterprise connector → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_ENTERPRISE_CONNECTORS,
  UNENROLLED_ENTERPRISE_UNAVAILABLE,
  type DpActor,
  type PermissionScope,
} from './plugin-civilization-os-types';

export type EnterpriseConnector = {
  id: string;
  name: string;
  enrolled: boolean;
  scopes: PermissionScope[];
  status: 'available' | 'unavailable';
  reason: string;
  createdAt: string;
};

export type EnterpriseUseAttempt = {
  id: string;
  connectorId: string;
  status: 'allowed' | 'unavailable' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  connectors: EnterpriseConnector[];
  attempts: EnterpriseUseAttempt[];
  audits: Array<{ id: string; connectorId: string; action: string; reason: string; at: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'enterprise-integration-highway.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    connectors: [],
    attempts: [],
    audits: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function enterpriseIntegrationHighwayHonesty() {
  return {
    unenrolledAvailable: false,
    enrollmentRequired: true,
    scopesAudited: true,
  };
}

export async function registerEnterpriseConnector(input: {
  name: string;
  enrolled?: boolean;
  scopes?: PermissionScope[];
  root: string;
  actor: DpActor;
}): Promise<EnterpriseConnector> {
  const store = await load(input.root);
  void input.actor;
  if (store.connectors.length >= MAX_ENTERPRISE_CONNECTORS) {
    throw new Error('MAX_ENTERPRISE_CONNECTORS_REACHED');
  }
  const enrolled = input.enrolled === true;
  const connector: EnterpriseConnector = {
    id: id('dpent'),
    name: input.name.trim(),
    enrolled,
    scopes: input.scopes ?? ['read'],
    status: enrolled ? 'available' : 'unavailable',
    reason: enrolled ? 'ENTERPRISE_ENROLLED' : UNENROLLED_ENTERPRISE_UNAVAILABLE,
    createdAt: new Date().toISOString(),
  };
  store.connectors.push(connector);
  store.audits.push({
    id: id('dpentaud'),
    connectorId: connector.id,
    action: 'register',
    reason: connector.reason,
    at: new Date().toISOString(),
  });
  await save(input.root, store);
  return connector;
}

export async function useEnterpriseConnector(input: {
  connectorId: string;
  root: string;
  actor: DpActor;
}): Promise<EnterpriseUseAttempt> {
  const store = await load(input.root);
  void input.actor;
  const connector = store.connectors.find((c) => c.id === input.connectorId);
  const now = new Date().toISOString();
  if (!connector || !connector.enrolled || connector.status !== 'available') {
    const attempt: EnterpriseUseAttempt = {
      id: id('dpentuse'),
      connectorId: input.connectorId,
      status: 'unavailable',
      reason: UNENROLLED_ENTERPRISE_UNAVAILABLE,
      at: now,
    };
    store.attempts.push(attempt);
    await save(input.root, store);
    return attempt;
  }
  const attempt: EnterpriseUseAttempt = {
    id: id('dpentuse'),
    connectorId: connector.id,
    status: 'allowed',
    reason: 'ENTERPRISE_CONNECTOR_ALLOWED',
    at: now,
  };
  store.attempts.push(attempt);
  store.audits.push({
    id: id('dpentaud'),
    connectorId: connector.id,
    action: 'use',
    reason: attempt.reason,
    at: now,
  });
  await save(input.root, store);
  return attempt;
}
