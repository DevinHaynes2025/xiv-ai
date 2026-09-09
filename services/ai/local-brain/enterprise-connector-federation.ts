/**
 * 62L-ED Module D — Enterprise Connector Federation.
 * Authorized connectors only; unconfigured → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONNECTOR_REGISTERED,
  MAX_CONNECTOR_EVENTS,
  UNCONFIGURED_CONNECTOR_UNAVAILABLE,
  type EdActor,
  type EdEvidenceState,
} from './data-galaxy-industry-memory-os-types';

export type ConnectorRegistration = {
  id: string;
  connectorId: string;
  authorized: boolean;
  configured: boolean;
  status: 'ok' | 'denied' | 'unavailable';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type ConnectorProbe = {
  id: string;
  connectorId: string;
  configured: boolean;
  status: 'ok' | 'unavailable';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  registrations: ConnectorRegistration[];
  probes: ConnectorProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'enterprise-connector-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    registrations: [],
    probes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function enterpriseConnectorFederationHonesty() {
  return {
    authorizedConnectorsOnly: true,
    unconfiguredConnectorsUnavailable: true,
    noFabricatedCredentials: true,
    l4AutonomyEnabled: false,
  };
}

export async function registerEnterpriseConnector(input: {
  connectorId: string;
  authorized: boolean;
  configured: boolean;
  root: string;
  actor: EdActor;
}): Promise<ConnectorRegistration> {
  const store = await load(input.root);
  void input.actor;
  if (store.registrations.length >= MAX_CONNECTOR_EVENTS) {
    throw new Error('MAX_CONNECTOR_EVENTS');
  }
  let status: ConnectorRegistration['status'] = 'ok';
  let state: EdEvidenceState = 'REGISTERED';
  let reason = CONNECTOR_REGISTERED;
  if (!input.authorized) {
    status = 'denied';
    state = 'DENIED';
    reason = 'UNAUTHORIZED_CONNECTOR_DENIED';
  } else if (!input.configured) {
    status = 'unavailable';
    state = 'UNAVAILABLE';
    reason = UNCONFIGURED_CONNECTOR_UNAVAILABLE;
  }
  const row: ConnectorRegistration = {
    id: id('edconn'),
    connectorId: input.connectorId,
    authorized: input.authorized,
    configured: input.configured,
    status,
    state,
    reason,
    at: new Date().toISOString(),
  };
  store.registrations.push(row);
  await save(input.root, store);
  return row;
}

export async function probeEnterpriseConnector(input: {
  connectorId: string;
  configured: boolean;
  root: string;
  actor: EdActor;
}): Promise<ConnectorProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.probes.length >= MAX_CONNECTOR_EVENTS) {
    throw new Error('MAX_CONNECTOR_EVENTS');
  }
  const row: ConnectorProbe = {
    id: id('edconnprobe'),
    connectorId: input.connectorId,
    configured: input.configured,
    status: input.configured ? 'ok' : 'unavailable',
    state: input.configured ? 'CONFIGURED' : 'UNAVAILABLE',
    reason: input.configured
      ? CONNECTOR_REGISTERED
      : UNCONFIGURED_CONNECTOR_UNAVAILABLE,
    at: new Date().toISOString(),
  };
  store.probes.push(row);
  await save(input.root, store);
  return row;
}
