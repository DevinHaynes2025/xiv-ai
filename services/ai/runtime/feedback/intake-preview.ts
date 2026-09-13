import { createHash } from 'node:crypto';

export type FeedbackAudience = 'CUSTOMER' | 'CONSUMER' | 'COMMUNITY';

export type FeedbackSpecialistRole = {
  id: 'CUSTOMER_FEEDBACK_STEWARD' | 'CONSUMER_INSIGHTS_ANALYST' | 'AI_ECONOMIST' | 'COMMUNITY_EVENT_PLANNER';
  lifecycle: 'DEFINED';
  executionState: 'NOT_RUNNING';
  purpose: string;
  prohibitedActions: readonly string[];
};

export const FEEDBACK_SPECIALIST_ROLES: readonly FeedbackSpecialistRole[] = [
  {
    id: 'CUSTOMER_FEEDBACK_STEWARD', lifecycle: 'DEFINED', executionState: 'NOT_RUNNING',
    purpose: 'Triage customer feedback and prepare evidence-backed service-improvement candidates.',
    prohibitedActions: ['infer unshared profile attributes', 'publish feedback', 'promote learning without review'],
  },
  {
    id: 'CONSUMER_INSIGHTS_ANALYST', lifecycle: 'DEFINED', executionState: 'NOT_RUNNING',
    purpose: 'Aggregate consented consumer themes without treating individual opinions as facts.',
    prohibitedActions: ['identify anonymous participants', 'sell personal data', 'modify model weights'],
  },
  {
    id: 'AI_ECONOMIST', lifecycle: 'DEFINED', executionState: 'NOT_RUNNING',
    purpose: 'Prepare bounded economic scenarios with cited assumptions for human review.',
    prohibitedActions: ['trade or move money', 'guarantee income or returns', 'present forecasts as facts'],
  },
  {
    id: 'COMMUNITY_EVENT_PLANNER', lifecycle: 'DEFINED', executionState: 'NOT_RUNNING',
    purpose: 'Draft accessible community event plans for organizer approval.',
    prohibitedActions: ['invite people without consent', 'book venues or spend funds', 'access calendars or contacts'],
  },
];

export const GENOME_PATHWAY_TARGET = {
  label: '1,000,000 trillion logical genome pathways',
  decimal: '1000000000000000000',
  materialization: 'SPARSE_ON_DEMAND' as const,
  measuredCapacity: false as const,
  claimedAchieved: false as const,
};

export type FeedbackIntakePreview = {
  status: 'REVIEW_REQUIRED';
  audience: FeedbackAudience;
  feedbackDigest: string;
  feedbackCharacters: number;
  consentScope: 'IMPROVEMENT_CANDIDATE_ONLY';
  learningCandidate: { state: 'AWAITING_HUMAN_REVIEW'; promoted: false };
  feedbackStored: false;
  rawFeedbackReturned: false;
  modelWeightsModified: false;
  neuralPathwayActivated: false;
  profileInferred: false;
  compensationGuaranteed: false;
  externalAccountsAccessed: false;
  humanReviewRequired: true;
  nextSteps: readonly string[];
};

export function previewFeedbackIntake(
  input: { userId: string; audience: FeedbackAudience; feedback: string; improvementConsent: boolean },
  configuredContext: { tenantId: string; universeId: string },
): FeedbackIntakePreview {
  if (!input.userId) throw new Error('authenticated_user_required');
  if (!configuredContext.tenantId || !configuredContext.universeId) throw new Error('configured_context_required');
  if (!['CUSTOMER', 'CONSUMER', 'COMMUNITY'].includes(input.audience)) throw new Error('invalid_audience');
  const feedback = input.feedback.trim();
  if (feedback.length < 10 || feedback.length > 2000) throw new Error('invalid_feedback_length');
  if (!input.improvementConsent) throw new Error('improvement_consent_required');

  const digest = createHash('sha256')
    .update(`${configuredContext.tenantId}\u0000${configuredContext.universeId}\u0000${feedback}`)
    .digest('hex');

  return {
    status: 'REVIEW_REQUIRED', audience: input.audience, feedbackDigest: digest,
    feedbackCharacters: feedback.length, consentScope: 'IMPROVEMENT_CANDIDATE_ONLY',
    learningCandidate: { state: 'AWAITING_HUMAN_REVIEW', promoted: false },
    feedbackStored: false, rawFeedbackReturned: false, modelWeightsModified: false,
    neuralPathwayActivated: false, profileInferred: false, compensationGuaranteed: false,
    externalAccountsAccessed: false, humanReviewRequired: true,
    nextSteps: ['Privacy and safety review', 'Aggregate with consent-compatible themes', 'Human decision before pathway promotion'],
  };
}
