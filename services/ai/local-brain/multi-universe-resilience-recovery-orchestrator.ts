/**
 * 62L-DE Multi-Universe Resilience & Recovery Orchestrator —
 * Signed resilience/recovery orchestration with authorization gates.
 * Recovery without authorization DENIED.
 * Unsigned/revoked recovery packs REJECTED.
 * Orchestration ≠ auto production restore.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DE_LOCKS,
  HONESTY_BANNER,
  MAX_RECOVERY_PACKS,
  ORCHESTRATION_NOT_AUTO_PROD,
  RECOVERY_WITHOUT_AUTH_DENIED,
  REVOKED_RECOVERY_PACK_REJECTED,
  SEALED_SILENT_ROUTE_DENIED,
  UNSIGNED_RECOVERY_PACK_REJECTED,
  type DeActor,
  type KnowledgeAssetClass,
} from './knowledge-exchange-gateway-marketplace-types';

export type RecoveryAuthorization = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  authorized: boolean;
  revoked: boolean;
  createdAt: string;
};

export type RecoveryPack = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  assetClass: KnowledgeAssetClass;
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  revoked: boolean;
  recoveryAuthorized: boolean;
  silent: boolean;
  autoProductionRestore: false;
  status: 'ACCEPTED' | 'DENIED' | 'REJECTED' | 'ORCHESTRATED';
  reason: string;
  createdAt: string;
};

export type RecoveryResult = {
  accepted: boolean;
  reason: string;
  pack?: RecoveryPack;
  authorization?: RecoveryAuthorization;
  at: string;
};

type Store = {
  authorizations: RecoveryAuthorization[];
  packs: RecoveryPack[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-universe-resilience-recovery-orchestrator.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { authorizations: [], packs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function signRecoveryPayload(payload: string, key: string): string {
  return createHash('sha256').update(`recovery::${key}::${payload}`).digest('hex');
}

export function resilienceRecoveryOrchestratorHonesty() {
  return {
    banner: HONESTY_BANNER,
    recoveryWithoutAuthorization: DE_LOCKS.RECOVERY_WITHOUT_AUTHORIZATION,
    unsignedAccepted: DE_LOCKS.UNSIGNED_RECOVERY_PACK_ACCEPTED,
    revokedAccepted: DE_LOCKS.REVOKED_RECOVERY_PACK_ACCEPTED,
    orchestrationEqAutoProdRestore: DE_LOCKS.ORCHESTRATION_EQ_AUTO_PROD_RESTORE,
    sealedSilentFallback: DE_LOCKS.SEALED_SILENT_CLOUD_OR_UNIVERSE_FALLBACK,
  };
}

export async function authorizeRecoveryLink(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  root: string;
  actor: DeActor;
}): Promise<RecoveryResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const authorization: RecoveryAuthorization = {
    id: id('murr'),
    sourceUniverseId: input.sourceUniverseId.trim(),
    targetUniverseId: input.targetUniverseId.trim(),
    authorized: true,
    revoked: false,
    createdAt: now,
  };
  store.authorizations.push(authorization);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'RECOVERY_LINK_AUTHORIZED_NOT_AUTO_PROD_RESTORE',
    authorization,
    at: now,
  };
}

export async function revokeRecoveryLink(input: {
  authorizationId: string;
  root: string;
  actor: DeActor;
}): Promise<RecoveryResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const authorization = store.authorizations.find((a) => a.id === input.authorizationId);
  if (!authorization) {
    return { accepted: false, reason: 'RECOVERY_AUTHORIZATION_NOT_FOUND', at: now };
  }
  authorization.revoked = true;
  authorization.authorized = false;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'RECOVERY_LINK_REVOKED',
    authorization,
    at: now,
  };
}

export async function submitRecoveryPack(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  payload: string;
  assetClass?: KnowledgeAssetClass;
  signature?: string | null;
  signingKey?: string | null;
  revoked?: boolean;
  silent?: boolean;
  claimAutoProductionRestore?: boolean;
  root: string;
  actor: DeActor;
}): Promise<RecoveryResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.packs.length >= MAX_RECOVERY_PACKS) {
    return { accepted: false, reason: 'MAX_RECOVERY_PACKS_BOUNDED', at: now };
  }

  const digest = createHash('sha256').update(input.payload).digest('hex');
  const assetClass = input.assetClass ?? 'approved_knowledge';
  const signature = input.signature ?? null;
  let signed = Boolean(signature);
  if (input.signingKey && signature) {
    signed = signRecoveryPayload(input.payload, input.signingKey) === signature;
  }
  const auth = store.authorizations.find(
    (a) =>
      a.sourceUniverseId === input.sourceUniverseId &&
      a.targetUniverseId === input.targetUniverseId &&
      a.authorized &&
      !a.revoked,
  );
  const silent = input.silent === true;
  const sealedOrPrivate = assetClass === 'sealed' || assetClass === 'raw_private';

  if (input.revoked === true) {
    const pack: RecoveryPack = {
      id: id('murp'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass,
      payloadDigest: digest,
      signature,
      signed,
      revoked: true,
      recoveryAuthorized: Boolean(auth),
      silent,
      autoProductionRestore: false,
      status: 'REJECTED',
      reason: REVOKED_RECOVERY_PACK_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (!signed || !signature) {
    const pack: RecoveryPack = {
      id: id('murp'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass,
      payloadDigest: digest,
      signature: null,
      signed: false,
      revoked: false,
      recoveryAuthorized: Boolean(auth),
      silent,
      autoProductionRestore: false,
      status: 'REJECTED',
      reason: UNSIGNED_RECOVERY_PACK_REJECTED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (!auth) {
    const pack: RecoveryPack = {
      id: id('murp'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass,
      payloadDigest: digest,
      signature,
      signed: true,
      revoked: false,
      recoveryAuthorized: false,
      silent,
      autoProductionRestore: false,
      status: 'DENIED',
      reason: RECOVERY_WITHOUT_AUTH_DENIED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (silent && sealedOrPrivate) {
    const pack: RecoveryPack = {
      id: id('murp'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass,
      payloadDigest: digest,
      signature,
      signed: true,
      revoked: false,
      recoveryAuthorized: true,
      silent: true,
      autoProductionRestore: false,
      status: 'DENIED',
      reason: SEALED_SILENT_ROUTE_DENIED,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  if (input.claimAutoProductionRestore === true) {
    const pack: RecoveryPack = {
      id: id('murp'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass,
      payloadDigest: digest,
      signature,
      signed: true,
      revoked: false,
      recoveryAuthorized: true,
      silent,
      autoProductionRestore: false,
      status: 'DENIED',
      reason: ORCHESTRATION_NOT_AUTO_PROD,
      createdAt: now,
    };
    store.packs.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: pack.reason, pack, at: now };
  }

  const pack: RecoveryPack = {
    id: id('murp'),
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
    assetClass,
    payloadDigest: digest,
    signature,
    signed: true,
    revoked: false,
    recoveryAuthorized: true,
    silent,
    autoProductionRestore: false,
    status: 'ORCHESTRATED',
    reason: 'RECOVERY_PACK_ORCHESTRATED_NOT_AUTO_PRODUCTION_RESTORE',
    createdAt: now,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, at: now };
}
