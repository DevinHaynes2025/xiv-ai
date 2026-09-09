/**
 * Governed business article / blog engine. No auto-publish. Claims require evidence.
 */
export type ArticleApprovalState = 'draft' | 'pending_human_approval' | 'approved' | 'published';

export type BusinessArticleSource = {
  sourceId: string;
  publisher: string;
  retrievedAt: string;
  dataDate: string;
};

export type BusinessArticleClaim = {
  claimId: string;
  text: string;
  stance: 'observed' | 'inferred' | 'forecast';
  evidenceIds: readonly string[];
};

export type BusinessArticleEvidence = {
  evidenceId: string;
  sourceId: string;
  summary: string;
};

export type BusinessArticleOpportunity = { summary: string; stance: 'recommended' };
export type BusinessArticleRisk = { summary: string; stance: 'forecast'; certainty: false };

export type BusinessArticle = {
  articleId: string;
  title: string;
  kind:
    | 'market_opportunity_brief'
    | 'industry_update'
    | 'supply_chain_brief'
    | 'business_trend'
    | 'economic_impact'
    | 'company_strategy_brief'
    | 'innovation_report'
    | 'founder_brief';
  sources: readonly BusinessArticleSource[];
  claims: readonly BusinessArticleClaim[];
  evidence: readonly BusinessArticleEvidence[];
  approval: ArticleApprovalState;
  autoPublished: false;
};

export function articleClaimRequiresEvidence(claim: BusinessArticleClaim) {
  if (claim.evidenceIds.length === 0) {
    return { allowed: false as const, reason: 'Article claims require evidence.' };
  }
  return { allowed: true as const };
}

export function publishBusinessArticle(article: Pick<BusinessArticle, 'approval' | 'autoPublished' | 'claims'>) {
  if (article.autoPublished) {
    return { allowed: false as const, reason: 'Articles cannot auto-publish.' };
  }
  if (article.approval !== 'approved') {
    return { allowed: false as const, reason: 'Articles cannot publish without human approval.' };
  }
  if (article.claims.some((claim) => claim.evidenceIds.length === 0)) {
    return { allowed: false as const, reason: 'Article claims require evidence.' };
  }
  return { allowed: true as const, published: false as const, requiresHumanApproval: false as const };
}

export function articlesAutoPublish() {
  return false;
}
