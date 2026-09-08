/**
 * Agent workforce messages — tenant/universe scoped, never bypass isolation.
 */

import type { AgentWorkforceMessage, AgentWorkforceMessageType } from './types';

export function createWorkforceMessage(input: {
  messageId: string;
  type: AgentWorkforceMessageType;
  missionId: string;
  tenantId: string;
  universeId: string;
  fromWorkerId?: string | null;
  toWorkerId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
  createdAt: string;
}): AgentWorkforceMessage {
  return {
    messageId: input.messageId,
    type: input.type,
    missionId: input.missionId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromWorkerId: input.fromWorkerId ?? null,
    toWorkerId: input.toWorkerId ?? null,
    payload: input.payload ?? {},
    bypassesTenantIsolation: false,
    bypassesUniverseIsolation: false,
    createdAt: input.createdAt,
  };
}

export function messageBypassesTenantIsolation(_msg: AgentWorkforceMessage): false {
  return false;
}

export function messageBypassesUniverseIsolation(_msg: AgentWorkforceMessage): false {
  return false;
}
