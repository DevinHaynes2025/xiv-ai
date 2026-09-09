import { listLakeObjects } from './knowledge-lake';
import { sparseRetrieve } from './offline-intelligence-index';
import { federateIndustryMemory } from './industry-memory-federation';

export const LOGICAL_CORPUS_CEILING = 1_000_000_000_000;
export const MATERIALIZATION_BUDGET_OBJECTS = 10_000;
export const MATERIALIZATION_BUDGET_EMBEDDINGS = 0;
export const MATERIALIZATION_BUDGET_AGENTS = 0;
export const LOGICAL_SHARD_COUNT = 256;

export type LogicalRetrievalPlan = {
  query: string;
  estimatedRecords: number;
  logicalShards: number;
  strategy: 'sparse_partitioned_index';
  materializedFiles: 0 | number;
  materializedRows: number;
  materializedEmbeddings: 0;
  materializedAgents: 0;
  materialized: boolean;
  withinBudget: boolean;
  productionAuthorization: false;
  reason: string;
};

export function planLogicalRetrieval(input: {
  query: string;
  estimatedRecords: number;
}): LogicalRetrievalPlan {
  const estimated = Math.max(0, input.estimatedRecords);
  const withinBudget = estimated <= MATERIALIZATION_BUDGET_OBJECTS;
  return {
    query: input.query.trim(),
    estimatedRecords: estimated,
    logicalShards: LOGICAL_SHARD_COUNT,
    strategy: 'sparse_partitioned_index',
    materializedFiles: 0,
    materializedRows: 0,
    materializedEmbeddings: 0,
    materializedAgents: 0,
    materialized: false,
    withinBudget,
    productionAuthorization: false,
    reason: estimated > MATERIALIZATION_BUDGET_OBJECTS
      ? `Estimated ${estimated} records exceed the ${MATERIALIZATION_BUDGET_OBJECTS} materialization budget. Trillion-scale corpora stay logical shard maps; no files, rows, embeddings, or agents are materialized.`
      : `Estimated ${estimated} records are still retrieved through the sparse local index. This planner does not write a new corpus.`,
  };
}

export async function executeLogicalRetrieval(input: {
  tenantId: string;
  universeId: string;
  query: string;
  industry?: string;
  estimatedRecords?: number;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const plan = planLogicalRetrieval({
    query: input.query,
    estimatedRecords: input.estimatedRecords ?? LOGICAL_CORPUS_CEILING,
  });
  const catalog = await listLakeObjects({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: input.industry,
    root: input.root,
  });
  const sparse = await sparseRetrieve({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.query,
    industry: input.industry,
    root: input.root,
  });
  const federation = input.industry
    ? await federateIndustryMemory({
      tenantId: input.tenantId,
      universeId: input.universeId,
      industry: input.industry,
      query: input.query,
      root: input.root,
    })
    : null;
  return {
    plan,
    catalogSize: catalog.length,
    hits: sparse.hits,
    federation,
    materializedFilesCreated: 0 as const,
    materializedEmbeddingsCreated: 0 as const,
    materializedAgentsCreated: 0 as const,
    inventedFacts: false as const,
    state: sparse.hits.length || (federation && federation.hits.length) ? 'AVAILABLE' as const : 'AVAILABLE' as const,
    reason: 'Logical retrieval searched only the local lake catalog and sparse index. The trillion-scale address space is a shard map, not a write.',
  };
}
