/**
 * 62L-CT C — Distributed Knowledge Memory Compiler
 * Compile distributed knowledge/memory into governed packs/indexes (candidates).
 * Cannot auto-apply production schema. DB candidates NOT_APPLIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CT_LOCKS,
  HONESTY_BANNER,
  MEMORY_COMPILER_NO_AUTO_PROD,
  type CtActor,
} from './ai-research-civilization-os-types';

export type MemoryPack = {
  id: string;
  label: string;
  indexDigest: string;
  candidateOnly: true;
  appliedToProduction: false;
  status: 'candidate' | 'denied';
  reason: string;
  createdAt: string;
};

export type SchemaApplyAttempt = {
  id: string;
  packId: string;
  autoApplyRequested: boolean;
  status: 'denied' | 'not_applied';
  reason: string;
  at: string;
};

type Store = { packs: MemoryPack[]; applies: SchemaApplyAttempt[] };

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-knowledge-memory-compiler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { packs: [], applies: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function memoryCompilerHonesty() {
  return {
    banner: HONESTY_BANNER,
    autoApplyProdSchema: CT_LOCKS.MEMORY_COMPILER_AUTO_APPLY_PROD_SCHEMA,
    liveSupabaseApply: CT_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: CT_LOCKS.DB_CANDIDATES_APPLIED,
  };
}

export async function compileMemoryPack(input: {
  label: string;
  sources: string[];
  root: string;
  actor: CtActor;
}): Promise<MemoryPack> {
  const store = await load(input.root);
  const digest = `sha256:${Buffer.from(input.sources.join('|')).toString('hex').slice(0, 32)}`;
  const pack: MemoryPack = {
    id: id('pack'),
    label: input.label,
    indexDigest: digest,
    candidateOnly: true,
    appliedToProduction: false,
    status: 'candidate',
    reason: 'MEMORY_PACK_CANDIDATE_NOT_APPLIED',
    createdAt: new Date().toISOString(),
  };
  store.packs.push(pack);
  await save(input.root, store);
  void input.actor;
  return pack;
}

export async function attemptAutoApplyProductionSchema(input: {
  packId: string;
  autoApplyRequested?: boolean;
  root: string;
  actor: CtActor;
}): Promise<SchemaApplyAttempt> {
  const store = await load(input.root);
  const attempt: SchemaApplyAttempt = {
    id: id('schema'),
    packId: input.packId,
    autoApplyRequested: Boolean(input.autoApplyRequested ?? true),
    status: 'denied',
    reason: MEMORY_COMPILER_NO_AUTO_PROD,
    at: new Date().toISOString(),
  };
  store.applies.push(attempt);
  await save(input.root, store);
  void input.actor;
  return attempt;
}
