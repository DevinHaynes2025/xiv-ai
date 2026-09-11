import type { KnowledgeClassification } from './offline-rag-retrieval-index';

export type EmbeddingAdapterState = 'TARGET' | 'RESEARCH' | 'TESTED' | 'VERIFIED';

export interface EmbeddingAdapterReceipt {
  adapterId: string;
  engineName: string;
  modelName: string;
  state: EmbeddingAdapterState;
  execution: 'LOCAL' | 'REMOTE';
  dimensions: number;
  verifiedAt?: string;
  expiresAt?: string;
  evidenceRefs: readonly string[];
}

export type RetrievalVectorStrategy = 'VERIFIED_LOCAL_EMBEDDING' | 'LEXICAL_FALLBACK' | 'BLOCKED_TOP_SECRET';

export interface EmbeddingResolution {
  adapterId?: string;
  strategy: RetrievalVectorStrategy;
  reason: string;
  dimensions?: number;
  evidenceRefs: readonly string[];
}

export const EMBEDDING_ADAPTER_GUARDRAILS = {
  verifiedReceiptRequired: true,
  localExecutionRequired: true,
  evidenceRequired: true,
  topSecretOrdinaryEmbeddingAllowed: false,
  deterministicLexicalFallbackRequired: true,
  declaredAdapterDoesNotProveRuntimeAvailability: true,
} as const;

export class EmbeddingAdapterRegistry {
  private readonly receipts = new Map<string, EmbeddingAdapterReceipt>();

  register(receipt: EmbeddingAdapterReceipt): void {
    if (!receipt.adapterId || !receipt.engineName || !receipt.modelName) throw new Error('embedding adapter identity required');
    if (!Number.isInteger(receipt.dimensions) || receipt.dimensions <= 0) throw new Error('positive embedding dimensions required');
    if (receipt.state === 'VERIFIED') {
      if (receipt.execution !== 'LOCAL') throw new Error('ordinary verified embedding adapter must execute locally');
      if (!receipt.verifiedAt || Number.isNaN(Date.parse(receipt.verifiedAt))) throw new Error('verified adapter requires verifiedAt');
      if (receipt.evidenceRefs.length === 0) throw new Error('verified adapter requires evidence');
    }
    this.receipts.set(receipt.adapterId, { ...receipt, evidenceRefs: [...receipt.evidenceRefs] });
  }

  resolve(classification: KnowledgeClassification, adapterId: string | undefined, now: string): EmbeddingResolution {
    if (classification === 'TOP_SECRET') {
      return {
        adapterId,
        strategy: 'BLOCKED_TOP_SECRET',
        reason: 'TOP_SECRET is excluded from ordinary embedding pipelines',
        evidenceRefs: [],
      };
    }

    if (!adapterId) {
      return {
        strategy: 'LEXICAL_FALLBACK',
        reason: 'no verified local embedding adapter selected',
        evidenceRefs: [],
      };
    }

    const receipt = this.receipts.get(adapterId);
    if (!receipt) {
      return {
        adapterId,
        strategy: 'LEXICAL_FALLBACK',
        reason: 'embedding adapter has no verification receipt',
        evidenceRefs: [],
      };
    }

    const expired = Boolean(receipt.expiresAt && Date.parse(receipt.expiresAt) <= Date.parse(now));
    if (
      receipt.state !== 'VERIFIED' ||
      receipt.execution !== 'LOCAL' ||
      !receipt.verifiedAt ||
      receipt.evidenceRefs.length === 0 ||
      expired
    ) {
      return {
        adapterId,
        strategy: 'LEXICAL_FALLBACK',
        reason: expired ? 'embedding adapter receipt expired' : 'embedding adapter is not verified for local use',
        evidenceRefs: [...receipt.evidenceRefs],
      };
    }

    return {
      adapterId,
      strategy: 'VERIFIED_LOCAL_EMBEDDING',
      reason: 'verified local embedding adapter receipt is valid',
      dimensions: receipt.dimensions,
      evidenceRefs: [...receipt.evidenceRefs],
    };
  }

  measuredVerifiedLocalCount(now: string): number {
    return [...this.receipts.values()].filter(receipt =>
      receipt.state === 'VERIFIED' &&
      receipt.execution === 'LOCAL' &&
      Boolean(receipt.verifiedAt) &&
      receipt.evidenceRefs.length > 0 &&
      (!receipt.expiresAt || Date.parse(receipt.expiresAt) > Date.parse(now)),
    ).length;
  }
}
