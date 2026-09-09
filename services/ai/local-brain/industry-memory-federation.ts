import { rememberCortexTrace, recallCortexTraces, type MemoryPartition } from './memory-cortex';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';
import { evaluateOfflineTask } from './offline-policy';
import { ingestLakeSource, listLakeObjects, type KnowledgeLakeObject } from './knowledge-lake';
import { indexLakeObject, sparseRetrieve } from './offline-intelligence-index';
import { learnAcrossIndustries } from './historical-industry-learning';

export type IndustryFederationState = 'AVAILABLE' | 'WAITING_DATA' | 'UNAVAILABLE';

export type IndustryMemoryRecord = {
  industry: string;
  era: string;
  tenantId: string;
  universeId: string;
  lakeObjectIds: string[];
  memoryIds: string[];
  knowledgeNodeIds: string[];
  evidenceRefs: string[];
  historicalLessonState: 'AVAILABLE' | 'WAITING_DATA' | 'UNAVAILABLE' | 'NOT_CONSULTED';
  inventedFacts: false;
};

export async function ingestIndustrySource(input: Parameters<typeof ingestLakeSource>[0]) {
  const ingested = await ingestLakeSource(input);
  if (!ingested.duplicate) {
    await indexLakeObject(ingested.object, input.root);
    await rememberCortexTrace({
      tenantId: input.tenantId,
      universeId: input.universeId,
      partition: input.partition,
      kind: 'fact',
      claimState: 'HISTORICAL_ACCOUNT',
      label: `Industry memory ${input.industry}`,
      summary: ingested.object.originalText.slice(0, 280),
      evidenceRefs: [`lake:${ingested.object.id}`],
      sourceRefs: [ingested.object.sourceUri, ...input.provenanceRefs],
      retentionClass: 'archival',
      classification: ingested.object.classification,
      root: input.root,
    });
  }
  return ingested;
}

export async function federateIndustryMemory(input: {
  tenantId: string;
  universeId: string;
  industry: string;
  era?: string;
  query?: string;
  partition?: MemoryPartition;
  needsExternalFreshness?: boolean;
  needsCloudProvider?: boolean;
  root?: string;
}): Promise<{
  state: IndustryFederationState;
  record: IndustryMemoryRecord;
  hits: KnowledgeLakeObject[];
  reason: string;
  inventedFacts: false;
}> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.industry.trim()) throw new Error('INDUSTRY_REQUIRED');
  const offline = evaluateOfflineTask({
    needsInternet: input.needsExternalFreshness === true,
    needsCloudProvider: input.needsCloudProvider === true,
    needsExternalFreshness: input.needsExternalFreshness === true,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });
  const industry = input.industry.trim().toLowerCase();
  const empty: IndustryMemoryRecord = {
    industry,
    era: input.era ?? 'unknown',
    tenantId: input.tenantId,
    universeId: input.universeId,
    lakeObjectIds: [],
    memoryIds: [],
    knowledgeNodeIds: [],
    evidenceRefs: [],
    historicalLessonState: 'NOT_CONSULTED',
    inventedFacts: false,
  };
  if (!offline.allowed) {
    return {
      state: offline.state === 'DENIED' ? 'UNAVAILABLE' : offline.state,
      record: empty,
      hits: [],
      reason: offline.reason,
      inventedFacts: false,
    };
  }

  const root = input.root ?? process.cwd();
  const lake = await listLakeObjects({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry,
    era: input.era,
    partition: input.partition,
    root,
  });
  const sparse = input.query
    ? await sparseRetrieve({
      tenantId: input.tenantId,
      universeId: input.universeId,
      query: input.query,
      industry,
      partition: input.partition,
      root,
    })
    : { hits: lake, tokens: [], inventedFacts: false as const, reason: 'Industry catalog listing.' };
  const memories = await recallCortexTraces({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.query ?? industry,
    partition: input.partition,
    root,
  });
  const knowledge = await retrieveOfflineKnowledge(input.query ?? industry, {
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  const historical = await learnAcrossIndustries({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.query ?? `${industry} historical industry memory`,
    root,
  });
  const hits = sparse.hits.length ? sparse.hits : lake;
  const record: IndustryMemoryRecord = {
    industry,
    era: input.era ?? 'unknown',
    tenantId: input.tenantId,
    universeId: input.universeId,
    lakeObjectIds: hits.map((item) => item.id),
    memoryIds: memories.filter((item) => item.summary.toLowerCase().includes(industry) || !input.query).map((item) => item.id),
    knowledgeNodeIds: knowledge.nodes.map((node) => node.id),
    evidenceRefs: [
      ...hits.map((item) => `lake:${item.id}`),
      ...memories.map((item) => `mem:${item.id}`),
      ...knowledge.evidenceRefs,
      ...historical.evidenceRefs,
    ],
    historicalLessonState: historical.state,
    inventedFacts: false,
  };
  return {
    state: 'AVAILABLE',
    record,
    hits,
    reason: hits.length || memories.length || knowledge.nodes.length
      ? 'Federated from local Knowledge Lake, Memory Cortex, and offline knowledge retrieval. No new corpus was invented.'
      : 'No local industry memory for this tenant/Universe. Empty federation is not a world fact.',
    inventedFacts: false,
  };
}
