/**
 * US-AGT-02 — Agent approval + audit trail.
 * List/persist via ai_agent_approvals / ai_agent_audit_events patterns
 * (Supabase when AgentPersistence is bound; otherwise session + governed in-memory store).
 * Honest WAITING_DATA when DB unavailable. L4 remains false. No production writes without approval.
 */

import { getPrototypeAuditStore } from './runtime/audit';
import { isAgentPersistenceBound } from './persistence';
import type { ApprovalRecord, GovernedAuditEvent } from './runtime/actions';
import type { AgentApproval, AgentIntentLog, AgentToolId, AgentType } from './types';

export const APPROVAL_AUDIT_POLICY = {
  requiresApproval: true,
  l4Autonomy: false as const,
  productionMutation: false as const,
  productionWritesWithoutApproval: false as const,
  label: 'APPROVAL_AUDIT_TRAIL',
} as const;

export type ApprovalAuditSource = 'session_memory' | 'governed_memory' | 'persistence_bound' | 'waiting_data';

export type ApprovalAuditSessionEntry = {
  id: string;
  actionId: string;
  decision: AgentApproval['decision'];
  decidedAt: string;
  actorUserId: string;
  note: string;
  agentType: AgentType;
  source: 'session_memory';
};

export type ApprovalAuditEventEntry = {
  id: string;
  kind: AgentIntentLog['kind'];
  at: string;
  actionId?: string;
  toolId?: AgentToolId;
  note: string;
  agentType: AgentType;
};

export type ApprovalAuditTrail = {
  status: 'READY' | 'WAITING_DATA';
  persistenceBound: boolean;
  l4Autonomy: false;
  productionWritesWithoutApproval: false;
  sessionApprovals: ApprovalAuditSessionEntry[];
  sessionDecisionEvents: ApprovalAuditEventEntry[];
  governedApprovals: ApprovalRecord[];
  governedEvents: GovernedAuditEvent[];
  note: string;
};

const DECISION_KINDS = new Set<AgentIntentLog['kind']>(['approve', 'reject']);

export function listApprovalAuditTrail(input?: {
  approvals?: AgentApproval[];
  intents?: AgentIntentLog[];
}): ApprovalAuditTrail {
  const persistenceBound = isAgentPersistenceBound();
  const store = getPrototypeAuditStore();
  const sessionApprovals: ApprovalAuditSessionEntry[] = (input?.approvals ?? []).map((item) => ({
    id: item.id,
    actionId: item.actionId,
    decision: item.decision,
    decidedAt: item.decidedAt,
    actorUserId: item.actorUserId,
    note: item.note,
    agentType: item.agentType,
    source: 'session_memory' as const,
  }));

  const sessionDecisionEvents: ApprovalAuditEventEntry[] = (input?.intents ?? [])
    .filter((item) => DECISION_KINDS.has(item.kind))
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      at: item.at,
      actionId: item.actionId,
      toolId: item.toolId,
      note: item.note,
      agentType: item.agentType,
    }));

  const governedApprovals = store.listApprovals();
  const governedEvents = store.listEvents().filter((event) => {
    const status = event.status;
    return (
      status === 'approved' ||
      status === 'denied' ||
      status === 'awaiting_approval' ||
      event.verdict === 'requires_approval' ||
      event.verdict === 'denied'
    );
  });

  const hasAny =
    sessionApprovals.length > 0 ||
    sessionDecisionEvents.length > 0 ||
    governedApprovals.length > 0 ||
    governedEvents.length > 0;

  // Persistence unbound / no trail yet → honest WAITING_DATA for durable DB history.
  // Session/governed memory can still show local prototype history when present.
  const status: ApprovalAuditTrail['status'] =
    !persistenceBound && !hasAny ? 'WAITING_DATA' : hasAny || persistenceBound ? 'READY' : 'WAITING_DATA';

  let note: string;
  if (!persistenceBound) {
    note = hasAny
      ? 'WAITING_DATA for durable ai_agent_approvals / ai_agent_audit_events — showing in-memory session + governed prototype store only. Persistence client not bound.'
      : 'WAITING_DATA — no approval/audit rows yet and AgentPersistence is not bound to Supabase.';
  } else if (!hasAny) {
    note = 'Persistence bound. No session/governed approval decisions yet — durable rows appear after approve/deny when tables are applied.';
  } else {
    note = 'Approval decisions recorded in session memory and governed audit store; durable writes go through ai_agent_approvals / ai_agent_audit_events when schema is live.';
  }

  return {
    status,
    persistenceBound,
    l4Autonomy: false,
    productionWritesWithoutApproval: false,
    sessionApprovals,
    sessionDecisionEvents,
    governedApprovals,
    governedEvents,
    note,
  };
}

/** Mirror US-AGT-01 approve/deny into the governed in-memory audit store (same tables pattern as runtime approval service). */
export function recordApprovalDecisionAudit(input: {
  actionId: string;
  agentId: string;
  toolId: string;
  decision: 'approve' | 'reject';
  reviewedBy: string;
  reason: string;
  requestedAt?: string;
}): ApprovalRecord {
  const store = getPrototypeAuditStore();
  const decided = input.decision === 'approve' ? 'approved' : 'denied';
  const now = new Date().toISOString();
  const record: ApprovalRecord = {
    actionId: input.actionId,
    requestedAt: input.requestedAt ?? now,
    reviewedAt: now,
    reviewedBy: input.reviewedBy,
    decision: decided,
    reason: input.reason,
  };
  store.recordApproval(record);
  store.record({
    eventId: `evt_approval_${input.actionId}_${Date.now()}`,
    actionId: input.actionId,
    agentId: input.agentId,
    timestamp: now,
    verdict: decided === 'approved' ? 'requires_approval' : 'denied',
    toolId: input.toolId,
    note: input.reason,
    status: decided,
  });
  return record;
}

export function approvalAuditAllowsProductionWrite(_approved: boolean): false {
  // L4 false — human approval never authorizes production mutation in this prototype lane.
  return false;
}
