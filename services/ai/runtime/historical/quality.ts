export type DataQualityDimension = 'reliability' | 'completeness' | 'freshness' | 'consistency' | 'provenance';

export type DataQualityFinding = {
  dimension: DataQualityDimension;
  score: number | 'not_measured';
  explanation: string;
};

export type DataReliabilityScore = { value: number | 'not_measured'; explanation: string };
export type DataCompletenessScore = { value: number | 'not_measured'; explanation: string };
export type DataFreshnessScore = { value: number | 'not_measured'; explanation: string };
export type DataConsistencyScore = { value: number | 'not_measured'; explanation: string };
export type DataProvenanceScore = { value: number | 'not_measured'; explanation: string };

export type DataQualityAssessment = {
  findings: readonly DataQualityFinding[];
  certainty: false;
  operationalInsight: false;
};

export function assessHistoricalQuality(input: {
  provenanceComplete: boolean;
  hasValue: boolean;
  historical: boolean;
  freshnessLabel?: string;
  comparableCount?: number;
}): DataQualityAssessment {
  const provenance: DataProvenanceScore = {
    value: input.provenanceComplete ? 100 : 0,
    explanation: input.provenanceComplete ? 'Required provenance fields are present.' : 'Provenance is incomplete.',
  };
  const completeness: DataCompletenessScore = {
    value: input.hasValue ? 70 : 20,
    explanation: input.hasValue ? 'A measured value is present.' : 'Value is missing; score is not certainty.',
  };
  const freshness: DataFreshnessScore = {
    value: 'not_measured',
    explanation: input.freshnessLabel
      ? `Source freshness is ${input.freshnessLabel}. Historical cadence is not treated as live certainty.`
      : 'Historical cadence is not treated as live freshness.',
  };
  const comparable = input.comparableCount ?? 0;
  const consistency: DataConsistencyScore = {
    value: comparable >= 2 ? 60 : 'not_measured',
    explanation:
      comparable >= 2
        ? `${comparable} comparable public observations exist. Consistency is explainable, not certainty.`
        : 'Consistency requires a comparable series.',
  };
  const reliability: DataReliabilityScore = {
    value: input.provenanceComplete && input.hasValue ? 50 : 'not_measured',
    explanation:
      input.provenanceComplete && input.hasValue
        ? 'Public publisher provenance is present. Reliability is not mathematical certainty.'
        : 'Reliability is not inferred from a single incomplete observation.',
  };
  return {
    findings: [
      { dimension: 'provenance', score: provenance.value, explanation: provenance.explanation },
      { dimension: 'completeness', score: completeness.value, explanation: completeness.explanation },
      { dimension: 'freshness', score: freshness.value, explanation: freshness.explanation },
      { dimension: 'reliability', score: reliability.value, explanation: reliability.explanation },
      { dimension: 'consistency', score: consistency.value, explanation: consistency.explanation },
    ],
    certainty: false,
    operationalInsight: false,
  };
}
