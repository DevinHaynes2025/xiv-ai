import type { SecFactRecord, SecFinancialMetricKind } from '../providers/sec-edgar';

export type RevenueObservation = SecFinancialObservation & { metric: 'revenue' };
export type NetIncomeObservation = SecFinancialObservation & { metric: 'net_income' };
export type AssetsObservation = SecFinancialObservation & { metric: 'assets' };
export type LiabilitiesObservation = SecFinancialObservation & { metric: 'liabilities' };
export type CashObservation = SecFinancialObservation & { metric: 'cash' };
export type OperatingIncomeObservation = SecFinancialObservation & { metric: 'operating_income' };
export type EquityObservation = SecFinancialObservation & { metric: 'equity' };

export type SecFinancialObservation = {
  observationId: string;
  companyCik: string;
  legalName: string;
  metric: SecFinancialMetricKind;
  period: string;
  value: number;
  unit: string;
  filing: string;
  accession: string;
  retrievedAt: string;
  sourceRecordId: string;
  sourceId: 'us_sec_edgar';
  classification: 'public';
  usageRights: string;
  fabricated: false;
};

export function financialObservationFromSecFact(fact: SecFactRecord): SecFinancialObservation | { allowed: false; reason: string } {
  if (typeof fact.value !== 'number') {
    return { allowed: false, reason: 'Missing financial fact is not fabricated.' };
  }
  if (!fact.cik || !fact.sourceRecordId || !fact.period || !fact.retrievedAt) {
    return { allowed: false, reason: 'Missing provenance rejected.' };
  }
  return {
    observationId: fact.sourceRecordId,
    companyCik: fact.cik,
    legalName: fact.legalName,
    metric: fact.metric,
    period: fact.period,
    value: fact.value,
    unit: fact.unit,
    filing: fact.form,
    accession: fact.accession,
    retrievedAt: fact.retrievedAt,
    sourceRecordId: fact.sourceRecordId,
    sourceId: 'us_sec_edgar',
    classification: 'public',
    usageRights: fact.usageRights,
    fabricated: false,
  };
}

export function omitMissingFinancialFact(_metric: SecFinancialMetricKind, available: readonly SecFactRecord[]) {
  void _metric;
  return available.filter((item) => typeof item.value === 'number');
}
