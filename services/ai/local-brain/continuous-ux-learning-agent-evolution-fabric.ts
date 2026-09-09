/**
 * 62L-DH Continuous UX Learning & Agent Evolution Fabric —
 * Explainable, reversible UX/agent evolution ledger.
 * Learning cannot self-grant authority; trusted status can roll back.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DH_LOCKS,
  EVOLUTION_ROLLBACK_OK,
  HONESTY_BANNER,
  LEARNING_AUTHORITY_SELF_GRANT_DENIED,
  MAX_EVOLUTION_ENTRIES,
  type DhActor,
} from './adaptive-life-business-intelligence-os-types';

export type UxAgentEvolutionFabric = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type EvolutionEntry = {
  id: string;
  fabricId: string;
  subjectId: string;
  changeSummary: string;
  explainable: true;
  reversible: true;
  trustedStatus: 'UNTRUSTED' | 'CANDIDATE' | 'TRUSTED' | 'ROLLED_BACK';
  authorityGrantRequested: boolean;
  status: 'RECORDED' | 'DENIED' | 'ROLLED_BACK';
  reason: string;
  priorTrustedStatus: 'UNTRUSTED' | 'CANDIDATE' | 'TRUSTED' | 'ROLLED_BACK' | null;
  at: string;
};

type Store = { fabrics: UxAgentEvolutionFabric[]; entries: EvolutionEntry[] };

function storePath(root: string) {
  return xivLocalPath(root, 'continuous-ux-learning-agent-evolution-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { fabrics: [], entries: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function continuousUxLearningAgentEvolutionHonesty() {
  return {
    banner: HONESTY_BANNER,
    learningSelfGrantsAuthority: DH_LOCKS.LEARNING_SELF_GRANTS_AUTHORITY,
    learningEqPermission: DH_LOCKS.LEARNING_EQ_PERMISSION,
    evolutionIrreversible: DH_LOCKS.UX_AGENT_EVOLUTION_IRREVERSIBLE,
    evolutionExplainableReversible: DH_LOCKS.UX_AGENT_EVOLUTION_EXPLAINABLE_REVERSIBLE,
    agentCannotSelfGrantAuthority: DH_LOCKS.AGENT_CANNOT_SELF_GRANT_AUTHORITY,
  };
}

export async function bootstrapContinuousUxLearningAgentEvolutionFabric(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DhActor;
}): Promise<UxAgentEvolutionFabric> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.fabrics.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;
  const fabric: UxAgentEvolutionFabric = {
    id: id('dhev'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.fabrics.push(fabric);
  await save(input.root, store);
  return fabric;
}

export async function recordUxAgentEvolution(input: {
  fabricId: string;
  subjectId: string;
  changeSummary: string;
  promoteTrusted?: boolean;
  authorityGrantRequested?: boolean;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; entry?: EvolutionEntry; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'EVOLUTION_FABRIC_NOT_FOUND', at: now };
  if (store.entries.length >= MAX_EVOLUTION_ENTRIES) {
    return { accepted: false, reason: 'MAX_EVOLUTION_ENTRIES_BOUNDED', at: now };
  }

  const authorityGrantRequested = input.authorityGrantRequested === true;

  if (authorityGrantRequested || DH_LOCKS.LEARNING_SELF_GRANTS_AUTHORITY) {
    const entry: EvolutionEntry = {
      id: id('dhee'),
      fabricId: fabric.id,
      subjectId: (input.subjectId ?? '').trim() || 'unknown-subject',
      changeSummary: (input.changeSummary ?? '').trim() || 'authority-grant-attempt',
      explainable: true,
      reversible: true,
      trustedStatus: 'UNTRUSTED',
      authorityGrantRequested: true,
      status: 'DENIED',
      reason: LEARNING_AUTHORITY_SELF_GRANT_DENIED,
      priorTrustedStatus: null,
      at: now,
    };
    store.entries.push(entry);
    await save(input.root, store);
    return { accepted: false, reason: entry.reason, entry, at: now };
  }

  const entry: EvolutionEntry = {
    id: id('dhee'),
    fabricId: fabric.id,
    subjectId: (input.subjectId ?? '').trim() || 'unknown-subject',
    changeSummary: (input.changeSummary ?? '').trim() || 'governed-evolution',
    explainable: true,
    reversible: true,
    trustedStatus: input.promoteTrusted === true ? 'TRUSTED' : 'CANDIDATE',
    authorityGrantRequested: false,
    status: 'RECORDED',
    reason: 'UX_AGENT_EVOLUTION_RECORDED_EXPLAINABLE_REVERSIBLE_NO_AUTHORITY_GRANT',
    priorTrustedStatus: null,
    at: now,
  };
  store.entries.push(entry);
  await save(input.root, store);
  return { accepted: true, reason: entry.reason, entry, at: now };
}

export async function rollbackUxAgentEvolution(input: {
  fabricId: string;
  entryId: string;
  root: string;
  actor: DhActor;
}): Promise<{ accepted: boolean; reason: string; entry?: EvolutionEntry; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'EVOLUTION_FABRIC_NOT_FOUND', at: now };
  const entry = store.entries.find(
    (e) => e.id === input.entryId && e.fabricId === fabric.id,
  );
  if (!entry) return { accepted: false, reason: 'EVOLUTION_ENTRY_NOT_FOUND', at: now };

  entry.priorTrustedStatus = entry.trustedStatus;
  entry.trustedStatus = 'ROLLED_BACK';
  entry.status = 'ROLLED_BACK';
  entry.reason = EVOLUTION_ROLLBACK_OK;
  entry.at = now;
  await save(input.root, store);
  return { accepted: true, reason: entry.reason, entry, at: now };
}
