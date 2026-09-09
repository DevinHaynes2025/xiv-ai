import { investmentLanguageDenied } from '../market/intelligence';

export type CapitalProfile = {
  companyId: string;
  evidenceBacked: boolean;
  guaranteedWinner: false;
};

export type InvestorDecision = { humanDecision: true; xivRecommendationIsBinding: false };

export function capitalLabelsGuaranteedWinner(): false {
  return false;
}

export function capitalEmitsBuySell(): boolean {
  return investmentLanguageDenied('BUY').allowed || investmentLanguageDenied('SELL').allowed;
}

export function createCapitalProfile(companyId: string, evidence?: { source: string; retrievedAt: string; reference: string } | null): CapitalProfile | { allowed: false; reason: string } {
  if (!evidence?.source || !evidence.retrievedAt || !evidence.reference) {
    return { allowed: false, reason: 'capital_profile_requires_evidence' };
  }
  return { companyId, evidenceBacked: true, guaranteedWinner: false };
}

export function investorDecisionRemainsHuman(): true {
  return true;
}
