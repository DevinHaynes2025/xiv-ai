import { createUnavailableTranscriptProvider } from '../live/providers';
import { videoMeetingInfrastructureLive } from '../network-os/meetings';
import { requestPocketLocation } from '../pocket/location';
import type { MediaKind, MediaRightsState, ReviewClass } from './types';

export function inventReviewSentiment(reviews: readonly string[]): { allowed: false; reason: string } {
  void reviews;
  return { allowed: false, reason: 'review_summary_cannot_invent_sentiment' };
}

export function localDiscovery(input: {
  osPermissionGranted: boolean;
  exposePrivateLocation?: boolean;
}): { allowed: boolean; denial?: string; privateLocationExposed: false } {
  if (input.exposePrivateLocation) {
    return { allowed: false, denial: 'local_discovery_cannot_expose_private_location', privateLocationExposed: false };
  }
  const gps = requestPocketLocation({
    osPermissionGranted: input.osPermissionGranted,
    xivScope: true,
    backgroundRequested: false,
    backgroundExplicitlyAllowed: false,
    purpose: 'FIELD_SERVICE',
  });
  if (!gps.granted) {
    return { allowed: false, denial: gps.denial ?? 'gps_denied_without_permission', privateLocationExposed: false };
  }
  return { allowed: true, privateLocationExposed: false };
}

export type MediaPost = {
  kind: MediaKind;
  rights: MediaRightsState;
};

export function createMediaPost(input: { kind: MediaKind; rights?: MediaRightsState | null }): MediaPost | { allowed: false; reason: string } {
  if (!input.rights) {
    return { allowed: false, reason: 'media_rights_state_required' };
  }
  return { kind: input.kind, rights: input.rights };
}

export function mediaProviderStatus(): 'NOT_CONFIGURED' {
  return 'NOT_CONFIGURED';
}

export function transcriptionProviderStatus(): 'NOT_CONFIGURED' {
  return createUnavailableTranscriptProvider().status === 'not_configured' ? 'NOT_CONFIGURED' : 'NOT_CONFIGURED';
}

export function liveSummaryBecomesVerifiedFact(): false {
  return false;
}

export function videoInfrastructureClaimedLive(): boolean {
  return videoMeetingInfrastructureLive();
}

export type BusinessAnswer = {
  answer: string;
  companySources: number;
  publicSources: number;
  inventedMetrics: false;
  confidence: 'unknown' | 'low';
};

export function createBusinessAnswer(input: { question: string; companySources?: number; publicSources?: number }): BusinessAnswer {
  const company = input.companySources ?? 0;
  const pub = input.publicSources ?? 0;
  return {
    answer:
      company + pub === 0
        ? `Insufficient evidence for "${input.question}". Connected company data is required before numeric claims.`
        : `Evidence-backed draft for "${input.question}".`,
    companySources: company,
    publicSources: pub,
    inventedMetrics: false,
    confidence: company + pub === 0 ? 'unknown' : 'low',
  };
}

export type ReviewRecord = {
  classification: ReviewClass;
  inventedSentiment: false;
};
