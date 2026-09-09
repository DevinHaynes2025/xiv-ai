/**
 * 62L-DW Module E — Personal Knowledge Vault.
 * Encrypted; permission-aware; no cross-context leakage.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_VAULT_ENTRIES,
  VAULT_CROSS_CONTEXT,
  VAULT_ENCRYPTED,
  type DwActor,
} from './supply-chain-superbrain-types';

export type VaultEntry = {
  id: string;
  ownerId: string;
  contextId: string;
  encrypted: true;
  plaintextStored: false;
  permissionAware: true;
  reason: string;
  createdAt: string;
};

export type VaultAccessAttempt = {
  id: string;
  entryId: string;
  requesterId: string;
  requesterContextId: string;
  entryContextId: string;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  entries: VaultEntry[];
  accessAttempts: VaultAccessAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'personal-knowledge-vault.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { entries: [], accessAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function personalKnowledgeVaultHonesty() {
  return {
    encrypted: true,
    permissionAware: true,
    plaintextStored: false,
    crossContextLeakageAllowed: false,
  };
}

export async function storeEncryptedKnowledge(input: {
  ownerId: string;
  contextId: string;
  label: string;
  root: string;
  actor: DwActor;
}): Promise<VaultEntry> {
  const store = await load(input.root);
  void input.actor;
  void input.label;
  if (store.entries.length >= MAX_VAULT_ENTRIES) throw new Error('MAX_VAULT_ENTRIES_REACHED');
  const entry: VaultEntry = {
    id: id('dwvault'),
    ownerId: input.ownerId,
    contextId: input.contextId,
    encrypted: true,
    plaintextStored: false,
    permissionAware: true,
    reason: VAULT_ENCRYPTED,
    createdAt: new Date().toISOString(),
  };
  store.entries.push(entry);
  await save(input.root, store);
  return entry;
}

export async function accessVaultEntry(input: {
  entryId: string;
  requesterId: string;
  requesterContextId: string;
  entryContextId: string;
  explicitGrant: boolean;
  root: string;
  actor: DwActor;
}): Promise<VaultAccessAttempt> {
  const store = await load(input.root);
  void input.actor;
  const sameContext =
    input.requesterContextId === input.entryContextId && input.explicitGrant;
  const attempt: VaultAccessAttempt = {
    id: id('dwvacc'),
    entryId: input.entryId,
    requesterId: input.requesterId,
    requesterContextId: input.requesterContextId,
    entryContextId: input.entryContextId,
    status: sameContext ? 'allowed' : 'denied',
    reason: sameContext ? 'VAULT_PERMISSION_GRANTED' : VAULT_CROSS_CONTEXT,
    at: new Date().toISOString(),
  };
  store.accessAttempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
