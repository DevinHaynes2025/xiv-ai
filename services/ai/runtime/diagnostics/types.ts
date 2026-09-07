import type { XivAgentId } from '../agents';

export type OperationalHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'warning'
  | 'failed'
  | 'unknown'
  | 'not_configured';

export type GuardianOpsLayer =
  | 'guardian_health'
  | 'guardian_runtime'
  | 'guardian_agent_diagnostics'
  | 'guardian_security_diagnostics'
  | 'guardian_dependency_diagnostics'
  | 'guardian_data_quality_diagnostics';

export type HealthDimension =
  | 'availability'
  | 'policy_compliance'
  | 'grounding'
  | 'provenance'
  | 'latency'
  | 'tool_reliability'
  | 'handoff_reliability'
  | 'outcome_quality'
  | 'cost_efficiency';

export type MeasuredScore = number | 'not_measured';

export type AgentHealthScore = {
  agentId: XivAgentId | 'unknown';
  dimensions: Record<HealthDimension, MeasuredScore>;
  evidenceCount: number;
  invented: false;
};

export type CircuitBreakerState = 'closed' | 'warning' | 'open' | 'half_open';

export type CircuitSignal =
  | 'policy_violation'
  | 'timeout'
  | 'invalid_provenance'
  | 'tool_failure'
  | 'loop_detected'
  | 'unexpected_cost'
  | 'tenant_mismatch'
  | 'security_denial'
  | 'malformed_output';

export type CircuitBreakerRecord = {
  agentId: XivAgentId | 'unknown';
  state: CircuitBreakerState;
  signals: readonly CircuitSignal[];
  reason: string;
  acceptsWork: boolean;
  reenableRequiresPolicy: true;
};

export type DebuggerFindingKind =
  | 'agent_failure'
  | 'bad_handoff'
  | 'tool_misuse'
  | 'stale_evidence'
  | 'hallucination_risk'
  | 'authorization_failure'
  | 'repeated_failure'
  | 'excessive_latency'
  | 'excessive_cost'
  | 'loop'
  | 'unsupported_claim';

export type DebuggerAction = 'inspect' | 'classify' | 'recommend' | 'isolate' | 'request_human_review';

export type DebuggerProhibited =
  | 'rewrite_production_code'
  | 'deploy'
  | 'modify_rls'
  | 'rotate_credentials'
  | 'disable_security_controls'
  | 'unrestricted_shell';
