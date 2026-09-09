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
  expiresAt: string;
  requiresHumanApproval: boolean;
};

const MAX_MESSAGES = 10_000;
export const DEFAULT_MESSAGE_TTL_MS = 30 * 60_000;
const MIN_TTL_MS = 1_000;
const MAX_TTL_MS = 24 * 60 * 60_000;
const messages: AgentMessage[] = [];

export type PublishAgentMessageInput = Omit<AgentMessage, 'id' | 'createdAt' | 'expiresAt'> & {
  ttlMs?: number;
  now?: number;
};

function clampTtl(ttlMs?: number) {
  return Math.max(MIN_TTL_MS, Math.min(ttlMs ?? DEFAULT_MESSAGE_TTL_MS, MAX_TTL_MS));
}

export function reapExpiredAgentMessages(now = Date.now()) {
  let removed = 0;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (Date.parse(messages[index].expiresAt) <= now) {
      messages.splice(index, 1);
      removed += 1;
    }
  }
  return removed;
}

export function resetAgentBus() {
  messages.length = 0;
}

export function publishAgentMessage(input: PublishAgentMessageInput) {
  if (!input.fromRole || !input.toRole) throw new Error('agent roles are required');
  if (!input.tenantId || !input.universeId) throw new Error('tenantId and universeId are required');
  if (!input.body.trim()) throw new Error('message body is required');
  if (input.body.length > 16_000) throw new Error('message body too large');

  const now = input.now ?? Date.now();
  reapExpiredAgentMessages(now);
  const ttlMs = clampTtl(input.ttlMs);
  const message: AgentMessage = {
    fromRole: input.fromRole,
    toRole: input.toRole,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    body: input.body,
    evidenceRefs: [...input.evidenceRefs],
    requiresHumanApproval: input.requiresHumanApproval,
    id: `agent_msg_${randomUUID()}`,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
  };

  messages.push(message);
  if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);
  return message;
}

export function inbox(role: string, tenantId: string, universeId: string, now = Date.now()) {
  reapExpiredAgentMessages(now);
  return messages.filter((message) =>
    message.toRole === role &&
    message.tenantId === tenantId &&
    message.universeId === universeId &&
    Date.parse(message.expiresAt) > now,
  );
}

export function agentBusStats(now = Date.now()) {
  reapExpiredAgentMessages(now);
  return {
    bufferedMessages: messages.length,
    maxBufferedMessages: MAX_MESSAGES,
    defaultTtlMs: DEFAULT_MESSAGE_TTL_MS,
    crossUniverseRouting: false as const,
    productionAuthorization: false as const,
  };
}
