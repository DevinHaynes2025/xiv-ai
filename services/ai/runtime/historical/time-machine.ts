export type HistoricalComparisonWindow = {
  start: string;
  end: string;
};

export type HistoricalComparableEntity = {
  entityId: string;
  label: string;
};

export type HistoricalComparableEvent = {
  eventId: string;
  kind: string;
};

export type HistoricalSimilarityEvidence = {
  evidenceId: string;
  summary: string;
  sourceId: string;
};

export type HistoricalDifference = {
  dimension: string;
  summary: string;
};

export type HistoricalScenario = {
  scenarioId: string;
  stance: 'forecast' | 'hypothesized';
  destiny: false;
};

export type HistoricalOutcomeComparison = {
  compared: boolean;
  certainty: false;
};

export type BusinessTimeMachineQuery = {
  question: string;
  window: HistoricalComparisonWindow;
};

export type ObservedIndicatorSnapshot = {
  indicatorId: string;
  indicatorName: string;
  period: string;
  value: number | null;
  sourceRecordId: string;
};

export type BusinessTimeMachineReport = {
  query: BusinessTimeMachineQuery;
  periodA: HistoricalComparisonWindow;
  periodB: HistoricalComparisonWindow;
  observedIndicators: readonly ObservedIndicatorSnapshot[];
  similarities: readonly string[];
  differences: readonly HistoricalDifference[];
  timePeriod: HistoricalComparisonWindow;
  evidence: readonly HistoricalSimilarityEvidence[];
  provenance: readonly string[];
  confidence: 'low' | 'medium' | 'high' | 'unknown';
  limitations: readonly string[];
  destiny: false;
  stance: 'hypothesized';
  futurePrediction: false;
};

export function runBusinessTimeMachine(input: {
  query: BusinessTimeMachineQuery;
  evidence: readonly HistoricalSimilarityEvidence[];
  periodB?: HistoricalComparisonWindow;
  observedIndicators?: readonly ObservedIndicatorSnapshot[];
  similarities?: readonly string[];
  differences?: readonly HistoricalDifference[];
}): BusinessTimeMachineReport | { allowed: false; reason: string } {
  if (input.evidence.length === 0) {
    return { allowed: false, reason: 'Historical similarity requires evidence and is not destiny.' };
  }
  const periodB = input.periodB ?? input.query.window;
  return {
    query: input.query,
    periodA: input.query.window,
    periodB,
    observedIndicators: input.observedIndicators ?? [],
    similarities: input.similarities ?? ['Comparable public historical conditions were supplied as evidence.'],
    differences: input.differences ?? [{ dimension: 'unknown_private_state', summary: 'Private company internals are not inferred.' }],
    timePeriod: input.query.window,
    evidence: input.evidence,
    provenance: input.evidence.map((item) => item.sourceId),
    confidence: 'low',
    limitations: [
      'Historical similarity is a scenario, not certainty.',
      'Past pattern is not destiny.',
      'Private Company Brain data is not used.',
      'This is not a deterministic future prediction.',
    ],
    destiny: false,
    stance: 'hypothesized',
    futurePrediction: false,
  };
}

export function compareObservedPeriods(input: {
  periodAYear: string;
  periodBYear: string;
  periodA: readonly ObservedIndicatorSnapshot[];
  periodB: readonly ObservedIndicatorSnapshot[];
}): BusinessTimeMachineReport | { allowed: false; reason: string } {
  const evidence: HistoricalSimilarityEvidence[] = [...input.periodA, ...input.periodB].map((item) => ({
    evidenceId: item.sourceRecordId,
    summary: `${item.indicatorName} ${item.period}=${item.value ?? 'null'}`,
    sourceId: 'world_bank_open_data',
  }));
  const similarities: string[] = [];
  const differences: HistoricalDifference[] = [];
  for (const left of input.periodA) {
    const right = input.periodB.find((item) => item.indicatorId === left.indicatorId);
    if (!right) continue;
    similarities.push(`${left.indicatorName} is observed in both ${left.period} and ${right.period}.`);
    if (typeof left.value === 'number' && typeof right.value === 'number') {
      const delta = right.value - left.value;
      differences.push({
        dimension: left.indicatorId,
        summary: `Observed change from ${left.period} to ${right.period}: ${delta}`,
      });
    }
  }
  return runBusinessTimeMachine({
    query: {
      question: `Compare U.S. public macro conditions in ${input.periodAYear} vs ${input.periodBYear}.`,
      window: { start: input.periodAYear, end: input.periodAYear },
    },
    periodB: { start: input.periodBYear, end: input.periodBYear },
    evidence,
    observedIndicators: [...input.periodA, ...input.periodB],
    similarities,
    differences,
  });
}

export function compareCompanyPeriods(input: {
  cik: string;
  legalName: string;
  periodAYear: string;
  periodBYear: string;
  periodA: readonly ObservedIndicatorSnapshot[];
  periodB: readonly ObservedIndicatorSnapshot[];
  filingActivityA?: readonly string[];
  filingActivityB?: readonly string[];
}): BusinessTimeMachineReport | { allowed: false; reason: string } {
  const evidence: HistoricalSimilarityEvidence[] = [...input.periodA, ...input.periodB].map((item) => ({
    evidenceId: item.sourceRecordId,
    summary: `${item.indicatorName} ${item.period}=${item.value ?? 'null'}`,
    sourceId: 'us_sec_edgar',
  }));
  const similarities: string[] = [];
  const differences: HistoricalDifference[] = [];
  for (const left of input.periodA) {
    const right = input.periodB.find((item) => item.indicatorId === left.indicatorId);
    if (!right) continue;
    similarities.push(`${left.indicatorName} is observed in both ${left.period} and ${right.period}.`);
    if (typeof left.value === 'number' && typeof right.value === 'number') {
      differences.push({
        dimension: left.indicatorId,
        summary: `Observed ${left.indicatorName} change from ${left.period} to ${right.period}: ${right.value - left.value}`,
      });
    }
  }
  if ((input.filingActivityA?.length ?? 0) + (input.filingActivityB?.length ?? 0) > 0) {
    differences.push({
      dimension: 'filing_activity',
      summary: `Period A filings=${input.filingActivityA?.join(',') || 'none'}; Period B filings=${input.filingActivityB?.join(',') || 'none'}`,
    });
  }
  return runBusinessTimeMachine({
    query: {
      question: `Compare ${input.legalName} (${input.cik}) public financial periods ${input.periodAYear} vs ${input.periodBYear}.`,
      window: { start: input.periodAYear, end: input.periodAYear },
    },
    periodB: { start: input.periodBYear, end: input.periodBYear },
    evidence,
    observedIndicators: [...input.periodA, ...input.periodB],
    similarities,
    differences,
  });
}

export function compareCompaniesRequiresEvidenceForBoth(input: {
  leftEvidenceCount: number;
  rightEvidenceCount: number;
}) {
  if (input.leftEvidenceCount === 0 || input.rightEvidenceCount === 0) {
    return {
      allowed: false as const,
      reason: 'Company-to-company Time Machine requires retrieved evidence for both companies.',
    };
  }
  return {
    allowed: false as const,
    executed: false as const,
    reason: 'Company-to-company comparison is designed but this proof compares one company across two periods.',
  };
}

export function historicalSimilarityIsDestiny() {
  return false;
}
