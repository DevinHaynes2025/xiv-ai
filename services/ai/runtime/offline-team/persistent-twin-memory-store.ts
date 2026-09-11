import { mkdir, readFile, appendFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export type TwinClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface TwinMemoryRecord {
  tenantId: string;
  userId: string;
  memoryId: string;
  text: string;
  classification: TwinClassification;
  consentRef: string;
  evidenceRefs: string[];
  confidence: number;
  recallAllowed: boolean;
  createdAt: string;
}

const ROOT = resolve(process.cwd(), '.xiv-runtime', 'twins');

function userPath(tenantId: string, userId: string): string {
  const safe = `${tenantId}__${userId}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return resolve(ROOT, safe, 'memory.jsonl');
}

export async function appendTwinMemory(record: TwinMemoryRecord): Promise<string> {
  if (!record.consentRef) throw new Error('consentRef required');
  if (record.confidence < 0 || record.confidence > 1) throw new Error('invalid confidence');
  const file = userPath(record.tenantId, record.userId);
  await mkdir(dirname(file), { recursive: true });
  await appendFile(file, JSON.stringify(record) + '\n', 'utf8');
  return file;
}

export async function loadTwinMemory(tenantId: string, userId: string): Promise<TwinMemoryRecord[]> {
  try {
    const text = await readFile(userPath(tenantId, userId), 'utf8');
    return text.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line) as TwinMemoryRecord);
  } catch {
    return [];
  }
}

export const persistentTwinMemoryPolicy = {
  root: '.xiv-runtime/twins',
  localFirst: true,
  topSecretExternalSyncAllowed: false,
  silentCentralPoolingAllowed: false,
  productionMutationAllowed: false,
};
