/**
 * Vector search interface for Database City.
 * Local stub is honest; external providers remain WAITING_PROVIDER.
 */

export type VectorProviderStatus = 'LOCAL_STUB' | 'WAITING_PROVIDER' | 'DETECTED' | 'VERIFIED';

export type VectorQuery = {
  queryId: string;
  embedding: readonly number[];
  topK: number;
  namespace?: string;
};

export type VectorHit = {
  id: string;
  score: number;
  namespace: string;
};

export type VectorSearchResult = {
  queryId: string;
  providerStatus: VectorProviderStatus;
  hits: readonly VectorHit[];
  notes: string;
};

export interface VectorSearchProvider {
  readonly name: string;
  readonly providerStatus: VectorProviderStatus;
  search(query: VectorQuery): VectorSearchResult;
}

function validateQuery(query: VectorQuery): void {
  if (!query.queryId) throw new TypeError('queryId is required');
  if (!Array.isArray(query.embedding) || query.embedding.length === 0) {
    throw new TypeError('embedding must be a non-empty number array');
  }
  if (!Number.isInteger(query.topK) || query.topK < 1) {
    throw new RangeError('topK must be a positive integer');
  }
}

/**
 * Deterministic local cosine-ish stub over an in-memory catalog.
 * Not a production ANN index ? honest LOCAL_STUB.
 */
export function createLocalVectorStub(
  catalog: readonly { id: string; embedding: readonly number[]; namespace?: string }[] = [],
): VectorSearchProvider {
  const items = catalog.map((item) => ({
    id: item.id,
    embedding: item.embedding,
    namespace: item.namespace ?? 'default',
  }));

  return {
    name: 'local-vector-stub',
    providerStatus: 'LOCAL_STUB',
    search(query: VectorQuery): VectorSearchResult {
      validateQuery(query);
      const namespace = query.namespace ?? 'default';
      const scored = items
        .filter((item) => item.namespace === namespace)
        .map((item) => ({
          id: item.id,
          score: cosineSimilarity(query.embedding, item.embedding),
          namespace: item.namespace,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, query.topK);
      return {
        queryId: query.queryId,
        providerStatus: 'LOCAL_STUB',
        hits: Object.freeze(scored),
        notes: 'local cosine stub; not a production vector DB; WAITING_PROVIDER for managed ANN',
      };
    },
  };
}

/** External / managed vector provider placeholder ? never fakes VERIFIED. */
export function createWaitingVectorProvider(name = 'unspecified'): VectorSearchProvider {
  return {
    name,
    providerStatus: 'WAITING_PROVIDER',
    search(query: VectorQuery): VectorSearchResult {
      validateQuery(query);
      return {
        queryId: query.queryId,
        providerStatus: 'WAITING_PROVIDER',
        hits: Object.freeze([]),
        notes: `vector provider "${name}" is WAITING_PROVIDER; no fake VERIFIED index`,
      };
    },
  };
}

function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export const DEFAULT_VECTOR_PROVIDER_STATUS: VectorProviderStatus = 'WAITING_PROVIDER';
