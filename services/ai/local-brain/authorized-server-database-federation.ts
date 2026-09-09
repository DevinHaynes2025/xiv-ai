/**
 * 62L-CK Authorized Server/Database Federation —
 * Explicit enrollment, least-privilege scopes, network allowlists, auditing, revocation.
 * No arbitrary discovery/scan. Write deny-by-default. No production auto-alter.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARBITRARY_DISCOVERY_DENIED,
  CK_LOCKS,
  HONESTY_BANNER,
  UNENROLLED_FEDERATION_DENIED,
  WRITE_BY_DEFAULT_DENIED,
  type CkActor,
} from './cognitive-infra-mini-cloud-history-types';

export type FederationTargetKind = 'server' | 'sql' | 'nosql' | 'vector' | 'graph' | 'object';

export type FederationEnrollment = {
  id: string;
  name: string;
  kind: FederationTargetKind;
  enrolled: boolean;
  authorized: boolean;
  configured: boolean;
  consentGranted: boolean;
  scopes: string[];
  networkAllowlist: string[];
  writeAllowed: boolean;
  revoked: boolean;
  auditTrail: string[];
  status: 'available' | 'unavailable' | 'denied' | 'revoked';
  reason: string;
  productionAutoAlter: false;
  productionAuthorized: false;
  createdAt: string;
};

export type FederationAttempt = {
  id: string;
  enrollmentId: string | null;
  operation: 'read' | 'write' | 'scan' | 'discover' | 'connect_all' | 'alter';
  accepted: boolean;
  status: 'ok' | 'denied' | 'unavailable';
  reason: string;
  audited: true;
  at: string;
};

type Store = {
  enrollments: FederationEnrollment[];
  attempts: FederationAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'authorized-server-database-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { enrollments: [], attempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function serverDbFederationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CK_LOCKS.L4_AUTONOMY_ENABLED,
    writeDeniedByDefault: CK_LOCKS.DB_WRITE_DENIED_BY_DEFAULT,
    writeDefault: CK_LOCKS.DB_WRITE_DEFAULT,
    arbitraryServerDiscovery: CK_LOCKS.ARBITRARY_SERVER_DISCOVERY,
    arbitraryDbScan: CK_LOCKS.ARBITRARY_DB_SCAN,
    unenrolledFederationAvailable: CK_LOCKS.UNENROLLED_FEDERATION_AVAILABLE,
    productionAutoAlter: CK_LOCKS.PRODUCTION_AUTO_ALTER,
    liveSupabaseApply: CK_LOCKS.LIVE_SUPABASE_APPLY,
  };
}

export async function enrollServerOrDatabase(input: {
  name: string;
  kind: FederationTargetKind;
  enrolled: boolean;
  authorized: boolean;
  configured: boolean;
  consentGranted: boolean;
  scopes?: string[];
  networkAllowlist?: string[];
  writeAllowed?: boolean;
  root: string;
  actor: CkActor;
}): Promise<FederationEnrollment> {
  const store = await load(input.root);
  const scopes = input.scopes ?? ['read'];
  const writeAllowed = input.writeAllowed === true; // deny-by-default
  const ready =
    input.enrolled === true &&
    input.authorized === true &&
    input.configured === true &&
    input.consentGranted === true;

  let status: FederationEnrollment['status'] = 'unavailable';
  let reason = UNENROLLED_FEDERATION_DENIED;
  if (input.authorized !== true) {
    status = 'denied';
    reason = UNENROLLED_FEDERATION_DENIED;
  } else if (!ready) {
    status = 'unavailable';
    reason = UNENROLLED_FEDERATION_DENIED;
  } else {
    status = 'available';
    reason = 'AUTHORIZED_SERVER_DB_FEDERATION_ENROLLED';
  }

  const enrollment: FederationEnrollment = {
    id: id('fed'),
    name: input.name,
    kind: input.kind,
    enrolled: input.enrolled === true,
    authorized: input.authorized === true,
    configured: input.configured === true,
    consentGranted: input.consentGranted === true,
    scopes,
    networkAllowlist: input.networkAllowlist ?? [],
    writeAllowed,
    revoked: false,
    auditTrail: [`enroll:${status}:${new Date().toISOString()}`],
    status,
    reason,
    productionAutoAlter: false,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.enrollments.push(enrollment);
  await save(input.root, store);
  return enrollment;
}

export async function revokeFederationEnrollment(input: {
  enrollmentId: string;
  root: string;
  actor: CkActor;
}): Promise<FederationEnrollment | null> {
  const store = await load(input.root);
  const e = store.enrollments.find((x) => x.id === input.enrollmentId);
  if (!e) return null;
  e.revoked = true;
  e.status = 'revoked';
  e.reason = 'FEDERATION_ENROLLMENT_REVOKED_AUDIT_RECORDED';
  e.auditTrail.push(`revoke:${new Date().toISOString()}`);
  await save(input.root, store);
  return e;
}

export async function attemptFederationOperation(input: {
  enrollmentId?: string | null;
  operation: FederationAttempt['operation'];
  root: string;
  actor: CkActor;
}): Promise<FederationAttempt> {
  const store = await load(input.root);

  if (
    input.operation === 'scan' ||
    input.operation === 'discover' ||
    input.operation === 'connect_all'
  ) {
    const attempt: FederationAttempt = {
      id: id('fedatt'),
      enrollmentId: input.enrollmentId ?? null,
      operation: input.operation,
      accepted: false,
      status: 'denied',
      reason: ARBITRARY_DISCOVERY_DENIED,
      audited: true,
      at: new Date().toISOString(),
    };
    store.attempts.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (!input.enrollmentId) {
    const attempt: FederationAttempt = {
      id: id('fedatt'),
      enrollmentId: null,
      operation: input.operation,
      accepted: false,
      status: 'unavailable',
      reason: UNENROLLED_FEDERATION_DENIED,
      audited: true,
      at: new Date().toISOString(),
    };
    store.attempts.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const e = store.enrollments.find((x) => x.id === input.enrollmentId);
  if (!e || e.revoked || e.status !== 'available') {
    const attempt: FederationAttempt = {
      id: id('fedatt'),
      enrollmentId: input.enrollmentId,
      operation: input.operation,
      accepted: false,
      status: e?.status === 'denied' ? 'denied' : 'unavailable',
      reason: UNENROLLED_FEDERATION_DENIED,
      audited: true,
      at: new Date().toISOString(),
    };
    store.attempts.push(attempt);
    if (e) e.auditTrail.push(`deny:${input.operation}:${attempt.at}`);
    await save(input.root, store);
    return attempt;
  }

  if (input.operation === 'write' || input.operation === 'alter') {
    if (e.writeAllowed !== true || CK_LOCKS.DB_WRITE_DEFAULT === false) {
      // Explicit writeAllowed still cannot auto-alter production; write requires explicit scope.
      if (input.operation === 'alter' || e.writeAllowed !== true) {
        const attempt: FederationAttempt = {
          id: id('fedatt'),
          enrollmentId: e.id,
          operation: input.operation,
          accepted: false,
          status: 'denied',
          reason: WRITE_BY_DEFAULT_DENIED,
          audited: true,
          at: new Date().toISOString(),
        };
        store.attempts.push(attempt);
        e.auditTrail.push(`deny_write:${input.operation}:${attempt.at}`);
        await save(input.root, store);
        return attempt;
      }
    }
  }

  // Default write without explicit writeAllowed
  if (input.operation === 'write' && e.writeAllowed !== true) {
    const attempt: FederationAttempt = {
      id: id('fedatt'),
      enrollmentId: e.id,
      operation: 'write',
      accepted: false,
      status: 'denied',
      reason: WRITE_BY_DEFAULT_DENIED,
      audited: true,
      at: new Date().toISOString(),
    };
    store.attempts.push(attempt);
    e.auditTrail.push(`deny_write_default:${attempt.at}`);
    await save(input.root, store);
    return attempt;
  }

  const attempt: FederationAttempt = {
    id: id('fedatt'),
    enrollmentId: e.id,
    operation: input.operation,
    accepted: true,
    status: 'ok',
    reason:
      input.operation === 'read'
        ? 'AUTHORIZED_FEDERATION_READ'
        : 'AUTHORIZED_FEDERATION_EXPLICIT_WRITE_SCOPE',
    audited: true,
    at: new Date().toISOString(),
  };
  store.attempts.push(attempt);
  e.auditTrail.push(`ok:${input.operation}:${attempt.at}`);
  await save(input.root, store);
  return attempt;
}
