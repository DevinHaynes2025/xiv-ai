import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { RecoveryCheckpoint } from './offline-replay-recovery';
import type { StoredOperationalEvent } from './encrypted-local-event-store';

export interface DiskPersistenceHealth {
  tenantId: string;
  streamId: string;
  path: string;
  exists: boolean;
  bytes: number;
  encryptedEnvelopesOnly: true;
  checkedAt: string;
}

function safeSegment(value: string, label: string) {
  if (!/^[A-Za-z0-9._-]+$/.test(value)) throw new Error(`${label} contains unsafe path characters`);
  return value;
}

export class JsonlEncryptedEventPersistence {
  private readonly root: string;

  constructor(rootDirectory: string) {
    if (!rootDirectory) throw new Error('root directory required');
    this.root = resolve(rootDirectory);
  }

  streamPath(tenantId: string, streamId: string) {
    return join(this.root, safeSegment(tenantId, 'tenant'), `${safeSegment(streamId, 'stream')}.jsonl`);
  }

  checkpointPath(tenantId: string, streamId: string) {
    return join(this.root, safeSegment(tenantId, 'tenant'), `${safeSegment(streamId, 'stream')}.checkpoint.json`);
  }

  appendEnvelope(event: StoredOperationalEvent) {
    const path = this.streamPath(event.tenantId, event.streamId);
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${JSON.stringify(event)}\n`, { encoding: 'utf8', flag: 'a' });
    return path;
  }

  readEnvelopes(tenantId: string, streamId: string): StoredOperationalEvent[] {
    const path = this.streamPath(tenantId, streamId);
    if (!existsSync(path)) return [];
    return readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean).map(line => {
      const parsed = JSON.parse(line) as StoredOperationalEvent;
      if (parsed.tenantId !== tenantId || parsed.streamId !== streamId) throw new Error('cross-tenant or cross-stream envelope detected on disk');
      if (!parsed.ciphertext || !parsed.payloadHash || !parsed.envelopeHash) throw new Error('invalid encrypted envelope on disk');
      return parsed;
    });
  }

  saveCheckpoint(checkpoint: RecoveryCheckpoint) {
    const path = this.checkpointPath(checkpoint.tenantId, checkpoint.streamId);
    mkdirSync(dirname(path), { recursive: true });
    const temp = `${path}.tmp`;
    writeFileSync(temp, JSON.stringify(checkpoint, null, 2), 'utf8');
    renameSync(temp, path);
    return path;
  }

  health(tenantId: string, streamId: string): DiskPersistenceHealth {
    const path = this.streamPath(tenantId, streamId);
    const exists = existsSync(path);
    return {
      tenantId,
      streamId,
      path,
      exists,
      bytes: exists ? statSync(path).size : 0,
      encryptedEnvelopesOnly: true,
      checkedAt: new Date().toISOString(),
    };
  }
}

export const DISK_PERSISTENCE_GUARDRAILS = {
  plaintextPayloadFilesAllowed: false,
  appendOnlyEventFile: true,
  atomicCheckpointReplace: true,
  pathTraversalBlocked: true,
  productionDirectoryRequiredByDefault: false,
};
