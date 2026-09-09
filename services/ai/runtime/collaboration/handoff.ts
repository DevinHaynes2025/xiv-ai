import { createId, nowIso } from '../actions';
import { getXivAgent, type XivAgentId } from '../agents';
import { authorityRank, type AuthorityLevel } from '../authority';
import type { DataScope } from '../context/adapters/scope';
import type { DataClassification } from '../universe/types';
import type { AgentHandoff, AgentMessage, HandoffType } from './types';

export function createHandoff(input: {
  sessionId: string;
  sourceAgent: XivAgentId;
  targetAgent: XivAgentId;
  type: HandoffType;
  purpose: string;
  requestedOutput: string;
  evidenceRefs?: readonly string[];
  allowedDataScopes?: readonly DataScope[];
  allowedTools?: readonly string[];
  authorityLevel: AuthorityLevel;
  organizationId?: string | null;
  universeId?: string | null;
  hopCount: number;
  maxHopCount: number;
  correlationId: string;
  scope?: DataScope;
  classification?: DataClassification;
  transferAuthority?: boolean;
  deadline?: string | null;
}): AgentHandoff {
  const target = getXivAgent(input.targetAgent);
  return {
    handoffId: createId('hnd'),
    sessionId: input.sessionId,
    sourceAgent: input.sourceAgent,
    targetAgent: input.targetAgent,
    type: input.type,
    organizationId: input.organizationId ?? null,
    universeId: input.universeId ?? null,
    purpose: input.purpose,
    allowedDataScopes: input.allowedDataScopes ?? ['public'],
    allowedTools: input.allowedTools ?? target?.allowedTools ?? [],
    authorityLevel: input.authorityLevel,
    deadline: input.deadline ?? null,
    hopCount: input.hopCount,
    maxHopCount: input.maxHopCount,
    createdAt: nowIso(),
    provenance: {
      sourceId: 'xiv-agent-mesh',
      prototype: true,
      classification: input.classification ?? 'internal',
    },
    correlationId: input.correlationId,
    evidenceRefs: input.evidenceRefs ?? [],
    requestedOutput: input.requestedOutput,
    scope: input.scope ?? 'personal',
    transferAuthority: input.transferAuthority,
  };
}

export function structuredHandoffMessage(handoff: AgentHandoff, payload: Record<string, unknown> = {}): AgentMessage {
  return {
    messageId: createId('msg'),
    sessionId: handoff.sessionId,
    handoffId: handoff.handoffId,
    type: handoff.type,
    sourceAgent: handoff.sourceAgent,
    targetAgent: handoff.targetAgent,
    scope: handoff.scope,
    evidenceRefs: handoff.evidenceRefs,
    requestedOutput: handoff.requestedOutput,
    payload: {
      type: handoff.type,
      sourceAgent: handoff.sourceAgent,
      targetAgent: handoff.targetAgent,
      scope: handoff.scope,
      evidenceRefs: [...handoff.evidenceRefs],
      requestedOutput: handoff.requestedOutput,
      ...payload,
    },
  };
}

export function authorityWouldTransfer(input: {
  sourceAuthority: AuthorityLevel;
  targetAuthority: AuthorityLevel;
  requestedAuthority: AuthorityLevel;
  transferAuthority?: boolean;
}) {
  if (input.transferAuthority) return true;
  return (
    authorityRank(input.requestedAuthority) > authorityRank(input.targetAuthority) ||
    authorityRank(input.requestedAuthority) > authorityRank(input.sourceAuthority)
  );
}

export function directAgentCallDenied() {
  return {
    allowed: false as const,
    reason: 'Agents cannot directly call another agent. Use the collaboration router: DENY',
  };
}
