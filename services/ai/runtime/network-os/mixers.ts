/**
 * XIV Mixers. Scheduled professional networking rooms. Not LIVE video.
 * Matching uses declared professional attributes only.
 */
export type MixerTopic =
  | 'founders'
  | 'supply_chain'
  | 'ai_builders'
  | 'real_estate'
  | 'insurance'
  | 'retail'
  | 'women_in_business'
  | 'student_entrepreneurs'
  | 'investor_founder'
  | 'global_trade'
  | 'dallas_business'
  | 'africa_business'
  | 'manufacturing';

export type MixerEvent = {
  mixerId: string;
  title: string;
  topic: MixerTopic;
  scheduledAt: string;
  videoLive: false;
};

export type MixerRoom = { roomId: string; mixerId: string; providerStatus: 'not_configured' };
export type MixerParticipant = { participantId: string; professionalId: string; mixerId: string };
export type MixerHost = MixerParticipant & { host: true };
export type MixerMatch = {
  matchId: string;
  leftId: string;
  rightId: string;
  reasons: readonly string[];
  sensitiveTraitUsed: false;
};
export type MixerIntroduction = { introductionId: string; matchId: string };
export type MixerSchedule = { mixerId: string; startsAt: string; endsAt: string };
export type MixerPolicy = { randomizedRooms: 'designed'; sensitiveTargeting: false };
export type MixerOutcome = { mixerId: string; introductions: number; live: false };

export function createMixerEvent(input: { mixerId: string; title: string; topic: MixerTopic; scheduledAt: string }): MixerEvent {
  return { ...input, videoLive: false };
}

export function suggestMixerMatch(input: {
  left: { industry?: string; goals?: string; skills?: string; companyNeeds?: string; interests?: string; geography?: string };
  right: { industry?: string; goals?: string; skills?: string; companyNeeds?: string; interests?: string; geography?: string };
  topic: MixerTopic;
}): MixerMatch | { allowed: false; reason: string } {
  const reasons: string[] = [`Declared mixer topic: ${input.topic}`];
  if (input.left.industry && input.left.industry === input.right.industry) reasons.push(`Shared declared industry: ${input.left.industry}`);
  if (input.left.geography && input.left.geography === input.right.geography) reasons.push(`Shared declared geography: ${input.left.geography}`);
  if (reasons.length < 2) {
    return { allowed: false, reason: 'Mixer matches require overlapping declared professional attributes, not inferred traits.' };
  }
  return {
    matchId: `mix:${input.topic}`,
    leftId: 'left',
    rightId: 'right',
    reasons,
    sensitiveTraitUsed: false,
  };
}

export function mixerSensitiveTargetingEnabled() {
  return false;
}
