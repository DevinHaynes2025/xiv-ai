import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export interface MeetingFolderRecord {
  sourceFile: string;
  contentHash: string;
  tenantId: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  payload: unknown;
}

export interface MeetingFolderIngestionResult {
  ingested: MeetingFolderRecord[];
  skippedHashes: string[];
  errors: Array<{ file: string; error: string }>;
}

export async function ingestMeetingFolder(
  folder: string,
  tenantId: string,
  previouslySeen: ReadonlySet<string>,
): Promise<MeetingFolderIngestionResult> {
  const result: MeetingFolderIngestionResult = { ingested: [], skippedHashes: [], errors: [] };
  let entries: string[] = [];
  try {
    entries = (await fs.readdir(folder)).filter((name) => name.toLowerCase().endsWith('.json')).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return result;
    throw error;
  }

  for (const name of entries) {
    const file = path.join(folder, name);
    try {
      const raw = await fs.readFile(file, 'utf8');
      const hash = createHash('sha256').update(raw).digest('hex');
      if (previouslySeen.has(hash)) {
        result.skippedHashes.push(hash);
        continue;
      }
      const payload = JSON.parse(raw) as Record<string, unknown>;
      const payloadTenant = String(payload.tenantId ?? tenantId);
      if (payloadTenant !== tenantId) {
        result.errors.push({ file: name, error: 'tenant_mismatch' });
        continue;
      }
      const classification = String(payload.classification ?? 'INTERNAL') as MeetingFolderRecord['classification'];
      result.ingested.push({ sourceFile: name, contentHash: hash, tenantId, classification, payload });
    } catch (error) {
      result.errors.push({ file: name, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return result;
}
