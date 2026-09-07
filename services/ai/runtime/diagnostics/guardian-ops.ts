import type { GuardianCheckStatus } from '../guardian/health';
import type { GuardianOpsLayer, OperationalHealthStatus } from './types';

export type GuardianOpsCheck = {
  layer: GuardianOpsLayer;
  status: OperationalHealthStatus;
  classification: 'runtime' | 'security' | 'dependency' | 'data_quality' | 'agent';
  severity: 'info' | 'warning' | 'error' | 'critical' | 'unknown';
  diagnosis: string;
  recommendedRemediation: string;
  requiresApproval: boolean;
  scheduledMonitoring: 'planned';
  productionMonitoring: false;
};

const LAYERS: readonly GuardianOpsLayer[] = [
  'guardian_health',
  'guardian_runtime',
  'guardian_agent_diagnostics',
  'guardian_security_diagnostics',
  'guardian_dependency_diagnostics',
  'guardian_data_quality_diagnostics',
];

export function mapGuardianStatus(status: GuardianCheckStatus | 'not_configured'): OperationalHealthStatus {
  if (status === 'healthy') return 'healthy';
  if (status === 'warning') return 'warning';
  if (status === 'critical') return 'failed';
  if (status === 'denied') return 'failed';
  if (status === 'skipped') return 'unknown';
  if (status === 'not_configured') return 'not_configured';
  return 'unknown';
}

export function guardianOpsLayers(): readonly GuardianOpsCheck[] {
  return LAYERS.map((layer) => ({
    layer,
    status: 'not_configured',
    classification: layer.includes('security')
      ? 'security'
      : layer.includes('dependency')
        ? 'dependency'
        : layer.includes('data_quality')
          ? 'data_quality'
          : layer.includes('agent')
            ? 'agent'
            : 'runtime',
    severity: 'unknown',
    diagnosis: 'Continuous Guardian diagnostics are architected. Production 24/7 monitoring is NOT CONFIGURED.',
    recommendedRemediation: 'Configure scheduled checks. Do not grant Guardian production write or deploy authority.',
    requiresApproval: true,
    scheduledMonitoring: 'planned',
    productionMonitoring: false,
  }));
}

export function guardianIsNotCodeWriter() {
  return {
    mayRewriteProductionCode: false,
    mayDeploy: false,
    mayUnrestrictedShell: false,
    role: 'continuous operational observability architecture',
  };
}
