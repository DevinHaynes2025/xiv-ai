export type ContinuousAuthSignal =
  | 'session_age'
  | 'device_risk'
  | 'location_change'
  | 'tenant_change'
  | 'classification_increase'
  | 'unusual_tool'
  | 'sensitive_operation'
  | 'failed_policies'
  | 'agent_behavior';

export type ContinuousAuthDecision = 'allow' | 'step_up' | 'deny' | 'expire';

export function evaluateContinuousAuthorization(input: {
  authenticated: boolean;
  authorized: boolean;
  signals: readonly ContinuousAuthSignal[];
}) {
  if (!input.authenticated) {
    return { decision: 'deny' as ContinuousAuthDecision, stepUpImplemented: false, reason: 'Not authenticated.' };
  }
  if (!input.authorized) {
    return { decision: 'deny' as ContinuousAuthDecision, stepUpImplemented: false, reason: 'Not authorized.' };
  }
  if (input.signals.includes('failed_policies') || input.signals.includes('sensitive_operation')) {
    return {
      decision: 'step_up' as ContinuousAuthDecision,
      stepUpImplemented: false,
      reason: 'Risk changed. Step-up authentication is PLANNED, not implemented.',
    };
  }
  return {
    decision: 'allow' as ContinuousAuthDecision,
    stepUpImplemented: false,
    reason: 'Session remains within the current authorization window. Re-evaluation is architectural.',
  };
}
