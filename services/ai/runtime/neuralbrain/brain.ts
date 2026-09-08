/**
 * XIV Brain V4 — separated lanes; no automatic cross-lane promotion.
 */

import {
  BRAIN_LANES,
  KNOWLEDGE_NODE_KINDS,
  KNOWLEDGE_QUALITY_STATES,
  type BrainLane,
  type KnowledgeNodeKind,
  type KnowledgeQualityState,
} from './types';

export type KnowledgeNode = {
  nodeId: string;
  kind: KnowledgeNodeKind;
  lane: BrainLane;
  tenantId: string;
  universeId: string;
  quality: KnowledgeQualityState;
  summary: string;
  evidenceRefs: readonly string[];
  confidence: number;
  freshness: 'FRESH' | 'CURRENT' | 'STALE' | 'UNKNOWN';
};

export type KnowledgeEdge = {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relation: 'SUPPORTS' | 'CONTRADICTS' | 'DERIVES' | 'DECIDES' | 'LEARNS' | 'REFERENCES';
  fromLane: BrainLane;
  toLane: BrainLane;
};

export type BrainLaneSurface = {
  lane: BrainLane;
  autoPromoteToCompany: false;
  autoPromoteToGlobal: false;
  autoPromoteToPublic: false;
  productionLive: false;
};

export type XivBrainV4 = {
  lanes: readonly BrainLane[];
  nodes: readonly KnowledgeNode[];
  edges: readonly KnowledgeEdge[];
  personalAutoToCompany: false;
  companyAutoToGlobal: false;
  privateAutoToPublic: false;
  l4Enabled: false;
};

export function listBrainLanes(): readonly BrainLane[] {
  return BRAIN_LANES;
}

export function listKnowledgeNodeKinds(): readonly KnowledgeNodeKind[] {
  return KNOWLEDGE_NODE_KINDS;
}

export function listKnowledgeQualityStates(): readonly KnowledgeQualityState[] {
  return KNOWLEDGE_QUALITY_STATES;
}

export function openXivBrainV4(): XivBrainV4 {
  return {
    lanes: BRAIN_LANES,
    nodes: [],
    edges: [],
    personalAutoToCompany: false,
    companyAutoToGlobal: false,
    privateAutoToPublic: false,
    l4Enabled: false,
  };
}

export function openBrainLane(lane: BrainLane): BrainLaneSurface {
  return {
    lane,
    autoPromoteToCompany: false,
    autoPromoteToGlobal: false,
    autoPromoteToPublic: false,
    productionLive: false,
  };
}

export function createKnowledgeNode(input: {
  nodeId: string;
  kind: KnowledgeNodeKind;
  lane: BrainLane;
  tenantId: string;
  universeId: string;
  quality?: KnowledgeQualityState;
  summary: string;
  evidenceRefs?: readonly string[];
  confidence?: number;
  freshness?: KnowledgeNode['freshness'];
}): KnowledgeNode {
  return {
    nodeId: input.nodeId,
    kind: input.kind,
    lane: input.lane,
    tenantId: input.tenantId,
    universeId: input.universeId,
    quality: input.quality ?? 'UNVERIFIED',
    summary: input.summary,
    evidenceRefs: input.evidenceRefs ?? [],
    confidence: input.confidence ?? 0,
    freshness: input.freshness ?? 'UNKNOWN',
  };
}

export function linkKnowledgeNodes(input: {
  edgeId: string;
  from: KnowledgeNode;
  to: KnowledgeNode;
  relation: KnowledgeEdge['relation'];
}): KnowledgeEdge | { allowed: false; reason: string } {
  if (input.from.tenantId !== input.to.tenantId) {
    return { allowed: false, reason: 'cross_tenant_knowledge_link_denied' };
  }
  // Cross-lane links require explicit authorization — never auto-promote content.
  if (input.from.lane !== input.to.lane && input.relation !== 'REFERENCES') {
    return { allowed: false, reason: 'cross_lane_requires_explicit_authorization' };
  }
  return {
    edgeId: input.edgeId,
    fromNodeId: input.from.nodeId,
    toNodeId: input.to.nodeId,
    relation: input.relation,
    fromLane: input.from.lane,
    toLane: input.to.lane,
  };
}

export function personalMayAutoPromoteToCompany(): false {
  return false;
}

export function companyMayAutoPromoteToGlobal(): false {
  return false;
}

export function privateMayAutoPromoteToPublic(): false {
  return false;
}

export function evaluateCrossLanePromotion(input: {
  from: BrainLane;
  to: BrainLane;
  humanAuthorized: boolean;
}): { allowed: boolean; reason: string } {
  if (input.from === input.to) {
    return { allowed: true, reason: 'same_lane' };
  }
  if (!input.humanAuthorized) {
    return { allowed: false, reason: 'cross_lane_promotion_requires_human_authorization' };
  }
  return { allowed: true, reason: 'human_authorized_cross_lane_transfer' };
}
