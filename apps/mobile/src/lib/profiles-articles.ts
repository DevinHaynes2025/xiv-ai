import {
  clearPrototypeProfilesArticlesFeed,
  listProfilesArticlesView,
  loadPrototypeProfilesArticlesFeed,
  type ProfilesArticlesView,
} from '@/lib/ai';

/**
 * US-SOC-01 — mobile helper for Profiles + daily business articles feed.
 * Prototype/demo content only. WAITING_DATA when unbound.
 * Never fabricates live social/engagement metrics. L4 false; no production mutations.
 */

export type ProfilesArticlesSessionResult = {
  view: ProfilesArticlesView;
};

export function sessionProfilesArticlesView(): ProfilesArticlesView {
  return listProfilesArticlesView();
}

export function loadSessionPrototypeProfilesArticlesFeed(input?: {
  feedDate?: string;
}): ProfilesArticlesSessionResult {
  loadPrototypeProfilesArticlesFeed({ feedDate: input?.feedDate });
  return { view: listProfilesArticlesView() };
}

export function clearSessionPrototypeProfilesArticlesFeed(): ProfilesArticlesSessionResult {
  clearPrototypeProfilesArticlesFeed();
  return { view: listProfilesArticlesView() };
}
