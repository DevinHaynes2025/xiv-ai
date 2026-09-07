import { getXivAgent } from '../agents';
import { authorityWouldTransfer } from '../collaboration/handoff';
import { findAllowedEdge, guardianMayJoinMesh, isMeshParticipant } from '../collaboration/registry';
import { HANDOFF_TYPES, type AgentHandoff, type CollaborationFailure } from '../collaboration/types';
import type { PersistenceStatus } from '../tenant/context';

export type FirewallDecision = {
  allowed: boolean;
  reason: string;
  failure?: CollaborationFailure;
};

function deny(reason: string, code: CollaborationFailure['code']): FirewallDecision {
  return { allowed: false, reason, failure: { code, reason } };
}

export function evaluateAgentFirewall(input: {
  handoff: AgentHandoff;
  persistenceStatus?: PersistenceStatus;
}): FirewallDecision {
  const { handoff } = input;
  if (!HANDOFF_TYPES.includes(handoff.type)) {
    return deny('Unknown handoff type is denied by Agent Firewall: DENY', 'unknown_handoff');
  }
  if (!guardianMayJoinMesh(handoff.sourceAgent) || !guardianMayJoinMesh(handoff.targetAgent)) {
    return deny('Guardian cannot join the tenant agent mesh: DENY', 'guardian_mesh');
  }
  if (!isMeshParticipant(handoff.sourceAgent) || !isMeshParticipant(handoff.targetAgent)) {
    return deny('Agent Firewall default deny: unknown mesh participant.', 'handoff_denied');
  }
  const source = getXivAgent(handoff.sourceAgent);
  const target = getXivAgent(handoff.targetAgent);
  if (!source || !target) {
    return deny('Unknown agent is not registered: DENY', 'agent_unavailable');
  }
  if (source.status === 'future' || target.status === 'future') {
    return deny('Future agent cannot participate in a handoff: DENY', 'agent_unavailable');
  }
  if (!findAllowedEdge(handoff.sourceAgent, handoff.targetAgent, handoff.type)) {
    return deny('Agent Firewall default deny: unapproved handoff edge.', 'handoff_denied');
  }
  if (
    authorityWouldTransfer({
      sourceAuthority: source.defaultAuthority,
      targetAuthority: target.defaultAuthority,
      requestedAuthority: handoff.authorityLevel,
      transferAuthority: handoff.transferAuthority,
    })
  ) {
    return deny('Authority cannot transfer between agents: DENY', 'authority_transfer');
  }
  const toolsOk = handoff.allowedTools.every((toolId) => target.allowedTools.includes(toolId));
  if (!toolsOk) {
    return deny('Handoff requests a tool the target agent is not allowlisted for: DENY', 'handoff_denied');
  }
  if (handoff.universeId && handoff.organizationId === null) {
    return deny('Universe-scoped handoff requires an organization: DENY', 'tenant_unavailable');
  }
  if (input.persistenceStatus === 'schema_collision' && (handoff.scope === 'organization' || handoff.scope === 'universe')) {
    return deny(
      'Tenant persistence is blocked by schema collision. Private tenant handoff is NOT CONFIGURED.',
      'schema_collision',
    );
  }
  return { allowed: true, reason: 'Bounded handoff passed Agent Firewall.' };
}

export function defaultDenyUnknownHandoff() {
  return deny('Agent Firewall default deny: unknown handoff.', 'unknown_handoff');
}
