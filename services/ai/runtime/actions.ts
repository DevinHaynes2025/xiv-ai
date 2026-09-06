import type { AuthorityLevel } from './authority';
import type { DiagnosticStory } from './context/types';
import type { PolicyVerdict } from './policy';
import type { ToolRiskLevel } from './tools';

export type GovernedActionStatus =
  | 'proposed'
  | 'awaiting_approval'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'cancelled'
  | 'running'
  | 'completed'
  | 'failed';

export type GovernedApprovalStatus = 'not_required' | 'pending' | 'approved' | 'denied' | 'expired' | 'cancelled';

export type ApprovalDecision = 'approved' | 'denied' | 'expired' | 'cancelled';

export type ApprovalRecord = {
  actionId: string;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  decision: ApprovalDecision | 'pending';
  reason: string;
};

export type GovernedAction = {
  actionId: string;
  agentId: string;
  timestamp: string;
  authorityLevel: AuthorityLevel;
  intent: string;
  toolId: string;
  riskLevel: ToolRiskLevel;
  status: GovernedActionStatus;
  approvalStatus: GovernedApprovalStatus;
  reason: string;
  inputSummary: string;
  outputSummary: string;
  error: string | null;
  durationMs: number;
  approval?: ApprovalRecord;
};

export type GovernedAuditEvent = {
  eventId: string;
  actionId: string;
  agentId: string;
  timestamp: string;
  verdict: PolicyVerdict | 'recorded';
  toolId: string;
  note: string;
  status?: GovernedActionStatus;
};

export type GovernedResult = {
  ok: boolean;
  prototype: true;
  verdict: PolicyVerdict;
  action: GovernedAction;
  output: Record<string, unknown> | null;
  story: DiagnosticStory | null;
  recommendedActions: string[];
};

export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function statusForVerdict(verdict: PolicyVerdict): {
  status: GovernedActionStatus;
  approvalStatus: GovernedApprovalStatus;
} {
  if (verdict === 'denied') return { status: 'denied', approvalStatus: 'denied' };
  if (verdict === 'requires_approval') return { status: 'awaiting_approval', approvalStatus: 'pending' };
  return { status: 'completed', approvalStatus: 'not_required' };
}
