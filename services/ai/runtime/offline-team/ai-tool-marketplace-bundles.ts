export type MarketplaceTier = 'FREE' | 'PRO' | 'BUSINESS' | 'ELITE';

export interface ToolBundle {
  bundleId: string;
  name: string;
  tier: MarketplaceTier;
  industry: string;
  toolRefs: string[];
  agentRefs: string[];
  requiresContract: boolean;
  requiresHumanApproval: boolean;
}

export const PREPACKAGED_BUNDLES: ToolBundle[] = [
  { bundleId: 'bundle:free-starter', name: 'XIV Starter', tier: 'FREE', industry: 'GENERAL', toolRefs: ['story-engine','business-health'], agentRefs: ['EXECUTIVE_AGENT'], requiresContract: false, requiresHumanApproval: false },
  { bundleId: 'bundle:ecommerce-pro', name: 'E-Commerce Growth Pack', tier: 'PRO', industry: 'ECOMMERCE', toolRefs: ['customer-signals','inventory-story','visual-intelligence'], agentRefs: ['CUSTOMER_AGENT','SUPPLY_CHAIN_AGENT'], requiresContract: false, requiresHumanApproval: false },
  { bundleId: 'bundle:supply-chain-business', name: 'Supply Chain Operating Pack', tier: 'BUSINESS', industry: 'SUPPLY_CHAIN', toolRefs: ['control-tower','scenario-lab','company-brain-search'], agentRefs: ['SUPPLY_CHAIN_AGENT','FINANCE_AGENT','OPERATIONS_AGENT'], requiresContract: true, requiresHumanApproval: true },
  { bundleId: 'bundle:elite-enterprise', name: 'XIV Elite Enterprise', tier: 'ELITE', industry: 'ENTERPRISE', toolRefs: ['executive-cabinet','private-data-brain','security-center','visual-dashboard'], agentRefs: ['VIRTUAL_COO','CTO','CFO','CISO','CHIEF_DATA','CHIEF_AI'], requiresContract: true, requiresHumanApproval: true },
];

export function bundlesForTier(tier: MarketplaceTier): ToolBundle[] {
  const order: MarketplaceTier[] = ['FREE','PRO','BUSINESS','ELITE'];
  const max = order.indexOf(tier);
  return PREPACKAGED_BUNDLES.filter(b => order.indexOf(b.tier) <= max);
}

export const MARKETPLACE_GUARDRAILS = {
  noGuaranteedIncomeClaims: true,
  tenantIsolationRequired: true,
  paidCapabilitiesRequireEntitlement: true,
  supplyChainTeamOwnsSupplyChainBundleReview: true,
  eliteAccessStillPolicyGated: true,
};
