/**
 * 62L-DQ Local/Edge Connector Runtime —
 * Local/edge connector runtimes with offline-tested honesty.
 * Untested offline ≠ available. Unconfigured → UNAVAILABLE.
 * Registration ≠ billing/credentials/deploy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DQ_LOCKS,
  MAX_EDGE_CONNECTORS,
  REGISTRATION_NO_BILLING_CREDS_DEPLOY,
  UNCONFIGURED_EDGE_UNAVAILABLE,
  UNTESTED_OFFLINE_NOT_AVAILABLE,
  type DqActor,
} from './universal-integration-brain-types';

export type EdgeConnector = {
  id: string;
  name: string;
  configured: boolean;
  offlineTested: boolean;
  offlineAvailable: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_TESTED' | 'REGISTERED';
  grantsAuthority: false;
  grantsCredentials: false;
  grantsBilling: false;
  grantsDeploy: false;
  reason: string;
  createdAt: string;
};

export type OfflineCapabilityProbe = {
  id: string;
  connectorId: string;
  claimedAvailable: boolean;
  offlineTested: boolean;
  status: 'AVAILABLE' | 'NOT_TESTED' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  connectors: EdgeConnector[];
  probes: OfflineCapabilityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'local-edge-connector-runtime.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { connectors: [], probes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function localEdgeConnectorRuntimeHonesty() {
  return {
    untestedOfflineMarkedAvailable: DQ_LOCKS.UNTESTED_OFFLINE_MARKED_AVAILABLE,
    offlineRequiresTestEvidence: DQ_LOCKS.OFFLINE_REQUIRES_TEST_EVIDENCE,
    unconfiguredAvailable: DQ_LOCKS.UNCONFIGURED_EDGE_CONNECTOR_AVAILABLE,
    unconfiguredUnavailable: DQ_LOCKS.UNCONFIGURED_EDGE_CONNECTOR_UNAVAILABLE,
    registrationGrantsBilling: DQ_LOCKS.REGISTRATION_GRANTS_BILLING,
    registrationGrantsCredentials: DQ_LOCKS.REGISTRATION_GRANTS_CREDENTIALS,
    registrationGrantsDeploy: DQ_LOCKS.REGISTRATION_GRANTS_DEPLOY,
  };
}

export async function registerEdgeConnector(input: {
  name: string;
  configured?: boolean;
  offlineTested?: boolean;
  root: string;
  actor: DqActor;
}): Promise<EdgeConnector> {
  const store = await load(input.root);
  void input.actor;
  if (store.connectors.length >= MAX_EDGE_CONNECTORS) {
    throw new Error('MAX_EDGE_CONNECTORS');
  }
  const configured = input.configured === true;
  const offlineTested = input.offlineTested === true;
  const offlineAvailable = configured && offlineTested;
  const connector: EdgeConnector = {
    id: id('dqedge'),
    name: input.name.trim(),
    configured,
    offlineTested,
    offlineAvailable,
    status: !configured
      ? 'UNAVAILABLE'
      : offlineTested
        ? 'AVAILABLE'
        : 'NOT_TESTED',
    grantsAuthority: false,
    grantsCredentials: false,
    grantsBilling: false,
    grantsDeploy: false,
    reason: !configured
      ? UNCONFIGURED_EDGE_UNAVAILABLE
      : offlineTested
        ? 'EDGE_CONNECTOR_CONFIGURED_AND_OFFLINE_TESTED'
        : UNTESTED_OFFLINE_NOT_AVAILABLE,
    createdAt: new Date().toISOString(),
  };
  store.connectors.push(connector);
  await save(input.root, store);
  return connector;
}

export async function probeOfflineCapability(input: {
  connectorId: string;
  claimAvailable?: boolean;
  root: string;
  actor: DqActor;
}): Promise<OfflineCapabilityProbe> {
  const store = await load(input.root);
  void input.actor;
  const connector = store.connectors.find((c) => c.id === input.connectorId);
  const claim = input.claimAvailable === true;
  const tested = connector?.offlineTested === true;
  const configured = connector?.configured === true;

  let status: OfflineCapabilityProbe['status'] = 'UNAVAILABLE';
  let reason = UNCONFIGURED_EDGE_UNAVAILABLE;

  if (!connector || !configured) {
    status = 'UNAVAILABLE';
    reason = UNCONFIGURED_EDGE_UNAVAILABLE;
  } else if (!tested) {
    status = claim ? 'DENIED' : 'NOT_TESTED';
    reason = UNTESTED_OFFLINE_NOT_AVAILABLE;
  } else {
    status = 'AVAILABLE';
    reason = 'OFFLINE_CAPABILITY_TESTED_AVAILABLE';
  }

  const probe: OfflineCapabilityProbe = {
    id: id('dqoff'),
    connectorId: input.connectorId,
    claimedAvailable: claim,
    offlineTested: tested,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.probes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeRegistrationAuthority(input: {
  connectorId: string;
  claimBilling?: boolean;
  claimCredentials?: boolean;
  claimDeploy?: boolean;
  root: string;
  actor: DqActor;
}): Promise<{
  id: string;
  connectorId: string;
  grantsBilling: false;
  grantsCredentials: false;
  grantsDeploy: false;
  status: 'denied' | 'recorded';
  reason: string;
  at: string;
}> {
  const store = await load(input.root);
  void input.actor;
  const connector = store.connectors.find((c) => c.id === input.connectorId);
  const claim =
    input.claimBilling === true ||
    input.claimCredentials === true ||
    input.claimDeploy === true;
  const result = {
    id: id('dqreg'),
    connectorId: input.connectorId,
    grantsBilling: false as const,
    grantsCredentials: false as const,
    grantsDeploy: false as const,
    status: claim || Boolean(connector) ? ('denied' as const) : ('recorded' as const),
    reason: REGISTRATION_NO_BILLING_CREDS_DEPLOY,
    at: new Date().toISOString(),
  };
  await save(input.root, store);
  return result;
}
