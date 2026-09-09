import { SEALED_REDACTION } from './ceo-sealed-vault';
import { consumeNetworkBudget } from './bandwidth-resource-governor';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import type { PackageKind } from './distributed-app-network-types';

export const EDGE_CACHE_FILE = 'edge-package-cache.json';
export const TELEMETRY_FILE = 'app-network-telemetry.json';
export const LOG_FILE = 'app-network-logs.json';

export type EdgeCacheEntry = {
  id: string;
  tenantId: string;
  universeId: string;
  nodeId: string;
  address: string;
  kind: PackageKind;
  byteLength: number;
  sealed: false;
  createdAt: string;
};

type CacheStore = { entries: EdgeCacheEntry[] };
type LogStore = { events: { at: string; event: string; address?: string; nodeId?: string; detail: string }[] };
type TelemetryStore = { counters: Record<string, number>; notes: string[] };

function cachePath(root: string) {
  return xivLocalPath(root, EDGE_CACHE_FILE);
}

function logPath(root: string) {
  return xivLocalPath(root, LOG_FILE);
}

function telemetryPath(root: string) {
  return xivLocalPath(root, TELEMETRY_FILE);
}

export async function appendAppNetworkLog(input: {
  root?: string;
  event: string;
  address?: string;
  nodeId?: string;
  detail: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<LogStore>(logPath(root), { events: [] });
  const events = Array.isArray(store.events) ? store.events : [];
  events.push({
    at: new Date().toISOString(),
    event: input.event,
    address: input.address,
    nodeId: input.nodeId,
    detail: input.detail.includes('SEALED_FOUNDER') ? SEALED_REDACTION : input.detail.slice(0, 180),
  });
  await writeJsonFileAtomic(logPath(root), { events: events.slice(-4_000) });
}

export async function bumpTelemetry(input: { root?: string; counter: string; note?: string }) {
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<TelemetryStore>(telemetryPath(root), { counters: {}, notes: [] });
  const counters = store.counters ?? {};
  counters[input.counter] = (counters[input.counter] ?? 0) + 1;
  const notes = Array.isArray(store.notes) ? store.notes : [];
  if (input.note) notes.push(input.note.includes('SEALED_FOUNDER') ? SEALED_REDACTION : input.note.slice(0, 120));
  await writeJsonFileAtomic(telemetryPath(root), { counters, notes: notes.slice(-200) });
}

export async function cacheEdgePackage(input: {
  tenantId: string;
  universeId: string;
  nodeId: string;
  address: string;
  kind: PackageKind;
  byteLength: number;
  sealed?: boolean;
  payloadPreview?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (input.sealed) {
    await appendAppNetworkLog({
      root,
      event: 'cache_denied_sealed',
      address: input.address,
      nodeId: input.nodeId,
      detail: SEALED_REDACTION,
    });
    await bumpTelemetry({ root, counter: 'cache_denied_sealed', note: 'sealed_redacted' });
    return { cached: false as const, reason: 'CEO Sealed Vault payloads cannot enter the edge cache.', redacted: SEALED_REDACTION };
  }
  const budget = await consumeNetworkBudget({
    nodeId: input.nodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    cacheBytes: input.byteLength,
    root,
  });
  if (!budget.allowed) {
    return { cached: false as const, reason: budget.reason };
  }
  const store = await readJsonFile<CacheStore>(cachePath(root), { entries: [] });
  const entries = Array.isArray(store.entries) ? store.entries : [];
  const duplicate = entries.find(
    (item) => item.address === input.address && item.nodeId === input.nodeId && item.tenantId === input.tenantId,
  );
  if (duplicate) {
    await bumpTelemetry({ root, counter: 'cache_dedup' });
    return { cached: true as const, duplicate: true as const, entry: duplicate, reason: 'Edge cache hit on content address.' };
  }
  const entry: EdgeCacheEntry = {
    id: `ecache_${input.address.slice(0, 12)}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    nodeId: input.nodeId,
    address: input.address,
    kind: input.kind,
    byteLength: input.byteLength,
    sealed: false,
    createdAt: new Date().toISOString(),
  };
  entries.push(entry);
  await writeJsonFileAtomic(cachePath(root), { entries: entries.slice(-2_000) });
  await appendAppNetworkLog({
    root,
    event: 'edge_cache_put',
    address: input.address,
    nodeId: input.nodeId,
    detail: `${input.kind}:${input.byteLength}b`,
  });
  await bumpTelemetry({ root, counter: 'cache_put', note: `addr:${input.address.slice(0, 8)}` });
  return { cached: true as const, duplicate: false as const, entry, reason: 'Cached by content address without payload copies of sealed data.' };
}

export async function listEdgeCache(root = process.cwd()) {
  const store = await readJsonFile<CacheStore>(cachePath(root), { entries: [] });
  return Array.isArray(store.entries) ? store.entries : [];
}
