/**
 * 2I-AI-62I → 62J → 62K neural pathway brain upload.
 * Registers queued architecture as COMPANY-lane UNVERIFIED knowledge.
 * Does not implement Foundry, Lab, or Enterprise OS.
 *
 * Unique park suffix: -aec6
 */

import {
  createKnowledgeNode,
  linkKnowledgeNodes,
  openXivBrainV4,
  type KnowledgeEdge,
  type KnowledgeNode,
  type XivBrainV4,
} from '../neuralbrain/brain';

export const PATHWAY_ID = 'xiv-brain-pathway:2I-AI-62I-62J-62K' as const;
export const PATHWAY_LIVE = false;
export const PATHWAY_CREATES_AUTHORITY = false;
export const PATHWAY_QUALITY = 'UNVERIFIED' as const;

const TENANT = 'xiv-architecture-queue';
const UNIVERSE = 'xiv-v2-queued';

export const PATHWAY_STORY_IDS = ['2I-AI-62H', '2I-AI-62I', '2I-AI-62J', '2I-AI-62K', '2I-AI-62L'] as const;

export const PATHWAY_CURRENT = '2I-AI-62K' as const;
export const PATHWAY_NEXT = '2I-AI-62L' as const;

const SUMMARIES: Record<(typeof PATHWAY_STORY_IDS)[number], string> = {
  '2I-AI-62H': 'Galaxy Federation + Civilization Control — queued sibling park, compose only.',
  '2I-AI-62I':
    'Adaptive Agent Foundry, Tool Mesh, Learning Pipeline & Accelerator Intelligence OS — reuse before create; ephemeral specialists; Night Shift recommendations only.',
  '2I-AI-62J':
    'Self-Improvement Lab, Governed Software Factory & Experimentation Engine — never AI idea → production; autonomous production changes = 0.',
  '2I-AI-62K':
    'Enterprise Operating System, Business Digital Twin & Executive Command — Business Hospital; read before write; human executive decision.',
  '2I-AI-62L':
    'Industry Network, Multi-Enterprise Intelligence & Business Media Graph — NEXT title only; do not start.',
};

export function createPathwayNode(storyId: (typeof PATHWAY_STORY_IDS)[number]): KnowledgeNode {
  return createKnowledgeNode({
    nodeId: `queue:${storyId}`,
    kind: 'ResearchNode',
    lane: 'COMPANY',
    tenantId: TENANT,
    universeId: UNIVERSE,
    quality: PATHWAY_QUALITY,
    summary: SUMMARIES[storyId],
    evidenceRefs: [`docs/queue/${storyId}`],
    confidence: 0,
    freshness: 'UNKNOWN',
  });
}

export function openQueuedArchitecturePathway(): {
  brain: XivBrainV4;
  nodes: readonly KnowledgeNode[];
  edges: readonly KnowledgeEdge[];
  current: typeof PATHWAY_CURRENT;
  next: typeof PATHWAY_NEXT;
  productionLive: false;
  createsAuthority: false;
  l4Enabled: false;
} {
  const nodes = PATHWAY_STORY_IDS.map(createPathwayNode);
  const edges: KnowledgeEdge[] = [];

  for (let index = 0; index < nodes.length - 1; index += 1) {
    const linked = linkKnowledgeNodes({
      edgeId: `pathway:${PATHWAY_STORY_IDS[index]}→${PATHWAY_STORY_IDS[index + 1]}`,
      from: nodes[index],
      to: nodes[index + 1],
      relation: 'REFERENCES',
    });
    if ('allowed' in linked && linked.allowed === false) {
      throw new Error(`pathway_link_denied:${linked.reason}`);
    }
    edges.push(linked as KnowledgeEdge);
  }

  const brain = openXivBrainV4();
  return {
    brain: {
      ...brain,
      nodes,
      edges,
    },
    nodes,
    edges,
    current: PATHWAY_CURRENT,
    next: PATHWAY_NEXT,
    productionLive: false,
    createsAuthority: false,
    l4Enabled: false,
  };
}

export function denyCrossTenantPathwayLink(): { allowed: false; reason: string } {
  const from = createKnowledgeNode({
    nodeId: 'queue:tenant-a',
    kind: 'ResearchNode',
    lane: 'COMPANY',
    tenantId: 'enterprise-a',
    universeId: UNIVERSE,
    summary: 'Enterprise A queued knowledge',
  });
  const to = createKnowledgeNode({
    nodeId: 'queue:tenant-b',
    kind: 'ResearchNode',
    lane: 'COMPANY',
    tenantId: 'enterprise-b',
    universeId: UNIVERSE,
    summary: 'Enterprise B queued knowledge',
  });
  const linked = linkKnowledgeNodes({
    edgeId: 'illegal-cross-tenant',
    from,
    to,
    relation: 'REFERENCES',
  });
  if ('allowed' in linked && linked.allowed === false) {
    return { allowed: false, reason: linked.reason };
  }
  return { allowed: false, reason: 'cross_tenant_pathway_must_deny' };
}

export function denyUnverifiedToVerifiedPromotion(): { allowed: false; reason: string } {
  return { allowed: false, reason: 'queued_docs_cannot_self_promote_to_verified' };
}

export function denyPathwayCreatesEnterpriseAccess(): { allowed: false; reason: string } {
  return { allowed: false, reason: 'brain_upload_does_not_authorize_enterprise_connection' };
}

export function denyPathwayCreatesAgents(): { allowed: false; reason: string } {
  return { allowed: false, reason: 'brain_upload_does_not_mint_agents' };
}

export function pathwayIsImplemented(): false {
  return false;
}
