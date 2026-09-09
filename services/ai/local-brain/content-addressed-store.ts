import { createHash, createHmac } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { CEO_SEALED_VAULT_FILE, SEALED_REDACTION } from './ceo-sealed-vault';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import type { AppNetworkClassification, PackageKind } from './distributed-app-network-types';

export const CAS_FILE = 'content-addressed-store.json';

export type CasObject = {
  address: string;
  tenantId: string;
  universeId: string;
  kind: PackageKind;
  classification: Exclude<AppNetworkClassification, 'sealed_founder_priority'>;
  byteLength: number;
  createdAt: string;
  sealed: false;
  productionAuthorization: false;
};

type CasStore = { objects: CasObject[]; blobs: Record<string, string> };

const MAX_OBJECTS = 4_000;
const MAX_BLOB_CHARS = 64_000;

function storePath(root: string) {
  return xivLocalPath(root, CAS_FILE);
}

async function load(root: string): Promise<CasStore> {
  const parsed = await readJsonFile<CasStore>(storePath(root), { objects: [], blobs: {} });
  return {
    objects: Array.isArray(parsed.objects) ? parsed.objects : [],
    blobs: parsed.blobs && typeof parsed.blobs === 'object' ? parsed.blobs : {},
  };
}

async function save(root: string, store: CasStore) {
  const addresses = new Set(store.objects.slice(-MAX_OBJECTS).map((item) => item.address));
  const blobs: Record<string, string> = {};
  for (const address of addresses) {
    if (store.blobs[address] !== undefined) blobs[address] = store.blobs[address];
  }
  await writeJsonFileAtomic(storePath(root), { objects: store.objects.slice(-MAX_OBJECTS), blobs });
}

export function contentAddress(bytes: string) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function envelopeMac(transferId: string, body: string) {
  return createHmac('sha256', `xiv-appnet:${transferId}`).update(body).digest('hex');
}

export async function putContentAddressed(input: {
  tenantId: string;
  universeId: string;
  kind: PackageKind;
  bytes: string;
  classification?: AppNetworkClassification;
  sealed?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.bytes) throw new Error('CAS_BYTES_REQUIRED');
  if (input.sealed || input.classification === 'sealed_founder_priority') {
    return {
      accepted: false as const,
      state: 'DENIED' as const,
      reason: 'CEO Sealed Vault content cannot enter the content-addressed transfer plane.',
      address: null,
      redacted: SEALED_REDACTION,
    };
  }
  const bytes = input.bytes.slice(0, MAX_BLOB_CHARS);
  const address = contentAddress(bytes);
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const existing = store.objects.find(
    (item) => item.address === address && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (existing) {
    return {
      accepted: true as const,
      state: 'deduplicated' as const,
      reason: 'Content-addressed object already present; bytes not stored twice.',
      object: existing,
      duplicate: true as const,
    };
  }
  const object: CasObject = {
    address,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    classification: input.classification ?? 'internal',
    byteLength: Buffer.byteLength(bytes),
    createdAt: new Date().toISOString(),
    sealed: false,
    productionAuthorization: false,
  };
  store.objects.push(object);
  store.blobs[address] = bytes;
  await save(root, store);
  return { accepted: true as const, state: 'stored' as const, reason: 'Stored by content address.', object, duplicate: false as const };
}

export async function getContentAddressed(input: {
  address: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  const object = store.objects.find(
    (item) => item.address === input.address && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!object) return { found: false as const, object: null, bytes: null };
  return { found: true as const, object, bytes: store.blobs[object.address] ?? null };
}

export async function verifyContentIntegrity(input: {
  address: string;
  tenantId: string;
  universeId: string;
  bytes: string;
  root?: string;
}) {
  const stored = await getContentAddressed(input);
  const actual = contentAddress(input.bytes);
  if (!stored.found) {
    return { ok: false as const, state: 'FAIL' as const, reason: 'CAS object missing for integrity check.', address: input.address };
  }
  if (actual !== input.address || stored.bytes !== input.bytes) {
    return { ok: false as const, state: 'FAIL' as const, reason: 'Content-address mismatch; transfer must not activate.', address: input.address };
  }
  return { ok: true as const, state: 'PASS' as const, reason: 'Reassembled bytes match the content address.', address: input.address };
}

export async function scanXivLocalForToken(input: {
  root: string;
  token: string;
  allowFiles?: string[];
}) {
  const dir = xivLocalPath(input.root, '');
  const allow = new Set(input.allowFiles ?? [CEO_SEALED_VAULT_FILE]);
  const hits: { file: string; leaked: boolean }[] = [];
  let files: string[] = [];
  try {
    files = await readdir(dir);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return { scanned: 0, leaks: [] as { file: string }[], leaked: false as const };
    throw error;
  }
  for (const file of files) {
    if (file.endsWith('.tmp')) continue;
    const text = await readFile(join(dir, file), 'utf8');
    const contains = text.includes(input.token);
    if (allow.has(file)) {
      hits.push({ file, leaked: false });
      continue;
    }
    if (contains) hits.push({ file, leaked: true });
  }
  const leaks = hits.filter((item) => item.leaked).map((item) => ({ file: item.file }));
  return { scanned: files.length, leaks, leaked: leaks.length > 0 };
}
