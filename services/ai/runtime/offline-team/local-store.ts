import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { OfflineWorkItem } from './work-queue';
import { OfflineWorkQueue } from './work-queue';
import { RecoveryJournal } from './recovery-journal';

export interface OfflineStorePaths {
  root: string;
  queueFile: string;
  journalFile: string;
}

export function defaultOfflineStorePaths(root = '.xiv-runtime'): OfflineStorePaths {
  return {
    root,
    queueFile: join(root, 'offline-work-queue.json'),
    journalFile: join(root, 'offline-recovery.jsonl'),
  };
}

async function atomicWrite(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  await writeFile(temp, content, { encoding: 'utf8' });
  await rename(temp, path);
}

export async function saveOfflineRuntime(input: {
  queue: OfflineWorkQueue;
  journal: RecoveryJournal;
  paths?: OfflineStorePaths;
}): Promise<void> {
  const paths = input.paths ?? defaultOfflineStorePaths();
  await atomicWrite(paths.queueFile, JSON.stringify(input.queue.snapshot(), null, 2));
  await atomicWrite(paths.journalFile, input.journal.toJsonLines());
}

export async function loadOfflineRuntime(paths = defaultOfflineStorePaths()): Promise<{
  queue: OfflineWorkQueue;
  journal: RecoveryJournal;
}> {
  const queue = new OfflineWorkQueue();
  const journal = new RecoveryJournal();

  try {
    const raw = await readFile(paths.queueFile, 'utf8');
    queue.restore(JSON.parse(raw) as OfflineWorkItem[]);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
  }

  try {
    const raw = await readFile(paths.journalFile, 'utf8');
    journal.restoreJsonLines(raw);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
  }

  return { queue, journal };
}

export const OFFLINE_STORE_GUARDRAILS = {
  localOnlyByDefault: true,
  secretsStored: false,
  productionDatabase: false,
  atomicFileReplace: true,
} as const;
