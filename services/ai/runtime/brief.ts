import type { LiveSourceStatus } from './context/adapters/types';
import type { DataProvenance } from './context/adapters/types';
import type { BusinessHealthReport } from './context/report';
import type { OrganizationContextSlice } from './context/types';

export type DataAvailabilityStatus = LiveSourceStatus | 'prototype';

export type ExecutiveBrief = {
  organization: OrganizationContextSlice | { id: string; name: string };
  universe: { universeId: string | null };
  generatedAt: string;
  dataStatus: DataAvailabilityStatus;
  sources: readonly string[];
  topRisks: readonly string[];
  topOpportunities: readonly string[];
  criticalChanges: readonly string[];
  recommendedPriorities: readonly string[];
  decisionsAwaitingApproval: readonly string[];
  confidence: 'low' | 'medium' | 'high';
  freshness: DataProvenance['freshness'];
  financialImpactClaimed: false;
  prototype: boolean;
};

export function buildExecutiveBrief(input: {
  report?: BusinessHealthReport | null;
  liveStatus: DataAvailabilityStatus;
  provenance?: DataProvenance | null;
  pendingDecisions?: readonly string[];
}): ExecutiveBrief {
  const live = input.liveStatus === 'live';
  const prototype = input.liveStatus === 'prototype';
  const unavailable = input.liveStatus === 'unavailable' || input.liveStatus === 'not_configured' || input.liveStatus === 'stale';

  return {
    organization: input.report?.organization ?? { id: 'unknown', name: 'Unknown organization' },
    universe: { universeId: input.provenance?.universeId ?? null },
    generatedAt: new Date().toISOString(),
    dataStatus: input.liveStatus,
    sources: input.provenance
      ? [`${input.provenance.sourceSystem}:${input.provenance.sourceType}`]
      : input.report?.sourceSummary ?? ['unspecified'],
    topRisks: unavailable ? [] : input.report?.topRisks ?? [],
    topOpportunities: unavailable ? [] : input.report?.topOpportunities ?? [],
    criticalChanges: unavailable ? ['Live source unavailable'] : [],
    recommendedPriorities: unavailable
      ? ['Do not treat prototype sample as live company data.']
      : input.report?.topOpportunities.slice(0, 2) ?? [],
    decisionsAwaitingApproval: input.pendingDecisions ?? [],
    confidence: live ? input.provenance?.confidence ?? 'medium' : prototype ? 'low' : 'low',
    freshness: input.provenance?.freshness ?? (prototype ? 'sample' : 'unknown'),
    financialImpactClaimed: false,
    prototype,
  };
}
