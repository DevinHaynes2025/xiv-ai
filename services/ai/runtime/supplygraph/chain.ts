/**
 * Global Supply Chain Graph + Information Logistics Center.
 * Missing links = UNKNOWN. Relationships carry source/provenance/confidence/scope/rights.
 */

import {
  INFORMATION_LOGISTICS_STAGES,
  SUPPLY_CHAIN_NODE_KINDS,
  type InformationLogisticsStage,
  type SupplyChainNodeKind,
} from './types';

export type SupplyChainNode = {
  nodeId: string;
  kind: SupplyChainNodeKind;
  tenantId: string;
  universeId: string;
  owner: string;
  status: 'KNOWN' | 'UNKNOWN' | 'DEGRADED';
};

export type SupplyChainRelationship = {
  relationshipId: string;
  fromId: string;
  toId: string;
  source: string;
  provenance: string;
  confidence: number;
  time: string | null;
  geography: string | null;
  tenantId: string;
  universeId: string;
  rights: string;
  freshness: string;
  missing: boolean;
};

export type InformationLogisticsRecord = {
  recordId: string;
  what: string;
  where: string;
  owner: string;
  whoMayAccess: readonly string[];
  why: string;
  freshness: string;
  movement: InformationLogisticsStage;
  dependencies: readonly string[];
  evidence: string;
  actions: readonly string[];
  tenantId: string;
  universeId: string;
};

export function listSupplyChainNodeKinds(): readonly SupplyChainNodeKind[] {
  return SUPPLY_CHAIN_NODE_KINDS;
}

export function listInformationLogisticsStages(): readonly InformationLogisticsStage[] {
  return INFORMATION_LOGISTICS_STAGES;
}

export function openSupplyChainGraph(input: { tenantId: string; universeId: string }) {
  const nodes: SupplyChainNode[] = SUPPLY_CHAIN_NODE_KINDS.map((kind) => ({
    nodeId: `${kind.toLowerCase()}-stub`,
    kind,
    tenantId: input.tenantId,
    universeId: input.universeId,
    owner: 'UNASSIGNED',
    status: 'UNKNOWN' as const,
  }));
  return {
    nodes,
    relationships: [] as SupplyChainRelationship[],
    missingLinksDefaultToUnknown: true as const,
    copiesEveryDatabase: false as const,
    productionLive: false as const,
  };
}

export function linkSupplyChainNodes(input: {
  relationshipId: string;
  from: SupplyChainNode;
  to: SupplyChainNode;
  source?: string;
  provenance?: string;
  confidence?: number;
  rights?: string;
  freshness?: string;
  time?: string | null;
  geography?: string | null;
}): { allowed: true; relationship: SupplyChainRelationship } | { allowed: false; reason: string } {
  if (input.from.tenantId !== input.to.tenantId) {
    return { allowed: false, reason: 'cross_tenant_link_denied' };
  }
  if (input.from.universeId !== input.to.universeId) {
    return { allowed: false, reason: 'cross_universe_link_denied' };
  }
  const missing = !input.source || !input.provenance || input.confidence === undefined;
  return {
    allowed: true,
    relationship: {
      relationshipId: input.relationshipId,
      fromId: input.from.nodeId,
      toId: input.to.nodeId,
      source: input.source ?? 'UNKNOWN',
      provenance: input.provenance ?? 'UNKNOWN',
      confidence: input.confidence ?? 0,
      time: input.time ?? null,
      geography: input.geography ?? null,
      tenantId: input.from.tenantId,
      universeId: input.from.universeId,
      rights: input.rights ?? 'UNKNOWN',
      freshness: input.freshness ?? 'UNKNOWN',
      missing,
    },
  };
}

export function openInformationLogisticsCenter(input: { tenantId: string; universeId: string }) {
  return {
    tenantId: input.tenantId,
    universeId: input.universeId,
    stages: INFORMATION_LOGISTICS_STAGES,
    tracks: [
      'what',
      'where',
      'who_owns',
      'who_may_access',
      'why',
      'freshness',
      'movement',
      'dependencies',
      'evidence',
      'actions',
    ] as const,
    productionLive: false as const,
  };
}

export function advanceInformationLogistics(input: {
  record: InformationLogisticsRecord;
  next: InformationLogisticsStage;
  evidencePresent: boolean;
  accessAuthorized: boolean;
}): { allowed: true; record: InformationLogisticsRecord } | { allowed: false; reason: string } {
  if (!input.accessAuthorized) {
    return { allowed: false, reason: 'access_not_authorized' };
  }
  if (!input.evidencePresent && (input.next === 'VERIFY' || input.next === 'DECIDE' || input.next === 'ACT')) {
    return { allowed: false, reason: 'evidence_required' };
  }
  const currentIdx = INFORMATION_LOGISTICS_STAGES.indexOf(input.record.movement);
  const nextIdx = INFORMATION_LOGISTICS_STAGES.indexOf(input.next);
  if (nextIdx < 0 || nextIdx > currentIdx + 1) {
    return { allowed: false, reason: 'stage_skip_forbidden' };
  }
  return {
    allowed: true,
    record: {
      ...input.record,
      movement: input.next,
    },
  };
}

export function createLogisticsRecord(input: {
  recordId: string;
  what: string;
  where: string;
  owner: string;
  whoMayAccess: readonly string[];
  why: string;
  tenantId: string;
  universeId: string;
}): InformationLogisticsRecord {
  return {
    recordId: input.recordId,
    what: input.what,
    where: input.where,
    owner: input.owner,
    whoMayAccess: input.whoMayAccess,
    why: input.why,
    freshness: 'UNKNOWN',
    movement: 'SOURCE',
    dependencies: [],
    evidence: 'NONE',
    actions: [],
    tenantId: input.tenantId,
    universeId: input.universeId,
  };
}

export function evaluateLineageAccess(input: {
  record: InformationLogisticsRecord;
  actorId: string;
  tenantId: string;
  universeId: string;
}): { allowed: boolean; reason: string } {
  if (input.record.tenantId !== input.tenantId) {
    return { allowed: false, reason: 'tenant_isolation' };
  }
  if (input.record.universeId !== input.universeId) {
    return { allowed: false, reason: 'universe_isolation' };
  }
  if (!input.record.whoMayAccess.includes(input.actorId) && input.record.owner !== input.actorId) {
    return { allowed: false, reason: 'access_denied' };
  }
  return { allowed: true, reason: 'lineage_access_ok' };
}
