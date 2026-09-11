export type InsightStatus = 'DRAFT'|'REVIEWED'|'APPROVED'|'REJECTED';

export interface AggregateInsight {
  insightId: string;
  metric: string;
  cohortSize: number;
  sourceCount: number;
  deidentified: boolean;
  aggregated: boolean;
  kThreshold: number;
  status: InsightStatus;
  evidenceRefs: string[];
  containsRawPersonalData: boolean;
}

export function canLicenseInsight(i: AggregateInsight): boolean {
  return i.status === 'APPROVED' && i.deidentified && i.aggregated && !i.containsRawPersonalData && i.cohortSize >= i.kThreshold && i.evidenceRefs.length > 0;
}

export const dataCooperativePolicy = {
  rawPersonalProfilesForSale: false,
  exactLocationForSale: false,
  individualViewingHistoryForSale: false,
  individualEmotionProfileForSale: false,
  aggregateInsightProductsAllowed: true,
  userConsentAndPolicyReviewRequired: true,
  reidentificationProhibited: true,
};
