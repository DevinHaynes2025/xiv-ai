/**
 * XIV Business Story Engine. Factual claims need evidence.
 * Stances: observed, inferred, hypothesized, forecast, recommended.
 */
export type StoryStance = 'observed' | 'inferred' | 'hypothesized' | 'forecast' | 'recommended';

export type BusinessStoryEvidence = {
  evidenceId: string;
  sourceId: string;
  sourceRecordId: string;
  summary: string;
};

export type BusinessStoryChapter = {
  chapterId: string;
  title: string;
  stance: StoryStance;
  body: string;
  evidenceIds: readonly string[];
};

export type BusinessStoryTimeline = { periods: readonly string[] };
export type BusinessStoryCause = { stance: 'hypothesized'; summary: string };
export type BusinessStoryImpact = { stance: 'inferred'; summary: string };
export type BusinessStoryOpportunity = { stance: 'recommended'; summary: string };
export type BusinessStoryRisk = { stance: 'forecast'; summary: string; certainty: false };
export type BusinessStoryRecommendation = { stance: 'recommended'; summary: string; executed: false };

export type BusinessStory = {
  storyId: string;
  title: string;
  whatHappened: BusinessStoryChapter;
  whyItMayHaveHappened: BusinessStoryChapter;
  whatChanged: BusinessStoryChapter;
  whatItAffected: BusinessStoryChapter;
  whatTheDataSuggests: BusinessStoryChapter;
  possibleOpportunity: BusinessStoryChapter;
  recommendedExperiment: BusinessStoryChapter;
  measuredOutcome: BusinessStoryChapter | null;
  evidence: readonly BusinessStoryEvidence[];
};

export function storyChapterRequiresEvidence(chapter: Pick<BusinessStoryChapter, 'stance' | 'evidenceIds'>) {
  if (chapter.stance === 'observed' && chapter.evidenceIds.length === 0) {
    return { allowed: false as const, reason: 'Every factual statement needs evidence.' };
  }
  return { allowed: true as const };
}

export function distinguishStoryStances(story: BusinessStory) {
  return {
    observed: story.whatHappened.stance === 'observed',
    inferred: story.whatTheDataSuggests.stance === 'inferred' || story.whatChanged.stance === 'inferred',
    hypothesized: story.whyItMayHaveHappened.stance === 'hypothesized',
    forecast: story.whatTheDataSuggests.stance === 'forecast' || false,
    recommended: story.recommendedExperiment.stance === 'recommended',
  };
}

export function createBusinessStory(input: {
  storyId: string;
  title: string;
  evidence: readonly BusinessStoryEvidence[];
  observed: string;
  inferred: string;
  hypothesized: string;
  recommended: string;
}): BusinessStory | { allowed: false; reason: string } {
  if (input.evidence.length === 0) {
    return { allowed: false, reason: 'Every factual statement needs evidence.' };
  }
  const ids = input.evidence.map((item) => item.evidenceId);
  return {
    storyId: input.storyId,
    title: input.title,
    whatHappened: { chapterId: 'what', title: 'What happened', stance: 'observed', body: input.observed, evidenceIds: ids },
    whyItMayHaveHappened: {
      chapterId: 'why',
      title: 'Why it may have happened',
      stance: 'hypothesized',
      body: input.hypothesized,
      evidenceIds: ids,
    },
    whatChanged: { chapterId: 'changed', title: 'What changed', stance: 'inferred', body: input.inferred, evidenceIds: ids },
    whatItAffected: { chapterId: 'affected', title: 'What it affected', stance: 'inferred', body: input.inferred, evidenceIds: ids },
    whatTheDataSuggests: {
      chapterId: 'suggests',
      title: 'What the data suggests',
      stance: 'inferred',
      body: input.inferred,
      evidenceIds: ids,
    },
    possibleOpportunity: {
      chapterId: 'opportunity',
      title: 'Possible opportunity',
      stance: 'recommended',
      body: input.recommended,
      evidenceIds: ids,
    },
    recommendedExperiment: {
      chapterId: 'experiment',
      title: 'Recommended experiment',
      stance: 'recommended',
      body: input.recommended,
      evidenceIds: ids,
    },
    measuredOutcome: null,
    evidence: input.evidence,
  };
}
