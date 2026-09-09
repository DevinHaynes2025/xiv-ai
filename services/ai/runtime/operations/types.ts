export type IncidentStatus =
  | 'detected'
  | 'triaged'
  | 'contained'
  | 'investigating'
  | 'recovering'
  | 'resolved'
  | 'postmortem';

export type Incident = {
  incidentId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: IncidentStatus;
  affectedServices: readonly string[];
  affectedTenants: readonly string[];
  region: string | null;
  detectedAt: string;
  containedAt: string | null;
  resolvedAt: string | null;
  signals: readonly string[];
  actions: readonly string[];
  humanOwner: string | null;
  lessons: readonly string[];
};

export type OpsCenterSection =
  | 'platform_health'
  | 'ai_workforce'
  | 'security'
  | 'data_sources'
  | 'integrations'
  | 'live'
  | 'tenant_health'
  | 'regional_health'
  | 'queues'
  | 'incidents';

export type SafeRemediation =
  | 'restart_stateless_worker'
  | 'retry_idempotent_task'
  | 'fail_over_provider'
  | 'open_circuit_breaker'
  | 'pause_failing_agent'
  | 'switch_read_only_model_provider'
  | 'defer_non_critical_workload';

export type ForbiddenRemediation =
  | 'change_rls'
  | 'delete_data'
  | 'deploy_code'
  | 'rotate_secrets'
  | 'change_roles'
  | 'transfer_money'
  | 'send_legal_commitments';
