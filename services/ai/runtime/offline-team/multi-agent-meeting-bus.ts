import { createHash } from 'node:crypto';

export type MeetingRole = 'FOUNDER_TWIN' | 'VIRTUAL_COO' | 'DEVOPS' | 'AI_ENGINEER' | 'SECURITY' | 'CFO' | 'REVIEWER' | 'CHALLENGER';

export interface MeetingMessage {
  meetingId: string;
  tenantId: string;
  role: MeetingRole;
  content: string;
  evidenceRefs: readonly string[];
  createdAt: string;
  messageHash: string;
}

export const MEETING_BUS_GUARDRAILS = {
  localFirst: true,
  maxMessagesPerMeeting: 64,
  crossTenantMessagesAllowed: false,
  productionMutationAllowed: false,
  consequentialDecisionRequiresHuman: true,
  preserveDissent: true,
} as const;

export function createMeetingMessage(input: Omit<MeetingMessage, 'messageHash'>): MeetingMessage {
  if (!input.meetingId || !input.tenantId || !input.role || !input.content.trim()) throw new Error('INVALID_MEETING_MESSAGE');
  const payload = JSON.stringify({ meetingId: input.meetingId, tenantId: input.tenantId, role: input.role, content: input.content, evidenceRefs: input.evidenceRefs, createdAt: input.createdAt });
  return Object.freeze({ ...input, evidenceRefs: Object.freeze([...input.evidenceRefs]), messageHash: createHash('sha256').update(payload).digest('hex') });
}

export function appendMeetingMessage(messages: readonly MeetingMessage[], next: MeetingMessage): readonly MeetingMessage[] {
  if (messages.length >= MEETING_BUS_GUARDRAILS.maxMessagesPerMeeting) throw new Error('MEETING_MESSAGE_LIMIT');
  if (messages.some((m) => m.tenantId !== next.tenantId || m.meetingId !== next.meetingId)) throw new Error('MEETING_BOUNDARY_VIOLATION');
  return Object.freeze([...messages, next]);
}
