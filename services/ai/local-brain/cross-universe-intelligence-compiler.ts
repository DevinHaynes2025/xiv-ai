/**
 * 62L-CX Cross-Universe Intelligence Compiler —
 * Scoped compiler for approved knowledge, skills, indexes, models,
 * and experiment metadata across authorized Universes only.
 * Rejects unapproved and raw-private cross-Universe transfer.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  COMPILER_RAW_PRIVATE_DENIED,
  COMPILER_UNAPPROVED_DENIED,
  CX_LOCKS,
  HONESTY_BANNER,
  MAX_COMPILER_TRANSFERS,
  type CompilerAssetClass,
  type CxActor,
} from './persistent-knowledge-civilization-types';

export type CompilerTransfer = {
  id: string;
  sourceUniverseId: string;
  targetUniverseId: string;
  assetClass: CompilerAssetClass;
  assetRef: string;
  authorizedUniverses: string[];
  status: 'COMPILED' | 'DENIED' | 'REJECTED';
  reason: string;
  at: string;
};

export type CompilerResult = {
  accepted: boolean;
  reason: string;
  transfer?: CompilerTransfer;
  at: string;
};

type Store = { transfers: CompilerTransfer[] };

const APPROVED_CLASSES: CompilerAssetClass[] = [
  'approved_knowledge',
  'approved_skill',
  'approved_index',
  'approved_model',
  'experiment_metadata',
];

function storePath(root: string) {
  return xivLocalPath(root, 'cross-universe-intelligence-compiler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { transfers: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function intelligenceCompilerHonesty() {
  return {
    banner: HONESTY_BANNER,
    unapprovedCrossUniverse: CX_LOCKS.COMPILER_UNAPPROVED_CROSS_UNIVERSE,
    rawPrivateCrossUniverse: CX_LOCKS.COMPILER_RAW_PRIVATE_CROSS_UNIVERSE,
    scopedApprovedOnly: true,
  };
}

export async function compileCrossUniverseTransfer(input: {
  sourceUniverseId: string;
  targetUniverseId: string;
  assetClass: CompilerAssetClass;
  assetRef: string;
  authorizedUniverses: string[];
  root: string;
  actor: CxActor;
}): Promise<CompilerResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.transfers.length >= MAX_COMPILER_TRANSFERS) {
    return {
      accepted: false,
      reason: 'MAX_COMPILER_TRANSFERS_BOUNDED',
      at: now,
    };
  }

  const authorized = new Set(input.authorizedUniverses.map((u) => u.trim()).filter(Boolean));
  const sourceOk = authorized.has(input.sourceUniverseId);
  const targetOk = authorized.has(input.targetUniverseId);

  if (input.assetClass === 'raw_private') {
    const transfer: CompilerTransfer = {
      id: id('cuic'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass: 'raw_private',
      assetRef: input.assetRef,
      authorizedUniverses: [...authorized],
      status: 'DENIED',
      reason: COMPILER_RAW_PRIVATE_DENIED,
      at: now,
    };
    store.transfers.push(transfer);
    await save(input.root, store);
    return { accepted: false, reason: COMPILER_RAW_PRIVATE_DENIED, transfer, at: now };
  }

  if (
    input.assetClass === 'unapproved' ||
    !APPROVED_CLASSES.includes(input.assetClass) ||
    !sourceOk ||
    !targetOk
  ) {
    const transfer: CompilerTransfer = {
      id: id('cuic'),
      sourceUniverseId: input.sourceUniverseId,
      targetUniverseId: input.targetUniverseId,
      assetClass: input.assetClass,
      assetRef: input.assetRef,
      authorizedUniverses: [...authorized],
      status: 'DENIED',
      reason: COMPILER_UNAPPROVED_DENIED,
      at: now,
    };
    store.transfers.push(transfer);
    await save(input.root, store);
    return { accepted: false, reason: COMPILER_UNAPPROVED_DENIED, transfer, at: now };
  }

  const transfer: CompilerTransfer = {
    id: id('cuic'),
    sourceUniverseId: input.sourceUniverseId,
    targetUniverseId: input.targetUniverseId,
    assetClass: input.assetClass,
    assetRef: input.assetRef.trim() || 'asset',
    authorizedUniverses: [...authorized],
    status: 'COMPILED',
    reason: 'SCOPED_APPROVED_CROSS_UNIVERSE_COMPILE_ACCEPTED',
    at: now,
  };
  store.transfers.push(transfer);
  await save(input.root, store);
  return { accepted: true, reason: transfer.reason, transfer, at: now };
}
