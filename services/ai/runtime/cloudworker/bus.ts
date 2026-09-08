/**
 * Cloud agent communication bus — tenant/universe isolated.
 */

import type { CloudAgentCommMessage } from './types';

export type CloudAgentBus = {
  messages: CloudAgentCommMessage[];
  bypassesTenantIsolation: false;
  bypassesUniverseIsolation: false;
};

export function openCloudAgentBus(): CloudAgentBus {
  return {
    messages: [],
    bypassesTenantIsolation: false,
    bypassesUniverseIsolation: false,
  };
}

export function sendCloudAgentMessage(
  bus: CloudAgentBus,
  input: {
    messageId: string;
    fromWorkerId: string;
    toWorkerId: string;
    tenantId: string;
    universeId: string;
    kind: CloudAgentCommMessage['kind'];
    body: string;
  },
): { ok: true; message: CloudAgentCommMessage } | { ok: false; reason: string; audited: true } {
  if (!input.fromWorkerId || !input.toWorkerId) {
    return { ok: false, reason: 'missing_worker_ids', audited: true };
  }
  const message: CloudAgentCommMessage = {
    messageId: input.messageId,
    fromWorkerId: input.fromWorkerId,
    toWorkerId: input.toWorkerId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    body: input.body,
    bypassesTenantIsolation: false,
    bypassesUniverseIsolation: false,
  };
  bus.messages.push(message);
  return { ok: true, message };
}

export function listBusMessagesForTenant(
  bus: CloudAgentBus,
  tenantId: string,
  universeId: string,
): readonly CloudAgentCommMessage[] {
  return bus.messages.filter((m) => m.tenantId === tenantId && m.universeId === universeId);
}

export function messageBypassesIsolation(_m: CloudAgentCommMessage): false {
  return false;
}
