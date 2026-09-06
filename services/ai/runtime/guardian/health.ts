import type { GuardianCheckId } from './checks';

export type GuardianOverallStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export type GuardianCheckStatus = 'healthy' | 'warning' | 'critical' | 'unknown' | 'skipped';

export type GuardianCheckResult = {
  id: GuardianCheckId;
  status: GuardianCheckStatus;
  message: string;
  durationMs: number;
  timestamp: string;
};

export type GuardianHealthReport = {
  overallStatus: GuardianOverallStatus;
  prototype: true;
  continuousMonitoring: false;
  generatedAt: string;
  checks: GuardianCheckResult[];
  summary: string;
  recommendedActions: string[];
};

export function rollupOverall(checks: readonly GuardianCheckResult[]): GuardianOverallStatus {
  if (checks.some((check) => check.status === 'critical')) return 'critical';
  if (checks.some((check) => check.status === 'warning')) return 'warning';
  if (checks.some((check) => check.status === 'healthy') && checks.every((check) => check.status === 'healthy' || check.status === 'skipped')) {
    return 'healthy';
  }
  return 'unknown';
}

export function summarizeReport(overall: GuardianOverallStatus, checks: readonly GuardianCheckResult[]) {
  const executed = checks.filter((check) => check.status !== 'skipped' && check.status !== 'unknown').length;
  if (overall === 'unknown') {
    return `Guardian snapshot is prototype-only. ${executed} check(s) produced a concrete result. Guardian is not continuously monitoring.`;
  }
  return `Guardian snapshot overall status is ${overall}. ${checks.length} registered checks were evaluated. Recommendations must not auto-modify production.`;
}
