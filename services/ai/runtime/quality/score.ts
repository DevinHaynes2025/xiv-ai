import type { DataScope } from '../context/adapters/scope';

export type QualityMetric = number | 'not_measured';

export type DataQualityScore = {
  freshness: QualityMetric;
  completeness: QualityMetric;
  consistency: QualityMetric;
  provenance: QualityMetric;
  availability: QualityMetric;
  confidence: QualityMetric;
  coverage: QualityMetric;
  operationalInsight: false;
  reason: string;
};

export function scoreAuthorizedRecords(input: {
  recordCount: number;
  scope?: DataScope;
  domain?: string | null;
  provenanceComplete?: boolean;
  freshness?: 'fresh' | 'aging' | 'stale' | 'unknown';
}): DataQualityScore {
  const identityOnly = !input.scope || input.scope === 'personal' || input.domain === 'technology';
  if (identityOnly || input.recordCount === 0) {
    return {
      freshness: input.freshness === 'fresh' ? 92 : input.freshness === 'aging' ? 60 : 'not_measured',
      completeness: input.recordCount > 0 ? 40 : 0,
      consistency: 'not_measured',
      provenance: input.provenanceComplete ? 100 : 0,
      availability: input.recordCount > 0 ? 100 : 0,
      confidence: 21,
      coverage: input.recordCount > 0 ? 21 : 0,
      operationalInsight: false,
      reason:
        'Data Quality Agent scores authorized identity/activity coverage only. Sparse personal records are not converted into operational facts.',
    };
  }
  return {
    freshness: 'not_measured',
    completeness: 'not_measured',
    consistency: 'not_measured',
    provenance: input.provenanceComplete ? 100 : 'not_measured',
    availability: 'not_measured',
    confidence: 'not_measured',
    coverage: 'not_measured',
    operationalInsight: false,
    reason: 'Operational quality is not measured until an authorized live operations source exists.',
  };
}
