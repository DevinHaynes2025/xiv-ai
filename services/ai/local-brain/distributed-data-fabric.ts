import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { executeLogicalRetrieval, planLogicalRetrieval } from './logical-retrieval';
import { listLakeObjects } from './knowledge-lake';
import { planCrossDatabaseQuery } from './database-adapters';
import type { EvidenceState } from './information-supply-chain-types';

export type FabricShard = {
  id: string;
  location: 'local' | 'edge' | 'remote_unverified';
  graphNodes: number;
  vectorDim: number;
};

export async function federateOfflineVectorGraph(input: {
  tenantId: string;
  universeId: string;
  query: string;
  shards: FabricShard[];
  root?: string;
}) {
  const remote = input.shards.filter((shard) => shard.location === 'remote_unverified');
  const local = input.shards.filter((shard) => shard.location !== 'remote_unverified');
  const plan = planLogicalRetrieval({ query: input.query, estimatedRecords: 1_000_000_000_000 });
  const queryPlan = planCrossDatabaseQuery({
    query: input.query,
    neededStores: ['local_knowledge_lake'],
    copyAllToOnePlace: false,
  });
  const retrieval = await executeLogicalRetrieval({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.query,
    industry: 'information_supply',
    estimatedRecords: 1_000_000_000_000,
    root: input.root,
  });
  const catalog = await listLakeObjects({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: 'information_supply',
    root: input.root,
  });

  return {
    strategy: 'query_to_data_federation' as const,
    localShards: local.length,
    remoteUnverified: remote.length,
    remoteState: remote.length ? ('UNAVAILABLE' as const) : ('NOT_TESTED' as const),
    materializedEmbeddings: 0 as const,
    materializedFiles: 0 as const,
    materializedAgents: 0 as const,
    movementBytes: 0 as const,
    copyAllToOnePlace: false as const,
    catalogSize: catalog.length,
    logicalPlan: plan,
    queryPlan,
    hits: retrieval.hits.length,
    inventedFacts: false as const,
    partnershipClaimed: false as const,
  };
}

function localBrainDir(repoRoot: string) {
  const nested = join(repoRoot, 'services', 'ai', 'local-brain');
  const here = join(repoRoot, 'local-brain');
  if (existsSync(nested)) return nested;
  if (existsSync(here)) return here;
  return nested;
}

function operationsDir(repoRoot: string) {
  const nested = join(repoRoot, 'docs', 'operations');
  const fromServices = join(repoRoot, '..', '..', 'docs', 'operations');
  if (existsSync(nested)) return nested;
  if (existsSync(fromServices)) return fromServices;
  return nested;
}

export function predecessorProbes(repoRoot = process.cwd()): Record<string, EvidenceState> {
  const reports = operationsDir(repoRoot);
  const modules = localBrainDir(repoRoot);
  const report = (name: string) => existsSync(join(reports, name));
  const moduleFile = (name: string) => existsSync(join(modules, name));
  return {
    knowledgeLakeAB: moduleFile('knowledge-lake.ts') ? 'PASS' : 'WAITING_DATA',
    memoryCortex: moduleFile('memory-cortex.ts') ? 'PASS' : 'WAITING_DATA',
    worldKnowledgeGraph: moduleFile('world-knowledge-graph.ts') ? 'PASS' : 'WAITING_DATA',
    learningLedger: moduleFile('learning-ledger.ts') ? 'PASS' : 'WAITING_DATA',
    decisionGate: moduleFile('decision-gate.ts') ? 'PASS' : 'WAITING_DATA',
    evidencePromotion: moduleFile('evidence-graph.ts') ? 'PASS' : 'WAITING_DATA',
    ceoSealedVaultAE: moduleFile('ceo-sealed-vault.ts') ? 'PASS' : 'WAITING_DATA',
    globalBrainHighways: moduleFile('global-brain-highways.ts') ? 'PASS' : 'WAITING_DATA',
    neuralTransitW: moduleFile('neural-transit.ts') ? 'PASS' : 'WAITING_DATA',
    distributedMeshAD: moduleFile('mesh-node-registry.ts') ? 'PASS' : 'WAITING_DATA',
    universeKernelAF: moduleFile('universe-os-kernel.ts') ? 'PASS' : 'WAITING_DATA',
    edgePackageSyncAL: moduleFile('edge-package-sync.ts') ? 'PASS' : 'WAITING_DATA',
    reportAL: report('62L_AL_DISTRIBUTED_APP_NETWORK_EDGE_SYNC_REPORT.md') ? 'PASS' : 'WAITING_DATA',
    reportAK: report('62L_AK_OFFLINE_DEVELOPER_PLATFORM_MARKETPLACE_REPORT.md') ? 'PASS' : 'WAITING_DATA',
    reportAJ: report('62L_AJ_OFFLINE_SOFTWARE_FACTORY_PLUGINS_REPORT.md') ? 'PASS' : 'WAITING_DATA',
    reportAE: report('62L_AE_HYBRID_EDGE_CLOUD_CEO_VAULT_REPORT.md') ? 'PASS' : 'WAITING_DATA',
    reportAB: report('62L_AB_KNOWLEDGE_LAKE_INDUSTRY_MEMORY_REPORT.md') ? 'PASS' : 'WAITING_DATA',
  };
}
