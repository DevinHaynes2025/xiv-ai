import type { AuthorityLevel } from '../authority';
import type { DataClassification } from '../universe/types';

export type SecurityDecisionVerdict =
  | 'allow'
  | 'deny'
  | 'require_approval'
  | 'require_step_up_auth'
  | 'require_review';

export type SecurityDecisionInput = {
  identity?: string | null;
  sessionTrusted?: boolean;
  deviceTrusted?: boolean;
  tenantAuthorized?: boolean;
  agentId?: string | null;
  toolId?: string | null;
  classification?: DataClassification;
  action?: 'read' | 'write' | 'handoff' | 'broadcast';
  resource?: string | null;
  riskSignals?: readonly string[];
  authorityLevel?: AuthorityLevel;
};

export type SecurityDecision = {
  verdict: SecurityDecisionVerdict;
  reason: string;
  stepUpImplemented: false;
};

export function evaluateSecurityDecision(input: SecurityDecisionInput): SecurityDecision {
  if (!input.identity) {
    return { verdict: 'deny', reason: 'Unauthenticated security decision: DENY', stepUpImplemented: false };
  }
  if (input.action === 'write') {
    return { verdict: 'require_approval', reason: 'Writes require approval. L4 is disabled.', stepUpImplemented: false };
  }
  if (input.classification === 'restricted') {
    return { verdict: 'require_review', reason: 'Restricted data requires review.', stepUpImplemented: false };
  }
  if (input.tenantAuthorized === false) {
    return { verdict: 'deny', reason: 'Tenant boundary failed: DENY', stepUpImplemented: false };
  }
  if (input.deviceTrusted === false || input.sessionTrusted === false) {
    return {
      verdict: 'require_step_up_auth',
      reason: 'Step-up authentication is PLANNED. This interface does not perform it.',
      stepUpImplemented: false,
    };
  }
  if (input.riskSignals && input.riskSignals.length > 0) {
    return { verdict: 'require_review', reason: 'Risk signals require review.', stepUpImplemented: false };
  }
  return { verdict: 'allow', reason: 'Security decision allowed at current prototype maturity.', stepUpImplemented: false };
}
