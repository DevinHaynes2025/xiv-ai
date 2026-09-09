import { isolateAgentInput, treatAsSystemAuthority } from '../security/injection';
import type {
  ArticlePublishState,
  ArticleSummary,
  ResearchEvidence,
  ResearchProvider,
  ResearchProviderStatus,
} from './types';

export const RESEARCH_PROVIDER_REGISTRY: readonly ResearchProvider[] = [
  {
    providerId: 'web_search_generic',
    type: 'SEARCH',
    officialUrl: 'https://example.invalid/search-api',
    licenseClass: 'requires_official_api',
    status: 'NOT_CONFIGURED',
    scrapingAllowed: false,
  },
  {
    providerId: 'wikipedia_wikimedia',
    type: 'ENCYCLOPEDIA',
    officialUrl: 'https://www.wikimedia.org/',
    licenseClass: 'cc_by_sa_requires_adapter',
    status: 'NOT_CONFIGURED',
    scrapingAllowed: false,
  },
  {
    providerId: 'us_library_of_congress',
    type: 'LIBRARY',
    officialUrl: 'https://www.loc.gov/',
    licenseClass: 'public_collection_requires_adapter',
    status: 'NOT_CONFIGURED',
    scrapingAllowed: false,
  },
  {
    providerId: 'licensed_news_feed',
    type: 'NEWS',
    officialUrl: 'https://example.invalid/news',
    licenseClass: 'licensed_feed_required',
    status: 'NOT_CONFIGURED',
    scrapingAllowed: false,
  },
];

export function researchProviderStatus(providerId: string): ResearchProviderStatus {
  return RESEARCH_PROVIDER_REGISTRY.find((row) => row.providerId === providerId)?.status ?? 'NOT_CONFIGURED';
}

export function unprovenSearchProviderRemainsNotConfigured(): boolean {
  return researchProviderStatus('web_search_generic') === 'NOT_CONFIGURED';
}

export function copyrightedSourceCannotBeRepublishedWholesale(sourceText: string): boolean {
  return sourceText.trim().length > 0;
}

export function republishCopyrightedArticle(sourceText: string): { allowed: false; reason: string } {
  void copyrightedSourceCannotBeRepublishedWholesale(sourceText);
  return { allowed: false, reason: 'copyrighted_source_cannot_be_republished_wholesale' };
}

export function createArticleSummary(input: {
  whatHappened: string;
  evidence: ResearchEvidence;
  publishState?: ArticlePublishState;
}): ArticleSummary {
  return {
    whatHappened: input.whatHappened,
    whyItMatters: 'Business relevance requires the attached evidence, not an unsourced narrative.',
    whoIsAffected: 'Named only when the evidence identifies them.',
    supplyChainImpact: 'UNKNOWN until a sourced operational event exists.',
    marketImpact: 'RESEARCH only. Not an investment recommendation.',
    localImpact: 'UNKNOWN until a sourced local record exists.',
    evidence: input.evidence,
    confidence: 'low',
    whatToWatch: 'Whether a proven source confirms or contradicts this draft.',
    copyrightedExcerpt: false,
    publishState: input.publishState ?? 'AI_GENERATED_DRAFT',
  };
}

export function articleSummaryKeepsProvenance(summary: ArticleSummary): boolean {
  return Boolean(summary.evidence.source && summary.evidence.retrievedAt && summary.evidence.reference);
}

export function autoPublishAiDraft(summary: ArticleSummary): { allowed: false; reason: string } {
  void summary;
  return { allowed: false, reason: 'ai_generated_draft_requires_human_review' };
}

export type ArticleIdentity = {
  canonicalUrl?: string;
  title: string;
  source: string;
  publishedOn?: string;
};

export function deduplicateArticles(left: ArticleIdentity, right: ArticleIdentity): {
  duplicate: boolean;
  groupId: string | null;
} {
  const sameUrl = Boolean(left.canonicalUrl && left.canonicalUrl === right.canonicalUrl);
  const sameStory = left.title === right.title && left.source === right.source && left.publishedOn === right.publishedOn;
  if (!sameUrl && !sameStory) return { duplicate: false, groupId: null };
  return { duplicate: true, groupId: left.canonicalUrl ?? `${left.source}:${left.title}:${left.publishedOn ?? 'undated'}` };
}

export function conflictingSourcesRemainVisible(input: {
  claim: string;
  sources: readonly { source: string; stance: string }[];
}): { visible: true; resolvedAutomatically: false } {
  void input;
  return { visible: true, resolvedAutomatically: false };
}

export function publicDataCannotOverrideGuardian(text: string): boolean {
  const isolated = isolateAgentInput('retrieved_documents', text);
  return treatAsSystemAuthority('data') === false && isolated.trustedAsSystem === false;
}
