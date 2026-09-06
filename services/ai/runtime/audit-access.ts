import { createId, nowIso } from './actions';
import type { AuditStore } from './audit';

export type AccessAuditCategory =
  | 'universe'
  | 'business_data'
  | 'media'
  | 'media_rejection'
  | 'agent_data'
  | 'policy'
  | 'approval'
  | 'source';

export type AccessAuditInput = {
  category: AccessAuditCategory;
  agentId: string;
  toolId: string;
  universeId?: string | null;
  organizationId?: string | null;
  resourceId?: string | null;
  reason: string;
  decision: 'allowed' | 'denied' | 'requires_approval';
};

const SECRET = /(password|token|api[_-]?key|secret|private[_-]?key|X-Amz-|signature=|sig=)/i;

export function sanitizeAuditText(value: string) {
  return value
    .split(/\r?\n/)
    .filter((line) => !SECRET.test(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripSignedUrlSecrets(value: string) {
  return value
    .replace(/[?&](X-Amz-[^=]+|signature|sig|token|api[_-]?key)=[^&\s]+/gi, '')
    .replace(/https?:\/\/[^\s]+/gi, (url) => url.split('?')[0] ?? url);
}

export function recordAccessEvent(store: AuditStore, input: AccessAuditInput) {
  store.record({
    eventId: createId('evt'),
    actionId: createId('acc'),
    agentId: input.agentId,
    timestamp: nowIso(),
    verdict: input.decision === 'requires_approval' ? 'requires_approval' : input.decision === 'allowed' ? 'allowed' : 'denied',
    toolId: input.toolId,
    note: sanitizeAuditText(
      stripSignedUrlSecrets(
        `${input.category} ${input.decision} universe=${input.universeId ?? 'none'} org=${input.organizationId ?? 'none'} resource=${input.resourceId ?? 'none'} reason=${input.reason}`,
      ),
    ),
    status: input.decision === 'denied' ? 'denied' : input.decision === 'requires_approval' ? 'awaiting_approval' : 'completed',
  });
}
