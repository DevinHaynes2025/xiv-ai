import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { cloudPeerSlots } from './cloud-peer-adapters';
import { controlTowerMetrics, readSupplyChainManager, runInformationSupplyChain, registerSupplier } from './supply-chain-manager';
import { federateOfflineVectorGraph, predecessorProbes } from './distributed-data-fabric';
import { integrationAdapterSlots, planCrossDatabaseQuery, resetIntegrationAdapters } from './database-adapters';
import { INFORMATION_SUPPLY_CHAIN, INFORMATION_SUPPLY_CHAIN_LOCKS } from './information-supply-chain-types';
import { cacheRootIdentitiesOffline, registerRootIdentity } from './root-identities';
import { TypedHighwayGraph } from './typed-highway-edges';
import { analyzeAdapterGaps, analyzeHighwayGaps, analyzeRootGaps } from './gap-analysis';
import { checkLocalBrainHealth } from './health-check';
import { knowledgeLakeStats } from './knowledge-lake';
import { cortexMemoryStats } from './memory-cortex';
import { sealedVaultStats } from './ceo-sealed-vault';
import { providerSlots } from './provider-fabric';

export { INFORMATION_SUPPLY_CHAIN, INFORMATION_SUPPLY_CHAIN_LOCKS };

export async function runInformationSupplyChainCycle(input: {
  tenantId: string;
  universeId: string;
  sourceUri: string;
  originalText: string;
  sealedPayload?: string;
  destination?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const dataRoot = await registerRootIdentity({
    kind: 'data_root',
    label: 'local-information-root',
    tenantId: input.tenantId,
    universeId: input.universeId,
    capabilityRootId: 'local-brain',
    location: 'local',
    root,
  });
  const highwayRoot = await registerRootIdentity({
    kind: 'highway_root',
    label: 'query-to-data-highway',
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  await cacheRootIdentitiesOffline({ tenantId: input.tenantId, universeId: input.universeId, root });

  const highways = new TypedHighwayGraph();
  highways.registerNode({
    id: `${input.tenantId}:source`,
    kind: 'source',
    label: 'source',
    tenantId: input.tenantId,
    universeId: input.universeId,
    holdsPrivateMemory: false,
    sealed: false,
  });
  highways.registerNode({
    id: `${input.tenantId}:store`,
    kind: 'store',
    label: 'store',
    tenantId: input.tenantId,
    universeId: input.universeId,
    holdsPrivateMemory: false,
    sealed: false,
  });
  highways.connect({
    from: `${input.tenantId}:source`,
    to: `${input.tenantId}:store`,
    relation: 'query_to_data',
    stale: false,
    evidenceRefs: ['62L-AM:cycle'],
  });

  const supplier = await registerSupplier({
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: 'local-source',
    root,
  });
  const chain = await runInformationSupplyChain({
    tenantId: input.tenantId,
    universeId: input.universeId,
    supplierId: supplier.id,
    sourceUri: input.sourceUri,
    originalText: input.originalText,
    sealedPayload: input.sealedPayload,
    destination: input.destination,
    root,
  });
  const fabric = await federateOfflineVectorGraph({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.originalText.slice(0, 48) || 'local inventory',
    shards: [
      { id: 'local-a', location: 'local', graphNodes: 2, vectorDim: 0 },
      { id: 'edge-b', location: 'edge', graphNodes: 0, vectorDim: 0 },
    ],
    root,
  });
  const rootGaps = await analyzeRootGaps({
    tenantId: input.tenantId,
    universeId: input.universeId,
    requiredIdentityKinds: ['data_root', 'highway_root'],
    root,
  });
  return {
    hops: chain.hops,
    dataRoot,
    highwayRoot,
    chain,
    fabric,
    pathway: highways.generatePathway({ from: `${input.tenantId}:source`, to: `${input.tenantId}:store` }),
    rootGaps,
    highwayGaps: analyzeHighwayGaps(highways),
    adapterGaps: analyzeAdapterGaps(['aws', 'azure', 'google_cloud', 'snowflake']),
    copyAllToOnePlace: false as const,
    locks: INFORMATION_SUPPLY_CHAIN_LOCKS,
  };
}

export async function buildInformationSupplyChainHealthReport(root = process.cwd()) {
  const repoRoot = existsSync(join(root, 'docs', 'operations')) ? root : join(root, '..', '..');
  const probes = predecessorProbes(repoRoot);
  const adapters = integrationAdapterSlots();
  const metrics = await controlTowerMetrics(root);
  const manager = await readSupplyChainManager(root);
  const lake = await knowledgeLakeStats(root);
  const cortex = await cortexMemoryStats(root);
  const sealed = await sealedVaultStats(root);
  const localHealth = await checkLocalBrainHealth(root);
  return {
    phase: '62L-AM',
    title: 'Global Information Supply Chain + Root/Highway Expansion + Distributed Data Fabric',
    supplyChain: INFORMATION_SUPPLY_CHAIN.join(' → '),
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    tipLand: false as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
    githubIssue51: 'UNAVAILABLE' as const,
    inventedPass: false as const,
    partnershipClaimed: false as const,
    copyAllToOnePlace: false as const,
    exploitOtherCompanies: false as const,
    predecessor: probes,
    adapters: adapters.map((slot) => ({
      adapter: slot.adapter,
      state: slot.state,
      partnershipClaimed: slot.partnershipClaimed,
    })),
    cloudPeers: cloudPeerSlots().map((slot) => ({ peer: slot.peer, state: slot.state })),
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
    })),
    metrics: {
      ...metrics,
      unavailableAdapters: adapters.filter((slot) => slot.state === 'UNAVAILABLE').length,
    },
    manager: {
      suppliers: manager.suppliers.length,
      inventory: manager.inventory.length,
      qualityFailures: manager.qualityFailures,
      feedback: manager.feedback,
    },
    lakeObjects: lake.objects,
    cortexTraces: cortex.visible,
    sealedRecords: sealed.records,
    localModel: localHealth.model,
    locks: INFORMATION_SUPPLY_CHAIN_LOCKS,
    next: '62L-AN — Information Control Tower + Semantic Internet Router + Enterprise Data Exchange',
  };
}

export function resetSupplyChainTestAdapters() {
  resetIntegrationAdapters();
}

export { planCrossDatabaseQuery };
