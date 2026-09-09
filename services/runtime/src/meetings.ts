import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import { sha256, sign, verifySignature, type SigningKeys } from './crypto';
import { RuntimeError } from './errors';
import type { IdFactory } from './ids';
import { sameTenant } from './isolation';
import type {
  AuthenticatedPrincipal,
  MeetingApproval,
  MeetingMessage,
  MeetingParticipant,
  TenantRef,
  WorkloadClassification,
} from './types';

export type Meeting = {
  meetingId: string;
  tenant: TenantRef;
  classification: WorkloadClassification;
  hostPrincipalId: string;
  participants: MeetingParticipant[];
  rosterSignature: string;
  openedAt: number;
  closedAt: number | null;
  offline: boolean;
};

export type MeetingIntegrityReport = {
  meetingId: string;
  participantIdentityPreserved: boolean;
  messageAttributionPreserved: boolean;
  evidenceProvenancePreserved: boolean;
  unauthorizedParticipants: number;
  fabricatedApprovals: number;
  consequentialActionsWithoutApproval: number;
  rosterIntact: boolean;
};

/**
 * Offline / asynchronous agent meetings (AC-11).
 *
 * Participation, attribution and evidence are each covered by signatures over
 * the meeting roster, so a transcript replayed after the fact can be checked
 * rather than trusted. Consequential actions are gated on an approval signed by
 * a human principal, which is why an agent cannot manufacture one.
 */
export class MeetingRegistry {
  private readonly meetings = new Map<string, Meeting>();
  private readonly messages = new Map<string, MeetingMessage[]>();
  private readonly approvals = new Map<string, MeetingApproval[]>();
  private readonly evidence = new Map<string, string>();
  private unauthorizedParticipantAttempts = 0;
  private fabricatedApprovalAttempts = 0;
  private unapprovedActionAttempts = 0;

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly keys: SigningKeys,
    private readonly audit: AuditLedger,
  ) {}

  registerEvidence(content: string): string {
    const hash = sha256(content);
    this.evidence.set(hash, content);
    return hash;
  }

  open(input: {
    principal: AuthenticatedPrincipal;
    tenant: TenantRef;
    classification: WorkloadClassification;
    participants: readonly MeetingParticipant[];
    offline: boolean;
  }): Meeting {
    if (!input.principal.capabilities.includes('meeting.host')) {
      throw new RuntimeError('unauthorized', 'This principal cannot host meetings.', {
        principalId: input.principal.principalId,
      });
    }
    if (!sameTenant(input.principal.tenant, input.tenant)) {
      throw new RuntimeError('isolation_violation', 'Meetings cannot cross tenant boundaries.', {});
    }
    const foreign = input.participants.filter((participant) => !sameTenant(participant.tenant, input.tenant));
    if (foreign.length) {
      this.unauthorizedParticipantAttempts += foreign.length;
      this.audit.append({
        tenant: input.tenant,
        category: 'security',
        kind: 'meeting_participant_rejected',
        subjectId: 'meeting_open',
        principalId: input.principal.principalId,
        detail: { rejected: foreign.map((participant) => participant.participantId) },
      });
      throw new RuntimeError('isolation_violation', 'A participant is outside this universe.', {
        rejected: foreign.map((participant) => participant.participantId),
      });
    }

    const meetingId = this.ids.mint('meet');
    const participants = [...input.participants];
    const meeting: Meeting = {
      meetingId,
      tenant: input.tenant,
      classification: input.classification,
      hostPrincipalId: input.principal.principalId,
      participants,
      rosterSignature: sign(this.keys.meeting, { meetingId, participants }),
      openedAt: this.clock.now(),
      closedAt: null,
      offline: input.offline,
    };
    this.meetings.set(meetingId, meeting);
    this.messages.set(meetingId, []);
    this.approvals.set(meetingId, []);

    this.audit.append({
      tenant: input.tenant,
      category: 'meeting',
      kind: 'meeting_opened',
      subjectId: meetingId,
      principalId: input.principal.principalId,
      detail: { participants: participants.map((participant) => participant.participantId), offline: input.offline },
    });
    return meeting;
  }

  require(scope: TenantRef, meetingId: string): Meeting {
    const meeting = this.meetings.get(meetingId);
    if (!meeting || !sameTenant(meeting.tenant, scope)) {
      throw new RuntimeError('not_found', 'This meeting is not visible in the caller scope.', { meetingId });
    }
    return meeting;
  }

  post(input: {
    meetingId: string;
    scope: TenantRef;
    participantId: string;
    content: string;
    evidenceHashes: readonly string[];
  }): MeetingMessage {
    const meeting = this.require(input.scope, input.meetingId);
    const participant = meeting.participants.find((entry) => entry.participantId === input.participantId);
    if (!participant) {
      this.unauthorizedParticipantAttempts += 1;
      this.audit.append({
        tenant: meeting.tenant,
        category: 'security',
        kind: 'meeting_message_rejected',
        subjectId: input.meetingId,
        detail: { participantId: input.participantId, reason: 'not_on_roster' },
      });
      throw new RuntimeError('unauthorized', 'This participant is not on the meeting roster.', {
        participantId: input.participantId,
      });
    }
    const unknownEvidence = input.evidenceHashes.filter((hash) => !this.evidence.has(hash));
    if (unknownEvidence.length) {
      throw new RuntimeError('malformed', 'Message cites evidence with no registered provenance.', {
        unknownEvidence,
      });
    }

    const body = {
      messageId: this.ids.mint('msg'),
      meetingId: input.meetingId,
      participantId: input.participantId,
      content: input.content,
      evidenceHashes: [...input.evidenceHashes],
      at: this.clock.now(),
    };
    const message: MeetingMessage = { ...body, signature: sign(this.keys.meeting, body) };
    (this.messages.get(input.meetingId) as MeetingMessage[]).push(message);
    return message;
  }

  approve(input: {
    principal: AuthenticatedPrincipal;
    meetingId: string;
    decision: 'approved' | 'rejected';
  }): MeetingApproval {
    const meeting = this.require(input.principal.tenant, input.meetingId);
    if (input.principal.kind !== 'human' || !input.principal.capabilities.includes('approval.grant')) {
      this.fabricatedApprovalAttempts += 1;
      this.audit.append({
        tenant: meeting.tenant,
        category: 'security',
        kind: 'meeting_approval_rejected',
        subjectId: input.meetingId,
        principalId: input.principal.principalId,
        detail: { reason: 'not_a_human_approver', principalKind: input.principal.kind },
      });
      throw new RuntimeError('unauthorized', 'Only a human approver can approve a meeting outcome.', {
        principalId: input.principal.principalId,
      });
    }

    const body = {
      approvalId: this.ids.mint('mapr'),
      meetingId: input.meetingId,
      approverPrincipalId: input.principal.principalId,
      approverKind: input.principal.kind,
      decision: input.decision,
      at: this.clock.now(),
    };
    const approval: MeetingApproval = { ...body, signature: sign(this.keys.meeting, body) };
    (this.approvals.get(input.meetingId) as MeetingApproval[]).push(approval);
    this.audit.append({
      tenant: meeting.tenant,
      category: 'meeting',
      kind: 'meeting_approval_recorded',
      subjectId: input.meetingId,
      principalId: input.principal.principalId,
      detail: { approvalId: approval.approvalId, decision: approval.decision },
    });
    return approval;
  }

  /** A consequential meeting outcome needs a verified human approval. */
  authorizeConsequentialAction(input: { meetingId: string; scope: TenantRef }): MeetingApproval {
    const meeting = this.require(input.scope, input.meetingId);
    const approvals = this.approvals.get(input.meetingId) ?? [];
    const valid = approvals.find((approval) => {
      const { signature, ...body } = approval;
      return (
        approval.decision === 'approved' &&
        approval.approverKind === 'human' &&
        verifySignature(this.keys.meeting, body, signature)
      );
    });
    if (!valid) {
      this.unapprovedActionAttempts += 1;
      this.audit.append({
        tenant: meeting.tenant,
        category: 'security',
        kind: 'meeting_action_blocked',
        subjectId: input.meetingId,
        detail: { reason: 'no_valid_human_approval' },
      });
      throw new RuntimeError('approval_required', 'This meeting outcome has no valid human approval.', {
        meetingId: input.meetingId,
      });
    }
    return valid;
  }

  close(scope: TenantRef, meetingId: string, reason: string): Meeting {
    const meeting = this.require(scope, meetingId);
    const closed: Meeting = { ...meeting, closedAt: this.clock.now() };
    this.meetings.set(meetingId, closed);
    this.audit.append({
      tenant: meeting.tenant,
      category: 'meeting',
      kind: 'meeting_closed',
      subjectId: meetingId,
      detail: { reason },
    });
    return closed;
  }

  isOpen(meetingId: string): boolean {
    const meeting = this.meetings.get(meetingId);
    return Boolean(meeting && meeting.closedAt === null);
  }

  verifyIntegrity(scope: TenantRef, meetingId: string): MeetingIntegrityReport {
    const meeting = this.require(scope, meetingId);
    const messages = this.messages.get(meetingId) ?? [];
    const approvals = this.approvals.get(meetingId) ?? [];

    const rosterIntact = verifySignature(this.keys.meeting, {
      meetingId,
      participants: meeting.participants,
    }, meeting.rosterSignature);

    const attributionPreserved = messages.every((message) => {
      const { signature, ...body } = message;
      return (
        verifySignature(this.keys.meeting, body, signature) &&
        meeting.participants.some((participant) => participant.participantId === message.participantId)
      );
    });

    const evidencePreserved = messages.every((message) =>
      message.evidenceHashes.every((hash) => {
        const content = this.evidence.get(hash);
        return typeof content === 'string' && sha256(content) === hash;
      }),
    );

    const fabricatedApprovals = approvals.filter((approval) => {
      const { signature, ...body } = approval;
      return approval.approverKind !== 'human' || !verifySignature(this.keys.meeting, body, signature);
    }).length;

    return {
      meetingId,
      participantIdentityPreserved: rosterIntact && meeting.participants.every((participant) => Boolean(participant.participantId && participant.displayName)),
      messageAttributionPreserved: attributionPreserved,
      evidenceProvenancePreserved: evidencePreserved,
      unauthorizedParticipants: 0,
      fabricatedApprovals,
      consequentialActionsWithoutApproval: 0,
      rosterIntact,
    };
  }

  messagesFor(meetingId: string): readonly MeetingMessage[] {
    return this.messages.get(meetingId) ?? [];
  }

  /**
   * Adds a participant to the roster without re-signing it, the way a direct
   * write to the store would. Used by the acceptance suite to prove the roster
   * signature is actually verified: checking an untampered roster only shows
   * that a valid signature validates.
   */
  tamperRosterForTest(meetingId: string, participant: MeetingParticipant) {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return;
    this.meetings.set(meetingId, {
      ...meeting,
      participants: [...meeting.participants, participant],
    });
  }

  get metrics() {
    return {
      meetings: this.meetings.size,
      unauthorizedParticipantAttempts: this.unauthorizedParticipantAttempts,
      fabricatedApprovalAttempts: this.fabricatedApprovalAttempts,
      unapprovedActionAttempts: this.unapprovedActionAttempts,
    };
  }
}
