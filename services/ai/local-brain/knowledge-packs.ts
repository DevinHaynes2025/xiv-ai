import { upsertPartitionedKnowledge, type KnowledgePartition } from './world-knowledge-graph';
import type { ClaimState } from './knowledge-domains';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type KnowledgePackScale = 'graph_partitions' | 'object_packages' | 'indexes' | 'compressed_representations';

export type KnowledgePackClaim = {
  id: string;
  label: string;
  summary: string;
  claimState: ClaimState;
  sourceRefs: string[];
};

export type KnowledgePack = {
  id: string;
  tenantId: string;
  universeId: string;
  partition: KnowledgePartition;
  domain: string;
  title: string;
  scale: KnowledgePackScale;
  claims: KnowledgePackClaim[];
  sourceRefs: string[];
  byteEstimate: number;
  manufacturingTrillionRows: false;
  productionAuthorization: false;
  createdAt: string;
};

type PackStore = { packs: KnowledgePack[] };

function packsPath(root: string) {
  return xivLocalPath(root, 'knowledge-packs.json');
}

async function loadPacks(root: string) {
  const parsed = await readJsonFile<PackStore>(packsPath(root), { packs: [] });
  return Array.isArray(parsed.packs) ? parsed.packs : [];
}

async function savePacks(root: string, packs: KnowledgePack[]) {
  await writeJsonFileAtomic(packsPath(root), { packs: packs.slice(-5_000) });
}

export async function registerKnowledgePack(input: {
  tenantId: string;
  universeId: string;
  partition: KnowledgePartition;
  domain: string;
  title: string;
  claims: KnowledgePackClaim[];
  scale?: KnowledgePackScale;
  root?: string;
}): Promise<KnowledgePack> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.title.trim()) throw new Error('KNOWLEDGE_PACK_TITLE_REQUIRED');
  if (input.claims.length === 0) throw new Error('KNOWLEDGE_PACK_REQUIRES_CLAIMS');
  for (const claim of input.claims) {
    if (claim.sourceRefs.length === 0) throw new Error('KNOWLEDGE_PACK_CLAIM_PROVENANCE_REQUIRED');
  }

  const root = input.root ?? process.cwd();
  const pack: KnowledgePack = {
    id: cortexId('pack'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    domain: input.domain,
    title: input.title.trim(),
    scale: input.scale ?? 'object_packages',
    claims: input.claims.map((claim) => ({ ...claim, sourceRefs: [...claim.sourceRefs] })),
    sourceRefs: [...new Set(input.claims.flatMap((claim) => claim.sourceRefs))],
    byteEstimate: JSON.stringify(input.claims).length,
    manufacturingTrillionRows: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };

  for (const claim of pack.claims) {
    await upsertPartitionedKnowledge({
      id: claim.id,
      tenantId: pack.tenantId,
      universeId: pack.universeId,
      partition: pack.partition,
      type: 'claim',
      domain: pack.domain,
      label: claim.label,
      summary: claim.summary,
      claimState: claim.claimState,
      sourceRefs: claim.sourceRefs,
      root,
    });
  }

  const packs = await loadPacks(root);
  packs.push(pack);
  await savePacks(root, packs);
  return pack;
}

export async function listKnowledgePacks(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const packs = await loadPacks(input.root ?? process.cwd());
  return packs.filter((pack) => pack.tenantId === input.tenantId && pack.universeId === input.universeId);
}

export async function knowledgePackStats(root = process.cwd()) {
  const packs = await loadPacks(root);
  return {
    packs: packs.length,
    claims: packs.reduce((sum, pack) => sum + pack.claims.length, 0),
    manufacturingTrillionRows: false as const,
    productionAuthorization: false as const,
  };
}
