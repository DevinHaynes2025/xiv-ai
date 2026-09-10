/**
 * US-SOC-01 Profiles + business articles feed — prototype pipeline contract.
 * Run: npx tsx profiles-articles.test.ts
 */

import assert from 'node:assert/strict';

import {
  BUILTIN_PROTOTYPE_ARTICLES,
  BUILTIN_PROTOTYPE_PROFILES,
  PROFILES_ARTICLES_POLICY,
  clearPrototypeProfilesArticlesFeed,
  isProfilesArticlesPrototypeLoaded,
  listProfilesArticlesView,
  loadPrototypeProfilesArticlesFeed,
  profilesArticlesAllowsL4,
  profilesArticlesAllowsLiveSocialMetrics,
  profilesArticlesAllowsProductionMutation,
  resetProfilesArticlesSession,
} from './profiles-articles';

function assertNoLiveEngagement(
  engagement: {
    gate: string;
    likes: null;
    views: null;
    shares: null;
    followers: null;
    comments: null;
  },
) {
  assert.equal(engagement.gate, 'WAITING_DATA');
  assert.equal(engagement.likes, null);
  assert.equal(engagement.views, null);
  assert.equal(engagement.shares, null);
  assert.equal(engagement.followers, null);
  assert.equal(engagement.comments, null);
}

function main() {
  assert.equal(PROFILES_ARTICLES_POLICY.l4Autonomy, false);
  assert.equal(PROFILES_ARTICLES_POLICY.productionMutation, false);
  assert.equal(PROFILES_ARTICLES_POLICY.liveSocialMetrics, false);
  assert.equal(PROFILES_ARTICLES_POLICY.contentMode, 'prototype_demo');
  assert.equal(PROFILES_ARTICLES_POLICY.feedCadence, 'daily');
  assert.equal(profilesArticlesAllowsL4(), false);
  assert.equal(profilesArticlesAllowsProductionMutation(), false);
  assert.equal(profilesArticlesAllowsLiveSocialMetrics(), false);

  resetProfilesArticlesSession();
  assert.equal(isProfilesArticlesPrototypeLoaded(), false);

  const unbound = listProfilesArticlesView();
  assert.equal(unbound.status, 'WAITING_DATA');
  assert.equal(unbound.role, 'consumer_business');
  assert.equal(unbound.l4Autonomy, false);
  assert.equal(unbound.productionMutation, false);
  assert.equal(unbound.liveSocialMetrics, false);
  assert.equal(unbound.contentMode, 'prototype_demo');
  assert.equal(unbound.feedCadence, 'daily');
  assert.equal(unbound.contentGate, 'WAITING_DATA');
  assert.equal(unbound.profiles, null);
  assert.equal(unbound.articles, null);
  assert.equal(unbound.engagementMetrics, 'WAITING_DATA');
  assert.match(unbound.note, /WAITING_DATA/);
  assert.match(unbound.note, /not fabricated|are not fabricated/i);

  assert.ok(BUILTIN_PROTOTYPE_PROFILES.length >= 2);
  assert.ok(BUILTIN_PROTOTYPE_ARTICLES.length >= 2);

  const bundle = loadPrototypeProfilesArticlesFeed({ feedDate: '2026-09-09' });
  assert.equal(bundle.feedDate, '2026-09-09');
  assert.equal(isProfilesArticlesPrototypeLoaded(), true);
  assert.equal(bundle.profiles.length, BUILTIN_PROTOTYPE_PROFILES.length);
  assert.equal(bundle.articles.length, BUILTIN_PROTOTYPE_ARTICLES.length);

  for (const profile of bundle.profiles) {
    assert.equal(profile.prototypeOnly, true);
    assert.equal(profile.liveSocial, false);
    assertNoLiveEngagement(profile.engagement);
  }
  for (const article of bundle.articles) {
    assert.equal(article.prototypeOnly, true);
    assert.equal(article.publishedLive, false);
    assert.equal(article.feedDate, '2026-09-09');
    assertNoLiveEngagement(article.engagement);
  }

  const bound = listProfilesArticlesView();
  assert.equal(bound.status, 'READY');
  assert.equal(bound.contentGate, 'PROTOTYPE_DEMO');
  assert.ok(bound.profiles);
  assert.ok(bound.articles);
  assert.equal(bound.profiles!.length, BUILTIN_PROTOTYPE_PROFILES.length);
  assert.equal(bound.articles!.length, BUILTIN_PROTOTYPE_ARTICLES.length);
  assert.equal(bound.engagementMetrics, 'WAITING_DATA');
  assert.equal(bound.l4Autonomy, false);
  assert.equal(bound.liveSocialMetrics, false);
  assert.equal(bound.productionMutation, false);
  assert.match(bound.note, /PROTOTYPE_DEMO/);
  assert.match(bound.note, /WAITING_DATA/);
  assert.match(bound.note, /2026-09-09/);

  // Clearing returns honest WAITING_DATA — no leftover fabricated metrics
  clearPrototypeProfilesArticlesFeed();
  assert.equal(isProfilesArticlesPrototypeLoaded(), false);
  const again = listProfilesArticlesView();
  assert.equal(again.status, 'WAITING_DATA');
  assert.equal(again.contentGate, 'WAITING_DATA');
  assert.equal(again.profiles, null);
  assert.equal(again.articles, null);
  assert.equal(again.engagementMetrics, 'WAITING_DATA');

  // Default load uses today's date slot
  resetProfilesArticlesSession();
  const todayBundle = loadPrototypeProfilesArticlesFeed();
  assert.match(todayBundle.feedDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(todayBundle.articles.every((a) => a.feedDate === todayBundle.feedDate));

  clearPrototypeProfilesArticlesFeed();
  resetProfilesArticlesSession();

  console.log(
    'ok - US-SOC-01 profiles+articles (WAITING_DATA unbound; PROTOTYPE_DEMO explicit load; engagement null/WAITING_DATA; L4 false; no live social metrics)',
  );
}

main();
