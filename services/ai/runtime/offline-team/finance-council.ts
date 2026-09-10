export type FinanceAgentRole = 'CFO' | 'ACCOUNTANT' | 'PRICING_ANALYST' | 'CONTRACT_ANALYST' | 'REVENUE_OPERATIONS' | 'COST_ANALYST' | 'RISK_REVIEWER';

export interface FinanceRecommendation {
  recommendationId: string;
  role: FinanceAgentRole;
  title: string;
  rationale: string;
  estimatedMonthlyImpactUsd: number;
  confidence: number;
  evidenceRefs: readonly string[];
  requiresHumanApproval: true;
}

export const FINANCE_COUNCIL_GUARDRAILS = {
  advisoryOnly: true,
  mayExecutePayments: false,
  maySignContracts: false,
  mayOpenBankAccounts: false,
  mayChangeProductionPricing: false,
  evidenceRequired: true,
} as const;

export function rankFinanceRecommendations(items: readonly FinanceRecommendation[]): readonly FinanceRecommendation[] {
  const valid = items.filter((item) => item.confidence >= 0 && item.confidence <= 1 && item.evidenceRefs.length > 0);
  return Object.freeze([...valid].sort((a, b) => (b.estimatedMonthlyImpactUsd * b.confidence) - (a.estimatedMonthlyImpactUsd * a.confidence)));
}

export function summarizeFinanceCouncil(items: readonly FinanceRecommendation[]) {
  const ranked = rankFinanceRecommendations(items);
  return Object.freeze({
    recommendations: ranked,
    projectedMonthlyImpactUsd: Math.round(ranked.reduce((sum, item) => sum + item.estimatedMonthlyImpactUsd, 0) * 100) / 100,
    requiresHumanApproval: true as const,
    executionAuthorized: false as const,
  });
}
