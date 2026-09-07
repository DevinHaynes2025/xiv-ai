/**
 * XIV Business Advertising. Paid placements must be visibly disclosed.
 * Not LIVE. No payment processing. No sensitive-attribute targeting.
 */
export const AD_DISCLOSURES = ['Promoted', 'Sponsored', 'Advertisement'] as const;
export type AdDisclosure = (typeof AD_DISCLOSURES)[number];

export const BUSINESS_AD_CATEGORIES = [
  'b2b_software',
  'professional_services',
  'business_equipment',
  'commercial_real_estate',
  'training',
  'conferences',
  'business_insurance',
  'logistics',
  'manufacturing',
  'technology',
  'cloud_services',
  'developer_tools',
] as const;

export const BUSINESS_AD_PLACEMENTS = [
  'network_feed',
  'intelligence_feed',
  'events',
  'marketplace',
  'company_pages',
  'search',
  'business_live',
  'article_pages',
] as const;

export type BusinessAdCategory = (typeof BUSINESS_AD_CATEGORIES)[number];
export type BusinessAdPlacement = (typeof BUSINESS_AD_PLACEMENTS)[number];

export type BusinessAdAudience = {
  industry?: string;
  geography?: string;
  companySize?: string;
  sensitiveAttributeTargeting: false;
};

export type BusinessAdCreative = {
  headline: string;
  body: string;
  disclosure: AdDisclosure;
};

export type BusinessAd = {
  adId: string;
  campaignId: string;
  category: BusinessAdCategory;
  placement: BusinessAdPlacement;
  creative: BusinessAdCreative;
  organic: false;
  paid: true;
};

export type BusinessAdCampaign = {
  campaignId: string;
  organizationId: string;
  ads: readonly BusinessAd[];
  reviewState: 'draft' | 'pending_review' | 'approved' | 'rejected';
};

export type BusinessAdMetric = { impressions: number | 'not_measured'; clicks: number | 'not_measured' };
export type BusinessAdPolicy = { hiddenPaidRanking: false; sensitiveTargeting: false; paymentProcessing: false };
export type BusinessAdReview = { reviewId: string; campaignId: string; approved: boolean };
export type BusinessAdAuditEvent = { eventId: string; campaignId: string; action: string; at: string };

export function businessAdPolicy(): BusinessAdPolicy {
  return { hiddenPaidRanking: false, sensitiveTargeting: false, paymentProcessing: false };
}

export function adIsVisiblySponsored(ad: Pick<BusinessAd, 'organic' | 'paid' | 'creative'>) {
  return ad.paid === true && ad.organic === false && (AD_DISCLOSURES as readonly string[]).includes(ad.creative.disclosure);
}

export function createBusinessAd(input: {
  adId: string;
  campaignId: string;
  category: BusinessAdCategory;
  placement: BusinessAdPlacement;
  creative: BusinessAdCreative;
}): BusinessAd | { allowed: false; reason: string } {
  if (!adIsVisiblySponsored({ paid: true, organic: false, creative: input.creative })) {
    return { allowed: false, reason: 'Business ads must visibly show Promoted, Sponsored, or Advertisement.' };
  }
  return {
    adId: input.adId,
    campaignId: input.campaignId,
    category: input.category,
    placement: input.placement,
    creative: input.creative,
    organic: false,
    paid: true,
  };
}

export function paidAdMasqueradingAsOrganic(ad: {
  paid: boolean;
  organic: boolean;
  creative: Pick<BusinessAdCreative, 'disclosure'>;
}) {
  const sponsored = ad.paid === true && ad.organic === false && (AD_DISCLOSURES as readonly string[]).includes(ad.creative.disclosure);
  if (ad.paid && (ad.organic || !sponsored)) {
    return { allowed: false as const, reason: 'Paid advertising cannot masquerade as organic intelligence.' };
  }
  return { allowed: true as const, sponsored: true as const };
}
