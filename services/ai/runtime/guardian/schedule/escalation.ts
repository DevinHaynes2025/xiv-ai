import { inspectAgentFailure } from '../../diagnostics/debugger';
import { circuitIsOpen, evaluateCircuitBreaker } from '../../diagnostics/circuit-breaker';
import { agentDebuggerCanDeploy } from '../../diagnostics/debugger';
import { createIncident } from '../../operations/incidents';
import { mayAutoRemediate } from '../../operations/self-heal';
import type { CheckResult, CheckEscalation } from './types';

export function escalateGuardianResult(result: CheckResult): CheckEscalation {
  if (result.status !== 'failed' && result.status !== 'degraded') {
    return {
      resultRunId: result.runId,
      incidentId: null,
      circuitOpened: false,
      humanReviewRequired: true,
    };
  }
  const finding = inspectAgentFailure({
    agentId: 'unknown',
    kind: 'repeated_failure',
    signals: ['invalid_provenance', 'tool_failure', 'loop_detected'],
  });
  const breaker = evaluateCircuitBreaker({
    agentId: finding.agentId,
    signals: ['invalid_provenance', 'tool_failure', 'loop_detected'],
  });
  const incident = createIncident({
    type: 'guardian_scheduled_failure',
    severity: result.status === 'failed' ? 'high' : 'medium',
    status: 'detected',
    affectedServices: ['governed_runtime'],
    affectedTenants: [],
    region: null,
    signals: [result.summary, finding.kind],
    actions: ['recommend_containment', 'request_human_review'],
    humanOwner: null,
    lessons: [],
  });
  return {
    resultRunId: result.runId,
    incidentId: incident.incidentId,
    circuitOpened: circuitIsOpen(breaker),
    humanReviewRequired: true,
  };
}

export function guardianMay(action: string) {
  const allowed = new Set(['create_incident', 'attach_evidence', 'recommend_containment', 'open_circuit_breaker', 'request_human_action']);
  if (allowed.has(action)) {
    return { allowed: true as const, reason: `Guardian may ${action.replaceAll('_', ' ')}.` };
  }
  if (action === 'deploy_code' || action === 'change_rls' || action === 'rotate_credentials' || action === 'delete_data' || action === 'modify_roles' || action === 'disable_security') {
    return { allowed: false as const, reason: `Guardian may not ${action.replaceAll('_', ' ')}.` };
  }
  return mayAutoRemediate(action);
}

export function guardianDebuggerLoopCannotPatch() {
  return {
    canDeploy: agentDebuggerCanDeploy(),
    mutatesCode: false,
    autonomousPatch: false,
  };
}
