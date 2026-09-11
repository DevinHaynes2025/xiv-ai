export type BriefingSourceType = 'USER_APPROVED_LOCAL'|'PUBLIC_MARKET'|'PUBLIC_HISTORY'|'PARTNER_APPROVED'|'MANUAL';

export interface BriefingEvidence {
  ref: string;
  sourceType: BriefingSourceType;
  confidence: number;
  classification: 'PUBLIC'|'PRIVATE'|'CONFIDENTIAL'|'TOP_SECRET';
}

export interface DailyBriefing {
  userId: string;
  generatedAt: string;
  topics: string[];
  evidence: BriefingEvidence[];
  tailored: boolean;
  containsUnsupportedFact: boolean;
}

export function canPublishHistoricalArticle(b: DailyBriefing): boolean {
  return b.evidence.length > 0 && !b.containsUnsupportedFact && b.evidence.every(e => e.classification === 'PUBLIC' && e.confidence >= 0.75);
}

export const briefingPolicy = {
  storyFirstEvidenceSecondRawThird: true,
  historicalClaimsRequireEvidence: true,
  userPrivateDataMayPersonalizeLocally: true,
  privateDataMayBePublished: false,
  marketAnalysisIsNotGuaranteedPrediction: true,
};
