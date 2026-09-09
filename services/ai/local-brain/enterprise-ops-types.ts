export const ENTERPRISE_OPS_CYCLE = [
  'enterprise_need',
  'department_context',
  'kpi_evidence',
  'workflow_graph',
  'dependency_bottleneck_analysis',
  'agent_council',
  'plan_options',
  'risk_cost_policy_review',
  'human_decision',
  'approved_task_package',
  'authorized_execution',
  'outcome',
  'learning',
] as const;

export type OpsHop = (typeof ENTERPRISE_OPS_CYCLE)[number];

export type OpsEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED';

export type OpsJobState =
  | 'queued'
  | 'running'
  | 'completed'
  | 'denied'
  | 'waiting_data'
  | 'unavailable'
  | 'failed';

export type OpsDepartment =
  | 'supply_chain'
  | 'finance'
  | 'sales'
  | 'procurement'
  | 'it'
  | 'security'
  | 'research'
  | 'customer'
  | 'people'
  | 'executive';

export const OPS_DEPARTMENTS: readonly OpsDepartment[] = [
  'supply_chain',
  'finance',
  'sales',
  'procurement',
  'it',
  'security',
  'research',
  'customer',
  'people',
  'executive',
] as const;

export type ConsequentialAction =
  | 'spend'
  | 'deploy'
  | 'contact_customer'
  | 'change_production'
  | 'change_permissions';

export const CONSEQUENTIAL_ACTIONS: readonly ConsequentialAction[] = [
  'spend',
  'deploy',
  'contact_customer',
  'change_production',
  'change_permissions',
] as const;

export const OPS_HONESTY = Object.freeze({
  l4AutonomyEnabled: false as const,
  agentsPlanRecommendOnly: true as const,
  humansOwnConsequentialDecisions: true as const,
  packageDoesNotAuthorizeExecution: true as const,
  antiCollusionInterEnterprise: true as const,
  ceoSealedCompartmentalized: true as const,
  founderImpersonation: false as const,
  tipLand: false as const,
  inventedPass: false as const,
  autoSpend: false as const,
  autoDeploy: false as const,
  autoCustomerContact: false as const,
  autoProductionChange: false as const,
  guardianRlsWeaken: false as const,
  permissionExpansion: false as const,
  physicalInfraControl: false as const,
  unconfiguredProvidersUnavailable: true as const,
  productionDatabaseWrite: false as const,
  migrationsApplied: false as const,
});

export type OpsHopRecord = {
  hop: OpsHop;
  state: OpsEvidenceState;
  summary: string;
  at: string;
};

export class OpsSimulatedCrash extends Error {
  constructor(public readonly hop: OpsHop) {
    super(`OPS_SIMULATED_CRASH:${hop}`);
    this.name = 'OpsSimulatedCrash';
  }
}

export const HANDOFF_NOT_EXECUTION_AUTHORITY = 'HANDOFF_PACKAGE_IS_NOT_EXECUTION_AUTHORITY';
export const ANTI_COLLUSION_DENY = 'ANTI_COLLUSION_INTER_ENTERPRISE_DENIED';
export const HUMAN_GATE_BLOCKS_CONSEQUENTIAL = 'HUMAN_GATE_BLOCKS_CONSEQUENTIAL_ACTION';
export const AGENT_MAY_NOT_SELF_GRANT = 'AGENT_MAY_NOT_SELF_GRANT_DECISION_RIGHTS';
