import type { ForbiddenRemediation, SafeRemediation } from './types';

const SAFE: readonly SafeRemediation[] = [
  'restart_stateless_worker',
  'retry_idempotent_task',
  'fail_over_provider',
  'open_circuit_breaker',
  'pause_failing_agent',
  'switch_read_only_model_provider',
  'defer_non_critical_workload',
];

const FORBIDDEN: readonly ForbiddenRemediation[] = [
  'change_rls',
  'delete_data',
  'deploy_code',
  'rotate_secrets',
  'change_roles',
  'transfer_money',
  'send_legal_commitments',
];

export function mayAutoRemediate(action: string) {
  if ((FORBIDDEN as readonly string[]).includes(action)) {
    return { allowed: false as const, reason: `Automated remediation may not ${action.replaceAll('_', ' ')}.` };
  }
  if ((SAFE as readonly string[]).includes(action)) {
    return { allowed: true as const, reason: 'Reversible low-risk remediation may be automated later. Not enabled in production.' };
  }
  return { allowed: false as const, reason: 'Unknown remediation is denied.' };
}

export function autonomousDeployEnabled() {
  return false;
}
