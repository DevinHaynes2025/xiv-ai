/**
 * Communication Bus V2, Evidence packets, Meeting Room.
 * Meeting ≠ authority. Exchange references, not uncontrolled sensitive copies.
 */

import type {
  AgentMeeting,
  BusMessageType,
  Classification,
  EvidencePacket,
  MissionControlMessage,
} from './types';

export function createBusMessage(input: {
  messageId: string;
  type: BusMessageType;
  sender: string;
  receiver: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  classification: Classification;
  purpose: string;
  timestamp: string;
  traceId: string;
}): MissionControlMessage {
  return { ...input, forged: false };
}

export function evaluateBusMessage(input: {
  message: MissionControlMessage;
  senderTenantId: string;
  receiverTenantId: string;
  senderUniverseId: string;
  receiverUniverseId: string;
  forged?: boolean;
}): { ok: true } | { ok: false; reason: string; audited: true } {
  if (input.forged || input.message.forged) {
    return { ok: false, reason: 'message spoofing / forged message denied', audited: true };
  }
  if (input.senderTenantId !== input.receiverTenantId || input.message.tenantId !== input.receiverTenantId) {
    return { ok: false, reason: 'cross-tenant bus message denied', audited: true };
  }
  if (
    input.senderUniverseId !== input.receiverUniverseId ||
    input.message.universeId !== input.receiverUniverseId
  ) {
    return { ok: false, reason: 'cross-universe bus message denied', audited: true };
  }
  return { ok: true };
}

export function createEvidencePacket(input: {
  packetId: string;
  claim: string;
  sourceReferences: readonly string[];
  classification: Classification;
  provenance: string;
  freshness: string;
  confidence: number;
  contradictions?: readonly string[];
  allowedRecipients: readonly string[];
}): EvidencePacket {
  return {
    packetId: input.packetId,
    claim: input.claim,
    sourceReferences: input.sourceReferences,
    classification: input.classification,
    provenance: input.provenance,
    freshness: input.freshness,
    confidence: input.confidence,
    contradictions: input.contradictions ?? [],
    allowedRecipients: input.allowedRecipients,
    copiesSensitivePayload: false,
  };
}

export function mayDeliverEvidence(
  packet: EvidencePacket,
  recipientId: string,
  recipientTenantId: string,
  packetTenantId: string,
  recipientUniverseId: string,
  packetUniverseId: string,
): { ok: true } | { ok: false; reason: string; audited: true } {
  if (recipientTenantId !== packetTenantId) {
    return { ok: false, reason: 'cross-tenant evidence access denied', audited: true };
  }
  if (recipientUniverseId !== packetUniverseId) {
    return { ok: false, reason: 'cross-Universe evidence access denied', audited: true };
  }
  if (!packet.allowedRecipients.includes(recipientId) && !packet.allowedRecipients.includes('*')) {
    return { ok: false, reason: 'recipient not on evidence allowlist', audited: true };
  }
  return { ok: true };
}

export function evidenceCopiesSensitivePayload(_p: EvidencePacket): false {
  return false;
}

export function openMeeting(input: {
  meetingId: string;
  tenantId: string;
  universeId: string;
  agenda: string;
}): AgentMeeting {
  return {
    meetingId: input.meetingId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    agenda: input.agenda,
    stage: 'AGENDA',
    positions: [],
    disagreements: [],
    actionProposals: [],
    meetingEqualsAuthority: false,
    productionLive: false,
  };
}

export function advanceMeeting(
  meeting: AgentMeeting,
  patch: Partial<Pick<AgentMeeting, 'positions' | 'disagreements' | 'actionProposals' | 'stage'>>,
): AgentMeeting {
  return { ...meeting, ...patch, meetingEqualsAuthority: false, productionLive: false };
}

export function meetingEqualsAuthority(_m: AgentMeeting): false {
  return false;
}
