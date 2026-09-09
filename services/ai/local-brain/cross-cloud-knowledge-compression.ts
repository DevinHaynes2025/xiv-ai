/**
 * 62L-CO Cross-Cloud Knowledge Compression — gated candidates only.
 * Security/correctness/residency beat size/speed; not auto production-authorized.
 * Unsigned/revoked packs rejected.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CO_LOCKS,
  COMPRESSION_NOT_PRODUCTION_AUTHORIZED,
  HONESTY_BANNER,
  UNSIGNED_OR_REVOKED_PACK_REJECTED,
  type CoActor,
} from './global-knowledge-exchange-os-types';

export type CompressionCandidate = {
  id: string;
  label: string;
  sourcePackId: string | null;
  status: 'CANDIDATE' | 'REJECTED';
  productionAuthorized: false;
  sizeHint: number;
  residencyOk: boolean;
  securityOk: boolean;
  correctnessOk: boolean;
  reason: string;
  createdAt: string;
};

export type KnowledgePack = {
  id: string;
  label: string;
  signed: boolean;
  revoked: boolean;
  checksum: string;
  createdAt: string;
};

export type PackApplyAttempt = {
  id: string;
  packId: string | null;
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  candidates: CompressionCandidate[];
  packs: KnowledgePack[];
  applies: PackApplyAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'cross-cloud-knowledge-compression.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    candidates: [],
    packs: [],
    applies: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function compressionHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CO_LOCKS.L4_AUTONOMY_ENABLED,
    compressionAutoProductionAuthorized: CO_LOCKS.COMPRESSION_AUTO_PRODUCTION_AUTHORIZED,
    compressionIsCandidateOnly: CO_LOCKS.COMPRESSION_IS_CANDIDATE_ONLY,
    securityCorrectnessResidencyBeatsSizeSpeed:
      CO_LOCKS.SECURITY_CORRECTNESS_RESIDENCY_BEATS_SIZE_SPEED,
    unsignedPackAccept: CO_LOCKS.UNSIGNED_PACK_ACCEPT,
    revokedPackAccept: CO_LOCKS.REVOKED_PACK_ACCEPT,
    packRequiresSignature: CO_LOCKS.PACK_REQUIRES_SIGNATURE,
    packRevocable: CO_LOCKS.PACK_REVOCABLE,
  };
}

export async function createSignedKnowledgePack(input: {
  label: string;
  signed?: boolean;
  checksum?: string;
  root: string;
  actor: CoActor;
}): Promise<KnowledgePack> {
  const store = await load(input.root);
  const pack: KnowledgePack = {
    id: id('pack'),
    label: input.label,
    signed: input.signed !== false,
    revoked: false,
    checksum: input.checksum ?? `chk_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  store.packs.push(pack);
  await save(input.root, store);
  return pack;
}

export async function revokeKnowledgePack(input: {
  packId: string;
  root: string;
  actor: CoActor;
}): Promise<KnowledgePack | null> {
  const store = await load(input.root);
  const pack = store.packs.find((p) => p.id === input.packId);
  if (!pack) return null;
  pack.revoked = true;
  await save(input.root, store);
  return pack;
}

export async function proposeCompressionCandidate(input: {
  label: string;
  sourcePackId?: string | null;
  sizeHint?: number;
  residencyOk?: boolean;
  securityOk?: boolean;
  correctnessOk?: boolean;
  /** Probe: attempt auto production authorization. */
  attemptAutoProductionAuthorize?: boolean;
  root: string;
  actor: CoActor;
}): Promise<CompressionCandidate> {
  const store = await load(input.root);
  const residencyOk = input.residencyOk !== false;
  const securityOk = input.securityOk !== false;
  const correctnessOk = input.correctnessOk !== false;
  const sizeHint = input.sizeHint ?? 1;

  // Security/correctness/residency beat size/speed — fail closed if any gate fails.
  if (!residencyOk || !securityOk || !correctnessOk) {
    const candidate: CompressionCandidate = {
      id: id('cmp'),
      label: input.label,
      sourcePackId: input.sourcePackId ?? null,
      status: 'REJECTED',
      productionAuthorized: false,
      sizeHint,
      residencyOk,
      securityOk,
      correctnessOk,
      reason: 'COMPRESSION_REJECTED_SECURITY_CORRECTNESS_OR_RESIDENCY_GATE',
      createdAt: new Date().toISOString(),
    };
    store.candidates.push(candidate);
    await save(input.root, store);
    return candidate;
  }

  if (input.attemptAutoProductionAuthorize === true) {
    const candidate: CompressionCandidate = {
      id: id('cmp'),
      label: input.label,
      sourcePackId: input.sourcePackId ?? null,
      status: 'CANDIDATE',
      productionAuthorized: false,
      sizeHint,
      residencyOk,
      securityOk,
      correctnessOk,
      reason: COMPRESSION_NOT_PRODUCTION_AUTHORIZED,
      createdAt: new Date().toISOString(),
    };
    store.candidates.push(candidate);
    await save(input.root, store);
    return candidate;
  }

  const candidate: CompressionCandidate = {
    id: id('cmp'),
    label: input.label,
    sourcePackId: input.sourcePackId ?? null,
    status: 'CANDIDATE',
    productionAuthorized: false,
    sizeHint,
    residencyOk,
    securityOk,
    correctnessOk,
    reason: 'COMPRESSION_CANDIDATE_GATED_NOT_PRODUCTION_AUTHORIZED',
    createdAt: new Date().toISOString(),
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return candidate;
}

export async function applyKnowledgePack(input: {
  packId: string;
  root: string;
  actor: CoActor;
}): Promise<PackApplyAttempt> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const pack = store.packs.find((p) => p.id === input.packId);

  if (!pack || !pack.signed || pack.revoked) {
    const attempt: PackApplyAttempt = {
      id: id('apply'),
      packId: input.packId,
      accepted: false,
      reason: UNSIGNED_OR_REVOKED_PACK_REJECTED,
      at: now,
    };
    store.applies.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const attempt: PackApplyAttempt = {
    id: id('apply'),
    packId: pack.id,
    accepted: true,
    reason: 'SIGNED_NON_REVOKED_PACK_ACCEPTED_AS_CANDIDATE_DISTRIBUTION',
    at: now,
  };
  store.applies.push(attempt);
  await save(input.root, store);
  return attempt;
}
