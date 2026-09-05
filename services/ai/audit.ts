import type { AgentIntentKind, AgentRiskLevel, AgentToolId, AgentType } from './types';

export type AuditEvent = {
  kind: AgentIntentKind;
  agentType: AgentType;
  userId?: string;
  toolId?: AgentToolId;
  actionId?: string;
  riskLevel?: AgentRiskLevel;
  note?: string;
};

export function logAudit(event: AuditEvent) {
  console.info('[xiv-ai-audit]', {
    kind: event.kind,
    agentType: event.agentType,
    toolId: event.toolId,
    actionId: event.actionId,
    riskLevel: event.riskLevel,
    note: event.note,
  });
}
