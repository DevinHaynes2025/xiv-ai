/**
 * 62L-DD Multi-Universe Backup, Restore & Continuity Grid —
 * Signed Multi-Universe backup/restore testing with explicit recovery
 * authorization gates. Test ≠ auto production restore.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BACKUP_TEST_NOT_AUTO_PROD,
  DD_LOCKS,
  HONESTY_BANNER,
  MAX_BACKUP_PACKS,
  RESTORE_WITHOUT_AUTH_DENIED,
  UNSIGNED_BACKUP_PACK_REJECTED,
  type DdActor,
} from './cognitive-service-mesh-types';

export type BackupPack = {
  id: string;
  universeId: string;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  testOnly: true;
  productionRestoreAuthorized: false;
  status: 'ACCEPTED' | 'REJECTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type RestoreAttempt = {
  id: string;
  backupPackId: string;
  recoveryAuthorization: boolean;
  testMode: boolean;
  autoProductionRestoreAttempted: boolean;
  status: 'TEST_RECORDED' | 'DENIED' | 'REJECTED';
  reason: string;
  at: string;
};

export type RecoveryAuthorization = {
  id: string;
  backupPackId: string;
  authorizedBy: string;
  revoked: boolean;
  createdAt: string;
};

type Store = {
  packs: BackupPack[];
  restores: RestoreAttempt[];
  authorizations: RecoveryAuthorization[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-universe-backup-restore-continuity-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    packs: [],
    restores: [],
    authorizations: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function signBackupPackPayload(payload: string, keyMaterial: string): string {
  return createHash('sha256').update(`${keyMaterial}::${payload}`).digest('hex');
}

export function continuityGridHonesty() {
  return {
    banner: HONESTY_BANNER,
    restoreWithoutRecoveryAuthorization: DD_LOCKS.RESTORE_WITHOUT_RECOVERY_AUTHORIZATION,
    backupTestAutoProductionRestore: DD_LOCKS.BACKUP_TEST_AUTO_PRODUCTION_RESTORE,
    unsignedBackupAccepted: DD_LOCKS.UNSIGNED_BACKUP_PACK_ACCEPTED,
  };
}

export async function submitBackupPack(input: {
  universeId: string;
  payload: string;
  signature?: string | null;
  signingKey?: string | null;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; pack?: BackupPack; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.packs.length >= MAX_BACKUP_PACKS) {
    return { accepted: false, reason: 'MAX_BACKUP_PACKS_BOUNDED', at: now };
  }

  const digest = createHash('sha256').update(input.payload).digest('hex');
  let signature = input.signature ?? null;
  if (!signature && input.signingKey) {
    signature = signBackupPackPayload(input.payload, input.signingKey);
  }
  const signed = Boolean(signature);

  if (!signed || DD_LOCKS.UNSIGNED_BACKUP_PACK_ACCEPTED) {
    const pack: BackupPack = {
      id: id('mubp'),
      universeId: input.universeId.trim(),
      payloadDigest: digest,
      signature,
      signed,
      testOnly: true,
      productionRestoreAuthorized: false,
      status: 'REJECTED',
      reason: UNSIGNED_BACKUP_PACK_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  const pack: BackupPack = {
    id: id('mubp'),
    universeId: input.universeId.trim(),
    payloadDigest: digest,
    signature,
    signed: true,
    testOnly: true,
    productionRestoreAuthorized: false,
    status: 'ACCEPTED',
    reason: 'SIGNED_BACKUP_PACK_ACCEPTED_TEST_ONLY',
    createdAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, at: now };
}

export async function grantRecoveryAuthorization(input: {
  backupPackId: string;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; authorization?: RecoveryAuthorization; at: string }> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const pack = store.packs.find((p) => p.id === input.backupPackId && p.status === 'ACCEPTED');
  if (!pack) {
    return { accepted: false, reason: 'BACKUP_PACK_NOT_FOUND_OR_REJECTED', at: now };
  }
  const authorization: RecoveryAuthorization = {
    id: id('mura'),
    backupPackId: pack.id,
    authorizedBy: input.actor.id,
    revoked: false,
    createdAt: now,
  };
  store.authorizations.push(authorization);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'EXPLICIT_RECOVERY_AUTHORIZATION_GRANTED_TEST_SCOPE',
    authorization,
    at: now,
  };
}

export async function attemptRestore(input: {
  backupPackId: string;
  recoveryAuthorized?: boolean;
  autoProductionRestore?: boolean;
  testMode?: boolean;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: RestoreAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const pack = store.packs.find((p) => p.id === input.backupPackId);
  const autoProd = input.autoProductionRestore === true;
  const testMode = input.testMode !== false;
  const explicitAuth =
    input.recoveryAuthorized === true ||
    store.authorizations.some(
      (a) => a.backupPackId === input.backupPackId && !a.revoked,
    );

  if (!pack || pack.status !== 'ACCEPTED') {
    const attempt: RestoreAttempt = {
      id: id('murr'),
      backupPackId: input.backupPackId,
      recoveryAuthorization: explicitAuth,
      testMode,
      autoProductionRestoreAttempted: autoProd,
      status: 'REJECTED',
      reason: 'BACKUP_PACK_NOT_ACCEPTED',
      at: now,
    };
    store.restores.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt, at: now };
  }

  if (autoProd || DD_LOCKS.BACKUP_TEST_AUTO_PRODUCTION_RESTORE) {
    const attempt: RestoreAttempt = {
      id: id('murr'),
      backupPackId: pack.id,
      recoveryAuthorization: explicitAuth,
      testMode,
      autoProductionRestoreAttempted: true,
      status: 'DENIED',
      reason: BACKUP_TEST_NOT_AUTO_PROD,
      at: now,
    };
    store.restores.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt, at: now };
  }

  if (!explicitAuth || DD_LOCKS.RESTORE_WITHOUT_RECOVERY_AUTHORIZATION) {
    const attempt: RestoreAttempt = {
      id: id('murr'),
      backupPackId: pack.id,
      recoveryAuthorization: false,
      testMode,
      autoProductionRestoreAttempted: false,
      status: 'DENIED',
      reason: RESTORE_WITHOUT_AUTH_DENIED,
      at: now,
    };
    store.restores.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt, at: now };
  }

  const attempt: RestoreAttempt = {
    id: id('murr'),
    backupPackId: pack.id,
    recoveryAuthorization: true,
    testMode: true,
    autoProductionRestoreAttempted: false,
    status: 'TEST_RECORDED',
    reason: BACKUP_TEST_NOT_AUTO_PROD,
    at: now,
  };
  store.restores.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt, at: now };
}
