export interface MonetizationEvidenceReport {
  generatedAt: string;
  activeOffers: number;
  signedContracts: number;
  payingCustomers: number;
  monthlyRecurringRevenueUsd: number;
  annualRecurringRevenueUsd: number;
  evidenceRefs: readonly string[];
  scenarioRevenueExcluded: true;
}

export function buildMonetizationEvidenceReport(input: Omit<MonetizationEvidenceReport, 'annualRecurringRevenueUsd' | 'scenarioRevenueExcluded'>): MonetizationEvidenceReport {
  if (input.signedContracts > 0 && input.evidenceRefs.length === 0) throw new Error('contract evidence required');
  if (input.payingCustomers > 0 && input.evidenceRefs.length === 0) throw new Error('customer evidence required');
  return Object.freeze({
    ...input,
    annualRecurringRevenueUsd: Math.round(input.monthlyRecurringRevenueUsd * 12 * 100) / 100,
    scenarioRevenueExcluded: true,
  });
}
