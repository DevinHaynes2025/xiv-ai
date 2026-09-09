/**
 * 62L-DF Neural Growth Ledger —
 * Governed agent growth + neural change ledger (auditable).
 * Learning ≠ permission; growth cannot self-expand permissions.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DF_LOCKS,
  HONESTY_BANNER,
  MAX_NEURAL_LEDGER_ENTRIES,
  NEURAL_GROWTH_PERMISSION_EXPAND_DENIED,
  type DfActor,
} from './human-centered-superbrain-ux-types';

export type NeuralGrowthEntry = {
  id: string;
  ledgerId: string;
  agentId: string;
  changeSummary: string;
  permissionDeltaRequested: boolean;
  status: 'RECORDED' | 'DENIED';
  reason: string;
  auditable: true;
  learningGrantsPermission: false;
  at: string;
};

export type NeuralGrowthLedger = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

type Store = { ledgers: NeuralGrowthLedger[]; entries: NeuralGrowthEntry[] };

function storePath(root: string) {
  return xivLocalPath(root, 'neural-growth-ledger.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { ledgers: [], entries: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function neuralGrowthLedgerHonesty() {
  return {
    banner: HONESTY_BANNER,
    neuralGrowthSelfExpandsPermissions: DF_LOCKS.NEURAL_GROWTH_SELF_EXPANDS_PERMISSIONS,
    learningGrantsPermission: DF_LOCKS.LEARNING_GRANTS_PERMISSION,
    auditable: true as const,
  };
}

export async function bootstrapNeuralGrowthLedger(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DfActor;
}): Promise<NeuralGrowthLedger> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.ledgers.find(
    (l) =>
      l.orgId === input.orgId &&
      l.tenantId === input.tenantId &&
      l.universeId === input.universeId,
  );
  if (existing) return existing;
  const ledger: NeuralGrowthLedger = {
    id: id('dfng'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.ledgers.push(ledger);
  await save(input.root, store);
  return ledger;
}

export async function recordNeuralGrowth(input: {
  ledgerId: string;
  agentId: string;
  changeSummary: string;
  permissionDeltaRequested?: boolean;
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; entry?: NeuralGrowthEntry; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const ledger = store.ledgers.find((l) => l.id === input.ledgerId);
  if (!ledger) return { accepted: false, reason: 'NEURAL_GROWTH_LEDGER_NOT_FOUND', at: now };
  if (store.entries.length >= MAX_NEURAL_LEDGER_ENTRIES) {
    return { accepted: false, reason: 'MAX_NEURAL_LEDGER_ENTRIES_BOUNDED', at: now };
  }

  const permissionDeltaRequested = input.permissionDeltaRequested === true;

  if (permissionDeltaRequested || DF_LOCKS.NEURAL_GROWTH_SELF_EXPANDS_PERMISSIONS) {
    const entry: NeuralGrowthEntry = {
      id: id('dfge'),
      ledgerId: ledger.id,
      agentId: (input.agentId ?? '').trim() || 'unknown-agent',
      changeSummary: (input.changeSummary ?? '').trim() || 'permission-expansion-attempt',
      permissionDeltaRequested: true,
      status: 'DENIED',
      reason: NEURAL_GROWTH_PERMISSION_EXPAND_DENIED,
      auditable: true,
      learningGrantsPermission: false,
      at: now,
    };
    store.entries.push(entry);
    await save(input.root, store);
    return { accepted: false, reason: entry.reason, entry, at: now };
  }

  const entry: NeuralGrowthEntry = {
    id: id('dfge'),
    ledgerId: ledger.id,
    agentId: (input.agentId ?? '').trim() || 'unknown-agent',
    changeSummary: (input.changeSummary ?? '').trim() || 'governed-growth',
    permissionDeltaRequested: false,
    status: 'RECORDED',
    reason: 'NEURAL_GROWTH_RECORDED_AUDITABLE_NO_PERMISSION_GRANT',
    auditable: true,
    learningGrantsPermission: false,
    at: now,
  };
  store.entries.push(entry);
  await save(input.root, store);
  return { accepted: true, reason: entry.reason, entry, at: now };
}
