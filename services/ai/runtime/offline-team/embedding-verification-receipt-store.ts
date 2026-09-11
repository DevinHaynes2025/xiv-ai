import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export type EmbeddingVerificationStatus = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED';

export interface EmbeddingVerificationReceipt {
  adapterId: string;
  modelId: string;
  modelDigest: string;
  runtimeScope: 'LOCAL' | 'REMOTE';
  status: EmbeddingVerificationStatus;
  evidenceRefs: string[];
  verifiedAt?: string;
  validUntil?: string;
}

function validateReceipt(receipt: EmbeddingVerificationReceipt): void {
  if (!receipt.adapterId || !receipt.modelId || !receipt.modelDigest) throw new Error('Embedding receipt identity fields are required');
  if (receipt.status === 'VERIFIED' && receipt.evidenceRefs.length === 0) throw new Error('Verified embedding receipt requires evidence');
}

export function isVerifiedLocalEmbeddingReceipt(receipt: EmbeddingVerificationReceipt, now = new Date()): boolean {
  if (receipt.status !== 'VERIFIED' || receipt.runtimeScope !== 'LOCAL' || receipt.evidenceRefs.length === 0) return false;
  if (!receipt.verifiedAt || !receipt.validUntil) return false;
  const verifiedAt = Date.parse(receipt.verifiedAt);
  const validUntil = Date.parse(receipt.validUntil);
  return Number.isFinite(verifiedAt) && Number.isFinite(validUntil) && verifiedAt <= now.getTime() && validUntil > now.getTime();
}

export class EmbeddingVerificationReceiptStore {
  constructor(private readonly filePath: string) {}

  async load(): Promise<EmbeddingVerificationReceipt[]> {
    try {
      const parsed = JSON.parse(await fs.readFile(this.filePath, 'utf8')) as EmbeddingVerificationReceipt[];
      for (const receipt of parsed) validateReceipt(receipt);
      return parsed;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
      throw error;
    }
  }

  async upsert(receipt: EmbeddingVerificationReceipt): Promise<void> {
    validateReceipt(receipt);
    const all = await this.load();
    const next = all.filter((item) => item.adapterId !== receipt.adapterId);
    next.push(receipt);
    await fs.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    const tmp = `${this.filePath}.${process.pid}.${randomBytes(5).toString('hex')}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(next, null, 2), { encoding: 'utf8', mode: 0o600 });
    await fs.rename(tmp, this.filePath);
  }

  async select(adapterId: string, now = new Date()): Promise<{ mode: 'VERIFIED_EMBEDDING' | 'LEXICAL_FALLBACK'; receipt?: EmbeddingVerificationReceipt }> {
    const receipt = (await this.load()).find((item) => item.adapterId === adapterId);
    return receipt && isVerifiedLocalEmbeddingReceipt(receipt, now)
      ? { mode: 'VERIFIED_EMBEDDING', receipt }
      : { mode: 'LEXICAL_FALLBACK' };
  }
}
