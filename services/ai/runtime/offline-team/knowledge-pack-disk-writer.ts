import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

export interface KnowledgePackItem {
  itemId: string;
  contentHash: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  approved: boolean;
  evidenceRefs: string[];
}

export interface KnowledgePackManifest {
  tenantId: string;
  userId: string;
  packId: string;
  createdAt: string;
  encrypted: boolean;
  externallySyncable: boolean;
  items: KnowledgePackItem[];
  manifestHash: string;
}

const ROOT = resolve(process.cwd(), '.xiv-runtime', 'knowledge-packs');

export async function writeKnowledgePackManifest(input: Omit<KnowledgePackManifest, 'manifestHash' | 'externallySyncable'>): Promise<string> {
  const items = input.items.filter(i => i.approved);
  const externallySyncable = !items.some(i => i.classification === 'TOP_SECRET');
  const base = { ...input, items, externallySyncable };
  const manifestHash = createHash('sha256').update(JSON.stringify(base)).digest('hex');
  const manifest: KnowledgePackManifest = { ...base, manifestHash };
  const safe = `${input.tenantId}__${input.userId}__${input.packId}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const file = resolve(ROOT, safe, 'manifest.json');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(manifest, null, 2), 'utf8');
  return file;
}

export const knowledgePackDiskPolicy = {
  root: '.xiv-runtime/knowledge-packs',
  encryptedRequired: true,
  rawTopSecretManifestContentAllowed: false,
  productionMutationAllowed: false,
};
