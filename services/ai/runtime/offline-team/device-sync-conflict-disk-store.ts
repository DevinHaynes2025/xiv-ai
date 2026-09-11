import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { DeviceSyncConflictJournal, type SyncJournalEvent } from './device-sync-conflict-journal';

export interface SyncJournalRestoreReceipt {
  tenantId: string;
  restoredEvents: number;
  integrityVerified: true;
  storagePath: string;
}

function validateTenantId(tenantId: string): string {
  if (!/^[a-zA-Z0-9._-]{1,128}$/.test(tenantId)) throw new Error('invalid tenant id for sync journal persistence');
  return tenantId;
}

export class FilesystemDeviceSyncJournalStore {
  private readonly root: string;

  constructor(rootDirectory: string) {
    if (!rootDirectory) throw new Error('sync journal root directory required');
    this.root = resolve(rootDirectory);
  }

  private pathFor(tenantId: string): string {
    const safeTenant = validateTenantId(tenantId);
    const candidate = resolve(this.root, `${safeTenant}.sync-journal.jsonl`);
    if (!candidate.startsWith(`${this.root}${sep}`)) throw new Error('sync journal path escaped root');
    return candidate;
  }

  private async readEvents(tenantId: string): Promise<SyncJournalEvent[]> {
    const path = this.pathFor(tenantId);
    try {
      const raw = await readFile(path, 'utf8');
      return raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line) as SyncJournalEvent);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return [];
      throw error;
    }
  }

  async append(event: SyncJournalEvent): Promise<string> {
    if (event.tenantId.length === 0) throw new Error('sync event tenant required');
    await mkdir(this.root, { recursive: true });
    const existing = await this.readEvents(event.tenantId);
    const verifier = new DeviceSyncConflictJournal();
    verifier.restore([...existing, event]);
    const path = this.pathFor(event.tenantId);
    await appendFile(path, `${JSON.stringify(event)}\n`, { encoding: 'utf8', flag: 'a', mode: 0o600 });
    return path;
  }

  async load(tenantId: string): Promise<{ journal: DeviceSyncConflictJournal; receipt: SyncJournalRestoreReceipt }> {
    const events = await this.readEvents(tenantId);
    const journal = new DeviceSyncConflictJournal();
    journal.restore(events);
    return {
      journal,
      receipt: {
        tenantId,
        restoredEvents: events.length,
        integrityVerified: true,
        storagePath: this.pathFor(tenantId),
      },
    };
  }
}
