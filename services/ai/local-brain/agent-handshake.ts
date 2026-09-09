import { randomUUID } from 'node:crypto';

import { publishAgentMessage, inbox } from './agent-bus';
import { decisionGate, type ConsequenceClass } from './decision-gate';

export type HandshakeState = 'offered' | 'accepted' | 'rejected' | 'expired';

export type AgentHandshake = {
  id: string;
  tenantId: string;
  universeId: string;
  fromRole: string;
  toRole: string;
  purpose: string;
  state: HandshakeState;
  evidenceRefs: string[];
  productionAuthorization: false;
  createdAt: string;
};

const handshakes = new Map<string, AgentHandshake>();

export function resetAgentHandshakes() {
  handshakes.clear();
}

export function offerAgentHandshake(input: {
  tenantId: string;
  universeId: string;
  fromRole: string;
  toRole: string;
  purpose: string;
  evidenceRefs?: string[];
  consequence?: ConsequenceClass;
  peerTenantId?: string;
  peerUniverseId?: string;
}) {
  if (!input.tenantId || !input.universeId || !input.fromRole || !input.toRole) {
    return { accepted: false as const, reason: 'HANDSHAKE_SCOPE_REQUIRED' };
  }
  if (input.peerTenantId && input.peerTenantId !== input.tenantId) {
    return { accepted: false as const, reason: 'CROSS_TENANT_HANDSHAKE_DENIED' };
  }
  if (input.peerUniverseId && input.peerUniverseId !== input.universeId) {
    return { accepted: false as const, reason: 'CROSS_UNIVERSE_HANDSHAKE_DENIED' };
  }
  const gate = decisionGate({
    id: `hs_${input.fromRole}_${input.toRole}`,
    action: input.purpose,
    consequence: input.consequence ?? 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  if (gate.humanApprovalRequired && (input.consequence === 'HIGH' || input.consequence === 'CRITICAL')) {
    return { accepted: false as const, reason: gate.reason, state: 'HUMAN_APPROVAL_REQUIRED' as const };
  }

  const handshake: AgentHandshake = {
    id: `hs_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromRole: input.fromRole,
    toRole: input.toRole,
    purpose: input.purpose.trim(),
    state: 'offered',
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  handshakes.set(handshake.id, handshake);
  publishAgentMessage({
    fromRole: input.fromRole,
    toRole: input.toRole,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'status',
    body: `Handshake offered: ${input.purpose.trim()}`,
    evidenceRefs: handshake.evidenceRefs,
    requiresHumanApproval: gate.humanApprovalRequired,
  });
  return { accepted: true as const, handshake };
}

export function acceptAgentHandshake(id: string, tenantId: string, universeId: string) {
  const handshake = handshakes.get(id);
  if (!handshake) return { accepted: false as const, reason: 'HANDSHAKE_NOT_FOUND' };
  if (handshake.tenantId !== tenantId || handshake.universeId !== universeId) {
    return { accepted: false as const, reason: 'HANDSHAKE_SCOPE_MISMATCH' };
  }
  if (handshake.state !== 'offered') return { accepted: false as const, reason: 'HANDSHAKE_NOT_OFFERED' };
  handshake.state = 'accepted';
  return { accepted: true as const, handshake };
}

export function rejectAgentHandshake(id: string, tenantId: string, universeId: string, reason: string) {
  const handshake = handshakes.get(id);
  if (!handshake || handshake.tenantId !== tenantId || handshake.universeId !== universeId) {
    return { accepted: false as const, reason: 'HANDSHAKE_SCOPE_MISMATCH' };
  }
  handshake.state = 'rejected';
  return { accepted: true as const, handshake, reason };
}

export function handshakeInbox(role: string, tenantId: string, universeId: string) {
  return inbox(role, tenantId, universeId);
}

export function listHandshakes(tenantId: string, universeId: string) {
  return [...handshakes.values()].filter((item) => item.tenantId === tenantId && item.universeId === universeId);
}
