export type MemoryClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface MemoryShard {
  shardId: string;
  tenantId: string;
  userId: string;
  classification: MemoryClassification;
  contentHash: string;
  encrypted: boolean;
  evidenceRefs: string[];
  pathwayRefs: string[];
  cloudSyncAllowed: boolean;
}

export function validateMemoryShard(shard: MemoryShard): MemoryShard {
  if (!shard.tenantId || !shard.userId || !shard.contentHash) throw new Error('identity and content hash required');
  if (!shard.encrypted && shard.classification !== 'PUBLIC') throw new Error('non-public memory must be encrypted');
  if (shard.classification === 'TOP_SECRET' && shard.cloudSyncAllowed) throw new Error('TOP_SECRET cloud sync denied');
  return { ...shard, evidenceRefs: [...new Set(shard.evidenceRefs)], pathwayRefs: [...new Set(shard.pathwayRefs)] };
}

export interface NeuralPathway {
  pathwayId: string;
  tenantId: string;
  fromShardId: string;
  toShardId: string;
  relation: 'SUPPORTS' | 'CONTRADICTS' | 'PRECEDES' | 'CAUSE_CANDIDATE' | 'SIMILAR_TO';
  confidence: number;
  evidenceRefs: string[];
}

export function validatePathway(pathway: NeuralPathway): NeuralPathway {
  if (pathway.confidence < 0 || pathway.confidence > 1) throw new Error('confidence must be 0..1');
  if (!pathway.evidenceRefs.length) throw new Error('pathway evidence required');
  return pathway;
}

export const MEMORY_NERVOUS_SYSTEM_GUARDRAILS = {
  crossTenantLinksAllowed: false,
  memoryIsNotTruth: true,
  graphEdgeIsNotFact: true,
  topSecretCloudSyncAllowed: false,
  silentModelWeightMutationAllowed: false,
};
