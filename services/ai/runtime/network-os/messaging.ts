/**
 * Premium business messaging contracts. Real-time backend is not LIVE.
 */
export type ConversationKind = 'direct' | 'group' | 'company_channel' | 'meeting_chat' | 'event_chat';

export type Conversation = {
  conversationId: string;
  organizationId: string;
  universeId: string | null;
  kind: ConversationKind;
  realtimeLive: false;
};

export type ConversationMember = {
  memberId: string;
  conversationId: string;
  userId: string;
  organizationId: string;
};

export type DirectMessage = { conversationId: string; kind: 'direct' };
export type GroupConversation = { conversationId: string; kind: 'group' };
export type MessageKind =
  | 'text'
  | 'attachment'
  | 'voice'
  | 'meeting_invite'
  | 'event_invite'
  | 'opportunity'
  | 'agent_summary';

export type Message = {
  messageId: string;
  conversationId: string;
  senderId: string;
  organizationId: string;
  kind: MessageKind;
  body: string;
};

export type Attachment = { attachmentId: string; messageId: string; name: string };
export type VoiceMessage = { messageId: string; durationSeconds: number | null; liveTranscription: false };
export type MeetingInviteMessage = { messageId: string; meetingId: string };
export type EventInviteMessage = { messageId: string; eventId: string };
export type OpportunityMessage = { messageId: string; opportunityId: string };
export type AgentSummaryMessage = { messageId: string; stance: 'inferred'; live: false };
export type ConversationAuditEvent = { eventId: string; conversationId: string; action: string; at: string };

export function messagingRealtimeLive() {
  return false;
}

export function createConversation(input: {
  conversationId: string;
  organizationId: string;
  universeId?: string | null;
  kind?: ConversationKind;
}): Conversation {
  return {
    conversationId: input.conversationId,
    organizationId: input.organizationId,
    universeId: input.universeId ?? null,
    kind: input.kind ?? 'direct',
    realtimeLive: false,
  };
}

export function messageCannotCrossTenant(input: {
  senderOrganizationId: string;
  conversationOrganizationId: string;
}) {
  if (!input.senderOrganizationId || !input.conversationOrganizationId) {
    return { allowed: false as const, reason: 'Messaging requires tenant scope.' };
  }
  if (input.senderOrganizationId !== input.conversationOrganizationId) {
    return { allowed: false as const, reason: 'Messages cannot cross tenant boundaries.' };
  }
  return { allowed: true as const };
}
