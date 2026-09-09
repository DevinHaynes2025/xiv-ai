/**
 * RAG / Knowledge contracts. Private Universe indexes remain isolated.
 */

export type DocumentRegistryEntry = {
  documentId: string;
  tenantId: string;
  universeId: string;
  classification: 'PUBLIC' | 'TENANT_PRIVATE' | 'PERSONAL';
};

export type ChunkRegistryEntry = {
  chunkId: string;
  documentId: string;
  tenantId: string;
  universeId: string;
};

export type EmbeddingRegistryEntry = {
  embeddingId: string;
  chunkId: string;
  tenantId: string;
  universeId: string;
  modelId: string;
};

export type VectorIndex = {
  indexId: string;
  tenantId: string;
  universeId: string;
  privateUniverseIsolated: true;
  sharedAcrossUniverses: false;
};

export type KnowledgeClaim = {
  claimId: string;
  statement: string;
  confidence: number;
  freshness: string | null;
  evidenceIds: readonly string[];
};

export type EvidenceLink = {
  evidenceId: string;
  claimId: string;
  sourceRefId: string;
};

export type SourceReference = {
  sourceRefId: string;
  documentId: string;
  uri: string | null;
};

export type Contradiction = {
  contradictionId: string;
  claimIds: readonly string[];
  unresolved: boolean;
};

export type Confidence = { score: number; calibrated: boolean };
export type Freshness = { asOf: string | null; stale: boolean };

export type KnowledgeFabric = {
  documents: readonly DocumentRegistryEntry[];
  chunks: readonly ChunkRegistryEntry[];
  embeddings: readonly EmbeddingRegistryEntry[];
  indexes: readonly VectorIndex[];
  privateUniverseIsolated: true;
  crossUniverseAutoMerge: false;
};

export function openKnowledgeFabric(): KnowledgeFabric {
  return {
    documents: [],
    chunks: [],
    embeddings: [],
    indexes: [],
    privateUniverseIsolated: true,
    crossUniverseAutoMerge: false,
  };
}

export function createVectorIndex(input: {
  indexId: string;
  tenantId: string;
  universeId: string;
  mergeAcrossUniverses?: boolean;
}): VectorIndex | { allowed: false; reason: string } {
  if (input.mergeAcrossUniverses === true) {
    return { allowed: false, reason: 'private_universe_indexes_isolated' };
  }
  return {
    indexId: input.indexId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    privateUniverseIsolated: true,
    sharedAcrossUniverses: false,
  };
}

export function queryVectorIndex(input: {
  index: VectorIndex;
  requestingTenantId: string;
  requestingUniverseId: string;
}) {
  if (input.index.tenantId !== input.requestingTenantId) {
    return { allowed: false as const, reason: 'cross_tenant_index_denied' };
  }
  if (input.index.universeId !== input.requestingUniverseId) {
    return { allowed: false as const, reason: 'private_universe_indexes_isolated' };
  }
  return { allowed: true as const, isolated: true as const };
}

export function registerKnowledgeClaim(input: {
  claimId: string;
  statement: string;
  evidenceIds: readonly string[];
  confidence: number;
}): KnowledgeClaim | { allowed: false; reason: string } {
  if (input.evidenceIds.length === 0) {
    return { allowed: false, reason: 'knowledge_claim_requires_evidence' };
  }
  return {
    claimId: input.claimId,
    statement: input.statement,
    confidence: input.confidence,
    freshness: null,
    evidenceIds: input.evidenceIds,
  };
}
