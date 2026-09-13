import { closeSync, mkdirSync, openSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isAbsolute, join } from 'node:path';
import type { AlignmentReplayStore } from './alignment-receipt';

/** Disposable/reference adapter. Atomic `wx` creation makes reservation single-use. */
export function createFileAlignmentReplayStore(root: string, tenantNamespace: string): AlignmentReplayStore {
  if (!isAbsolute(root)) throw new Error('absolute replay root required');
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(tenantNamespace)) throw new Error('invalid tenant namespace');
  const directory = join(root, tenantNamespace);
  return {
    durability: 'DURABLE',
    reserve(key) {
      const digest = createHash('sha256').update(key).digest('hex');
      const path = join(directory, `${digest}.reserved`);
      let fd: number;
      try {
        mkdirSync(directory, { recursive: true, mode: 0o700 });
        fd = openSync(path, 'wx', 0o600);
      }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false;
        throw new Error('replay reservation unavailable');
      }
      try { writeFileSync(fd, 'reserved\n', { encoding: 'utf8' }); }
      finally { closeSync(fd); }
      return true;
    },
  };
}
