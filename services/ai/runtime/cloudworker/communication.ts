/**
 * Cloud agent communication — tenant/universe isolated.
 */

import type { CloudAgentCommMessage } from './types';

export function createCloudAgentMessage(input: {
  messageId: string;
  fromWorkerId: string;
  toWorkerId: string;
  tenantId: string;
  universeId: string;
  kind: CloudAgentCommMessage['kind'];
  body: string;
}): CloudAgentCommMessage {
  return {
    ...input,
    bypassesTenantIsolation: false,
    bypassesUniverseIsolation: false,
  };
}

export function deliverCloudAgentMessage(
  msg: CloudAgentCommMessage,
  ctx: { fromTenantId: string; fromUniverseId: string; toTenantId: string; toUniverseId: string },
): { ok: true } | { ok: false; reason: string; audited: true } {
  if (msg.tenantId !== ctx.fromTenantId || msg.tenantId !== ctx.toTenantId) {
    return { ok: false, reason: 'cross_tenant_denied', audited: true };
  }
  if (msg.universeId !== ctx.fromUniverseId || msg.universeId !== ctx.toUniverseId) {
    return { ok: false, reason: 'cross_universe_denied', audited: true };
  }
  if (msg.bypassesTenantIsolation || msg.bypassesUniverseIsolation) {
    return { ok: false, reason: 'isolation_bypass_forbidden', audited: true };
  }
  return { ok: true };
}
