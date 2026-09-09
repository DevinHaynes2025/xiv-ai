import { executeLogicalRetrieval, planLogicalRetrieval, LOGICAL_CORPUS_CEILING } from './logical-retrieval';
import { listCompiledHighways } from './neural-highway-compiler';
import { listDistributedMemory } from './memory-ingest';
import { recallCortexTraces } from './memory-cortex';

export type RetrievalPlan = {
  query: string;
  preferHighways: boolean;
  estimatedLogicalRecords: number;
  materializedFiles: 0;
  materializedEmbeddings: 0;
  materializedAgents: 0;
  strategy: 'highway_then_sparse_index';
  productionAuthorization: false;
};

export type EvidenceBundle = {
  id: string;
  query: string;
  memoryIds: string[];
  highwayIds: string[];
  lakeHits: number;
  contradictionIds: string[];
  inventedFacts: false;
  rawPooled: false;
};

export function planIntelligentRetrieval(input: { query: string; estimatedRecords?: number }): RetrievalPlan {
  const logical = planLogicalRetrieval({
    query: input.query,
    estimatedRecords: input.estimatedRecords ?? LOGICAL_CORPUS_CEILING,
  });
  return {
    query: input.query.trim(),
    preferHighways: true,
    estimatedLogicalRecords: logical.estimatedRecords,
    materializedFiles: 0,
    materializedEmbeddings: 0,
    materializedAgents: 0,
    strategy: 'highway_then_sparse_index',
    productionAuthorization: false,
  };
}

export async function retrieveWithPlan(input: {
  tenantId: string;
  universeId: string;
  query: string;
  estimatedRecords?: number;
  asOf?: string;
  root?: string;
}) {
  const plan = planIntelligentRetrieval({ query: input.query, estimatedRecords: input.estimatedRecords });
  const highways = (await listCompiledHighways(input)).filter((item) =>
    `${item.fromIri} ${item.toIri} ${item.evidenceRefs.join(' ')}`.toLowerCase().includes(input.query.trim().toLowerCase()) ||
    input.query.trim().length === 0,
  );
  const memory = await listDistributedMemory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    asOf: input.asOf,
    root: input.root,
  });
  const needle = input.query.trim().toLowerCase();
  const memoryHits = needle
    ? memory.filter((item) => `${item.claim} ${item.summary}`.toLowerCase().includes(needle))
    : memory;
  const cortex = await recallCortexTraces({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.query,
    asOf: input.asOf,
    root: input.root,
  });
  const lake = await executeLogicalRetrieval({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.query,
    estimatedRecords: input.estimatedRecords,
    root: input.root,
  });
  const bundle: EvidenceBundle = {
    id: `bundle_${Date.now().toString(36)}`,
    query: input.query,
    memoryIds: memoryHits.map((item) => item.id),
    highwayIds: highways.map((item) => item.id),
    lakeHits: lake.hits.length,
    contradictionIds: [...new Set(memoryHits.map((item) => item.contradictionId).filter((id): id is string => Boolean(id)))],
    inventedFacts: false,
    rawPooled: false,
  };
  return {
    plan,
    bundle,
    highways,
    memoryHits,
    cortexHits: cortex.length,
    lake,
    inventedFacts: false as const,
    smarterBecauseMoreAgents: false as const,
  };
}
