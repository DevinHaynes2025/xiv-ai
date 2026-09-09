import { randomUUID } from 'node:crypto';

import { SEALED_REDACTION } from './ceo-sealed-vault';
import {
  contentAddress,
  envelopeMac,
  getContentAddressed,
  putContentAddressed,
  verifyContentIntegrity,
} from './content-addressed-store';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import type { AppNetworkClassification, PackageKind, TransferState } from './distributed-app-network-types';
import { getAppNetworkNode, isPeerAuthorized, isPeerEligible } from './compromised-node-quarantine';
import { consumeNetworkBudget } from './bandwidth-resource-governor';
import { cacheEdgePackage } from './edge-package-cache';
import { requireEncryptedTransport } from './encrypted-transport';

export const TRANSFER_FILE = 'resumable-transfers.json';
export const DEFAULT_CHUNK_CHARS = 24;

export type TransferChunk = {
  index: number;
  bytes: string;
  received: boolean;
};

export type TransferEnvelope = {
  id: string;
  transferId: string;
  tenantId: string;
  universeId: string;
  fromNodeId: string;
  toNodeId: string;
  address: string;
  kind: PackageKind;
  mac: string;
  bodyPreview: string;
  sealedRedacted: true;
  classification: Exclude<AppNetworkClassification, 'sealed_founder_priority'>;
  createdAt: string;
};

export type ResumableTransfer = {
  id: string;
  tenantId: string;
  universeId: string;
  fromNodeId: string;
  toNodeId: string;
  kind: PackageKind;
  address: string;
  totalChunks: number;
  receivedIndexes: number[];
  state: TransferState;
  integrity: 'PASS' | 'FAIL' | 'NOT_TESTED';
  activated: boolean;
  authorityGranted: false;
  l4AutonomyEnabled: false;
  createdAt: string;
  updatedAt: string;
  reason: string;
};

type TransferStore = { transfers: ResumableTransfer[]; envelopes: TransferEnvelope[]; chunks: Record<string, TransferChunk[]> };

const MAX_TRANSFERS = 2_000;

function storePath(root: string) {
  return xivLocalPath(root, TRANSFER_FILE);
}

async function load(root: string): Promise<TransferStore> {
  const parsed = await readJsonFile<TransferStore>(storePath(root), { transfers: [], envelopes: [], chunks: {} });
  return {
    transfers: Array.isArray(parsed.transfers) ? parsed.transfers : [],
    envelopes: Array.isArray(parsed.envelopes) ? parsed.envelopes : [],
    chunks: parsed.chunks && typeof parsed.chunks === 'object' ? parsed.chunks : {},
  };
}

async function save(root: string, store: TransferStore) {
  await writeJsonFileAtomic(storePath(root), {
    transfers: store.transfers.slice(-MAX_TRANSFERS),
    envelopes: store.envelopes.slice(-MAX_TRANSFERS),
    chunks: store.chunks,
  });
}

function chunkBytes(bytes: string, size: number): TransferChunk[] {
  const chunks: TransferChunk[] = [];
  for (let index = 0; index * size < bytes.length; index += 1) {
    chunks.push({ index, bytes: bytes.slice(index * size, (index + 1) * size), received: false });
  }
  return chunks.length ? chunks : [{ index: 0, bytes: '', received: false }];
}

export async function startResumableTransfer(input: {
  tenantId: string;
  universeId: string;
  fromNodeId: string;
  toNodeId: string;
  kind: PackageKind;
  bytes: string;
  classification?: AppNetworkClassification;
  sealed?: boolean;
  chunkChars?: number;
  destinationOnline?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  if (input.sealed || input.classification === 'sealed_founder_priority') {
    return {
      accepted: false as const,
      state: 'denied' as const,
      reason: 'Sealed founder-priority bytes cannot enter a transfer envelope.',
      envelope: { bodyPreview: SEALED_REDACTION, sealedRedacted: true as const },
    };
  }

  const from = await getAppNetworkNode({ nodeId: input.fromNodeId, tenantId: input.tenantId, universeId: input.universeId, root });
  const to = await getAppNetworkNode({ nodeId: input.toNodeId, tenantId: input.tenantId, universeId: input.universeId, root });
  if (!from || !to) {
    return { accepted: false as const, state: 'denied' as const, reason: 'Both source and destination nodes must be registered.' };
  }
  if (!isPeerEligible(from) || !isPeerAuthorized(to)) {
    return {
      accepted: false as const,
      state: 'denied' as const,
      reason: 'Transfers require authorized, verified, non-quarantined peers. Installation/sync does not grant authority.',
    };
  }

  const budget = await consumeNetworkBudget({
    nodeId: input.fromNodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    bytes: Buffer.byteLength(input.bytes),
    transfers: 1,
    root,
  });
  if (!budget.allowed) {
    return { accepted: false as const, state: 'denied' as const, reason: budget.reason };
  }

  const stored = await putContentAddressed({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    bytes: input.bytes,
    classification: input.classification,
    root,
  });
  if (!stored.accepted || !stored.object) {
    return { accepted: false as const, state: 'denied' as const, reason: stored.reason };
  }

  const chunkSize = Math.max(8, input.chunkChars ?? DEFAULT_CHUNK_CHARS);
  const chunks = chunkBytes(input.bytes, chunkSize);
  const id = `xfer_${randomUUID()}`;
  const preview = `${input.kind}:${stored.object.address.slice(0, 12)}`;
  const envelope: TransferEnvelope = {
    id: `tenv_${randomUUID()}`,
    transferId: id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    address: stored.object.address,
    kind: input.kind,
    mac: envelopeMac(id, preview),
    bodyPreview: preview,
    sealedRedacted: true,
    classification: stored.object.classification,
    createdAt: new Date().toISOString(),
  };
  const transport = requireEncryptedTransport(envelope);
  if (!transport.ok) {
    return { accepted: false as const, state: 'denied' as const, reason: transport.reason };
  }

  const held = input.destinationOnline === false || !to.online;
  const transfer: ResumableTransfer = {
    id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    kind: input.kind,
    address: stored.object.address,
    totalChunks: chunks.length,
    receivedIndexes: [],
    state: held ? 'held_offline' : stored.duplicate ? 'deduplicated' : 'queued',
    integrity: 'NOT_TESTED',
    activated: false,
    authorityGranted: false,
    l4AutonomyEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reason: held
      ? 'Destination offline; store-and-forward holds chunks until resume.'
      : stored.duplicate
        ? 'Content-addressed duplicate; transfer skipped byte copy.'
        : 'Transfer queued.',
  };

  const store = await load(root);
  store.transfers.push(transfer);
  store.envelopes.push(envelope);
  store.chunks[id] = chunks;
  await save(root, store);
  return {
    accepted: true as const,
    transfer,
    envelope,
    duplicate: stored.duplicate,
    totalChunks: chunks.length,
  };
}

export async function resumeTransfer(input: {
  transferId: string;
  tenantId: string;
  universeId: string;
  maxChunks?: number;
  tamperBytes?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const transfer = store.transfers.find(
    (item) => item.id === input.transferId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!transfer) return { ok: false as const, state: 'failed' as const, reason: 'Transfer not found.' };
  const to = await getAppNetworkNode({
    nodeId: transfer.toNodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  if (!to || !isPeerEligible(to)) {
    transfer.state = 'denied';
    transfer.reason = 'Destination peer is quarantined, unverified, or unauthorized.';
    transfer.updatedAt = new Date().toISOString();
    await save(root, store);
    return { ok: false as const, transfer, reason: transfer.reason };
  }

  const chunks = store.chunks[transfer.id] ?? [];
  const limit = Math.max(1, input.maxChunks ?? chunks.length);
  let received = 0;
  for (const chunk of chunks) {
    if (chunk.received) continue;
    if (received >= limit) break;
    chunk.received = true;
    if (!transfer.receivedIndexes.includes(chunk.index)) transfer.receivedIndexes.push(chunk.index);
    received += 1;
  }
  transfer.receivedIndexes.sort((a, b) => a - b);
  transfer.state = transfer.receivedIndexes.length >= transfer.totalChunks ? 'in_flight' : 'resumed';
  transfer.reason = `Resumed ${received} chunk(s); ${transfer.receivedIndexes.length}/${transfer.totalChunks} received.`;
  transfer.updatedAt = new Date().toISOString();

  if (transfer.receivedIndexes.length >= transfer.totalChunks) {
    const assembled = chunks
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((chunk) => chunk.bytes)
      .join('');
    const bytes = input.tamperBytes ?? assembled;
    const integrity = await verifyContentIntegrity({
      address: transfer.address,
      tenantId: input.tenantId,
      universeId: input.universeId,
      bytes,
      root,
    });
    transfer.integrity = integrity.ok ? 'PASS' : 'FAIL';
    transfer.state = integrity.ok ? 'integrity_verified' : 'failed';
    transfer.reason = integrity.reason;
    if (integrity.ok) {
      await cacheEdgePackage({
        tenantId: input.tenantId,
        universeId: input.universeId,
        nodeId: transfer.toNodeId,
        address: transfer.address,
        kind: transfer.kind,
        byteLength: Buffer.byteLength(assembled),
        root,
      });
    }
  }

  await save(root, store);
  return { ok: true as const, transfer, received };
}

export async function activateVerifiedTransfer(input: {
  transferId: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const transfer = store.transfers.find(
    (item) => item.id === input.transferId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!transfer) return { activated: false as const, reason: 'Transfer not found.' };
  if (transfer.integrity !== 'PASS' || transfer.state !== 'integrity_verified') {
    return {
      activated: false as const,
      authorityGranted: false as const,
      reason: 'Local activation requires integrity verification. Failed or incomplete transfers stay inert.',
      transfer,
    };
  }
  transfer.state = 'activated';
  transfer.activated = true;
  transfer.authorityGranted = false;
  transfer.l4AutonomyEnabled = false;
  transfer.reason = 'Activated locally. Installation does not grant authority, L4, or founder identity.';
  transfer.updatedAt = new Date().toISOString();
  await save(root, store);
  return { activated: true as const, authorityGranted: false as const, l4AutonomyEnabled: false as const, transfer };
}

export async function listTransferEnvelopes(root = process.cwd()) {
  const store = await load(root);
  return store.envelopes;
}

export async function getTransfer(input: { transferId: string; tenantId: string; universeId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return store.transfers.find(
    (item) => item.id === input.transferId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  ) ?? null;
}

export { contentAddress, getContentAddressed };
