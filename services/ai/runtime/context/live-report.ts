import type { DataProvenance, LiveSourceStatus } from './adapters/types';
import type { BusinessHealthReport } from './report';

export function buildUnavailableHealthReport(input: {
  status: LiveSourceStatus;
  provenance: DataProvenance | null;
  organizationName?: string;
}): BusinessHealthReport {
  const label = input.status === 'stale' ? 'STALE DATA' : 'Live source unavailable';
  return {
    organization: {
      id: input.provenance?.organizationId ?? 'unknown',
      name: input.organizationName ?? 'Unknown organization',
      industry: 'unknown',
      region: 'unknown',
    },
    overallStatus: 'unknown',
    overallScore: 0,
    topRisks: [],
    topOpportunities: [],
    findings: [],
    narrativeSummary: label,
    sourceSummary: [],
    generatedAt: new Date().toISOString(),
    prototype: false,
    dataStatus: input.status,
    provenance: input.provenance,
    usedPrototypeFallback: false,
  };
}
