import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { appendEvidenceEvent, listEvidenceEvents } from './evidence-ledger';
import {
  recordContradiction,
  transitionContradiction,
  listContradictions,
  upsertPartitionedKnowledge,
  type ContradictionRecord,
} from './world-knowledge-graph';
import { getLakeObject } from './knowledge-lake';
import { promoteKnowledge } from '../runtime/society/promotion';
import type { ClaimState } from './knowledge-domains';
import type { MemoryPartition } from './memory-cortex';

export type EvidenceGraphNodeKind = 'source' | 'claim' | 'evidence_event' | 'contradiction' | 'translation';
export type EvidenceGraphEdgeType = 'SUPPORTS' | 'CONTRADICTS' | 'CITES' | 'TRANSLATION_OF' | 'DERIVED_FROM';

export type EvidenceGraphNode = {
  id: string;
  kind: EvidenceGraphNodeKind;
  ref: string;
  tenantId: string;
  universeId: string;
  label: string;
};

export type EvidenceGraphEdge = {
  id: string;
  from: string;
  to: string;
  type: EvidenceGraphEdgeType;
  evidenceRefs: string[];
  createdAt: string;
};

type GraphStore = { nodes: EvidenceGraphNode[]; edges: EvidenceGraphEdge[] };

const MAX_NODES = 25_000;
const MAX_EDGES = 50_000;

function graphPath(root: string) {
  return xivLocalPath(root, 'evidence-graph.json');
}

async function load(root: string): Promise<GraphStore> {
  const parsed = await readJsonFile<GraphStore>(graphPath(root), { nodes: [], edges: [] });
  return {
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
    edges: Array.isArray(parsed.edges) ? parsed.edges : [],
  };
}

async function save(root: string, store: GraphStore) {
  await writeJsonFileAtomic(graphPath(root), {
    nodes: store.nodes.slice(-MAX_NODES),
    edges: store.edges.slice(-MAX_EDGES),
  });
}

async function upsertNode(root: string, node: EvidenceGraphNode) {
  const store = await load(root);
  const existing = store.nodes.find((item) => item.id === node.id);
  if (existing) Object.assign(existing, node);
  else store.nodes.push(node);
  await save(root, store);
  return node;
}

export async function linkLakeSourceToClaim(input: {
  tenantId: string;
  universeId: string;
  lakeObjectId: string;
  claimId: string;
  claimLabel: string;
  claimSummary: string;
  claimState: ClaimState;
  partition: MemoryPartition;
  domain: string;
  evidenceRefs: string[];
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const source = await getLakeObject({
    id: input.lakeObjectId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  if (!source) throw new Error('LAKE_OBJECT_NOT_FOUND');

  const knowledge = await upsertPartitionedKnowledge({
    id: input.claimId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    type: 'claim',
    domain: input.domain,
    label: input.claimLabel,
    summary: input.claimSummary,
    claimState: input.claimState,
    sourceRefs: [`lake:${source.id}`, ...input.evidenceRefs],
    classification: source.classification,
    root,
  });

  const event = await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `Lake source ${source.id} cites claim ${input.claimId}`,
    payload: { lakeObjectId: source.id, claimId: input.claimId },
  }, root);

  const sourceNode = await upsertNode(root, {
    id: `src:${source.id}`,
    kind: 'source',
    ref: source.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: source.sourceUri,
  });
  const claimNode = await upsertNode(root, {
    id: `claim:${knowledge.id}`,
    kind: 'claim',
    ref: knowledge.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: knowledge.label,
  });
  const eventNode = await upsertNode(root, {
    id: `evt:${event.id}`,
    kind: 'evidence_event',
    ref: event.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: event.summary,
  });
  const store = await load(root);
  const edge: EvidenceGraphEdge = {
    id: cortexId('eg-edge'),
    from: sourceNode.id,
    to: claimNode.id,
    type: 'CITES',
    evidenceRefs: [`evt:${event.id}`, ...input.evidenceRefs],
    createdAt: new Date().toISOString(),
  };
  const support: EvidenceGraphEdge = {
    id: cortexId('eg-edge'),
    from: eventNode.id,
    to: claimNode.id,
    type: 'SUPPORTS',
    evidenceRefs: [`evt:${event.id}`],
    createdAt: edge.createdAt,
  };
  store.edges.push(edge, support);
  await save(root, store);
  return { sourceNode, claimNode, event, edges: [edge, support] };
}

export async function recordLakeContradiction(input: {
  tenantId: string;
  universeId: string;
  partition: MemoryPartition;
  claimA: string;
  claimB: string;
  lakeObjectA: string;
  lakeObjectB: string;
  evidenceRefs: string[];
  root?: string;
}): Promise<{ contradiction: ContradictionRecord; bothSourcesRetained: true }> {
  const root = input.root ?? process.cwd();
  const [a, b] = await Promise.all([
    getLakeObject({ id: input.lakeObjectA, tenantId: input.tenantId, universeId: input.universeId, root }),
    getLakeObject({ id: input.lakeObjectB, tenantId: input.tenantId, universeId: input.universeId, root }),
  ]);
  if (!a || !b) throw new Error('LAKE_OBJECT_NOT_FOUND');
  const contradiction = await recordContradiction({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    claimA: input.claimA,
    claimB: input.claimB,
    evidenceRefs: [`lake:${a.id}`, `lake:${b.id}`, ...input.evidenceRefs],
    root,
  });
  const store = await load(root);
  store.nodes.push({
    id: `ctr:${contradiction.id}`,
    kind: 'contradiction',
    ref: contradiction.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: `${input.claimA} CONTRADICTS ${input.claimB}`,
  });
  store.edges.push({
    id: cortexId('eg-edge'),
    from: `claim:${input.claimA}`,
    to: `claim:${input.claimB}`,
    type: 'CONTRADICTS',
    evidenceRefs: contradiction.evidenceRefs,
    createdAt: contradiction.createdAt,
  });
  await save(root, store);
  return { contradiction, bothSourcesRetained: true };
}

export { transitionContradiction, listContradictions };

export async function promoteLakeClaim(input: {
  text: string;
  tenantId: string;
  universeId: string;
  lakeObjectId?: string;
  aiAgreementOnly?: boolean;
  needsExternalFreshness?: boolean;
  needsCloudProvider?: boolean;
  humanVerified?: boolean;
  root?: string;
}): Promise<{
  state: 'SUPPORTED' | 'UNVERIFIED' | 'REVIEW_REQUIRED' | 'WAITING_DATA' | 'UNAVAILABLE';
  promotedToVerified: false;
  allowed: boolean;
  reason: string;
  inventedPass: false;
}> {
  if (input.needsExternalFreshness) {
    return {
      state: 'WAITING_DATA',
      promotedToVerified: false,
      allowed: false,
      reason: 'Current external evidence is required; the promotion gate will not invent freshness or PASS.',
      inventedPass: false,
    };
  }
  if (input.needsCloudProvider) {
    return {
      state: 'UNAVAILABLE',
      promotedToVerified: false,
      allowed: false,
      reason: 'Cloud-only evidence promotion is unavailable while offline.',
      inventedPass: false,
    };
  }
  const root = input.root ?? process.cwd();
  const events = await listEvidenceEvents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'evidence',
    root,
  });
  const source = input.lakeObjectId
    ? await getLakeObject({
      id: input.lakeObjectId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      root,
    })
    : null;
  const matching = events.filter((event) =>
    !input.lakeObjectId || event.payload.lakeObjectId === input.lakeObjectId,
  );
  const evidence = source && matching.length
    ? {
      source: source.sourceUri,
      retrievedAt: source.ingestedAt,
      reference: `lake:${source.id}`,
    }
    : null;
  const result = promoteKnowledge({
    text: input.text,
    evidence,
    aiAgreementOnly: input.aiAgreementOnly === true,
  });
  if ('allowed' in result && result.allowed === false) {
    const state = result.state === 'REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' as const : 'UNVERIFIED' as const;
    return {
      state,
      promotedToVerified: false,
      allowed: false,
      reason: result.reason,
      inventedPass: false,
    };
  }
  if (input.humanVerified !== true) {
    return {
      state: 'SUPPORTED',
      promotedToVerified: false,
      allowed: true,
      reason: 'Evidence Promotion Gate reused. Supported is not VERIFIED and is not a Windows-node PASS.',
      inventedPass: false,
    };
  }
  return {
    state: 'SUPPORTED',
    promotedToVerified: false,
    allowed: true,
    reason: 'Human review is recorded locally. Auto-promotion to VERIFIED/PASS remains forbidden.',
    inventedPass: false,
  };
}

export async function evidenceGraphStats(root = process.cwd()) {
  const store = await load(root);
  return {
    nodes: store.nodes.length,
    edges: store.edges.length,
    contradictions: store.edges.filter((edge) => edge.type === 'CONTRADICTS').length,
    productionAuthorization: false as const,
  };
}
