import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import type { SyncConflictReviewItem } from './device-sync-review-console';

export interface SyncReviewJournalRecord {
  sequence: number;
  recordedAt: string;
  tenantId: string;
  reviewId: string;
  previousHash: string | null;
  recordHash: string;
  item: SyncConflictReviewItem;
}

function safeSegment(value: string): string {
  if (!/^[A-Za-z0-9._-]+$/.test(value)) throw new Error('UNSAFE_PATH_SEGMENT');
  return value;
}

function tenantJournalPath(rootDir: string, tenantId: string): string {
  const root = resolve(rootDir);
  const tenantDir = resolve(root, safeSegment(tenantId));
  if (tenantDir !== root && !tenantDir.startsWith(`${root}${sep}`)) throw new Error('PATH_TRAVERSAL_BLOCKED');
  return join(tenantDir, 'device-sync-review.journal.jsonl');
}

function canonicalPayload(record: Omit<SyncReviewJournalRecord, 'recordHash'>): string {
  return JSON.stringify(record);
}

function hashRecord(record: Omit<SyncReviewJournalRecord, 'recordHash'>): string {
  return createHash('sha256').update(canonicalPayload(record), 'utf8').digest('hex');
}

export async function readSyncReviewJournal(rootDir: string, tenantId: string): Promise<SyncReviewJournalRecord[]> {
  const path = tenantJournalPath(rootDir, tenantId);
  let text = '';
  try {
    text = await readFile(path, 'utf8');
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  const records = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as SyncReviewJournalRecord);

  let previousHash: string | null = null;
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (record.sequence !== index + 1) throw new Error('SYNC_REVIEW_JOURNAL_SEQUENCE_INVALID');
    if (record.tenantId !== tenantId) throw new Error('SYNC_REVIEW_JOURNAL_TENANT_MISMATCH');
    if (record.previousHash !== previousHash) throw new Error('SYNC_REVIEW_JOURNAL_CHAIN_BROKEN');
    const { recordHash, ...unsigned } = record;
    if (hashRecord(unsigned) !== recordHash) throw new Error('SYNC_REVIEW_JOURNAL_HASH_INVALID');
    previousHash = recordHash;
  }
  return records;
}

export async function appendSyncReviewJournal(
  rootDir: string,
  tenantId: string,
  item: SyncConflictReviewItem,
  recordedAt = new Date().toISOString(),
): Promise<SyncReviewJournalRecord> {
  if (item.tenantId !== tenantId) throw new Error('SYNC_REVIEW_ITEM_TENANT_MISMATCH');
  const existing = await readSyncReviewJournal(rootDir, tenantId);
  const previousHash = existing.length ? existing[existing.length - 1].recordHash : null;
  const unsigned: Omit<SyncReviewJournalRecord, 'recordHash'> = {
    sequence: existing.length + 1,
    recordedAt,
    tenantId,
    reviewId: item.reviewId,
    previousHash,
    item,
  };
  const record: SyncReviewJournalRecord = { ...unsigned, recordHash: hashRecord(unsigned) };
  const path = tenantJournalPath(rootDir, tenantId);
  await mkdir(resolve(path, '..'), { recursive: true, mode: 0o700 });
  await appendFile(path, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 });
  return record;
}

export async function restoreLatestSyncReviews(rootDir: string, tenantId: string): Promise<SyncConflictReviewItem[]> {
  const records = await readSyncReviewJournal(rootDir, tenantId);
  const latest = new Map<string, SyncConflictReviewItem>();
  for (const record of records) latest.set(record.reviewId, record.item);
  return [...latest.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}
