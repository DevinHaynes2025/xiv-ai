import { mkdir, writeFile, readFile, appendFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export type RuntimeClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface RuntimeDiskEnvelope<T> {
  tenantId: string;
  classification: RuntimeClassification;
  createdAt: string;
  payload: T;
}

const ROOT = resolve(process.cwd(), '.xiv-runtime');

function safePath(relativePath: string): string {
  const full = resolve(ROOT, relativePath);
  if (!full.startsWith(ROOT)) throw new Error('path escapes .xiv-runtime');
  return full;
}

export async function ensureRuntimeRoot(): Promise<string> {
  await mkdir(ROOT, { recursive: true });
  return ROOT;
}

export async function writeRuntimeJson<T>(relativePath: string, envelope: RuntimeDiskEnvelope<T>): Promise<string> {
  const full = safePath(relativePath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, JSON.stringify(envelope, null, 2), { encoding: 'utf8' });
  return full;
}

export async function readRuntimeJson<T>(relativePath: string): Promise<RuntimeDiskEnvelope<T> | null> {
  try {
    return JSON.parse(await readFile(safePath(relativePath), 'utf8')) as RuntimeDiskEnvelope<T>;
  } catch {
    return null;
  }
}

export async function appendRuntimeJsonl<T>(relativePath: string, value: T): Promise<string> {
  const full = safePath(relativePath);
  await mkdir(dirname(full), { recursive: true });
  await appendFile(full, JSON.stringify(value) + '\n', { encoding: 'utf8' });
  return full;
}

export const runtimeDiskPolicy = {
  root: '.xiv-runtime',
  externalNetworkByDefault: false,
  productionMutationAllowed: false,
  topSecretExternalSyncAllowed: false,
  topSecretPlaintextLoggingAllowed: false,
};
