export interface RevenueScenarioInput {
  name: string;
  customers: number;
  averageMonthlyRevenuePerCustomerUsd: number;
  monthlyChurnRate: number;
  grossMargin: number;
  monthlyFixedCostUsd: number;
  monthlyVariableCostPerCustomerUsd: number;
}

export interface RevenueScenarioResult extends RevenueScenarioInput {
  monthlyRevenueUsd: number;
  monthlyGrossProfitUsd: number;
  monthlyOperatingProfitUsd: number;
  annualizedRevenueUsd: number;
  annualizedOperatingProfitUsd: number;
  scenarioOnly: true;
}

export const REVENUE_SCENARIO_GUARDRAILS = {
  scenarioOnly: true,
  guaranteedOutcome: false,
  investorClaimAllowedWithoutEvidence: false,
} as const;

export function simulateRevenue(input: RevenueScenarioInput): RevenueScenarioResult {
  if (!Number.isFinite(input.customers) || input.customers < 0) throw new Error('customers must be nonnegative');
  if (input.monthlyChurnRate < 0 || input.monthlyChurnRate > 1) throw new Error('churn must be between 0 and 1');
  if (input.grossMargin < 0 || input.grossMargin > 1) throw new Error('gross margin must be between 0 and 1');
  const retainedCustomers = input.customers * (1 - input.monthlyChurnRate);
  const monthlyRevenueUsd = retainedCustomers * input.averageMonthlyRevenuePerCustomerUsd;
  const monthlyGrossProfitUsd = monthlyRevenueUsd * input.grossMargin;
  const monthlyOperatingProfitUsd = monthlyGrossProfitUsd - input.monthlyFixedCostUsd - (retainedCustomers * input.monthlyVariableCostPerCustomerUsd);
  const round = (value: number) => Math.round(value * 100) / 100;
  return Object.freeze({
    ...input,
    monthlyRevenueUsd: round(monthlyRevenueUsd),
    monthlyGrossProfitUsd: round(monthlyGrossProfitUsd),
    monthlyOperatingProfitUsd: round(monthlyOperatingProfitUsd),
    annualizedRevenueUsd: round(monthlyRevenueUsd * 12),
    annualizedOperatingProfitUsd: round(monthlyOperatingProfitUsd * 12),
    scenarioOnly: true,
  });
}
