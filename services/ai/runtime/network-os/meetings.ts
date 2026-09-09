/**
 * Provider-neutral video meeting architecture. Not LIVE.
 * Do not hard-code LiveKit/Daily/Twilio/Agora into the domain model.
 */
export type VideoProviderStatus = 'not_configured' | 'configured' | 'connected' | 'degraded' | 'unavailable';
export type VideoProviderFamily = 'webrtc' | 'livekit' | 'daily' | 'twilio' | 'agora' | 'other_approved' | 'none';
export type MeetingMode =
  | 'one_to_one'
  | 'group'
  | 'team'
  | 'investor'
  | 'customer'
  | 'sales_demo'
  | 'networking'
  | 'conference_room';
export type MeetingRole = 'host' | 'participant' | 'observer';

export type MeetingRecordingPolicy = { recordingEnabled: false; transcriptEnabled: false; reason: string };
export type VideoMeeting = {
  meetingId: string;
  organizationId: string;
  universeId: string | null;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  mode: MeetingMode;
  providerStatus: VideoProviderStatus;
  live: false;
};
export type MeetingParticipant = { participantId: string; userId: string; organizationId: string; role: MeetingRole };
export type MeetingHost = MeetingParticipant & { role: 'host' };
export type MeetingRoom = { roomId: string; meetingId: string; providerRoomId: null };
export type MeetingInvite = { inviteId: string; meetingId: string; inviteeId: string };
export type MeetingAgenda = { items: readonly string[] };
export type MeetingTranscript = { available: false; reason: string };
export type MeetingSummary = { available: false; reason: string };
export type MeetingActionItem = { actionId: string; text: string; ownerId: string | null };
export type MeetingDecision = { decisionId: string; text: string; stance: 'hypothesized' | 'observed' };
export type MeetingAuditEvent = { eventId: string; meetingId: string; action: string; at: string };
export type VideoProvider = { family: VideoProviderFamily; status: VideoProviderStatus; live: false };

export function videoProvider(): VideoProvider {
  return { family: 'none', status: 'not_configured', live: false };
}

export function videoMeetingInfrastructureLive() {
  return false;
}

export function createVideoMeeting(input: {
  meetingId: string;
  organizationId: string;
  universeId?: string | null;
  classification?: VideoMeeting['classification'];
  mode?: MeetingMode;
}): VideoMeeting {
  return {
    meetingId: input.meetingId,
    organizationId: input.organizationId,
    universeId: input.universeId ?? null,
    classification: input.classification ?? 'internal',
    mode: input.mode ?? 'team',
    providerStatus: 'not_configured',
    live: false,
  };
}

export function privateMeetingCannotExposeCompanyBrain(input: {
  meetingClassification: VideoMeeting['classification'];
  exposeCompanyBrain: boolean;
}) {
  if (input.exposeCompanyBrain) {
    return { allowed: false as const, reason: 'Private meetings cannot expose Company Brain data to attendees or Global Brain.' };
  }
  void input.meetingClassification;
  return { allowed: true as const, companyBrainExposed: false as const };
}

export function consumerCannotAccessPrivateCompanyMeeting(input: {
  actorRole: 'consumer' | 'employee' | 'business_owner' | 'executive' | string;
  meetingClassification: VideoMeeting['classification'];
  sameOrganization: boolean;
}) {
  if (input.actorRole === 'consumer') {
    return { allowed: false as const, reason: 'Consumers cannot access private company meetings.' };
  }
  if (!input.sameOrganization && input.meetingClassification !== 'public') {
    return { allowed: false as const, reason: 'Private company meetings are tenant-scoped.' };
  }
  return { allowed: true as const };
}

export function meetingRecordingPolicy(): MeetingRecordingPolicy {
  return {
    recordingEnabled: false,
    transcriptEnabled: false,
    reason: 'Recording and transcript providers are not_configured.',
  };
}
