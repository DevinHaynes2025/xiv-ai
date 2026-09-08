import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { ClaimState } from './knowledge-domains';

export type LearningEntry = {
  id: string;
  domain: string;
  subject: string;
  claimState: ClaimState;
  summary: string;
  sourceRefs: string[];
  evidence: string[];
  confidence?: number;
  learnedAt: string;
  expiresAt?: string;
  taskId?: string;
  meetingId?: string;
  permissionChange: false;
  productionChange: false;
};

function ledgerPath(root = process.cwd()) {
  return join(root, '.xiv-local', 'learning-ledger.json');
}

async function load(path: string): Promise<LearningEntry[]> {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LearningEntry[]) : [];
  } catch {
    return [];
  }
}

async function save(path: string, entries: LearningEntry[]) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(entries, null, 2), 'utf8');
}

export async function appendLearning(entry: Omit<LearningEntry, 'id' | 'learnedAt' | 'permissionChange' | 'productionChange'>, root?: string) {
  const path = ledgerPath(root);
  const entries = await load(path);
  const next: LearningEntry = {
    ...entry,
    id: `learn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    learnedAt: new Date().toISOString(),
    confidence: entry.confidence === undefined ? undefined : Math.max(0, Math.min(1, entry.confidence)),
    permissionChange: false,
    productionChange: false,
  };
  entries.push(next);
  await save(path, entries.slice(-10_000));
  return next;
}

export async function searchLearning(query: string, root?: string) {
  const path = ledgerPath(root);
  const entries = await load(path);
  const needle = query.trim().toLowerCase();
  if (!needle) return entries.slice(-50);
  return entries
    .filter((entry) => `${entry.domain} ${entry.subject} ${entry.summary}`.toLowerCase().includes(needle))
    .slice(-50);
}
