/**
 * XIV Promote. Opt-in paid exposure. Always disclosed. No payment processing yet.
 */
import { AD_DISCLOSURES, type AdDisclosure } from './ads';

export const PROMOTION_PRODUCTS = [
  'promoted_professional',
  'promoted_company',
  'promoted_product',
  'promoted_event',
  'promoted_article',
  'promoted_opportunity',
  'promoted_business_live',
] as const;

export type PromotionProduct = (typeof PROMOTION_PRODUCTS)[number];
export type PromotionApprovalState = 'draft' | 'pending' | 'approved' | 'rejected';

export type PromotionAudience = { industry?: string; geography?: string; sensitiveAttributeTargeting: false };
export type PromotionTarget = { product: PromotionProduct; subjectId: string };
export type PromotionPlacement = { surface: 'network' | 'search' | 'events' | 'intelligence' };
export type PromotionBudget = { amount: number | null; currency: 'USD'; paymentProcessingConfigured: false };
export type PromotionDisclosure = { label: AdDisclosure; visible: true };
export type PromotionPerformance = { impressions: number | 'not_measured' };

export type PromotionCampaign = {
  campaignId: string;
  organizationId: string | null;
  professionalId: string | null;
  target: PromotionTarget;
  audience: PromotionAudience;
  budget: PromotionBudget;
  placement: PromotionPlacement;
  disclosure: PromotionDisclosure;
  approvalState: PromotionApprovalState;
  organic: false;
  paid: true;
};

export function createPromotionCampaign(input: {
  campaignId: string;
  organizationId?: string | null;
  professionalId?: string | null;
  target: PromotionTarget;
  disclosure: AdDisclosure;
}): PromotionCampaign | { allowed: false; reason: string } {
  if (!(AD_DISCLOSURES as readonly string[]).includes(input.disclosure)) {
    return { allowed: false, reason: 'Paid promotion must visibly show Promoted, Sponsored, or Advertisement.' };
  }
  return {
    campaignId: input.campaignId,
    organizationId: input.organizationId ?? null,
    professionalId: input.professionalId ?? null,
    target: input.target,
    audience: { sensitiveAttributeTargeting: false },
    budget: { amount: null, currency: 'USD', paymentProcessingConfigured: false },
    placement: { surface: 'network' },
    disclosure: { label: input.disclosure, visible: true },
    approvalState: 'draft',
    organic: false,
    paid: true,
  };
}

export function paidPromotionCannotMasqueradeAsOrganic(campaign: Pick<PromotionCampaign, 'paid' | 'organic' | 'disclosure'>) {
  if (campaign.paid && (campaign.organic || !campaign.disclosure.visible)) {
    return { allowed: false as const, reason: 'Paid promotion cannot masquerade as organic ranking.' };
  }
  return { allowed: true as const, disclosed: campaign.disclosure.label };
}

export function hiddenPaidRankingEnabled() {
  return false;
}

export function paymentProcessingConfigured() {
  return false;
}
