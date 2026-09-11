export type RetrievalStrategy = 'LEXICAL_FALLBACK' | 'VERIFIED_EMBEDDING';

interface PlatformSyncCounter {
  attempts: number;
  successes: number;
  conflicts: number;
  pendingHumanReview: number;
}

export interface ExecutiveRetrievalSyncTelemetry {
  measuredAt: string;
  retrieval: {
    total: number;
    hits: number;
    misses: number;
    lexicalFallbacks: number;
    verifiedEmbeddingUses: number;
  };
  syncByPlatform: Record<string, PlatformSyncCounter>;
}

export class RetrievalSyncTelemetry {
  private total = 0;
  private hits = 0;
  private misses = 0;
  private lexicalFallbacks = 0;
  private verifiedEmbeddingUses = 0;
  private readonly sync = new Map<string, PlatformSyncCounter>();

  recordRetrieval(input: { hit: boolean; strategy: RetrievalStrategy }): void {
    this.total += 1;
    input.hit ? this.hits += 1 : this.misses += 1;
    input.strategy === 'VERIFIED_EMBEDDING' ? this.verifiedEmbeddingUses += 1 : this.lexicalFallbacks += 1;
  }

  recordSync(input: { platform: string; outcome: 'SUCCESS' | 'CONFLICT' | 'PENDING_HUMAN_REVIEW' }): void {
    const platform = input.platform.trim().toUpperCase();
    if (!platform || platform.length > 64) throw new Error('Invalid platform telemetry key');
    const current = this.sync.get(platform) ?? { attempts: 0, successes: 0, conflicts: 0, pendingHumanReview: 0 };
    current.attempts += 1;
    if (input.outcome === 'SUCCESS') current.successes += 1;
    if (input.outcome === 'CONFLICT') current.conflicts += 1;
    if (input.outcome === 'PENDING_HUMAN_REVIEW') current.pendingHumanReview += 1;
    this.sync.set(platform, current);
  }

  snapshot(): ExecutiveRetrievalSyncTelemetry {
    const syncByPlatform: Record<string, PlatformSyncCounter> = {};
    for (const [platform, counters] of this.sync.entries()) syncByPlatform[platform] = { ...counters };
    return {
      measuredAt: new Date().toISOString(),
      retrieval: {
        total: this.total,
        hits: this.hits,
        misses: this.misses,
        lexicalFallbacks: this.lexicalFallbacks,
        verifiedEmbeddingUses: this.verifiedEmbeddingUses,
      },
      syncByPlatform,
    };
  }
}
