import { registerKnowledgePack, listKnowledgePacks, knowledgePackStats, type KnowledgePackClaim } from './knowledge-packs';
import type { KnowledgePartition } from './world-knowledge-graph';

export async function ingestOfflineKnowledgePack(input: {
  tenantId: string;
  universeId: string;
  partition: KnowledgePartition;
  domain: string;
  title: string;
  claims: KnowledgePackClaim[];
  root?: string;
}) {
  const pack = await registerKnowledgePack(input);
  return {
    pack,
    manufacturingTrillionRows: false as const,
    materializedRowCount: pack.claims.length,
    scale: pack.scale,
    productionAuthorization: false as const,
  };
}

export { listKnowledgePacks, knowledgePackStats };
