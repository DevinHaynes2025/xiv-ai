/**
 * XIV Stories, Daily, and Idea Rooms.
 * Founder claims ≠ verified facts. AI drafts require review. Ideas are not guaranteed.
 */
export const STORY_CHAPTERS = [
  'THE IDEA',
  'THE BEGINNING',
  'THE PROBLEM',
  'THE FIRST CUSTOMER',
  'THE FAILURE',
  'THE PIVOT',
  'THE BREAKTHROUGH',
  'THE GROWTH',
  'THE LESSON',
  'WHAT COMES NEXT',
] as const;

export type StoryClaimOrigin = 'founder' | 'independent';

export type StoryClaim = {
  claimId: string;
  text: string;
  origin: StoryClaimOrigin;
  verification: 'UNVERIFIED' | 'SUPPORTED';
};

export type StoryEvidence = { evidenceId: string; sourceId: string; summary: string };
export type StoryChapter = { title: (typeof STORY_CHAPTERS)[number]; body: string };
export type StoryTimeline = { milestones: readonly { label: string; at: string }[] };
export type StoryMilestone = { label: string; at: string };
export type InterviewPrompt = { prompt: string };
export type MediaAssetReference = { assetId: string; kind: 'video' | 'audio' | 'image'; transportLive: false };
export type TranscriptReference = { transcriptId: string; provider: 'NOT_CONFIGURED' };
export type TranslationReference = { status: 'UNAVAILABLE' };

export type BusinessStory = {
  storyId: string;
  kind: 'founder' | 'company' | 'documentary';
  chapters: readonly StoryChapter[];
  claims: readonly StoryClaim[];
  evidence: readonly StoryEvidence[];
  videoInfrastructureLive: false;
};

export const DAILY_CHANNELS = [
  'XIV Business',
  'XIV Startups',
  'XIV Global',
  'XIV Wealth',
  'XIV Wellness',
  'XIV Security',
  'XIV Research',
  'XIV Stories',
  'XIV Ideas',
] as const;

export type DailyReviewState =
  | 'DRAFT'
  | 'AI_GENERATED_DRAFT'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'HUMAN_REVIEWED'
  | 'PUBLISHED';

export type DailyArticle = {
  articleId: string;
  channel: (typeof DAILY_CHANNELS)[number];
  title: string;
  claims: readonly { text: string; sourceId: string | null }[];
  reviewState: DailyReviewState;
  fabricatedBreakingNews: false;
};

export type IdeaRoom = {
  ideaId: string;
  problem: string;
  idea: string;
  stage: string;
  region: string;
  guaranteedSuccess: false;
};

export type IdeaPitch = { ideaId: string; summary: string };
export type ProblemStatement = { text: string };
export type MarketHypothesis = { text: string; stance: 'INFERENCE' };
export type EvidencePacket = { sources: readonly string[] };
export type ExperimentPlan = { steps: readonly string[] };
export type CollaborationRequest = { lookingFor: string };
export type FounderPitch = { ideaId: string; media: MediaAssetReference | null };
export type IdeaRisk = { text: string };
export type IdeaOpportunity = { text: string };
export type IdeaDiscussion = { transportLive: false };
export type PitchMediaReference = MediaAssetReference;
export type PitchSheetReference = { workbookId: string };

export function founderClaimIsIndependentlyVerified(claim: StoryClaim) {
  return claim.origin === 'independent' && claim.verification === 'SUPPORTED';
}

export function distinguishFounderFromVerified(claim: StoryClaim) {
  if (claim.origin === 'founder' && claim.verification !== 'SUPPORTED') {
    return { verifiedFact: false as const, origin: claim.origin };
  }
  return { verifiedFact: founderClaimIsIndependentlyVerified(claim), origin: claim.origin };
}

export function publishDailyArticle(article: DailyArticle) {
  if (article.fabricatedBreakingNews) {
    return { allowed: false as const, reason: 'Fabricated breaking news is denied.' };
  }
  if (article.reviewState === 'AI_GENERATED_DRAFT' || article.reviewState === 'DRAFT') {
    return { allowed: false as const, reason: 'AI article drafts require review state before publication.' };
  }
  if (article.reviewState !== 'HUMAN_REVIEWED' && article.reviewState !== 'PUBLISHED') {
    return { allowed: false as const, reason: 'Factual publication requires human review.' };
  }
  if (article.claims.some((claim) => !claim.sourceId)) {
    return { allowed: false as const, reason: 'Factual publication must preserve provenance.' };
  }
  return { allowed: true as const };
}

export function ideaRoomGuaranteesSuccess(_idea?: IdeaRoom) {
  return false;
}

export function analyzeIdeaRoom(_idea: IdeaRoom) {
  return {
    guaranteedSuccess: false as const,
    workflow: ['Problem', 'Evidence', 'Market', 'Competition', 'Economics', 'Technical feasibility', 'Risks', 'Experiments', 'Connections'] as const,
  };
}
