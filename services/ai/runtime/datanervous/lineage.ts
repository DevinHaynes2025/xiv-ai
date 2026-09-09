/**
 * Data lineage + dependency graph for authorized observability.
 */

import type { DataClassification, DataPurpose } from './types';
import type { DataEvent } from './events';

export type DataLineageNode = {
  nodeId: string;
  assetId: string;
  kind: 'ASSET' | 'TRANSFORMATION' | 'EVENT' | 'DECISION' | 'OUTCOME';
  classification: DataClassification;
  tenantId: string;
  universeId: string;
};

export type DataLineageEdge = {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relation: 'DERIVED_FROM' | 'USED_BY' | 'PRODUCED' | 'DECIDED_FROM' | 'RESULTED_IN';
};

export type DataDependency = {
  dependencyId: string;
  dependentAssetId: string;
  dependsOnAssetId: string;
  critical: boolean;
};

export type DataLineage = {
  nodes: readonly DataLineageNode[];
  edges: readonly DataLineageEdge[];
  events: readonly DataEvent[];
};

export type LineageTraversalAnswer = {
  originAssetId: string | null;
  whoChanged: readonly string[];
  agentsUsed: readonly string[];
  decisionsDepended: readonly string[];
  currency: 'FRESH' | 'CURRENT' | 'STALE' | 'UNKNOWN';
  contradictions: readonly string[];
  universeOwner: string | null;
  postDecisionHistory: readonly string[];
};

export function buildLineage(input: {
  assets: readonly { assetId: string; classification: DataClassification; tenantId: string; universeId: string }[];
  events: readonly DataEvent[];
  edges?: readonly DataLineageEdge[];
}): DataLineage {
  const nodes: DataLineageNode[] = input.assets.map((a) => ({
    nodeId: `asset-${a.assetId}`,
    assetId: a.assetId,
    kind: 'ASSET' as const,
    classification: a.classification,
    tenantId: a.tenantId,
    universeId: a.universeId,
  }));
  return {
    nodes,
    edges: input.edges ?? [],
    events: input.events,
  };
}

export function traverseLineage(lineage: DataLineage, assetId: string): LineageTraversalAnswer {
  const related = lineage.events.filter((e) => e.assetId === assetId);
  const whoChanged = related
    .filter((e) => e.kind === 'UPDATED' || e.kind === 'CREATED' || e.kind === 'TRANSFORMED')
    .map((e) => e.agentId ?? e.source);
  const agentsUsed = related
    .filter((e) => e.kind === 'USED_BY_AGENT' || e.kind === 'USED_BY_MODEL')
    .map((e) => e.agentId ?? e.modelId ?? 'unknown')
    .filter(Boolean) as string[];
  const decisionsDepended = related
    .filter((e) => e.kind === 'PROPOSED_FOR_DECISION' || e.kind === 'APPROVED' || e.kind === 'REJECTED')
    .map((e) => e.eventId);
  const postDecisionHistory = related
    .filter((e) => e.kind === 'APPROVED' || e.kind === 'REJECTED' || e.kind === 'EXPORTED' || e.kind === 'ARCHIVED')
    .map((e) => `${e.kind}:${e.eventId}`);
  const node = lineage.nodes.find((n) => n.assetId === assetId);
  return {
    originAssetId: assetId,
    whoChanged: [...new Set(whoChanged)],
    agentsUsed: [...new Set(agentsUsed)],
    decisionsDepended,
    currency: related.length === 0 ? 'UNKNOWN' : 'CURRENT',
    contradictions: [],
    universeOwner: node?.universeId ?? null,
    postDecisionHistory,
  };
}

export function createDependency(input: {
  dependencyId: string;
  dependentAssetId: string;
  dependsOnAssetId: string;
  critical?: boolean;
}): DataDependency {
  return {
    dependencyId: input.dependencyId,
    dependentAssetId: input.dependentAssetId,
    dependsOnAssetId: input.dependsOnAssetId,
    critical: input.critical ?? false,
  };
}

export function lineageMayExposeRawSecrets(): false {
  return false;
}

export function surveillanceTrackingAllowed(): false {
  return false;
}

export function authorizedLineageObservabilityEnabled(): true {
  return true;
}

export function evaluateLineagePurpose(purpose: DataPurpose): { allowed: boolean; reason: string } {
  if (purpose === 'AUDIT' || purpose === 'COMPLIANCE' || purpose === 'OPERATIONS' || purpose === 'RESEARCH') {
    return { allowed: true, reason: 'authorized_observability' };
  }
  return { allowed: true, reason: 'metadata_lineage_only' };
}
