/**
 * 62L-EX11 — Tenant / Universe scoped evidence query API.
 * Cross-tenant and cross-Universe access → DENIED.
 * Revoked items excluded from active routing queries.
 */

import type {
  EvidenceDenial,
  EvidenceState,
  QuantumEvidenceItem,
} from './evidence-types.ts';

export type EvidenceQueryScope = {
  tenantId: string;
  universeId: string;
};

export type EvidenceQueryFilter = {
  evidenceType?: QuantumEvidenceItem['evidenceType'];
  classification?: QuantumEvidenceItem['classification'];
  evidenceState?: EvidenceState;
  missionId?: string;
  includeRevoked?: boolean;
  includeRejected?: boolean;
  activeRoutingOnly?: boolean;
};

const ACTIVE_ROUTING_STATES: ReadonlySet<EvidenceState> = new Set([
  'SUPPORTED',
  'MEASURED',
  'VERIFIED',
  'REPRODUCIBLE',
]);

export function assertScopeAccess(
  item: Pick<QuantumEvidenceItem, 'tenantId' | 'universeId'>,
  scope: EvidenceQueryScope,
): true | EvidenceDenial {
  if (item.tenantId !== scope.tenantId) {
    return {
      ok: false,
      denied: true,
      reason: 'CROSS_TENANT_DENIED',
      disposition: 'DENIED',
    };
  }
  if (item.universeId !== scope.universeId) {
    return {
      ok: false,
      denied: true,
      reason: 'CROSS_UNIVERSE_DENIED',
      disposition: 'DENIED',
    };
  }
  return true;
}

export function isActiveRoutingCandidate(item: QuantumEvidenceItem): boolean {
  if (item.evidenceState === 'REVOKED' || item.evidenceState === 'REJECTED') return false;
  if (item.evidenceState === 'STALE' || item.evidenceState === 'CONTRADICTED') return false;
  if (item.evidenceState === 'REGRESSED' || item.evidenceState === 'UNVERIFIED') return false;
  if (item.reviewState === 'REJECTED' || item.reviewState === 'QUARANTINED') return false;
  if (item.syncDisposition === 'QUARANTINED' || item.syncDisposition === 'DENIED') return false;
  if (item.historicalOnly) return false;
  return ACTIVE_ROUTING_STATES.has(item.evidenceState);
}

export function queryEvidence(
  items: readonly QuantumEvidenceItem[],
  scope: EvidenceQueryScope,
  filter: EvidenceQueryFilter = {},
):
  | { ok: true; items: readonly QuantumEvidenceItem[] }
  | EvidenceDenial {
  // Scope is mandatory — refuse empty / wildcard scopes.
  if (!scope.tenantId || !scope.universeId) {
    return {
      ok: false,
      denied: true,
      reason: 'SCOPE_REQUIRED',
      disposition: 'DENIED',
    };
  }

  const out: QuantumEvidenceItem[] = [];
  for (const item of items) {
    const access = assertScopeAccess(item, scope);
    if (access !== true) continue; // other tenants/universes simply invisible, not leaked

    if (filter.evidenceType && item.evidenceType !== filter.evidenceType) continue;
    if (filter.classification && item.classification !== filter.classification) continue;
    if (filter.evidenceState && item.evidenceState !== filter.evidenceState) continue;
    if (filter.missionId && item.missionId !== filter.missionId) continue;

    if (!filter.includeRevoked && item.evidenceState === 'REVOKED') continue;
    if (!filter.includeRejected && item.evidenceState === 'REJECTED') continue;

    if (filter.activeRoutingOnly && !isActiveRoutingCandidate(item)) continue;

    out.push(item);
  }
  return { ok: true, items: out };
}

export function getEvidenceById(
  items: readonly QuantumEvidenceItem[],
  evidenceId: string,
  scope: EvidenceQueryScope,
): { ok: true; item: QuantumEvidenceItem } | EvidenceDenial {
  const item = items.find((e) => e.evidenceId === evidenceId);
  if (!item) {
    return {
      ok: false,
      denied: true,
      reason: 'EVIDENCE_NOT_FOUND',
      disposition: 'DENIED',
    };
  }
  const access = assertScopeAccess(item, scope);
  if (access !== true) return access;
  return { ok: true, item };
}
