/**
 * 62L-CD Authorized Database Connector Mesh — universal connector compatibility
 * for explicitly authorized SQL / NoSQL / vector / graph / object / document stores.
 * Enrollment, consent, scopes, revocation, provenance.
 * Write access DENIED by default. No silent "connect to every database" / no arbitrary scan.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARBITRARY_DB_SCAN_DENIED,
  CD_LOCKS,
  DB_WRITE_DENIED_DEFAULT,
  HONESTY_BANNER,
  UNAUTHORIZED_DB_DENIED,
  UNENROLLED_CONNECTOR_UNAVAILABLE,
  type CdActor,
} from './data-root-local-llm-archive-mesh-types';

export type DbStoreKind =
  | 'sql'
  | 'nosql'
  | 'vector'
  | 'graph'
  | 'object'
  | 'document';

export type DbConnector = {
  id: string;
  name: string;
  kind: DbStoreKind;
  enrolled: boolean;
  authorized: boolean;
  configured: boolean;
  consentGranted: boolean;
  scopes: string[];
  writeAllowed: boolean;
  revoked: boolean;
  provenanceRefs: string[];
  status: 'available' | 'unavailable' | 'denied' | 'revoked';
  reason: string;
  createdAt: string;
};

export type DbConnectAttempt = {
  id: string;
  connectorId: string | null;
  operation: 'read' | 'write' | 'scan' | 'connect_all';
  accepted: boolean;
  status: 'ok' | 'denied' | 'unavailable';
  reason: string;
  at: string;
};

type Store = {
  connectors: DbConnector[];
  attempts: DbConnectAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'authorized-database-connector-mesh.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { connectors: [], attempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function dbConnectorMeshHonesty() {
  return {
    banner: HONESTY_BANNER,
    writeDeniedByDefault: CD_LOCKS.DB_WRITE_DENIED_BY_DEFAULT,
    writeDefault: CD_LOCKS.DB_WRITE_DEFAULT,
    arbitraryDbScan: CD_LOCKS.ARBITRARY_DB_SCAN,
    connectEveryDatabase: CD_LOCKS.CONNECT_EVERY_DATABASE,
    unenrolledConnectorAvailable: CD_LOCKS.UNENROLLED_CONNECTOR_AVAILABLE,
    liveSupabaseApply: CD_LOCKS.LIVE_SUPABASE_APPLY,
  };
}

export async function enrollDbConnector(input: {
  name: string;
  kind: DbStoreKind;
  enrolled: boolean;
  authorized: boolean;
  configured: boolean;
  consentGranted: boolean;
  scopes?: string[];
  writeAllowed?: boolean;
  provenanceRefs?: string[];
  root: string;
  actor: CdActor;
}): Promise<DbConnector> {
  const store = await load(input.root);
  const scopes = input.scopes ?? ['read'];
  const writeAllowed = input.writeAllowed === true; // default false
  const ready =
    input.enrolled === true &&
    input.authorized === true &&
    input.configured === true &&
    input.consentGranted === true;

  let status: DbConnector['status'] = 'unavailable';
  let reason = UNENROLLED_CONNECTOR_UNAVAILABLE;
  if (input.authorized !== true) {
    status = 'denied';
    reason = UNAUTHORIZED_DB_DENIED;
  } else if (!ready) {
    status = 'unavailable';
    reason = UNENROLLED_CONNECTOR_UNAVAILABLE;
  } else {
    status = 'available';
    reason = 'AUTHORIZED_DB_CONNECTOR_ENROLLED';
  }

  const connector: DbConnector = {
    id: id('dbconn'),
    name: input.name,
    kind: input.kind,
    enrolled: input.enrolled === true,
    authorized: input.authorized === true,
    configured: input.configured === true,
    consentGranted: input.consentGranted === true,
    scopes,
    writeAllowed,
    revoked: false,
    provenanceRefs: input.provenanceRefs ?? [],
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.connectors.push(connector);
  await save(input.root, store);
  return connector;
}

export async function revokeDbConnector(input: {
  connectorId: string;
  root: string;
  actor: CdActor;
}): Promise<DbConnector | null> {
  const store = await load(input.root);
  const c = store.connectors.find((x) => x.id === input.connectorId);
  if (!c) return null;
  c.revoked = true;
  c.status = 'revoked';
  c.reason = 'DB_CONNECTOR_REVOKED_PROVENANCE_RECORDED';
  await save(input.root, store);
  return c;
}

export async function attemptDbConnect(input: {
  connectorId?: string | null;
  operation: 'read' | 'write' | 'scan' | 'connect_all';
  root: string;
  actor: CdActor;
}): Promise<DbConnectAttempt> {
  const store = await load(input.root);

  if (input.operation === 'scan' || input.operation === 'connect_all') {
    const attempt: DbConnectAttempt = {
      id: id('dbatt'),
      connectorId: input.connectorId ?? null,
      operation: input.operation,
      accepted: false,
      status: 'denied',
      reason: ARBITRARY_DB_SCAN_DENIED,
      at: new Date().toISOString(),
    };
    store.attempts.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (!input.connectorId) {
    const attempt: DbConnectAttempt = {
      id: id('dbatt'),
      connectorId: null,
      operation: input.operation,
      accepted: false,
      status: 'unavailable',
      reason: UNENROLLED_CONNECTOR_UNAVAILABLE,
      at: new Date().toISOString(),
    };
    store.attempts.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const c = store.connectors.find((x) => x.id === input.connectorId);
  if (!c || !c.enrolled) {
    const attempt: DbConnectAttempt = {
      id: id('dbatt'),
      connectorId: input.connectorId,
      operation: input.operation,
      accepted: false,
      status: 'unavailable',
      reason: UNENROLLED_CONNECTOR_UNAVAILABLE,
      at: new Date().toISOString(),
    };
    store.attempts.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (!c.authorized || c.revoked || c.status === 'revoked' || c.status === 'denied') {
    const attempt: DbConnectAttempt = {
      id: id('dbatt'),
      connectorId: c.id,
      operation: input.operation,
      accepted: false,
      status: 'denied',
      reason: UNAUTHORIZED_DB_DENIED,
      at: new Date().toISOString(),
    };
    store.attempts.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (c.status !== 'available') {
    const attempt: DbConnectAttempt = {
      id: id('dbatt'),
      connectorId: c.id,
      operation: input.operation,
      accepted: false,
      status: 'unavailable',
      reason: UNENROLLED_CONNECTOR_UNAVAILABLE,
      at: new Date().toISOString(),
    };
    store.attempts.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (input.operation === 'write' && c.writeAllowed !== true) {
    const attempt: DbConnectAttempt = {
      id: id('dbatt'),
      connectorId: c.id,
      operation: 'write',
      accepted: false,
      status: 'denied',
      reason: DB_WRITE_DENIED_DEFAULT,
      at: new Date().toISOString(),
    };
    store.attempts.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const attempt: DbConnectAttempt = {
    id: id('dbatt'),
    connectorId: c.id,
    operation: input.operation,
    accepted: true,
    status: 'ok',
    reason: 'AUTHORIZED_DB_READ_OR_EXPLICIT_WRITE',
    at: new Date().toISOString(),
  };
  store.attempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
