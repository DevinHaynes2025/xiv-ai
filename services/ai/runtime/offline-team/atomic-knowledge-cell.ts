import { createHash } from 'node:crypto';

export type KnowledgeTrust = 'RAW' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
export type KnowledgeClass = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface AtomicKnowledgeCell {
  id: string;
  tenantId: string;
  content: string;
  sourceRefs: string[];
  trust: KnowledgeTrust;
  classification: KnowledgeClass;
  confidence: number;
  createdAt: string;
  hash: string;
}

export function createAtomicKnowledgeCell(input: Omit<AtomicKnowledgeCell, 'hash'>): AtomicKnowledgeCell {
  const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  return { ...input, hash };
}

export function canEnterTrustedBrain(cell: AtomicKnowledgeCell): boolean {
  return cell.trust === 'APPROVED' && cell.sourceRefs.length > 0 && cell.confidence >= 0.8;
}

export const atomicKnowledgePolicy = {
  physicalAtomScaleClaim: false,
  meaning: 'tiny logical content-addressed records with provenance',
  topSecretExternalEmbeddingAllowed: false,
};
