import { createId, nowIso, type ApprovalDecision, type ApprovalRecord, type GovernedAction, type GovernedResult } from './actions';
import type { AuditStore } from './audit';
import { evaluatePolicy, type RuntimeEnvironment } from './policy';
import { getRuntimeTool } from './tools';

export type ApprovalDecisionInput = {
  actionId: string;
  decision: Exclude<ApprovalDecision, 'expired' | 'cancelled'>;
  reviewedBy: string;
  reason?: string;
};

export type ApprovalService = {
  open(action: GovernedAction): ApprovalRecord;
  decide(input: ApprovalDecisionInput): GovernedResult;
  expire(actionId: string): GovernedResult;
  cancel(actionId: string): GovernedResult;
  attemptExecution(actionId: string, environment?: RuntimeEnvironment): GovernedResult;
};

function blocked(action: GovernedAction, reason: string): GovernedResult {
  return {
    ok: false,
    prototype: true,
    verdict: 'denied',
    action: { ...action, reason, error: reason },
    output: null,
    story: null,
    healthReport: null,
    recommendedActions: ['This action cannot run. Human approval never bypasses policy.'],
  };
}

function stamp(
  store: AuditStore,
  action: GovernedAction,
  note: string,
  verdict: GovernedResult['verdict'],
) {
  store.recordAction(action);
  if (action.approval) store.recordApproval(action.approval);
  store.record({
    eventId: createId('evt'),
    actionId: action.actionId,
    agentId: action.agentId,
    timestamp: nowIso(),
    verdict,
    toolId: action.toolId,
    note,
    status: action.status,
  });
}

export function createApprovalService(store: AuditStore): ApprovalService {
  const close = (actionId: string, decision: ApprovalDecision, reviewedBy: string | null, reason: string): GovernedResult => {
    const action = store.getAction(actionId);
    if (!action) {
      return blocked(
        {
          actionId,
          agentId: 'unknown',
          timestamp: nowIso(),
          authorityLevel: 'L0',
          intent: '',
          toolId: '',
          riskLevel: 'high',
          status: 'failed',
          approvalStatus: 'denied',
          reason: 'Unknown action.',
          inputSummary: '',
          outputSummary: '',
          error: 'Unknown action.',
          durationMs: 0,
        },
        'Unknown action cannot be reviewed.',
      );
    }

    if (action.approvalStatus !== 'pending' || action.status !== 'awaiting_approval') {
      return blocked(action, 'Only awaiting_approval actions can be reviewed.');
    }

    const approval: ApprovalRecord = {
      actionId,
      requestedAt: action.approval?.requestedAt ?? action.timestamp,
      reviewedAt: nowIso(),
      reviewedBy,
      decision,
      reason,
    };

    const next: GovernedAction = {
      ...action,
      status: decision,
      approvalStatus: decision,
      approval,
      reason,
      outputSummary: reason,
    };
    stamp(store, next, reason, decision === 'approved' ? 'requires_approval' : 'denied');
    return {
      ok: false,
      prototype: true,
      verdict: decision === 'approved' ? 'requires_approval' : 'denied',
      action: next,
      output: null,
      story: null,
      healthReport: null,
      recommendedActions:
        decision === 'approved'
          ? ['Approval is recorded. Policy must be re-evaluated before any execution attempt.']
          : ['Denied, expired, or cancelled actions cannot run.'],
    };
  };

  return {
    open(action) {
      const tool = getRuntimeTool(action.toolId);
      if (!tool?.requiresApproval) {
        throw new Error('Only tools that require approval can enter awaiting_approval.');
      }
      const record: ApprovalRecord = {
        actionId: action.actionId,
        requestedAt: action.timestamp,
        reviewedAt: null,
        reviewedBy: null,
        decision: 'pending',
        reason: action.reason,
      };
      store.recordApproval(record);
      return record;
    },

    decide(input) {
      return close(
        input.actionId,
        input.decision,
        input.reviewedBy,
        input.reason ?? (input.decision === 'approved' ? 'Human approved this prototype proposal.' : 'Human denied this prototype proposal.'),
      );
    },

    expire(actionId) {
      return close(actionId, 'expired', null, 'Approval expired before review.');
    },

    cancel(actionId) {
      return close(actionId, 'cancelled', null, 'Approval was cancelled.');
    },

    attemptExecution(actionId, environment = 'prototype') {
      const action = store.getAction(actionId);
      if (!action) return blocked({} as GovernedAction, 'Unknown action cannot run.');

      if (action.approvalStatus === 'denied' || action.status === 'denied') {
        return blocked(action, 'Denied actions cannot run.');
      }
      if (action.approvalStatus === 'expired' || action.status === 'expired') {
        return blocked(action, 'Expired approvals cannot run.');
      }
      if (action.approvalStatus === 'cancelled' || action.status === 'cancelled') {
        return blocked(action, 'Cancelled actions cannot run.');
      }
      if (action.approvalStatus !== 'approved') {
        return blocked(action, 'Execution requires a recorded human approval, then a policy re-check.');
      }

      const decision = evaluatePolicy({
        agentId: action.agentId,
        toolId: action.toolId,
        environment,
        approved: true,
      });

      const next: GovernedAction = {
        ...action,
        status: 'failed',
        reason: decision.reason,
        error: decision.reason,
        outputSummary: 'Prototype approval was recorded. No production change was executed.',
      };
      stamp(store, next, decision.reason, decision.verdict);
      return {
        ok: false,
        prototype: true,
        verdict: decision.verdict,
        action: next,
        output: { executed: false, policyReevaluated: true },
        story: null,
        healthReport: null,
        recommendedActions: ['Human approval does not override policy. Consequential writes remain blocked.'],
      };
    },
  };
}
