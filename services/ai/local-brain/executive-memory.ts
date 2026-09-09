import { appendLearning } from './learning-ledger';
import {
  recallCortexTraces,
  rememberCortexTrace,
  strengthenCortexPathway,
  type CortexTrace,
} from './memory-cortex';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type ExecutiveMemoryEntry = {
  id: string;
  tenantId: string;
  universeId: string;
  sourceTraceIds: string[];
  label: string;
  summary: string;
  evidenceRefs: string[];
  consolidatedAt: string;
  productionAuthorization: false;
};

type Store = { entries: ExecutiveMemoryEntry[] };

function storePath(root: string) {
  return xivLocalPath(root, 'executive-memory.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(storePath(root), { entries: [] });
  return Array.isArray(parsed.entries) ? parsed.entries : [];
}

async function save(root: string, entries: ExecutiveMemoryEntry[]) {
  await writeJsonFileAtomic(storePath(root), { entries: entries.slice(-10_000) });
}

export async function consolidateExecutiveMemory(input: {
  tenantId: string;
  universeId: string;
  query?: string;
  root?: string;
}): Promise<ExecutiveMemoryEntry> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const traces = await recallCortexTraces({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.query,
    root,
  });
  if (traces.length === 0) {
    const empty: ExecutiveMemoryEntry = {
      id: cortexId('emem'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      sourceTraceIds: [],
      label: 'empty-consolidation',
      summary: 'No visible Memory Cortex traces were available to consolidate. Nothing was invented.',
      evidenceRefs: [],
      consolidatedAt: new Date().toISOString(),
      productionAuthorization: false,
    };
    const entries = await load(root);
    entries.push(empty);
    await save(root, entries);
    return empty;
  }

  const evidenceRefs = [...new Set(traces.flatMap((trace) => trace.evidenceRefs))];
  const entry: ExecutiveMemoryEntry = {
    id: cortexId('emem'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    sourceTraceIds: traces.map((trace) => trace.id),
    label: `consolidated:${traces.length}`,
    summary: traces.map((trace) => trace.summary).join(' | ').slice(0, 4_000),
    evidenceRefs,
    consolidatedAt: new Date().toISOString(),
    productionAuthorization: false,
  };
  const durable = await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'lesson',
    claimState: evidenceRefs.length ? 'VERIFIED_FACT' : 'UNKNOWN',
    label: entry.label,
    summary: entry.summary,
    evidenceRefs,
    sourceRefs: traces.flatMap((trace) => trace.sourceRefs),
    retentionClass: 'durable',
    root,
  });
  for (const trace of traces.slice(0, 25)) {
    await strengthenCortexPathway({
      id: trace.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      delta: 0.05,
      root,
    });
  }
  await appendLearning({
    domain: 'operations',
    subject: `executive-memory:${entry.id}`,
    claimState: evidenceRefs.length ? 'VERIFIED_FACT' : 'UNKNOWN',
    summary: `consolidated ${traces.length} traces into ${durable.id}`,
    sourceRefs: evidenceRefs,
    evidence: evidenceRefs,
  }, root);
  const entries = await load(root);
  entries.push(entry);
  await save(root, entries);
  return entry;
}

export async function listExecutiveMemory(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}): Promise<ExecutiveMemoryEntry[]> {
  const entries = await load(input.root ?? process.cwd());
  return entries.filter((entry) => entry.tenantId === input.tenantId && entry.universeId === input.universeId);
}

export function tracesForPriority(traces: CortexTrace[]) {
  return [...traces].sort((a, b) => b.pathwayStrength - a.pathwayStrength);
}
