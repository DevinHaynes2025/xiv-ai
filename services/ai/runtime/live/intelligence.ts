export type LiveIntelligenceBrief = {
  streamId: string;
  summary: string | null;
  topics: readonly string[];
  actionItems: readonly string[];
  questions: readonly string[];
  sensitiveExposure: readonly string[];
  published: false;
  autoPublished: false;
  providerStatus: 'not_configured';
};

export function draftLiveIntelligenceBrief(streamId: string): LiveIntelligenceBrief {
  return {
    streamId,
    summary: null,
    topics: [],
    actionItems: [],
    questions: [],
    sensitiveExposure: [],
    published: false,
    autoPublished: false,
    providerStatus: 'not_configured',
  };
}

export function publishLiveIntelligenceBrief() {
  return {
    allowed: false as const,
    reason: 'Live Intelligence cannot automatically publish private content.',
  };
}
