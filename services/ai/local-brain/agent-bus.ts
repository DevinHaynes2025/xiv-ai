import { randomUUID } from 'node:crypto';

export type AgentMessageKind = 'task' | 'evidence' | 'challenge' | 'decision_support' | 'status';

export type AgentMessage = {
  id: string;
  fromRole: string;
  toRole: string;
  tenantId: string;
  universeId: string;
  kind: AgentMessageKind;
  body: string;
  evidenceRefs: string[];
  createdAt: string;
  requiresHumanApproval: boolean;
};

const MAX_MESSAGES = 10_000;
const messages: AgentMessage[] = [];

export function publishAgentMessage(input: Omit<AgentMessage, 'id' | 'createdAt'>) {
  if (!input.fromRole || !input.toRole) throw new Error('agent roles are required');
  if (!input.tenantId || !input.universeId) throw new Error('tenantId and universeId are required');
  if (!input.body.trim()) throw new Error('message body is required');
  if (input.body.length > 16_000) throw new Error('message body too large');

  const message: AgentMessage = {
    ...input,
    id: `agent_msg_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    evidenceRefs: [...input.evidenceRefs],
  };

  messages.push(message);
  if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);
  return message;
}

export function inbox(role: string, tenantId: string, universeId: string) {
  return messages.filter((message) =>
    message.toRole === role &&
    message.tenantId === tenantId &&
    message.universeId === universeId,
  );
}

export function agentBusStats() {
  return {
    bufferedMessages: messages.length,
    maxBufferedMessages: MAX_MESSAGES,
    crossUniverseRouting: false as const,
    productionAuthorization: false as const,
  };
}
