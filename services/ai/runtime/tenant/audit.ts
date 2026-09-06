import type { AuditStore } from '../audit';
import { recordAccessEvent } from '../audit-access';

export const TENANT_AUDIT_EVENTS = [
  'organization_selected',
  'universe_selected',
  'organization_bootstrap',
  'universe_bootstrap',
  'membership_denied',
  'cross_org_denied',
  'cross_universe_denied',
] as const;

export type TenantAuditEvent = (typeof TENANT_AUDIT_EVENTS)[number];

export function recordTenantAudit(
  store: AuditStore,
  input: {
    event: TenantAuditEvent;
    actorUserId?: string | null;
    organizationId?: string | null;
    universeId?: string | null;
    decision: 'allowed' | 'denied';
    reason: string;
  },
) {
  recordAccessEvent(store, {
    category: 'tenant',
    agentId: 'runtime',
    toolId: input.event,
    universeId: input.universeId,
    organizationId: input.organizationId,
    resourceId: input.actorUserId ?? null,
    reason: input.reason,
    decision: input.decision,
  });
}
