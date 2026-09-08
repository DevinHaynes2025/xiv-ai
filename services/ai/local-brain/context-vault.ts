import { readFile, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

export type ContextRecord = {
  path: string;
  content: string;
  bytes: number;
  classification: 'internal';
  source: 'local_repo';
};

const MAX_FILE_BYTES = 256_000;
const DENIED_SEGMENTS = ['.env', '.git', 'node_modules', '.xiv-local'];

function inside(root: string, target: string) {
  const rel = relative(root, target);
  return rel !== '..' && !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !resolve(rel).startsWith('..');
}

export async function readApprovedContext(repoRoot: string, requestedPath: string): Promise<ContextRecord> {
  const root = resolve(repoRoot);
  const target = resolve(root, requestedPath);
  if (!inside(root, target)) throw new Error('CONTEXT_PATH_OUTSIDE_REPO');

  const normalized = relative(root, target).replaceAll('\\', '/');
  if (DENIED_SEGMENTS.some((segment) => normalized.split('/').includes(segment) || normalized === segment)) {
    throw new Error('CONTEXT_PATH_DENIED');
  }

  const info = await stat(target);
  if (!info.isFile()) throw new Error('CONTEXT_NOT_FILE');
  if (info.size > MAX_FILE_BYTES) throw new Error('CONTEXT_FILE_TOO_LARGE');

  const content = await readFile(target, 'utf8');
  return { path: normalized, content, bytes: info.size, classification: 'internal', source: 'local_repo' };
}
