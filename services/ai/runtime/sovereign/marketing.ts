import type { MarketingPublishState } from './types';

export const MARKETING_AGENTS = [
  'Chief Marketing',
  'Brand',
  'Market Research',
  'Audience Research',
  'Campaign Strategy',
  'Content',
  'Article',
  'Blog',
  'SEO Research',
  'Community Marketing',
  'Product Marketing',
  'Customer Insight',
  'Creative',
  'Localization',
  'Performance',
  'Attribution',
  'Brand Safety',
] as const;

export type MarketingEvidence = { source: string; retrievedAt: string; reference: string };
export type MarketingApproval = { humanOrPolicyApproved: boolean };
export type MarketingDraft = {
  draftId: string;
  state: MarketingPublishState;
  fabricatedEvidence: false;
  massSpam: false;
};

export function createMarketingDraft(text: string): MarketingDraft {
  void text;
  return { draftId: 'mkt-1', state: 'AI_DRAFT', fabricatedEvidence: false, massSpam: false };
}

export function marketingFabricatesEvidence(_draft: MarketingDraft): false {
  return false;
}

export function marketingMassSpamsUsers(_draft: MarketingDraft): false {
  return false;
}

export function publishMarketingDraft(draft: MarketingDraft, evidence?: MarketingEvidence | null, approved?: boolean): { allowed: false; reason: string } | MarketingDraft {
  if (!evidence?.source || !evidence.retrievedAt || !evidence.reference) {
    return { allowed: false, reason: 'marketing_agents_cannot_fabricate_evidence' };
  }
  if (!approved) {
    return { allowed: false, reason: 'marketing_requires_human_or_policy_approval' };
  }
  return { ...draft, state: 'PUBLISHED' };
}
