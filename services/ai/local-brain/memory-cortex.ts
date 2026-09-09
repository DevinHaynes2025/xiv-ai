import type { ClaimState } from './knowledge-domains';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type MemoryPartition = 'world' | 'business' | 'personal' | 'company';
export type MemoryKind = 'episode' | 'fact' | 'lesson' | 'contradiction' | 'scenario' | 'outcome' | 'council';
export type RetentionClass = 'ephemeral' | 'working' | 'durable' | 'archival';

export const RETENTION_TTL_MS: Record<RetentionClass, number | null> = {
  ephemeral: 60 * 60_000,
  working: 7 * 24 * 60 * 60_000,
  durable: 90 * 24 * 60 * 60_000,
  archival: null,
};

export const MAX_CORTEX_TRACES = 10_000;

export type CortexTrace = {
  id: string;
  tenantId: string;
  universeId: string;
  partition: MemoryPartition;
  kind: MemoryKind;
  claimState: ClaimState;
  label: string;
  summary: string;
  validFrom: string;
  validTo?: string;
  forgottenAt?: string;
  retentionClass: RetentionClass;
  expiresAt?: string;
  pathwayStrength: number;
  evidenceRefs: string[];
  sourceRefs: string[];
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  createdAt: string;
  updatedAt: string;
  productionAuthorization: false;
};

type CortexStore = { traces: CortexTrace[] };

function storePath(root: string) {
  return xivLocalPath(root, 'memory-cortex.json');
}

async function load(root: string): Promise<CortexTrace[]> {
  const parsed = await readJsonFile<CortexStore>(storePath(root), { traces: [] });
  return Array.isArray(parsed.traces) ? parsed.traces : [];
}

async function save(root: string, traces: CortexTrace[]) {
  await writeJsonFileAtomic(storePath(root), { traces: traces.slice(-MAX_CORTEX_TRACES) });
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function matchesScope(trace: CortexTrace, tenantId: string, universeId: string) {
  return trace.tenantId === tenantId && trace.universeId === universeId;
}

function isVisibleAt(trace: CortexTrace, asOf: string, includeForgotten: boolean) {
  if (trace.validFrom > asOf) return false;
  if (trace.validTo && trace.validTo < asOf) return false;
  if (trace.forgottenAt && !includeForgotten) return false;
  return true;
}

export async function rememberCortexTrace(input: {
  tenantId: string;
  universeId: string;
  partition: MemoryPartition;
  kind: MemoryKind;
  claimState: ClaimState;
  label: string;
  summary: string;
  validFrom?: string;
  validTo?: string;
  retentionClass?: RetentionClass;
  pathwayStrength?: number;
  evidenceRefs?: string[];
  sourceRefs?: string[];
  classification?: CortexTrace['classification'];
  now?: string;
  root?: string;
}): Promise<CortexTrace> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.label.trim() || !input.summary.trim()) throw new Error('CORTEX_TRACE_CONTENT_REQUIRED');
  if ((input.partition === 'personal' || input.partition === 'company') && input.classification === 'public') {
    throw new Error('PRIVATE_PARTITION_CANNOT_BE_PUBLIC_WORLD');
  }
  const root = input.root ?? process.cwd();
  const now = input.now ?? new Date().toISOString();
  const retentionClass = input.retentionClass ?? 'working';
  const ttl = RETENTION_TTL_MS[retentionClass];
  const trace: CortexTrace = {
    id: cortexId('mem'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    kind: input.kind,
    claimState: input.claimState,
    label: input.label.trim(),
    summary: input.summary.trim(),
    validFrom: input.validFrom ?? now,
    validTo: input.validTo,
    retentionClass,
    expiresAt: ttl === null ? undefined : new Date(Date.parse(now) + ttl).toISOString(),
    pathwayStrength: clamp01(input.pathwayStrength ?? 0.35),
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    sourceRefs: [...(input.sourceRefs ?? [])],
    classification: input.classification ?? (input.partition === 'world' ? 'internal' : 'confidential'),
    createdAt: now,
    updatedAt: now,
    productionAuthorization: false,
  };
  const traces = await load(root);
  traces.push(trace);
  await save(root, traces);
  return trace;
}

export async function recallCortexTraces(input: {
  tenantId: string;
  universeId: string;
  query?: string;
  partition?: MemoryPartition;
  asOf?: string;
  includeForgotten?: boolean;
  root?: string;
}): Promise<CortexTrace[]> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const asOf = input.asOf ?? new Date().toISOString();
  const needle = input.query?.trim().toLowerCase() ?? '';
  const traces = await load(input.root ?? process.cwd());
  return traces.filter((trace) => {
    if (!matchesScope(trace, input.tenantId, input.universeId)) return false;
    if (input.partition && trace.partition !== input.partition) return false;
    if (!isVisibleAt(trace, asOf, input.includeForgotten === true)) return false;
    if (!needle) return true;
    return `${trace.label} ${trace.summary} ${trace.kind} ${trace.partition}`.toLowerCase().includes(needle);
  });
}

export async function strengthenCortexPathway(input: {
  id: string;
  tenantId: string;
  universeId: string;
  delta: number;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const traces = await load(root);
  const trace = traces.find((item) => item.id === input.id && matchesScope(item, input.tenantId, input.universeId));
  if (!trace) throw new Error('CORTEX_TRACE_NOT_FOUND');
  trace.pathwayStrength = clamp01(trace.pathwayStrength + input.delta);
  trace.updatedAt = new Date().toISOString();
  await save(root, traces);
  return trace;
}

export async function forgetCortexTrace(input: {
  id: string;
  tenantId: string;
  universeId: string;
  now?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const traces = await load(root);
  const trace = traces.find((item) => item.id === input.id && matchesScope(item, input.tenantId, input.universeId));
  if (!trace) throw new Error('CORTEX_TRACE_NOT_FOUND');
  const now = input.now ?? new Date().toISOString();
  trace.forgottenAt = now;
  trace.updatedAt = now;
  await save(root, traces);
  return trace;
}

export async function applyCortexRetention(input: {
  tenantId?: string;
  universeId?: string;
  now?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const now = input.now ?? new Date().toISOString();
  const traces = await load(root);
  let forgotten = 0;
  for (const trace of traces) {
    if (input.tenantId && trace.tenantId !== input.tenantId) continue;
    if (input.universeId && trace.universeId !== input.universeId) continue;
    if (trace.forgottenAt) continue;
    if (trace.kind === 'contradiction') continue;
    if (trace.expiresAt && trace.expiresAt <= now) {
      trace.forgottenAt = now;
      trace.updatedAt = now;
      forgotten += 1;
    }
  }
  await save(root, traces);
  return { forgotten, remainingVisible: traces.filter((trace) => !trace.forgottenAt).length };
}

export async function cortexMemoryStats(root = process.cwd()) {
  const traces = await load(root);
  const visible = traces.filter((trace) => !trace.forgottenAt);
  const byPartition = {
    world: visible.filter((trace) => trace.partition === 'world').length,
    business: visible.filter((trace) => trace.partition === 'business').length,
    personal: visible.filter((trace) => trace.partition === 'personal').length,
    company: visible.filter((trace) => trace.partition === 'company').length,
  };
  return {
    total: traces.length,
    visible: visible.length,
    forgotten: traces.length - visible.length,
    byPartition,
    productionAuthorization: false as const,
  };
}
