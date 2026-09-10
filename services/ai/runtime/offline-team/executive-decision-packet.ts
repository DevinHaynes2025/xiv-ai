import type { MeetingMessage, MeetingRole } from './multi-agent-meeting-bus';

export interface ExecutiveDecisionPacket {
  meetingId: string;
  tenantId: string;
  recommendation: string | null;
  supportingRoles: readonly MeetingRole[];
  dissentingRoles: readonly MeetingRole[];
  evidenceRefs: readonly string[];
  unresolvedRisks: readonly string[];
  requiresHumanApproval: boolean;
  productionExecutionAllowed: false;
}

export function buildExecutiveDecisionPacket(input: {
  messages: readonly MeetingMessage[];
  recommendation?: string;
  supportingRoles?: readonly MeetingRole[];
  dissentingRoles?: readonly MeetingRole[];
  unresolvedRisks?: readonly string[];
}): ExecutiveDecisionPacket {
  if (input.messages.length === 0) throw new Error('EMPTY_MEETING');
  const first = input.messages[0];
  if (input.messages.some((m) => m.tenantId !== first.tenantId || m.meetingId !== first.meetingId)) throw new Error('MEETING_BOUNDARY_VIOLATION');
  const evidenceRefs = [...new Set(input.messages.flatMap((m) => m.evidenceRefs))];
  const dissenting = [...(input.dissentingRoles ?? [])];
  const unresolved = [...(input.unresolvedRisks ?? [])];
  return Object.freeze({
    meetingId: first.meetingId,
    tenantId: first.tenantId,
    recommendation: input.recommendation?.trim() || null,
    supportingRoles: Object.freeze([...(input.supportingRoles ?? [])]),
    dissentingRoles: Object.freeze(dissenting),
    evidenceRefs: Object.freeze(evidenceRefs),
    unresolvedRisks: Object.freeze(unresolved),
    requiresHumanApproval: true,
    productionExecutionAllowed: false,
  });
}
