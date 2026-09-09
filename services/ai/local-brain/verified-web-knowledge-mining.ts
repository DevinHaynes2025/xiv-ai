/**
 * 62L-BW Verified Web Knowledge Mining + XIV article generation.
 * Verified sources only; grammar/multilingual plugins as candidates.
 * Article generation = draft/candidate; external publish DENIED without human/founder gate.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARTICLE_EXTERNAL_PUBLISH_DENIED,
  BW_LOCKS,
  HONESTY_BANNER,
  UNVERIFIED_WEB_SOURCE_DENIED,
  type BwActor,
} from './planetary-chip-founder-avatar-ethics-types';

export type WebSourceRecord = {
  id: string;
  url: string;
  label: 'DOCUMENTED' | 'VERIFIED' | 'UNAVAILABLE' | 'DENIED';
  verified: boolean;
  evidenceRefs: string[];
  licenseKnown: boolean;
  consentKnown: boolean;
  createdAt: string;
};

export type MiningResult = {
  id: string;
  sourceId: string;
  status: 'mined' | 'denied' | 'waiting_data';
  reason: string;
  excerpt?: string;
};

export type XivArticleDraft = {
  id: string;
  title: string;
  body: string;
  status: 'draft_candidate' | 'published_external';
  language: string;
  sourceRefs: string[];
  humanGatePassed: boolean;
  founderGatePassed: boolean;
  externalPublishAuthorized: false;
  createdAt: string;
};

export type GrammarPluginCandidate = {
  id: string;
  name: string;
  language: string;
  status: 'candidate';
  verified: false;
};

type Store = {
  sources: WebSourceRecord[];
  mines: MiningResult[];
  articles: XivArticleDraft[];
  grammarPlugins: GrammarPluginCandidate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'verified-web-knowledge-mining.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    sources: [],
    mines: [],
    articles: [],
    grammarPlugins: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function webKnowledgeHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BW_LOCKS.L4_AUTONOMY_ENABLED,
    unverifiedWebSourceMining: BW_LOCKS.UNVERIFIED_WEB_SOURCE_MINING,
    articleAutoExternalPublish: BW_LOCKS.ARTICLE_AUTO_EXTERNAL_PUBLISH,
    verifiedSourcesOnly: BW_LOCKS.VERIFIED_SOURCES_ONLY,
    learningIsPermission: BW_LOCKS.LEARNING_IS_PERMISSION,
  };
}

export async function registerWebSource(input: {
  url: string;
  verified?: boolean;
  evidenceRefs?: string[];
  licenseKnown?: boolean;
  consentKnown?: boolean;
  forceVerifiedWithoutProof?: boolean;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  if (input.forceVerifiedWithoutProof) {
    return {
      accepted: false as const,
      labeledVerified: false as const,
      reason: UNVERIFIED_WEB_SOURCE_DENIED,
      source: null,
    };
  }
  const verified =
    input.verified === true &&
    Array.isArray(input.evidenceRefs) &&
    input.evidenceRefs.length > 0 &&
    input.licenseKnown === true &&
    input.consentKnown === true;
  const source: WebSourceRecord = {
    id: id('wsrc'),
    url: input.url.trim(),
    label: verified ? 'VERIFIED' : 'DOCUMENTED',
    verified,
    evidenceRefs: input.evidenceRefs ?? [],
    licenseKnown: input.licenseKnown === true,
    consentKnown: input.consentKnown === true,
    createdAt: new Date().toISOString(),
  };
  store.sources.push(source);
  await save(root, store);
  return {
    accepted: true as const,
    labeledVerified: verified,
    reason: verified ? 'WEB_SOURCE_VERIFIED' : 'WEB_SOURCE_DOCUMENTED_NOT_VERIFIED',
    source,
  };
}

export async function mineVerifiedWebKnowledge(input: {
  sourceId: string;
  excerpt?: string;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const source = store.sources.find((s) => s.id === input.sourceId);
  if (!source || !source.verified || source.label !== 'VERIFIED') {
    const mine: MiningResult = {
      id: id('mine'),
      sourceId: input.sourceId,
      status: 'denied',
      reason: UNVERIFIED_WEB_SOURCE_DENIED,
    };
    store.mines.push(mine);
    await save(root, store);
    return {
      accepted: false as const,
      mine,
      reason: UNVERIFIED_WEB_SOURCE_DENIED,
    };
  }
  const mine: MiningResult = {
    id: id('mine'),
    sourceId: source.id,
    status: 'mined',
    reason: 'VERIFIED_SOURCE_MINED',
    excerpt: input.excerpt?.slice(0, 2000),
  };
  store.mines.push(mine);
  await save(root, store);
  return { accepted: true as const, mine, reason: mine.reason };
}

export async function generateXivArticleDraft(input: {
  title: string;
  body: string;
  language?: string;
  sourceRefs?: string[];
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const article: XivArticleDraft = {
    id: id('article'),
    title: input.title.trim(),
    body: input.body.trim(),
    status: 'draft_candidate',
    language: input.language ?? 'en',
    sourceRefs: input.sourceRefs ?? [],
    humanGatePassed: false,
    founderGatePassed: false,
    externalPublishAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.articles.push(article);
  await save(root, store);
  return {
    accepted: true as const,
    article,
    unpublished: true as const,
    reason: 'ARTICLE_DRAFT_CANDIDATE',
  };
}

export async function attemptExternalArticlePublish(input: {
  articleId: string;
  humanGatePassed?: boolean;
  founderGatePassed?: boolean;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const article = store.articles.find((a) => a.id === input.articleId);
  if (!article) {
    return {
      accepted: false as const,
      reason: 'ARTICLE_NOT_FOUND',
      published: false as const,
      externalPublishAuthorized: false as const,
    };
  }
  const gated = input.humanGatePassed === true || input.founderGatePassed === true;
  if (!gated) {
    return {
      accepted: false as const,
      reason: ARTICLE_EXTERNAL_PUBLISH_DENIED,
      published: false as const,
      externalPublishAuthorized: false as const,
      articleStatus: article.status,
    };
  }
  // Even with human/founder gate flags in this slice, external publish remains
  // non-authorized for production — gate records review intent only.
  article.humanGatePassed = input.humanGatePassed === true;
  article.founderGatePassed = input.founderGatePassed === true;
  // Keep as draft_candidate: PRODUCTION AUTHORIZED remains false in this phase.
  await save(root, store);
  return {
    accepted: false as const,
    reason: ARTICLE_EXTERNAL_PUBLISH_DENIED,
    published: false as const,
    externalPublishAuthorized: false as const,
    note: 'Human/founder gate recorded; external publish still DENIED until production authorization (not granted in 62L-BW).',
    articleStatus: article.status,
  };
}

export async function registerGrammarPluginCandidate(input: {
  name: string;
  language: string;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const plugin: GrammarPluginCandidate = {
    id: id('gram'),
    name: input.name,
    language: input.language,
    status: 'candidate',
    verified: false,
  };
  store.grammarPlugins.push(plugin);
  await save(root, store);
  return { accepted: true as const, plugin, reason: 'GRAMMAR_PLUGIN_CANDIDATE' };
}
