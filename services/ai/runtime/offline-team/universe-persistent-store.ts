import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

export type UniverseClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface UniverseSnapshot {
  tenantId: string;
  userId: string;
  universeId: string;
  classification: UniverseClassification;
  zoneIds: string[];
  approvedAgentIds: string[];
  updatedAt: string;
  consentRef: string;
  version: number;
}

const ROOT = resolve(process.cwd(), '.xiv-runtime', 'universes');

function fileFor(snapshot: Pick<UniverseSnapshot, 'tenantId' | 'userId' | 'universeId'>): string {
  return resolve(ROOT, snapshot.tenantId, snapshot.userId, `${snapshot.universeId}.json`);
}

export function universeDigest(snapshot: UniverseSnapshot): string {
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}

export async function saveUniverse(snapshot: UniverseSnapshot): Promise<{ path: string; digest: string }> {
  if (!snapshot.consentRef) throw new Error('consentRef required');
  if (snapshot.approvedAgentIds.length > 8) throw new Error('maximum 8 approved active agents');
  const path = fileFor(snapshot);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify({ ...snapshot, digest: universeDigest(snapshot) }, null, 2), 'utf8');
  return { path, digest: universeDigest(snapshot) };
}

export async function loadUniverse(ids: Pick<UniverseSnapshot, 'tenantId' | 'userId' | 'universeId'>): Promise<UniverseSnapshot | null> {
  try {
    const parsed = JSON.parse(await readFile(fileFor(ids), 'utf8')) as UniverseSnapshot & { digest?: string };
    const { digest: _digest, ...snapshot } = parsed;
    return snapshot;
  } catch {
    return null;
  }
}

export const universePersistencePolicy = {
  localFirst: true,
  rawPrivateCentralPoolingAllowed: false,
  topSecretExternalSyncAllowed: false,
  productionMutationAllowed: false,
};
