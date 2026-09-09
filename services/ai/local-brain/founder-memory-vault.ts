import { randomUUID } from 'node:crypto';

import { readApprovedContext } from './context-vault';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';

export type FounderMemoryKind = 'preference' | 'decision' | 'lesson' | 'assumption' | 'context_excerpt';

export type FounderMemoryRecord = {
  id: string;
  twinId: string;
  founderId: string;
  tenantId: string;
  universeId: string;
  kind: FounderMemoryKind;
  subject: string;
  summary: string;
  sourceRefs: string[];
  classification: 'internal';
  containsSecret: false;
  createdAt: string;
};

type VaultStore = { memories: FounderMemoryRecord[] };

const MAX_MEMORIES = 5_000;
const SECRET_MARKERS = ['.env', 'id_rsa', 'credential', 'api_key', 'secret', 'password', 'token='];

function vaultPath(root: string) {
  return xivLocalPath(root, 'founder-memory-vault.json');
}

function looksSecret(text: string) {
  const lower = text.toLowerCase();
  return SECRET_MARKERS.some((marker) => lower.includes(marker));
}

export async function rememberFounderMemory(input: {
  twinId: string;
  founderId: string;
  tenantId: string;
  universeId: string;
  kind: FounderMemoryKind;
  subject: string;
  summary: string;
  sourceRefs?: string[];
  root?: string;
}): Promise<{ accepted: true; record: FounderMemoryRecord } | { accepted: false; reason: string }> {
  if (!input.twinId || !input.founderId || !input.tenantId || !input.universeId) {
    return { accepted: false, reason: 'FOUNDER_MEMORY_SCOPE_REQUIRED' };
  }
  if (!input.subject.trim() || !input.summary.trim()) {
    return { accepted: false, reason: 'FOUNDER_MEMORY_CONTENT_REQUIRED' };
  }
  if (looksSecret(`${input.subject} ${input.summary}`)) {
    return { accepted: false, reason: 'FOUNDER_MEMORY_SECRET_DENIED' };
  }

  const record: FounderMemoryRecord = {
    id: `fmem_${randomUUID()}`,
    twinId: input.twinId,
    founderId: input.founderId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    subject: input.subject.trim(),
    summary: input.summary.trim().slice(0, 8_000),
    sourceRefs: [...(input.sourceRefs ?? [])],
    classification: 'internal',
    containsSecret: false,
    createdAt: new Date().toISOString(),
  };

  const root = input.root ?? process.cwd();
  const store = await readJsonFile<VaultStore>(vaultPath(root), { memories: [] });
  const memories = Array.isArray(store.memories) ? store.memories : [];
  memories.push(record);
  await writeJsonFileAtomic(vaultPath(root), { memories: memories.slice(-MAX_MEMORIES) });
  return { accepted: true, record };
}

export async function recallFounderMemories(input: {
  tenantId: string;
  universeId: string;
  founderId?: string;
  query?: string;
  root?: string;
}) {
  const store = await readJsonFile<VaultStore>(vaultPath(input.root ?? process.cwd()), { memories: [] });
  const memories = Array.isArray(store.memories) ? store.memories : [];
  const needle = (input.query ?? '').trim().toLowerCase();
  return memories.filter((memory) => {
    if (memory.tenantId !== input.tenantId || memory.universeId !== input.universeId) return false;
    if (input.founderId && memory.founderId !== input.founderId) return false;
    if (!needle) return true;
    return `${memory.subject} ${memory.summary}`.toLowerCase().includes(needle);
  });
}

export async function rememberApprovedContextExcerpt(input: {
  twinId: string;
  founderId: string;
  tenantId: string;
  universeId: string;
  repoRoot: string;
  requestedPath: string;
  subject: string;
}) {
  const excerpt = await readApprovedContext(input.repoRoot, input.requestedPath);
  return rememberFounderMemory({
    twinId: input.twinId,
    founderId: input.founderId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'context_excerpt',
    subject: input.subject,
    summary: excerpt.content.slice(0, 4_000),
    sourceRefs: [`context:${excerpt.path}`],
    root: input.repoRoot,
  });
}
