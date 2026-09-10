export type RevenueStream = 'SUBSCRIPTION' | 'LICENSE' | 'LONG_TERM_CONTRACT' | 'PLUGIN' | 'CUSTOMIZATION' | 'CONSULTING' | 'ADVERTISING' | 'DATA_SERVICE';
export type CustomerSegment = 'ENTREPRENEUR' | 'SMALL_BUSINESS' | 'MID_MARKET' | 'ENTERPRISE' | 'BANK' | 'PUBLIC_SECTOR';

export interface PricingPlan {
  planId: string;
  name: string;
  segment: CustomerSegment;
  monthlyBaseUsd: number;
  annualBaseUsd: number;
  includedSeats: number;
  includedPlugins: number;
  contractMonths: number;
  revenueStreams: readonly RevenueStream[];
  humanApprovalRequired: true;
}

export const MONETIZATION_GUARDRAILS = {
  forecastsAreScenariosNotGuarantees: true,
  humanApprovalForContracts: true,
  autonomousPaymentsAllowed: false,
  autonomousPriceChangesAllowed: false,
  deceptiveAdvertisingAllowed: false,
  secretsInReportsAllowed: false,
} as const;

export function buildDefaultPricingCatalog(): readonly PricingPlan[] {
  return Object.freeze([
    { planId: 'xiv-founder', name: 'Founder', segment: 'ENTREPRENEUR', monthlyBaseUsd: 49, annualBaseUsd: 490, includedSeats: 1, includedPlugins: 3, contractMonths: 1, revenueStreams: ['SUBSCRIPTION','PLUGIN'], humanApprovalRequired: true },
    { planId: 'xiv-business', name: 'Business', segment: 'SMALL_BUSINESS', monthlyBaseUsd: 299, annualBaseUsd: 2990, includedSeats: 10, includedPlugins: 10, contractMonths: 1, revenueStreams: ['SUBSCRIPTION','PLUGIN','CUSTOMIZATION','CONSULTING'], humanApprovalRequired: true },
    { planId: 'xiv-enterprise', name: 'Enterprise', segment: 'ENTERPRISE', monthlyBaseUsd: 2500, annualBaseUsd: 25000, includedSeats: 100, includedPlugins: 25, contractMonths: 12, revenueStreams: ['LICENSE','LONG_TERM_CONTRACT','PLUGIN','CUSTOMIZATION','CONSULTING'], humanApprovalRequired: true },
    { planId: 'xiv-bank', name: 'Regulated Enterprise', segment: 'BANK', monthlyBaseUsd: 10000, annualBaseUsd: 100000, includedSeats: 250, includedPlugins: 25, contractMonths: 24, revenueStreams: ['LICENSE','LONG_TERM_CONTRACT','CUSTOMIZATION','CONSULTING','DATA_SERVICE'], humanApprovalRequired: true },
  ]);
}

export function quotePlan(plan: PricingPlan, input: { seats: number; pluginAddOns: number; customWorkUsd?: number }): number {
  if (!Number.isInteger(input.seats) || input.seats < 1) throw new Error('valid seat count required');
  if (!Number.isInteger(input.pluginAddOns) || input.pluginAddOns < 0) throw new Error('valid plugin count required');
  const extraSeats = Math.max(0, input.seats - plan.includedSeats) * 20;
  const extraPlugins = Math.max(0, input.pluginAddOns - plan.includedPlugins) * 25;
  return Math.round((plan.monthlyBaseUsd + extraSeats + extraPlugins + Math.max(0, input.customWorkUsd ?? 0)) * 100) / 100;
}
